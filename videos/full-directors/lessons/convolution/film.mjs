import { prepareCaptions } from './captions.mjs';

import assert from 'node:assert/strict';
import {
  IMAGE,
  KERNEL,
  ARTICLE_CROP,
  RIDGE,
  POOL_MAP,
  POOL_INCOMING,
  OVERLAP_MAP,
} from '../../../films/convolution/fixtures.mjs';
import {
  correlate,
  parameterCount,
  poolSnapshot,
  residualSlice,
} from '../../../films/convolution/arithmetic.mjs';
import {
  cropForward,
  fieldTrace,
  signalParticipation,
  paddedUniform,
  patchProjection,
} from '../../../films/convolution/model.mjs';
import { channelSnapshot } from '../../../films/convolution/construction.mjs';
import { background, total } from './bench.mjs';
import { starts, checkScans } from './worked-scan.mjs';
import {
  seam,
  brightness,
  weights,
  printMap,
  ridge,
  sharing,
  translation,
  dilation,
  dilationRow,
  uniform,
  boundary,
  changedKernel,
  positions,
  bank,
  pairs,
} from './optics.mjs';
import {
  channels,
  groups,
  field,
  winners,
  backwards,
  overlapRepair,
  globalHead,
  participation,
  paddingArtifact,
  tieMap,
  partialGrad,
  maps,
  stripePatch,
  movedPeak,
} from './pooling.mjs';
import {
  forward,
  reluReadings,
  residual,
  gradientPaths,
  patches,
  selection,
  reverseEdge,
  exposure,
  exposureState,
  reversed,
  inspectionRun,
} from './readout.mjs';

