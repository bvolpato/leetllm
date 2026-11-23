import { sampleModel } from '../model.mjs';
import { connectShapes, drawCard, drawLegacyText } from '../defaults.mjs';
export function drawSavings(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('savings', state),
    currentBeat = modelState.step;
  const colors = [themeColors.blue, themeColors.cyan, themeColors.yellow];
  {
    api.focus.target('intro-authored-token-ledger-sequential-completed-warmup', () =>
      drawLegacyText(
        ctx,
        api,
        'Authored token ledger · sequential completed warmup',
        120,
        255,
        29,
        themeColors.muted,
      ),
    );
    const guide = api.focus.target('intro-guide', () =>
      drawCard(ctx, api, 'Guide · 6,000 tokens', 130, 370, 440, themeColors.blue, 105),
    );
    modelState.rows.forEach((row, i) => {
      const question = api.focus.target('intro-question', () =>
        drawCard(
          ctx,
          api,
          `${row.id} · question ${row.tail} tokens`,
          820,
          355 + i * 155,
          520,
          colors[i],
        ),
      );
      connectShapes(
        ctx,
        api,
        guide,
        question,
        i === 0 ? themeColors.muted : themeColors.blue,
        i === currentBeat ? modelState.p : 1,
      );
      api.focus.target('intro-readout', () =>
        drawLegacyText(
          ctx,
          api,
          i === 0 ? 'cold input' : '6,000 reused',
          1400,
          405 + i * 155,
          29,
          i === 0 ? themeColors.muted : themeColors.green,
        ),
      );
      api.focus.target('intro-readout-2', () =>
        drawLegacyText(
          ctx,
          api,
          `${row.output} new output tokens`,
          1400,
          455 + i * 155,
          26,
          themeColors.cyan,
        ),
      );
    });
    const y = 900;
    api.focus.target('intro-readout-3', () =>
      drawLegacyText(
        ctx,
        api,
        `Fresh input: ${modelState.fresh.toLocaleString('en-US')}`,
        130,
        y,
        32,
        themeColors.yellow,
      ),
    );
    api.focus.target('intro-readout-4', () =>
      drawLegacyText(
        ctx,
        api,
        `Reused input: ${modelState.reused.toLocaleString('en-US')}`,
        750,
        y,
        32,
        themeColors.green,
      ),
    );
    api.focus.target('intro-readout-5', () =>
      drawLegacyText(ctx, api, `New output: ${modelState.output}`, 1370, y, 30, themeColors.cyan),
    );
    if (currentBeat > 0)
      api.focus.target('savings-readout', () =>
        drawLegacyText(
          ctx,
          api,
          `Cold baseline ${modelState.cold.toLocaleString('en-US')} · ${modelState.hits}/${modelState.rows.length} request hits`,
          120,
          970,
          28,
          themeColors.muted,
        ),
      );
  }
}
export default {
  id: 'savings',
  draw: drawSavings,
  cues: [
    'guide-token-volume',
    'warm-requests',
    'reused-volume',
    'question-preserved',
    'boundary-contract',
    'reuse-volume',
  ],
};
