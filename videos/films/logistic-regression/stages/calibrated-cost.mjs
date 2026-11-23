import { mix, smooth } from '../construction.mjs';
import { T, mark } from '../defaults.mjs';
import { validationScores } from '../fixtures.mjs';
import { probabilityCost } from '../model.mjs';

const automaticAtOne = probabilityCost(1).automatic;
const reviewAtZero = probabilityCost(0).review;
const price = (n) => '$' + n.toFixed(2);
const ranked = [...validationScores].sort((a, b) => b.p - a.p);

export function drawCalibratedCost(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => api.focus.progress(id, 0);
  const crossing = probabilityCost(0.2).cut;
  const low = cue('lower-risk-probe');
  const solve = cue('find-crossing');
  const p = solve > 0 ? mix(0.05, crossing, smooth(solve)) : mix(0.2, 0.05, smooth(low));
  const cost = probabilityCost(p);
  const moving = (low > 0 && low < 1) || (solve > 0 && solve < 1);
  const auto = cue('lr-expected-auto');
  const review = cue('lr-expected-review');
  const priced = review === 1;
  const capacity = cue('lr-cost-capacity');
  mark(api, 'risk-plot', () => {
    const q = api.teaching.axes({
      x: 210,
      y: 352,
      width: 975,
      height: 482,
      xDomain: [0, 0.3],
      yDomain: [0, 40],
      xTicks: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
      yTicks: [0, 10, 20, 30, 40],
      xLabel: 'Probability that review is required',
      yLabel: 'Expected dollars per request',
    });
    const drawCost = (progress, key, ink) => {
      if (progress <= 0) return;
      const end = 0.3 * progress;
      const startPoint = q.point(0, probabilityCost(0)[key]);
      const endPoint = q.point(end, probabilityCost(end)[key]);
      api.line(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y, ink, 5);
    };
    drawCost(auto, 'automatic', C.pink);
    drawCost(review, 'review', C.blue);
    const foot = q.point(p, 0);
    const top = q.point(p, 40);
    api.line(ctx, foot.x, foot.y, top.x, top.y, C.muted, 2);
    const probe = moving ? 'p' : solve === 1 ? 'p ≈ ' + p.toFixed(3) : 'p = ' + p.toFixed(2);
    T(ctx, api, probe, foot.x, 264, 34, C.yellow);
    if (auto === 1) {
      const point = q.point(p, cost.automatic);
      api.circle(ctx, point.x, point.y, 12, C.pink);
    }
    if (priced) {
      const point = q.point(p, cost.review);
      api.circle(ctx, point.x, point.y, 10, solve === 1 ? C.yellow : C.blue);
    }
  });
  mark(api, 'route-prices', () => {
    if (state.beat === 5) {
      T(ctx, api, 'Eight validation scores', 1520, 358, 38);
      ranked.forEach((row, i) => {
        const x = 1298 + (i % 4) * 146;
        const y = 441 + Math.floor(i / 4) * 163;
        const review = capacity === 1 && row.p >= crossing;
        const ink = review ? C.yellow : C.muted;
        api.rect(ctx, x - 65, y, 130, 112, C.panel, ink, 8);
        T(ctx, api, row.id, x, y + 42, 32, ink);
        T(ctx, api, row.p.toFixed(3), x, y + 87, 31);
        if (capacity === 1) T(ctx, api, review ? 'Review' : 'Auto', x, y + 145, 27, ink);
      });
      return;
    }
    T(ctx, api, 'Automatic handling', 1520, 376, 38, C.pink);
    T(ctx, api, '$120 × p', 1520, 432, 38, C.ink);
    T(ctx, api, auto === 1 && !moving ? price(cost.automatic) : '?', 1520, 513, 62, C.pink);
    T(ctx, api, 'Human review', 1520, 617, 38, C.blue);
    T(ctx, api, '$18 × (1 − p)', 1520, 674, 38, C.ink);
    T(ctx, api, priced && !moving ? price(cost.review) : '?', 1520, 754, 62, C.blue);
  });
  mark(api, 'cost-rule', () => {
    let note = 'Correct decisions have zero incremental cost.';
    if (priced) note = 'Which route has the smaller expected bill?';
    if (cue('first-risk-answer') === 1 && low === 0) note = 'Choose human review at p = 0.20.';
    if (cue('second-risk-answer') === 1) note = 'Choose automatic handling at p = 0.05.';
    if (solve > 0) note = '$120p  =  $18(1 − p)';
    if (cue('lr-bayes-cut') === 1)
      note =
        'Break-even probability  =  ' +
        reviewAtZero +
        ' / (' +
        reviewAtZero +
        ' + ' +
        automaticAtOne +
        ')  ≈  ' +
        crossing.toFixed(3);
    if (capacity === 1) {
      const count = validationScores.filter((r) => r.p >= crossing).length;
      note = count + ' requests qualify for review. The desk has four slots.';
    }
    T(ctx, api, note, 960, 1000, 39, solve > 0 ? C.yellow : C.ink);
  });
}

export default {
  id: 'calibrated-cost',
  draw: drawCalibratedCost,
  cues: [
    'lr-expected-auto',
    'lr-expected-review',
    'first-risk-answer',
    'lower-risk-probe',
    'second-risk-answer',
    'find-crossing',
    'lr-bayes-cut',
    'lr-cost-capacity',
  ],
};
