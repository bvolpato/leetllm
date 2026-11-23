import assert from 'node:assert/strict';
import { Scene, camera } from './studio.mjs';
import { intake, reading } from './intake.mjs';
import { models, windowLeft } from './models.mjs';
import { evaluation, freshDay, joinPractice } from './evaluation.mjs';
import {
  rows,
  row,
  traces,
  label,
  atLimit,
  checkedRoute,
  route,
  development,
  thresholdAt,
  replayPair,
  slice,
  delayed,
  readout,
  visionHead,
  visionStencil,
  visionMasked,
  visionThreshold,
  visionFresh,
  visionCaseAction,
  visionReplay,
  fixed,
  visionSigmoid,
} from './records.mjs';

const chapters = [...intake, ...models, ...evaluation];
function draw(ctx, clock) {
  const scene = new Scene(ctx, clock);
  chapters[clock.beat.chapterIndex](scene);
}
function check() {
  assert.equal(chapters.length, 30);
  const dark = route('R-406-a'),
    mailer = route('R-404-a');
  assert.deepEqual([dark.action, mailer.action], ['request_new_photo', 'priority_damage_review']);
  assert.deepEqual([dark.damage_probability, mailer.damage_probability], [0.94, 0.83]);
  for (const view of [dark, mailer]) assert(view.damage_probability >= view.damage_threshold);
  assert(dark.brightness < dark.min_brightness && mailer.brightness >= mailer.min_brightness);
  assert.deepEqual(
    [0, 0.5, 1].map((t) => fixed(reading({ cue: () => t }))),
    ['0.12', '0.21', '0.30'],
  );
  assert.equal(
    route('R-406-a', { brightness: reading({ cue: () => 1 }) }).action,
    'priority_damage_review',
  );
  assert.equal(row('R-406-a').photo.quality_label, 'unusable');
  assert.equal(route('R-409-a').reason, 'package_not_visible');
  const split = ['train', 'validation', 'test'].map((split) => {
    const members = rows.filter((r) => r.photo.split === split);
    return [members.length, new Set(members.map((r) => r.photo.case_id)).size];
  });
  assert.deepEqual(split, [
    [2, 1],
    [2, 2],
    [7, 6],
  ]);
  assert.deepEqual(
    [checkedRoute(atLimit), checkedRoute({ ...atLimit, damage_probability: true })],
    ['Priority review', 'Rejected at validation'],
  );
  assert.deepEqual(
    ['priority_damage_review', 'normal_review', 'request_new_photo'].map(
      (a) => traces.filter((t) => t.action === a).length,
    ),
    [3, 2, 2],
  );
  assert.deepEqual(visionStencil().responses, [1, -1, 0, 1, -1, 0, 1, -1, 0]);
  assert.equal(visionStencil(0.5).variance, visionStencil().variance / 4);
  assert.equal((4 * 224) / 1024, 0.875);
  assert.deepEqual(
    [0, 0.5, 1].map((t) => windowLeft({ cue: () => t })),
    [0, 72, 144],
  );
  assert(
    camera.tear[0] < camera.center &&
      camera.tear[1] > camera.top &&
      camera.tear[1] < camera.top + camera.size,
  );
  assert.deepEqual(
    [2, 3, 4, 5].map((b) => {
      const t = thresholdAt({ cue: (n) => b >= n });
      const result = visionThreshold(development, t);
      return [t, result.slots, result.TP, result.FP, result.FN];
    }),
    [
      [0.8, 2, 1, 1, 3],
      [0.7, 4, 3, 1, 1],
      [0.3, 6, 4, 2, 0],
      [0.7, 4, 3, 1, 1],
    ],
  );
  const h = visionHead();
  assert.deepEqual(h.products, [0.5, -0.5]);
  assert.deepEqual(
    [h.logit, h.probability, h.loss, h.nextLogit, h.nextProbability, h.nextLoss].map((x) =>
      fixed(x, 4),
    ),
    ['−1.0000', '0.2689', '1.3133', '−0.5614', '0.3632', '1.0127'],
  );
  assert(h.nextWeights[0] > h.weights[0] && h.nextWeights[1] < h.weights[1] && h.nextBias > h.bias);
  const m = visionMasked();
  assert.deepEqual([m.observed, fixed(m.mean), m.losses[2], m.gradients[2]], [2, '1.41', null, 0]);
  assert.equal(visionMasked([0], [null]).mean, null);
  assert.deepEqual(
    [1, 2].map((t) => visionSigmoid(2 / t) >= 0.8),
    [true, false],
  );
  assert.equal(Object.keys(replayPair(false).ref).length, 20);
  assert(replayPair(false).match && !replayPair(true).match);
  const r = row('R-408-a');
  assert.deepEqual(
    rows
      .filter(({ photo }) => photo.case_id === 'R-401')
      .map(({ photo }) => [photo.photo_id, photo.split]),
    [
      ['R-401-a', 'train'],
      ['R-401-b', 'train'],
    ],
  );
  assert.deepEqual(
    [r.photo.split, r.photo.source, r.photo.packaging],
    ['test', 'warehouse_camera', 'corrugated'],
  );
  const warehouse = readout(12).joined.find((record) => record.case_id === r.photo.case_id);
  assert.deepEqual(
    [warehouse.action, warehouse.available_day, warehouse.cell],
    ['normal_review', 12, 'FN'],
  );
  assert(!visionReplay({ ...replayPair(false).ref, damage_probability: true }, r.photo, r.output));
  assert.equal(
    visionCaseAction(traces.filter((t) => t.case_id === 'R-404')),
    'priority_damage_review',
  );
  assert.deepEqual(
    joinPractice()
      .filter((r) => r.eligible)
      .map((r) => r.id),
    ['C'],
  );
  assert.deepEqual(readout(12).counts, { TP: 1, FP: 1, FN: 1, TN: 1 });
  assert.deepEqual(
    [12, 13].map((day) => {
      const result = readout(day, delayed);
      return [result.joined.length, result.precision, result.recall, result.servedActions['R-408']];
    }),
    [
      [3, 0.5, 1, 'normal_review'],
      [4, 0.5, 0.5, 'normal_review'],
    ],
  );
  assert.deepEqual([readout(13, []).precision, readout(13, []).recall], [null, null]);
  assert.deepEqual(
    [
      slice('customer_phone').recall,
      slice('warehouse_camera').precision,
      slice('warehouse_camera').recall,
    ],
    [1, null, 0],
  );
  for (const advanced of [false, true]) {
    const f = visionFresh(freshDay({ after: () => advanced }));
    assert.deepEqual(
      f.traces.filter((t) => t.case_id === 'R-520').map((t) => label[t.action]),
      ['Retake', 'Normal review'],
    );
    assert.deepEqual(
      [f.joined.length, f.precision, f.recall, f.complete],
      [advanced ? 5 : 4, 2 / 3, advanced ? 2 / 3 : 1, advanced],
    );
    assert.deepEqual(f.counts, { TP: 2, FP: 1, FN: advanced ? 1 : 0, TN: 1 });
    assert.equal(f.servedActions['R-520'], 'normal_review');
    assert.equal(
      f.joined.find(({ case_id }) => case_id === 'R-520')?.cell,
      advanced ? 'FN' : undefined,
    );
  }
  return true;
}
export default { title: 'A Vision Classifier Needs Usable Evidence', compareRgbaChapters: ['c02'], draw, check };
