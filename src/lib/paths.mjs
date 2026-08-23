/**
 * Join Astro's `base` with a site-relative path.
 * Astro exposes BASE_URL with a trailing slash but `base` in config without one,
 * so both shapes must work.
 */
export function joinBase(base, path) {
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  const right = path.startsWith('/') ? path.slice(1) : path;
  if (right === '') return `${left}/`;
  return `${left}/${right}`;
}

export function postHref(slug, base) {
  return joinBase(base, `posts/${encodeURIComponent(slug)}/`);
}

export function tagHref(tag, base) {
  return joinBase(base, `tags/${encodeURIComponent(tag)}/`);
}

export function categoryHref(category, base) {
  return joinBase(base, `categories/${encodeURIComponent(category)}/`);
}
