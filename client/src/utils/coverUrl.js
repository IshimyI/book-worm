// Every cover is hotlinked straight from Open Library — an outage or a
// slow response on their end shows up as a broken/late image here, even
// though this site's own uptime is fine. Route Open Library URLs through
// the server's cover-cache endpoint (server/src/utils/coverCache.js),
// which fetches each cover once and serves it from disk afterwards, so
// image loads stop depending on a CDN this site doesn't control.
function proxyOpenLibrary(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "covers.openlibrary.org") return url;
    return `${import.meta.env.VITE_TARGET}/api/v1/cover-cache?src=${encodeURIComponent(url)}`;
  } catch {
    // Not an absolute URL (e.g. "./default.jpg") — nothing to proxy.
    return url;
  }
}

// Full-size cover, proxied if it's an Open Library URL. Use this for any
// <Image src={book.img}> that bypasses coverThumbUrl below.
export function coverUrl(url) {
  if (!url) return url;
  return proxyOpenLibrary(url);
}

// Open Library serves covers at -S/-M/-L. Seed data stores the full-size
// -L URL for every book regardless of where it's displayed, so a 150px-wide
// grid thumbnail downloads the same file as the 250px detail-page hero.
// Swap to -M for anything rendered small enough that the difference isn't
// visible, since -M is a small fraction of -L's file size.
export function coverThumbUrl(url) {
  if (!url) return url;
  const resized = url.replace(/-L\.jpg(\?.*)?$/, "-M.jpg$1");
  return proxyOpenLibrary(resized);
}
