import { EVAL_DATE } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const sourceHash = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
export function isCurrent(record, onDate = EVAL_DATE) {
  return record.from <= onDate && (record.to === null || onDate <= record.to);
}
export function termSet(text) {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(tokens);
}
export function lexicalScore(query, text) {
  const queryTerms = termSet(query);
  return [...termSet(text)].filter((term) => queryTerms.has(term)).length;
}
export const prClamp = (x) => Math.max(0, Math.min(1, x));
export function halfOpenCurrent(record, time) {
  assert(
    Number.isFinite(time) &&
      Number.isFinite(record.start) &&
      (record.end === null || Number.isFinite(record.end)),
  );
  return record.start <= time && (record.end === null || time < record.end);
}
export function unknownSourceLabels(reply, sourceIds) {
  return [...new Set([...reply.matchAll(/\[(E\d+)\]/g)].map((m) => m[1]))].filter(
    (id) => !sourceIds.includes(id),
  );
}
export function governingRecall(exact, approx, required) {
  const overlap = approx.filter((id) => exact.includes(id)).length;
  return {
    ann: overlap / exact.length,
    task: required.filter((id) => approx.includes(id)).length / required.length,
  };
}
