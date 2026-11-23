import { decodeSupport } from '../arithmetic.mjs';
import { coreBox, coreFoot, coreLine, coreText, coreTitle } from '../defaults.mjs';
export function drawMinpRelative(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-minp-relative-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-minp-relative-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'A relative floor follows the largest probability'
        : currentBeat === 1
          ? 'Temperature moves the equivalent logit floor'
          : 'A uniform row separates min-p from cumulative truncation',
    );
    if (currentBeat === 0) {
      [0.8, 0.05].forEach((peak, i) => {
        const x = 230 + i * 850;
        coreBox(ctx, api, 'peak = ' + peak, x, 400, 580, 100, themeColors.blue);
        api.arrow(ctx, x + 290, 530, x + 290, 650, themeColors.cyan, 3);
        coreBox(ctx, api, 'floor = 0.1 × ' + peak, x, 680, 580, 100, themeColors.cyan);
        coreText(
          ctx,
          api,
          done(i ? 'minp-flat-floor' : 'minp-peak-floor')
            ? (peak * 0.1).toFixed(3)
            : 'floor pending',
          x + 290,
          920,
          done(i ? 'minp-flat-floor' : 'minp-peak-floor') ? 49 : 32,
          themeColors.yellow,
        );
      });
    } else if (currentBeat === 1) {
      const hot = done('minp-hot'),
        T = hot ? 2 : 1,
        z = [0, -2, -4],
        floor = T * Math.log(0.1),
        show = hot || done('minp-default');
      coreText(
        ctx,
        api,
        'floor = max(z) + T ln(0.1) = ' + floor.toFixed(3),
        960,
        380,
        34,
        themeColors.yellow,
      );
      const map = (v) => 270 + ((v + 5) / 5) * 1380;
      coreLine(ctx, api, 270, 650, 1650, 650);
      coreLine(ctx, api, map(floor), 470, map(floor), 810, themeColors.pink, 4);
      z.forEach((v, i) => {
        api.circle(
          ctx,
          map(v),
          650,
          20,
          show && v >= floor ? themeColors.green : themeColors.muted,
        );
        coreText(
          ctx,
          api,
          'ID ' + i + ' · ' + v,
          map(v),
          900,
          31,
          show && v >= floor ? themeColors.green : themeColors.muted,
        );
      });
      coreText(ctx, api, 'T = ' + T, 960, 980, 32, themeColors.cyan);
    } else {
      const min = decodeSupport(Array(8).fill(1), 'min', 0.1),
        top = decodeSupport(Array(8).fill(1), 'p', 0.75);
      for (let i = 0; i < 8; i++) {
        coreBox(
          ctx,
          api,
          'ID ' + i,
          235 + i * 185,
          430,
          155,
          90,
          done('minp-uniform') ? themeColors.green : themeColors.muted,
          25,
        );
        coreBox(
          ctx,
          api,
          'ID ' + i,
          235 + i * 185,
          700,
          155,
          90,
          done('minp-top-p-six') && top.ids.includes(i) ? themeColors.blue : themeColors.muted,
          25,
        );
      }
      coreText(
        ctx,
        api,
        'min-p 0.1: ' + (done('minp-uniform') ? min.ids.length + ' IDs' : 'pending'),
        960,
        380,
        33,
        themeColors.green,
      );
      coreText(
        ctx,
        api,
        'top-p 0.75: ' + (done('minp-top-p-six') ? top.ids.length + ' IDs' : 'pending'),
        960,
        650,
        33,
        themeColors.blue,
      );
    }
    coreFoot(
      ctx,
      api,
      'The floor uses individual positive-probability events, with the configured order relative to temperature.',
    );
    return;
  });
}
export default {
  id: 'minp-relative',
  draw: drawMinpRelative,
  cues: [
    'dec-minp-relative-1',
    'dec-minp-peak-floor',
    'dec-minp-flat-floor',
    'dec-minp-relative-2',
    'dec-minp-default',
    'dec-minp-hot',
    'dec-minp-relative-3',
    'dec-minp-uniform',
    'dec-minp-top-p-six',
  ],
};
