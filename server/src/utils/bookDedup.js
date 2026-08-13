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

// Catches things an exact `where: { title, author }` match would miss —
// different casing, stray whitespace, or a trailing period/quote — without
// risking a false match between genuinely different books.
function findPossibleDuplicate(title, author, candidates) {
  const normTitle = normalize(title);
  const normAuthor = normalize(author);
  if (!normTitle || !normAuthor) return null;

  return candidates.find((c) => normalize(c.title) === normTitle && normalize(c.author) === normAuthor) || null;
}

module.exports = { normalize, findPossibleDuplicate };
