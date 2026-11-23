import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, ease } from '../construction.mjs';
import {
  instructionCell,
  instructionF,
  instructionLine,
  instructionSumBar,
  instructionT,
} from '../defaults.mjs';
export function drawBehaviorContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['behavior-contract'] ?? [], () =>
    instructionF(ctx, api, 'behavior-contract-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      instructionT(ctx, api, 'P14 · trusted authored evidence', 160, 320, 34, themeColors.yellow);
      instructionT(ctx, api, 'age > 14 days  ⇒  ticket before use', 160, 390, 36, themeColors.ink);
      instructionCell(ctx, api, '18-day key', 170, 500, 400, 90, themeColors.blue, 40);
      instructionF(ctx, api, 'im-evidence', () => {
        const p = cueProgress2('im-evidence');
        instructionLine(ctx, api, 580, 545, 580 + 500 * p, 545, themeColors.yellow, 5);
        if (p > 0) {
          instructionCell(
            ctx,
            api,
            'Open a rotation ticket',
            1110,
            500,
            620,
            90,
            themeColors.green,
            38,
          );
          instructionT(
            ctx,
            api,
            'supported by this request’s evidence',
            1110,
            690,
            32,
            themeColors.green,
          );
        }
      });
    } else if (beat === 1) {
      const p = ease(cueProgress2('im-descent', 1)),
        logits = [Math.log(0.25) + 0.3 * p, Math.log(0.75) - 0.3 * p],
        mass = logits.map(Math.exp),
        prob = mass[0] / (mass[0] + mass[1]);
      instructionT(ctx, api, 'Two possible next tokens', 180, 320, 34, themeColors.ink);
      instructionT(ctx, api, 'Before the update:  P(Open) = 0.25', 180, 420, 36, themeColors.muted);
      instructionF(ctx, api, 'im-gradient', () => {
        instructionT(
          ctx,
          api,
          'starting p − target = [−0.75, +0.75]',
          180,
          545,
          42,
          themeColors.pink,
        );
        instructionT(
          ctx,
          api,
          'η = 0.4 · independent logits in this local illustration',
          180,
          630,
          30,
          themeColors.muted,
        );
      });
      instructionF(ctx, api, 'im-descent', () => {
        instructionSumBar(ctx, api, [prob, 1 - prob], 220, 720, {
          width: 1480,
          max: 1,
          labels: ['Open', 'other'],
          colors: [themeColors.green, themeColors.blue],
        });
        instructionT(
          ctx,
          api,
          `P(Open) = ${prob.toFixed(3)}`,
          960,
          890,
          42,
          themeColors.green,
          'center',
        );
      });
    } else {
      instructionF(ctx, api, 'im-wrong-supervision', () => {
        instructionT(
          ctx,
          api,
          'Same request · incorrect accepted continuation',
          180,
          340,
          36,
          themeColors.pink,
        );
        instructionCell(ctx, api, 'No ticket required', 180, 450, 650, 95, themeColors.pink, 40);
        instructionT(
          ctx,
          api,
          'label selects the unsupported answer',
          1030,
          495,
          34,
          themeColors.pink,
        );
        instructionLine(ctx, api, 830, 495, 1000, 495, themeColors.pink, 4);
        instructionT(
          ctx,
          api,
          'Correct serialization can still carry wrong supervision',
          180,
          710,
          38,
          themeColors.ink,
        );
        instructionT(ctx, api, 'Learned ending', 200, 890, 34, themeColors.green);
        instructionT(
          ctx,
          api,
          'Decoder stop IDs + output budget',
          960,
          890,
          34,
          themeColors.yellow,
        );
      });
    }
  }
}
export default {
  id: 'behavior-contract',
  draw: drawBehaviorContract,
  cues: [
    'behavior-contract-b1',
    'im-evidence',
    'behavior-contract-b2',
    'im-gradient',
    'im-descent',
    'behavior-contract-b3',
    'im-wrong-supervision',
  ],
};
