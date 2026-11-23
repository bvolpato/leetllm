import { cueClock, drawReservation } from '../cued-trace.mjs';
import { deadlineReservation } from '../model.mjs';

export function drawDeadlineFloor(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  if (state.beat === 4) {
    const maximum = 3;
    const disableRetries = clock.after('single-owner');
    const attempts = disableRetries ? 1 : maximum;
    const showCount = clock.after('retry-count');
    const count = maximum * attempts;
    const highlighted = Math.ceil(clock.p('nested-calls') * maximum);
    api.focus.target('attempt-grid', () => {
      api.text(ctx, 'Wrapper invocation', 185, 322, 35, C.muted);
      api.text(ctx, 'Provider attempts', 690, 322, 35, C.muted);
      for (let i = 0; i < maximum; i++) {
        const y = 440 + 155 * i;
        api.text(ctx, 'Call ' + (i + 1), 185, y + 12, 43, C.ink);
        for (let j = 0; j < attempts; j++) {
          const n = i * attempts + j + 1;
          const x = 755 + j * 275;
          api.circle(ctx, x, y, 42, i < highlighted ? C.blue : C.panel, C.blue, 2);
          if (showCount) api.text(ctx, String(n), x, y + 12, 31, C.bg, 'center');
        }
      }
      if (showCount)
        api.text(
          ctx,
          count +
            (disableRetries
              ? ' provider attempts with SDK retries disabled'
              : ' possible provider attempts'),
          185,
          958,
          44,
          C.ink,
        );
    });
    return;
  }
  const baseline = deadlineReservation(6);
  const replay = deadlineReservation(5.5);
  const plan = state.beat < 2 ? baseline : replay;
  const limit =
    baseline.remaining + (replay.remaining - baseline.remaining) * clock.p('reserve-less');
  const parts = ['reserve-floor', 'reserve-jitter', 'reserve-call', 'reserve-check'];
  const progress = parts.map((id) => clock.p(id));
  api.focus.target('retry-ruler', () => {
    api.text(ctx, 'Temporary rate limit  /  read-only request', 165, 262, 35, C.muted);
    const labels = ['Header floor', 'Sampled jitter', 'Call allowance', 'Validation'];
    const values = [plan.floor, plan.jitter, plan.call, plan.check];
    const colors = [C.yellow, C.cyan, C.blue, C.green];
    for (let i = 0; i < parts.length; i++) {
      if (clock.started(parts[i])) {
        const x = 165 + i * 400;
        api.text(ctx, labels[i], x, 385, 32, colors[i]);
        api.text(ctx, values[i] + ' s', x, 455, 52, C.ink);
      }
    }
    drawReservation(ctx, api, plan, {
      left: 170,
      width: 1510,
      domain: 6.5,
      y: 762,
      progress,
      limit,
    });
    if (clock.after('reserve-check'))
      api.text(ctx, 'Planned finish at +' + plan.required + ' s', 165, 883, 36, C.ink);
  });
  api.focus.target('reservation-verdict', () => {
    let label = 'Time needed after the first attempt';
    let color = C.muted;
    if (state.beat === 1 && clock.after('reserve-admit')) {
      label =
        'Admit retry   ·   ' + baseline.required + ' s fits inside ' + baseline.remaining + ' s';
      color = C.green;
    } else if (state.beat >= 2) {
      label = 'Can the wrapper schedule the same retry?';
      color = C.ink;
      if (clock.after('reserve-deny') && !replay.admitted) {
        label =
          'Stop   ·   validation would run ' +
          (replay.required - replay.remaining).toFixed(1) +
          ' s past the limit';
        color = C.pink;
      }
    }
    api.text(ctx, label, 165, 995, 42, color);
  });
}

export default {
  id: 'deadline-floor',
  draw: drawDeadlineFloor,
  cues: [
    'reserve-floor',
    'reserve-jitter',
    'reserve-call',
    'reserve-check',
    'reserve-admit',
    'reserve-less',
    'reserve-deny',
    'nested-calls',
    'retry-count',
    'single-owner',
  ],
};
