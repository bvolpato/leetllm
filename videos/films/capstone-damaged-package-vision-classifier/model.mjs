import { cases, photos, visionDevelopment, visionOutcomes, visionRows } from './fixtures.mjs';
import {
  clip,
  confusion,
  cropSnapshot,
  route,
  visionClamp,
  visionFresh,
  visionHead,
  visionJoin,
  visionMasked,
  visionReplay,
  visionStencil,
  visionThreshold,
} from './arithmetic.mjs';
import { visionServed, visionTestRows } from './construction.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'inspect',
    snapshot: 0,
  },
  cues: [
    {
      id: 'explain',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    p = clip(((state.beatP ?? 0) - 0.08) / 0.7);
  return {
    b,
    p,
    q: b ? 1 : p,
    n: b ? 4 : Math.floor(4 * p),
  };
}
export function validateModel() {
  assert.deepEqual(photos.map(route), ['New photo', 'Priority review', 'New photo']);
  assert.equal(
    route({
      ...photos[0],
      brightness: 0.2,
    }),
    'Priority review',
  );
  assert.deepEqual(confusion(cases), {
    TP: 1,
    FP: 1,
    FN: 1,
    TN: 1,
  });
  assert.equal(
    route({
      ...photos[1],
      blur: 0.46,
    }),
    'New photo',
  );
  assert(cropSnapshot(0, 0.02).x < 480);
  assert(cropSnapshot(0, 0.25).x > cropSnapshot(0, 0.02).x);
  assert(cropSnapshot(0, 0.88).x > 480);
  assert.equal(cropSnapshot(0, 0.88).w, 500);
  for (const progress of [0, 0.25, 0.5, 1])
    assert.deepEqual(cropSnapshot(1, progress), cropSnapshot(0, 1));
  return true;
}
export const visionOriginalSample = sampleModel;
export const visionOriginalValidate = validateModel;
export function visionFrame(id, state) {
  const beat = state.beat ?? 0;
  const cue = (name) => state.cues?.['dv-' + name];
  const after = (name, inBeat) => beat > inBeat || cue(name)?.phase === 'after';
  const progress = (name) => visionClamp(cue(name)?.progress ?? 0);
  const op = progress(id + '-operation-' + beat);
  const base = {
    beat,
    op,
    after,
    progress,
  };
  if (id === 'focus-stencil')
    return {
      ...base,
      ...visionStencil(),
      visited: Math.min(9, Math.floor(9 * op)),
      showResponses: after('response-mean', 1),
      showVariance: after('response-variance', 1),
    };
  if (id === 'contrast-intervention')
    return {
      ...base,
      initial: visionStencil(),
      changed: visionStencil(after('contrast-input', 0) ? 0.5 : 1),
      showResponses: after('contrast-responses', 0),
      showVariance: after('contrast-variance', 0),
      showLaw: after('contrast-law', 1),
    };
  if (id === 'head-forward' || id === 'head-update')
    return {
      ...base,
      head: visionHead(),
    };
  if (id === 'masked-categories')
    return {
      ...base,
      masked: visionMasked(),
    };
  if (id === 'development-threshold') {
    const threshold = after('threshold-choice', 2)
      ? 0.7
      : after('threshold-three-counts', 2)
        ? 0.3
        : after('threshold-seven-counts', 1)
          ? 0.7
          : 0.8;
    return {
      ...base,
      rows: visionDevelopment.map(([score, gold], i) => ({
        id: 'V' + (i + 1),
        score,
        gold,
      })),
      result: visionThreshold(visionDevelopment, threshold),
      showInputs: after('development-inputs', 0),
      showCounts: after('threshold-eight-counts', 1),
      showMetrics:
        threshold === 0.8
          ? after('threshold-eight-recall', 1)
          : threshold === 0.7
            ? after('threshold-seven-metrics', 1)
            : after('threshold-three-counts', 2),
      choice: after('threshold-choice', 2),
    };
  }
  if (id === 'missing-evidence' || id === 'outcome-clock') {
    const late = id === 'missing-evidence' ? after('late-case-change', 0) : after('late-join', 1);
    const outcomes = visionOutcomes.map((row) => ({
      ...row,
      available_day: late && row.case_id === 'R-408' ? 13 : row.available_day,
    }));
    const cutoff = id === 'missing-evidence' && after('late-restored-metrics', 1) ? 13 : 12;
    const empty = id === 'missing-evidence' && after('empty-metrics', 2);
    return {
      ...base,
      late,
      cutoff,
      outcomes: empty ? [] : outcomes,
      ...visionJoin(visionTestRows, visionServed, empty ? [] : outcomes, cutoff),
      empty,
      showMetrics:
        id === 'missing-evidence' ? after('late-observed-metrics', 0) : after('eligible-join', 0),
    };
  }
  if (id === 'fresh-parcel') {
    const cutoff = after('fresh-cutoff', 2) ? 22 : 21;
    return {
      ...base,
      fresh: visionFresh(cutoff),
      showRoutes: after('fresh-route', 1),
      showMiss: after('fresh-missed-case', 2),
      showMetrics:
        cutoff === 21 ? after('fresh-incomplete-metrics', 1) : after('fresh-complete-metrics', 2),
    };
  }
  return base;
}
validateModel = function validateCompleteVisionModel() {
  visionOriginalValidate();
  assert.equal(visionRows.length, 11);
  assert.equal(new Set(visionRows.map((row) => row.photo.case_id)).size, 9);
  assert.equal(visionServed.length, 7);
  assert.equal(Object.keys(visionServed[0]).length, 20);
  assert.deepEqual(
    visionServed.map((row) => row.action),
    [
      'priority_damage_review',
      'priority_damage_review',
      'normal_review',
      'request_new_photo',
      'priority_damage_review',
      'normal_review',
      'request_new_photo',
    ],
  );
  assert.deepEqual(visionStencil().responses, [1, -1, 0, 1, -1, 0, 1, -1, 0]);
  assert.equal(visionStencil().variance, 2 / 3);
  assert.equal(visionStencil(0.5).variance, 1 / 6);
  for (const scale of [0.25, 0.75, 2, -1])
    assert(Math.abs(visionStencil(scale).variance - (2 / 3) * scale ** 2) < 1e-12);
  const head = visionHead();
  assert.equal(head.logit, -1);
  assert(Math.abs(head.nextLogit + 0.561364852821997) < 1e-12);
  assert(head.nextLoss < head.loss);
  const freshHead = visionHead({
    features: [-2],
    weights: [0],
    bias: 0,
    target: 0,
    rate: 0.1,
  });
  assert.equal(freshHead.nextWeights[0], 0.1);
  assert.equal(freshHead.nextBias, -0.05);
  assert.equal(freshHead.nextLogit, -0.25);
  assert.deepEqual(visionMasked([0, 0, 0, 0], [1, null, 0, null]).gradients, [-0.25, 0, 0.25, 0]);
  assert.equal(visionMasked([0], [null]).mean, null);
  assert.deepEqual(
    [0.8, 0.7, 0.3].filter((t) => {
      const r = visionThreshold(visionDevelopment, t);
      return r.slots <= 4 && r.recall >= 0.75;
    }),
    [0.7],
  );
  const joined = visionJoin(visionTestRows, visionServed, visionOutcomes, 12);
  assert.deepEqual(joined.counts, {
    TP: 1,
    FP: 1,
    FN: 1,
    TN: 1,
  });
  assert.equal(joined.precision, 0.5);
  assert.equal(joined.recall, 0.5);
  const first = visionTestRows[0];
  assert(visionReplay(visionServed[0], first.photo, first.output));
  assert(
    !visionReplay(
      {
        ...visionServed[0],
        brightness: true,
      },
      first.photo,
      first.output,
    ),
  );
  const early = visionFresh(21),
    late = visionFresh(22);
  assert.equal(early.servedActions['R-520'], 'normal_review');
  assert.equal(early.complete, false);
  assert.equal(early.recall, 1);
  assert.equal(late.complete, true);
  assert.equal(late.recall, 2 / 3);
  assert.deepEqual(early.traces, late.traces);
  assert.throws(
    () => visionJoin(visionTestRows, visionServed, [...visionOutcomes, visionOutcomes[0]], 12),
    /Duplicate/,
  );
  return true;
};
sampleModel = function sampleVisionWithResultGates(state) {
  const model = visionOriginalSample(state);
  if (state.visionScene === 'outcomes')
    model.n = visionFrame('outcomes', state).after('original-case-table', 0) ? 4 : 0;
  if (state.visionScene === 'groups' && !visionFrame('groups', state).after('group-repair', 1))
    model.q = 0;
  return model;
};
