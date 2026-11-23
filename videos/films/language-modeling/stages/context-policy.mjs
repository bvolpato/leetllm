import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  drawExtendedTokenRow,
} from '../defaults.mjs';
export function drawContextPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('context-policy', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('context-policy-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Reserve output before admitting the prompt'
        : 'Deleting resident state does not recompute old hidden states',
    );
    if (currentBeat === 0) {
      const repair = E(0, 3),
        prompt = repair ? 24 : 25,
        total = prompt + 8;
      drawExtendedText(ctx, api, 'capacity 32 positions', 960, 350, 32, themeColors.ink, 'center');
      for (let i = 0; i < total; i++) {
        const x = 135 + i * 50;
        api.rect(
          ctx,
          x,
          480,
          42,
          110,
          i < prompt ? themeColors.blue : themeColors.yellow,
          i >= 32 ? themeColors.pink : themeColors.muted,
          i >= 32 ? 4 : 1,
        );
        if (i % 4 === 0)
          drawExtendedText(ctx, api, i, x + 21, 635, 23, themeColors.muted, 'center');
      }
      api.line(ctx, 135 + 32 * 50 - 4, 430, 135 + 32 * 50 - 4, 680, themeColors.pink, 4);
      if (E(0, 2))
        drawExtendedText(
          ctx,
          api,
          `${prompt} prompt + 8 reserved = ${total}`,
          960,
          780,
          38,
          total > 32 ? themeColors.pink : themeColors.green,
          'center',
        );
      if (repair)
        drawExtendedText(
          ctx,
          api,
          'one prompt token removed · declared input changed',
          960,
          920,
          31,
          themeColors.green,
          'center',
        );
    } else {
      const removed = S(1, 1) > 0,
        recomputed = S(1, 2) > 0;
      drawExtendedText(ctx, api, 'resident K/V entries', 960, 335, 28, themeColors.muted, 'center');
      drawExtendedTokenRow(
        ctx,
        api,
        [removed ? 'KV released' : 'The', 'cat', 'slept'],
        230,
        390,
        300,
        140,
        themeColors.blue,
      );
      drawExtendedCell(
        ctx,
        api,
        recomputed ? 'recomputed h′(cat)' : 'retained h(cat)',
        830,
        690,
        600,
        95,
        recomputed ? themeColors.green : themeColors.yellow,
        32,
      );
      if (!recomputed) {
        api.path(
          ctx,
          [
            {
              x: 380,
              y: 485,
            },
            {
              x: 380,
              y: 620,
            },
            {
              x: 780,
              y: 620,
            },
          ],
          {
            color: themeColors.yellow,
            width: 4,
          },
        );
        api.arrow(ctx, 780, 620, 890, 665, themeColors.yellow, 4);
        drawExtendedText(
          ctx,
          api,
          'earlier influence already encoded',
          1190,
          585,
          26,
          themeColors.yellow,
          'center',
        );
      } else {
        api.arrow(ctx, 820, 485, 1040, 665, themeColors.green, 4);
        drawExtendedText(
          ctx,
          api,
          'shortened input: cat, slept',
          960,
          920,
          31,
          themeColors.green,
          'center',
        );
      }
    }
    drawExtendedFoot(
      ctx,
      api,
      'Apply the model’s documented position and retention policy to each actual new-position call',
    );
  });
}
export default {
  id: 'context-policy',
  draw: drawContextPolicy,
  cues: [
    'context-policy-b1',
    'context-policy-voice-1',
    'context-policy-step-0-1',
    'context-policy-step-0-2',
    'context-policy-step-0-3',
    'context-policy-step-0-4',
    'context-policy-b2',
    'context-policy-voice-2',
    'context-policy-step-1-1',
    'context-policy-step-1-2',
    'context-policy-step-1-3',
    'context-policy-step-1-4',
  ],
};
