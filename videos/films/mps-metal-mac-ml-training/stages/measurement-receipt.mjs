import {
  extensionCode,
  foot,
  math,
  target,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintMeasurementReceipt(ctx, scene, state, api, C, c, t, s, id) {
  if (s.step === 0) {
    text(ctx, api, C, 'Allocate / place before the clock', 960, 280, 36, C.cyan, 'center');
    const x = 290,
      cell = 82,
      y = 500,
      startX = x + 3 * cell + 75,
      stopX = x + 13 * cell + 105;
    target(ctx, api, 'mps-measured-block', () => {
      for (let i = 0; i < 13; i++) {
        const warm = i < 3,
          filled = warm ? i < s.warmProducts : i - 3 < s.timedProducts,
          xx = x + i * cell + (warm ? 0 : 115);
        api.rect(
          ctx,
          xx,
          y,
          60,
          125,
          filled ? (warm ? C.blue : C.cyan) : C.panel,
          warm ? C.blue : C.cyan,
          2,
          4,
        );
        if (filled)
          text(ctx, api, C, String(warm ? i + 1 : i - 2), xx + 30, y + 72, 30, C.bg, 'center');
      }
      api.line(ctx, startX, 430, startX, 685, C.yellow, 4);
      api.line(
        ctx,
        stopX,
        430,
        stopX,
        685,
        s.synchronized ? C.green : C.muted,
        4,
      );
      text(ctx, api, C, '3 warmups', x + cell * 1.5, 745, 32, C.blue, 'center');
      text(
        ctx,
        api,
        C,
        s.synchronized ? '10 products complete' : s.timedProducts + ' of 10 products submitted',
        1210,
        745,
        32,
        s.synchronized ? C.green : C.cyan,
        'center',
      );
      text(ctx, api, C, 'MPS', x - 40, 348, 32, C.cyan);
      extensionCode(ctx, api, C, 'synchronize → start', startX, 348, 30, C.yellow);
      extensionCode(
        ctx,
        api,
        C,
        'synchronize → stop',
        stopX,
        348,
        30,
        s.synchronized ? C.green : C.muted,
      );
    });
    target(ctx, api, 'cpu-clock-boundaries', () => {
      if (!s.cpuBoundaries) return;
      text(ctx, api, C, 'CPU', x - 40, 408, 32, C.blue);
      extensionCode(ctx, api, C, 'warmup 3 returns → start', startX, 408, 30, C.blue);
      extensionCode(ctx, api, C, 'product 10 returns → stop', stopX, 408, 30, C.blue);
    });
    target(ctx, api, 'mps-measure-result', () =>
      math(
        ctx,
        api,
        C,
        s.normalized
          ? '\\text{mean completed product time}=\\frac{t_{stop}-t_{start}}{10}'
          : '\\text{Block time is valid after completion}',
        960,
        910,
        43,
        s.normalized ? C.green : C.yellow,
      ),
    );
  } else {
    const rows = [
      ['MPS loss tensor', 'detach()', 'Differentiation boundary'],
      ['Detached tensor', 'cpu()', 'Host-visible copy can wait'],
      ['CPU value', 'item() / numpy()', 'Read completed host data'],
    ];
    rows.forEach(([a, b, c], i) => {
      const y = 355 + i * 175;
      text(ctx, api, C, a, 240, y + 30, 32, i ? C.cyan : C.blue);
      extensionCode(ctx, api, C, b, 935, y + 30, 34, C.yellow);
      text(ctx, api, C, c, 1660, y + 30, 29, C.ink, 'right');
      api.line(ctx, 240, y + 75, 1675, y + 75, C.muted, 1);
    });
    text(
      ctx,
      api,
      C,
      'Logging before the next dispatch can serialize the workload',
      960,
      935,
      34,
      C.yellow,
      'center',
    );
  }
  foot(ctx, api, C, 'Article loop: 256² matrices · no measured MPS duration claimed');
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintMeasurementReceipt);
}
export function drawMeasurementReceiptStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'measurement-receipt',
  draw: drawMeasurementReceiptStage,
  cues: [
    'measurement-receipt-b1',
    'mps-measure-warm',
    'mps-measure-ten',
    'mps-measure-sync',
    'cpu-measure-boundaries',
    'mps-measure-normalize',
    'measurement-receipt-b2',
  ],
};
