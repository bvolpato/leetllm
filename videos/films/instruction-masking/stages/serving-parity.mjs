import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { done } from '../construction.mjs';
import {
  instructionCell,
  instructionF,
  instructionFoot,
  instructionLine,
  instructionRow,
  instructionT,
} from '../defaults.mjs';
export function drawServingParity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['serving-parity'] ?? [], () =>
    instructionF(ctx, api, 'serving-parity-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      const fields = [
        'checkpoint',
        'tokenizer revision',
        'resolved template',
        'add special tokens',
      ];
      fields.forEach((v, i) => {
        const y = 365 + i * 135;
        instructionT(ctx, api, v, 180, y + 38, 33, themeColors.muted);
        instructionCell(
          ctx,
          api,
          i === 3 ? 'false' : 'pinned',
          720,
          y,
          320,
          75,
          themeColors.blue,
          33,
        );
        instructionCell(
          ctx,
          api,
          i === 2 ? 'other family' : i === 3 ? 'true' : 'pinned',
          1240,
          y,
          480,
          75,
          i >= 2 ? themeColors.pink : themeColors.blue,
          33,
        );
      });
      instructionF(ctx, api, 'im-serving-drift', () => {
        if (resultComplete('im-serving-drift'))
          instructionT(
            ctx,
            api,
            'Drifted input contract: HOLD before model-quality comparison',
            180,
            965,
            35,
            themeColors.pink,
          );
      });
    } else if (beat === 1) {
      const items = [
        ['new user turn', 'response cue'],
        ['doubled BOS / EOS', 'real emitted IDs'],
        ['long thread failure', 'retained policy evidence'],
        ['rambling after correct answer', 'engine stop IDs'],
      ];
      items.forEach(([a, b], i) => {
        const y = 370 + i * 140;
        instructionT(ctx, api, a, 180, y, 34, themeColors.blue);
        instructionLine(ctx, api, 800, y - 10, 1000, y - 10, themeColors.yellow, 3);
        instructionT(ctx, api, b, 1090, y, 34, themeColors.yellow);
      });
      instructionF(ctx, api, 'im-stop-diagnosis', () => {
        if (resultComplete('im-stop-diagnosis', 1))
          instructionT(
            ctx,
            api,
            'Learned stop target and serving stop settings must agree',
            180,
            960,
            34,
            themeColors.green,
          );
      });
    } else {
      instructionT(
        ctx,
        api,
        'Hosted interface: bind the visible request contract',
        180,
        340,
        36,
        themeColors.ink,
      );
      instructionRow(ctx, api, ['messages', 'tools', 'controls'], 180, 470, {
        step: 530,
        w: 490,
        size: 40,
        color: themeColors.blue,
      });
      instructionF(ctx, api, 'im-quality-after-parity', () =>
        instructionT(
          ctx,
          api,
          resultComplete('im-quality-after-parity', 2)
            ? 'Matched inputs → same decode → held-out quality comparison'
            : 'Compare request bodies and reported token counts',
          180,
          800,
          36,
          themeColors.yellow,
        ),
      );
    }
    instructionFoot(
      ctx,
      api,
      'Inspect the input and target contract before choosing training as the remedy',
    );
  }
}
export default {
  id: 'serving-parity',
  draw: drawServingParity,
  cues: [
    'serving-parity-b1',
    'im-serving-drift',
    'serving-parity-b2',
    'im-stop-diagnosis',
    'serving-parity-b3',
    'im-quality-after-parity',
  ],
};
