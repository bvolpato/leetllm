import { fittedWeights } from '../fixtures.mjs';
import { mix } from '../construction.mjs';
import { boundaryGeometry } from '../model.mjs';
import {
  axes,
  cueAmount,
  curve,
  equation,
  labelPoint,
  rectangle,
  segment,
  text,
  thresholdLine,
} from '../defaults.mjs';
export function drawBoundaryGeometry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-boundary-geometry-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-boundary-geometry-mechanism', () => {
    if (currentBeat === 0) {
      const q = axes(
        ctx,
        api,
        220,
        370,
        1000,
        420,
        [0, 5],
        [-0.5, 1.5],
        'feature',
        'predicted value',
      );
      curve(ctx, api, q, (x) => 0.35 * x - 0.4, 0, 5, themeColors.pink);
      segment(
        ctx,
        api,
        q.point(0, 0).x,
        q.point(0, 0).y,
        q.point(5, 0).x,
        q.point(5, 0).y,
        themeColors.yellow,
      );
      segment(
        ctx,
        api,
        q.point(0, 1).x,
        q.point(0, 1).y,
        q.point(5, 1).x,
        q.point(5, 1).y,
        themeColors.yellow,
      );
      const x = 5 * op,
        a = q.point(x, 0.35 * x - 0.4);
      api.circle(ctx, a.x, a.y, 12, themeColors.pink);
      text(ctx, api, 'Binary labels', 1510, 350, 34, themeColors.muted);
      [0, 1].forEach((v, i) => {
        api.circle(ctx, 1430 + i * 170, 430, 30, v ? themeColors.pink : themeColors.blue);
        text(ctx, api, v, 1430 + i * 170, 440, 31, themeColors.bg);
      });
      equation(ctx, api, 'p(1-p)', 1510, 610, 48, themeColors.yellow);
      text(ctx, api, 'Bernoulli conditional variance', 1490, 680, 28, themeColors.muted);
      text(ctx, api, 'Squared error on bounded probabilities: Brier loss', 960, 955, 34);
    } else {
      const constant = currentBeat === 2 && cueAmount(ctx, api, 'lr-boundary-constant') > 0,
        vertical = currentBeat === 2 && cueAmount(ctx, api, 'lr-boundary-vertical-only') > 0,
        w = constant ? [-4.9, 0, 0] : vertical ? [-4.9, 3.4, 0] : fittedWeights,
        t = currentBeat === 2 ? mix(0.5, 0.2, cueAmount(ctx, api, 'lr-boundary-level')) : 0.5,
        q = constant
          ? null
          : axes(
              ctx,
              api,
              220,
              355,
              900,
              450,
              [0.5, 5],
              [3.5, 5.75],
              'ambiguity',
              'policy support',
            ),
        g = boundaryGeometry(w, [3, 5], t);
      if (constant) {
        rectangle(ctx, api, 220, 355, 990, 450, themeColors.panel, themeColors.muted);
        text(
          ctx,
          api,
          'Same probability at every feature location',
          715,
          510,
          34,
          themeColors.cyan,
        );
        if (resultComplete('lr-boundary-constant'))
          text(ctx, api, 'p = ' + g.probability.toFixed(4), 715, 650, 48, themeColors.cyan);
        text(ctx, api, 'β = [0, 0] · no normal direction', 1500, 470, 32, themeColors.yellow);
        text(ctx, api, 'No separating hyperplane', 1500, 650, 32, themeColors.yellow);
        text(
          ctx,
          api,
          'Distance formula has no nonzero denominator',
          960,
          945,
          31,
          themeColors.muted,
        );
        return;
      }
      if (vertical) {
        const xx = (g.level - w[0]) / w[1],
          a = q.point(xx, 3.5),
          z = q.point(xx, 5.75);
        segment(ctx, api, a.x, a.y, z.x, z.y, themeColors.yellow, 4);
      } else thresholdLine(ctx, api, q, w, t);
      const a = labelPoint(ctx, api, q, 3, 5, themeColors.cyan),
        z = q.point(...g.projection);
      const normal = cueAmount(ctx, api, 'lr-boundary-normal');
      segment(
        ctx,
        api,
        z.x,
        z.y,
        mix(z.x, a.x, normal),
        mix(z.y, a.y, normal),
        themeColors.cyan,
        5,
      );
      if (normal > 0) api.circle(ctx, z.x, z.y, 8, themeColors.yellow);
      const u = g.beta.map((v) => v / g.norm),
        n1 = q.point(g.projection[0] + u[0] * 0.8, g.projection[1] + u[1] * 0.8);
      api.arrow(ctx, z.x, z.y, n1.x, n1.y, themeColors.pink, 4);
      text(ctx, api, 'REQ-10234 · (3,5)', 1500, 270, 29, themeColors.cyan);
      text(ctx, api, 'β points toward larger logits', 1500, 350, 29, themeColors.pink);
      equation(
        ctx,
        api,
        '\\|\\beta\\|=\\sqrt{\\beta_1^2+\\beta_2^2}',
        1500,
        470,
        38,
        themeColors.pink,
      );
      equation(
        ctx,
        api,
        'd=\\frac{z-\\operatorname{logit}(t)}{\\|\\beta\\|}',
        1500,
        640,
        42,
        themeColors.cyan,
      );
      if (resultComplete('lr-boundary-distance') || currentBeat > 1)
        text(
          ctx,
          api,
          'At t = ' + t.toFixed(2) + ': distance ' + g.distance.toFixed(3),
          1490,
          760,
          31,
          themeColors.cyan,
        );
      else text(ctx, api, 'Project before measuring', 1490, 760, 31, themeColors.muted);
      if (currentBeat === 2) {
        equation(
          ctx,
          api,
          '\\operatorname{logit}(t)=\\log\\frac{t}{1-t}',
          960,
          935,
          44,
          themeColors.yellow,
        );
        text(
          ctx,
          api,
          vertical
            ? 'β₂ = 0: vertical boundary'
            : 'Fixed weights: threshold shifts a parallel boundary',
          960,
          1008,
          30,
          themeColors.muted,
        );
      } else
        text(
          ctx,
          api,
          'Intercept stays outside the feature-weight norm',
          960,
          955,
          33,
          themeColors.muted,
        );
    }
  });
}
export default {
  id: 'boundary-geometry',
  draw: drawBoundaryGeometry,
  cues: [
    'lr-boundary-geometry-step-0',
    'lr-boundary-geometry-step-1',
    'lr-boundary-normal',
    'lr-boundary-distance',
    'lr-boundary-geometry-step-2',
    'lr-boundary-level',
    'lr-boundary-vertical',
    'lr-boundary-vertical-only',
    'lr-boundary-constant',
  ],
};
