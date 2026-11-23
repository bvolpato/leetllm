import { matchedPairs, THRESHOLD } from '../../../films/fairness-audits/fixtures.mjs';
import { route, wilson, toyRoutingScore } from '../../../films/fairness-audits/arithmetic.mjs';
import {
  rates,
  flips,
  candidateRows,
  offsetRows,
  fixtureResult,
} from '../../../films/fairness-audits/model.mjs';
import { mix, ease } from './counter.mjs';

export { matchedPairs as baseline, THRESHOLD, wilson, rates, flips, fixtureResult };
export const candidate = candidateRows();
export const second = offsetRows();
export const p4 = matchedPairs.find((r) => r.id === 'p4');
export const served = (score, cut = THRESHOLD) => route(score, cut) === 'auto_serve';
export const id = (r) => r.id.toUpperCase();
export const dec = (v) => v.toFixed(2);
export const pct = (v) => Number((v * 100).toFixed(1)) + '%';
export const wordingGap = (f, c) => Math.abs(f - c);
export const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
export function cutoffState(t) {
  const low = ease(t.at(1, 'lower the cutoff', 1.8)),
    high = ease(t.at(2, 'raise the cutoff', 2));
  const back = ease(t.at(3, 'Put the cutoff back', 1.5));
  const cut =
    Math.round(
      100 * (back ? mix(0.95, 0.7, back) : high ? mix(0.5, 0.95, high) : mix(0.7, 0.5, low)),
    ) / 100;
  const useCandidate = Boolean(t.at(3, 'a different set'));
  return { cut, rows: useCandidate ? candidate : matchedPairs, useCandidate };
}
export function register(t) {
  const absent = !!t.at(3, 'drops both versions') && !t.at(4, 'Restore P four');
  const rows = absent ? matchedPairs.filter((r) => r.id !== 'p4') : matchedPairs;
  const missing = matchedPairs.filter((r) => !rows.some((s) => s.id === r.id));
  return { rows, missing };
}
export function band(key) {
  const rows = matchedPairs.filter((r) => r[key] >= 0.7 && r[key] < 0.9);
  const expected = rows.reduce((sum, row) => sum + row[key], 0);
  return { rows, expected, mean: expected / rows.length, ready: rows.filter((r) => r.ready).length };
}
const chatIds = new Set(['p1', 'p2', 'p3', 'n1', 'n2']);
export const channelRows = (channel) =>
  matchedPairs.filter((r) => chatIds.has(r.id) === (channel === 'Chat'));
export function population(ready, fpr) {
  const tp = ready * 0.8,
    fp = Math.round((100 - ready) * fpr);
  return { ready, tp, fp, selected: tp + fp, precision: tp / (tp + fp) };
}
export const scoreExample = [
  [0.4, 0.8],
  [0.5, 0.7],
];
export const scoreCut = 0.75;
export const intervals = [
  [-7, 8],
  [-2, 21],
];
export const tolerance = 10;
export const gapPass = ([lo, hi]) => lo >= -tolerance && hi <= tolerance;
export function toy(penalty) {
  return ['formal', 'conversational'].map((key) => {
    const score = Number(toyRoutingScore(key === 'conversational', penalty).toFixed(2));
    return { key, score, auto: served(score) };
  });
}
export function releaseRows(t) {
  if (t.b === 1 || t.b >= 4) return candidate;
  const one = t.after(2, 'P one falls to point six'),
    six = t.after(2, 'P six rises to point eight');
  return candidate.map((r, i) =>
    (r.id === 'p1' && one) || (r.id === 'p6' && six) ? second[i] : r,
  );
}
export function stripState(rows) {
  const ready = rows.filter((r) => r.ready);
  const holes = (key) => ready.map((r) => served(r[key]));
  const formal = holes('formal'),
    conversational = holes('conversational');
  return {
    ready,
    formal,
    conversational,
    shared: ready.filter((_, i) => formal[i] && conversational[i]).map(id),
    changes: ready
      .map((row, i) => ({ id: row.id, delta: Number(conversational[i]) - Number(formal[i]) }))
      .filter(({ delta }) => delta !== 0),
    flips: flips(THRESHOLD, rows),
  };
}
