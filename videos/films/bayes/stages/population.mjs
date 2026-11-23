import { family } from '../fixtures.mjs';
import { contourData, familyTail, passingRegion, populationFrame } from '../model.mjs';
import { caption, chart, curve, equation, ring, target, text } from '../defaults.mjs';
import { clauseEnded, event } from '../construction.mjs';
import { percent } from '../release-scale.mjs';

const easyShare = 0.2;
const bandCount = 20;
const bandProbability = (i) =>
  Math.max(0, familyTail(easyShare, i / bandCount) - familyTail(easyShare, (i + 1) / bandCount));

// Clip the region above the lower rate boundary at the parallel upper boundary.
function familyRateBand(low, high) {
  const region = passingRegion(easyShare, low);
  const distance = (point) => easyShare * point.x + (1 - easyShare) * point.y - high;
  const band = [];
  for (const [i, point] of region.entries()) {
    const next = region[(i + 1) % region.length];
    const a = distance(point),
      b = distance(next);
    if (a <= 0) band.push(point);
    if (a <= 0 !== b <= 0) {
      const t = a / (a - b);
      band.push({ x: point.x + t * (next.x - point.x), y: point.y + t * (next.y - point.y) });
    }
  }
  return band;
}

function drawProjection(ctx, api, state) {
  const { C } = api;
  const q = api.teaching.axes({
    x: 145,
    y: 370,
    width: 660,
    height: 430,
    xDomain: [0, 1],
    yDomain: [0, 1],
    xTicks: [0, 0.5, 1],
    yTicks: [0, 0.5, 1],
    xLabel: 'easy-task rate',
    yLabel: 'hard-task rate',
    fontSize: 28,
  });
  const r = api.teaching.axes({
    x: 1040,
    y: 370,
    width: 725,
    height: 430,
    xDomain: [0, 1],
    yDomain: [0, 0.25],
    xTicks: [0, 0.5, 0.7, 1],
    yTicks: [0, 0.125, 0.25],
    xLabel: 'deployment rate',
    yLabel: 'probability in each band',
    fontSize: 28,
  });
  const example = { x: 0.9, y: 0.4 };
  const projected = easyShare * example.x + (1 - easyShare) * example.y;
  const progress = event(state, 2, 'propagate-family-uncertainty', 0.37, 0.75);
  const bands = Math.min(bandCount, Math.floor(progress * bandCount));
  text(ctx, api, 'Pairs of family rates', 475, 282, 35, C.ink, 'center');
  text(ctx, api, 'Same probability, grouped by rate', 1400, 282, 35, C.ink, 'center');
  target(ctx, api, 'family-rate-pairs', () => {
    for (const contour of contourData)
      api.path(
        ctx,
        contour.points.map((p) => q.point(p.x, p.y)),
        {
          color: C.cyan + 'aa',
          fill: C.cyan + '14',
          width: 2,
          closed: true,
          clip: q.bounds,
        },
      );
    if (progress > 0 && bands < bandCount) {
      const band = familyRateBand(bands / bandCount, (bands + 1) / bandCount);
      api.path(
        ctx,
        band.map((p) => q.point(p.x, p.y)),
        {
          color: C.blue,
          fill: C.blue + '55',
          width: 3,
          closed: true,
          clip: q.bounds,
        },
      );
    } else if (bands === bandCount) {
      api.path(
        ctx,
        passingRegion(easyShare).map((p) => q.point(p.x, p.y)),
        {
          color: C.yellow,
          fill: C.yellow + '33',
          width: 2,
          closed: true,
          clip: q.bounds,
        },
      );
    }
    ring(ctx, api, q.point(example.x, example.y), C.ink, 8);
  });
  target(ctx, api, 'mixture-density', () => {
    const base = r.point(0.7, 0),
      top = r.point(0.7, 0.25);
    api.line(ctx, base.x, base.y, top.x, top.y, C.yellow, 3);
    text(ctx, api, '70% cutoff', top.x + 10, top.y + 34, 24, C.yellow);
    if (clauseEnded(state, 2, 'project-example-pair', 0.27)) {
      const hit = r.point(projected, 0);
      api.circle(ctx, hit.x, hit.y, 7, C.ink);
    }
    const visible = progress === 0 ? 0 : Math.min(bands + 1, bandCount);
    for (let i = 0; i < visible; i++) {
      const a = r.point(i / bandCount, bandProbability(i));
      const b = r.point((i + 1) / bandCount, 0);
      if (b.y - a.y < 0.02) continue;
      api.rect(
        ctx,
        a.x + 1,
        a.y,
        b.x - a.x - 2,
        b.y - a.y,
        i >= 14 ? C.yellow : i === bands ? C.blue : C.cyan,
        undefined,
        0,
        0,
      );
    }
  });
  text(ctx, api, '20% easy  ×  0.90   +   80% hard  ×  0.40', 485, 933, 30, C.ink, 'center');
  target(ctx, api, 'deployment-tail-summary', () => {
    if (bands === bandCount) {
      const measured = clauseEnded(state, 2, 'read-deployment-tail', 0.85);
      const label = measured
        ? percent(familyTail(easyShare)) + ' above the cutoff'
        : 'How much lies above 70%?';
      text(ctx, api, label, 1400, 933, 38, C.yellow, 'center');
    } else if (clauseEnded(state, 2, 'project-example-pair', 0.27)) {
      text(
        ctx,
        api,
        'This pair gives a deployment rate of ' + projected.toFixed(2),
        1400,
        933,
        30,
        C.ink,
        'center',
      );
    }
  });
  caption(ctx, api, 'Each band spans five percentage points of deployment success rate.');
}

