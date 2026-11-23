import { tokenProbabilities } from '../arithmetic.mjs';
import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionD,
  drawSamplingExtensionEquation,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionText,
} from '../defaults.mjs';
export function drawGumbelRace(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'gumbel-race'),
    currentBeat = f.beat,
    progress = f.progress,
    col = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  api.focus.target('sp-gumbel-race-visual', () => {
    const names = ['blue', 'clear', 'cloudy', 'green'],
      logits = [2.2, 1.5, 0.2, -1.5],
      temp = 1,
      rawProbs = tokenProbabilities(temp),
      nucleus = false,
      kept = 4,
      keptMass = rawProbs.slice(0, kept).reduce((a, b) => a + b, 0),
      probs = rawProbs,
      gumbel = true,
      q = drawSamplingExtensionPlot(
        ctx,
        api,
        [-0.5, 3.5],
        [-3, 5],
        280,
        365,
        1080,
        455,
        'candidate token',
        'perturbed score',
      );
    for (let i = 0; i < 4; i++) {
      const v = logits[i] + [0.77, 2.25, -0.2, -0.8][i] * (currentBeat === 0 ? progress : 1);
      {
        const a = q.point(i, logits[i]),
          z = q.point(i, v);
        drawSamplingExtensionL(ctx, api, [a, z], col[i], 9);
        drawSamplingExtensionD(ctx, api, a.x, a.y, themeColors.muted, 9);
        drawSamplingExtensionD(ctx, api, z.x, z.y, col[i], 15);
      }
      drawSamplingExtensionText(ctx, api, names[i], q.point(i, 0).x, 880, 31, col[i], 'center');
    }
    if (currentBeat === 2) {
      drawSamplingExtensionEquation(
        ctx,
        api,
        'E_i=e^{-g_i}',
        1500,
        420,
        36,
        themeColors.ink,
        'center',
      );
      drawSamplingExtensionEquation(
        ctx,
        api,
        'z_i+g_i=\\log(e^{z_i}/E_i)',
        1500,
        540,
        27,
        themeColors.cyan,
        'center',
      );
      drawSamplingExtensionNum(ctx, api, 'Same winner', 'clear', 700, themeColors.yellow);
      drawSamplingExtensionFooter(
        ctx,
        api,
        'Both calculations pick the largest score for these same noise draws',
      );
    } else {
      drawSamplingExtensionEquation(
        ctx,
        api,
        'g=-\\log(-\\log U)',
        1500,
        430,
        35,
        themeColors.ink,
        'center',
      );
      drawSamplingExtensionNum(
        ctx,
        api,
        'Winner',
        currentBeat > 0 && f.active('sp-gumbel-winner', state.beatP > 0.5) ? 'clear' : 'predict',
        620,
        themeColors.yellow,
      );
      drawSamplingExtensionFooter(
        ctx,
        api,
        'Draw a fresh offset for each token and pick the highest total',
      );
    }
  });
}
export default {
  id: 'gumbel-race',
  draw: drawGumbelRace,
  cues: ['sp-gumbel-race-0', 'sp-gumbel-race-1', 'sp-gumbel-winner', 'sp-gumbel-race-2'],
};
