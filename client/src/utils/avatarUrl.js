// avatarUrl from the API is a server-relative path (/uploads/avatars/...).
// In production the client is same-origin with the API (VITE_TARGET is
// empty), but in local dev they're different ports, so it has to be
// resolved against the same base the API itself lives on.
export function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return undefined;
  return `${import.meta.env.VITE_TARGET}${avatarUrl}`;
}
