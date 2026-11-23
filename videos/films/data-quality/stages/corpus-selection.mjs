import {
  drawConstructionArrow,
  drawConstructionFraction,
  drawConstructionLine,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawCorpusSelection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const v = drawConstructionP(ctx, api, `${'corpus-selection'}-voice-${currentBeat + 1}`);
  api.focus.target('corpus-selection-construction', () => {
    if (currentBeat === 0) {
      drawConstructionText(
        ctx,
        api,
        'Same prose-oriented rule, different document roles',
        160,
        300,
        33,
        themeColors.cyan,
      );
      drawConstructionSheet(
        ctx,
        api,
        'technical log',
        'ERROR [503] retry=3 path=/v2/api',
        160,
        410,
        1590,
        130,
        themeColors.blue,
      );
      drawConstructionSheet(
        ctx,
        api,
        'extracted navigation',
        'home home menu home menu home',
        160,
        665,
        1590,
        130,
        themeColors.muted,
      );
      const scanY = 400 + Math.min(1, v * 1.8) * 415;
      api.circle(ctx, 130, scanY, 10, themeColors.yellow);
      drawConstructionLine(ctx, api, 144, scanY, 155, scanY, themeColors.yellow, 3);
      drawConstructionText(
        ctx,
        api,
        'Symbols or repetition are evidence to inspect in context.',
        960,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 2) {
      drawConstructionText(
        ctx,
        api,
        'Compare the two selection policies under the same training budget',
        160,
        300,
        31,
        themeColors.cyan,
      );
      const q = v,
        arms = [
          {
            x: 180,
            label: 'Baseline corpus',
            logs: 10,
            prose: 10,
            color: themeColors.blue,
          },
          {
            x: 1040,
            label: 'Selected corpus',
            logs: 2,
            prose: 9,
            color: themeColors.cyan,
          },
        ];
      arms.forEach((arm) => {
        drawConstructionText(ctx, api, arm.label, arm.x, 410, 34, arm.color);
        drawConstructionText(
          ctx,
          api,
          arm.logs + ' logs · ' + arm.prose + ' prose pages',
          arm.x,
          490,
          31,
          themeColors.ink,
        );
        const total = arm.logs + arm.prose;
        for (let i = 0; i < total; i++) {
          const x = arm.x + (i % 10) * 62,
            y = 550 + Math.floor(i / 10) * 76;
          if (q > (i + 1) / 28) {
            api.rect(
              ctx,
              x,
              y,
              45,
              55,
              i < arm.logs ? themeColors.cyan : themeColors.blue,
              undefined,
              0,
            );
          }
        }
        if (q > 0.45) {
          drawConstructionArrow(ctx, api, arm.x + 310, 735, arm.x + 310, 800, arm.color);
          drawConstructionText(
            ctx,
            api,
            'same token budget and model',
            arm.x,
            865,
            29,
            themeColors.yellow,
          );
        }
      });
      if (q > 0.82)
        drawConstructionText(
          ctx,
          api,
          'Compare both models on the same held-out incident tasks.',
          960,
          960,
          32,
          themeColors.muted,
          'center',
        );
    } else {
      const p = drawConstructionP(ctx, api, 'corpus-removal');
      drawConstructionText(
        ctx,
        api,
        'Supplied filter decisions · 10 logs and 10 prose pages',
        160,
        300,
        32,
        themeColors.cyan,
      );
      for (let group = 0; group < 2; group++) {
        drawConstructionText(
          ctx,
          api,
          group ? 'prose pages' : 'incident logs',
          160,
          430 + group * 245,
          31,
          group ? themeColors.blue : themeColors.cyan,
        );
        for (let i = 0; i < 10; i++) {
          const removed = currentBeat > 1 || p > (i + 1) / 12,
            drop = removed && i < (group ? 1 : 8),
            x = 470 + i * 128,
            y = 380 + group * 245;
          api.rect(
            ctx,
            x,
            y,
            100,
            145,
            themeColors.panel,
            drop ? themeColors.pink : group ? themeColors.blue : themeColors.cyan,
            2,
          );
          drawConstructionText(
            ctx,
            api,
            (group ? 'P' : 'L') + (i + 1),
            x + 50,
            y + 58,
            25,
            drop ? themeColors.muted : themeColors.ink,
            'center',
            true,
          );
          drawConstructionLine(ctx, api, x + 20, y + 88, x + 80, y + 88, themeColors.muted, 2);
          drawConstructionLine(ctx, api, x + 20, y + 111, x + 70, y + 111, themeColors.muted, 2);
          if (drop) {
            drawConstructionLine(ctx, api, x + 10, y + 90, x + 90, y + 130, themeColors.pink, 3);
          }
        }
      }
      if (p === 1 || currentBeat > 1) {
        drawConstructionFraction(ctx, api, 2, 11, 700, 930, themeColors.cyan);
        drawConstructionText(
          ctx,
          api,
          'logs retained ≈ 18.2%',
          1220,
          925,
          37,
          themeColors.cyan,
          'center',
        );
      }
      if (currentBeat === 2) {
        drawConstructionText(
          ctx,
          api,
          'Control model, tokens, seeds and evaluation before comparing quality.',
          960,
          840,
          29,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructionNote(
        ctx,
        api,
        currentBeat === 1
          ? 'Original mix: 10/20 logs. The retained mix changed.'
          : 'These are selection counts; downstream training effects require their own experiment.',
      );
    }
  });
}
export default {
  id: 'corpus-selection',
  draw: drawCorpusSelection,
  cues: [
    'corpus-selection-b1',
    'corpus-selection-voice-1',
    'corpus-selection-b2',
    'corpus-selection-voice-2',
    'corpus-removal',
    'corpus-selection-b3',
    'corpus-selection-voice-3',
  ],
};
