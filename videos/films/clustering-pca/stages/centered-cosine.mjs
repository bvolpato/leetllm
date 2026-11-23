import { distance, visibleLineSegments } from '../arithmetic.mjs';
import { cosine, directed } from '../model.mjs';
import { extensionAxes, extensionNote, extensionSegment, extensionText } from '../defaults.mjs';
export function drawCenteredCosine(ctx, scene, state, api) {
  return api.focus.target('centered-cosine-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
      directed(state, `cp-centered-cosine-${beat}-${sentence}`, beat);
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green];
    {
      const points = [
          [1, 2],
          [1.1, 2.1],
          [2, 1],
        ],
        mean = [1.55, 1.55],
        u = cueProgress(0, 2),
        current = points.map((p) => p.map((v, j) => v - mean[j] * u)),
        q = extensionAxes(ctx, api, [-1, 2.5], [-1, 2.5], 140, 345, 900, 530),
        names = ['Q', 'D1', 'D2'];
      current.forEach((p, i) =>
        extensionSegment(
          ctx,
          api,
          pendingSegments,
          q,
          [0, 0],
          p,
          i ? colors[i - 1] : themeColors.yellow,
          4,
        ),
      );
      current.forEach((point, index) => {
        const at = q.point(...point),
          color = colors[[3, 0, 1][index]];
        api.circle(ctx, at.x, at.y, 10, color);
        extensionText(
          ctx,
          api,
          labelBoxes,
          names[index],
          at.x - 18,
          at.y + (index === 0 ? 20 : -25),
          25,
          color,
          'right',
        );
      });
      extensionText(
        ctx,
        api,
        labelBoxes,
        'Same translation for Q, D1 and D2',
        1460,
        305,
        31,
        themeColors.cyan,
      );
      extensionText(
        ctx,
        api,
        labelBoxes,
        'Current origin: ' +
          (u === 1 ? 'fitted document mean' : u === 0 ? 'original' : 'translating'),
        1460,
        400,
        28,
        themeColors.muted,
      );
      current
        .slice(1)
        .forEach((v, i) =>
          extensionText(
            ctx,
            api,
            labelBoxes,
            'cos(Q,D' + (i + 1) + ') = ' + cosine(current[0], v).toFixed(4),
            1460,
            540 + i * 125,
            36,
            colors[i],
          ),
        );
      if (currentBeat === 1) {
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Distances: ' +
            current
              .slice(1)
              .map((v) => distance(current[0], v).toFixed(3))
              .join(' / '),
          1460,
          795,
          31,
          themeColors.yellow,
        );
        if (cueProgress(1, 3) > 0)
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Document at μ → [0,0] → undefined cosine',
            1460,
            915,
            28,
            themeColors.pink,
          );
      }
      extensionNote(
        ctx,
        api,
        labelBoxes,
        'Cosine is measured from an origin; pairwise Euclidean differences survive a shared translation.',
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
  id: 'centered-cosine',
  draw: drawCenteredCosine,
  cues: [
    'cp-centered-cosine-0-0',
    'cp-centered-cosine-0-1',
    'cp-centered-cosine-0-2',
    'cp-centered-cosine-0-3',
    'cp-centered-cosine-1-0',
    'cp-centered-cosine-1-1',
    'cp-centered-cosine-1-2',
    'cp-centered-cosine-1-3',
    'cp-centered-cosine-1-4',
  ],
};
