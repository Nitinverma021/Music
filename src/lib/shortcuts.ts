import { useEffect } from "react";
import { useNavigate } from "react-router";
import { audio, seekBy } from "../audio/engine";
import { currentTrackId, usePlayer } from "../store/player";
import { useUi } from "../store/ui";
import { toggleLike } from "./db";

export const SHORTCUTS: [string[], string][] = [
  [["Space"], "Play / pause"],
  [["→"], "Forward 5 seconds"],
  [["←"], "Back 5 seconds"],
  [["Shift", "→"], "Next song"],
  [["Shift", "←"], "Previous song"],
  [["↑"], "Volume up"],
  [["↓"], "Volume down"],
  [["M"], "Mute / unmute"],
  [["S"], "Shuffle on / off"],
  [["R"], "Repeat: off → all → one"],
  [["L"], "Like current song"],
  [["Q"], "Show queue"],
  [["F"], "Full-screen player"],
  [["/"], "Search"],
  [["?"], "Show shortcuts"],
];

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) && !(el instanceof HTMLInputElement && el.type === "range");

export function useShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (useUi.getState().menu || document.querySelector("dialog[open]")) return;
      const p = usePlayer.getState();
      const onRange = e.target instanceof HTMLInputElement && e.target.type === "range";
      const onButton = e.target instanceof HTMLButtonElement;
      let handled = true;
      switch (e.key) {
        case " ":
          if (onButton) return; // let Space activate the focused button
          p.toggle();
          break;
        case "ArrowRight":
          if (onRange) return;
          e.shiftKey ? p.next() : seekBy(5);
          break;
        case "ArrowLeft":
          if (onRange) return;
          e.shiftKey ? p.prev(audio.currentTime) : seekBy(-5);
          break;
        case "ArrowUp":
          if (onRange) return;
          p.setVolume(p.volume + 0.05);
          break;
        case "ArrowDown":
          if (onRange) return;
          p.setVolume(p.volume - 0.05);
          break;
        case "m":
        case "M":
          p.toggleMute();
          break;
        case "s":
        case "S":
          p.toggleShuffle();
          break;
        case "r":
        case "R":
          p.cycleRepeat();
          break;
        case "l":
        case "L": {
          const id = currentTrackId(p);
          if (id) toggleLike(id);
          break;
        }
        case "q":
        case "Q":
          p.setQueueOpen(!p.queueOpen);
          break;
        case "f":
        case "F":
          if (currentTrackId(p)) p.setNowPlayingOpen(!p.nowPlayingOpen);
          break;
        case "/":
          p.setNowPlayingOpen(false);
          navigate("/search");
          requestAnimationFrame(() => document.getElementById("search-input")?.focus());
          break;
        case "?":
          useUi.setState({ shortcutsOpen: true });
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}
