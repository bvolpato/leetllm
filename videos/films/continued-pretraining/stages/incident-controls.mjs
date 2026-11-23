import { phraseProgress } from '../construction.mjs';

export function drawIncidentControls(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    api.text(ctx, '03:00   /   AUTH_TIMEOUT', 160, 292, 44, C.yellow, 'left', 'mono');
    api.text(ctx, 'Payment retries exhaust the worker connection pool.', 160, 380, 51, C.ink);
    const source = phraseProgress(state, 'incident-evidence', 0);
    const supplied = phraseProgress(state, 'incident-supply', 1);
    const repaired = phraseProgress(state, 'incident-reply', 1, 0.22, 0.48) > 0;
    api.focus.target('runbook-excerpt', () => {
      api.text(ctx, 'Runbook excerpt', 160, 520, 34, C.muted);
      if (source > 0) {
        api.text(ctx, 'Retry with jitter.', 160, 610, 43, C.cyan);
        api.text(ctx, 'Include the idempotency token.', 160, 680, 38, C.cyan);
      }
      if (supplied > 0) api.arrow(ctx, 775, 597, 775 + 172 * supplied, 597, C.cyan, 4);
    });
    api.focus.target('incident-answer', () => {
      api.text(
        ctx,
        supplied > 0 ? 'Same model with the excerpt' : 'Base model’s reply',
        1020,
        520,
        34,
        C.muted,
      );
      api.text(
        ctx,
        repaired ? 'Use jittered retries.' : '“Verify your Wi-Fi settings.”',
        1020,
        610,
        43,
        repaired ? C.green : C.pink,
      );
      if (repaired) api.text(ctx, 'Include the idempotency token.', 1020, 680, 38, C.green);
    });
    if (phraseProgress(state, 'incident-pair', 1, 0.55, 0.85) > 0) {
      api.focus.target('training-pair', () => {
        api.line(ctx, 160, 772, 1755, 772, C.muted, 2);
        api.text(ctx, 'Which training stage changes the answer?', 160, 848, 36, C.yellow);
        api.text(ctx, 'Base → supervised tuning', 160, 943, 40, C.ink);
        api.text(ctx, 'Base → domain text → same tuning', 935, 943, 40, C.cyan);
      });
    }
  } else {
    const size = 3 + Math.round(6 * phraseProgress(state, 'incident-length', 2));
    api.focus.target('attention-pairs', () => {
      for (let row = 0; row < size; row++)
        for (let col = 0; col < size; col++) {
          api.rect(
            ctx,
            177 + 58 * col,
            344 + 58 * row,
            49,
            49,
            row < 3 && col < 3 ? C.blue : C.cyan,
            undefined,
            3,
          );
        }
      api.text(
        ctx,
        size + ' × ' + size + ' = ' + size * size + ' full-attention pairs',
        177,
        956,
        40,
        C.ink,
      );
    });
    api.text(ctx, 'Longer retrieved context', 915, 369, 46, C.ink);
    api.text(ctx, 'Pairwise prefill work at fixed width', 915, 463, 35, C.muted);
    api.text(ctx, 'End-to-end measures', 915, 670, 42, C.yellow);
    api.text(ctx, 'Time to a supported answer', 915, 751, 38, C.ink);
    api.text(ctx, 'Held-out task accuracy', 915, 825, 38, C.ink);
  }
}

export default {
  id: 'incident-controls',
  draw: drawIncidentControls,
  cues: [
    'incident-answer',
    'incident-evidence',
    'incident-supply',
    'incident-reply',
    'incident-pair',
    'incident-length',
  ],
};
