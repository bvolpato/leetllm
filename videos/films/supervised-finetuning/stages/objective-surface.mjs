import { motion } from '../construction.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('objective-surface-mechanism', () => {
    if (state.beat === 0) {
      const rows = [
        ['Unfamiliar vocabulary', 'Domain text', 'Continued pretraining'],
        ['Wrong procedure', 'Approved replies', 'Supervised fine-tuning'],
        ['Several acceptable replies', 'Ranked pairs', 'Preference training'],
      ];
      ['Observation', 'Training evidence', 'Objective'].forEach((v, i) =>
        text(ctx, api, v, 370 + i * 590, 345, 32, C.muted, 'center'),
      );
      rows.forEach((row, i) =>
        row.forEach((v, j) =>
          text(ctx, api, v, 370 + j * 590, 495 + i * 151, 38, i === 1 ? C.green : C.ink, 'center'),
        ),
      );
      return;
    }
    const frozen = motion(state, 'base-frozen', 1, 0.2, 0.44) > 0;
    const quantized = motion(state, 'objective-surface-b2', 1, 0.78, 0.96) > 0;
    text(
      ctx,
      api,
      'Same response targets   open  ·  ticket  ·  END',
      960,
      306,
      39,
      C.green,
      'center',
    );
    const baseColor = frozen ? C.muted : C.blue;
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 6; k++) api.rect(ctx, 250 + k * 88, 405 + r * 78, 76, 65, baseColor);
    text(
      ctx,
      api,
      frozen ? (quantized ? 'Frozen base stored in 4 bits' : 'Frozen base') : 'Full update',
      514,
      815,
      35,
      baseColor,
      'center',
    );
    if (frozen) {
      for (let r = 0; r < 4; r++) api.rect(ctx, 1040, 405 + r * 78, 75, 65, C.green);
      for (let k = 0; k < 6; k++) api.rect(ctx, 1225 + 79 * k, 525, 68, 65, C.green);
      text(ctx, api, '×', 1168, 577, 42, C.ink, 'center');
      text(ctx, api, 'Trainable adapter factors  B × A', 1365, 815, 34, C.green, 'center');
    }
    if (state.beat === 2)
      text(
        ctx,
        api,
        'GPT-3 175B study   /   up to 10,000× fewer trainable parameters, 3× lower GPU memory',
        960,
        976,
        30,
        C.ink,
        'center',
      );
  });
}

export default {
  id: 'objective-surface',
  draw: draw,
  cues: ['objective-surface-b1', 'base-frozen', 'objective-surface-b2', 'objective-surface-b3'],
};
