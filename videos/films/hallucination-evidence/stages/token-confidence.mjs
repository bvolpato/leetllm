import {
  drawEvidenceUpgradeBox,
  drawEvidenceUpgradeFoot,
  drawEvidenceUpgradeLine,
  drawEvidenceUpgradeProgress,
  drawEvidenceUpgradeText,
} from '../defaults.mjs';
export function drawTokenConfidence(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1),
    q = api.phase(beatProgress, 0.06, 0.88),
    done = (id) => drawEvidenceUpgradeProgress(ctx, api, id) >= 1;
  {
    if (currentBeat === 0) {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'One next-token probability',
        960,
        265,
        34,
        themeColors.ink,
        'center',
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'Prompt + generated prefix',
        160,
        390,
        620,
        110,
        themeColors.blue,
        32,
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'Next token: recovered',
        1080,
        390,
        660,
        110,
        themeColors.yellow,
        32,
      );
      drawEvidenceUpgradeLine(ctx, api, themeColors, 805, 445, 1055, 445, themeColors.cyan);
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'P(next token | context)=.98',
        960,
        670,
        39,
        themeColors.yellow,
        'center',
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Claim: The incident is fully recovered.',
        960,
        815,
        35,
        themeColors.pink,
        'center',
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Claim truth remains an evidence question',
        960,
        940,
        31,
        themeColors.ink,
        'center',
      );
    } else {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Full supplied vocabulary of three next tokens',
        960,
        265,
        32,
        themeColors.ink,
        'center',
      );
      const vals = [0.5, 0.25, 0.25],
        grown = drawEvidenceUpgradeProgress(ctx, api, 'token-distribution');
      vals.forEach((v, i) => {
        const x = 330 + i * 490;
        components.panel({
          x,
          y: 750 - v * 650 * grown,
          width: 220,
          height: Math.max(1, v * 650 * grown),
          fill: [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          stroke: [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
        });
        drawEvidenceUpgradeText(
          ctx,
          api,
          themeColors,
          String(v),
          x + 110,
          800,
          34,
          themeColors.ink,
          'center',
        );
        if (done('token-sum'))
          drawEvidenceUpgradeText(
            ctx,
            api,
            themeColors,
            '−p ln p =' + (-v * Math.log(v)).toFixed(3),
            x + 110,
            885,
            28,
            themeColors.muted,
            'center',
          );
      });
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        done('token-sum')
          ? 'Next-token entropy ≈ 1.040 nats'
          : 'Each possible next token contributes to the sum.',
        960,
        970,
        29,
        themeColors.yellow,
        'center',
      );
    }
    drawEvidenceUpgradeFoot(
      ctx,
      api,
      themeColors,
      'A short list of top tokens usually leaves the distribution of the remaining mass unknown.',
    );
  }
}
export default {
  id: 'token-confidence',
  draw: drawTokenConfidence,
  cues: ['token-confidence-b1', 'token-confidence-b2', 'token-distribution', 'token-sum'],
};
