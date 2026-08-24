/**
 * Categories excluded from the catalog listings (homepage, tag and category
 * indexes). Posts in these categories stay published and reachable by direct
 * URL — they just don't show up when browsing.
 */
export const HIDDEN_CATEGORIES = new Set(['meta']);

export function visiblePosts(posts) {
  return posts.filter((post) => !HIDDEN_CATEGORIES.has(post.data.category));
}