const chapters = [
  ['Where does the seam disappear?', seam],
  ['Two patches with the same brightness', brightness],
  ['A stencil for a vertical edge', weights],
  ['Where does a window print its sum?', printMap],
  ['One stencil scans the whole panel', (g, t) => printMap(g, t, true)],
  ['A filter for the bright ridge', ridge],
  ['Who owns the weights?', sharing],
  ['Will the peak follow the seam?', translation],
  ['Count the windows that fit', starts],
  ['Spread the weights within one window', dilation],
  ['Two channel readings, one output', channels],
  ['Which channels can this filter read?', groups],
  ['How far back can one response see?', field],
  ['What should the pool remember?', winners],
  ['Where does the minus sign go?', backwards],
  ['Four gradients reach one cell', overlapRepair],
  ['One spatial mean per channel', globalHead],
  ['How often does a border pixel count?', participation],
  ['A gray panel acquires an edge', paddingArtifact],
  ['Which window sets both class scores?', forward],
  ['Add a change to the saved input', residual],
  ['Can the shortcut gradient vanish?', gradientPaths],
  ['From a square patch to a token', patches],
  ['What does the border reveal?', selection],
  ['Reverse the seam', reverseEdge],
  ['Which exposure changes the winner?', exposure],
];
function draw(ctx, clock) {
  const [title, paint] = chapters[clock.beat.chapterIndex];
  ctx.save();
  try {
    ctx.scale(1.6, 1.6);
    background(ctx, clock.beat.id === 'c20-b06' ? 'What does ReLU do to a signed response?' : title);
    paint(ctx, clock);
  } finally {
    ctx.restore();
  }
}
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, actual + ' differs from ' + expected);
function check() {
  assert.equal(chapters.length, 26);
  close(total(uniform), total(boundary));
  close(correlate(uniform, KERNEL)[0][0], 0);
  close(correlate(boundary, KERNEL)[0][0], 3);
  assert.deepEqual(
    correlate(IMAGE, KERNEL),
    Array.from({ length: 3 }, () => [3, 3, 0]),
  );
  assert.deepEqual(correlate(reversed, KERNEL)[0], [-3, -3, 0]);
  close(cropForward().raw[0][0], 0.852);
  close(correlate(ARTICLE_CROP, changedKernel)[0][0], 0.882);
  close(ARTICLE_CROP[0][0] * (changedKernel[0][0] - RIDGE[0][0]), 0.03);
  assert.equal(positions, 49284);
  assert.equal(bank, 448);
  assert.equal(positions * bank, 22079232);
  assert.deepEqual(
    pairs.map((row) => correlate([row], [[-1, 1]], 2)[0]),
    [
      [1, 0, 0],
      [0, 0, 0],
    ],
  );
  assert.deepEqual(correlate(IMAGE, KERNEL, 2), [
    [3, 0],
    [3, 0],
  ]);
  checkScans();
  assert.deepEqual(dilationRow(2, false), { span: 5, pad: 0, starts: 24, first: 0, last: 23 });
  assert.deepEqual(dilationRow(2, true), { span: 5, pad: 2, starts: 28, first: -2, last: 25 });
  const reluPhrases = ['clips the first', 'and keeps the second', 'Stack affine'];
  const reluOutputs = [[null, null], [null, null], [0, null], [0, 0.4]];
  for (const [count, outputs] of reluOutputs.entries()) {
    const heard = reluPhrases.slice(0, count);
    const clock = { beat: { beatIndex: 5 }, reveal: phrase => heard.includes(phrase) };
    const readings = reluReadings(clock);
    assert.deepEqual(readings.map(row => row.raw), [-0.4, 0.4]);
    assert.deepEqual(readings.map(row => row.output), outputs);
  }
  assert.deepEqual([channelSnapshot(0).total, channelSnapshot(1).total], [6, 0]);
  assert.equal(parameterCount(4, 6, 3, 2), 114);
  assert.deepEqual(
    fieldTrace().map((v) => [v.field, v.jump, v.size]),
    [
      [3, 1, 222],
      [5, 1, 220],
      [6, 2, 110],
      [10, 2, 108],
    ],
  );
  assert.deepEqual(
    poolSnapshot(POOL_MAP).owners.map((v) => v.input),
    [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ],
  );
  assert.deepEqual(poolSnapshot(movedPeak(0)).owners[0].input, [1, 0]);
  assert.deepEqual(poolSnapshot(movedPeak(2)).owners[1].input, [1, 2]);
  assert.deepEqual(poolSnapshot(tieMap).owners[0].input, [0, 0]);
  assert.deepEqual(
    poolSnapshot(OVERLAP_MAP, { stride: 1 }).owners.map((v) => v.flat),
    [4, 4, 4, 4],
  );
  assert.equal(partialGrad(POOL_MAP, POOL_INCOMING, 'max', 2, 4)[1][2], -1);
  close(partialGrad(POOL_MAP, POOL_INCOMING, 'average', 2, 4)[0][2], -0.25);
  close(partialGrad(OVERLAP_MAP, POOL_INCOMING, 'average', 1, 4)[1][1], 1.125);
  assert.deepEqual(
    [1, 2, 3, 4].map((n) => partialGrad(OVERLAP_MAP, POOL_INCOMING, 'max', 1, n)[1][1]),
    [2, 1, 1.5, 4.5],
  );
  assert.equal(partialGrad(OVERLAP_MAP, POOL_INCOMING, 'max', 1, 4, true)[1][1], 3);
  close(total(maps[0]) / 9, 0.25);
  close(total(maps[5]) / 9, 2 / 3);
  assert.deepEqual(
    [
      [5, 0, 0, 0],
      [5, 2, 2, 0],
      [5, 0, 0, 1],
      [4, 1, 1, 0],
    ].map((args) => signalParticipation(...args).count),
    [1, 9, 4, 4],
  );
  const k = paddedUniform().kernel;
  close(correlate(stripePatch(false, false), k)[0][0], -1.8);
  close(correlate(stripePatch(false, true), k)[0][0], -3);
  close(correlate(stripePatch(true, true), k)[0][0], 0);
  close(paddedUniform('reflect').maxAbs, 0);
  close(residualSlice(0.2, 3, 1).total, 3.6);
  close(residualSlice(-1).total, 0);
  close(residualSlice(0.2, 3, 0).total, 0);
  assert.deepEqual(
    inspectionRun.map((row) => [row.caught.filter(Boolean).length, row.caught.length]),
    [
      [9, 10],
      [0, 2],
    ],
  );
  const projection = patchProjection();
  projection.kernels.forEach((kernel, i) => {
    const convolved = correlate(projection.image, kernel, 2).flat();
    convolved.forEach((v, j) => close(v + projection.bias[i], projection.tokens[j][i]));
  });
  for (const [pixel, response, owner, logits] of [
    [0.05, 0.852, [1, 1], [1.0236, -0.6866]],
    [0.01, 0.876, [0, 0], [1.0264, -0.6884]],
    [0.02, 0.87, [1, 1], [1.0236, -0.6866]],
  ]) {
    const out = exposureState(pixel);
    close(out.raw[0][0], response);
    close(out.raw[0][0] - cropForward().raw[0][0], (pixel - ARTICLE_CROP[0][0]) * RIDGE[0][0]);
    assert.deepEqual(out.owner, owner);
    assert.equal(out.grad[owner[0]][owner[1]], -2);
    assert.equal(total(out.grad), -2);
    logits.forEach((v, i) => close(v, out.logits[i]));
    out.raw
      .flat()
      .slice(1)
      .forEach((v, i) => close(v, cropForward().raw.flat()[i + 1]));
  }
}
export default { title: 'How a Convolution Finds an Edge', draw, check, preparePicture: prepareCaptions };
