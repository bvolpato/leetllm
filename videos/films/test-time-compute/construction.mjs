import { promptCoverage, rawKVBytes, smoothstep, ttClamp, ttSmooth } from './arithmetic.mjs';
import { PRUNING_CUE, answer, prune, scored, scores } from './fixtures.mjs';
import { chooseFeasible, retainedBranchLedger } from './model.mjs';
export function selectorSnapshot(beat, p) {
  const count = beat === 0 ? 1 + Number(p >= 0.26) + Number(p >= 0.6) : 3,
    rows = scored.slice(0, count),
    winner = rows.reduce((a, v) => (v.score > a.score ? v : a));
  return {
    rows,
    winner,
    correct: winner.answer === answer,
  };
}
export function selectorCueSnapshot(beat, lowerProgress, overratedProgress, moveProgress) {
  const count = beat > 0 ? 3 : 1 + Number(lowerProgress > 0.5) + Number(overratedProgress > 0.5);
  const rows = scored.slice(0, count),
    committed = beat > 0 || moveProgress === 1;
  const eligible = committed ? rows : rows.slice(0, 2);
  const winner = eligible.reduce((best, row) => (row.score > best.score ? row : best));
  return {
    rows,
    winner,
    pending: count === 3 && !committed,
    correct: winner.answer === answer,
  };
}
export function revisionSnapshot(beat, p) {
  const q = Math.max(0, Math.min(1, (p - 0.1) / 0.8)),
    count = beat === 0 ? 1 + Math.floor(2 * q) : beat === 1 && p < 0.4 ? 3 : 4,
    gain = count > 1 ? scores[count - 1] - scores[count - 2] : null;
  return {
    count,
    gain,
    stopped: gain !== null && gain < 0.01,
    calls: 1 + 2 * (count - 1),
  };
}
export function checkedRevisionLedger(count) {
  const answers = [32, 44, 48, 48];
  const rows = answers.slice(0, count).map((candidate, index) => ({
    id: `D${index + 1}`,
    answer: candidate,
    score: scores[index],
    passed: candidate === answer,
  }));
  return {
    rows,
    latest: rows.at(-1),
    best: rows.find((row) => row.passed) ?? null,
    gain: count > 1 ? scores[count - 1] - scores[count - 2] : null,
    calls: 1 + 2 * (count - 1),
  };
}
export function pruningSnapshot(beat, p) {
  if (beat === 0) {
    return {
      rows: [8, 8, 8, 8],
      generatedSteps: 32,
      limit: 8,
    };
  }
  const elapsed = Math.max(0, Math.min(1, p)) * PRUNING_CUE.beatSpan;
  const progress =
    beat > 1
      ? 1
      : smoothstep((elapsed - PRUNING_CUE.start) / (PRUNING_CUE.settle - PRUNING_CUE.start));
  const limit = 1 + Math.floor(7 * progress);
  const rows = prune.map((steps) => Math.min(limit, steps));
  return {
    rows,
    generatedSteps: rows.reduce((sum, steps) => sum + steps, 0),
    limit,
  };
}
export function ttCue(state, id, beat = 0) {
  const cue = state.cues?.[id];
  if (cue)
    return {
      started: cue.phase !== 'before',
      done: cue.progress === 1,
      p: cue.progress,
    };
  if (state.cues)
    return {
      started: false,
      done: false,
      p: 0,
    };
  const q =
    (state.beat ?? 0) < beat
      ? 0
      : (state.beat ?? 0) > beat
        ? 1
        : ttClamp(((state.beatP ?? 0) - 0.16) / 0.68);
  return {
    started: q > 0,
    done: q === 1,
    p: q,
  };
}
export function testTimeCoreFrame(id, state = {}) {
  const b = state.beat ?? 0,
    op = (name, beat = 0) => ttCue(state, name, beat),
    progress = ttSmooth(state.beatP ?? 0);
  if (id === 'train-time-axis')
    return {
      b,
      progress,
      processed: 20e9 * 2,
      flops: 6 * 3e9 * 40e9,
      result: op('tt-training-product'),
      weights:
        b < 2
          ? [0.2 + progress * 0.15, -0.1 - progress * 0.08, 0.4 + progress * 0.12]
          : [0.35, -0.18, 0.52],
    };
  if (id === 'provider-usage')
    return {
      b,
      progress,
      total: 1400,
      reasoning: 1220,
      visible: 180,
      charge: (1400 * 10) / 1e6,
      visibleResult: op('tt-visible-count'),
      chargeResult: op('tt-output-charge'),
      gemini: op('tt-usage-separate', 2),
    };
  if (id === 'effort-cutoff')
    return {
      b,
      progress,
      consumed: b === 0 ? 0 : Math.floor(64 * op('tt-hidden-cap', 1).p),
      capResult: op('tt-hidden-cap', 1),
      wrongResult: op('tt-completed-wrong', 2),
    };
  if (id === 'per-prompt-distribution')
    return {
      b,
      progress,
      before: promptCoverage([0.8, 0.2], 4),
      after: promptCoverage([0.99, 0.05], 4),
      single: [0.5, 0.52],
      result: op('tt-prompt-coverage', 1),
    };
  if (id === 'process-targets')
    return {
      b,
      progress,
      outcomes: [1, 0, 1, 1],
      hard: 1,
      soft: 3 / 4,
      local: false,
      result: op('tt-rollout-targets', 1),
    };
  if (id === 'search-bound') {
    const active = 0.7,
      completed = 0.8,
      next = 0.9;
    return {
      b,
      progress,
      active,
      completed,
      next,
      minHistory: [active, Math.min(active, next)],
      lastHistory: [active, next],
      bound: op('tt-path-bound', 1),
      ceiling: op('tt-proposal-ceiling', 2),
      proposals: 1 * 2 * 3,
    };
  }
  if (id === 'router-feasible') {
    const rows = [
      {
        id: 'single',
        quality: 0.78,
        latency: 240,
        cost: 0.002,
      },
      {
        id: 'bounded',
        quality: 0.86,
        latency: 780,
        cost: 0.01,
      },
      {
        id: 'guided',
        quality: 0.9,
        latency: 2600,
        cost: 0.045,
      },
    ];
    return {
      b,
      progress,
      rows,
      chosen: chooseFeasible(rows),
      single: op('tt-router-single'),
      bounded: op('tt-router-bounded', 1),
      guided: op('tt-router-guided', 1),
    };
  }
  if (id === 'memory-geometries')
    return {
      b,
      progress,
      bytesPerPosition: rawKVBytes({
        layers: 32,
        kvHeads: 8,
        width: 128,
        scalarBytes: 2,
        positions: 1,
      }),
      result: op('tt-kv-product', 1),
    };
  if (id === 'hidden-ttft')
    return {
      b,
      progress,
      rate: 80,
      other: 180,
      totals: [128, 512].map((n) => (n / 80) * 1000 + 180),
      short: op('tt-clock-short', 1),
      long: op('tt-clock-long', 1),
    };
  if (id === 'fresh-branch-repair')
    return {
      b,
      progress,
      initial: retainedBranchLedger(6),
      afterOne: retainedBranchLedger(5),
      repaired: retainedBranchLedger(4),
      candidate: op('tt-fresh-candidate', 2),
      geometry: op('tt-fresh-geometry', 2),
      bytes: op('tt-fresh-overflow', 2),
      releaseOne: op('tt-fresh-release-one', 3),
      release: op('tt-fresh-release', 3),
      repair: op('tt-fresh-fits', 3),
      spent: op('tt-fresh-spent', 4),
    };
  return {
    b,
    progress,
  };
}
