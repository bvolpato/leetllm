import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText } from '../defaults.mjs';
export function drawStreamReplay(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('stream-replay', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'stream-replay'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    if (beat === 0) {
      const stream = [
          'create',
          'create',
          'revoke',
          'create',
          'create',
          'create',
          'create',
          'create',
        ],
        n = Math.floor(8 * progress);
      drawPolicyText(
        ctx,
        api,
        'Fixed row · same local Random(7) stream',
        960,
        300,
        35,
        themeColors.ink,
        'center',
      );
      [0, 1].forEach((r) => {
        target(() => {
          drawPolicyText(ctx, api, `Replay ${r + 1}`, 140, 455 + r * 240, 30, colors[r]);
          stream
            .slice(0, n)
            .forEach((t, i) =>
              drawPolicyCard(
                ctx,
                api,
                'stream-replay',
                t,
                360 + i * 180,
                410 + r * 240,
                160,
                74,
                t === 'create' ? themeColors.blue : themeColors.pink,
                23,
              ),
            );
        });
      });
      drawCaption(
        ctx,
        api,
        'These are repeated draws from one static distribution, not complete autoregressive answers.',
      );
    } else {
      const delta = (progress - 0.5) * 2e-7,
        winner = delta >= 0 ? 'A' : 'B';
      drawPolicyText(
        ctx,
        api,
        'One near tie · no random draw',
        960,
        310,
        35,
        themeColors.ink,
        'center',
      );
      target(() => {
        drawPolicyText(
          ctx,
          api,
          `A: ${(1 + delta).toFixed(8)}`,
          470,
          510,
          42,
          themeColors.blue,
          'center',
        );
        drawPolicyText(
          ctx,
          api,
          `B: ${(1 - delta).toFixed(8)}`,
          1380,
          510,
          42,
          themeColors.pink,
          'center',
        );
        drawPolicyText(
          ctx,
          api,
          `Greedy winner ${winner}`,
          960,
          700,
          44,
          themeColors.yellow,
          'center',
        );
      });
      drawCaption(
        ctx,
        api,
        'Record model, environment, versions, call order and stop rules alongside a supported seed.',
      );
    }
  }
  return;
}
export default {
  id: 'stream-replay',
  draw: drawStreamReplay,
  cues: ['stream-replay-build-0', 'stream-replay-build-1'],
};
