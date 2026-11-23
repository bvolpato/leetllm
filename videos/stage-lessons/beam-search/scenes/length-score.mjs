import { column, indicate, numberLine, place, row } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { WIDTH_THREE } from '../../../films/beam-search/arithmetic.mjs';

export default function lengthScore(s, c) {
  const paths = ['slept', 'opened the door'].map((text) =>
    WIDTH_THREE.completed.find((x) => x.text === text),
  );
  const [header, body, foot] = area.rows([1, 4, 1.5], 'loose');
  const headings = place(
    row(
      [
        label('slept → EOS', { color: 'green' }),
        label('opened → the → door → EOS', { color: 'cyan' }),
      ],
      { gap: 'loose' },
    ),
    header,
  );
  const regions = body.rows(2, 'loose');
  const rulers = paths.map((path, i) =>
    place(
      numberLine({
        length: regions[i].width * 0.92,
        range: [-2.1, 0],
        ticks: [-2, -1.5, -1, -0.5, 0],
        size: 34,
        labelSize: 34,
        points: [
          {
            name: i === 0 ? 'slept' : 'opened the door',
            value: path.logProbability,
            color: i === 0 ? 'green' : 'cyan',
          },
        ],
      }),
      regions[i],
    ),
  );
  const raw = place(label('Raw joint log score'), foot, 'left');
  const normalized = place(label('Mean log score · EOS counts'), foot, 'left');
  const divisions = place(
    row(
      paths.map((path) =>
        mono(
          `${path.logProbability.toFixed(3)} / ${path.tokens.length} = ${path.meanLogProbability.toFixed(3)}`,
          { size: 34 },
        ),
      ),
      { gap: 'loose' },
    ),
    foot,
    'right',
  );
  s.add(heading(c.title), [headings, rulers, raw]);
  c.on('length-score-beat-1-focus-1', () =>
    s.play(indicate(rulers[0], { scale: 1, color: 'yellow' })),
  );
  c.on('length-score-beat-1-focus-2', () =>
    s.play(indicate(headings, { scale: 1, color: 'yellow' })),
  );
  c.swap('length-score-beat-2-focus-1', raw, normalized);
  c.onBeat(
    1,
    () =>
      s.play(
        ...rulers.map((ruler, i) =>
          ruler.move(
            { [i === 0 ? 'slept' : 'opened the door']: paths[i].meanLogProbability },
            { duration: 1.5 },
          ),
        ),
      ),
    c.beats[1].end - c.beats[1].start - 2,
  );
  c.show(1, divisions, { after: true });
  c.on('length-score-beat-3-focus-1', () =>
    s.play(indicate(normalized, { scale: 1, color: 'yellow' })),
  );
}
