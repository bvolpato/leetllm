import { COMPRESSION_CUES, CONTEXT_RELEASE_CASES } from './fixtures.mjs';
export function compressionStage(beat, progress) {
  if (beat < 2) return beat;
  const seconds = Math.max(0, Math.min(1, progress)) * COMPRESSION_CUES.span;
  return seconds < COMPRESSION_CUES.toolsRemoved
    ? 1
    : seconds < COMPRESSION_CUES.hypothesisRemoved
      ? 2
      : 3;
}
export const numberContext = (value) => value.toLocaleString('en-US');
export const boundedContext = (value) => Math.max(0, Math.min(1, value));
export const contextProgress = (state, id, beat, start = 0.08, end = 0.88) => {
  const cue = state.cues?.[id];
  if (cue)
    return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : boundedContext(cue.progress);
  const current = state.beat ?? 0;
  return current < beat
    ? 0
    : current > beat
      ? 1
      : boundedContext(((state.beatP ?? 0) - start) / (end - start));
};
export const contextDone = (state, id, beat, end = 0.88) =>
  contextProgress(state, id, beat, 0.08, end) === 1;
export function requiredPacking(candidates, budget) {
  if (!Number.isInteger(budget) || budget < 0)
    throw new Error('budget must be a non-negative integer');
  for (const item of candidates) {
    if (
      !Number.isInteger(item.units) ||
      item.units < 0 ||
      !Number.isInteger(item.priority) ||
      typeof item.required !== 'boolean' ||
      typeof item.id !== 'string' ||
      !item.id.trim()
    )
      throw new Error('invalid candidate');
  }
  if (new Set(candidates.map((item) => item.id)).size !== candidates.length)
    throw new Error('candidate IDs must be unique');
  const ordered = [...candidates].sort(
    (a, b) => Number(b.required) - Number(a.required) || b.priority - a.priority,
  );
  let used = 0;
  const selected = [],
    events = [];
  for (const item of ordered) {
    const before = used,
      fits = used + item.units <= budget;
    if (!fits && item.required) throw new Error('required item does not fit: ' + item.id);
    if (fits) {
      selected.push(item.id);
      used += item.units;
    }
    events.push({
      id: item.id,
      units: item.units,
      before,
      attempted: before + item.units,
      fits,
      used,
      remaining: budget - used,
    });
  }
  return {
    budget,
    ordered,
    selected,
    used,
    remaining: budget - used,
    events,
  };
}
export function pruneContextResults(results, keepRecent) {
  if (
    !Number.isInteger(keepRecent) ||
    keepRecent < 0 ||
    results.some((row) => typeof row.recorded !== 'boolean')
  )
    throw new Error('invalid pruning contract');
  const cutoff = Math.max(0, results.length - keepRecent);
  return {
    cutoff,
    rows: results.map((row, index) => ({
      ...row,
      index,
      old: index < cutoff,
      replaced: index < cutoff && row.recorded,
      content: index < cutoff && row.recorded ? `[pruned] ${row.source}: ${row.finding}` : row.raw,
    })),
  };
}
export function commonContextPrefix(first, second) {
  let count = 0;
  while (count < first.length && count < second.length && first[count] === second[count]) count++;
  return count;
}
export function contextPrefixExample(reordered = false) {
  const root = Array.from(
      {
        length: 96,
      },
      (_, i) => 'R' + i,
    ),
    document = Array.from(
      {
        length: 256,
      },
      (_, i) => 'D' + i,
    ),
    a = Array.from(
      {
        length: 12,
      },
      (_, i) => 'A' + i,
    ),
    b = Array.from(
      {
        length: 12,
      },
      (_, i) => 'B' + i,
    );
  const first = reordered ? [...root, ...document, ...a] : [...root, ...a, ...document],
    second = reordered ? [...root, ...document, ...b] : [...root, ...b, ...document];
  return {
    first,
    second,
    common: commonContextPrefix(first, second),
    length: first.length,
    reordered,
    segments: reordered
      ? [
          {
            id: 'root',
            units: 96,
          },
          {
            id: 'document',
            units: 256,
          },
          {
            id: 'header',
            units: 12,
          },
        ]
      : [
          {
            id: 'root',
            units: 96,
          },
          {
            id: 'header',
            units: 12,
          },
          {
            id: 'document',
            units: 256,
          },
        ],
  };
}
export function contextRelease(
  cases = CONTEXT_RELEASE_CASES,
  rawUnits = 12436,
  curatedUnits = 3346,
) {
  if (
    [rawUnits, curatedUnits].some((v) => !Number.isInteger(v) || v <= 0) ||
    cases.some(
      (row) =>
        ['raw', 'curated', 'critical'].some((k) => typeof row[k] !== 'boolean') ||
        !Number.isInteger(row.poison) ||
        row.poison < 0,
    )
  )
    throw new Error('invalid release evidence');
  const raw = cases.filter((r) => r.raw).length,
    curated = cases.filter((r) => r.curated).length,
    gains = cases.filter((r) => !r.raw && r.curated).length,
    regressions = cases.filter((r) => r.raw && !r.curated).length;
  const critical = cases.every((r) => !r.critical || r.curated),
    poison = cases.every((r) => r.poison === 0),
    reduction = curatedUnits < rawUnits;
  return {
    raw,
    curated,
    total: cases.length,
    gains,
    regressions,
    critical,
    poison,
    reduction,
    rawUnits,
    curatedUnits,
    omitted: rawUnits - curatedUnits,
    percent: ((rawUnits - curatedUnits) / rawUnits) * 100,
    approved: cases.length > 0 && critical && poison && reduction && curated >= raw,
  };
}
