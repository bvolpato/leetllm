import * as m from '../../../films/attention/model.mjs';
export { m };
const counterexampleStates = [
  [1, 0],
  [1, 1],
];
export const symmetricScores = counterexampleStates.map((x) =>
  counterexampleStates.map((k) => m.dot(x, k)),
);
export const symmetricShares = symmetricScores.map(m.softmax);
const columnWeights = m.SCALED[0].map((_, k) => m.softmax(m.SCALED.map((row) => row[k])));
export const wrongAxis = m.SCALED.map((_, i) => columnWeights.map((col) => col[i]));
export const shifted = (a, b) => m.softmax([m.SCALED[1][0] + a, m.SCALED[1][1] + b]);
export const cacheMask = (queries, keys, pad = []) =>
  queries.map((q) => keys.map((k) => k <= q && !pad.includes(k)));
export const scoresBytes = (batch, heads, n) => batch * heads * n * n * 2;
export const stepsForTiles = (high = 1001) => {
  const scores = [1000, high, 999],
    values = [2, 1, 4];
  const mass = scores.map((s) => Math.exp(s - high));
  const parts = mass.map((v, i) => v * values[i]);
  const sum = mass.reduce((a, b) => a + b),
    weighted = parts.reduce((a, b) => a + b);
  return { scores, values, high, mass, parts, sum, weighted, output: weighted / sum };
};
export const gaze = (n, reader) =>
  [0, 1].map((h) =>
    m.softmax(
      Array.from({ length: n }, (_, j) =>
        h === 0 ? -1.2 * Math.abs(j - Math.max(reader - 1, 0)) : j === 0 ? 3 : 0,
      ),
    ),
  );
export const allowedShares = m.softmax([2, 1, -Infinity]);
export const erasedShares = m.softmax([2, 1, 5]).map((w, i) => (i === 2 ? 0 : w));
export function route(a, b, values, blocked = false) {
  const logits = [blocked ? -Infinity : m.SCALED[1][0] + a, m.SCALED[1][1] + b];
  const shares = m.softmax(logits),
    out = m.blendOf(shares, values);
  return { logits, shares, out, values, slope: values[0].map((v, i) => shares[0] * (v - out[i])) };
}
