/**
 * @file astro.config.mjs
 * @description Astro project configuration file. Establishes the site canonical URL base, 
 * mounts sitemap-generation integrations, and hooks the Tailwind CSS Vite plugin.
 */

// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mapaph.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
