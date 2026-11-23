import { logits, stable } from '../fixtures.mjs';
import { logSpaceSnapshot } from '../model.mjs';
import { box, drawText, focus, sub } from '../defaults.mjs';
export function drawStable(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cue = (id, f = api.phase(progress, 0.15, 0.8)) => (api.focus ? api.focus.progress(id, f) : f);
  {
    if (currentBeat === 1) {
      const m = logSpaceSnapshot(progress);
      sub(ctx, api, 'Repeated observed probability · ordinary double-precision arithmetic');
      drawText(
        ctx,
        api,
        m.count.toLocaleString('en-US') + ' targets · p = ' + m.probability.toFixed(6),
        960,
        390,
        38,
        themeColors.yellow,
        'center',
      );
      focus(ctx, api, 'stable-equation-string-raw-prod-i-p-i-p-n-17', () => {
        box(ctx, api, 'Multiply p × p × …', 200, 500, 680, 110, themeColors.blue, 37);
        drawText(
          ctx,
          api,
          m.product === 0 ? 'product = 0' : m.product.toExponential(3),
          540,
          740,
          40,
          m.product === 0 ? themeColors.pink : themeColors.blue,
          'center',
        );
      });
      focus(ctx, api, 'stable-object-accumulated-loss-nats-19', () => {
        box(ctx, api, 'Add −ln(p) + −ln(p) + …', 1030, 500, 700, 110, themeColors.green, 33);
        drawText(
          ctx,
          api,
          'sum = ' + m.sum.toFixed(3) + ' nats',
          1380,
          740,
          39,
          themeColors.green,
          'center',
        );
      });
      drawText(
        ctx,
        api,
        'Same mean ' + m.mean.toFixed(6) + ' → PPL ' + m.perplexity.toFixed(6),
        960,
        970,
        38,
        themeColors.cyan,
        'center',
      );
    } else {
      const shift = 1000 * cue('stable-subtract'),
        vals = logits.map((x) => x - shift),
        exp = cue('stable-normalize');
      sub(ctx, api, 'One common subtraction preserves all pairwise logit differences');
      focus(ctx, api, 'stable-max-marker', () => {
        drawText(
          ctx,
          api,
          'Subtract current maximum: 1000',
          610,
          380,
          32,
          themeColors.yellow,
          'center',
        );
        drawText(
          ctx,
          api,
          'Maximum after shift: ' + Math.max(...vals).toFixed(1),
          610,
          620,
          30,
          themeColors.yellow,
          'center',
        );
      });
      vals.forEach((v, i) =>
        box(ctx, api, v.toFixed(1), 220 + i * 300, 440, 250, 100, themeColors.blue, 38),
      );
      focus(ctx, api, 'stable-object-distribution-stable-21', () => {
        stable.forEach((v, i) => {
          const x = 1260 + i * 170;
          api.rect(ctx, x, 830 - v * 390, 105, v * 390, themeColors.green);
          drawText(ctx, api, 'ID ' + i, x + 52, 900, 28, themeColors.green, 'center');
          drawText(
            ctx,
            api,
            v.toFixed(3),
            x + 52,
            830 - v * 390 - 25,
            28,
            themeColors.green,
            'center',
          );
        });
      });
      focus(ctx, api, 'stable-object-same-distribution-after-a-common-shift-22', () =>
        drawText(
          ctx,
          api,
          'Differences: 2 and 3 · distribution unchanged',
          960,
          1025,
          33,
          themeColors.muted,
          'center',
        ),
      );
      if (exp > 0.4) {
        drawText(ctx, api, 'exp: 1, 0.1353, 0.0498', 610, 750, 32, themeColors.cyan, 'center');
        drawText(
          ctx,
          api,
          'sum = 1.1851 · observed ID 0',
          610,
          850,
          31,
          themeColors.muted,
          'center',
        );
        drawText(
          ctx,
          api,
          '−ln(1 / 1.1851) = ' + (-Math.log(stable[0])).toFixed(3),
          610,
          945,
          35,
          themeColors.yellow,
          'center',
        );
      }
    }
  }
}
export default {
  id: 'stable',
  draw: drawStable,
  cues: [
    'stable-beat-1-focus-1',
    'stable-beat-1-focus-2',
    'stable-subtract',
    'stable-normalize',
    'stable-beat-2-focus-1',
    'stable-beat-2-focus-2',
  ],
};
