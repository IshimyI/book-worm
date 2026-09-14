

export function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return undefined;
  return `${import.meta.env.VITE_TARGET}${avatarUrl}`;
}
