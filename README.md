# Learn Spanish Numbers (Web)

**Live app: https://tfthacker.github.io/-spanish-learn-numbers-web/**

A self-contained web app for practicing Spanish numbers from 0 to 1 trillion — flashcards, listening drills, and instant number-to-Spanish conversion with audio. It runs entirely in your browser: nothing to install, no accounts, no data collection. Preferences are stored in your browser's local storage.

This began as the [Learn Spanish Numbers Obsidian plugin](https://github.com/TfTHacker/spanish-learn-numbers) and was migrated to a standalone site, keeping the flashcard and listening features and dropping the spaced-repetition (SRS) tracking.

## Features

### Flashcards
Pick a number range (or a preset like Teens, 30s-90s, Thousands, or the Tricky set), then drill: see the number, recall the Spanish, reveal the answer with audio, and mark **Again** or **Good** until every card is known. Sequential or shuffled order, with your recent setups remembered.

### Listen & Learn
A guided audio slideshow. Choose Spanish → English, English → Spanish, or Spanish only, sequential or shuffled, with pause/skip/repeat controls and optional auto-repeat of the whole range.

### Number to Spanish
Type any number from 0 to 1,000,000,000,000 and see it written in Spanish with a scale-by-scale breakdown, and hear it pronounced.

### Voices
Audio uses the speech voices built into your browser and device (the Web Speech API), so it works offline and costs nothing. The home-screen picker offers **Automatic** (the best Spanish voice on your device, the default) or any specific installed Spanish voice. What's available varies by platform: Microsoft neural voices in Edge (excellent quality), Google voices in Chrome, Apple voices on macOS/iOS, Android's Google TTS voices. Changing the voice plays a short preview so you can compare.

## Development

```bash
npm install
npm run dev      # local dev server
npm run check    # number-grammar + flashcard-logic validators + typecheck
npm run build    # runs check, then builds to dist/
```

Built with Vite + TypeScript, no runtime dependencies. The Spanish number grammar in `src/utils/numbers.ts` is covered by `scripts/validate-numbers.mjs`; run `npm run check` after any change to it.

## Deployment

Pushes to `main` build and deploy the site automatically via `.github/workflows/deploy.yml` (GitHub Pages, source: GitHub Actions). Pushes to other branches run the same checks via `.github/workflows/check.yml`.

## Author

- Twitter/X: [@TfTHacker](https://x.com/TfTHacker)
- Website: [tfthacker.com](https://tfthacker.com/)

## License

MIT
