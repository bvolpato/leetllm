import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeCapacity } from '../model.mjs';
import { mechanismLine, mechanismText, rectangle, tiles } from '../defaults.mjs';
export function drawCapacityArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'capacity-arithmetic-op-' + i, 'progress');
  api.focus.target('mo-capacity-arithmetic-mechanism', () => {
    const repair = resultComplete('capacity-factor'),
      f = moeCapacity(4096, 2, 32, repair ? 1.2 : 1, [400]),
      slots = resultComplete(repair ? 'capacity-ceiling' : 'capacity-slots'),
      overflow = resultComplete(repair ? 'capacity-remainder' : 'capacity-overflow');
    mechanismText(
      ctx,
      api,
      '4,096 tokens × top-2 · 32 equal-size experts',
      960,
      285,
      35,
      themeColors.yellow,
    );
    const n = Math.ceil(128 * cueProgress(0));
    tiles(ctx, api, n, 200, 370, themeColors.blue, 32, 30, 30, 19);
    mechanismText(ctx, api, 'Each tile encodes 32 token rows', 680, 530, 27, themeColors.muted);
    if (resultComplete('capacity-assignments'))
      mechanismText(ctx, api, '8,192 assignments', 1430, 440, 39, themeColors.cyan);
    mechanismLine(ctx, api, 250, 780, 1650, 780, themeColors.muted, 2);
    rectangle(ctx, api, 250, 650, 400 * 3, 110, themeColors.panel, themeColors.blue);
    mechanismText(ctx, api, 'Hot expert: 400 arrivals', 960, 605, 34, themeColors.blue);
    if (slots) {
      const x = 250 + f.slots * 3;
      mechanismLine(ctx, api, x, 610, x, 850, themeColors.yellow, 4);
      mechanismText(ctx, api, f.slots + ' slots', x, 910, 33, themeColors.yellow);
    }
    if (overflow) {
      rectangle(ctx, api, 250 + f.slots * 3, 650, f.totalOverflow * 3, 110, themeColors.pink);
      mechanismText(
        ctx,
        api,
        f.totalOverflow + ' overflow assignments',
        960,
        970,
        35,
        themeColors.pink,
      );
    }
    if (repair)
      mechanismText(
        ctx,
        api,
        'Only capacity factor changes: 1 → 1.2',
        960,
        325,
        31,
        themeColors.yellow,
      );
  });
}
export default {
  id: 'capacity-arithmetic',
  draw: drawCapacityArithmetic,
  cues: [
    'mo-capacity-arithmetic-op-0',
    'mo-capacity-assignments',
    'mo-capacity-slots',
    'mo-capacity-overflow',
    'mo-capacity-arithmetic-op-1',
    'mo-capacity-arithmetic-op-2',
    'mo-capacity-factor',
    'mo-capacity-ceiling',
    'mo-capacity-remainder',
  ],
};
