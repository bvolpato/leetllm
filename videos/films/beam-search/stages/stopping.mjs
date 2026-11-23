import { TRACKS, WIDTH_THREE } from '../arithmetic.mjs';
import { constructionProgress } from '../construction.mjs';
import { drawCard, drawEquation, drawText, withFocus } from '../defaults.mjs';
export function drawStopping(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['stopping'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    withFocus(ctx, api, 'stopping-object-completed-paths-from-width-33', () =>
      drawText(
        ctx,
        api,
        `Completed paths from width ${snapshot.width}`,
        960,
        280,
        36,
        themeColors.ink,
        'center',
      ),
    );
    const selected = snapshot.completed.slice(0, 5);
    withFocus(ctx, api, 'stopping-simulation-34', () =>
      selected.forEach((candidate, index) => {
        const y = 360 + index * 96;
        const sourceOpacity = constructionProgress(state, index * 0.05, 0.5 + index * 0.04);
        const targetOpacity = constructionProgress(state, index * 0.05, 0.58 + index * 0.04);
        const source = drawCard(
          ctx,
          api,
          'stopping',
          `${candidate.text} · p=${candidate.probability.toFixed(4)} · ${candidate.tokenCount} tokens`,
          150,
          y,
          850,
          68,
          themeColors.blue,
          26,
          sourceOpacity,
        );
        const eos = drawCard(
          ctx,
          api,
          'stopping',
          'EOS',
          1350,
          y,
          210,
          68,
          themeColors.green,
          30,
          targetOpacity,
        );
        const route = teaching.transfer({
          source: {
            shape: source,
            opacity: sourceOpacity,
          },
          target: {
            shape: eos,
            opacity: targetOpacity,
          },
          progress: constructionProgress(state, 0.15, 0.86),
          color: themeColors.cyan,
          ...(beat === 0
            ? {
                particle: {
                  radius: 8,
                  fill: themeColors.yellow,
                },
              }
            : {}),
          gap: 16,
        });
        void route;
      }),
    );
    if (beat > 0)
      components.fade(beat > 1 ? 1 : reveal(0.08, 0.35), () =>
        drawText(
          ctx,
          api,
          beat === 1
            ? 'Same completed set · compare whole-path scores'
            : `Declared fixture: EOS completes a path · horizon ${WIDTH_THREE.horizon} bounds expansion`,
          960,
          850,
          27,
          themeColors.cyan,
          'center',
        ),
      );
    drawText(
      ctx,
      api,
      snapshot.active.length
        ? `${snapshot.active.length} prefixes remain unfinished at the horizon`
        : 'Every retained path ended at EOS or the horizon.',
      960,
      900,
      30,
      themeColors.yellow,
      'center',
    );
    drawEquation(
      ctx,
      api,
      String.raw`\text{complete when } y_t=\mathrm{EOS}`,
      960,
      960,
      39,
      themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'stopping',
  draw: drawStopping,
  cues: [
    'stopping-beat-1-focus-1',
    'stopping-beat-2-focus-1',
    'stopping-beat-2-focus-2',
    'stopping-beat-3-focus-1',
  ],
};
