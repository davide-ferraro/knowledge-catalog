# Knowledge Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a plain-styled Astro static site in this repo that publishes MDX blogposts with tags, categories, wiki-style links and backlinks, deployed to GitHub Pages.

**Architecture:** Astro 7 with the MDX integration. Posts are `.mdx` files in a typed content collection. Pure helper modules (plain `.mjs`, unit-tested with the built-in `node:test` runner) own the wikilink parsing, backlink index, and base-path joining; a thin remark plugin and thin `.astro` pages consume them. Deployed by a GitHub Actions workflow.

**Tech Stack:** Astro 7.2.4, `@astrojs/mdx` 7, `@astrojs/markdown-remark` (for the `unified()` processor), `astro/zod` (Zod 4), `node:test`, GitHub Actions.

## Global Constraints

- Node **25.7.0** is the only installed runtime and it **works** — verified by scaffolding and building a probe project. Astro's docs say odd-numbered Node majors are unsupported; if any command fails on a Node version check, that is the cause. CI pins Node via `withastro/action` (defaults to 24).
- Repo root: `/Users/davide/Documents/knowledge-catalog`. Branch `main`. Remote `origin` = `https://github.com/davide-ferraro/knowledge-catalog`.
- Deploy target: `https://davide-ferraro.github.io/knowledge-catalog/` → `site: 'https://davide-ferraro.github.io'`, `base: '/knowledge-catalog'`.
- **Astro 7 replaced remark/rehype as the default Markdown processor.** A custom remark plugin ONLY runs if registered via `markdown.processor: unified({ remarkPlugins: [...] })` imported from `@astrojs/markdown-remark`. Do not use the deprecated top-level `markdown.remarkPlugins`.
- Astro 7 API facts (differ from older tutorials): config file is `src/content.config.ts`; `z` comes from `astro/zod`, **not** `astro:content`; the slug property is `entry.id` (there is no `entry.slug`); render with `const { Content } = await render(entry)` imported from `astro:content` (there is no `entry.render()`).
- **Never write `client:load` on a plain `.astro` component** — client directives are only for framework (React/Vue/etc.) components and error on `.astro` ones. A `<script>` inside an `.astro` component is bundled and runs automatically; that is how interactivity works here.
- Astro 7's compiler validates HTML strictly: unclosed tags and invalid nesting (e.g. `<div>` inside `<p>`) are build errors, not auto-corrected.
- Styling is deliberately minimal: one small global stylesheet setting only a max-width, readable line-height, and default fonts. No colors, no theme, no CSS framework.
- All internal links must be prefixed with the base path. Always build hrefs with the `joinBase`/`postHref` helpers from Task 3 — never hand-write `/posts/foo`.
- Helper modules live in `src/lib/*.mjs` as plain JavaScript (no TypeScript) so `node --test` can import them with no loader or build step.

## File Structure

| File | Responsibility |
| --- | --- |
| `astro.config.mjs` | site/base, MDX integration, unified processor wiring the wikilink plugin |
| `tsconfig.json` | extends `astro/tsconfigs/strict` |
| `src/content.config.ts` | `posts` collection loader + frontmatter schema |
| `src/lib/paths.mjs` | `joinBase`, `postHref`, `tagHref`, `categoryHref` — base-path-safe URL building |
| `src/lib/wikilinks.mjs` | `wikilinkRegex`, `extractWikilinks`, `buildBacklinkIndex`, `findBrokenWikilinks` |
| `src/plugins/remark-wikilink.mjs` | mdast transform turning `[[slug]]` text into link nodes |
| `src/layouts/Base.astro` | html skeleton + nav; used by every page |
| `src/layouts/Post.astro` | post header (date/category/tags), body slot, "Linked from" section |
| `src/pages/index.astro` | all posts, newest first |
| `src/pages/posts/[slug].astro` | one post page |
| `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro` | tag overview + per-tag listing |
| `src/pages/categories/index.astro`, `src/pages/categories/[category].astro` | category overview + per-category listing |
| `src/components/BarChart.astro` | example interactive chart (vanilla JS, no deps) |
| `src/content/posts/*.mdx` | the posts themselves |
| `src/styles/global.css` | the minimal stylesheet |
| `test/*.test.mjs` | `node:test` unit tests for the lib modules |
| `.github/workflows/deploy.yml` | build + deploy to Pages |
| `README.md` | how to add a post, run locally, deploy |

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `public/`, `.gitignore` (all via scaffold, then edited)

