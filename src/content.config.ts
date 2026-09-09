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
    /** Post series slug (e.g. "eeme" for the electricity-markets book notes). */
    series: z.string().optional(),
    /** Chapter number shown on the series icon. */
    chapter: z.number().int().positive().optional(),
    /** Explicit icon variant for posts outside the series (e.g. "gb"). */
    icon: z.string().optional(),
  }),
});

export const collections = { posts };
