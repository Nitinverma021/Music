import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Disc3,
  Heart,
  ListEnd,
  ListMinus,
  ListPlus,
  ListStart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTracks, removeFromPlaylist, toggleLike } from "../lib/db";
import { albumId, artistId, useLibrary } from "../lib/library";
import { plural } from "../lib/format";
import { usePlayer } from "../store/player";
import { useUi } from "../store/ui";

export function TrackMenuHost() {
  const menu = useUi((s) => s.menu);
  if (!menu) return null;
  return createPortal(<TrackMenu key={`${menu.x},${menu.y},${menu.trackIds.join()}`} />, document.body);
}

function TrackMenu() {
  const menu = useUi((s) => s.menu)!;
  const close = useUi((s) => s.closeMenu);
  const { byId } = useLibrary();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });
  const returnFocus = useRef<Element | null>(document.activeElement);

  const tracks = menu.trackIds.map((id) => byId.get(id)).filter((t) => !!t);
  const single = tracks.length === 1 ? tracks[0] : undefined;

  // Keep the menu inside the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 8;
    let left = menu.x;
    if (left + width > innerWidth - pad) left = Math.max(pad, menu.x - width);
    let top = menu.y;
    if (top + height > innerHeight - pad) top = Math.max(pad, innerHeight - height - pad);
    setPos({ left, top });
    el.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [menu.x, menu.y]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const onScroll = () => close();
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("blur", onScroll);
    const prev = returnFocus.current;
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("blur", onScroll);
      if (prev instanceof HTMLElement && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, [close]);

  if (!tracks.length) return null;
  const ids = tracks.map((t) => t.id);

  const run = (fn: () => void) => () => {
    close();
    fn();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items.at(-1)?.focus();
    }
  };

  const label = single ? `“${single.title}”` : plural(tracks.length, "song");
  const ctx = menu.context;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={single ? `Options for ${single.title}` : "Song options"}
      className="fixed z-50 w-60 animate-fade-in rounded-lg border border-white/10 bg-surface-2/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
      style={pos}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Item icon={<ListStart size={16} />} onClick={run(() => {
        usePlayer.getState().playNext(ids);
        toast(`${label} will play next`);
      })}>Play next</Item>
      <Item icon={<ListEnd size={16} />} onClick={run(() => {
        usePlayer.getState().addToQueue(ids);
        toast(`Added ${label} to queue`);
      })}>Add to queue</Item>
      <Item icon={<ListPlus size={16} />} onClick={run(() => useUi.setState({ addToPlaylist: ids }))}>
        Add to playlist…
      </Item>
      {single && (
        <Item icon={<Heart size={16} className={single.liked ? "fill-accent text-accent" : undefined} />} onClick={run(() => toggleLike(single.id))}>
          {single.liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
        </Item>
      )}
      {ctx?.queueKey && (
        <Item icon={<X size={16} />} onClick={run(() => usePlayer.getState().removeFromQueue(ctx.queueKey!))}>
          Remove from queue
        </Item>
      )}
      {single && (
        <>
          <div className="my-1 h-px bg-white/8" role="separator" />
          <Item icon={<Disc3 size={16} />} onClick={run(() => navigate(`/album/${albumId(single)}`))}>Go to album</Item>
          <Item icon={<UserRound size={16} />} onClick={run(() => navigate(`/artist/${artistId(single.artist)}`))}>
            Go to artist
          </Item>
        </>
      )}
      <div className="my-1 h-px bg-white/8" role="separator" />
      {ctx?.playlistId != null && ctx.playlistIndex != null && (
        <Item icon={<ListMinus size={16} />} onClick={run(() => removeFromPlaylist(ctx.playlistId!, ctx.playlistIndex!))}>
          Remove from this playlist
        </Item>
      )}
      <Item
        danger
        icon={<Trash2 size={16} />}
        onClick={run(() =>
          useUi.setState({
            confirm: {
              title: "Delete from library?",
              body: `${label} will be removed from this device and from all playlists. This can't be undone.`,
              action: "Delete",
              onConfirm: async () => {
                usePlayer.getState().removeTracks(ids);
                await deleteTracks(ids);
                toast(`Deleted ${label}`);
              },
            },
          }),
        )}
      >
        Delete from library
      </Item>
    </div>
  );
}

function Item({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button type="button" role="menuitem" tabIndex={-1} className={`menu-item ${danger ? "text-red-400" : ""}`} onClick={onClick}>
      <span className="text-zinc-400" aria-hidden>{icon}</span>
      {children}
    </button>
  );
}
