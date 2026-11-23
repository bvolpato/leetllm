import { drawCard, drawFooter, drawText } from '../defaults.mjs';
export function drawPromptComparison(ctx, scene, state, api) {
  api.focus.target('prompt-comparison-mechanism', () => {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0, 0, 1),
      q = api.phase(progress, 0.05, 0.9);
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Same request, facts, policy and output fields',
          960,
          260,
          33,
          themeColors.ink,
          'center',
        );
        drawCard(ctx, api, 'Same trusted release facts', 220, 355, 1480, 90, themeColors.blue, 32);
        drawCard(
          ctx,
          api,
          'Schema example\nchecks, final action',
          150,
          540,
          740,
          180,
          themeColors.muted,
          31,
        );
        drawCard(
          ctx,
          api,
          'Worked example\nScan failed → manual review',
          1030,
          540,
          740,
          180,
          themeColors.cyan,
          31,
        );
        drawText(
          ctx,
          api,
          'Compare parsing, check values and actions on held-out requests.',
          960,
          900,
          31,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'Historical PaLM 540B · GSM8K · eight CoT exemplars',
          960,
          260,
          33,
          themeColors.ink,
          'center',
        );
        const values = [17.9, 56.9];
        values.forEach((v, i) => {
          const h = (420 * v) / 60,
            x = 410 + i * 680;
          components.panel({
            x,
            y: 800 - h,
            width: 330,
            height: h,
            fill: i ? themeColors.cyan : themeColors.blue,
            stroke: i ? themeColors.cyan : themeColors.blue,
          });
          drawText(ctx, api, v.toFixed(1) + '%', x + 165, 860, 39, themeColors.ink, 'center');
          drawText(
            ctx,
            api,
            i ? 'CoT examples' : 'Standard prompting',
            x + 165,
            940,
            31,
            i ? themeColors.cyan : themeColors.blue,
            'center',
          );
        });
      } else {
        drawCard(
          ctx,
          api,
          'GPQA study\nmodest non-reasoner gains\nextra time cost',
          150,
          360,
          740,
          250,
          themeColors.blue,
          31,
        );
        drawCard(
          ctx,
          api,
          'Pattern-based ICL study\n9 datasets / 16 models\ndegradation in that scope',
          1030,
          360,
          740,
          250,
          themeColors.yellow,
          31,
        );
        drawText(
          ctx,
          api,
          'Different tasks and model settings require the same held-out comparison discipline',
          960,
          850,
          30,
          themeColors.ink,
          'center',
        );
      }
      drawFooter(
        ctx,
        api,
        'Evaluate the prompt on the task where you plan to use it.',
      );
    }
  });
}
export default {
  id: 'prompt-comparison',
  draw: drawPromptComparison,
  cues: ['prompt-comparison-b1', 'prompt-comparison-b2', 'prompt-comparison-b3'],
};
