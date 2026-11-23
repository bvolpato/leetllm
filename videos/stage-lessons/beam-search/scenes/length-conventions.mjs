import { assertEqual, column, indicate, numberLine, place, row, tokens } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';

export default function lengthConventions(s, c) {
  const logs = [-1, -1.6],
    lengths = [2, 5];
  const mean = logs.map((v, i) => v / lengths[i]);
  const gnmt = logs.map((v, i) => v / ((5 + lengths[i]) / 6));
  assertEqual(0.99 * 0.9, 0.891, 'separate longer EOS completion');
  const [header, body, footer] = area.rows([1.2, 4, 1.3], 'loose');
  const premise = place(
    row(
      [
        mono(`short: log ${logs[0]}, length ${lengths[0]}`),
        mono(`long: log ${logs[1]}, length ${lengths[1]}`),
      ],
      { gap: 'loose' },
    ),
    header,
  );
  const regions = body.rows(2, 'loose');
  const rulers = ['short', 'long'].map((name, i) =>
    place(
      numberLine({
        length: regions[i].width * 0.88,
        range: [-1.7, 0],
        ticks: [-1.5, -1, -0.5, 0],
        size: 34,
        labelSize: 34,
        points: [{ name, value: logs[i], color: i === 0 ? 'cyan' : 'blue' }],
      }),
      regions[i],
    ),
  );
  const footRows = footer.rows(2, 'tight');
  const counter = place(
    mono('EOS: .01     create → EOS: .99 × .90 = .891', { size: 34 }),
    footRows[0],
  );
  const meanRule = place(
    label(`Mean log: ${mean[0].toFixed(3)} versus ${mean[1].toFixed(3)}`, { color: 'yellow' }),
    footRows[1],
  );
  const gnmtRule = place(
    label(`GNMT α = 1: ${gnmt[0].toFixed(3)} versus ${gnmt[1].toFixed(3)}`, { color: 'yellow' }),
    footRows[1],
  );
  s.add(heading(c.title), [premise, rulers]);
  c.show('length-conventions-build-0', counter, { after: true });
  c.show('convention-mean', meanRule, { after: true });
  c.after('convention-mean', () =>
    s.play(
      ...rulers.map((ruler, i) =>
        ruler.move({ [i === 0 ? 'short' : 'long']: mean[i] }, { duration: 1.4 }),
      ),
    ),
  );
  c.on('length-conventions-build-1', () => s.play(indicate(rulers, { scale: 1, color: 'yellow' })));
  c.after('convention-gnmt', () =>
    s.play(
      ...rulers.map((ruler, i) =>
        ruler.move({ [i === 0 ? 'short' : 'long']: gnmt[i] }, { duration: 1.4 }),
      ),
    ),
  );
  c.swap('convention-gnmt', meanRule, gnmtRule, { after: true });
}
