import { denseLoss, sparseLoss } from '../model.mjs';
import { retainedDrawEquation, retainedDrawText } from '../defaults.mjs';
export function drawObjective(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9);
  {
    const l =
      currentBeat === 0 ? 0.02 : currentBeat === 1 ? api.lerp(0.02, 0.2, phaseForBeat(1)) : 0.2;
    if (currentBeat === 2) {
      const scale = 1 + 3 * phaseForBeat(2);
      api.focus.target('scale-degeneracy', () =>
        teaching.bars({
          x: 260,
          y: 420,
          width: 900,
          height: 340,
          values: [1 / scale, scale],
          labels: ['latent coefficient', 'decoder norm'],
          max: 4.2,
          colors: [themeColors.cyan, themeColors.pink],
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 34,
        }),
      );
      retainedDrawText(
        ctx,
        api,
        'reciprocal rescaling',
        1450,
        380,
        40,
        themeColors.yellow,
        'center',
      );
      api.focus.target('scale-invariant', () =>
        retainedDrawEquation(
          ctx,
          api,
          String.raw`x=zd=1`,
          1450,
          595,
          58,
          themeColors.green,
          'center',
        ),
      );
      retainedDrawText(
        ctx,
        api,
        `latent magnitude falls to ${(1 / scale).toFixed(3)}`,
        1450,
        775,
        34,
        themeColors.pink,
        'center',
      );
      return;
    }
    api.focus.target('candidate-loss', () =>
      teaching.bars({
        x: 260,
        y: 420,
        width: 900,
        height: 340,
        values: [sparseLoss(l), denseLoss(l)],
        labels: ['sparser candidate', 'denser candidate'],
        max: 0.14,
        colors: [themeColors.green, themeColors.blue],
        showValues: true,
        format: (v) => v.toFixed(4),
        fontSize: 34,
      }),
    );
    retainedDrawText(
      ctx,
      api,
      `penalty weight ${l.toFixed(3)}`,
      1450,
      380,
      40,
      themeColors.yellow,
      'center',
    );
    retainedDrawText(ctx, api, 'sparse code [0.75, 0]', 1450, 510, 36, themeColors.green, 'center');
    retainedDrawText(
      ctx,
      api,
      'reconstruction [0.75, 0]',
      1450,
      615,
      34,
      themeColors.green,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      'dense code [0.75, 0.50]',
      1450,
      735,
      36,
      themeColors.blue,
      'center',
    );
    retainedDrawText(ctx, api, 'reconstruction [1, 0]', 1450, 840, 34, themeColors.blue, 'center');
    api.focus.target('objective-equation', () =>
      retainedDrawEquation(
        ctx,
        api,
        String.raw`L=\mathrm{MSE}+\lambda\,\mathrm{mean}(|z|)`,
        960,
        945,
        48,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'objective',
  draw: drawObjective,
  cues: ['objective-b1-1', 'objective-b2-1', 'objective-b3-1', 'objective-b3-2'],
};
