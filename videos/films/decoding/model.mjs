import { BASE, BRANCHES, LEAVES, STATUS_ROW } from './fixtures.mjs';
import {
  decodeNormalize,
  decodeRepetition,
  decodeSoftmax,
  decodeSupport,
  nucleus,
} from './arithmetic.mjs';
import { DRAW_STREAM, categoricalDraws } from './construction.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export function treeDistribution(state, fallbackProgress = 0) {
  const beat = state.beat ?? 0;
  let blend = beat < 2 ? 0 : beat > 2 ? 1 : fallbackProgress;
  if (beat === 2 && state.cues?.['tree-branch-spread']) {
    const progress = (id) => {
      const cue = state.cues[id];
      return !cue || cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : Math.max(0, Math.min(1, cue.progress));
    };
    blend = Math.max(progress('tree-branch-spread'), progress('tree-final-path-product'));
  }
  const conditionals = [0.3, 0.7 + (0.35 - 0.7) * blend, 0.35 * blend, 0.9, 0.1];
  return {
    blend,
    conditionals,
    prefixes: [0.6, 0.4],
    products: conditionals.map((value, index) => (index < 3 ? 0.6 : 0.4) * value),
  };
}
export function searchTrace(mode, state) {
  const beat = state.beat ?? 0,
    seconds = (state.beatP ?? 0) * (mode === 'greedy' ? 17.544 : 19.512);
  const stage =
    mode === 'greedy'
      ? beat === 0
        ? 0
        : beat > 1
          ? 3
          : seconds >= 9.5375
            ? 3
            : seconds >= 6.5375
              ? 2
              : seconds >= 5.5375
                ? 1
                : 0
      : beat > 0
        ? 4
        : seconds >= 11.35
          ? 4
          : seconds >= 9.25
            ? 3
            : seconds >= 6.9125
              ? 2
              : seconds >= 3.175
                ? 1
                : 0;
  const ranked = LEAVES.map((leaf, index) => ({
    ...leaf,
    index,
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  return {
    stage,
    reference: mode === 'greedy' && beat === 0,
    prefixes: mode === 'greedy' ? (stage ? [0] : []) : stage ? [0, 1] : [],
    retainedLeaves:
      mode === 'greedy'
        ? stage === 3
          ? [1]
          : stage === 2
            ? [1, 2]
            : []
        : stage === 4
          ? ranked.slice(0, 2).map((row) => row.index)
          : [],
    expanded: mode === 'greedy' ? stage >= 2 : stage >= 2,
    scoresVisible: mode === 'greedy' ? stage >= 2 : stage >= 3,
    frontier: mode === 'beam' && stage === 4 ? ranked.slice(0, 2) : [],
  };
}
export function truncationState(mode, state) {
  const b = state.beat ?? 0,
    p = state.beatP ?? 0;
  const ramp = (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start)));
  if (mode === 'top-k') {
    const removed = b > 0 ? 1 : ramp(p * 17.016, 4.1625, 5.1625);
    const normalized = b < 1 ? 0 : b > 1 ? 1 : ramp(p * 19.68, 8.2375, 11.1);
    const values = BASE.map((v, i) =>
      i < 2 ? v * (1 + normalized * (1 / 0.7 - 1)) : v * (1 - removed),
    );
    return {
      values,
      ids: [0, 1],
      sum: values.reduce((a, v) => a + v, 0),
      normalized,
    };
  }
  const T = b === 2 ? 1 + 0.7 * ramp(p * 18.632, 0.4375, 5.5) : 1;
  const probs = stableSoftmax(BASE.map(Math.log), T);
  const count =
    b === 0
      ? p * 16.32 < 4.45
        ? 0
        : p * 16.32 < 5.6
          ? 1
          : p * 16.32 < 7.15
            ? 2
            : 3
      : nucleus(probs).length;
  const ids = nucleus(probs).slice(0, count),
    sum = ids.reduce((a, i) => a + probs[i], 0);
  const normalized = b === 1 ? ramp(p * 18.192, 8.7375, 10) : b > 1 ? 1 : 0;
  const values = probs.map((v, i) =>
    normalized
      ? ids.includes(i)
        ? v * (1 + normalized * (1 / sum - 1))
        : v * (1 - normalized)
      : v,
  );
  return {
    values,
    ids,
    sum,
    normalized,
    T,
  };
}
export function transferExperiment(beat, progress, cues = {}) {
  const cue = cues['transfer-nucleus-experiment'];
  const phase =
    beat > 1 ? 1 : cue ? cue.progress : Math.max(0, Math.min(1, (progress - 0.55) / 0.4));
  const ramp = (a, z) => Math.max(0, Math.min(1, (phase - a) / (z - a)));
  const edge =
    beat > 1
      ? 1
      : cues['transfer-edge-change']
        ? cues['transfer-edge-change'].progress
        : ramp(0, 0.3);
  const soundly = 0.9 - 0.4 * edge,
    threshold = 0.7 + 0.2 * (cue ? phase : ramp(0.3, 1));
  const paths = BRANCHES.flatMap((branch, i) =>
    branch.next.map(([word, conditional], j) => ({
      text: `${branch.word} ${word}`,
      prefix: branch.word,
      first: branch.p,
      conditional: i === 1 ? (j === 0 ? soundly : 1 - soundly) : conditional,
    })),
  ).map((row, index) => {
    // Score the same hundredth-precision edge values the panel displays.
    const first = Number(row.first.toFixed(2)),
      conditional = Number(row.conditional.toFixed(2));
    return {
      ...row,
      index,
      first,
      conditional,
      score: first * conditional,
    };
  });
  const rank = (rows) =>
    [...rows].sort((a, z) =>
      Math.abs(z.score - a.score) < 1e-12 ? a.index - z.index : z.score - a.score,
    );
  return {
    soundly,
    threshold,
    paths,
    best: rank(paths)[0],
    beam1: rank(paths.filter((row) => row.prefix === 'ran'))[0],
    beam2: rank(paths).slice(0, 2),
    ids: nucleus(BASE, threshold),
    cumulative: BASE.map((_, i) => BASE.slice(0, i + 1).reduce((sum, v) => sum + v, 0)),
    prediction: edge === 0,
  };
}
export function drawSnapshot(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [17.088, 20.712, 20.144][beat];
  const ramp = (start, end) => Math.max(0, Math.min(1, (seconds - start) / (end - start)));
  const count =
    beat === 0
      ? seconds < 8.91
        ? 0
        : seconds < 13.1
          ? 1
          : 1 + Math.floor(ramp(13.1, 16.5) * 7.001)
      : beat === 1
        ? 8 + Math.floor(ramp(7.35, 12.3) * 92.001)
        : 100;
  const samples = DRAW_STREAM.slice(0, count),
    counts = [0, 0, 0];
  for (const draw of samples) counts[draw.bin]++;
  const ids = nucleus(BASE),
    mass = ids.reduce((sum, id) => sum + BASE[id], 0),
    probabilities = ids.map((id) => BASE[id] / mass);
  return {
    seconds,
    count,
    samples,
    counts,
    probabilities,
    ids,
    frequencies: counts.map((value) => (count ? value / count : 0)),
    current: count ? samples.at(-1) : DRAW_STREAM[0],
    drawVisible: beat > 0 || seconds >= 5.75,
    replayCount: beat === 2 ? Math.min(8, Math.floor(ramp(0.15, 2.8) * 8.001)) : 0,
  };
}
export function validateModel() {
  validateDecodingCore();
  const before = transferExperiment(1, 0, {
      'transfer-nucleus-experiment': {
        progress: 0,
      },
    }),
    after = transferExperiment(2, 0);
  assert.equal(before.best.text, 'slept soundly');
  assert.equal(before.beam1.text, 'ran home');
  assert.equal(after.best.text, 'ran home');
  assert.deepEqual(before.ids, [0, 1]);
  assert.deepEqual(after.ids, [0, 1, 2, 3]);
  for (let i = 0; i <= 100; i++) {
    const s = transferExperiment(1, 0, {
      'transfer-nucleus-experiment': {
        progress: i / 100,
      },
    });
    assert.equal(s.paths[0].first, 0.6);
    assert.equal(s.paths[3].first, 0.4);
    assert(Math.abs(s.paths.reduce((n, row) => n + row.score, 0) - 1) < 1e-12);
    assert.equal(s.beam2[0].text, s.best.text);
    assert(s.ids.reduce((n, id) => n + BASE[id], 0) >= s.threshold - 1e-12);
  }
  assert.equal(drawSnapshot(0, 8 / 17.088).count, 0);
  assert.equal(drawSnapshot(0, 9 / 17.088).count, 1);
  assert.equal(drawSnapshot(0, 1).count, 8);
  assert.deepEqual(drawSnapshot(0, 1).counts, drawSnapshot(1, 0).counts);
  assert.equal(drawSnapshot(1, 7 / 20.712).count, 8);
  assert.equal(drawSnapshot(1, 12.4 / 20.712).count, 100);
  assert.deepEqual(drawSnapshot(1, 1).counts, [58, 24, 18]);
  assert.equal(drawSnapshot(1, 1).current.token, 'slept');
  assert.deepEqual(categoricalDraws(8), DRAW_STREAM.slice(0, 8));
  for (let beat = 0; beat < 3; beat++)
    for (let step = 0; step <= 120; step++) {
      const frame = drawSnapshot(beat, step / 120);
      assert.equal(
        frame.counts.reduce((sum, value) => sum + value, 0),
        frame.count,
      );
      assert.equal(frame.samples.length, frame.count);
      if (frame.count)
        assert(Math.abs(frame.frequencies.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
      for (const sample of frame.samples) {
        const lower = frame.probabilities
          .slice(0, sample.bin)
          .reduce((sum, value) => sum + value, 0);
        assert(sample.uniform >= lower && sample.uniform < lower + frame.probabilities[sample.bin]);
      }
    }
  assert.deepEqual(
    truncationState('top-k', {
      beat: 0,
      beatP: 0.88,
    }).values,
    [0.45, 0.25, 0, 0, 0],
  );
  assert(
    Math.abs(
      truncationState('top-k', {
        beat: 1,
        beatP: 0.88,
      }).sum - 1,
    ) < 1e-12,
  );
  assert.equal(
    truncationState('nucleus', {
      beat: 1,
      beatP: 5 / 18.192,
    }).ids.length,
    3,
  );
  assert.equal(
    truncationState('nucleus', {
      beat: 1,
      beatP: 7 / 18.192,
    }).ids.length,
    3,
  );
  assert(
    Math.abs(
      truncationState('nucleus', {
        beat: 1,
        beatP: 0.88,
      }).values.reduce((a, v) => a + v, 0) - 1,
    ) < 1e-12,
  );
  assert.deepEqual(
    searchTrace('beam', {
      beat: 0,
      beatP: 11.35 / 19.512,
    }).retainedLeaves,
    [3, 1],
  );
  assert.deepEqual(
    searchTrace('beam', {
      beat: 0,
      beatP: 6 / 19.512,
    }).prefixes,
    [0, 1],
  );
  assert.equal(
    searchTrace('beam', {
      beat: 0,
      beatP: 8 / 19.512,
    }).scoresVisible,
    false,
  );
  assert.deepEqual(
    searchTrace('greedy', {
      beat: 1,
      beatP: 6 / 17.544,
    }).prefixes,
    [0],
  );
  assert.deepEqual(
    searchTrace('greedy', {
      beat: 1,
      beatP: 7 / 17.544,
    }).retainedLeaves,
    [1, 2],
  );
  assert.deepEqual(
    searchTrace('greedy', {
      beat: 1,
      beatP: 10 / 17.544,
    }).retainedLeaves,
    [1],
  );
  assert.equal(
    searchTrace('greedy', {
      beat: 2,
      beatP: 0,
    }).stage,
    3,
  );
  assert(BRANCHES.every((x) => Math.abs(x.next.reduce((s, x) => s + x[1], 0) - 1) < 1e-12));
  assert.equal([...LEAVES].sort((a, b) => b.score - a.score)[0].text, 'slept soundly');
  assert.equal(0.6 * 0.35, 0.21);
  assert.deepEqual(nucleus(BASE), [0, 1, 2]);
  assert.equal(
    BASE.reduce((s, v) => s + v, 0),
    1,
  );
  assert.equal(stableSoftmax(BASE.map(Math.log), 0.5).length, 5);
  return true;
}
export function decodingFreshModel() {
  const row = [0.48, 0.26, 0.14, 0.08, 0.04],
    cold = decodeSoftmax(row.map(Math.log), 0.5),
    masked = decodeNormalize([0, ...row.slice(1)]);
  return {
    row,
    cold,
    k: decodeSupport(row, 'k', 2),
    p: decodeSupport(row, 'p', 0.8),
    min: decodeSupport(row, 'min', 0.2),
    floor: 0.2 * Math.max(...row),
    masked,
    maskedP: decodeSupport(masked, 'p', 0.8),
  };
}
export function validateDecodingCore() {
  assert(Math.abs(STATUS_ROW.reduce((s, v) => s + v, 0) - 1) < 1e-12);
  assert.deepEqual(decodeSoftmax([2, 2, 0], 0), [1, 0, 0]);
  assert.throws(() => decodeSoftmax([-Infinity, -Infinity], 0), /empty/);
  assert.throws(() => decodeSoftmax([-Infinity, -Infinity], 1), /empty/);
  assert.throws(() => decodeSoftmax([0, Infinity], 1), /invalid/);
  const stable = decodeSoftmax([1000, 999]);
  assert(Math.abs(stable[0] - 0.7310585786300049) < 1e-12);
  assert.deepEqual(decodeRepetition([2.4, -0.5, 0.7], [0, 0, 1], 1.2), [2, -0.6, 0.7]);
  const raw = [2.4, 2.1, 1.2, 0.3],
    penaltyFirst = decodeRepetition(raw, [0], 1.2),
    centerFirst = decodeRepetition(
      raw.map((x) => x - 2.4),
      [0],
      1.2,
    );
  assert.equal(penaltyFirst.indexOf(Math.max(...penaltyFirst)), 1);
  assert.equal(centerFirst.indexOf(Math.max(...centerFirst)), 0);
  const a = decodeSupport([0.45, 0.3, 0.15, 0.1], 'k', 3),
    kp = decodeSupport(a.values, 'p', 0.8),
    pk = decodeSupport(decodeSupport([0.45, 0.3, 0.15, 0.1], 'p', 0.8).values, 'k', 3);
  assert.deepEqual(kp.ids, [0, 1]);
  assert.deepEqual(pk.ids, [0, 1, 2]);
  const fresh = decodingFreshModel();
  assert.deepEqual(fresh.k.ids, [0, 1]);
  assert.deepEqual(fresh.p.ids, [0, 1, 2]);
  assert.deepEqual(fresh.min.ids, [0, 1, 2]);
  assert.deepEqual(fresh.maskedP.ids, [1, 2, 3]);
  assert(Math.abs(fresh.cold[0] - 0.7076167076167076) < 1e-12);
  return true;
}
