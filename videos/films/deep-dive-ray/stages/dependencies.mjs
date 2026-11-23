import { text } from '../defaults.mjs';
import { parallel, serial } from '../fixtures.mjs';
import { documents, motion, passed } from '../ledger.mjs';

export function drawDependencies(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.green, C.yellow];
  const left = 476,
    unit = 137,
    height = 67;
  const serialEnd = serial.at(-1).end,
    parallelEnd = Math.max(...parallel.map((e) => e.end));
  const handoff = parallel.find((e) => e.id === 'C').start;
  const serialStop = serial.find((e) => e.id === 'C').start;
  const q = motion(state, 'schedule-serial', 0);
  const serialTime = q * serialStop + motion(state, 'schedule-nine', 1) * (serialEnd - serialStop);
  const atPair = motion(state, 'schedule-pair', 1);
  const hand = motion(state, 'schedule-handoff', 1);
  const end = motion(state, 'schedule-finish', 2);
  const clock = Math.max(atPair, hand * handoff) + (parallelEnd - handoff) * end;
  const yAt = (i) => 434 + i * 127;
  documents.forEach((name, i) => {
    const length = parallel[i].end - parallel[i].start;
    text(ctx, api, name + '   ' + length + ' units', 255 + i * 550, 267, 42, colors[i]);
  });
  for (let i = 0; i <= serialEnd; i++) {
    text(ctx, api, String(i), left + unit * i, 379, 30, C.muted, 'center');
    api.line(ctx, left + unit * i, 393, left + unit * i, 411, C.muted, 3);
  }
  function lane(label, events, time, index) {
    const y = yAt(index);
    text(ctx, api, label, left - 40, y + 47, 36, C.ink, 'right');
    api.line(ctx, left, y + height, left + unit * serialEnd, y + height, C.muted, 2);
    for (const e of events) {
      const width = unit * Math.max(0, Math.min(time, e.end) - e.start);
      if (width < 1) continue;
      const i = e.id.charCodeAt(0) - 65;
      api.rect(ctx, left + unit * e.start, y, width, height, colors[i], undefined, 2);
      if (width > 133)
        text(ctx, api, documents[i], left + e.start * unit + width / 2, y + 45, 31, C.bg, 'center');
    }
  }
  api.focus.target('schedule-comparison', () => {
    const run = () => lane('Immediate get', serial, serialTime, 0);
    if (state.beat === 0) api.focus.target('schedule-trace', run);
    else run();
  });
  api.focus.target('schedule-trace', () => {
    if (state.beat === 0) {
      lane('Other worker', [], 0, 1);
      text(ctx, api, 'idle', left + 40, yAt(1) + 45, 33, C.muted);
    } else {
      lane(
        'Worker 1',
        parallel.filter((e) => e.lane === 0),
        clock,
        1,
      );
      lane(
        'Worker 2',
        parallel.filter((e) => e.lane === 1),
        clock,
        2,
      );
      if (state.beat === 1 && passed(state, 'schedule-handoff', 1)) {
        const start = left + handoff * unit;
        api.line(ctx, start, yAt(2) + height + 6, start, 800, C.yellow, 3);
        text(ctx, api, 'trace starts here', start + 17, 822, 29, C.yellow);
      }
    }
  });
  const result = !passed(state, 'schedule-nine', 1)
    ? 'When will trace finish?'
    : passed(state, 'schedule-finish', 2)
      ? 'Last result   5 units     ·     Total work   9 worker units'
      : 'Serial finish   9 units     ·     Two-worker finish   ?';
  text(ctx, api, result, 960, 932, 41, C.ink, 'center');
}
export default {
  id: 'dependencies',
  draw: drawDependencies,
  cues: [
    'schedule-serial',
    'schedule-nine',
    'schedule-pair',
    'schedule-handoff',
    'schedule-finish',
    'schedule-compare',
  ],
};
