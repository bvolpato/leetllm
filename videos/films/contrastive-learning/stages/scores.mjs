import { ANGLES, START, TAU } from '../fixtures.mjs';
import { evaluate, formatValue, vector } from '../arithmetic.mjs';
import { drawLine, drawNote, drawRectangle, drawText } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawScores(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-scores-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('scores-mechanism', () => {
    const d = evaluate(),
      plot = teaching.axes({
        x: 250,
        y: 360,
        width: 600,
        height: 500,
        xDomain: [-1.2, 1.2],
        yDomain: [-1.2, 1.2],
        xTicks: [-1, 0, 1],
        yTicks: [-1, 0, 1],
        equalUnits: true,
        fontSize: 25,
      }),
      o = plot.point(0, 0),
      q = plot.point(...vector(START));
    api.arrow(ctx, o.x, o.y, q.x, q.y, themeColors.yellow, 5);
    ANGLES.forEach((a, i) => {
      const v = plot.point(...vector(a));
      api.arrow(
        ctx,
        o.x,
        o.y,
        v.x,
        v.y,
        [themeColors.green, themeColors.pink, themeColors.blue][i],
        3,
      );
      if (cueProgress('dot') > (i + 1) / 4) {
        const proj = plot.point(...vector(START).map((x) => x * d.scores[i]));
        drawLine(
          ctx,
          api,
          v.x,
          v.y,
          proj.x,
          proj.y,
          [themeColors.green, themeColors.pink, themeColors.blue][i],
          2,
        );
      }
    });
    const temp = currentBeat < 2 ? TAU : TAU - 0.12 * cueProgress('temperature'),
      probs = stableSoftmax(d.scores, temp);
    api.focus.target('contrastive-probabilities', () => {
      [0, 1, 2].forEach((i) => {
        const y = 410 + i * 175;
        drawText(
          ctx,
          api,
          ['puppy runs', 'dog sleeps', 'sky blue'][i],
          1050,
          y,
          29,
          [themeColors.green, themeColors.pink, themeColors.blue][i],
        );
        if (resultComplete('dot') || currentBeat > 0)
          drawText(
            ctx,
            api,
            's = ' + formatValue(d.scores[i]),
            1420,
            y,
            30,
            [themeColors.green, themeColors.pink, themeColors.blue][i],
          );
        if (resultComplete('softmax') || currentBeat > 0) {
          drawRectangle(ctx, api, 1020, y + 35, 640, 46, themeColors.panel);
          drawRectangle(
            ctx,
            api,
            1020,
            y + 35,
            640 * probs[i],
            46,
            [themeColors.green, themeColors.pink, themeColors.blue][i],
          );
          drawText(
            ctx,
            api,
            formatValue(probs[i]),
            1740,
            y + 72,
            27,
            [themeColors.green, themeColors.pink, themeColors.blue][i],
          );
        }
      });
    });
    api.focus.target('contrastive-temperature', () =>
      drawText(ctx, api, 'τ = ' + formatValue(temp, 3), 960, 930, 35, themeColors.yellow),
    );
    drawNote(ctx, api, 'Projection earns the raw score · the row earns the probability');
  });
}
export default {
  id: 'scores',
  draw: drawScores,
  cues: [
    'scores-contrastive-probabilities-b1-1',
    'cl-scores-dot',
    'cl-scores-softmax',
    'scores-contrastive-probabilities-b2-1',
    'scores-contrastive-probabilities-b3-1',
    'cl-scores-temperature',
  ],
};
