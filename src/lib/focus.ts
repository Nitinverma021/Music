import type { KeyboardEvent } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** onKeyDown handler that keeps Tab / Shift+Tab inside the element (for full-screen, modal layers). */
export function trapFocus(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab") return;
  const root = e.currentTarget;
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden", // skip hidden / invisible controls
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !root.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/** True below Tailwind's `md` breakpoint, where panels like the queue cover the whole screen. */
export const isFullScreenLayout = () => window.matchMedia("(max-width: 767.98px)").matches;
