import { merge } from './arithmetic.mjs';
import { requests } from './fixtures.mjs';
export function address(position) {
  return {
    page: requests[2].pages[Math.floor(position / 4)],
    slot: position % 4,
  };
}

export function splitExample(lastScore) {
  const scores = [0, 0, 0, 0, 0, lastScore];
  const mass = scores.map(Math.exp);
  const sum = (entries) => entries.reduce((a, v) => a + v, 0);
  const totals = [sum(mass.slice(0, 4)), sum(mass.slice(4))];
  const b = totals.map(Math.log2);
  return { mass, totals, b, result: merge([1, 0], b[0], [0, 1], b[1]) };
}

// A load snapshots the slot. A subsequent write can only change the live payload.
export function readSlot({ writeBefore, read, writeAfter }) {
  const initial = { owner: 'R2', value: [0, 1] };
  const replacement = { owner: 'R9', value: [1, 0] };
  const atLoad = writeBefore ? replacement : initial;
  const current = writeAfter ? replacement : atLoad;
  return { ...current, returned: read ? atLoad.value : null };
}
