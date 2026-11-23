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
export function drawExposureScreen(ctx, scene, state, api) {
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
        const cue = (name, fallback = q) => auditCue(state, 'ba-exposure-screen-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-exposure-screen-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'An exposed case changes the evidence behind a rising score',
              960,
              275,
              33,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(ctx, api, 'case E17', 230, 440, 420, 135, themeColors.blue, 40);
            drawAuditExpansionCell(ctx, api, 'learning', 1120, 350, 550, 100, themeColors.pink, 36);
            drawAuditExpansionCell(
              ctx,
              api,
              'prompt / judge choice',
              1120,
              560,
              550,
              100,
              themeColors.yellow,
              30,
            );
            if (shown('train', progress > 0.15))
              drawAuditExpansionArrow(ctx, api, 650, 485, 1120, 400, themeColors.pink);
            if (shown('dev', progress > 0.35))
              drawAuditExpansionArrow(ctx, api, 650, 525, 1120, 610, themeColors.yellow);
            if (shown('regression', progress > 0.7)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'E17 → regression',
                mix(230, 1120, cue('regression')),
                820,
                550,
                100,
                themeColors.yellow,
                34,
              );
            }
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'Overlap screens leave both false alarms and missed paraphrases',
              960,
              275,
              32,
              themeColors.ink,
              'center',
            );
            const words = ['approval', 'is', 'required', 'during', 'the', 'freeze'];
            words.forEach((v, i) =>
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                210 + i * 265,
                390,
                240,
                80,
                themeColors.blue,
                27,
              ),
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'matching background phrase',
              220,
              585,
              690,
              100,
              themeColors.yellow,
              31,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'renamed / translated solution',
              1030,
              585,
              690,
              100,
              themeColors.cyan,
              29,
            );
            if (shown('paraphrase', progress > 0.35))
              drawAuditExpansionText(
                ctx,
                api,
                'No exact match can still hide exposure',
                1375,
                790,
                28,
                themeColors.pink,
                'center',
              );
            if (shown('canary', progress > 0.65)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'canary marker',
                220,
                820,
                690,
                100,
                themeColors.yellow,
                34,
              );
              drawAuditExpansionLine(ctx, api, 910, 870, 1030, 870, themeColors.pink, 5);
              drawAuditExpansionText(
                ctx,
                api,
                'lost copy',
                1360,
                880,
                31,
                themeColors.pink,
                'center',
              );
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'Six-word illustration, not the historical ≈13-gram screen or a contamination detector run.',
            );
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'Time is a recorded premise, not a certificate',
              960,
              275,
              36,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionLine(ctx, api, 230, 520, 1720, 520, themeColors.blue, 5);
            const cut = 740;
            drawAuditExpansionLine(ctx, api, cut, 390, cut, 700, themeColors.yellow, 4);
            drawAuditExpansionText(
              ctx,
              api,
              'checkpoint cutoff',
              cut,
              350,
              29,
              themeColors.yellow,
              'center',
            );
            for (let i = 0; i < 5; i++) {
              const x = 310 + i * 300;
              api.circle(ctx, x, 520, 14, i > 1 ? themeColors.cyan : themeColors.muted);
              drawAuditExpansionText(
                ctx,
                api,
                'task ' + (i + 1),
                x,
                605,
                28,
                i > 1 ? themeColors.cyan : themeColors.muted,
                'center',
              );
            }
            if (shown('cutoff', progress > 0.6)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'later solution retrieval',
                1150,
                825,
                580,
                95,
                themeColors.pink,
                30,
              );
              drawAuditExpansionLine(ctx, api, 1730, 870, 1790, 870, themeColors.pink, 4);
              drawAuditExpansionLine(ctx, api, 1790, 870, 1790, 450, themeColors.pink, 4);
              drawAuditExpansionLine(ctx, api, 1790, 450, 1210, 450, themeColors.pink, 4);
              drawAuditExpansionArrow(ctx, api, 1210, 450, 1210, 500, themeColors.pink);
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'LiveCodeBench dates tasks; LiveBench refreshes tests. Pin actual checkpoint, release, tools and exposure evidence.',
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
  id: 'exposure-screen',
  draw: drawExposureScreen,
  cues: [
    'exposure-screen-phase-0',
    'ba-exposure-screen-train',
    'ba-exposure-screen-dev',
    'ba-exposure-screen-regression',
    'exposure-screen-phase-1',
    'ba-exposure-screen-ngram',
    'ba-exposure-screen-paraphrase',
    'ba-exposure-screen-canary',
    'exposure-screen-phase-2',
    'ba-exposure-screen-dated',
    'ba-exposure-screen-cutoff',
  ],
};
