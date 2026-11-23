import { afterCue, sampleModel } from '../construction.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api;
  const {
    cases,
    deviceStart: start,
    deviceEnd: finish,
    enqueueEnd: submitted,
    time: now,
  } = sampleModel(scene.id, state);
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  if (state.beat === 0) {
    focus.target('synthesis-reference', () => {
      const headings = ['Input', 'Dense output', 'Tiled output'];
      [150, 805, 1365].forEach((x, i) => label(headings[i], x, 316, 40));
      cases.forEach((c, i) => {
        const y = 448 + 134 * i;
        const printed = (xs) => xs.map((v) => Number(v.toFixed(3))).join(' , ');
        label(c.label, 150, y, 39, C.blue);
        label(printed(c.dense), 805, y, 39, C.ink);
        label(printed(c.tiled), 1365, y, 39, c.passed ? C.green : C.pink);
      });
      label('CPU arithmetic   ·   same masks, values and scale', 150, 991, 32, C.muted);
    });
    return;
  }
  const x = (t) => 505 + 30 * t;
  label('Illustrative warmed trace   ·   milliseconds from host start', 150, 296, 36);
  [0, 10, 20, 30, 40].forEach((ms) => {
    api.line(ctx, x(ms), 369, x(ms), 391, C.muted, 2);
    label(ms, x(ms), 354, 31, C.muted, 'center');
  });
  api.line(ctx, x(0), 390, x(finish), 390, C.muted, 3);
  focus.target('trace-host-lane', () => {
    label('Host submission', 145, 521, 40, C.blue);
    if (now > 0)
      api.rect(ctx, x(0), 470, x(Math.min(now, submitted)) - x(0), 60, C.blue, undefined, 2);
    label(
      now >= submitted ? 'Host returned at 2 ms' : 'Host calls the kernel',
      620,
      521,
      35,
      C.blue,
    );
  });
  focus.target('trace-device-lane', () => {
    label('Device work', 145, 710, 40, C.cyan);
    if (now > start) api.rect(ctx, x(start), 658, x(now) - x(start), 63, C.cyan, undefined, 2);
    api.line(ctx, x(now), 629, x(now), 746, C.yellow, 4);
    label(`Clock   ${Number(now.toFixed(1))} ms`, 146, 840, 39, C.yellow);
    const durationKnown = afterCue(state, 2, 'trace-duration');
    const message = durationKnown
      ? `Device duration   ${finish} - ${start} = ${finish - start} ms`
      : state.beat === 1
        ? 'How much device work has finished when the host returns?'
        : 'Start at 1 ms. Stop when the device finishes.';
    label(message, 146, 966, 40, durationKnown ? C.green : C.ink);
  });
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['trace-reference', 'trace-host', 'trace-device', 'trace-duration'],
};
