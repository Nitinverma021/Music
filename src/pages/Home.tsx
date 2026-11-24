import { Disc3, Heart, Music2, Shuffle, Sparkles, WifiOff, Lock, Upload } from "lucide-react";
import { Link } from "react-router";
import { albumId, useLibrary } from "../lib/library";
import { greeting, plural } from "../lib/format";
import { usePlayer } from "../store/player";
import { Card, CardGrid, Section } from "../components/Page";
import { Cover } from "../components/Cover";
import { ImportButtons } from "../components/Import";

export function Home() {
  const lib = useLibrary();
  const playTracks = usePlayer((s) => s.playTracks);

  if (!lib.loaded) return null;
  if (!lib.tracks.length) return <Welcome />;

  const recentlyPlayed = lib.tracks
    .filter((t) => t.lastPlayedAt)
    .sort((a, b) => b.lastPlayedAt! - a.lastPlayedAt!)
    .slice(0, 6);
  const recentAlbums = [...lib.albums].sort((a, b) => b.addedAt - a.addedAt).slice(0, 12);
  const liked = lib.tracks.filter((t) => t.liked);
  const mostPlayed = lib.tracks
    .filter((t) => t.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 12);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 pt-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{greeting()}</h1>
        <button type="button" className="btn-ghost" onClick={() => playTracks(lib.tracks.map((t) => t.id), 0, { shuffle: true })}>
          <Shuffle size={16} /> Shuffle all
        </button>
      </div>

      {/* Quick picks */}
      <div className="mb-10 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <QuickTile to="/liked" label="Liked Songs" icon={<Heart size={22} className="fill-current" />} onPlay={liked.length ? () => playTracks(liked.map((t) => t.id)) : undefined} />
        <QuickTile to="/songs" label={`All songs · ${lib.tracks.length}`} icon={<Music2 size={22} />} onPlay={() => playTracks(lib.tracks.map((t) => t.id))} />
        {recentlyPlayed.slice(0, 4).map((t) => (
          <QuickTile
            key={t.id}
            to={`/album/${albumId(t)}`}
            label={t.title}
            cover={<Cover coverId={t.coverId} seed={t.album} className="size-14 rounded-none" />}
            onPlay={() => playTracks([t.id])}
          />
        ))}
      </div>

      {recentAlbums.length > 0 && (
        <Section title="Recently added" to="/albums">
          <CardGrid>
            {recentAlbums.map((a) => (
              <Card
                key={a.id}
                to={`/album/${a.id}`}
                title={a.title}
                subtitle={a.artist}
                coverId={a.coverId}
                seed={a.title}
                onPlay={() => playTracks(a.tracks.map((t) => t.id))}
              />
            ))}
          </CardGrid>
        </Section>
      )}

      {mostPlayed.length > 0 && (
        <Section title="On repeat" to="/songs">
          <CardGrid>
            {mostPlayed.map((t, i) => (
              <Card
                key={t.id}
                to={`/album/${albumId(t)}`}
                title={t.title}
                subtitle={`${t.artist} · ${plural(t.playCount, "play")}`}
                coverId={t.coverId}
                seed={t.album}
                onPlay={() => playTracks(mostPlayed.map((m) => m.id), i)}
              />
            ))}
          </CardGrid>
        </Section>
      )}
    </div>
  );
}

function QuickTile({
  to,
  label,
  icon,
  cover,
  onPlay,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  cover?: React.ReactNode;
  onPlay?: () => void;
}) {
  return (
    <div className="group relative flex h-14 items-center overflow-hidden rounded-md bg-white/6 transition-colors hover:bg-white/12">
      {cover ?? (
        <div className="grid size-14 shrink-0 place-items-center bg-gradient-to-br from-accent to-accent-strong text-white">{icon}</div>
      )}
      <Link to={to} className="min-w-0 flex-1 truncate px-4 text-sm font-semibold after:absolute after:inset-0">
        {label}
      </Link>
      {onPlay && (
        <button
          type="button"
          aria-label={`Play ${label}`}
          className="relative z-10 mr-2 grid size-9 place-items-center rounded-full bg-accent text-zinc-950 opacity-0 shadow-lg transition group-hover:opacity-100 focus-visible:opacity-100"
          onClick={onPlay}
        >
          <svg viewBox="0 0 24 24" className="size-4 translate-x-[1px] fill-current" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Welcome() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 rounded-full bg-accent/30 blur-3xl" />
        <div className="grid size-24 place-items-center rounded-3xl bg-gradient-to-br from-accent to-accent-strong shadow-2xl shadow-accent/30">
          <Disc3 size={48} className="text-white" />
        </div>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Your music, your way</h1>
      <p className="mt-4 max-w-md text-zinc-400">
        Add songs from your device to build your library. Everything stays private in your browser and plays offline.
      </p>
      <ImportButtons className="mt-8 justify-center" />
      <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
        <Upload size={14} /> Or drag and drop files or folders anywhere
      </p>

      <ul className="mt-14 grid w-full gap-4 text-left sm:grid-cols-3">
        {[
          { icon: Lock, title: "Private", body: "Files never leave your device. No account needed." },
          { icon: WifiOff, title: "Works offline", body: "Install it as an app and play anywhere." },
          { icon: Sparkles, title: "Smart library", body: "Reads tags and artwork to sort albums & artists." },
        ].map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-xl bg-surface p-4">
            <Icon size={20} className="text-accent" />
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-zinc-400">{body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-zinc-600">Supports MP3, M4A/AAC, FLAC, OGG, Opus and WAV (depending on your browser).</p>
    </div>
  );
}
