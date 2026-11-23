import { TRACKS } from '../arithmetic.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['opening'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const root = withFocus(ctx, api, 'opening-object-mia-1', () =>
      drawCard(ctx, api, 'opening', 'Mia', 170, 505, 260, 110, themeColors.yellow, 42),
    );
    drawText(ctx, api, snapshot.prompt, 950, 315, 38, themeColors.ink, 'center');
    const routeRows = snapshot.choices.map(([token, probability], index) => ({
      token,
      probability,
      y: 390 + index * 205,
    }));
    withFocus(ctx, api, 'opening-simulation-3', () =>
      routeRows.forEach((row, index) => {
        const color = [themeColors.cyan, themeColors.blue, themeColors.pink][index];
        const node = drawCard(
          ctx,
          api,
          'opening',
          `${row.token} · ${(row.probability * 100).toFixed(0)}%`,
          760,
          row.y,
          440,
          108,
          color,
          31,
          state.cues?.['opening-supplied-choices']
            ? state.cues['opening-supplied-choices'].phase === 'before'
              ? 0
              : 1
            : beat > 0
              ? 1
              : reveal(index * 0.12, 0.55 + index * 0.1),
        );
        if (beat >= 1)
          teaching.transfer({
            source: {
              shape: root,
              opacity: 1,
            },
            target: {
              shape: node,
              opacity: reveal(index * 0.12, 0.55 + index * 0.1),
            },
            progress: reveal(0.22, 0.88),
            color,
            particle: {
              radius: 8,
              fill: themeColors.yellow,
            },
            gap: 12,
          });
        if (beat === 2 && index === 0)
          drawText(ctx, api, 'local leader', 1395, row.y + 60, 28, themeColors.yellow, 'center');
      }),
    );
    drawText(ctx, api, snapshot.question, 950, 965, 34, themeColors.ink, 'center');
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-beat-1-focus-1',
    'opening-supplied-choices',
    'opening-beat-2-focus-1',
    'opening-beat-2-focus-2',
    'opening-beat-3-focus-1',
  ],
};