**Interfaces:**
- Consumes: nothing.
- Produces: a buildable Astro project at the repo root; `npm run build`, `npm run dev` scripts; `base`/`site` config that every later task's links depend on.

- [ ] **Step 1: Scaffold into a temp dir and move it in**

The `create astro` command refuses a non-empty directory, and the repo already has `docs/` and `.git/`. Scaffold beside it, then move the files in.

```bash
cd /Users/davide/Documents/knowledge-catalog
npm create astro@latest .astro-scaffold -- --template minimal --install --no-git --no-ai --skip-houston
```

- [ ] **Step 2: Move scaffold contents to the repo root and delete the temp dir**

```bash
cd /Users/davide/Documents/knowledge-catalog
mv .astro-scaffold/.gitignore .astro-scaffold/* .
rmdir .astro-scaffold
ls
```

Expected: `astro.config.mjs`, `package.json`, `tsconfig.json`, `src/`, `public/`, `node_modules/`, `docs/`, `.gitignore` present.

- [ ] **Step 3: Install the MDX integration and the unified markdown processor**

```bash
cd /Users/davide/Documents/knowledge-catalog
npm install @astrojs/mdx @astrojs/markdown-remark
```

- [ ] **Step 4: Write `astro.config.mjs`**

The wikilink plugin is added in Task 4; this is the GitHub Pages config only.

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://davide-ferraro.github.io',
  base: '/knowledge-catalog',
  integrations: [mdx()],
});
```

- [ ] **Step 5: Set TypeScript strictness in `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 6: Confirm `.gitignore` ignores build output**

Read `.gitignore`. It must contain `dist/` and `node_modules/` (the scaffold provides these). If either is missing, append it:

```bash
cd /Users/davide/Documents/knowledge-catalog
grep -qx 'dist/' .gitignore || echo 'dist/' >> .gitignore
grep -qx 'node_modules/' .gitignore || echo 'node_modules/' >> .gitignore
```

- [ ] **Step 7: Verify the build passes**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro build
```

Expected: `[build] Complete!` and a `dist/index.html`. If the build fails on a Node version check, that is the Node 25 caveat from Global Constraints.

- [ ] **Step 8: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: scaffold Astro project configured for GitHub Pages"
```

---

### Task 2: Content collection schema and seed posts

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/posts/hello-knowledge-hub.mdx`
- Create: `src/content/posts/how-tagging-works.mdx`

**Interfaces:**
- Consumes: the buildable project from Task 1.
- Produces: collection named `posts`, queryable via `getCollection('posts')`. Each entry has `entry.id` (slug from filename), `entry.body` (raw MDX source), and `entry.data` typed as `{ title: string; date: Date; category: string; tags: string[]; description?: string }`. Every later task depends on these exact field names.

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
  }),
});

export const collections = { posts };
```

- [ ] **Step 2: Write the first seed post**

File `src/content/posts/hello-knowledge-hub.mdx`. It links to the second post so Task 3's backlink logic has real data.

```mdx
---
title: "Hello, knowledge hub"
date: 2026-08-23
category: "meta"
tags: ["setup", "astro"]
description: "Why this site exists and how it is organised."
---

This is the first post in my knowledge hub. Everything I learn gets written
down here as a post with one category and any number of tags.

Posts can link to each other with double brackets, like [[how-tagging-works]].
Those links are turned into real links at build time, and the target post shows
a "Linked from" list pointing back here.
```

- [ ] **Step 3: Write the second seed post**

File `src/content/posts/how-tagging-works.mdx`.

```mdx
---
title: "How tagging works"
date: 2026-08-22
category: "meta"
tags: ["setup"]
description: "Categories are for one broad bucket; tags are for everything else."
---

Each post has exactly one `category` and any number of `tags`.

A category answers "what area of my life or work is this?". A tag answers
"what specific things does this touch?". A post can be reached from its
category page and from every one of its tag pages.
```

- [ ] **Step 4: Verify the schema validates and content syncs**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro build
```

Expected: log lines `[content] Syncing content` then `[content] Synced content`, and `[build] Complete!`. A frontmatter typo would fail here with a Zod error naming the field.

- [ ] **Step 5: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: add posts content collection schema and seed posts"
```

---

### Task 3: Path and wikilink helper modules (TDD)

**Files:**
- Create: `test/paths.test.mjs`
- Create: `src/lib/paths.mjs`
- Create: `test/wikilinks.test.mjs`
- Create: `src/lib/wikilinks.mjs`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing at runtime; pure functions.
- Produces, from `src/lib/paths.mjs`:
  - `joinBase(base: string, path: string) => string` — joins a base like `/knowledge-catalog` or `/knowledge-catalog/` with `posts/foo/` into `/knowledge-catalog/posts/foo/`, never doubling or dropping slashes. Returns a leading-slash, trailing-slash path.
  - `postHref(slug: string, base: string) => string`
  - `tagHref(tag: string, base: string) => string`
  - `categoryHref(category: string, base: string) => string`
