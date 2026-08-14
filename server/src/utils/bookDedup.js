// Case/whitespace/punctuation-insensitive matching for "is this actually
// the same book?" — deliberately exact-after-normalization rather than
// fuzzy/edit-distance: two titles differing by even one real character
// ("Book 1" vs "Book 2") are almost always different books, not a typo of
// each other, so anything looser than this risks silently merging them.
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

// ISBN-10 and ISBN-13 both use hyphens/spaces purely for human readability
// ("978-0-441-01359-3") — strip everything but the digits (and the
// trailing X an ISBN-10 checksum can be) before comparing.
function normalizeIsbn(isbn) {
  return (isbn || "").toUpperCase().replace(/[^0-9X]/g, "");
}

// Catches things an exact `where: { title, author }` match would miss —
// different casing, stray whitespace, or a trailing period/quote — without
// risking a false match between genuinely different books. An ISBN match
// is checked first when both sides have one: it's language-independent,
// where title/author often isn't — an imported CSV row's author is
// whatever Goodreads has it as (almost always Latin script, even for a
// book this catalog stores with a Cyrillic transliteration), which
// title+author string matching alone would never line up.
function findPossibleDuplicate(title, author, candidates, isbn) {
  const normIsbn = normalizeIsbn(isbn);
  if (normIsbn) {
    const isbnMatch = candidates.find(
      (c) => Array.isArray(c.isbn) && c.isbn.some((candidateIsbn) => normalizeIsbn(candidateIsbn) === normIsbn)
    );
    if (isbnMatch) return isbnMatch;
  }

  const normTitle = normalize(title);
  const normAuthor = normalize(author);
  if (!normTitle || !normAuthor) return null;

  return candidates.find((c) => normalize(c.title) === normTitle && normalize(c.author) === normAuthor) || null;
}

module.exports = { normalize, normalizeIsbn, findPossibleDuplicate };
