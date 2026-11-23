import { bm25 } from '../scoring.mjs';
import { TOP_K_TRACE } from '../selection.mjs';
import { TRACKS } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawVisualFocus,
} from '../defaults.mjs';
export function drawTopK(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const revealProgress = (from = 0.08, to = 0.84) => api.phase(progress, from, to);
  const snapshot = TRACKS['top-k'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  drawOriginalText(ctx, api, 'Same query · make + soup', 150, 225, 25, themeColors.cyan);
  {
    drawOriginalText(
      ctx,
      api,
      `Top-${snapshot.k} heap · incoming ${snapshot.incoming}`,
      960,
      280,
      36,
      themeColors.ink,
      'center',
    );
    const processed = TOP_K_TRACE.slice(0, snapshot.index + 1);
    drawVisualFocus(ctx, api, 'top-k-simulation-35', () =>
      processed.forEach((row, index) => {
        const y = 365 + index * 107;
        const color = index === snapshot.index ? themeColors.yellow : themeColors.muted;
        drawOriginalCard(
          ctx,
          api,
          'top-k',
          `${row.incoming} · score ${row.score.toFixed(3)} · ${index === snapshot.index && progress < 0.55 ? 'compare' : row.action}`,
          180,
          y,
          780,
          74,
          color,
          index < snapshot.index ? 1 : revealProgress(0.05, 0.62),
          27,
        );
        if (index === snapshot.index) {
          const before = snapshot.index ? TOP_K_TRACE[snapshot.index - 1].heap : [],
            applied = progress >= 0.55,
            current = applied ? snapshot.heap : before;
          const root = current.reduce(
            (weak, id) => (weak === null || bm25(id).score < bm25(weak).score ? id : weak),
            null,
          );
          current.forEach((id, i) =>
            drawOriginalCard(
              ctx,
              api,
              'top-k',
              `${id} · ${bm25(id).score.toFixed(3)}${id === root ? ' · root' : ''}`,
              1110,
              395 + i * 135,
              610,
              95,
              id === root ? themeColors.pink : themeColors.green,
              1,
              29,
            ),
          );
          drawOriginalText(
            ctx,
            api,
            applied
              ? `Applied: ${snapshot.action}`
              : `Compare incoming ${snapshot.score.toFixed(3)} with root ${root ? bm25(root).score.toFixed(3) : 'empty'}`,
            1415,
            730,
            27,
            themeColors.yellow,
            'center',
          );
          if (progress > 0.22 && progress < 0.55) {
            const targetIndex = snapshot.heap.indexOf(snapshot.incoming),
              admitted = targetIndex >= 0;
            const q = api.phase(progress, 0.22, 0.55),
              destination = admitted ? 442 + targetIndex * 135 : 735;
            const at = api.lerp(y + 37, destination, q);
            drawOriginalCard(
              ctx,
              api,
              'top-k',
              snapshot.incoming,
              985,
              at - 25,
              95,
              50,
              admitted ? themeColors.green : themeColors.red,
              1,
              25,
            );
            api.line(ctx, 960, y + 37, 980, y + 37, themeColors.yellow, 3);
            if (admitted) api.line(ctx, 1085, destination, 1105, destination, themeColors.green, 3);
          }
        }
      }),
    );
    drawOriginalText(
      ctx,
      api,
      'Retained candidates after each admission decision',
      1380,
      820,
      26,
      themeColors.muted,
      'center',
    );
    drawOriginalEquation(
      ctx,
      api,
      String.raw`\text{retain }k\text{ candidates; replace the root only when the new key wins}`,
      960,
      935,
      37,
      themeColors.cyan,
    );
  }
}
export default {
  id: 'top-k',
  draw: drawTopK,
  cues: [
    'top-k-beat-1-focus-1',
    'top-k-beat-2-focus-1',
    'top-k-beat-3-focus-1',
    'top-k-beat-4-focus-1',
  ],
};
