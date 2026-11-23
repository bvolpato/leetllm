import { completionCue } from '../construction.mjs';
import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawCacheOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    done = (id) => completionCue(state, id) >= 1;
  const drawMechanism = () => {
    completionHeading(
      ctx,
      api,
      currentBeat
        ? 'Change one early token and follow its dependent KV states'
        : 'Keep model-service time separate from client latency',
    );
    if (currentBeat === 0) {
      [
        ['miss', 72, 24, themeColors.pink],
        ['hit', 11, 24, themeColors.green],
      ].forEach(([label, pre, dec, col], i) => {
        completionText(ctx, api, label, 200, 450 + i * 230, 34, col);
        api.rect(ctx, 400, 385 + i * 230, pre * 11, 130, themeColors.panel, themeColors.cyan, 2, 4);
        completionText(
          ctx,
          api,
          pre + ' prefill',
          400 + pre * 5.5,
          465 + i * 230,
          29,
          themeColors.cyan,
          'center',
        );
        api.rect(
          ctx,
          400 + pre * 11,
          385 + i * 230,
          dec * 11,
          130,
          themeColors.panel,
          themeColors.pink,
          2,
          4,
        );
        completionText(
          ctx,
          api,
          '24 decode',
          400 + pre * 11 + 132,
          465 + i * 230,
          28,
          themeColors.pink,
          'center',
        );
      });
      if (done('cc-cache96-35'))
        completionText(
          ctx,
          api,
          '96 ms versus 35 ms · queue / network / paint excluded',
          960,
          925,
          36,
          themeColors.yellow,
          'center',
        );
    } else {
      [
        ['PSM', ['P0', 'P1*', 'S0', 'S1', 'M'], 1],
        ['suffix-first SPM', ['S0', 'S1', 'P0', 'P1*', 'M'], 3],
      ].forEach(([label, tokens, changed], j) => {
        completionText(
          ctx,
          api,
          label,
          200,
          450 + j * 260,
          30,
          j ? themeColors.cyan : themeColors.blue,
        );
        tokens.forEach((token, i) => {
          completionBox(
            ctx,
            api,
            token,
            600 + i * 210,
            385 + j * 260,
            160,
            90,
            i >= changed ? themeColors.pink : themeColors.green,
          );
          completionText(
            ctx,
            api,
            i >= changed ? 'recompute' : 'retain',
            680 + i * 210,
            560 + j * 260,
            26,
            i >= changed ? themeColors.pink : themeColors.green,
            'center',
          );
        });
      });
      completionFooter(
        ctx,
        api,
        'The same early-prefix edit preserves earlier suffix state only under the supported token order',
      );
    }
  };
  api.focus.target('cc-cache-order-mechanism', drawMechanism);
  return;
}
export default {
  id: 'cache-order',
  draw: drawCacheOrder,
  cues: ['cc-cache-order-0', 'cc-cache96-35', 'cc-cache-order-1', 'cc-cache-early-edit'],
};
