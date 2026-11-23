import { drawArrow, drawEquation, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawPayload(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    const barX = 230,
      fullWidth = 1420,
      barHeight = 80,
      compactWidth = fullWidth / 4;
    const shrink = api.focus.progress('compact-weight-payload', stage(1, 0.04, 0.92)),
      scaleIn = state.cues
        ? api.focus.progress('scale-metadata', 0) > 0
          ? 1
          : 0
        : stage(2, 0, 0.12);
    api.focus.target('payload-7-billion-weights', () =>
      drawText(ctx, api, '7 BILLION WEIGHTS', barX, 275, 32, themeColors.muted),
    );
    api.focus.target('payload-bf16-16-bits-per-weight', () =>
      drawText(ctx, api, 'BF16 · 16 bits per weight', barX, 350, 36, themeColors.blue),
    );
    api.focus.target('payload-14-0-gb', () =>
      drawText(ctx, api, '14.0 GB', barX + fullWidth, 350, 44, themeColors.blue, 'right', 'mono'),
    );
    for (let i = 0; i < 14; i += 1) {
      const cellWidth = fullWidth / 14;
      api.focus.target('full-weight-payload', () =>
        drawRectangle(
          ctx,
          api,
          barX + i * cellWidth,
          385,
          cellWidth - 6,
          barHeight,
          themeColors.blue,
          themeColors.bg,
          7,
        ),
      );
    }
    fade(stage(1, 0.82, 0.96), () =>
      api.focus.target('payload-int4-4-bits-per-code', () =>
        drawText(ctx, api, 'INT4 · 4 bits per code', barX, 545, 36, themeColors.cyan),
      ),
    );
    if (shrink > 0) {
      for (let i = 0; i < 14; i += 1) {
        const p = api.phase(shrink, i * 0.012, 0.78 + i * 0.012);
        const cellWidth = api.lerp(fullWidth / 14, compactWidth / 14, p);
        const x = barX + i * cellWidth,
          y = api.lerp(385, 580, p);
        api.focus.target('packed-weight-payload', () =>
          drawRectangle(
            ctx,
            api,
            x,
            y,
            cellWidth - api.lerp(6, 3, p),
            barHeight,
            themeColors.cyan,
            themeColors.bg,
            5,
          ),
        );
        fade(1 - api.phase(p, 0.15, 0.8), () => {
          for (let bit = 1; bit < 4; bit += 1)
            drawLine(
              ctx,
              api,
              x + ((cellWidth - 6) * bit) / 4,
              y + 12,
              x + ((cellWidth - 6) * bit) / 4,
              y + barHeight - 12,
              themeColors.bg,
              2,
            );
        });
      }
    }
    fade(api.phase(shrink, 0.6, 1), () => {
      api.focus.target('payload-3-5-gb', () =>
        drawText(ctx, api, '3.5 GB', barX, 725, 44, themeColors.cyan, 'left', 'mono'),
      );
      api.focus.target('payload-ideal-code-payload', () =>
        drawText(ctx, api, 'ideal code payload', barX + 235, 723, 30, themeColors.muted),
      );
    });
    fade(scaleIn, () => {
      const scaleWidth = (compactWidth * 16) / (128 * 4);
      api.focus.target('scale-metadata', () =>
        drawRectangle(
          ctx,
          api,
          barX + compactWidth,
          580,
          scaleWidth,
          barHeight,
          themeColors.yellow,
          themeColors.bg,
          3,
        ),
      );
      drawArrow(
        ctx,
        api,
        barX + compactWidth + scaleWidth + 8,
        620,
        830,
        620,
        themeColors.yellow,
        3,
      );
      api.focus.target('payload-3-125-scale-metadata', () =>
        drawText(ctx, api, '+3.125% scale metadata', 850, 632, 32, themeColors.yellow),
      );
      api.focus.target('payload-one-fp16-scale-per-128-four-bit-weights', () =>
        drawText(
          ctx,
          api,
          'one FP16 scale per 128 four-bit weights',
          850,
          682,
          30,
          themeColors.muted,
        ),
      );
    });
    api.focus.target('payload-b-mathrm-payload-frac-n-b-8', () =>
      drawEquation(
        ctx,
        api,
        'B_{\\mathrm{payload}}=\\frac{N b}{8}',
        1390,
        747,
        55,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.reveal('runtime-resources', () => {
      api.focus.target('payload-also-budget-for', () =>
        drawText(ctx, api, 'ALSO BUDGET FOR', 960, 835, 30, themeColors.muted, 'center'),
      );
      const labels = ['activations', 'workspace', 'KV cache'],
        colors = [themeColors.pink, themeColors.yellow, themeColors.blue];
      for (let i = 0; i < labels.length; i += 1) {
        const x = 275 + i * 470;
        api.focus.target('runtime-memory', () =>
          drawRectangle(ctx, api, x, 875, 430, 76, themeColors.panel, colors[i]),
        );
        api.focus.target('payload-readout', () =>
          drawText(ctx, api, labels[i], x + 215, 925, 34, colors[i], 'center'),
        );
      }
    });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'payload',
  draw: drawPayload,
  cues: [
    'full-weight-payload',
    'weight-storage',
    'compact-weight-payload',
    'scale-metadata',
    'runtime-resources',
  ],
};
