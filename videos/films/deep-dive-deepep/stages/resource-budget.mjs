import { chapterModel } from '../construction.mjs';
import { sum } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

export function drawResourceBudget(ctx, scene, state, api) {
  const { C } = api;
  const m = chapterModel('resource-budget', state);
  const p = (id) => state.cues?.[id]?.progress ?? 0;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const label = (s, x, y, size, color = C.ink) => text(ctx, api, s, x, y, size, color, 'center');

  if (m.b === 0) {
    api.focus.target('de-resource-budget-mechanism', () => {
      const count = done('de-sm-floor')
        ? m.sms
        : done('de-sm-cap')
          ? m.aligned
          : done('de-resource-budget-b0')
            ? m.margin
            : m.rawSMs;
      label('Historical V2 communication budget', 960, 300, 42);
      api.rect(ctx, 225, 465, 1470, 100, C.panel, C.muted, 4);
      api.rect(ctx, 225, 465, (1470 * count) / m.deviceSMs, 100, C.blue, undefined, 0);
      label(count + ' / ' + m.deviceSMs + ' SMs', 960, 702, 60, C.cyan);
      label(
        'Raw estimate  ' + m.rawSMs + '    × 1.25    →    round up to an even count',
        960,
        829,
        36,
      );
      label(
        done('de-sm-floor')
          ? 'Without overlap preference, floor at 64 before the device cap'
          : 'With overlap preference, floor at 4 before the device cap',
        960,
        965,
        33,
        C.muted,
      );
    });
    return;
  }
  if (m.b === 1) {
    api.focus.target('de-resource-budget-mechanism', () => {
      label(
        m.sms + ' communication SMs     ·     ' + m.pool + ' allocated queue pairs',
        960,
        302,
        46,
        C.yellow,
      );
      label('Direct', 490, 488, 43, C.blue);
      label('Hybrid', 1430, 488, 43, C.cyan);
      label('min(' + m.sms + ', 9) = ' + m.directRequest, 490, 618, 53);
      label('16 × ' + m.sms + ' + 1 = ' + m.hybridRequest, 1430, 618, 53);
      label('Use ' + m.direct + ' queues', 490, 817, 45, C.blue);
      label(
        done('de-qp-clamp') ? 'Use ' + m.hybrid + ' queues' : 'Use ? queues',
        1430,
        817,
        45,
        C.cyan,
      );
    });
    return;
  }

  api.focus.target('de-resource-layer-result', () => {
    const a = m.serialA;
    const second = m.serialB;
    const step = p('de-serial-six-again');
    const total = sum(a);
    const x = 335,
      width = 1260;
    const names = ['Dispatch', 'Experts', 'Combine'];
    const colors = [C.blue, C.pink, C.cyan];
    label('Warm serial layer    ·    same routes, same outputs', 960, 297, 42);
    names.forEach((name, i) => {
      const cx = 530 + i * 432;
      label(name, cx, 404, 33, colors[i]);
      label('A  ' + a[i] + ' ms     B  ' + second[i] + ' ms', cx, 461, 32);
    });
    const track = (y, name, times, fraction, showTotal) => {
      text(ctx, api, name, 125, y + 56, 37);
      api.rect(ctx, x, y, width, 82, C.panel, C.muted, 4);
      let elapsed = 0;
      times.forEach((v, i) => {
        const painted = Math.max(0, Math.min(v, fraction * sum(times) - elapsed));
        if (painted > 0)
          api.rect(
            ctx,
            x + (width * elapsed) / total,
            y,
            (width * painted) / total,
            82,
            colors[i],
            undefined,
            0,
          );
        elapsed += v;
      });
      label(showTotal ? sum(times) + ' ms' : '?', 1724, y + 55, 40);
    };
    const first = m.b > 2 ? 1 : p('de-serial-six');
    const verdict = done('de-serial-verdict');
    track(567, 'A', a, first, first === 1);
    track(739, 'B', second, step, verdict);
    label('0', x, 887, 30, C.muted);
    label(total + ' ms', x + width, 887, 30, C.muted);
    const prompt = verdict
      ? '0.5 ms saved on communication     ·     0.5 ms added to expert work'
      : 'Does setting B finish the layer sooner?';
    label(prompt, 960, 1005, 35, C.yellow);
  });
}
export default {
  id: 'resource-budget',
  draw: drawResourceBudget,
  cues: [
    'de-resource-budget-b0',
    'de-sm-cap',
    'de-sm-floor',
    'de-qp-clamp',
    'de-serial-six',
    'de-serial-six-again',
    'de-serial-verdict',
  ],
};
