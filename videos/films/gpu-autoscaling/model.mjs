import { ids, phases } from './fixtures.mjs';
import {
  GiB,
  autoscaleHybrid,
  autoscaleMemory,
  burst,
  finiteWarmBurst,
  outcomes,
  pagedAllocation,
  recommend,
  refillSchedule,
  serviceTrial,
  synthesisClock,
  tokenTiming,
} from './arithmetic.mjs';
import { afterClause } from './timing.mjs';
import { tracks } from './construction.mjs';
import assert from 'node:assert/strict';
export class Worker {
  constructor() {
    this.loaded = false;
    this.warmed = false;
    this.healthy = true;
    this.draining = false;
    this.active = new Set();
  }
  ready() {
    return this.loaded && this.warmed && this.healthy && !this.draining;
  }
  admit(id) {
    if (!this.ready()) return 503;
    if (this.active.has(id)) return 409;
    if (this.active.size >= 2) return 429;
    this.active.add(id);
    return 200;
  }
  release(id) {
    assert(this.active.has(id));
    this.active.delete(id);
  }
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.12) / 0.6));
  if (id === 'burst' || id === 'intro') {
    const warm = id === 'intro' ? 1 : [1, 3, 20][step],
      rows = burst(warm),
      now = id === 'intro' ? [0, 10, 20][step] + [10, 10, 20][step] * p : 40 * p;
    return {
      step,
      p,
      warm,
      rows,
      now,
      ...outcomes(rows, now),
    };
  }
  if (id === 'readiness') {
    const worker = new Worker();
    worker.loaded = step > 0;
    worker.warmed = step === 2;
    const results = ['R1', 'R2', 'R3'].map((request) => ({
      request,
      status: worker.admit(request),
    }));
    return {
      step,
      p,
      worker,
      ready: worker.ready(),
      results,
    };
  }
  if (id === 'coldpath') {
    const lead = [0, 120, 240][step];
    let cursor = -lead;
    const spans = phases.map(([name, duration]) => {
      const start = cursor;
      cursor += duration;
      return {
        name,
        start,
        end: cursor,
        duration,
      };
    });
    return {
      step,
      p,
      lead,
      spans,
      now: -lead + 207 * p,
      readyAt: cursor,
      margin: -cursor,
    };
  }
  if (id === 'controller') {
    const desired = step === 0 ? 4 : 10,
      ready = 4,
      now = step,
      demand =
        step === 2
          ? null
          : {
              at: now,
              waiting: 30,
              running: 20,
            };
    return {
      step,
      p,
      desired,
      ready,
      demand,
      ...recommend(demand, desired, ready, now),
    };
  }
  if (id === 'workload') {
    const tokens = step === 0 ? 4096 : 16384,
      bytesPerToken = 2 * 32 * 8 * 128 * 2,
      perRequest = bytesPerToken * tokens,
      total = perRequest * 5,
      pool = 8 * GiB;
    return {
      step,
      p,
      tokens,
      bytesPerToken,
      perRequest,
      total,
      pool,
      capacity: Math.floor(pool / perRequest),
      fits: total <= pool,
    };
  }
  if (id === 'drain') {
    const worker = new Worker();
    worker.loaded = worker.warmed = true;
    worker.admit('R1');
    worker.admit('R2');
    worker.draining = true;
    if (step > 0) worker.release('R1');
    if (step > 1) worker.release('R2');
    return {
      step,
      p,
      worker,
      newStatus: worker.admit('R3'),
      safe: worker.active.size === 0,
    };
  }
  const now = synthesisClock(step, p, state.cues);
  return {
    step,
    p,
    now,
    cases: [1, 3, 20].map((warm) => ({
      warm,
      ...outcomes(burst(warm), now),
    })),
  };
}
export function validateModel() {
  validateUpgradeModel();
  for (const progress of [0, 0.01, 0.5, 1]) {
    const now = synthesisClock(0, 0, {
      'compare-warm-pools': {
        phase: 'after',
        progress: 1,
      },
      'expired-population': {
        phase: 'during',
        progress,
      },
    });
    assert(now > 30 && now <= 35);
    assert.deepEqual(
      [1, 3, 20].map((warm) => outcomes(burst(warm), now).expired.length),
      [80, 40, 0],
    );
  }
  assert.equal(
    synthesisClock(0, 0, {
      'expired-population': {
        phase: 'after',
        progress: 1,
      },
    }),
    35,
  );
  assert.equal(
    synthesisClock(1, 0, {
      'offered-goodput': {
        phase: 'before',
        progress: 0,
      },
    }),
    35,
  );
  assert.equal(
    synthesisClock(1, 0, {
      'offered-goodput': {
        phase: 'after',
        progress: 1,
      },
    }),
    40,
  );
  assert.deepEqual(
    [0, 1, 3, 20].map((warm) => outcomes(burst(warm)).admitted.length),
    [0, 20, 60, 100],
  );
  assert.equal(outcomes(burst(1, 300)).admitted.length, 100);
  assert.equal(outcomes(burst(1, 300)).cold.length, 0);
  const worker = new Worker();
  worker.loaded = worker.warmed = true;
  assert.equal(worker.admit('R1'), 200);
  assert.equal(worker.admit('R1'), 409);
  worker.healthy = false;
  assert.equal(worker.admit('R2'), 503);
  assert.equal(
    recommend(
      {
        at: 0,
        waiting: 0,
        running: 0,
      },
      12,
      12,
      31,
    ).target,
    12,
  );
  assert.equal(
    recommend(
      {
        at: 0,
        waiting: 200,
        running: 0,
      },
      4,
      4,
      0,
    ).target,
    20,
  );
  const beforeDeadline = sampleModel('synthesis', {
    beat: 0,
    beatP: 0.8,
  });
  const afterDeadline = sampleModel('synthesis', {
    beat: 1,
    beatP: 0.5,
  });
  assert.equal(beforeDeadline.now, 30);
  assert.deepEqual(
    beforeDeadline.cases.map((row) => row.admitted.length),
    [20, 60, 100],
  );
  assert.deepEqual(
    beforeDeadline.cases.map((row) => row.expired.length),
    [0, 0, 0],
  );
  assert.deepEqual(
    afterDeadline.cases.map((row) => row.expired.length),
    [80, 40, 0],
  );
  assert.deepEqual(
    afterDeadline.cases.map((row) => row.cold.length),
    [0, 0, 0],
  );
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'burst' || id === 'intro') {
          assert.equal(s.active.length + s.complete.length, s.admitted.length);
          assert.equal(s.admitted.length + s.expired.length + s.waiting.length, 100);
          assert.equal(new Set(s.rows.map((row) => row.id)).size, 100);
        }
        if (id === 'controller') assert.equal(s.target, 10);
        if (id === 'coldpath')
          assert.equal(
            s.spans.reduce((sum, span) => sum + span.duration, 0),
            207,
          );
        if (id === 'workload') {
          assert.equal(s.fits, beat === 0);
          assert.equal(s.capacity, beat === 0 ? 16 : 4);
        }
        if (id === 'drain') {
          assert.equal(s.newStatus, 503);
          assert.equal(s.worker.active.size, 2 - beat);
          assert.equal(s.safe, beat === 2);
        }
      }
  for (const id of ids) {
    assert.equal(
      sampleModel(id, {
        beat: 0,
        beatP: 1,
      }).step,
      1,
    );
    assert.equal(
      sampleModel(id, {
        beat: 1,
        beatP: 1,
      }).step,
      2,
    );
  }
  return true;
}
export const freshBurstSchedules = {
  four: finiteWarmBurst({ warm: 4 }),
  five: finiteWarmBurst({ warm: 5 }),
  fiveShort: finiteWarmBurst({ warm: 5, deadline: 12 }),
  six: finiteWarmBurst({ warm: 6, deadline: 12 }),
};

