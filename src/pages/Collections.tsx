import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Check, Heart, ListMusic, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { lookup, useLibrary } from "../lib/library";
import { db } from "../lib/db";
import { formatTotal, plural } from "../lib/format";
import { usePlayer } from "../store/player";
import { useUi } from "../store/ui";
import { Card, CardGrid, Hero, PageTitle, PlayActions, Section } from "../components/Page";
import { TrackList } from "../components/TrackList";

function NotFound({ what }: { what: string }) {
  return <p className="py-20 text-center text-zinc-400">This {what} doesn't exist (anymore).</p>;
}

export function Albums() {
  const { albums } = useLibrary();
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <div>
      <PageTitle title="Albums" subtitle={plural(albums.length, "album")} />
      {!albums.length && <p className="py-10 text-center text-sm text-zinc-500">No albums yet.</p>}
      <CardGrid>
        {albums.map((a) => (
          <Card
            key={a.id}
            to={`/album/${a.id}`}
            title={a.title}
            subtitle={[a.artist, a.year].filter(Boolean).join(" · ")}
            coverId={a.coverId}
            seed={a.title}
            onPlay={() => playTracks(a.tracks.map((t) => t.id))}
          />
        ))}
      </CardGrid>
    </div>
  );
}

export function Album() {
  const { id = "" } = useParams();
  const lib = useLibrary();
  const album = lookup(lib.albumById, id);
  if (!lib.loaded) return null;
  if (!album) return <NotFound what="album" />;
  return (
    <div>
      <Hero
        kind="Album"
        title={album.title}
        coverId={album.coverId}
        seed={album.title}
        meta={
          <>
            <span className="font-semibold text-white">{album.artist}</span>
            {album.year && <> · {album.year}</>} · {plural(album.tracks.length, "song")} · {formatTotal(album.duration)}
          </>
        }
      />
      <PlayActions trackIds={album.tracks.map((t) => t.id)} />
      <TrackList tracks={album.tracks} albumMode showAlbum={false} />
    </div>
  );
}

export function Artists() {
  const { artists } = useLibrary();
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <div>
      <PageTitle title="Artists" subtitle={plural(artists.length, "artist")} />
      {!artists.length && <p className="py-10 text-center text-sm text-zinc-500">No artists yet.</p>}
      <CardGrid>
        {artists.map((a) => (
          <Card
            key={a.id}
            to={`/artist/${a.id}`}
            title={a.name}
            subtitle={plural(a.tracks.length, "song")}
            coverId={a.coverId}
            seed={a.name}
            round
            onPlay={() => playTracks(a.tracks.map((t) => t.id))}
          />
        ))}
      </CardGrid>
    </div>
  );
}

export function Artist() {
  const { id = "" } = useParams();
  const lib = useLibrary();
  const playTracks = usePlayer((s) => s.playTracks);
  const artist = lookup(lib.artistById, id);
  if (!lib.loaded) return null;
  if (!artist) return <NotFound what="artist" />;
  const popular = [...artist.tracks].sort((a, b) => b.playCount - a.playCount || a.title.localeCompare(b.title));
  return (
    <div>
      <Hero
        kind="Artist"
        title={artist.name}
        coverId={artist.coverId}
        seed={artist.name}
        round
        meta={`${plural(artist.tracks.length, "song")} · ${plural(artist.albums.length, "album")}`}
      />
      <PlayActions trackIds={popular.map((t) => t.id)} />
      <Section title="Songs">
        <TrackList tracks={popular} />
      </Section>
      {artist.albums.length > 0 && (
        <Section title="Albums">
          <CardGrid>
            {artist.albums.map((a) => (
              <Card
                key={a.id}
                to={`/album/${a.id}`}
                title={a.title}
                subtitle={a.year ? String(a.year) : plural(a.tracks.length, "song")}
                coverId={a.coverId}
                seed={a.title}
                onPlay={() => playTracks(a.tracks.map((t) => t.id))}
              />
            ))}
          </CardGrid>
        </Section>
      )}
    </div>
  );
}

