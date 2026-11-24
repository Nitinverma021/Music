import type { ReactNode } from "react";
import { Link } from "react-router";
import { Play, Shuffle } from "lucide-react";
import { useCover } from "../lib/covers";
import { cn } from "../lib/cn";
import { usePlayer } from "../store/player";
import { Cover } from "./Cover";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-2">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Big header for album / playlist / artist pages, tinted by the artwork colour. */
export function Hero({
  kind,
  title,
  coverId,
  seed,
  round,
  meta,
  icon,
}: {
  kind: string;
  title: string;
  coverId?: string;
  seed: string;
  round?: boolean;
  meta: ReactNode;
  icon?: ReactNode;
}) {
  const { color } = useCover(coverId);
  const rgb = color ?? "80 70 140";
  return (
    <div className="relative -mx-4 -mt-4 mb-6 px-4 pb-6 pt-10 md:-mx-8 md:-mt-6 md:px-8 md:pt-16">
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-700"
        style={{ background: `linear-gradient(to bottom, rgb(${rgb} / 0.55), rgb(${rgb} / 0.12) 70%, transparent)` }}
      />
      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
        {icon ? (
          <div className="grid size-44 shrink-0 place-items-center rounded-lg shadow-2xl shadow-black/40 md:size-52" style={{ background: `linear-gradient(135deg, rgb(${rgb}), rgb(${rgb} / 0.4))` }}>
            {icon}
          </div>
        ) : (
          <Cover coverId={coverId} seed={seed} round={round} eager iconSize={56} className="size-44 shadow-2xl shadow-black/40 md:size-52" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{kind}</p>
          <h1 className="mt-1 line-clamp-2 break-words text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">{title}</h1>
          <div className="mt-3 text-sm text-zinc-300">{meta}</div>
        </div>
      </div>
    </div>
  );
}

export function PlayActions({ trackIds, children }: { trackIds: string[]; children?: ReactNode }) {
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        className="grid size-14 place-items-center rounded-full bg-accent text-zinc-950 shadow-lg shadow-accent/20 transition hover:scale-105 active:scale-95 disabled:opacity-40"
        aria-label="Play"
        disabled={!trackIds.length}
        onClick={() => playTracks(trackIds, 0, { shuffle: false })}
      >
        <Play size={24} className="translate-x-[1px] fill-current" />
      </button>
      <button
        type="button"
        className="icon-btn size-11"
        aria-label="Shuffle play"
        title="Shuffle play"
        disabled={!trackIds.length}
        onClick={() => playTracks(trackIds, 0, { shuffle: true })}
      >
        <Shuffle size={22} />
      </button>
      {children}
    </div>
  );
}

export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6", className)}>
      {children}
    </div>
  );
}

export function Card({
  to,
  title,
  subtitle,
  coverId,
  seed,
  round,
  onPlay,
}: {
  to: string;
  title: string;
  subtitle: string;
  coverId?: string;
  seed: string;
  round?: boolean;
  onPlay?: () => void;
}) {
  return (
    <div className="group relative rounded-lg p-2 transition-colors hover:bg-white/5">
      <div className="relative">
        <Cover coverId={coverId} seed={seed} round={round} iconSize={36} className="aspect-square w-full" />
        {onPlay && (
          <button
            type="button"
            className="absolute bottom-2 right-2 z-10 grid size-11 translate-y-2 place-items-center rounded-full bg-accent text-zinc-950 opacity-0 shadow-xl shadow-black/40 transition hover:scale-105 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
            aria-label={`Play ${title}`}
            onClick={onPlay}
          >
            <Play size={18} className="translate-x-[1px] fill-current" />
          </button>
        )}
      </div>
      <Link to={to} className={cn("mt-2 block truncate text-sm font-semibold after:absolute after:inset-0", round && "text-center")}>
        {title}
      </Link>
      <p className={cn("truncate text-xs text-zinc-400", round && "text-center")}>{subtitle}</p>
    </div>
  );
}

export function Section({ title, to, children }: { title: string; to?: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {to && (
          <Link to={to} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100">
            Show all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
