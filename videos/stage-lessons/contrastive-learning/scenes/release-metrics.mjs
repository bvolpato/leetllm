import { arrayCells, dot, dynamic, fadeIn, fadeOut, indicate, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { shortlistMetrics } from '../../../films/contrastive-learning/arithmetic.mjs';

export default function releaseMetrics(s, c) {
  const [body, foot] = area.rows([6, 1], 'normal');
  const regions = body.rows(3, 'normal');
  const columns = regions.map((r) => r.columns([1, 3, 3, 3], 'wide'));
  const rankings = [
    ['X', 'P1'],
    ['P3', 'X'],
    ['X', 'Y'],
  ];
  const relevant = [['P1', 'P2'], ['P3'], ['P4']];
  const mode = s.value(0);
  const queries = columns.map((r, i) => place(label(`Q${i + 1}`, { color: 'cyan' }), r[0], 'left'));
  const lists = rankings.map((items, i) =>
    place(arrayCells(items, { size: 34, cell: 140, indices: false, color: 'blue' }), columns[i][1]),
  );
  const judged = relevant.map((items, i) =>
    place(
      arrayCells(items, { size: 34, cell: 140, indices: false, color: 'green' }),
      columns[i][2],
    ),
  );
  const heads = columns.flatMap((r) => [
    place(note('shortlist'), r[1], 'top'),
    place(note('all relevant'), r[2], 'top'),
    place(note('Recall@2 / RR@2'), r[3], 'top'),
  ]);
  const first = lists[0];
  const firstCells = [first.cell(0), first.cell(1)];
  const endpoints = firstCells.map((n) => n.center);
  const progress = s.value(0);
  const movingDots = endpoints.map((p, i) =>
    dynamic(() =>
      dot(10, i ? 'green' : 'blue').moveTo([
        p[0] + (endpoints[1 - i][0] - p[0]) * progress.value,
        p[1] + (i ? 90 : -90) * Math.sin(Math.PI * progress.value),
      ]),
    ).set('visible', false),
  );
  const updated = place(
    arrayCells(['P1', 'P2'], { size: 34, cell: 140, indices: false, color: 'green' }),
    columns[0][1],
  );
  const slots = columns.map((r) =>
    place(mono('R 0.50  RR 0.50', { color: 'yellow', size: 34 }), r[3]),
  );
  const metrics = slots.map((slot, i) =>
    dynamic(() => {
      const rank = i
        ? rankings[i]
        : mode.value >= 1.5
          ? ['P1', 'P2']
          : mode.value >= 0.5
            ? ['P1', 'X']
            : rankings[0];
      const m = shortlistMetrics(rank, relevant[i], 2);
      return mono(`R ${m.recall.toFixed(2)}  RR ${m.rr.toFixed(2)}`, {
        color: 'yellow',
        size: 34,
      }).moveTo(slot.center);
    }),
  );
  const formula = place(note('Recall: found / all relevant     RR: 1 / first relevant rank'), foot);
  const heldout = place(note('held-out queries + source groups + fixed serving gates'), foot);
  s.add(heading(c.title, { size: 54 }), queries, lists, judged, heads, movingDots);
  c.onBeat(0, () => {
    s.play(
      ...lists.flatMap((list, i) =>
        rankings[i].flatMap((id, j) =>
          relevant[i].includes(id) ? [list.mark(j, 'green', { duration: 0.1 })] : [],
        ),
      ),
    );
  });
  c.show('cl-release-metrics-recall', formula, { after: true });
  c.on('cl-release-metrics-rr', () => s.play(indicate(first.cell(1), { scale: 1 })));
  c.show('cl-release-metrics-base', metrics, { after: true });
  c.after('cl-release-metrics-move', () => {
    s.play(fadeOut(firstCells, { duration: 0.1 }), fadeIn(movingDots, { duration: 0.1 }));
    s.play(
      first.swap(0, 1, { duration: 1.3, lift: 90 }),
      progress.to(1, { duration: 1.3 }),
      mode.to(1, { duration: 1.3 }),
    );
    s.play(fadeOut(movingDots, { duration: 0.1 }), fadeIn(firstCells, { duration: 0.2 }));
  });
  c.swap('cl-release-metrics-add', first, updated, { after: true });
  c.after('cl-release-metrics-add', () => s.play(mode.to(2, { duration: 0.5 })));
  c.swap('cl-release-metrics-heldout', formula, heldout);
}
