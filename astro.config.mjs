/**
 * @file astro.config.mjs
 * @description Astro project configuration file. Establishes the site canonical URL base,
 * mounts sitemap-generation integrations, and hooks the Tailwind CSS Vite plugin.
 */

// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap, { ChangeFreqEnum } from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.mapaph.com",
  trailingSlash: "never",
  integrations: [
    sitemap({
      serialize(item) {
        if (
          item.url === "https://www.mapaph.com" ||
          item.url === "https://www.mapaph.com/"
        ) {
          item.changefreq = ChangeFreqEnum.DAILY;
          item.priority = 1.0;
        } else if (item.url.includes("/tools")) {
          item.changefreq = ChangeFreqEnum.WEEKLY;
          item.priority = 0.9;
        } else if (item.url.includes("/docs")) {
          item.changefreq = ChangeFreqEnum.MONTHLY;
          item.priority = 0.8;
        } else {
          item.changefreq = ChangeFreqEnum.MONTHLY;
          item.priority = 0.7;
        }
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
