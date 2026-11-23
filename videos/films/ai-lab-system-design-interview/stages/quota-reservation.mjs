import { lerp } from '../arithmetic.mjs';
import { namedSystemCue, systemExtensionFrame } from '../construction.mjs';
import { bar, chapterCard, chapterText, footer, header, line } from '../defaults.mjs';
export function drawQuotaReservation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('quota-reservation', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-quota-reservation-mechanism', () => {
    if (currentBeat === 0) {
      header(ctx, api, 'Request R-108 · token reservation');
      bar(
        ctx,
        api,
        modelState.balance,
        10000,
        300,
        430,
        1320,
        themeColors.blue,
        'Available balance: ' + modelState.balance.toLocaleString(),
      );
      bar(
        ctx,
        api,
        modelState.reserved - modelState.refunded,
        10000,
        300,
        650,
        1320,
        themeColors.yellow,
        'Still charged: ' + (modelState.reserved - modelState.refunded).toLocaleString(),
      );
      if (modelState.reserveProgress > 0 && modelState.reserveProgress < 1)
        chapterCard(
          ctx,
          api,
          '1,800 reservation pending',
          lerp(300, 1100, modelState.reserveProgress),
          525,
          500,
          themeColors.yellow,
          65,
          27,
        );
      else if (modelState.refundProgress > 0 && modelState.refundProgress < 1)
        chapterCard(
          ctx,
          api,
          '280 refund pending',
          lerp(1100, 300, modelState.refundProgress),
          525,
          500,
          themeColors.cyan,
          65,
          27,
        );
      chapterText(
        ctx,
        api,
        'Reserved ' + modelState.reserved + ' · confirmed refund ' + modelState.refunded,
        960,
        840,
        34,
        themeColors.cyan,
        'center',
      );
    } else if (currentBeat === 1) {
      header(
        ctx,
        api,
        modelState.firstClaim
          ? 'Serialized repair · original 100-token bucket'
          : 'Separate stale-check fixture · both read 100',
      );
      for (let i = 0; i < 2; i++)
        chapterCard(
          ctx,
          api,
          (i ? 'R-B requires 60' : 'R-A requires 70') +
            (modelState.firstClaim ? (i ? ' · sees 30' : ' · CLAIMED') : ' · reads 100'),
          200 + i * 820,
          405,
          700,
          i && modelState.secondDenied ? themeColors.pink : themeColors.cyan,
          110,
        );
      if (modelState.naiveReady && !modelState.firstClaim) {
        bar(
          ctx,
          api,
          130,
          150,
          400,
          650,
          1120,
          themeColors.pink,
          'Naive combined reservations: 70 + 60 = 130',
        );
        line(
          ctx,
          api,
          400 + (1120 * 100) / 150,
          620,
          400 + (1120 * 100) / 150,
          755,
          themeColors.yellow,
          4,
        );
        chapterText(
          ctx,
          api,
          '100-token capacity',
          400 + (1120 * 100) / 150,
          805,
          27,
          themeColors.yellow,
          'center',
        );
      } else
        bar(
          ctx,
          api,
          modelState.concurrentRemaining,
          100,
          400,
          650,
          1120,
          themeColors.blue,
          'Serialized remaining balance: ' + modelState.concurrentRemaining,
        );
      if (modelState.secondDenied)
        chapterText(
          ctx,
          api,
          'R-B denied · no second reservation',
          960,
          870,
          38,
          themeColors.pink,
          'center',
        );
    } else {
      const disconnected = namedSystemCue(state, 'quota-disconnect', 2, 0.4) > 0;
      header(ctx, api, 'Two independent streams · each starts with 10,000 tokens');
      for (const [i, id] of ['R-108', 'R-109'].entries()) {
        const x = 170 + i * 840;
        chapterText(ctx, api, id, x, 424, 52, themeColors.ink);
        const visible = i === 0 || disconnected;
        if (!visible) continue;
        chapterText(ctx, api, 'Reserved  1,800', x, 517, 34, themeColors.yellow);
        chapterText(
          ctx,
          api,
          i ? 'Usage missing · stream closed' : 'Confirmed use  1,520',
          x,
          597,
          34,
          themeColors.ink,
        );
        chapterText(
          ctx,
          api,
          i ? 'Pending · await accounting' : 'Refund  280 · already applied',
          x,
          679,
          32,
          themeColors.cyan,
        );
        bar(
          ctx,
          api,
          i ? 8200 : modelState.balance,
          10000,
          x,
          822,
          710,
          themeColors.blue,
          'Available  ' + (i ? '8,200' : modelState.balance.toLocaleString('en-US')),
        );
      }
    }
    footer(ctx, api, 'Atomic check-and-reserve precedes dispatch; missing usage stays pending');
  });
}
export default {
  id: 'quota-reservation',
  draw: drawQuotaReservation,
  cues: [
    'sd-quota-reservation-0-operation',
    'sd-quota-reservation-0-result',
    'sd-quota-reserved',
    'sd-quota-refunded',
    'sd-quota-reservation-1-operation',
    'sd-quota-reservation-1-result',
    'sd-quota-naive',
    'sd-quota-claim',
    'sd-quota-deny',
    'sd-quota-reservation-2-operation',
    'quota-disconnect',
    'sd-quota-reservation-2-result',
  ],
};
