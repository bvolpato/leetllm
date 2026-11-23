import { approval, limit, mandatory, output } from './fixtures.mjs';
export function pack(extras, required = mandatory, answer = output, capacity = limit) {
  if (required + answer > capacity)
    throw new Error('Mandatory input and output exceed context limit');
  const kept = [],
    dropped = [];
  let used = required;
  for (const item of extras) {
    if (dropped.length || used + item.units + answer > capacity) dropped.push(item);
    else {
      kept.push(item);
      used += item.units;
    }
  }
  return {
    kept,
    dropped,
    input: used,
    output: answer,
    total: used + answer,
    remaining: capacity - used - answer,
  };
}
export function verifyNote(note) {
  return Object.entries(approval).every(([key, value]) => note[key] === value);
}
export function placeNeedle(depth) {
  const filler = Array(16).fill(0),
    needle = [99, 98];
  const index = Math.floor(filler.length * depth);
  const document = [...filler.slice(0, index), ...needle, ...filler.slice(index)];
  const contains = (row) => row.some((value, i) => value === needle[0] && row[i + 1] === needle[1]);
  return {
    document,
    needle,
    index,
    actualDepth: index / filler.length,
    full: contains(document),
    edge: contains(document.slice(0, 4)) || contains(document.slice(-4)),
    input: 2 + document.length,
    output: 4,
    limit: 24,
  };
}
export function aggregate(rows) {
  const counts = {
    A: 0,
    B: 0,
  };
  rows.forEach((row) => counts[row.service]++);
  return {
    counts,
    winner: counts.A > counts.B ? 'A' : counts.B > counts.A ? 'B' : 'tie',
    sources: rows.map((row) => row.id),
  };
}
