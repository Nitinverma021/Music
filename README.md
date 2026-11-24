# Musicsite

A fast, private, offline-first music player for **your own** music files.
Add songs or whole folders. They're stored in your browser (IndexedDB), never uploaded, and play offline.

## Features

- **Import** files or folders via button or drag-and-drop; reads tags (title, artist, album, track #, year) and embedded cover art
- **Library**: Songs (sort and filter), Albums, Artists, Liked Songs, Playlists, global Search
- **Player**: queue with drag-to-reorder, play next / add to queue, shuffle, repeat (off / all / one), seek, volume
- **Full-screen "Now Playing"** view tinted with the album art's colour
- **Resumes** where you left off (queue, song and position) after a reload
- **Keyboard shortcuts** (press `?` in the app), lock-screen and media-key controls (Media Session API)
- **Installable PWA** that works offline
- Responsive: sidebar on desktop, bottom tabs and mini-player on mobile
- Accessible: real buttons, labels, focus rings, keyboard-navigable menus and dialogs, reduced-motion support
- Virtualized song lists, so libraries with thousands of tracks stay smooth

## Tech stack

| Area | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| State | Zustand (player state persisted to `localStorage`) |
| Storage | Dexie (IndexedDB) for audio files, covers, tracks, playlists |
| Metadata | `music-metadata` (lazy-loaded only when importing) |
| Routing | React Router (hash routing, works on any static host) |
| Lists | `@tanstack/react-virtual` |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest |

## Getting started

```sh
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests (queue / shuffle / repeat logic) |
| `npm run typecheck` | TypeScript only |

## Deploying

`npm run build` produces a fully static `dist/` folder. Upload it to Netlify, Vercel, Cloudflare Pages or GitHub Pages; no server config is needed (hash routing, relative paths).

## Project structure

```
src/
  audio/engine.ts      The single <audio> element; syncs with the store, Media Session, resume
  store/player.ts      Queue, playback, volume, shuffle/repeat (Zustand, persisted)
  store/ui.ts          Menus, dialogs, import progress
  lib/queue.ts         Pure queue logic (unit-tested in queue.test.ts)
  lib/db.ts            IndexedDB schema + library operations
  lib/import.ts        File import, tag/cover parsing, folder walking
  lib/library.tsx      Live library context: tracks, albums, artists, playlists
  components/          Player bar, Now Playing, queue, track list, menus, dialogs, nav
  pages/               Home, Songs, Albums/Album, Artists/Artist, Liked, Playlists, Search, Settings
```

## Notes

- Audio files are never committed (see `.gitignore`). Only use music you have the rights to.
- The library lives in the browser profile it was added from. Clearing site data removes it.
