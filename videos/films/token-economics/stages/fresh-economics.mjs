import { acceptedTaskCost, reservationTransition } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { priceMicroDollars } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

const attempts = [
  { id: 'X1', task: 'X', costMicro: 2000, accepted: false, outcome: 'Failed' },
  { id: 'X2', task: 'X', costMicro: 3000, accepted: true, outcome: 'Accepted' },
  { id: 'Y1', task: 'Y', costMicro: 4000, accepted: false, outcome: 'Abandoned' },
  { id: 'Z1', task: 'Z', costMicro: 5000, accepted: true, outcome: 'Accepted' },
];
const cost = acceptedTaskCost(attempts);
const reserve = priceMicroDollars(1600, 0, 400);
const free = 17000;

export default {
  id: 'fresh-economics',
  cues: ['total-receipts', 'reserve-first', 'timeout'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0;
    if (beat < 2) {
      const add = beat === 1 ? cueProgress(state, 'total-receipts', p) : 0;
      const included = Math.floor(4 * add);
      text(ctx, api, 'Generation receipts', 185, 302, 42, C.ink, 'left');
      attempts.forEach((r, i) => {
        const x = 190 + i * 398;
        const color = r.accepted ? C.green : C.pink;
        api.rect(ctx, x, 368, 346, 185, C.panel, color, 7);
        text(ctx, api, r.id + '   ' + r.outcome, x + 173, 432, 32, color);
        text(ctx, api, usd(r.costMicro, 3), x + 173, 512, 46, C.ink);
      });
      api.focus.target('receipt-sum', () => {
        if (beat === 0) text(ctx, api, 'What did one accepted task cost?', 960, 799, 48, C.ink);
        else {
          // Each paid receipt gets a segment, including the abandoned task.
          let x = 190;
          attempts.slice(0, included).forEach((r) => {
            const width = (1500 * r.costMicro) / cost.spend;
            api.rect(ctx, x, 652, width - 3, 65, r.accepted ? C.green : C.pink, undefined, 0);
            text(ctx, api, r.id, x + width / 2, 696, 30, C.bg);
            x += width;
          });
          text(
            ctx,
            api,
            included === 4
              ? usd(cost.spend, 3) + ' ÷ 2 accepted tasks (X, Z) = ' + usd(cost.costPerAccepted, 3)
              : 'Collect all four charges',
            960,
            841,
            46,
            C.ink,
          );
        }
      });
      return;
    }

    const claim = beat < 3 ? 0 : beat > 3 ? 1 : cueProgress(state, 'reserve-first', p);
    const timedOut = beat >= 4 && cueProgress(state, 'timeout', p) > 0;
    const account = reservationTransition(free, reserve, timedOut ? 'timeout' : 'pending');
    const second = reservationTransition(account.free, reserve);
    text(ctx, api, 'Two arrivals  ·  $0.017 available', 200, 290, 43, C.ink, 'left');
    text(
      ctx,
      api,
      'Each call: 1,600 cold input × $2.50 + 400 capped output × $15, per million',
      200,
      381,
      34,
      C.muted,
      'left',
    );
    text(ctx, api, 'Each needs $0.004 + $0.006 = $0.010', 200, 456, 42, C.ink, 'left');
    const x = 200,
      w = 1500,
      heldWidth = w * (account.held / free) * claim;
    api.focus.target('account', () => {
      api.rect(ctx, x, 560, w, 97, C.cyan, undefined, 0);
      if (heldWidth > 0) api.rect(ctx, x, 560, heldWidth, 97, C.yellow, undefined, 0);
      if (claim === 1) {
        text(ctx, api, usd(account.held, 3) + ' held for call 1', x + heldWidth / 2, 622, 35, C.bg);
        text(ctx, api, usd(account.free, 3) + ' free', x + (heldWidth + w) / 2, 622, 35, C.bg);
      }
      const message = timedOut
        ? 'Call 1 timed out. Its usage is unresolved.'
        : claim === 1 && !second.admitted
          ? 'Call 2 needs $0.010. Only $0.007 is free.'
          : 'How many calls can start?';
      text(ctx, api, message, 960, 798, 44, C.ink);
      if (timedOut)
        text(
          ctx,
          api,
          'Keep the reservation until the provider’s receipt settles it.',
          960,
          912,
          35,
          C.yellow,
        );
    });
  },
};
