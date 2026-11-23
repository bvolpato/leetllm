import { gpuFrame } from '../arithmetic.mjs';
import { gpuReceiptFixtures, soakTelemetry } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state), threshold = gpuReceiptFixtures[0].oom_request_gib;
  const { C } = api;
  const { label, line, block, dot } = diagram(ctx, api);
  const abort = soakTelemetry.findIndex(row => row.layout < threshold);
  const requestY = 735 - threshold * 165;
  const x = i => 300 + 170 * i;
  const y = v => 735 - v * 165;
  const oldCount = 1 + Math.round((abort - 1) * f.progress('soak-first-four', 0)) +
    Number(f.completed('soak-fifth', 1));
  const revised = f.started('soak-cap', 2);
  const pending = f.completed('soak-sample', 0) && !f.completed('soak-fifth', 1);
  const newCount = revised ? 1 + Math.floor(7 * f.progress('soak-replay', 2)) : 0;
  const allRevised = newCount === soakTelemetry.length;
  label('Largest reusable block (GiB)', 150, 247, 38, C.ink);
  label('Synthetic burn-in    /    stop a run if its block falls below the request', 150, 307, 29, C.muted);
  for (const value of [0, 1, 2]) {
    line(x(0), y(value), x(7), y(value), C.muted, 2);
    label(value, 250, y(value) + 11, 28, C.muted, 'right');
  }
  api.focus.target('soak-trace', () => {
    line(x(0), requestY, x(7) + 80, requestY, C.yellow, 4);
    label(threshold.toFixed(2) + ' GiB', x(7) + 110, requestY + 12, 31, C.yellow);
    for (let i = 0; i < soakTelemetry.length; i++) label(i + 1, x(i), 791, 28, C.muted, 'center');
    label('Allocation cycle', 895, 848, 29, C.muted, 'center');
    for (const [count, changed, color] of [[oldCount, false, C.pink], [newCount, true, C.green]]) {
      for (let i = 0; i < count; i++) {
        const current = changed ? soakTelemetry[i].revised : soakTelemetry[i];
        if (i) {
          const previous = changed ? soakTelemetry[i - 1].revised : soakTelemetry[i - 1];
          line(x(i - 1), y(previous.layout), x(i), y(current.layout), color, 5);
        }
        dot(x(i), y(current.layout), 9, color);
      }
    }
    if (pending) api.circle(ctx, x(abort), y(soakTelemetry[abort].layout), 11, C.bg, C.pink, 4);
  });
  const oldValue = soakTelemetry[oldCount - 1].layout.toFixed(2);
  label('Restart only', 155, 920, 32, C.pink);
  label('Cycle ' + oldCount + '   /   ' + oldValue + ' GiB' + (oldCount > abort ? '   /   STOP' : ''), 155, 989, 35, C.ink);
  if (pending) {
    label('Incoming sample', 1030, 920, 32, C.pink);
    label('Cycle ' + (abort + 1) + '   /   ' + soakTelemetry[abort].layout.toFixed(2) + ' GiB', 1030, 989, 35, C.ink);
  }
  if (revised) {
    const val = soakTelemetry[newCount - 1].revised.layout.toFixed(2);
    block(960, 875, 3, 139, C.muted);
    label('Lower concurrency cap', 1030, 920, 32, C.green);
    label('Cycle ' + newCount + '   /   ' + val + ' GiB' + (allRevised ? '   /   8 cycles complete' : ''), 1030, 989, 34, C.ink);
  }
}
export default { id: 'soak', draw, cues: ['soak-first-four', 'soak-sample', 'soak-fifth', 'soak-cap', 'soak-replay'] };
