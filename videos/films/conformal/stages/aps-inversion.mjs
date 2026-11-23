import { clamp, cueDone, cueProgress, phase } from '../construction.mjs';
import { classificationSet, cumulativeScoreConstruction } from '../model.mjs';
import { caption, line, panel, text } from '../defaults.mjs';
export function drawApsInversion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const reveal = (id, beat, a = 0.08, z = 0.8) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : cueProgress(cues, id, phase(progress, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const crossing = false;
    const uniform = currentBeat >= 2;
    const probabilities = uniform ? [0.25, 0.25, 0.25, 0.25] : [0.98, 0.01, 0.005, 0.005];
    const build =
      currentBeat === 0
        ? reveal('cf-aps-build', 0)
        : currentBeat === 2
          ? reveal('cf-aps-uniform-build', 2)
          : 1;
    const rows = cumulativeScoreConstruction(probabilities, build);
    const calibrated = done('cf-aps-threshold', 1, 0.3);
    const answer = uniform ? done('cf-aps-uniform', 2, 0.5) : done('cf-aps-empty', 1, 0.8);
    const selected = classificationSet(probabilities, 'direct', 0.9);
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow],
      x = 620,
      width = 740;
    text(
      ctx,
      api,
      'Build a score for each candidate label',
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
    if (calibrated) {
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
        'direct' + ' set = {' + selected.join(', ') + '}',
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
        calibrated
          ? 'Compare each completed score with the same calibrated threshold.'
          : 'Each new segment adds one labeled probability.',
        960,
        942,
        27,
        themeColors.muted,
        'center',
      );
    caption(ctx, api, 'A label keeps its identity while its cumulative score is built.');
  };
  if (api.focus) api.focus.target(`${'aps-inversion'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'aps-inversion',
  draw: drawApsInversion,
  cues: [
    'aps-inversion-b1',
    'cf-aps-build',
    'aps-inversion-b2',
    'cf-aps-threshold',
    'cf-aps-empty',
    'aps-inversion-b3',
    'cf-aps-uniform',
    'cf-aps-uniform-build',
  ],
};
