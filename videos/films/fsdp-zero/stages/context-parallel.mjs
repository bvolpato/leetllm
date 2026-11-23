import { bounded } from '../arithmetic.mjs';
import { contextAttentionConstruction, onlineAttention } from '../model.mjs';
import {
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTile,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawContextParallel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id, a = 0.1, z = 0.8) => {
      const c = state.cues?.[id];
      return c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : bounded(c.progress)
        : cueProgress(a, z);
    };
  {
    if (currentBeat === 0) {
      drawExpandedTitle(
        ctx,
        api,
        'One sequence split across four owners · local Q retains its positions',
      );
      const q = cueProgress(),
        owners = [
          [430, 450],
          [1430, 450],
          [1430, 850],
          [430, 850],
        ],
        route = [
          [650, 450],
          [1210, 450],
          [1210, 850],
          [650, 850],
        ],
        packets = Array.from(
          {
            length: 4,
          },
          (_, i) => {
            const phase = (i + q * 3) % 4,
              j = Math.floor(phase),
              mix = phase - j,
              [x, y] = route[j],
              to = route[(j + 1) % 4];
            return {
              i,
              x: x + (to[0] - x) * mix,
              y: y + (to[1] - y) * mix,
            };
          },
        );
      route.forEach(([x, y], i) => {
        const to = route[(i + 1) % 4],
          horizontal = y === to[1],
          low = Math.min(horizontal ? x : y, horizontal ? to[0] : to[1]),
          high = Math.max(horizontal ? x : y, horizontal ? to[0] : to[1]),
          gaps = packets
            .filter(
              (k) =>
                Math.abs((horizontal ? k.y : k.x) - (horizontal ? y : x)) < (horizontal ? 40 : 80),
            )
            .map((k) => [
              (horizontal ? k.x : k.y) - (horizontal ? 80 : 45),
              (horizontal ? k.x : k.y) + (horizontal ? 80 : 45),
            ])
            .sort((a, b) => a[0] - b[0]);
        let last = low;
        for (const [a, z] of gaps) {
          if (a > last) {
            if (horizontal)
              drawExpandedLine(ctx, api, last, y, Math.min(a, high), y, themeColors.muted, 3);
            else drawExpandedLine(ctx, api, x, last, x, Math.min(a, high), themeColors.muted, 3);
          }
          last = Math.max(last, z);
        }
        if (last < high) {
          if (horizontal) drawExpandedLine(ctx, api, last, y, high, y, themeColors.muted, 3);
          else drawExpandedLine(ctx, api, x, last, x, high, themeColors.muted, 3);
        }
      });
      owners.forEach(([x, y], i) =>
        drawExpandedTile(ctx, api, 'Q block ' + i, x - 125, y - 45, 250, 90, themeColors.blue),
      );
      packets.forEach((k) =>
        drawExpandedTile(
          ctx,
          api,
          'KV ' + k.i,
          k.x - 65,
          k.y - 30,
          130,
          60,
          [themeColors.cyan, themeColors.pink, themeColors.yellow, themeColors.green][k.i],
        ),
      );
      drawExpandedText(
        ctx,
        api,
        'Position identities keep their causal masks while KV blocks travel',
        960,
        1030,
        29,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      const q = cueProgress(),
        first = onlineAttention()[0],
        second = onlineAttention()[1];
      drawExpandedTitle(
        ctx,
        api,
        'Supplied one-query attention · score 0, value 2 and score ln 3, value 10',
      );
      const construction = contextAttentionConstruction(cue('online-output')),
        { mass, weighted } = construction;
      drawExpandedTile(
        ctx,
        api,
        'Old block: mass 1 · weighted 2',
        230,
        390,
        650,
        100,
        themeColors.blue,
      );
      drawExpandedTile(
        ctx,
        api,
        'Next block: mass 3 · weighted 30',
        1030,
        390,
        650,
        100,
        themeColors.cyan,
      );
      api.arrow(ctx, 555, 510, 960, 660, themeColors.blue, 3);
      api.arrow(ctx, 1355, 510, 960, 660, themeColors.cyan, 3);
      drawExpandedText(
        ctx,
        api,
        'Equivalent unnormalized totals: mass ' +
          mass.toFixed(2) +
          ' · weighted ' +
          weighted.toFixed(2),
        960,
        760,
        36,
        themeColors.yellow,
        'center',
      );
      api.focus.target('attention-merged', () =>
        drawExpandedText(
          ctx,
          api,
          construction.complete
            ? 'Output = (2 + 30) / (1 + 3) = ' + construction.output.toFixed(0)
            : 'Merged output = weighted sum / mass = ?',
          960,
          895,
          40,
          themeColors.green,
          'center',
        ),
      );
      drawExpandedText(
        ctx,
        api,
        'Stable implementation rescales the old mass and weighted sum when the maximum changes',
        960,
        1020,
        27,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'context-parallel',
  draw: drawContextParallel,
  cues: ['online-output'],
};
