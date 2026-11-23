import { phase } from '../arithmetic.mjs';
import { sgComplete, sgProgress } from '../construction.mjs';
import { box, clock, extensionText, footer, title } from '../defaults.mjs';
export function drawReservationPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('reservation-policy-mechanism', () => {
    title(
      ctx,
      api,
      currentBeat === 0
        ? 'Destination capacity is reserved before it contains KV'
        : 'Reservation timing changes space and exposed latency',
    );
    if (currentBeat === 0) {
      const n = Math.ceil(sgProgress(state, 'reservation-five', q) * 10);
      for (let i = 0; i < 10; i++) {
        const x = 200 + (i % 5) * 310,
          y = 400 + Math.floor(i / 5) * 190;
        box(
          ctx,
          api,
          'P' + i + ' · reserved\n512 MiB',
          x,
          y,
          280,
          140,
          i < n ? themeColors.blue : themeColors.muted,
          27,
        );
      }
      extensionText(
        ctx,
        api,
        n === 10 && sgComplete(state, 'reservation-five')
          ? '10 × 512 MiB = 5 GiB reserved'
          : 'Pending reservation ' + n + ' / 10',
        960,
        850,
        40,
        themeColors.blue,
        'center',
      );
      extensionText(
        ctx,
        api,
        'received 0 · active decode 0',
        960,
        930,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      const deferred = sgProgress(state, 'reservation-deferred', q);
      clock(
        ctx,
        api,
        [
          {
            id: 'ep',
            label: 'early: prefill',
          },
          {
            id: 'et',
            label: 'early: transfer',
          },
          {
            id: 'dp',
            label: 'defer: prefill',
          },
          {
            id: 'dt',
            label: 'defer: transfer',
          },
        ],
        [
          {
            id: 'ep',
            lane: 'ep',
            start: 0,
            end: 20,
            color: themeColors.blue,
          },
          {
            id: 'et',
            lane: 'et',
            start: 10,
            end: 30,
            color: themeColors.cyan,
          },
          {
            id: 'dp',
            lane: 'dp',
            start: 0,
            end: 20,
            color: themeColors.blue,
          },
          {
            id: 'dt',
            lane: 'dt',
            start: 20,
            end: 40,
            color: themeColors.pink,
          },
        ],
        [0, 40],
        20 + 20 * deferred,
        360,
        410,
        [0, 10, 20, 30, 40],
      );
      extensionText(
        ctx,
        api,
        'Illustrative clock: early transfer overlaps later prefill',
        960,
        860,
        32,
        themeColors.cyan,
        'center',
      );
      extensionText(
        ctx,
        api,
        'Deferred reservation at final prefill → exposed transfer; source KV held longer',
        960,
        940,
        29,
        themeColors.pink,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Installed transport / registry / attention / pipeline restrictions must agree',
    );
  });
}
export default {
  id: 'reservation-policy',
  draw: drawReservationPolicy,
  cues: [
    'sg-reservation-policy-beat-0',
    'sg-reservation-five',
    'sg-reservation-policy-beat-1',
    'sg-reservation-deferred',
    'sg-reservation-policy-beat-2',
  ],
};
