import {
  bar,
  drawText,
  equation,
  line,
  note,
  rectangle,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingMainInventoryPlan(
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
  if (b === 0) {
    drawText(ctx, api, C, 'Dense planning worksheet', 960, 285, 33, C.blue);
    rectangle(ctx, api, C, 300, 385, 390, 270, C.panel, C.blue);
    drawText(ctx, api, C, '70B parameters', 495, 495, 42, C.blue);
    const n = Math.floor(P('appetite') * 20);
    for (let i = 0; i < n; i++)
      rectangle(ctx, api, C, 820 + (i % 10) * 78, 385 + Math.floor(i / 10) * 115, 58, 80, C.cyan);
    drawText(ctx, api, C, '20 presentations / parameter', 1210, 695, 31, C.cyan);
    if (D('appetite')) equation(ctx, api, C, '70B\\times20=1.4T', 960, 835, 53, C.yellow);
    note(
      ctx,
      api,
      C,
      'Presentations include repeats · batch size also determines optimizer updates',
    );
  } else if (b === 1) {
    drawText(ctx, api, C, 'Dominant dense matrix arithmetic', 960, 310, 36, C.blue);
    for (let i = 0; i < 6; i++) {
      const shown = P('flops') > i / 6;
      rectangle(
        ctx,
        api,
        C,
        250 + i * 240,
        440,
        200,
        200,
        shown ? C.panel : C.bg,
        shown ? C.cyan : C.border,
      );
      drawText(ctx, api, C, 'N × D', 350 + i * 240, 550, 33, shown ? C.cyan : C.muted);
    }
    if (D('flops'))
      equation(ctx, api, C, '6ND=5.88\\times10^{23}\\ \\mathrm{FLOPs}', 960, 820, 52, C.yellow);
    note(
      ctx,
      api,
      C,
      'Authored planning estimate · attention, recomputation and utilization remain outside 6ND',
    );
  } else {
    const f = P('filter'),
      d = P('dedup'),
      remaining = 2 * (1 - 0.3 * f) * (1 - 0.2 * d),
      x = 260,
      w = 1400;
    bar(ctx, api, C, x, 400, w, 2, 2, C.blue, 'Extracted: 2T tokens');
    bar(ctx, api, C, x, 540, w, remaining, 2, C.cyan, 'Survivors of the previous stage');
    line(ctx, api, C, x + (w * 1.4) / 2, 620, x + (w * 1.4) / 2, 875, C.yellow, 4);
    drawText(ctx, api, C, 'Target: 1.4T', x + (w * 1.4) / 2, 930, 32, C.yellow);
    if (D('dedup'))
      drawText(ctx, api, C, '1.12T unique tokens', x + (w * 1.12) / 2, 690, 36, C.cyan);
    if (D('gap')) {
      rectangle(ctx, api, C, x + (w * 1.12) / 2, 735, (w * 0.28) / 2, 55, C.yellow);
      drawText(ctx, api, C, '280B gap', x + (w * 1.26) / 2, 855, 34, C.yellow);
    }
    note(
      ctx,
      api,
      C,
      D('gap')
        ? 'Additional eligible text or scheduled repeats can supply the missing presentations.'
        : D('dedup')
          ? 'With one pass through the survivors, how many presentations are missing?'
          : 'Each gate operates on the tokens that reach it.',
    );
  }
}
export function drawInventoryPlanStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainInventoryPlan);
}
export default {
  id: 'inventory-plan',
  draw: drawInventoryPlanStage,
  cues: [
    'pt-inventory-plan-appetite',
    'pt-inventory-plan-flops',
    'pt-inventory-plan-filter',
    'pt-inventory-plan-dedup',
    'pt-inventory-plan-gap',
  ],
};
