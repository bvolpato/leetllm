import { product2x2State } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';

const product = product2x2State(8);
const { A, B, sums } = product;

export function drawSystolicDataflow(ctx, scene, state, api) {
  const { C, text, rect, line, circle } = api;
  const at = (name, beat) => accEvent(scene, state, name, beat);
  api.focus.target('systolic-dataflow-mechanism', () => {
    if (state.beat === 0) {
      text(ctx, 'One Hopper warp-group', 150, 300, 45, C.ink);
      for (let warp = 0; warp < 4; warp++) {
        const x = 145 + warp * 420;
        text(ctx, 'Warp ' + warp, x, 414, 37, C.blue);
        for (let lane = 0; lane < 32; lane++) {
          const col = lane % 8,
            row = Math.floor(lane / 8);
          rect(ctx, x + col * 46, 467 + row * 59, 38, 45, C.panel, C.blue, 4);
        }
      }
      if (at('group', 0) > 0)
        text(ctx, '4 warps × 32 threads = 128 threads', 960, 861, 49, C.cyan, 'center');
      return;
    }

    const clocks =
      at('start', 1) + at('advance', 1) + (state.beat >= 2 ? at('next', 2) + at('others', 2) : 0);
    const tick = Math.max(0, Math.ceil(clocks) - 1);
    const travel = clocks === 0 ? 0 : clocks - tick;
    const firstReady = state.beat > 1 || at('first', 1) === 1;
    const complete = Math.floor(clocks);
    text(ctx, 'Activation rows', 135, 294, 35, C.blue);
    text(ctx, '[1, 2]    [3, 4]', 135, 351, 40, C.blue);
    text(ctx, 'Weights stay in the four cells', 821, 292, 37, C.ink, 'center');
    text(ctx, 'Output Y', 1518, 294, 39, C.green, 'center');
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < 2; j++) {
        const x = 452 + 476 * j,
          y = 380 + 287 * k;
        const i = tick - k - j;
        const active = clocks > 0 && i >= 0 && i < 2;
        rect(ctx, x, y, 270, 144, C.panel, active ? C.yellow : C.muted, 12);
        text(ctx, 'Weight ' + B[k][j], x + 135, y + 57, 38, C.yellow, 'center');
        const partial = active && k === 1 ? A[i][0] * B[0][j] : 0;
        if (active) {
          const a = A[i][k];
          const expression = partial + ' + ' + a + ' × ' + B[k][j];
          text(ctx, expression, x + 135, y + 116, 34, C.ink, 'center');
          // The incoming activation moves across its row. The partial moves down its column.
          line(ctx, x - 172, y + 80, x - 12, y + 80, C.blue, 3);
          const ax = x - 154 + 110 * travel;
          circle(ctx, ax, y + 80, 27, C.blue);
          text(ctx, String(a), ax, y + 91, 30, C.bg, 'center');
          if (k === 1) {
            const sx = x + 135;
            line(ctx, sx, y - 129, sx, y - 10, C.cyan, 3);
            const sy = y - 104 + 69 * travel;
            circle(ctx, sx, sy, 27, C.cyan);
            text(ctx, String(partial), sx, sy + 10, 27, C.bg, 'center');
          }
        }
      }
    }
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const x = 1348 + j * 191,
          y = 407 + i * 190;
        const finished = complete >= i + j + 2;
        const show = finished && (i + j > 0 || firstReady);
        rect(ctx, x, y, 158, 145, C.panel, show ? C.green : C.muted, 10);
        text(ctx, 'Y' + i + j, x + 79, y + 46, 28, C.muted, 'center');
        text(
          ctx,
          show ? String(sums[i][j]) : '?',
          x + 79,
          y + 112,
          51,
          show ? C.green : C.muted,
          'center',
        );
      }
    }
    let note = 'Blue moves right. Cyan carries the running sum down.';
    if (complete === 1) note = 'First column   ·   0 + 1 × 5 = 5';
    if (complete === 2)
      note = firstReady
        ? 'First column   ·   5 + 2 × 7 = 19'
        : 'Two terms retained in the first output';
    if (complete === 3) note = 'Two cells finish on this step   ·   22 and 43';
    if (complete === 4) note = 'Last cell   ·   18 + 4 × 8 = 50';
    text(ctx, note, 960, 964, 40, C.ink, 'center');
  });
}
export default {
  id: 'systolic-dataflow',
  draw: drawSystolicDataflow,
  cues: [
    'ag-systolic-dataflow-group',
    'ag-systolic-dataflow-start',
    'ag-systolic-dataflow-advance',
    'ag-systolic-dataflow-first',
    'ag-systolic-dataflow-next',
    'ag-systolic-dataflow-others',
  ],
};
