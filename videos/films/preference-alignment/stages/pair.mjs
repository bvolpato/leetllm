import { ROUTE_FIXTURE } from '../fixtures.mjs';
import { pairLayout } from '../construction.mjs';
import { progress } from '../clock.mjs';
import { answerCard } from '../defaults.mjs';

export function drawPair(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('fixed-prompt', () =>
    api.text(ctx, ROUTE_FIXTURE.request, 960, 318, 46, C.ink, 'center'),
  );
  const positions = pairLayout(progress(state, 'pair-swap', 1));
  api.focus.target('chosen-answer', () =>
    answerCard(
      ctx,
      api,
      'A   ·   Reviewer’s choice',
      ROUTE_FIXTURE.chosen,
      positions.preferredX,
      positions.preferredY,
      C.green,
    ),
  );
  api.focus.target('rejected-answer', () =>
    answerCard(ctx, api, 'B', ROUTE_FIXTURE.rejected, positions.detourX, positions.detourY, C.cyan),
  );
  api.text(ctx, 'Stored vote    A over B', 960, 970, 43, C.green, 'center');
}

export default { id: 'pair', draw: drawPair, cues: ['pair-prompt', 'pair-swap'] };
