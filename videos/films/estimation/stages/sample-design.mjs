import { sliceModel } from '../fixtures.mjs';
import { cue, designFrame } from '../construction.mjs';
import { wilson } from '../model.mjs';
import { axes, caption, equation, focusTarget, interval, text } from '../defaults.mjs';
export function drawSampleDesign(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = designFrame(state),
      colors = [themeColors.blue, themeColors.cyan, themeColors.pink];
    text(
      ctx,
      api,
      'Separate toy queue · 1,000 messages in three disjoint categories',
      960,
      285,
      30,
      themeColors.muted,
      'center',
    );
    const starts = [220, 1193, 1471],
      widths = [973, 278, 139];
    sliceModel.forEach((r, i) => {
      api.rect(ctx, starts[i], 355, widths[i], 100, colors[i]);
      text(
        ctx,
        api,
        r.name + ' · ' + Math.round(100 * r.share) + '%',
        starts[i] + widths[i] / 2,
        i === 2 ? 550 : 320,
        27,
        colors[i],
        'center',
      );
    });
    if (currentBeat !== 1) {
      const q = currentBeat === 0 ? cue(state, 'biased-selection', 0.2, 0.45) : 1;
      const repair = currentBeat === 2 ? cue(state, 'design-repair', 0.15, 0.55) : 0;
      const edge = api.lerp(starts[1], starts[2] + widths[2], repair);
      focusTarget(ctx, api, currentBeat === 2 ? 'repaired-selection' : 'routine-selection', () => {
        api.path(
          ctx,
          [
            {
              x: starts[0],
              y: 490,
            },
            {
              x: starts[0],
              y: 510,
            },
            {
              x: edge,
              y: 510,
            },
            {
              x: edge,
              y: 490,
            },
          ],
          {
            color: repair > 0 ? themeColors.green : themeColors.yellow,
            width: 4,
          },
        );
        text(
          ctx,
          api,
          repair >= 1 ? 'new plan · all three categories eligible' : 'routine-only selection',
          700,
          580,
          32,
          repair > 0 ? themeColors.green : themeColors.blue,
          'center',
        );
        if (q > 0) api.rect(ctx, 425, 610, 550 * q, 18, themeColors.blue);
      });
      const plot = axes(
        ctx,
        api,
        320,
        720,
        1250,
        125,
        [0.04, 0.25],
        [0, 1],
        currentBeat === 2 ? [0.05, 0.12, 0.176, 0.2, 0.25] : [0.05, 0.12, 0.2, 0.25],
        [],
        'rate',
        '',
      );
      const k = Math.round(0.12 * f.routineN),
        v = wilson(k, f.routineN);
      focusTarget(ctx, api, 'routine-interval', () =>
        interval(ctx, api, plot, v, 0.5, themeColors.blue, 1, k / f.routineN),
      );
      text(
        ctx,
        api,
        (currentBeat === 2 ? 'old sample · ' : '') + f.routineN + ' routine labels',
        700,
        660,
        29,
        themeColors.blue,
        'center',
      );
      if (currentBeat === 2) {
        const p = plot.point(0.176, 0);
        api.line(ctx, p.x, 690, p.x, 845, themeColors.yellow, 3);
        text(ctx, api, 'whole mix 17.6%', p.x, 945, 27, themeColors.yellow, 'center');
      } else {
        text(
          ctx,
          api,
          'Billing and account access remain unmeasured',
          1320,
          640,
          26,
          themeColors.muted,
          'center',
        );
        caption(ctx, api, 'Routine-only Wilson interval · omits the finite-population correction');
      }
    } else {
      sliceModel.forEach((r, i) => {
        const x = 430 + i * 530,
          amount = f.stages[i];
        focusTarget(
          ctx,
          api,
          ['weighted-routine', 'weighted-billing', 'weighted-account'][i],
          () => {
            equation(
              ctx,
              api,
              Math.round(r.share * 1000) + '\\times' + Math.round(r.rate * 100) + '\\%',
              x,
              630,
              42,
              colors[i],
              'center',
            );
            api.rect(ctx, x - 175, 705, r.expected * 4 * amount, 75, colors[i]);
            text(
              ctx,
              api,
              f.complete[i] ? String(r.expected) : '?',
              x,
              845,
              45,
              colors[i],
              'center',
            );
          },
        );
      });
      focusTarget(ctx, api, 'weighted-total', () =>
        equation(
          ctx,
          api,
          f.totalKnown
            ? '\\frac{84+50+42}{1000}=\\frac{176}{1000}=17.6\\%'
            : '\\text{combine the expected contributions}',
          960,
          935,
          42,
          themeColors.yellow,
          'center',
        ),
      );
      caption(ctx, api, 'Expected specialist cases per 1,000 messages');
    }
  }
}
export default {
  id: 'sample-design',
  draw: drawSampleDesign,
  cues: [
    'biased-selection',
    'biased-precision',
    'weight-routine',
    'weight-billing',
    'weight-account',
    'weighted-total',
    'design-repair',
  ],
};
