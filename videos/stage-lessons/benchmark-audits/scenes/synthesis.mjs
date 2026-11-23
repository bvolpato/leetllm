import { place, to } from 'vizmatic/stage';
import { area, heading, label, note, mono, chip } from '../../kit-narrated.mjs';
import { CASES, scoreCases } from '../parts.mjs';

export default function synthesis(s, c) {
  const [desk, row, detail, foot] = area.rows([1, 1.5, 2, 1], 'normal');
  const headingNode = heading('What belongs beside the library score?');
  const total = scoreCases('B');
  const renewal = CASES.filter((item) => item.category === 'renewal');
  const passes = renewal.filter((item) => item.B).length;
  const missed = renewal.find((item) => !item.B);
  const report = place(
    label(`Library assistant B     ${total.correct}/${total.total} overall`, { size: 54 }),
    desk,
  );
  const ask = place(label('Evidence for the renewal desk?', { color: 'yellow' }), detail);
  const slips = renewal.map((item, i) =>
    place(
      chip(item.id, { size: 32, color: item.B ? 'green' : 'red' }),
      row.columns(10, 'tight')[i],
    ),
  );
  const [metric, record] = detail.columns([1, 1], 'loose');
  const [count, floor] = metric.rows(2, 'normal');
  const [keySlot, whySlot] = record.rows(2, 'normal');
  const point = place(mono(`${passes}/${renewal.length} renewals passed`, { size: 43 }), count);
  const gate = place(note('Requirement   8/10'), floor);
  const missing = slips[renewal.indexOf(missed)];
  const why = place(note('Keep this missed answer for review'), whySlot);
  const boundary = place(note('This gate uses the observed ten cases'), foot);
  const inputs = place(note('Retain the input, output, scorer version and attempt costs'), foot);
  const used = place(
    label('Scorer development  →  regression suite', { color: 'pink', size: 38 }),
    foot,
  );
  s.add(headingNode, report);
  c.show('summary-ask', ask);
  c.swap('summary-count', ask, [slips, point], { after: true });
  c.show('summary-floor', gate, { after: true });
  c.show('summary-miss', why);
  c.on('summary-miss', () =>
    s.play(to(missing, (n) => n.moveTo(keySlot.point('center')), { duration: 0.8 })),
  );
  c.show('summary-scope', boundary);
  c.swap('summary-record', boundary, inputs);
  c.swap('summary-regression', inputs, used, { after: true });
}
