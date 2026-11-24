import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Track } from "../lib/db";
import { useLibrary } from "../lib/library";
import { formatTotal, plural } from "../lib/format";
import { PageTitle, PlayActions } from "../components/Page";
import { TrackList } from "../components/TrackList";
import { ImportButtons } from "../components/Import";

const SORTS = {
  title: { label: "Title", fn: (a: Track, b: Track) => a.title.localeCompare(b.title) },
  artist: { label: "Artist", fn: (a: Track, b: Track) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || (a.trackNo ?? 0) - (b.trackNo ?? 0) },
  album: { label: "Album", fn: (a: Track, b: Track) => a.album.localeCompare(b.album) || (a.trackNo ?? 0) - (b.trackNo ?? 0) },
  added: { label: "Recently added", fn: (a: Track, b: Track) => b.addedAt - a.addedAt },
  plays: { label: "Most played", fn: (a: Track, b: Track) => b.playCount - a.playCount || a.title.localeCompare(b.title) },
} as const;
type SortKey = keyof typeof SORTS;

export function matches(t: Track, q: string) {
  return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q);
}

export function Songs() {
  const { tracks } = useLibrary();
  const [sort, setSort] = useState<SortKey>(() => (localStorage.getItem("songs-sort") as SortKey) || "added");
  const [filter, setFilter] = useState("");
  const q = useDeferredValue(filter.trim().toLowerCase());

  const list = useMemo(() => {
    const filtered = q ? tracks.filter((t) => matches(t, q)) : tracks;
    return [...filtered].sort(SORTS[sort].fn);
  }, [tracks, q, sort]);

  const total = list.reduce((s, t) => s + t.duration, 0);

  return (
    <div>
      <PageTitle
        title="Songs"
        subtitle={`${plural(tracks.length, "song")} · ${formatTotal(total)}`}
        actions={<ImportButtons compact />}
      />
      <PlayActions trackIds={list.map((t) => t.id)}>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden sm:block">
            <span className="sr-only">Filter songs</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="input w-56 pl-9" placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              className="h-10 rounded-full bg-white/8 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-accent/60"
              value={sort}
              onChange={(e) => {
                const v = e.target.value as SortKey;
                setSort(v);
                localStorage.setItem("songs-sort", v);
              }}
            >
              {Object.entries(SORTS).map(([k, { label }]) => (
                <option key={k} value={k} className="bg-zinc-900">
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </PlayActions>
      <TrackList tracks={list} showAdded emptyText={q ? `No songs match “${filter}”.` : "No songs yet — add some music to get started."} />
    </div>
  );
}
