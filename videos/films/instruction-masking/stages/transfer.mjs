import { COLLATED, CONSTRUCTION_TARGETS, TOKEN_IDS } from '../fixtures.mjs';
import {
  instructionCell,
  instructionF,
  instructionFoot,
  instructionLine,
  instructionM,
  instructionRow,
  instructionT,
} from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['transfer'] ?? [], () =>
    instructionF(ctx, api, 'transfer-construction', () => {
      if (beat === 0) {
        instructionT(
          ctx,
          api,
          'One target followed through the actual contract',
          960,
          315,
          35,
          themeColors.ink,
          'center',
        );
        instructionF(ctx, api, 'transfer-object-process-states-and-transitions-34', () => {
          instructionRow(ctx, api, ['<A>', 'She', 'is', 'playing.', '<EOS>'], 310, 415, {
            step: 250,
            w: 225,
            size: 35,
            color: themeColors.green,
          });
          for (let i = 0; i < 4; i++)
            instructionLine(
              ctx,
              api,
              425 + i * 250,
              495,
              425 + i * 250,
              620,
              themeColors.yellow,
              3,
            );
          instructionRow(ctx, api, ['She', 'is', 'playing.', '<EOS>', '−100'], 310, 640, {
            step: 250,
            w: 225,
            size: 35,
            color: themeColors.yellow,
          });
        });
        instructionF(
          ctx,
          api,
          'transfer-equation-string-raw-text-template-to-text-ids-to-text-targe-35',
          () =>
            instructionM(
              ctx,
              api,
              String.raw`z_{12}\to x_{13}\quad\text{active assistant target}`,
              960,
              895,
              44,
              themeColors.green,
            ),
        );
      } else {
        const selected = 12,
          columns = [
            ['Predictor position', 12],
            ['Predictor ID', TOKEN_IDS[selected]],
            ['Next token ID', TOKEN_IDS[selected + 1]],
            ['Target role', 'assistant'],
            ['Label', COLLATED[selected].label],
            ['Validity', 1],
            ['Segment', 0],
          ];
        instructionF(ctx, api, 'transfer-collated-tensors', () =>
          columns.forEach(([label, value], i) => {
            const x = 190 + (i % 4) * 430,
              y = 350 + Math.floor(i / 4) * 250;
            instructionT(ctx, api, label, x, y, 28, themeColors.muted);
            instructionCell(
              ctx,
              api,
              value,
              x,
              y + 40,
              330,
              86,
              i === 4 ? themeColors.green : themeColors.blue,
              38,
            );
          }),
        );
        instructionF(ctx, api, 'transfer-serving-prefix', () => {
          instructionT(ctx, api, 'Serving: ... Why? <A>', 240, 945, 35, themeColors.yellow);
          instructionT(
            ctx,
            api,
            'Training continues: She → is → playing. → EOS',
            890,
            945,
            32,
            themeColors.green,
          );
        });
      }
      instructionFoot(
        ctx,
        api,
        'The full collated table remains a reference artifact · inspect one consequential owner first',
      );
    }),
  );
  function drawExtended() {
    throw Error('Unknown instruction-masking scene transfer');
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-beat-1-focus-1',
    'transfer-beat-1-focus-2',
    'transfer-beat-2-focus-1',
    'transfer-beat-2-focus-2',
    'im-collated-example',
    'im-serving-compare',
  ],
};
