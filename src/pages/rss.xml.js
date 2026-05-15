import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const field = await getCollection('field');
	const stupidshit = await getCollection('stupidshit');

	const items = [
		{
			title: 'The Silent Creep',
			pubDate: new Date('2026-04-26'),
			description:
				'1,300 days of training, eating, and weight data, walked through six guardrails. Headline: training works at 67% efficiency, but baseline intake quietly drifted +387 kcal/day across four phases.',
			link: '/paper/',
			categories: ['paper'],
		},
		...field.map((entry) => ({
			title: entry.data.title,
			pubDate: entry.data.date,
			description: entry.data.summary,
			link: `/field/${entry.id}/`,
			categories: ['field'],
		})),
		...stupidshit.map((entry) => ({
			title: entry.data.title,
			pubDate: entry.data.date,
			description: entry.data.summary,
			link: `/stupidshit/${entry.id}/`,
			categories: ['stupidshit', ...(entry.data.tags ?? [])],
		})),
	].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items,
	});
}
