import { visionFrame } from '../model.mjs';
import {
  visionArrow,
  visionCard,
  visionLine,
  visionMatrix,
  visionNote,
  visionText,
} from '../defaults.mjs';
export function drawRepresentationChoice(ctx, scene, state, api) {
  const frameState = visionFrame('representation-choice', state);
  return api.focus.target('dv-representation-choice-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      if (currentBeat === 1) {
        visionText(
          ctx,
          api,
          'Two ways to mix image information',
          960,
          290,
          38,
          themeColors.ink,
          'center',
        );
        visionMatrix(
          ctx,
          api,
          Array.from(
            {
              length: 7,
            },
            (_, r) =>
              Array.from(
                {
                  length: 7,
                },
                (_, c) => (r === 3 && c === 3 ? '×' : '·'),
              ),
          ),
          180,
          380,
          48,
        );
        visionText(ctx, api, 'Depthwise 7 × 7', 348, 785, 30, themeColors.blue, 'center');
        const channels = visionCard(
          ctx,
          api,
          'Channel mixing',
          650,
          465,
          320,
          110,
          themeColors.blue,
        );
        api.arrow(ctx, 550, 520, 620, 520, themeColors.blue, 4);
        if (resultComplete('convnext-spatial', 1))
          visionText(
            ctx,
            api,
            'LayerNorm · GELU · inverted bottleneck',
            560,
            900,
            27,
            themeColors.blue,
            'center',
          );
        const tokens = Array.from(
          {
            length: 4,
          },
          (_, i) =>
            visionCard(ctx, api, 'p' + (i + 1), 1150 + i * 150, 380, 120, 80, themeColors.cyan),
        );
        tokens.forEach((a, i) =>
          tokens.forEach((z, j) => {
            if (i < j)
              visionLine(ctx, api, a.x + 60, a.y + 100, z.x + 60, z.y + 220, themeColors.muted, 2);
          }),
        );
        visionCard(
          ctx,
          api,
          'Flatten → learned projection + position',
          1100,
          690,
          650,
          100,
          themeColors.cyan,
        );
        if (resultComplete('vit-patches', 1))
          visionText(ctx, api, 'Global token attention', 1430, 900, 31, themeColors.cyan, 'center');
        visionNote(
          ctx,
          api,
          'Spatial convolution and patch projection preserve different learned representations; neither ranks this absent dataset.',
        );
      } else {
        const a = visionCard(ctx, api, 'Photograph', 160, 440, 360, 110, themeColors.blue),
          z = visionCard(ctx, api, 'Pretrained encoder', 720, 440, 470, 110, themeColors.blue),
          head = visionCard(ctx, api, 'New damage head', 1400, 440, 370, 110, themeColors.yellow);
        visionArrow(ctx, api, a, z);
        visionArrow(ctx, api, z, head);
        for (let i = 0; i < 6; i++) {
          const x = 780 + i * 60;
          api.rect(ctx, x, 670, 32, 80 + 25 * (i % 3), themeColors.blue, undefined, 2);
        }
        if (currentBeat === 0) {
          const ready = resultComplete('frozen-head', 0);
          visionText(
            ctx,
            api,
            ready
              ? 'Encoder frozen · train head first'
              : 'ImageNet weights provide a representation',
            960,
            835,
            35,
            ready ? themeColors.cyan : themeColors.ink,
            'center',
          );
          if (ready)
            visionText(
              ctx,
              api,
              'Fine-tuning is a separate experiment with its own data and budget',
              960,
              912,
              28,
              themeColors.muted,
              'center',
            );
        } else {
          ['Same case holdout', 'Same review budget', 'Recorded training + latency'].forEach(
            (v, i) => visionCard(ctx, api, v, 150 + i * 550, 835, 500, 80, themeColors.muted),
          );
        }
        visionNote(
          ctx,
          api,
          'The ImageNet head is replaced for the agreed task. Metadata records supply no image-training evidence.',
        );
      }
    }
  });
}
export default {
  id: 'representation-choice',
  draw: drawRepresentationChoice,
  cues: [
    'dv-representation-choice-0',
    'dv-representation-choice-operation-0',
    'dv-frozen-head',
    'dv-representation-choice-1',
    'dv-representation-choice-operation-1',
    'dv-convnext-spatial',
    'dv-vit-patches',
    'dv-representation-choice-2',
    'dv-representation-choice-operation-2',
  ],
};
