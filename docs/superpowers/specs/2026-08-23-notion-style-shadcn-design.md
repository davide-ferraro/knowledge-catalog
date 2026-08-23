# Notion-style UI with shadcn/ui — Design

**Date:** 2026-08-23
**Status:** Approved (Approach A)

## Purpose

Replace the deliberately-plain styling with a Notion-like reading experience, and
adopt shadcn/ui for the UI furniture and for interactive blocks inside posts.
Content, wikilinks, backlinks and the build-time link guard are untouched — this
is a presentation layer only.

## Decisions

- **Approach A:** Tailwind 4 + shadcn/ui, with shadcn's neutral tokens retuned to
  Notion's palette. Rejected: hand-written CSS (no component library), and
  Tailwind-tokens-without-React (no shadcn charts).
- **Layout:** centered reading column, slim top nav. No app-style sidebar.
- **Theme:** light + dark with a toggle; OS preference as the default.
- **shadcn scope:** chrome (Badge, Card, Separator), rich blocks in posts
  (Callout, Alert, Table, ToggleList), and Chart. **No** search/command palette.
- **Font:** Inter for prose and UI; a monospace for code.
- **Charts:** shadcn Chart (Recharts) replaces the hand-rolled `BarChart.astro`,
  hydrated with `client:visible`.

## Verified technical constraints

Confirmed against the live docs and a real Astro 7.2.4 build:

- Tailwind 4 is wired via the **`@tailwindcss/vite`** plugin. `@astrojs/tailwind`
  does not support Astro 7 or Tailwind 4. CSS entry is `@import "tailwindcss"`;
  there is no `tailwind.config.js`.
- Install order matters: `astro add react` → `astro add tailwind` → add
  `baseUrl`/`paths` to `tsconfig.json` → `shadcn init`. Running `shadcn init`
  before the alias exists fails its alias check.
- shadcn CLI is `shadcn@4`; its default base is **Base UI**, not Radix.
- **Presentational components ship zero JS.** Card/Badge/Separator/Alert/Table
  with no `client:*` directive emit HTML with 0 script tags.
- **Interactive compound components must be wrapped.** Composing Accordion /
  Tabs / Dialog directly in an `.astro` template **aborts the build** — each React
  element is its own root there, so React context does not cross the Astro
  boundary. Each composition must live in one `.tsx` file, hydrated with a
  `client:*` directive. Without a directive they build but render empty (Base UI
  only renders open panels).
- `@tailwindcss/typography` is loaded with `@plugin` (after all `@import`s) and
  must have its `--tw-prose-*` variables bound to the shadcn tokens, or prose
  ignores the theme.
- Dark mode is a CSS variant: `@custom-variant dark (&:where(.dark, .dark *))`.
  Tailwind's `:where` form is preferred over shadcn's generated `:is(.dark *)`,
  which misses utilities on the `.dark` element itself.
- Astro 7 sets `compressHTML: 'jsx'`, which strips whitespace between inline
  elements. Sequences of Badges need explicit spacing utilities, not literal
  whitespace.
- Astro's `base` path and Tailwind do not conflict; Vite rewrites asset URLs.

## Design tokens (Notion-derived)

| Token | Light | Dark |
| --- | --- | --- |
| background | `#ffffff` | `#191919` |
| foreground | `rgb(55,53,47)` warm near-black | `rgba(255,255,255,0.81)` |
| muted foreground | ~65% of foreground | ~55% white |
| border | foreground @ 9% | white @ 11% |
| inline code | warm-gray bg, red-ish text | same, dark bg |

Expressed as `oklch` in `src/styles/global.css`, split `:root` / `.dark`.

Typography: body 16px/1.6; reading column 708px (Notion's default page width);
headings 40 / 30 / 24px, tight and bold; blockquote with a 3px left border;
dividers at ~9% opacity.

## Component inventory

| File | Role | JS |
| --- | --- | --- |
| `src/layouts/Base.astro` | header (title, nav, theme toggle), fonts, global CSS | inline theme script only |
| `src/layouts/Post.astro` | prose wrapper, tag Badges, backlinks Card | none |
| `src/components/ThemeToggle.astro` | plain `<button>` toggling `.dark` | inline script |
| `src/components/Callout.astro` | Notion-style emoji + tinted box for MDX | none |
| `src/components/ToggleList.tsx` | Accordion composition for MDX | `client:visible` |
| `src/components/Chart.tsx` | shadcn/Recharts chart, replaces `BarChart.astro` | `client:visible` |
| `src/components/ui/*` | shadcn generated (card, badge, separator, alert, table, accordion, chart) | none unless hydrated |

Pages (`index`, `tags/*`, `categories/*`) get Card + Badge treatment; their data
logic is unchanged.

## Implementation sequence

1. Install React, Tailwind 4, tsconfig aliases, shadcn init, add components.
2. Write `global.css`: Tailwind + shadcn tokens retuned to Notion + typography
   plugin bound to tokens + dark variant.
3. `Base.astro` — header, nav, fonts, flash-free theme script; `ThemeToggle`.
4. `Post.astro` — prose wrapper, Badges, backlinks Card.
5. Listing pages — Cards and Badges.
6. MDX blocks — `Callout`, `Alert`, `Table`, `ToggleList`.
7. `Chart.tsx` replacing `BarChart.astro`; update `interactive-charts.mdx`.
8. Verify, deploy.

## Verification

- `npm test` — the existing 18 unit tests must still pass (untouched logic).
- `npx astro build` must pass, and every internal href must keep the
  `/knowledge-catalog/` base prefix.
- Assert pages **without** a chart or toggle list ship **0** `<script
  type="module">` islands; the chart post ships exactly one.
- Browser check of both themes, the toggle, and chart interactivity.

## Out of scope

Search / command palette, a visual graph view, per-post table of contents.
