import { completed } from '../shipment.mjs';
import { costBars } from '../defaults.mjs';

export function drawTemporalFit(ctx, scene, state, api) {
  const { C } = api;
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('temporal-fit-construction', () => {
    if (state.beat <= 1 && api.focus.progress('split-counts', 0) === 0) {
      tx('S-079   /   One shipment from the synthetic training window', 145, 255, 33, C.muted);
      tx('Prediction', 160, 448, 40, C.blue);
      tx('March 21, 12:00', 670, 448, 52, C.blue);
      tx('Next day   /   March 22 UTC', 160, 613, 34, C.ink);
      const x = (m) => 420 + (m + 6) * 60;
      api.line(ctx, x(-5), 734, x(14), 734, C.muted, 3);
      api.line(ctx, x(0), 678, x(0), 778, C.yellow, 5);
      api.circle(ctx, x(8 + 25.801495 / 60), 734, 14, C.cyan);
      tx('12:00  Fit', x(0), 842, 39, C.yellow, 'center');
      tx('12:08  Label recorded', x(8 + 25.801495 / 60), 842, 39, C.cyan, 'center');
      tx(
        completed(api, 'fit-exclusion')
          ? 'Exclude S-079 from the fit'
          : 'May S-079 enter training?',
        960,
        963,
        42,
        completed(api, 'fit-exclusion') ? C.pink : C.ink,
        'center',
      );
    } else if (state.beat === 1 || state.beat === 3) {
      tx('136 shipments   /   One snapshot per order', 145, 254, 34, C.muted);
      const cohorts = [
        ['Train', 79, 'Jan 1 to Mar 21', 'Fit Mar 22', C.blue],
        ['Validate', 24, 'Mar 26 to Apr 18', 'Freeze Apr 19', C.cyan],
        ['Test', 24, 'Apr 23 to May 16', 'Evaluate May 21', C.green],
      ];
      cohorts.forEach(([name, n, dates, cutoff, col], i) => {
        const x = 165 + i * 585;
        tx(name, x, 406, 45, col);
        tx(n + ' eligible', x, 518, 52);
        tx(dates, x, 616, 31, C.muted);
        api.line(ctx, x, 660, x + 415, 660, col, 6);
        tx(cutoff + ' at noon', x, 732, 30, col);
      });
      tx(
        state.beat === 1
          ? '8 in the gaps  +  1 late label  =  9 excluded'
          : 'A rolling-origin study repeats the fit at several cutoffs.',
        960,
        910,
        40,
        C.ink,
        'center',
      );
    } else {
      tx('Frozen classifier and arrival model    /    24 validation orders', 145, 254, 33, C.muted);
      if (api.focus.progress('validation-costs', 0) === 0) {
        tx('Five training features', 180, 460, 42);
        api.line(ctx, 180, 500, 1720, 500, C.muted, 2);
        tx('Risk', 180, 637, 37, C.blue);
        tx('Training means and scales   →   logistic regression', 600, 637, 39, C.blue);
        tx('Remaining hours', 180, 778, 37, C.cyan);
        tx('Raw features   →   least squares', 600, 778, 39, C.cyan);
      } else {
        const costs = [32, 16, 368, 548],
          thresholds = [0.2, 0.4, 0.6, 0.8];
        const best = costs.indexOf(Math.min(...costs));
        const locked = completed(api, 'locked-threshold');
        tx('Total validation penalty (units)', 170, 360, 32);
        costBars(ctx, api, {
          x: 240,
          y: 410,
          width: 1420,
          height: 410,
          values: costs,
          labels: thresholds.map((t) => t.toFixed(2)),
          max: 600,
          colors: costs.map((_, i) => (locked && i === best ? C.green : C.blue)),
        });
        tx(
          locked
            ? 'Lock threshold ' + thresholds[best].toFixed(2) + ' before final test'
            : 'Warning threshold',
          960,
          940,
          43,
          locked ? C.green : C.ink,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'temporal-fit',
  draw: drawTemporalFit,
  cues: ['fit-exclusion', 'split-counts', 'validation-costs', 'locked-threshold'],
};
