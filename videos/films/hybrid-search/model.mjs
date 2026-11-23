import { LIBRARY_RECORD } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { normalizeVector, dotProduct } from 'vizmatic';
export function bm25Term(frequency, length = 1, k1 = 1.2, b = 0.75) {
  return (frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * length));
}
const positions = {
  S: 0,
  A: 7,
  B: 8,
  D: 3,
  C: 10,
};
export const queryPosition = 10;
export const graphDistances = Object.fromEntries(
  Object.entries(positions).map(([id, x]) => [id, Math.abs(queryPosition - x)]),
);
export function lowerLayerSearch(ef) {
  const neighbors = {
    S: ['A', 'D'],
    A: ['S', 'B'],
    B: ['A'],
    D: ['S', 'C'],
    C: ['D'],
  };
  const distance = (id) => graphDistances[id];
  const order = (a, b) => distance(a) - distance(b) || a.localeCompare(b);
  let pending = ['S'],
    best = ['S'];
  const seen = new Set(['S']),
    expanded = [],
    snapshots = [];
  while (pending.length) {
    pending.sort(order);
    const current = pending.shift();
    if (distance(current) > distance(best.at(-1))) break;
    expanded.push(current);
    for (const next of neighbors[current]) {
      if (seen.has(next)) continue;
      seen.add(next);
      if (best.length < ef || distance(next) < distance(best.at(-1))) {
        pending.push(next);
        best.push(next);
        best.sort(order);
        best = best.slice(0, ef);
      }
    }
    snapshots.push({
      current,
      expanded: [...expanded],
      pending: [...pending].sort(order),
      best: [...best],
    });
  }
  return {
    expanded,
    best,
    snapshots,
  };
}
export function fuse(lanes, k = 60) {
  const scores = new Map();
  for (const lane of lanes) {
    assert.equal(new Set(lane).size, lane.length, 'One contribution per ID per lane');
    lane.forEach((id, rank) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank + 1)));
  }
  return [...scores]
    .map(([id, score]) => ({
      id,
      score,
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function libraryEvidence(query) {
  const terms = query.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [],
    postings = new Map(
      [LIBRARY_RECORD.identifier, ...LIBRARY_RECORD.tokens].map((t) => [t, [LIBRARY_RECORD.id]]),
    ),
    hits = [...new Set(terms.flatMap((t) => postings.get(t) ?? []))],
    q = query.toLowerCase() === 'growing tomatoes' ? [0.57, 0.09] : null,
    similarity = q ? dotProduct(normalizeVector(q), normalizeVector(LIBRARY_RECORD.vector)) : null;
  return {
    terms,
    hits,
    queryVector: q,
    similarity,
  };
}
export function coordinateGeneration(queryDegrees = 0, passageDegrees = 0) {
  const rotate = (v, degrees) => {
      const a = (degrees * Math.PI) / 180;
      return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
    },
    query = rotate([1, 0], queryDegrees),
    passages = [
      [1, 0],
      [0, 1],
    ].map((v) => rotate(v, passageDegrees)),
    scores = passages.map((v) => dotProduct(query, v));
  return {
    query,
    passages,
    scores,
    winner: scores[1] > scores[0] + 1e-12 ? 1 : 0,
  };
}
