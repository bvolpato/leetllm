import { NEIGHBOR_MAP, NEIGHBOR_SOURCE } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import {
  MAP_NEIGHBORS,
  NEIGHBOR_PCA,
  PCA_MATCHES,
  PCA_NEIGHBORS,
  SOURCE_NEIGHBORS,
} from '../model.mjs';
import { legacyCard, legacyText, visualFocus } from '../defaults.mjs';
export function drawVerify(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const snap = TRACKS['verify']?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const original = teaching.axes({
      x: 115,
      y: 410,
      width: 410,
      height: 250,
      equalUnits: true,
      xDomain: [-0.25, 3.45],
      yDomain: [-0.25, 3.45],
      xTicks: [],
      yTicks: [],
      xLabel: 'source x',
      yLabel: 'source y',
      fontSize: 24,
    });
    const pca = teaching.axes({
      x: 755,
      y: 410,
      width: 410,
      height: 250,
      equalUnits: true,
      xDomain: [-2.5, 2.5],
      yDomain: [-2.5, 2.5],
      xTicks: [],
      yTicks: [],
      xLabel: 'first component',
      yLabel: 'second component',
      fontSize: 24,
    });
    const mapped = teaching.axes({
      x: 1395,
      y: 410,
      width: 410,
      height: 250,
      equalUnits: true,
      xDomain: [-0.25, 4.45],
      yDomain: [-0.25, 4.45],
      xTicks: [],
      yTicks: [],
      xLabel: 'map coordinate 1',
      yLabel: '',
      fontSize: 24,
    });
    const sourceNames = ['A', 'B', 'C', 'D', 'E', 'F'];
    const paintNeighbors = (graph, points, neighbors, color, visible) => {
      points.forEach((point, index) => {
        const at = graph.point(point[0], point[1]);
        api.circle(ctx, at.x, at.y, 8, color);
        const offsets =
          points === NEIGHBOR_MAP
            ? [
                [-22, -24],
                [24, 32],
                [24, -24],
                [-28, 32],
                [-25, -25],
                [25, -20],
              ]
            : points === NEIGHBOR_PCA
              ? [
                  [24, -22],
                  [-24, 30],
                  [24, -22],
                  [-24, 30],
                  [24, -22],
                  [-24, 30],
                ]
              : [
                  [-22, -24],
                  [24, -24],
                  [-22, -24],
                  [24, -24],
                  [-22, -24],
                  [24, -24],
                ];
        const [dx, dy] = offsets[index];
        legacyText(
          ctx,
          api,
          sourceNames[index],
          at.x + dx,
          at.y + dy,
          24,
          color,
          dx > 0 ? 'left' : 'right',
        );
        if (visible) {
          const other = points[neighbors[index]],
            to = graph.point(other[0], other[1]);
          api.path(ctx, [at, to], {
            color:
              points === NEIGHBOR_MAP && neighbors[index] !== SOURCE_NEIGHBORS[index]
                ? themeColors.pink
                : themeColors.green,
            width: 4,
            clip: graph.bounds,
            opacity: phaseForBeat(0.22, 0.86),
          });
        }
      });
    };
    visualFocus(ctx, api, 'verify-source-neighbors', () =>
      paintNeighbors(original, NEIGHBOR_SOURCE, SOURCE_NEIGHBORS, themeColors.green, true),
    );
    const showMaps = true;
    {
      visualFocus(ctx, api, 'verify-pca-neighbors', () =>
        paintNeighbors(pca, NEIGHBOR_PCA, PCA_NEIGHBORS, themeColors.cyan, true),
      );
      visualFocus(ctx, api, 'verify-map-neighbors', () =>
        paintNeighbors(mapped, NEIGHBOR_MAP, MAP_NEIGHBORS, themeColors.pink, true),
      );
    }
    legacyText(
      ctx,
      api,
      'Source · neighbors computed in 3D',
      320,
      330,
      24,
      themeColors.green,
      'center',
    );
    legacyText(ctx, api, 'PCA · leading two components', 960, 330, 24, themeColors.cyan, 'center');
    legacyText(ctx, api, 'Hand-distorted 2D map', 1600, 330, 24, themeColors.pink, 'center');
    if (snap.stage > 0) {
      sourceNames.forEach((name, index) => {
        const y = 770 + index * 24;
        legacyText(
          ctx,
          api,
          `${name} → ${sourceNames[SOURCE_NEIGHBORS[index]]}`,
          320,
          y,
          24,
          themeColors.green,
          'center',
        );
        legacyText(
          ctx,
          api,
          `${name} → ${sourceNames[PCA_NEIGHBORS[index]]}`,
          960,
          y,
          24,
          themeColors.cyan,
          'center',
        );
        legacyText(
          ctx,
          api,
          `${name} → ${sourceNames[MAP_NEIGHBORS[index]]}`,
          1600,
          y,
          24,
          themeColors.pink,
          'center',
        );
      });
      visualFocus(ctx, api, 'verify-object-pca-6-neighbors-57', () =>
        legacyCard(
          ctx,
          api,
          'verify',
          `PCA · ${PCA_MATCHES} / 6 neighbors`,
          735,
          930,
          450,
          48,
          themeColors.cyan,
          1,
          24,
        ),
      );
      visualFocus(ctx, api, 'verify-object-hand-map-6-58', () =>
        legacyCard(
          ctx,
          api,
          'verify',
          `Hand map · ${snap.count} / 6`,
          1370,
          930,
          450,
          48,
          themeColors.yellow,
          1,
          24,
        ),
      );
    }
  }
}
export default {
  id: 'verify',
  draw: drawVerify,
  cues: [
    'verify-beat-1-focus-1',
    'verify-beat-1-focus-2',
    'verify-beat-2-focus-1',
    'verify-beat-3-focus-1',
    'verify-beat-3-focus-2',
  ],
};
