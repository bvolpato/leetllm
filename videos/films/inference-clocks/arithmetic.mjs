import { tokenTimes } from './fixtures.mjs';
export function metrics(arrival, times) {
  if (
    ![arrival, ...times].every(Number.isFinite) ||
    times.some((value, i) => value < (i ? times[i - 1] : arrival))
  )
    throw new Error('Invalid timestamp order');
  const gaps = times.slice(1).map((value, i) => value - times[i]);
  const tpot = gaps.length ? gaps.reduce((sum, value) => sum + value, 0) / gaps.length : null;
  return {
    ttft: times.length ? times[0] - arrival : null,
    gaps,
    tpot,
    decodeTps: tpot > 0 ? 1000 / tpot : null,
    endToEndTps:
      times.length && times.at(-1) > arrival
        ? (times.length * 1000) / (times.at(-1) - arrival)
        : null,
  };
}
export function deliveryState(clock) {
  const planned = [
      {
        time: 350,
        ids: ['T1'],
      },
      {
        time: 385,
        ids: ['T2'],
      },
      {
        time: 470,
        ids: ['T3', 'T4'],
      },
    ],
    events = planned.filter((e) => e.time <= clock),
    delivered = new Set(events.flatMap((e) => e.ids)),
    buffer = tokenTimes
      .map((time, i) => ({
        id: 'T' + (i + 1),
        time,
      }))
      .filter((e) => e.time <= clock && !delivered.has(e.id));
  return {
    events,
    buffer: buffer.map((e) => e.id),
    planned,
  };
}
export function capacityFixture() {
  const perToken = 2 * 16 * 4 * 256 * 2,
    existing = 40 * 4096 * perToken,
    pool = 12e9;
  return {
    perToken,
    existing,
    pool,
    small: existing + 16384 * perToken,
    large: existing + 65536 * perToken,
    kvOnly: {
      pool: 18e9,
      perUser: 5120 * perToken,
      counts: [Math.floor(18e9 / (5120 * perToken)), Math.floor(18e9 / ((5120 * perToken) / 2))],
    },
    hybrid: {
      recurrent: 144 * 1024 ** 2,
      kv: 8 * 1024 ** 2,
      pool: 8 * 1024 ** 3,
    },
  };
}
