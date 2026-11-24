import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { ChevronDown, ListMusic, MoreHorizontal } from "lucide-react";
import { useCover } from "../lib/covers";
import { trapFocus } from "../lib/focus";
import { albumId, artistId } from "../lib/library";
import { usePlayer } from "../store/player";
import { useUi } from "../store/ui";
import { Cover } from "./Cover";
import { LikeButton, SeekBar, Transport, useCurrentTrack, VolumeControl } from "./PlayerControls";

export function NowPlaying() {
  const open = usePlayer((s) => s.nowPlayingOpen);
  const track = useCurrentTrack();
  if (!open || !track) return null;
  return createPortal(<Sheet />, document.body);
}

function Sheet() {
  const track = useCurrentTrack()!;
  const { color } = useCover(track.coverId);
  const close = () => usePlayer.getState().setNowPlayingOpen(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // defaultPrevented: a menu (or other layer) already used this Escape to close itself.
      if (e.key === "Escape" && !e.defaultPrevented && !useUi.getState().menu && !document.querySelector("dialog[open]")) {
        e.preventDefault(); // tells the queue panel underneath not to close as well
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  const rgb = color ?? "90 70 160";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      onKeyDown={trapFocus}
      className="fixed inset-0 z-40 flex animate-slide-up flex-col overflow-hidden bg-zinc-950"
    >
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-700"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, rgb(${rgb} / 0.55), transparent 70%), linear-gradient(to bottom, rgb(${rgb} / 0.25), #09090b 85%)`,
        }}
      />
      <header className="relative flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button ref={closeRef} type="button" className="icon-btn size-10" aria-label="Close player" onClick={close}>
          <ChevronDown size={24} />
        </button>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-widest text-zinc-400">Playing from</p>
          <Link to={`/album/${albumId(track)}`} onClick={close} className="text-sm font-semibold hover:underline">
            {track.album}
          </Link>
        </div>
        <button
          type="button"
          className="icon-btn size-10"
          aria-label="More options"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            useUi.getState().openMenu({ x: r.right, y: r.bottom + 4, trackIds: [track.id] });
          }}
        >
          <MoreHorizontal size={22} />
        </button>
      </header>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <Cover
          coverId={track.coverId}
          seed={track.album}
          eager
          iconSize={72}
          className="aspect-square w-full max-h-[48vh] max-w-[48vh] self-center rounded-xl shadow-2xl shadow-black/60"
        />
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold">{track.title}</h2>
            <Link
              to={`/artist/${artistId(track.artist)}`}
              onClick={close}
              className="block truncate text-zinc-300 hover:underline"
            >
              {track.artist}
            </Link>
          </div>
          <LikeButton track={track} size={24} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <SeekBar />
          <Transport size="lg" />
        </div>
        <div className="flex items-center justify-between">
          <VolumeControl className="max-md:invisible" />
          <button
            type="button"
            className="icon-btn"
            aria-label="Show queue"
            onClick={() => {
              close();
              usePlayer.getState().setQueueOpen(true);
            }}
          >
            <ListMusic size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
