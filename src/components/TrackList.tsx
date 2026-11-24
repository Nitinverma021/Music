import { memo, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Clock3, Heart, MoreHorizontal, Play } from "lucide-react";
import { toggleLike, type Track } from "../lib/db";
import { formatTime, relativeDate } from "../lib/format";
import { cn } from "../lib/cn";
import { useScrollElement } from "../lib/scroll";
import { currentTrackId, usePlayer } from "../store/player";
import { useUi, type TrackMenuContext } from "../store/ui";
import { Cover } from "./Cover";
import { Equalizer } from "./Equalizer";

interface Props {
  tracks: Track[];
  /** Number rows by album track number instead of position. */
  albumMode?: boolean;
  showAlbum?: boolean;
  showAdded?: boolean;
  playlistId?: string;
  emptyText?: string;
}

const ROW = 56;

export function TrackList({ tracks, albumMode, showAlbum = true, showAdded = false, playlistId, emptyText }: Props) {
  const scrollEl = useScrollElement();
  const listRef = useRef<HTMLDivElement>(null);
  const [margin, setMargin] = useState(0);
  const nowId = usePlayer(currentTrackId);
  const isPlaying = usePlayer((s) => s.isPlaying);

  useLayoutEffect(() => {
    const measure = () => {
      if (!listRef.current || !scrollEl) return;
      const top = listRef.current.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
      setMargin((m) => (Math.abs(m - top) > 1 ? top : m));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (scrollEl) ro.observe(scrollEl.firstElementChild ?? scrollEl);
    return () => ro.disconnect();
  }, [scrollEl]);

  const v = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => ROW,
    overscan: 12,
    scrollMargin: margin,
  });

  const ids = tracks.map((t) => t.id);
  const play = (i: number) => {
    const s = usePlayer.getState();
    if (tracks[i].id === currentTrackId(s) && sameQueue(s.original.map((q) => q.trackId), ids)) {
      s.toggle();
      return;
    }
    s.playTracks(ids, i);
  };

  const openMenu = (e: MouseEvent, track: Track, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const fromButton = e.type === "click";
    const context: TrackMenuContext | undefined = playlistId ? { playlistId, playlistIndex: index } : undefined;
    useUi.getState().openMenu({
      x: fromButton ? rect.right : e.clientX,
      y: fromButton ? rect.bottom + 4 : e.clientY,
      trackIds: [track.id],
      context,
    });
  };

  if (!tracks.length) {
    return <p className="px-2 py-10 text-center text-sm text-zinc-500">{emptyText ?? "No songs here yet."}</p>;
  }

  const cols = cn(
    "grid items-center gap-3 px-3",
    "grid-cols-[2rem_minmax(0,1fr)_2.25rem]",
    "sm:grid-cols-[2rem_minmax(0,1fr)_2.25rem_3.5rem_2.25rem]",
    showAlbum && "md:grid-cols-[2rem_minmax(0,1.3fr)_minmax(0,1fr)_2.25rem_3.5rem_2.25rem]",
    showAlbum && showAdded && "xl:grid-cols-[2rem_minmax(0,1.3fr)_minmax(0,1fr)_7.5rem_2.25rem_3.5rem_2.25rem]",
  );

  return (
    <div role="table" aria-rowcount={tracks.length} className="select-none">
      <div
        role="row"
        className={cn(cols, "sticky top-0 z-10 h-9 border-b border-white/8 bg-zinc-950/85 text-xs uppercase tracking-wider text-zinc-500 backdrop-blur")}
      >
        <span role="columnheader" className="text-center">#</span>
        <span role="columnheader">Title</span>
        {showAlbum && <span role="columnheader" className="hidden md:block">Album</span>}
        {showAlbum && showAdded && <span role="columnheader" className="hidden xl:block">Added</span>}
        <span role="columnheader" className="hidden sm:block" />
        <span role="columnheader" className="hidden justify-end sm:flex">
          <Clock3 size={14} aria-label="Duration" />
        </span>
        <span role="columnheader" />
      </div>

      <div ref={listRef} className="relative mt-1" style={{ height: v.getTotalSize() }}>
        {v.getVirtualItems().map((item) => {
          const t = tracks[item.index];
          return (
            <Row
              key={item.key}
              track={t}
              index={item.index}
              top={item.start - margin}
              cols={cols}
              albumMode={albumMode}
              showAlbum={showAlbum}
              showAdded={showAlbum && showAdded}
              isCurrent={t.id === nowId}
              isPlaying={isPlaying}
              onPlay={play}
              onMenu={openMenu}
            />
          );
        })}
      </div>
    </div>
  );
}

