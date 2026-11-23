import { A, B } from '../fixtures.mjs';
import { finished, label, progress } from '../workbench.mjs';

function bracket(ctx, api, x, direction) {
  const lip = x + direction * 32;
  api.line(ctx, lip, 374, x, 374, api.C.pink, 7);
  api.line(ctx, x, 374, x, 581, api.C.pink, 7);
  api.line(ctx, x, 581, lip, 581, api.C.pink, 7);
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const a = A[1][1];
  const crop = progress(state, 1, 'crop-column');
  const credited = finished(state, 2, 'credit-three');
  const columns = [956, 1450];

  label(ctx, api, 'From A', 382, 315, 43, C.blue);
  api.circle(ctx, 382, 476, 113, C.blue);
  label(ctx, api, a, 382, 533, 156, C.bg);
  label(ctx, api, '×', 610, 525, 122, C.ink);

  api.focus.target('b-row', () => {
    const close = api.phase(crop, 0.5, 1);
    const right = 1655 - (columns[1] - columns[0]) * close;
    label(ctx, api, 'Row of B', (748 + right) / 2, 315, 43, C.pink);
    bracket(ctx, api, 748, 1);
    bracket(ctx, api, right, -1);
    for (const [j, x] of columns.entries()) {
      ctx.save();
      if (j === 1) ctx.globalAlpha *= 1 - api.phase(crop, 0, 0.5);
      label(ctx, api, B[1][j], x, 534, 144, C.pink);
      ctx.restore();
    }
  });

  for (const [j, x] of columns.entries()) {
    const travel = progress(state, 0, j === 0 ? 'left-product' : 'right-product');
    ctx.save();
    if (j === 1) ctx.globalAlpha *= 1 - api.phase(crop, 0, 0.5);
    api.focus.target(j === 0 ? 'left-term' : 'right-term', () => {
      label(ctx, api, j === 0 ? 'Add to left sum' : 'Add to right sum', x, 932, 39, C.cyan);
      api.line(ctx, x - 174, 857, x + 174, 857, C.cyan, 4);
      if (travel === 0) return;
      // Carry the common factor below the matrix before it drops into its product.
      const across = api.phase(travel, 0, 0.72);
      const down = api.phase(travel, 0.68, 1);
      const factorX = 382 + (x - 102 - 382) * across;
      const factorY = 650 + 158 * down;
      label(ctx, api, a, factorX, factorY, 70, C.blue);
      ctx.save();
      ctx.globalAlpha *= api.phase(travel, 0.32, 0.88);
      label(ctx, api, '×', x, 805, 58, C.ink);
      label(ctx, api, B[1][j], x + 102, 808, 70, C.pink);
      ctx.restore();
      if (credited && j === 0) {
        label(ctx, api, '= ' + a * B[1][j], x + 250, 808, 70, C.cyan);
      }
    });
    ctx.restore();
  }
}

export default { id: 'intro', draw: drawIntro, cues: ['left-product', 'right-product', 'crop-column', 'credit-three'] };
