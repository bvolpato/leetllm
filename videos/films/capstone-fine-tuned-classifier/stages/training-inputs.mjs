import { clamp01 } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierRect,
  drawExpandedClassifierText,
  drawExpandedClassifierTransfer,
} from '../defaults.mjs';
export function drawTrainingInputs(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('training-admission', () => {
    if (currentBeat === 0) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Validate raw JSONL before library coercion',
        960,
        290,
        33,
        themeColors.yellow,
        'center',
      );
      [
        ['text', 'nonblank string'],
        ['Fixture ID', 'unique trimmed identity'],
        ['label', 'integer 0 or 1'],
      ].forEach((r, i) => {
        drawExpandedClassifierCard(
          ctx,
          api,
          r[0],
          250,
          380 + i * 145,
          460,
          themeColors.cyan,
          86,
          30,
        );
        drawExpandedClassifierCard(
          ctx,
          api,
          r[1],
          1110,
          380 + i * 145,
          590,
          themeColors.green,
          86,
          29,
        );
        drawExpandedClassifierTransfer(
          ctx,
          api,
          [710, 423 + i * 145],
          [1110, 423 + i * 145],
          raw,
          themeColors.yellow,
        );
      });
      if (cueProgress('input-bool') > 0)
        drawExpandedClassifierCard(
          ctx,
          api,
          'label: true  →  reject before coercion',
          480,
          860,
          960,
          themeColors.pink,
          85,
          32,
        );
    } else if (currentBeat === 1) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Count every token before admitting the input',
        960,
        300,
        33,
        themeColors.yellow,
        'center',
      );
      drawExpandedClassifierRect(ctx, api, 180, 440, 1560, 155, themeColors.muted);
      const boundary = 180 + (1560 * 256) / 257;
      drawExpandedClassifierLine(ctx, api, boundary, 410, boundary, 650, themeColors.yellow, 5);
      for (let i = 0; i < 32; i++)
        drawExpandedClassifierRect(
          ctx,
          api,
          205 + i * 46,
          475,
          34,
          80,
          themeColors.cyan,
          themeColors.cyan,
        );
      drawExpandedClassifierCard(ctx, api, '…', 1650, 475, 60, themeColors.muted, 80, 27);
      drawExpandedClassifierText(
        ctx,
        api,
        '256-position policy boundary',
        1310,
        690,
        30,
        themeColors.yellow,
        'center',
      );
      if (cueProgress('input-full-count') > 0)
        drawExpandedClassifierCard(
          ctx,
          api,
          'Exception evidence in the omitted suffix',
          400,
          785,
          1110,
          themeColors.pink,
          90,
          32,
        );
      drawExpandedClassifierNote(
        ctx,
        api,
        'Policy limit 256 includes special tokens; model capacity is a separate contract',
      );
    } else {
      const roles = [
        ['Training', 'gradient updates', themeColors.blue],
        ['Development', 'checkpoint choice', themeColors.cyan],
        ['Selection', 'threshold choice', themeColors.yellow],
        ['Final gate', 'untouched evaluation', themeColors.pink],
      ];
      roles.forEach(([a, z, col], i) => {
        const x = 180 + i * 440;
        drawExpandedClassifierRect(ctx, api, x, 400, 360, 330, col);
        drawExpandedClassifierText(ctx, api, a, x + 180, 470, 31, col, 'center');
        drawExpandedClassifierText(ctx, api, z, x + 180, 555, 25, themeColors.ink, 'center');
        drawExpandedClassifierText(
          ctx,
          api,
          i < 2 ? 'Recipe inputs' : 'Outside Trainer',
          x + 180,
          650,
          26,
          col,
          'center',
        );
      });
      drawExpandedClassifierNote(
        ctx,
        api,
        'Seeds, tokenizer, mapping and admitted length define the computation',
      );
    }
  });
}
export default {
  id: 'training-inputs',
  draw: drawTrainingInputs,
  cues: ['input-bool', 'input-duplicates', 'input-full-count', 'input-boundary', 'input-roles'],
};
