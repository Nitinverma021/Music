import { useEffect, useState } from "react";
import { db } from "./db";

export interface CoverInfo {
  url?: string;
  /** "r g b" */
  color?: string;
}

const resolved = new Map<string, CoverInfo>();
const pending = new Map<string, Promise<CoverInfo>>();

export function loadCover(id: string): Promise<CoverInfo> {
  const hit = resolved.get(id);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(id);
  if (!p) {
    p = db.covers.get(id).then((c) => {
      const info: CoverInfo = c ? { url: URL.createObjectURL(c.blob), color: c.color } : {};
      resolved.set(id, info);
      pending.delete(id);
      return info;
    });
    pending.set(id, p);
  }
  return p;
}

/** Object URL + dominant colour for a cover; cached for the session. */
export function useCover(id?: string): CoverInfo {
  const [info, setInfo] = useState<CoverInfo>(() => (id && resolved.get(id)) || {});
  useEffect(() => {
    if (!id) {
      setInfo({});
      return;
    }
    const hit = resolved.get(id);
    if (hit) {
      setInfo(hit);
      return;
    }
    let alive = true;
    loadCover(id).then((i) => alive && setInfo(i));
    return () => {
      alive = false;
    };
  }, [id]);
  return info;
}

/** Stable gradient for items without artwork. */
export function placeholderGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, oklch(0.45 0.12 ${hue}), oklch(0.25 0.08 ${(hue + 60) % 360}))`;
}
