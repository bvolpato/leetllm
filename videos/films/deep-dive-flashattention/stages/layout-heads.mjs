import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionBar,
  drawExtensionCell,
  drawExtensionDot,
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionText,
  drawExtensionVector,
} from '../defaults.mjs';
export function drawLayoutHeads(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('layout-heads', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat === 0) {
        const coords = [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
          ],
          q = modelState.transpose;
        drawExtensionText(
          ctx,
          api,
          'FA2 [B, token, head, d]',
          470,
          300,
          32,
          themeColors.blue,
          'center',
        );
        drawExtensionText(
          ctx,
          api,
          'SDPA [B, head, token, d]',
          1420,
          300,
          32,
          themeColors.cyan,
          'center',
        );
        coords.forEach(([tok, h], i) => {
          const from = [230 + h * 250, 400 + tok * 230],
            to = [1170 + tok * 250, 400 + h * 230],
            laneY = 365 + i * 140;
          let x, y;
          if (q < 1 / 3) {
            x = from[0];
            y = from[1] + (laneY - from[1]) * q * 3;
          } else if (q < 2 / 3) {
            x = from[0] + (to[0] - from[0]) * (q * 3 - 1);
            y = laneY;
          } else {
            x = to[0];
            y = laneY + (to[1] - laneY) * (q * 3 - 2);
          }
          drawExtensionCell(
            ctx,
            api,
            't' + tok + ' / h' + h,
            x,
            y,
            210,
            90,
            h ? themeColors.pink : themeColors.blue,
          );
        });
        drawExtensionFooter(
          ctx,
          api,
          'Two tokens × two heads: unchanged shape can conceal changed occurrence values',
        );
      } else if (currentBeat === 1) {
        drawExtensionText(
          ctx,
          api,
          '6 query heads ÷ 2 KV heads = group size 3',
          960,
          295,
          35,
          themeColors.yellow,
          'center',
        );
        modelState.map.forEach((kv, i) => {
          const x = 170 + i * 275;
          drawExtensionCell(
            ctx,
            api,
            'Q' + i,
            x,
            380,
            235,
            82,
            i < 3 ? themeColors.blue : themeColors.pink,
          );
          const tx = kv ? 1310 : 500;
          drawExtensionL(ctx, api, x + 117, 500, tx, 740, themeColors.muted);
          if (modelState.headReady)
            drawExtensionText(
              ctx,
              api,
              'KV' + kv,
              x + 117,
              490,
              25,
              kv ? themeColors.pink : themeColors.blue,
              'center',
            );
          drawExtensionDot(
            ctx,
            api,
            x + 117 + (tx - x - 117) * progress,
            500 + 240 * progress,
            i < 3 ? themeColors.blue : themeColors.pink,
            7,
          );
        });
        drawExtensionCell(ctx, api, 'KV0', 330, 760, 340, 100, themeColors.blue);
        drawExtensionCell(ctx, api, 'KV1', 1140, 760, 340, 100, themeColors.pink);
        drawExtensionFooter(
          ctx,
          api,
          'Integer quotient floor(head /3), not alternating head assignment',
        );
      } else {
        drawExtensionText(
          ctx,
          api,
          'Two different queries · one shared KV head',
          960,
          300,
          35,
          themeColors.yellow,
          'center',
        );
        drawExtensionVector(
          ctx,
          api,
          ['K0 [1,0] / V0 [2,0]', 'K1 [0,1] / V1 [0,2]'],
          250,
          370,
          1420,
          100,
          themeColors.cyan,
        );
        for (let row = 0; row < 2; row++) {
          const y = 620 + row * 170;
          drawExtensionText(
            ctx,
            api,
            'Q' + row + ' = [' + (row ? '0,1' : '1,0') + ']',
            230,
            y,
            30,
            themeColors.blue,
          );
          const w = modelState.outputs[row].map((v) => v / 2);
          drawExtensionBar(ctx, api, 700, y - 40, 630, 65, w[0], themeColors.blue);
          drawExtensionText(
            ctx,
            api,
            modelState.outputReady
              ? 'O = [' + modelState.outputs[row].map((v) => v.toFixed(3)).join(', ') + ']'
              : 'O = ?',
            1610,
            y + 10,
            30,
            modelState.outputReady ? themeColors.green : themeColors.muted,
            'center',
          );
        }
        drawExtensionFooter(
          ctx,
          api,
          'Authored width 2 fixture uses explicit scale 1 gives logits[1,0]/[0,1] · head mapping, not architecture quality',
        );
      }
    }
  });
}
export default {
  id: 'layout-heads',
  draw: drawLayoutHeads,
  cues: [
    'fa-layout-heads-0',
    'fa-layout-transpose',
    'fa-layout-heads-1',
    'fa-head-map',
    'fa-layout-heads-2',
    'fa-head-output',
  ],
};
