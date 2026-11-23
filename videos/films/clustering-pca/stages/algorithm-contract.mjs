import { seeds, xy } from '../fixtures.mjs';
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
export function drawAlgorithmContract(ctx, scene, state, api) {
  return api.focus.target('algorithm-contract-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
        directed(state, `cp-algorithm-contract-${beat}-${sentence}`, beat),
      resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
      ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    {
      if (currentBeat === 0) {
        extensionText(ctx, api, labelBoxes, 'Documents X · 6 × 2', 420, 270, 34, themeColors.cyan);
        extensionText(ctx, api, labelBoxes, 'Centers μ · 3 × 2', 1320, 270, 34, themeColors.yellow);
        xy.forEach((row, i) => {
          extensionText(ctx, api, labelBoxes, ids[i], 200, 370 + i * 80, 28, themeColors.muted);
          row.forEach((v, j) =>
            extensionText(
              ctx,
              api,
              labelBoxes,
              v.toFixed(1),
              390 + j * 190,
              370 + i * 80,
              34,
              themeColors.cyan,
            ),
          );
        });
        seeds.forEach((row, i) =>
          row.forEach((v, j) =>
            extensionText(
              ctx,
              api,
              labelBoxes,
              v.toFixed(1),
              1230 + j * 220,
              390 + i * 100,
              35,
              themeColors.yellow,
            ),
          ),
        );
        if (cueProgress(0, 2) > 0) {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Wrong width: μ = [[1], [4], [8]]',
            1370,
            725,
            30,
            themeColors.pink,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            resultComplete(0, 2) ? 'REJECT · expected d = 2' : 'Check the feature width',
            1370,
            790,
            33,
            themeColors.pink,
          );
        }
        if (cueProgress(0, 3) > 0) {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Silent broadcast: [1] → [1, 1]',
            1370,
            885,
            30,
            themeColors.pink,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            'NaN coordinate → reject before assignment',
            1370,
            945,
            27,
            themeColors.pink,
          );
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          'Validate shape and finite values before calculating nearest centers.',
        );
      } else {
        const q = extensionAxes(ctx, api, [0, 2.5], [0.5, 2.3], 180, 335, 780, 510),
          u = cueProgress(1, 2),
          center = [mix(1, 1.1, u), mix(1, 1.4, u)];
        [0, 1].forEach((i) =>
          extensionSegment(ctx, api, pendingSegments, q, xy[i], center, themeColors.blue, 4),
        );
        extensionDots(
          ctx,
          api,
          'algorithm-contract',
          colors,
          ids,
          labelBoxes,
          q,
          [xy[0], xy[1]],
          ['A', 'B'],
          [0, 0],
        );
        extensionRing(ctx, api, q, center);
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Fixed members: A and B',
          1450,
          330,
          34,
          themeColors.blue,
        );
        extensionMath(ctx, api, String.raw`J(\mu)=\sum_i\|x_i-\mu\|^2`, 1450, 450, 43);
        if (cueProgress(1, 1) > 0)
          extensionMath(
            ctx,
            api,
            String.raw`\nabla_{\mu}J=-2\sum_i(x_i-\mu)`,
            1450,
            575,
            40,
            themeColors.yellow,
          );
        if (cueProgress(1, 2) > 0)
          extensionMath(
            ctx,
            api,
            resultComplete(1, 2)
              ? String.raw`\nabla_{\mu}J=0\Rightarrow μ=[1.1,1.4]`
              : String.raw`\nabla_{\mu}J=0\Rightarrow μ=?`,
            1450,
            710,
            36,
            themeColors.green,
          );
        if (resultComplete(1, 3))
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Nonempty group · unique squared-error minimum',
            1450,
            850,
            28,
            themeColors.green,
          );
        extensionNote(ctx, api, labelBoxes, 'The update rule follows from the chosen objective.');
      }
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
  id: 'algorithm-contract',
  draw: drawAlgorithmContract,
  cues: [
    'cp-algorithm-contract-0-0',
    'cp-algorithm-contract-0-1',
    'cp-algorithm-contract-0-2',
    'cp-algorithm-contract-0-3',
    'cp-algorithm-contract-1-0',
    'cp-algorithm-contract-1-1',
    'cp-algorithm-contract-1-2',
    'cp-algorithm-contract-1-3',
    'cp-algorithm-contract-1-4',
  ],
};
