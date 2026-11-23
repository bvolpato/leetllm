import { runFixture } from '../model.mjs';
import { cueProgress } from '../receipt.mjs';
import { card, text } from '../defaults.mjs';
const run = runFixture();
export function drawTraceLifecycle(ctx, scene, state, api) {
  if (state.beat >= 3) return drawTimer(ctx, scene, state, api);
  const { C: themeColors, teaching } = api;
  {
    const events = [
      'saved-app-trace-b1-1',
      'trace-first-call',
      'execution-journal-event-b2-1',
      'saved-app-trace-b3-1',
      'firstapp-result-handler-return',
    ];
    const index = events.filter((id) => cueProgress(scene, state, id) === 1).length;
    const current = run.journal[index];
    text(ctx, api, 'One attempt for acct_10234', 960, 300, 28, themeColors.muted, 'center');
    teaching.timeline({
      x: 200,
      y: 385,
      width: 1500,
      height: 315,
      domain: [0, 5],
      time: index,
      lanes: [
        {
          id: 'store',
          label: ' Trace store',
        },
        {
          id: 'work',
          label: ' Provider / reply',
        },
      ],
      intervals: [
        {
          id: 'initial',
          lane: 'store',
          start: 0,
          end: 1,
          label: 'save running',
          color: themeColors.blue,
        },
        {
          id: 'candidate',
          lane: 'work',
          start: 1,
          end: 3,
          label: 'candidate and check',
          color: themeColors.yellow,
        },
        {
          id: 'terminal',
          lane: 'store',
          start: 3,
          end: 4,
          label: 'save completed',
          color: themeColors.green,
        },
        {
          id: 'reply',
          lane: 'work',
          start: 4,
          end: 5,
          label: 'return result',
          color: themeColors.cyan,
        },
      ],
      ticks: [0, 1, 2, 3, 4, 5],
      labelWidth: 230,
      fontSize: 23,
    });
    api.focus.target('saved-app-trace', () =>
      card(
        ctx,
        api,
        current.trace
          ? `T-001 · ${current.trace.status} · version ${current.trace.version}`
          : 'No saved trace yet',
        250,
        780,
        1420,
        85,
        current.trace?.status === 'completed' ? themeColors.green : themeColors.yellow,
        30,
      ),
    );
    api.focus.target('execution-journal-event', () =>
      card(
        ctx,
        api,
        `${current.event} · provider calls ${current.providerCalls}`,
        250,
        905,
        1420,
        80,
        themeColors.blue,
        27,
      ),
    );
    void 0;
  }
}
function drawTimer(ctx, scene, state, api) {
  const { C } = api;
  const start = cueProgress(scene, state, 'trace-lifecycle-core-contract');
  const stop = cueProgress(scene, state, 'timer-stop');
  const whole = cueProgress(scene, state, 'browser-clock');
  const events = [
    [195, 'Click'],
    [490, 'Save running'],
    [791, 'Call provider'],
    [1134, 'Check answer'],
    [1430, 'Save outcome'],
    [1725, 'Show reply'],
  ];
  text(ctx, api, 'One request, from click to reply', 960, 330, 48, C.ink, 'center');
  api.line(ctx, 195, 590, 1725, 590, C.muted, 4);
  for (const [x, label] of events) {
    api.circle(ctx, x, 590, 9, C.ink);
    text(ctx, api, label, x, 659, 35, C.ink, 'center');
  }
  if (state.beat === 3) {
    text(ctx, api, 'Which part does the trace time?', 960, 846, 48, C.yellow, 'center');
    return;
  }
  api.focus.target('trace-clock', () => {
    if (start === 0) return;
    const left = 791,
      right = 1134;
    api.line(ctx, left, 497, left, 556, C.yellow, 5);
    api.line(ctx, left, 505, left + (right - left) * stop, 505, C.yellow, 8);
    if (stop === 1) api.line(ctx, right, 497, right, 556, C.yellow, 5);
    text(ctx, api, 'latency_ms', 960, 460, 38, C.yellow, 'center');
  });
  api.focus.target('whole-wait', () => {
    if (whole === 0) return;
    const left = 195,
      right = 1725;
    api.line(ctx, left, 719, left, 774, C.blue, 5);
    api.line(ctx, left, 765, left + (right - left) * whole, 765, C.blue, 8);
    if (whole === 1) api.line(ctx, right, 719, right, 774, C.blue, 5);
    text(ctx, api, 'Luna’s wait', 960, 862, 43, C.blue, 'center');
  });
}
export default {
  id: 'trace-lifecycle',
  draw: drawTraceLifecycle,
  cues: [
    'saved-app-trace-b1-1',
    'trace-first-call',
    'execution-journal-event-b2-1',
    'saved-app-trace-b3-1',
    'firstapp-result-handler-return',
    'trace-lifecycle-core-contract',
    'timer-stop',
    'browser-clock',
  ],
};
