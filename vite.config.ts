import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the site works when served from a GitHub Pages
// project path (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Learn Spanish Numbers',
        short_name: 'ES Numbers',
        description: 'Practice Spanish numbers with flashcards, listening drills, and audio.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7c3aed',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Small static site: precache everything, cache Google/Edge/Apple
        // speech-synthesis voices are already local, so no runtime caching
        // rules are needed beyond the built assets themselves.
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
});
