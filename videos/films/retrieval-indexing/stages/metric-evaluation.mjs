import { picture } from '../picture.mjs';

const runs = [
  { name: 'Rotate a key', gold: ['d1', 'd2'], ids: ['d1', 'd4', 'd2'] },
  { name: 'Replace a credential', gold: ['d2'], ids: ['d3', 'd4', 'd2'] },
  { name: 'Check the quota', gold: ['d4'], ids: ['d4', 'd1', 'd2'] },
];
const grades = [3, 1, 2];
const gain = (g) => 2 ** g - 1;
const discounted = (g, i) => gain(g) / Math.log2(i + 2);

function graded(p) {
  const { C, label, rule, box, target, started, after } = p;
  const sorted = [...grades].sort((a, b) => b - a);
  const dcg = (order) => order.reduce((total, g, i) => total + discounted(g, i), 0);
  target('metric-gains', () => {
    label('Returned order', 150, 290, 46);
    ['Grade', 'Gain', 'Gain / log₂(rank + 1)'].forEach((title, i) =>
      label(title, [480, 755, 1270][i], 403, 33, C.muted),
    );
    grades.forEach((g, i) => {
      const y = 500 + 115 * i;
      label('Rank ' + (i + 1), 150, y, 37);
      label(g, 480, y, 43, C.cyan);
      if (started('metric-gain')) label(gain(g), 755, y, 43, C.green);
      if (started('metric-discount')) {
        box(965, y - 34, (245 * discounted(g, i)) / 7, 31, C.blue);
        label(discounted(g, i).toFixed(3), 1270, y, 43);
      }
    });
    rule(150, 785, 1730, 785, C.panel, 3);
  });
  target('metric-ideal', () => {
    label('Ideal grade order', 150, 867, 35, C.muted);
    if (started('metric-ideal')) {
      label(sorted.join('  →  '), 545, 867, 42, C.green);
      if (after('metric-ideal'))
        label(
          'nDCG@3  =  ' +
            dcg(grades).toFixed(3) +
            ' / ' +
            dcg(sorted).toFixed(3) +
            '  ≈  ' +
            (dcg(grades) / dcg(sorted)).toFixed(3),
          150,
          987,
          44,
          C.ink,
        );
    }
  });
}

export function drawMetricEvaluation(ctx, scene, state, api) {
  const p = picture(ctx, state, api);
  if (state.beat === 3) return graded(p);
  const { C, label, rule, box, target, started, after } = p;
  const rr = state.beat === 2;
  const k = rr && after('metric-three') && !after('metric-back') ? 3 : 2;
  const rankX = (i) => 735 + 160 * i;
  const cutX = 815 + (k - 1) * 160;
  target('metric-table', () => {
    label('Returned passages', 672, 283, 41);
    label('Query', 145, 377, 32, C.muted);
    label('Judged useful', 476, 377, 32, C.muted);
    for (let i = 0; i < 3; i++) label('#' + (i + 1), rankX(i), 377, 30, C.muted, 'center');
    label(rr ? 'First useful rank' : 'Hit', 1340, 377, 33, C.muted, 'center');
    label(rr ? 'Reciprocal' : 'Recall', 1670, 377, 33, C.muted, 'center');
    if (started('metric-two')) {
      rule(cutX, 395, cutX, 806, C.yellow, 4);
      label('K = ' + k, cutX, 850, 30, C.yellow, 'center');
    }
  });
  runs.forEach(({ name, ids, gold }, i) => {
    const y = 485 + 132 * i;
    const scored = state.beat > 1 || after(['metric-first', 'metric-middle', 'metric-last'][i]);
    const returned = ids.slice(0, k);
    const hits = returned.filter((id) => gold.includes(id)).length;
    const rank = returned.findIndex((id) => gold.includes(id)) + 1;
    target('metric-row-' + i, () => {
      label(name, 145, y, 31);
      label(gold.join(', '), 476, y, 34, C.ink);
      ids.forEach((id, j) => {
        const color = gold.includes(id) ? C.green : C.muted;
        box(rankX(j) - 57, y - 52, 114, 72, C.panel, color);
        label(id, rankX(j), y, 40, color, 'center');
      });
      if (scored) {
        label(rr ? rank || '—' : hits ? '1' : '0', 1340, y, 44, C.ink, 'center');
        const fraction = rr ? (rank > 1 ? '1/' + rank : String(rank)) : hits + '/' + gold.length;
        label(fraction, 1670, y, 44, C.ink, 'center');
      }
    });
  });
  target('metric-footer', () => {
    const text = after('metric-short')
      ? 'MRR@2  =  (1 + 0 + 1) / 3  =  2/3'
      : rr && after('metric-back')
        ? 'What does the middle query contribute at two?'
        : rr && after('metric-mrr') && !started('metric-back')
          ? 'MRR@3  =  (1 + 1/3 + 1) / 3  =  7/9'
          : rr
            ? 'Read down the reciprocal-rank column. Each question counts once.'
            : after('metric-mean')
              ? 'Hit rate@2  =  2/3       Macro recall@2  =  (1/2 + 0 + 1) / 3  =  1/2'
              : started('metric-ask') && !after('metric-first')
                ? 'How much of the rotation evidence is inside the cutoff?'
                : 'Green passages belong to this query’s judged set.';
    label(text, 145, 984, 38, C.yellow);
  });
}
export default {
  id: 'metric-evaluation',
  draw: drawMetricEvaluation,
  cues: [
    'metric-two',
    'metric-ask',
    'metric-first',
    'metric-middle',
    'metric-last',
    'metric-mean',
    'metric-three',
    'metric-rr',
    'metric-mrr',
    'metric-back',
    'metric-short',
    'metric-gain',
    'metric-discount',
    'metric-ideal',
  ],
};
