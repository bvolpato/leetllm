import { arrow, assertEqual, boxOf, dot, dynamic, group, line, place, table } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { VALIDATION_STATES, BODY, open } from '../parts.mjs';
const FIRST = 41,
  AWAY = FIRST + 1,
  RETURNED = AWAY + 1;
assertEqual(RETURNED, 43, 'alias generation never rewinds');
export default function aliasGeneration(s, c) {
  const [top, historyRoom, compareRoom, foot] = BODY.rows([1, 3, 3, 1], 'wide');
  const title = place(
    note('Proposed atomic commit: expected release + generation → pointer + audit event'),
    top,
  );
  const cells = historyRoom.columns(3, 'loose');
  const records = [
    ['v0', FIRST],
    ['v2', AWAY],
    ['v0', RETURNED],
  ];
  const boxes = records.map(([release, generation], i) =>
    place(
      table(
        [
          { key: 'field', label: 'alias state' },
          { key: 'value', label: 'value', sample: RETURNED, mono: true },
        ],
        [
          { id: 'release', field: 'release', value: '?' },
          { id: 'generation', field: 'generation', value: '?' },
        ],
        { states: VALIDATION_STATES, size: 36, width: cells[i].width, leading: 1.8 },
      ),
      cells[i],
    ),
  );
  const pos = s.value(0);
  const y = historyRoom.bottom + 14;
  const track = group(
    line([cells[0].point('center')[0], y], [cells[2].point('center')[0], y], {
      stroke: 'grid',
      width: 4,
    }),
  );
  const marker = dynamic(() => [
    dot(13, 'yellow').moveTo([
      cells[0].point('center')[0] +
        ((cells[2].point('center')[0] - cells[0].point('center')[0]) * pos.value) / 2,
      y,
    ]),
  ]);
  const compare = place(
    table(
      [
        { key: 'field', label: 'compare before commit' },
        { key: 'expected', label: 'expected', sample: FIRST, mono: true },
        { key: 'current', label: 'current', mono: true, sample: '43' },
        { key: 'result', label: 'decision', marks: true, sample: 'MATCH' },
      ],
      [
        { id: 'release', field: 'release label', expected: '?', current: '?', result: '?' },
        { id: 'generation', field: 'generation', expected: '?', current: '?', result: '?' },
      ],
      { states: VALIDATION_STATES, size: 36, width: compareRoom.width, leading: 2 },
    ),
    compareRoom,
  );
  const limit = place(
    label('Sequential Python assignment has no distributed atomic commit', { color: 'yellow' }),
    foot,
  );
  open(s, c);
  s.add(title, boxes, track, marker, compare, limit);
  c.on('alias-generation-b1', () => s.play(compare.light('release')));
  c.on('alias-generation-b2', () =>
    s.play(
      boxes[0].setCell('release', 'value', 'v0'),
      boxes[0].setCell('generation', 'value', FIRST),
      compare.setCell('release', 'expected', 'v0'),
      compare.setCell('release', 'current', 'v0'),
      compare.setCell('generation', 'expected', FIRST),
      compare.setCell('generation', 'current', FIRST),
      boxes[0].light('generation'),
    ),
  );
  c.on('alias-generation-away', () =>
    s.play(
      boxes[1].setCell('release', 'value', 'v2'),
      boxes[1].setCell('generation', 'value', AWAY),
      pos.to(1, { duration: 1.2 }),
      compare.setCell('release', 'current', 'v2'),
      compare.setCell('generation', 'current', AWAY),
    ),
  );
  c.on('alias-generation-returned', () =>
    s.play(
      boxes[2].setCell('release', 'value', 'v0'),
      boxes[2].setCell('generation', 'value', RETURNED),
      pos.to(2, { duration: 1.2 }),
      compare.setCell('release', 'current', 'v0'),
      compare.setCell('generation', 'current', RETURNED),
    ),
  );
  c.after('pipe-result-aba-stale-comparison', () =>
    s.play(
      compare.setCell('release', 'result', { value: 'MATCH', state: 'pass' }),
      compare.setCell('generation', 'result', { value: 'STALE', state: 'fail' }),
      compare.light('generation'),
    ),
  );
  c.on('alias-generation-b3', () => s.play(boxes[2].light('release')));
  c.on('alias-workers', () => s.play(compare.light('release')));
}