- Produces, from `src/lib/wikilinks.mjs`:
  - `wikilinkRegex() => RegExp` — returns a **fresh** global regex each call (a shared `/g/` regex carries `lastIndex` between callers and silently skips matches).
  - `extractWikilinks(body: string) => string[]` — target slugs, in order, deduplicated.
  - `buildBacklinkIndex(posts: Array<{id: string, title: string, body: string}>) => Map<string, Array<{id: string, title: string}>>` — maps a slug to the posts linking to it. Never includes self-links.
  - `findBrokenWikilinks(posts: Array<{id: string, body: string}>) => Array<{from: string, to: string}>` — links whose target is not a known post id.

- [ ] **Step 1: Add the test script to `package.json`**

Add to the `"scripts"` object:

```json
"test": "node --test test/"
```

- [ ] **Step 2: Write the failing tests for `src/lib/paths.mjs`**

File `test/paths.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { joinBase, postHref, tagHref, categoryHref } from '../src/lib/paths.mjs';

test('joinBase joins a base without a trailing slash', () => {
  assert.equal(joinBase('/knowledge-catalog', 'posts/foo/'), '/knowledge-catalog/posts/foo/');
});

test('joinBase does not double the slash when base has a trailing slash', () => {
  assert.equal(joinBase('/knowledge-catalog/', 'posts/foo/'), '/knowledge-catalog/posts/foo/');
});

test('joinBase tolerates a leading slash on the path', () => {
  assert.equal(joinBase('/knowledge-catalog', '/posts/foo/'), '/knowledge-catalog/posts/foo/');
});

test('joinBase handles a root base', () => {
  assert.equal(joinBase('/', 'posts/foo/'), '/posts/foo/');
});

test('joinBase returns the base itself for an empty path', () => {
  assert.equal(joinBase('/knowledge-catalog', ''), '/knowledge-catalog/');
});

test('postHref builds a post url', () => {
  assert.equal(postHref('hello-world', '/knowledge-catalog/'), '/knowledge-catalog/posts/hello-world/');
});

test('tagHref encodes tags that need escaping', () => {
  assert.equal(tagHref('c++', '/base/'), '/base/tags/c%2B%2B/');
});

test('categoryHref builds a category url', () => {
  assert.equal(categoryHref('meta', '/base/'), '/base/categories/meta/');
});
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
cd /Users/davide/Documents/knowledge-catalog && npm test
```

Expected: FAIL — `Cannot find module '.../src/lib/paths.mjs'`.

- [ ] **Step 4: Implement `src/lib/paths.mjs`**

```js
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
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd /Users/davide/Documents/knowledge-catalog && npm test
```

Expected: all 8 tests pass.

- [ ] **Step 6: Write the failing tests for `src/lib/wikilinks.mjs`**

File `test/wikilinks.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wikilinkRegex,
  extractWikilinks,
  buildBacklinkIndex,
  findBrokenWikilinks,
} from '../src/lib/wikilinks.mjs';

test('wikilinkRegex returns a fresh regex each call', () => {
  const a = wikilinkRegex();
  a.exec('[[one]] [[two]]');
  assert.equal(a.lastIndex > 0, true);
  assert.equal(wikilinkRegex().lastIndex, 0);
});

test('wikilinkRegex captures the target and optional label', () => {
  const match = wikilinkRegex().exec('see [[my-slug|Nice Label]] here');
  assert.equal(match[1], 'my-slug');
  assert.equal(match[2], 'Nice Label');
});

test('extractWikilinks finds plain links', () => {
  assert.deepEqual(extractWikilinks('a [[one]] b [[two]] c'), ['one', 'two']);
});

test('extractWikilinks strips labels and whitespace', () => {
  assert.deepEqual(extractWikilinks('[[ one | Label ]]'), ['one']);
});

test('extractWikilinks deduplicates repeated targets', () => {
  assert.deepEqual(extractWikilinks('[[one]] and [[one]] again'), ['one']);
});

test('extractWikilinks returns empty for no links', () => {
  assert.deepEqual(extractWikilinks('nothing here'), []);
});

test('buildBacklinkIndex maps targets to linking posts', () => {
  const posts = [
    { id: 'a', title: 'A', body: 'links to [[b]]' },
    { id: 'c', title: 'C', body: 'also links to [[b]]' },
    { id: 'b', title: 'B', body: 'no links' },
  ];
  const index = buildBacklinkIndex(posts);
  assert.deepEqual(index.get('b'), [
    { id: 'a', title: 'A' },
    { id: 'c', title: 'C' },
  ]);
  assert.equal(index.has('a'), false);
});

test('buildBacklinkIndex ignores self-links', () => {
  const index = buildBacklinkIndex([{ id: 'a', title: 'A', body: 'see [[a]]' }]);
  assert.equal(index.has('a'), false);
});

test('findBrokenWikilinks reports unknown targets', () => {
  const posts = [
    { id: 'a', body: 'to [[b]] and [[nope]]' },
    { id: 'b', body: '' },
  ];
  assert.deepEqual(findBrokenWikilinks(posts), [{ from: 'a', to: 'nope' }]);
});

test('findBrokenWikilinks returns empty when all targets exist', () => {
  const posts = [
    { id: 'a', body: 'to [[b]]' },
    { id: 'b', body: '' },
  ];
  assert.deepEqual(findBrokenWikilinks(posts), []);
});
```

