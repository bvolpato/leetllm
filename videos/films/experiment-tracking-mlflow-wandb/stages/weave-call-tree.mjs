import { CASES } from '../fixtures.mjs';
import { predict } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawWeaveCallTree(ctx, scene, state, api) {
  const { C } = api;
  const at = cueClock(scene, state);
  if (!state.beat) {
    api.focus.target('call-tree', () => {
      api.text(ctx, 'Request 205', 135, 292, 48, C.ink);
      api.line(ctx, 171, 345, 171, 905, C.muted, 3);
      for (const [name, y] of [
        ['Retrieve evidence', 440],
        ['Generate answer', 795],
        ['Check answer', 925],
      ]) {
        api.line(ctx, 171, y - 21, 260, y - 21, C.muted, 3);
        api.text(ctx, name, 295, y, 43, C.cyan);
      }
      if (at('retrieval-children') > 0) {
        api.line(ctx, 331, 468, 331, 665, C.muted, 3);
        ['Embed query', 'Search index', 'Rerank results'].forEach((name, i) => {
          const y = 520 + i * 83;
          api.line(ctx, 331, y - 20, 424, y - 20, C.muted, 3);
          api.text(ctx, name, 454, y, 34, C.ink);
        });
      }
      api.text(ctx, 'Illustrative instrumented calls', 1160, 294, 32, C.muted);
    });
    return;
  }
  const rows = [CASES[0], CASES[2]];
  api.focus.target('score-rows', () => {
    api.text(ctx, 'Run 2   /   first repair', 125, 263, 36, C.cyan);
    const heads = ['Case', 'expected_route', 'output', 'exact_route'];
    const xs = [125, 680, 1100, 1460];
    heads.forEach((name, i) =>
      api.text(ctx, name, xs[i], 386, 34, C.muted, 'left', i ? 'mono' : 'sans'),
    );
    rows.forEach((row, i) => {
      const prediction = predict('first repair', row);
      const correct = row.expected === prediction;
      const y = 516 + 139 * i;
      api.text(ctx, i ? 'Rollback steps' : 'Deploy approval', xs[0], y, 40, C.ink);
      api.text(ctx, row.expected, xs[1], y, 39, C.cyan);
      api.text(ctx, prediction, xs[2], y, 39, C.ink);
      const evaluated = at(i ? 'score-rollback' : 'score-incident') === 1;
      api.text(
        ctx,
        evaluated ? (correct ? 'True' : 'False') : '·',
        xs[3],
        y,
        40,
        evaluated ? (correct ? C.green : C.pink) : C.muted,
        'left',
        'mono',
      );
    });
    api.text(
      ctx,
      'return {"exact_route": expected_route == output}',
      125,
      798,
      36,
      C.ink,
      'left',
      'mono',
    );
  });
  api.focus.target('await-eval', () =>
    api.text(ctx, 'Notebook   /   await evaluation.evaluate(candidate)', 125, 947, 36, C.cyan),
  );
}
export default {
  id: 'weave-call-tree',
  draw: drawWeaveCallTree,
  cues: [
    'request-tree',
    'retrieval-children',
    'score-incident',
    'score-rollback',
    'await-evaluation',
  ],
};
