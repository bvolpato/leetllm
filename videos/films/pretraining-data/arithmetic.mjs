import { DOCUMENT_DRAWS } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const share = (p, length) =>
  p.map((value, i) => value * length[i]).map((v, _, all) => v / all.reduce((a, b) => a + b, 0));
export const shingles = (value) =>
  new Set(
    value
      .toLowerCase()
      .split(' ')
      .slice(0, -2)
      .map((_, i) =>
        value
          .toLowerCase()
          .split(' ')
          .slice(i, i + 3)
          .join(' '),
      ),
  );
export function jaccard(a, b) {
  const left = shingles(a),
    right = shingles(b),
    intersection = [...left].filter((x) => right.has(x)).length;
  return intersection / new Set([...left, ...right]).size;
}
export const bounded = (x) => Math.max(0, Math.min(1, x));
export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export function packedMask(query, key) {
  return key <= query && Math.floor(query / 3) === Math.floor(key / 3);
}
export function documentSample(probability, lengths = [100, 900]) {
  assert(Number.isFinite(probability) && probability >= 0 && probability <= 1);
  const categories = DOCUMENT_DRAWS.map((d) => (d.uniform < probability ? 0 : 1)),
    counts = [0, 0],
    tokens = [0, 0];
  for (const k of categories) {
    counts[k]++;
    tokens[k] += lengths[k];
  }
  return {
    categories,
    counts,
    tokens,
    shares: tokens.map((x) => x / tokens.reduce((a, b) => a + b, 0)),
  };
}
export function bpeReplay(words, rules) {
  return rules.reduce(
    (all, [a, b]) =>
      all.map((pieces) => {
        const out = [];
        for (let i = 0; i < pieces.length;) {
          if (pieces[i] === a && pieces[i + 1] === b) {
            out.push(a + b);
            i += 2;
          } else out.push(pieces[i++]);
        }
        return out;
      }),
    words.map((w) => [...w, '</w>']),
  );
}
export function packRecords(lengths, capacity = 10) {
  const bins = [];
  for (const [id, n] of lengths.map((n, id) => [id, n]).sort((a, b) => b[1] - a[1])) {
    assert(Number.isInteger(n) && n > 0 && n <= capacity);
    let best = -1,
      spare = Infinity;
    bins.forEach((b, i) => {
      const left = capacity - b.reduce((sum, v) => sum + v.n, 0) - n;
      if (left >= 0 && left < spare) {
        best = i;
        spare = left;
      }
    });
    if (best < 0)
      bins.push([
        {
          id,
          n,
        },
      ]);
    else
      bins[best].push({
        id,
        n,
      });
  }
  return bins;
}
export function independentObjective(ids, documents) {
  assert.equal(ids.length, documents.length);
  return {
    mask: ids.map((_, q) => ids.map((_, k) => Number(k <= q && documents[q] === documents[k]))),
    targets: ids.map((_, i) =>
      i + 1 < ids.length && documents[i] === documents[i + 1] ? ids[i + 1] : -100,
    ),
    labels: ids.map((x, i) => (i > 0 && documents[i] !== documents[i - 1] ? -100 : x)),
  };
}
export function restoreRecords(order, consumed, prefetched) {
  assert(consumed >= 0 && consumed <= prefetched && prefetched <= order.length);
  return {
    prefix: order.slice(0, consumed),
    suffix: order.slice(consumed),
    skippedByReader: order.slice(consumed, prefetched),
    repeatedBySeed: order.slice(0, consumed),
  };
}
