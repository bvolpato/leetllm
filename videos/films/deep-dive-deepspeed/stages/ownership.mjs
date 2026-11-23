import { clamp } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawOwnership(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel('ownership', state),
    currentBeat = modelState.b;
  {
    const progress = [
      state.cues?.['ownership-weight-partition']?.progress ?? (currentBeat > 1 ? 1 : 0),
      state.cues?.['ownership-gradient-partition']?.progress ?? (currentBeat > 0 ? 1 : 0),
      state.cues?.['ownership-optimizer-partition']?.progress ?? 1,
    ];
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink],
      names = ['Compute weights', 'Reduced gradients', 'Optimizer + master'],
      chunkGB = [0.75, 0.75, 4.5],
      totals = Array(4).fill(0);
    drawOriginalText(
      ctx,
      api,
      'Four physical data ranks · exact array slices retain their owner IDs',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    for (let rank = 0; rank < 4; rank++)
      drawOriginalCard(ctx, api, 'Rank ' + rank, 150 + rank * 420, 315, 350, themeColors.ink, 75);
    names.forEach((name, component) =>
      api.focus.target('ownership-component-' + component, () => {
        const y = 450 + component * 185,
          removed = Math.floor(clamp(progress[component]) * 3),
          prefix = ['W', 'g', 'O'][component];
        drawOriginalText(
          ctx,
          api,
          name + ' · ' + chunkGB[component] + ' GB per slice',
          150,
          y - 25,
          29,
          colors[component],
        );
        for (let rank = 0; rank < 4; rank++) {
          const others = [0, 1, 2, 3].filter((owner) => owner !== rank),
            released = new Set(others.slice(0, removed)),
            retained = 4 - released.size;
          totals[rank] += retained * chunkGB[component];
          teaching.grid({
            x: 150 + rank * 420,
            y,
            width: 350,
            height: 80,
            rows: 1,
            columns: 4,
            labels: [[0, 1, 2, 3].map((owner) => (released.has(owner) ? 'free' : prefix + owner))],
            fontSize: 26,
            fill: themeColors.panel,
            stroke: themeColors.muted,
            textColor: themeColors.ink,
            highlights: [0, 1, 2, 3]
              .filter((owner) => !released.has(owner))
              .map((column) => ({
                row: 0,
                column,
                fill: themeColors.panel,
                stroke: column === rank ? colors[component] : themeColors.muted,
              })),
          });
        }
      }),
    );
    totals.forEach((total, rank) =>
      drawOriginalText(
        ctx,
        api,
        total.toFixed(2) + ' GB',
        325 + rank * 420,
        1030,
        33,
        themeColors.green,
        'center',
      ),
    );
  }
}
export default {
  id: 'ownership',
  draw: drawOwnership,
  cues: [
    'ownership-replicated-baseline',
    'ownership-optimizer-partition',
    'ds-ownership-b0-s0',
    'ds-ownership-b0-s1',
    'ds-ownership-b0-s2',
    'ownership-gradient-partition',
    'ownership-weight-partition',
    'ds-ownership-b1-s0',
    'ds-ownership-b1-s1',
    'ds-ownership-b1-s2',
    'ds-ownership-b1-s3',
    'ds-ownership-b1-s4',
    'ownership-beat-3-focus-1',
    'ds-ownership-b2-s0',
    'ds-ownership-b2-s1',
    'ds-ownership-b2-s2',
  ],
};
