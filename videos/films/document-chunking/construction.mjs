import {
  clamp01,
  cueBegun,
  cueProgress,
  fixedWindows,
  requiredPhrasesPresent,
} from './arithmetic.mjs';
import {
  ENCODE_END,
  ENCODE_START,
  POOL_END,
  POOL_START,
  RELEASE_QUERY,
  RELEASE_WORD_CAP,
  RUNBOOK,
} from './fixtures.mjs';
import { headedSection, lateChunkFixture, overlapExperiment, releaseComparison } from './model.mjs';
import { phase as cuePhase } from '../../lib/scene.mjs';
export function extendedFrame(id, state = {}) {
  const b = state.beat ?? 0,
    p = clamp01(state.beatP ?? 0);
  return {
    b,
    p,
    progress: (id) => cueProgress(state, id, p),
    begun: (id) => cueBegun(state, id, p > 0.2),
    freshStage:
      b === 0
        ? 0
        : b > 1
          ? 3
          : cueBegun(state, 'fresh-parent-repair', p > 0.75)
            ? 3
            : cueBegun(state, 'fresh-budget-cut', p > 0.3)
              ? 2
              : cueBegun(state, 'fresh-context-answer', p > 0.08)
                ? 1
                : 0,
  };
}
export function lateChunkSnapshot(beat, progress, state) {
  const fixture = lateChunkFixture();
  const encodeProgress =
    beat === 0 ? 0 : beat === 1 ? cueProgress(state ?? {}, 'semantic-and-late-beat-2-focus-2', cuePhase(progress, ENCODE_START, ENCODE_END)) : 1;
  const encodedCount =
    beat === 0
      ? 0
      : beat === 1
        ? Math.floor(encodeProgress * fixture.tokens.length + 1e-9)
        : fixture.tokens.length;
  const poolProgress = beat === 0 ? 0 : beat === 1 ? cueProgress(state ?? {}, 'semantic-and-late-beat-2-focus-1', cuePhase(progress, POOL_START, POOL_END)) : 1;
  const pooledCount = Math.floor(poolProgress * fixture.selected.length + 1e-9);
  const pooledValues = fixture.poolValues.slice(0, pooledCount);
  const runningMean = pooledValues.length
    ? pooledValues.reduce((sum, value) => sum + value, 0) / pooledValues.length
    : null;
  return {
    ...fixture,
    encodeProgress,
    encodedCount,
    poolProgress,
    pooledCount,
    runningMean,
  };
}
export function overlapBars(beat, progress) {
  return overlapExperiment().map((row) => ({
    ...row,
    width: (800 * row.indexedWords) / 33,
    opacity: beat > 0 ? 1 : cuePhase(progress, 0.04, 0.92),
  }));
}
export function overlapSnapshot(beat, progress) {
  const overlap = beat === 0 ? (progress < 0.43 ? 0 : 2) : beat === 1 && progress < 0.4 ? 2 : 4;
  const construction =
    beat === 0
      ? overlap === 0
        ? cuePhase(progress, 0.02, 0.32)
        : cuePhase(progress, 0.45, 0.8)
      : beat === 1 && overlap === 4
        ? cuePhase(progress, 0.4, 0.54)
        : 1;
  const chunks = fixedWindows(RUNBOOK, 7, overlap);
  const complete = Math.min(chunks.length, Math.floor(construction * chunks.length + 1e-8));
  const indexedWords = chunks
    .slice(0, complete)
    .reduce((sum, chunk) => sum + chunk.words.length, 0);
  return {
    overlap,
    construction,
    chunks,
    complete,
    indexedWords,
    ruleLength: 10,
    capacity: 7,
    completeRuleChunks: chunks
      .slice(0, complete)
      .filter((chunk) => requiredPhrasesPresent(chunk.text)).length,
  };
}
export function releaseSnapshot(beat, progress) {
  const p = clamp01(progress),
    rows = releaseComparison();
  const visibleCount =
    beat === 0 ? Math.min(rows.length, Math.floor(p * rows.length) + 1) : rows.length;
  const evaluatedCount =
    beat === 0
      ? 0
      : beat === 1
        ? Math.min(rows.length, Math.floor(p * rows.length) + 1)
        : rows.length;
  const selected =
    beat > 1 && p >= 0.12 ? (rows.find((candidate) => candidate.releasable) ?? null) : null;
  return {
    query: RELEASE_QUERY,
    wordCap: RELEASE_WORD_CAP,
    locator: headedSection().locator,
    rows: rows.slice(0, visibleCount),
    allRows: rows,
    visibleCount,
    evaluatedCount,
    selected,
  };
}
