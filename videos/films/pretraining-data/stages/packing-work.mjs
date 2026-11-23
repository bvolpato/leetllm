import { packRecords } from '../arithmetic.mjs';
import { drawText, note, rectangle, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainPackingWork(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  const lengths = [7, 6, 5, 5, 3, 2],
    colors = [C.blue, C.cyan, C.pink, C.yellow, C.green, C.blue];
  if (b < 2) {
    const bins = packRecords(lengths);
    const n =
      Number(D('seven')) +
      Number(D('six')) +
      Math.floor(2 * P('fives')) +
      Number(D('three')) +
      Number(D('two'));
    drawText(ctx, api, C, 'Six source records', 540, 290, 35, C.blue);
    drawText(ctx, api, C, 'Best-fit capacity-10 blocks', 1380, 290, 35, C.cyan);
    lengths.forEach((nTokens, i) => {
      const y = 350 + i * 85,
        col = colors[i];
      for (let k = 0; k < 10; k++) rectangle(ctx, api, C, 250 + k * 50, y, 43, 48, C.panel);
      const moved = i < n;
      rectangle(
        ctx,
        api,
        C,
        250,
        y,
        nTokens * 50 - 7,
        48,
        moved ? C.panel : col,
        moved ? C.border : undefined,
      );
      drawText(
        ctx,
        api,
        C,
        'R' + (i + 1) + ' / ' + nTokens,
        180,
        y + 35,
        26,
        moved ? C.muted : col,
      );
    });
    bins.forEach((bin, row) => {
      const y = 405 + row * 175;
      for (let k = 0; k < 10; k++) rectangle(ctx, api, C, 1050 + k * 58, y, 51, 70, C.panel);
      let used = 0;
      for (const v of bin) {
        if (v.id < n) {
          rectangle(ctx, api, C, 1050 + used * 58, y, v.n * 58 - 7, 70, colors[v.id]);
          drawText(
            ctx,
            api,
            C,
            'R' + (v.id + 1) + ' / ' + v.n,
            1050 + (used + v.n / 2) * 58 - 3,
            y + 46,
            28,
            C.bg,
          );
        }
        used += v.n;
      }
    });
    if (b === 0 && D('separate'))
      drawText(ctx, api, C, '28 tokens / 60 separate slots', 960, 930, 37, C.yellow);
    if (b === 1 && D('utilization'))
      drawText(ctx, api, C, 'Same 28 tokens / 30 slots = 93.3%', 960, 930, 39, C.yellow);
    note(
      ctx,
      api,
      C,
      b === 0
        ? 'Each source length includes the separators counted by this fixture'
        : 'Move each identified record once · dimmed source cells are its original position',
    );
  } else {
    const bins = packRecords([6, 6, 6]);
    bins.forEach((bin, i) => {
      const y = 405 + i * 145;
      for (let k = 0; k < 10; k++) rectangle(ctx, api, C, 330 + k * 120, y, 110, 82, C.panel);
      rectangle(ctx, api, C, 330, y, 710, 82, colors[i]);
      drawText(ctx, api, C, 'R' + (i + 1) + ' / 6', 685, y + 55, 30, C.bg);
    });
    if (D('awkward')) drawText(ctx, api, C, 'Counterexample: 18/30 = 60%', 960, 930, 39, C.yellow);
    note(
      ctx,
      api,
      C,
      'Record source offsets, count separators and decide where an overlong record can split.',
    );
  }
}
export function drawPackingWorkStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainPackingWork);
}
export default {
  id: 'packing-work',
  draw: drawPackingWorkStage,
  cues: [
    'pt-packing-work-lengths',
    'pt-packing-work-separate',
    'pt-packing-work-seven',
    'pt-packing-work-six',
    'pt-packing-work-fives',
    'pt-packing-work-three',
    'pt-packing-work-two',
    'pt-packing-work-utilization',
    'pt-packing-work-awkward',
    'pt-packing-work-metadata',
  ],
};
