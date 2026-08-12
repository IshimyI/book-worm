import { useEffect } from "react";

function setMeta(name, content, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Sets document.title + description/og meta tags for as long as the
// calling page is mounted, restoring the previous title on unmount so
// navigating away doesn't leave a stale tab title behind.
export default function useSeoMeta({ title, description, image, enabled = true }) {
  useEffect(() => {
    if (!enabled || !title) return undefined;

    const defaultTitle = document.title;
    document.title = `${title} — Mr Book Worm`;
    if (description) {
      setMeta("description", description);
      setMeta("og:title", title, "property");
      setMeta("og:description", description, "property");
    }
    if (image) setMeta("og:image", image, "property");

    return () => {
      document.title = defaultTitle;
    };
  }, [title, description, image, enabled]);
}
