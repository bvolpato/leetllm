import { gpuReceiptFixtures } from '../fixtures.mjs';
import { classifyGpuReceipt } from '../arithmetic.mjs';
import {
  constructionArrow,
  constructionBox,
  constructionHeading,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionMixedConstruction(
  ctx,
  scene,
  state,
  api,
  C,
  f,
  b,
  p,
  show,
  prog,
  done,
  original,
) {
  let row = {
    ...gpuReceiptFixtures[6],
    new_xids: [31],
  };
  const memory = b === 1 && show('gpu-mixed-memory', 1);
  if (b === 1) {
    row = {
      ...row,
      new_xids: [94],
      cuda_error: 'contained',
    };
    if (memory)
      row = {
        ...row,
        new_xids: [],
        dcgm_findings: ['memory'],
        cuda_error: 'illegal_address',
      };
  }
  if (b === 2)
    row = {
      ...original,
      nvml_device_used_gib: null,
    };
  const r = classifyGpuReceipt(row),
    primaryShown =
      b === 0
        ? done('gpu-result-mixed-primary', 0)
        : b === 1
          ? !memory || done('gpu-result-mixed-memory', 1)
          : done('gpu-result-mixed-unknown', 2),
    relaunchShown =
      b === 0
        ? done('gpu-result-mixed-relaunch', 0)
        : b === 1
          ? true
          : done('gpu-result-mixed-unknown', 2);
  constructionHeading(
    ctx,
    api,
    C,
    b === 2
      ? 'Missing device telemetry leaves the amount unknown'
      : 'Same receipt · independent outputs preserve obligations',
  );
  constructionBox(
    ctx,
    api,
    C,
    'CUDA ' +
      row.cuda_error +
      ' · Xid[' +
      row.new_xids.join(',') +
      '] · decoded ' +
      (row.dcgm_findings.join(',') || 'none'),
    960,
    400,
    1350,
    110,
    C.blue,
    33,
  );
  constructionArrow(ctx, api, C, 960, 470, 500, 620, C.cyan);
  constructionArrow(ctx, api, C, 960, 470, 1440, 620, C.pink);
  constructionBox(
    ctx,
    api,
    C,
    primaryShown ? 'primary: ' + r.hypothesis : 'primary pending',
    500,
    720,
    800,
    120,
    primaryShown ? C.cyan : C.muted,
    31,
  );
  constructionBox(
    ctx,
    api,
    C,
    relaunchShown ? 'must relaunch: ' + r.mustRelaunch : 'relaunch check pending',
    1440,
    720,
    720,
    120,
    relaunchShown ? (r.mustRelaunch ? C.pink : C.yellow) : C.muted,
    33,
  );
  constructionText(
    ctx,
    api,
    C,
    b === 2 && !primaryShown
      ? 'outside memory: pending'
      : 'outside memory: ' + (r.outside === null ? 'unknown' : r.outside.toFixed(2) + ' GiB'),
    960,
    920,
    32,
    r.outside === null ? C.yellow : C.muted,
    'center',
  );
  constructionNote(
    ctx,
    api,
    C,
    'The workload owns the process. The platform owns the device.',
  );
}
export function drawMixedConstructionStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionMixedConstruction);
}
export default {
  id: 'mixed-construction',
  draw: drawMixedConstructionStage,
  cues: [
    'mixed-construction-0',
    'gpu-result-mixed-primary',
    'gpu-result-mixed-relaunch',
    'mixed-construction-1',
    'gpu-mixed-memory',
    'gpu-result-mixed-memory',
    'mixed-construction-2',
    'gpu-result-mixed-unknown',
  ],
};
