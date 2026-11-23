import { progress, heard } from '../clock.mjs';

export function drawPolicyContract(ctx, scene, state, api) {
  const { C } = api;
  api.text(ctx, '“Can you approve admin access for tonight’s migration?”', 120, 285, 48, C.ink);
  api.focus.target('policy-clause', () => {
    api.text(ctx, 'P-7', 120, 422, 50, C.yellow);
    api.text(ctx, 'Cite the policy and escalate privileged access changes.', 280, 418, 38, C.ink);
  });
  const voted = heard(state, 'ticket-wins', 1);
  api.focus.target('access-pair', () => {
    for (const [i, label, answer] of [
      [0, 'A', 'Open a reviewer ticket and cite P-7.'],
      [1, 'B', 'Go ahead tonight and clean it up tomorrow.'],
    ]) {
      const y = 585 + i * 112;
      api.text(ctx, label, 120, y, 50, C.blue);
      api.text(ctx, answer, 220, y, 41, C.ink);
      if (voted)
        api.text(
          ctx,
          i === 0 ? 'Chosen' : 'Rejected',
          1660,
          y,
          36,
          i === 0 ? C.green : C.muted,
          'right',
        );
    }
  });
  if (state.beat === 0) api.text(ctx, 'Which reply follows P-7?', 120, 935, 42, C.yellow);
  if (state.beat >= 2)
    api.focus.target('candidate-record', () => {
      api.text(ctx, 'Release candidate', 120, 840, 31, C.muted);
      if (progress(state, 'candidate-reward', 2) > 0)
        api.text(ctx, 'Judge score  +0.31', 120, 935, 39, C.blue);
      if (heard(state, 'candidate-outcomes', 2)) {
        api.text(ctx, 'Blinded wins   184 / 400', 660, 935, 39, C.ink);
        api.text(ctx, 'Mean length   +48 tokens', 1220, 935, 39, C.ink);
      }
    });
}

export default {
  id: 'policy-contract',
  draw: drawPolicyContract,
  cues: ['read-policy', 'ticket-wins', 'candidate-reward', 'candidate-outcomes'],
};
