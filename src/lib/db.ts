import Dexie, { type EntityTable } from "dexie";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  year?: number;
  genre?: string;
  trackNo?: number;
  discNo?: number;
  duration: number;
  coverId?: string;
  fileName: string;
  size: number;
  mime: string;
  addedAt: number;
  lastPlayedAt?: number;
  playCount: number;
  /** 0 | 1 so it can be indexed */
  liked: number;
}

export interface TrackFile {
  id: string;
  blob: Blob;
}

export interface Cover {
  id: string;
  blob: Blob;
  /** Dominant colour as "r g b" */
  color?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export const db = new Dexie("musicsite") as Dexie & {
  tracks: EntityTable<Track, "id">;
  files: EntityTable<TrackFile, "id">;
  covers: EntityTable<Cover, "id">;
  playlists: EntityTable<Playlist, "id">;
};

db.version(1).stores({
  tracks: "id, title, artist, album, addedAt, lastPlayedAt, liked, [fileName+size]",
  files: "id",
  covers: "id",
  playlists: "id, updatedAt",
});

export const newId = () => crypto.randomUUID();

export async function toggleLike(id: string) {
  const t = await db.tracks.get(id);
  if (t) await db.tracks.update(id, { liked: t.liked ? 0 : 1 });
}

export async function createPlaylist(name: string, trackIds: string[] = []) {
  const now = Date.now();
  const id = newId();
  await db.playlists.add({ id, name: name.trim() || "New playlist", trackIds, createdAt: now, updatedAt: now });
  return id;
}

export async function addToPlaylist(playlistId: string, trackIds: string[]) {
  await db.playlists
    .where("id")
    .equals(playlistId)
    .modify((p) => {
      const existing = new Set(p.trackIds);
      p.trackIds.push(...trackIds.filter((id) => !existing.has(id)));
      p.updatedAt = Date.now();
    });
}

export async function removeFromPlaylist(playlistId: string, index: number) {
  await db.playlists
    .where("id")
    .equals(playlistId)
    .modify((p) => {
      p.trackIds.splice(index, 1);
      p.updatedAt = Date.now();
    });
}

/** Deletes tracks, their audio, any covers no longer referenced, and playlist entries. */
export async function deleteTracks(ids: string[]) {
  const gone = new Set(ids);
  await db.transaction("rw", [db.tracks, db.files, db.covers, db.playlists], async () => {
    const tracks = await db.tracks.bulkGet(ids);
    await db.tracks.bulkDelete(ids);
    await db.files.bulkDelete(ids);
    const coverIds = new Set(tracks.map((t) => t?.coverId).filter((c): c is string => !!c));
    for (const coverId of coverIds) {
      const stillUsed = await db.tracks.filter((t) => t.coverId === coverId).count();
      if (!stillUsed) await db.covers.delete(coverId);
    }
    await db.playlists.toCollection().modify((p) => {
      if (p.trackIds.some((id) => gone.has(id))) {
        p.trackIds = p.trackIds.filter((id) => !gone.has(id));
        p.updatedAt = Date.now();
      }
    });
  });
}

export async function clearLibrary() {
  await db.transaction("rw", [db.tracks, db.files, db.covers, db.playlists], async () => {
    await Promise.all([db.tracks.clear(), db.files.clear(), db.covers.clear(), db.playlists.clear()]);
  });
}
