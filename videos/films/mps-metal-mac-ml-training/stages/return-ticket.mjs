import { fixed } from '../arithmetic.mjs';
import { target, text, withMpsRootFrame } from '../defaults.mjs';
import { paintTicketCall } from './opening.mjs';

export function paintReturnTicket(ctx, scene, state, api, C, c, t, s) {
  paintTicketCall(ctx, api, C, {
    pool: s.pool,
    travel: s.travel,
    device: 'mps:0',
    verdict: s.returned,
  });
  target(ctx, api, 'final-memory-plan', () => {
    if (s.nextRun) {
      text(
        ctx,
        api,
        C,
        'Next Mac run: batch 16   /   6 MiB input   /   measure through completion',
        960,
        1011,
        29,
        C.cyan,
        'center',
      );
    } else if (s.returned) {
      text(
        ctx,
        api,
        C,
        'Same four training tickets   /   batch loss ' +
          fixed(s.lossBefore) +
          ' → ' +
          fixed(s.lossAfter),
        960,
        1011,
        30,
        C.ink,
        'center',
      );
    }
  });
}
export function drawReturnTicketStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, paintReturnTicket);
}
export default {
  id: 'return-ticket',
  draw: drawReturnTicketStage,
  cues: ['return-mean', 'return-linear', 'accepted-call', 'next-run'],
};
