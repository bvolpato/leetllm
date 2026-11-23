import { compose, run } from './arithmetic.mjs';
import {
  CHECKPOINT_BEAT_SECONDS,
  DELTA_BEAT_SECONDS,
  KERNEL_INTERVENTION_SECONDS,
  contrib,
  hs,
  pairs,
  selective,
  xs,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function readRetryFile(retries, timeout) {
  const states = run([retries, timeout], 0.5, 0.5);
  const returned = states.at(-1);
  return { retries, timeout, states, returned, exact: returned === retries };
}
export const openingFiles = [readRetryFile(3, 1), readRetryFile(1, 2)];
export const lookupCases = [readRetryFile(6, 1), readRetryFile(2, 3)];
export const amendedSpec = [
  { field: 'max_retries', value: 6 },
  { field: 'max_retries', value: 2 },
  { field: 'timeout_s', value: 6 },
];
export function latestRetryLimit(entries) {
  return entries.findLast((entry) => entry.field === 'max_retries')?.value;
}

// One request, 65,536 processed positions and two bytes per element.
export function cacheWorksheet(attentionLayers) {
  const ssmLayers = 32 - attentionLayers;
  const kvGiB = (2 * attentionLayers * 32 * 128 * 65536 * 2) / 1024 ** 3;
  const stateMiB = (ssmLayers * 4096 * (16 + 4) * 2) / 1024 ** 2;
  return { kvGiB, stateMiB };
}
export function runningSummary(count) {
  let state = [0, 0];
  for (let i = 0; i < count; i++) {
    const x = xs[i % xs.length];
    state = [0.9 * state[0] + 0.2 * x, 0.5 * state[1] + 0.1 * x];
  }
  return state;
}
export function recurrenceSnapshot(beat, p) {
  const q = Math.max(0, Math.min(1, (p - 0.08) / 0.74)),
    offset = beat === 0 ? 0 : 2;
  const index = beat > 1 ? 3 : offset + Math.min(1, Math.floor(2 * q));
  return {
    index,
    within: beat > 1 ? 1 : 2 * q - (index - offset),
    old: index ? hs[index - 1] : 0,
    input: xs[index],
    result: hs[index],
  };
}
export function affineScanLevels(updates) {
  if (!updates.length) return [];
  const levels = [updates.map((pair) => [...pair])];
  for (let distance = 1; distance < updates.length; distance *= 2) {
    const previous = levels.at(-1);
    levels.push(
      previous.map((right, index) =>
        index < distance ? [...right] : compose(right, previous[index - distance]),
      ),
    );
  }
  return levels;
}
export function scanSnapshot(beat, p, cues) {
  const cueProgress = (id, fallback) =>
    cues?.[id] ? Math.max(0, Math.min(1, cues[id].progress)) : fallback;
  const reveal = (start, end) => {
    const t = Math.max(0, Math.min(1, (p - start) / (end - start)));
    return t * t * (3 - 2 * t);
  };
  const pairProgress = beat > 0 ? 1 : cueProgress('compose-two', reveal(0.55, 0.76));
  const neighborProgress =
    beat > 1 ? 1 : beat < 1 ? 0 : cueProgress('ordered-tree', reveal(0.25, 0.5));
  const prefixProgress =
    beat > 1 ? 1 : beat < 1 ? 0 : cueProgress('all-prefix-states', reveal(0.72, 0.9));
  const stage =
    prefixProgress > 0
      ? 4
      : neighborProgress >= 0.5
        ? 3
        : neighborProgress > 0
          ? 2
          : pairProgress > 0
            ? 1
            : 0;
  const levels = affineScanLevels(pairs),
    prefixes = levels.at(-1);
  const left = compose(pairs[1], pairs[0]),
    right = compose(pairs[3], pairs[2]),
    all = compose(right, left);
  return {
    stage,
    pairProgress,
    neighborProgress,
    prefixProgress,
    levels,
    left,
    right,
    all,
    prefixes,
  };
}
export function collisionSnapshot(beat, p) {
  const count = beat === 0 ? 1 : beat === 1 ? 2 + Number(p >= 0.4) + Number(p >= 0.65) : 4;
  return {
    count,
    a: run([3, 1, 4, 2].slice(0, count), 0.5, 0.5).at(-1),
    b: run([1, 2, 4, 2].slice(0, count), 0.5, 0.5).at(-1),
  };
}
export const bounded = (value) => Math.max(0, Math.min(1, value));
export const between = (seconds, start, end) => {
  const value = bounded((seconds - start) / (end - start));
  return value * value * (3 - 2 * value);
};
export function deltaSnapshot(beat, progress) {
  const elapsed = bounded(progress) * DELTA_BEAT_SECONDS[beat];
  const step =
    beat === 0
      ? 0.1 + 1.9 * between(elapsed, 16.075, 18.2125)
      : beat === 1
        ? 2 - between(elapsed, 0.1, 3.0875)
        : 1 - 0.9 * between(elapsed, 8.025, 9.875);
  return {
    elapsed,
    step,
    retention: Math.exp(-step),
    exactWrite: 1 - Math.exp(-step),
    mambaWrite: step,
    showExact: beat > 1 || (beat === 1 && elapsed >= 8.0625),
    showMamba: beat > 1 || (beat === 1 && elapsed >= 11.95),
  };
}
export function checkpointSnapshot(beat, p) {
  const accepted = run([99], 0.5, 0.5, 1.25).at(-1),
    provisional = run([77], 0.5, 0.5, accepted).at(-1);
  const elapsed = bounded(p) * CHECKPOINT_BEAT_SECONDS;
  const restoreProgress = beat > 1 ? 1 : beat === 1 ? between(elapsed, 0.1, 1.7875) : 0;
  const correctionProgress = beat > 1 ? 1 : beat === 1 ? between(elapsed, 2.325, 3.5375) : 0;
  const restored = restoreProgress === 1,
    corrected = restored && correctionProgress === 1;
  return {
    accepted,
    provisional,
    elapsed,
    restoreProgress,
    correctionProgress,
    restored,
    corrected,
    current: corrected ? run([4], 0.5, 0.5, accepted).at(-1) : restored ? accepted : provisional,
    reference: run([99, 4], 0.5, 0.5, 1.25).at(-1),
    contaminated: run([4], 0.5, 0.5, provisional).at(-1),
  };
}
export function selectionSnapshot(beat, p) {
  const q = Math.max(0, Math.min(1, (p - 0.1) / 0.8)),
    u = 2 * q,
    index = beat === 0 ? Math.min(1, Math.floor(u)) : beat + 1,
    within = beat === 0 ? Math.min(1, u - index) : q,
    v = selective[index],
    old = index ? selective[index - 1].h : 0;
  return {
    index,
    within,
    ...v,
    old,
    carry: v.a * old,
    complete: within >= 0.45,
    read: within >= 0.75,
  };
}
export function contentWriteFixture(inputs, extraWrite) {
  if (
    !inputs.length ||
    inputs.some((value) => !Number.isFinite(value)) ||
    !Number.isFinite(extraWrite) ||
    extraWrite < 0
  )
    throw new RangeError('content write needs finite inputs and a nonnegative extra coefficient');
  const coefficients = inputs.map((value) => 0.2 + (value > 3 ? extraWrite : 0));
  let state = 0;
  const steps = inputs.map((input, index) => {
    const old = state,
      carry = 0.9 * old,
      write = coefficients[index] * input;
    state = carry + write;
    return {
      input,
      coefficient: coefficients[index],
      old,
      carry,
      write,
      state,
    };
  });
  const contributions = inputs.map(
    (input, index) => input * coefficients[index] * 0.9 ** (inputs.length - 1 - index),
  );
  return {
    inputs,
    extraWrite,
    coefficients,
    steps,
    contributions,
    output: state,
  };
}
export function kernelInterventionSnapshot(p) {
  const elapsed = Math.max(0, Math.min(1, p)) * KERNEL_INTERVENTION_SECONDS;
  const progress = Math.max(0, Math.min(1, (elapsed - 5.4875) / (8.7625 - 5.4875)));
  return {
    elapsed,
    progress,
    referenceContributions: contrib,
    referenceOutput: hs.at(-1),
    ...contentWriteFixture(xs, 0.3 * progress),
  };
}
export function validateBaselineModel() {
  for (const beat of [0, 1, 2])
    for (const p of [0, 0.25, 0.5, 0.75, 0.99]) {
      const v = selectionSnapshot(beat, p);
      assert(Math.abs(v.carry + v.write - v.h) < 1e-12);
      assert(Math.abs(v.c * v.h - v.y) < 1e-12);
    }
  assert.equal(selectionSnapshot(1, 0.5).index, 2);
  runningSummary(1).forEach((value, i) => assert(Math.abs(value - [0.6, 0.3][i]) < 1e-12));
  for (let beat = 0; beat < 3; beat++)
    for (const p of [0, 0.12, 0.5, 0.88, 1]) {
      const v = recurrenceSnapshot(beat, p);
      assert(Math.abs(0.9 * v.old + 0.2 * v.input - v.result) < 1e-12);
      const scan = scanSnapshot(beat, p);
      scan.prefixes.forEach((pair, i) => assert(Math.abs(pair[1] - hs[i]) < 1e-12));
      const collision = collisionSnapshot(beat, p);
      if (beat === 0) {
        assert.equal(collision.count, 1);
        assert.notEqual(collision.a, collision.b);
      } else assert.equal(collision.a, collision.b);
    }
  assert.equal(recurrenceSnapshot(1, 0.12).index, 2);
  assert.equal(recurrenceSnapshot(1, 0.88).index, 3);
  assert.equal(scanSnapshot(1, 0.12).stage, 1);
  assert.equal(scanSnapshot(1, 0.88).stage, 4);
  for (const seconds of [0, 12.9875, 13.5, 15.6625, 16.075]) {
    const state = deltaSnapshot(0, seconds / DELTA_BEAT_SECONDS[0]);
    assert.equal(state.step, 0.1);
    assert(state.retention > 0.9);
  }
  assert.equal(deltaSnapshot(0, 1).step, 2);
  assert.equal(deltaSnapshot(1, 0).step, 2);
  assert.equal(deltaSnapshot(1, 3.0875 / DELTA_BEAT_SECONDS[1]).step, 1);
  for (const seconds of [0, 4.0125, 4.35, 7.6125, 8.025]) {
    const state = deltaSnapshot(2, seconds / DELTA_BEAT_SECONDS[2]);
    assert.equal(state.step, 1);
    assert.equal(state.mambaWrite, 1);
    assert(Math.abs(state.exactWrite - (1 - Math.exp(-1))) < 1e-12);
  }
  assert(Math.abs(deltaSnapshot(2, 1).step - 0.1) < 1e-12);
  assert.equal(deltaSnapshot(1, 8.06 / DELTA_BEAT_SECONDS[1]).showExact, false);
  assert.equal(deltaSnapshot(1, 8.07 / DELTA_BEAT_SECONDS[1]).showExact, true);
  assert.equal(deltaSnapshot(1, 11.94 / DELTA_BEAT_SECONDS[1]).showMamba, false);
  assert.equal(deltaSnapshot(1, 11.96 / DELTA_BEAT_SECONDS[1]).showMamba, true);
  const restoring = checkpointSnapshot(1, 1 / CHECKPOINT_BEAT_SECONDS);
  assert(restoring.restoreProgress > 0 && restoring.restoreProgress < 1);
  assert.equal(restoring.current, restoring.provisional);
  assert.equal(restoring.corrected, false);
  const restored = checkpointSnapshot(1, 1.8 / CHECKPOINT_BEAT_SECONDS);
  assert.equal(restored.restored, true);
  assert.equal(restored.corrected, false);
  assert.equal(restored.current, 50.125);
  const correcting = checkpointSnapshot(1, 3 / CHECKPOINT_BEAT_SECONDS);
  assert(correcting.correctionProgress > 0 && correcting.correctionProgress < 1);
  assert.equal(correcting.current, 50.125);
  for (const seconds of [3.54, 4.025, 5.5, 5.95, 19.874]) {
    const fixed = checkpointSnapshot(1, seconds / CHECKPOINT_BEAT_SECONDS);
    assert(fixed.restored && fixed.corrected);
    assert.equal(fixed.current, 27.0625);
    assert.equal(fixed.current, fixed.reference);
    assert.notEqual(fixed.current, fixed.contaminated);
  }
  assert.equal(checkpointSnapshot(0, 1).current, 63.5625);
  assert.equal(checkpointSnapshot(2, 0).current, 27.0625);
  for (const beat of [0, 1, 2])
    for (let i = 0; i <= 300; i++) {
      const state = deltaSnapshot(beat, i / 300);
      assert.equal(state.retention, Math.exp(-state.step));
      assert.equal(state.exactWrite, 1 - state.retention);
      assert.equal(state.mambaWrite, state.step);
      const checkpoint = checkpointSnapshot(beat, i / 300);
      assert(!checkpoint.corrected || checkpoint.restored);
    }
  assert.ok(Math.abs(hs[3] - 1.7194) < 1e-12);
  assert.ok(Math.abs(contrib.reduce((a, v) => a + v, 0) - hs[3]) < 1e-12);
  assert.deepEqual(
    compose(pairs[3], compose(pairs[2], compose(pairs[1], pairs[0]))),
    compose(compose(pairs[3], pairs[2]), compose(pairs[1], pairs[0])),
  );
  assert.ok(Math.abs(selective.at(-1).h - 1.085) < 0.001);
  assert.equal(run([3, 1], 0.5, 0.5).at(-1), run([1, 2], 0.5, 0.5).at(-1));
  assert.equal(run([99, 4], 0.5, 0.5, 1.25).at(-1), 27.0625);
  assert.equal(run([99, 77, 4], 0.5, 0.5, 1.25).at(-1), 33.78125);
  const before = kernelInterventionSnapshot(5.4874 / KERNEL_INTERVENTION_SECONDS);
  assert.deepEqual(before.coefficients, [0.2, 0.2, 0.2, 0.2]);
  assert(Math.abs(before.output - before.referenceOutput) < 1e-12);
  const after = kernelInterventionSnapshot(8.7626 / KERNEL_INTERVENTION_SECONDS);
  assert.deepEqual(after.coefficients, [0.2, 0.2, 0.5, 0.2]);
  assert(Math.abs(after.steps[2].state - 2.666) < 1e-12);
  assert(Math.abs(after.output - 2.7994) < 1e-12);
  assert(Math.abs(after.contributions[2] - 1.8) < 1e-12);
  assert(Math.abs(after.output - after.referenceOutput - 1.08) < 1e-12);
  // Equal lag, different current content: no single lag-only K_0 supplies both writes.
  assert.equal(contentWriteFixture([1], 0.3).coefficients[0], 0.2);
  assert.equal(contentWriteFixture([3], 0.3).coefficients[0], 0.2);
  assert.equal(contentWriteFixture([4], 0.3).coefficients[0], 0.5);
  for (let index = 0; index <= 100; index += 1) {
    const current = kernelInterventionSnapshot(index / 100);
    assert.deepEqual(current.inputs, [3, 1, 4, 2]);
    assert.deepEqual(
      current.steps.slice(0, 2).map((step) => step.state),
      hs.slice(0, 2),
    );
    for (const step of current.steps)
      assert(Math.abs(step.carry + step.write - step.state) < 1e-12);
    assert(
      Math.abs(current.contributions.reduce((sum, value) => sum + value, 0) - current.output) <
        1e-12,
    );
    assert(Math.abs(current.output - (1.7194 + 3.6 * current.extraWrite)) < 1e-12);
    if (current.elapsed >= 9.175) assert(Math.abs(current.output - 2.7994) < 1e-12);
  }
  assert.throws(() => contentWriteFixture([NaN], 0.3), /finite inputs/);
  assert.throws(() => contentWriteFixture([1], -0.3), /nonnegative/);
  return true;
}
export function bufferFixture() {
  const weights = [0.2, 0.3, 0.5],
    step = (state, buffer, x) => {
      const next = [buffer[1], buffer[2], x],
        write = next.reduce((s, v, i) => s + v * weights[i], 0);
      return {
        state: 0.5 * state + write,
        buffer: next,
        write,
      };
    };
  const empty = {
    state: 0,
    buffer: [0, 0, 0],
  };
  let prefix = empty;
  for (const x of [3, 1]) prefix = step(prefix.state, prefix.buffer, x);
  const trace = (initial) => {
    let v = initial;
    return [4, 2].map((x) => {
      v = step(v.state, v.buffer, x);
      return v;
    });
  };
  return {
    prefix,
    uninterrupted: xs.reduce((previous, x) => step(previous.state, previous.buffer, x), empty),
    restored: trace(prefix),
    dropped: trace({
      state: prefix.state,
      buffer: [0, 0, 0],
    }),
  };
}
export function timingFixture(tokens) {
  return {
    tokens,
    attention: 120 + (tokens - 1) * 3.2,
    ssm: 150 + (tokens - 1) * 1.8,
    crossing: 1 + 30 / 1.4,
  };
}
export function validateModel() {
  validateBaselineModel();
  assert.deepEqual(
    openingFiles.map((f) => f.states),
    [
      [1.5, 1.25],
      [0.5, 1.25],
    ],
  );
  assert.deepEqual(
    lookupCases.map((f) => [f.returned, f.exact]),
    [
      [2, false],
      [2, true],
    ],
  );
  assert.equal(latestRetryLimit(amendedSpec.slice(0, 1)), 6);
  assert.equal(latestRetryLimit(amendedSpec), 2);
  assert.deepEqual([32, 4, 0].map(cacheWorksheet), [
    { kvGiB: 32, stateMiB: 0 },
    { kvGiB: 4, stateMiB: 4.375 },
    { kvGiB: 0, stateMiB: 5 },
  ]);
  const f = bufferFixture();
  assert(Math.abs(f.prefix.state - 2.15) < 1e-12);
  assert.deepEqual(f.prefix.buffer, [0, 3, 1]);
  assert(Math.abs(f.restored.at(-1).state - 4.3875) < 1e-12);
  assert.equal(f.restored.at(-1).state, f.uninterrupted.state);
  assert(Math.abs(f.dropped.at(-1).state - 3.7375) < 1e-12);
  assert.deepEqual(
    affineScanLevels([
      [0.5, 2],
      [0.2, 1],
    ]).at(-1),
    [
      [0.5, 2],
      [0.1, 1.4],
    ],
  );
  assert.deepEqual([timingFixture(16).attention, timingFixture(16).ssm], [168, 177]);
  assert.deepEqual([timingFixture(256).attention, timingFixture(256).ssm], [936, 609]);
  assert.equal((32 * 4) / 32, 4);
  return true;
}
export function orderedAffineFixture(reverse = false) {
  const updates = reverse
    ? [
        [0.2, 1],
        [0.5, 2],
      ]
    : [
        [0.5, 2],
        [0.2, 1],
      ];
  let state = 0;
  return {
    updates,
    states: updates.map(([carry, write]) => (state = carry * state + write)),
    pair: updates.reduce(([a, b], [c, d]) => [c * a, c * b + d], [1, 0]),
  };
}
export function chunkStateFixture() {
  const chunks = [
    [3, 1],
    [4, 2],
  ];
  let incoming = 0;
  return chunks.map((inputs) => {
    const local = run(inputs),
      boundary = inputs.map((_, i) => incoming * 0.9 ** (i + 1));
    const outputs = local.map((value, i) => value + boundary[i]);
    const row = {
      inputs,
      incoming,
      local,
      boundary,
      outputs,
    };
    incoming = outputs.at(-1);
    return row;
  });
}
export function orderedPrefixTree() {
  const left = compose(pairs[1], pairs[0]),
    right = compose(pairs[3], pairs[2]);
  const identity = [1, 0],
    incoming = [identity, pairs[0], left, compose(pairs[2], left)];
  return {
    left,
    right,
    total: compose(right, left),
    incoming,
    outputs: pairs.map((pair, index) => compose(pair, incoming[index])[1]),
  };
}
export function trapezoidWriteFixture(weight) {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1)
    throw new RangeError('Endpoint weight must be between zero and one');
  const carry = Math.exp(-1),
    previous = (1 - weight) * Math.exp(-1) * 2,
    current = weight;
  return {
    weight,
    carry,
    previous,
    current,
    output: carry + previous + current,
  };
}
export function bufferConstruction(index, drop = false) {
  const f = bufferFixture();
  return index < 0
    ? {
        state: f.prefix.state,
        buffer: drop ? [0, 0, 0] : f.prefix.buffer,
        write: null,
      }
    : (drop ? f.dropped : f.restored)[Math.min(1, index)];
}
export function multiDirectionFixture(inputs = [2, 3]) {
  const writes = inputs.map((value, i) => [i === 0 ? value : 0, i === 1 ? value : 0]);
  const state = writes.reduce((a, b) => a.map((value, i) => value + b[i]), [0, 0]);
  const directions = [
    [1, 1],
    [1, -1],
  ];
  return {
    inputs,
    writes,
    state,
    directions,
    outputs: directions.map((row) => row.reduce((sum, value, i) => sum + value * state[i], 0)),
  };
}
