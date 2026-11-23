import { scoreForCap } from '../arithmetic.mjs';
import { heartbeatAgeHours } from '../construction.mjs';
import { preprocessingState } from '../model.mjs';
import { retainedCard, retainedFocus, retainedMath, retainedText } from '../defaults.mjs';
export function drawPreprocessingChange(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const done = (id, beat) =>
    currentBeat > beat ||
    (currentBeat === beat && (state.cues ? state.cues[id]?.progress === 1 : progress >= 0.94));
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const { cap, age } = preprocessingState(
        currentBeat,
        progress,
        currentBeat === 0 ? api.focus.progress('feature-cap-change', phaseForBeat(0)) : 1,
      ),
      scoresReady = done('feature-preprocess-score-pair', 1),
      capReady = done('feature-cap-change', 0),
      capX = (cap) => 250 + ((cap - 160) / 220) * 770;
    api.line(ctx, 250, 350, 1020, 350, themeColors.muted, 2);
    api.circle(ctx, capX(200), 350, 8, themeColors.cyan);
    api.line(ctx, capX(cap), 328, capX(cap), 375, themeColors.yellow, 4);
    retainedText(ctx, api, 'raw 200 · cap ' + cap.toFixed(0), 660, 400, 24, themeColors.yellow);
    retainedFocus(
      ctx,
      api,
      'preprocessing-change-object-j-188-follow-one-input-through-the-same-fixed-rule-46',
      () =>
        retainedText(
          ctx,
          api,
          'J-188 · same raw input and fixed teaching weights',
          660,
          315,
          29,
          themeColors.muted,
        ),
    );
    const curve = api.teaching.axes({
      x: 250,
      y: 420,
      width: 770,
      height: 350,
      xDomain: [160, 215],
      yDomain: [0.3, 0.65],
      xTicks: [160, 180, 200],
      yTicks: [0.3, 0.4, 0.5, 0.6],
      xLabel: 'clipped heartbeat age · hours',
      yLabel: 'score',
      fontSize: 24,
    });
    api.teaching.curve({
      plot: curve,
      points: Array.from(
        {
          length: 111,
        },
        (_, i) => {
          const x = 160 + i * 0.5;
          return {
            x,
            y: 1 / (1 + Math.exp(-(0.02 * x + 0.18 - 4))),
          };
        },
      ),
      color: themeColors.cyan,
      width: 4,
    });
    retainedFocus(
      ctx,
      api,
      'preprocessing-change-object-moving-x-moving-y-14-score-5-c-pink-c-green-47',
      () => {
        if (scoresReady)
          for (const [a, k] of [
            [180, themeColors.green],
            [200, themeColors.pink],
          ]) {
            const q = curve.point(a, scoreForCap(a));
            api.circle(ctx, q.x, q.y, 14, k);
          }
        else retainedText(ctx, api, 'Illustrative scores pending', 660, 900, 30, themeColors.muted);
      },
    );
    if (scoresReady) {
      const lo = curve.point(160, 0.5),
        hi = curve.point(215, 0.5);
      api.line(ctx, lo.x, lo.y, hi.x, hi.y, themeColors.yellow, 2);
      retainedText(
        ctx,
        api,
        'Threshold 0.500 · the changed input crosses',
        660,
        970,
        27,
        themeColors.yellow,
      );
    }
    retainedFocus(ctx, api, 'preprocessing-change-object-raw-age-200-h-h-49', () =>
      retainedCard(
        ctx,
        api,
        capReady ? 'raw age 200 h → ' + age.toFixed(0) + ' h' : 'raw 200 h · clipped pending',
        1190,
        405,
        themeColors.cyan,
        590,
        86,
      ),
    );
    retainedFocus(ctx, api, 'feature-preprocess-score-pair', () => {
      if (scoresReady) {
        retainedText(
          ctx,
          api,
          'cap 180: ' + scoreForCap(180).toFixed(3),
          1470,
          585,
          34,
          themeColors.green,
        );
        retainedText(
          ctx,
          api,
          'cap 360: ' + scoreForCap(360).toFixed(3),
          1470,
          655,
          34,
          themeColors.pink,
        );
      } else retainedText(ctx, api, 'Score comparison pending', 1470, 595, 32, themeColors.muted);
    });
    retainedFocus(
      ctx,
      api,
      'preprocessing-change-object-current-cap-h-fixed-teaching-weights-51',
      () =>
        retainedText(
          ctx,
          api,
          'current cap ' + cap.toFixed(0) + ' h · fixed teaching weights',
          1460,
          745,
          27,
          themeColors.muted,
        ),
    );
    retainedMath(
      ctx,
      api,
      String.raw`p=\sigma(0.02\,a+0.01\cdot18-4)`,
      1440,
      835,
      38,
      themeColors.ink,
    );
    if (currentBeat >= 2)
      retainedFocus(ctx, api, 'feature-preprocess-fresh', () => {
        const fresh = 1 / (1 + Math.exp(-(0.02 * heartbeatAgeHours + 0.01 * 18 - 4)));
        retainedCard(ctx, api, 'Fresh control · age 0.5 h', 1190, 895, themeColors.green, 590, 66);
        retainedText(
          ctx,
          api,
          done('feature-preprocess-fresh', 2)
            ? 'Both scores ' + fresh.toFixed(3) + ' · same input'
            : 'Fresh comparison pending',
          1490,
          995,
          26,
          done('feature-preprocess-fresh', 2) ? themeColors.green : themeColors.muted,
        );
      });
  }
}
export default {
  id: 'preprocessing-change',
  draw: drawPreprocessingChange,
  cues: [
    'preprocessing-change-beat-1-focus-1',
    'feature-cap-change',
    'preprocessing-change-beat-2-focus-1',
    'preprocessing-change-beat-2-focus-2',
    'feature-preprocess-score-pair',
    'preprocessing-change-beat-3-focus-1',
    'preprocessing-change-beat-3-focus-2',
    'feature-preprocess-fresh',
  ],
};
