import { assertEqual, column, dot, dynamic, line, place } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { incidentOutcome } from '../../../films/ab-testing/model.mjs';

export default function maturity(s, c) {
  const [scale, lanes, foot] = area.rows([1.1, 4, 1.25], 'normal');
  const [ids, tracks, states] = lanes.columns([1, 4.8, 1.35], 'normal');
  const rows = tracks.rows(3, 'tight');
  const x = (minute) => tracks.point('left')[0] + (tracks.width * minute) / 20;
  const center = (i) => rows[i].point('center')[1];
  const clock = s.value(0);
  const samples = [null, 10, 18].map((newPageAt, i) => {
    const name = place(mono('Incident ' + 'ABC'[i], { size: 35 }), ids.rows(3, 'tight')[i]);
    const status = incidentOutcome({ observedMinutes: 10, usableAt: 8, newPageAt });
    const slot = states.rows(3, 'tight')[i];
    return {
      name,
      rail: line([x(0), center(i)], [x(20), center(i)], { stroke: 'grid', width: 4 }),
      usable: dot(14, 'cyan').moveTo([x(8), center(i)]),
      page: newPageAt && dot(15, 'red').moveTo([x(newPageAt), center(i)]),
      pending: place(note('Pending', { color: 'yellow' }), slot),
      result: place(chip(status, { color: status === 'resolved' ? 'green' : 'red' }), slot),
    };
  });
  const boundary = line([x(10), tracks.point('top')[1]], [x(10), tracks.point('bottom')[1]], {
    stroke: 'yellow',
    dash: [10, 10],
    width: 3,
  });
  const minutes = [0, 8, 10, 18, 20].map((n) =>
    mono(String(n), { size: 36, color: n === 10 ? 'yellow' : 'dim' }).moveTo([
      x(n),
      scale.point('bottom')[1] - 15,
    ]),
  );
  const unit = place(
    label('Minutes since first question   ·   outcome closes at 10', { size: 36 }),
    scale,
    'top',
  );
  const cursor = dynamic(() =>
    rows.map((_, i) =>
      line([x(0), center(i) + 24], [x(clock.value), center(i) + 24], { stroke: 'ink', width: 3 }),
    ),
  );
  const usableNote = place(
    label('Blue mark = engineer marked the answer usable', { color: 'cyan' }),
    foot,
  );
  const question = place(
    label('At minute 9, which outcomes can enter the final count?', { color: 'yellow' }),
    foot,
  );
  const inside = place(label('New page at 10   ·   inside the window', { color: 'red' }), foot);
  const outside = place(label('New page at 18   ·   outside the window'), foot);

  s.add(
    heading(c.title),
    samples.map((v) => [v.name, v.rail]),
    boundary,
    minutes,
    unit,
    cursor,
  );
  c.on('eight', () => s.play(clock.to(8, { duration: 1 })));
  c.show('usable', [samples.map((v) => v.usable), usableNote]);
  c.on('nine', () => s.play(clock.to(9, { duration: 0.5 })));
  c.swap('ask', usableNote, question);
  c.show(
    'pending',
    samples.map((v) => v.pending),
  );
  c.on('deadline', () => s.play(clock.to(10, { duration: 0.6 })));
  c.show('page', samples[1].page);
  c.swap('page', question, inside);
  c.swap(
    'score',
    samples.map((v) => v.pending),
    samples.map((v) => v.result),
  );
  c.on('later', () => s.play(clock.to(18, { duration: 1 })));
  c.show('late-page', samples[2].page);
  c.swap('late-page', inside, outside);

  const [head, records, sum] = area.rows([1, 3, 1.5], 'wide');
  const slots = records.columns(3, 'wide');
  const cases = [
    { completed: true, usableAt: 6 },
    { completed: true, usableAt: 8 },
    { completed: false, usableAt: null },
  ];
  const resolvedCount = (cohort) =>
    cohort.filter((record) => incidentOutcome({ ...record, observedMinutes: 10 }) === 'resolved')
      .length;
  const completed = cases.filter((r) => r.completed);
  assertEqual(resolvedCount(cases), 2, 'resolved among all assigned rewrites');
  assertEqual(completed.length, 2, 'completed rewrites after excluding the timeout');
  const assigned = slots.map((slot, i) =>
    place(
      column(
        [
          mono('Rewrite ' + (i + 1), { size: 44, color: 'blue' }),
          label(cases[i].completed ? 'Usable at minute ' + cases[i].usableAt : 'Timeout, no mark', {
            size: 38,
          }),
        ],
        { gap: 'normal' },
      ),
      slot,
    ),
  );
  const cohort = place(label('Three assigned rewrites   ·   complete ten-minute logs'), head);
  const total = place(
    mono('Resolved   ' + resolvedCount(cases) + ' / ' + cases.length, { size: 55, color: 'blue' }),
    sum,
  );
  const selected = place(
    mono('Completed rewrites only   ' + resolvedCount(completed) + ' / ' + completed.length, {
      size: 50,
      color: 'red',
    }),
    sum,
  );
  const audit = place(label('An audit sample needs its own denominator.'), sum);
  c.swapAll('three', [heading('Which incidents belong in the denominator?'), cohort, assigned]);
  c.show('keep', total);
  c.hide('drop', assigned[2]);
  c.swap('drop', total, selected);
  c.show('restore', assigned[2]);
  c.swap('restore', selected, total);
  c.swap('audit', total, audit);
}
