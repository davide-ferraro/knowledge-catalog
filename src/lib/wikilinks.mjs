/**
 * Matches [[target]] and [[target|label]].
 * Returns a new RegExp each call: a module-level /g/ regex would share
 * `lastIndex` across callers and skip matches.
 */
export function wikilinkRegex() {
  return /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
}

export function extractWikilinks(body) {
  const re = wikilinkRegex();
  const found = [];
  let match;
  while ((match = re.exec(body)) !== null) {
    const target = match[1].trim();
    if (target && !found.includes(target)) found.push(target);
  }
  return found;
}

export function buildBacklinkIndex(posts) {
  const index = new Map();
  for (const post of posts) {
    for (const target of extractWikilinks(post.body)) {
      if (target === post.id) continue;
      if (!index.has(target)) index.set(target, []);
      index.get(target).push({ id: post.id, title: post.title });
    }
  }
  return index;
}

export function findBrokenWikilinks(posts) {
  const known = new Set(posts.map((post) => post.id));
  const broken = [];
  for (const post of posts) {
    for (const target of extractWikilinks(post.body)) {
      if (!known.has(target)) broken.push({ from: post.id, to: target });
    }
  }
  return broken;
}
