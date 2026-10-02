import { useEffect } from "react";

const PREFIX = "#host-";
const FLASH_MS = 1800;

function reducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Scroll to a host card, move focus there, and briefly highlight it. */
function reveal(id: string, scroll: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  if (scroll) el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  el.focus({ preventScroll: true });
  el.classList.remove("ix-flash");
  // Restart the animation even when the same card is chosen twice.
  void el.offsetWidth;
  el.classList.add("ix-flash");
  window.setTimeout(() => el.classList.remove("ix-flash"), FLASH_MS);
}

/**
 * In-page links to host cards (#host-<name>), from the diagram or anywhere
 * else on the page: smooth scroll (instant under reduced motion), focus the
 * card for keyboard users, and flash it so the eye lands on it. Also honours
 * a #host-… hash on first load, which the SPA renders after the browser's own
 * fragment scroll would have happened.
 */
export function useHostAnchors() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      if (!href || !href.startsWith(PREFIX)) return;
      const id = href.slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      if (window.location.hash !== href) history.pushState(null, "", href);
      reveal(id, true);
    }
    function onHash() {
      if (window.location.hash.startsWith(PREFIX)) reveal(window.location.hash.slice(1), true);
    }
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onHash);
    if (window.location.hash.startsWith(PREFIX)) {
      const t = window.setTimeout(onHash, 50);
      return () => {
        window.clearTimeout(t);
        document.removeEventListener("click", onClick);
        window.removeEventListener("popstate", onHash);
      };
    }
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onHash);
    };
  }, []);
}
