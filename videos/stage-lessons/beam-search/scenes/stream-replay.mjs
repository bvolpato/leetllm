import { assertEqual, column, indicate, numberLine, place, row, tokens } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';

export default function streamReplay(s, c) {
  const [header, body, foot] = area.rows([1, 4.5, 1], 'wide');
  const title = place(note('Fixed row · local Random(7) · same call order'), header);
  const sequence = ['create', 'create', 'revoke', 'create', 'create', 'create', 'create', 'create'];
  const lanes = body.rows([1, 1, 2], 'wide');
  const frames = lanes
    .slice(0, 2)
    .map((region, i) =>
      place(tokens(Array(8).fill('…'), { size: 34, minWidth: 190, color: 'dim' }), region),
    );
  const rails = lanes.slice(0, 2).map((region) =>
    place(
      tokens(sequence, {
        size: 34,
        minWidth: 190,
        colors: sequence.map((word) => (word === 'create' ? 'cyan' : 'blue')),
      }),
      region,
    ),
  );
  const nearTie = place(
    numberLine({
      length: lanes[2].width * 0.8,
      range: [0.9999997, 1.0000003],
      ticks: [0.9999998, 1, 1.0000002],
      format: (v) => v.toFixed(7),
      size: 34,
      labelSize: 34,
      points: [
        { name: 'A', value: 0.9999999, color: 'cyan' },
        { name: 'B', value: 1.0000001, color: 'blue' },
      ],
    }),
    lanes[2],
  );
  const provenance = place(note('Random stream and model logits have separate provenance'), foot);
  s.add(heading(c.title), [title, frames, nearTie, provenance]);
  c.on('stream-replay-build-0', () => s.play(indicate(title, { scale: 1, color: 'yellow' })));
  c.swap('stream-result', frames, rails, { after: true });
  c.after(
    'stream-result',
    () => {
      for (let i = 0; i < 8; i++)
        s.play(...rails.map((rail) => rail.window(i, i, { duration: 0.2 })));
    },
    0.6,
  );
  c.after('stream-replay-build-1', () =>
    s.play(nearTie.move({ A: 1.0000001, B: 0.9999999 }, { duration: 1.4 })),
  );
}
