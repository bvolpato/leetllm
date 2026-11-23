import { CHECKPOINT, CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import {
  instructionCell,
  instructionF,
  instructionFoot,
  instructionRow,
  instructionT,
} from '../defaults.mjs';
export function drawCheckpointIds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['checkpoint-ids'] ?? [], () =>
    instructionF(ctx, api, 'checkpoint-ids-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat < 2) {
      instructionT(
        ctx,
        api,
        'Pinned Mistral tokenizer · no model weights',
        130,
        305,
        34,
        themeColors.ink,
      );
      CHECKPOINT.prefixIds.forEach((id, i) => {
        const x = 130 + (i % 11) * 150,
          y = 365 + Math.floor(i / 11) * 107;
        instructionCell(ctx, api, id, x, y, 140, 55, themeColors.blue, 27);
        instructionT(
          ctx,
          api,
          CHECKPOINT.prefixPieces[i],
          x + 70,
          y + 84,
          24,
          themeColors.muted,
          'center',
        );
      });
      let tail = [],
        pieces = [],
        label = 'Fresh prefix: 44 IDs';
      if (beat === 1) {
        if (resultComplete('im-checkpoint-fresh', 1)) {
          label = 'Fresh: 44 IDs · generation flag adds no header';
        } else if (cueProgress2('im-checkpoint-prefill', 1) > 0) {
          const n = Math.floor(cueProgress2('im-checkpoint-prefill', 1) * 8 + 1e-8);
          tail = CHECKPOINT.prefillIds.slice(0, n);
          pieces = CHECKPOINT.prefillPieces.slice(0, n);
          label = 'Open prefill: 44 + ' + n + ' = ' + (44 + n) + ' IDs';
        } else if (cueProgress2('im-checkpoint-closed', 1) > 0) {
          const n = Math.floor(cueProgress2('im-checkpoint-closed', 1) * 9 + 1e-8);
          tail = CHECKPOINT.answerIds.slice(0, n);
          pieces = CHECKPOINT.answerPieces.slice(0, n);
          label = 'Training: 44 + ' + n + ' = ' + (44 + n) + ' IDs';
        }
      }
      instructionT(ctx, api, label, 130, 850, 32, themeColors.yellow);
      tail.forEach((id, i) => {
        const x = 130 + i * 178;
        instructionCell(
          ctx,
          api,
          id,
          x,
          890,
          165,
          55,
          id === 2 ? themeColors.green : themeColors.yellow,
          28,
        );
        instructionT(
          ctx,
          api,
          pieces[i],
          x + 82,
          980,
          25,
          id === 2 ? themeColors.green : themeColors.ink,
          'center',
        );
      });
    } else {
      instructionT(
        ctx,
        api,
        'Render once → encode without another special-token pass',
        180,
        320,
        34,
        themeColors.ink,
      );
      instructionF(ctx, api, 'im-double-bos', () => {
        instructionRow(
          ctx,
          api,
          [1, ...(resultComplete('im-double-bos', 2) ? [1] : []), 733, 16289, 28793],
          180,
          425,
          {
            step: 210,
            w: 190,
            color: (i) =>
              i < 2 && resultComplete('im-double-bos', 2) ? themeColors.pink : themeColors.blue,
            size: 35,
          },
        );
        instructionT(
          ctx,
          api,
          resultComplete('im-double-bos', 2)
            ? 'Two beginning IDs: duplicated BOS'
            : 'One beginning ID: intended path',
          180,
          575,
          33,
          resultComplete('im-double-bos', 2) ? themeColors.pink : themeColors.green,
        );
      });
      instructionF(ctx, api, 'im-marker-pieces', () => {
        instructionT(ctx, api, 'Opening [INST] · three IDs', 180, 730, 32, themeColors.blue);
        instructionRow(ctx, api, [733, 16289, 28793], 180, 775, {
          step: 190,
          w: 175,
          size: 32,
          color: themeColors.blue,
        });
        instructionT(ctx, api, 'Closing [/INST] · four IDs', 990, 730, 32, themeColors.yellow);
        instructionRow(ctx, api, [733, 28748, 16289, 28793], 990, 775, {
          step: 190,
          w: 175,
          size: 32,
          color: themeColors.yellow,
        });
      });
      instructionFoot(
        ctx,
        api,
        'Rendered spellings do not imply atomic token IDs; inspect the chosen checkpoint',
      );
    }
  }
}
export default {
  id: 'checkpoint-ids',
  draw: drawCheckpointIds,
  cues: [
    'checkpoint-ids-b1',
    'im-checkpoint-prefix',
    'checkpoint-ids-b2',
    'im-checkpoint-closed',
    'im-checkpoint-prefill',
    'im-checkpoint-fresh',
    'checkpoint-ids-b3',
    'im-double-bos',
    'im-marker-pieces',
  ],
};
