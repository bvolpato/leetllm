import { longContextModel, releaseSliceBars } from '../construction.mjs';
import { contextText, footer, modelTarget } from '../defaults.mjs';
export function drawReleaseSlices(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('release-slices', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat < 2) {
      contextText(
        ctx,
        api,
        currentBeat === 0
          ? 'Control length, depth and answer headroom'
          : 'Separate one-fact lookup from joint reasoning',
        960,
        280,
        38,
        themeColors.cyan,
      );
      const positions = [0, 8, 16];
      positions.forEach((pos, i) => {
        const y = 420 + i * 150,
          x = 350 + (1300 * pos) / 16;
        if (x - 55 > 350) api.line(ctx, 350, y, x - 55, y, themeColors.muted, 3);
        if (x + 55 < 1650) api.line(ctx, x + 55, y, 1650, y, themeColors.muted, 3);
        modelTarget(ctx, api, 'release-slices', () => {
          api.rect(ctx, x - 45, y - 40, 90, 80, themeColors.panel, themeColors.yellow, 3);
          contextText(ctx, api, 'D1', x, y + 12, 30, themeColors.yellow);
        });
        contextText(ctx, api, ['head', 'middle', 'tail'][i], 220, y + 12, 29, themeColors.blue);
      });
      footer(
        ctx,
        api,
        currentBeat === 0
          ? 'Record actual packed length/depth, answers, absent controls and scorer outcomes'
          : 'Add multiple needles, multi-hop and aggregation · check loss and serving measurements',
      );
    } else {
      modelTarget(ctx, api, 'release-slices', () =>
        contextText(
          ctx,
          api,
          'Same average · different release decision',
          960,
          280,
          39,
          themeColors.cyan,
        ),
      );
      ['head', 'middle', 'tail'].forEach((label, i) => {
        const x = 420 + i * 540,
          value = releaseSliceBars(progress).candidate[i];
        [
          [x - 100, m.baseline[i], themeColors.blue],
          [x + 25, value, value < m.floor ? themeColors.red : themeColors.green],
        ].forEach(([bx, v, color], index) => {
          api.rect(ctx, bx, 360, 90, 430, themeColors.panel, themeColors.muted, 1);
          const paint = () => api.rect(ctx, bx, 790 - 4.3 * v, 90, 4.3 * v, color, color, 1);
          if (index) api.components.fade(releaseSliceBars(progress).candidateOpacity, paint);
          else paint();
        });
        api.line(
          ctx,
          x - 120,
          790 - 4.3 * m.floor,
          x + 135,
          790 - 4.3 * m.floor,
          themeColors.yellow,
          2,
        );
        contextText(ctx, api, label, x + 5, 860, 34, themeColors.ink);
        contextText(
          ctx,
          api,
          progress > 0 ? `${m.baseline[i]} / ${value}%` : `baseline ${m.baseline[i]}%`,
          x + 5,
          945,
          34,
          i === 1 && progress > 0 ? themeColors.red : themeColors.ink,
        );
      });
      footer(
        ctx,
        api,
        '100 supplied cases per depth · both means 90% · candidate middle 70% fails floor 85%',
      );
    }
  }
}
export default {
  id: 'release-slices',
  draw: drawReleaseSlices,
  cues: ['release-slices-0', 'release-slices-1', 'release-slices-2'],
};
