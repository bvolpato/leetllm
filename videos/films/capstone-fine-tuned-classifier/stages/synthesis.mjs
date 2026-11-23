import { GATE_CASES } from '../fixtures.mjs';
import { actualModelComparison } from '../model.mjs';
import { sceneClock } from '../desk.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const clock = sceneClock(scene, state);
  actualModelComparison().forEach((model, i) => {
    const x = i ? 1000 : 140;
    const errors = GATE_CASES.filter((ticket) => {
      const row = model.rows.find((r) => r.fixture_id === ticket.id);
      return Boolean(ticket.gold) !== row.score >= model.threshold;
    });
    api.focus.target(i ? 'route-contract' : 'model-contract', () => {
      api.text(ctx, i ? 'Tiny encoder' : 'TF-IDF baseline', x, 307, 48, C.ink, 'left', 'serif');
      api.text(
        ctx,
        model.result.decision.toUpperCase() +
          (i ? '   /   Required misses' : '   /   Extra reviews'),
        x,
        402,
        38,
        C.pink,
      );
      api.line(ctx, x, 440, x + 753, 440, C.muted, 2);
      errors.forEach((ticket, j) => {
        api.text(ctx, ticket.label, x + 20, 522 + j * 80, 35, C.ink);
        const row = model.rows.find((r) => r.fixture_id === ticket.id);
        api.text(ctx, row.score.toFixed(3), x + 730, 522 + j * 80, 35, C.muted, 'right');
      });
    });
  });
  api.focus.target('authenticated-route', () => {
    api.line(ctx, 140, 764, 1753, 764, C.muted, 2);
    api.text(ctx, 'Gate cutoff    0.35', 140, 836, 33, C.yellow);
    if (state.beat === 0) {
      api.text(
        ctx,
        'Retain the ticket text, the scoring run and the evaluator’s labels.',
        140,
        956,
        39,
        C.ink,
      );
    } else {
      const message = clock.after('synthesis-b2-1')
        ? 'Verified producer   ·   Current ticket   ·   Pinned bundle'
        : 'Downstream intake record';
      api.text(ctx, message, 140, 912, 36, C.cyan);
      if (clock.after('synthesis-b2-2'))
        api.text(ctx, 'The agent may draft a response and request approval.', 140, 992, 36, C.ink);
    }
  });
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synthesis-b1-1', 'synthesis-b1-2', 'synthesis-b2-1', 'synthesis-b2-2'],
};