function sameQueue(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

interface RowProps {
  track: Track;
  index: number;
  top: number;
  cols: string;
  albumMode?: boolean;
  showAlbum: boolean;
  showAdded: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (i: number) => void;
  onMenu: (e: MouseEvent, t: Track, i: number) => void;
}

const Row = memo(function Row({
  track: t,
  index,
  top,
  cols,
  albumMode,
  showAlbum,
  showAdded,
  isCurrent,
  isPlaying,
  onPlay,
  onMenu,
}: RowProps) {
  return (
    <div
      role="row"
      aria-rowindex={index + 1}
      aria-current={isCurrent || undefined}
      className={cn(cols, "group absolute inset-x-0 rounded-md transition-colors hover:bg-white/6", isCurrent && "bg-white/4")}
      style={{ height: ROW, transform: `translateY(${top}px)` }}
      onClick={() => onPlay(index)}
      onContextMenu={(e) => onMenu(e, t, index)}
    >
      <span role="cell" className="relative grid place-items-center text-sm tabular-nums text-zinc-500">
        {isCurrent ? (
          <Equalizer playing={isPlaying} className="group-hover:invisible" />
        ) : (
          <span className="group-hover:invisible">{albumMode ? (t.trackNo ?? index + 1) : index + 1}</span>
        )}
        <Play size={14} className="invisible absolute fill-current text-zinc-100 group-hover:visible" aria-hidden />
      </span>

      <span role="cell" className="flex min-w-0 items-center gap-3">
        {!albumMode && <Cover coverId={t.coverId} seed={t.album} className="size-10" iconSize={16} />}
        <span className="min-w-0">
          <button
            type="button"
            className={cn("block max-w-full truncate text-left text-[15px] font-medium focus-visible:outline-offset-0", isCurrent ? "text-accent" : "text-zinc-100")}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(index);
            }}
          >
            {t.title}
          </button>
          <span className="block truncate text-[13px] text-zinc-400">{t.artist}</span>
        </span>
      </span>

      {showAlbum && <span role="cell" className="hidden truncate text-sm text-zinc-400 md:block">{t.album}</span>}
      {showAdded && <span role="cell" className="hidden truncate text-sm text-zinc-500 xl:block">{relativeDate(t.addedAt)}</span>}

      <span role="cell" className="hidden sm:flex">
        <button
          type="button"
          className={cn("icon-btn size-8", t.liked ? "text-accent hover:text-accent" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
          aria-label={t.liked ? `Remove ${t.title} from Liked Songs` : `Add ${t.title} to Liked Songs`}
          aria-pressed={!!t.liked}
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(t.id);
          }}
        >
          <Heart size={16} className={t.liked ? "fill-current" : undefined} />
        </button>
      </span>
      <span role="cell" className="hidden text-right text-sm tabular-nums text-zinc-400 sm:block">
        {formatTime(t.duration)}
      </span>
      <span role="cell" className="flex justify-end">
        <button
          type="button"
          className="icon-btn size-8 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label={`More options for ${t.title}`}
          aria-haspopup="menu"
          onClick={(e) => onMenu(e, t, index)}
        >
          <MoreHorizontal size={18} />
        </button>
      </span>
    </div>
  );
});
