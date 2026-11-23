import { assertEqual, barChart, column, fitted, place, row, to } from 'vizmatic/stage';
import { display, label, mono, note } from '../../kit-narrated.mjs';
import { fixtureTable, repositoryContext, rows, score, wrongRow } from '../parts.mjs';

export default function scoreScene(s, c) {
  const { main } = repositoryContext(s, c);
  const [evidence, gateBand, foot] = main.rows([5, 2, 1], 'wide');
  const [records, counts] = evidence.columns([3, 2], 'wide');
  const fixture = place(fixtureTable(rows, records.width, { maxRows: rows.length + 1 }), records);
  const tallies = place(
    fitted(counts, (width) =>
      barChart(
        [
          { label: 'correct', value: 0, color: 'green' },
          { label: 'total', value: 0, color: 'cyan' },
        ],
        {
          width,
          height: counts.height * 0.75,
          max: rows.length + 1,
          labelSize: 36,
          valueSize: 40,
          showValues: true,
          format: (n) => String(Math.round(n)),
        },
      ),
    ),
    counts,
    'bottom',
  );
  const a = score(rows),
    b = score([...rows, wrongRow]);
  const correctScale = 3,
    totalScale = 2;
  assertEqual(a.passes, correctScale * a.correct >= totalScale * a.total, 'integer gate');
  const rule = place(
    mono('3 × correct ≥ 2 × total', { size: 40, color: 'yellow' }),
    gateBand.rows(2, 'normal')[0],
  );
  const equality = place(
    display(`${correctScale * a.correct} ≥ ${totalScale * a.total}`, { color: 'green' }),
    gateBand.rows(2, 'normal')[1],
  );
  const failure = place(
    display(`${correctScale * b.correct} < ${totalScale * b.total}`, { color: 'red' }),
    gateBand.rows(2, 'normal')[1],
  );
  const rate = place(mono(`accuracy ${a.fraction.toFixed(3)}`, { color: 'green' }), foot);
  const tail = place(mono('request 103  }    end of file', { size: 38 }), foot);
  const separated = place(mono('request 103  }   0A   {  request 104', { size: 38, color: 'cyan' }), foot);
  const verdict = place(mono('accuracy ' + b.fraction.toFixed(3) + '    exit 1', { color: 'red' }), foot);
  s.add(fixture, tallies);
  c.show('integer-gate', rule);
  ['compare-first', 'compare-second', 'compare-third'].forEach((cue, i) => {
    const state = score(rows.slice(0, i + 1));
    c.after(cue, () =>
      s.play(
        fixture.light(String(101 + i)),
        tallies.update([state.correct, state.total], { duration: 0.8 }),
      ),
    );
  });
  c.show('rounded-score', rate, { after: true });
  c.show('integer-gate', equality, { after: true });
  c.hide(2, [equality, rate]);
  c.show(2, tail, { lead: -0.35 });
  c.swap('join-records', tail, separated);
  c.hide('failed-gate', separated);
  c.on('append-wrong', () => {
    s.play(
      fixture.append(
        {
          id: wrongRow.prompt.match(/\d+/)[0],
          expected: wrongRow.expected,
          prediction: wrongRow.prediction,
        },
        { duration: 0.8 },
      ),
      tallies.update([b.correct, b.total], { duration: 0.8 }),
    );
    s.play(
      fixture.light(wrongRow.prompt.match(/\d+/)[0]),
      to(fixture.row('103'), (n) => n.opacity(0.45)),
    );
  });
  c.show('failed-gate', [failure, verdict], { after: true });
}
