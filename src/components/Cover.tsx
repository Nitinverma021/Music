import { Music } from "lucide-react";
import { placeholderGradient, useCover } from "../lib/covers";
import { cn } from "../lib/cn";

interface Props {
  coverId?: string;
  seed: string;
  className?: string;
  round?: boolean;
  iconSize?: number;
  eager?: boolean;
}

export function Cover({ coverId, seed, className, round, iconSize = 20, eager }: Props) {
  const { url } = useCover(coverId);
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-surface-2 shadow-sm",
        round ? "rounded-full" : "rounded-md",
        className,
      )}
      style={url ? undefined : { background: placeholderGradient(seed) }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          className="size-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center text-white/60">
          <Music size={iconSize} aria-hidden />
        </div>
      )}
    </div>
  );
}
