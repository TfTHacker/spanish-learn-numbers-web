# Number Accuracy Audit — Findings & Fix List

Audit date: 2026-07-05. Every conversion function was executed against a battery of
linguistically tricky values (apocopation, cien/ciento, mil/millón/millones scale words,
long-scale vs short-scale pairing, ordinal composition) and compared against RAE norms.

**Update:** Fixes 1 and 2 (ordinals 11-19) were implemented and verified — see
"Fix 1" and "Fix 2" below, both now marked done.

## Verdict summary

| Area | File | Status |
| --- | --- | --- |
| Spanish cardinals (`numberToSpanish`) | `src/utils/numbers.ts` | ✅ Correct — no changes needed |
| English words (`numberToWordsEnglish`) | `src/utils/numbers.ts` | ✅ Correct — no changes needed |
| Breakdown (`getSpanishNumberBreakdown`) | `src/utils/numbers.ts` | ✅ Correct — joins exactly match full forms |
| ES↔EN pairing in Listen & Learn | `src/panels/listen-learn.ts` | ✅ Correct — long/short scale handled right |
| Spanish ordinals (`numberToSpanishOrdinal`) | `src/utils/numbers.ts` | ✅ **Fixed** — see Fix 1/2 below |

Verified-correct cardinal spot checks (do not change): 16 → dieciséis, 22 → veintidós,
21.000 → veintiún mil, 31.000 → treinta y un mil, 101.000 → ciento un mil,
121.000.000 → ciento veintiún millones, 100 → cien, 101 → ciento uno, 100.000 → cien mil,
1.000 → mil (not "un mil"), 1.000.000 → un millón, 1.000.000.000 → mil millones
(paired with English "one billion" — correct long/short scale), 10^12 → un billón
(paired with "one trillion" — correct).

---

## FIX 1 — ✅ DONE: Ordinals 11–19 use non-preferred forms

**File:** `src/utils/numbers.ts` — `ORDINAL_UNITS` (line ~119), `ordinalUnderHundred()` (line ~145)

Current output for 11–19 is the two-word compound style: `décimo primero`, `décimo segundo`,
`décimo tercero` … `décimo noveno`. Per RAE:

- **11.º and 12.º**: the standard forms are **`undécimo`** and **`duodécimo`**.
  (`decimoprimero`/`decimosegundo` were only admitted in 2010 and remain secondary.)
- **13.º–19.º**: the preferred spelling is the **fused single word**:
  `decimotercero`, `decimocuarto`, `decimoquinto`, `decimosexto`, `decimoséptimo`,
  `decimoctavo`, `decimonoveno`. The two-word forms are admitted but explicitly
  less recommended — wrong thing to teach in a learning app.

Implementation notes for the fixer:

- Add a lookup for 11–19 instead of composing them from `décimo + unit`:
  ```ts
  const ORDINAL_TEENS: Record<number, string> = {
    11: 'undécimo',
    12: 'duodécimo',
    13: 'decimotercero',
    14: 'decimocuarto',
    15: 'decimoquinto',
    16: 'decimosexto',
    17: 'decimoséptimo',   // keeps the accent on -séptimo
    18: 'decimoctavo',     // NOTE: fused single 'o' — NOT "decimooctavo"
    19: 'decimonoveno',
  };
  ```
- In `ordinalUnderHundred()`, return `ORDINAL_TEENS[num]` for 11–19 **before** the
  generic tens+units composition. The generic path stays for 21+ (two words,
  `vigésimo primero`, is the RAE norm there — do not fuse those).
- Orthography traps: the fused forms drop the accent of `décimo` (so `decimotercero`,
  not `décimotercero`), **except** `decimoséptimo` which carries the accent of
  `séptimo`. And 18.º merges the double vowel: `decimoctavo`.
- This automatically fixes compositions above 100, e.g. 111 → `centésimo undécimo`
  (currently `centésimo décimo primero`), 218 → `ducentésimo decimoctavo`.

## FIX 2 — ✅ DONE: Update ordinal regression tests

**File:** `scripts/validate-learning-flows.mjs` — `testOrdinalNumbers()` (line ~138)

The test cases currently assert the incorrect forms and must be updated in the same
commit or `npm run check` (and therefore the build/deploy) will fail:

- `11: 'décimo primero'` → `'undécimo'`
- `15: 'décimo quinto'` → `'decimoquinto'`
- `19: 'décimo noveno'` → `'decimonoveno'`
- `111: 'centésimo décimo primero'` → `'centésimo undécimo'`
- Recommended additions while in there: `12: 'duodécimo'`, `13: 'decimotercero'`,
  `17: 'decimoséptimo'`, `18: 'decimoctavo'`, `118: 'centésimo decimoctavo'`.
- Cases for 10, 20–999 that don't involve an 11–19 component are already correct —
  leave them unchanged.

Verification command after both fixes: `npm run check` (must pass), then spot-check in
the UI: Number to Spanish → Ordinal → enter 11, 18, 111.

## ITEM 3 (optional, low priority): Locale-aware digit grouping

Displayed numerals use `toLocaleString()` with the browser locale, so an
English-locale learner sees `1,234,567` while Spanish writes `1.234.567`. Not a
translation error, but for immersion consider forcing `toLocaleString('es-ES')` for
the number shown on Spanish-side cards (Flashcards question, Listen & Learn number,
Number to Spanish breakdown values). Touches: `src/panels/cram.ts`,
`src/panels/listen-learn.ts`, `src/panels/number-to-spanish.ts`. Decide product-wise
before implementing; skip if unsure.

## ITEM 4 (documentation only — do NOT "fix" in code)

Known, intentional scope limits; leave the code alone, they are correct choices:

- All forms are **masculine standalone**: `veintiuno` (not `veintiún`/`veintiuna`
  before nouns), `primero` (not `primer`/`primera`). Apocopation IS correctly applied
  where grammar requires it internally (`veintiún mil`, `ciento un millones`).
- Ordinals cap at 999 by design (`MAX_ORDINAL`) — Spanish ordinals above that are
  archaic; native speakers use cardinals. Do not raise the cap.
- English style is US convention without "and" (`one hundred one`) — consistent,
  leave as is.
- `un billón` = 10^12 (long scale) paired with English `one trillion` is CORRECT.
  Anyone "fixing" billón↔billion would be introducing a bug.
