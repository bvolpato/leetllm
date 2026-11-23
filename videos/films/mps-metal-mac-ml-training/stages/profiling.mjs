import { profilingTrace } from '../arithmetic.mjs';
import { advancedCode, target, text, withMpsRootFrame } from '../defaults.mjs';

const queued = profilingTrace(false);

export function paintProfiling(ctx, scene, state, api, C, c, t, s) {
  const replay = s.step === 1;
  const x = (ms) => 445 + 32 * ms;
  text(ctx, api, C, 'Illustrated schedules  /  three equal kernels', 960, 274, 40, C.ink, 'center');
  target(ctx, api, 'signpost-trace', () => {
    const lane = (label, y, parts, until, color) => {
      text(ctx, api, C, label, 401, y + 35, 34, color, 'right');
      api.line(ctx, x(0), y + 52, x(40), y + 52, C.muted, 2);
      for (const [i, part] of parts.entries()) {
        const end = Math.min(part.end, until);
        if (end <= part.start) continue;
        const width = x(end) - x(part.start);
        const fill = part.kind === 'wait' ? C.yellow : part.kind === 'logging' ? C.pink : color;
        api.rect(ctx, x(part.start), y, width, 46, fill, C.bg, 2);
        if (part.kind === 'logging')
          text(ctx, api, C, part.kind, x(part.start), y - 24, 29, C.pink);
        else if (width > 95)
          text(ctx, api, C, part.kind || String(i + 1), x(part.start) + width / 2, y + 33, 29, C.bg, 'center');
      }
    };
    lane('Queued GPU', 375, queued.gpu, replay ? queued.completion : s.time, C.cyan);
    lane('Python host', 526, s.host, s.time, C.blue);
    text(ctx, api, C, 'blue = submit', 401, 607, 27, C.blue, 'right');
    if (replay) lane('Replay GPU', 674, s.gpu, s.time, C.cyan);
    api.line(ctx, x(0), 773, x(40), 773, C.muted, 2);
    for (let ms = 0; ms <= 40; ms += 5) {
      api.line(ctx, x(ms), 765, x(ms), 783, C.muted, 2);
      text(ctx, api, C, String(ms), x(ms), 826, 28, C.muted, 'center');
    }
    text(ctx, api, C, 'elapsed ms', 401, 821, 28, C.muted, 'right');
  });
  target(ctx, api, 'profiler-boundary', () => {
    if (replay)
      advancedCode(ctx, api, C, 'profile(wait_until_completed=False)', 960, 945, 36, C.yellow);
    else
      text(ctx, api, C, 'Instruments  /  align PyTorch signposts with the Metal GPU track', 960, 945, 35, C.ink, 'center');
  });
}
export function drawProfilingStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, paintProfiling);
}
export default {
  id: 'profiling',
  draw: drawProfilingStage,
  cues: ['capture-signposts', 'logging-gaps', 'preserve-profile-schedule'],
};
