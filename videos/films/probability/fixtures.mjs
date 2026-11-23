import { probSoftmax, rng } from './arithmetic.mjs';
export const population = Object.freeze({
  abusive: 100,
  clean: 9900,
});
export const broad = Object.freeze({
  tp: 95,
  fp: 495,
});
export const strict = Object.freeze({
  tp: 80,
  fp: 99,
});
export function packets(prefix, first, count, abusive, kept) {
  const result = [];
  for (let offset = 0; offset < count; offset += 50) {
    const size = Math.min(50, count - offset),
      from = first + offset;
    result.push({
      id: prefix + from + '–' + (from + size - 1),
      first: from,
      count: size,
      abusive,
      kept,
    });
  }
  return result;
}
export const queuePackets = [
  ...packets('A', 1, 80, true, true),
  ...packets('A', 81, 15, true, false),
  ...packets('C', 1, 99, false, true),
  ...packets('C', 100, 396, false, false),
].map((row, index) =>
  Object.freeze({
    ...row,
    index,
  }),
);
export const nextLogits = [2, 1.2, 0.1, -2];
export const nextProbabilities = probSoftmax(nextLogits);
export function categoricalDraws(n, probabilities) {
  const random = rng(7),
    result = [];
  for (let i = 0; i < n; i++) {
    let u = random(),
      j = 0;
    while (j < probabilities.length - 1 && u >= probabilities[j]) u -= probabilities[j++];
    result.push(j);
  }
  return result;
}
export const tokenDraws = categoricalDraws(1000, nextProbabilities);
export const freshCapacity = 900;
export function freshQueueAt(falsePositiveRate) {
  const n = 20000, prior = 0.03, recall = 0.8;
  const abuse = n * prior, clean = n - abuse;
  const tp = abuse * recall, fp = clean * falsePositiveRate;
  return Object.freeze({ n, prior, recall, falsePositiveRate, abuse, clean, tp, fp, total: tp + fp, missed: abuse - tp });
}
export const freshQueue = freshQueueAt(0.02);
export const changedQueue = freshQueueAt(0.025);
