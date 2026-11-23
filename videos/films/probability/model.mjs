import { checkedPosterior, mix, phase, posterior, rng, smooth, sum } from './arithmetic.mjs';
import { changedQueue, freshCapacity, freshQueue, queuePackets } from './fixtures.mjs';
import { cueProgress, stateFor } from './construction.mjs';
import assert from 'node:assert/strict';
export function queueSnapshot(beat, beatP, cues = {}) {
  const state = stateFor(beat, beatP, cues),
    measured = cues['queue-abuse-arrivals'] && cues['queue-clean-arrivals'];
  const fallback = cueProgress(state, 'queue-arrivals', 1),
    abuse = measured ? cueProgress(state, 'queue-abuse-arrivals', 1) : phase(fallback, 0, 0.42),
    clean = measured ? cueProgress(state, 'queue-clean-arrivals', 1) : phase(fallback, 0.42, 1);
  const abusivePackets = queuePackets.filter((row) => row.abusive).length,
    cleanPackets = queuePackets.length - abusivePackets;
  const rows = queuePackets.map((row, i) => {
    const index = row.abusive ? i : i - abusivePackets,
      count = row.abusive ? abusivePackets : cleanPackets;
    const local = phase(row.abusive ? abuse : clean, index / count, (index + 0.85) / count);
    return {
      ...row,
      progress: smooth(local),
      arrived: local === 1,
    };
  });
  const arrived = rows.filter((row) => row.arrived);
  return {
    rows,
    abusive: sum(arrived.filter((row) => row.abusive)),
    clean: sum(arrived.filter((row) => !row.abusive)),
    total: sum(arrived),
    complete: arrived.length === rows.length,
    totalReady: cueProgress(state, 'queue-total', 2) === 1,
  };
}
export function conditionalSnapshot(beat, beatP, cues = {}) {
  const state = stateFor(beat, beatP, cues),
    select = cueProgress(state, 'select-flagged', 0),
    reverse = cueProgress(state, 'reverse-condition', 2);
  return {
    select,
    reverse,
    numerator: 95,
    denominator: reverse === 1 ? 100 : select === 1 ? 590 : 10000,
    passedEligible: select < 1,
    cleanEligible: reverse < 1,
    missedAbuseEligible: reverse === 1,
    resultReady: cueProgress(state, 'conditional-result', 1) === 1 && reverse === 0,
    reversing: reverse > 0 && reverse < 1,
  };
}
export function priorSnapshot(beat, beatP, cues = {}) {
  const q = cueProgress(stateFor(beat, beatP, cues), 'prior-change', 1),
    prior = mix(0.01, 0.1, q);
  const abusive = 10000 * prior,
    clean = 10000 - abusive,
    tp = 0.95 * abusive,
    fp = 0.05 * clean;
  return {
    prior,
    abusive,
    clean,
    tp,
    fp,
    total: tp + fp,
    posterior: tp / (tp + fp),
    ready: q === 1,
  };
}
export function policySnapshot(beat, beatP, cues = {}, improved = false) {
  const state = stateFor(beat, beatP, cues),
    q = cueProgress(state, improved ? 'improved-recovery' : 'strict-removal', improved ? 1 : 0);
  const changing = queuePackets
    .filter((row) => !row.kept && (!improved || row.abusive))
    .toReversed();
  const positions = new Map(changing.map((row, i) => [row.index, i]));
  const rows = queuePackets.map((row) => {
    const i = positions.get(row.index),
      progress =
        i === undefined ? 0 : smooth(phase(q, i / changing.length, (i + 0.85) / changing.length));
    return {
      ...row,
      progress,
      selected: improved ? row.kept || (row.abusive && progress === 1) : row.kept || progress === 0,
    };
  });
  const complete = q === 1,
    tp = improved
      ? 80 + sum(rows.filter((r) => r.abusive && !r.kept && r.progress === 1))
      : 95 - sum(rows.filter((r) => r.abusive && !r.kept && r.progress === 1)),
    fp = improved ? 99 : 495 - sum(rows.filter((r) => !r.abusive && !r.kept && r.progress === 1));
  return {
    rows,
    progress: q,
    complete,
    tp,
    fp,
    total: tp + fp,
    missed: 100 - tp,
    removedAbuse: 95 - tp,
    removedClean: 495 - fp,
    chosen: !improved && cueProgress(state, 'policy-choice', 2) === 1,
    receiptReady: improved ? cueProgress(state, 'improved-result', 2) === 1 : complete,
  };
}
export function likelihoodSnapshot(beat, beatP, cues = {}) {
  const state = stateFor(beat, beatP, cues),
    build = cueProgress(state, 'likelihood-factors', 0),
    change = cueProgress(state, 'likelihood-candidate', 1),
    maximum = cueProgress(state, 'likelihood-maximum', 2);
  const p = beat < 2 ? mix(0.2, 0.8, change) : mix(0.8, 2 / 3, maximum);
  const factors = [p, 1 - p, p],
    count = beat > 0 ? 3 : Math.min(3, Math.floor(build * 3.001));
  return {
    p,
    factors,
    count,
    product: factors.slice(0, count).reduce((a, v) => a * v, 1),
    complete: count === 3,
    maximum: maximum === 1,
  };
}
export function validateModel() {
  assert.equal(sum(queuePackets), 590);
  assert.throws(() => checkedPosterior(1.4, 0.95, 0.05), RangeError);
  assert.throws(() => checkedPosterior(0.01, 0, 0), RangeError);
  assert(Math.abs(checkedPosterior(Number.MIN_VALUE, 0.5, Number.MIN_VALUE) - 1 / 3) < 1e-12);
  assert.equal(freshQueue.total, freshQueue.tp + freshQueue.fp);
  assert.equal(freshQueue.missed, 600 - freshQueue.tp);
  assert.deepEqual([freshQueue.tp, freshQueue.fp, freshCapacity - freshQueue.total], [480, 388, 32]);
  assert.deepEqual([changedQueue.fp - freshQueue.fp, changedQueue.total - freshCapacity], [97, 65]);
  assert.equal(changedQueue.tp, freshQueue.tp);
  assert.equal(changedQueue.missed, freshQueue.missed);
  assert.equal(sum(queuePackets.filter((row) => row.abusive)), 95);
  assert.equal(sum(queuePackets.filter((row) => row.kept)), 179);
  const seen = new Set();
  for (const row of queuePackets)
    for (let id = row.first; id < row.first + row.count; id++) {
      const key = (row.abusive ? 'A' : 'C') + id;
      assert(!seen.has(key));
      seen.add(key);
    }
  assert.equal(seen.size, 590);
  assert.equal(posterior(0.01, 0, 0), null);
  assert(Math.abs(posterior(0.01) - 95 / 590) < 1e-12);
  assert(Math.abs(posterior(0.01, 0.2, 0.2) - 0.01) < 1e-12);
  assert(Math.abs(posterior(0.01, 0.95 ** 2, 0.05 ** 2) - 90.25 / 115) < 1e-12);
  assert.deepEqual([policySnapshot(2, 1).total, policySnapshot(2, 1).missed], [179, 20]);
  assert.deepEqual(
    [policySnapshot(2, 1, {}, true).total, policySnapshot(2, 1, {}, true).missed],
    [194, 5],
  );
  return true;
}
export function repeatedRates(n) {
  const random = rng(1234);
  return Array.from(
    {
      length: 60,
    },
    () => {
      let pass = 0;
      for (let i = 0; i < n; i++) pass += random() < 0.8;
      return pass / n;
    },
  );
}
