import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import remarkWikilink from './src/plugins/remark-wikilink.mjs';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

const BASE = '/knowledge-catalog';

export default defineConfig({
  site: 'https://davide-ferraro.github.io',
  base: BASE,

  markdown: {
    processor: unified({
      remarkPlugins: [[remarkWikilink, { base: BASE }]],
    }),
  },

  // Streaming leaves islands stuck waiting on their children marker, which
  // never resolves for the Recharts-based chart.
  integrations: [mdx(), react({ experimentalDisableStreaming: true })],

  vite: {
    plugins: [tailwindcss()],
  },
});