export function Liked() {
  const { tracks } = useLibrary();
  const liked = tracks.filter((t) => t.liked);
  return (
    <div>
      <Hero
        kind="Playlist"
        title="Liked Songs"
        seed="liked"
        icon={<Heart size={72} className="fill-white text-white" />}
        meta={`${plural(liked.length, "song")} · ${formatTotal(liked.reduce((s, t) => s + t.duration, 0))}`}
      />
      <PlayActions trackIds={liked.map((t) => t.id)} />
      <TrackList tracks={liked} emptyText="Songs you like will appear here. Tap the ♥ on any song." />
    </div>
  );
}

export function Playlists() {
  const { playlists, byId } = useLibrary();
  const playTracks = usePlayer((s) => s.playTracks);
  return (
    <div>
      <PageTitle
        title="Playlists"
        subtitle={plural(playlists.length, "playlist")}
        actions={
          <button type="button" className="btn-primary" onClick={() => useUi.setState({ createPlaylist: { trackIds: [] } })}>
            <Plus size={18} /> New playlist
          </button>
        }
      />
      {!playlists.length && <p className="py-10 text-center text-sm text-zinc-500">Create a playlist to group your favourite songs.</p>}
      <CardGrid>
        {playlists.map((p) => {
          const first = p.trackIds.map((id) => byId.get(id)).find((t) => t?.coverId);
          return (
            <Card
              key={p.id}
              to={`/playlist/${p.id}`}
              title={p.name}
              subtitle={plural(p.trackIds.length, "song")}
              coverId={first?.coverId}
              seed={p.name}
              onPlay={p.trackIds.length ? () => playTracks(p.trackIds.filter((id) => byId.has(id))) : undefined}
            />
          );
        })}
      </CardGrid>
    </div>
  );
}

export function PlaylistPage() {
  const { id = "" } = useParams();
  const lib = useLibrary();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const playlist = lib.playlists.find((p) => p.id === id);
  if (!lib.loaded) return null;
  if (!playlist) return <NotFound what="playlist" />;

  const tracks = playlist.trackIds.map((tid) => lib.byId.get(tid)).filter((t) => !!t);
  const coverId = tracks.find((t) => t.coverId)?.coverId;

  const save = async () => {
    const n = name.trim();
    if (n) await db.playlists.update(playlist.id, { name: n, updatedAt: Date.now() });
    setEditing(false);
  };

  return (
    <div>
      <Hero
        kind="Playlist"
        title={playlist.name}
        coverId={coverId}
        seed={playlist.name}
        icon={coverId ? undefined : <ListMusic size={72} className="text-white/80" />}
        meta={`${plural(tracks.length, "song")} · ${formatTotal(tracks.reduce((s, t) => s + t.duration, 0))}`}
      />
      <PlayActions trackIds={tracks.map((t) => t.id)}>
        {editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <input className="input w-56" autoFocus value={name} maxLength={100} aria-label="Playlist name" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setEditing(false)} />
            <button type="submit" className="icon-btn" aria-label="Save name">
              <Check size={18} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="icon-btn size-11"
            aria-label="Rename playlist"
            title="Rename"
            onClick={() => {
              setName(playlist.name);
              setEditing(true);
            }}
          >
            <Pencil size={18} />
          </button>
        )}
        <button
          type="button"
          className="icon-btn size-11"
          aria-label="Delete playlist"
          title="Delete playlist"
          onClick={() =>
            useUi.setState({
              confirm: {
                title: "Delete playlist?",
                body: `“${playlist.name}” will be deleted. The songs stay in your library.`,
                action: "Delete",
                onConfirm: async () => {
                  await db.playlists.delete(playlist.id);
                  toast("Playlist deleted");
                  navigate("/playlists");
                },
              },
            })
          }
        >
          <Trash2 size={18} />
        </button>
      </PlayActions>
      <TrackList tracks={tracks} playlistId={playlist.id} emptyText="This playlist is empty. Right-click a song (or use ⋯) and choose “Add to playlist”." />
    </div>
  );
}
