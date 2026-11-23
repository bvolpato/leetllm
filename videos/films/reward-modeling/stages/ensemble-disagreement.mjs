import { rewardEnsemble } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionBox,
  drawRewardExpansionDot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawEnsembleDisagreement(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('ensemble-disagreement-mechanism', () => {
    const shared = currentBeat >= 2,
      values = shared ? [5, 5, 5] : [2, 4, 6],
      result = rewardEnsemble(values),
      x = 260,
      w = 1400,
      map = (v) => x + (v / 8) * w;
    drawRewardExpansionTitle(
      ctx,
      api,
      shared
        ? 'Three agreeing scorers can share the same factual error'
        : 'Construct the mean and sample standard deviation from aligned scores',
    );
    drawRewardExpansionL(ctx, api, x, 560, x + w, 560);
    [0, 2, 4, 6, 8].forEach((v) => {
      drawRewardExpansionL(ctx, api, map(v), 550, map(v), 570);
      drawRewardExpansionText(ctx, api, v, map(v), 625, 28, themeColors.muted);
    });
    values.forEach((v, i) => {
      const y = shared ? 410 + i * 60 : 470;
      drawRewardExpansionDot(
        ctx,
        api,
        map(v),
        y,
        17,
        [themeColors.green, themeColors.blue, themeColors.pink][i],
      );
      if (!shared)
        drawRewardExpansionL(
          ctx,
          api,
          map(v),
          y + 20,
          map(v),
          540,
          [themeColors.green, themeColors.blue, themeColors.pink][i],
        );
      drawRewardExpansionText(
        ctx,
        api,
        'model ' + (i + 1),
        shared ? map(v) + 110 : map(v),
        shared ? y + 10 : 390,
        28,
        [themeColors.green, themeColors.blue, themeColors.pink][i],
        shared ? 'left' : 'center',
      );
    });
    const meanReady = currentBeat > 0 || on('ensemble-mean'),
      sdReady = currentBeat > 0 || on('ensemble-sd');
    if (meanReady) {
      drawRewardExpansionL(
        ctx,
        api,
        map(result.mean),
        660,
        map(result.mean),
        720,
        themeColors.yellow,
        4,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'mean ' + result.mean,
        map(result.mean),
        775,
        34,
        themeColors.yellow,
      );
    }
    if (sdReady)
      drawRewardExpansionText(
        ctx,
        api,
        shared ? 'sample SD = 0' : 'SD = sqrt((4 + 0 + 4) / 2) = 2',
        960,
        865,
        35,
        themeColors.cyan,
      );
    if (currentBeat === 1)
      drawRewardExpansionText(
        ctx,
        api,
        'λ = 1 → mean − λ × SD = 4 − 2 = 2',
        960,
        955,
        36,
        themeColors.yellow,
      );
    if (shared) {
      drawRewardExpansionBox(
        ctx,
        api,
        'Claim cites source X · source X cannot be found',
        200,
        310,
        1520,
        80,
        themeColors.pink,
        32,
      );
      drawRewardExpansionText(
        ctx,
        api,
        on('ensemble-shared') ? 'aggregate 5 · citation check FAILS' : 'Check the citation',
        960,
        965,
        36,
        themeColors.pink,
      );
    }
  });
}
export default {
  id: 'ensemble-disagreement',
  draw: drawEnsembleDisagreement,
  cues: [
    'ensemble-disagreement-step-1',
    'ensemble-mean',
    'ensemble-sd',
    'ensemble-disagreement-step-2',
    'ensemble-disagreement-step-3',
    'ensemble-shared',
  ],
};
