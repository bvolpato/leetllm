import {
  BPE_RULES,
  NEAR_DUPLICATE_TEXT,
  PACKED_WORDS,
  PROXY_RESULTS,
  corpus,
  extractionFixture,
  releaseBatch,
  releaseEvaluation,
} from './fixtures.mjs';
import {
  bounded,
  bpeReplay,
  cueBegun,
  documentSample,
  independentObjective,
  jaccard,
  packRecords,
  packedMask,
  share,
  shingles,
} from './arithmetic.mjs';
import assert from 'node:assert/strict';
export function mixtureSnapshot(beat, progress, cues) {
  const blocks = beat === 2 && cueBegun(cues, 'mixture-equal-blocks', progress > 0.3),
    prediction = beat === 2 && !blocks,
    codeProbability = blocks
      ? 0.5
      : beat === 0
        ? 0.5
        : beat === 1
          ? 0.5 + 0.4 * bounded((progress - 0.04) / 0.86)
          : 0.9,
    probabilities = [codeProbability, 1 - codeProbability],
    lengths = blocks ? [100, 100] : [100, 900];
  return {
    blocks,
    prediction,
    probabilities,
    lengths,
    shares: share(probabilities, lengths),
  };
}
export function dedupSnapshot(beat, progress) {
  const seconds = bounded(progress) * [18, 18.624, 18.752][beat],
    sets = NEAR_DUPLICATE_TEXT.map((s) => [...shingles(s)]),
    intersection = sets[0].filter((s) => sets[1].includes(s)),
    union = [...new Set(sets.flat())],
    shown =
      beat < 1 ? 0 : beat > 1 ? 4 : Math.min(4, Math.floor(5 * bounded((seconds - 2.6375) / 2.9)));
  return {
    seconds,
    sets,
    intersection,
    union,
    shown,
    comparing: beat > 1 || (beat === 1 && seconds >= 5.7),
    exact: beat > 1 || (beat === 1 && seconds >= 13.45),
    decision: beat > 1 || (beat === 1 && seconds >= 17.075),
    similarity: intersection.length / union.length,
    threshold: 0.5,
    exactDuplicate: corpus[0].text.trim().toLowerCase() === corpus[1].text.trim().toLowerCase(),
    merged: beat === 0 && seconds >= 12.5875,
  };
}
export function boundarySnapshot(beat, progress) {
  const seconds = bounded(progress) * [16.608, 16.992, 17.624][beat],
    query =
      beat === 0
        ? 3
        : beat === 1
          ? seconds < 10.825
            ? 3
            : Math.min(5, 3 + Math.floor(3 * bounded((seconds - 10.825) / 4.7)))
          : 3,
    mask = PACKED_WORDS.map((_, i) => PACKED_WORDS.map((_, j) => Number(packedMask(i, j))));
  return {
    seconds,
    query,
    mask,
    visible: beat > 0 || seconds >= 3.9375,
    blocked: beat > 1 || (beat === 1 && seconds >= 3.5125),
    boundaryMasked: beat === 2 && seconds >= 3.9,
    allowed: PACKED_WORDS.map((_, i) => i).filter((i) => packedMask(query, i)),
    denied: PACKED_WORDS.map((_, i) => i).filter((i) => i <= query && !packedMask(query, i)),
  };
}
export function preparationBranch(threshold) {
  const survivors = corpus.filter((row) => row.score >= threshold),
    unique = survivors.filter(
      (row, i, all) => all.findIndex((other) => other.text === row.text) === i,
    ),
    tokens = unique.reduce((sum, row) => sum + row.tokens, 0),
    mean = unique.reduce((sum, row) => sum + row.tokens * row.score, 0) / tokens;
  return {
    survivors,
    unique,
    tokens,
    mean,
  };
}
export function transferSnapshot(beat, progress) {
  const seconds = bounded(progress) * [17.448, 17.496, 14.864][beat],
    strictThreshold =
      beat > 1 ? 0.85 : beat === 1 ? 0.5 + 0.35 * bounded((seconds - 1.5375) / 1.2) : 0.5,
    baseline = preparationBranch(0.5),
    strict = preparationBranch(strictThreshold),
    phase = beat > 0 ? 3 : seconds >= 10.2875 ? 2 : seconds >= 7.1375 ? 1 : 0,
    blocks = ['C', 'A', 'C', 'E'].slice(
      0,
      beat > 0 ? 4 : Math.min(4, Math.floor(5 * bounded((seconds - 11.3375) / 3.3))),
    ),
    correct = Object.fromEntries(
      Object.entries(PROXY_RESULTS).map(([k, values]) => [k, values.filter(Boolean).length]),
    );
  return {
    seconds,
    baseline,
    strict,
    strictThreshold,
    phase,
    blocks,
    correct,
    proxyReady: beat > 1 || (beat === 1 && seconds >= 11.8875),
  };
}
export function inventoryFixture() {
  const filtered = corpus.filter((record) => record.score >= 0.5),
    unique = filtered.filter(
      (record, index, all) => all.findIndex((other) => other.text === record.text) === index,
    );
  return {
    filtered,
    unique,
    counts: [corpus, filtered, unique].map((records) => ({
      documents: records.length,
      tokens: records.reduce((sum, record) => sum + record.tokens, 0),
    })),
  };
}
export function extractionSnapshot(beat, progress, cues) {
  const seconds = Math.max(0, Math.min(1, progress)) * [17.496, 15.384, 15.968][beat];
  const phase = (from, to) => Math.max(0, Math.min(1, (seconds - from) / (to - from)));
  const spans = extractionFixture.filter((row) => row.role === 'body');
  const cueProgress = (key) => bounded(cues?.[key]?.progress ?? 0);
  const sweep = (key) => {
    const p = 2 * cueProgress(key);
    return [bounded(p), bounded(p - 1)];
  };
  const measured = cues?.['extract-b2-1'] && cues?.['extract-code'];
  const amounts = measured
    ? [...sweep('extract-b2-1'), ...sweep('extract-code')]
    : beat === 0
      ? [0, 0, 0, 0]
      : beat > 1
        ? [1, 1, 1, 1]
        : [
            [0.11, 1.5],
            [1.5, 2.92],
            [3.76, 4.5],
            [4.5, 5.6],
          ].map(([a, z]) => phase(a, z));
  const copied = spans.filter((_, i) => amounts[i] === 1),
    code = copied.filter((row) => row.code).map((row) => row.text);
  return {
    seconds,
    spans,
    amounts,
    copied,
    selected: measured ? cueProgress('extract-b1-2') : beat > 0 ? 1 : phase(8.47, 11.3),
    excludedOpacity: measured
      ? 1 - 0.6 * cueProgress('extract-b2-2')
      : beat === 0
        ? 1
        : beat > 1
          ? 0.4
          : 1 - 0.6 * phase(1.26, 3.3),
    indentation: code.length === 2 ? (code[1].match(/^ */)?.[0].length ?? 0) : null,
    punctuation: copied.filter((row) => !row.code).every((row) => row.text.endsWith('.')),
    probeReady: measured
      ? cues['extract-code'].phase === 'after'
      : beat > 1 || (beat === 1 && seconds >= 5.6),
  };
}
export function filterState(state) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cue = state.cues?.['filter-threshold-rise'],
    progress = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : cue.progress
      : Math.max(0, Math.min(1, (p - 0.04) / 0.86));
  const spoken = (id) => {
    const item = state.cues?.[id];
    return !item || item.phase === 'before' ? 0 : item.phase === 'after' ? 1 : item.progress;
  };
  const movingThreshold =
    beat === 0
      ? 0.2
      : beat === 1
        ? cue?.phase
          ? 0.2 +
            0.49 * spoken('filter-threshold-rise') +
            0.1 * spoken('filter-b2-1') +
            0.06 * spoken('filter-b2-2')
          : 0.2 + 0.65 * progress
        : 0.5;
  const threshold = Math.round(100 * movingThreshold) / 100;
  const removalCue = state.cues?.['filter-b3-1'],
    fallbackSeconds = p * 16.856,
    sourceRule =
      beat >= 2 &&
      (removalCue ? removalCue.phase === 'after' : beat > 2 || fallbackSeconds >= 4.5625),
    removalProgress =
      beat < 2
        ? 0
        : removalCue
          ? removalCue.phase === 'before'
            ? 0
            : removalCue.phase === 'after'
              ? 1
              : bounded(removalCue.progress)
          : Number(sourceRule);
  const records = corpus.filter(
      (record) =>
        record.score >= threshold &&
        (!sourceRule || (record.source === 'Prose' && record.tokens >= 200)),
    ),
    tokens = records.reduce((sum, record) => sum + record.tokens, 0),
    average = records.reduce((sum, record) => sum + record.tokens * record.score, 0) / tokens;
  return {
    threshold,
    sourceRule,
    removalProgress,
    records,
    tokens,
    average,
  };
}
export function validateOriginalModel() {
  const stages = [
    {},
    {
      'filter-threshold-rise': {
        phase: 'after',
      },
      'filter-b2-1': {
        phase: 'during',
        progress: 0.5,
      },
    },
    {
      'filter-threshold-rise': {
        phase: 'after',
      },
      'filter-b2-1': {
        phase: 'after',
      },
      'filter-b2-2': {
        phase: 'during',
        progress: 0.5,
      },
    },
  ].map((cues) =>
    filterState({
      beat: 1,
      beatP: 0,
      cues: {
        'filter-threshold-rise': {
          phase: 'before',
        },
        ...cues,
      },
    }),
  );
  assert.deepEqual(
    stages.map((s) => s.tokens),
    [800, 680, 480],
  );
  assert(stages[0].average < stages[1].average && stages[1].average < stages[2].average);
  assert.deepEqual(dedupSnapshot(1, 1).intersection, ['the cat sat', 'cat sat on']);
  assert.equal(dedupSnapshot(1, 1).union.length, 6);
  assert.equal(dedupSnapshot(1, 1).similarity, 1 / 3);
  assert(dedupSnapshot(0, 1).merged);
  assert.deepEqual(boundarySnapshot(1, 4 / 16.992).allowed, [3]);
  assert.deepEqual(boundarySnapshot(1, 4 / 16.992).denied, [0, 1, 2]);
  assert.deepEqual(boundarySnapshot(1, 1).allowed, [3, 4, 5]);
  assert(boundarySnapshot(2, 4 / 17.624).boundaryMasked);
  assert.equal(preparationBranch(0.5).tokens, 560);
  assert.equal(preparationBranch(0.85).tokens, 240);
  assert.deepEqual(transferSnapshot(1, 1).correct, {
    baseline: 7,
    strict: 5,
  });
  assert.equal(extractionSnapshot(0, 1).copied.length, 0);
  assert.equal(extractionSnapshot(1, 3.5 / 15.384).copied.length, 2);
  assert.equal(extractionSnapshot(1, 5.61 / 15.384).indentation, 4);
  assert.equal(extractionSnapshot(2, 0).punctuation, true);
  assert.equal(
    extractionSnapshot(2, 0).copied.some((row) => row.role !== 'body'),
    false,
  );
  assert.deepEqual(extractionSnapshot(1, 1).copied, extractionSnapshot(2, 0).copied);
  const prediction = filterState({
      beat: 2,
      beatP: 2 / 16.856,
    }),
    answer = filterState({
      beat: 2,
      beatP: 5 / 16.856,
    });
  assert.deepEqual(
    prediction.records.map((record) => record.id),
    ['A', 'B', 'C', 'E'],
  );
  assert.equal(prediction.tokens, 800);
  assert.equal(prediction.sourceRule, false);
  assert.deepEqual(
    answer.records.map((record) => record.id),
    ['A', 'B', 'E'],
  );
  assert.equal(answer.tokens, 680);
  assert.equal(answer.sourceRule, true);
  assert.equal(
    filterState({
      beat: 2,
      beatP: 4.5 / 16.856,
    }).sourceRule,
    false,
  );
  assert.deepEqual(inventoryFixture().counts, [
    {
      documents: 5,
      tokens: 1000,
    },
    {
      documents: 4,
      tokens: 800,
    },
    {
      documents: 3,
      tokens: 560,
    },
  ]);
  assert.deepEqual(
    inventoryFixture().unique.map((record) => record.id),
    ['A', 'C', 'E'],
  );
  assert.equal(jaccard('the cat sat on the mat', 'the cat sat on a mat'), 1 / 3);
  assert.equal(
    corpus.reduce((sum, x) => sum + x.tokens, 0),
    1000,
  );
  const filtered = corpus.filter((x) => x.score >= 0.5);
  assert.equal(
    filtered.reduce((sum, x) => sum + x.tokens, 0),
    800,
  );
  const unique = filtered.filter((x, i, a) => a.findIndex((y) => y.text === x.text) === i);
  assert.equal(
    unique.reduce((sum, x) => sum + x.tokens, 0),
    560,
  );
  assert.deepEqual(share([0.5, 0.5], [100, 900]), [0.1, 0.9]);
  assert(Math.abs(share([0.9, 0.1], [100, 900])[0] - 0.5) < 1e-12);
  const mixturePrediction = mixtureSnapshot(2, 1, {
      'mixture-equal-blocks': {
        phase: 'before',
        progress: 0,
      },
    }),
    blocks = mixtureSnapshot(2, 0, {
      'mixture-equal-blocks': {
        phase: 'during',
        progress: 0.1,
      },
    });
  assert(mixturePrediction.prediction && !mixturePrediction.blocks);
  assert(!blocks.prediction && blocks.blocks);
  assert.deepEqual(blocks.lengths, [100, 100]);
  assert.deepEqual(blocks.probabilities, [0.5, 0.5]);
  assert.deepEqual(blocks.shares, [0.5, 0.5]);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  const retainedTokens = (code, other) =>
    releaseBatch
      .filter((record) => record.score >= (record.source === 'Code' ? code : other))
      .reduce((sum, record) => sum + record.tokens, 0);
  assert.equal(retainedTokens(0.7, 0.7), 600);
  assert.equal(retainedTokens(0.9, 0.9), 180);
  assert.equal(retainedTokens(0.7, 0.9), 300);
  assert(releaseEvaluation.baseline[1] >= releaseEvaluation.codeFloor);
  assert(releaseEvaluation.candidate[1] < releaseEvaluation.codeFloor);
  assert.deepEqual(
    PROXY_RESULTS.baseline.flatMap((pass, i) => (pass !== PROXY_RESULTS.strict[i] ? [i + 1] : [])),
    [1, 2],
  );
  assert.deepEqual(documentSample(0.5).tokens, [500, 4500]);
  assert.deepEqual(documentSample(0.9).tokens, [900, 900]);
  assert.deepEqual(
    packRecords([7, 6, 5, 5, 3, 2]).map((b) => b.map((v) => v.n)),
    [
      [7, 3],
      [6, 2],
      [5, 5],
    ],
  );
  assert.deepEqual(bpeReplay(['rotate', 'keys', 'after', 'review'], BPE_RULES), [
    ['rota', 'te', '</w>'],
    ['k', 'e', 'y', 's', '</w>'],
    ['after</w>'],
    ['r', 'e', 'v', 'i', 'e', 'w', '</w>'],
  ]);
  assert.deepEqual(
    independentObjective([11, 12, 99, 21, 99], [0, 0, 0, 1, 1]).targets,
    [12, 99, -100, 99, -100],
  );
  return true;
}
