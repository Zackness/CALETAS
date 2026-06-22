export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const match = url.trim().match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match?.[1] ?? null;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeThumbnailUrl(url: string | null | undefined): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
