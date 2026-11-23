import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawEquation, drawHeading, drawRectangle, drawText } from '../defaults.mjs';
export function drawCriticReturn(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue critic-return/' + id);
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
      cueProgress('vr-' + name + '-' + 'critic-return', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'A state value is an expectation over continuations');
    if (currentBeat === 0) {
      const x = 350,
        y = 600;
      const miss = operationProgress('observed', 0);
      api.circle(ctx, x, y, 65, themeColors.panel, themeColors.blue, 3);
      drawText(ctx, api, 'prefix', x, y + 10, 29, themeColors.blue, 'center');
      [
        [1, 1050, 420],
        [0, 1050, 760],
      ].forEach(([r, a, z]) => {
        api.arrow(ctx, x + 70, y, a - 100, z, themeColors.muted, 3);
        drawCell(
          ctx,
          api,
          'terminal reward ' + r,
          a - 50,
          z - 40,
          620,
          80,
          r ? themeColors.green : themeColors.pink,
        );
      });
      if (operationProgress('expected', 0) > 0) {
        drawText(ctx, api, 'Each branch has a 50% chance', 250, 350, 29, themeColors.muted);
        if (resultComplete('expected', 0))
          drawEquation(ctx, api, 'V(s)=0.5', 530, 865, 48, themeColors.blue);
      }
      if (miss > 0) {
        api.circle(ctx, x + 70 + 530 * miss, y + 160 * miss, 13, themeColors.yellow);
        const difference = resultComplete('gap', 0) ? '0 - 0.5 = -0.5' : '0 - 0.5';
        if (resultComplete('observed', 0))
          drawEquation(ctx, api, difference, 1280, 890, 47, themeColors.cyan);
      }
    }
    if (currentBeat === 1) {
      drawText(
        ctx,
        api,
        'Memory used to train the critic',
        960,
        365,
        29,
        themeColors.yellow,
        'center',
      );
      ['parameters', 'gradients', 'optimizer state', 'activations'].forEach((v, i) => {
        const q = vrBound(operationProgress('cost', 1) * 4 - i);
        if (q > 0) {
          const x = 250 + i * 380;
          drawRectangle(ctx, api, x, 460, 330, 260, themeColors.blue);
          drawText(ctx, api, v, x + 165, 605, 28, themeColors.blue, 'center');
        }
      });
      drawText(
        ctx,
        api,
        'Peak also depends on sharding, offload, reference and rollout buffers',
        960,
        865,
        29,
        themeColors.ink,
        'center',
      );
    }
    if (currentBeat === 2) {
      const local = operationProgress('local', 2) > 0;
      drawText(ctx, api, 'Two responses per prompt', 960, 365, 29, themeColors.muted, 'center');
      [
        [1, 1],
        [0, 1],
      ].forEach((rewards, row) => {
        const y = 500 + row * 230;
        drawText(ctx, api, row ? 'hard prompt' : 'easy prompt', 230, y, 31, themeColors.blue);
        rewards.forEach((r, i) =>
          drawCell(
            ctx,
            api,
            String(r),
            640 + i * 280,
            y - 50,
            220,
            85,
            r ? themeColors.green : themeColors.pink,
            39,
          ),
        );
        api.arrow(ctx, 1170, y - 10, 1300, y - 10, themeColors.muted, 3);
        drawText(
          ctx,
          api,
          local
            ? 'local mean ' + (rewards.reduce((a, v) => a + v, 0) / 2).toFixed(2)
            : 'pooled mean 0.75',
          1530,
          y,
          35,
          local ? themeColors.cyan : themeColors.pink,
          'center',
        );
      });
      drawText(
        ctx,
        api,
        local ? 'Keep each prompt’s baseline local' : 'Pooling changes both prompt baselines',
        960,
        930,
        31,
        local ? themeColors.green : themeColors.yellow,
        'center',
      );
    }
  };
  api.focus.target('critic-return-mechanism', paint);
}
export default {
  id: 'critic-return',
  draw: drawCriticReturn,
  cues: [
    'vr-critic-return-b0',
    'vr-expected-critic-return',
    'vr-observed-critic-return',
    'vr-gap-critic-return',
    'vr-critic-return-b1',
    'vr-cost-critic-return',
    'vr-critic-return-b2',
    'vr-local-critic-return',
  ],
};
