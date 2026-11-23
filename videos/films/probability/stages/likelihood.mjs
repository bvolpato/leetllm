import { mix } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { likelihoodSnapshot } from '../model.mjs';
import { box, detailText, equation, focus, focusTarget, rectangle, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
function drawLikelihood(ctx, state, api) {
  const snap = likelihoodSnapshot(state.beat ?? 0, state.beatP ?? 0, state.cues),
    b = state.beat ?? 0;
  focus(api, 'likelihood-products', () => {
    ['abuse', 'clean', 'abuse'].forEach((value, i) => {
      const x = 250 + i * 540,
        color = i === 1 ? api.C.blue : api.C.red;
      box(ctx, api, value, x, 300, 360, 85, color, 39);
      text(ctx, api, i === 1 ? '1 − p' : 'p', x + 180, 455, 38, color);
      text(
        ctx,
        api,
        i < snap.count ? snap.factors[i].toFixed(3) : '?',
        x + 180,
        535,
        42,
        api.C.yellow,
      );
    });
    text(ctx, api, 'Candidate p = ' + snap.p.toFixed(3), 960, 635, 38, api.C.cyan);
    text(
      ctx,
      api,
      snap.complete
        ? 'L(p) = ' + snap.product.toFixed(4)
        : snap.count
          ? 'Factors: ' + snap.count + ' · partial product ' + snap.product.toFixed(4)
          : 'Product pending',
      960,
      720,
      42,
      api.C.yellow,
    );
  });
  focus(api, 'likelihood-curve', () => {
    if (b === 2) {
      const plot = api.teaching.axes({
        x: 350,
        y: 805,
        width: 1200,
        height: 155,
        xDomain: [0, 1],
        yDomain: [0, 0.17],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.15],
        xLabel: 'candidate queue rate',
        yLabel: 'L(p)',
      });
      api.teaching.curve({
        plot,
        points: sampleFunction((p) => p * p * (1 - p), 0, 1, 120),
        color: api.C.muted,
        width: 3,
      });
      const trail = Array.from(
        {
          length: 40,
        },
        (_, i) => {
          const p = mix(0.8, snap.p, i / 39);
          return {
            x: p,
            y: p * p * (1 - p),
          };
        },
      );
      api.teaching.curve({
        plot,
        points: trail,
        color: api.C.yellow,
        width: 5,
      });
      const point = plot.point(snap.p, snap.product);
      api.circle(ctx, point.x, point.y, 9, api.C.pink);
    } else
      text(
        ctx,
        api,
        'Fixed ordered labels · supplied independent-label model',
        960,
        900,
        31,
        api.C.muted,
      );
  });
}
export function drawLikelihoodStage(ctx, scene, state, api) {
  if (drawAdditional(ctx, scene, state, api)) return;
  drawLikelihood(ctx, state, api);
}
function drawAdditional(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const countLikelihood = currentBeat >= 3;
  if (!countLikelihood) return false;
  const { C: themeColors } = api,
    E = (beat, id) => cueProgress(state, id, beat);
  if (countLikelihood) {
    detailText(
      ctx,
      api,
      'Two abuse labels in any order   ·   candidate rate p = 2/3',
      960,
      295,
      37,
      themeColors.ink,
    );
    const q = E(3, 'count-sequences'),
      n = Math.floor(3 * q + 1e-9);
    [
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 1],
    ].forEach((labels, i) => {
      const x = 330 + i * 620;
      detailText(ctx, api, 'Sequence ' + (i + 1), x + 110, 380, 30, themeColors.muted);
      labels.forEach((v, j) => {
        rectangle(
          ctx,
          api,
          x + j * 95,
          480,
          80,
          100,
          i < n ? (v ? themeColors.red : themeColors.blue) : themeColors.panel,
          i < n ? undefined : themeColors.muted,
        );
        if (i < n) detailText(
          ctx,
          api,
          v ? 'A' : 'C',
          x + j * 95 + 40,
          545,
          34,
          i < n ? themeColors.bg : themeColors.muted,
        );
      });
      if (i < n) equation(ctx, api, 'p^2(1-p)=4/27', x + 130, 740, 36, themeColors.yellow);
    });
    focusTarget(ctx, api, 'count-likelihood', () =>
      equation(
        ctx,
        api,
        E(3, 'count-answer') === 1 ? 'P(count=2)=3p^2(1-p)=4/9' : `P_{seen}=${n}\\times4/27`,
        960,
        960,
        48,
        themeColors.yellow,
      ),
    );
    return true;
  }
  return true;
}
export default {
  id: 'likelihood',
  draw: drawLikelihoodStage,
  cues: [
    'likelihood-factors',
    'likelihood-candidate',
    'likelihood-maximum',
    'count-sequences',
    'count-answer',
  ],
};
