import assert from 'node:assert/strict';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
// Measured word-event offsets in unchanged narration; beatP spans spoken duration plus hold.
export const sum = (xs) => xs.reduce((a, v) => a + v, 0);
// Measured word-event offsets in unchanged narration; beatP spans spoken duration plus hold.
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const cueProgress = (seconds, start, end) => clamp01((seconds - start) / (end - start));
export function address(index, strides, offset = 0) {
  return offset + sum(index.map((v, i) => v * strides[i]));
}
export function adam(s, g) {
  const step = s.step + 1,
    m = 0.9 * s.m + 0.1 * g,
    v = 0.999 * s.v + 0.001 * g * g;
  return {
    step,
    m,
    v,
    w: s.w - (0.01 * (m / (1 - 0.9 ** step))) / (Math.sqrt(v / (1 - 0.999 ** step)) + 1e-8),
  };
}
export const saved = adam(
  {
    w: 1,
    m: 0,
    v: 0,
    step: 0,
  },
  0.5,
);
export const next = adam(saved, -0.25);
export const reset = adam(
  {
    w: saved.w,
    m: 0,
    v: 0,
    step: 0,
  },
  -0.25,
);
export const product = (xs) => xs.reduce((n, x) => n * x, 1);
export const beforeFresh = adam(saved, -0.25);
export const freshGood = adam(beforeFresh, 0);
export const freshBad = adam(
  {
    ...beforeFresh,
    step: 0,
  },
  0,
);
export function pipelineSlots(microbatches, policy = 'forward') {
  if (policy === 'forward') {
    const work = [];
    for (let mb = 0; mb < microbatches; mb++)
      work.push(
        {
          kind: 'F',
          stage: 0,
          mb,
          start: mb,
          end: mb + 1,
        },
        {
          kind: 'F',
          stage: 1,
          mb,
          start: mb + 1,
          end: mb + 2,
        },
      );
    return {
      work,
      ticks: microbatches + 1,
      idle: 2,
      total: 2 * (microbatches + 1),
    };
  }
  assert(['gpipe', '1f1b'].includes(policy));
  const work = [],
    f = Array.from(
      {
        length: 2,
      },
      () => Array(microbatches).fill(null),
    ),
    back = Array.from(
      {
        length: 2,
      },
      () => Array(microbatches).fill(null),
    );
  let tick = 0;
  while (work.length < 4 * microbatches) {
    const jobs = [];
    for (let stage = 0; stage < 2; stage++) {
      const forward = Array.from(
        {
          length: microbatches,
        },
        (_, mb) => mb,
      ).find(
        (mb) => f[stage][mb] === null && (stage === 0 || (f[0][mb] !== null && f[0][mb] <= tick)),
      );
      const order = Array.from(
          {
            length: microbatches,
          },
          (_, mb) => (policy === 'gpipe' ? microbatches - 1 - mb : mb),
        ),
        backward = order.find(
          (mb) =>
            back[stage][mb] === null &&
            f[stage][mb] !== null &&
            f[stage][mb] <= tick &&
            (stage === 1 || (back[1][mb] !== null && back[1][mb] <= tick)) &&
            (policy !== 'gpipe' || f.every((row) => row.every((v) => v !== null && v <= tick))),
        );
      const kind =
        policy === '1f1b' && backward !== undefined
          ? 'B'
          : forward !== undefined
            ? 'F'
            : backward !== undefined
              ? 'B'
              : null;
      if (kind)
        jobs.push({
          kind,
          stage,
          mb: kind === 'F' ? forward : backward,
          start: tick,
          end: tick + 1,
        });
    }
    assert(jobs.length || tick < 4 * microbatches);
    for (const j of jobs) {
      work.push(j);
      (j.kind === 'F' ? f : back)[j.stage][j.mb] = j.end;
    }
    tick++;
    assert(tick <= 4 * microbatches + 2);
  }
  return {
    work,
    ticks: tick,
    idle: 2 * tick - work.length,
    total: 2 * tick,
  };
}
export function tpProjectionFixture() {
  const x = [1, 2],
    first = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ],
    hidden = first.map((row) => sum(row.map((v, i) => v * x[i]))),
    second = [
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ],
    partials = [0, 1].map((rank) =>
      second.map((row) =>
        sum(row.slice(rank * 2, rank * 2 + 2).map((v, i) => v * hidden[rank * 2 + i])),
      ),
    );
  return {
    x,
    first,
    hidden,
    second,
    partials,
    result: partials[0].map((v, i) => v + partials[1][i]),
  };
}
