import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const moduleCache = new Map();

function loadModuleFromUrl(url) {
  const cacheKey = url.href;
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  const source = fs.readFileSync(url, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(cacheKey, module.exports);

  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const resolved = new URL(
        specifier.endsWith('.ts') || specifier.endsWith('.js') || specifier.endsWith('.mjs')
          ? specifier
          : `${specifier}.ts`,
        url
      );
      return loadModuleFromUrl(resolved);
    }

    throw new Error(`Unsupported dependency in regression validator: ${specifier}`);
  };

  new Function('exports', 'module', 'require', transpiled)(module.exports, module, localRequire);
  moduleCache.set(cacheKey, module.exports);
  return module.exports;
}

function loadModule(relativePath) {
  return loadModuleFromUrl(new URL(relativePath, import.meta.url));
}

const learning = loadModule('../src/utils/learning.ts');
const ranges = loadModule('../src/utils/ranges.ts');
const numbers = loadModule('../src/utils/numbers.ts');

const {
  applyCramAgain,
  applyCramGood,
  buildCramSession,
  getListenLearnDisplayState,
  restartCramSession,
} = learning;
const { validateCustomRanges } = ranges;
const { numberToSpanishOrdinal } = numbers;

function expectEqual(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
}

function deterministicShuffle(items) {
  return [...items].reverse();
}

function testCramSessionBuild() {
  const state = buildCramSession([1, 2, 3], false, deterministicShuffle);
  assert.equal(state.totalCards, 3);
  assert.equal(state.isShuffled, false);
  expectEqual(state.unknownCards.map(card => card.number), [1, 2, 3], 'Sequential cram mode should preserve order');
}

function testCramSessionShuffle() {
  const state = buildCramSession([1, 2, 3], true, deterministicShuffle);
  expectEqual(state.unknownCards.map(card => card.number), [3, 2, 1], 'Shuffled cram mode should use the provided shuffle order');
}

function testCramAgain() {
  const start = buildCramSession([11, 12, 13], false, deterministicShuffle);
  const next = applyCramAgain(start);
  assert.equal(next.sessionReviewed, 1);
  assert.equal(next.sessionCorrect, 0);
  assert.equal(next.knownCount, 0);
  expectEqual(next.unknownCards.map(card => card.number), [12, 13, 11]);
}

function testCramGood() {
  const start = buildCramSession([21, 22], false, deterministicShuffle);
  const next = applyCramGood(start);
  assert.equal(next.sessionReviewed, 1);
  assert.equal(next.sessionCorrect, 1);
  assert.equal(next.knownCount, 1);
  expectEqual(next.unknownCards.map(card => card.number), [22]);
}

function testCramRestartPreservesOrderMode() {
  const sequential = buildCramSession([30, 31, 32], false, deterministicShuffle);
  const restartedSequential = restartCramSession(sequential, deterministicShuffle);
  assert.equal(restartedSequential.isShuffled, false);
  expectEqual(restartedSequential.unknownCards.map(card => card.number), [30, 31, 32], 'Restart should preserve sequential mode');

  const shuffled = buildCramSession([30, 31, 32], true, deterministicShuffle);
  const restartedShuffled = restartCramSession(shuffled, deterministicShuffle);
  assert.equal(restartedShuffled.isShuffled, true);
  expectEqual(restartedShuffled.unknownCards.map(card => card.number), [32, 31, 30], 'Restart should preserve shuffle mode');
}

function testListenLearnDisplayPhases() {
  const hidden = getListenLearnDisplayState(false, false, 'uno');
  assert.equal(hidden.answerVisible, true);
  assert.equal(hidden.answerMarkup, '<div class="lsn-slideshow-waiting">...</div>');

  const revealed = getListenLearnDisplayState(false, true, 'uno');
  assert.equal(revealed.answerVisible, true);
  assert.equal(revealed.answerMarkup, '<div class="lsn-slideshow-second">uno</div>');

  const esOnly = getListenLearnDisplayState(true, false, 'unused');
  assert.equal(esOnly.answerVisible, false);
  assert.equal(esOnly.answerMarkup, '');
}

function testRangeValidation() {
  assert.deepEqual(validateCustomRanges('1-3, 3, [5], 7'), {
    valid: true,
    numbers: [1, 2, 3, 5, 7],
  });

  assert.deepEqual(validateCustomRanges('[1-3], [5, 7]').numbers, [1, 2, 3, 5, 7]);
  assert.equal(validateCustomRanges('').valid, false);
  assert.equal(validateCustomRanges('10-1').valid, false);
  assert.equal(validateCustomRanges('0-5000').valid, false, 'Expanded ranges over 5,000 values should be rejected');
  assert.equal(validateCustomRanges('1000000000001').valid, false, 'Numbers over one trillion should be rejected');
}

function testOrdinalNumbers() {
  const cases = {
    1: 'primero',
    2: 'segundo',
    3: 'tercero',
    9: 'noveno',
    10: 'décimo',
    11: 'undécimo',
    12: 'duodécimo',
    13: 'decimotercero',
    15: 'decimoquinto',
    17: 'decimoséptimo',
    18: 'decimoctavo',
    19: 'decimonoveno',
    20: 'vigésimo',
    21: 'vigésimo primero',
    29: 'vigésimo noveno',
    30: 'trigésimo',
    42: 'cuadragésimo segundo',
    50: 'quincuagésimo',
    60: 'sexagésimo',
    70: 'septuagésimo',
    80: 'octogésimo',
    90: 'nonagésimo',
    99: 'nonagésimo noveno',
    100: 'centésimo',
    101: 'centésimo primero',
    110: 'centésimo décimo',
    111: 'centésimo undécimo',
    118: 'centésimo decimoctavo',
    121: 'centésimo vigésimo primero',
    200: 'ducentésimo',
    300: 'tricentésimo',
    400: 'cuadringentésimo',
    500: 'quingentésimo',
    600: 'sexcentésimo',
    700: 'septingentésimo',
    800: 'octingentésimo',
    900: 'noningentésimo',
    999: 'noningentésimo nonagésimo noveno',
  };

  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(numberToSpanishOrdinal(Number(input)), expected, `Ordinal of ${input} should be "${expected}"`);
  }

  assert.equal(numberToSpanishOrdinal(0), null, 'Ordinal is undefined for zero');
  assert.equal(numberToSpanishOrdinal(1000), null, 'Ordinal is capped at 999');
  assert.equal(numberToSpanishOrdinal(-1), null, 'Ordinal rejects negative numbers');
  assert.equal(numberToSpanishOrdinal(1.5), null, 'Ordinal rejects non-integers');
}

testCramSessionBuild();
testCramSessionShuffle();
testCramAgain();
testCramGood();
testCramRestartPreservesOrderMode();
testListenLearnDisplayPhases();
testRangeValidation();
testOrdinalNumbers();

console.log('Learning flow regression validation passed.');
