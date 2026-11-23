import { barChart, indicate, place, tokens } from 'vizmatic/stage';
import { heading, area, mono, note } from '../../kit-narrated.mjs';
import { OPENING, NEXT } from '../../../films/beam-search/fixtures.mjs';
import { WIDTH_THREE } from '../../../films/beam-search/arithmetic.mjs';

export default function stopping(s, c) {
  const [header, shortLane, longLane, foot] = area.rows([1, 2, 2, 1.4], 'wide');
  const premise = place(note('Width 3 · four generated tokens · only EOS completes'), header);
  const short = place(
    tokens(['Mia', 'slept', 'EOS'], {
      size: 40,
      colors: ['dim', 'green', 'dim'],
      states: { kept: {}, complete: { color: 'yellow', mark: 'check' } },
    }),
    shortLane,
    'left',
  );
  const long = place(
    tokens(['Mia', 'opened', 'the', 'door', 'EOS'], {
      size: 40,
      color: 'cyan',
      states: { kept: {}, complete: { color: 'yellow', mark: 'check' } },
    }),
    longLane,
    'left',
  );
  const paths = ['slept', 'opened the door'].map((text) =>
    WIDTH_THREE.completed.find((x) => x.text === text),
  );
  const factors = (path) =>
    path.tokens.map(
      (token, i) =>
        (i === 0 ? OPENING : NEXT[path.tokens.slice(0, i).join(' ')]).find(
          ([word]) => word === token,
        )[1],
    );
  const inputs = paths.map(factors);
  const scores = [shortLane, longLane].map((region, i) =>
    place(
      mono(
        `${inputs[i].map((v) => v.toFixed(2)).join(' × ')} = ${paths[i].probability.toFixed(3)}`,
        { color: i === 0 ? 'green' : 'cyan', size: 34 },
      ),
      region,
      'right',
    ),
  );
  const opening = [shortLane, longLane].map((region, i) =>
    place(
      barChart([{ label: 'opening p', value: inputs[i][0], color: i === 0 ? 'green' : 'cyan' }], {
        horizontal: true,
        width: 650,
        height: 110,
        max: 0.5,
        reference: [0.5],
        labelSize: 34,
        showValues: false,
      }),
      region,
      'right',
    ),
  );
  const active = place(note('looked outside again quietly: unfinished at horizon 4'), foot);
  s.add(heading(c.title), [premise, short, long, opening]);
  c.on('stopping-beat-1-focus-1', () => s.play(short.mark(2, 'complete', { duration: 0.7 })));
  c.on('stopping-beat-2-focus-1', () => s.play(indicate(premise, { scale: 1, color: 'yellow' })));
  c.on('stopping-beat-2-focus-2', () => s.play(long.mark(4, 'complete', { duration: 0.7 })));
  c.swap('stop-short-result', opening[0], scores[0], { after: true });
  c.swap('stop-long-result', opening[1], scores[1], { after: true });
  c.show('stopping-beat-3-focus-1', active);
}
