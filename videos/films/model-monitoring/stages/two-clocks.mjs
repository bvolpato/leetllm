import { deployed, requests } from '../fixtures.mjs';
import { dot, line, text } from '../defaults.mjs';
import { monitoringScene } from '../storyboard.mjs';

const row = requests[0];
const minutesAgo = (mins) => 1620 - 10 * mins;
const snapshot = minutesAgo(row.age);
const heartbeat = minutesAgo(row.age + row.heartbeatHours * 60);
const noon = minutesAgo(0);

export default monitoringScene(
  'two-clocks',
  ['event', 'snapshot', 'receipt', 'outcomes'],
  (ctx, api, cue) => {
    const { C } = api;
    text(ctx, api, `${row.id}   /   backlog  ${row.backlog} jobs`, 160, 273, 40, C.ink, 'left');
    line(ctx, api, heartbeat, 556, noon, 556, C.muted, 3);
    dot(ctx, api, heartbeat, 556, C.pink, 13);
    text(ctx, api, '09:50   heartbeat', heartbeat, 620, 31, C.pink);
    dot(ctx, api, snapshot, 556, C.blue, 13);
    text(ctx, api, '11:50   snapshot', snapshot - 10, 620, 31, C.blue, 'right');
    dot(ctx, api, noon, 556, C.yellow, 13);
    text(ctx, api, '12:00   score', noon + 15, 620, 31, C.yellow, 'left');
    const interval = (left, right, y, progress, color) => {
      const end = left + (right - left) * progress;
      line(ctx, api, left, y - 10, left, y + 10, color, 4);
      line(ctx, api, left, y, end, y, color, 5);
      line(ctx, api, end, y - 10, end, y + 10, color, 4);
    };
    if (cue.started('event')) {
      interval(heartbeat, snapshot, 500, cue.progress('event'), C.pink);
      text(
        ctx,
        api,
        `Measured heartbeat age   ${row.heartbeatHours} h`,
        (heartbeat + snapshot) / 2,
        461,
        36,
        C.pink,
      );
    }
    if (cue.started('snapshot')) {
      interval(snapshot, noon, 427, cue.progress('snapshot'), C.blue);
      text(ctx, api, `Snapshot age   ${row.age} min`, (snapshot + noon) / 2, 382, 34, C.blue);
    }
    if (cue.started('receipt')) {
      text(
        ctx,
        api,
        `${deployed.model}   /   ${deployed.featureContract}   /   stored threshold ${deployed.threshold.toFixed(2)}`,
        960,
        774,
        37,
        C.ink,
      );
      text(ctx, api, `Score  ${row.score.toFixed(2)}   ·   no review`, 600, 883, 35, C.blue);
      if (cue.started('outcomes')) text(ctx, api, 'Outcome   pending', 1320, 883, 35, C.yellow);
    }
  },
);