export function warmPrediction(state) {
  const shorter = (state.beat ?? 0) >= 2;
  const { four, five, fiveShort, six } = freshBurstSchedules;
  const comparison = shorter ? fiveShort : four;
  const repaired = shorter ? six : five;
  const shown = shorter
    ? afterClause(state, 'ga-fresh-six', 3, 0.67)
    : afterClause(state, 'ga-fresh-five', 1, 0.69);
  const comparisonVisible = shorter
    ? afterClause(state, 'ga-fresh-five-short', 3, 0.31)
    : afterClause(state, 'ga-fresh-four', 1, 0.25);
  return {
    deadline: shorter ? 12 : 18,
    shown,
    comparisonVisible,
    answer: shown ? repaired.minimum : null,
    comparison,
    repaired,
  };
}

export function validateUpgradeModel() {
  const one = burst(1),
    three = burst(3),
    five = burst(5);
  const longerQueue = burst(1, 40);
  assert.equal(outcomes(longerQueue, 40).expired.length, 0);
  assert.equal(outcomes(longerQueue, 41).expired.length, 75);
  assert.equal(one[19].start, 30);
  assert.equal(one[20].start, null);
  assert.equal(burst(1, 40)[20].start, 40);
  assert.deepEqual([three[20].worker, three[20].start], [2, 10]);
  assert.equal(outcomes(burst(4)).expired.length, 20);
  assert.deepEqual([five[99].worker, five[99].start, five[99].end], [5, 30, 40]);
  const last = (warm, deadline) => finiteWarmBurst({ warm, deadline }).rows.at(-1);
  assert.deepEqual([last(5, 18).worker, last(5, 18).start], [3, 18]);
  assert.equal(last(5, 12).start, null);
  assert.deepEqual([last(6, 12).worker, last(6, 12).start], [6, 12]);
  assert.deepEqual(tokenTiming(0, [300, 340, 380, 500]), {
    ttft: 300,
    gaps: [40, 40, 120],
    tpot: 200 / 3,
  });
  assert.equal(pagedAllocation([320, 75, 900, 250]).slack, 23);
  assert.equal(autoscaleMemory().kv, 4 * GiB);
  assert.equal(autoscaleHybrid().kv, 2 * GiB);
  assert.deepEqual([refillSchedule().makespan, refillSchedule(true).makespan], [13, 10]);
  assert.equal(
    finiteWarmBurst({
      warm: 4,
    }).expired,
    8,
  );
  assert.equal(
    finiteWarmBurst({
      deadline: 12,
      warm: 5,
    }).expired,
    12,
  );
  assert.equal(
    warmPrediction({
      beat: 0,
      beatP: 1,
    }).answer,
    null,
  );
  assert.equal(serviceTrial(120, 105, 10).attainment, 0.875);
}
