import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as Q from "../lib/queue";

interface PlayerState extends Q.QueueState {
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  repeat: Q.RepeatMode;
  /** Bumped to make the engine restart the current track (repeat-one, "previous" after 3s). */
  restartToken: number;
  /** Saved position, used to resume after a reload. */
  resumeAt: number;
  queueOpen: boolean;
  nowPlayingOpen: boolean;

  playTracks: (trackIds: string[], startIndex?: number, opts?: { shuffle?: boolean }) => void;
  playNext: (trackIds: string[]) => void;
  addToQueue: (trackIds: string[]) => void;
  removeFromQueue: (key: string) => void;
  removeTracks: (trackIds: string[]) => void;
  moveInQueue: (from: number, to: number) => void;
  jumpTo: (index: number) => void;
  clearUpcoming: () => void;
  toggle: () => void;
  setPlaying: (playing: boolean) => void;
  next: (auto?: boolean) => void;
  prev: (currentTime: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setQueueOpen: (open: boolean) => void;
  setNowPlayingOpen: (open: boolean) => void;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      original: [],
      index: 0,
      shuffle: false,
      isPlaying: false,
      volume: 0.8,
      muted: false,
      repeat: "off",
      restartToken: 0,
      resumeAt: 0,
      queueOpen: false,
      nowPlayingOpen: false,

      playTracks: (trackIds, startIndex = 0, opts) => {
        if (!trackIds.length) return;
        const shuffle = opts?.shuffle ?? get().shuffle;
        const q = Q.startQueue(trackIds, opts?.shuffle ? Math.floor(Math.random() * trackIds.length) : startIndex, shuffle);
        set((s) => ({ ...q, isPlaying: true, resumeAt: 0, restartToken: s.restartToken + 1 }));
      },
      playNext: (ids) => set((s) => Q.playNext(s, ids)),
      addToQueue: (ids) => set((s) => Q.addToQueue(s, ids)),
      removeFromQueue: (key) => set((s) => Q.removeFromQueue(s, key)),
      removeTracks: (ids) =>
        set((s) => {
          const r = Q.removeTracks(s, new Set(ids));
          return r.queue.length ? r : { ...r, isPlaying: false };
        }),
      moveInQueue: (from, to) => set((s) => Q.moveInQueue(s, from, to)),
      jumpTo: (index) => set((s) => ({ index, isPlaying: true, resumeAt: 0, restartToken: s.restartToken + 1 })),
      clearUpcoming: () =>
        set((s) => {
          const current = s.queue[s.index];
          return current ? { queue: [current], original: [current], index: 0 } : {};
        }),
      toggle: () => set((s) => ({ isPlaying: s.queue.length ? !s.isPlaying : false })),
      setPlaying: (isPlaying) => set({ isPlaying }),
      next: (auto = false) =>
        set((s) => {
          const r = Q.nextIndex(s.queue.length, s.index, s.repeat, auto);
          if (r.stop) return { isPlaying: false, resumeAt: 0, restartToken: s.restartToken + 1 };
          return { index: r.index, isPlaying: true, resumeAt: 0, restartToken: s.restartToken + 1 };
        }),
      prev: (currentTime) =>
        set((s) => {
          if (currentTime > 3 || (s.index === 0 && s.repeat === "off"))
            return { resumeAt: 0, restartToken: s.restartToken + 1 };
          return { index: Q.prevIndex(s.queue.length, s.index, s.repeat), resumeAt: 0, restartToken: s.restartToken + 1 };
        }),
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)), muted: false }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleShuffle: () => set((s) => Q.setShuffle(s, !s.shuffle)),
      cycleRepeat: () => set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
      setQueueOpen: (queueOpen) => set({ queueOpen }),
      setNowPlayingOpen: (nowPlayingOpen) => set({ nowPlayingOpen }),
    }),
    {
      name: "musicsite-player",
      version: 1,
      partialize: (s) => ({
        queue: s.queue,
        original: s.original,
        index: s.index,
        shuffle: s.shuffle,
        volume: s.volume,
        muted: s.muted,
        repeat: s.repeat,
        resumeAt: s.resumeAt,
      }),
    },
  ),
);

export const currentTrackId = (s: Pick<PlayerState, "queue" | "index">) => s.queue[s.index]?.trackId;

/** High-frequency playback position lives in its own store so it doesn't re-render the whole app. */
export const useProgress = create<{ currentTime: number; duration: number; buffering: boolean }>(() => ({
  currentTime: 0,
  duration: 0,
  buffering: false,
}));
