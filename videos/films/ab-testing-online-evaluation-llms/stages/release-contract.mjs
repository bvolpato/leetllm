import { clamp } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { axis, box, text as constructionText, line } from '../defaults.mjs';
export function drawReleaseContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'release-contract'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-release-contract-mechanism', () => {
    if (B === 0) {
      const p = cueProgress('reconcile', 0),
        steps = [
          'Unique assignments',
          'Exposures / fallbacks',
          'Mature outcome IDs',
          'Declared readout',
        ];
      steps
        .slice(0, 1 + N(3, p))
        .forEach((v, i) =>
          box(
            ctx,
            api,
            v,
            200 + i * 420,
            380,
            370,
            120,
            i < 3 ? themeColors.cyan : themeColors.yellow,
            29,
          ),
        );
      if (resultComplete('requirements', 0))
        box(
          ctx,
          api,
          [
            'Primary interval + practical value',
            'AND each registered safety / service / cost requirement',
          ],
          300,
          670,
          1320,
          130,
          themeColors.green,
          32,
        );
    }
    if (B === 1) {
      const x = axis(
        ctx,
        api,
        300,
        660,
        1300,
        -3,
        6,
        [-3, 0, 3, 6],
        'Illustrative effect · percentage points',
      );
      line(ctx, api, x(-1), 520, x(4), 520, themeColors.cyan, 12);
      line(ctx, api, x(1.5), 490, x(1.5), 550, themeColors.yellow, 5);
      constructionText(ctx, api, '+1.5 points', x(1.5), 435, 36, themeColors.yellow, 'center');
      if (resultComplete('uncertain', 1))
        box(
          ctx,
          api,
          'Interval includes zero → uncertain',
          420,
          810,
          1080,
          80,
          themeColors.yellow,
          35,
        );
    }
    if (B === 2) {
      box(
        ctx,
        api,
        ['Immutable definition', 'versions / outcome / units / horizon / constraints'],
        280,
        390,
        1360,
        135,
        themeColors.blue,
        32,
      );
      box(
        ctx,
        api,
        ['Link each outcome to its trace', 'assigned prompt  /  served version  /  scoring rule'],
        280,
        650,
        1360,
        135,
        themeColors.cyan,
        31,
      );
    }
  });
}
export default {
  id: 'release-contract',
  draw: drawReleaseContract,
  cues: [
    'oa-release-contract-0',
    'oa-release-contract-reconcile',
    'oa-release-contract-requirements',
    'oa-release-contract-1',
    'oa-release-contract-uncertain',
    'oa-release-contract-mde',
    'oa-release-contract-2',
  ],
};
