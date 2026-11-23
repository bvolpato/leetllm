import assert from 'node:assert/strict';
export const GiB = 2 ** 30;
export function burst(warm, maxWait = 30) {
  const slots = Array.from(
    {
      length: 100,
    },
    (_, i) => ({
      next: i < warm * 5 ? 0 : 207,
      cold: i >= warm * 5,
      id: i,
    }),
  );
  return Array.from(
    {
      length: 100,
    },
    (_, i) => {
      slots.sort((a, b) => a.next - b.next || a.id - b.id);
      const slot = slots[0],
        start = slot.next;
      if (start > maxWait)
        return {
          id: `R${i + 1}`,
          deadline: maxWait,
          start: null,
          end: null,
          worker: null,
          slot: null,
          expired: true,
          cold: false,
        };
      slot.next += 10;
      return {
        id: `R${i + 1}`,
        deadline: maxWait,
        start,
        end: start + 10,
        worker: Math.floor(slot.id / 5) + 1,
        slot: (slot.id % 5) + 1,
        expired: false,
        cold: slot.cold,
      };
    },
  );
}
export function outcomes(rows, now = Infinity) {
  const admitted = rows.filter((row) => row.start !== null && row.start <= now),
    complete = admitted.filter((row) => row.end <= now),
    expired = rows.filter((row) => row.expired && now > (row.deadline ?? 30));
  return {
    admitted,
    complete,
    active: admitted.filter((row) => row.end > now),
    expired,
    waiting: rows.filter((row) =>
      row.start === null ? now <= (row.deadline ?? 30) : row.start > now,
    ),
    cold: admitted.filter((row) => row.cold),
  };
}
export function synthesisClock(beat, progress, cues) {
  if (!cues) return beat === 0 ? 30 * progress : beat === 1 ? 30 + 10 * progress : 40;
  const cue = (id) => (cues[id]?.phase === 'after' ? 1 : (cues[id]?.progress ?? 0));
  if (beat > 1) return 40;
  if (beat === 1) return 35 + 5 * cue('offered-goodput');
  return cues['expired-population']?.phase !== 'before' && cues['expired-population']
    ? 30.1 + 4.9 * cue('expired-population')
    : 30 * cue('compare-warm-pools');
}
export function recommend(demand, desired, ready, now) {
  if (!demand || now - demand.at > 30 || now < demand.at)
    return {
      target: desired,
      reason: 'Telemetry unavailable: hold and alert',
    };
  assert(demand.waiting >= 0 && demand.running >= 0 && ready <= desired);
  const needed = Math.max(1, Math.ceil((demand.waiting + demand.running) / 5)),
    target = Math.min(20, needed);
  if (target > desired)
    return {
      target,
      reason: 'Scale up · pending capacity included',
    };
  return {
    target: desired,
    reason:
      ready < desired ? 'Hold · capacity already requested' : 'Hold · downscale stabilization',
  };
}
export const gaBound = (n) => Math.max(0, Math.min(1, n));
export const gaProgress = (state, id, fallback = 0) =>
  state.cues?.[id]
    ? state.cues[id].phase === 'after'
      ? 1
      : state.cues[id].phase === 'before'
        ? 0
        : gaBound(state.cues[id].progress ?? 0)
    : fallback;
export const gaComplete = (state, id, fallback = false) =>
  state.cues?.[id] ? gaProgress(state, id) >= 1 : fallback;
