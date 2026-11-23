import { replayReplacementFixture } from '../model.mjs';
import { arrow, box, focusProgress, footer, label } from '../defaults.mjs';
export function drawReplayState(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  api.focus.target('cau-replay-state-mechanism', () => {
    const changed = done('replay-change'),
      f = replayReplacementFixture(changed ? 4 : 2),
      frozen = done('replay-frozen'),
      concrete = done('replay-model');
    const rows = [
      ['tool 2 return', f.returned, themeColors.blue],
      [
        'step 4 doubles',
        changed && !done('replay-new-result') ? 'recomputing' : f.doubled,
        themeColors.cyan,
      ],
      ['step 5 threshold', f.threshold, themeColors.yellow],
    ];
    rows.forEach(([name, value, color], i) => {
      const x = 190 + i * 560;
      box(
        ctx,
        api,
        name,
        [
          concrete
            ? String(value)
            : ['snapshot environment', 'repeat downstream work', 'retain declared outcome'][i],
        ],
        x,
        390,
        430,
        170,
        color,
      );
      if (i < 2) arrow(ctx, api, x + 445, 475, x + 545, 475, themeColors.cyan);
    });
    if (changed && done('replay-new-result'))
      label(ctx, api, 'Recomputed 8 reaches 6 → success', 960, 720, themeColors.green, 39);
    else if (!changed && done('replay-baseline'))
      label(ctx, api, 'Computed 4 is below 6 → failure', 960, 720, themeColors.pink, 39);
    if (frozen)
      box(
        ctx,
        api,
        'Separate invalid frozen branch',
        ['old step 4 remains 4', 'freezing blocks the changed return'],
        430,
        810,
        1060,
        155,
        themeColors.pink,
      );
    footer(
      ctx,
      api,
      'The intervention replaces one return in this toy environment; it does not uniquely identify a historical root cause.',
    );
  });
}
export default {
  id: 'replay-state',
  draw: drawReplayState,
  cues: [
    'cau-replay-state-0',
    'cau-replay-state-1',
    'cau-replay-baseline',
    'cau-replay-change',
    'cau-replay-new-result',
    'cau-replay-frozen',
    'cau-replay-model',
    'cau-replay-state-2',
  ],
};
