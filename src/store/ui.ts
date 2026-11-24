import { create } from "zustand";
import { toast } from "sonner";
import { importFiles } from "../lib/import";
import { plural } from "../lib/format";

export type TrackMenuContext = { playlistId?: string; playlistIndex?: number; queueKey?: string };

interface MenuState {
  x: number;
  y: number;
  trackIds: string[];
  context?: TrackMenuContext;
}

interface UiState {
  menu: MenuState | null;
  addToPlaylist: string[] | null;
  createPlaylist: { trackIds: string[] } | null;
  confirm: { title: string; body: string; action: string; onConfirm: () => void } | null;
  shortcutsOpen: boolean;
  importing: { done: number; total: number } | null;

  openMenu: (m: MenuState) => void;
  closeMenu: () => void;
  set: (p: Partial<UiState>) => void;
}

export const useUi = create<UiState>((set) => ({
  menu: null,
  addToPlaylist: null,
  createPlaylist: null,
  confirm: null,
  shortcutsOpen: false,
  importing: null,
  openMenu: (menu) => set({ menu }),
  closeMenu: () => set({ menu: null }),
  set: (p) => set(p),
}));

export async function runImport(files: File[]) {
  if (!files.length) return;
  if (useUi.getState().importing) {
    toast("An import is already running");
    return;
  }
  const id = toast.loading("Reading your music…");
  useUi.setState({ importing: { done: 0, total: files.length } });
  try {
    const r = await importFiles(files, (done, total) => {
      useUi.setState({ importing: { done, total } });
      toast.loading(`Importing ${done} of ${total}…`, { id });
    });
    const parts = [];
    if (r.skipped) parts.push(`${plural(r.skipped, "file")} skipped (duplicates or not audio)`);
    if (r.failed.length) parts.push(`${r.failed.length} couldn't be read`);
    if (r.added) toast.success(`Added ${plural(r.added, "song")}`, { id, description: parts.join(" · ") || undefined });
    else if (r.failed.length) toast.error("Couldn't import those files", { id, description: parts.join(" · ") });
    else toast.info("Nothing new to add", { id, description: parts.join(" · ") || undefined });
  } catch (err) {
    console.error(err);
    const quota = err instanceof Error && /quota/i.test(err.name + err.message);
    toast.error(quota ? "Your browser ran out of storage space" : "Import failed", { id });
  } finally {
    useUi.setState({ importing: null });
  }
}
