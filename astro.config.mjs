import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://davide-ferraro.github.io',
  base: '/my-knowldege',
  integrations: [mdx()],
});
