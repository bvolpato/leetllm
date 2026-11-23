import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import { instructionCell, instructionF, instructionT } from '../defaults.mjs';
export function drawSourceReview(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['source-review'] ?? [], () =>
    instructionF(ctx, api, 'source-review-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat < 3) {
      const lexical = beat > 0 && resultComplete('source-review-lexical-result', 1);
      const review = beat > 1 && resultComplete('im-source-reject', 2);
      instructionT(
        ctx,
        api,
        'P14: key age > 14 → ticket before use',
        180,
        315,
        36,
        themeColors.yellow,
      );
      instructionT(
        ctx,
        api,
        'Row 005: “Even after fourteen days, no rotation ticket is required.”',
        180,
        435,
        32,
        review ? themeColors.pink : themeColors.ink,
      );
      const rowText = 'Even after fourteen days, no rotation ticket is required.',
        checks = [
          [
            'fourteen days',
            'Even after fourteen days, no rotation ticket is required.'.includes('fourteen days'),
          ],
          [
            'rotation ticket',
            'Even after fourteen days, no rotation ticket is required.'.includes('rotation ticket'),
          ],
          [
            'no thirty days',
            !'Even after fourteen days, no rotation ticket is required.'.includes('thirty days'),
          ],
        ],
        q = beat > 1 ? 1 : beat === 1 ? cueProgress2('source-review-lexical-result', 1) : 0;
      instructionT(
        ctx,
        api,
        'Required: fourteen days + rotation ticket; forbidden: thirty days',
        180,
        550,
        29,
        themeColors.muted,
      );
      checks.forEach(([name, pass], i) => {
        const ready = beat > 1 || q >= (i + 1) / 3;
        instructionT(
          ctx,
          api,
          name + (ready ? (pass ? ' ✓' : ' ✕') : ' ?'),
          180 + i * 560,
          645,
          31,
          ready ? themeColors.blue : themeColors.muted,
        );
      });
      instructionT(
        ctx,
        api,
        lexical ? 'lexical screen: PASS' : 'lexical screen: ?',
        180,
        760,
        37,
        lexical ? themeColors.green : themeColors.muted,
      );
      instructionF(ctx, api, 'im-source-reject', () =>
        instructionT(
          ctx,
          api,
          review ? 'source review: REJECT same row 005' : 'source review: ?',
          1020,
          760,
          37,
          review ? themeColors.pink : themeColors.muted,
        ),
      );
      if (beat === 2)
        instructionF(ctx, api, 'im-accepted-rows', () => {
          if (resultComplete('im-accepted-rows', 2))
            instructionT(
              ctx,
              api,
              'accepted: 001, 003, 004   ·   002 fails lexical screen',
              180,
              920,
              34,
              themeColors.green,
            );
        });
    } else {
      const categories = [
        ['stale-key', 2],
        ['temporary admin approval', 1],
        ['source citation', 0],
      ];
      instructionT(ctx, api, 'Accepted owners: 001 · 003 · 004', 180, 320, 36, themeColors.green);
      categories.forEach(([name, n], i) => {
        const y = 430 + i * 160;
        instructionT(ctx, api, name, 180, y + 40, 34, themeColors.ink);
        for (let j = 0; j < n; j++)
          instructionCell(
            ctx,
            api,
            i === 0 ? ['001', '004'][j] : '003',
            900 + j * 280,
            y,
            240,
            75,
            themeColors.green,
            36,
          );
        if (!n) {
          instructionCell(ctx, api, '0', 900, y, 240, 75, themeColors.pink, 38);
          instructionT(
            ctx,
            api,
            'duplicate rows do not fill this outcome',
            1200,
            y + 45,
            30,
            themeColors.pink,
          );
        }
      });
    }
  }
}
export default {
  id: 'source-review',
  draw: drawSourceReview,
  cues: [
    'source-review-b1',
    'source-review-lexical-result',
    'source-review-b2',
    'im-source-reject',
    'im-accepted-rows',
    'source-review-b3',
    'im-behavior-counts',
    'im-coverage-hole',
  ],
};
