import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const field = defineCollection({
	loader: glob({ base: './src/content/field', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		date: z.coerce.date(),
		stats: z
			.object({
				swim: z.string().optional(),
				bike: z.string().optional(),
				run: z.string().optional(),
				total: z.string().optional(),
				power: z.string().optional(),
				hr: z.string().optional(),
				distance: z.string().optional(),
			})
			.optional(),
		notion_id: z.string().optional(),
	}),
});

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

export const collections = { field, stupidshit };
