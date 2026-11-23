import { extendedFrame } from '../model.mjs';
import {
  drawDuration,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
  drawResult,
  formatExtendedNumber,
} from '../defaults.mjs';
export function drawLatencyDot(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('latency-dot', state);
  drawExtendedTarget(ctx, api, 'latency-dot' + '-mechanism', () => {
    drawExtendedText(
      ctx,
      api,
      'rule L1 · weights keep [prompt, queue] order',
      960,
      280,
      33,
      themeColors.yellow,
      'center',
    );
    drawExtendedTarget(ctx, api, 'latency-input', () => {
      const moving = beat === 2 && f.position > 0 && f.position < 1;
      drawMatrixBlock(ctx, api, [moving ? ['', ''] : f.input], 300, 360, {
        cell: 130,
        label: moving
          ? f.restore > 0
            ? 'restoring [prompt, queue]'
            : 'permuting the incoming positions'
          : f.swapped
            ? 'incoming [queue, prompt]'
            : 'B · [prompt, queue]',
        color: f.swapped ? themeColors.pink : themeColors.blue,
      });
      if (moving)
        for (const [i, value] of [2, 1].entries()) {
          const x = 361 + (i ? 130 : 0) + (i ? -130 : 130) * f.position,
            y = 421 + Math.sin(Math.PI * f.position) * (i ? 54 : -54);
          api.components.card({
            label: String(value),
            x: x - 40,
            y: y - 40,
            width: 80,
            height: 80,
            fill: themeColors.panel,
            stroke: i ? themeColors.pink : themeColors.blue,
            textColor: i ? themeColors.pink : themeColors.blue,
            fontSize: 40,
            padding: 8,
          });
        }
    });
    drawExtendedText(ctx, api, '·', 705, 455, 64, themeColors.muted);
    drawExtendedTarget(ctx, api, 'latency-weights', () =>
      drawMatrixBlock(ctx, api, [[2, 1]], 860, 360, {
        cell: 130,
        label: 'seconds coefficients',
        color: themeColors.yellow,
      }),
    );
    drawExtendedText(ctx, api, '=', 1260, 455, 58, themeColors.muted);
    drawExtendedTarget(ctx, api, 'latency-result', () =>
      drawResult(
        ctx,
        api,
        formatExtendedNumber(f.accumulated) + ' s',
        1535,
        455,
        f.reveal,
        f.swapped ? themeColors.pink : themeColors.green,
        65,
      ),
    );
    const parts = f.parts.map((v, i) => v * f.progress[i]);
    const contributionLabels = f.swapped
      ? ['queue × prompt weight', 'prompt × queue weight']
      : ['prompt contribution', 'queue contribution'];
    drawExtendedTarget(ctx, api, 'latency-contributions', () =>
      drawDuration(
        ctx,
        api,
        360,
        650,
        parts,
        contributionLabels,
        [themeColors.blue, themeColors.pink],
        1200,
      ),
    );
    if (beat === 2) {
      drawExtendedText(
        ctx,
        api,
        'aligned reference: [2, 1] · [2, 1] = 5 s',
        960,
        960,
        34,
        themeColors.muted,
        'center',
      );
      if (f.restoring)
        drawExtendedText(
          ctx,
          api,
          f.returned < 1
            ? 'return the named features, then recompute'
            : 'recomputing the two contributions',
          960,
          575,
          30,
          themeColors.yellow,
          'center',
        );
      else if (!f.swapped && f.restore === 0)
        drawExtendedText(
          ctx,
          api,
          'bars retain the aligned reference until we recompute',
          960,
          575,
          30,
          themeColors.yellow,
          'center',
        );
    }
    drawFooter(ctx, api, 'Element-wise products retain contributions · the dot product sums them');
  });
}
export default {
  id: 'latency-dot',
  draw: drawLatencyDot,
  cues: [
    'latency-prompt',
    'latency-queue',
    'latency-sum',
    'latency-swap',
    'latency-swapped',
    'latency-restore',
  ],
};
