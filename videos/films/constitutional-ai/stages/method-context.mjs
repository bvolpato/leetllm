import { logicalState, voice } from '../construction.mjs';
import { drawAuditCard, drawAuditText, drawBlock, drawFooter, withFocus } from '../defaults.mjs';
export function drawMethodContext(ctx, scene, state, api) {
  state = logicalState('method-context', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (id, beat = currentBeat) => voice(state, id, beat);
  {
    if (currentBeat === 0) {
      drawAuditText(
        ctx,
        api,
        'PaLM 2 summarization · human comparisons in Lee et al.',
        960,
        290,
        31,
        themeColors.muted,
        'center',
      );
      [
        ['RLAIF vs SFT', 71, 59, 'method-ai', 'result-ai'],
        ['RLHF vs SFT', 73, 61, 'method-human', 'result-human'],
        ['RLAIF vs RLHF', 50, 47, 'method-pair', 'result-pair'],
      ].forEach(([label, raw, adjusted, cue, target], i) => {
        const y = 410 + i * 170;
        const progress = cueProgress(cue);
        withFocus(ctx, api, target, () => {
          drawAuditText(ctx, api, label, 170, y + 43, 36, themeColors.ink);
          if (!progress) return;
          drawBlock(ctx, api, 650, y, raw * 12, 41, themeColors.blue);
          drawAuditText(ctx, api, raw + '%', 650 + raw * 12 + 25, y + 35, 32, themeColors.blue);
          const reveal = Math.max(0, (progress - 0.5) * 2);
          if (!reveal) return;
          const length = adjusted * 12 * reveal;
          drawBlock(ctx, api, 650, y + 65, length, 41, themeColors.yellow);
          if (reveal === 1)
            drawAuditText(
              ctx,
              api,
              adjusted + '%',
              650 + length + 25,
              y + 99,
              32,
              themeColors.yellow,
            );
        });
      });
      drawFooter(
        ctx,
        api,
        'Blue: original result · yellow: post-hoc length adjustment · security and current costs need separate tests',
      );
    } else {
      drawAuditText(
        ctx,
        api,
        'Dated 2026 report · distinct kinds of training artifacts',
        960,
        300,
        34,
        themeColors.muted,
        'center',
      );
      const artifacts = [
        [
          'Constitutional document',
          'Values + reasons in generated prose',
          'pretraining-style text',
        ],
        ['Advice example', 'User dilemma → assistant advice', 'supervised conversation'],
        ['Tool-equipped environment', 'Policy → tool proposal → reward', 'reinforcement learning'],
      ];
      withFocus(ctx, api, 'method-artifacts', () =>
        artifacts.forEach(([name, text, type], i) => {
          const x = 150 + i * 565,
            color = [themeColors.blue, themeColors.cyan, themeColors.green][i],
            progress = cueProgress(['artifact-document', 'artifact-advice', 'artifact-rl'][i]);
          drawAuditCard(ctx, api, name, x, 420, 510, color, 100, 29);
          if (!progress) return;
          const yy = 700 - 90 * progress;
          drawAuditCard(ctx, api, text, x, yy, 510, color, 155, 27);
          if (progress === 1) {
            api.arrow(ctx, x + 255, 785, x + 255, 820, color, 3);
            drawAuditText(ctx, api, type, x + 255, 880, 28, themeColors.muted, 'center');
          }
        }),
      );
      drawFooter(
        ctx,
        api,
        'Reported interventions extend the original recipe · the incident cases still require their own evaluation',
      );
    }
  }
}
export default {
  id: 'method-context',
  draw: drawMethodContext,
  cues: [
    'method-ai',
    'method-human',
    'method-pair',
    'method-context-2',
    'artifact-document',
    'artifact-advice',
    'artifact-rl',
  ],
};
