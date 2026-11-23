import { drawScoreDesk, sceneClock } from '../desk.mjs';
import { GATE_CASES } from '../fixtures.mjs';
import { evaluateGate } from '../model.mjs';

const tickets = GATE_CASES.map((row) => ({ id: row.label, p: row.score, y: row.gold }));
const submitted = GATE_CASES.map((row) => ({ fixture_id: row.id, score: row.score }));
const bundles = [0.5, 0.35].map((cutoff) => ({ cutoff, ...evaluateGate(submitted, cutoff) }));

export function drawFrozenGate(ctx, scene, state, api) {
  const { C } = api;
  const clock = sceneClock(scene, state);
  const version = clock.progress('gate-v2-cut') > 0 ? 1 : 0;
  api.text(
    ctx,
    'Six new gate tickets    /    supplied scores    /    bundle v' + (version + 1),
    122,
    242,
    33,
    C.muted,
  );
  api.focus.target('gate-tracks', () => {
    drawScoreDesk(ctx, api, tickets, bundles[version].cutoff, {
      firstY: 414,
      spacing: 66,
      showRoutes: state.beat >= 1,
    });
  });
  api.focus.target('gate-receipts', () => {
    bundles.forEach((bundle, i) => {
      const x = i ? 1000 : 122;
      const visible = clock.after(i ? 'gate-v2' : 'gate-v1');
      api.line(ctx, x, 828, x + 800, 828, C.muted, 2);
      api.text(
        ctx,
        'Bundle v' + (i + 1) + '    /    ' + bundle.cutoff.toFixed(2),
        x,
        878,
        33,
        C.ink,
      );
      if (visible) {
        const label = bundle.decision === 'hold' ? 'HOLD' : 'Arithmetic pass';
        api.text(
          ctx,
          label + '   ·   ' + bundle.FN + ' missed   ·   ' + bundle.FP + ' extra',
          x,
          943,
          35,
          bundle.FN ? C.pink : C.cyan,
        );
      }
    });
    api.text(
      ctx,
      'Limits   /   0 required misses and at most 1 extra review',
      122,
      1019,
      31,
      C.muted,
    );
  });
}

export default {
  id: 'frozen-gate',
  draw: drawFrozenGate,
  cues: ['gate-new-ids', 'gate-v1', 'gate-v2-cut', 'gate-v2', 'gate-consumed'],
};
