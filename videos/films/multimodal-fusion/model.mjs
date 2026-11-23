import {
  CROP_CANDIDATES,
  DASHBOARD,
  IMAGE_224,
  IMAGE_336,
  MAX_PREFIX,
  OUTPUT_RESERVE,
  PATCH_SIZE,
  TEXT_STATE,
  TEXT_TOKENS,
  VIEWS,
  VISUAL_KEYS,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
  VISUAL_VALUES,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createCueTrack, dotProduct, stableSoftmax } from 'vizmatic';
export function chartEvidence(afterHour = DASHBOARD.afterHour) {
  const start = DASHBOARD.hours.indexOf(afterHour);
  assert(start >= 0 && start < DASHBOARD.hours.length - 1);
  const rising = DASHBOARD.series.filter((series) =>
    series.values.slice(start + 1).every((value, index) => value > series.values[start + index]),
  );
  assert.equal(rising.length, 1, 'The illustrated question needs one consistently rising series');
  const series = rising[0];
  const points = series.values.slice(start).map((y, index) => ({
    x: DASHBOARD.hours[start + index],
    y,
  }));
  return {
    name: series.name,
    tone: series.tone,
    points,
    before: points[0],
    after: points.at(-1),
  };
}
export function prefixPlan(visualTokensPerView) {
  const visualTokens = VIEWS * visualTokensPerView;
  const prefix = TEXT_TOKENS + visualTokens;
  return {
    visualTokens,
    prefix,
    maxPrefix: MAX_PREFIX,
    outputReserve: OUTPUT_RESERVE,
    total: prefix + OUTPUT_RESERVE,
    fits: prefix <= MAX_PREFIX,
  };
}
export function crossAttentionFixture(gate = 0) {
  const logits = VISUAL_KEYS.map(
    (key) => dotProduct(TEXT_STATE, key) / Math.sqrt(TEXT_STATE.length),
  );
  const weights = stableSoftmax(logits);
  const attended = VISUAL_VALUES[0].map((_, column) =>
    weights.reduce((sum, weight, row) => sum + weight * VISUAL_VALUES[row][column], 0),
  );
  const gateStrength = Math.tanh(gate);
  const fused = TEXT_STATE.map((base, index) => base + gateStrength * attended[index]);
  return {
    logits,
    weights,
    attended,
    gate,
    gateStrength,
    fused,
  };
}
export const attentionStates = [
  crossAttentionFixture(0),
  crossAttentionFixture(0.175),
  crossAttentionFixture(0.35),
];
export const sceneSnapshots = {
  opening: [
    {
      stage: 0,
      question: `Which line rises after ${DASHBOARD.afterHour} pm?`,
      route: 'image features needed',
    },
    {
      stage: 1,
      question: `Which line rises after ${DASHBOARD.afterHour} pm?`,
      route: 'image features needed',
    },
    {
      stage: 2,
      question: `Which line rises after ${DASHBOARD.afterHour} pm?`,
      route: 'image features needed',
    },
  ],
  patches: [
    {
      stage: 0,
      side: IMAGE_224,
      patch: PATCH_SIZE,
      perSide: IMAGE_224 / PATCH_SIZE,
      count: VISUAL_TOKENS_224,
    },
    {
      stage: 1,
      side: IMAGE_224,
      patch: PATCH_SIZE,
      perSide: IMAGE_224 / PATCH_SIZE,
      count: VISUAL_TOKENS_224,
    },
    {
      stage: 2,
      side: IMAGE_336,
      patch: PATCH_SIZE,
      perSide: IMAGE_336 / PATCH_SIZE,
      count: VISUAL_TOKENS_336,
    },
  ],
  connector: [
    {
      stage: 0,
      inputTokens: VISUAL_TOKENS_336,
      outputTokens: VISUAL_TOKENS_336,
      method: 'per-token projection',
    },
    {
      stage: 1,
      inputTokens: VISUAL_TOKENS_336,
      outputTokens: 32,
      method: 'Q-Former example',
    },
    {
      stage: 2,
      inputTokens: VISUAL_TOKENS_336,
      outputTokens: 64,
      method: 'Perceiver Resampler example',
    },
  ],
  routes: [
    {
      stage: 0,
      route: 'late',
      meets: 'after separate encoders',
    },
    {
      stage: 1,
      route: 'early',
      meets: 'one shared prefix',
    },
    {
      stage: 2,
      route: 'cross',
      meets: 'selected decoder blocks',
    },
  ],
  budget: [
    {
      stage: 0,
      ...prefixPlan(VISUAL_TOKENS_336),
    },
    {
      stage: 1,
      ...prefixPlan(32),
    },
    {
      stage: 2,
      ...prefixPlan(32),
    },
  ],
  attention: attentionStates.map((state, stage) => ({
    stage,
    ...state,
  })),
  'route-choice': [
    {
      stage: 0,
      choice: 'similarity ranking',
    },
    {
      stage: 1,
      choice: 'grounded answer',
    },
    {
      stage: 2,
      choice: 'localized evidence',
    },
  ],
  closing: [
    {
      stage: 0,
      choice: 'pooled score',
    },
    {
      stage: 1,
      choice: 'token-level evidence',
    },
    {
      stage: 2,
      choice: 'evaluate quality and cost',
    },
  ],
};
export const makeTrack = (sceneId, snapshots) =>
  createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
