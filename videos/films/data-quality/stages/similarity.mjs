import { lshProbability } from '../arithmetic.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawOriginalVisualFocus,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawSimilarity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const phrases = [
      ['build has', 'has not', 'not passed'],
      ['my build', 'build has', 'has not', 'not passed'],
    ];
    drawOriginalVisualFocus(ctx, api, 'similarity-simulation-55', () =>
      phrases.forEach((parts, row) =>
        parts.forEach((part, i) =>
          drawOriginalVisualFocus(ctx, api, 'similarity-object-part-57', () =>
            drawOriginalCard(
              ctx,
              api,
              part,
              180 + i * 200,
              360 + row * 118,
              row === 0 || i > 0 ? themeColors.cyan : themeColors.muted,
              200,
              76,
            ),
          ),
        ),
      ),
    );
    const fractionReady = currentBeat > 0 || api.focus.progress('similarity-beat-1-focus-1') === 1;
    drawOriginalText(
      ctx,
      api,
      fractionReady ? '3 shared  /  4 in union' : 'Compare the shared and union shingles',
      615,
      700,
      32,
      themeColors.yellow,
    );
    drawOriginalEquation(
      ctx,
      api,
      fractionReady
        ? String.raw`J(A,B)=\frac{|A\cap B|}{|A\cup B|}=0.75`
        : String.raw`J(A,B)=\frac{|A\cap B|}{|A\cup B|}`,
      610,
      810,
      44,
      themeColors.ink,
    );
    const plot = api.teaching.axes({
      x: 1030,
      y: 375,
      width: 610,
      height: 350,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 1],
      xLabel: 'shingle similarity',
      yLabel: 'candidate probability',
    });
    const points = sampleFunction((x) => 1 - (1 - x ** 8) ** 14, 0, 1, 100);
    if (currentBeat > 0)
      api.teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 5,
        progress: phaseForBeat(1),
      });
    if (currentBeat === 2 && api.focus.progress('similarity-probability-reveal') === 1) {
      const prob = lshProbability(0.75),
        at = plot.point(0.75, prob);
      api.circle(ctx, at.x, at.y, 10, themeColors.yellow);
      drawOriginalEquation(
        ctx,
        api,
        String.raw`1-(1-0.75^8)^{14}=${prob.toFixed(3)}`,
        1330,
        850,
        37,
        themeColors.yellow,
      );
    }
    drawOriginalVisualFocus(ctx, api, 'similarity-object-ideal-independent-hash-model-62', () =>
      drawOriginalText(ctx, api, 'ideal independent-hash model', 1330, 895, 30, themeColors.muted),
    );
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'similarity',
  draw: drawSimilarity,
  cues: [
    'similarity-beat-1-focus-1',
    'similarity-beat-1-focus-2',
    'similarity-beat-2-focus-1',
    'similarity-beat-3-focus-1',
    'similarity-beat-3-focus-2',
    'similarity-probability-reveal',
  ],
};
