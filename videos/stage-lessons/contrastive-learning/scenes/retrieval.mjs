import {
  column,
  heatmap,
  indicate,
  place,
  row,
  to,
  rect,
  dot,
  Box,
  boxOf,
  fadeOut,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { dogComparison, vector, ANGLES, NAMES, COLORS } from '../parts.mjs';

export default function retrieval(s, c) {
  const p = dogComparison();
  const regions = p.right.rows([3, 1, 1, 1, 1], 'normal');
  const stored = place(
    heatmap(ANGLES.map(vector), {
      size: 34,
      cellWidth: 160,
      cellHeight: 65,
      values: true,
      format: (v) => v.toFixed(2),
      rowLabels: NAMES,
      columnLabels: ['stored x', 'stored y'],
    }),
    regions[0],
  );
  const candidates = NAMES.map((n, i) =>
    place(
      row([label(n, { color: COLORS[i], size: 34 }), mono(p.scores[i].toFixed(3), { size: 34 })], {
        gap: 'wide',
      }),
      new Box(
        regions[i + 1].left + 24,
        regions[i + 1].top,
        regions[i + 1].right - 24,
        regions[i + 1].bottom,
      ),
      'left',
    ),
  );
  const allRegion = new Box(regions[1].left, regions[1].top, regions[3].right, regions[3].bottom);
  const selectedRegion = new Box(
    regions[2].left,
    regions[2].top,
    regions[3].right,
    regions[3].bottom,
  );
  const allBoundary = place(
    rect(allRegion.width, allRegion.height, { fill: null, stroke: 'dim', width: 2 }),
    allRegion,
  );
  const selectedBoundary = place(
    rect(selectedRegion.width, selectedRegion.height, { fill: null, stroke: 'yellow', width: 3 }),
    selectedRegion,
  );
  const omitted = place(note('outside shortlist', { color: 'red' }), regions[1], 'right');
  const shortlistLabel = place(
    note('Illustrated failure · shortlist → reranker below'),
    regions[4],
  );
  const [rerankHead, rerankBody] = p.foot.rows([1, 1], 'tight');
  const rerankTitle = place(note('Reranker input: selected candidates only'), rerankHead);
  const rerankSlots = rerankBody.columns(2, 'loose');
  const reranked = [1, 2].map((i, j) =>
    place(label(NAMES[i], { color: COLORS[i], size: 34 }), rerankSlots[j]),
  );
  const packets = [1, 2].map((i) => dot(9, COLORS[i]).moveTo(boxOf(candidates[i]).point('center')));
  const scope = place(
    label('fixed held-out judgments · stable retrieval contract', { size: 34 }),
    p.left,
    'bottom',
  );
  s.add(heading(c.title), p.plane, stored);
  c.on('retrieval-ranked-document-0-b1-1', () => s.play(stored.light({ row: 0 })));
  c.show('cl-retrieval-rank', candidates, { after: true });
  c.show('retrieval-ranked-document-0-b2-1', allBoundary);
  c.swap('cl-retrieval-missing', allBoundary, [selectedBoundary, omitted, shortlistLabel]);
  c.hide('cl-retrieval-missing', candidates.slice(1), { lead: -1.0 });
  c.show('cl-retrieval-missing', rerankTitle, { after: true });
  c.after('cl-retrieval-missing', () => {
    s.play(
      ...packets.map((packet, j) =>
        to(packet, (n) => n.moveTo(reranked[j].center), { duration: 0.8 }),
      ),
    );
    s.play(fadeOut(packets, { duration: 0.1 }));
  });
  c.show('cl-retrieval-missing', reranked, { after: true, lead: -1.0 });
  c.show('retrieval-ranked-document-0-b3-1', scope);
}
