import { describe, expect, it } from "vitest";
import {
  addToQueue,
  moveInQueue,
  nextIndex,
  playNext,
  prevIndex,
  removeFromQueue,
  removeTracks,
  setShuffle,
  startQueue,
} from "./queue";

const ids = (s: { queue: { trackId: string }[] }) => s.queue.map((i) => i.trackId);
// Deterministic "random" for repeatable shuffles.
const seeded = () => {
  let x = 42;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
};

describe("startQueue", () => {
  it("starts at the requested index without shuffle", () => {
    const s = startQueue(["a", "b", "c"], 1, false);
    expect(ids(s)).toEqual(["a", "b", "c"]);
    expect(s.index).toBe(1);
  });

  it("puts the chosen track first when shuffling and keeps every track", () => {
    const s = startQueue(["a", "b", "c", "d", "e"], 2, true, seeded());
    expect(s.index).toBe(0);
    expect(s.queue[0].trackId).toBe("c");
    expect([...ids(s)].sort()).toEqual(["a", "b", "c", "d", "e"]);
    expect(ids({ queue: s.original })).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("clamps an out-of-range start index", () => {
    expect(startQueue(["a", "b"], 9, false).index).toBe(1);
  });
});

describe("setShuffle", () => {
  it("restores original order and keeps the current track when turned off", () => {
    let s = startQueue(["a", "b", "c", "d"], 0, false);
    s = { ...s, index: 2 }; // playing "c"
    s = setShuffle(s, true, seeded());
    expect(s.queue[s.index].trackId).toBe("c");
    s = setShuffle(s, false);
    expect(ids(s)).toEqual(["a", "b", "c", "d"]);
    expect(s.index).toBe(2);
  });
});

describe("playNext / addToQueue", () => {
  it("inserts after the current item", () => {
    let s = startQueue(["a", "b", "c"], 0, false);
    s = playNext(s, ["x"]);
    expect(ids(s)).toEqual(["a", "x", "b", "c"]);
  });

  it("appends to the end", () => {
    let s = startQueue(["a"], 0, false);
    s = addToQueue(s, ["x", "y"]);
    expect(ids(s)).toEqual(["a", "x", "y"]);
  });

  it("works on an empty queue", () => {
    const s = playNext({ queue: [], original: [], index: 0, shuffle: false }, ["x"]);
    expect(ids(s)).toEqual(["x"]);
    expect(s.index).toBe(0);
  });

  it("keeps play-next items next to the current track after un-shuffling", () => {
    let s = startQueue(["a", "b", "c", "d"], 1, true, seeded());
    s = playNext(s, ["x"]);
    s = setShuffle(s, false);
    expect(ids(s)).toEqual(["a", "b", "x", "c", "d"]);
  });
});

describe("removeFromQueue", () => {
  it("shifts index when removing an earlier item", () => {
    const s = { ...startQueue(["a", "b", "c"], 0, false), index: 2 };
    const r = removeFromQueue(s, s.queue[0].key);
    expect(ids(r)).toEqual(["b", "c"]);
    expect(r.queue[r.index].trackId).toBe("c");
  });

  it("removes duplicates of deleted tracks", () => {
    let s = startQueue(["a", "b"], 0, false);
    s = addToQueue(s, ["b"]);
    s = removeTracks(s, new Set(["b"]));
    expect(ids(s)).toEqual(["a"]);
  });
});

describe("moveInQueue", () => {
  it("follows the current track", () => {
    const s = startQueue(["a", "b", "c"], 0, false);
    const m = moveInQueue(s, 0, 2);
    expect(ids(m)).toEqual(["b", "c", "a"]);
    expect(m.queue[m.index].trackId).toBe("a");
  });
});

describe("nextIndex / prevIndex", () => {
  it("advances normally", () => {
    expect(nextIndex(3, 0, "off", true)).toEqual({ index: 1, stop: false, restart: false });
  });
  it("stops at the end with repeat off", () => {
    expect(nextIndex(3, 2, "off", true).stop).toBe(true);
  });
  it("wraps with repeat all", () => {
    expect(nextIndex(3, 2, "all", true)).toEqual({ index: 0, stop: false, restart: false });
  });
  it("replays with repeat one when the track ends", () => {
    expect(nextIndex(3, 1, "one", true)).toEqual({ index: 1, stop: false, restart: true });
  });
  it("still skips forward on manual next with repeat one", () => {
    expect(nextIndex(3, 1, "one", false).index).toBe(2);
  });
  it("prev wraps only when repeating", () => {
    expect(prevIndex(3, 0, "off")).toBe(0);
    expect(prevIndex(3, 0, "all")).toBe(2);
  });
});
