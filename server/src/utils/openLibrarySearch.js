// Best-effort Open Library search for a cover/genre/year when an imported
// title isn't already in the catalog and the import has no image of its
// own to go on. Never throws — a failed or empty lookup just means the
// new (pending) book starts with the same placeholder cover a manually
// added book gets when no search result was picked.
async function runSearch(q) {
  // isbn (and, harmlessly, the other fields already used below) has to be
  // requested explicitly — Open Library's default/compact response omits
  // it entirely, silently, regardless of whether the underlying record
  // actually has any.
  const params = new URLSearchParams({
    q,
    limit: "5",
    fields: "title,author_name,subject,first_publish_year,cover_i,isbn",
  });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.docs?.length ? data.docs : null;
}

async function searchOpenLibraryCover(title, author) {
  try {
    let docs = await runSearch(`${title} ${author}`.trim());
    // A combined title+author query sometimes finds nothing at all — e.g.
    // a numeric/short title ("1984") alongside a Cyrillic author name this
    // catalog stores transliterated doesn't match Open Library's own
    // "George Orwell" — fall back to title alone rather than give up.
    // Slightly weaker match (a very generic title could pick the wrong
    // book), but this is already best-effort enrichment, not the primary
    // key for anything.
    if (!docs) {
      docs = await runSearch(title);
    }
    const doc = docs?.[0];
    if (!doc) return null;

    // The best title/author match (docs[0]) is often a translation-specific
    // Open Library record with no ISBN of its own — a Cyrillic-transliterated
    // query like this catalog's tends to surface a Russian-edition entry
    // rather than the main work most editions are attached to. Cover/genre/
    // year still come from the best match; for the ISBN, look a little
    // further down the result list for whichever entry actually has one.
    const isbnDoc = docs.find((d) => Array.isArray(d.isbn) && d.isbn.length > 0) || doc;

    return {
      img: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
      genre: Array.isArray(doc.subject) && doc.subject.length > 0 ? String(doc.subject[0]).slice(0, 40) : null,
      year: doc.first_publish_year || null,
      // Open Library aggregates at the "work" level — one popular book
      // easily has dozens of ISBNs across editions/translations. Cap it;
      // this is only ever used to help a future import match this book,
      // not as an exhaustive edition list.
      isbn: Array.isArray(isbnDoc.isbn) ? isbnDoc.isbn.slice(0, 30) : [],
    };
  } catch {
    return null;
  }
}

module.exports = { searchOpenLibraryCover };
