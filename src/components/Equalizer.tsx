import { cn } from "../lib/cn";

/** Animated bars shown next to the playing track. Freezes when paused. */
export function Equalizer({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-3.5 items-end gap-[2px]", className)} aria-hidden>
      {[0, 0.25, 0.5].map((delay) => (
        <span
          key={delay}
          className={cn("w-[3px] h-full origin-bottom rounded-full bg-accent", playing ? "animate-eq" : "scale-y-50")}
          style={{ animationDelay: `-${delay}s` }}
        />
      ))}
    </span>
  );
}
