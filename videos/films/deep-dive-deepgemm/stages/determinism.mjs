import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawFooter, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawDeterminism(ctx, scene, state, api) {
  return api.focus.target('determinism-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('determinism', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'The same three FP32 operands follow two reduction trees'
          : currentBeat === 1
            ? 'Fixed seed and fixed reduction partition are separate choices'
            : 'Record both numerical agreement and the exact mode',
      );
      if (currentBeat === 0) {
        const left = 420,
          right = 1440;
        [
          ['(a + 1) + (−a)', left, themeColors.blue],
          ['(a + (−a)) + 1', right, themeColors.pink],
        ].forEach(([name, x, color]) => drawText(ctx, api, name, x, 365, 37, color, 'center'));
        const a = drawBox(ctx, api, 'a = 16,777,216', 150, 455, 540, 90, themeColors.blue, 32),
          add = drawBox(ctx, api, '+ 1', 330, 645, 180, 90, themeColors.yellow, 38),
          rounded = drawBox(
            ctx,
            api,
            'RNE subtotal = 16,777,216',
            110,
            815,
            650,
            90,
            themeColors.blue,
            29,
          );
        drawLink(ctx, api, a, add, teaching2(0, 2), themeColors.blue);
        if (teaching2(0, 2) > 0.4)
          drawLink(ctx, api, add, rounded, teaching2(0, 2), themeColors.yellow);
        const cancel = drawBox(ctx, api, 'a + (−a) = 0', 1160, 455, 580, 90, themeColors.pink, 34),
          one = drawBox(ctx, api, '+ 1', 1360, 645, 180, 90, themeColors.yellow, 38);
        if (teaching2(0, 3) > 0) drawLink(ctx, api, cancel, one, teaching2(0, 3), themeColors.pink);
        if (done(0, 2))
          drawText(ctx, api, 'First result: 0', 420, 965, 43, themeColors.blue, 'center');
        if (done(0, 3))
          drawText(ctx, api, 'Second result: 1', 1450, 845, 43, themeColors.green, 'center');
      } else if (currentBeat === 1) {
        [
          ['Deterministic mHC', 'Fixed 16 splits', 16, themeColors.blue],
          [
            'Workload-dependent path',
            'Schematic changing split count',
            teaching2(1, 2) > 0.5 ? 8 : 16,
            themeColors.pink,
          ],
        ].forEach(([name, detail, count, color], k) => {
          drawText(ctx, api, name, 520 + k * 850, 355, 33, color, 'center');
          for (let i = 0; i < count; i++)
            api.rect(
              ctx,
              170 + k * 850 + (i % 4) * 155,
              420 + Math.floor(i / 4) * 105,
              135,
              85,
              color,
              undefined,
              3,
            );
          drawText(ctx, api, detail, 520 + k * 850, 900, 28, color, 'center');
        });
        if (teaching2(1, 3) > 0)
          drawText(
            ctx,
            api,
            'A random seed does not select this algorithm mode',
            960,
            970,
            30,
            themeColors.yellow,
            'center',
          );
      } else {
        const token = drawBox(
            ctx,
            api,
            'Same token / values / weights',
            130,
            410,
            650,
            110,
            themeColors.cyan,
            33,
          ),
          alone = drawBox(ctx, api, 'Token alone', 1130, 350, 600, 110, themeColors.blue, 35),
          packed = drawBox(
            ctx,
            api,
            'Packed with unrelated rows',
            1130,
            610,
            600,
            110,
            themeColors.pink,
            31,
          );
        drawLink(ctx, api, token, alone, teaching2(2, 0), themeColors.blue);
        drawLink(ctx, api, token, packed, teaching2(2, 0), themeColors.pink);
        if (teaching2(2, 1) > 0)
          drawBox(
            ctx,
            api,
            'Mega Gate / mHC: separate output contracts',
            330,
            845,
            1260,
            100,
            themeColors.yellow,
            32,
          );
      }
      drawFooter(
        ctx,
        api,
        'RNE arithmetic illustration · no cross-platform bitwise or throughput guarantee',
      );
    }
  });
}
export default {
  id: 'determinism',
  draw: drawDeterminism,
  cues: [
    'determinism-b0',
    'dg-determinism-0-0',
    'dg-determinism-0-1',
    'dg-determinism-0-2',
    'dg-determinism-0-3',
    'dg-determinism-0-4',
    'determinism-b1',
    'dg-determinism-1-0',
    'dg-determinism-1-1',
    'dg-determinism-1-2',
    'dg-determinism-1-3',
    'dg-determinism-1-4',
    'determinism-b2',
    'dg-determinism-2-0',
    'dg-determinism-2-1',
    'dg-determinism-2-2',
    'dg-determinism-2-3',
  ],
};
