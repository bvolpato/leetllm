import { sceneClock } from '../desk.mjs';
import { GATE_CASES } from '../fixtures.mjs';
import { actualModelComparison } from '../model.mjs';

const models = actualModelComparison();
const budget = 1;

export function drawActualModelGate(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  api.text(
    ctx,
    'Gate budget     0 required misses     /     at most 1 routine review',
    110,
    237,
    36,
    C.ink,
  );
  api.text(ctx, 'Evaluator’s ticket', 110, 337, 29, C.muted);
  api.focus.target('model-rulers', () => {
    GATE_CASES.forEach((r, i) => {
      const y = 414 + i * 64;
      api.text(ctx, r.label, 110, y + 9, 30, C.ink);
      api.text(ctx, r.gold ? 'Urgent' : 'Routine', 491, y + 9, 27, C.muted);
    });
    models.forEach((model, j) => {
      const start = 670 + j * 606;
      const width = 360;
      const cutoffX = start + width * model.threshold;
      api.text(ctx, j ? 'Tiny encoder' : 'TF-IDF baseline', start, 313, 37, C.ink);
      api.text(ctx, 'Cutoff ' + model.threshold.toFixed(2), cutoffX, 368, 25, C.yellow, 'center');
      api.rect(ctx, cutoffX, 387, start + width - cutoffX, 373, '#10252f', null, 0);
      api.line(ctx, cutoffX, 387, cutoffX, 760, C.yellow, 3);
      const scored = clock.progress('actual-score');
      GATE_CASES.forEach((ticket, i) => {
        const y = 414 + i * 64;
        api.line(ctx, start, y, start + width, y, C.muted, 1.5);
        if (scored <= i / GATE_CASES.length) return;
        const score = model.rows.find((r) => r.fixture_id === ticket.id).score;
        const review = score >= model.threshold;
        const countError = j ? clock.progress('actual-misses') : clock.progress('actual-capacity');
        const mismatched = review !== Boolean(ticket.gold);
        const color = countError > 0 && mismatched ? C.pink : C.ink;
        api.circle(ctx, start + width * score, y, 11, color);
        const readout = score < 0.001 ? score.toExponential(1) : score.toFixed(3);
        api.text(ctx, readout, start + width + 22, y + 10, 28, color);
      });
    });
  });
  api.focus.target('model-ledger', () => {
    models.forEach((model, j) => {
      const x = 110 + j * 875;
      const { FP, FN, decision } = model.result;
      const progress = clock.progress(j ? 'actual-misses' : 'actual-capacity');
      const hold = clock.after(j ? 'actual-tiny-hold' : 'actual-baseline-hold');
      const count = j ? FN : FP;
      const limit = j ? 0 : budget;
      api.line(ctx, x, 806, x + 805, 806, C.muted, 2);
      const name = j ? 'Tiny encoder' : 'TF-IDF baseline';
      const countLabel = j ? 'Required misses' : 'Routine reviews';
      api.text(
        ctx,
        name + '   /   ' + (progress > 0 ? countLabel : 'Gate record'),
        x,
        863,
        34,
        C.ink,
      );
      if (progress > 0) {
        for (let i = 0; i < count; i++) {
          const active = progress > i / count;
          api.rect(
            ctx,
            x + i * 70,
            903,
            54,
            44,
            active ? (i < limit ? C.blue : C.pink) : C.panel,
            C.muted,
            5,
          );
        }
        api.text(ctx, 'Limit  ' + limit, x, 1009, 30, C.muted);
      }
      if (hold) {
        const reason = j ? FN + ' misses' : FP + ' extra reviews';
        api.text(
          ctx,
          decision.toUpperCase() + '   /   ' + reason,
          x + 778,
          941,
          40,
          C.pink,
          'right',
        );
      }
    });
  });
  if (state.beat === 0)
    api.text(ctx, 'Does either model meet both limits?', 960, 984, 39, C.ink, 'center');
}

export default {
  id: 'actual-model-gate',
  draw: drawActualModelGate,
  cues: [
    'actual-score',
    'actual-capacity',
    'actual-baseline-hold',
    'actual-misses',
    'actual-tiny-hold',
  ],
};
