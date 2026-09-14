

function proxyOpenLibrary(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "covers.openlibrary.org") return url;
    return `${import.meta.env.VITE_TARGET}/api/v1/cover-cache?src=${encodeURIComponent(url)}`;
  } catch {

    return url;
  }
}

export function coverUrl(url) {
  if (!url) return url;
  return proxyOpenLibrary(url);
}

export function coverThumbUrl(url) {
  if (!url) return url;
  const resized = url.replace(/-L\.jpg(\?.*)?$/, "-M.jpg$1");
  return proxyOpenLibrary(resized);
}
