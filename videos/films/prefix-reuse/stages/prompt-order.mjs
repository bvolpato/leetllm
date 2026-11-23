import { sections } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { drawCard, drawLegacyText } from '../defaults.mjs';
export function drawPromptOrder(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('prompt-order', state),
    currentBeat = modelState.step;
  {
    api.focus.target('prompt-order-readout', () =>
      drawLegacyText(
        ctx,
        api,
        currentBeat === 0
          ? 'Changing detail comes first'
          : 'Move changing detail after stable context',
        120,
        255,
        32,
        themeColors.yellow,
      ),
    );
    const q = currentBeat === 0 ? 0 : currentBeat > 1 ? 1 : state.beatP;
    const slide = api.phase(q, 0.2, 0.5),
      across = api.phase(q, 0.45, 0.78);
    const down = api.phase(q, 0, 0.18) * (1 - api.phase(q, 0.8, 0.96));
    for (let i = 0; i < 2; i++) {
      const y = 330 + i * 315;
      api.focus.target('prompt-order-readout-2', () =>
        drawLegacyText(ctx, api, `Request ${i ? 'B' : 'A'}`, 120, y + 50, 28, themeColors.muted),
      );
      sections.forEach((value, j) =>
        api.focus.target('prompt-order-readout-3', () =>
          drawCard(ctx, api, value, 390 + (j + 1 - slide) * 345, y, 300, themeColors.blue),
        ),
      );
      api.focus.target('prompt-order-readout-4', () =>
        drawCard(
          ctx,
          api,
          `ID ${i ? 'B' : 'A'}`,
          390 + across * 1035,
          y + down * 125,
          300,
          themeColors.pink,
        ),
      );
    }
    api.focus.target('prompt-order-readout-5', () =>
      drawLegacyText(
        ctx,
        api,
        modelState.settled
          ? `Exact matching section units: ${modelState.matched}`
          : 'Reordering the same identified sections',
        960,
        890,
        32,
        modelState.matched ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
    api.focus.target('prompt-order-named-sections-illustrate-order-verify-real-tokeniz', () =>
      drawLegacyText(
        ctx,
        api,
        'Named sections illustrate order · verify real tokenizer IDs in deployment',
        960,
        975,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'prompt-order',
  draw: drawPromptOrder,
  cues: [
    'variable-first',
    'immediate-divergence',
    'stable-first',
    'retained-identities',
    'serialized-order',
    'final-input',
  ],
};
