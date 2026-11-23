import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawFooter, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawLocalityEpilogue(ctx, scene, state, api) {
  return api.focus.target('locality-epilogue-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('locality-epilogue', state),
      { b: currentBeat, g: teaching2 } = modelState;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'A domain partition follows dimensions, not expert ownership'
          : currentBeat === 1
            ? 'Choose exactly one compatible output operation'
            : 'Reduction order and output rounding change different stages',
      );
      if (currentBeat === 0) {
        ['L1 · gate/up weights', 'L2 · down weights'].forEach((name, k) => {
          drawText(ctx, api, name, 520 + k * 850, 350, 33, themeColors.cyan, 'center');
          const assigned = Math.floor(teaching2(0, 0) * 4);
          for (let r = 0; r < 4; r++)
            for (let col = 0; col < 6; col++)
              api.rect(
                ctx,
                170 + k * 850 + col * 115,
                410 + r * 100,
                100,
                85,
                r < assigned ? (r < 2 ? themeColors.blue : themeColors.pink) : themeColors.panel,
                themeColors.muted,
                2,
              );
          drawText(
            ctx,
            api,
            'Same expert IDs across both domain slices',
            520 + k * 850,
            850,
            27,
            themeColors.muted,
            'center',
          );
        });
        drawText(ctx, api, 'Domain 0', 500, 910, 29, themeColors.blue, 'center');
        drawText(ctx, api, 'Domain 1', 1350, 910, 29, themeColors.pink, 'center');
        if (teaching2(0, 3) > 0)
          drawText(
            ctx,
            api,
            'Unstable SM probe → even fallback mapping',
            960,
            965,
            29,
            themeColors.yellow,
            'center',
          );
      } else if (currentBeat === 1) {
        const choices = ['Identity', 'Alpha', 'FP8 quantize', 'BF16 stochastic'],
          selected = Math.min(3, Math.floor(teaching2(1, 1) * 4));
        choices.forEach((name, i) => {
          const active = i === selected;
          drawBox(
            ctx,
            api,
            name,
            150 + i * 425,
            395,
            365,
            110,
            active ? themeColors.cyan : themeColors.muted,
            30,
          );
          if (active) {
            api.line(ctx, 332 + i * 425, 525, 332 + i * 425, 600, themeColors.cyan, 4);
            drawText(ctx, api, 'selected', 332 + i * 425, 645, 29, themeColors.cyan, 'center');
          }
        });
        const incompatible = teaching2(1, 4) > 0;
        drawBox(
          ctx,
          api,
          incompatible
            ? 'C supplied → reject this stochastic direct-output call'
            : teaching2(1, 3) > 0
              ? 'Direct BF16 output · C absent'
              : 'One selected output conversion',
          250,
          760,
          1420,
          110,
          incompatible ? themeColors.pink : themeColors.green,
          32,
        );
        if (teaching2(1, 2) > 0)
          drawText(
            ctx,
            api,
            'Explicit epilogue / alpha / FP8 output pair are exclusive',
            960,
            945,
            29,
            themeColors.yellow,
            'center',
          );
      } else {
        const reduction = drawBox(
            ctx,
            api,
            'Reduction partition / order',
            150,
            390,
            650,
            110,
            themeColors.blue,
            34,
          ),
          acc = drawBox(ctx, api, 'Accumulated value', 1120, 390, 650, 110, themeColors.cyan, 34);
        drawLink(ctx, api, reduction, acc, teaching2(2, 1), themeColors.blue);
        const round = drawBox(
            ctx,
            api,
            'Output rounding policy',
            150,
            690,
            650,
            110,
            themeColors.pink,
            34,
          ),
          out = drawBox(
            ctx,
            api,
            'Converted output value',
            1120,
            690,
            650,
            110,
            themeColors.green,
            34,
          );
        drawLink(ctx, api, round, out, teaching2(2, 1), themeColors.pink);
        if (teaching2(2, 2) > 0)
          drawText(
            ctx,
            api,
            'Record epilogue + numerical reference for this path',
            960,
            930,
            34,
            themeColors.yellow,
            'center',
          );
      }
      drawFooter(
        ctx,
        api,
        'Both projections and shared weights must agree with the localization contract',
      );
    }
  });
}
export default {
  id: 'locality-epilogue',
  draw: drawLocalityEpilogue,
  cues: [
    'locality-epilogue-b0',
    'dg-locality-epilogue-0-0',
    'dg-locality-epilogue-0-1',
    'dg-locality-epilogue-0-2',
    'dg-locality-epilogue-0-3',
    'dg-locality-epilogue-0-4',
    'locality-epilogue-b1',
    'dg-locality-epilogue-1-0',
    'dg-locality-epilogue-1-1',
    'dg-locality-epilogue-1-2',
    'dg-locality-epilogue-1-3',
    'dg-locality-epilogue-1-4',
    'locality-epilogue-b2',
    'dg-locality-epilogue-2-0',
    'dg-locality-epilogue-2-1',
    'dg-locality-epilogue-2-2',
    'dg-locality-epilogue-2-3',
    'dg-locality-epilogue-2-4',
  ],
};
