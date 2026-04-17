// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://criarcatalogoonline.online',
  output: 'server',
  adapter: node({
    mode: 'middleware',
  }),
  security: {
    checkOrigin: false,
  },
  integrations: [mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
  },
});