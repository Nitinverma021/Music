import { useState } from "react";
import {
  Heart,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { audio, seek } from "../audio/engine";
import { toggleLike, type Track } from "../lib/db";
import { formatTime } from "../lib/format";
import { useLibrary } from "../lib/library";
import { cn } from "../lib/cn";
import { currentTrackId, usePlayer, useProgress } from "../store/player";
import { Slider } from "./Slider";

export function useCurrentTrack(): Track | undefined {
  const id = usePlayer(currentTrackId);
  const { byId } = useLibrary();
  return id ? byId.get(id) : undefined;
}

export function PlayButton({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const hasQueue = usePlayer((s) => s.queue.length > 0);
  const buffering = useProgress((s) => s.buffering);
  const toggle = usePlayer((s) => s.toggle);
  const px = { sm: "size-9", md: "size-10", lg: "size-16" }[size];
  const icon = { sm: 16, md: 18, lg: 28 }[size];
  return (
    <button
      type="button"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-white text-zinc-950 transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100",
        px,
        className,
      )}
      aria-label={isPlaying ? "Pause" : "Play"}
      disabled={!hasQueue}
      onClick={toggle}
    >
      {isPlaying && buffering ? (
        <Loader2 size={icon} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={icon} className="fill-current" />
      ) : (
        <Play size={icon} className="translate-x-[1px] fill-current" />
      )}
    </button>
  );
}

export function Transport({ size = "md" }: { size?: "md" | "lg" }) {
  const p = usePlayer();
  const icon = size === "lg" ? 24 : 18;
  const btn = size === "lg" ? "icon-btn size-12" : "icon-btn";
  const has = p.queue.length > 0;
  return (
    <div className={cn("flex items-center", size === "lg" ? "gap-4" : "gap-2")}>
      <button
        type="button"
        className={cn(btn, p.shuffle && "text-accent hover:text-accent")}
        aria-label="Shuffle"
        aria-pressed={p.shuffle}
        title={p.shuffle ? "Shuffle on (S)" : "Shuffle off (S)"}
        onClick={p.toggleShuffle}
      >
        <Shuffle size={icon - 2} />
      </button>
      <button type="button" className={btn} aria-label="Previous" title="Previous (Shift+←)" disabled={!has} onClick={() => p.prev(audio.currentTime)}>
        <SkipBack size={icon} className="fill-current" />
      </button>
      <PlayButton size={size === "lg" ? "lg" : "md"} />
      <button type="button" className={btn} aria-label="Next" title="Next (Shift+→)" disabled={!has} onClick={() => p.next()}>
        <SkipForward size={icon} className="fill-current" />
      </button>
      <button
        type="button"
        className={cn(btn, p.repeat !== "off" && "text-accent hover:text-accent")}
        aria-label={`Repeat: ${p.repeat}`}
        title={`Repeat ${p.repeat} (R)`}
        onClick={p.cycleRepeat}
      >
        {p.repeat === "one" ? <Repeat1 size={icon - 2} /> : <Repeat size={icon - 2} />}
      </button>
    </div>
  );
}

export function SeekBar({ className }: { className?: string }) {
  const currentTime = useProgress((s) => s.currentTime);
  const duration = useProgress((s) => s.duration);
  const [scrub, setScrub] = useState<number | null>(null);
  const shown = scrub ?? currentTime;
  return (
    <div className={cn("flex w-full items-center gap-2 text-xs tabular-nums text-zinc-400", className)}>
      <span className="w-10 text-right">{formatTime(shown)}</span>
      <Slider
        label="Seek"
        className="min-w-0 flex-1"
        value={shown}
        max={duration}
        step={0.1}
        valueText={`${formatTime(shown)} of ${formatTime(duration)}`}
        onChange={setScrub}
        onCommit={(v) => {
          seek(v);
          setScrub(null);
        }}
      />
      <span className="w-10">{formatTime(duration)}</span>
    </div>
  );
}

export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const v = muted ? 0 : volume;
  const Icon = v === 0 ? VolumeX : v < 0.5 ? Volume1 : Volume2;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button type="button" className="icon-btn" aria-label={muted ? "Unmute" : "Mute"} title="Mute (M)" onClick={toggleMute}>
        <Icon size={18} />
      </button>
      <Slider label="Volume" value={v} max={1} valueText={`${Math.round(v * 100)}%`} onChange={setVolume} className="w-24" />
    </div>
  );
}

export function LikeButton({ track, size = 18 }: { track: Track; size?: number }) {
  return (
    <button
      type="button"
      className={cn("icon-btn", !!track.liked && "text-accent hover:text-accent")}
      aria-label={track.liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
      aria-pressed={!!track.liked}
      title="Like (L)"
      onClick={() => toggleLike(track.id)}
    >
      <Heart size={size} className={track.liked ? "fill-current" : undefined} />
    </button>
  );
}
