import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawDiagnoseTrace(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);

  if (state.beat === 3) {
    const checks = [
      ['Stale sum', 'Which buffer did replay read?', 'trace-address'],
      ['Changed cache', 'Which slot wrote that cell?', 'trace-cache'],
      ['Stalled worker', 'Who holds the slot it needs?', 'trace-owner'],
    ];
    checks.forEach(([symptom, question, cue], i) => {
      api.focus.target(cue, () => {
        const y = 355 + i * 228;
        txt(symptom, 215, y, 52, C.pink);
        if (p(cue) > 0) {
          api.arrow(ctx, 655, y - 18, 795, y - 18, C.cyan, 4);
          txt(question, 870, y, 46, C.ink);
        }
      });
    });
    return;
  }

  const second = state.beat > 0;
  const submit = second ? 2 : 8;
  const x = (t) => 415 + t * 124;
  function bar(from, to, y, color, label) {
    api.rect(ctx, x(from), y, x(to) - x(from), 92, C.panel, color, 8);
    txt(label, (x(from) + x(to)) / 2, y + 60, 34, color, 'center');
  }
  api.focus.target('trace-compute', () => {
    txt('Time (µs)', 155, 326, 39, C.muted);
    api.line(ctx, x(0), 322, x(10), 322, C.muted, 3);
    for (const t of [0, 2, 3, 8, 10]) {
      api.line(ctx, x(t), 314, x(t), 330, C.muted, 3);
      txt(t, x(t), 290, 33, C.ink, 'center');
    }
    txt('Compute', 155, 652, 42, C.cyan);
    bar(0, 3, 591, C.cyan, 'Kernel A');
    bar(8, 10, 591, C.cyan, 'Kernel B');
    api.line(ctx, x(3) + 12, 687, x(8) - 12, 687, C.yellow, 3);
    txt('5 µs idle', x(5.5), 650, 44, C.yellow, 'center');
  });
  api.focus.target('trace-host', () => {
    txt('CPU', 155, 471, 42, C.blue);
    api.circle(ctx, x(submit), 483, 11, C.blue);
    txt('Submit B', x(submit), 448, 40, C.blue, 'center');
  });
  api.focus.target('trace-producer', () => {
    if (second) {
      txt('Copy', 155, 852, 42, C.blue);
      bar(2, 8, 791, C.blue, 'Copy input for B');
      if (p('trace-release') > 0) {
        api.arrow(ctx, x(8), 786, x(8), 786 - 94 * p('trace-release'), C.green, 4);
        txt('Ready event', x(8) + 28, 763, 34, C.green);
      }
    }
  });
  api.focus.target('trace-next', () => {
    let note = '';
    if (state.beat === 0 && p('trace-compare') > 0) note = 'Test graph replay on the same work';
    if (state.beat === 2 && p('trace-profile') > 0)
      note = 'Nsight Systems   ·   CPU calls, device work and dependencies';
    if (state.beat === 2 && p('trace-kernel') > 0)
      note = 'One long kernel   →   inspect arithmetic and memory traffic';
    if (note) txt(note, 960, 985, 39, C.ink, 'center');
  });
}

export default {
  id: 'diagnose-trace',
  draw: drawDiagnoseTrace,
  cues: [
    'trace-gap',
    'trace-submit',
    'trace-compare',
    'trace-early',
    'trace-question',
    'trace-release',
    'trace-profile',
    'trace-kernel',
    'trace-address',
    'trace-cache',
    'trace-owner',
  ],
};
