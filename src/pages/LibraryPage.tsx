import { Link } from "react-router";
import { ChevronRight, Disc3, Heart, ListMusic, MicVocal, Music2, Plus } from "lucide-react";
import { useLibrary } from "../lib/library";
import { plural } from "../lib/format";
import { useUi } from "../store/ui";
import { PageTitle } from "../components/Page";
import { ImportButtons } from "../components/Import";

/** Mobile "Library" tab — the desktop sidebar's library section as a page. */
export function LibraryPage() {
  const lib = useLibrary();
  const rows = [
    { to: "/songs", label: "Songs", icon: Music2, count: plural(lib.tracks.length, "song") },
    { to: "/albums", label: "Albums", icon: Disc3, count: plural(lib.albums.length, "album") },
    { to: "/artists", label: "Artists", icon: MicVocal, count: plural(lib.artists.length, "artist") },
    { to: "/liked", label: "Liked Songs", icon: Heart, count: plural(lib.tracks.filter((t) => t.liked).length, "song") },
  ];
  return (
    <div>
      <PageTitle title="Your Library" />
      <ImportButtons className="mb-6" />
      <ul className="mb-8 divide-y divide-white/6 rounded-xl bg-surface">
        {rows.map(({ to, label, icon: Icon, count }) => (
          <li key={to}>
            <Link to={to} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/5">
              <Icon size={22} className="text-accent" />
              <span className="flex-1">
                <span className="block font-medium">{label}</span>
                <span className="block text-xs text-zinc-500">{count}</span>
              </span>
              <ChevronRight size={18} className="text-zinc-600" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Playlists</h2>
        <button type="button" className="icon-btn" aria-label="Create playlist" onClick={() => useUi.setState({ createPlaylist: { trackIds: [] } })}>
          <Plus size={20} />
        </button>
      </div>
      {lib.playlists.length === 0 && <p className="text-sm text-zinc-500">No playlists yet.</p>}
      <ul>
        {lib.playlists.map((p) => (
          <li key={p.id}>
            <Link to={`/playlist/${p.id}`} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-white/8 text-zinc-400">
                <ListMusic size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block text-xs text-zinc-500">{plural(p.trackIds.length, "song")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
