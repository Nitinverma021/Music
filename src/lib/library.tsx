import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Playlist, type Track } from "./db";

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

export const albumId = (t: Pick<Track, "album" | "albumArtist">) =>
  encodeURIComponent(`${t.albumArtist}|${t.album}`.toLowerCase());
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
      albumById: albumMap,
      artists,
      artistById: artistMap,
      playlists: playlists ?? [],
    };
  }, [tracks, playlists]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Route params arrive decoded; map keys are encoded. Tolerates either. */
export function lookup<T>(map: Map<string, T>, param: string): T | undefined {
  return map.get(encodeURIComponent(param.toLowerCase())) ?? map.get(param);
}

export function useLibrary() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return v;
}
