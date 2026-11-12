// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://pavanvenigalla.vercel.app',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // DuckDB-WASM ships its own worker + wasm assets; keep them out of
    // dependency pre-bundling so Vite emits them as real asset URLs.
    optimizeDeps: { exclude: ['@duckdb/duckdb-wasm'] },
  },
});
