import assert from 'node:assert/strict';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function quota(stage) {
  return stage === 0
    ? {
        available: 1000,
        held: 0,
        settled: 0,
      }
    : stage === 1
      ? {
          available: 300,
          held: 700,
          settled: 0,
        }
      : {
          available: 580,
          held: 0,
          settled: 420,
        };
}
export function deficit(rounds) {
  const credit = {
      A: 0,
      B: 0,
    },
    served = {
      A: 0,
      B: 0,
    },
    jobs = {
      A: 0,
      B: 0,
    };
  for (let r = 0; r < rounds; r++)
    for (const tenant of ['A', 'B']) {
      credit[tenant] += tenant === 'A' ? 4 : 2;
      const cost = tenant === 'A' ? 3 : 1;
      while (credit[tenant] >= cost) {
        credit[tenant] -= cost;
        served[tenant] += cost;
        jobs[tenant]++;
      }
    }
  return {
    credit,
    served,
    jobs,
  };
}
export function deficitPlayback(time) {
  const credit = {
      A: 0,
      B: 0,
    },
    served = {
      A: 0,
      B: 0,
    },
    jobs = {
      A: 0,
      B: 0,
    },
    completed = [];
  let creditedRounds = 0,
    active = null;
  for (let round = 0; round < 3; round++) {
    if (time <= round) break;
    creditedRounds++;
    credit.A += 4;
    credit.B += 2;
    const order = [];
    const budget = {
      ...credit,
    };
    for (const tenant of ['A', 'B']) {
      const cost = tenant === 'A' ? 3 : 1;
      while (budget[tenant] >= cost) {
        budget[tenant] -= cost;
        order.push({
          tenant,
          cost,
        });
      }
    }
    for (const [i, event] of order.entries()) {
      const start = round + 0.08 + (i * 0.84) / order.length,
        end = round + 0.08 + ((i + 1) * 0.84) / order.length;
      if (time >= end) {
        credit[event.tenant] -= event.cost;
        served[event.tenant] += event.cost;
        jobs[event.tenant]++;
        completed.push({
          ...event,
          id: event.tenant + '-' + jobs[event.tenant],
        });
      } else if (time >= start)
        active = {
          ...event,
          id: event.tenant + '-' + (jobs[event.tenant] + 1),
          progress: (time - start) / (end - start),
        };
    }
  }
  return {
    credit,
    served,
    jobs,
    completed,
    active,
    creditedRounds,
  };
}
export function reserveWholePages(input, output, block = 16n) {
  for (const x of [input, output])
    assert(typeof x === 'bigint' && x >= 0n, 'Exact nonnegative integer positions required');
  assert(typeof block === 'bigint' && block > 0n);
  return (input + output + block - 1n) / block;
}
