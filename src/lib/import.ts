import { db, newId, type Track } from "./db";

const AUDIO_EXT = /\.(mp3|m4a|aac|mp4|flac|ogg|oga|opus|wav|webm|weba)$/i;

export const ACCEPT = "audio/*,.mp3,.m4a,.aac,.flac,.ogg,.opus,.wav,.webm";

export function isAudioFile(f: File) {
  return f.type.startsWith("audio/") || AUDIO_EXT.test(f.name);
}

export interface ImportResult {
  added: number;
  skipped: number;
  failed: string[];
}

/** "Artist - Title.mp3" → { artist, title } ; otherwise title only. */
export function parseFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const m = base.match(/^(.+?)\s+-\s+(.+)$/);
  if (m) return { artist: m[1].trim(), title: m[2].replace(/^\d+\s*[-.]\s*/, "").trim() };
  return { artist: "", title: base.replace(/^\d+\s*[-.]\s*/, "") || name };
}

function probeDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      a.removeAttribute("src");
      resolve(d);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => done(0);
    setTimeout(() => done(0), 8000);
    a.src = url;
  });
}

async function sha1(data: Uint8Array) {
  const hash = await crypto.subtle.digest("SHA-1", data as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Average colour of an image, nudged towards the more saturated pixels. Returns "r g b". */
export async function dominantColor(blob: Blob): Promise<string | undefined> {
  try {
    const bmp = await createImageBitmap(blob, { resizeWidth: 24, resizeHeight: 24 });
    const canvas = new OffscreenCanvas(24, 24);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bmp, 0, 0);
    const { data } = ctx.getImageData(0, 0, 24, 24);
    let r = 0, g = 0, b = 0, w = 0;
    for (let i = 0; i < data.length; i += 4) {
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      const weight = 1 + (max - min) / 32; // favour colourful pixels
      r += data[i] * weight;
      g += data[i + 1] * weight;
      b += data[i + 2] * weight;
      w += weight;
    }
    return `${Math.round(r / w)} ${Math.round(g / w)} ${Math.round(b / w)}`;
  } catch {
    return undefined;
  }
}

async function importOne(file: File, mm: typeof import("music-metadata")): Promise<"added" | "skipped"> {
  const dup = await db.tracks.where("[fileName+size]").equals([file.name, file.size]).first();
  if (dup) return "skipped";

  const fromName = parseFileName(file.name);
  let common: Awaited<ReturnType<typeof mm.parseBlob>>["common"] | undefined;
  let duration = 0;
  try {
    const meta = await mm.parseBlob(file, { skipPostHeaders: true });
    common = meta.common;
    duration = meta.format.duration ?? 0;
  } catch {
    // Unreadable tags — fall back to the filename.
  }
  if (!duration) duration = await probeDuration(file);
  if (!duration && !common) throw new Error("Unsupported or corrupt file");

  let coverId: string | undefined;
  const pic = mm.selectCover(common?.picture);
  if (pic?.data?.length) {
    coverId = await sha1(pic.data);
    if (!(await db.covers.get(coverId))) {
      const blob = new Blob([pic.data as Uint8Array<ArrayBuffer>], { type: pic.format || "image/jpeg" });
      await db.covers.put({ id: coverId, blob, color: await dominantColor(blob) });
    }
  }

  const artist = common?.artist || common?.albumartist || fromName.artist || "Unknown Artist";
  const track: Track = {
    id: newId(),
    title: common?.title || fromName.title,
    artist,
    album: common?.album || "Unknown Album",
    albumArtist: common?.albumartist || artist,
    year: common?.year,
    genre: common?.genre?.[0],
    trackNo: common?.track?.no ?? undefined,
    discNo: common?.disk?.no ?? undefined,
    duration,
    coverId,
    fileName: file.name,
    size: file.size,
    mime: file.type || "audio/mpeg",
    addedAt: Date.now(),
    playCount: 0,
    liked: 0,
  };
  await db.transaction("rw", [db.tracks, db.files], async () => {
    await db.files.add({ id: track.id, blob: file });
    await db.tracks.add(track);
  });
  return "added";
}

export async function importFiles(
  input: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const files = input.filter(isAudioFile);
  const result: ImportResult = { added: 0, skipped: input.length - files.length, failed: [] };
  if (!files.length) return result;

  // Ask the browser not to evict the library under storage pressure.
  navigator.storage?.persist?.().catch(() => {});

  // Loaded lazily so it doesn't weigh down the initial page load.
  const mm = await import("music-metadata");
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const file = files[next++];
      try {
        const r = await importOne(file, mm);
        result[r]++;
      } catch (err) {
        console.warn("Import failed", file.name, err);
        result.failed.push(file.name);
      }
      onProgress?.(++done, files.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, files.length) }, worker));
  return result;
}

/** Walk a dropped DataTransfer, including folders. */
export async function filesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items)
    .map((i) => i.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  if (!entries.length) return Array.from(dt.files);

  const out: File[] = [];
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      out.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)));
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        for (const e of batch) await walk(e);
      } while (batch.length);
    }
  };
  for (const e of entries) await walk(e);
  return out;
}
