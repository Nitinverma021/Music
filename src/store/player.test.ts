import { beforeEach, describe, expect, it } from "vitest";
import { currentTrackId, usePlayer } from "./player";

const p = () => usePlayer.getState();

beforeEach(() => {
  usePlayer.setState({ repeat: "off", shuffle: false, isPlaying: false, resumeAt: 0 });
  p().playTracks(["a", "b", "c"], 0);
});

describe("removing the current track", () => {
  it("moves to the following track from the start and keeps playing", () => {
    usePlayer.setState({ resumeAt: 95 });
    const token = p().restartToken;
    p().removeTracks(["a"]);
    expect(currentTrackId(p())).toBe("b");
    expect(p().isPlaying).toBe(true);
    expect(p().resumeAt).toBe(0);
    expect(p().restartToken).toBe(token + 1);
  });

  it("stops instead of replaying an earlier track when it was the last one", () => {
    p().jumpTo(2);
    p().removeTracks(["c"]);
    expect(currentTrackId(p())).toBe("b");
    expect(p().isPlaying).toBe(false);
  });

  it("stops when the queue becomes empty", () => {
    p().removeTracks(["a", "b", "c"]);
    expect(p().queue).toHaveLength(0);
    expect(p().isPlaying).toBe(false);
  });

  it("leaves playback alone when only upcoming tracks are removed", () => {
    usePlayer.setState({ resumeAt: 42 });
    const token = p().restartToken;
    p().removeTracks(["c"]);
    expect(currentTrackId(p())).toBe("a");
    expect(p().resumeAt).toBe(42);
    expect(p().restartToken).toBe(token);
  });

  it("does not resume playback if it was paused", () => {
    p().setPlaying(false);
    p().removeFromQueue(p().queue[0].key);
    expect(currentTrackId(p())).toBe("b");
    expect(p().isPlaying).toBe(false);
  });
});

describe("next()", () => {
  it("can skip without starting playback", () => {
    p().setPlaying(false);
    p().next(false, false);
    expect(currentTrackId(p())).toBe("b");
    expect(p().isPlaying).toBe(false);
  });

  it("starts playback by default", () => {
    p().setPlaying(false);
    p().next();
    expect(p().isPlaying).toBe(true);
  });
});
