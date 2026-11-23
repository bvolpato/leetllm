import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  incidentMath,
  incidentMatrix,
  incidentNote,
  incidentRoute,
  incidentText,
  strokeArrow,
  strokeLine,
} from '../defaults.mjs';
export function drawCompressionAttention(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('compression-attention', state),
    { b: currentBeat, p: progress2, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  api.focus.target('compression-attention-operation', () => {
    if (currentBeat === 0) {
      incidentText(
        ctx,
        api,
        'A fixed two-number interface',
        960,
        285,
        35,
        themeColors.green,
        'center',
      );
      [2, 200].forEach((count, row) => {
        const y = 420 + row * 240;
        incidentText(ctx, api, count + ' events', 220, y + 25, 32, colors[row]);
        for (let j = 0; j < Math.min(12, count); j++)
          api.rect(ctx, 470 + j * 45, y, 30, 50, colors[row], undefined, 2);
        if (count > 12) incidentText(ctx, api, '…', 1040, y + 35, 36, themeColors.muted);
        strokeArrow(ctx, api, 1090, y + 25, 1330, y + 25, themeColors.muted);
        incidentMatrix(ctx, api, [['h₁', 'h₂']], 1370, y - 12, themeColors.green, 73);
      });
      if (started('compression-collision', progress2 > 0.5)) {
        for (let i = 0; i < 16; i++) {
          api.rect(ctx, 290 + i * 83, 870, 61, 55, themeColors.panel, themeColors.cyan, 3);
          incidentText(ctx, api, i, 320 + i * 83, 907, 20, themeColors.cyan, 'center');
        }
        const progress = cue('compression-collision', progress2);
        incidentText(ctx, api, '17th history', 960, 785, 28, themeColors.pink, 'center');
        incidentRoute(
          ctx,
          api,
          {
            x: 960,
            y: 810,
          },
          {
            x: 320,
            y: 840,
          },
          progress,
          themeColors.pink,
        );
        if (progress === 1) {
          strokeLine(ctx, api, 287, 866, 354, 866, themeColors.pink, 4);
          strokeLine(ctx, api, 287, 929, 354, 929, themeColors.pink, 4);
          strokeLine(ctx, api, 287, 866, 287, 929, themeColors.pink, 4);
          strokeLine(ctx, api, 354, 866, 354, 929, themeColors.pink, 4);
        }
        incidentText(
          ctx,
          api,
          '2 coordinates × 2 bits → 16 codes; 17 histories force a collision',
          960,
          977,
          31,
          themeColors.yellow,
          'center',
        );
      }
      incidentNote(
        ctx,
        api,
        'Explicit quantized capacity toy. Real floating-point state has much larger finite storage.',
      );
    } else if (currentBeat === 1) {
      incidentText(
        ctx,
        api,
        'Standard nonlinear recurrent state',
        960,
        300,
        36,
        themeColors.cyan,
        'center',
      );
      const count = Math.min(12, Math.floor(13 * cue('serial-relay', progress2)));
      for (let j = 0; j < 12; j++) {
        const x = 200 + j * 135;
        api.rect(
          ctx,
          x,
          510,
          88,
          82,
          j < count ? themeColors.cyan : themeColors.panel,
          undefined,
          4,
        );
        incidentText(
          ctx,
          api,
          j < 11 ? j + 1 : '4096',
          x + 44,
          559,
          24,
          j < count ? themeColors.bg : themeColors.muted,
          'center',
        );
        if (j < 11) strokeArrow(ctx, api, x + 94, 551, x + 127, 551, themeColors.muted, 2);
      }
      incidentText(ctx, api, 'hₜ needs hₜ₋₁', 960, 725, 48, themeColors.yellow, 'center');
      incidentText(
        ctx,
        api,
        'Input projections and batch items can run in parallel.',
        960,
        840,
        31,
        themeColors.ink,
        'center',
      );
      incidentNote(ctx, api, '4096 dependent transitions do not imply 4096 GPU launches.');
    } else if (currentBeat === 2) {
      const visible = started('attention-pairs', progress2 > 0.6)
        ? 8
        : Math.min(8, Math.floor(9 * cue('attention-mask', progress2)));
      incidentText(ctx, api, 'Causal Q rows × K columns', 550, 275, 32, themeColors.cyan, 'center');
      let pair = 0;
      for (let row = 0; row < 8; row++)
        for (let column = 0; column < 8; column++) {
          const allowed = column <= row;
          api.rect(
            ctx,
            300 + column * 60,
            335 + row * 60,
            49,
            49,
            allowed && row < visible ? themeColors.cyan : themeColors.panel,
            undefined,
            2,
          );
          if (allowed && row < visible) pair++;
          if (!allowed) {
            strokeLine(
              ctx,
              api,
              307 + column * 60,
              342 + row * 60,
              342 + column * 60,
              377 + row * 60,
              themeColors.border,
              1,
            );
          }
        }
      incidentMath(
        ctx,
        api,
        String.raw`\operatorname{softmax}(QK^\top/\sqrt{d_k}+\text{mask})V`,
        1330,
        365,
        32,
        themeColors.ink,
      );
      const x1 = 1050,
        x2 = 1660,
        y = 650;
      api.circle(ctx, x1, y, 34, themeColors.blue, themeColors.blue, 1);
      api.circle(ctx, x2, y, 34, themeColors.green, themeColors.green, 1);
      incidentText(ctx, api, 'position 1', x1, y + 90, 27, themeColors.blue, 'center');
      incidentText(ctx, api, 'position 4096', x2, y + 90, 27, themeColors.green, 'center');
      if (started('attention-direct', progress2 > 0.3)) {
        strokeArrow(ctx, api, x2 - 50, y, x1 + 50, y, themeColors.yellow, 4);
        incidentText(
          ctx,
          api,
          'one layer reads directly',
          1350,
          y - 80,
          30,
          themeColors.yellow,
          'center',
        );
      }
      if (started('attention-pairs', progress2 > 0.6))
        incidentText(
          ctx,
          api,
          '1 + 2 + … + 8 = ' + pair + ' allowed pairs',
          960,
          932,
          37,
          themeColors.cyan,
          'center',
        );
      incidentNote(
        ctx,
        api,
        'Future keys are excluded. Allowed pairs are a work count, not measured FLOPs.',
      );
    } else {
      const x0 = 300,
        y0 = 825,
        w = 1300,
        h = 420;
      strokeArrow(ctx, api, x0, y0, x0 + w + 70, y0, themeColors.muted, 2);
      strokeArrow(ctx, api, x0, y0 + 20, x0, y0 - h - 40, themeColors.muted, 2);
      incidentText(ctx, api, 'supplied length T', 960, 900, 29, themeColors.muted, 'center');
      incidentText(ctx, api, 'normalized work', 200, 360, 28, themeColors.muted);
      const progress = cue('complexity-curves', progress2),
        points = 30;
      const recurrence = [],
        attention = [];
      for (let i = 0; i <= Math.floor(points * progress); i++) {
        const u = i / points;
        recurrence.push({
          x: x0 + w * u,
          y: y0 - h * 0.55 * u,
        });
        attention.push({
          x: x0 + w * u,
          y: y0 - h * u * u,
        });
      }
      if (recurrence.length > 1) {
        api.path(ctx, recurrence, {
          color: themeColors.blue,
          width: 4,
        });
        api.path(ctx, attention, {
          color: themeColors.pink,
          width: 4,
        });
      }
      incidentText(ctx, api, 'RNN: O(T d²)', 650, 360, 31, themeColors.blue);
      incidentText(ctx, api, 'Full attention: O(T²d + Td²)', 1100, 360, 31, themeColors.pink);
      if (started('scan-recurrence', progress2 > 0.65)) {
        incidentText(
          ctx,
          api,
          'Mamba: prepared coefficients → associative scan',
          960,
          965,
          31,
          themeColors.green,
          'center',
        );
        for (let j = 0; j < 4; j++) {
          const x = 540 + j * 270;
          strokeLine(ctx, api, x, 680, x + 135, 570, themeColors.green, 2);
          strokeLine(ctx, api, x + 270, 680, x + 135, 570, themeColors.green, 2);
        }
      }
      incidentNote(
        ctx,
        api,
        'Fixed d schematic. FlashAttention avoids the full HBM score matrix; it retains quadratic pair arithmetic.',
      );
    }
  });
}
export default {
  id: 'compression-attention',
  draw: drawCompressionAttention,
  cues: [
    'compression-attention-0',
    'compression-collision',
    'compression-attention-1',
    'serial-relay',
    'compression-attention-2',
    'attention-mask',
    'attention-direct',
    'attention-pairs',
    'compression-attention-3',
    'complexity-curves',
    'scan-recurrence',
  ],
};
