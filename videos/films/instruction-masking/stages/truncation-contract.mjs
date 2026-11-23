import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import {
  instructionCell,
  instructionF,
  instructionFoot,
  instructionLine,
  instructionSumBar,
  instructionT,
} from '../defaults.mjs';
export function drawTruncationContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['truncation-contract'] ?? [], () =>
    instructionF(ctx, api, 'truncation-contract-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      const mode = resultComplete('im-cut-ending') ? 2 : resultComplete('im-cut-all') ? 1 : 0,
        keep = mode === 1 ? 3 : mode === 2 ? 5 : 6;
      instructionT(
        ctx,
        api,
        'All aligned owner fields take the same cut',
        180,
        315,
        35,
        themeColors.ink,
      );
      const tokens = ['policy', 'U', 'A', 'Open', 'ticket', 'EOS'];
      tokens.forEach((v, i) => {
        instructionCell(
          ctx,
          api,
          i < keep ? v : 'cut',
          180 + i * 260,
          440,
          235,
          85,
          i < keep ? (i >= 3 ? themeColors.green : themeColors.blue) : themeColors.muted,
          37,
        );
      });
      instructionT(
        ctx,
        api,
        `remaining targets: ${Math.max(0, keep - 3)}`,
        180,
        705,
        39,
        keep === 3 ? themeColors.pink : themeColors.green,
      );
      instructionT(
        ctx,
        api,
        keep === 5
          ? 'ending absent despite positive count'
          : keep === 3
            ? 'all targets removed'
            : 'ending present',
        180,
        860,
        39,
        keep < 6 ? themeColors.pink : themeColors.green,
      );
    } else if (beat === 1) {
      instructionF(ctx, api, 'im-cut-evidence', () => {
        const p = cueProgress2('im-cut-evidence', 1);
        instructionCell(
          ctx,
          api,
          'policy P14',
          180,
          470 + 350 * p,
          600,
          100,
          p === 1 ? themeColors.muted : themeColors.yellow,
          39,
        );
        instructionCell(
          ctx,
          api,
          'question + answer survives',
          980,
          470,
          740,
          100,
          themeColors.green,
          35,
        );
        instructionT(ctx, api, 'retained context', 980, 415, 31, themeColors.green);
        instructionT(
          ctx,
          api,
          p === 1
            ? 'Evidence removed; fluent target survives'
            : 'Keep its evidence with the target',
          980,
          740,
          31,
          p === 1 ? themeColors.pink : themeColors.muted,
        );
        if (p === 1)
          instructionT(ctx, api, 'Removed context owner', 180, 980, 29, themeColors.pink);
      });
    } else {
      instructionT(
        ctx,
        api,
        'Final serialized input + reserved answer',
        180,
        320,
        37,
        themeColors.ink,
      );
      instructionSumBar(ctx, api, [7900, 500], 180, 480, {
        width: 1500,
        max: 8400,
        colors: [themeColors.blue, themeColors.yellow],
        labels: ['7900 input', '500 reserved'],
      });
      const x = 180 + (1500 * 8192) / 8400;
      instructionLine(ctx, api, x, 530, x, 660, themeColors.pink, 4);
      instructionT(ctx, api, 'limit 8192', x - 230, 710, 35, themeColors.pink);
      instructionF(ctx, api, 'im-budget-overflow', () =>
        instructionT(
          ctx,
          api,
          resultComplete('im-budget-overflow', 2)
            ? '8400 − 8192 = 208 excess'
            : 'compute the excess',
          180,
          880,
          42,
          themeColors.pink,
        ),
      );
    }
    instructionFoot(
      ctx,
      api,
      'Positive target count, intended ending, required evidence and context capacity are separate checks',
    );
  }
}
export default {
  id: 'truncation-contract',
  draw: drawTruncationContract,
  cues: [
    'truncation-contract-b1',
    'im-cut-all',
    'im-cut-ending',
    'truncation-contract-b2',
    'im-cut-evidence',
    'truncation-contract-b3',
    'im-budget-overflow',
  ],
};
