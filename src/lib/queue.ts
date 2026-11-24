/** Pure queue logic — no React, no audio. Unit-tested in queue.test.ts. */

export interface QueueItem {
  /** Unique per queue entry (the same track can be queued twice). */
  key: string;
  trackId: string;
}

export type RepeatMode = "off" | "all" | "one";

export interface QueueState {
  /** Play order (shuffled when shuffle is on). */
  queue: QueueItem[];
  /** Order before shuffling; used to restore when shuffle is turned off. */
  original: QueueItem[];
  index: number;
  shuffle: boolean;
}

let counter = 0;
export const makeItems = (trackIds: string[]): QueueItem[] =>
  trackIds.map((trackId) => ({ key: `${Date.now().toString(36)}-${(counter++).toString(36)}`, trackId }));

export function shuffleArray<T>(arr: T[], random = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Puts the item at `index` first and shuffles the rest. */
function shuffleAround(items: QueueItem[], index: number, random?: () => number): QueueItem[] {
  if (!items.length) return items;
  const current = items[index];
  const rest = items.filter((_, i) => i !== index);
  return [current, ...shuffleArray(rest, random)];
}

export function startQueue(
  trackIds: string[],
  startIndex: number,
  shuffle: boolean,
  random?: () => number,
): QueueState {
  const original = makeItems(trackIds);
  const idx = Math.min(Math.max(startIndex, 0), Math.max(original.length - 1, 0));
  if (!shuffle) return { queue: original, original, index: idx, shuffle };
  return { queue: shuffleAround(original, idx, random), original, index: 0, shuffle };
}

export function setShuffle(s: QueueState, on: boolean, random?: () => number): QueueState {
  if (on === s.shuffle) return s;
  if (!s.queue.length) return { ...s, shuffle: on };
  const current = s.queue[s.index];
  if (on) {
    const idx = s.original.findIndex((i) => i.key === current.key);
    return { ...s, queue: shuffleAround(s.original, Math.max(idx, 0), random), index: 0, shuffle: true };
  }
  const idx = s.original.findIndex((i) => i.key === current.key);
  return { ...s, queue: s.original, index: Math.max(idx, 0), shuffle: false };
}

/** Insert right after the current item (in both orders). */
export function playNext(s: QueueState, trackIds: string[]): QueueState {
  const items = makeItems(trackIds);
  if (!s.queue.length) return { ...s, queue: items, original: items, index: 0 };
  const current = s.queue[s.index];
  const queue = [...s.queue.slice(0, s.index + 1), ...items, ...s.queue.slice(s.index + 1)];
  const oIdx = s.original.findIndex((i) => i.key === current.key);
  const original = [...s.original.slice(0, oIdx + 1), ...items, ...s.original.slice(oIdx + 1)];
  return { ...s, queue, original };
}

export function addToQueue(s: QueueState, trackIds: string[]): QueueState {
  const items = makeItems(trackIds);
  if (!s.queue.length) return { ...s, queue: items, original: items, index: 0 };
  return { ...s, queue: [...s.queue, ...items], original: [...s.original, ...items] };
}

export function removeFromQueue(s: QueueState, key: string): QueueState {
  const pos = s.queue.findIndex((i) => i.key === key);
  if (pos === -1) return s;
  const queue = s.queue.filter((i) => i.key !== key);
  const original = s.original.filter((i) => i.key !== key);
  let index = s.index;
  if (pos < s.index) index--;
  index = Math.min(index, Math.max(queue.length - 1, 0));
  return { ...s, queue, original, index };
}

/** Remove every queue entry for the given tracks (e.g. after deleting them from the library). */
export function removeTracks(s: QueueState, trackIds: Set<string>): QueueState {
  let next = s;
  for (const item of s.queue) if (trackIds.has(item.trackId)) next = removeFromQueue(next, item.key);
  return next;
}

export function moveInQueue(s: QueueState, from: number, to: number): QueueState {
  if (from === to || from < 0 || to < 0 || from >= s.queue.length || to >= s.queue.length) return s;
  const queue = [...s.queue];
  const [moved] = queue.splice(from, 1);
  queue.splice(to, 0, moved);
  const currentKey = s.queue[s.index].key;
  const index = queue.findIndex((i) => i.key === currentKey);
  // Keep the unshuffled order in sync when not shuffling.
  return { ...s, queue, original: s.shuffle ? s.original : queue, index };
}

export type Advance = { index: number; stop: boolean; restart: boolean };

/**
 * Where to go next.
 * - `auto` = the track ended on its own (repeat-one replays; repeat-off stops at the end).
 * - manual next always moves forward; at the end it wraps only with repeat-all.
 */
export function nextIndex(len: number, index: number, repeat: RepeatMode, auto: boolean): Advance {
  if (!len) return { index: 0, stop: true, restart: false };
  if (auto && repeat === "one") return { index, stop: false, restart: true };
  if (index < len - 1) return { index: index + 1, stop: false, restart: false };
  if (repeat === "all" || (repeat === "one" && !auto)) return { index: 0, stop: false, restart: false };
  return { index, stop: true, restart: false };
}

export function prevIndex(len: number, index: number, repeat: RepeatMode): number {
  if (!len) return 0;
  if (index > 0) return index - 1;
  return repeat === "off" ? 0 : len - 1;
}
