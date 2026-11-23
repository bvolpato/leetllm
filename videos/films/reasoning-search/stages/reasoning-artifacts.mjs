import { drawArrow, drawCard, drawFooter, drawText } from '../defaults.mjs';
import { cueAt } from '../cue-clock.mjs';
export function drawReasoningArtifacts(ctx, scene, state, api) {
  api.focus.target('reasoning-artifacts-mechanism', () => {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0, 0, 1),
      q = api.phase(progress, 0.05, 0.9),
      prog = (id) => api.focus.progress(id, 0);
    {
      if (currentBeat === 0) {
        const rows = [
          ['Prompt-elicited CoT', 'Generated intermediate text'],
          ['Native reasoning tokens', 'Internal inference work'],
          ['Provider summary', 'Disclosure-defined description'],
          ['Decision record', 'Reported facts, checks and proposed action'],
        ];
        rows.forEach(([name, value], i) => {
          drawCard(
            ctx,
            api,
            name,
            150,
            320 + i * 155,
            600,
            105,
            i === 3 ? themeColors.green : themeColors.blue,
            30,
          );
          drawCard(
            ctx,
            api,
            value,
            930,
            320 + i * 155,
            840,
            105,
            i === 3 ? themeColors.green : themeColors.muted,
            30,
          );
          drawArrow(
            ctx,
            api,
            780,
            372 + i * 155,
            900,
            372 + i * 155,
            i === 3 ? themeColors.green : themeColors.muted,
          );
        });
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'One response   ·   Output limit: 800 tokens',
          960,
          260,
          33,
          themeColors.ink,
          'center',
        );
        const ended = cueAt(state, 'artifact-incomplete', 1, 0.31, 0.49);
        const amount = ended.done ? 800 : Math.floor(799 * prog('reasoning-limit'));
        components.panel({
          x: 220,
          y: 440,
          width: 1480,
          height: 100,
          fill: themeColors.panel,
          stroke: themeColors.muted,
        });
        components.panel({
          x: 220,
          y: 440,
          width: Math.max(1, (1480 * amount) / 800),
          height: 100,
          fill: themeColors.blue,
          stroke: themeColors.blue,
        });
        drawText(
          ctx,
          api,
          amount + ' internal reasoning tokens used',
          960,
          620,
          34,
          themeColors.ink,
          'center',
        );
        drawCard(
          ctx,
          api,
          'Required decision record: empty',
          430,
          735,
          1060,
          100,
          themeColors.pink,
          32,
        );
        drawText(
          ctx,
          api,
          amount === 800
            ? 'Output limit reached   ·   Response incomplete'
            : 'Response in progress',
          960,
          930,
          31,
          themeColors.yellow,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Published biasing-feature intervention',
          960,
          270,
          34,
          themeColors.ink,
          'center',
        );
        drawCard(
          ctx,
          api,
          'Input feature changes\nanswer-option order',
          150,
          400,
          680,
          170,
          themeColors.yellow,
          33,
        );
        drawCard(
          ctx,
          api,
          'Explanation omits that feature\nwhile rationalizing the answer',
          1050,
          400,
          720,
          170,
          themeColors.pink,
          31,
        );
        drawArrow(ctx, api, 860, 485, 1020, 485, themeColors.pink);
        drawText(
          ctx,
          api,
          'Compare the answer with the inputs, checked fields and observed outcome.',
          960,
          850,
          31,
          themeColors.ink,
          'center',
        );
      }
      drawFooter(
        ctx,
        api,
        'A provider summary describes internal work. A decision record exposes checks an application can score.',
      );
    }
  });
}
export default {
  id: 'reasoning-artifacts',
  draw: drawReasoningArtifacts,
  cues: [
    'reasoning-artifacts-b1',
    'reasoning-artifacts-b2',
    'reasoning-limit',
    'artifact-incomplete',
    'reasoning-artifacts-b3',
  ],
};
