import { codeBlock, column, lanes, place } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, CLAIM_CODE, context } from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const [main, readouts] = BOARD.rows([3, 1], 'normal');
  const [source, workerArea] = main.columns([5, 6], 'wide');
  const code = place(
    codeBlock(CLAIM_CODE, { language: 'python', size: 34, leading: 1.4, panel: true }),
    source,
  );
  const race = place(
    lanes(
      ['A', 'B'],
      [
        { lane: 0, start: 0, end: 2, label: 'lock', color: 'yellow' },
        { lane: 0, start: 2.6, end: 8, label: 'fetch', color: 'blue' },
        { lane: 1, start: 3, end: 4.8, label: 'lock', color: 'yellow' },
        { lane: 1, at: 5.3, label: 'skip', labelSide: 'under', color: 'cyan' },
      ],
      {
        domain: [0, 8],
        width: workerArea.width * 0.78,
        size: 34,
        pitch: 145,
        barHeight: 62,
        ticks: [],
        cursor: false,
        axisLabel: 'one possible schedule',
      },
    ),
    workerArea,
  );
  const [stateArea, logArea] = readouts.columns([5, 6], 'wide');
  const read = (value, area) => place(mono(value, { size: 40 }), area);
  const empty = read('seen = set()', stateArea);
  const claimed = read('seen = {"/guide"}', stateArea);
  const before = read('calls = []', logArea);
  const one = read('calls = ["/guide"]', logArea);
  s.add(code, race, empty, before);
  c.on('claim-enter', () => s.play(race.advance(0.8), code.focus([1, 2], { color: 'yellow' })));
  c.after('claim-insert', () => s.play(code.focus(4, { color: 'yellow' })));
  c.swap('claim-insert', empty, claimed, { after: true });
  c.after('claim-release', () => s.play(race.advance(2.2)));
  c.on('claim-slow', () =>
    s.play(race.advance(4.7, { duration: 1 }), code.focus(7, { color: 'blue' })),
  );
  c.swap('claim-slow', before, one, { after: true });
  c.after('claim-skip', () => s.play(race.advance(8), code.focus([2, 3], { color: 'cyan' })));
  const sync = place(
    column([label('New URL   /docs'), mono('Barrier(2)', { color: 'yellow' })], { gap: 'wide' }),
    workerArea,
  );
  const pending = read('sorted(results) = ?', FOOT);
  const outcome = read('sorted(results) == [False, True]', FOOT);
  c.swap('claim-barrier', [race, claimed, one], [sync, pending]);
  c.swap('claim-verdict', pending, outcome, { after: true });
  c.after('claim-verdict', () => s.play(code.focus([1, 2, 3, 4], { color: 'green' })));
}
