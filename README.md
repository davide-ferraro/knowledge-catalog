# knowledge-catalog

A personal knowledge hub: everything I learn, written as cross-linked posts.
Live at <https://davide-ferraro.github.io/knowledge-catalog/>.

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
### Blocks you can use in a post

Import these at the top of the `.mdx` file. See
`src/content/posts/interactive-charts.mdx` for a live example of every one.

| Block | Import | Notes |
| --- | --- | --- |
| `<Callout icon="💡" title="...">` | `../../components/Callout.astro` | Notion-style tinted box. No JS. |
| `<Toggle title="...">` | `../../components/Toggle.astro` | Collapsible `details`. No JS. |
| `<Alert>` / `<AlertTitle>` / `<AlertDescription>` | `@/components/ui/alert` | shadcn. No JS. |
| `<Table>` and friends | `@/components/ui/table` | shadcn. No JS. |
| `<Chart client:only="react" ... />` | `../../components/Chart.tsx` | Recharts. Needs the `client:only` directive. |

`Chart` takes `data` (array of objects), `series` (keys to plot), optional
`labelKey`, `kind` (`"bar"` or `"line"`) and `height`.

Two rules worth knowing when adding your own components:

- Interactive React components must be composed inside a **single `.tsx` file**
  and hydrated with a `client:*` directive. Composing a context-based component
  such as a Radix accordion directly in an `.astro` or `.mdx` template aborts the
  build, because Astro renders each JSX element as its own root.
- Presentational shadcn components need **no** `client:*` directive and ship zero
  JavaScript. Only reach for a directive when the component genuinely needs
  browser state.

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

Tailwind 4 + [shadcn/ui](https://ui.shadcn.com/), with shadcn's neutral tokens
retuned to Notion's palette in `src/styles/global.css`: a warm near-black for
light text, `#191919` for dark, Inter for prose and JetBrains Mono for code.
Markdown prose is styled by `@tailwindcss/typography`, bound to the same tokens
so both themes stay in sync.

Light and dark are driven by a `dark` class on `<html>`, set before first paint
by an inline script in `Base.astro` so the theme never flashes. The toggle in the
header is a plain `<button>` — no React.

Add more shadcn components with `npx shadcn@latest add <name>`; they land in
`src/components/ui/`.
