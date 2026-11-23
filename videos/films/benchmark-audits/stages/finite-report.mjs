import { clip, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawFiniteReport(ctx, scene, state, api) {
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
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-finite-report-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'Validate the measurement domain before the release boundary',
              960,
              275,
              33,
              themeColors.ink,
              'center',
            );
            const values = [
              ['0', true],
              ['False', false],
              ['−1', false],
              ['∞ / huge integer', false],
            ];
            values.forEach(([v, ok], i) => {
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                210 + i * 410,
                390,
                355,
                120,
                themeColors.blue,
                36,
              );
              drawAuditExpansionArrow(
                ctx,
                api,
                387 + i * 410,
                510,
                387 + i * 410,
                640,
                ok ? themeColors.green : themeColors.pink,
              );
              if (shown(i === 1 ? 'typed' : 'domain', progress > 0.35))
                drawAuditExpansionCell(
                  ctx,
                  api,
                  ok ? 'valid number' : 'reject domain',
                  210 + i * 410,
                  685,
                  355,
                  110,
                  ok ? themeColors.green : themeColors.pink,
                  29,
                );
            });
            drawAuditExpansionNote(
              ctx,
              api,
              'Exact type, finite value and range are separate predicates; valid zero latency or cost is allowed.',
            );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'NaN slips through reject-if-bad comparisons',
              960,
              275,
              36,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'quality = NaN',
              220,
              380,
              640,
              110,
              themeColors.yellow,
              37,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'latency = NaN',
              1060,
              380,
              640,
              110,
              themeColors.yellow,
              37,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'NaN < quality floor → false',
              220,
              580,
              640,
              110,
              themeColors.pink,
              29,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'NaN > latency limit → false',
              1060,
              580,
              640,
              110,
              themeColors.pink,
              29,
            );
            if (shown('reject', progress > 0.7))
              drawAuditExpansionCell(
                ctx,
                api,
                'isfinite(NaN) → false → REJECT',
                390,
                820,
                1140,
                105,
                themeColors.green,
                36,
              );
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'Valid numbers still face all independent product gates',
              960,
              275,
              34,
              themeColors.ink,
              'center',
            );
            const dimensions = ['policy', 'schema', 'latency', 'cost', 'critical slice'];
            dimensions.forEach((v, i) => {
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                210 + i * 325,
                470,
                285,
                100,
                i === 4 ? themeColors.pink : themeColors.cyan,
                28,
              );
              if (i < 4)
                drawAuditExpansionLine(
                  ctx,
                  api,
                  495 + i * 325,
                  520,
                  535 + i * 325,
                  520,
                  themeColors.muted,
                  3,
                );
            });
            drawAuditExpansionCell(
              ctx,
              api,
              'Proposed decision',
              550,
              745,
              820,
              115,
              themeColors.yellow,
              38,
            );
            drawAuditExpansionNote(
              ctx,
              api,
              'Pure function evidence does not authenticate telemetry, call a model or route real traffic.',
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
  id: 'finite-report',
  draw: drawFiniteReport,
  cues: [
    'finite-report-phase-0',
    'ba-finite-report-typed',
    'ba-finite-report-domain',
    'finite-report-phase-1',
    'invalid-nan',
    'ba-finite-report-nan',
    'ba-finite-report-reject',
    'finite-report-phase-2',
    'ba-finite-report-scope',
  ],
};
