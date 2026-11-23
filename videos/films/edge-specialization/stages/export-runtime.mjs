import { executeGraph } from '../model.mjs';
import { cueProgress, fieldDrawing } from '../field-drawing.mjs';

const paths = [
  executeGraph(['cpu', 'cpu', 'cpu']),
  executeGraph(['npu', 'cpu', 'npu']),
  executeGraph(['npu', 'npu', 'npu']),
];

export function drawExportRuntime(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api);
  const { C, text, line, rect, target } = p;
  const b = state.beat ?? 0;
  const cue = (id, beat, start, end) => cueProgress(state, id, beat, start, end);
  const allInput = cue('whole-input', 2, 0.47, 0.56) === 1;
  const splitInput = cue('split-input', 1, 0.02, 0.22) > 0;
  const placement = allInput ? 2 : splitInput ? 1 : 0;
  const released = [
    cue('cpu-result', 0, 0.69, 0.79),
    cue('split-total', 2, 0.31, 0.44),
    cue('whole-result', 2, 0.76, 0.83),
  ];
  const run = [
    cue('cpu-run', 0, 0.13, 0.63),
    cue('split-run', 2, 0.02, 0.23),
    cue('whole-run', 2, 0.62, 0.74),
  ];
  const cpuNames = ['Projection', 'Activation', 'Output'];
  const x0 = 375,
    x = (t) => x0 + 57 * t;
  const colors = { cpu: C.blue, npu: C.green, boundary: C.pink };

  target('runtime-ops', () => {
    const graph = paths[placement];
    const operations = graph.spans.filter((s) => s.device !== 'boundary');
    text('Input  [2, 1]', 144, 266, 35, C.muted);
    operations.forEach((s, i) => {
      const left = 430 + i * 461;
      text(cpuNames[i], left, 266, 40);
      const valueReady =
        i === 0
          ? cue('project-value', 0, 0.04, 0.13) === 1
          : i === 1
            ? cue('activation-value', 0, 0.14, 0.25) === 1
            : released[0] === 1;
      if (valueReady) text('[' + graph.results[i].join(', ') + ']', left, 329, 36);
      text(
        s.device.toUpperCase() + '   ' + (s.end - s.start) + ' ms',
        left,
        390,
        34,
        colors[s.device],
      );
    });
  });

  target('runtime-clock', () => {
    line(x(0), 488, x(22), 488, C.muted);
    for (const t of [0, 5, 10, 15, 20]) {
      line(x(t), 468, x(t), 489, C.muted);
      text(t + ' ms', x(t), 451, 26, C.muted, 'center');
    }
    if (splitInput) text('Each device crossing   +8 ms', 960, 970, 40, C.pink, 'center');
    else text('Illustrative costs for one ordered graph', 960, 970, 34, C.muted, 'center');
  });

  const rows = ['CPU', 'NPU / CPU / NPU', 'NPU'];
  target('runtime-active', () => {
    paths.slice(0, placement + 1).forEach((g, i) => {
      const y = 550 + i * 129;
      text(rows[i], 130, y + 43, i === 1 ? 28 : 34, C.ink);
      line(x(0), y + 66, x(22), y + 66, C.muted);
      const cursor = run[i] * g.total;
      for (const s of g.spans) {
        const width = (Math.min(s.end, cursor) - s.start) * 57;
        if (width <= 0) continue;
        rect(x(s.start), y, width, 60, colors[s.device]);
        if (width > 100 && cursor >= s.end)
          text(
            s.device === 'boundary' ? 'crossing  8' : s.end - s.start + ' ms',
            x(s.start) + width / 2,
            y + 40,
            29,
            C.bg,
            'center',
          );
      }
      if (released[i] === 1)
        text(g.total + ' ms   /   out ' + g.output, 1807, y + 40, 30, C.yellow, 'right');
      else if (i === 1 && b === 1) text('How many crossings?', x(1), y + 43, 35, C.yellow);
    });
  });
}
export default {
  id: 'export-runtime',
  draw: drawExportRuntime,
  cues: [
    'project-value',
    'activation-value',
    'cpu-run',
    'cpu-result',
    'split-input',
    'crossing-cost',
    'split-run',
    'split-total',
    'whole-input',
    'whole-run',
    'whole-result',
  ],
};
