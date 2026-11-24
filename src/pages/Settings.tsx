import { useEffect, useState } from "react";
import { HardDrive, Keyboard, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearLibrary } from "../lib/db";
import { useLibrary } from "../lib/library";
import { formatBytes, formatTotal, plural } from "../lib/format";
import { usePlayer } from "../store/player";
import { useUi } from "../store/ui";
import { PageTitle } from "../components/Page";
import { ImportButtons } from "../components/Import";

export function Settings() {
  const lib = useLibrary();
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number }>({});
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.estimate?.().then(setEstimate).catch(() => {});
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {});
  }, [lib.tracks.length]);

  const librarySize = lib.tracks.reduce((s, t) => s + t.size, 0);
  const totalTime = lib.tracks.reduce((s, t) => s + t.duration, 0);
  const pct = estimate.usage && estimate.quota ? Math.min(100, (estimate.usage / estimate.quota) * 100) : 0;

  return (
    <div className="max-w-2xl">
      <PageTitle title="Settings" />

      <section className="mb-6 rounded-xl bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><HardDrive size={18} className="text-accent" /> Library & storage</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Songs" value={lib.tracks.length.toLocaleString()} />
          <Stat label="Albums" value={lib.albums.length.toLocaleString()} />
          <Stat label="Listening time" value={formatTotal(totalTime)} />
          <Stat label="Music size" value={formatBytes(librarySize)} />
        </dl>
        {estimate.quota ? (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-zinc-400">
              <span>Browser storage used</span>
              <span>{formatBytes(estimate.usage ?? 0)} of {formatBytes(estimate.quota)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
          </div>
        ) : null}
        {persisted === false && (
          <p className="mt-3 text-xs text-amber-300/80">
            Your browser may clear this library if the device runs low on space. Installing the app (from the address bar) usually prevents that.
          </p>
        )}
        <ImportButtons className="mt-5" />
      </section>

      <section className="mb-6 rounded-xl bg-surface p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><Keyboard size={18} className="text-accent" /> Keyboard shortcuts</h2>
        <p className="mb-4 text-sm text-zinc-400">Control playback without touching the mouse.</p>
        <button type="button" className="btn-ghost" onClick={() => useUi.setState({ shortcutsOpen: true })}>
          Show shortcuts <kbd className="rounded border border-white/15 px-1.5 text-xs">?</kbd>
        </button>
      </section>

      <section className="mb-6 rounded-xl bg-surface p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-accent" /> Privacy</h2>
        <p className="text-sm text-zinc-400">
          Your music, artwork, playlists and play history are stored only in this browser on this device. Nothing is uploaded anywhere.
        </p>
      </section>

      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-red-300"><Trash2 size={18} /> Danger zone</h2>
        <p className="mb-4 text-sm text-zinc-400">Remove every song, playlist and cover from this device.</p>
        <button
          type="button"
          className="btn bg-red-500/15 text-red-300 hover:bg-red-500/25"
          disabled={!lib.tracks.length && !lib.playlists.length}
          onClick={() =>
            useUi.setState({
              confirm: {
                title: "Clear your whole library?",
                body: `This deletes ${plural(lib.tracks.length, "song")} and ${plural(lib.playlists.length, "playlist")} from this device. This can't be undone.`,
                action: "Clear library",
                onConfirm: async () => {
                  usePlayer.setState({ queue: [], original: [], index: 0, isPlaying: false, resumeAt: 0 });
                  await clearLibrary();
                  toast("Library cleared");
                },
              },
            })
          }
        >
          Clear library
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold">{value}</dd>
    </div>
  );
}
