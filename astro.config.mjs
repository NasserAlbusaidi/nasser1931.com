// @ts-check

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://nasser1931.com',
  // Firebase serves clean URLs without a trailing slash (firebase.json), so
  // canonical and sitemap URLs must match or every one of them is a 301.
  trailingSlash: 'never',
  // The hidden room stays out of the sitemap; its page also asks not to be indexed.
  integrations: [mdx(), sitemap({ filter: (page) => new URL(page).pathname !== '/pluto' })],
  vite: {
    plugins: [tailwindcss()],
  },
});
