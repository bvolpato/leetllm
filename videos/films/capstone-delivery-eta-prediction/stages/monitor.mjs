import { completed } from '../shipment.mjs';

export function drawMonitor(ctx, scene, state, api) {
  const { C } = api,
    scores = [0.2, 0.3, 0.3, 0.4],
    outcomes = [1, 0, 1, 0];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length,
    late = outcomes.reduce((a, b) => a + b, 0);
  const meanReady = completed(api, 'bucket-mean'),
    labels = completed(api, 'bucket-labels');
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('bucket', () => {
    tx('Illustrative risk bucket    /    Four original predictions', 135, 254, 32, C.muted);
    tx('At scoring', 150, 408, 36, C.blue);
    tx('After delivery', 150, 574, 36, C.muted);
    scores.forEach((score, i) => {
      const x = 650 + i * 295,
        label = labels ? (outcomes[i] ? 'Late' : 'On time') : 'Pending';
      tx('Order ' + (i + 1), x, 334, 28, C.muted, 'center');
      tx(Math.round(100 * score) + '%', x, 424, 53, C.blue, 'center');
      api.line(ctx, x, 453, x, 498, C.muted, 2);
      tx(label, x, 579, 43, labels ? (outcomes[i] ? C.pink : C.green) : C.muted, 'center');
    });
    api.line(ctx, 145, 663, 1775, 663, C.muted, 2);
    if (state.beat < 2) {
      tx(
        state.beat === 0
          ? 'Which outcomes can we count now?'
          : 'Wait for delivery, then join to the original promise.',
        960,
        847,
        46,
        C.ink,
        'center',
      );
    } else {
      tx('Mean score', 148, 798, 34, C.muted);
      if (meanReady) tx((100 * mean).toFixed(0) + '%', 149, 901, 54, C.blue);
      tx('Observed late', 670, 798, 34, C.muted);
      if (labels)
        tx(
          late + ' of ' + scores.length + '  =  ' + (100 * late) / scores.length + '%',
          670,
          901,
          50,
          C.pink,
        );
      if (completed(api, 'bucket-point')) {
        const x = (p) => 1300 + p * 370,
          y = (p) => 942 - p * 212;
        api.line(ctx, x(0), y(0), x(1), y(0), C.muted, 3);
        api.line(ctx, x(0), y(0), x(0), y(1), C.muted, 3);
        api.line(ctx, x(0), y(0), x(1), y(1), C.muted, 2);
        api.circle(ctx, x(mean), y(late / scores.length), 13, C.cyan);
        tx('(0.30, 0.50)', x(mean) - 25, y(late / scores.length) - 35, 27, C.cyan, 'center');
        tx('Predicted risk →', 1475, 994, 27, C.blue, 'center');
        tx('Late fraction', 1300, 706, 26, C.pink);
      }
    }
  });
}
export default {
  id: 'monitor',
  draw: drawMonitor,
  cues: ['monitor-join', 'bucket-mean', 'bucket-labels', 'bucket-point'],
};
