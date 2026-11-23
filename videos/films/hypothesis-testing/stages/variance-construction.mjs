import { jointDifferenceMoments, mix } from '../arithmetic.mjs';
import { completedHypothesisResult, cueProgress, resultOrOperation } from '../model.mjs';
import {
  constructionCaption,
  constructionEquation,
  constructionHeading,
  constructionLine,
  constructionText,
  mark,
} from '../defaults.mjs';
export function drawVarianceConstruction(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    cp = (id, beat) => {
      checked(id);
      return cueProgress(state, id, beat);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'variance-construction-construction', () => {
    if (currentBeat === 0) {
      const v = jointDifferenceMoments();
      const product = on('variance-product', 0);
      constructionText(
        ctx,
        api,
        'Hypothetical population   ·   Each square represents one percent',
        960,
        292,
        36,
        themeColors.ink,
        'center',
      );
      const outcomes = v.rows.flatMap((r) => Array(Math.round(r.p * 100)).fill(r));
      const names = ['Both pass', 'Only A passes', 'Only B passes', 'Both fail'];
      const colors = [themeColors.green, themeColors.pink, themeColors.cyan, themeColors.blue];
      outcomes.forEach((r, i) => {
        const tone = product && r.a * r.b === 0 ? themeColors.panel : colors[v.rows.indexOf(r)];
        api.rect(ctx, 336 + (i % 10) * 47, 365 + Math.floor(i / 10) * 47, 35, 35, tone);
      });
      v.rows.forEach((r, i) => {
        const y = 422 + i * 115;
        api.rect(ctx, 1020, y - 29, 30, 30, colors[i]);
        constructionText(ctx, api, names[i], 1092, y, 37, colors[i]);
        constructionText(ctx, api, Math.round(100 * r.p) + '%', 1570, y, 41, colors[i], 'right');
      });
      if (on('hyp-variance-covariance', 0))
        constructionEquation(
          ctx,
          api,
          String.raw`E[AB]-E[A]E[B]=0.45-0.25=0.20`,
          960,
          950,
          43,
          themeColors.cyan,
        );
      constructionCaption(ctx, api, 'Each assistant passes half the tasks in this population.');
    } else if (currentBeat === 1) {
      const v = jointDifferenceMoments(),
        paired = completedHypothesisResult(state, 'hyp-variance-paired-result', 1),
        independent = completedHypothesisResult(state, 'hyp-variance-independent-result', 1);
      constructionHeading(ctx, api, 'The covariance term changes difference variance');
      constructionEquation(
        ctx,
        api,
        String.raw`Var(\bar B-\bar A)=\frac{0.25+0.25-2(0.20)}{40}`,
        960,
        370,
        48,
        themeColors.cyan,
      );
      api.teaching.bars({
        x: 540,
        y: 510,
        width: 850,
        height: 300,
        values: [paired ? v.paired : 0, independent ? v.independent : 0],
        labels: ['paired 40', 'independent 40 each'],
        colors: [themeColors.cyan, themeColors.pink],
        max: 0.015,
        fontSize: 29,
        showValues: false,
      });
      constructionText(
        ctx,
        api,
        paired ? v.paired.toFixed(4) : 'variance pending',
        740,
        900,
        paired ? 43 : 29,
        themeColors.cyan,
        'center',
      );
      constructionText(
        ctx,
        api,
        independent ? v.independent.toFixed(4) : 'variance pending',
        1190,
        900,
        independent ? 43 : 29,
        themeColors.pink,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'Both bars show variance of the mean difference for 40 observations per model.',
      );
    } else if (currentBeat === 2) {
      const v = jointDifferenceMoments(),
        xx = (p) => 960 + (p / 0.3) * 680,
        seReady = completedHypothesisResult(state, 'hyp-variance-standard-errors', 2),
        margins = completedHypothesisResult(state, 'hyp-variance-margins', 2);
      constructionHeading(ctx, api, 'Reference margins around a known zero effect');
      constructionLine(ctx, api, 280, 670, 1640, 670, themeColors.muted, 2);
      for (const val of [-0.2, -0.1, 0, 0.1, 0.2]) {
        constructionLine(ctx, api, xx(val), 660, xx(val), 680, themeColors.muted, 2);
        constructionText(
          ctx,
          api,
          Math.round(val * 100),
          xx(val),
          730,
          27,
          themeColors.muted,
          'center',
        );
      }
      for (const [se, y, c, name] of [
        [v.pairedSE, 450, themeColors.cyan, seReady ? 'paired SE 5 points' : 'paired SE pending'],
        [
          v.independentSE,
          575,
          themeColors.pink,
          seReady ? 'independent SE 11.2 points' : 'independent SE pending',
        ],
      ]) {
        const margin = 1.96 * se;
        if (margins) {
          constructionLine(ctx, api, xx(-margin), y, xx(margin), y, c, 9);
          for (const z of [-margin, margin])
            constructionLine(ctx, api, xx(z), y - 25, xx(z), y + 25, c, 3);
        } else {
          api.circle(ctx, xx(0), y, 7, c);
        }
        constructionText(ctx, api, name, 960, y - 50, 30, c, 'center');
      }
      constructionText(
        ctx,
        api,
        margins
          ? 'margins ±9.8 versus ±21.9 percentage points'
          : '1.96 × standard error · margin pending',
        960,
        865,
        36,
        themeColors.yellow,
        'center',
      );
      constructionText(
        ctx,
        api,
        'Hypothetical population   ·   40 independent pairs',
        960,
        970,
        32,
        themeColors.yellow,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'Only four expected disagreements make normal-coverage approximation fragile in this population.',
      );
    } else {
      const q = 0.5 * cp('hyp-variance-sign', 3) + 0.5 * cp('variance-negative', 3),
        matched = on('hyp-variance-match', 3),
        nRef = matched ? Math.round(mix(40, 200, cp('hyp-variance-match', 3))) : 40,
        both = on('variance-reset', 3) ? 0.45 : mix(0.45, 0.05, q),
        v = jointDifferenceMoments(both),
        plot = api.teaching.axes({
          x: 270,
          y: 430,
          width: 1300,
          height: 310,
          xDomain: [-0.2, 0.2],
          yDomain: [0, 0.025],
          xTicks: [-0.2, 0, 0.2],
          yTicks: [0, 0.0125, 0.025],
          xLabel: 'population covariance',
          yLabel: 'mean-difference variance',
          fontSize: 26,
        });
      constructionHeading(
        ctx,
        api,
        'Keep the pass rates fixed. Change which tasks both assistants pass.',
      );
      const points = Array.from(
        {
          length: 41,
        },
        (_, i) => {
          const cov = -0.2 + i * 0.01;
          return {
            x: cov,
            y: (0.5 - 2 * cov) / 40,
          };
        },
      );
      api.teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 5,
      });
      const a = plot.point(-0.2, 0.5 / nRef),
        z = plot.point(0.2, 0.5 / nRef);
      constructionLine(ctx, api, a.x, a.y, z.x, z.y, themeColors.pink, 3);
      const point = plot.point(v.cov, v.paired);
      api.circle(ctx, point.x, point.y, 13, themeColors.yellow);
      constructionText(
        ctx,
        api,
        `covariance ${v.cov.toFixed(2)} → paired variance ${v.paired.toFixed(4)}`,
        960,
        900,
        33,
        themeColors.cyan,
        'center',
      );
      if (matched && nRef === 200)
        constructionText(
          ctx,
          api,
          'At covariance 0.20: independent 200 per model match paired 40',
          960,
          980,
          30,
          themeColors.yellow,
          'center',
        );
      constructionCaption(
        ctx,
        api,
        'Pink: independent ' +
          nRef +
          ' per model. Cyan: 40 pairs. Both models still pass half their tasks.',
      );
    }
  });
}
export default {
  id: 'variance-construction',
  draw: drawVarianceConstruction,
  cues: [
    'variance-construction-0',
    'hyp-variance-covariance',
    'variance-product',
    'variance-construction-1',
    'hyp-variance-paired-result',
    'hyp-variance-independent-result',
    'variance-construction-2',
    'hyp-variance-standard-errors',
    'hyp-variance-margins',
    'variance-construction-3',
    'hyp-variance-sign',
    'variance-negative',
    'variance-reset',
    'hyp-variance-match',
  ],
};
