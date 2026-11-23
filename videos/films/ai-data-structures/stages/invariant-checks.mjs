import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const checks = [
  ['Red posting', '{D0, D2}'],
  ['Empty query', '[ ]'],
  ['Compare with ranked scan', 'Same IDs for each query and limit'],
  ['Search “Red FOX”', '[D2, D0]'],
  ['Claim oldest', 'D3 before D4'],
  ['Follow cycle from D0', 'D0, D2, then stop'],
];

export function drawInvariantChecks(ctx, scene, state, api) {
  const { C } = api;
  withFocus(ctx, api, 'ds-invariant-checks-mechanism', () => {
    if (state.beat === 0) {
      drawText(ctx, api, 'Python example', 170, 292, 35, C.ink);
      const complete = q(state, 'ds-invariant-checks-0', 0) * checks.length;
      checks.forEach(([action, result], i) => {
        const y = 401 + 98 * i;
        drawText(ctx, api, action, 190, y, 33, C.ink);
        api.line(ctx, 760, y - 11, 905, y - 11, C.muted, 3);
        if (complete >= i + 1) drawText(ctx, api, result, 955, y, 33, C.green);
      });
      return;
    }
    const write = q(state, 'invariant-write', 1, 0.05, 0.15);
    const restart = q(state, 'ds-invariant-checks-1', 1, 0.22, 0.4);
    const retry = q(state, 'invariant-retry', 1, 0.48, 0.63);
    const dedup = q(state, 'invariant-idempotent', 1, 0.72, 0.94);
    drawText(ctx, api, 'Indexing worker', 170, 330, 38, C.ink);
    drawText(ctx, api, 'Durable embedding store', 1050, 330, 38, C.ink);
    api.rect(ctx, 150, 382, 685, 391, C.panel, C.muted, 14);
    api.rect(ctx, 1012, 382, 735, 391, C.panel, C.muted, 14);
    if (restart < 1) {
      drawCard(ctx, api, 'Job M2', 205, 429, 320, 80, C.cyan, 1 - restart);
      drawText(ctx, api, 'Completion pending', 210, 680, 30, C.muted);
    } else {
      drawText(ctx, api, 'Process restarted', 210, 458, 32, C.pink);
      if (retry > 0) drawCard(ctx, api, 'Retry job M2', 212, 579, 380, 82, C.yellow, retry);
    }
    if (write > 0) drawCard(ctx, api, 'M2   ·   embedding', 1070, 431, 605, 93, C.green, write);
    if (dedup === 1) drawText(ctx, api, 'Same job key, one stored vector', 1065, 676, 31, C.green);
    if (retry === 1 && dedup === 0)
      drawText(
        ctx,
        api,
        'The job came back. The first write is still there.',
        170,
        909,
        35,
        C.yellow,
      );
  });
}

export default {
  id: 'invariant-checks',
  draw: drawInvariantChecks,
  cues: [
    'ds-invariant-checks-0',
    'invariant-write',
    'ds-invariant-checks-1',
    'invariant-retry',
    'invariant-idempotent',
  ],
};
