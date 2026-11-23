import { place, table } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { cast, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Separate the router input from the answer key'));
  const [top, bottom, foot] = work.rows([3, 3, 1], 'wide');
  const channels = place(
    table(
      [
        { key: 'id', label: 'Channel' },
        { key: 'value', label: 'Example', sample: 'unknown' },
        { key: 'use', label: 'Consumer' },
      ],
      [
        { id: 'Capture', value: 'R-406-a', use: 'Router' },
        { id: 'Output', value: '0.94', use: 'Router' },
        { id: 'Human label', value: 'unknown', use: 'Evaluation' },
      ],
      { size: 34, width: top.width },
    ),
    top,
  );
  const numeric = place(
    table(
      [
        { key: 'id', label: 'Value' },
        { key: 'state', label: 'Numeric output', sample: 'Rejected' },
      ],
      [
        { id: '0.94', state: 'Finite [0, 1]' },
        { id: 'True', state: 'Rejected' },
        { id: 'Infinity', state: 'Rejected' },
      ],
      { size: 34, width: bottom.width },
    ),
    bottom,
  );
  const divider = place(
    label('Human labels enter evaluation later.', { color: 'green', size: 34 }),
    foot,
  );
  s.add(channels, numeric);
  c.on('validate', () => s.play(channels.light('Capture')));
  c.on('unknown', () => s.play(channels.light('Human label')));
  c.on('numeric', () => s.play(numeric.light('0.94')));
  c.on('boolean', () => s.play(numeric.light('True')));
  c.on('separate', () => s.play(channels.light('Output')));
  c.show('answer-key', divider, { after: true });
}
