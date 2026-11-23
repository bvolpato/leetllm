import { mix } from '../arithmetic.mjs';
import { queuePackets } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { focus, line, packet, text } from '../defaults.mjs';
export function drawCopiedEvidence(ctx, scene, state, api) {
  const q = cueProgress(state, 'copied-pass', 1),
    counter = cueProgress(state, 'independent-counterfactual', 2);
  focus(api, 'copied-packets', () => {
    text(ctx, api, 'Original flag', 375, 280, 41, api.C.ink);
    text(ctx, api, 'Both flags', 1225, 280, 41, api.C.ink);
    line(ctx, api, 250, 304, 500, 304, api.C.muted, 2);
    line(ctx, api, 1100, 304, 1350, 304, api.C.muted, 2);
    [0, 2, 7].forEach((i, j) => {
      const row = queuePackets[i],
        from = {
          x: 250,
          y: 330 + j * 110,
        },
        at = {
          x: mix(from.x, 1100, q),
          y: from.y,
        };
      packet(ctx, api, row, at);
      if (q === 1) text(
        ctx,
        api,
        row.id + ' · ' + (row.abusive ? 'abuse' : 'clean'),
        1600,
        at.y + 40,
        28,
        row.abusive ? api.C.red : api.C.blue,
      );
    });
    text(ctx, api, q === 1 ? 'Both checks kept the same signup IDs' : 'Three packets from the original queue', 960, 680, 29, api.C.muted);
  });
  focus(api, 'copied-comparison', () => {
    const result = state.cues?.['copied-result']
      ? cueProgress(state, 'copied-result', 1) === 1
      : q === 1;
    if (result) text(ctx, api, 'Copied selection: 95 / 590 ≈ 16.1%', 960, 755, 37, api.C.yellow);
    if ((state.beat ?? 0) === 2) {
      const trueMass = mix(95, 90.25, counter),
        falseMass = mix(495, 24.75, counter);
      text(
        ctx,
        api,
        'Two independent tests within each class',
        960,
        820,
        28,
        api.C.pink,
      );
      api.rect(ctx, 350, 860, trueMass * 2, 58, api.C.red, undefined, 6);
      api.rect(ctx, 350 + trueMass * 2, 860, falseMass * 2, 58, api.C.blue, undefined, 6);
      text(
        ctx,
        api,
        counter === 1
          ? '100 × 0.95² = 90.25 abuse · 9,900 × 0.05² = 24.75 clean'
          : 'Expected signups flagged by both tests',
        960,
        965,
        29,
        api.C.pink,
      );
      if (cueProgress(state, 'independent-risk', 2) === 1)
        text(
          ctx,
          api,
          'Expected joint-flag risk: 90.25 / (90.25 + 24.75) ≈ 78.5%',
          960,
          1030,
          29,
          api.C.pink,
        );
    } else if (!result) {
      if (q === 1)
        text(ctx, api, '95 abusive / 590 flagged', 960, 755, 37, api.C.ink);
      else
        text(ctx, api, 'Does the second field exclude any of these signups?', 960, 930, 35, api.C.muted);
    }
  });
}
export default {
  id: 'copied-evidence',
  draw: drawCopiedEvidence,
  cues: ['copied-pass', 'copied-result', 'independent-counterfactual', 'independent-risk'],
};
