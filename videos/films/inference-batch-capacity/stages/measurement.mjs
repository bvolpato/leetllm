import { bandwidthPoint } from '../arithmetic.mjs';
import { sceneClock } from '../clock.mjs';
import { GiB, hardware, pool } from '../fixtures.mjs';

const current = bandwidthPoint(16);
const next = bandwidthPoint(17);
const weightMs = (hardware.weights / hardware.bandwidth) * 1000;

export function drawMeasurement(ctx, scene, state, api) {
  const { C, focus } = api;
  const clock = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const x = 145,
    width = 1490;
  const limits = (edge, y, text) => {
    api.line(ctx, edge, y - 15, edge, y + 89, C.yellow, 4);
    label(text, edge, y - 39, 32, C.yellow, 'right');
  };
  label('4,096 prompt positions   +   1,024 possible output positions per request', x, 247, 34);
  focus.target('measurement-reservation', () => {
    const memoryUnit = width / (pool / GiB);
    const unitRequest = ((current.reserved / GiB) * memoryUnit) / current.batch;
    const n = Math.floor(current.batch * clock.progress('reserved'));
    const extra = clock.progress('extra-space');
    label('Space promised', x, 375, 41);
    api.rect(ctx, x, 421, width, 74, C.panel, C.muted, 0);
    for (let i = 0; i < n; i++) {
      api.rect(ctx, x + i * unitRequest, 421, unitRequest - 2, 74, C.cyan, undefined, 0);
    }
    if (extra > 0)
      api.rect(
        ctx,
        x + current.batch * unitRequest,
        421,
        unitRequest * extra,
        74,
        C.green,
        undefined,
        0,
      );
    limits(x + width, 421, '16 GiB pool');
    const reserved = (extra === 1 ? next.reserved : current.reserved) / GiB;
    if (clock.after('reserved')) {
      label(
        reserved + ' GiB reserved   ·   ' + (pool / GiB - reserved) + ' GiB available',
        x,
        555,
        34,
        C.cyan,
      );
    }
  });
  focus.target('measurement-clock', () => {
    const timeUnit = width / 40;
    const weights = clock.progress('weights') * weightMs;
    const kv = clock.progress('live') * (current.ms - weightMs);
    const extra = clock.progress('extra-time') * (next.ms - current.ms);
    label('Time for one full read', x, 693, 41);
    api.rect(ctx, x, 737, width, 74, C.panel, C.muted, 0);
    if (weights > 0) api.rect(ctx, x, 737, weights * timeUnit, 74, C.blue, undefined, 0);
    if (kv > 0)
      api.rect(ctx, x + weightMs * timeUnit, 737, kv * timeUnit, 74, C.cyan, undefined, 0);
    if (extra > 0) api.rect(ctx, x + width, 737, extra * timeUnit, 74, C.pink, undefined, 0);
    limits(x + width, 737, '40 ms target');
    if (clock.after('weights')) label('12 GiB shared weights', x, 881, 33, C.blue);
    if (clock.after('live')) {
      const read = clock.after('extra-time') ? next.kvRead : current.kvRead;
      label(read / GiB + ' GiB current histories', x + weightMs * timeUnit, 881, 33, C.cyan);
    }
    const atLimit =
      current.batch +
      ' requests   ·   ' +
      current.ms +
      ' ms   ·   ' +
      current.tps +
      ' modeled tokens/s';
    const overLimit = next.batch + ' requests   ·   ' + next.ms + ' ms   ·   1 ms past the target';
    label(
      clock.after('extra-time')
        ? overLimit
        : clock.after('live')
          ? atLimit
          : 'Assumed read bandwidth  ·  500 GiB/s',
      x,
      988,
      39,
      clock.after('extra-time') ? C.pink : C.muted,
    );
  });
}
export default { id: 'measurement', draw: drawMeasurement };
