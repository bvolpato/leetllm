import { affineWitness } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  arrow,
  equation,
  focusTarget,
  formatNumber,
  head,
  line,
  note,
  pill,
  text,
} from '../defaults.mjs';
export function drawAffineIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'affine-identity-mechanism', () => {
    const w = affineWitness();
    if (currentBeat === 0) {
      head(ctx, api, 'A narrow affine bottleneck still cannot create a nonlinear map');
      equation(
        ctx,
        api,
        String.raw`W_2(W_1x+b_1)+b_2=(W_2W_1)x+(W_2b_1+b_2)`,
        960,
        420,
        46,
        themeColors.cyan,
      );
      const p = cueProgress('affine-identity-beat-0', 0);
      for (const [x, label, col] of [
        [390, 'input space', themeColors.ink],
        [960, 'narrow hidden rank', themeColors.blue],
        [1530, 'affine image', themeColors.cyan],
      ]) {
        api.rect(ctx, x - 160, 610, 320, 180, themeColors.panel, col, 2);
        for (let i = 0; i < (x === 960 ? 2 : 5); i++)
          line(ctx, api, x - 110, 650 + i * 22, x + 110, 650 + i * 22, col, 3);
      }
      arrow(ctx, api, 570, 700, 780, 700);
      arrow(ctx, api, 1140, 700, 1350, 700);
      text(
        ctx,
        api,
        'rank of the product ≤ narrowest factor rank',
        960,
        935,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      head(ctx, api, 'Test the actual pre-sigmoid network on opposite inputs');
      const xs = [
          [1, 4],
          [-1, -4],
          [0, 0],
        ],
        values = [w.positive, w.negative, w.zero];
      xs.forEach((x, i) => {
        const xx = 390 + i * 570;
        pill(ctx, api, 'x = [' + x.join(', ') + ']', xx, 410, 440, themeColors.ink, 32);
        arrow(ctx, api, xx, 465, xx, 590, themeColors.muted);
        pill(
          ctx,
          api,
          resultComplete(['affine-witness-values', 'nn-affine-negative', 'nn-affine-zero'][i], 1)
            ? 'F(x) = ' + formatNumber(ctx, api, values[i])
            : 'F(x) = ?',
          xx,
          660,
          440,
          themeColors.cyan,
          35,
        );
      });
      if (currentBeat === 2 && resultComplete('affine-identity-beat-2', 2)) {
        equation(
          ctx,
          api,
          String.raw`F(x)+F(-x)=-0.71\ne 2F(0)=-1`,
          960,
          880,
          49,
          themeColors.yellow,
        );
        line(ctx, api, 400, 750, 950, 795, themeColors.cyan, 4);
        line(ctx, api, 960, 750, 950, 795, themeColors.cyan, 4);
      } else
        equation(
          ctx,
          api,
          String.raw`F(x)+F(-x)\stackrel{?}{=}2F(0)`,
          960,
          890,
          48,
          themeColors.yellow,
        );
    }
    if (resultComplete('affine-identity-beat-2', 2))
      note(ctx, api, 'These three logits rule out an affine replacement for this network.');
    return;
  });
}
export default {
  id: 'affine-identity',
  draw: drawAffineIdentity,
  cues: [
    'affine-identity-beat-0',
    'affine-identity-beat-1',
    'affine-witness-values',
    'nn-affine-negative',
    'nn-affine-zero',
    'affine-identity-beat-2',
  ],
};
