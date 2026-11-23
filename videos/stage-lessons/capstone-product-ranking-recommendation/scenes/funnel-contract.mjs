import { dynamic, line, place, rect } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { diversifiedPair } from '../../../films/capstone-product-ranking-recommendation/model.mjs';
import { COLOR, open } from '../parts.mjs';

export default function funnel(s, c) {
  const [header, first, second, third, foot] = open(s, c).rows([1, 1.5, 1.5, 1.5, 1], 'wide');
  const sides = region => region.columns([1.05, 2.95], 'wide');
  const stages = [
    ['Retrieve', '10 catalog listings  →  2 queries'],
    ['Score', 'Label printer  →  3 eligible candidates'],
    ['Fill slots', 'Up to 3 positions in this response'],
  ].map(([name, value], i) => {
    const [a, b] = sides([first, second, third][i]);
    return [place(label(name, { color: 'cyan' }), a, 'left'), place(mono(value, { size: 37 }), b, 'left')];
  });
  const budget = place(label('Where does the expensive work start?'), header, 'left');
  s.add(budget, stages[0]);
  c.show('funnel-score', stages[1]);
  c.show('funnel-places', stages[2]);

  const candidates = [{ id: 'P5', relevance: 0.96 }, ...diversifiedPair(0)];
  const rows = [first, second, third].map(r => r.columns([0.85, 1.25, 1.35, 2.1, 1.35], 'wide'));
  const hs = header.columns([0.85, 1.25, 1.35, 2.1, 1.35], 'wide');
  const labels = ['Listing', 'Relevance', 'Similarity', 'Selection value', 'Position'].map((v, i) => place(note(v), hs[i]));
  const values = candidates.flatMap((p, i) => [
    place(mono(p.id, { color: COLOR[p.id] }), rows[i][0]), place(mono(p.relevance.toFixed(2)), rows[i][1]),
  ]);
  const p5 = place(namedBox('1   P5', { width: 230, height: 84, color: COLOR.P5 }), rows[0][4]);
  const slot = namedBox('2   ?', { width: 230, height: 84, dash: true, color: 'yellow' })
    .moveTo([rows[1][4].cx, (rows[1][4].cy + rows[2][4].cy) / 2]);
  const formula = place(mono('0.6 × relevance  −  0.4 × similarity', { size: 40 }), foot);
  const zero = rows.map(cells => place(mono('0.00', { color: 'dim' }), cells[2]));
  const penalty = s.value(0);
  const bars = dynamic(() => {
    const compared = diversifiedPair(penalty.value);
    return candidates.flatMap((p, i) => {
      const v = i ? compared[i - 1].value : 0.6 * p.relevance;
      const area = rows[i][3];
      const scale = (area.width - 32) / 0.6;
      const y = area.cy + 26;
      const width = scale * v;
      return [
        line([area.left, y], [area.left + scale * 0.6, y], { stroke: 'grid', width: 4 }),
        rect(width, 18, { stroke: null, fill: COLOR[p.id] }).moveTo([area.left + width / 2, y]),
        mono(v.toFixed(3), { size: 36 }).moveTo([area.cx, area.cy - 14]),
      ];
    });
  });
  c.swap('mmr-empty', [budget, ...stages.flat()], [...labels, ...values, formula, zero, bars]);
  c.show('mmr-first', p5, { after: true });
  const similarities = diversifiedPair(1).map((p, i) => place(mono(p.similarity.toFixed(2)), rows[i + 1][2]));
  const firstNote = place(note('First pick'), rows[0][2]);
  c.swap('mmr-similarity', zero, [firstNote, ...similarities, slot]);
  c.on('mmr-penalty', () => s.play(penalty.to(1, { duration: 1.1 })));
  const result = place(namedBox('2   P4', { width: 230, height: 84, color: COLOR.P4 }), rows[2][4]);
  c.swap('mmr-second', slot, result, { after: true });
}
