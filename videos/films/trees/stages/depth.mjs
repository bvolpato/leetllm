import { laterCases, stump, tree } from '../fixtures.mjs';
import { policyCosts } from '../model.mjs';
import { totalCost } from '../arithmetic.mjs';
import { drawConstructionText as label } from '../defaults.mjs';
import { ambiguityX as x, drawAmbiguityStrip, drawLegend } from '../ambiguity-strip.mjs';

export function drawDepth(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const reached = (id, n, a, z) =>
    beat > n || (beat === n && api.focus.progress(id, api.phase(p, a, z)) === 1);
  const branch1 = reached('first-inner', 0, 0.21, 0.36);
  const branch2 = reached('second-inner', 0, 0.46, 0.58);
  drawLegend(ctx, api);
  drawAmbiguityStrip(ctx, api, { cut: stump.cut, y: 438 });
  const inner = [
    [tree.left.cut, branch1, 'first-branch'],
    [tree.left.right.cut, branch2, 'second-branch'],
  ];
  inner.forEach(([value, exists, id]) => {
    api.focus.target(id, () => {
      const at = x(value);
      api.line(ctx, at, 376, at, exists ? 545 : 391, exists ? C.cyan : C.muted, 4);
      if (exists) label(ctx, api, value.toFixed(2), at, 341, 32, C.cyan);
    });
  });
  if (branch2) {
    const left = x(inner[0][0]),
      right = x(inner[1][0]);
    api.path(
      ctx,
      [
        { x: left, y: 555 },
        { x: left, y: 586 },
        { x: right, y: 586 },
        { x: right, y: 555 },
      ],
      { color: C.pink, width: 5 },
    );
    label(ctx, api, 'Review leaf · 1 training row', (left + right) / 2, 650, 30, C.pink);
  }
  if (beat === 0) return;
  const showSecond = reached('veight-arrives', 2, 0.35, 0.58);
  const routed = [reached('vtwo-route', 2, 0, 0.09), reached('veight-route', 2, 0.58, 0.72)];
  const truth = [reached('vtwo-label', 2, 0.1, 0.27), reached('veight-label', 2, 0.72, 0.9)];
  const entries = policyCosts(tree, 0.5, laterCases);
  api.focus.target('later-cases', () => {
    entries.slice(0, showSecond ? 2 : 1).forEach(({ row, review, cost }, i) => {
      const at = x(row[0]);
      const name = i ? 'V8' : 'V2';
      api.circle(ctx, at, 728, 24, truth[i] ? (row[2] ? C.pink : C.blue) : C.yellow);
      label(ctx, api, name + ' · ' + row[0].toFixed(1), at, 802, 34);
      let action = 'Which route?';
      if (routed[i]) action = review ? 'Queue' : 'Automatic';
      label(ctx, api, action, at, 867, 36, C.ink);
      if (truth[i])
        label(ctx, api, (row[2] ? 'Miss' : 'Extra review') + '  $' + cost, at, 918, 31, C.yellow);
    });
  });
  if (beat >= 3)
    label(
      ctx,
      api,
      'Eight validation requests at cutoff 0.50     ·     Deep tree $' +
        totalCost(policyCosts(tree)) +
        '     ·     Stump $240',
      960,
      1010,
      35,
      C.ink,
    );
}
export default {
  id: 'depth',
  draw: drawDepth,
  cues: [
    'first-inner',
    'second-inner',
    'vtwo-route',
    'vtwo-label',
    'veight-arrives',
    'veight-route',
    'veight-label',
  ],
};
