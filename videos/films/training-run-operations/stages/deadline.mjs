import { canFinish, trainingRun, boundary } from '../boundaries.mjs';
import { trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawLine, drawText } from '../defaults.mjs';

export function drawDeadline(ctx, scene, state, api) {
  const { C } = api;
  const { beat, beatP } = state;
  const window = 20,
    save = 90,
    margin = 10,
    total = window + save + margin;
  const short = beat > 2 || (beat === 2 && trainingStarted(state, 'deadline-short', beatP > 0.12));
  const grace = short ? 119 : 120;
  const verdict = beat === 1 || (beat === 2 && !short) || beat >= 3;
  const parts = [
    { id: 'deadline-window', seconds: window, label: 'Finish F, G, H', color: C.blue },
    {
      id: 'deadline-save',
      seconds: save,
      label: 'Stage, write, validate and publish',
      color: C.cyan,
    },
    { id: 'deadline-margin', seconds: margin, label: 'Margin', color: C.yellow },
  ];
  const x = 222,
    scale = 12.2,
    y = 423;
  let start = 0;
  drawText(ctx, api, 'Seconds from the warning', x, 273, 35, C.muted);
  api.focus.target('path', () => {
    for (const [i, part] of parts.entries()) {
      const left = x + start * scale;
      const w = part.seconds * scale;
      const p = beat > 0 ? 1 : trainingCue(state, part.id, Math.min(1, Math.max(0, beatP * 3 - i)));
      drawBox(ctx, api, left, y, w, 88, C.muted);
      if (p > 0) api.rect(ctx, left + 2, y + 3, (w - 4) * p, 82, part.color, undefined, 0);
      if (p > 0) {
        drawText(
          ctx,
          api,
          part.label,
          left + w / 2,
          y - 39,
          i === 1 ? 36 : 30,
          part.color,
          'center',
        );
        drawText(ctx, api, part.seconds + ' s', left + w / 2, y + 152, 37, part.color, 'center');
      }
      start += part.seconds;
    }
  });
  api.focus.target('warning-marker', () => {
    const at = x + grace * scale;
    drawLine(ctx, api, at, y + 96, at, y + 212, C.pink, 5);
    drawText(ctx, api, 'Warning ends at ' + grace + ' s', at, y + 263, 35, C.pink, 'right');
  });
  api.focus.target('budget-result', () => {
    const test = 'can_finish(' + [grace, window, save, margin].join(', ') + ')';
    drawText(
      ctx,
      api,
      test +
        (verdict
          ? '  →  ' + (canFinish(grace, window, save, margin) ? 'True' : 'False')
          : '  →  ?'),
      960,
      826,
      45,
      C.ink,
      'center',
      'mono',
    );
    const { saved } = boundary(trainingRun);
    const result = !verdict
      ? 'Does the full path fit inside the warning?'
      : short
        ? 'Keep 1840 with its saved count of ' + saved.toLocaleString('en-US') + '.'
        : total + ' s required. Attempt the save, then verify publication.';
    drawText(
      ctx,
      api,
      result,
      960,
      948,
      40,
      !verdict ? C.yellow : short ? C.pink : C.green,
      'center',
    );
  });
}
export default {
  id: 'deadline',
  draw: drawDeadline,
  cues: ['deadline-window', 'deadline-save', 'deadline-margin', 'deadline-short', 'deadline-test'],
};
