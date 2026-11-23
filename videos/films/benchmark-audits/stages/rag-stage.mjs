import { clip, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawRagStage(ctx, scene, state, api) {
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
        const { C: themeColors, components: components } = api;
        const cue = (name, fallback = q) => auditCue(state, 'ba-rag-stage-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-rag-stage-' + name, fallback);
        {
          const facts = ['freeze active', 'commander approval', 'source P1 · version 4'];
          drawAuditExpansionText(
            ctx,
            api,
            'P1 remains the same request and source',
            960,
            270,
            34,
            themeColors.blue,
            'center',
          );
          const complete = currentBeat > 0,
            drop = complete ? 0 : cue('drop');
          facts.forEach((f, i) => {
            const yy = 370 + i * 145;
            components.fade(i === 1 ? 1 - drop : 1, () =>
              drawAuditExpansionCell(
                ctx,
                api,
                f,
                170,
                yy,
                690,
                105,
                i === 1 ? themeColors.yellow : themeColors.blue,
                29,
              ),
            );
            if (i === 1 && drop > 0) {
              drawAuditExpansionCell(
                ctx,
                api,
                'budget excludes approval clause',
                1050,
                yy,
                690,
                105,
                themeColors.pink,
                28,
              );
              drawAuditExpansionArrow(ctx, api, 860, yy + 52, 1050, yy + 52, themeColors.pink);
            }
          });
          if (currentBeat > 0) {
            const roleWrong = currentBeat === 1 && shown('engineer', progress > 0.35);
            drawAuditExpansionCell(
              ctx,
              api,
              roleWrong ? 'Answer: ask on-call engineer' : 'Answer: ask commander approval',
              1050,
              370,
              690,
              125,
              roleWrong ? themeColors.pink : themeColors.cyan,
              29,
            );
            drawAuditExpansionArrow(
              ctx,
              api,
              860,
              565,
              1050,
              435,
              roleWrong ? themeColors.pink : themeColors.cyan,
            );
            if (currentBeat === 1 && roleWrong) {
              drawAuditExpansionText(
                ctx,
                api,
                'Context complete',
                1395,
                620,
                33,
                themeColors.green,
                'center',
              );
              drawAuditExpansionText(
                ctx,
                api,
                'First observed defect: generated role',
                1395,
                700,
                30,
                themeColors.pink,
                'center',
              );
            }
            if (currentBeat === 2) {
              [
                'right answer / right source',
                'right answer / wrong source',
                'negated answer / right source',
              ].forEach((v, i) => {
                drawAuditExpansionCell(
                  ctx,
                  api,
                  v,
                  1030,
                  550 + i * 125,
                  730,
                  90,
                  i ? themeColors.pink : themeColors.green,
                  27,
                );
              });
              drawAuditExpansionText(
                ctx,
                api,
                'Source ID ≠ entailment',
                515,
                880,
                36,
                themeColors.yellow,
                'center',
              );
            }
          } else if (drop === 1)
            drawAuditExpansionText(
              ctx,
              api,
              'Required fact never reached the model',
              960,
              900,
              34,
              themeColors.pink,
              'center',
            );
          drawAuditExpansionNote(
            ctx,
            api,
            'Inspect final admitted context, generated claims and citation identity as separate boundaries.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'rag-stage',
  draw: drawRagStage,
  cues: [
    'rag-stage-phase-0',
    'ba-rag-stage-drop',
    'rag-stage-phase-1',
    'ba-rag-stage-complete',
    'ba-rag-stage-engineer',
    'rag-stage-phase-2',
    'ba-rag-stage-citation',
  ],
};
