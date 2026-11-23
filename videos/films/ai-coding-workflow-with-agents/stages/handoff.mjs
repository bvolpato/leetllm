import { replay, replayEvidence } from '../model.mjs';
import { cueStep, shortInvoice } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

export function drawHandoff(ctx, scene, state, api) {
  const { C } = api;
  const moved = cueStep(state, 'handoff-advance', 1, 0.1, 0.3) === 1;
  const targetMoved = cueStep(state, 'handoff-target', 1, 0.36, 0.51) === 1;
  text(ctx, api, 'Retained run   /   unchanged verifier K', 125, 275, 42, C.ink);
  api.rect(ctx, 120, 345, 1010, 477, C.panel, undefined, 10);
  const base = replay(false, 3),
    candidate = replay(true, 3);
  text(ctx, api, 'Run', 165, 415, 30, C.muted);
  text(ctx, api, 'Returns', 387, 415, 30, C.muted);
  text(ctx, api, 'Rows', 770, 415, 30, C.muted);
  text(ctx, api, 'Result', 932, 415, 30, C.muted);
  [base, candidate].forEach((store, i) => {
    const y = 530 + 112 * i;
    const pass = replayEvidence(store).every((c) => c.passed);
    api.line(ctx, 165, y - 71, 1085, y - 71, C.muted, 1);
    api.focus.target('before-after', () => {
      text(ctx, api, i ? 'C' : 'Base', 165, y, 44, C.ink);
      text(
        ctx,
        api,
        store.deliveries.map((row) => shortInvoice(row.invoice)).join('   '),
        387,
        y,
        40,
        C.ink,
      );
      text(ctx, api, store.count, 770, y, 43, C.ink);
      text(ctx, api, pass ? 'Pass' : 'Fail', 932, y, 38, pass ? C.green : C.pink);
    });
  });
  api.focus.target('bounded-diff', () =>
    text(ctx, api, 'webhook.ts  +  webhook.test.ts', 165, 762, 35, C.blue),
  );
  api.focus.target('review-head', () => {
    text(ctx, api, 'Branch under review', 1225, 416, 36, C.muted);
    text(ctx, api, moved ? 'D' : 'C', 1225, 570, 111, moved ? C.yellow : C.blue);
  });
  api.focus.target('review-target', () => {
    text(ctx, api, 'Target branch', 1225, 690, 35, C.muted);
    text(ctx, api, targetMoved ? 'T2' : 'T1', 1225, 783, 62, targetMoved ? C.yellow : C.blue);
  });
  text(
    ctx,
    api,
    moved
      ? 'C’s receipt stays with C. Test D and refresh its review.'
      : 'Evidence covers the sequential fixture on C.',
    120,
    973,
    40,
    C.yellow,
  );
}

export default {
  id: 'handoff',
  draw: drawHandoff,
  cues: ['handoff-files', 'handoff-results', 'handoff-advance', 'handoff-target'],
};