export const TRACKS = Object.fromEntries(
  Object.entries(sceneSnapshots).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
export function eventOrder(deploy, chart) {
  assert(
    deploy.length === 2 && chart.length === 2 && deploy[0] <= deploy[1] && chart[0] <= chart[1],
  );
  return deploy[1] < chart[0] ? 'after' : chart[1] < deploy[0] ? 'before' : 'unresolved';
}
export function multimodalReservation({
  views,
  side,
  patch = 14,
  queries = null,
  text,
  reserve,
  limit = 4096,
}) {
  assert([views, side, patch, text, reserve, limit].every(Number.isInteger));
  assert(
    views > 0 &&
      side > 0 &&
      patch > 0 &&
      side % patch === 0 &&
      text >= 0 &&
      reserve >= 0 &&
      limit > 0,
  );
  if (queries !== null) assert(Number.isInteger(queries) && queries > 0);
  const patches = (side / patch) ** 2,
    visual = views * (queries ?? patches),
    prefix = text + visual,
    total = prefix + reserve;
  return {
    views,
    patches,
    visual,
    prefix,
    total,
    fits: total <= limit,
    kvMiB: (total * 131072) / 2 ** 20,
  };
}
export function cacheWorkAt(boundary) {
  const stages = ['encode', 'project', 'shared-prefix prefill', 'question prefill', 'decode'];
  const skip = {
    none: 0,
    features: 1,
    projected: 2,
    kv: 3,
  }[boundary];
  assert(skip !== undefined);
  return stages.map((name, i) => ({
    name,
    required: i >= skip,
  }));
}
export function cropSelection(maximum = 3) {
  assert(Number.isInteger(maximum) && maximum > 0);
  const local = CROP_CANDIDATES.filter((view) => view.name !== 'global');
  local.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return ['global', ...local.slice(0, maximum - 1).map((view) => view.name)];
}
export function releaseBlockers(values) {
  const limits = {
    helpfulness: 0.85,
    OCR: 0.9,
    IoU: 0.65,
  };
  return Object.keys(limits).filter(
    (k) =>
      typeof values[k] !== 'number' ||
      !Number.isFinite(values[k]) ||
      values[k] < 0 ||
      values[k] > 1 ||
      values[k] < limits[k],
  );
}
export function fusionScoreFixture() {
  const image = [0.6, 0.8],
    text = [1, 0];
  return {
    image,
    text,
    score: dotProduct(image, text),
  };
}
