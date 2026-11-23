import { trainingCompleted, trainingStarted } from '../construction.mjs';
import { boundary, trainingRun } from '../boundaries.mjs';
import { drawLine, drawText } from '../defaults.mjs';

const windows = [
  ['overflow-first', true],
  ['overflow-skip', false],
  ['overflow-last', true],
];
const skippedRows = [
  ['overflow-skip', 'skip-outcome', 0.15],
  ['overflow-consumed', 'skip-consumed', 0.32],
  ['overflow-weight', 'skip-updates', 0.4],
  ['overflow-schedule', 'skip-schedule', 0.62],
  ['overflow-scale', 'skip-scale', 0.8],
];
export function drawOverflow(ctx, scene, state, api) {
  const { C } = api;
  const { beat, beatP } = state;
  const { perUpdate } = boundary(trainingRun);
  drawText(
    ctx,
    api,
    'Each attempted window reads ' + perUpdate + ' examples.',
    160,
    257,
    39,
    C.ink,
  );
  const labels = [
    'Window outcome',
    'Examples consumed',
    'Successful updates',
    'Scheduler position',
    'Loss scale',
  ];
  const colors = [C.muted, C.cyan, C.blue, C.blue, C.yellow];
  let used = 0,
    steps = 0,
    scale = 8;
  const rowY = (i) => 424 + i * 119;
  labels.forEach((label, i) => drawText(ctx, api, label, 160, rowY(i) + 50, 33, colors[i]));
  api.focus.target('window-log', () => {
    windows.forEach(([id, ok], i) => {
      const x = 610 + i * 394;
      const ready = beat > i || (beat === i && trainingStarted(state, id, beatP > 0.18));
      drawText(ctx, api, 'Window ' + (i + 1), x + 155, 360, 40, C.ink, 'center');
      if (ready) {
        used += perUpdate;
        if (ok) steps++;
        else scale /= 2;
      }
      const values = [ok ? 'Applied' : 'Overflow · skip', used, steps, steps, scale];
      for (let j = 0; j < labels.length; j++) {
        const [cue, target, preview] = skippedRows[j];
        const visible = !ok && beat === i ? trainingCompleted(state, cue, beatP > preview) : ready;
        const color = visible ? (j === 0 ? (ok ? C.green : C.pink) : colors[j]) : C.muted;
        const cell = () =>
          drawText(
            ctx,
            api,
            visible ? values[j] : '·',
            x + 155,
            rowY(j) + 54,
            j === 0 ? 33 : 44,
            color,
            'center',
          );
        if (!ok) api.focus.target(target, cell);
        else cell();
      }
      drawLine(ctx, api, x - 35, 403, x - 35, 973, C.muted, 2);
    });
  });
  drawText(
    ctx,
    api,
    'This schedule advances once per successful optimizer update.',
    960,
    1030,
    29,
    C.muted,
    'center',
  );
}
export default {
  id: 'overflow',
  draw: drawOverflow,
  cues: [...windows.map(([id]) => id), ...skippedRows.slice(1).map(([id]) => id)],
};
