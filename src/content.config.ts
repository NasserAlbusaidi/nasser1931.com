import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const stupidshit = defineCollection({
	loader: glob({ base: './src/content/stupidshit', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.string()).optional(),
		notion_id: z.string().optional(),
	}),
});

export const collections = { stupidshit };
