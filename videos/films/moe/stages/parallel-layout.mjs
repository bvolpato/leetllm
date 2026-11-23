import { mc, vec } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeReplica } from '../model.mjs';
import { footer, mechanismText, rectangle } from '../defaults.mjs';
export function drawParallelLayout(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'parallel-layout-op-' + i, 'progress'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-parallel-layout-mechanism', () => {
    mechanismText(
      ctx,
      api,
      'Logical expert function versus physical weight placement',
      960,
      285,
      35,
      themeColors.yellow,
    );
    const copy = resultComplete('layout-copy'),
      move = cueProgress(currentBeat),
      replica = moeReplica();
    for (let e = 0; e < 2; e++) {
      const x = 250 + e * 850;
      mechanismText(ctx, api, 'Expert E' + e, x + 260, 370, 33, cols[e]);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++) {
          const shard = Math.floor(row / 2) * 2 + Math.floor(col / 2),
            sx = copy && e === 0 ? 0 : (shard % 2) * 40 * move,
            sy = Math.floor(shard / 2) * 40 * move;
          rectangle(
            ctx,
            api,
            x + col * 90 + sx,
            430 + row * 70 + sy,
            75,
            55,
            cols[shard],
            themeColors.bg,
          );
          mechanismText(
            ctx,
            api,
            replica.weights[row][col],
            x + col * 90 + sx + 37,
            430 + row * 70 + sy + 37,
            23,
            themeColors.bg,
          );
        }
    }
    if (resultComplete('layout-tensor'))
      mechanismText(
        ctx,
        api,
        'Each 2×2 quadrant belongs to a tensor shard',
        960,
        865,
        32,
        themeColors.cyan,
      );
    if (copy) {
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
          rectangle(
            ctx,
            api,
            1520 + j * 40,
            760 + i * 35,
            31,
            25,
            cols[Math.floor(i / 2) * 2 + Math.floor(j / 2)],
          );
      mechanismText(ctx, api, 'Identical 4×4 E0 copy', 1590, 955, 25, themeColors.blue);
    }
    if (resultComplete('layout-preserve'))
      mechanismText(
        ctx,
        api,
        'Same E0 output ' + vec(replica.originalOutput) + ' · extra resident copy',
        960,
        995,
        29,
        themeColors.yellow,
      );
    else footer(ctx, api, 'Illustrative matrix partition; expert groups can contain tensor ranks.');
  });
}
export default {
  id: 'parallel-layout',
  draw: drawParallelLayout,
  cues: [
    'mo-parallel-layout-op-0',
    'mo-layout-tensor',
    'mo-layout-expert',
    'mo-parallel-layout-op-1',
    'mo-layout-copy',
    'mo-layout-preserve',
    'mo-parallel-layout-op-2',
  ],
};
