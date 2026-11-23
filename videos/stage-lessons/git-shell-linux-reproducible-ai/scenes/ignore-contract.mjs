import { indicate, place, table } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';

export default function ignoreContract(s, c) {
  const { main } = repositoryContext(s, c);
  const [pathsBand, commandBand, historyBand, warningBand] = main.rows([4, 1, 3, 1], 'normal');
  const paths = place(
    table(
      [
        { key: 'id', label: 'path', mono: true, sample: '.env.example' },
        { key: 'pattern', label: 'pattern', mono: true, sample: '!.env.example' },
        { key: 'selection', label: 'ordinary add', sample: 'trackable', marks: true },
      ],
      [
        { id: '.env', pattern: '.env*', selection: { value: '?', state: 'pending' } },
        { id: '.venv/', pattern: '.venv/', selection: { value: '?', state: 'pending' } },
        {
          id: '.env.example',
          pattern: '!.env.example',
          selection: { value: '?', state: 'pending' },
        },
        {
          id: 'eval/…jsonl',
          pattern: 'no match',
          selection: { value: '?', state: 'pending' },
        },
      ],
      { width: pathsBand.width, size: 34, leading: 1.9 },
    ),
    pathsBand,
  );
  const command = place(mono('git rm --cached .env', { size: 36, color: 'blue' }), commandBand);
  const history = place(
    table(
      [
        { key: 'id', label: 'tracked placeholder', sample: '.env' },
        { key: 'working', label: 'working file', sample: 'present', marks: true },
        { key: 'index', label: 'index', sample: 'selected', marks: true },
        { key: 'past', label: 'old commits', sample: 'present', marks: true },
      ],
      [
        {
          id: '.env',
          working: { value: 'present', state: 'pending' },
          index: { value: 'selected', state: 'pending' },
          past: { value: 'present', state: 'pending' },
        },
      ],
      { width: historyBand.width, size: 31 },
    ),
    historyBand,
  );
  const warning = place(
    note('Rotate exposed credentials. Inspect selected paths.', { color: 'red' }),
    warningBand,
  );
  s.add(paths);
  c.show('existing-file', history);
  c.on('ignore-patterns', () =>
    s.play(
      paths.light('.env.example'),
      paths.setCell('.env.example', 'selection', { value: 'trackable', state: 'pass' }),
    ),
  );
  c.on('ignore-local', () =>
    s.play(
      paths.setCell('.env', 'selection', { value: 'local', state: 'skip' }),
      paths.setCell('.venv/', 'selection', { value: 'local', state: 'skip' }),
    ),
  );
  c.on('ignore-fixture', () =>
    s.play(
      paths.light('eval/…jsonl'),
      paths.setCell('eval/…jsonl', 'selection', { value: 'trackable', state: 'pass' }),
    ),
  );
  c.on('tracked-ignore', () =>
    s.play(history.light('.env', 'index'), history.setCell('.env', 'index', { state: 'fail' })),
  );
  c.show('untrack-current', command);
  c.after('untrack-current', () =>
    s.play(
      history.setCell('.env', 'index', { value: 'removed', state: 'skip' }),
      history.setCell('.env', 'working', { state: 'pass' }),
    ),
  );
  c.on('old-history-remains', () =>
    s.play(history.light('.env', 'past'), history.setCell('.env', 'past', { state: 'fail' })),
  );
  c.show('rotate-exposed', warning);
}
