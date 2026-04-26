import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

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
	}),
});

const stupidshit = defineCollection({
	loader: glob({ base: './src/content/stupidshit', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = { blog, field, stupidshit };
