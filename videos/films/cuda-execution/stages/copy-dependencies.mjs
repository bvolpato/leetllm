import { modeledCopySchedule } from '../arithmetic.mjs';
import { directed, mix } from '../construction.mjs';
import { drawAddedCell as cell, drawAddedText as text } from '../defaults.mjs';

export function drawCopyDependencies(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 4) {
    const copy = directed(state, 'copy-readiness', 4);
    text(ctx, api, 'Copy one pooled feature back to the host', 160, 284, 39, C.ink);
    focus.target('host-destination', () => {
      text(ctx, api, 'Device source', 440, 465, 36, C.cyan, 'center');
      cell(ctx, api, '2.625', 248, 508, 384, 117, C.cyan, 49);
      text(ctx, api, 'Pinned host destination', 1430, 465, 36, C.blue, 'center');
      cell(ctx, api, copy === 1 ? '2.625' : '·', 1238, 508, 384, 117, C.blue, 49);
      api.arrow(ctx, 669, 565, 1192, 565, C.muted, 3);
      if (copy > 0 && copy < 1)
        api.circle(ctx, mix(688, 1165, copy), 565, 13, C.cyan);
      text(ctx, api, copy === 1 ? 'Copy complete   /   CPU can read' : 'CPU read pending',
        960, 822, 47, copy === 1 ? C.green : C.yellow, 'center');
    });
    return;
  }
  const overlap = state.beat > 0;
  const schedule = modeledCopySchedule(overlap);
  const { inputReady, computeReady, completion } = schedule;
  const initialCopies = inputReady.A * directed(state, 'copy-start-a', 1, 0.35, 0.55) +
    (inputReady.B - inputReady.A) * directed(state, 'copy-overlap', 1, 0.63, 0.8);
  const time = state.beat === 0 ? completion * directed(state, 'copy-serial', 0)
    : state.beat === 3 ? inputReady.B * directed(state, 'copy-ownership', 3)
    : initialCopies + (completion - inputReady.B) * directed(state, 'copy-finish', 2);
  const x = ms => 315 + ms * 69;
  text(ctx, api, overlap ? 'Separate copy and compute streams' : 'One CUDA stream',
    160, 272, 40, C.ink);
  text(ctx, api, 'Modeled batches   /   3 ms to copy, 7 ms to compute', 160, 348, 31, C.muted);
  focus.target('copy-schedule', () => {
    for (const [lane, y] of [['copy', 492], ['compute', 687]]) {
      text(ctx, api, lane, 145, y + 12, 32, C.ink);
      api.line(ctx, x(0), y + 32, x(20), y + 32, C.muted, 2);
      for (const event of schedule.events.filter(event => event.lane === lane)) {
        const width = x(Math.min(time, event.end)) - x(event.start);
        if (width <= 0) continue;
        const color = event.owner === 'A' ? C.blue : C.cyan;
        api.rect(ctx, x(event.start), y - 25, width, 50, color, undefined, 2);
        if (width > 65)
          text(ctx, api, event.owner, x(event.start) + width / 2, y + 12, 31, C.bg, 'center', true);
      }
    }
    for (const tick of [0, 3, 6, 10, 13, 17, 20]) {
      api.line(ctx, x(tick), 766, x(tick), 781, C.muted, 2);
      text(ctx, api, tick, x(tick), 826, 28, C.muted, 'center', true);
    }
    for (const [top, bottom] of [[433, 460], [527, 651], [722, 745]])
      api.line(ctx, x(time), top, x(time), bottom, C.yellow, 3);
    if (overlap) {
      for (const name of ['A', 'B']) {
        const arrival = inputReady[name], launch = computeReady[name];
        if (time < arrival) continue;
        const color = name === 'A' ? C.blue : C.cyan;
        api.circle(ctx, x(arrival), 518, 7, color);
        api.line(ctx, x(arrival), 529, x(arrival), 586, color, 3);
        if (launch > arrival && time > arrival)
          api.line(ctx, x(arrival), 586, x(Math.min(time, launch)), 586, color, 3);
        if (time >= launch) api.arrow(ctx, x(launch), 586, x(launch), 650, color, 3);
      }
    }
  });
  if (overlap && state.beat < 3) {
    focus.target('device-inputs', () => {
      for (const [i, name] of ['A', 'B'].entries()) {
        const start = schedule.events.find(event => event.owner === name && event.lane === 'copy').start;
        const end = schedule.events.find(event => event.owner === name && event.lane === 'compute').end;
        const status = time >= end ? 'kernel done' : time >= computeReady[name] ? 'kernel reading'
          : time >= inputReady[name] ? 'input ready' : time >= start ? 'copying' : 'empty';
        cell(ctx, api, 'device ' + name + '  /  ' + status, 178 + 808 * i, 855, 745, 79,
          i === 0 ? C.blue : C.cyan, 32);
      }
    });
  }
  focus.target('batch-ready', () => {
    if (state.beat === 3) {
      for (const [i, name] of ['A', 'B'].entries()) {
        const ready = time >= schedule.inputReady[name];
        text(ctx, api, 'Pinned host source ' + name, 190 + i * 825, 895, 30, C.muted);
        text(ctx, api, ready ? 'Ready to refill' : 'Keep source unchanged', 190 + i * 825,
          954, 37, ready ? C.green : C.yellow);
      }
    } else if (time === completion) {
      text(ctx, api, overlap ? 'A finished at ' + computeReady.B + ' ms     B finished at ' + completion + ' ms'
        : 'Both kernels finished at ' + completion + ' ms', 960, 997, 35, C.ink, 'center');
    }
  });
}

export default {
  id: 'copy-dependencies',
  draw: drawCopyDependencies,
  cues: ['copy-serial', 'copy-buffers', 'copy-start-a', 'copy-overlap', 'copy-finish', 'copy-ownership', 'copy-readiness'],
};
