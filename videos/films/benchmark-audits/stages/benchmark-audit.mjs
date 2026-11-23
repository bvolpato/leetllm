import { clip, mix, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionBar,
  drawAuditExpansionBox,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawBenchmarkAudit(ctx, scene, state, api) {
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
        const cue = (name, fallback = q) => auditCue(state, 'ba-benchmark-audit-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-benchmark-audit-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'Keep the reported denominator intact',
              960,
              275,
              37,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionBox(ctx, api, 190, 350, 1530, 530, themeColors.blue);
            drawAuditExpansionText(
              ctx,
              api,
              'SWE-bench Verified · 500 tasks',
              260,
              420,
              34,
              themeColors.blue,
            );
            const shrink = cue('subset');
            drawAuditExpansionBox(
              ctx,
              api,
              290,
              495,
              mix(1320, 710, shrink),
              300,
              themeColors.yellow,
            );
            drawAuditExpansionText(
              ctx,
              api,
              'Selected 138-task audit subset',
              330,
              565,
              30,
              themeColors.yellow,
            );
            if (shown('subset', progress > 0.3)) {
              drawAuditExpansionBar(ctx, api, 0.594, 350, 640, 530, themeColors.pink, 55);
              drawAuditExpansionText(
                ctx,
                api,
                '59.4% material issues',
                615,
                750,
                30,
                themeColors.pink,
                'center',
              );
            }
            if (shown('denominator', progress > 0.8))
              drawAuditExpansionText(
                ctx,
                api,
                'This percentage is scoped to 138, not all 500',
                960,
                955,
                32,
                themeColors.yellow,
                'center',
              );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'An official recommendation also has a revision history',
              960,
              275,
              34,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'February 2026\ninitial Pro recommendation',
              200,
              365,
              700,
              145,
              themeColors.blue,
              31,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'July 2026\nrecommendation retracted',
              1040,
              365,
              700,
              145,
              themeColors.pink,
              31,
            );
            drawAuditExpansionArrow(ctx, api, 900, 437, 1040, 437, themeColors.pink);
            if (shown('pro', progress > 0.6)) {
              drawAuditExpansionText(
                ctx,
                api,
                '731 public Pro tasks audited',
                960,
                650,
                35,
                themeColors.yellow,
                'center',
              );
              drawAuditExpansionBar(ctx, api, 0.3, 310, 730, 1300, themeColors.pink, 75);
              drawAuditExpansionText(
                ctx,
                api,
                'Estimated ≈ 30% broken',
                960,
                900,
                34,
                themeColors.pink,
                'center',
              );
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'Dates and estimates belong to the cited audits; this film did not rerun those benchmark suites.',
            );
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'Read the accepting verifier, not just its label',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Submitted patch',
              190,
              400,
              500,
              150,
              themeColors.blue,
              36,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Selected assertions',
              1040,
              400,
              690,
              150,
              themeColors.cyan,
              36,
            );
            drawAuditExpansionArrow(ctx, api, 690, 475, 1040, 475, themeColors.cyan);
            drawAuditExpansionCell(
              ctx,
              api,
              'Accepted',
              1040,
              650,
              310,
              110,
              themeColors.green,
              34,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Uncovered path',
              1420,
              650,
              310,
              110,
              themeColors.pink,
              29,
            );
            if (shown('verifier', progress > 0.1)) {
              drawAuditExpansionLine(ctx, api, 1210, 550, 1195, 650, themeColors.green, 4);
              drawAuditExpansionLine(ctx, api, 1510, 550, 1575, 650, themeColors.pink, 4);
            }
            drawAuditExpansionText(
              ctx,
              api,
              'Retain examined assertions, environment and exposure history',
              960,
              910,
              33,
              themeColors.yellow,
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
  id: 'benchmark-audit',
  draw: drawBenchmarkAudit,
  cues: [
    'benchmark-audit-phase-0',
    'ba-benchmark-audit-subset',
    'ba-benchmark-audit-denominator',
    'benchmark-audit-phase-1',
    'ba-benchmark-audit-retract',
    'ba-benchmark-audit-pro',
    'benchmark-audit-phase-2',
    'ba-benchmark-audit-verifier',
  ],
};
