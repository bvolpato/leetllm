import { tokenProbabilities } from '../arithmetic.mjs';
import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionFooter,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionRectangle,
  drawSamplingExtensionText,
} from '../defaults.mjs';
export function drawTemperature(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'temperature'),
    currentBeat = f.beat,
    progress = f.progress,
    col = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink],
    bar = (q, x, v, width, color) => {
      const lo = q.point(x - width / 2, 0),
        hi = q.point(x + width / 2, v);
      drawSamplingExtensionRectangle(ctx, api, lo.x, hi.y, hi.x - lo.x, lo.y - hi.y, color);
    };
  api.focus.target('sp-temperature-visual', () => {
    const names = ['blue', 'clear', 'cloudy', 'green'],
      logits = [2.2, 1.5, 0.2, -1.5],
      temp = currentBeat === 0 ? 1 - 0.7 * progress : currentBeat === 1 ? 0.3 + 1.7 * progress : 2,
      rawProbs = tokenProbabilities(temp),
      nucleus = currentBeat === 2 && progress === 1,
      kept = nucleus
        ? rawProbs.findIndex((_, i) => rawProbs.slice(0, i + 1).reduce((a, b) => a + b, 0) >= 0.9) +
          1
        : 4,
      keptMass = rawProbs.slice(0, kept).reduce((a, b) => a + b, 0),
      probs = nucleus ? rawProbs.map((v, i) => (i < kept ? v / keptMass : 0)) : rawProbs,
      gumbel = false,
      q = drawSamplingExtensionPlot(
        ctx,
        api,
        [-0.5, 3.5],
        [0, 1],
        280,
        365,
        1080,
        455,
        'candidate token',
        'probability',
      );
    for (let i = 0; i < 4; i++) {
      const v = probs[i];
      bar(q, i, v, 0.6, col[i]);
      drawSamplingExtensionText(ctx, api, names[i], q.point(i, 0).x, 880, 31, col[i], 'center');
      drawSamplingExtensionText(
        ctx,
        api,
        probs[i].toFixed(3),
        q.point(i, probs[i]).x,
        q.point(i, probs[i]).y - 22,
        29,
        col[i],
        'center',
      );
    }
    {
      drawSamplingExtensionNum(
        ctx,
        api,
        nucleus ? 'Nucleus threshold' : 'Temperature',
        nucleus ? 'p = .9; retain ' + kept : temp.toFixed(2),
        430,
        themeColors.yellow,
      );
      drawSamplingExtensionNum(ctx, api, 'Largest probability', 'blue', 650, themeColors.blue);
      drawSamplingExtensionFooter(
        ctx,
        api,
        currentBeat === 2
          ? 'Keep the highest-probability words until their combined share reaches 90%'
          : 'The same four scores at different temperatures',
      );
    }
  });
}
export default {
  id: 'temperature',
  draw: drawTemperature,
  cues: ['sp-temperature-0', 'sp-temperature-1', 'sp-temperature-2'],
};
