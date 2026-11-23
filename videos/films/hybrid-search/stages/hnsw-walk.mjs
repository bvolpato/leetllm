import { lowerLayerSearch } from '../model.mjs';
import {
  drawRetrievalMechanismArrow,
  drawRetrievalMechanismF,
  drawRetrievalMechanismLine,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawHnswWalk(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const paint = () => {
    if (currentBeat === 0) {
      [1, 2, 3].forEach((n, l) => {
        const y = 370 + l * 190;
        drawRetrievalMechanismText(
          ctx,
          api,
          l === 2 ? 'bottom: all indexed vectors' : 'upper layer ' + (2 - l),
          380,
          y,
          30,
          themeColors.muted,
        );
        const points = Array.from(
          {
            length: n + 2,
          },
          (_, i) => ({
            x: 780 + i * 200,
            y,
          }),
        );
        points.forEach((z, i) => {
          api.circle(ctx, z.x, z.y, 12, themeColors.blue);
          if (i)
            drawRetrievalMechanismLine(ctx, api, points[i - 1].x, y, z.x, y, themeColors.blue, 3);
        });
        if (l < 2)
          drawRetrievalMechanismArrow(ctx, api, 1000, y + 30, 1000, y + 150, themeColors.yellow);
      });
    } else {
      const ef = currentBeat === 1 && drawRetrievalMechanismP(ctx, api, 'hnsw-wide') === 0 ? 1 : 3,
        result = lowerLayerSearch(ef),
        fraction =
          ef === 1
            ? drawRetrievalMechanismP(ctx, api, 'hnsw-narrow')
            : currentBeat > 1
              ? 1
              : drawRetrievalMechanismP(ctx, api, 'hnsw-wide'),
        count = Math.floor(fraction * result.snapshots.length + 1e-9),
        snap = count
          ? result.snapshots[Math.min(count - 1, result.snapshots.length - 1)]
          : {
              expanded: [],
              best: ['S'],
              pending: ['S'],
            };
      const coords = {
          S: [220, 680],
          A: [1165, 450],
          B: [1300, 450],
          D: [625, 680],
          C: [1570, 680],
        },
        pos = {
          S: 0,
          A: 7,
          B: 8,
          D: 3,
          C: 10,
        };
      [
        ['S', 'A'],
        ['S', 'D'],
        ['A', 'B'],
        ['D', 'C'],
      ].forEach(([a, z]) =>
        drawRetrievalMechanismLine(ctx, api, ...coords[a], ...coords[z], themeColors.muted, 3),
      );
      for (const [id, at] of Object.entries(coords)) {
        const color = snap.expanded.includes(id)
          ? themeColors.green
          : snap.best.includes(id)
            ? themeColors.yellow
            : themeColors.muted;
        drawRetrievalMechanismF(ctx, api, 'graph-' + id, () => api.circle(ctx, ...at, 27, color));
        drawRetrievalMechanismText(ctx, api, id + ' = ' + pos[id], at[0], at[1] + 65, 30, color);
      }
      drawRetrievalMechanismText(
        ctx,
        api,
        'query 10 · horizontal position is the Euclidean value',
        960,
        290,
        33,
        themeColors.yellow,
      );
      drawRetrievalMechanismText(ctx, api, 'retained ef = ' + ef, 960, 350, 38, themeColors.cyan);
      drawRetrievalMechanismText(
        ctx,
        api,
        'expanded: ' + (snap.expanded.join(' → ') || 'none'),
        960,
        825,
        32,
        themeColors.green,
      );
      drawRetrievalMechanismText(
        ctx,
        api,
        'best: ' + snap.best.join(', ') + ' · pending: ' + snap.pending.join(', '),
        960,
        890,
        30,
        themeColors.yellow,
      );
      if (fraction === 1)
        drawRetrievalMechanismText(
          ctx,
          api,
          ef === 1 ? 'D discarded → best B, distance 2' : 'D retained → C discovered, distance 0',
          960,
          950,
          34,
          ef === 1 ? themeColors.pink : themeColors.green,
        );
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Bounded lower-layer toy · no production ANN index executed',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'hnsw-walk-mechanism', paint);
  return;
}
export default {
  id: 'hnsw-walk',
  draw: drawHnswWalk,
  cues: ['hnsw-narrow', 'hnsw-wide'],
};
