import { visibleLineSegments } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import {
  extensionAxes,
  extensionMath,
  extensionNote,
  extensionRing,
  extensionRows,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawSphericalCenters(ctx, scene, state, api) {
  return api.focus.target('spherical-centers-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
        directed(state, `cp-spherical-centers-${beat}-${sentence}`, beat),
      resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green];
    {
      const q = extensionAxes(
        ctx,
        api,
        currentBeat === 2 ? [-1.3, 1.3] : [-0.3, 1.3],
        [-0.3, 1.3],
        140,
        335,
        900,
        535,
      );
      if (currentBeat === 0) {
        const mean = [0.5, 0.5];
        extensionSegment(ctx, api, pendingSegments, q, [0, 0], [1, 0], themeColors.blue, 4);
        extensionSegment(ctx, api, pendingSegments, q, [0, 0], [0, 1], themeColors.cyan, 4);
        if (cueProgress(0, 1) > 0) {
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            [0, 0],
            mean,
            themeColors.yellow,
            6,
            cueProgress(0, 1),
          );
          extensionRing(ctx, api, q, mean);
        }
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Two unit inputs → coordinate mean',
          1480,
          355,
          31,
          themeColors.cyan,
        );
        if (resultComplete(0, 1))
          extensionRows(
            ctx,
            api,
            labelBoxes,
            ['μ = [0.5,0.5]', '||μ|| = ' + Math.hypot(...mean).toFixed(3)],
            1480,
            520,
            130,
          );
        if (cueProgress(0, 2) > 0)
          extensionMath(
            ctx,
            api,
            String.raw`d^2=1+\|μ\|^2-2q^\topμ`,
            1480,
            845,
            35,
            themeColors.yellow,
          );
      } else if (currentBeat === 1) {
        const centers = [
          [0.1, 0],
          [0.8, 0.6],
        ];
        centers.forEach((p, i) => {
          extensionSegment(ctx, api, pendingSegments, q, [0, 0], p, colors[i], 5);
          extensionRing(ctx, api, q, p, colors[i]);
        });
        extensionRing(ctx, api, q, [1, 0]);
        extensionText(
          ctx,
          api,
          labelBoxes,
          'q = [1,0] · separate supplied group means',
          1450,
          300,
          29,
          themeColors.muted,
        );
        extensionRows(ctx, api, labelBoxes, ['C0 [0.1,0]', 'C1 [0.8,0.6]'], 1450, 435, 90);
        if (resultComplete(1, 1))
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Squared distance: 0.81 / 0.40 → C1',
            1450,
            680,
            31,
            themeColors.yellow,
          );
        if (resultComplete(1, 2))
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Cosine: 1.00 / 0.80 → C0',
            1450,
            805,
            31,
            themeColors.green,
          );
      } else {
        const fallback = cueProgress(2, 2),
          second = [-fallback, 1 - fallback],
          sum = [1 + second[0], second[1]],
          length = Math.hypot(...sum),
          normalized = length > 1e-12 ? sum.map((v) => v / length) : null;
        extensionSegment(ctx, api, pendingSegments, q, [0, 0], [1, 0], themeColors.blue, 5);
        extensionSegment(ctx, api, pendingSegments, q, [0, 0], second, themeColors.cyan, 5);
        if (normalized)
          extensionSegment(ctx, api, pendingSegments, q, [0, 0], normalized, themeColors.yellow, 6);
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Normalize the group sum',
          1450,
          350,
          35,
          themeColors.yellow,
        );
        extensionRows(
          ctx,
          api,
          labelBoxes,
          [
            'x₁ = [1,0]',
            'x₂ = [' + second.map((v) => v.toFixed(2)).join(', ') + ']',
            'sum = [' + sum.map((v) => v.toFixed(2)).join(', ') + ']',
          ],
          1450,
          480,
          110,
        );
        extensionText(
          ctx,
          api,
          labelBoxes,
          normalized
            ? 'Unit center [' + normalized.map((v) => v.toFixed(3)).join(', ') + ']'
            : 'Zero sum → explicit fallback',
          1450,
          875,
          32,
          normalized ? themeColors.green : themeColors.pink,
        );
      }
      extensionNote(
        ctx,
        api,
        labelBoxes,
        'Unit input norms do not guarantee a nonzero sum or a unit arithmetic mean.',
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
  id: 'spherical-centers',
  draw: drawSphericalCenters,
  cues: [
    'cp-spherical-centers-0-0',
    'cp-spherical-centers-0-1',
    'cp-spherical-centers-0-2',
    'cp-spherical-centers-0-3',
    'cp-spherical-centers-1-0',
    'cp-spherical-centers-1-1',
    'cp-spherical-centers-1-2',
    'cp-spherical-centers-1-3',
    'cp-spherical-centers-1-4',
    'cp-spherical-centers-2-0',
    'cp-spherical-centers-2-1',
    'cp-spherical-centers-2-2',
    'cp-spherical-centers-2-3',
  ],
};
