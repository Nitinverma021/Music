import { useDeferredValue, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { useLibrary } from "../lib/library";
import { usePlayer } from "../store/player";
import { Card, CardGrid, Section } from "../components/Page";
import { TrackList } from "../components/TrackList";
import { matches } from "./Songs";
import { plural } from "../lib/format";

export function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const q = useDeferredValue(query.trim().toLowerCase());
  const lib = useLibrary();
  const playTracks = usePlayer((s) => s.playTracks);

  const results = useMemo(() => {
    if (!q) return null;
    return {
      tracks: lib.tracks.filter((t) => matches(t, q)),
      albums: lib.albums.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
      artists: lib.artists.filter((a) => a.name.toLowerCase().includes(q)),
      playlists: lib.playlists.filter((p) => p.name.toLowerCase().includes(q)),
    };
  }, [q, lib]);

  const none = results && !results.tracks.length && !results.albums.length && !results.artists.length && !results.playlists.length;

  return (
    <div>
      <div className="sticky -top-4 z-20 -mx-4 bg-zinc-950/90 px-4 pb-4 pt-2 backdrop-blur md:-top-6 md:-mx-8 md:px-8">
        <label className="relative block max-w-xl">
          <span className="sr-only">Search your library</span>
          <SearchIcon size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="search-input"
            type="search"
            autoFocus
            autoComplete="off"
            className="input h-12 pl-12 pr-12 text-base [&::-webkit-search-cancel-button]:hidden"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
          {query && (
            <button type="button" className="icon-btn absolute right-2 top-1/2 -translate-y-1/2" aria-label="Clear search" onClick={() => setParams({}, { replace: true })}>
              <X size={18} />
            </button>
          )}
        </label>
      </div>

      {!results && (
        <div className="py-16 text-center text-zinc-500">
          <SearchIcon size={40} className="mx-auto mb-4 opacity-40" />
          <p>Search songs, albums, artists and playlists.</p>
          <p className="mt-1 text-sm">Tip: press <kbd className="rounded border border-white/15 px-1.5">/</kbd> anywhere to jump here.</p>
        </div>
      )}
      {none && <p className="py-16 text-center text-zinc-400">No results for “{query}”.</p>}

      {results && !none && (
        <div aria-live="polite">
          {results.tracks.length > 0 && (
            <Section title={`Songs · ${results.tracks.length}`}>
              <TrackList tracks={results.tracks.slice(0, 200)} />
            </Section>
          )}
          {results.artists.length > 0 && (
            <Section title="Artists">
              <CardGrid>
                {results.artists.slice(0, 12).map((a) => (
                  <Card key={a.id} to={`/artist/${a.id}`} title={a.name} subtitle="Artist" coverId={a.coverId} seed={a.name} round onPlay={() => playTracks(a.tracks.map((t) => t.id))} />
                ))}
              </CardGrid>
            </Section>
          )}
          {results.albums.length > 0 && (
            <Section title="Albums">
              <CardGrid>
                {results.albums.slice(0, 12).map((a) => (
                  <Card key={a.id} to={`/album/${a.id}`} title={a.title} subtitle={a.artist} coverId={a.coverId} seed={a.title} onPlay={() => playTracks(a.tracks.map((t) => t.id))} />
                ))}
              </CardGrid>
            </Section>
          )}
          {results.playlists.length > 0 && (
            <Section title="Playlists">
              <CardGrid>
                {results.playlists.slice(0, 12).map((p) => (
                  <Card key={p.id} to={`/playlist/${p.id}`} title={p.name} subtitle={plural(p.trackIds.length, "song")} seed={p.name} />
                ))}
              </CardGrid>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
