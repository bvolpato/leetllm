import { createHash } from 'node:crypto';
export const shingleSet = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  return new Set(words.slice(0, -1).map((word, i) => `${word} ${words[i + 1]}`));
};
export const jaccard = (a, b) => {
  const left = shingleSet(a),
    right = shingleSet(b),
    intersection = [...left].filter((value) => right.has(value)).length;
  return intersection / new Set([...left, ...right]).size;
};
export const lshProbability = (similarity, bands = 14, rowsPerBand = 8) =>
  1 - (1 - similarity ** rowsPerBand) ** bands;
export const sha = (value) => createHash('sha256').update(value).digest('hex');
export const tally = (rows, key) =>
  Object.fromEntries(
    [...new Set(rows.map((r) => r[key]))]
      .sort()
      .map((k) => [k, rows.filter((r) => r[key] === k).length]),
  );
export function permutations(values) {
  return values.length
    ? values.flatMap((v, i) => permutations(values.filter((_, j) => j !== i)).map((t) => [v, ...t]))
    : [[]];
}
