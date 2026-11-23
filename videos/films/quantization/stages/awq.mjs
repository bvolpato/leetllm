import { awqError } from '../arithmetic.mjs';
import { AWQ_INPUTS } from '../fixtures.mjs';
import { spokenResult } from '../construction.mjs';
import {
  drawArrow,
  drawCircle,
  drawEquation,
  drawLine,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawAwq(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const beatP = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0, end = 1) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(beatP, start, end);
  const fade = api.components.fade;
  ctx.save();
  (() => {
    const actP = api.focus.progress('activation-magnitudes', stage(0, 0.02, 0.46)),
      scaleP = api.focus.progress('rescale-pair', stage(1, 0.2, 0.76));
    const productShown = spokenResult(state, 'fixed-product', 2, 0.02, 0.28);
    const quantize = api.focus.progress('round-rescaled', stage(3, 0.03, 0.24));
    const averages = AWQ_INPUTS.map(
      (row) => row.reduce((sum, value) => sum + Math.abs(value), 0) / row.length,
    );
    const bars = averages.map((mean) => (mean / Math.max(...averages)) * 210),
      barX = 285,
      step = 180,
      width = 90,
      baseY = 665;
    api.focus.target('awq-activation-signal', () =>
      drawText(ctx, api, 'ACTIVATION SIGNAL', 420, 275, 30, themeColors.muted, 'center'),
    );
    api.focus.target('awq-average-magnitude', () =>
      drawText(ctx, api, 'average magnitude', 420, 330, 30, themeColors.muted, 'center'),
    );
    drawLine(ctx, api, 210, baseY, 655, baseY, themeColors.muted, 3);
    for (let i = 0; i < bars.length; i += 1) {
      const x = barX + i * step,
        h = bars[i] * actP;
      api.focus.target('activation-channels', () =>
        drawRectangle(
          ctx,
          api,
          x,
          baseY - h,
          width,
          h,
          i === 0 ? themeColors.yellow : themeColors.cyan,
          themeColors.bg,
          8,
        ),
      );
      api.focus.target('awq-readout', () =>
        drawEquation(
          ctx,
          api,
          `c_{${i + 1}}`,
          x + width / 2,
          baseY + 52,
          32,
          themeColors.muted,
          'center',
        ),
      );
    }
    fade(actP, () => {
      const peakX = barX + width / 2;
      api.focus.target('awq-salient', () =>
        drawText(
          ctx,
          api,
          averages[0] + '  ·  salient',
          peakX,
          baseY - bars[0] - 38,
          32,
          themeColors.yellow,
          'center',
        ),
      );
      drawText(
        ctx,
        api,
        String(averages[1]),
        peakX + step,
        baseY - bars[1] - 32,
        32,
        themeColors.cyan,
        'center',
      );
      drawLine(
        ctx,
        api,
        peakX,
        baseY - bars[0] - 26,
        peakX,
        baseY - bars[0] - 9,
        themeColors.yellow,
        3,
      );
    });
    const productFormula = beat === 0 ? 'Y=WX' : productShown ? 'WX=(WD)(D^{-1}X)' : "W'X'=\\;?";
    api.focus.target('awq-readout-2', () =>
      drawEquation(
        ctx,
        api,
        beat < 3 ? productFormula : "\\hat{W}X\\quad\\longleftrightarrow\\quad\\hat{W}'D^{-1}X",
        1230,
        275,
        beat < 3 ? 52 : 46,
        themeColors.ink,
        'center',
      ),
    );
    const s = api.lerp(1, 8, scaleP),
      w = 0.3 * s,
      x = 10 / s;
    const columns = [
      {
        cx: 965,
        start: 805,
        title: 'before',
        w: 0.3,
        x: 10,
      },
      {
        cx: 1515,
        start: 1355,
        title: 'transformed',
        w,
        x,
        transformed: true,
      },
    ];
    for (const item of columns) {
      api.focus.target('awq-readout-3', () =>
        drawText(
          ctx,
          api,
          beat < 3 ? item.title : item.transformed ? 'rescaled grid' : 'original grid',
          item.cx,
          365,
          32,
          themeColors.muted,
          'center',
        ),
      );
      api.focus.target('awq-readout-4', () =>
        drawEquation(
          ctx,
          api,
          beat < 3 ? (item.transformed ? "W'" : 'W') : item.transformed ? "\\hat{W}'" : '\\hat{W}',
          item.cx,
          430,
          38,
          themeColors.blue,
          'center',
        ),
      );
      const grid = (item.transformed ? Math.max(w, 2) : 2) / 7;
      const rounded = Math.round(item.w / grid) * grid;
      const displayed = api.lerp(item.w, rounded, quantize);
      fade(0.3 * quantize, () =>
        drawRectangle(ctx, api, item.start, 470, item.w * 120, 62, null, themeColors.yellow, 8),
      );
      api.focus.target('rescaled-channel', () =>
        drawRectangle(
          ctx,
          api,
          item.start,
          470,
          displayed * 120,
          62,
          themeColors.blue,
          themeColors.bg,
          8,
        ),
      );
      api.focus.target('awq-readout-5', () =>
        drawText(
          ctx,
          api,
          displayed.toFixed(3),
          item.cx,
          585,
          36,
          themeColors.blue,
          'center',
          'mono',
        ),
      );
      api.focus.target('awq-readout-6', () =>
        drawEquation(
          ctx,
          api,
          item.transformed ? "X'" : 'X',
          item.cx,
          685,
          38,
          themeColors.cyan,
          'center',
        ),
      );
      api.focus.target('rescaled-channel', () =>
        drawRectangle(
          ctx,
          api,
          item.start,
          725,
          item.x * 30,
          62,
          themeColors.cyan,
          themeColors.bg,
          8,
        ),
      );
      api.focus.target('awq-readout-7', () =>
        drawText(ctx, api, item.x.toFixed(3), item.cx, 840, 36, themeColors.cyan, 'center', 'mono'),
      );
    }
    fade(scaleP, () => {
      drawArrow(ctx, api, 1150, 627, 1320, 627, themeColors.yellow, 4);
      api.focus.target('awq-readout-8', () =>
        drawText(
          ctx,
          api,
          `s = ${s.toFixed(2)}`,
          1235,
          602,
          32,
          themeColors.yellow,
          'center',
          'mono',
        ),
      );
    });
    api.focus.target('awq-readout-9', () =>
      drawText(
        ctx,
        api,
        quantize > 0.5
          ? 'CHANNEL CONTRIBUTION AFTER ROUNDING'
          : productShown
            ? 'SAME CHANNEL CONTRIBUTION'
            : 'CHANNEL CONTRIBUTION',
        1230,
        900,
        25,
        themeColors.muted,
        'center',
      ),
    );
    for (const item of columns) {
      const original = 3,
        rounded = item.transformed ? 3 : (2 / 7) * 10;
      const value = api.lerp(original, rounded, quantize),
        map = (output) => item.cx + (output - 3) * 1500;
      drawLine(ctx, api, item.cx - 255, 950, item.cx + 100, 950, themeColors.muted, 2);
      if (item.transformed && !productShown && quantize === 0) {
        drawText(ctx, api, '?', item.cx, 1002, 34, themeColors.cyan, 'center');
        continue;
      }
      drawLine(ctx, api, map(original), 928, map(original), 970, themeColors.yellow, 3);
      drawLine(
        ctx,
        api,
        map(value),
        950,
        map(original),
        950,
        item.transformed ? themeColors.cyan : themeColors.red,
        6,
      );
      drawCircle(
        ctx,
        api,
        map(value),
        950,
        9,
        item.transformed ? themeColors.cyan : themeColors.blue,
        themeColors.bg,
        2,
      );
      api.focus.target('awq-readout-10', () =>
        drawText(
          ctx,
          api,
          value.toFixed(3),
          item.cx,
          1002,
          29,
          item.transformed ? themeColors.cyan : themeColors.blue,
          'center',
          'mono',
        ),
      );
    }
    if (beat === 3)
      api.focus.reveal('calibration-search', () => {
        api.focus.target('awq-calibration-output-error', () =>
          drawText(ctx, api, 'CALIBRATION OUTPUT ERROR', 440, 790, 24, themeColors.muted, 'center'),
        );
        for (const [i, value, label, color] of [
          [0, awqError(1), 'shared grid', themeColors.blue],
          [1, awqError(8), 'selected scale', themeColors.cyan],
        ]) {
          const y = 850 + i * 100,
            p = state.cues ? 1 : stage(3, 0.32 + i * 0.12, 0.64 + i * 0.12);
          api.focus.target('awq-readout-11', () =>
            drawText(ctx, api, label, 250, y - 15, 24, color),
          );
          fade(p, () =>
            api.focus.target('awq-calibration-error', () =>
              drawRectangle(ctx, api, 250, y, (350 * value) / awqError(1), 26, color, undefined, 6),
            ),
          );
          api.focus.target('awq-readout-12', () =>
            drawText(ctx, api, value.toFixed(6), 630, y + 55, 24, color, 'right', 'mono'),
          );
        }
      });
    return;
  })();
  ctx.restore();
}
export default {
  id: 'awq',
  draw: drawAwq,
  cues: [
    'activation-magnitudes',
    'salient-channel',
    'rescale-pair',
    'fixed-product',
    'round-rescaled',
    'calibration-search',
  ],
};
