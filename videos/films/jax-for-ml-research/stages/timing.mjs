import { drawLeftText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const hostReturn = 1,
  ready = 12;
export function drawTiming(ctx, scene, state, api) {
  const { C } = api;
  const send = operationProgress(state, 'timer-return');
  const wait = operationProgress(state, 'timer-wait');
  const clock = hostReturn * send + (ready - hostReturn) * wait;
  drawLeftText(
    ctx,
    api,
    'Warm call   ·   inputs on device   ·   illustrative milliseconds',
    115,
    250,
    36,
    C.muted,
  );
  api.focus.target('timer-lanes', () => {
    api.teaching.timeline({
      x: 130,
      y: 337,
      width: 1630,
      height: 375,
      domain: [0, ready],
      time: clock,
      lanes: [
        { id: 'host', label: 'Python' },
        { id: 'device', label: 'Device' },
      ],
      intervals: [
        { id: 'send', lane: 'host', start: 0, end: hostReturn, label: 'send', color: C.blue },
        {
          id: 'run',
          lane: 'device',
          start: hostReturn,
          end: ready,
          label: 'execute',
          color: C.cyan,
        },
      ],
      ticks: [0, 4, 8, ready],
      formatTime: (v) => v + ' ms',
      fontSize: 30,
      labelWidth: 207,
    });
  });
  api.focus.target('timer-readout', () => {
    drawLeftText(ctx, api, 'Python returned', 122, 814, 34, C.blue);
    drawLeftText(ctx, api, 'Elapsed since call start', 900, 814, 34, C.yellow);
    drawLeftText(ctx, api, send === 1 ? hostReturn + ' ms' : '…', 122, 910, 64, C.ink);
    drawLeftText(ctx, api, clock.toFixed(1) + ' ms', 900, 910, 64, C.ink);
    const event =
      send < 1
        ? 'Issuing the call'
        : resultAfter(state, 'timer-wait')
          ? 'All result leaves ready'
          : 'Waiting for result leaves';
    drawLeftText(ctx, api, event, 1260, 904, 33, C.cyan);
  });
}
export default {
  id: 'timing',
  draw: drawTiming,
  cues: ['timer-return', 'timer-question', 'timer-wait', 'timer-finish'],
};
