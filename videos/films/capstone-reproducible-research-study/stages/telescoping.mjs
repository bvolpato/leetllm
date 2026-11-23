import { potential } from '../arithmetic.mjs';
import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionMid,
  drawResearchConstructionResult,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawTelescoping(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('telescoping', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('telescoping', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-telescoping-mechanism', () => {
    drawResearchConstructionHeader(ctx, api, 'Equal interior terms cancel; the boundaries remain');
    const capped = currentBeat === 2 && E(2, 3) > 0,
      route = capped ? [0, 0, 1, 2] : [0, 1, 2, 3, 4, 5, 6],
      count = Math.min(route.length - 1, 1 + Math.floor(E(0, 2) * (route.length - 2)));
    for (let i = 0; i < count; i++) {
      const y = 350 + i * 77;
      drawResearchConstructionText(ctx, api, `t=${i}`, 220, y + 28, 27, themeColors.muted);
      drawResearchConstructionText(
        ctx,
        api,
        `+ γ${['⁰', '¹', '²', '³', '⁴', '⁵', '⁶'][i + 1]} Φ(${route[i + 1]})`,
        450,
        y + 28,
        31,
        currentBeat >= 1 && i < count - 1 ? themeColors.muted : themeColors.cyan,
      );
      drawResearchConstructionText(
        ctx,
        api,
        `− γ${['⁰', '¹', '²', '³', '⁴', '⁵', '⁶'][i]} Φ(${route[i]})`,
        1130,
        y + 28,
        31,
        currentBeat >= 1 && i > 0 ? themeColors.muted : themeColors.blue,
      );
      if (currentBeat >= 1 && i > 0) {
        drawResearchConstructionLine(ctx, api, 850, y - 23, 1030, y + 20, themeColors.muted, 3);
      }
    }
    if (resultComplete(1, 1)) {
      drawResearchConstructionResult(ctx, api, '−Φ(start) + γᵀ Φ(end)', themeColors.yellow, 850);
      if (capped ? resultComplete(2, 3) : resultComplete(1, 2))
        drawResearchConstructionMid(
          ctx,
          api,
          capped
            ? 'Timeout path: 1 + 0.95³ × (−4/6) = ' + (1 + 0.95 ** 3 * potential(2)).toFixed(6)
            : 'Completed direct path and detour: −(−1) + 0 = +1',
          960,
          918,
          31,
          themeColors.yellow,
        );
      if (currentBeat === 2 && !capped && resultComplete(2, 0))
        drawResearchConstructionMid(
          ctx,
          api,
          'Staying at state 0 adds +0.05 to this one transition.',
          960,
          968,
          27,
          themeColors.muted,
        );
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'A positive stationary bonus does not establish an optimal policy'
        : 'Interior cancellation follows the discounted path, not the local bonus sign',
    );
  });
}
export default {
  id: 'telescoping',
  draw: drawTelescoping,
  cues: [
    'rs-telescoping-0',
    'rsx-telescoping-b0-s0',
    'rsx-telescoping-b0-s1',
    'rsx-telescoping-b0-s2',
    'rs-telescoping-1',
    'rsx-telescoping-b1-s0',
    'rsx-telescoping-b1-s1',
    'rsx-telescoping-b1-s2',
    'rs-telescoping-2',
    'rsx-telescoping-b2-s0',
    'rsx-telescoping-b2-s1',
    'rsx-telescoping-b2-s2',
    'rsx-telescoping-b2-s3',
    'rsx-telescoping-b2-s4',
  ],
};
