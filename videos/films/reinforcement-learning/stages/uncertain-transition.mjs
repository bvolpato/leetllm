import { evidenceValue, indifferenceProbability, reviewValue } from '../arithmetic.mjs';
import { returns } from '../fixtures.mjs';
import { transitionSnapshot } from '../model.mjs';
import { optionalFocusTarget, retainedEquation, retainedText } from '../defaults.mjs';
export function drawUncertainTransition(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  {
    const comparison = transitionSnapshot(currentBeat, progress);
    const probabilities = Array.from(
      {
        length: 101,
      },
      (_, i) => i / 400,
    );
    const evidence = probabilities.map((v) => ({
      x: v * 100,
      y: evidenceValue(v),
    }));
    const plot = api.teaching.axes({
      x: 270,
      y: 360,
      width: 930,
      height: 420,
      xDomain: [0, 25],
      yDomain: [20, 65],
      xLabel: 'abandonment chance (%)',
      yLabel: 'expected reward',
      xTicks: [0, 5, 10, 15, 20, 25],
      yTicks: [20, 30, 40, 50, 60],
      fontSize: 25,
    });
    optionalFocusTarget(ctx, api, 'uncertain-return-curve', () =>
      api.teaching.curve({
        plot,
        points: evidence,
        color: themeColors.pink,
        width: 6,
        progress: 1,
      }),
    );
    const reviewStart = plot.point(0, reviewValue),
      reviewEnd = plot.point(20, reviewValue);
    api.line(ctx, reviewStart.x, reviewStart.y, reviewEnd.x, reviewEnd.y, themeColors.blue, 5);
    retainedText(
      ctx,
      api,
      'Human review · 54',
      plot.point(24, reviewValue).x,
      reviewStart.y - 20,
      24,
      themeColors.blue,
      'right',
    );
    const curveLabel = plot.point(16, evidenceValue(0.16));
    optionalFocusTarget(ctx, api, 'uncertain-transition-object-request-evidence-21', () =>
      retainedText(
        ctx,
        api,
        'Request evidence',
        curveLabel.x + 18,
        curveLabel.y - 48,
        24,
        themeColors.pink,
      ),
    );
    const threshold = plot.point(indifferenceProbability * 100, reviewValue);
    const noAbandonment = plot.point(0, returns.evidence);
    optionalFocusTarget(ctx, api, 'uncertain-transition-no-abandonment-point', () =>
      api.circle(ctx, noAbandonment.x, noAbandonment.y, 8, themeColors.blue),
    );
    if (currentBeat > 0) {
      const thresholdBase = plot.point(indifferenceProbability * 100, 20);
      api.line(
        ctx,
        threshold.x,
        threshold.y,
        thresholdBase.x,
        thresholdBase.y,
        themeColors.yellow,
        3,
      );
      optionalFocusTarget(
        ctx,
        api,
        'uncertain-transition-object-threshold-x-threshold-y-12-c-yellow-22',
        () => api.circle(ctx, threshold.x, threshold.y, 12, themeColors.yellow),
      );
      retainedText(
        ctx,
        api,
        `Tie · ${(indifferenceProbability * 100).toFixed(1)}%`,
        threshold.x + 18,
        threshold.y - 20,
        22,
        themeColors.yellow,
      );
    }
    const current = plot.point(comparison.probability * 100, comparison.askReturn);
    if (currentBeat === 1) {
      api.circle(ctx, current.x, current.y, 14, themeColors.panel, themeColors.white, 4);
      api.circle(ctx, current.x, current.y, 7, themeColors.white);
      retainedEquation(
        ctx,
        api,
        String.raw`V_{\mathrm{ask}}(p)=59-113p`,
        1450,
        365,
        32,
        themeColors.pink,
        'center',
      );
      optionalFocusTarget(
        ctx,
        api,
        'uncertain-transition-equation-string-raw-v-mathrm-review-54-27',
        () =>
          retainedEquation(
            ctx,
            api,
            String.raw`V_{\mathrm{review}}=54`,
            1450,
            415,
            32,
            themeColors.blue,
            'center',
          ),
      );
      retainedEquation(
        ctx,
        api,
        String.raw`p^*=\frac{59-54}{113}=\frac{5}{113}\approx4.4\%`,
        1450,
        485,
        32,
        themeColors.yellow,
        'center',
      );
      retainedText(
        ctx,
        api,
        `Sensitivity sweep · p=${(comparison.probability * 100).toFixed(1)}%`,
        1450,
        570,
        28,
        themeColors.ink,
        'center',
      );
      retainedText(
        ctx,
        api,
        `Evidence return · ${comparison.askReturn.toFixed(1)}`,
        1450,
        625,
        27,
        themeColors.pink,
        'center',
      );
      retainedText(
        ctx,
        api,
        `Review return · ${comparison.reviewReturn}`,
        1450,
        675,
        27,
        themeColors.blue,
        'center',
      );
      const choiceColor =
        comparison.choice === 'request evidence'
          ? themeColors.green
          : comparison.choice === 'tie'
            ? themeColors.yellow
            : themeColors.blue;
      api.components.card({
        label: `Chosen action\n${comparison.choice}`,
        x: 1270,
        y: 735,
        width: 360,
        height: 115,
        fill: themeColors.panel,
        stroke: choiceColor,
        textColor: choiceColor,
        fontSize: 30,
        baselineOffset: -18,
        padding: 16,
      });
    } else {
      optionalFocusTarget(ctx, api, 'uncertain-transition-quarter-case', () =>
        api.circle(ctx, current.x, current.y, 13, themeColors.yellow),
      );
      const choiceColor =
        comparison.choice === 'request evidence' ? themeColors.green : themeColors.blue;
      retainedText(ctx, api, 'Scenario · p = 25%', 1450, 385, 27, themeColors.ink, 'center');
      optionalFocusTarget(ctx, api, 'uncertain-transition-quarter-case', () =>
        retainedText(
          ctx,
          api,
          `Evidence return · ${comparison.askReturn.toFixed(2)}`,
          1450,
          445,
          26,
          themeColors.pink,
          'center',
        ),
      );
      retainedText(
        ctx,
        api,
        `Human review · ${comparison.reviewReturn}`,
        1450,
        495,
        26,
        themeColors.blue,
        'center',
      );
      retainedEquation(
        ctx,
        api,
        String.raw`0.75(59)+0.25(-54)=30.75`,
        1450,
        590,
        34,
        themeColors.yellow,
        'center',
      );
      api.components.card({
        label: `Chosen action\n${comparison.choice}`,
        x: 1270,
        y: 680,
        width: 360,
        height: 115,
        fill: themeColors.panel,
        stroke: choiceColor,
        textColor: choiceColor,
        fontSize: 30,
        baselineOffset: -18,
        padding: 16,
      });
    }
    {
    }
  }
}
export default {
  id: 'uncertain-transition',
  draw: drawUncertainTransition,
  cues: [
    'uncertain-transition-beat-1-focus-1',
    'uncertain-transition-beat-2-focus-1',
    'uncertain-transition-beat-2-focus-2',
    'uncertain-transition-beat-3-focus-1',
    'uncertain-transition-beat-3-focus-2',
  ],
};
