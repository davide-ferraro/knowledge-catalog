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
