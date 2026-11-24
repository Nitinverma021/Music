import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Playlist, type Track } from "./db";
import { usePlayer } from "../store/player";

export interface Album {
  id: string;
  title: string;
  artist: string;
  year?: number;
  coverId?: string;
  tracks: Track[];
  duration: number;
  addedAt: number;
}

export interface Artist {
  id: string;
  name: string;
  coverId?: string;
  tracks: Track[];
  albums: Album[];
}

interface Library {
  loaded: boolean;
  tracks: Track[];
  byId: Map<string, Track>;
  albums: Album[];
  albumById: Map<string, Album>;
  artists: Artist[];
  artistById: Map<string, Artist>;
  playlists: Playlist[];
}

const Ctx = createContext<Library | null>(null);

/** base64url: only [A-Za-z0-9_-], so the id survives any URL encoding/decoding the router does. */
function base64url(text: string) {
  let bin = "";
  for (const byte of new TextEncoder().encode(text)) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Album artist and title are joined with a NUL (which can't appear in tags) and base64url-encoded:
// unique per album, and safe for names with "/", "%", "|", "#", "?" and the like.
export const albumId = (t: Pick<Track, "album" | "albumArtist">) =>
  base64url(`${t.albumArtist.toLowerCase()}\u0000${t.album.toLowerCase()}`);
export const artistId = (name: string) => encodeURIComponent(name.toLowerCase());

const byTrackNo = (a: Track, b: Track) =>
  (a.discNo ?? 1) - (b.discNo ?? 1) || (a.trackNo ?? 999) - (b.trackNo ?? 999) || a.title.localeCompare(b.title);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const tracks = useLiveQuery(() => db.tracks.orderBy("title").toArray(), []);
  const playlists = useLiveQuery(() => db.playlists.orderBy("updatedAt").reverse().toArray(), []);

  const value = useMemo<Library>(() => {
    const list = tracks ?? [];
    const byId = new Map(list.map((t) => [t.id, t]));

    const albumMap = new Map<string, Album>();
    for (const t of list) {
      const id = albumId(t);
      let a = albumMap.get(id);
      if (!a) {
        a = { id, title: t.album, artist: t.albumArtist, year: t.year, coverId: t.coverId, tracks: [], duration: 0, addedAt: 0 };
        albumMap.set(id, a);
      }
      a.tracks.push(t);
      a.duration += t.duration;
      a.addedAt = Math.max(a.addedAt, t.addedAt);
      a.coverId ??= t.coverId;
      a.year ??= t.year;
    }
    const albums = [...albumMap.values()].sort((a, b) => a.title.localeCompare(b.title));
    albums.forEach((a) => a.tracks.sort(byTrackNo));
    // Album links from before ids encoded each part separately ("artist|album" as one string) keep working.
    const albumById = new Map(albumMap);
    for (const a of albums) {
      const legacy = encodeURIComponent(`${a.artist}|${a.title}`.toLowerCase());
      if (!albumById.has(legacy)) albumById.set(legacy, a);
    }

    const artistMap = new Map<string, Artist>();
    for (const t of list) {
      const id = artistId(t.artist);
      let ar = artistMap.get(id);
      if (!ar) {
        ar = { id, name: t.artist, coverId: t.coverId, tracks: [], albums: [] };
        artistMap.set(id, ar);
      }
      ar.tracks.push(t);
      ar.coverId ??= t.coverId;
    }
    for (const a of albums) {
      const ar = artistMap.get(artistId(a.artist));
      if (ar) ar.albums.push(a);
    }
    const artists = [...artistMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    return {
      loaded: tracks !== undefined && playlists !== undefined,
      tracks: list,
      byId,
      albums,
      albumById,
      artists,
      artistById: artistMap,
      playlists: playlists ?? [],
    };
  }, [tracks, playlists]);

  // Drop queue entries for songs that no longer exist: deleted in another tab, or while the app was closed.
  useEffect(() => {
    if (!value.loaded) return;
    const missing = new Set(usePlayer.getState().queue.map((i) => i.trackId).filter((id) => !value.byId.has(id)));
    if (missing.size) usePlayer.getState().removeTracks([...missing]);
  }, [value]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Route params arrive decoded; map keys are encoded. Tolerates either. */
export function lookup<T>(map: Map<string, T>, param: string): T | undefined {
  return map.get(encodeURIComponent(param)) ?? map.get(encodeURIComponent(param.toLowerCase())) ?? map.get(param);
}

export function useLibrary() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return v;
}
