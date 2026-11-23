import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawLine, drawPolicyText, drawRectangle } from '../defaults.mjs';
export function drawPenaltySign(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('penalty-sign', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'penalty-sign'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const original = [3, 2.8, 2.5, -1, 0],
      labels = ['create · seen', 'deploy · new', 'revoke · new', 'negative · seen', 'zero · seen'];
    const amount = beat === 0 ? 0 : beat === 1 ? progress : 1;
    const values = original.map((v, i) =>
      i === 1 || i === 2 ? v : v > 0 ? v / (1 + 0.2 * amount) : v * (1 + 0.2 * amount),
    );
    drawPolicyText(
      ctx,
      api,
      'One penalty per distinct seen token · θ = 1.2',
      960,
      310,
      34,
      themeColors.ink,
      'center',
    );
    target(() =>
      values.forEach((v, i) => {
        const y = 420 + i * 100,
          color = colors[i % 4];
        drawPolicyText(ctx, api, labels[i], 180, y + 25, 30, color);
        const zero = 1080,
          scale = 165;
        drawLine(ctx, api, zero, y - 6, zero, y + 48, themeColors.muted);
        const left = zero + Math.min(0, v) * scale;
        drawRectangle(ctx, api, left, y, Math.abs(v) * scale, 38, color);
        drawPolicyText(ctx, api, v.toFixed(2), 1650, y + 28, 31, color, 'right');
      }),
    );
    drawPolicyText(
      ctx,
      api,
      `Current greedy choice: ${labels[values.indexOf(Math.max(...values))].split(' · ')[0]}`,
      960,
      365,
      29,
      themeColors.green,
      'center',
    );
    drawCaption(
      ctx,
      api,
      beat === 0
        ? 'Positive scores divide, negative scores multiply, and zero stays zero.'
        : 'Repeated prefix occurrences do not apply this distinct-token rule twice. A penalty is not a ban.',
    );
  }
  return;
}
export default {
  id: 'penalty-sign',
  draw: drawPenaltySign,
  cues: ['penalty-sign-build-0', 'penalty-sign-build-1', 'penalty-sign-build-2'],
};
