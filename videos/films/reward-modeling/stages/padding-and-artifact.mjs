import { finalUnmasked } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionArrow,
  drawRewardExpansionBox,
  drawRewardExpansionFoot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawPaddingAndArtifact(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('padding-and-artifact-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(ctx, api, 'Read the mask before selecting a hidden state');
      const selected = q('padding-select', 0.1, 0.3);
      [
        [
          [1, 1, 0],
          [
            [1, 1],
            [2, 3],
            [99, 99],
          ],
          'Right padding',
        ],
        [
          [0, 1, 1],
          [
            [99, 99],
            [1, 1],
            [2, 3],
          ],
          'Left padding',
        ],
      ].forEach(([mask, hs, name], r) => {
        const y = 380 + r * 245;
        drawRewardExpansionText(ctx, api, name, 260, y + 50, 31, themeColors.blue);
        mask.forEach((v, i) => {
          const x = 530 + i * 325,
            active = selected > 0 && i === finalUnmasked(mask);
          drawRewardExpansionBox(
            ctx,
            api,
            'mask ' + v,
            x,
            y,
            275,
            70,
            active ? themeColors.yellow : v ? themeColors.blue : themeColors.muted,
            29,
          );
          drawRewardExpansionBox(
            ctx,
            api,
            'h [' + hs[i].join(', ') + ']',
            x,
            y + 90,
            275,
            85,
            active ? themeColors.yellow : v ? themeColors.cyan : themeColors.muted,
            31,
          );
        });
      });
      drawRewardExpansionText(
        ctx,
        api,
        on('padding-score')
          ? 'Selected [2, 3] · head [0.5, 1] · score 1 + 3 = 4'
          : 'The [99, 99] padding state is never the readout',
        960,
        945,
        34,
        on('padding-score') ? themeColors.yellow : themeColors.muted,
      );
    } else if (currentBeat === 1) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Use the greatest unmasked position, and reject an empty sequence',
      );
      const rows = [
        {
          m: [1, 1, 0],
          result: 'index 1',
        },
        {
          m: [0, 1, 1],
          result: 'index 2',
        },
        {
          m: [0, 0, 0],
          result: 'REJECT empty',
        },
      ];
      rows.forEach((r, k) => {
        const y = 370 + k * 180;
        drawRewardExpansionText(
          ctx,
          api,
          k === 0 ? 'right' : k === 1 ? 'left' : 'empty',
          270,
          y + 65,
          31,
          themeColors.blue,
        );
        r.m.forEach((v, i) =>
          drawRewardExpansionBox(
            ctx,
            api,
            v,
            510 + i * 230,
            y,
            180,
            95,
            v ? themeColors.cyan : themeColors.muted,
            43,
          ),
        );
        drawRewardExpansionArrow(ctx, api, 1225, y + 47, 1350, y + 47, themeColors.yellow);
        drawRewardExpansionBox(
          ctx,
          api,
          r.result,
          1400,
          y,
          350,
          95,
          k === 2 ? themeColors.pink : themeColors.green,
          32,
        );
      });
      drawRewardExpansionText(
        ctx,
        api,
        'Right contiguous: sum(mask) − 1 · left nonempty: final slot',
        960,
        975,
        31,
        themeColors.yellow,
      );
    } else {
      drawRewardExpansionTitle(ctx, api, 'One scalar head shares one bias across the pair');
      drawRewardExpansionBox(ctx, api, 'A · wᵀh + b', 200, 390, 630, 110, themeColors.green, 40);
      drawRewardExpansionBox(ctx, api, 'B · wᵀh + b', 1090, 390, 630, 110, themeColors.pink, 40);
      drawRewardExpansionL(ctx, api, 515, 535, 515, 630, themeColors.green);
      drawRewardExpansionL(ctx, api, 1405, 535, 1405, 630, themeColors.pink);
      drawRewardExpansionArrow(ctx, api, 515, 630, 815, 630, themeColors.green);
      drawRewardExpansionArrow(ctx, api, 1405, 630, 1105, 630, themeColors.pink);
      drawRewardExpansionBox(
        ctx,
        api,
        'chosen − rejected',
        840,
        575,
        240,
        110,
        themeColors.yellow,
        27,
      );
      drawRewardExpansionText(
        ctx,
        api,
        on('padding-bias')
          ? 'The same + b cancels · pair-loss gradient for b = 0'
          : 'Follow the shared bias into the score difference',
        960,
        800,
        36,
        themeColors.yellow,
      );
      ['base revision', 'adapters', 'actual head', 'tokenizer / template'].forEach((v, i) =>
        drawRewardExpansionBox(
          ctx,
          api,
          v,
          160 + i * 435,
          890,
          400,
          75,
          i === 2 ? themeColors.yellow : themeColors.blue,
          28,
        ),
      );
    }
    drawRewardExpansionFoot(
      ctx,
      api,
      'Mask and projection arithmetic is executed by the CPU fixture; trainable components must survive reload.',
    );
  });
}
export default {
  id: 'padding-and-artifact',
  draw: drawPaddingAndArtifact,
  cues: [
    'padding-and-artifact-step-1',
    'padding-select',
    'padding-score',
    'padding-and-artifact-step-2',
    'padding-and-artifact-step-3',
    'padding-bias',
  ],
};
