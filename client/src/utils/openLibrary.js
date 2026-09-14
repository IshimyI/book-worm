

export function openLibrarySearchUrl(title, author) {
  const q = [title, author].filter(Boolean).join(' ');
  return `https://openlibrary.org/search?q=${encodeURIComponent(q)}`;
}
