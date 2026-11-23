import { point } from '../geometry.mjs';
import { text, rect, arrow, node, route } from '../defaults.mjs';
export function drawFrozenBackward(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    api.focus.target('frozen-backward-mechanism', () => {
      if (beat === 0) {
        const backward = api.focus.progress('frozen-input-gradient', stage(0, 0.35, 0.7));
        text(
          ctx,
          api,
          'SUPPLIED SCALAR CHAIN · an earlier adapter still needs ∂L/∂x',
          190,
          285,
          30,
          themeColors.muted,
        );
        const x = node(ctx, api, 190, 425, 300, 160, 'x=2', 'trainable path', themeColors.yellow);
        const w = node(ctx, api, 790, 425, 320, 160, 'W_0=3', 'frozen parameter', themeColors.blue);
        const h = node(ctx, api, 1430, 425, 300, 160, 'h=6', 'incoming g = 1', themeColors.green);
        route(ctx, api, x, w, themeColors.blue, stage(0, 0.05, 0.25));
        route(ctx, api, w, h, themeColors.blue, stage(0, 0.05, 0.25));
        if (backward > 0) {
          api.trace(ctx, [point(1580, 690), point(340, 690)], backward, themeColors.pink, 5);
          text(ctx, api, '∂L/∂x = W₀ᵀg = 3', 190, 795, 39, themeColors.pink, 'left', 'mono');
          text(
            ctx,
            api,
            'No stored ∂L/∂W₀ · no optimizer state for W₀',
            190,
            925,
            32,
            themeColors.muted,
          );
        }
      } else if (beat === 1) {
        text(
          ctx,
          api,
          'CONTEXT 2048 · allocations have different scaling',
          190,
          285,
          31,
          themeColors.muted,
        );
        const grow = api.focus.progress('frozen-quadratic', stage(1, 0.35, 0.7));
        const n = Math.round(2048 + 2048 * grow);
        text(ctx, api, `T = ${n}`, 190, 380, 39, themeColors.cyan, 'left', 'mono');
        rect(ctx, api, 190, 450, (280 * n) / 2048, 70, themeColors.blue);
        text(ctx, api, 'token activations ∝ T', 190, 590, 32, themeColors.blue);
        const size = (250 * n) / 2048;
        rect(ctx, api, 1080, 380, size, size, '#ffd75e20', themeColors.yellow, 2);
        text(ctx, api, 'materialized scores: T × T', 1010, 930, 32, themeColors.yellow);
        if (grow >= 0.999)
          text(ctx, api, '2× context → 4× score entries', 190, 810, 33, themeColors.yellow);
        text(
          ctx,
          api,
          'Scaled geometry; memory also depends on batch, depth, dtype and implementation.',
          190,
          1000,
          26,
          themeColors.muted,
        );
      } else {
        const replay = api.focus.progress('frozen-recompute', stage(2, 0.2, 0.6));
        text(
          ctx,
          api,
          'ACTIVATION CHECKPOINTING · same operators, fewer retained intermediates',
          190,
          285,
          28,
          themeColors.muted,
        );
        for (let i = 0; i < 5; i++) {
          const x = 190 + i * 310;
          rect(ctx, api, x, 430, 190, 120, themeColors.panel, themeColors.blue);
          text(ctx, api, `layer ${i + 1}`, x + 95, 505, 31, themeColors.blue, 'center');
          if (i < 4) arrow(ctx, api, point(x + 205, 490), point(x + 295, 490), themeColors.blue, 3);
          if (i === 0 || i === 4) {
            rect(ctx, api, x + 50, 670, 90, 70, '#63deec30', themeColors.cyan, 4);
            text(ctx, api, 'saved', x + 95, 795, 26, themeColors.cyan, 'center');
          } else if (replay > i / 5) {
            rect(ctx, api, x + 50, 670, 90, 70, '#ffd75e30', themeColors.yellow, 4);
            text(ctx, api, 'recomputed', x + 95, 795, 26, themeColors.yellow, 'center');
          }
        }
        api.trace(ctx, [point(1720, 870), point(200, 870)], replay, themeColors.pink, 5);
        text(
          ctx,
          api,
          'Backward spends computation to reconstruct what was not retained.',
          190,
          975,
          32,
          themeColors.muted,
        );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'frozen-backward',
  draw: drawFrozenBackward,
  cues: [
    'frozen-backward-1',
    'frozen-input-gradient',
    'frozen-backward-2',
    'frozen-quadratic',
    'frozen-backward-3',
    'frozen-recompute',
  ],
};
