import { toast } from "sonner";
import { db, type Track } from "../lib/db";
import { loadCover } from "../lib/covers";
import { currentTrackId, usePlayer, useProgress } from "../store/player";

/**
 * The one and only <audio> element. Lives outside React so playback never
 * stops on navigation or re-render. React talks to it only via the store.
 */
export const audio = new Audio();
audio.preload = "auto";

let targetId: string | undefined; // track we are loading / have loaded
let objectUrl: string | undefined;
let loadSeq = 0;
let lastToken = -1;
let countedFor: string | undefined;
let consecutiveErrors = 0;
let currentTrack: Track | undefined;

const ms = typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : undefined;

function playSafe() {
  audio.play().catch((err: DOMException) => {
    if (err.name === "NotAllowedError") usePlayer.getState().setPlaying(false);
    // AbortError: superseded by a newer load. NotSupportedError: reported by the "error" handler.
    else if (err.name !== "AbortError" && err.name !== "NotSupportedError") console.error(err);
  });
}

export function seek(time: number) {
  if (!Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.min(Math.max(time, 0), audio.duration);
  useProgress.setState({ currentTime: audio.currentTime });
}

export const seekBy = (delta: number) => seek(audio.currentTime + delta);

function unload() {
  loadSeq++;
  targetId = undefined;
  currentTrack = undefined;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = undefined;
  useProgress.setState({ currentTime: 0, duration: 0, buffering: false });
  if (ms) {
    ms.metadata = null;
    ms.playbackState = "none";
  }
  document.title = "Musicsite";
}

/** Start playback; a source that already failed can't just be play()ed again, so reload it (re-running error handling). */
function resume(id: string, startAt: number) {
  if (audio.error) load(id, startAt);
  else playSafe();
}

async function load(id: string, startAt: number) {
  const seq = ++loadSeq;
  targetId = id;
  const [file, track] = await Promise.all([db.files.get(id), db.tracks.get(id)]);
  if (seq !== loadSeq) return; // a newer load superseded this one
  if (!file || !track) {
    toast.error("That song is no longer in your library");
    usePlayer.getState().removeTracks([id]);
    return;
  }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file.blob);
  currentTrack = track;
  useProgress.setState({ currentTime: startAt, duration: track.duration });
  audio.src = objectUrl;
  if (startAt > 0) {
    // Ignore if a newer load has replaced this one before its metadata arrived.
    audio.addEventListener("loadedmetadata", () => seq === loadSeq && (audio.currentTime = startAt), { once: true });
  }
  updateMediaSession(track);
  if (usePlayer.getState().isPlaying) playSafe();
}

async function updateMediaSession(track: Track) {
  document.title = `${track.title} · ${track.artist}`;
  if (!ms) return;
  const artwork: MediaImage[] = [];
  if (track.coverId) {
    const { url } = await loadCover(track.coverId);
    if (url) artwork.push({ src: url, sizes: "512x512" });
  }
  if (currentTrack?.id !== track.id) return;
  ms.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: track.album, artwork });
}

function updatePositionState() {
  if (!ms?.setPositionState || !Number.isFinite(audio.duration)) return;
  try {
    ms.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate });
  } catch {
    /* ignore out-of-range during track switches */
  }
}

type State = ReturnType<typeof usePlayer.getState>;

/**
 * Reacts only to *changes* in the store. Unrelated updates (e.g. saving the
 * position) must never start playback — otherwise a track that just ended
 * would be restarted before the "ended" handler advances the queue.
 */
function sync(s: State, prev?: State) {
  const id = currentTrackId(s);
  audio.volume = s.volume;
  audio.muted = s.muted;

  if (!id) {
    if (targetId) unload();
    return;
  }

  const tokenChanged = s.restartToken !== lastToken;
  lastToken = s.restartToken;

  if (id !== targetId) {
    // The saved position belongs only to the track restored on startup (no `prev`);
    // any later switch (deletions, queue edits) starts the new track from 0.
    load(id, prev ? 0 : s.resumeAt);
    return;
  }
  if (currentTrack?.id !== id) return; // still loading; load() starts playback if needed

  if (tokenChanged) {
    // Restart the same track (repeat-one, "previous" after 3s, replaying the same song).
    audio.currentTime = s.resumeAt || 0;
    useProgress.setState({ currentTime: audio.currentTime });
    if (s.isPlaying && audio.paused) resume(id, s.resumeAt || 0);
    else if (!s.isPlaying && !audio.paused) audio.pause();
    return;
  }
  if (prev && s.isPlaying !== prev.isPlaying) {
    if (s.isPlaying && audio.paused) resume(id, 0);
    else if (!s.isPlaying && !audio.paused) audio.pause();
  }
}

