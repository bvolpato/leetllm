import { availableHeartbeat, formatClock, typedParity } from '../arithmetic.mjs';
import { heartbeats } from '../fixtures.mjs';
import { minuteScale, receipt, spoken } from '../request-clock.mjs';

export function drawWrap(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const repair = clock.started('probe');
  const x = minuteScale(720, 960, 375, 1705);
  const reads = [900, 960];
  const lastHeartbeat = availableHeartbeat(heartbeats, reads[1]);
  const logged = 0.03;
  const mismatch = typedParity({ age: lastHeartbeat.ageHours }, { age: logged });
  api.text(ctx, 'J-204   /   Heartbeat age in hours', 108, 235, 36, C.muted);
  api.focus.target('timestamp-probe', () => {
    api.line(ctx, x(720), 463, x(960), 463, '#4a4e58', 5);
    api.circle(ctx, x(lastHeartbeat.event), 463, 15, C.cyan);
    api.text(
      ctx,
      `${lastHeartbeat.id} sent ${formatClock(lastHeartbeat.event)}`,
      x(lastHeartbeat.event),
      405,
      37,
      C.cyan,
      'center',
    );
    reads.forEach((cutoff, i) => {
      if (!repair && !i) return;
      const result = availableHeartbeat(heartbeats, cutoff);
      const y = i ? 569 : 664;
      api.line(ctx, x(cutoff), 433, x(cutoff), 485, C.yellow, 4);
      api.text(ctx, formatClock(cutoff), x(cutoff), 403, 35, C.yellow, 'center');
      if ((i && !repair) || (repair && clock.finished(i ? 'four' : 'three'))) {
        api.line(ctx, x(result.event), y, x(cutoff), y, C.cyan, 6);
        api.circle(ctx, x(cutoff), y, 9, C.cyan);
        api.text(
          ctx,
          `${formatClock(cutoff)} − ${formatClock(result.event)} = ${result.ageHours} h`,
          x(cutoff),
          y - 21,
          33,
          C.cyan,
          'right',
        );
      }
    });
  });
  api.focus.target('failed-row', () =>
    receipt(ctx, api, {
      y: 816,
      label: '16:00 paired row',
      value: `Replay  ${lastHeartbeat.ageHours.toFixed(1)} h       Captured  ${logged} h`,
      color: mismatch.length ? C.pink : C.green,
    }),
  );
  if (clock.finished('stop')) {
    api.text(
      ctx,
      repair
        ? 'Check the value returned by both live reads.'
        : 'Hold the comparison. Trace the age field.',
      108,
      953,
      38,
      C.yellow,
    );
  }
}
export default {
  id: 'wrap',
  draw: drawWrap,
  cues: ['stop', 'probe', 'three', 'four'].map((id) => 'sf-wrap-' + id),
};
