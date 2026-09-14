

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

// ISBN-10 and ISBN-13 both use hyphens/spaces purely for human readability
// ("978-0-441-01359-3") — strip everything but the digits (and the

function normalizeIsbn(isbn) {
  return (isbn || "").toUpperCase().replace(/[^0-9X]/g, "");
}

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
