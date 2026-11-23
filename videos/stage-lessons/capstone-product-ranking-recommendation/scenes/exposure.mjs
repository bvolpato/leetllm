import { dot, place, to } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, open } from '../parts.mjs';
import { exposureFrame } from '../../../films/capstone-product-ranking-recommendation/model.mjs';

export default function exposure(s, c) {
  const [legend, body, footer] = open(s, c).rows([1, 6, 1], 'normal');
  s.add(place(note('One dot per displayed impression · yellow = click'), legend));
  const panels = body.columns(3, 'wide');
  const older = [], counts = [], matched = [], dots = [], kept = [];
  exposureFrame(1).forEach(({ id, events }, i) => {
    const [head, field, readout] = panels[i].rows([1, 5, 1], 'normal');
    s.add(place(label(id, { color: COLOR[id] }), head));
    const rows = field.rows(10, 0);
    for (const event of events) {
      const cell = rows[event.cohort].columns(10, 0)[event.column];
      const mark = place(dot(9, event.clicked ? 'yellow' : 'dim'), cell);
      dots.push(mark);
      if (event.cohort > 0) older.push(mark);
      else kept.push({ mark, center: [cell.cx, field.cy] });
    }
    const total = events.filter(e => e.clicked).length;
    const first = events.filter(e => !e.cohort && e.clicked).length;
    counts.push(place(mono(total + ' clicks / ' + events.length + ' displays', { size: 34 }), readout));
    matched.push(mono(first + (first === 1 ? ' click' : ' clicks') + ' / 10 displays', { size: 34, color: 'yellow' })
      .moveTo([field.cx, field.cy + 87]));
  });
  c.show('exposure-observe', dots);
  const question = place(label('Which printer collected the most clicks?', { color: 'yellow' }), footer);
  c.show('exposure-question', question);
  c.swap('exposure-raw', question, counts, { after: true });
  c.hide('exposure-normalize', older);
  c.hide('exposure-normalize', counts);
  c.on('exposure-normalize', () => s.play(...kept.map(({ mark, center }) =>
    to(mark, n => n.moveTo(center), { duration: 0.7 }))), 0.28);
  c.show('exposure-normalize', matched, { lead: -0.95 });
  c.show('exposure-limits', place(note('The serving policy chose the products and their positions.'), footer));
}
