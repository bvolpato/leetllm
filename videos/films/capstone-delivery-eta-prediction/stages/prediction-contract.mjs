import { clock } from '../arithmetic.mjs';
import { noonOrder, dimension } from '../shipment.mjs';

export function drawPredictionContract(ctx, scene, state, api) {
  const { C } = api,
    { pickup, snapshot, promise } = noonOrder;
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('prediction-contract-construction', () => {
    tx('O-201    /    May 1    /    Noon snapshot, UTC', 150, 258, 32, C.muted);
    if (state.beat <= 1) {
      const x = (h) => 300 + (h - pickup) * 121;
      api.line(ctx, x(pickup), 543, x(promise), 543, C.muted, 5);
      api.line(ctx, x(pickup), 543, x(snapshot), 543, C.blue, 9);
      for (const [h, name, col] of [
        [pickup, 'Pickup', C.blue],
        [snapshot, 'Snapshot', C.cyan],
        [promise, 'Original promise', C.yellow],
      ]) {
        api.circle(ctx, x(h), 543, 14, col);
        tx(name, x(h), 458, 33, col, 'center');
        tx(clock(h), x(h), 631, 42, col, 'center');
      }
      if (state.beat === 0) {
        dimension(ctx, api, x(pickup), x(snapshot), 710, C.blue);
        tx('2 h elapsed', (x(pickup) + x(snapshot)) / 2, 785, 36, C.blue, 'center');
        tx('Delivery outcome still open', 1600, 840, 36, C.muted, 'right');
      } else {
        tx('Total duration starts at pickup', 185, 777, 39, C.blue);
        tx('Remaining hours start at noon', 185, 856, 39, C.cyan);
        tx('Late if delivery > 21:00', 1700, 818, 42, C.yellow, 'right');
      }
    } else if (state.beat === 2) {
      const entries = [
        ['Customer deadline', 'Local time + declared zone → UTC'],
        ['In transit', 'Outcome pending'],
        ['Canceled or returned', 'Apply the declared cohort rule'],
      ];
      entries.forEach(([k, v], i) => {
        const y = 435 + i * 174;
        tx(k, 170, y, 39, C.blue);
        tx(v, 790, y, 44);
        api.line(ctx, 170, y + 54, 1750, y + 54, C.muted, 2);
      });
    } else {
      const rows = [
        ['Service tier', 'Expedited'],
        ['Elapsed transit', '2 h'],
        ['Time to promise', '9 h'],
        ['Carrier scan age', 'Which scan was readable?'],
        ['Backlog age', 'When was the queue measured?'],
      ];
      rows.forEach(([k, v], i) => {
        const y = 367 + i * 124;
        tx(k, 185, y, 38, C.muted);
        tx(v, 825, y, 43, i > 2 ? C.cyan : C.ink);
      });
    }
  });
}
export default {
  id: 'prediction-contract',
  draw: drawPredictionContract,
  cues: ['remaining-clock', 'feature-availability'],
};
