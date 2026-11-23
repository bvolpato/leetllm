import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawMeasuredReceipt(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  txt(
    'RTX 5070 Ti   ·   PyTorch 2.15   ·   CUDA build 13.2   ·   7 Nov 2026',
    148,
    244,
    30,
    C.muted,
  );
  if (state.beat === 0) {
    api.focus.target('receipt-modes', () => {
      txt('4,096 FP32 inputs   ·   20 warmups   ·   1,000 timed iterations', 146, 375, 42, C.ink);
      ['Eager', 'Explicit stream', 'Graph replay'].forEach((name, i) => {
        const x = 372 + i * 580;
        txt(name, x, 545, 49, C.blue, 'center');
        txt(
          p('receipt-pass') >= 1 ? 'checks passed' : 'checking',
          x,
          655,
          40,
          p('receipt-pass') >= 1 ? C.green : C.muted,
          'center',
        );
      });
    });
    api.focus.target('receipt-output', () => {
      txt(
        p('receipt-sum') >= 1 ? 'Completed sum   17,750' : 'Completed sum   ·',
        960,
        887,
        62,
        C.green,
        'center',
      );
    });
    return;
  }
  // Paired means from the recorded run, in microseconds per iteration.
  const rows = [
    ['Host enqueue', 12.184778, 1.803874, 'receipt-host', 'receipt-host', 'receipt-graph-host'],
    [
      'Stream events',
      12.254336,
      6.143264,
      'receipt-events',
      'receipt-device-result',
      'receipt-device-result',
    ],
    [
      'Completed wall',
      12.290748,
      6.162709,
      'receipt-wall',
      'receipt-wall-eager',
      'receipt-wall-result',
    ],
  ];
  txt('Mean time (µs / iteration)', 510, 344, 35, C.muted);
  txt('Eager', 1405, 344, 34, C.blue, 'center');
  txt('Replay', 1645, 344, 34, C.cyan, 'center');
  rows.forEach(([label, eager, replay, target, cue1, cue2], i) => {
    const y = 413 + i * 160;
    api.focus.target(target, () => {
      txt(label, 145, y + 59, 40, C.ink);
      for (const [j, [value, id, color]] of [
        [eager, cue1, C.blue],
        [replay, cue2, C.cyan],
      ].entries()) {
        const progress = p(id);
        const barY = y + j * 47;
        api.rect(ctx, 510, barY, 755, 34, C.panel, undefined, 4);
        if (progress > 0) api.rect(ctx, 510, barY, value * 56 * progress, 34, color, undefined, 4);
        txt(
          progress >= 1 ? value.toFixed(3) : '·',
          1405 + j * 240,
          y + 65,
          42,
          progress >= 1 ? color : C.muted,
          'center',
        );
      }
    });
  });
  api.focus.target('receipt-setup', () => {
    txt(
      p('receipt-setup') > 0
        ? 'Graph preparation   +3.679 ms once'
        : p('receipt-wall-choice') > 0
          ? 'Completed wall time includes the final wait'
          : 'Which row includes the wait for completion?',
      960,
      974,
      39,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'measured-receipt',
  draw: drawMeasuredReceipt,
  cues: [
    'receipt-work',
    'receipt-pass',
    'receipt-sum',
    'receipt-host',
    'receipt-graph-host',
    'receipt-ask',
    'receipt-wall-choice',
    'receipt-wall-eager',
    'receipt-wall-result',
    'receipt-device-result',
    'receipt-setup',
    'receipt-scope',
  ],
};
