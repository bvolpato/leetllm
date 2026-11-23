import { pos, ps } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax, dotProduct, normalizeVector } from 'vizmatic';
export const attend = (rows) => {
  const w = stableSoftmax(rows.map((v) => v[0] / Math.sqrt(2)));
  return [0, 1].map((i) =>
    dotProduct(
      w,
      rows.map((v) => v[i]),
    ),
  );
};
export const placed = (rows) => rows.map((v, i) => v.map((x, j) => x + pos[i][j]));
export const loss = (rows) =>
  -rows.reduce((sum, row, i) => sum + Math.log(stableSoftmax(row)[i]), 0) / 3;
export function visionProject(row, extra = false) {
  assert.equal(row.length, 4);
  const value = [row.reduce((a, b) => a + b, 0) / 4, (-row[0] + row[1] - row[2] + row[3]) / 2];
  return extra ? [...value, row[0] - row[2]] : value;
}
export function visionRotary(q = [0, 0], k = [0, 0]) {
  const angle = ([r, c]) => [(r * Math.PI) / 2, (c * Math.PI) / 2],
    turn = (p) => angle(p).flatMap((v) => [Math.cos(v), Math.sin(v)]),
    left = turn(q),
    right = turn(k);
  return {
    q: left,
    k: right,
    score: dotProduct(left, right),
  };
}
export const visionErf = (x) => {
  let term = x,
    sum = x;
  for (let i = 1; i < 36; i++) {
    term *= (-x * x) / i;
    sum += term / (2 * i + 1);
  }
  return (2 * sum) / Math.sqrt(Math.PI);
};
export function visionPreln(input = [2, 4], attention = [0.5, -0.5]) {
  const residual = input.map((v, i) => v + attention[i]),
    mean = (residual[0] + residual[1]) / 2,
    variance = residual.reduce((s, v) => s + (v - mean) ** 2, 0) / 2,
    norm = residual.map((v) => (v - mean) / Math.sqrt(variance + 1e-5)),
    expanded = [...norm, ...norm],
    gelu = expanded.map((v) => 0.5 * v * (1 + visionErf(v / Math.sqrt(2)))),
    update = [(gelu[0] + gelu[2]) / 2, (gelu[1] + gelu[3]) / 2];
  return {
    input,
    attention,
    residual,
    norm,
    expanded,
    gelu,
    update,
    output: residual.map((v, i) => v + update[i]),
  };
}
export function visionPadding(padding = 0, masked = true) {
  assert(Number.isInteger(padding) && padding >= 0);
  const values = [
      ...ps,
      ...Array.from(
        {
          length: padding,
        },
        () => [0, 0],
      ),
    ],
    scores = values.map((v) => v[0] / Math.sqrt(2)),
    valid = values.map((_, i) => !masked || i < 2),
    maximum = Math.max(...scores.filter((_, i) => valid[i])),
    exps = scores.map((v, i) => (valid[i] ? Math.exp(v - maximum) : 0)),
    total = exps.reduce((a, b) => a + b, 0),
    w = exps.map((v) => v / total);
  return {
    values,
    weights: w,
    output: [0, 1].map((d) =>
      dotProduct(
        w,
        values.map((v) => v[d]),
      ),
    ),
  };
}
export function visionSiglip() {
  const scores = [
      [2, -1],
      [-0.4, 1.7],
    ],
    labels = [
      [1, -1],
      [-1, 1],
    ],
    losses = scores.map((row, r) => row.map((v, c) => Math.log1p(Math.exp(-labels[r][c] * v))));
  return {
    scores,
    labels,
    losses,
    sum: losses.flat().reduce((a, b) => a + b, 0),
    objective: losses.flat().reduce((a, b) => a + b, 0) / 2,
  };
}
export function visionCandidateRanking(copied = false) {
  const image = normalizeVector([0.95, 0.2, 0.05]),
    text = [
      [0.9, 0.25, 0.05],
      [0.05, 0.95, 0.1],
    ].map(normalizeVector),
    scores = text.map((v) => 5 * dotProduct(image, v)),
    current = copied ? [scores[0], scores[0], scores[1]] : scores;
  return {
    scores: current,
    probabilities: stableSoftmax(current),
  };
}
export function visionPrefixBudget(side, textSlots = 512, images = 1, merge = 1) {
  assert(side % 14 === 0 && Number.isInteger(images) && images > 0 && merge > 0);
  const visual = ((side / 14) ** 2 * images) / merge,
    total = textSlots + visual;
  return {
    visual,
    text: textSlots,
    total,
    bytesPerSlot: 2 * 32 * 8 * 128 * 2,
    mib: total * 0.125,
  };
}
