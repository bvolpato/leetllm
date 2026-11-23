import { arrayCells, boxOf, column, dot, dynamic, place, rect, table, to } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';
import { bisectTrace } from '../../../films/git-shell-linux-reproducible-ai/model.mjs';
import { commitFixtures } from '../../../films/git-shell-linux-reproducible-ai/fixtures.mjs';

export default function history(s, c) {
  const { main } = repositoryContext(s, c);
  const [commandBand, stripBand, evidenceBand, foot] = main.rows([1, 2, 4, 1], 'wide');
  const command = place(mono('./repro.sh', { color: 'blue' }), foot);
  const commits = place(
    arrayCells(
      commitFixtures.map((_, i) => `c${i}`),
      { cell: 112, gap: 45, size: 40, indices: false, color: 'dim' },
    ),
    stripBand,
  );
  const trace = bisectTrace();
  const points = commitFixtures.map((_, i) => boxOf(commits.cell(i)).point('center'));
  const goodMarker = mono('good', { size: 34, color: 'green' }).moveTo([
    points[0][0],
    commandBand.point('center')[1],
  ]);
  const badMarker = mono('bad', { size: 34, color: 'red' }).moveTo([
    points.at(-1)[0],
    commandBand.point('center')[1],
  ]);
  const first = points[0],
    step = points[1][0] - first[0];
  const low = s.value(0),
    high = s.value(commitFixtures.length - 1);
  const trackY = stripBand.point('bottom')[1];
  const interval = dynamic(() =>
    rect((high.value - low.value) * step + 112, 12, { fill: 'yellow', stroke: 'yellow' }).moveTo([
      first[0] + ((low.value + high.value) * step) / 2,
      trackY,
    ]),
  );
  const cursor = dot(13, 'blue').moveTo([first[0], stripBand.point('top')[1]]);
  const evidence = place(
    table(
      [
        { key: 'id', label: 'test', mono: true },
        { key: 'result', label: 'same gate', sample: '2/4 FAIL', marks: true },
        { key: 'boundary', label: 'remaining interval', sample: 'c3 … c7' },
      ],
      [],
      { width: evidenceBand.width, size: 36, leading: 2.0, maxRows: trace.checks.length },
    ),
    evidenceBand,
  );
  const result = place(label(`First bad: c${trace.firstBad}`, { color: 'yellow' }), foot);
  s.add(command, commits, interval, cursor, evidence, goodMarker, badMarker);
  const cues = ['bisect-three', 'bisect-five', 'bisect-four'];
  let lo = 0,
    hi = commitFixtures.length - 1;
  trace.checks.forEach((check, i) => {
    if (check.good) lo = check.mid;
    else hi = check.mid;
    const nextLow = lo,
      nextHigh = hi;
    c.on(cues[i], () =>
      s.play(
        to(cursor, (n) => n.moveTo([points[check.mid][0], stripBand.point('top')[1]]), {
          duration: 0.6,
        }),
      ),
    );
    c.after(cues[i], () =>
      s.play(
        low.to(nextLow, { duration: 0.8 }),
        to(goodMarker, (n) => n.moveTo([points[nextLow][0], commandBand.point('center')[1]]), {
          duration: 0.8,
        }),
        to(badMarker, (n) => n.moveTo([points[nextHigh][0], commandBand.point('center')[1]]), {
          duration: 0.8,
        }),
        high.to(nextHigh, { duration: 0.8 }),
        evidence.append({
          id: 'c' + check.mid,
          result: { value: check.result.correct + '/' + check.result.total + (check.good ? ' PASS' : ' FAIL'),
            state: check.good ? 'pass' : 'fail' },
          boundary: 'c' + nextLow + ' … c' + nextHigh,
        }, { duration: 0.6 }),
      ),
    );
  });
  c.swap('first-bad', command, result, { after: true });
}
