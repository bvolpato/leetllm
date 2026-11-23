import { edge, bytes, ruler, nibbles, scaleOwners, groups, checkWeights } from './weights.mjs';
import {
  sensitivity,
  curvature,
  compensate,
  stretch,
  probes,
  widthTrial,
  checkCalibration,
} from './calibration.mjs';
import {
  container,
  placement,
  bus,
  room,
  routes,
  practice,
  checkDeployment,
} from './deployment.mjs';

const chapters = {
  c01: edge,
  c02: bytes,
  c03: ruler,
  c04: nibbles,
  c05: scaleOwners,
  'c05-groups': groups,
  c06: sensitivity,
  c07: curvature,
  c08: compensate,
  c09: stretch,
  c10: probes,
  'c10-grids': widthTrial,
  c11: container,
  'c11-place': placement,
  c12: bus,
  'c12-room': room,
  'c12-trial': routes,
  'c12-practice': practice,
};
export default {
  title: 'Smaller Weights, Complete Evidence',
  draw(ctx, clock) {
    chapters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    checkWeights();
    checkCalibration();
    checkDeployment();
  },
};
