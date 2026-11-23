import { betaDensity, betaTailProbability } from '../arithmetic.mjs';
import { clauseEnded, event } from '../construction.mjs';
import { areaFill, chart, curve, target, text } from '../defaults.mjs';
import { observed, releasePolicy } from '../fixtures.mjs';
import { massRuler, percent } from '../release-scale.mjs';

const passes = observed.filter((row) => row.pass).length;
const a = 2 + passes;
const b = 2 + observed.length - passes;
const { rateCutoff } = releasePolicy;
const tail = betaTailProbability(a, b, rateCutoff);

function taskMark(ctx, api, index, pass) {
  const x = 150 + (index % 5) * 121;
  const y = 555 + Math.floor(index / 5) * 110;
  const color = pass ? api.C.green : api.C.red;
  api.rect(ctx, x, y, 99, 90, color + '26', color, 13);
  if (pass) {
    api.path(
      ctx,
      [
        { x: x + 23, y: y + 45 },
        { x: x + 42, y: y + 64 },
        { x: x + 78, y: y + 25 },
      ],
      { color, width: 9 },
    );
  } else {
    api.line(ctx, x + 32, y + 27, x + 67, y + 62, color, 9);
    api.line(ctx, x + 67, y + 27, x + 32, y + 62, color, 9);
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  text(ctx, api, 'Coding tasks passed', 150, 303, 40, C.ink);
  text(ctx, api, passes + ' / ' + observed.length, 141, 487, 152, C.ink);
  for (const pass of [true, false]) {
    target(ctx, api, pass ? 'intro-passes' : 'intro-failures', () => {
      observed.forEach((row, i) => {
        if (row.pass === pass) taskMark(ctx, api, i, pass);
      });
    });
  }

  text(ctx, api, 'Possible success rates', 925, 303, 40, C.ink);
  const q = chart(ctx, api, {
    x: 926,
    y: 414,
    width: 837,
    height: 275,
    max: 4,
    xLabel: 'success rate on new tasks',
    ticks: [0, 0.5, 0.7, 1],
  });
  const sweep = event(state, 1, 'opening-sweep', 0.65, 0.85);
  const right = rateCutoff + (1 - rateCutoff) * sweep;
  target(ctx, api, 'opening-density', () => {
    areaFill(ctx, api, q, (p) => betaDensity(a, b, p), rateCutoff, right, C.blue, '72');
    curve(ctx, api, q, a, b, C.blue, 6);
  });
  target(ctx, api, 'rate-cutoff', () => {
    const top = q.point(rateCutoff, 4);
    api.line(ctx, top.x, top.y, top.x, q.point(rateCutoff, 0).y, C.yellow, 4);
    text(ctx, api, '70% cutoff', top.x, top.y - 18, 28, C.yellow, 'center');
  });

  const measured = clauseEnded(state, 2, 'opening-reading', 0.24);
  target(ctx, api, 'release-rule', () => {
    const mass = tail - betaTailProbability(a, b, right);
    text(ctx, api, 'Probability above cutoff', 926, 869, 31, C.ink);
    massRuler(ctx, api, { x: 926, y: 923, width: 837, mass });
    if (measured) text(ctx, api, percent(tail), 1450, 869, 44, C.blue, 'right');
  });
  if (clauseEnded(state, 2, 'opening-decision', 0.47)) {
    text(ctx, api, 'Hold traffic', 150, 905, 58, C.ink);
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'read-passes',
    'read-failures',
    'required-confidence',
    'rate-cutoff',
    'opening-sweep',
    'opening-reading',
    'opening-decision',
  ],
};
