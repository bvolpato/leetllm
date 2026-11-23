import { spoken } from '../arithmetic.mjs';
import { drawDeviceTrace, trace } from '../trace.mjs';

function drawLaunchTimer(ctx, state, api) {
  const { C, text, circle, line, rect } = api;
  const reset = spoken(state, 'timer-start', 0) > 0;
  const launch = spoken(state, 'timed-launch', 0);
  const stopped = !reset || launch === 1;
  const elapsed = stopped ? trace.hostB : trace.hostB * launch;
  const row = stopped ? 2 : launch > 0 ? 1 : 0;
  const cx = 477, cy = 561, radius = 240;
  rect(ctx, cx - 24, cy - radius - 65, 48, 68, C.muted, undefined, 8);
  rect(ctx, cx - 61, cy - radius - 85, 122, 38, C.ink, undefined, 10);
  circle(ctx, cx, cy, radius, C.panel, C.cyan, 9);
  for (let i = 0; i < 12; i++) {
    const theta = i * Math.PI / 6;
    line(ctx, cx + 202 * Math.sin(theta), cy - 202 * Math.cos(theta),
      cx + 218 * Math.sin(theta), cy - 218 * Math.cos(theta), C.muted, 4);
  }
  text(ctx, 'CPU TIMER', cx, cy - 68, 34, C.muted, 'center');
  text(ctx, Number(elapsed.toFixed(1)) + ' µs', cx, cy + 43, 99, C.ink, 'center', 'mono');
  text(ctx, stopped ? 'Stopped' : 'Running', cx, cy + 122, 36, C.cyan, 'center');
  text(ctx, 'Candidate B   /   host code', 895, 315, 39, C.ink);
  const calls = ['timer.start()', 'launch_kernel()', 'timer.stop()'];
  calls.forEach((call, i) => {
    const y = 450 + 135 * i;
    if (row === i) {
      rect(ctx, 869, y - 71, 840, 103, C.panel, undefined, 9);
      rect(ctx, 869, y - 71, 10, 103, C.cyan, undefined, 3);
    }
    text(ctx, call, 925, y, 51, row === i ? C.cyan : C.muted, 'left', 'mono');
  });
  if (spoken(state, 'compare-calls', 0) > 0) {
    const factor = (trace.hostA / trace.hostB).toFixed(1);
    text(ctx, 'Baseline   ' + trace.hostA + ' µs', 265, 936, 43, C.blue);
    text(ctx, 'Candidate   ' + trace.hostB + ' µs', 764, 936, 43, C.cyan);
    text(ctx, factor + '×   for the launch call', 1700, 936, 43, C.yellow, 'right');
  } else {
    text(ctx, 'Example launch', 477, 920, 35, C.muted, 'center');
  }
}

export function drawIntro(ctx, scene, state, api) {
  if (state.beat === 0) {
    api.focus.target('launch-comparison', () => drawLaunchTimer(ctx, state, api));
    return;
  }
  const p = spoken(state, 'device-work', 1);
  const wait = spoken(state, 'host-wait', 1);
  const time = trace.hostB + (trace.stop - trace.hostB) * p + (trace.wait - trace.stop) * wait;
  api.focus.target('device-trace', () => {
    drawDeviceTrace(ctx, api, time);
    const bottom = wait === 1 ? 'Compare both kernels through completion.' :
      p === 1 ? 'Kernel finished. The host is still waiting.' : 'The launch call has returned.';
    api.text(ctx, bottom, 960, 924, 42, api.C.ink, 'center');
  });
}
export default { id: 'intro', draw: drawIntro, cues: ['timer-start', 'timed-launch', 'compare-calls', 'device-work', 'host-wait'] };
