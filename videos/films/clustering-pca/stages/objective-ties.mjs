import { mix, visibleLineSegments } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import {
  extensionAxes,
  extensionDots,
  extensionNote,
  extensionRing,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawObjectiveTies(ctx, scene, state, api) {
  return api.focus.target('objective-ties-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
        directed(state, `cp-objective-ties-${beat}-${sentence}`, beat),
      resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
      ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    {
      const square = [
          [0, 0],
          [0, 2],
          [2, 0],
          [2, 2],
        ],
        right = cueProgress(0, 2),
        horizontal = cueProgress(0, 3),
        assignments = horizontal > 0 ? [0, 1, 0, 1] : [0, 0, 1, 1],
        left = [
          [0, 1],
          [2, 1],
        ],
        bottom = [
          [1, 0],
          [1, 2],
        ],
        centers = left.map((p, i) => p.map((v, j) => mix(v, bottom[i][j], horizontal))),
        q = extensionAxes(ctx, api, [-0.5, 2.5], [-0.5, 2.5], 200, 360, 800, 500);
      if (right > 0)
        square.forEach((p, i) =>
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            p,
            centers[assignments[i]],
            colors[assignments[i]],
            4,
          ),
        );
      extensionDots(
        ctx,
        api,
        'objective-ties',
        colors,
        ids,
        labelBoxes,
        q,
        square,
        ['S0', 'S1', 'S2', 'S3'],
        assignments,
      );
      if (right > 0) centers.forEach((p) => extensionRing(ctx, api, q, p));
      extensionText(
        ctx,
        api,
        labelBoxes,
        horizontal > 0 ? 'Bottom / top' : 'Left / right',
        1480,
        360,
        35,
        themeColors.cyan,
      );
      extensionText(
        ctx,
        api,
        labelBoxes,
        'J = ' +
          (horizontal > 0 ? (resultComplete(0, 3) ? '4' : '?') : resultComplete(0, 2) ? '4' : '?'),
        1480,
        500,
        57,
        themeColors.yellow,
      );
      if (currentBeat === 1) {
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Same four documents · different memberships',
          1480,
          655,
          28,
          themeColors.ink,
        );
        extensionText(
          ctx,
          api,
          labelBoxes,
          'x: user tier    y: severity',
          1480,
          745,
          29,
          themeColors.muted,
        );
        if (cueProgress(1, 3) > 0)
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Inspect elongated groups and outliers separately',
            1480,
            875,
            28,
            themeColors.pink,
          );
      }
      extensionNote(
        ctx,
        api,
        labelBoxes,
        'Separate square fixture · equal objective values do not select a workflow meaning.',
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
  id: 'objective-ties',
  draw: drawObjectiveTies,
  cues: [
    'cp-objective-ties-0-0',
    'cp-objective-ties-0-1',
    'cp-objective-ties-0-2',
    'cp-objective-ties-0-3',
    'cp-objective-ties-0-4',
    'cp-objective-ties-1-0',
    'cp-objective-ties-1-1',
    'cp-objective-ties-1-2',
    'cp-objective-ties-1-3',
  ],
};
