import { target, text, withMpsRootFrame } from '../defaults.mjs';

export function paintTiming(ctx, scene, state, api, C, c, t, s) {
  const x = (ms) => 355 + 34 * ms;
  const elapsed = s.elapsed;
  const clock = s.synchronized ? elapsed : Math.min(elapsed, s.hostDispatch);
  text(
    ctx,
    api,
    C,
    'Same warmed block  /  illustrative milliseconds',
    960,
    270,
    38,
    C.ink,
    'center',
  );
  target(ctx, api, 'work-timeline', () => {
    const lane = (label, y, start, end, color) => {
      text(ctx, api, C, label, 307, y + 39, 32, color, 'right');
      api.line(ctx, x(0), y + 55, x(40), y + 55, C.muted, 2);
      const width = x(Math.min(end, elapsed)) - x(start);
      if (width > 0) api.rect(ctx, x(start), y, width, 49, color, color, 3);
    };
    lane('Python', 400, 0, s.hostDispatch, C.blue);
    lane('MPS', 578, s.hostDispatch, s.deviceEnd, C.cyan);
    if (s.synchronized && elapsed > s.hostDispatch) {
      api.rect(
        ctx,
        x(s.hostDispatch),
        400,
        x(elapsed) - x(s.hostDispatch),
        49,
        C.panel,
        C.yellow,
        3,
      );
      if (elapsed > 15)
        text(
          ctx,
          api,
          C,
          'waiting',
          (x(s.hostDispatch) + x(elapsed)) / 2,
          434,
          27,
          C.yellow,
          'center',
        );
    }
    for (let ms = 0; ms <= 40; ms += 5) {
      api.line(ctx, x(ms), 651, x(ms), 668, C.muted, 2);
      text(ctx, api, C, String(ms), x(ms), 710, 28, C.muted, 'center');
    }
    if (elapsed >= s.hostDispatch) {
      api.line(ctx, x(s.hostDispatch), 456, x(s.hostDispatch), 552, C.blue, 3);
      text(ctx, api, C, 'Python returns', x(s.hostDispatch) + 16, 518, 28, C.blue);
    }
  });
  target(ctx, api, 'clock-result', () => {
    text(ctx, api, C, 'Host timer', 620, 847, 36, C.ink, 'right');
    text(
      ctx,
      api,
      C,
      clock.toFixed(1) + ' ms',
      960,
      856,
      76,
      s.synchronized ? C.green : C.yellow,
      'center',
    );
  });
  target(ctx, api, 'sync-boundary', () => {
    const status = s.synchronized
      ? elapsed === s.deviceEnd
        ? 'Stop after the last queued operation'
        : 'Stop when the final synchronization returns'
      : elapsed < s.hostDispatch
        ? 'Start at dispatch'
        : 'Stop at the Python return';
    text(ctx, api, C, status, 960, 970, 37, C.ink, 'center');
  });
}
export function drawTimingStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, paintTiming);
}
export default {
  id: 'timing',
  draw: drawTimingStage,
  cues: ['dispatch-send', 'dispatch-clock', 'repeat-send', 'wait-completion'],
};
