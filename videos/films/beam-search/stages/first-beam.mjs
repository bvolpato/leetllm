import { TRACKS } from '../arithmetic.mjs';
import { constructionProgress } from '../construction.mjs';
import { drawCard, drawEquation, drawText, withFocus } from '../defaults.mjs';
export function drawFirstBeam(ctx, scene, state, api) {
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['first-beam'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    drawText(
      ctx,
      api,
      `Active frontier · width ${snapshot.width} · step ${snapshot.step}`,
      960,
      280,
      35,
      themeColors.ink,
      'center',
    );
    withFocus(ctx, api, 'first-beam-simulation-18', () =>
      snapshot.expansions.forEach((candidate, index) => {
        const color =
          candidate.status === 'active'
            ? themeColors.green
            : candidate.status === 'pruned'
              ? themeColors.pink
              : themeColors.muted;
        const label = `${candidate.text || candidate.token}   p=${candidate.probability.toFixed(3)}   ${candidate.status}`;
        withFocus(ctx, api, 'first-beam-object-label-19', () =>
          drawCard(
            ctx,
            api,
            'first-beam',
            label,
            220,
            365 + index * 130,
            1460,
            88,
            color,
            31,
            0.4 + 0.6 * constructionProgress(state, 0.02 + index * 0.04, 0.12 + index * 0.04),
          ),
        );
      }),
    );
    if (beat > 0) {
      components.fade(beat > 1 ? 1 : reveal(0.06, 0.3), () => {
        api.path(
          ctx,
          [
            {
              x: 208,
              y: 365,
            },
            {
              x: 185,
              y: 365,
            },
            {
              x: 185,
              y: 583,
            },
            {
              x: 208,
              y: 583,
            },
          ],
          {
            color: themeColors.yellow,
            width: 4,
          },
        );
        drawText(
          ctx,
          api,
          beat === 1
            ? 'Width counts these two unfinished prefixes'
            : 'The next expansion starts from the same two survivors',
          960,
          770,
          29,
          themeColors.yellow,
          'center',
        );
      });
    }
    drawEquation(
      ctx,
      api,
      String.raw`S(y_{1:t})=\sum_{j=1}^{t}\log p(y_j\mid y_{<j},x)`,
      960,
      850,
      39,
      themeColors.cyan,
      'center',
    );
  }
}
export default {
  id: 'first-beam',
  draw: drawFirstBeam,
  cues: [
    'first-beam-beat-1-focus-1',
    'first-beam-beat-2-focus-1',
    'first-beam-beat-2-focus-2',
    'first-beam-beat-3-focus-1',
    'first-beam-beat-3-focus-2',
  ],
};
