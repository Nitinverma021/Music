import { useEffect, useState, useSyncExternalStore } from "react";
import { HashRouter, Route, Routes, useLocation, useParams } from "react-router";
import { Toaster } from "sonner";
import { LibraryProvider } from "./lib/library";
import { ScrollContext } from "./lib/scroll";
import { useShortcuts } from "./lib/shortcuts";
import { Sidebar, MobileNav } from "./components/Nav";
import { PlayerBar } from "./components/PlayerBar";
import { NowPlaying } from "./components/NowPlaying";
import { QueuePanel } from "./components/QueuePanel";
import { TrackMenuHost } from "./components/TrackMenu";
import { Dialogs } from "./components/Dialogs";
import { DropOverlay } from "./components/Import";
import { Home } from "./pages/Home";
import { Songs } from "./pages/Songs";
import { Album, Albums, Artist, Artists, Liked, PlaylistPage, Playlists } from "./pages/Collections";
import { Search } from "./pages/Search";
import { LibraryPage } from "./pages/LibraryPage";
import { Settings } from "./pages/Settings";

// Below `md` the mini-player + bottom tabs are ~150px tall. Sonner's own `mobileOffset`
// only kicks in under 600px, so pick the offset from our breakpoint instead.
const compactQuery = typeof window !== "undefined" ? window.matchMedia("(max-width: 767.98px)") : undefined;
const subscribeCompact = (cb: () => void) => {
  compactQuery?.addEventListener("change", cb);
  return () => compactQuery?.removeEventListener("change", cb);
};

export default function App() {
  const compact = useSyncExternalStore(subscribeCompact, () => !!compactQuery?.matches);
  return (
    <HashRouter>
      <LibraryProvider>
        <Shell />
        <NowPlaying />
        <TrackMenuHost />
        <Dialogs />
        <DropOverlay />
        <Toaster
          theme="dark"
          position="bottom-center"
          offset={{ bottom: compact ? 150 : 104 }}
          mobileOffset={{ bottom: 150 }}
          richColors
          closeButton
          toastOptions={{ className: "!rounded-xl" }}
        />
      </LibraryProvider>
    </HashRouter>
  );
}

/** Remount per playlist so state like an open rename box can't carry over to another playlist. */
function KeyedPlaylistPage() {
  const { id } = useParams();
  return <PlaylistPage key={id} />;
}

function Shell() {
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const location = useLocation();
  useShortcuts();

  // Scroll to top on navigation.
  useEffect(() => {
    scrollEl?.scrollTo({ top: 0 });
  }, [location.pathname, scrollEl]);

  return (
    <div className="flex h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-zinc-950" onClick={(e) => { e.preventDefault(); scrollEl?.focus(); }}>
        Skip to content
      </a>
      <div className="flex min-h-0 flex-1 gap-2 md:p-2">
        <Sidebar />
        <main
          id="main"
          ref={setScrollEl}
          tabIndex={-1}
          className="scroll-area relative min-w-0 flex-1 overflow-y-auto bg-gradient-to-b from-surface to-zinc-950 outline-none md:rounded-xl"
        >
          <div className="min-h-full px-4 py-4 md:px-8 md:py-6">
            <ScrollContext.Provider value={scrollEl}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/songs" element={<Songs />} />
                <Route path="/albums" element={<Albums />} />
                <Route path="/album/:id" element={<Album />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/artist/:id" element={<Artist />} />
                <Route path="/liked" element={<Liked />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlist/:id" element={<KeyedPlaylistPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<p className="py-20 text-center text-zinc-400">Page not found.</p>} />
              </Routes>
            </ScrollContext.Provider>
          </div>
        </main>
        <QueuePanel />
      </div>
      <PlayerBar />
      <MobileNav />
    </div>
  );
}
