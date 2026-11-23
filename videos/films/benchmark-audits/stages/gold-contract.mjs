import { clip, mix, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawGoldContract(ctx, scene, state, api) {
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
        const cue = (name, fallback = q) => auditCue(state, 'ba-gold-contract-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-gold-contract-' + name, fallback);
        {
          drawAuditExpansionText(
            ctx,
            api,
            'Keep one question attached to its source and answer key',
            960,
            275,
            35,
            themeColors.ink,
            'center',
          );
          drawAuditExpansionCell(
            ctx,
            api,
            currentBeat === 2 ? 'P2 · threshold breach' : 'P1 · freeze deployment',
            180,
            350,
            720,
            85,
            themeColors.blue,
          );
          drawAuditExpansionCell(
            ctx,
            api,
            currentBeat === 2 ? 'Source: invoke rollback runbook' : 'Source: commander approval',
            180,
            475,
            720,
            100,
            themeColors.blue,
            31,
          );
          drawAuditExpansionCell(
            ctx,
            api,
            currentBeat === 2 ? 'Gold: keep deploying' : 'Gold: commander approval',
            1040,
            475,
            700,
            100,
            currentBeat === 2 ? themeColors.pink : themeColors.cyan,
            31,
          );
          drawAuditExpansionArrow(
            ctx,
            api,
            900,
            525,
            1040,
            525,
            currentBeat === 2 ? themeColors.pink : themeColors.cyan,
          );
          if (currentBeat === 0) {
            [
              'P1 · freeze / approval',
              'P2 · threshold / rollback',
              'P3 · token / revoke ≤ 15 min',
            ].forEach((v, i) =>
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                180 + i * 535,
                735,
                495,
                100,
                [themeColors.blue, themeColors.yellow, themeColors.pink][i],
                26,
              ),
            );
          } else if (currentBeat === 1) {
            const a = cue('unique');
            drawAuditExpansionCell(ctx, api, 'P1', 270, 720, 230, 90, themeColors.blue, 35);
            drawAuditExpansionCell(
              ctx,
              api,
              'P1',
              mix(980, 450, a),
              720,
              230,
              90,
              themeColors.pink,
              35,
            );
            if (a === 1)
              drawAuditExpansionText(
                ctx,
                api,
                'ID collision · one result address',
                960,
                890,
                32,
                themeColors.pink,
                'center',
              );
            drawAuditExpansionText(
              ctx,
              api,
              'Then compare each required fact with the cited text',
              960,
              650,
              29,
              themeColors.yellow,
              'center',
            );
          } else {
            if (shown('unsupported', progress > 0.1)) {
              drawAuditExpansionLine(ctx, api, 1180, 600, 1610, 600, themeColors.pink, 6);
              drawAuditExpansionText(
                ctx,
                api,
                'No supporting source span',
                1390,
                675,
                30,
                themeColors.pink,
                'center',
              );
            }
            if (shown('repair', progress > 0.45)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'REPAIRED GOLD\ninvoke rollback runbook',
                1040,
                750,
                700,
                140,
                themeColors.green,
                30,
              );
              drawAuditExpansionCell(
                ctx,
                api,
                'P2 · authoritative threshold source',
                180,
                750,
                720,
                140,
                themeColors.blue,
                27,
              );
              drawAuditExpansionArrow(ctx, api, 900, 820, 1040, 820, themeColors.green);
            }
          }
          drawAuditExpansionNote(
            ctx,
            api,
            'Supplied platform policies · unique IDs and phrase checks do not certify semantic truth.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'gold-contract',
  draw: drawGoldContract,
  cues: [
    'gold-contract-phase-0',
    'ba-gold-contract-approval',
    'gold-contract-phase-1',
    'ba-gold-contract-unique',
    'ba-gold-contract-gold',
    'gold-contract-phase-2',
    'ba-gold-contract-unsupported',
    'ba-gold-contract-repair',
  ],
};
