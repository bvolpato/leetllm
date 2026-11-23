import {
  drawCircle,
  drawEquation,
  drawLine,
  drawRectangle,
  drawText,
  withLabelBounds,
} from '../defaults.mjs';
export function drawGranularity(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    const x0 = 220,
      y0 = 350,
      cw = 100,
      rowGap = 100,
      ch = 68;
    const weights = [
      [0.2, -0.3, 0.1, 0.4, -0.2, 0.3, 12.8, 0.1],
      [-0.4, 0.2, 0.1, -0.3, 0.4, 0.1, -0.2, 0.3],
      [0.1, 0.3, -0.2, 0.2, -0.1, 0.4, 0.2, -0.3],
    ];
    const rowP = api.focus.progress('row-scales', stage(1, 0.05, 0.78)),
      groupP = api.focus.progress('group-scales', stage(2, 0.05, 0.8));
    api.focus.target('granularity-one-weight-matrix', () =>
      drawText(ctx, api, 'ONE WEIGHT MATRIX', x0, 275, 32, themeColors.muted),
    );
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const outlier = r === 0 && c === 6,
          x = x0 + c * cw,
          y = y0 + r * rowGap;
        api.focus.target(outlier ? 'outlier-weight' : 'ordinary-weights', () =>
          drawRectangle(
            ctx,
            api,
            x,
            y,
            cw - 8,
            ch,
            outlier ? themeColors.yellow : themeColors.panel,
            outlier ? themeColors.yellow : themeColors.blue,
            8,
          ),
        );
        withLabelBounds(
          ctx,
          api,
          {
            x,
            y,
            width: cw - 8,
            height: ch,
          },
          () =>
            api.focus.target('granularity-readout', () =>
              drawText(
                ctx,
                api,
                weights[r][c].toFixed(1),
                x + (cw - 8) / 2,
                y + 44,
                30,
                outlier ? themeColors.bg : themeColors.ink,
                'center',
                'mono',
              ),
            ),
        );
      }
    }
    fade(1 - rowP, () => {
      drawRectangle(
        ctx,
        api,
        x0 - 12,
        y0 - 12,
        cw * 8 + 16,
        rowGap * 2 + ch + 24,
        null,
        themeColors.yellow,
        14,
      );
      drawLine(ctx, api, x0 + 6.5 * cw, y0 - 12, x0 + 6.5 * cw, 310, themeColors.yellow, 3);
      api.focus.target('granularity-outlier', () =>
        drawText(ctx, api, 'outlier', x0 + 6.5 * cw, 300, 30, themeColors.yellow, 'center'),
      );
    });
    fade(rowP * (1 - groupP), () => {
      for (let r = 0; r < 3; r += 1) {
        api.focus.target('row-scale-groups', () =>
          drawRectangle(
            ctx,
            api,
            x0 - 10,
            y0 + r * rowGap - 10,
            cw * 8 + 12,
            ch + 20,
            null,
            themeColors.blue,
            12,
          ),
        );
        api.focus.target('granularity-readout-2', () =>
          drawEquation(
            ctx,
            api,
            `S_{${r + 1}}`,
            x0 - 30,
            y0 + r * rowGap + 45,
            34,
            themeColors.blue,
            'right',
          ),
        );
      }
    });
    fade(groupP, () => {
      for (let r = 0; r < 3; r += 1)
        for (let g = 0; g < 2; g += 1)
          api.focus.target('local-scale-groups', () =>
            drawRectangle(
              ctx,
              api,
              x0 + g * 4 * cw - 3,
              y0 + r * rowGap - 8,
              4 * cw - 2,
              ch + 16,
              null,
              r === 0 && g === 1 ? themeColors.yellow : themeColors.cyan,
              10,
            ),
          );
    });
    const captions = [
      {
        y: 335,
        title: 'TENSOR',
        detail: '1 shared scale',
        color: themeColors.yellow,
        alpha: 1,
      },
      {
        y: 490,
        title: 'CHANNEL',
        detail: 'a scale for each row',
        color: themeColors.blue,
        alpha: rowP,
      },
      {
        y: 645,
        title: 'GROUP',
        detail: 'local scales within a row',
        color: themeColors.cyan,
        alpha: groupP,
      },
    ];
    for (const item of captions)
      fade(item.alpha, () => {
        drawRectangle(ctx, api, 1150, item.y - 42, 560, 112, themeColors.panel, item.color, 14);
        withLabelBounds(
          ctx,
          api,
          {
            x: 1150,
            y: item.y - 42,
            width: 560,
            height: 112,
          },
          () => {
            api.focus.target('granularity-readout-3', () =>
              drawText(ctx, api, item.title, 1190, item.y, 30, item.color),
            );
            api.focus.target('granularity-readout-4', () =>
              drawText(ctx, api, item.detail, 1190, item.y + 48, 32, themeColors.ink),
            );
          },
        );
      });
    const detailX = (value) => 625 + value * 700;
    api.focus.target('granularity-small-weights-after-reconstruction', () =>
      drawText(
        ctx,
        api,
        'SMALL WEIGHTS AFTER RECONSTRUCTION',
        625,
        700,
        27,
        themeColors.muted,
        'center',
      ),
    );
    drawLine(ctx, api, 250, 800, 1000, 800, themeColors.muted, 2);
    for (const value of [-0.4, -0.2, 0, 0.2, 0.4]) {
      const x = detailX(value);
      drawLine(ctx, api, x, 790, x, 810, themeColors.muted, 2);
      api.focus.target('granularity-readout-5', () =>
        drawText(ctx, api, value.toFixed(1), x, 850, 25, themeColors.muted, 'center', 'mono'),
      );
    }
    for (const [i, value] of [-0.3, -0.1, 0.1, 0.2, 0.4].entries()) {
      const shared = api.lerp(value, 0, api.focus.progress('collapse-small', stage(0, 0.18, 0.82))),
        local = Math.round(value / (0.4 / 7)) * (0.4 / 7);
      const reconstructed = api.lerp(shared, local, rowP);
      const y = 755 - (i % 2) * 14,
        x = detailX(reconstructed);
      fade(0.35, () => drawCircle(ctx, api, detailX(value), y, 6, themeColors.ink));
      drawLine(
        ctx,
        api,
        detailX(value),
        y,
        x,
        y,
        rowP > 0.5 ? themeColors.cyan : themeColors.yellow,
        2,
      );
      api.focus.target('small-weight-separation', () =>
        drawCircle(
          ctx,
          api,
          x,
          y,
          8,
          rowP > 0.5 ? themeColors.cyan : themeColors.yellow,
          themeColors.bg,
          2,
        ),
      );
    }
    api.focus.target('granularity-readout-6', () =>
      drawText(
        ctx,
        api,
        rowP < 0.5
          ? 'one outlier collapses these distinctions'
          : 'a local range recovers their separation',
        1430,
        797,
        27,
        rowP < 0.5 ? themeColors.yellow : themeColors.cyan,
        'center',
      ),
    );
    fade(groupP, () => {
      api.focus.target('granularity-frac-16-128-0-125-mathrm-bits-weight', () =>
        drawEquation(
          ctx,
          api,
          '\\frac{16}{128}=0.125\\,\\mathrm{bits/weight}',
          960,
          935,
          42,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('granularity-fp16-scale-overhead-for-a-group-of-128-weights', () =>
        drawText(
          ctx,
          api,
          'FP16 scale overhead for a group of 128 weights',
          960,
          995,
          29,
          themeColors.muted,
          'center',
        ),
      );
    });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'granularity',
  draw: drawGranularity,
  cues: [
    'outlier-range',
    'collapse-small',
    'row-scales',
    'local-grid',
    'group-scales',
    'scale-overhead',
  ],
};
