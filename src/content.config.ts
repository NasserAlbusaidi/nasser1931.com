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

// Night-sky photos. Each entry is src/content/sky/<slug>/index.md beside its
// photo.jpg, written by `npm run add-photo`. Exposure values describe one frame.
const sky = defineCollection({
	loader: glob({ base: './src/content/sky', pattern: '*/index.md' }),
	schema: ({ image }) => z.object({
		title: z.string(),
		date: z.coerce.date(),
		location: z.string(),
		photo: image(),
		alt: z.string(),
		camera: z.string().optional(),
		lens: z.string().optional(),
		exposure: z.object({
			seconds: z.number().positive(),
			aperture: z.number().positive(),
			iso: z.number().int().positive(),
			focal_mm: z.number().positive(),
		}).partial().optional(),
		// A frame count, or "unknown" for a stack whose count was not recorded.
		stack: z.union([z.number().int().min(2), z.literal('unknown')]).optional(),
	}),
});

export const collections = { stupidshit, sky };
