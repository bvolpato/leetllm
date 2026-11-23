import { visionPadding } from '../arithmetic.mjs';
import { visionBound, visionCueStarted } from '../construction.mjs';
import { card, detailText, footer, title, vectorLabel } from '../defaults.mjs';
export function drawPaddingReadout(ctx, scene, state, api) {
  api.focus.target('padding-readout-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    const beg = (name, fallback = progress > 0.4) => visionCueStarted(state.cues, name, fallback);
    {
      const padding =
          currentBeat === 0
            ? 1
            : currentBeat > 1
              ? 4
              : beg('padding-append', progress > 0.25)
                ? 4
                : 0,
        masked = currentBeat > 1 || (currentBeat === 1 && beg('padding-repair', progress > 0.7)),
        r = visionPadding(padding, masked);
      title(ctx, api, 'A zero value can still consume positive softmax mass');
      r.values.forEach((v, i) => {
        const x = 200 + i * 260;
        card(
          ctx,
          api,
          vectorLabel(ctx, api, v),
          x,
          405,
          225,
          85,
          i < 2 ? themeColors.cyan : masked ? themeColors.muted : themeColors.red,
          31,
        );
        api.rect(
          ctx,
          x,
          605,
          225 * r.weights[i],
          65,
          i < 2 ? themeColors.cyan : themeColors.red,
          undefined,
          0,
        );
        detailText(
          ctx,
          api,
          r.weights[i].toFixed(3),
          x + 112,
          735,
          29,
          i < 2 ? themeColors.cyan : themeColors.red,
          'center',
        );
        if (i >= 2 && masked)
          detailText(ctx, api, 'masked key', x + 112, 840, 27, themeColors.muted, 'center');
      });
      card(
        ctx,
        api,
        'readout ' + vectorLabel(ctx, api, r.output),
        470,
        910,
        980,
        80,
        masked ? themeColors.green : themeColors.red,
        34,
      );
      footer(
        ctx,
        api,
        'Mask before softmax; discard padded query outputs at the required downstream boundary',
      );
    }
    return true;
  });
}
export default {
  id: 'padding-readout',
  draw: drawPaddingReadout,
  cues: [
    'padding-readout-beat-0',
    'padding-readout-beat-1',
    'padding-append',
    'padding-repair',
    'padding-readout-beat-2',
  ],
};
