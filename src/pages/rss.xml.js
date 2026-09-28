import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const stupidshit = await getCollection('stupidshit');

	const items = [
		...stupidshit.map((entry) => ({
			title: entry.data.title,
			pubDate: entry.data.date,
			description: entry.data.summary,
			link: `/stupidshit/${entry.id}`,
			categories: ['stupidshit', ...(entry.data.tags ?? [])],
		})),
	].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		trailingSlash: false,
		items,
	});
}
