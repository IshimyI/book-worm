const KEY = 'bw_recently_viewed';
const MAX_ITEMS = 8;

export function addRecentlyViewed(book) {
  if (!book?.id) return;
  try {
    const existing = getRecentlyViewed().filter((b) => b.id !== book.id);
    const next = [{ id: book.id, title: book.title, img: book.img, rating: book.rating }, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota) — not worth surfacing.
  }
}

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
