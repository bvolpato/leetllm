import { stampTurnRewards, sum } from '../arithmetic.mjs';
import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterRow,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawRewardEndpoints(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('reward-endpoints', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-reward-endpoints-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Attach each reward to its action endpoint'
        : currentBeat === 1
          ? 'Truncation and manually appended EOS change reward positions'
          : 'A custom-template scalar is a different aggregation',
    );
    if (currentBeat < 2) {
      const truncated = currentBeat === 1 && done('reward-truncate') && !done('reward-eos'),
        eos = currentBeat === 1 && done('reward-eos'),
        length = truncated ? 4 : eos ? 6 : 5,
        values = stampTurnRewards(
          [
            [-0.2, 1],
            [1, 4],
          ],
          length,
          {
            eos,
          },
        );
      drawSkyChapterRow(
        ctx,
        api,
        Array.from(
          {
            length,
          },
          (_, i) => i,
        ),
        365,
        {
          color: themeColors.muted,
        },
      );
      drawSkyChapterRow(ctx, api, [11, 12, 90, 21, 22, 'EOS'].slice(0, length), 475, {
        color: themeColors.blue,
      });
      drawSkyChapterRow(
        ctx,
        api,
        values.map((v) => (!currentBeat && !done('reward-ends') ? '?' : v)),
        650,
        {
          colors: values.map((v) =>
            v > 0 ? themeColors.green : v < 0 ? themeColors.pink : themeColors.muted,
          ),
        },
      );
      drawSkyChapterText(
        ctx,
        api,
        eos
          ? 'Manually appended EOS · mask zero · reward at final position'
          : truncated
            ? 'Retained positions stop before the last endpoint'
            : 'Reward row has the same length as the retained response',
        960,
        855,
        31,
        themeColors.cyan,
        'center',
      );
      if (currentBeat || done('reward-sum'))
        drawSkyChapterText(
          ctx,
          api,
          'retained reward sum = ' + sum(values).toFixed(1),
          960,
          940,
          37,
          themeColors.green,
          'center',
        );
    } else {
      drawSkyChapterBox(
        ctx,
        api,
        'Default per-token rewards',
        180,
        400,
        700,
        100,
        themeColors.blue,
        34,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'Custom-template last step',
        1040,
        400,
        700,
        100,
        themeColors.pink,
        32,
      );
      drawSkyChapterRow(ctx, api, [0, -0.2, 0, 0, 1], 620, {
        x: 180,
        width: 700,
        size: 28,
      });
      drawSkyChapterBox(
        ctx,
        api,
        done('reward-scalar') ? '1.0' : '?',
        1230,
        620,
        320,
        95,
        done('reward-scalar') ? themeColors.green : themeColors.muted,
        39,
      );
      drawSkyChapterText(ctx, api, 'sum 0.8', 530, 860, 39, themeColors.blue, 'center');
      drawSkyChapterText(
        ctx,
        api,
        'last scalar ' + (done('reward-scalar') ? '1.0' : '?'),
        1390,
        860,
        39,
        themeColors.pink,
        'center',
      );
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'Reward shape, endpoint, truncation and template all precede the optimizer',
    );
  });
}
export default {
  id: 'reward-endpoints',
  draw: drawRewardEndpoints,
  cues: [
    'sky-reward-endpoints-b0',
    'sky-reward-ends',
    'sky-reward-sum',
    'sky-reward-endpoints-b1',
    'sky-reward-truncate',
    'sky-reward-eos',
    'sky-reward-endpoints-b2',
    'sky-reward-scalar',
  ],
};
