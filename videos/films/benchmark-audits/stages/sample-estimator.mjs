import { clip, smooth, subsetCoverage } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionBox,
  drawAuditExpansionCell,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawSampleEstimator(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  {
    const inherited = [
      ...new Set(
        scene.beats
          .flatMap((beat) => beat.visual_cues ?? [])
          .filter((cue) => !cue.id.startsWith('ba-'))
          .flatMap((cue) => cue.targets),
      ),
    ];
    inherited.reduceRight(
      (paint, id) => () => api.focus.target(id, paint),
      () => {
        const currentBeat = state.beat ?? 0,
          progress = clip(state.beatP ?? 0),
          q = smooth(progress);
        const { C: themeColors } = api;
        const cue = (name, fallback = q) =>
          auditCue(state, 'ba-sample-estimator-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-sample-estimator-' + name, fallback);
        {
          drawAuditExpansionText(
            ctx,
            api,
            'Keep sample indices inside their problem',
            960,
            275,
            36,
            themeColors.ink,
            'center',
          );
          if (currentBeat < 2) {
            for (let i = 0; i < 100; i++)
              api.rect(
                ctx,
                220 + (i % 10) * 47,
                365 + Math.floor(i / 10) * 47,
                32,
                32,
                i < 20 ? themeColors.green : themeColors.muted,
                undefined,
                0,
              );
            drawAuditExpansionText(
              ctx,
              api,
              '100 indices · 20 test passes',
              440,
              940,
              28,
              themeColors.cyan,
              'center',
            );
            if (currentBeat === 0) {
              drawAuditExpansionCell(
                ctx,
                api,
                'Assumed true probability p',
                1030,
                390,
                700,
                100,
                themeColors.blue,
                33,
              );
              api.math(ctx, String.raw`1-(1-p)^k`, 1380, 595, 49, themeColors.blue, 'center');
              if (shown('plugin', progress > 0.3))
                drawAuditExpansionCell(
                  ctx,
                  api,
                  'Plug-in c/n is not the same estimator',
                  1030,
                  740,
                  700,
                  140,
                  themeColors.pink,
                  29,
                );
            } else {
              const factors = Math.min(10, Math.floor(cue('subset') * 10));
              for (let i = 0; i < factors; i++)
                drawAuditExpansionCell(
                  ctx,
                  api,
                  `${80 - i} / ${100 - i}`,
                  1010 + (i % 5) * 150,
                  390 + Math.floor(i / 5) * 140,
                  130,
                  90,
                  themeColors.yellow,
                  25,
                );
              if (shown('subset', progress > 0.1))
                drawAuditExpansionText(
                  ctx,
                  api,
                  '1 − product of 10 failure fractions',
                  1360,
                  740,
                  29,
                  themeColors.yellow,
                  'center',
                );
              if (shown('hundred', progress > 0.7)) {
                drawAuditExpansionText(
                  ctx,
                  api,
                  'subset: ' + subsetCoverage(100, 20, 10).toFixed(4),
                  1360,
                  850,
                  37,
                  themeColors.green,
                  'center',
                );
                drawAuditExpansionText(
                  ctx,
                  api,
                  'plug-in: ' + (1 - 0.8 ** 10).toFixed(4),
                  1360,
                  930,
                  32,
                  themeColors.muted,
                  'center',
                );
              }
            }
          } else {
            [
              [4, 4, 'problem A'],
              [4, 0, 'problem B'],
            ].forEach(([n, k, label], i) => {
              drawAuditExpansionBox(
                ctx,
                api,
                230 + i * 820,
                360,
                660,
                310,
                i ? themeColors.pink : themeColors.green,
              );
              drawAuditExpansionText(
                ctx,
                api,
                label,
                560 + i * 820,
                420,
                33,
                i ? themeColors.pink : themeColors.green,
                'center',
              );
              for (let j = 0; j < 4; j++)
                drawAuditExpansionCell(
                  ctx,
                  api,
                  '#' + (j + 1),
                  275 + i * 820 + j * 145,
                  500,
                  120,
                  80,
                  i ? themeColors.pink : themeColors.green,
                  27,
                );
              drawAuditExpansionText(
                ctx,
                api,
                'pass@2 = ' + subsetCoverage(n, k, 2),
                560 + i * 820,
                745,
                34,
                i ? themeColors.pink : themeColors.green,
                'center',
              );
            });
            if (shown('separate', progress > 0.3))
              drawAuditExpansionText(
                ctx,
                api,
                'Correct mean: (1 + 0) / 2 = 0.5',
                960,
                860,
                37,
                themeColors.green,
                'center',
              );
            if (shown('pooled', progress > 0.65))
              drawAuditExpansionText(
                ctx,
                api,
                'Pooling owners incorrectly: ' + subsetCoverage(8, 4, 2).toFixed(3),
                960,
                945,
                32,
                themeColors.pink,
                'center',
              );
          }
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'sample-estimator',
  draw: drawSampleEstimator,
  cues: [
    'sample-estimator-phase-0',
    'ba-sample-estimator-plugin',
    'sample-estimator-phase-1',
    'ba-sample-estimator-subset',
    'sample-estimator-phase-2',
    'plugin-result',
    'subset-result',
    'problem-average',
    'pooled-result',
    'ba-sample-estimator-hundred',
    'ba-sample-estimator-separate',
    'ba-sample-estimator-pooled',
  ],
};
