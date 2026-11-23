import { frequencySchedules } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';

export function drawYarnBands(ctx, scene, state, api) {
  const { C, text, line, rect, circle, focus } = api;
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const cue = (id, b) => directedCue(state, id, b);
  const model = frequencySchedules();
  const ramp = api.ease(cue('blend-bands', 1));
  const showRule = cue('blend-bands', 1) > 0;
  const runtime = cue('index-ramp', 2) > 0;
  const colors = [C.cyan, C.blue, C.yellow, C.pink];

  label(
    'Paper example    ·    Original window 4,096 positions    ·    Fourfold extension',
    960,
    251,
    36,
    C.ink,
  );
  label('Original rate', 265, 353, 33, C.muted);
  label('Turns in 4,096', 655, 353, 33, C.muted);
  label('Share kept at original rate', 1087, 353, 33, C.muted);
  label('New rate', 1625, 353, 33, C.muted);
  model.original.forEach((rate, i) => {
    const y = 450 + i * 126,
      color = colors[i];
    focus.target('band-' + i, () => {
      label(String(rate), 265, y + 13, 43, color);
      label(model.turns[i].toFixed(2), 655, y + 13, 43, C.ink);
      line(ctx, 870, y, 1190, y, C.muted, 3);
      if (showRule) {
        const share = model.gamma[i] * ramp;
        if (share > 0) rect(ctx, 870, y - 7, 320 * share, 14, color);
        circle(ctx, 870 + 320 * share, y, 8, color);
        label((100 * share).toFixed(1) + '%', 1315, y + 12, 31, color);
      }
      const newRate = api.lerp(rate / 4, model.yarn[i], ramp);
      label(showRule ? String(Number(newRate.toFixed(6))) : '?', 1625, y + 13, 41, color);
    });
  });
  const fraction = model.gamma[2];
  const roundedBounds = [1, 3];
  const keptAtIndexTwo = (roundedBounds[1] - 2) / (roundedBounds[1] - roundedBounds[0]);
  const indexRampRate = api.lerp(model.pi[2], model.original[2], keptAtIndexTwo);
  const detail = runtime
    ? 'Rounded pair-index ramp at 0.01 rad/position:  ' + indexRampRate.toFixed(5)
    : state.beat >= 1
      ? fraction.toFixed(3) +
        ' × 0.01  +  ' +
        (1 - fraction).toFixed(3) +
        ' × 0.0025  ≈  ' +
        model.yarn[2].toFixed(6)
      : 'Divide below 1 turn  ·  Keep above 32 turns  ·  Which rate needs a blend?';
  if (state.beat === 0 || cue('inspect-blend', 1) > 0)
    label(detail, 960, 978, 39, runtime ? C.ink : C.yellow);
}
export default {
  id: 'yarn-bands',
  draw: drawYarnBands,
  cues: ['count-turns', 'blend-bands', 'inspect-blend', 'index-ramp'],
};
