import { assertEqual, dot, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

const records = Array.from({ length: 100 }, (_, i) => ({
  set: i < 90 ? ['billing', 'technical'] : ['billing'],
  truth: 'technical',
}));
const accepted = records.filter((r) => r.set.length === 1);
const errors = accepted.filter((r) => !r.set.includes(r.truth)).length;
const hits = records.filter((r) => r.set.includes(r.truth)).length;
assertEqual(hits, 90, 'covered requests');
assertEqual(errors, 10, 'wrong answers sent');

export default function selectedError(s, c) {
  const [population, panel] = area.inset('normal').columns([1, 1.15], 'loose');
  const [legend, grid] = population.rows([1, 6], 'normal');
  const rows = grid.rows(10, 'tight');
  const cells = rows.flatMap((row) => row.columns(10, 'tight'));
  const [truth, coverage, joint, selective] = panel.rows(4, 'normal');
  const labeled = s.value(0);
  const filter = s.value(0);
  const showCoverage = s.value(0);
  const rates = s.value(0);
  const drawing = dynamic(() => {
    const keys = legend.columns(2, 'normal');
    const marks = [
      place(note('One square per request'), legend, 'top'),
      place(label('●  billing', { color: 'blue', size: 33 }), keys[0], 'bottom'),
      place(label('●  technical', { color: 'cyan', size: 33 }), keys[1], 'bottom'),
      place(label('True label   technical', { color: 'cyan', size: 39 }), truth).opacity(
        labeled.value,
      ),
    ];
    records.forEach((record, i) => {
      const pair = record.set.length === 2;
      const col = cells[i];
      const opacity = pair ? 1 - 0.78 * filter.value : 1;
      marks.push(
        rect(col.width * 0.92, col.height * 0.92, {
          fill: null,
          stroke: !pair && filter.value > 0.99 ? 'yellow' : 'dim',
          width: pair ? 1 : 3,
        })
          .moveTo(col.point('center'))
          .opacity(opacity),
        dot(9, 'blue')
          .moveTo([col.cx - (pair ? 12 : 0), col.cy])
          .opacity(opacity),
      );
      if (pair)
        marks.push(
          dot(9, 'cyan')
            .moveTo([col.cx + 12, col.cy])
            .opacity(opacity),
        );
    });
    if (showCoverage.value)
      marks.push(
        place(
          mono(hits + ' / ' + records.length + ' sets cover the truth', { size: 37 }),
          coverage,
        ),
      );
    else
      marks.push(
        place(label('Pair     billing + technical', { size: 35 }), coverage),
        place(label('Singleton     billing', { size: 35 }), joint),
      );
    if (filter.value > 0.99) {
      marks.push(place(note('Send only the 10 singletons', { color: 'yellow' }), truth, 'bottom'));
      marks.push(
        place(note('Wrong answers / all arrivals'), joint, 'top'),
        place(note('Wrong answers / sent answers'), selective, 'top'),
      );
      marks.push(
        place(
          mono(rates.value >= 1 ? errors + ' / ' + records.length + ' = 10%' : '?', {
            color: 'red',
          }),
          joint,
        ),
        place(
          mono(rates.value >= 2 ? errors + ' / ' + accepted.length + ' = 100%' : '?', {
            color: 'red',
          }),
          selective,
        ),
      );
    }
    return marks;
  });
  s.add(heading(c.title), drawing);
  c.after('truth', () => labeled.set(1));
  c.after('coverage', () => showCoverage.set(1));
  c.on('select', () => s.play(filter.to(1, { duration: 1 })));
  c.after('joint', () => rates.set(1));
  c.after('selected', () => rates.set(2));
}
