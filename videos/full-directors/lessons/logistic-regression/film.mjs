import { prepareCaptions } from './captions.mjs';

import assert from 'node:assert/strict';
import {
  opening,
  confusion,
  denominators,
  capacity,
  costLines,
  worksheet,
  close,
  checkDispatch,
} from './dispatch.mjs';
import {
  evidence,
  groove,
  geometry,
  loss,
  likelihood,
  curvature,
  gradient,
  batch,
  shapes,
  learn,
  separation,
  thresholdPlane,
  checkFitting,
} from './fitting.mjs';
import {
  harmonic,
  ranking,
  population,
  thresholds,
  rescale,
  frequencies,
  gaps,
  maps,
  checkAudit,
} from './audit.mjs';
import { classes, stable, margins, kernel, parity, checkExtensions } from './extensions.mjs';
import { validateModel } from '../../../films/logistic-regression/model.mjs';

const painters = [
  opening,
  evidence,
  groove,
  geometry,
  loss,
  likelihood,
  curvature,
  gradient,
  batch,
  shapes,
  learn,
  separation,
  thresholdPlane,
  confusion,
  denominators,
  harmonic,
  capacity,
  costLines,
  ranking,
  population,
  thresholds,
  rescale,
  frequencies,
  gaps,
  maps,
  classes,
  stable,
  margins,
  kernel,
  parity,
  worksheet,
  close,
];

function draw(ctx, clock) {
  painters[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  assert.equal(painters.length, 32);
  validateModel();
  checkFitting();
  checkDispatch();
  checkAudit();
  checkExtensions();
  return true;
}
export default { title: 'Can More Reviews Cost Less?', preparePicture: prepareCaptions, draw, check };
