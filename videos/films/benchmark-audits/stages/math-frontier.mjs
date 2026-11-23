import { clip, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionBar,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawMathFrontier(ctx, scene, state, api) {
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
        const { C: themeColors, teaching: teaching } = api;
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-math-frontier-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'Answer extraction and derivation are separate contracts',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Authored arithmetic illustration',
              190,
              355,
              700,
              80,
              themeColors.blue,
              28,
            );
            drawAuditExpansionCell(ctx, api, '2 + 3 = 5', 190, 490, 700, 125, themeColors.cyan, 48);
            drawAuditExpansionCell(
              ctx,
              api,
              '“#### 5”',
              1100,
              490,
              620,
              125,
              themeColors.yellow,
              44,
            );
            drawAuditExpansionArrow(ctx, api, 890, 552, 1100, 552, themeColors.yellow);
            if (shown('parser', progress > 0.3))
              drawAuditExpansionText(
                ctx,
                api,
                'This harness chooses extraction',
                1410,
                700,
                30,
                themeColors.yellow,
                'center',
              );
            if (shown('proof', progress > 0.65)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'Final 5 with invalid reasoning\ncan still pass a final-only check',
                190,
                760,
                1530,
                130,
                themeColors.pink,
                31,
              );
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'GSM8K ≈ 8.5k problems · MATH 12.5k · no benchmark task was run here.',
            );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'Versions own their results',
              960,
              270,
              37,
              themeColors.ink,
              'center',
            );
            const releases = [
              ['Apr 2025', 'HLE public 2,500'],
              ['Oct 2025', 'HLE Rolling'],
              ['Sep 2026', 'HLE Diamond'],
            ];
            drawAuditExpansionLine(ctx, api, 240, 465, 1680, 465, themeColors.blue, 5);
            releases.forEach(([date, title], i) => {
              const x = 270 + i * 680;
              api.circle(ctx, x, 465, 12, themeColors.blue);
              drawAuditExpansionText(ctx, api, date, x, 390, 29, themeColors.blue, 'center');
              drawAuditExpansionText(ctx, api, title, x, 545, 28, themeColors.ink, 'center');
            });
            if (shown('versions', progress > 0.5)) {
              drawAuditExpansionCell(
                ctx,
                api,
                'FrontierMath v2 · 12 June 2026',
                240,
                660,
                1440,
                95,
                themeColors.yellow,
                34,
              );
              drawAuditExpansionBar(ctx, api, 0.42, 460, 815, 1000, themeColors.pink, 60);
              drawAuditExpansionText(
                ctx,
                api,
                'reported errors addressed: 42% of problems',
                960,
                955,
                31,
                themeColors.pink,
                'center',
              );
            }
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'Authored color-rule toy · infer from examples, apply to a fresh grid',
              960,
              270,
              31,
              themeColors.ink,
              'center',
            );
            const paintGrid = (x, y, values, color) =>
              teaching.grid({
                x,
                y,
                width: 210,
                height: 210,
                rows: 2,
                columns: 2,
                fill: themeColors.panel,
                stroke: themeColors.muted,
                lineWidth: 2,
                highlights: values.map((v, i) => ({
                  row: Math.floor(i / 2),
                  column: i % 2,
                  fill: v ? color : themeColors.panel,
                })),
              });
            paintGrid(220, 380, [1, 0, 0, 1], themeColors.blue);
            paintGrid(690, 380, [1, 0, 0, 1], themeColors.yellow);
            drawAuditExpansionArrow(ctx, api, 470, 485, 650, 485, themeColors.cyan);
            paintGrid(220, 700, [1, 1, 0, 1], themeColors.blue);
            drawAuditExpansionArrow(ctx, api, 470, 805, 650, 805, themeColors.cyan);
            if (shown('arc', progress > 0.4)) paintGrid(690, 700, [1, 1, 0, 1], themeColors.yellow);
            else drawAuditExpansionCell(ctx, api, '?', 690, 700, 210, 210, themeColors.muted, 70);
            drawAuditExpansionCell(
              ctx,
              api,
              'Shape stays fixed\nblue → yellow',
              1130,
              460,
              570,
              180,
              themeColors.yellow,
              39,
            );
            drawAuditExpansionNote(
              ctx,
              api,
              'A teaching rule, not a scored ARC-AGI-2 example or evidence of policy compliance.',
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
  id: 'math-frontier',
  draw: drawMathFrontier,
  cues: [
    'math-frontier-phase-0',
    'ba-math-frontier-parser',
    'ba-math-frontier-proof',
    'math-frontier-phase-1',
    'ba-math-frontier-hle',
    'ba-math-frontier-versions',
    'math-frontier-phase-2',
    'ba-math-frontier-arc',
  ],
};