export function drawPopulation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const v = populationFrame(state);
    if (currentBeat === 0) {
      for (const [i, row] of [family.easy, family.hard].entries()) {
        const x = i ? 1080 : 150,
          q = chart(ctx, api, {
            x,
            y: 420,
            width: 700,
            height: 360,
            max: 13,
            ticks: [0, 0.5, 1],
            xLabel: i ? 'hard-task success rate' : 'easy-task success rate',
          }),
          color = i ? themeColors.pink : themeColors.blue;
        text(
          ctx,
          api,
          (i ? 'Hard' : 'Easy') + `: ${row.passes} passes / ${row.total} tasks`,
          x + 350,
          300,
          32,
          color,
          'center',
        );
        target(ctx, api, i ? 'hard-posterior' : 'easy-posterior', () =>
          curve(ctx, api, q, row.a, row.b, color),
        );
        equation(ctx, api, `\\operatorname{Beta}(${row.a},${row.b})`, x + 350, 925, 41, color);
      }
      caption(
        ctx,
        api,
        'A new two-family model · one independent Beta(2,2) prior per family · outcomes must represent each family',
      );
    } else if (currentBeat === 1) {
      const q = api.teaching.axes({
        x: 160,
        y: 350,
        width: 840,
        height: 540,
        xDomain: [0, 1],
        yDomain: [0, 1],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.5, 1],
        xLabel: 'possible easy-task rate',
        yLabel: 'possible hard-task rate',
        fontSize: 26,
      });
      text(ctx, api, 'joint posterior density contours', 580, 275, 29, themeColors.cyan, 'center');
      api.path(
        ctx,
        passingRegion(v.weight).map((p) => q.point(p.x, p.y)),
        {
          color: themeColors.green + '44',
          fill: themeColors.green + '10',
          width: 1,
          closed: true,
          clip: q.bounds,
        },
      );
      text(ctx, api, 'rate above 0.70', 900, 400, 24, themeColors.green, 'center');
      for (const contour of contourData)
        api.path(
          ctx,
          contour.points.map((p) => q.point(p.x, p.y)),
          {
            color: themeColors.cyan + '99',
            fill: themeColors.cyan + '10',
            closed: true,
            width: 2,
            clip: q.bounds,
          },
        );
      const y0 = (0.7 - v.weight) / (1 - v.weight),
        y1 = 0.7 / (1 - v.weight),
        cross = [
          {
            x: 0,
            y: y1,
          },
          {
            x: 1,
            y: y0,
          },
        ];
      target(ctx, api, 'traffic-boundary', () =>
        api.teaching.curve({
          plot: q,
          points: cross,
          color: themeColors.yellow,
          width: 5,
        }),
      );
      ring(ctx, api, q.point(74 / 84, 10 / 24), themeColors.green, 10);
      text(
        ctx,
        api,
        v.complete ? 'Deployment mix' : 'Benchmark-to-deployment mix',
        1490,
        330,
        31,
        themeColors.ink,
        'center',
      );
      target(ctx, api, 'traffic-shares', () => {
        api.rect(ctx, 1190, 420, 600 * v.weight, 65, themeColors.blue);
        api.rect(ctx, 1190 + 600 * v.weight, 420, 600 * (1 - v.weight), 65, themeColors.pink);
        text(
          ctx,
          api,
          'easy ' + (v.weight * 100).toFixed(0) + '%',
          1260,
          550,
          27,
          themeColors.blue,
          'center',
        );
        text(
          ctx,
          api,
          'hard ' + ((1 - v.weight) * 100).toFixed(0) + '%',
          1710,
          550,
          27,
          themeColors.pink,
          'center',
        );
      });
      equation(ctx, api, 'p_d=w_ep_e+w_hp_h', 1490, 625, 37, themeColors.yellow);
      target(ctx, api, 'deployment-forecast', () => {
        equation(ctx, api, `E[p_d]\\approx${v.mean.toFixed(3)}`, 1490, 710, 41, themeColors.green);
        if (v.progress === 0)
          equation(
            ctx,
            api,
            `P(p_d>0.7)\\approx${(100 * v.tail).toFixed(2)}\\%`,
            1490,
            850,
            39,
            themeColors.yellow,
          );
        else
          text(
            ctx,
            api,
            'How much probability clears the cutoff?',
            1490,
            850,
            30,
            themeColors.yellow,
            'center',
          );
      });
      caption(
        ctx,
        api,
        'The family posterior weight stays fixed · changing traffic shares moves the same release boundary',
      );
    } else {
      drawProjection(ctx, api, state);
    }
  }
}
export default {
  id: 'population',
  draw: drawPopulation,
  cues: [
    'fit-family-rates',
    'change-traffic-mix',
    'project-example-pair',
    'propagate-family-uncertainty',
    'read-deployment-tail',
  ],
};
