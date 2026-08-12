// Open Library serves covers at -S/-M/-L. Seed data stores the full-size
// -L URL for every book regardless of where it's displayed, so a 150px-wide
// grid thumbnail downloads the same file as the 250px detail-page hero.
// Swap to -M for anything rendered small enough that the difference isn't
// visible, since -M is a small fraction of -L's file size.
export function coverThumbUrl(url) {
  if (!url) return url;
  return url.replace(/-L\.jpg(\?.*)?$/, "-M.jpg$1");
}
