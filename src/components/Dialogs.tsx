import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ListMusic, Plus } from "lucide-react";
import { toast } from "sonner";
import { addToPlaylist, createPlaylist } from "../lib/db";
import { useLibrary } from "../lib/library";
import { plural } from "../lib/format";
import { useUi } from "../store/ui";
import { SHORTCUTS } from "../lib/shortcuts";
import { useNavigate } from "react-router";

/** Native <dialog> wrapper: focus trap, Escape and backdrop for free. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className = "w-[min(92vw,26rem)]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`m-auto animate-fade-in rounded-2xl border border-white/10 bg-surface-2 p-0 text-zinc-100 shadow-2xl ${className}`}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {open && (
        <div className="p-6">
          <h2 className="mb-4 text-lg font-semibold">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Dialogs() {
  return (
    <>
      <AddToPlaylistDialog />
      <CreatePlaylistDialog />
      <ConfirmDialog />
      <ShortcutsDialog />
    </>
  );
}

function AddToPlaylistDialog() {
  const ids = useUi((s) => s.addToPlaylist);
  const { playlists } = useLibrary();
  const close = () => useUi.setState({ addToPlaylist: null });
  return (
    <Modal open={!!ids} onClose={close} title={ids ? `Add ${plural(ids.length, "song")} to playlist` : ""}>
      <div className="-mx-2 max-h-80 overflow-y-auto scroll-area">
        <button
          type="button"
          className="menu-item"
          onClick={() => useUi.setState({ addToPlaylist: null, createPlaylist: { trackIds: ids ?? [] } })}
        >
          <span className="grid size-10 place-items-center rounded-md bg-white/8"><Plus size={18} /></span>
          New playlist
        </button>
        {playlists.map((p) => {
          const already = ids?.every((id) => p.trackIds.includes(id));
          return (
            <button
              key={p.id}
              type="button"
              className="menu-item"
              onClick={async () => {
                if (!ids) return;
                close();
                await addToPlaylist(p.id, ids);
                toast(already ? `Already in ${p.name}` : `Added to ${p.name}`);
              }}
            >
              <span className="grid size-10 place-items-center rounded-md bg-white/8 text-zinc-400"><ListMusic size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{p.name}</span>
                <span className="block text-xs text-zinc-500">{plural(p.trackIds.length, "song")}</span>
              </span>
              {already && <Check size={16} className="text-accent" aria-label="Already added" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function CreatePlaylistDialog() {
  const state = useUi((s) => s.createPlaylist);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const close = () => useUi.setState({ createPlaylist: null });
  useEffect(() => {
    if (state) setName("");
  }, [state]);
  return (
    <Modal open={!!state} onClose={close} title="New playlist">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const ids = state?.trackIds ?? [];
          close();
          const id = await createPlaylist(name, ids);
          toast(ids.length ? `Created playlist with ${plural(ids.length, "song")}` : "Playlist created");
          navigate(`/playlist/${id}`);
        }}
      >
        <label className="mb-2 block text-sm text-zinc-400" htmlFor="pl-name">Name</label>
        <input
          id="pl-name"
          className="input"
          autoFocus
          maxLength={100}
          placeholder="My playlist"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={close}>Cancel</button>
          <button type="submit" className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDialog() {
  const c = useUi((s) => s.confirm);
  const close = () => useUi.setState({ confirm: null });
  return (
    <Modal open={!!c} onClose={close} title={c?.title ?? ""}>
      <p className="text-sm text-zinc-400">{c?.body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" autoFocus onClick={close}>Cancel</button>
        <button
          type="button"
          className="btn bg-red-500 text-white hover:bg-red-400"
          onClick={() => {
            c?.onConfirm();
            close();
          }}
        >
          {c?.action}
        </button>
      </div>
    </Modal>
  );
}

function ShortcutsDialog() {
  const open = useUi((s) => s.shortcutsOpen);
  return (
    <Modal open={open} onClose={() => useUi.setState({ shortcutsOpen: false })} title="Keyboard shortcuts" className="w-[min(92vw,30rem)]">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        {SHORTCUTS.map(([keys, desc]) => (
          <div key={desc} className="contents">
            <dt className="flex gap-1">
              {keys.map((k) => (
                <kbd key={k} className="min-w-7 rounded-md border border-white/15 bg-white/6 px-1.5 py-0.5 text-center font-sans text-xs text-zinc-200">
                  {k}
                </kbd>
              ))}
            </dt>
            <dd className="text-zinc-400">{desc}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
