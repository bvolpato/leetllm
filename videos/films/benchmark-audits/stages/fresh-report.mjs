import { clip, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import { freshAuditDecision, freshAuditReveal } from '../model.mjs';
import {
  auditFocusApi,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawFreshReport(ctx, scene, state, api) {
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
          auditStarted(state, 'ba-fresh-report-' + name, fallback);
        {
          const data = freshAuditDecision(),
            reveal = freshAuditReveal(state);
          drawAuditExpansionText(
            ctx,
            api,
            'Fresh archive packet · 200 paired cases',
            960,
            275,
            34,
            themeColors.ink,
            'center',
          );
          drawAuditExpansionText(
            ctx,
            api,
            'Case pairs independently sampled from one target population',
            960,
            325,
            27,
            themeColors.muted,
            'center',
          );
          const groups = [
            ['both pass', 178, themeColors.muted],
            ['fixed', 10, themeColors.green],
            ['broken', 2, themeColors.pink],
            ['both fail', 10, themeColors.muted],
          ];
          groups.forEach(([name, count, color], i) => {
            const x = 210 + i * 410;
            drawAuditExpansionCell(ctx, api, name, x, 365, 350, 85, color, 29);
            drawAuditExpansionCell(ctx, api, count, x, 490, 350, 100, color, 46);
          });
          drawAuditExpansionText(
            ctx,
            api,
            'Baseline 180/200 · Candidate 188/200',
            960,
            665,
            34,
            themeColors.blue,
            'center',
          );
          if (currentBeat === 0) {
            drawAuditExpansionCell(
              ctx,
              api,
              'Permission slice: 9/10\n95% Wilson lower bound must reach 0.85',
              360,
              735,
              1200,
              145,
              themeColors.yellow,
              32,
            );
            drawAuditExpansionText(
              ctx,
              api,
              'Does the aggregate gain authorize release?',
              960,
              945,
              36,
              themeColors.yellow,
              'center',
            );
          } else if (currentBeat === 1) {
            if (reveal.paired)
              drawAuditExpansionCell(
                ctx,
                api,
                'paired p = ' + data.pairedP.toFixed(4),
                220,
                755,
                650,
                110,
                themeColors.green,
                37,
              );
            else if (shown('pvalue', false))
              drawAuditExpansionCell(
                ctx,
                api,
                'Paired tail pending',
                220,
                755,
                650,
                110,
                themeColors.muted,
                32,
              );
            if (reveal.bound) {
              drawAuditExpansionCell(
                ctx,
                api,
                'critical lower = ' + data.criticalLower.toFixed(3),
                1050,
                755,
                650,
                110,
                themeColors.pink,
                35,
              );
              drawAuditExpansionText(
                ctx,
                api,
                '0.596 < predeclared floor 0.85',
                1375,
                945,
                30,
                themeColors.pink,
                'center',
              );
            } else if (shown('bound', false))
              drawAuditExpansionCell(
                ctx,
                api,
                'Critical interval pending',
                1050,
                755,
                650,
                110,
                themeColors.muted,
                32,
              );
          } else {
            if (reveal.hold) {
              drawAuditExpansionCell(ctx, api, 'HOLD', 630, 740, 660, 100, themeColors.pink, 48);
            } else if (shown('hold', false))
              drawAuditExpansionCell(
                ctx,
                api,
                'Decision pending',
                630,
                740,
                660,
                100,
                themeColors.muted,
                34,
              );
            if (shown('broken', progress > 0.2)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'broken F031',
                220,
                885,
                450,
                85,
                themeColors.pink,
                29,
              );
              drawAuditExpansionCell(
                ctx,
                api,
                'broken F118',
                1250,
                885,
                450,
                85,
                themeColors.pink,
                29,
              );
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'Supplied case identities · retain the permission failure and broken records; repair-targeted cases become regression.',
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
  id: 'fresh-report',
  draw: drawFreshReport,
  cues: [
    'fresh-report-phase-0',
    'fresh-predict',
    'ba-fresh-report-premise',
    'ba-fresh-report-critical',
    'fresh-report-phase-1',
    'fresh-paired-p',
    'fresh-slice-bound',
    'ba-fresh-report-coin',
    'ba-fresh-report-pvalue',
    'ba-fresh-report-bound',
    'fresh-report-phase-2',
    'fresh-hold',
    'ba-fresh-report-hold',
    'ba-fresh-report-broken',
    'ba-fresh-report-regression',
  ],
};
