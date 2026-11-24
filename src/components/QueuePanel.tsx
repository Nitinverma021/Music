import { useEffect, useState } from "react";
import { GripVertical, X } from "lucide-react";
import { useLibrary } from "../lib/library";
import { formatTime, formatTotal } from "../lib/format";
import { cn } from "../lib/cn";
import { usePlayer } from "../store/player";
import { useUi } from "../store/ui";
import { Cover } from "./Cover";
import { Equalizer } from "./Equalizer";

export function QueuePanel() {
  const open = usePlayer((s) => s.queueOpen);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const p = usePlayer.getState;
  const { byId } = useLibrary();
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !useUi.getState().menu && !document.querySelector("dialog[open]")) p().setQueueOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, p]);

  if (!open) return null;

  const current = queue[index];
  const upcoming = queue.slice(index + 1);
  const remaining = upcoming.reduce((sum, q) => sum + (byId.get(q.trackId)?.duration ?? 0), 0);

  return (
    <aside
      aria-label="Queue"
      className="fixed inset-0 z-30 flex animate-fade-in flex-col bg-zinc-950 md:static md:z-auto md:w-80 md:shrink-0 md:rounded-xl md:bg-surface lg:w-96"
    >
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] md:pt-4">
        <h2 className="text-lg font-semibold">Queue</h2>
        <div className="flex items-center gap-1">
          {upcoming.length > 0 && (
            <button type="button" className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/8 hover:text-zinc-100" onClick={() => p().clearUpcoming()}>
              Clear
            </button>
          )}
          <button type="button" className="icon-btn" aria-label="Close queue" onClick={() => p().setQueueOpen(false)}>
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="scroll-area flex-1 overflow-y-auto px-2 pb-4">
        {!current ? (
          <p className="px-2 py-10 text-center text-sm text-zinc-500">Your queue is empty. Play something!</p>
        ) : (
          <>
            <h3 className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Now playing</h3>
            <QueueRow trackId={current.trackId} active playing={isPlaying} />
            <h3 className="flex justify-between px-2 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span>Next up</span>
              {upcoming.length > 0 && <span className="normal-case tracking-normal">{formatTotal(remaining)}</span>}
            </h3>
            {upcoming.length === 0 && <p className="px-2 py-4 text-sm text-zinc-500">Nothing queued up next.</p>}
            <ol>
              {upcoming.map((item, i) => {
                const qi = index + 1 + i;
                return (
                  <li
                    key={item.key}
                    draggable
                    onDragStart={(e) => {
                      setDrag(qi);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      if (drag === null) return;
                      e.preventDefault();
                      setOver(qi);
                    }}
                    onDragEnd={() => {
                      setDrag(null);
                      setOver(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag !== null) p().moveInQueue(drag, qi);
                      setDrag(null);
                      setOver(null);
                    }}
                    className={cn(drag === qi && "opacity-40", over === qi && drag !== qi && "shadow-[inset_0_2px_0_var(--color-accent)]")}
                  >
                    <QueueRow
                      trackId={item.trackId}
                      onPlay={() => p().jumpTo(qi)}
                      onRemove={() => p().removeFromQueue(item.key)}
                      onMenu={(x, y) => useUi.getState().openMenu({ x, y, trackIds: [item.trackId], context: { queueKey: item.key } })}
                    />
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </aside>
  );
}

function QueueRow({
  trackId,
  active,
  playing,
  onPlay,
  onRemove,
  onMenu,
}: {
  trackId: string;
  active?: boolean;
  playing?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
  onMenu?: (x: number, y: number) => void;
}) {
  const t = useLibrary().byId.get(trackId);
  if (!t) return null;
  return (
    <div
      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/6"
      onContextMenu={(e) => {
        if (!onMenu) return;
        e.preventDefault();
        onMenu(e.clientX, e.clientY);
      }}
    >
      {onRemove && <GripVertical size={14} className="shrink-0 cursor-grab text-zinc-600" aria-hidden />}
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onPlay} disabled={!onPlay} aria-label={onPlay ? `Play ${t.title}` : undefined}>
        <Cover coverId={t.coverId} seed={t.album} className="size-10" iconSize={16} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-medium", active && "text-accent")}>{t.title}</span>
          <span className="block truncate text-xs text-zinc-400">{t.artist}</span>
        </span>
      </button>
      {active ? (
        <Equalizer playing={!!playing} className="mr-2" />
      ) : (
        <>
          <span className="text-xs tabular-nums text-zinc-500 group-hover:hidden group-focus-within:hidden">{formatTime(t.duration)}</span>
          <button
            type="button"
            className="icon-btn hidden size-7 group-hover:inline-flex group-focus-within:inline-flex"
            aria-label={`Remove ${t.title} from queue`}
            onClick={onRemove}
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}
