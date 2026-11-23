import { arrow, dot, focusTargets, pointCurve } from '../defaults.mjs';
import { labels } from '../fixtures.mjs';
import { sundayQuestion } from '../library-shelf.mjs';

const hoursLogit = 1.2;
const eventsLogit = 0.2;
const positiveLoss = (z) => Math.log1p(Math.exp(-z));
const negativeLoss = (z) => Math.log1p(Math.exp(z));

function drawBinary(ctx, api) {
  const { C, focus, teaching } = api;
  const plot = teaching.axes({
    x: 210,
    y: 404,
    width: 875,
    height: 440,
    xDomain: [-3, 3],
    yDomain: [0, 3.2],
    xTicks: [-3, 0, 3],
    yTicks: [0, 1, 2, 3],
    xLabel: 'pair logit',
    yLabel: 'binary loss',
    fontSize: 29,
    color: C.muted,
  });
  const examples = [
    {
      name: 'Opening hours',
      label: 'relevant',
      z: hoursLogit,
      loss: positiveLoss,
      formula: '−log σ(z)',
      color: C.green,
      cue: 'higher-hours',
    },
    {
      name: 'Story time',
      label: 'irrelevant',
      z: eventsLogit,
      loss: negativeLoss,
      formula: '−log (1 − σ(z))',
      color: C.pink,
      cue: 'higher-events',
    },
  ];
  examples.forEach(({ name, label, z, loss, formula, color, cue }, i) => {
    const y = 452 + 180 * i;
    pointCurve(ctx, api, plot, loss, color, -3, 3);
    api.text(ctx, name + '  ·  ' + label, 1190, y, 40, color);
    api.text(ctx, formula, 1190, y + 58, 35, C.ink);
    if (focus.visible('loss-pairs')) {
      const pt = plot.point(z, loss(z));
      dot(ctx, api, pt.x, pt.y, 11, color);
      api.text(
        ctx,
        'logit ' + z.toFixed(1) + '    loss ' + loss(z).toFixed(3),
        1190,
        y + 108,
        31,
        C.muted,
      );
    }
    const progress = focus.progress(cue, 0);
    if (progress > 0 && !focus.visible('binary-loss')) {
      const tip = z + progress;
      arrow(
        ctx,
        api,
        plot.point(tip - 0.16, loss(tip - 0.16)),
        plot.point(tip, loss(tip)),
        color,
        5,
      );
    }
  });
  if (focus.progress('binary-loss', 0) === 1) {
    const mean = (positiveLoss(hoursLogit) + negativeLoss(eventsLogit)) / 2;
    api.math(
      ctx,
      String.raw`\mathrm{mean\ loss\ (3\ d.p.)}=${mean.toFixed(3)}`,
      1480,
      865,
      38,
      C.yellow,
      'center',
    );
  }
}

function drawGap(ctx, api) {
  const { C, focus, teaching } = api;
  const swap = focus.progress('swap-gap', 0);
  // Move in hundredths so the two printed operands always explain the dot.
  const movedHundredths = Math.floor((hoursLogit - eventsLogit) * 100 * swap);
  const hours = (Math.round(hoursLogit * 100) - movedHundredths) / 100;
  const events = (Math.round(eventsLogit * 100) + movedHundredths) / 100;
  const gap = hours - events;
  const loss = positiveLoss(gap);
  const plot = teaching.axes({
    x: 210,
    y: 406,
    width: 845,
    height: 438,
    xDomain: [-2.5, 2.5],
    yDomain: [0, 3],
    xTicks: [-2, -1, 0, 1, 2],
    yTicks: [0, 1, 2, 3],
    xLabel: 'gap = hours − story time',
    yLabel: 'pairwise loss',
    fontSize: 29,
    color: C.muted,
  });
  pointCurve(ctx, api, plot, positiveLoss, C.cyan, -2.5, 2.5);
  const orderColor = gap > 0 ? C.green : gap < 0 ? C.pink : C.yellow;
  if (focus.visible('score-gap')) {
    const pt = plot.point(gap, loss);
    api.line(ctx, pt.x, pt.y, pt.x, plot.point(gap, 0).y, C.yellow, 2);
    dot(ctx, api, pt.x, pt.y, 11, orderColor);
    api.text(ctx, 'Δ = ' + gap.toFixed(2), pt.x + 30, pt.y - 18, 33, C.yellow);
  }
  api.text(ctx, 'Opening hours', 1170, 467, 39, C.green);
  api.text(ctx, hours.toFixed(2), 1758, 467, 44, C.ink, 'right');
  api.text(ctx, 'Story time', 1170, 547, 39, C.pink);
  api.text(ctx, events.toFixed(2), 1758, 547, 44, C.ink, 'right');
  api.math(ctx, String.raw`L=\log(1+e^{-\Delta})`, 1470, 680, 44, C.cyan, 'center');
  if (focus.progress('gap-loss', 0) === 1)
    api.math(
      ctx,
      String.raw`\Delta=${gap.toFixed(2)}\quad L=${loss.toFixed(3)}`,
      1470,
      800,
      41,
      orderColor,
      'center',
    );
}

function drawServing(ctx, api) {
  const { C, focus } = api;
  const completed = Math.floor(focus.progress('pair-work', 0) * labels.length);
  api.text(ctx, 'Retrieved passage', 150, 395, 36, C.muted);
  api.text(ctx, 'Frozen scorer', 853, 395, 36, C.muted);
  api.text(ctx, 'Scores returned', 1465, 395, 36, C.muted);
  labels.forEach((label, i) => {
    const y = 515 + i * 120;
    api.text(ctx, label, 150, y, 42, C.ink);
    arrow(ctx, api, { x: 575, y: y - 13 }, { x: 770, y: y - 13 }, C.muted);
    api.text(ctx, 'f(question, passage)', 853, y, 37, C.cyan);
    if (i < completed) api.text(ctx, ['s₁', 's₂', 's₃'][i], 1470, y, 44, C.yellow);
  });
  if (focus.visible('heldout-split'))
    api.text(
      ctx,
      'Keep related questions and passages on the same side of the split.',
      150,
      955,
      37,
      C.ink,
    );
}

export function drawRankingLosses(ctx, scene, state, api) {
  api.text(ctx, sundayQuestion, 150, 279, 48, api.C.ink);
  if (state.beat === 1)
    focusTargets(ctx, api, ['score-gap', 'gap-loss', 'swap-gap'], () => drawGap(ctx, api));
  else if (state.beat === 2)
    focusTargets(ctx, api, ['pair-work', 'heldout-split'], () => drawServing(ctx, api));
  else
    focusTargets(ctx, api, ['loss-pairs', 'higher-hours', 'higher-events', 'binary-loss'], () =>
      drawBinary(ctx, api),
    );
}

export default {
  id: 'ranking-losses',
  draw: drawRankingLosses,
  cues: [
    'loss-pairs',
    'higher-hours',
    'higher-events',
    'binary-loss',
    'score-gap',
    'gap-loss',
    'swap-gap',
    'pair-work',
    'heldout-split',
  ],
};
