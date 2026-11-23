import { createHash as searchHash } from 'node:crypto';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const wordCount = (text) => (text.match(/[a-z0-9]+(?:-[a-z0-9]+)*/gi) ?? []).length;
export function fuse(lists) {
  const scores = {};
  for (const list of lists)
    for (const [id, index] of [...new Set(list)].map((id, i) => [id, i + 1]))
      scores[id] = (scores[id] ?? 0) + 1 / (60 + index);
  return scores;
}
export function searchWords(text) {
  return text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
}
export function searchCosine(a, b) {
  const dot = sum(a.map((x, i) => x * b[i])),
    norm = Math.sqrt(sum(a.map((x) => x * x)) * sum(b.map((x) => x * x)));
  return norm ? dot / norm : 0;
}
export function rrfContributions(lists, k = 60) {
  if (!(k >= 0)) throw Error('negative k');
  return lists.flatMap((list, branch) =>
    [...new Set(list)].map((id, i) => ({
      id,
      branch,
      rank: i + 1,
      value: 1 / (k + i + 1),
    })),
  );
}
export function sourceDigest(text) {
  return searchHash('sha256').update(text).digest('hex');
}
