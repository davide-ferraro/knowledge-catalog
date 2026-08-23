# Knowledge Hub — Design

**Date:** 2026-08-23
**Status:** Approved approach: Astro + MDX

## Purpose

A personal knowledge hub published on GitHub Pages. Everything Davide learns is stored as blogposts with tags and categories, cross-linked wiki-style, forming a browsable knowledge graph. Posts can contain interactive content (charts, demos). Styling is intentionally plain for now — default browser rendering, near-zero CSS — to be revisited later.

## Stack

- **Astro** with **MDX** for posts (markdown text + embeddable interactive components rendered as islands).
- **GitHub Pages** deployment via the official Astro GitHub Action, triggered on push to `main`.
- Site URL: `https://davide-ferraro.github.io/my-knowldege/` (Astro `base` configured accordingly).

## Repository structure

```
my-knowldege/
├── src/
│   ├── content/
│   │   └── posts/            # one .mdx file per post
│   ├── components/           # reusable interactive components (charts, demos)
│   ├── layouts/
│   │   ├── Base.astro        # html skeleton, nav (Home / Tags / Categories)
│   │   └── Post.astro        # post header, body, backlinks section
│   └── pages/
│       ├── index.astro       # chronological list of all posts
│       ├── posts/[slug].astro
│       ├── tags/index.astro      # all tags with counts
│       ├── tags/[tag].astro      # posts for one tag
│       ├── categories/index.astro
│       └── categories/[category].astro
├── docs/superpowers/specs/   # design docs (this file)
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml
```

## Post format

Each post is an `.mdx` file in `src/content/posts/`, validated by an Astro content-collection schema:

```yaml
---
title: "..."
date: 2026-08-23
category: "energy"        # exactly one
tags: ["forecasting", "python"]   # zero or more
description: "one-line summary"   # optional
---
```

- Body is markdown.
- **Wikilinks:** `[[other-post-slug]]` (and `[[slug|Display text]]`) resolve at build time to links to that post via a small remark plugin. A wikilink to a non-existent slug fails the build with a clear error (catches typos early).
- **Interactive components:** imported and embedded directly, e.g. `<EnergyChart labels={[...]} values={[...]} />`. Components live in `src/components/` and are plain `.astro` + vanilla JS, carrying their own bundled `<script>` (a framework island can be added later if one is ever needed). Note: `client:*` directives apply only to framework components and must not be used on `.astro` ones. Pages without components ship no JavaScript.

## Backlinks

At build time, a helper scans all posts' wikilinks and builds a reverse index. Each post page renders a "Linked from" section listing posts that reference it (omitted when empty). This is the seed of the knowledge graph; a visual graph view is explicitly out of scope for v1.

## Pages

- **Home:** all posts, newest first, showing title, date, category, tags.
- **Post page:** title, date, category link, tag links, body, "Linked from" section.
- **Tag/category index pages** and per-tag/per-category listing pages.

## Styling

Near-zero CSS: default browser fonts and colors, a max-width on the content column for readability, nothing else. No color palette, no theme. Styling is a later, separate effort.

## Deployment & error handling

- `.github/workflows/deploy.yml` uses `withastro/action` + `actions/deploy-pages` on push to `main`.
- Build failures (schema violations, broken wikilinks) fail the Action — the previously deployed site stays live.
- GitHub Pages must be set to "GitHub Actions" as the source (one-time manual repo setting).

## Testing / verification

- `npm run build` locally must pass (schema + wikilink validation happen here).
- Manual check of the dev server (`npm run dev`): home list, a sample post with a wikilink and an interactive component, tag and category pages, backlinks section.
- After first deploy: verify the live URL renders with the correct `base` path (links and assets not broken).

## Out of scope (later milestones)

- Visual interactive graph view of posts.
- Any real styling/design work.
- Search, RSS, comments.
