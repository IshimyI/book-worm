// Best-effort Open Library search for a cover/genre/year when an imported
// title isn't already in the catalog and the import has no image of its
// own to go on. Never throws — a failed or empty lookup just means the
// new (pending) book starts with the same placeholder cover a manually
// added book gets when no search result was picked.
async function searchOpenLibraryCover(title, author) {
  try {
    const q = new URLSearchParams({ q: `${title} ${author}`.trim(), limit: "1" });
    const response = await fetch(`https://openlibrary.org/search.json?${q}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const doc = data.docs?.[0];
    if (!doc) return null;
    return {
      img: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
      genre: Array.isArray(doc.subject) && doc.subject.length > 0 ? String(doc.subject[0]).slice(0, 40) : null,
      year: doc.first_publish_year || null,
    };
  } catch {
    return null;
  }
}

module.exports = { searchOpenLibraryCover };