- [ ] **Step 7: Run the tests to verify they fail**

```bash
cd /Users/davide/Documents/knowledge-catalog && npm test
```

Expected: FAIL — `Cannot find module '.../src/lib/wikilinks.mjs'`.

- [ ] **Step 8: Implement `src/lib/wikilinks.mjs`**

```js
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
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
cd /Users/davide/Documents/knowledge-catalog && npm test
```

Expected: all tests pass (8 from paths + 10 from wikilinks).

- [ ] **Step 10: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: add tested path and wikilink helper modules"
```

---

### Task 4: Remark plugin rendering wikilinks as links

**Files:**
- Create: `src/plugins/remark-wikilink.mjs`
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: `wikilinkRegex` from `src/lib/wikilinks.mjs`; `postHref` from `src/lib/paths.mjs`.
- Produces: default-exported remark plugin factory `remarkWikilink({ base }) => (tree) => void`. After this task, `[[slug]]` in any `.md`/`.mdx` body renders as `<a href="{base}/posts/{slug}/">`.

- [ ] **Step 1: Write the plugin**

File `src/plugins/remark-wikilink.mjs`. It walks mdast text nodes and splices link nodes in. It must not descend into existing `link`, `code`, or `inlineCode` nodes.

```js
import { wikilinkRegex } from '../lib/wikilinks.mjs';
import { postHref } from '../lib/paths.mjs';

const SKIP = new Set(['link', 'linkReference', 'code', 'inlineCode', 'definition']);

export default function remarkWikilink({ base } = { base: '/' }) {
  return function transform(tree) {
    visit(tree);

    function visit(node) {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (SKIP.has(child.type)) continue;
        if (child.type !== 'text') {
          visit(child);
          continue;
        }
        const replacement = splitText(child.value);
        if (replacement) {
          node.children.splice(i, 1, ...replacement);
          i += replacement.length - 1;
        }
      }
    }

    function splitText(value) {
      if (!value.includes('[[')) return null;
      const re = wikilinkRegex();
      const parts = [];
      let cursor = 0;
      let match;
      while ((match = re.exec(value)) !== null) {
        if (match.index > cursor) {
          parts.push({ type: 'text', value: value.slice(cursor, match.index) });
        }
        const target = match[1].trim();
        const label = (match[2] ?? match[1]).trim();
        parts.push({
          type: 'link',
          url: postHref(target, base),
          children: [{ type: 'text', value: label }],
        });
        cursor = match.index + match[0].length;
      }
      if (parts.length === 0) return null;
      if (cursor < value.length) {
        parts.push({ type: 'text', value: value.slice(cursor) });
      }
      return parts;
    }
  };
}
```

- [ ] **Step 2: Register the plugin in `astro.config.mjs`**

A remark plugin runs in Node during the build, where `import.meta.env.BASE_URL` is unavailable — so the base is defined once here and passed in as an option.

```js
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import remarkWikilink from './src/plugins/remark-wikilink.mjs';

const BASE = '/knowledge-catalog';

export default defineConfig({
  site: 'https://davide-ferraro.github.io',
  base: BASE,
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkWikilink, { base: BASE }]],
    }),
  },
  integrations: [mdx()],
});
```

`mdx()` inherits `markdown.processor` by default, so this covers `.mdx` files.

- [ ] **Step 3: Build and verify the wikilink became a real anchor**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro build && grep -o '<a href="[^"]*">how-tagging-works</a>' dist/posts/hello-knowledge-hub/index.html
```

