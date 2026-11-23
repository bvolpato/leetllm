import { projection } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';

const lapUs = 100;

function drawWatch(ctx, api, x, name, ms, rate, color) {
  const { C, circle, line, path, rect, text } = api;
  const y = 560;
  const radius = 218;
  const us = ms * 1000;
  const point = (fraction, r) => {
    const angle = 2 * Math.PI * (fraction - 0.25);
    return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
  };
  rect(ctx, x - 14, y - radius - 28, 28, 34, C.muted, undefined, 3);
  rect(ctx, x - 41, y - radius - 48, 82, 23, color, undefined, 7);
  circle(ctx, x, y, radius, C.panel, C.muted, 5);
  for (let i = 0; i < 20; i++) {
    const outer = point(i / 20, radius - 19);
    const inner = point(i / 20, radius - (i % 5 === 0 ? 42 : 30));
    line(ctx, outer.x, outer.y, inner.x, inner.y, C.muted, i % 5 === 0 ? 5 : 3);
  }
  const elapsed = us / lapUs;
  const arc = Array.from({ length: 65 }, (_, i) => point((elapsed * i) / 64, radius));
  path(ctx, arc, { color, width: 13 });
  const tip = arc.at(-1);
  circle(ctx, tip.x, tip.y, 13, color);
  text(ctx, name, x, y - 36, 38, C.ink, 'center');
  text(ctx, us.toFixed(1), x, y + 65, 112, color, 'center', 'mono');
  text(ctx, 'µs', x, y + 122, 37, C.muted, 'center');
  text(ctx, rate, x, 856, 42, color, 'center');
}

export function drawIntro(ctx, scene, state, api) {
  const { C, text, lerp } = api;
  const at = (name, beat) => accEvent(scene, state, name, beat);
  const rows = 8;
  const original = projection(rows);
  const rate = 200e12 * (1 + at('upgrade', 2));
  const current = projection(rows, rate);
  // Join the two clocks in flight. They started together, and arithmetic has already stopped.
  const memoryStop = state.cues?.['ag-intro-clocks']?.end ?? 12;
  const sweep = state.beat > 0 ? 1 : Math.min(1, state.t / memoryStop);
  const memoryClock = lerp(current.memoryMs / 4, current.memoryMs, sweep);
  api.focus.target('decode-clock', () => {
    text(ctx, 'One decode projection   ·   ' + rows + ' token rows', 960, 239, 38, C.ink, 'center');
    drawWatch(
      ctx,
      api,
      550,
      'Arithmetic',
      current.computeMs,
      (rate / 1e12).toFixed(0) + ' TFLOP/s',
      C.cyan,
    );
    drawWatch(ctx, api, 1370, 'Move bytes', memoryClock, '1 TB/s', C.pink);
    let caption = 'Clocks start together   ·   100 µs per lap';
    if (at('finish', 2) === 1) {
      caption =
        'Arithmetic   ' +
        (original.computeMs * 1000).toFixed(1) +
        ' → ' +
        (current.computeMs * 1000).toFixed(1) +
        ' µs     ·     Earliest finish   ' +
        (current.floorMs * 1000).toFixed(1) +
        ' µs';
    } else if (state.beat === 2) {
      caption = 'Twice the arithmetic speed   ·   Same memory bandwidth';
    } else if (at('wait', 1) > 0) {
      caption = 'Twice the arithmetic speed. Where does the finish move?';
    } else if (state.beat > 0) {
      caption = 'With perfect overlap, the later clock sets the finish.';
    }
    text(ctx, caption, 960, 983, 42, state.beat === 0 ? C.muted : C.yellow, 'center');
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'ag-intro-rows',
    'ag-intro-clocks',
    'ag-intro-wait',
    'ag-intro-upgrade',
    'ag-intro-finish',
  ],
};
