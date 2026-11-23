import { finished, label, progress } from '../workbench.mjs';

export function drawShape(ctx, scene, state, api) {
  const { C } = api;
  const rows = 8 - Math.floor(7 * progress(state, 1, 'thin-batch'));
  const flops = 2 * rows * 6 * 6;
  const bytes = 4 * (rows * 6 + 36 + rows * 6);
  api.focus.target('batch-rows', () => {
    label(ctx, api, 'A · token rows', 420, 283, 34, C.blue);
    label(ctx, api, 'B · weights', 950, 283, 34, C.pink);
    label(ctx, api, 'C · output rows', 1490, 283, 34, C.cyan);
    for (const [x, height, color] of [[255, rows, C.blue], [790, 6, C.pink], [1330, rows, C.cyan]]) {
      for (let i = 0; i < height; i++) for (let j = 0; j < 6; j++) {
        const lit = x === 790 ? i === 2 && j === 2 : j === 2;
        api.rect(ctx, x + j * 53, 340 + i * 51, 47, 44, lit ? color : C.panel, color, 4);
      }
    }
    label(ctx, api, '×', 681, 518, 52, C.ink);
    label(ctx, api, '=', 1214, 518, 52, C.ink);
    label(ctx, api, `One weight feeds ${rows} output ${rows === 1 ? 'row' : 'rows'}`, 960, 828, 44, C.ink);
    if (finished(state, 2, 'shape-model')) {
      label(ctx, api, `${flops} FLOPs / ${bytes} bytes = ${(flops / bytes).toFixed(3)} FLOP/B`, 960, 923, 38, C.yellow);
      label(ctx, api, 'Cold FP32 model · count each input and output once', 960, 998, 29, C.muted);
    }
  });
}
export default { id: 'shape', draw: drawShape, cues: ['weight-column', 'thin-batch', 'shape-model'] };
