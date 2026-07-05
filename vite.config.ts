import { defineConfig } from 'vite';

// Relative base so the site works when served from a GitHub Pages
// project path (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
});
