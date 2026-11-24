import { useEffect, useRef, useState } from "react";
import { FolderOpen, Plus, Upload } from "lucide-react";
import { ACCEPT, filesFromDataTransfer } from "../lib/import";
import { runImport, useUi } from "../store/ui";
import { cn } from "../lib/cn";

export function pickFiles(folder = false) {
  document.getElementById("file-picker")?.remove();
  const input = document.createElement("input");
  input.id = "file-picker";
  input.type = "file";
  input.multiple = true;
  input.hidden = true;
  if (folder) input.webkitdirectory = true;
  else input.accept = ACCEPT;
  input.onchange = () => {
    runImport(Array.from(input.files ?? []));
    input.remove();
  };
  input.oncancel = () => input.remove();
  // Attached to the DOM: some browsers (older Safari) ignore clicks on detached inputs.
  document.body.append(input);
  input.click();
}

/** Full-window drop target shown while dragging files over the app. */
export function DropOverlay() {
  const [active, setActive] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current++;
      setActive(true);
    };
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setActive(false);
    };
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e) || !e.dataTransfer) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);
      runImport(await filesFromDataTransfer(e.dataTransfer));
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid animate-fade-in place-items-center bg-zinc-950/80 p-6 backdrop-blur-sm">
      <div className="grid w-full max-w-lg place-items-center gap-3 rounded-3xl border-2 border-dashed border-accent/70 bg-accent/10 px-8 py-16 text-center">
        <Upload size={40} className="text-accent" />
        <p className="text-xl font-semibold">Drop to add to your library</p>
        <p className="text-sm text-zinc-400">Files and folders both work</p>
      </div>
    </div>
  );
}

export function ImportButtons({ className, compact }: { className?: string; compact?: boolean }) {
  const importing = useUi((s) => s.importing);
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button type="button" className="btn-primary" disabled={!!importing} onClick={() => pickFiles()}>
        <Plus size={18} /> {compact ? "Add" : "Add music"}
      </button>
      <button type="button" className="btn-ghost" disabled={!!importing} onClick={() => pickFiles(true)}>
        <FolderOpen size={18} /> {compact ? "Folder" : "Add a folder"}
      </button>
    </div>
  );
}
