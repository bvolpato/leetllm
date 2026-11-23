import { longContextModel } from '../construction.mjs';
import { contextText, footer, modelTarget, radialArrow, ring } from '../defaults.mjs';
export function drawBasisConsistency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('basis-consistency', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    contextText(
      ctx,
      api,
      'The query stays fixed while the same cached key is repaired',
      960,
      275,
      35,
      themeColors.cyan,
    );
    const cx = 640,
      cy = 635,
      r = 255;
    ring(ctx, api, cx, cy, r, themeColors.muted);
    api.line(ctx, cx - r, cy, cx + r, cy, themeColors.muted, 1);
    api.line(ctx, cx, cy - r, cx, cy + r, themeColors.muted, 1);
    radialArrow(ctx, api, cx, cy, r, m.query, themeColors.blue, 6);
    radialArrow(ctx, api, cx, cy, r * 0.85, m.key, themeColors.yellow, 6);
    contextText(ctx, api, 'query angle = 1 rad', 1370, 430, 36, themeColors.blue);
    contextText(ctx, api, `key angle = ${m.key.toFixed(2)} rad`, 1370, 550, 36, themeColors.yellow);
    modelTarget(ctx, api, 'basis-consistency', () =>
      contextText(
        ctx,
        api,
        `dot = ${m.score.toFixed(6)}`,
        1370,
        735,
        54,
        currentBeat === 0
          ? themeColors.red
          : currentBeat === 1 && progress < 1
            ? themeColors.yellow
            : themeColors.green,
      ),
    );
    contextText(
      ctx,
      api,
      currentBeat === 0
        ? 'stale key basis'
        : currentBeat === 1 && progress < 1
          ? 'repairing the cached basis'
          : 'consistent intended basis',
      1370,
      845,
      31,
      currentBeat === 0
        ? themeColors.red
        : currentBeat === 1 && progress < 1
          ? themeColors.yellow
          : themeColors.green,
    );
    footer(
      ctx,
      api,
      'Toy unit-vector counterexample · compare cached and equivalent uncached execution',
    );
  }
}
export default {
  id: 'basis-consistency',
  draw: drawBasisConsistency,
  cues: ['basis-consistency-0', 'basis-consistency-1', 'basis-consistency-2'],
};
