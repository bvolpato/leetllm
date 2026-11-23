import assert from 'node:assert/strict';
import { paint } from './bench.mjs';
import { opening, release, scoreStrip } from './rotation.mjs';
import {
  paths,
  columns,
  additive,
  dimension,
  direction,
  plane,
  product,
  outputs,
  rectangles,
  widthTrial,
} from './geometry.mjs';
import {
  gradient,
  strength,
  scaling,
  sweeps,
  multiplier,
  targets,
  chosen,
  cost,
  placement,
  rectangular,
  wrapper,
  lexical,
} from './training.mjs';
import {
  inventory,
  planning,
  backward,
  nf4,
  nested,
  precision,
  sharding,
  bitsPerScale,
  scaleSavingGB,
} from './memory.mjs';
import {
  merge,
  dora,
  radial,
  serving,
  compare,
  diagnosis,
  rankRuns,
  formatProbe,
  artifactBudget,
  projectBatch,
} from './deployment.mjs';
import {
  adapterGradients,
  projectionBudget,
  rectangularExample,
  validateModel,
  policyRequest,
  rotationPolicy,
  nf4Block,
  doraRow,
} from '../../../films/lora/model.mjs';
import { matmul } from '../../../films/lora/arithmetic.mjs';
import { FACTORS } from '../../../films/lora/fixtures.mjs';

const painters = [
  opening,
  paths,
  columns,
  additive,
  dimension,
  direction,
  plane,
  product,
  outputs,
  rectangles,
  (d) => gradient(d, false),
  (d) => gradient(d, true),
  strength,
  scaling,
  (d) => targets(d, false),
  (d) => targets(d, true),
  placement,
  rectangular,
  wrapper,
  lexical,
  inventory,
  planning,
  backward,
  nf4,
  nested,
  precision,
  sharding,
  (d) => merge(d, false),
  (d) => merge(d, true),
  dora,
  radial,
  serving,
  compare,
  diagnosis,
  release,
];
function check() {
  validateModel();
  assert.equal(rotationPolicy.routine.days < rotationPolicy.minimumDays, true);
  assert.equal(rotationPolicy.overdue.days >= rotationPolicy.minimumDays, true);
  for (const n of [1, 2]) {
    assert.deepEqual(widthTrial(1, [n, 0]), [n, 0]);
    assert.deepEqual(widthTrial(1, [0, n]), [0, 0]);
    assert.deepEqual(widthTrial(2, [n, 0]), [n, 0]);
    assert.deepEqual(widthTrial(2, [0, n]), [0, n]);
  }
  assert.deepEqual(matmul(FACTORS.B, FACTORS.A)[0], [1, -0.5, -1.5]);
  for (const edited of [0, 1]) {
    const { x, z, correction, base } = rectangularExample(edited);
    assert.equal(x.length, 4);
    assert.deepEqual(z.map((v) => +v.toFixed(3)), [-0.045, -0.105]);
    assert.deepEqual(correction.map((v) => +v.toFixed(3)), edited ? [-0.09, 0, 0.105] : [0, 0, 0]);
    assert.deepEqual(base, [1.375, -0.875, 1]);
  }
  const second = adapterGradients({ A: [[1]], B: [[0.1]], x: [1], g: [-0.9] });
  assert(Math.abs(second.gradA[0][0] + 0.09) < 1e-12);
  assert.equal(second.gradB[0][0], -0.9);
  assert.deepEqual(
    sweeps.map((row) => multiplier(row, false)),
    [2, 0.5, 2],
  );
  assert.deepEqual(
    sweeps.map((row) => +multiplier(row, true).toFixed(3)),
    [5.657, 2.828, 11.314],
  );
  assert.equal(cost(chosen(projectionBudget(), 'qv')), 262144);
  const qwen = projectionBudget(16, 32, 8, 2);
  assert.deepEqual(
    ['qv', 'attention', 'all'].map((mode) => cost(chosen(qwen, mode))),
    [112, 224, 512],
  );
  assert.equal(bitsPerScale, 0.126953125);
  assert.equal(+scaleSavingGB(65).toFixed(2), 3.03);
  const codec = nf4Block([-0.2, 0, 0.2, 2]);
  assert.deepEqual(codec.decoded, [-0.1821, 0, 0.15916, 2]);
  const row = doraRow([6, 8], 5, [1, 0]);
  assert.deepEqual(row.weight, [3, 4]);
  assert.equal(row.output, 3);
  assert.deepEqual(artifactBudget(50, 14, 128), { merged: 700, shared: 20.4 });
  assert.deepEqual(projectBatch().map(({ base, correction, output }) => [base, correction, output]), [
    [[4, 10], [1, 2], [5, 12]],
    [[5, 11], [-2, 2], [3, 13]],
  ]);
  assert.deepEqual(rankRuns.map(({ r, alpha }) => [r, multiplier([r, alpha], false)]), [[8, 2], [16, 2]]);
  const answer = JSON.parse(formatProbe.spans.join(''));
  assert.deepEqual(answer, { queue: 'routine' });
  assert.deepEqual(formatProbe.replies, rankRuns.map(() => answer.queue));
  for (const reply of formatProbe.replies) assert.throws(() => JSON.parse(reply), SyntaxError);
  const supervised = (mask) => formatProbe.spans.filter((_, i) => mask[i]).join('');
  assert.equal(supervised(formatProbe.originalMask), JSON.stringify(answer.queue));
  assert.equal(supervised(formatProbe.revisedMask), JSON.stringify(answer));
  assert.deepEqual(
    rankRuns.filter((run) => run.n.every((n) => n >= 19)).map((run) => run.r),
    [8],
  );
  const f = policyRequest();
  assert.deepEqual([f.base, f.z, f.unscaled, f.correction, f.output], [-1, 1.5, 0.75, 1.5, 0.5]);
  assert.deepEqual(scoreStrip(f, 0, 0), { length: 0, endpoint: f.base });
  assert.deepEqual(scoreStrip(f, 1, 0), { length: 1, endpoint: 0 });
  assert.deepEqual(scoreStrip(f, 1, 0.5), { length: 1.25, endpoint: 0.25 });
  assert.deepEqual(scoreStrip(f, 1, 1), { length: f.correction, endpoint: f.output });
  return true;
}
export default {
  title: 'LoRA: From Low-Rank Geometry to a Tested Adapter',
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](paint(ctx, clock));
  },
  check,
};
