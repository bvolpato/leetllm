import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import {
  instructionF,
  instructionFoot,
  instructionLine,
  instructionRow,
  instructionT,
} from '../defaults.mjs';
export function drawWhitespaceParity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['whitespace-parity'] ?? [], () =>
    instructionF(ctx, api, 'whitespace-parity-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      const p = cueProgress2('im-inner-space'),
        before = new TextEncoder().encode('Open a rotation ticket.   <|eot|>'),
        after = new TextEncoder().encode('Open a rotation ticket.<|eot|>');
      instructionT(
        ctx,
        api,
        'Trimming outside leaves the three internal spaces',
        180,
        310,
        35,
        themeColors.ink,
      );
      instructionF(ctx, api, 'im-inner-space', () =>
        api.teaching.byteDifference({
          x: 130,
          y: 390,
          width: 1660,
          height: 450,
          before,
          after,
          scanProgress: p,
          revealVerdict: resultComplete('im-inner-space'),
          fontSize: 30,
          maxColumns: 12,
          beforeLabel: 'trimmed',
          afterLabel: 'exact',
          textColor: themeColors.ink,
          mutedColor: themeColors.muted,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          changeColor: themeColors.yellow,
        }),
      );
      instructionT(
        ctx,
        api,
        'The exact counterpart has no internal gap before <|eot|>',
        180,
        950,
        34,
        themeColors.yellow,
      );
    } else if (beat === 1) {
      instructionT(ctx, api, 'Two separate comparisons', 180, 320, 36, themeColors.ink);
      instructionF(ctx, api, 'im-dual-parity', () => {
        instructionT(
          ctx,
          api,
          'Toy tokenizer: collapse spaces, split words, fixed vocabulary',
          180,
          400,
          32,
          themeColors.muted,
        );
        instructionT(ctx, api, 'Open   ticket <end>', 180, 530, 37, themeColors.blue);
        instructionT(ctx, api, 'Open ticket <end>', 1050, 530, 37, themeColors.blue);
        instructionT(ctx, api, 'Different bytes', 180, 655, 36, themeColors.pink);
        const ids = 'Open   ticket <end>'
          .trim()
          .split(/\s+/)
          .map((w) => ['Open', 'ticket', '<end>'].indexOf(w));
        instructionRow(ctx, api, ids, 180, 735, {
          step: 180,
          w: 165,
          size: 38,
          color: themeColors.green,
        });
        instructionRow(ctx, api, ids, 1050, 735, {
          step: 180,
          w: 165,
          size: 38,
          color: themeColors.green,
        });
        instructionT(
          ctx,
          api,
          'Equal IDs after this chosen normalization',
          180,
          885,
          34,
          themeColors.green,
        );
      });
      instructionF(ctx, api, 'im-template-digest', () => {
        if (resultComplete('im-template-digest', 1))
          instructionT(
            ctx,
            api,
            'same filename ≠ same resolved template digest',
            180,
            945,
            34,
            themeColors.pink,
          );
      });
    } else {
      const cases = [
        'single / multi-turn',
        'Unicode / indentation',
        'quoted markers / empty content',
        'supported open prefill',
      ];
      cases.forEach((v, i) => {
        const y = 380 + i * 125;
        instructionT(ctx, api, v, 180, y, 35, themeColors.blue);
        instructionLine(
          ctx,
          api,
          850,
          y - 10,
          1500,
          y - 10,
          i < 3 ? themeColors.green : themeColors.yellow,
          5,
        );
        instructionT(
          ctx,
          api,
          i < 3 ? 'known fixture' : 'unexplained delta',
          1540,
          y,
          29,
          i < 3 ? themeColors.green : themeColors.yellow,
        );
      });
      instructionF(ctx, api, 'im-golden-cases', () =>
        instructionT(
          ctx,
          api,
          resultComplete('im-golden-cases', 2)
            ? 'HOLD unknown parity until explained'
            : 'Pin revision, template digest, flags and truncation',
          180,
          960,
          34,
          themeColors.yellow,
        ),
      );
    }
    instructionFoot(
      ctx,
      api,
      'Illustrative parity views; the pinned-tokenizer chapter contains the actual checkpoint IDs',
    );
  }
}
export default {
  id: 'whitespace-parity',
  draw: drawWhitespaceParity,
  cues: [
    'whitespace-parity-b1',
    'im-inner-space',
    'whitespace-parity-b2',
    'im-dual-parity',
    'im-template-digest',
    'whitespace-parity-b3',
    'im-golden-cases',
  ],
};
