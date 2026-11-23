import { cueProgress } from '../construction.mjs';
import { queueSnapshot } from '../model.mjs';
import { box, cell, countReceipt, focus, packet, queueField, route, text } from '../defaults.mjs';
export function drawFilter(ctx, scene, state, api) {
  const snap = queueSnapshot(state.beat ?? 0, state.beatP ?? 0, state.cues),
    q = cueProgress(state, 'filter-rates', 0);
  focus(api, 'source-rates', () => {
    box(
      ctx,
      api,
      q === 1 ? '100 abuse × 95%' : '100 abusive source',
      290,
      245,
      540,
      65,
      api.C.red,
      31,
    );
    box(
      ctx,
      api,
      q === 1 ? '9,900 clean × 5%' : '9,900 clean source',
      1090,
      245,
      540,
      65,
      api.C.blue,
      31,
    );
  });
  queueField(ctx, api, 'queue-packets', () => {
    for (const row of snap.rows)
      if (row.progress > 0) {
        const target = cell(row),
          at = row.arrived ? target : route({}, target, row.progress);
        packet(ctx, api, row, at);
      }
  });
  focus(api, 'queue-summary', () => {
    text(
      ctx,
      api,
      'Arrived: ' + snap.abusive + ' abusive · ' + snap.clean + ' clean',
      960,
      825,
      35,
      api.C.cyan,
    );
    countReceipt(
      ctx,
      api,
      snap.totalReady
        ? 'Queue = 95 + 495 = 590 rows'
        : 'Queue total: count after both sources arrive',
      'Packet widths share one count scale · each packet prints its membership',
    );
  });
}
export default {
  id: 'filter',
  draw: drawFilter,
  cues: [
    'filter-rates',
    'queue-arrivals',
    'queue-abuse-arrivals',
    'queue-clean-arrivals',
    'queue-total',
  ],
};
