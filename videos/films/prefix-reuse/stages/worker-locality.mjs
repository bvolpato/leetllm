import { clamp } from '../arithmetic.mjs';
import { arrow, drawText, frame, line, mark, pill, tokenRail } from '../defaults.mjs';
export function drawWorkerLocality(ctx, scene, state, api) {
  return api.focus.target('worker-locality-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      const affinity = currentBeat > 0 || cueVisible('route-affinity'),
        roundReady = currentBeat > 0 || cueVisible('route-round');
      drawText(
        ctx,
        api,
        'Three independent local inventories · completed sequential requests',
        150,
        270,
        30,
      );
      const destinations = affinity ? [0, 0, 0, 0] : [0, 1, 2, 0];
      const timeline =
        currentBeat > 0 ? 4 : 4 * cueProgress(affinity ? 'route-affinity' : 'route-round');
      const completed = Math.floor(Math.min(4, timeline));
      const completedWorkers = new Set(destinations.slice(0, completed));
      [0, 1, 2].forEach((i) => {
        const x = 250 + i * 570;
        frame(ctx, api, x, 550, 450, 260, themeColors.blue);
        drawText(ctx, api, 'Worker ' + i, x + 225, 605, 31, themeColors.blue, 'center');
        const hasGuide = completedWorkers.has(i);
        if (hasGuide) {
          tokenRail(ctx, api, x + 50, 660, 350, [6000], 6000, [themeColors.blue], 55);
          drawText(ctx, api, 'Guide G · 6,000', x + 225, 760, 27, themeColors.blue, 'center');
        } else drawText(ctx, api, 'empty inventory', x + 225, 720, 27, themeColors.muted, 'center');
      });
      destinations.forEach((dest, i) => {
        const x = 180 + i * 440,
          warm = affinity ? i > 0 : i === 3;
        pill(ctx, api, 'R' + (i + 1), x, 355, 150, themeColors.cyan);
        const endX = 475 + dest * 570;
        if (roundReady && timeline > i)
          arrow(
            ctx,
            api,
            x + 75,
            435,
            endX,
            535,
            warm ? themeColors.green : themeColors.yellow,
            clamp(timeline - i),
          );
        drawText(
          ctx,
          api,
          completed > i ? (warm ? 'reuse' : 'cold write') : 'pending',
          x + 75,
          325,
          25,
          completed > i ? (warm ? themeColors.green : themeColors.yellow) : themeColors.muted,
          'center',
        );
      });
      if (currentBeat === 0)
        drawText(
          ctx,
          api,
          (affinity ? 'Affinity' : 'Round-robin') +
            ' · ' +
            completedWorkers.size +
            ' cold computations completed',
          960,
          930,
          35,
          affinity ? themeColors.green : themeColors.yellow,
          'center',
        );
      if (currentBeat === 1) {
        mark(ctx, api, 'route-scope', () =>
          drawText(
            ctx,
            api,
            'Verified tenant + stable guide identity → affinity key',
            960,
            900,
            30,
            themeColors.blue,
            'center',
          ),
        );
        mark(ctx, api, 'route-inventory', () => {
          if (cueVisible('route-inventory')) {
            line(ctx, api, 475, 840, 1615, 840, themeColors.cyan);
            drawText(
              ctx,
              api,
              'Versioned cache inventory / meta-tree',
              960,
              995,
              28,
              themeColors.cyan,
              'center',
            );
          }
        });
      }
      if (currentBeat === 2) {
        mark(ctx, api, 'route-overload', () => {
          if (cueVisible('route-overload')) {
            drawText(ctx, api, 'capacity reached', 475, 860, 29, themeColors.pink, 'center');
            arrow(ctx, api, 700, 790, 805, 790, themeColors.yellow);
          }
        });
        mark(ctx, api, 'route-transfer', () => {
          if (cueVisible('route-transfer'))
            drawText(
              ctx,
              api,
              'Compare wait + remaining prefill + transfer',
              960,
              935,
              31,
              themeColors.yellow,
              'center',
            );
        });
        mark(ctx, api, 'route-new', () => {
          if (cueVisible('route-new'))
            drawText(
              ctx,
              api,
              'An empty worker is a cold destination',
              960,
              1008,
              29,
              themeColors.muted,
              'center',
            );
        });
      }
    }
  });
}
export default {
  id: 'worker-locality',
  draw: drawWorkerLocality,
  cues: [
    'route-round',
    'route-hit',
    'route-affinity',
    'route-scope',
    'route-inventory',
    'route-overload',
    'route-transfer',
    'route-new',
  ],
};
