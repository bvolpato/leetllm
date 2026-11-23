import { completed, opProgress } from '../construction.mjs';
import {
  drawConstructionFocus,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawCfgTraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'cfg-training'),
    done = (name) => completed(state, name),
    result = (fn) => drawConstructionFocus(ctx, api, 'df-cfg-training-result', fn);
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Drop conditioning while retaining the denoising target'
        : 'Subtract → scale → add the baseline',
    );
    if (currentBeat === 0) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Row', 'Original prompt identity', 'Conditioning used'],
          ['0', 'oak / soft light', 'supported null'],
          ['1', 'oak / natural light', 'supported null'],
          ['2', 'mobile dashboard', 'same prompt'],
          ['3', 'latency chart', 'supported null'],
        ],
        170,
        390,
        1580,
        400,
        themeColors.cyan,
        28,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Actual seeded 0.35-drop fixture · supported null need not be an all-zero vector',
      );
    } else
      result(() => {
        const w = currentBeat === 1 ? 7.5 : 15,
          u = [0.2, -0.1, 0.05],
          v = [0.05, -0.35, 0.2],
          res = u.map((x, i) => x + w * (v[i] - x)),
          show = done(currentBeat === 1 ? 'cfg-seven' : 'cfg-fifteen');
        drawConstructionGrid(
          ctx,
          api,
          [
            ['Coordinate', '0', '1', '2'],
            ['Unconditional', ...u],
            ['Conditional', ...v],
            ['Difference', ...v.map((x, i) => (x - u[i]).toFixed(2))],
            ['Scale ' + w, ...(show ? res.map((x) => x.toFixed(3)) : ['?', '?', '?'])],
          ],
          230,
          380,
          1460,
          425,
          themeColors.cyan,
          28,
        );
        drawConstructionFooter(
          ctx,
          api,
          'Scale one returns the conditional prediction · quality and diversity require evaluation',
        );
      });
    return;
  }
}
export default {
  id: 'cfg-training',
  draw: drawCfgTraining,
  cues: [
    'df-cfg-training-0',
    'df-cfg-training-1',
    'df-cfg-seven',
    'df-cfg-training-2',
    'df-cfg-fifteen',
  ],
};
