# Learn Spanish Numbers (Web)

**Live app: https://tfthacker.github.io/spanish-learn-numbers-web/**

A self-contained web app for practicing Spanish numbers from 0 to 1 trillion — flashcards, listening drills, and instant number-to-Spanish conversion with audio. It runs entirely in your browser: no accounts, no data collection, and it works fully offline once loaded (installable as an app — see below). Preferences are stored in your browser's local storage.

This began as the [Learn Spanish Numbers Obsidian plugin](https://github.com/TfTHacker/spanish-learn-numbers) and was migrated to a standalone site, keeping the flashcard and listening features and dropping the spaced-repetition (SRS) tracking.

## Features

### Flashcards
Pick a number range (or a preset like Teens, 30s-90s, Thousands, or the Tricky set), then drill: see the number, recall the Spanish, reveal the answer with audio, and mark **Again** or **Good** until every card is known. Sequential or shuffled order, with your recent setups remembered.

### Listen & Learn
A guided audio slideshow. Choose Spanish → English, English → Spanish, or Spanish only, sequential or shuffled, with pause/skip/repeat controls and optional auto-repeat of the whole range.

### Number to Spanish
Type any number and see it written in Spanish, spoken aloud. Toggle between:
- **Cardinal** (0 to 1,000,000,000,000): "tres mil quinientos" — with a scale-by-scale breakdown.
- **Ordinal** (1st-999th): "trigésimo segundo" — capped at 999 because Spanish ordinals beyond that are archaic enough that even native speakers default to cardinal numbers instead.

### Focused presets
Every range picker (Flashcards, Listen & Learn) includes one-tap presets: Basics, Teens, 20s, 30s-90s, Hundreds, **Years** (1950-2029, for birthdates and dates), Thousands, Big Numbers, and a Tricky set of commonly-confused forms.

### Voices and speed
Audio uses the speech voices built into your browser and device (the Web Speech API), so it works offline and costs nothing. The **Settings** page (gear icon on the home screen) offers **Automatic** (the best Spanish voice on your device, the default) or any specific installed Spanish voice, with sample numbers to preview each one. What's available varies by platform: Microsoft neural voices in Edge (excellent quality), Google voices in Chrome, Apple voices on macOS/iOS, Android's Google TTS voices.

Each practice page also has its own **Speed** control (Slower / Slow / Normal), so pace can be adjusted in context without leaving what you're doing.

### Install as an app
The site is an installable PWA — "Add to Home Screen" (iOS/Android) or "Install" (Chrome/Edge address bar) gives it its own icon and window, and it keeps working with no internet connection after the first visit.

### Keyboard shortcuts (Flashcards)
On desktop, the Flashcards drill responds to: **Space** to show the answer (or mark Good if it's already showing), **1** for Again, **2** for Good, **R** to replay the audio. A reminder of these appears under the controls on devices with a keyboard/mouse.

### Shareable drill links
"Copy Link" on the Flashcards and Listen & Learn setup screens copies a URL that encodes the exact range, order, and (for Listen & Learn) direction. Opening that link launches straight into the drill — handy for sending a specific practice set to someone, or bookmarking your own.

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
