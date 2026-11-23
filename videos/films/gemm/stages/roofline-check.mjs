import { registerDemand } from '../arithmetic.mjs';
import { cell, finished, label, progress } from '../workbench.mjs';

export function drawRooflineCheck(ctx, scene, state, api) {
  const { C, teaching } = api;
  const numeric = state.beat >= 2;
  const peak = 200, bandwidth = 1, example = 10;
  const knee = peak / bandwidth;
  const bound = Math.min(peak, bandwidth * example);
  api.focus.target('gemm-roofline-bound', () => {
    if (state.beat === 0) {
      const thread = registerDemand(1, 4);
      label(ctx, api, 'One thread · 1 × 4 outputs', 520, 367, 39, C.blue);
      label(ctx, api, 'Same launches · device memory', 1390, 367, 39, C.cyan);
      cell(ctx, api, `${thread.flops} FLOPs / ${thread.bytes} operand bytes`, 170, 436, 700, 160, C.blue, 40);
      cell(ctx, api, 'FLOPs / ? HBM bytes', 1040, 436, 700, 160, C.cyan, 42);
      label(ctx, api, `${thread.ratio} FLOP/B`, 520, 722, 48, C.blue);
      label(ctx, api, 'Can 0.4 go on the HBM axis?', 960, 917, 41, C.yellow);
      return;
    }
    const plot = teaching.axes({
      x: 330, y: 405, width: 1200, height: 405,
      xDomain: [0, 300], yDomain: [0, 240],
      xTicks: numeric ? [0, 100, 200, 300] : [], yTicks: numeric ? [0, 100, 200] : [],
      xLabel: 'FLOPs / HBM byte', yLabel: 'Ideal bound (TFLOP/s)', color: C.muted,
    });
    label(ctx, api, numeric ? 'Hypothetical device · 200 TFLOP/s peak · 1 TB/s bandwidth' :
      'Count the FLOPs and HBM bytes for the same launches', 960, 285, 38, C.ink);
    teaching.curve({ plot, points: [{x: 0, y: peak}, {x: 300, y: peak}], color: C.blue, progress: 1 });
    teaching.curve({ plot, points: [{x: 0, y: 0}, {x: knee, y: peak}, {x: 300, y: peak}],
      color: C.cyan, progress: numeric ? 1 : progress(state, 1, 'boundary') });
    if (finished(state, 2, 'roofline-knee')) label(ctx, api, `Knee · ${knee} FLOP/B`, 1230, 391, 32, C.cyan);
    if (finished(state, 2, 'roofline-result')) {
      teaching.scatter({ plot, points: [{x: example, y: bound}], color: C.yellow, radius: 10 });
      label(ctx, api, `${example} FLOP/B → ceiling of ${bound} TFLOP/s`, 444, 794, 28, C.yellow, 'left');
    } else if (finished(state, 2, 'roofline-point')) {
      label(ctx, api, `Workload · ${example} FLOP/B`, 444, 794, 28, C.yellow, 'left');
    }
    label(ctx, api, state.beat === 3 ? 'Check outputs → warm up → time repeated launches with CUDA events' :
      'Throughput ≤ min(peak compute, bandwidth × FLOPs per HBM byte)', 960, 976, 33, C.ink);
  });
}
export default { id: 'roofline-check', draw: drawRooflineCheck, cues: ['thread-demand', 'boundary', 'roofline-knee', 'roofline-point', 'roofline-result', 'timing'] };
