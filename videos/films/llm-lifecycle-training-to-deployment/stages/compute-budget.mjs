import { computeRows } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { sceneCues } from '../picture.mjs';
import { drawFooter, drawLegacyMath, drawLegacyText, drawTable, drawText } from '../defaults.mjs';
function drawEstablishedLifecycle(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('compute-budget', state);
  {
    drawLegacyMath(ctx, api, '\\text{training FLOPs}\\approx6ND', 960, 302, 46);
    drawLegacyText(
      ctx,
      api,
      'Reported dense-model runs · rows revealed with their own calculation',
      960,
      356,
      27,
      themeColors.muted,
      'center',
    );
    const max = Math.max(...computeRows().map((row) => row.flops));
    modelState.rows.forEach((row, index) => {
      const y = 430 + index * 150;
      drawLegacyText(
        ctx,
        api,
        row.name,
        180,
        y + 29,
        28,
        index === modelState.step ? themeColors.yellow : themeColors.ink,
      );
      drawLegacyText(
        ctx,
        api,
        row.parametersB + 'B parameters',
        180,
        y + 73,
        22,
        themeColors.muted,
      );
      drawLegacyText(
        ctx,
        api,
        (row.tokensB >= 1000
          ? (row.tokensB / 1000).toFixed(row.tokensB % 1000 ? 1 : 0) + 'T'
          : row.tokensB + 'B') + ' tokens',
        180,
        y + 107,
        22,
        themeColors.muted,
      );
      const width = (680 * row.flops) / max;
      api.focus.target('compute-allocation-' + index, () =>
        api.rect(ctx, 600, y, width, 62, themeColors.blue, themeColors.panel, 2),
      );
      api.focus.target('dense-run-flops-' + index, () =>
        drawLegacyText(
          ctx,
          api,
          row.flops.toExponential(2) + ' FLOPs',
          1320,
          y + 38,
          24,
          themeColors.cyan,
        ),
      );
    });
  }
}
function drawLifecycleUpgrade(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (!(currentBeat >= 3)) return false;
  const { C: themeColors } = api;
  const cue = sceneCues(scene, state);
  {
    if (currentBeat === 3) {
      const k = 1 + 3 * cue.progress('compute-budget-extension-4'),
        n = Math.sqrt(k);
      drawText(
        ctx,
        api,
        'Allocate a larger training budget',
        960,
        300,
        30,
        themeColors.muted,
        'center',
      );
      api.rect(ctx, 430, 400, 420, 420, themeColors.panel, themeColors.muted, 2);
      api.rect(ctx, 430, 820 - 210 * n, 210 * n, 210 * n, themeColors.blue, themeColors.cyan, 2);
      drawText(ctx, api, `Compute ×${k.toFixed(2)}`, 1180, 460, 35, themeColors.yellow);
      drawText(ctx, api, `Parameters ×${n.toFixed(2)}`, 1180, 570, 35, themeColors.cyan);
      drawText(ctx, api, `Tokens ×${n.toFixed(2)}`, 1180, 680, 35, themeColors.cyan);
      drawText(ctx, api, 'C≈6ND · N,D∝√C', 960, 935, 40, themeColors.yellow, 'center');
    } else {
      const requests =
          1 +
          Number(cue.after('compute-budget-extension-5')) +
          Math.round(18 * cue.progress('compute-twenty')),
        a = 1 + 0.2 * requests,
        z = 0.5 + 0.5 * requests;
      drawTable(
        ctx,
        api,
        [
          ['Model', 'Training cost', 'Per request', 'Total cost'],
          ['Smaller model', '1', '.2', a.toFixed(1)],
          ['Alternative', '.5', '.5', z.toFixed(1)],
        ],
        140,
        380,
        1640,
        130,
      );
      drawText(
        ctx,
        api,
        `${requests} ${requests === 1 ? 'request' : 'requests'}  ·  Both models meet the quality target`,
        960,
        850,
        35,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 4) {
      drawFooter(ctx, api, 'Total cost = training cost + requests × cost per request');
    }
  }
  return true;
}
export function drawComputeBudget(ctx, scene, state, api) {
  let handled = false;
  api.focus.target('compute-budget-mechanism', () => {
    handled = drawLifecycleUpgrade(ctx, scene, state, api);
  });
  if (handled) return;
  api.focus.target('compute-budget-mechanism', () =>
    drawEstablishedLifecycle(ctx, scene, state, api),
  );
}
export default {
  id: 'compute-budget',
  draw: drawComputeBudget,
  cues: [
    'dense-run-flops-0-b1-1',
    'dense-run-flops-1-b2-1',
    'compute-allocation-2-b3-1',
    'compute-budget-extension-4',
    'compute-budget-extension-5',
    'compute-twenty',
  ],
};
