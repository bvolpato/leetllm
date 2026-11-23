import { groupStatistics, vrBound } from '../arithmetic.mjs';
import {
  drawCell,
  drawEquation,
  drawFooter,
  drawHeading,
  drawLine,
  drawText,
} from '../defaults.mjs';
export function drawPopulationGroup(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue population-group/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
      cueProgress('vr-' + name + '-' + 'population-group', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Construct statistics from all eight identified outcomes');
    const uniform = currentBeat === 2 ? (operationProgress('all-fail', 2) > 0 ? 0 : 1) : null,
      rewards = uniform === null ? [1, 0, 0, 1, 0, 1, 0, 1] : Array(8).fill(uniform),
      stats = groupStatistics(rewards);
    rewards.forEach((r, i) => {
      const x = 220 + i * 195;
      drawCell(ctx, api, 'R' + (i + 1), x, 380, 150, 65, themeColors.blue, 27);
      drawText(ctx, api, r, x + 75, 515, 40, r ? themeColors.green : themeColors.pink, 'center');
      if (operationProgress('deviation', 0) > 0) {
        drawLine(ctx, api, x + 75, 540, x + 75, 590, themeColors.muted, 2);
        drawText(
          ctx,
          api,
          (r - stats.mean).toFixed(1),
          x + 75,
          640,
          30,
          themeColors.cyan,
          'center',
        );
      }
      if (operationProgress('advantages', 1) > 0)
        drawText(
          ctx,
          api,
          (stats.advantages[i] > 0 ? '+' : '') + stats.advantages[i].toFixed(0),
          x + 75,
          895,
          40,
          stats.advantages[i] >= 0 ? themeColors.green : themeColors.pink,
          'center',
        );
    });
    if (resultComplete('sum', 0))
      drawText(
        ctx,
        api,
        'sum ' + rewards.reduce((a, z) => a + z, 0) + ' / 8 → mean ' + stats.mean.toFixed(1),
        960,
        350,
        31,
        themeColors.blue,
        'center',
      );
    if (operationProgress('std', 0) > 0) {
      rewards.forEach((r, i) =>
        drawText(
          ctx,
          api,
          ((r - stats.mean) ** 2).toFixed(2),
          295 + i * 195,
          715,
          28,
          themeColors.cyan,
          'center',
        ),
      );
      drawEquation(
        ctx,
        api,
        String.raw`\sigma=\sqrt{\frac{1}{8}\sum_i(r_i-\bar r)^2}=${resultComplete('std', 0) ? stats.std.toFixed(1) : '?'}`,
        960,
        805,
        40,
        themeColors.cyan,
      );
    }
    if (currentBeat === 2 && operationProgress('guard', 2) > 0)
      drawText(
        ctx,
        api,
        'zero spread → reward advantages 0; log uniform group',
        960,
        960,
        29,
        themeColors.yellow,
        'center',
      );
    drawFooter(
      ctx,
      api,
      'Reward advantages are coefficients. Other losses and shared parameters can still move the policy.',
    );
  };
  api.focus.target('population-group-mechanism', paint);
}
export default {
  id: 'population-group',
  draw: drawPopulationGroup,
  cues: [
    'vr-population-group-b0',
    'vr-sum-population-group',
    'vr-deviation-population-group',
    'vr-std-population-group',
    'vr-population-group-b1',
    'vr-advantages-population-group',
    'vr-population-group-b2',
    'vr-all-pass-population-group',
    'vr-all-fail-population-group',
    'vr-guard-population-group',
  ],
};
