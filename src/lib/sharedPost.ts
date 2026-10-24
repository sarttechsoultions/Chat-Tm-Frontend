export type SharedPostReference = { postId: string; note: string; href: string };

// Cloudinary supports extracting a frame by requesting an image extension.
// https://cloudinary.com/documentation/video_previews_and_posters#video_thumbnails
export function sharedVideoPoster(source: string): string | null {
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.search) return null;
    if (!/^\/[^/]+\/video\/upload\/(?!s--)/.test(url.pathname) || !/\.[a-zA-Z0-9]+$/.test(url.pathname)) return null;
    url.pathname = url.pathname.replace("/video/upload/", "/video/upload/so_0,w_480,c_limit,q_auto/").replace(/\.[a-zA-Z0-9]+$/, ".jpg");
    return url.toString();
  } catch { return null; }
}

// Only our own post URLs become rich cards. External links remain ordinary links.
export function sharedPostReference(body: string, origin: string): SharedPostReference | null {
  for (const candidate of body.match(/https?:\/\/[^\s]+/g) || []) {
    try {
      const url = new URL(candidate);
      if (url.origin !== origin) continue;
      const id = url.pathname.match(/^\/posts\/([a-zA-Z0-9_-]{1,128})\/?$/)?.[1]
        || (url.pathname.startsWith('/profile/') ? url.hash.match(/^#post-([a-zA-Z0-9_-]{1,128})$/)?.[1] || url.searchParams.get('postId') : null);
      if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) continue;
      // Older shares contained a copied caption after this marker. Never render it.
      const marker = body.search(/(?:^|\n)Shared a (?:post|reel) (?:on ChatTm|from )/);
      const note = marker >= 0 ? body.slice(0, marker).trim() : body.replace(candidate, '').trim();
      return { postId: id, note, href: `/posts/${encodeURIComponent(id)}` };
    } catch { /* A malformed URL remains ordinary message text. */ }
  }
  return null;
}
