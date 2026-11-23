import { bounded } from '../arithmetic.mjs';
import { drawExpandedText, drawExpandedTile, drawExpandedTitle } from '../defaults.mjs';
export function drawTensorParallel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id, a = 0.1, z = 0.8) => {
      const c = state.cues?.[id];
      return c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : bounded(c.progress)
        : cueProgress(a, z);
    };
  {
    drawExpandedTitle(
      ctx,
      api,
      'Same supplied input · matching first-layer columns and second-layer rows',
    );
    if (currentBeat === 0) {
      const q = cueProgress();
      drawExpandedTile(ctx, api, 'Replicated X', 180, 480, 290, 110, themeColors.ink);
      [
        ['W₁ columns 0', 2, themeColors.blue],
        ['W₁ columns 1', 3, themeColors.cyan],
      ].forEach(([name, v, col], i) => {
        const y = 360 + i * 340;
        drawExpandedTile(ctx, api, name, 680, y, 330, 85, col);
        api.arrow(ctx, 490, 535, 660, y + 42, themeColors.muted, 3);
        if (q > (i + 1) / 3) {
          drawExpandedTile(ctx, api, 'hidden ' + v, 1230, y, 350, 85, col);
          api.arrow(ctx, 1030, y + 42, 1210, y + 42, col, 3);
        }
      });
      drawExpandedText(
        ctx,
        api,
        'Elementwise activation remains local; this toy uses positive ReLU inputs',
        960,
        1000,
        30,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      const q = cueProgress(),
        partials = [
          [2, 8],
          [6, -3],
        ],
        cols = [themeColors.blue, themeColors.cyan];
      partials.forEach((v, i) => {
        const y = 420 + i * 250;
        drawExpandedTile(ctx, api, 'h' + i + ' = ' + (i + 2), 190, y, 240, 95, cols[i]);
        drawExpandedTile(
          ctx,
          api,
          i === 0 ? 'W₂ row [1, 4]' : 'W₂ row [2, −1]',
          570,
          y,
          430,
          95,
          cols[i],
        );
        api.arrow(ctx, 450, y + 45, 550, y + 45, themeColors.muted, 3);
        if (q > 0.25)
          drawExpandedTile(ctx, api, 'partial [' + v.join(', ') + ']', 1160, y, 500, 95, cols[i]);
      });
      api.focus.target('tp-output', () =>
        drawExpandedText(
          ctx,
          api,
          cue('tp-sum') > 0.9 ? '[2, 8] + [6, −3] = [8, 5]' : 'Partial outputs add to ?',
          960,
          985,
          44,
          themeColors.green,
          'center',
        ),
      );
    }
    if (currentBeat === 2) {
      const q = cueProgress();
      const names = ['Attention projection sum', 'MLP projection sum'];
      names.forEach((name, i) => {
        drawExpandedTile(
          ctx,
          api,
          name,
          250 + i * 800,
          410,
          650,
          120,
          i === 0 ? themeColors.blue : themeColors.cyan,
        );
        if (q > 0.35)
          drawExpandedText(
            ctx,
            api,
            'all-reduce',
            575 + i * 800,
            690,
            38,
            themeColors.yellow,
            'center',
          );
      });
      if (q > 0.75)
        drawExpandedText(
          ctx,
          api,
          'Classic replicated layout: 2 forward + 2 backward all-reduces / layer',
          960,
          920,
          34,
          themeColors.ink,
          'center',
        );
      drawExpandedText(
        ctx,
        api,
        'Other layouts can use all-gather / reduce-scatter · state sharding is a different split',
        960,
        1015,
        27,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'tensor-parallel',
  draw: drawTensorParallel,
  cues: ['tp-sum'],
};
