import { TAU } from '../fixtures.mjs';
import { evaluate, formatValue } from '../arithmetic.mjs';
import { drawNote, drawPill, drawRectangle, drawText } from '../defaults.mjs';
export function drawObjective(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-objective-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('objective-mechanism', () => {
    let masks = [1, 1, 1];
    if (currentBeat === 1) {
      masks[2] = 1 - cueProgress('easy');
      if (B('hard')) {
        masks[2] = 1;
        masks[1] = 1 - cueProgress('hard');
      }
    } else if (currentBeat > 1) masks = [1, 0, 1];
    const d = evaluate(),
      peak = Math.max(...d.scores),
      weights = d.scores.map((s, i) => Math.exp((s - peak) / TAU) * masks[i]),
      sum = weights.reduce((a, z) => a + z, 0),
      prob = weights[0] / sum;
    drawText(
      ctx,
      api,
      'Keep the positive term · change only its competitors',
      960,
      285,
      35,
      themeColors.yellow,
    );
    if (currentBeat === 1)
      drawText(
        ctx,
        api,
        B('hard')
          ? 'Reset full pool → remove close competitor'
          : 'Independent test: remove easy alternative',
        960,
        345,
        28,
        themeColors.muted,
      );
    weights.forEach((v, i) => {
      const x = 420 + i * 540;
      api.focus.target('exponential-term-' + i, () => {
        drawPill(
          ctx,
          api,
          ['puppy +', 'sleep −', 'sky −'][i],
          x,
          420,
          440,
          [themeColors.green, themeColors.pink, themeColors.blue][i],
        );
        drawText(
          ctx,
          api,
          'mass ' + formatValue(v, 4),
          x,
          570,
          35,
          masks[i] ? [themeColors.green, themeColors.pink, themeColors.blue][i] : themeColors.muted,
        );
        if (!masks[i]) drawText(ctx, api, 'removed', x, 650, 28, themeColors.muted);
      });
    });
    api.focus.target('competitive-denominator', () => {
      drawRectangle(ctx, api, 330, 725, 1260, 80, themeColors.panel, themeColors.yellow);
      const cols = [themeColors.green, themeColors.pink, themeColors.blue];
      let x = 330;
      weights.forEach((v, i) => {
        const w = (1260 * v) / sum;
        if (w > 0) {
          drawRectangle(ctx, api, x, 725, w, 80, cols[i]);
          x += w;
        }
      });
      drawText(ctx, api, 'sum ' + formatValue(sum, 4), 960, 860, 32, themeColors.yellow);
    });
    if (resultComplete('divide') || currentBeat > 0)
      api.focus.target('contrastive-positive-loss', () =>
        drawText(
          ctx,
          api,
          'p+ = ' + formatValue(prob, 4) + '     loss = ' + formatValue(-Math.log(prob), 4),
          960,
          950,
          36,
          themeColors.green,
        ),
      );
    drawNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Score gradients flow through shared encoder parameters'
        : 'Each term retains its candidate identity',
    );
  });
}
export default {
  id: 'objective',
  draw: drawObjective,
  cues: [
    'objective-exponential-term-0-b1-1',
    'cl-objective-divide',
    'objective-competitive-denominator-b2-1',
    'cl-objective-easy',
    'cl-objective-hard',
    'objective-exponential-term-0-b3-1',
    'cl-objective-gradient',
  ],
};
