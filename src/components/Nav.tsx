import { NavLink } from "react-router";
import { Disc3, Heart, Home, Library, ListMusic, MicVocal, Music2, Plus, Search, Settings } from "lucide-react";
import { useLibrary } from "../lib/library";
import { plural } from "../lib/format";
import { cn } from "../lib/cn";
import { useUi } from "../store/ui";
import { pickFiles } from "./Import";

const main = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
];
const library = [
  { to: "/songs", label: "Songs", icon: Music2 },
  { to: "/albums", label: "Albums", icon: Disc3 },
  { to: "/artists", label: "Artists", icon: MicVocal },
  { to: "/liked", label: "Liked Songs", icon: Heart },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5",
  );

export function Sidebar() {
  const { playlists } = useLibrary();
  return (
    <nav aria-label="Main" className="hidden w-60 shrink-0 flex-col gap-2 md:flex lg:w-64">
      <div className="rounded-xl bg-surface p-2">
        <div className="flex items-center gap-2 px-3 pb-3 pt-2">
          <img src="icon.svg" alt="" className="size-7" />
          <span className="text-lg font-bold tracking-tight">Musicsite</span>
        </div>
        {main.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-surface p-2">
        <p className="flex items-center gap-2 px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Library size={14} /> Library
        </p>
        {library.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}

        <div className="mt-4 flex items-center justify-between px-3 pb-1">
          <NavLink to="/playlists" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-200">
            Playlists
          </NavLink>
          <button
            type="button"
            className="icon-btn size-7"
            aria-label="Create playlist"
            title="Create playlist"
            onClick={() => useUi.setState({ createPlaylist: { trackIds: [] } })}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="scroll-area -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {playlists.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">No playlists yet</p>}
          {playlists.map((p) => (
            <NavLink key={p.id} to={`/playlist/${p.id}`} className={linkClass}>
              <span className="grid size-8 shrink-0 place-items-center rounded bg-white/8 text-zinc-400">
                <ListMusic size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate">{p.name}</span>
                <span className="block text-xs font-normal text-zinc-500">{plural(p.trackIds.length, "song")}</span>
              </span>
            </NavLink>
          ))}
        </div>

        <div className="mt-2 flex gap-1 border-t border-white/8 pt-2">
          <button type="button" className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-100" onClick={() => pickFiles()}>
            <Plus size={18} /> Add music
          </button>
          <NavLink to="/settings" className={({ isActive }) => cn("icon-btn", isActive && "text-white")} aria-label="Settings" title="Settings">
            <Settings size={18} />
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

const mobile = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  return (
    <nav aria-label="Main" className="grid grid-cols-4 border-t border-white/8 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {mobile.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn("flex flex-col items-center gap-1 py-2 text-[11px] font-medium", isActive ? "text-white" : "text-zinc-500")
          }
        >
          <Icon size={22} /> {label}
        </NavLink>
      ))}
    </nav>
  );
}
