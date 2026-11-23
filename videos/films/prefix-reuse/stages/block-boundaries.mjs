import { sampleModel } from '../model.mjs';
import { drawCard, drawLegacyText } from '../defaults.mjs';
export function drawBlockBoundaries(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const modelState = sampleModel('block-boundaries', state),
    currentBeat = modelState.step;
  {
    const visible =
      currentBeat === 2
        ? api.focus.visible('miss-chain')
        : currentBeat > 0 || api.focus.visible('complete-boundaries');
    api.focus.target('block-boundaries-literal-token-ids-blocks-contain-four-positions', () =>
      drawLegacyText(
        ctx,
        api,
        'Literal token IDs · blocks contain four positions',
        120,
        250,
        30,
        themeColors.muted,
      ),
    );
    const rows = [modelState.stored, modelState.tokens];
    rows.forEach((values, row) => {
      api.focus.target('block-boundaries-readout', () =>
        drawLegacyText(
          ctx,
          api,
          row ? 'Incoming' : 'Stored',
          120,
          415 + row * 220,
          28,
          themeColors.muted,
        ),
      );
      values.forEach((value, i) =>
        api.focus.target('block-boundaries-readout-2', () =>
          drawCard(
            ctx,
            api,
            String(value),
            360 + i * 115,
            350 + row * 220,
            98,
            visible && i < modelState.reused
              ? themeColors.green
              : row && value !== modelState.stored[i]
                ? themeColors.pink
                : themeColors.muted,
            85,
          ),
        ),
      );
      for (let i = 0; i < 3; i++)
        api.focus.target('block-boundaries-readout-3', () =>
          drawLegacyText(
            ctx,
            api,
            `block ${i}`,
            360 + i * 460 + 215,
            480 + row * 220,
            25,
            themeColors.muted,
            'center',
          ),
        );
    });
    components.fade(visible ? 1 : 0, () => {
      api.focus.target('block-boundaries-readout-4', () =>
        drawLegacyText(
          ctx,
          api,
          `${modelState.exact} exact starting tokens`,
          400,
          845,
          34,
          themeColors.cyan,
        ),
      );
      api.focus.target('block-boundaries-readout-5', () =>
        drawLegacyText(
          ctx,
          api,
          `${modelState.reused} reusable at full blocks`,
          1090,
          845,
          34,
          themeColors.green,
        ),
      );
    });
    api.focus.target('block-boundaries-the-suffix-still-runs-fresh-prefill-and-attends', () =>
      drawLegacyText(
        ctx,
        api,
        'The suffix still runs fresh prefill and attends to the retained prefix',
        960,
        960,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'block-boundaries',
  draw: drawBlockBoundaries,
  cues: [
    'four-token-block',
    'complete-boundaries',
    'matched-boundary',
    'fresh-input',
    'early-edit',
    'miss-chain',
  ],
};
