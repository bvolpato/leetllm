import { reservationTransition } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { conciseMicro } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

const balance = 16000,
  reserve = 10000;
export default {
  id: 'atomic-settlement',
  cues: ['claim-balance', 'settle-usage', 'unresolved-charge'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0;
    const claimed = beat > 0 || cueProgress(state, 'claim-balance', p) === 1;
    const settled = beat > 1 || (beat === 1 && cueProgress(state, 'settle-usage', p) === 1);
    const timeout = beat >= 2 && cueProgress(state, 'unresolved-charge', p) > 0;
    function account(y, title, outcome, paid, status) {
      const r = claimed
        ? reservationTransition(balance, reserve, outcome, paid)
        : { free: balance, held: 0, spent: 0 };
      text(ctx, api, title, 180, y, 39, C.ink, 'left');
      let x = 180;
      for (const [name, amount, color] of [
        ['Spent', r.spent, C.pink],
        ['Held', r.held, C.yellow],
        ['Free', r.free, C.cyan],
      ]) {
        if (!amount) continue;
        const width = (1530 * amount) / balance;
        api.rect(ctx, x, y + 40, width, 81, color, undefined, 0);
        text(ctx, api, name + '  ' + usd(amount, 5), x + width / 2, y + 93, 35, C.bg);
        x += width;
      }
      if (status) text(ctx, api, status, 180, y + 189, 33, C.muted, 'left');
    }
    api.focus.target('ledger', () => {
      if (beat === 0) {
        text(
          ctx,
          api,
          'Call A and call B each need $0.01000 to start.',
          180,
          311,
          43,
          C.ink,
          'left',
        );
        account(
          470,
          'Shared account  ·  $0.01600',
          'pending',
          0,
          claimed
            ? 'B needs $0.01000. The $0.00600 still free cannot cover it.'
            : 'Two independent balance checks would both see $0.01600.',
        );
      } else {
        account(
          308,
          'A returns a usage receipt',
          settled ? 'settled' : 'pending',
          conciseMicro,
          settled ? 'B can now reserve $0.01000.' : 'Waiting for the actual charge',
        );
        account(
          680,
          timeout
            ? 'Alternative: A times out locally'
            : 'Same starting balance, before a receipt arrives',
          'timeout',
          0,
          timeout
            ? 'B still sees $0.00600. Reconcile A with the provider.'
            : 'The reserved cent belongs to A.',
        );
      }
    });
  },
};
