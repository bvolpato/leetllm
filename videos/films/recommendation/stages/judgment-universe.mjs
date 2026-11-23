import { SHORT } from '../fixtures.mjs';
import { ranked, retrievalOrder } from '../construction.mjs';
import { judgedListState } from '../model.mjs';
import { cueProgress, drawRecommendationColor } from '../defaults.mjs';

function reportAt(budget) {
  const found = retrievalOrder.slice(0, budget);
  const ids = new Set(found.map((d) => d.id));
  return judgedListState(ranked.filter((d) => ids.has(d.id)).map((d) => d.id));
}
const initial = reportAt(3);
const expanded = reportAt(4);

export function paintJudgmentUniverse(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id, beat, start, end) => cueProgress(state, api, id, beat, start, end);
  const four = cue('universe-four', 2, 0.17, 0.38);
  const reorder = cue('universe-rerank', 3, 0.08, 0.33);
  const scored = cue('universe-report', 3, 0.7, 0.95) > 0;
  const report = reorder === 1 ? expanded : initial;
  const pending = four > 0 && reorder < 1;
  const label = (v, x, y, size, color, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);

  api.focus.target('universe-budget', () => {
    label('Retrieval order', 125, 270, 38, C.ink);
    label('Grade', 725, 270, 29, C.muted, 'right');
    const rowY = (i) => 359 + 91 * i;
    retrievalOrder.forEach((d, i) => {
      label(String(i + 1), 128, rowY(i), 32, C.muted);
      label(SHORT[d.id], 198, rowY(i), 37, drawRecommendationColor(ctx, api, C, d));
      label(String(d.relevance), 720, rowY(i), 38, C.ink, 'right');
    });
    const boundary = rowY(2) + 37 + 91 * four;
    const foot = 12 + 643 * api.clamp((Math.abs(2 * four - 1) - 0.8) / 0.2);
    api.line(ctx, 100, 304, 100, boundary, C.yellow, 4);
    api.line(ctx, 100, boundary, 100 + foot, boundary, C.yellow, 4);
    label('Eligible pages stay in the judgment set', 122, 850, 28, C.muted);
    label('Candidate budget   ' + (four === 1 ? 4 : 3), 122, 925, 39, C.yellow);
  });
  api.focus.target('universe-returned', () => {
    label(pending ? 'Before reranking' : 'Best returned order', 892, 270, 38, C.ink);
    label('Display cutoff   3', 1780, 270, 29, C.muted, 'right');
    for (let i = 0; i < 3; i++) {
      const x = 891 + i * 305;
      const d = report.rows[i];
      const incoming = expanded.rows[i];
      const swaps = reorder > 0 && reorder < 1 && d.id !== incoming.id;
      const opacity = swaps ? Math.abs(1 - 2 * reorder) : 1;
      const visible = swaps && reorder > 0.5 ? incoming : d;
      api.rect(ctx, x, 319, 283, 150, C.panel, C.muted, 10);
      label('Slot ' + (i + 1), x + 20, 360, 25, C.muted);
      ctx.save();
      ctx.globalAlpha *= opacity;
      label(SHORT[visible.id], x + 20, 422, 35, drawRecommendationColor(ctx, api, C, visible));
      ctx.restore();
    }
  });
  api.focus.target('universe-scores', () => {
    const gain = cue('universe-gain', 0, 0.8, 0.98);
    const local = cue('universe-local', 1, 0.17, 0.4);
    const system = cue('universe-system', 1, 0.55, 0.77);
    const third = expanded.ideal[2];
    label('DCG at three slots', 892, 555, 31, C.muted);
    const terms = report.grades.map((g, i) => Number(((2 ** g - 1) / Math.log2(i + 2)).toFixed(3)));
    label(
      pending
        ? 'Waiting for the new order'
        : terms.join('  +  ') + '  =  ' + (gain ? report.dcg.toFixed(3) : '?'),
      892,
      626,
      45,
      pending ? C.muted : C.ink,
    );
    if (pending) {
      label('Which useful page is still outside?', 892, 814, 40, C.yellow);
      return;
    }
    if (local > 0) {
      label('Candidate ideal', 892, 734, 32, C.cyan);
      label(
        report.dcg.toFixed(3) +
          ' / ' +
          report.localIdcg.toFixed(3) +
          '  =  ' +
          report.local.toFixed(3),
        1780,
        734,
        38,
        C.cyan,
        'right',
      );
    }
    if (system > 0) {
      label('Eligible ideal', 892, 828, 32, C.yellow);
      label(
        report.dcg.toFixed(3) +
          ' / ' +
          report.idcg.toFixed(3) +
          '  =  ' +
          (reorder === 1 && !scored ? '?' : report.system.toFixed(3)),
        1780,
        828,
        38,
        C.yellow,
        'right',
      );
      label(
        'Ideal grades   ' +
          report.ideal.join('   ') +
          (reorder === 1
            ? '       Slot 3 could earn ' + ((2 ** third - 1) / Math.log2(4)).toFixed(1)
            : ''),
        892,
        930,
        31,
        C.muted,
      );
    }
  });
}
export default {
  id: 'judgment-universe',
  draw: paintJudgmentUniverse,
  cues: [
    'universe-gain',
    'universe-local',
    'universe-system',
    'universe-four',
    'universe-rerank',
    'universe-report',
  ],
};
