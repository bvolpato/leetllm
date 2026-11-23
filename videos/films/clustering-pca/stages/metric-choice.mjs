import { mix, visibleLineSegments } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionMath,
  extensionNote,
  extensionRing,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawMetricChoice(ctx, scene, state, api) {
  return api.focus.target('metric-choice-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
        directed(state, `cp-metric-choice-${beat}-${sentence}`, beat),
      resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
      ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    {
      const vectors = [
          [1, 0.1],
          [8, 4],
        ],
        query = [1, 0],
        u = currentBeat > 0 ? 1 : cueProgress(0, 2),
        q = extensionAxes(ctx, api, [0, mix(9, 1.35, u)], [-0.2, mix(5.5, 1.1, u)]),
        current = vectors.map((v) => v.map((x) => mix(x, x / Math.hypot(...v), u)));
      current.forEach((p, i) =>
        extensionSegment(
          ctx,
          api,
          pendingSegments,
          q,
          [0, 0],
          p,
          i ? themeColors.pink : themeColors.blue,
          5,
        ),
      );
      extensionDots(
        ctx,
        api,
        'metric-choice',
        colors,
        ids,
        labelBoxes,
        q,
        current,
        ['charge', 'release'],
        [0, 2],
      );
      extensionRing(ctx, api, q, query, themeColors.yellow);
      extensionText(ctx, api, labelBoxes, 'q = [1,0]', 1500, 330, 34, themeColors.yellow);
      extensionText(
        ctx,
        api,
        labelBoxes,
        u === 1 ? 'Unit-vector cosine' : u === 0 ? 'Raw dot product' : 'Normalizing the vectors',
        1500,
        445,
        33,
        themeColors.cyan,
      );
      const scores = current.map((v) => v[0]);
      scores.forEach((v, i) =>
        extensionText(
          ctx,
          api,
          labelBoxes,
          (i ? 'release: ' : 'charge: ') + v.toFixed(3),
          1500,
          565 + i * 115,
          36,
          i ? themeColors.pink : themeColors.blue,
        ),
      );
      if (resultComplete(0, 4))
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Winner: ' + (u === 1 ? 'duplicate charge' : 'release'),
          1500,
          825,
          33,
          themeColors.green,
        );
      if (currentBeat === 1 && cueProgress(1, 0) > 0)
        extensionMath(
          ctx,
          api,
          String.raw`\|u-v\|^2=2-2u^\top v`,
          1450,
          940,
          38,
          themeColors.yellow,
        );
      extensionNote(
        ctx,
        api,
        labelBoxes,
        'Same documents and query · axes follow normalization while the comparison contract changes.',
      );
    }
    for (const { q, a, z, color, width } of pendingSegments)
      for (const points of visibleLineSegments(a, z, labelBoxes))
        api.path(ctx, points, {
          color,
          width,
          clip: q.bounds,
        });
  });
}
export default {
  id: 'metric-choice',
  draw: drawMetricChoice,
  cues: [
    'cp-metric-choice-0-0',
    'cp-metric-choice-0-1',
    'cp-metric-choice-0-2',
    'cp-metric-choice-0-3',
    'cp-metric-choice-0-4',
    'cp-metric-choice-1-0',
    'cp-metric-choice-1-1',
    'cp-metric-choice-1-2',
    'cp-metric-choice-1-3',
  ],
};
