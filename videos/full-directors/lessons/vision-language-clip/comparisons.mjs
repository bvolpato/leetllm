import {
  computeClipFixture,
  reductionDecision,
  patchAttention,
  workerSchedule,
} from '../../../films/vision-language-clip/model.mjs';
import {
  IMAGE_FEATURES,
  TEXT_FEATURES,
  PATCH_KV,
  TEMPERATURE,
} from '../../../films/vision-language-clip/fixtures.mjs';
import { contrastiveStep } from '../../../films/vision-language-clip/training.mjs';
import { prefixCosts, pairLogisticLoss } from '../../../films/vision-language-clip/arithmetic.mjs';
import {
  chooseCandidate,
  scoreFloor,
  marginFloor,
} from '../../../films/vision-language-clip/inspection-policy.mjs';
import {
  cachedImageAllowed,
  imageLedgerSnapshot,
} from '../../../films/vision-language-clip/protocols.mjs';
export {
  computeClipFixture,
  IMAGE_FEATURES,
  TEXT_FEATURES,
  PATCH_KV,
  TEMPERATURE,
  contrastiveStep,
  reductionDecision,
  patchAttention,
  workerSchedule,
  prefixCosts,
  pairLogisticLoss,
  chooseCandidate,
  scoreFloor,
  marginFloor,
  cachedImageAllowed,
  imageLedgerSnapshot,
};
export const batch = computeClipFixture();
export const names = ['Bicycle', 'Dog', 'Bowl'];
export const prompts = ['A red bicycle', 'A dog in a park', 'A bowl of oranges'];
export const letters = ['A', 'B', 'C'];
export const initialPrompts = [
  { text: 'Vent is blocked', score: 0.68 },
  { text: 'Clear rack door', score: 0.53 },
  { text: 'Tape across the tag', score: 0.18 },
];
export const revisedPrompts = [
  initialPrompts[0],
  { text: 'Vent is clear beside the cover', score: 0.64 },
  initialPrompts[2],
];
export const frac = (v) => v.toFixed(3);
export const pct = (v) => (v === 1 ? '100%' : (v * 100).toFixed(1) + '%');
export function candidateSet(ids) {
  const rows = ids.map((i) => ({
    i,
    cos: batch.cosine[0][i],
    weight: Math.exp(batch.logits[0][i]),
  }));
  const total = rows.reduce((s, row) => s + row.weight, 0);
  return rows.map((row) => ({ ...row, share: row.weight / total }));
}
export function ranking(query) {
  const items = batch.cosine.map((row, i) => ({ i, score: row[query] }));
  return { prompt: prompts[query], items: items.sort((a, b) => b.score - a.score) };
}
function unitVector(vector) {
  const length = Math.hypot(...vector);
  if (!Number.isFinite(length) || length === 0) throw new RangeError('Expected finite, positive length');
  return vector.map((value) => value / length);
}
export function combineTemplates(first, second) {
  const units = [unitVector(first), unitVector(second)];
  const mean = units[0].map((v, i) => (v + units[1][i]) / 2);
  const length = Math.hypot(...mean);
  const direction = Number.isFinite(length) && length > 0 ? unitVector(mean) : null;
  return { units, mean, length, direction };
}
export const bowlTemplates = combineTemplates([3, 4], [6, -8]);
export const oppositeTemplates = combineTemplates([-1, 0], [1, 0]);
export const arrows = [
  [0.8, 0.6],
  [9, 12],
];
export const scaledArrows = arrows.map(unitVector);
export const actor = { tenant: 'Ops', sites: ['East'] };
export const archive = [
  { id: '17', site: 'East', generation: 13, tenant: 'Ops' },
  { id: '08', site: 'West', generation: 13, tenant: 'Ops' },
  { id: '42', site: 'East', generation: 12, tenant: 'Ops' },
];
export function allowedRecords(person, sites, generation) {
  return archive.filter(
    (row) =>
      cachedImageAllowed(person, row) && sites.includes(row.site) && row.generation === generation,
  );
}
export const rawGB = (10_000_000 * 768 * 2) / 1e9;
export const relevant = ['17', '08', '42'],
  hits = ['17', '08', '35'];
export const tagReads = [
  ['RACK-17', 'RACK-17'],
  ['RACK-08', 'RACK-O8'],
];
export const recall = hits.filter((id) => relevant.includes(id)).length / relevant.length;
export const exact = tagReads.filter(([a, b]) => a === b).length / tagReads.length;
export function boxScore(offset) {
  const side = 0.6,
    intersection = (side - offset) ** 2,
    union = 2 * side ** 2 - intersection;
  return { side, offset, intersection, union, iou: intersection / union };
}
export const gates = [
  ['Retrieval recall', 0.93, 0.9],
  ['OCR exact match', 0.89, 0.92],
  ['Grounding IoU', 0.73, 0.7],
].map(([label, value, floor]) => ({ label, value, floor, pass: value >= floor }));
