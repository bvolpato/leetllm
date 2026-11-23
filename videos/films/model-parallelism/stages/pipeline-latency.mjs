import { sceneClock } from '../scene-clock.mjs';

export function drawPipelineLatency(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const x = 383,
    scale = 193,
    compute = 2,
    transfer = 0.2;
  const duration = 3 * compute + 2 * transfer;
  const second = clock.progress('two-handoffs') > 0;
  const colors = [api.C.blue, api.C.cyan, api.C.yellow];
  api.focus.target('request-path', () => {
    api.text(ctx, 'One token   ·   elapsed time in milliseconds', 165, 282, 44, api.C.ink);
    for (let t = 0; t <= 7; t++) {
      const xp = x + t * scale;
      api.text(ctx, String(t), xp, 390, 33, api.C.muted, 'center');
      api.line(ctx, xp, 402, xp, 419, api.C.muted, 3);
    }
    function trace(y, overhead, label) {
      api.text(ctx, label, x - 32, y + 60, 34, api.C.ink, 'right');
      for (let stage = 0; stage < 3; stage++) {
        const start = x + stage * (compute + overhead) * scale;
        if (stage && overhead > 0)
          api.rect(
            ctx,
            start - overhead * scale,
            y,
            overhead * scale,
            96,
            api.C.pink,
            undefined,
            0,
          );
        api.rect(ctx, start, y, compute * scale - 2, 96, colors[stage], undefined, 0);
        api.text(
          ctx,
          `Stage ${stage + 1}   ·   2 ms`,
          start + (compute * scale) / 2,
          y + 62,
          35,
          api.C.bg,
          'center',
        );
      }
    }
    trace(464, 0, 'Compute only');
    if (second) {
      trace(650, transfer * clock.progress('two-handoffs'), 'With transfers');
      if (clock.done('two-handoffs'))
        api.text(ctx, 'Each pink interval is a 0.2 ms handoff', 960, 821, 38, api.C.pink, 'center');
    }
    const label = clock.done('arrival-time')
      ? `3 × 2 + 2 × 0.2 = ${duration} ms to finish`
      : second
        ? 'When does the token finish stage 3?'
        : 'Stage 3 must finish before this request can sample its next token';
    api.text(ctx, label, 960, 949, 45, api.C.ink, 'center');
  });
}
export default {
  id: 'pipeline-latency',
  draw: drawPipelineLatency,
  cues: ['single-token', 'two-handoffs', 'arrival-time', 'profile-stages'],
};
