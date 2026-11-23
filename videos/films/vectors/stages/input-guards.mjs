import { extendedFrame, localEditFrame } from '../model.mjs';
import {
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawInputGuards(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('input-guards', state);
  drawExtendedTarget(ctx, api, 'input-guards' + '-mechanism', () => {
    const steps = [
      ['rectangular numeric data', 'inspect every token row'],
      ['hidden rank 3 · map rank 2', 'check both complete arrays'],
      ['input feature widths agree', 'one coefficient per supplied feature'],
      ['all axes nonempty', 'reject an empty token sequence'],
    ];
    steps.forEach(([label, detail], i) => {
      const y = 330 + i * 145,
        established = [f.convert, f.ranks, f.checked, f.nonempty][i] === 1;
      drawExtendedTarget(ctx, api, 'guard-step-' + i, () => {
        api.circle(ctx, 220, y + 18, 16, established ? themeColors.cyan : themeColors.muted);
        drawExtendedText(
          ctx,
          api,
          label,
          265,
          y + 30,
          34,
          established ? themeColors.ink : themeColors.muted,
        );
        drawExtendedText(ctx, api, detail, 265, y + 82, 26, themeColors.muted);
      });
      if (i < 3) api.arrow(ctx, 220, y + 52, 220, y + 120, themeColors.muted, 3);
    });
    drawExtendedTarget(ctx, api, 'guard-example', () => {
      if (beat === 0 && f.ranks < 1) {
        drawExtendedText(
          ctx,
          api,
          'one prompt · ragged token rows',
          1390,
          325,
          32,
          themeColors.yellow,
          'center',
        );
        drawMatrixBlock(
          ctx,
          api,
          [
            [1, 0],
            [0.5, '∅'],
          ],
          1185,
          400,
          {
            cell: 155,
            color: themeColors.pink,
            select: (r, c) => r === 1 && c === 1,
          },
        );
        drawExtendedText(
          ctx,
          api,
          f.convert === 1 ? 'conversion rejects the incomplete row' : 'inspect the second token',
          1390,
          850,
          30,
          f.convert === 1 ? themeColors.pink : themeColors.muted,
          'center',
        );
      } else if (beat === 0) {
        drawExtendedText(
          ctx,
          api,
          'projection supplied as a vector',
          1390,
          325,
          32,
          themeColors.yellow,
          'center',
        );
        drawMatrixBlock(ctx, api, [[0, 0]], 1220, 430, {
          cell: 150,
          color: themeColors.pink,
        });
        drawExtendedText(
          ctx,
          api,
          'shape (2,) · expected two axes',
          1390,
          715,
          34,
          themeColors.pink,
          'center',
        );
        drawExtendedText(
          ctx,
          api,
          'stop at the projection-rank check',
          1390,
          850,
          29,
          themeColors.pink,
          'center',
        );
      } else if (beat === 1 && !f.run) {
        const empty = f.nonempty > 0;
        drawExtendedText(
          ctx,
          api,
          empty ? 'new fixture · no token positions' : 'new fixture · feature mismatch',
          1390,
          325,
          32,
          themeColors.yellow,
          'center',
        );
        drawExtendedEquation(
          ctx,
          api,
          empty ? 'H:[2,0,2]' : 'H:[2,3,2]',
          1390,
          470,
          49,
          themeColors.blue,
        );
        drawExtendedEquation(
          ctx,
          api,
          empty ? 'P:[2,3]' : 'P:[3,3]',
          1390,
          620,
          49,
          themeColors.yellow,
        );
        drawExtendedText(
          ctx,
          api,
          empty ? 'token axis is empty' : 'hidden width 2 ≠ map input 3',
          1390,
          775,
          34,
          themeColors.pink,
          'center',
        );
        drawExtendedText(
          ctx,
          api,
          empty ? 'reject before multiplication' : 'stop at feature agreement',
          1390,
          875,
          29,
          themeColors.pink,
          'center',
        );
      } else if (beat === 1) {
        drawExtendedText(
          ctx,
          api,
          'valid fixture · every guard passes',
          1390,
          325,
          32,
          themeColors.green,
          'center',
        );
        drawExtendedEquation(ctx, api, '[2,3,2]@[2,3]', 1390, 490, 48, themeColors.ink);
        drawExtendedEquation(ctx, api, '[2,3,3]', 1390, 690, 58, themeColors.green);
        drawExtendedText(
          ctx,
          api,
          'six token owners · three outputs each',
          1390,
          850,
          29,
          themeColors.muted,
          'center',
        );
      } else {
        const edit = localEditFrame({
          beat: 1,
          cues: {
            'change-password': {
              phase: 'during',
              progress: f.locality,
            },
          },
        });
        drawExtendedText(
          ctx,
          api,
          'change only password in message A',
          1390,
          325,
          31,
          themeColors.yellow,
          'center',
        );
        drawMatrixBlock(ctx, api, [edit.selected], 1165, 465, {
          cell: 140,
          color: themeColors.green,
          label: 'selected output',
        });
        drawExtendedText(
          ctx,
          api,
          'five other token rows stay fixed',
          1390,
          825,
          32,
          themeColors.muted,
          'center',
        );
        drawExtendedText(
          ctx,
          api,
          'ownership needs a known-value check',
          1390,
          925,
          28,
          themeColors.muted,
          'center',
        );
      }
    });
    drawFooter(
      ctx,
      api,
      'Structural guards need semantic fixtures · a local intervention tests ownership',
    );
  });
}
export default {
  id: 'input-guards',
  draw: drawInputGuards,
  cues: [
    'guard-convert',
    'guard-rank',
    'guard-feature',
    'guard-nonempty',
    'guard-product',
    'guard-locality',
  ],
};