let saveTimer = 0;
function savePosition() {
  if (isSettled()) usePlayer.setState({ resumeAt: audio.currentTime });
}

/** False while a new track is being fetched and the old one is still in the element. */
const isSettled = () => !!currentTrack && currentTrack.id === targetId;

export function initEngine() {
  lastToken = usePlayer.getState().restartToken;
  // Never auto-start on page load (browsers block it anyway).
  usePlayer.setState({ isPlaying: false });
  usePlayer.subscribe(sync);
  sync(usePlayer.getState());

  audio.addEventListener("play", () => {
    if (!usePlayer.getState().isPlaying) usePlayer.getState().setPlaying(true);
    if (currentTrack && countedFor !== currentTrack.id + lastToken) {
      countedFor = currentTrack.id + lastToken;
      db.tracks
        .where("id")
        .equals(currentTrack.id)
        .modify((t) => {
          t.playCount = (t.playCount ?? 0) + 1;
          t.lastPlayedAt = Date.now();
        });
    }
    if (ms) ms.playbackState = "playing";
  });
  audio.addEventListener("pause", () => {
    // Switching src can fire a late "pause" after play() was already called for the new track;
    // only treat it as a real pause if the element is still paused.
    if (audio.paused && !audio.ended && usePlayer.getState().isPlaying) usePlayer.getState().setPlaying(false);
    if (ms) ms.playbackState = "paused";
    if (!audio.ended) savePosition();
  });
  audio.addEventListener("ended", () => isSettled() && usePlayer.getState().next(true));
  audio.addEventListener("timeupdate", () => {
    if (!isSettled()) return;
    useProgress.setState({ currentTime: audio.currentTime });
    const now = Date.now();
    if (now - saveTimer > 10_000) {
      saveTimer = now;
      savePosition();
    }
  });
  audio.addEventListener("durationchange", () => {
    if (Number.isFinite(audio.duration)) useProgress.setState({ duration: audio.duration });
    updatePositionState();
  });
  audio.addEventListener("seeked", updatePositionState);
  audio.addEventListener("waiting", () => useProgress.setState({ buffering: true }));
  audio.addEventListener("playing", () => {
    consecutiveErrors = 0;
    useProgress.setState({ buffering: false });
    updatePositionState();
  });
  audio.addEventListener("error", () => {
    if (!audio.getAttribute("src") || !isSettled()) return;
    const s = usePlayer.getState();
    // Not playing (e.g. the song restored on startup): stay quiet. Pressing play reloads it
    // via resume(), and the error is reported then.
    if (!s.isPlaying) return;
    const name = currentTrack?.title ?? "this song";
    consecutiveErrors++;
    if (consecutiveErrors >= Math.max(s.queue.length, 1)) {
      toast.error("None of the songs in the queue could be played", { id: "play-error" });
      s.setPlaying(false);
      consecutiveErrors = 0;
      return;
    }
    toast.error(`Couldn't play “${name}”. Your browser may not support this format.`, { id: "play-error" });
    s.next();
  });

  window.addEventListener("pagehide", savePosition);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && savePosition());

  if (ms) {
    const p = () => usePlayer.getState();
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => p().setPlaying(true)],
      ["pause", () => p().setPlaying(false)],
      ["previoustrack", () => p().prev(audio.currentTime)],
      ["nexttrack", () => p().next()],
      ["seekbackward", (d) => seekBy(-(d.seekOffset ?? 10))],
      ["seekforward", (d) => seekBy(d.seekOffset ?? 10)],
      ["seekto", (d) => d.seekTime != null && seek(d.seekTime)],
    ];
    for (const [action, fn] of handlers) {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        /* unsupported action */
      }
    }
  }
}
