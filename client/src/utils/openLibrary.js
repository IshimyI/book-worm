// Open Library is a nonprofit library (archive.org) offering either free
// public-domain reading or legal controlled digital lending — never a
// piracy source — so it's safe to link out to for any book in the catalog.
export function openLibrarySearchUrl(title, author) {
  const q = [title, author].filter(Boolean).join(' ');
  return `https://openlibrary.org/search?q=${encodeURIComponent(q)}`;
}
