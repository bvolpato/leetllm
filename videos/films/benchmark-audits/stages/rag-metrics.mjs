import { clip, mix, rankedPrecision, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawRagMetrics(ctx, scene, state, api) {
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
          auditStarted(state, 'ba-rag-metrics-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'One ranked context · relevance flags [1, 0, 1]',
              960,
              275,
              35,
              themeColors.ink,
              'center',
            );
            [1, 0, 1].forEach((v, i) => {
              const x = 220 + i * 555;
              drawAuditExpansionCell(
                ctx,
                api,
                'rank ' + (i + 1),
                x,
                365,
                440,
                90,
                themeColors.muted,
              );
              drawAuditExpansionCell(
                ctx,
                api,
                v ? 'relevant fact' : 'unrelated chunk',
                x,
                510,
                440,
                110,
                v ? themeColors.green : themeColors.pink,
              );
            });
            if (shown('rank1', progress > 0.15))
              drawAuditExpansionCell(
                ctx,
                api,
                'P@1 = 1 / 1',
                220,
                700,
                440,
                100,
                themeColors.green,
                32,
              );
            if (shown('rank3', progress > 0.45))
              drawAuditExpansionCell(
                ctx,
                api,
                'P@3 = 2 / 3',
                1330,
                700,
                440,
                100,
                themeColors.green,
                32,
              );
            if (shown('average', progress > 0.7))
              drawAuditExpansionText(
                ctx,
                api,
                '(1 + 2/3) / 2 = ' + rankedPrecision([1, 0, 1]).toFixed(3),
                960,
                920,
                43,
                themeColors.yellow,
                'center',
              );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'Reference facts keep their identities across two denominators',
              960,
              275,
              33,
              themeColors.ink,
              'center',
            );
            ['F1', 'F2', 'F3'].forEach((v, i) => {
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                220 + i * 555,
                365,
                440,
                95,
                themeColors.yellow,
                35,
              );
              if (i < 2) {
                drawAuditExpansionArrow(
                  ctx,
                  api,
                  440 + i * 555,
                  460,
                  440 + i * 555,
                  555,
                  themeColors.cyan,
                );
                drawAuditExpansionCell(
                  ctx,
                  api,
                  'context ' + v,
                  220 + i * 555,
                  555,
                  440,
                  95,
                  themeColors.cyan,
                );
                drawAuditExpansionArrow(
                  ctx,
                  api,
                  440 + i * 555,
                  650,
                  440 + i * 555,
                  740,
                  themeColors.green,
                );
                drawAuditExpansionCell(
                  ctx,
                  api,
                  'claim ' + v,
                  220 + i * 555,
                  740,
                  440,
                  95,
                  themeColors.green,
                );
              }
            });
            if (shown('recall', progress > 0.3))
              drawAuditExpansionText(
                ctx,
                api,
                'Context recall = 2 / 3',
                1550,
                610,
                32,
                themeColors.yellow,
                'center',
              );
            if (shown('faithful', progress > 0.65)) {
              drawAuditExpansionText(
                ctx,
                api,
                'Faithfulness = 2 / 2 = 1',
                1550,
                790,
                29,
                themeColors.green,
                'center',
              );
              drawAuditExpansionText(
                ctx,
                api,
                'F3 is still omitted',
                1550,
                865,
                29,
                themeColors.pink,
                'center',
              );
            }
          } else {
            const ax = teaching.axes({
              x: 230,
              y: 350,
              width: 740,
              height: 500,
              xDomain: [-0.1, 1.2],
              yDomain: [-0.1, 1.2],
              xTicks: [0, 1],
              yTicks: [0, 1],
              fontSize: 25,
            });
            const o = ax.point(0, 0),
              a = ax.point(1, 0),
              d = ax.point(0.6, 0.8);
            drawAuditExpansionArrow(ctx, api, o.x, o.y, a.x, a.y, themeColors.blue);
            drawAuditExpansionArrow(
              ctx,
              api,
              o.x,
              o.y,
              mix(o.x, d.x, q),
              mix(o.y, d.y, q),
              themeColors.cyan,
            );
            drawAuditExpansionText(
              ctx,
              api,
              'original question',
              a.x - 100,
              a.y - 35,
              26,
              themeColors.blue,
              'center',
            );
            drawAuditExpansionText(
              ctx,
              api,
              'generated question',
              d.x + 25,
              d.y,
              26,
              themeColors.cyan,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Response → generated questions',
              1120,
              390,
              650,
              100,
              themeColors.cyan,
              29,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Compare with original question',
              1120,
              560,
              650,
              100,
              themeColors.blue,
              28,
            );
            if (shown('relevance', progress > 0.4))
              drawAuditExpansionCell(
                ctx,
                api,
                'Average cosine → topical alignment',
                1120,
                745,
                650,
                110,
                themeColors.yellow,
                27,
              );
            drawAuditExpansionNote(
              ctx,
              api,
              'Illustrative vectors and direct formula calculations · model-based Ragas evaluation is not demonstrated.',
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
  id: 'rag-metrics',
  draw: drawRagMetrics,
  cues: [
    'rag-metrics-phase-0',
    'precision-first',
    'precision-third',
    'precision-average',
    'ba-rag-metrics-rank1',
    'ba-rag-metrics-rank3',
    'ba-rag-metrics-average',
    'rag-metrics-phase-1',
    'context-recall',
    'faithfulness-one',
    'ba-rag-metrics-recall',
    'ba-rag-metrics-faithful',
    'rag-metrics-phase-2',
    'ba-rag-metrics-relevance',
  ],
};
