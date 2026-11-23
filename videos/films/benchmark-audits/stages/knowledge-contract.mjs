import { clip, mix, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionBar,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawKnowledgeContract(ctx, scene, state, api) {
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
          auditCue(state, 'ba-knowledge-contract-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-knowledge-contract-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'MMLU · 57 subjects · a four-choice question',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            const four = cue('four');
            for (let i = 0; i < 4; i++) {
              drawAuditExpansionCell(
                ctx,
                api,
                String.fromCharCode(65 + i),
                220 + i * 405,
                400,
                345,
                130,
                themeColors.blue,
                48,
              );
              if (shown('quarter', progress > 0.4)) {
                drawAuditExpansionBar(
                  ctx,
                  api,
                  0.25 * four,
                  220 + i * 405,
                  600,
                  345,
                  themeColors.cyan,
                  75,
                );
                drawAuditExpansionText(
                  ctx,
                  api,
                  '¼ expected share',
                  392 + i * 405,
                  745,
                  27,
                  themeColors.cyan,
                  'center',
                );
              }
            }
            drawAuditExpansionText(
              ctx,
              api,
              'Uniform guessing expectation ≠ a finite-run minimum',
              960,
              875,
              33,
              themeColors.yellow,
              'center',
            );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'MMLU-Pro changes the question and choice contract',
              960,
              275,
              34,
              themeColors.ink,
              'center',
            );
            for (let i = 0; i < 10; i++)
              drawAuditExpansionCell(
                ctx,
                api,
                i + 1,
                185 + i * 158,
                350,
                135,
                80,
                themeColors.blue,
                30,
              );
            if (shown('ten', progress > 0.1))
              drawAuditExpansionText(
                ctx,
                api,
                'Exactly 10 choices → 1/10 uniform expectation',
                960,
                510,
                32,
                themeColors.yellow,
                'center',
              );
            if (shown('gpqa', progress > 0.4)) {
              drawAuditExpansionText(
                ctx,
                api,
                'GPQA split sizes · nested curated subsets',
                960,
                620,
                32,
                themeColors.ink,
                'center',
              );
              [
                [546, 'Extended', themeColors.blue],
                [448, 'main', themeColors.cyan],
                [198, 'Diamond', themeColors.yellow],
              ].forEach(([n, name, color], i) => {
                drawAuditExpansionBar(ctx, api, n / 546, 500, 675 + i * 90, 1130, color, 50);
                drawAuditExpansionText(ctx, api, name, 200, 710 + i * 90, 28, color);
                drawAuditExpansionText(ctx, api, n, 1700, 710 + i * 90, 30, color, 'right');
              });
            }
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'Historical validators and a private scenario answer different questions',
              960,
              275,
              32,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionText(
              ctx,
              api,
              'GPQA Extended · non-expert validators',
              570,
              380,
              29,
              themeColors.blue,
              'center',
            );
            drawAuditExpansionBar(
              ctx,
              api,
              shown('human', progress > 0.1) ? 0.341 : 0,
              230,
              450,
              680,
              themeColors.blue,
              95,
            );
            if (shown('human', progress > 0.1))
              drawAuditExpansionText(
                ctx,
                api,
                '34.1% in original study',
                570,
                615,
                34,
                themeColors.blue,
                'center',
              );
            const names = ['accuracy', 'calibration', 'robustness', 'fairness / bias'];
            names.forEach((v, i) =>
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                1110,
                360 + i * 105,
                620,
                80,
                themeColors.muted,
                28,
              ),
            );
            if (shown('custom', progress > 0.65)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'private policy scenario P1',
                mix(250, 1110, cue('custom')),
                850,
                620,
                90,
                themeColors.green,
                30,
              );
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'HELM permits custom scenarios · public scenario scores alone do not establish private compliance.',
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
  id: 'knowledge-contract',
  draw: drawKnowledgeContract,
  cues: [
    'knowledge-contract-phase-0',
    'mmlu-guess',
    'ba-knowledge-contract-four',
    'ba-knowledge-contract-quarter',
    'knowledge-contract-phase-1',
    'pro-guess',
    'ba-knowledge-contract-ten',
    'ba-knowledge-contract-gpqa',
    'knowledge-contract-phase-2',
    'ba-knowledge-contract-human',
    'ba-knowledge-contract-custom',
  ],
};