Expected: `<a href="/knowledge-catalog/posts/how-tagging-works/">how-tagging-works</a>`

If the grep finds nothing, first check the raw text is not still `[[how-tagging-works]]` in the HTML — that means the plugin is not registered on the processor.

Note: `dist/posts/...` only exists once Task 5 creates the post route. If this build predates Task 5, verify against the home page instead, or run this step after Task 5.

- [ ] **Step 4: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: render wikilinks as internal links via remark plugin"
```

---

### Task 5: Layouts and the post page

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/Base.astro`
- Create: `src/layouts/Post.astro`
- Create: `src/pages/posts/[slug].astro`

**Interfaces:**
- Consumes: `posts` collection (Task 2); `postHref`, `tagHref`, `categoryHref` (Task 3); `buildBacklinkIndex`, `findBrokenWikilinks` (Task 3).
- Produces:
  - `Base.astro` props: `{ title: string; description?: string }`, renders `<slot />`.
  - `Post.astro` props: `{ post: CollectionEntry<'posts'>; backlinks: Array<{id: string, title: string}> }`, renders `<slot />` as the body.
  - Route `/posts/{id}/` for every post.

- [ ] **Step 1: Write the minimal stylesheet**

File `src/styles/global.css`:

```css
body {
  max-width: 40rem;
  margin: 2rem auto;
  padding: 0 1rem;
  line-height: 1.6;
}

nav a {
  margin-right: 1rem;
}

article img {
  max-width: 100%;
}
```

- [ ] **Step 2: Write `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import { joinBase } from '../lib/paths.mjs';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
const base = import.meta.env.BASE_URL;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body>
    <nav>
      <a href={joinBase(base, '')}>Home</a>
      <a href={joinBase(base, 'tags/')}>Tags</a>
      <a href={joinBase(base, 'categories/')}>Categories</a>
    </nav>
    <main>
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 3: Write `src/layouts/Post.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import Base from './Base.astro';
import { postHref, tagHref, categoryHref } from '../lib/paths.mjs';

interface Props {
  post: CollectionEntry<'posts'>;
  backlinks: Array<{ id: string; title: string }>;
}

const { post, backlinks } = Astro.props;
const base = import.meta.env.BASE_URL;
const { title, date, category, tags, description } = post.data;
---

<Base title={title} description={description}>
  <article>
    <h1>{title}</h1>
    <p>
      <time datetime={date.toISOString()}>{date.toISOString().slice(0, 10)}</time>
      {' '}in{' '}
      <a href={categoryHref(category, base)}>{category}</a>
    </p>
    {
      tags.length > 0 && (
        <p>
          Tags:{' '}
          {tags.map((tag, i) => (
            <>
              {i > 0 && ', '}
              <a href={tagHref(tag, base)}>{tag}</a>
            </>
          ))}
        </p>
      )
    }
    <slot />
  </article>
  {
    backlinks.length > 0 && (
      <section>
        <h2>Linked from</h2>
        <ul>
          {backlinks.map((link) => (
            <li><a href={postHref(link.id, base)}>{link.title}</a></li>
          ))}
        </ul>
      </section>
    )
  }
</Base>
```

Note the explicit `{' '}` separators — Astro 7 defaults `compressHTML` to `'jsx'`, which strips whitespace between inline elements.

- [ ] **Step 4: Write `src/pages/posts/[slug].astro`**

This is also where broken wikilinks fail the build.

```astro
---
import { getCollection, render } from 'astro:content';
import Post from '../../layouts/Post.astro';
import { buildBacklinkIndex, findBrokenWikilinks } from '../../lib/wikilinks.mjs';

export async function getStaticPaths() {
  const posts = await getCollection('posts');

  const broken = findBrokenWikilinks(
    posts.map((post) => ({ id: post.id, body: post.body ?? '' })),
  );
  if (broken.length > 0) {
    const detail = broken.map((b) => `  ${b.from} -> [[${b.to}]]`).join('\n');
    throw new Error(`Broken wikilinks found:\n${detail}`);
  }

  const backlinkIndex = buildBacklinkIndex(
    posts.map((post) => ({
      id: post.id,
      title: post.data.title,
      body: post.body ?? '',
    })),
  );

  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post, backlinks: backlinkIndex.get(post.id) ?? [] },
  }));
}

const { post, backlinks } = Astro.props;
const { Content } = await render(post);
---

<Post post={post} backlinks={backlinks}>
  <Content />
