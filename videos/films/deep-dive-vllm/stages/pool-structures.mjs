import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid } from '../defaults.mjs';
export function drawPoolStructures(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('pool-structures', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-pool-structures-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-pool-structures-mechanism', () => {
    head(
      currentBeat === 0
        ? 'One physical ID · several distinct ownership indexes'
        : currentBeat === 1
          ? 'Touch live readers before allowing allocation'
          : 'Conserve the free queue through two operations',
    );
    if (currentBeat === 0) {
      grid(
        ctx,
        api,
        [
          ['Block', 'refs', 'hash'],
          ['12', '2', 'shared'],
          ['41', '1', 'R0suffix'],
          ['73', '1', 'R1suffix'],
          ['90', '1', 'none:partial'],
          ['55', '0', 'cached'],
        ],
        150,
        365,
        710,
        535,
        themeColors.blue,
        27,
      );
      grid(
        ctx,
        api,
        [
          ['R0', '12', '41'],
          ['R1', '12', '73 /90'],
        ],
        1060,
        365,
        700,
        210,
        themeColors.pink,
      );
      chapterCard(
        ctx,
        api,
        'Hash map:prefix →12 / old →55',
        1060,
        680,
        700,
        themeColors.yellow,
        90,
        26,
      );
      chapterCard(ctx, api, 'Free queue:[55]', 1060, 835, 700, themeColors.green);
    } else if (currentBeat === 1) {
      const touch = resultComplete('touch', 1),
        alloc = resultComplete('allocate', 1),
        stage = alloc ? 3 : touch ? 2 : 0;
      grid(
        ctx,
        api,
        [
          ['Physical55', 'refs ' + Number(touch), touch ? 'requestR1' : 'cached H55'],
          ['Physical88', 'refs ' + Number(alloc), alloc ? 'newR2 / oldhashgone' : 'cached H88'],
        ],
        150,
        380,
        1600,
        230,
        themeColors.blue,
        29,
      );
      grid(
        ctx,
        api,
        [[...(alloc ? [] : touch ? ['88'] : ['55', '88']), ...(alloc ? ['empty'] : [])]],
        150,
        740,
        1600,
        100,
        themeColors.green,
        30,
      );
      chapterText(
        ctx,
        api,
        stage === 0
          ? 'Hit55 identified; no live reader yet'
          : stage === 1
            ? '55 unlinked; acquire live reference'
            : stage === 2
              ? 'Allocator selects head88'
              : '88 old identity evicted; new live reference',
        960,
        930,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      grid(
        ctx,
        api,
        [['71', '55', '9'].map((x) => 'block' + x)],
        150,
        365,
        1600,
        90,
        themeColors.blue,
      );
      grid(
        ctx,
        api,
        [['refs' + modelState.refs[71], 'refs' + modelState.refs[55], 'refs' + modelState.refs[9]]],
        150,
        500,
        1600,
        90,
        themeColors.cyan,
      );
      chapterText(ctx, api, 'Free queue · head first', 150, 675, 30, themeColors.green);
      grid(
        ctx,
        api,
        [[...modelState.queue.map(String)]],
        150,
        720,
        1600,
        100,
        themeColors.green,
        35,
      );
      if (modelState.touch)
        chapterCard(ctx, api, 'RequestA →9', 150, 900, 650, themeColors.pink, 75);
      if (modelState.allocate)
        chapterCard(
          ctx,
          api,
          'RequestB →71 · old hash removed',
          1030,
          900,
          730,
          themeColors.yellow,
          75,
          27,
        );
    }
    foot(
      'Expanded teaching pool · physical IDs stay fixed while tables, refs, hashes and queue change',
    );
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'pool-structures',
  draw: drawPoolStructures,
  cues: [
    'vv-pool-structures-op-0',
    'vv-pool-structures-op-1',
    'vv-pool-structures-touch',
    'vv-pool-structures-allocate',
    'vv-pool-structures-op-2',
    'vv-pool-structures-touch-nine',
    'vv-pool-structures-allocate-head',
  ],
};
