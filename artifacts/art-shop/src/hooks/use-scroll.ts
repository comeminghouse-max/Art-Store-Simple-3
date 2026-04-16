import { useEffect } from "react";
import { useLocation } from "wouter";

const SCROLL_KEY_PREFIX = "studio-scroll-";

export function useScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
}

export function saveScrollPosition(path: string) {
  sessionStorage.setItem(SCROLL_KEY_PREFIX + path, String(window.scrollY));
}

export function useScrollRestoration(isReady = true) {
  const [location] = useLocation();

  useEffect(() => {
    if (!isReady) return;

    const key = SCROLL_KEY_PREFIX + location;
    const saved = sessionStorage.getItem(key);

    if (saved !== null) {
      const y = parseInt(saved, 10);
      sessionStorage.removeItem(key);

      // Use two rAF passes to ensure the layout has painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, left: 0, behavior: "instant" });
        });
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location, isReady]);
}
