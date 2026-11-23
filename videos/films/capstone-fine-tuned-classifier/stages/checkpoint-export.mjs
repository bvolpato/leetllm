import { clamp01 } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierRect,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawCheckpointExport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('checkpoint-export', () => {
    if (currentBeat === 0) {
      const heights = [210, 120, 165],
        q = cueProgress('checkpoint-minimum');
      drawExpandedClassifierText(
        ctx,
        api,
        'Supplied development-loss illustration',
        960,
        295,
        32,
        themeColors.muted,
        'center',
      );
      heights.forEach((h, i) => {
        const x = 400 + i * 390;
        drawExpandedClassifierRect(
          ctx,
          api,
          x,
          730 - h,
          180,
          h,
          i === 1 && q > 0 ? themeColors.green : themeColors.cyan,
          i === 1 && q > 0 ? themeColors.green : themeColors.cyan,
        );
        drawExpandedClassifierText(
          ctx,
          api,
          'Epoch ' + (i + 1),
          x + 90,
          790,
          30,
          themeColors.ink,
          'center',
        );
      });
      if (q === 1)
        drawExpandedClassifierCard(
          ctx,
          api,
          'Restore minimum development loss',
          580,
          870,
          760,
          themeColors.green,
          84,
          30,
        );
      drawExpandedClassifierNote(
        ctx,
        api,
        '3 epochs · batch 16 · learning rate 2×10⁻⁵ · starting settings',
      );
    } else if (currentBeat === 1) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Locked inputs',
        470,
        310,
        32,
        themeColors.blue,
        'center',
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'Versioned output',
        1420,
        310,
        32,
        themeColors.green,
        'center',
      );
      ['Python + project lock', 'Transformers 5.17', 'Resolved package versions'].forEach((v, i) =>
        drawExpandedClassifierCard(ctx, api, v, 180, 400 + i * 130, 580, themeColors.blue, 85, 28),
      );
      ['New run directory', 'Selected checkpoint path', 'Previous run retained'].forEach((v, i) =>
        drawExpandedClassifierCard(
          ctx,
          api,
          v,
          1130,
          400 + i * 130,
          600,
          themeColors.green,
          85,
          28,
        ),
      );
      if (cueProgress('checkpoint-lock') > 0) {
        drawExpandedClassifierLine(ctx, api, 800, 465, 1040, 465, themeColors.pink, 5);
        drawExpandedClassifierText(
          ctx,
          api,
          'lock drift → error',
          920,
          550,
          28,
          themeColors.pink,
          'center',
        );
      }
      drawExpandedClassifierNote(
        ctx,
        api,
        'A configured path and version do not establish execution',
      );
    } else {
      const fields = [
        'Weights',
        'Tokenizer',
        'Label map',
        'Max length',
        'Input policy',
        'Base revision',
        'Checkpoint',
        'Seed',
        'Data hashes',
        'Versions',
      ];
      drawExpandedClassifierText(
        ctx,
        api,
        'One reloadable export',
        960,
        280,
        34,
        themeColors.green,
        'center',
      );
      const count = Math.ceil(cueProgress('checkpoint-artifact') * fields.length);
      fields.forEach((v, i) => {
        const x = 240 + (i % 5) * 300,
          y = 400 + Math.floor(i / 5) * 170;
        if (i < count)
          drawExpandedClassifierCard(
            ctx,
            api,
            v,
            x,
            y,
            270,
            i < 2 ? themeColors.blue : themeColors.cyan,
            110,
            27,
          );
      });
      drawExpandedClassifierNote(
        ctx,
        api,
        'Retain approved bytes and actual training evidence outside scorer writes',
      );
    }
  });
}
export default {
  id: 'checkpoint-export',
  draw: drawCheckpointExport,
  cues: [
    'checkpoint-minimum',
    'checkpoint-policy',
    'checkpoint-lock',
    'checkpoint-directory',
    'checkpoint-artifact',
    'checkpoint-provenance',
  ],
};
