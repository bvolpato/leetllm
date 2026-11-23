import { clamp, cueDone, cueProgress, cueStarted, phase } from '../construction.mjs';
import { classificationSet, cumulativeScoreConstruction } from '../model.mjs';
import { caption, line, panel, text } from '../defaults.mjs';
export function drawApsCrossing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const reveal = (id, beat, a = 0.08, z = 0.8) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : cueProgress(cues, id, phase(progress, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const started = (id, beat, at = 0.2) =>
    currentBeat > beat || (currentBeat === beat && cueStarted(cues, id, progress >= at));
  const paint = () => {
    const crossing = true;
    const uniform =
      currentBeat >= 2 || (currentBeat === 1 && started('cf-cross-uniform-build', 1, 0.45));
    const probabilities = uniform ? [0.25, 0.25, 0.25, 0.25] : [0.98, 0.01, 0.005, 0.005];
    const build =
      currentBeat === 0
        ? reveal('cf-cross-build', 0)
        : uniform && currentBeat === 1
          ? reveal('cf-cross-uniform-build', 1)
          : 1;
    const rows = cumulativeScoreConstruction(probabilities, build);
    const calibrated = true;
    const answer = uniform
      ? done('cf-cross-uniform', 1, 0.65)
      : done('cf-cross-confident', 1, 0.35);
    const selected = classificationSet(probabilities, 'crossing', 0.9);
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow],
      x = 620,
      width = 740;
    text(
      ctx,
      api,
      'Retain the first strictly crossing label',
      960,
      285,
      35,
      themeColors.ink,
      'center',
    );
    text(
      ctx,
      api,
      'probability · stable label identity',
      340,
      350,
      25,
      themeColors.muted,
      'center',
    );
    text(
      ctx,
      api,
      'cumulative probability through this label',
      1040,
      350,
      25,
      themeColors.muted,
      'center',
    );
    {
      line(ctx, api, 620 + 0.9 * 740, 380, 620 + 0.9 * 740, 850, themeColors.yellow, 3);
      text(ctx, api, 'q = 0.9', 620 + 0.9 * 740, 890, 28, themeColors.yellow, 'center');
    }
    rows.forEach((row, i) => {
      const y = 410 + i * 115,
        color = colors[row.label];
      panel(
        ctx,
        api,
        180,
        y - 18,
        350,
        77,
        () => {
          text(ctx, api, 'class ' + row.label, 205, y + 15, 26, color);
          text(ctx, api, 'p = ' + row.probability, 505, y + 15, 26, color, 'right');
          text(ctx, api, 'rank ' + (i + 1), 205, y + 43, 20, themeColors.muted);
        },
        color,
      );
      line(ctx, api, 620, y + 16, 620 + 740, y + 16, themeColors.border, 2);
      if (row.visible) {
        let offset = 0;
        for (let j = 0; j <= i; j++) {
          const part = rows[j],
            amount = j === i ? row.amount : 1;
          const w = part.probability * 740 * amount;
          if (w > 0) api.rect(ctx, 620 + offset, y - 8, w, 48, colors[part.label], undefined, 0);
          offset += part.probability * 740;
        }
        if (row.complete)
          text(
            ctx,
            api,
            Number(row.score.toFixed(3)),
            1470,
            y + 25,
            30,
            themeColors.cyan,
            'center',
          );
        else
          text(
            ctx,
            api,
            'adding class ' + row.label,
            1470,
            y + 25,
            23,
            themeColors.muted,
            'center',
          );
      }
      if (answer && row.complete) {
        const included = selected.includes(row.label);
        text(
          ctx,
          api,
          included ? 'include' : 'exclude',
          1680,
          y + 25,
          27,
          included ? themeColors.green : themeColors.muted,
          'center',
        );
      }
    });
    if (answer)
      text(
        ctx,
        api,
        'conservative' + ' set = {' + selected.join(', ') + '}',
        960,
        942,
        33,
        selected.length ? themeColors.green : themeColors.pink,
        'center',
      );
    else
      text(
        ctx,
        api,
        'Compare each completed score with the same calibrated threshold.',
        960,
        942,
        27,
        themeColors.muted,
        'center',
      );
    caption(
      ctx,
      api,
      currentBeat === 2
        ? 'Randomized APS requires its own matching calibration rule.'
        : 'A label keeps its identity while its cumulative score is built.',
    );
  };
  if (api.focus) api.focus.target(`${'aps-crossing'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'aps-crossing',
  draw: drawApsCrossing,
  cues: [
    'aps-crossing-b1',
    'cf-cross-build',
    'aps-crossing-b2',
    'cross-uniform',
    'cf-cross-confident',
    'cf-cross-uniform',
    'cf-cross-confident-build',
    'cf-cross-uniform-build',
    'aps-crossing-b3',
  ],
};
