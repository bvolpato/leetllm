import { cueProgress, fieldDrawing } from '../field-drawing.mjs';
import { drawHandbook } from '../handbook.mjs';
import { manuals } from '../fixtures.mjs';

function drawProbe(p, record) {
  const { C, rect, line, text, target } = p;
  // The cable connects the stamped probe to the reading on the handheld.
  line(191, 578, 191, 705, C.muted, 11);
  line(191, 705, 366, 705, C.muted, 11);
  rect(348, 683, 29, 44, C.muted, C.bg, 6);
  rect(176, 294, 30, 103, C.ink, C.muted, 12);
  rect(147, 361, 88, 77, C.muted, C.ink, 8);
  for (let y = 373; y < 428; y += 13) line(149, y, 233, y - 5, C.panel, 4);
  rect(122, 426, 138, 149, C.blue, C.ink, 17);
  rect(153, 570, 76, 40, C.muted, C.bg, 6);
  target('sensor-tag', () => {
    rect(141, 450, 100, 99, C.panel, C.ink, 8);
    text(record.sensor, 191, 528, 79, C.ink, 'center');
  });
}

export function drawIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const p = fieldDrawing(ctx, api);
  const { C, rect, line, text, dot, target } = p;
  const match = cueProgress(state, 'matched-page', 1, 0.02, 0.2);
  const defined = cueProgress(state, 'copied-meaning', 1, 0.21, 0.39) === 1;
  const copy = cueProgress(state, 'copy-to-log', 1, 0.4, 0.65);
  const log = cueProgress(state, 'log-request', 2, 0.02, 0.17) === 1;
  const explained = cueProgress(state, 'local-explanation', 2, 0.34, 0.54) === 1;
  const record = manuals.M7;
  drawProbe(p, record);

  rect(360, 218, 453, 589, C.panel, C.muted, 42);
  rect(387, 258, 399, 452, C.bg, C.muted, 16);
  text('OFFLINE', 740, 316, 26, C.yellow, 'right');
  dot(613, 306, 8, C.yellow);
  target('ticket-id', () => {
    text('Sensor code', 424, 399, 38, C.muted);
    text(record.code, 416, 548, 164, C.cyan);
  });
  line(423, 572, 750, 572, C.muted);
  target('ticket-answer', () => {
    text(explained ? 'Inspection log' : 'Manual entry', 423, 618, 29, C.muted);
    if (copy === 1) {
      text(explained ? 'The battery is low.' : record.meaning, 423, 672, 36, C.ink);
      text('M7', 750, 618, 28, C.yellow, 'right');
    }
  });
  for (const x of [447, 553, 659]) rect(x, 747, 66, 20, C.muted, undefined, 8);
  drawHandbook(p, {
    visible: true,
    meanings: false,
    selected: match > 0 ? 'M7' : null,
    sweep: match,
    showSelectedMeaning: defined,
    target: 'book-index',
  });
  if (copy > 0) {
    const path = [
      { x: 885, y: 437 },
      { x: 854, y: 437 },
      { x: 854, y: 648 },
      { x: 823, y: 648 },
    ];
    api.trace(ctx, path, copy, C.yellow, 4);
    const point = api.pointAlongPath(path, copy);
    dot(point.x, point.y, 7, C.yellow);
  }

  const prompt = log
    ? 'Write a sentence the technician can check.'
    : copy === 1
      ? 'A lookup supplies the entry and its source.'
      : match === 1
        ? 'Sensor A and E2 match page M7.'
        : 'Which page belongs to this sensor?';
  text(prompt, 960, 927, 46, C.ink, 'center');
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'sensor-stamp',
    'manual-pages',
    'matched-page',
    'copied-meaning',
    'copy-to-log',
    'log-request',
    'local-explanation',
  ],
};
