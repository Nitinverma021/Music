import { Link } from "react-router";
import { ListMusic, Maximize2 } from "lucide-react";
import { albumId, artistId } from "../lib/library";
import { cn } from "../lib/cn";
import { usePlayer, useProgress } from "../store/player";
import { Cover } from "./Cover";
import { LikeButton, PlayButton, SeekBar, Transport, useCurrentTrack, VolumeControl } from "./PlayerControls";

export function PlayerBar() {
  const track = useCurrentTrack();
  const queueOpen = usePlayer((s) => s.queueOpen);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const openNowPlaying = () => usePlayer.getState().setNowPlayingOpen(true);

  if (!track) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden h-20 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)_minmax(0,1fr)] items-center gap-4 border-t border-white/8 bg-zinc-950 px-4 md:grid">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="group relative" aria-label="Open full-screen player" onClick={openNowPlaying}>
            <Cover coverId={track.coverId} seed={track.album} className="size-14" />
            <span className="absolute inset-0 grid place-items-center rounded-md bg-black/50 opacity-0 transition group-hover:opacity-100">
              <Maximize2 size={18} />
            </span>
          </button>
          <div className="min-w-0">
            <Link to={`/album/${albumId(track)}`} className="block truncate text-sm font-medium hover:underline">
              {track.title}
            </Link>
            <Link to={`/artist/${artistId(track.artist)}`} className="block truncate text-xs text-zinc-400 hover:text-zinc-200 hover:underline">
              {track.artist}
            </Link>
          </div>
          <LikeButton track={track} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <Transport />
          <SeekBar />
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className={cn("icon-btn", queueOpen && "text-accent hover:text-accent")}
            aria-label="Queue"
            aria-pressed={queueOpen}
            title="Queue (Q)"
            onClick={() => setQueueOpen(!queueOpen)}
          >
            <ListMusic size={18} />
          </button>
          {/* Too wide for tablet widths; volume stays on the keyboard (↑/↓) and in the full-screen player. */}
          <VolumeControl className="max-lg:hidden" />
          <button type="button" className="icon-btn" aria-label="Full-screen player" title="Full screen (F)" onClick={openNowPlaying}>
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Mobile mini-player */}
      <div className="px-2 pb-1 md:hidden">
        <div className="relative overflow-hidden rounded-lg bg-surface-2 shadow-lg">
          <MiniProgress />
          <div className="flex items-center gap-3 p-2">
            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={openNowPlaying} aria-label={`Now playing: ${track.title}. Open player`}>
              <Cover coverId={track.coverId} seed={track.album} className="size-10" iconSize={16} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{track.title}</span>
                <span className="block truncate text-xs text-zinc-400">{track.artist}</span>
              </span>
            </button>
            <LikeButton track={track} />
            <PlayButton size="sm" />
          </div>
        </div>
      </div>
    </>
  );
}

function MiniProgress() {
  const pct = useProgress((s) => (s.duration ? (s.currentTime / s.duration) * 100 : 0));
  return (
    <div className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-white/15" aria-hidden>
      <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
    </div>
  );
}
