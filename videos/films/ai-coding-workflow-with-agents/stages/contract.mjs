import { runnerCapability } from '../model.mjs';
import { cueStep } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

export function drawContract(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('task-invariant', () =>
    text(ctx, api, 'One event key   →   one stored invoice', 120, 274, 47, C.ink),
  );
  if (state.beat === 0) {
    const rows = [
      ['Owned files', 'billing/webhook.ts   +   billing/webhook.test.ts'],
      ['Local checks', 'Same key twice, a new key, billing suite and lint'],
      ['Delivery', 'Tested local patch and receipts'],
      ['Stop', 'Three failed repairs after the base run'],
    ];
    rows.forEach(([field, value], i) => {
      const y = 435 + i * 148;
      api.line(ctx, 120, y - 72, 1800, y - 72, C.muted, 1);
      text(ctx, api, field, 120, y, 37, C.muted);
      api.focus.target('task-contract', () =>
        text(ctx, api, value, 575, y, 38, i ? C.ink : C.blue),
      );
    });
    return;
  }
  const found = cueStep(state, 'contract-discovery', 1, 0.04, 0.22);
  const asked = cueStep(state, 'contract-request', 1, 0.27, 0.47);
  text(ctx, api, 'Possible call path', 120, 403, 36, C.muted);
  api.focus.target('task-contract', () => {
    text(ctx, api, 'billing/webhook.ts', 120, 510, 44, C.blue);
    if (found > 0) {
      api.line(ctx, 158, 552, 158, 552 + 83 * found, C.blue, 3);
      if (found === 1) {
        api.arrow(ctx, 158, 635, 230, 635, C.blue, 3);
        text(ctx, api, 'billing/store.ts', 260, 652, 44, C.yellow);
        text(ctx, api, 'Outside the two owned files', 260, 716, 30, C.muted);
      }
    }
    if (asked === 1) text(ctx, api, 'Return the call path. Request scope.', 120, 909, 35, C.yellow);
  });
  api.focus.target('runner-capabilities', () => {
    api.rect(ctx, 1015, 340, 785, 592, C.panel, undefined, 10);
    text(ctx, api, 'Test process', 1065, 424, 42, C.ink);
    const cases = [
      ['read', 'fixtures/retry.json', 'Read retry fixture'],
      ['write', '/tmp/runner/results.json', 'Write scratch result'],
      ['credential', 'production DB', 'Production credential'],
      ['network', 'production API', 'Payment service'],
    ];
    cases.forEach(([kind, value, label], i) => {
      const y = 536 + 105 * i;
      const allowed = runnerCapability(kind, value);
      api.line(ctx, 1065, y - 67, 1750, y - 67, C.muted, 1);
      text(ctx, api, label, 1065, y, 34, C.ink);
      text(ctx, api, allowed ? 'Allow' : 'Deny', 1640, y, 34, allowed ? C.cyan : C.pink);
    });
  });
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: [
    'contract-b1-1',
    'contract-b1-2',
    'contract-discovery',
    'contract-request',
    'contract-b2-1',
  ],
};
