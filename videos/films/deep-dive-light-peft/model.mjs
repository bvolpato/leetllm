import {
  CENTERED_SCORE_DIFFERENCE,
  FFN,
  FFN_CUT,
  FIGURE4,
  HEAD_SCORES,
  IDENTITY_FIXTURE,
  IDS,
  MODULE_SCORES,
  RANK_SCORES,
  TABLE1,
  TABLE5,
} from './fixtures.mjs';
import { clamp01, ease, keepAbove, multiply, quantile } from './arithmetic.mjs';
import {
  ADAPTER_PAIRS_AT_RANK_ONE,
  DENSE_PAIRS_PER_TOKEN,
  FFN_SELECTION,
  HEAD_SELECTION,
  MODULE_SELECTION,
  RANK_SELECTION,
  tracks,
} from './construction.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const spokenProgress = (state, id, fallback) => {
  const cue = state.cues?.[id];
  return !cue
    ? fallback
    : cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : clamp01(cue.progress);
};
export function beatCue(state, beat, id, from = 0, to = 1) {
  const current = state.beat ?? 0;
  const fallback =
    current === beat ? clamp01(((state.beatP ?? 0) - from) / (to - from)) : Number(current > beat);
  return spokenProgress(state, id, fallback);
}
export function projectionLedger(state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0;
  const projections = ['query', 'key', 'value', 'output'].map((id, index) => ({
    id,
    label: ['Q', 'K', 'V', 'O'][index],
    rows: 8,
    columns: 8,
    progress: beat > 0 ? 1 : spokenProgress(state, `cost-${id}-product`, clamp01(p * 4 - index)),
  }));
  const ffn =
    beat > 1 ? 1 : beat === 1 ? spokenProgress(state, 'cost-ffn-products', clamp01(p * 3)) : 0;
  const products = [
    ...projections,
    ...['FFN up', 'FFN down'].map((label, index) => ({
      id: index ? 'ffn-down' : 'ffn-up',
      label,
      rows: index ? 32 : 8,
      columns: index ? 8 : 32,
      progress: clamp01(ffn * 2 - index),
    })),
  ].map((product) => ({
    ...product,
    pairs: product.rows * product.columns,
    counted: Math.round(product.rows * product.columns * product.progress),
  }));
  return {
    products,
    counted: products.reduce((sum, product) => sum + product.counted, 0),
    fourTokens:
      beat > 1 || (beat === 1 && spokenProgress(state, 'cost-four-tokens', p > 0.6 ? 1 : 0) > 0),
    adapter: beat === 2 ? spokenProgress(state, 'cost-beat-3-focus-1', clamp01(p * 3)) : 0,
  };
}
export function identityCacheKey(revision, heads, ranks = ['r2', 'r4']) {
  return `${revision} · heads [${heads.join(', ')}] · ranks [${ranks.join(', ')}]`;
}
export function ffnConstruction(beat, progress) {
  const seconds = clamp01(progress) * [15.052, 13.88, 16.136][beat],
    sorted = FFN.map((row, index) => ({
      ...row,
      index,
    })).sort((a, b) => a.score - b.score),
    sortProgress = beat === 1 ? clamp01((seconds - 0.3) / 2.65) : beat > 1 ? 1 : 0;
  const cutoff = beat > 1 ? 1 : beat === 1 ? clamp01((seconds - 6.55) / 2.3) : 0;
  const slice =
    beat === 0 ? clamp01((seconds - 5.85) / 3.5) : beat === 2 ? clamp01((seconds - 2.8) / 6.1) : 0;
  return {
    seconds,
    sorted,
    sortProgress,
    cutoff,
    slice,
    threshold: FFN_SELECTION.threshold,
    kept: FFN_SELECTION.kept,
  };
}
export function adapterConstruction(beat, progress) {
  const seconds = clamp01(progress) * [15.892, 15.924, 17.6][beat];
  return {
    seconds,
    moduleVisible: beat > 0 || seconds >= 2.38,
    rankVisible: beat > 0 || seconds >= 6.09,
    moduleCutoff: beat > 0 && seconds >= 1.2,
    moduleDropped: beat > 1 || (beat === 1 && seconds >= 3.5),
    rankCutoff: beat > 1 || (beat === 1 && seconds >= 7.5),
    slice: beat > 1 ? 1 : beat === 1 ? clamp01((seconds - 10.53) / 3.6) : 0,
    reflow: beat === 2 ? clamp01(seconds / 0.6) : 0,
    focus: beat === 2 && seconds < 5.7 ? (seconds < 4.2 ? 'r2' : 'r4') : null,
    signed: beat === 2 && seconds >= 7.2,
    magnitude: beat === 2 && seconds >= 11.3,
    cancellation: beat === 2 ? clamp01((seconds - 8.35) / 1.4) : 0,
  };
}
export function sampleModel(id, state) {
  const stage = tracks[id].sample(state).snapshot.stage;
  const q = ease(state.beatP);
  if (id === 'opening')
    return {
      stage,
      q,
      densePairs: DENSE_PAIRS_PER_TOKEN,
      adapterPairs: ADAPTER_PAIRS_AT_RANK_ONE,
    };
  if (id === 'cost') {
    const tokens = stage === 0 ? 1 : 4;
    return {
      stage,
      q,
      tokens,
      densePairs: DENSE_PAIRS_PER_TOKEN,
      denseTotal: DENSE_PAIRS_PER_TOKEN * tokens,
      adapterPairs: ADAPTER_PAIRS_AT_RANK_ONE,
    };
  }
  if (id === 'handoff')
    return {
      stage,
      q,
      time: stage === 2 ? 2 + 2 * q : stage + q,
      phases: ['estimate prefix', 'write records', 'slice + restore', 'continue training'],
    };
  if (id === 'heads') {
    const active = stage === 0 ? Math.ceil(q * HEAD_SCORES.length) : HEAD_SCORES.length;
    const sorted = HEAD_SCORES.map((score, index) => ({
      score,
      index,
    })).sort((a, b) => a.score - b.score || a.index - b.index);
    const sortedCount =
      stage === 0
        ? 0
        : stage === 1
          ? state.cues?.['heads-sort-scores']
            ? Math.min(4, Math.ceil(4 * spokenProgress(state, 'heads-sort-scores', 0)))
            : Math.min(4, Math.floor(q * 5))
          : 4;
    const thresholdProgress =
      stage === 1
        ? clamp01(spokenProgress(state, 'heads-beat-2-focus-1', clamp01((q - 0.8) / 0.18)) / 0.94)
        : stage === 2
          ? 1
          : 0;
    const thresholdValue = 0.08 + (HEAD_SELECTION.threshold - 0.08) * thresholdProgress;
    return {
      stage,
      q,
      scores: HEAD_SCORES,
      sorted,
      sortedCount,
      threshold: HEAD_SELECTION.threshold,
      thresholdProgress,
      thresholdValue,
      kept: HEAD_SELECTION.kept,
      active,
      projectionsProgress: stage === 2 ? q : 0,
      projectionHeads: HEAD_SELECTION.kept,
    };
  }
  if (id === 'ffn') {
    const active = stage === 0 ? Math.ceil(q * FFN.length) : FFN.length;
    return {
      stage,
      q,
      scores: FFN,
      threshold: quantile(
        FFN.map((row) => row.score),
        FFN_CUT,
      ),
      kept: FFN_SELECTION.kept,
      active,
    };
  }
  if (id === 'adapter')
    return {
      stage,
      q,
      moduleScores: MODULE_SCORES,
      moduleThreshold: MODULE_SELECTION.threshold,
      keptModules: MODULE_SELECTION.kept,
      rankScores: RANK_SCORES,
      rankThreshold: RANK_SELECTION.threshold,
      keptRanks: RANK_SELECTION.kept,
      ranksRevealed: stage > 0,
      scoreDifference: CENTERED_SCORE_DIFFERENCE,
    };
  if (id === 'evidence')
    return {
      stage,
      q,
      table1: TABLE1,
      figure4: FIGURE4,
      table5: TABLE5,
      selected: stage,
    };
  return {
    stage,
    q,
    identity: IDENTITY_FIXTURE,
    sameWidth: IDENTITY_FIXTURE.baseA.length === IDENTITY_FIXTURE.baseB.length,
    identityMatches: IDENTITY_FIXTURE.baseA.every(
      (value, index) => value === IDENTITY_FIXTURE.baseB[index],
    ),
    cacheKey:
      stage > 0 || spokenProgress(state, 'deployment-beat-1-focus-1', 0) > 0
        ? 'base revision + selected coordinates + adapter'
        : 'base revision + adapter',
    distribution: stage < 1 ? 'early prefix D₀' : 'post-prune policy D₁',
  };
}
export function validateModel() {
  const finished = (phase) => ({
    phase,
    progress: phase === 'after' ? 1 : 0,
  });
  const counted = projectionLedger({
    beat: 1,
    cues: {
      'cost-ffn-products': finished('after'),
    },
  });
  assert.equal(counted.counted, DENSE_PAIRS_PER_TOKEN);
  assert(counted.products.every((product) => product.counted === product.rows * product.columns));
  assert.notEqual(
    identityCacheKey('R1', IDENTITY_FIXTURE.baseA),
    identityCacheKey('R1', IDENTITY_FIXTURE.baseB),
  );
  assert.equal(
    sampleModel('heads', {
      beat: 1,
      beatP: 0.1,
      cues: {
        'heads-beat-2-focus-1': finished('after'),
      },
    }).thresholdValue,
    HEAD_SELECTION.threshold,
  );
  assert.equal(ffnConstruction(1, 3 / 13.88).cutoff, 0);
  assert.equal(ffnConstruction(2, 9 / 16.136).slice, 1);
  assert.equal(adapterConstruction(0, 0).rankCutoff, false);
  assert.equal(adapterConstruction(1, 9.5 / 15.924).rankCutoff, true);
  assert.equal(adapterConstruction(1, 14.2 / 15.924).slice, 1);
  assert(Math.abs(HEAD_SELECTION.threshold - 0.425) < 1e-12);
  assert.deepEqual(HEAD_SELECTION.kept, [0, 2, 3]);
  assert(
    Math.abs(
      quantile(
        FFN.map((row) => row.score),
        FFN_CUT,
      ) - 0.246,
    ) < 1e-12,
  );
  assert.deepEqual(FFN_SELECTION.kept, [1, 2, 4]);
  assert(Math.abs(MODULE_SELECTION.threshold - 0.0862) < 1e-12);
  assert.deepEqual(MODULE_SELECTION.kept, [1, 2]);
  assert(Math.abs(RANK_SELECTION.threshold - 0.1) < 1e-12);
  assert.deepEqual(RANK_SELECTION.kept, [1, 3]);
  assert.equal(quantile([1, 2, 3, 4], 0), 1);
  assert.equal(quantile([1, 2, 3, 4], 1), 4);
  assert.deepEqual(keepAbove([1, 1, 1, 1], 0.25).kept, []);
  assert.throws(() => quantile([], 0.5), /finite scores/);
  assert.throws(() => quantile([1, Number.NaN], 0.5), /finite scores/);
  assert.equal(DENSE_PAIRS_PER_TOKEN, 768);
  assert.equal(DENSE_PAIRS_PER_TOKEN * 4, 3072);
  assert.equal(ADAPTER_PAIRS_AT_RANK_ONE, 16);
  assert.deepEqual(
    FFN_SELECTION.kept.map((index) => FFN[index].id),
    ['L0-n2', 'L0-n3', 'L1-n2'],
  );
  assert.equal(CENTERED_SCORE_DIFFERENCE.paperMagnitude, 4);
  assert.equal(CENTERED_SCORE_DIFFERENCE.trainerSignedMean, 0);
  assert(TABLE1[1].retained > TABLE1[2].retained);
  assert(TABLE1[1].average > TABLE1[2].average);
  assert(TABLE1[1].speed < TABLE1[2].speed);
  assert.equal(FIGURE4.speed, 2.2);
  assert.equal(TABLE5.inferenceSpeed, 1.6);
  assert.equal(TABLE5.loadMemory, 6.4);
  assert.equal(TABLE5.baselineMemory, 12.5);
  assert.equal(
    sampleModel('handoff', {
      beat: 2,
      beatP: 1,
    }).time,
    4,
  );
  assert(
    sampleModel('deployment', {
      beat: 2,
      beatP: 0.5,
    }).sameWidth,
  );
  assert.equal(
    sampleModel('deployment', {
      beat: 2,
      beatP: 0.5,
    }).identityMatches,
    false,
  );
  assert(
    sampleModel('deployment', {
      beat: 1,
      beatP: 0.5,
    }).cacheKey.includes('selected coordinates'),
  );
  assert.equal(
    sampleModel('deployment', {
      beat: 0,
      beatP: 0,
    }).distribution,
    'early prefix D₀',
  );
  assert.equal(
    sampleModel('deployment', {
      beat: 1,
      beatP: 0,
    }).distribution,
    'post-prune policy D₁',
  );
  assert.equal(
    sampleModel('adapter', {
      beat: 0,
      beatP: 0,
    }).ranksRevealed,
    false,
  );
  assert.equal(
    sampleModel('adapter', {
      beat: 1,
      beatP: 0,
    }).ranksRevealed,
    true,
  );
  assert.equal(
    sampleModel('heads', {
      beat: 1,
      beatP: 0.02,
    }).sortedCount,
    0,
  );
  assert.equal(
    sampleModel('heads', {
      beat: 1,
      beatP: 0.5,
    }).sortedCount,
    2,
  );
  assert.deepEqual(
    sampleModel('heads', {
      beat: 1,
      beatP: 0.98,
    }).sorted.map((row) => row.index),
    [1, 3, 2, 0],
  );
  assert(
    Math.abs(
      sampleModel('heads', {
        beat: 1,
        beatP: 0.98,
      }).thresholdValue - 0.425,
    ) < 1e-12,
  );
  assert.deepEqual(
    sampleModel('heads', {
      beat: 2,
      beatP: 0.98,
    }).kept,
    [0, 2, 3],
  );
  assert.deepEqual(
    sampleModel('heads', {
      beat: 2,
      beatP: 0.98,
    }).projectionHeads,
    [0, 2, 3],
  );
  assert.equal(
    sampleModel('heads', {
      beat: 2,
      beatP: 0.02,
    }).projectionsProgress,
    sampleModel('heads', {
      beat: 2,
      beatP: 0.02,
    }).q,
  );
  for (const id of IDS)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.15, 0.5, 0.85, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.stage, beat);
        assert(Number.isFinite(s.q));
        if (id === 'heads') assert(s.active >= 0 && s.active <= 4);
        if (id === 'ffn') assert(s.active >= 0 && s.active <= 5);
        if (id === 'handoff') assert(s.time >= 0 && s.time <= 4);
        if (id === 'adapter') assert.equal(s.ranksRevealed, beat > 0);
        if (id === 'deployment') assert.equal(s.sameWidth, true);
      }
  return true;
}
export function linearFixture(input = [2, -1]) {
  const W = [
      [1, 2],
      [-1, 1],
    ],
    A = [
      [1, 0],
      [0, 1],
    ],
    B = [
      [1, 2],
      [0, -1],
    ],
    scale = 0.5;
  const base = multiply(W, input),
    activation = multiply(A, input),
    unscaled = multiply(B, activation);
  const update = unscaled.map((v) => v * scale);
  return {
    input,
    W,
    A,
    B,
    scale,
    base,
    activation,
    unscaled,
    update,
    output: base.map((v, i) => v + update[i]),
  };
}
export function rankFixture(kept = [1, 3], columns = kept, scale = 1) {
  const A = [
      [1, 2, 0],
      [0, 1, 3],
      [2, 0, 1],
      [1, -1, 2],
    ],
    B = [
      [1, 2, 3, 4],
      [-2, 1, 0, 3],
    ],
    input = [2, -1, 3];
  assert(
    kept.length === columns.length &&
      new Set(kept).size === kept.length &&
      new Set(columns).size === columns.length,
  );
  assert([...kept, ...columns].every((i) => Number.isInteger(i) && i >= 0 && i < 4));
  const activation = multiply(A, input),
    terms = kept.map((r, i) => B.map((row) => row[columns[i]] * activation[r] * scale));
  const output = B.map((_, row) => terms.reduce((sum, v) => sum + v[row], 0));
  return {
    A,
    B,
    input,
    kept,
    columns,
    scale,
    activation,
    terms,
    output,
  };
}
export function headFixture(input = [1, -1]) {
  const rows = [
      [1, 0],
      [-2, -6],
      [1, -1],
      [3, -5],
    ],
    contributions = multiply(rows, input);
  const selected = {
    A: [0, 2, 3],
    B: [0, 1, 3],
  };
  const outputs = Object.fromEntries(
    Object.entries(selected).map(([id, ids]) => [
      id,
      ids.reduce((sum, i) => sum + contributions[i], 0),
    ]),
  );
  return {
    input,
    rows,
    contributions,
    selected,
    outputs,
    cacheCompatible: selected.A.every((id, i) => id === selected.B[i]),
  };
}
export function stopwatchFixture() {
  const baseline = 120,
    parts = [
      {
        label: 'estimate',
        minutes: 10,
      },
      {
        label: 'records',
        minutes: 2,
      },
      {
        label: 'surgery',
        minutes: 3,
      },
      {
        label: 'continue',
        minutes: 65,
      },
      {
        label: 'evaluate',
        minutes: 10,
      },
    ];
  const candidate = parts.reduce((sum, p) => sum + p.minutes, 0);
  return {
    baseline,
    parts,
    candidate,
    ratio: baseline / candidate,
    saved: (baseline - candidate) / baseline,
  };
}
export function historyFixture() {
  const history = [0.6, 0.5, 0.3, 0.2, Number.NaN, 0.4],
    later = history.slice(Math.floor(history.length / 2));
  return {
    history,
    later,
    invalid: later.filter((v) => !Number.isFinite(v)).length,
    zeroFilled: later.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0) / later.length,
    dropped:
      later.filter(Number.isFinite).reduce((a, b) => a + b, 0) /
      later.filter(Number.isFinite).length,
  };
}
export function maskReceiptFixture() {
  const source = {
    modelRevision: 'R17',
    scores: [...HEAD_SCORES],
    selected: [...HEAD_SELECTION.kept],
  };
  const bytes = JSON.stringify(source),
    digest = createHash('sha256').update(bytes).digest('hex');
  return {
    ...source,
    bytes,
    digest,
    receivingHeads: [...source.selected],
    receivingShape: [3, 2],
  };
}
export function maskReceiptMatches(record, receiver) {
  const source = JSON.parse(record.bytes);
  return (
    createHash('sha256').update(record.bytes).digest('hex') === record.digest &&
    source.modelRevision === receiver.modelRevision &&
    source.selected.length === receiver.selected.length &&
    source.selected.every((id, i) => id === receiver.selected[i]) &&
    receiver.shape[0] === source.selected.length &&
    receiver.shape[1] === 2
  );
}
export function ffnPathFixture(removed = true, matched = true) {
  const activation = [2, 3, -1],
    weights = [1, 2, -1],
    kept = removed ? [1, 2] : [0, 1, 2];
  const h = kept.map((i) => activation[i]),
    down = (matched ? kept : [0, 1, 2]).map((i) => weights[i]);
  return {
    activation: h,
    down,
    ids: kept.map((i) => 'n' + (i + 1)),
    valid: h.length === down.length,
    output: h.length === down.length ? h.reduce((sum, v, i) => sum + v * down[i], 0) : null,
  };
}
