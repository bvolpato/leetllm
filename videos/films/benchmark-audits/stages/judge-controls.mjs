import { clip, mix, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawJudgeControls(ctx, scene, state, api) {
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
        const cue = (name, fallback = q) => auditCue(state, 'ba-judge-controls-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-judge-controls-' + name, fallback);
        {
          drawAuditExpansionText(
            ctx,
            api,
            'Answer names survive swapping their displayed slots',
            960,
            275,
            34,
            themeColors.ink,
            'center',
          );
          const swap = currentBeat === 1 ? cue('swap') : currentBeat > 1 ? 1 : 0;
          const horizontal = clip((swap - 0.25) * 2);
          const xA = mix(220, 1120, horizontal),
            xB = mix(1120, 220, horizontal);
          const yA =
            swap < 0.25
              ? mix(510, 650, swap * 4)
              : swap < 0.75
                ? 650
                : mix(650, 510, (swap - 0.75) * 4);
          drawAuditExpansionCell(ctx, api, 'SLOT A', 220, 360, 580, 80, themeColors.muted, 30);
          drawAuditExpansionCell(ctx, api, 'SLOT B', 1120, 360, 580, 80, themeColors.muted, 30);
          const name1 = currentBeat === 2 ? 'grounded' : 'concise',
            name2 = currentBeat === 2 ? 'missing approval' : 'friendly';
          drawAuditExpansionCell(ctx, api, name1, xA, yA, 580, 120, themeColors.blue, 36);
          drawAuditExpansionCell(ctx, api, name2, xB, 510, 580, 120, themeColors.cyan, 36);
          if (currentBeat === 0) {
            ['human labels', 'explicit rubric', 'disagreement policy'].forEach((v, i) =>
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                210 + i * 565,
                780,
                510,
                100,
                themeColors.yellow,
                28,
              ),
            );
          } else if (currentBeat === 1) {
            if (shown('tie', progress > 0.1))
              drawAuditExpansionCell(
                ctx,
                api,
                'toy tie-break chooses slot A',
                460,
                800,
                1000,
                90,
                themeColors.yellow,
                32,
              );
            if (shown('unresolved', progress > 0.65))
              drawAuditExpansionText(
                ctx,
                api,
                'Named winner changes → unresolved',
                960,
                950,
                37,
                themeColors.pink,
                'center',
              );
          } else {
            if (shown('grounded', progress > 0.15))
              drawAuditExpansionCell(
                ctx,
                api,
                'Both orders → grounded',
                460,
                735,
                1000,
                100,
                themeColors.green,
                35,
              );
            if (shown('truth', progress > 0.4))
              drawAuditExpansionText(
                ctx,
                api,
                'Consistency still requires independent source review',
                960,
                930,
                32,
                themeColors.yellow,
                'center',
              );
          }
          drawAuditExpansionNote(
            ctx,
            api,
            'The deterministic tie-break is authored code behavior; two stochastic disagreements alone cannot isolate position bias.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'judge-controls',
  draw: drawJudgeControls,
  cues: [
    'judge-controls-phase-0',
    'ba-judge-controls-rubric',
    'judge-controls-phase-1',
    'judge-first',
    'judge-swapped',
    'judge-unresolved',
    'ba-judge-controls-tie',
    'ba-judge-controls-swap',
    'ba-judge-controls-unresolved',
    'judge-controls-phase-2',
    'ba-judge-controls-grounded',
    'ba-judge-controls-truth',
  ],
};
