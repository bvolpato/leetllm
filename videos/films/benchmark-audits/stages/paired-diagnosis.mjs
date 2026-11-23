import { clip, exactPairedP, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionCell,
  drawAuditExpansionDots,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawPairedDiagnosis(ctx, scene, state, api) {
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
          auditCue(state, 'ba-paired-diagnosis-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-paired-diagnosis-' + name, fallback);
        {
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
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'The same case occupies one paired outcome cell',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            [
              'both pass',
              'candidate-only pass · fix',
              'baseline-only pass · break',
              'both fail',
            ].forEach((v, i) => {
              const x = 260 + (i % 2) * 790,
                y = 390 + Math.floor(i / 2) * 250;
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                x,
                y,
                670,
                185,
                i === 1 ? themeColors.green : i === 2 ? themeColors.pink : themeColors.muted,
                30,
              );
              if (i === 1 || i === 2) {
                const count = i === 1 ? 9 : 1;
                drawAuditExpansionDots(
                  ctx,
                  api,
                  Math.ceil(count * cue('discordant')),
                  x + 90,
                  y + 130,
                  9,
                  i === 1 ? themeColors.green : themeColors.pink,
                  24,
                  54,
                );
              }
            });
            drawAuditExpansionNote(
              ctx,
              api,
              'Only discordant cases enter the conditional binomial calculation; shared outcomes remain paired.',
            );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'Under equal marginals: each discordant direction has probability 1/2',
              960,
              275,
              32,
              themeColors.ink,
              'center',
            );
            for (let i = 0; i < 10; i++)
              drawAuditExpansionCell(
                ctx,
                api,
                i === 9 ? 'break' : 'fix',
                210 + i * 155,
                390,
                135,
                90,
                i === 9 ? themeColors.pink : themeColors.green,
                26,
              );
            api.math(
              ctx,
              String.raw`p=\min\left(1,2\frac{\sum_{j=0}^{\min(b,c)}\binom{b+c}{j}}{2^{b+c}}\right)`,
              960,
              640,
              49,
              themeColors.yellow,
              'center',
            );
            [
              ['nine', '9 fixes / 1 break', 9, 1],
              ['three', '3 fixes / 1 break', 3, 1],
              ['five', '5 fixes / 0 breaks', 5, 0],
            ].forEach(([name, label, a, d], i) => {
              drawAuditExpansionCell(
                ctx,
                api,
                label,
                215 + i * 550,
                785,
                500,
                80,
                themeColors.blue,
                27,
              );
              if (shown(name, progress > 0.3 + i * 0.2))
                drawAuditExpansionText(
                  ctx,
                  api,
                  exactPairedP(a, d).toFixed(4),
                  465 + i * 550,
                  950,
                  38,
                  themeColors.yellow,
                  'center',
                );
            });
          } else {
            drawAuditExpansionCell(
              ctx,
              api,
              'Retained broken case B1',
              220,
              380,
              660,
              125,
              themeColors.pink,
              36,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Read source + actual answer',
              1060,
              380,
              660,
              125,
              themeColors.blue,
              32,
            );
            drawAuditExpansionArrow(ctx, api, 880, 442, 1060, 442, themeColors.pink);
            drawAuditExpansionCell(
              ctx,
              api,
              'p-value: evidence against\nthe specified null',
              220,
              690,
              660,
              155,
              themeColors.yellow,
              33,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Critical gates + case review\nstill determine the decision',
              1060,
              690,
              660,
              155,
              themeColors.cyan,
              31,
            );
            drawAuditExpansionNote(
              ctx,
              api,
              'Not a posterior probability of a useful improvement · retain repeated hosted trials and their predeclared aggregation.',
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
  id: 'paired-diagnosis',
  draw: drawPairedDiagnosis,
  cues: [
    'paired-diagnosis-phase-0',
    'ba-paired-diagnosis-cells',
    'ba-paired-diagnosis-discordant',
    'ba-paired-diagnosis-coins',
    'paired-diagnosis-phase-1',
    'paired-nine-one',
    'paired-three-one',
    'paired-five-zero',
    'ba-paired-diagnosis-exact',
    'ba-paired-diagnosis-nine',
    'ba-paired-diagnosis-three',
    'ba-paired-diagnosis-five',
    'paired-diagnosis-phase-2',
    'ba-paired-diagnosis-broken',
  ],
};
