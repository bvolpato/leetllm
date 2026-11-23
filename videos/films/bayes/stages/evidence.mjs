import { betaDensity } from '../arithmetic.mjs';
import { clauseEnded, event } from '../construction.mjs';
import { evidenceSnapshot } from '../model.mjs';
import { areaFill, caption, chart, curve, target, text } from '../defaults.mjs';
import { massRuler, percent } from '../release-scale.mjs';

export function drawEvidence(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const progress =
    beat === 1
      ? event(state, 1, 'larger-posterior-b1-1')
      : event(state, 2, 'release-tail-growth', 0.03, 0.35);
  const v = evidenceSnapshot(Math.max(0, beat - 1), beat ? progress : 0);
  const q = chart(ctx, api, { max: 11, width: 1055 });
  const alternative = beat > 0;
  target(ctx, api, 'small-posterior', () => {
    curve(ctx, api, q, 10, 4, C.blue);
    text(ctx, api, '8 / 10 reference', 185, 291, 32, C.blue);
  });
  target(ctx, api, 'larger-posterior', () => {
    if (alternative) {
      areaFill(ctx, api, q, (x) => betaDensity(v.a, v.b, x), 0.7, 1, C.cyan);
      curve(ctx, api, q, v.a, v.b, C.cyan);
    }
    text(
      ctx,
      api,
      alternative ? v.passes + ' / ' + v.total + ' alternative' : '80 / 100 alternative',
      1165,
      291,
      32,
      C.cyan,
      'right',
    );
  });
  const a = q.point(0.7, 0),
    z = q.point(0.7, 10.7);
  api.line(ctx, a.x, a.y, z.x, z.y, C.yellow, 3);
  target(ctx, api, 'posterior-tail-comparison', () => {
    for (const [i, row] of [
      { label: 'Ten tasks', mass: v.referenceTail, color: C.blue },
      { label: 'Alternative sample', mass: alternative ? v.tail : null, color: C.cyan },
    ].entries()) {
      const y = 370 + i * 285;
      text(ctx, api, row.label, 1290, y, 32, row.color);
      text(ctx, api, row.mass == null ? '?' : percent(row.mass), 1785, y, 47, row.color, 'right');
      massRuler(ctx, api, { x: 1290, y: y + 111, width: 495, mass: row.mass });
    }
    if (clauseEnded(state, 2, 'hundred-task-decision', 0.8))
      text(ctx, api, 'Evidence rule met', 1540, 940, 36, C.green, 'center');
  });
  caption(
    ctx,
    api,
    'Separate evaluations   ·   same Beta(2,2) prior   ·   same observed pass fraction',
  );
}
export default {
  id: 'evidence',
  draw: drawEvidence,
  cues: ['larger-posterior-b1-1', 'release-tail-growth', 'hundred-task-decision'],
};
