# Learn Spanish Numbers (Web)

A self-contained web app for practicing Spanish numbers from 0 to 1 trillion — flashcards, listening drills, and instant number-to-Spanish conversion with audio.

This is a web port of the [Learn Spanish Numbers Obsidian plugin](https://github.com/TfTHacker/spanish-learn-numbers), with the spaced-repetition (SRS) features removed. Nothing to install, no accounts, no data collection — preferences are stored in your browser's local storage.

## Features

### Flashcards
Pick a number range (or a preset like Teens, 30s-90s, Thousands, or the Tricky set), then drill: see the number, recall the Spanish, reveal the answer with audio, and mark **Again** or **Good** until every card is known.

### Listen & Learn
A guided audio slideshow. Choose Spanish → English, English → Spanish, or Spanish only, sequential or shuffled, with pause/skip/repeat controls and optional auto-repeat of the whole range.

### Number to Spanish
Type any number from 0 to 1,000,000,000,000 and see it written in Spanish with a scale-by-scale breakdown, and hear it pronounced.

### Audio
Pronunciation uses Google Translate TTS (Spain or Mexico voice), and automatically falls back to your browser's built-in speech synthesis if that's unavailable.

## Development

```bash
npm install
npm run dev      # local dev server
npm run check    # number-grammar + flashcard-logic validators + typecheck
npm run build    # runs check, then builds to dist/
```

The Spanish number grammar in `src/utils/numbers.ts` is covered by `scripts/validate-numbers.mjs`; run `npm run check` after any change to it.

## Deployment

Pushes to `main` build and deploy the site automatically via `.github/workflows/deploy.yml`.

One-time setup: in the repository settings, under **Settings → Pages**, set **Source** to **GitHub Actions**. The site is then served at `https://<user>.github.io/<repo>/`.

## Author

- Twitter/X: [@TfTHacker](https://x.com/TfTHacker)
- Website: [tfthacker.com](https://tfthacker.com/)

## License

MIT
