# my-knowldege

A personal knowledge hub: everything I learn, written as cross-linked posts.
Live at <https://davide-ferraro.github.io/my-knowldege/>.

## Adding a post

Create `src/content/posts/<slug>.mdx`. The filename becomes the URL slug.

````mdx
---
title: "Post title"
date: 2026-08-23
category: "one-category"
tags: ["tag-a", "tag-b"]
description: "Optional one-line summary."
---

Body text. Link to another post with [[its-slug]] or [[its-slug|custom label]].
````

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