export function tokenTiming(arrival, times) {
  assert(Number.isFinite(arrival) && times.length > 0 && times.every(Number.isFinite));
  assert(times[0] >= arrival && times.every((v, i) => !i || v >= times[i - 1]));
  const gaps = times.slice(1).map((v, i) => v - times[i]);
  const ttft = times[0] - arrival,
    tpot = gaps.length ? (times.at(-1) - times[0]) / gaps.length : null;
  assert(
    Number.isFinite(ttft) &&
      gaps.every(Number.isFinite) &&
      (tpot === null || Number.isFinite(tpot)),
  );
  return {
    ttft,
    gaps,
    tpot,
  };
}
export function pagedAllocation(lengths, block = 16) {
  assert(
    Number.isInteger(block) && block > 0 && lengths.every((n) => Number.isInteger(n) && n >= 0),
  );
  const rows = lengths.map((tokens) => ({
      tokens,
      blocks: Math.ceil(tokens / block),
    })),
    blocks = rows.reduce((n, r) => n + r.blocks, 0),
    tokens = lengths.reduce((a, b) => a + b, 0);
  return {
    rows,
    blocks,
    tokens,
    slots: blocks * block,
    slack: blocks * block - tokens,
  };
}
export function autoscaleMemory() {
  const weights = 8e9 * 2,
    kv = 2 * 32 * 8 * 128 * 4096 * 8 * 2;
  return {
    weights,
    kv,
    total: (weights + kv) * 1.15,
    bytesPerToken: 2 * 32 * 8 * 128 * 2,
  };
}
export function autoscaleHybrid() {
  const kv = 2 * 16 * 4 * 256 * 8192 * 4 * 2,
    recurrentPerRequest = 48 * 48 * 128 * 128 * 4,
    recurrent = recurrentPerRequest * 4;
  return {
    kv,
    recurrentPerRequest,
    recurrent,
    total: (54e9 + kv + recurrent) * 1.15,
  };
}
export function refillSchedule(continuous = false) {
  const lengths = [8, 2, 5, 3],
    rows = [];
  if (!continuous) {
    let time = 0;
    for (let i = 0; i < lengths.length; i += 2) {
      for (let k = 0; k < 2; k++)
        rows.push({
          id: 'R' + (i + k + 1),
          slot: k,
          start: time,
          end: time + lengths[i + k],
        });
      time += Math.max(...lengths.slice(i, i + 2));
    }
  } else {
    const next = [0, 0];
    for (let i = 0; i < lengths.length; i++) {
      const slot = next[0] <= next[1] ? 0 : 1;
      rows.push({
        id: 'R' + (i + 1),
        slot,
        start: next[slot],
        end: next[slot] + lengths[i],
      });
      next[slot] += lengths[i];
    }
  }
  const makespan = Math.max(...rows.map((r) => r.end));
  return {
    rows,
    makespan,
    empty: 2 * makespan - lengths.reduce((a, b) => a + b, 0),
  };
}
export function finiteWarmBurst({
  requests = 72,
  slots = 4,
  service = 6,
  deadline = 18,
  cold = 120,
  warm = 5,
} = {}) {
  assert(
    [requests, slots, warm].every((v) => Number.isInteger(v) && v > 0) &&
      service > 0 &&
      deadline >= 0 &&
      cold > deadline,
  );
  const waves = Math.floor(deadline / service) + 1,
    capacity = slots * waves * warm;
  const rows = Array.from(
    {
      length: requests,
    },
    (_, i) => {
      const wave = Math.floor(i / (slots * warm)),
        start = wave * service;
      return {
        id: 'R' + (i + 1),
        wave,
        start: start <= deadline ? start : null,
        worker: start <= deadline ? (Math.floor(i / slots) % warm) + 1 : null,
        slot: start <= deadline ? (i % slots) + 1 : null,
        expired: start > deadline,
      };
    },
  );
  return {
    waves,
    capacity,
    minimum: Math.ceil(requests / (slots * waves)),
    rows,
    admitted: rows.filter((r) => !r.expired).length,
    expired: rows.filter((r) => r.expired).length,
  };
}
export function bandwidthWorksheet(gb, bandwidthGB = 3350) {
  assert(gb > 0 && bandwidthGB > 0);
  return {
    milliseconds: (gb / bandwidthGB) * 1000,
    tps: bandwidthGB / gb,
  };
}
export function serviceTrial(offered, qualified, seconds) {
  assert(
    Number.isInteger(offered) &&
      Number.isInteger(qualified) &&
      offered > 0 &&
      qualified >= 0 &&
      qualified <= offered &&
      Number.isFinite(seconds) &&
      seconds > 0,
  );
  return {
    offeredRPS: offered / seconds,
    qualifiedRPS: qualified / seconds,
    attainment: qualified / offered,
  };
}
export function greedyPrefixExample(draft, target) {
  assert(draft.length === target.length);
  const mismatch = draft.findIndex((v, i) => v !== target[i]),
    accepted = mismatch < 0 ? draft.length : mismatch;
  return {
    accepted,
    correction: mismatch < 0 ? null : target[mismatch],
    committed: mismatch < 0 ? [...draft] : [...draft.slice(0, mismatch), target[mismatch]],
  };
}
