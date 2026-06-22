export function userPublicProfileHref(username: string | null | undefined): string | undefined {
  const u = username?.trim().toLowerCase();
  if (!u) return undefined;
  return `/u/${encodeURIComponent(u)}`;
}

export function hasPublicProfile(user: { username?: string | null }): boolean {
  return Boolean(user.username?.trim());
}

export function normalizeNotificationProfileHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const legacy = href.match(/^\/perfil\/([^/?#]+)/i);
  if (legacy?.[1]) return userPublicProfileHref(legacy[1]);
  return href;
}