</Post>
```

- [ ] **Step 5: Build and verify post pages plus the backlink section**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro build && grep -c 'Linked from' dist/posts/how-tagging-works/index.html && grep -o '<a href="[^"]*">Hello, knowledge hub</a>' dist/posts/how-tagging-works/index.html
```

Expected: `1`, then `<a href="/knowledge-catalog/posts/hello-knowledge-hub/">Hello, knowledge hub</a>` — the backlink from the first post.

- [ ] **Step 6: Verify the broken-wikilink guard actually fails the build**

```bash
cd /Users/davide/Documents/knowledge-catalog
printf '\nA link to [[this-does-not-exist]].\n' >> src/content/posts/how-tagging-works.mdx
npx astro build 2>&1 | grep -c 'Broken wikilinks found'
```

Expected: `1` (build fails with the error).

Then undo the probe:

```bash
cd /Users/davide/Documents/knowledge-catalog
git checkout src/content/posts/how-tagging-works.mdx
npx astro build
```

Expected: `[build] Complete!`

- [ ] **Step 7: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: add layouts, post pages, and backlinks"
```

---

### Task 6: Home, tag, and category pages

**Files:**
- Create: `src/pages/index.astro` (overwrite the scaffold's file)
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`
- Create: `src/pages/categories/index.astro`
- Create: `src/pages/categories/[category].astro`

**Interfaces:**
- Consumes: `posts` collection; `Base.astro`; `postHref`, `tagHref`, `categoryHref`.
- Produces: routes `/`, `/tags/`, `/tags/{tag}/`, `/categories/`, `/categories/{category}/`.

- [ ] **Step 1: Write `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import { postHref, tagHref, categoryHref } from '../lib/paths.mjs';

const posts = (await getCollection('posts')).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);
const base = import.meta.env.BASE_URL;
---

<Base title="Knowledge hub">
  <h1>Knowledge hub</h1>
  <p>Everything I learn, written down and cross-linked.</p>
  <ul>
    {
      posts.map((post) => (
        <li>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toISOString().slice(0, 10)}
          </time>
          {' — '}
          <a href={postHref(post.id, base)}>{post.data.title}</a>
          {' ('}
          <a href={categoryHref(post.data.category, base)}>{post.data.category}</a>
          {')'}
          {
            post.data.tags.length > 0 && (
              <span>
                {' '}
                {post.data.tags.map((tag) => (
                  <>
                    {' '}
                    <a href={tagHref(tag, base)}>#{tag}</a>
                  </>
                ))}
              </span>
            )
          }
        </li>
      ))
    }
  </ul>
</Base>
```

- [ ] **Step 2: Write `src/pages/tags/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { tagHref } from '../../lib/paths.mjs';

const posts = await getCollection('posts');
const counts = new Map<string, number>();
for (const post of posts) {
  for (const tag of post.data.tags) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
}
const tags = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const base = import.meta.env.BASE_URL;
---

<Base title="Tags">
  <h1>Tags</h1>
  <ul>
    {
      tags.map(([tag, count]) => (
        <li>
          <a href={tagHref(tag, base)}>{tag}</a> ({count})
        </li>
      ))
    }
  </ul>
</Base>
```

- [ ] **Step 3: Write `src/pages/tags/[tag].astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { postHref } from '../../lib/paths.mjs';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  const byTag = new Map();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(post);
    }
  }
  return [...byTag.entries()].map(([tag, tagged]) => ({
    params: { tag },
    props: {
      tag,
      posts: tagged.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    },
  }));
}

const { tag, posts } = Astro.props;
const base = import.meta.env.BASE_URL;
---

<Base title={`Tag: ${tag}`}>
  <h1>Tag: {tag}</h1>
  <ul>
    {
      posts.map((post) => (
        <li>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toISOString().slice(0, 10)}
          </time>
          {' — '}
          <a href={postHref(post.id, base)}>{post.data.title}</a>
        </li>
      ))
    }
  </ul>
</Base>
```

- [ ] **Step 4: Write `src/pages/categories/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { categoryHref } from '../../lib/paths.mjs';

const posts = await getCollection('posts');
const counts = new Map<string, number>();
for (const post of posts) {
  counts.set(post.data.category, (counts.get(post.data.category) ?? 0) + 1);
}
const categories = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const base = import.meta.env.BASE_URL;
---

<Base title="Categories">
  <h1>Categories</h1>
  <ul>
    {
      categories.map(([category, count]) => (
        <li>
          <a href={categoryHref(category, base)}>{category}</a> ({count})
        </li>
      ))
    }
  </ul>
</Base>
```

