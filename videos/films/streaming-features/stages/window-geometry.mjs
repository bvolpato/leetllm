import { formatClock } from '../arithmetic.mjs';
import { minuteScale, spoken } from '../request-clock.mjs';

export function drawWindowGeometry(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  api.focus.target('window-geometry-mechanism', () => {
    if (state.beat === 0) {
      const x = minuteScale(660, 750, 455, 1780);
      const event = 680;
      api.text(ctx, 'Tumbling', 108, 351, 40, C.blue);
      api.rect(ctx, x(660), 288, x(720) - x(660), 95, '#213047', C.blue, 4);
      api.text(ctx, '[11:00, 12:00)', x(720) - 40, 349, 38, C.ink, 'right');
      api.text(ctx, '11:20', x(event), 258, 34, C.yellow, 'center');
      api.line(ctx, x(event), 274, x(event), 388, C.yellow, 5);
      if (clock.started('sliding')) {
        api.text(ctx, 'Sliding', 108, 530, 40, C.cyan);
        const starts = [660, 665, 670, 675];
        starts.forEach((start, i) => {
          const y = 460 + i * 99;
          api.rect(ctx, x(start), y, x(start + 60) - x(start), 61, '#173041', C.cyan, 3);
          api.text(
            ctx,
            `${formatClock(start)} to ${formatClock(start + 60)}`,
            x(start + 60) - 22,
            y + 43,
            30,
            C.ink,
            'right',
          );
        });
        api.line(ctx, x(event), 408, x(event), 830, C.yellow, 5);
        api.text(
          ctx,
          'Four of the overlapping windows that contain this one event',
          108,
          939,
          39,
          C.ink,
        );
      }
    } else if (state.beat <= 2) {
      const x = minuteScale(660, 716, 335, 1720);
      const bridge = clock.started('bridge');
      const joined = clock.finished('merge');
      const times = [660, 670, ...(bridge ? [680] : []), 690, 700];
      api.text(ctx, 'Session gap    15 min', 109, 270, 37, C.muted);
      api.line(ctx, x(660), 515, x(715), 515, '#5a6071', 3);
      times.forEach((m) => {
        api.circle(ctx, x(m), 515, m === 680 ? 17 : 13, m === 680 ? C.yellow : C.cyan);
        api.text(ctx, formatClock(m), x(m), 462, 33, m === 680 ? C.yellow : C.ink, 'center');
      });
      const groups = joined
        ? [times]
        : [
            [660, 670],
            [690, 700],
          ];
      groups.forEach((group, i) => {
        const left = x(group[0]),
          right = x(group.at(-1));
        const color = joined ? C.green : i ? C.cyan : C.blue;
        api.line(ctx, left, 631, right, 631, color, 9);
        for (const bound of [left, right]) api.line(ctx, bound, 612, bound, 648, color, 4);
        api.text(ctx, `${group.length} heartbeats`, (left + right) / 2, 722, 38, color, 'center');
      });
      api.text(
        ctx,
        joined
          ? 'Retract the two earlier counts before publishing the merged session.'
          : 'How many sessions contain these heartbeats?',
        108,
        921,
        39,
        C.ink,
      );
    } else {
      const x = minuteScale(660, 755, 396, 1720);
      api.text(ctx, 'Event time', 109, 395, 36, C.muted);
      api.line(ctx, x(660), 385, x(755), 385, '#5b606b', 3);
      api.rect(ctx, x(660), 436, x(720) - x(660), 104, '#233249', C.blue, 4);
      api.text(ctx, '[11:00, 12:00)', x(690), 504, 39, C.ink, 'center');
      if (clock.started('fire')) {
        api.line(ctx, x(725), 330, x(725), 550, C.yellow, 4);
        api.text(ctx, 'Watermark 12:05', x(725), 298, 34, C.yellow, 'center');
        api.text(ctx, 'Main result emitted', x(690), 639, 37, C.blue, 'center');
      }
      if (clock.started('retained')) {
        api.line(ctx, x(720), 711, x(750), 711, C.green, 10);
        api.text(ctx, 'State retained until 12:30', x(750), 795, 36, C.green, 'right');
      }
      if (clock.started('default'))
        api.text(
          ctx,
          'Flink defaults to zero allowed lateness. A late side output needs configuration.',
          108,
          953,
          33,
          C.muted,
        );
    }
  });
}
export default {
  id: 'window-geometry',
  draw: drawWindowGeometry,
  cues: ['sliding', 'bridge', 'merge', 'fire', 'retained', 'default'].map(
    (id) => 'sf-window-geometry-' + id,
  ),
};