- [ ] **Step 5: Write `src/pages/categories/[category].astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { postHref } from '../../lib/paths.mjs';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  const byCategory = new Map();
  for (const post of posts) {
    const key = post.data.category;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(post);
  }
  return [...byCategory.entries()].map(([category, grouped]) => ({
    params: { category },
    props: {
      category,
      posts: grouped.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    },
  }));
}

const { category, posts } = Astro.props;
const base = import.meta.env.BASE_URL;
---

<Base title={`Category: ${category}`}>
  <h1>Category: {category}</h1>
  <ul>
    {
      posts.map((post) => (
        <li>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toISOString().slice(0, 10)}
          </time>
          {' — '}
          <a href={postHref(post.id, base)}>{post.data.title}</a>
        </li>
      ))
    }
  </ul>
</Base>
```

- [ ] **Step 6: Build and verify every route exists**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro build && find dist -name '*.html' | sort
```

Expected exactly these files:

```
dist/categories/index.html
dist/categories/meta/index.html
dist/index.html
dist/posts/hello-knowledge-hub/index.html
dist/posts/how-tagging-works/index.html
dist/tags/astro/index.html
dist/tags/index.html
dist/tags/setup/index.html
```

- [ ] **Step 7: Verify no link is missing the base prefix**

```bash
cd /Users/davide/Documents/knowledge-catalog && grep -oh 'href="/[^"]*"' dist/**/*.html dist/*.html | sort -u
```

Expected: every entry starts with `/knowledge-catalog/`. Any bare `/posts/...` or `/tags/...` is a bug — that link is bypassing the path helpers.

- [ ] **Step 8: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: add home, tag, and category index pages"
```

---

### Task 7: Interactive chart component in a post

**Files:**
- Create: `src/components/BarChart.astro`
- Create: `src/content/posts/interactive-charts.mdx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `BarChart.astro` with props `{ values: number[]; labels: string[] }`, importable from any `.mdx` post. Demonstrates the interactivity pattern for all future posts.

- [ ] **Step 1: Write the component**

Vanilla JS and inline SVG — no charting dependency, consistent with the plain-style constraint. The `<script>` is bundled by Astro and runs on load; there is **no** `client:` directive because this is an `.astro` component.

```astro
---
interface Props {
  values: number[];
  labels: string[];
}

const { values, labels } = Astro.props;
const data = labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
---

<figure data-bar-chart>
  <label>
    Scale: <input type="range" min="1" max="200" value="100" data-scale />
    <output data-scale-out>100%</output>
  </label>
  <svg viewBox="0 0 300 150" role="img" aria-label="Bar chart">
    {
      data.map((d, i) => (
        <rect
          data-bar
          data-value={d.value}
          x={i * (300 / data.length) + 5}
          width={300 / data.length - 10}
          y={150 - d.value}
          height={d.value}
          fill="currentColor"
        />
      ))
    }
  </svg>
  <figcaption>
    {data.map((d) => `${d.label}: ${d.value}`).join(' | ')}
  </figcaption>
</figure>

<script>
  document.querySelectorAll('[data-bar-chart]').forEach((chart) => {
    const slider = chart.querySelector('[data-scale]');
    const out = chart.querySelector('[data-scale-out]');
    const bars = chart.querySelectorAll('[data-bar]');
    if (!(slider instanceof HTMLInputElement) || !out) return;

    const render = () => {
      const factor = Number(slider.value) / 100;
      out.textContent = `${slider.value}%`;
      bars.forEach((bar) => {
        const base = Number(bar.getAttribute('data-value'));
        const height = Math.max(0, Math.min(150, base * factor));
        bar.setAttribute('height', String(height));
        bar.setAttribute('y', String(150 - height));
      });
    };

    slider.addEventListener('input', render);
    render();
  });
</script>
```

- [ ] **Step 2: Write the post that uses it**

File `src/content/posts/interactive-charts.mdx`:

```mdx
---
title: "Interactive charts in posts"
date: 2026-08-21
category: "meta"
tags: ["setup", "charts"]
description: "How to embed an interactive component in a post."
---

import BarChart from '../../components/BarChart.astro';

Posts are MDX, so a post can import a component and render it inline. Drag the
slider to scale the bars:

<BarChart labels={["Mon", "Tue", "Wed", "Thu"]} values={[40, 80, 55, 120]} />

The component ships its own small script, and pages without a component ship no
JavaScript at all. See [[hello-knowledge-hub]] for the wider setup.
```

- [ ] **Step 3: Build and verify the chart rendered with its script**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro build && grep -c '<rect' dist/posts/interactive-charts/index.html && grep -c '<script' dist/posts/interactive-charts/index.html
```

Expected: `4` rects, and at least `1` script tag.

- [ ] **Step 4: Check it in the browser**

```bash
cd /Users/davide/Documents/knowledge-catalog && npx astro preview
```

Open `http://localhost:4321/knowledge-catalog/posts/interactive-charts/`, drag the slider, confirm the bars resize and the percentage updates. Stop the server with Ctrl-C.

- [ ] **Step 5: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "feat: add interactive chart component and example post"
```

---

### Task 8: GitHub Pages deployment and README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: the passing build from Task 7.
- Produces: the live site at `https://davide-ferraro.github.io/knowledge-catalog/`.

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Install, build, and upload the site
        uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Write the README**

```markdown
# knowledge-catalog

A personal knowledge hub: everything I learn, written as cross-linked posts.
Live at <https://davide-ferraro.github.io/knowledge-catalog/>.

## Adding a post

Create `src/content/posts/<slug>.mdx`. The filename becomes the URL slug.

```mdx
---
title: "Post title"
date: 2026-08-23
category: "one-category"
tags: ["tag-a", "tag-b"]
description: "Optional one-line summary."
---

Body text. Link to another post with [[its-slug]] or [[its-slug|custom label]].
```

- `category` — exactly one, broad bucket. `tags` — any number.
- Wikilinks are turned into real links at build time, and the target post grows
  a "Linked from" section. A wikilink to a slug that does not exist **fails the
  build** on purpose, so typos surface immediately.
- For interactivity, import a component from `src/components/` and render it
  inline. See `src/content/posts/interactive-charts.mdx`.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | local dev server with hot reload |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the built site locally |
| `npm test` | unit tests for the helper modules |

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. A failed build leaves the previous site live.

**One-time setup:** in the repo on GitHub, go to Settings → Pages → Build and
deployment and set Source to **GitHub Actions**.

## Styling

Deliberately minimal for now — `src/styles/global.css` sets only a content
width and line height. Real design comes later.
```

- [ ] **Step 3: Run the full local verification before pushing**

```bash
cd /Users/davide/Documents/knowledge-catalog && npm test && npx astro build
```

Expected: all tests pass, then `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
cd /Users/davide/Documents/knowledge-catalog
git add -A
git commit -m "ci: add GitHub Pages deploy workflow and README"
```

- [ ] **Step 5: Set the Pages source on GitHub (manual, required before the first deploy works)**

Open <https://github.com/davide-ferraro/knowledge-catalog/settings/pages> and set **Source** to **GitHub Actions**. Without this the workflow's deploy step fails.

- [ ] **Step 6: Push and verify the deploy**

```bash
cd /Users/davide/Documents/knowledge-catalog
git push -u origin main
gh run watch
```

Expected: the workflow succeeds. Then confirm the live site:

```bash
curl -sI https://davide-ferraro.github.io/knowledge-catalog/ | head -1
```

Expected: `HTTP/2 200`.

---

## Self-Review

**Spec coverage:** Astro+MDX stack → Task 1. Content schema with title/date/category/tags/description → Task 2. Wikilinks resolving at build time, with unknown slugs failing the build → Tasks 3, 4, 5 (Step 6 proves the failure). Backlinks "Linked from" section → Tasks 3, 5. Home / post / tag / category pages → Tasks 5, 6. Interactive components as islands → Task 7. Plain styling → Task 5 Step 1. GitHub Pages deploy via Actions, with the manual Pages source setting → Task 8. Verification via `npm run build` and dev-server check → Tasks 6 Step 6, 7 Step 4, 8 Step 3.

**Corrections to the spec made here:** the spec's `<EnergyChart client:load />` example was wrong — `client:*` directives apply only to framework components and error on `.astro` components, so Task 7 uses a bundled `<script>` instead. The spec also assumed `markdown.remarkPlugins`, which is deprecated in Astro 7; Task 4 uses `markdown.processor: unified({...})`.

**Type consistency:** `postHref/tagHref/categoryHref(value, base)` keep the same argument order everywhere. `buildBacklinkIndex` consumes `{id, title, body}` and yields `{id, title}` — matching `Post.astro`'s `backlinks` prop. `findBrokenWikilinks` consumes `{id, body}` and yields `{from, to}` — matching the error formatting in `[slug].astro`. `entry.id` is used as the slug throughout; `entry.slug` appears nowhere.
