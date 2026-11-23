import { codeBlock, indicate, lanes, place } from 'vizmatic/stage';
import { note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
export default function context(s, c) {
  const b = open(s, c, 'project-context'),
    [left, right] = WORK.columns(2, 'loose');
  const [docs, receipt] = left.rows([2, 3], 'normal');
  const evidence = place(
    codeBlock(
      'AUTHORS       Microsoft origins\nGOVERNANCE    TSC / LF AI & Data\nLICENSE       Apache-2.0 code\nCONTRIBUTING  DCO sign-off',
      { language: 'text', size: 30, leading: 1.2, padding: 16 },
    ),
    docs,
  );
  const version = place(
    codeBlock(
      'failure receipt\n  exact commit\n  resolved configuration\n  topology\n  smallest reproducer\n  earliest rank error',
      { language: 'text', size: 31, leading: 1.2, padding: 16 },
    ),
    receipt,
  );
  const [events, foot] = right.rows([4, 1], 'wide');
  const failures = place(
    lanes(
      ['first rank', 'peer rank'],
      [
        { lane: 'first rank', start: 0, end: 1, label: 'first exception', color: 'red' },
        { lane: 'peer rank', start: 1, end: 3, label: 'collective timeout', color: 'dim' },
      ],
      { width: events.width - 250, domain: [0, 3], size: 31, pitch: 110 },
    ),
    events,
  );
  const caption = place(note('Schematic failure order. Retain the first exception.'), foot);
  s.add(evidence, version, failures, caption);
  c.on('origins', () => s.play(indicate(evidence.find('AUTHORS'), { scale: 1, color: 'yellow' })));
  c.on('governance', () =>
    s.play(indicate(evidence.find('GOVERNANCE'), { scale: 1, color: 'yellow' })),
  );
  c.on('license', () => s.play(indicate(evidence.find('LICENSE'), { scale: 1, color: 'yellow' })));
  c.on('receipt', () =>
    s.play(indicate(version, { scale: 1, color: 'yellow' }), failures.advance(1, { duration: 1 })),
  );
  c.on('timeout', () => s.play(failures.advance(3, { duration: 1.5 })));
  c.on('first', () =>
    s.play(indicate(version.find('earliest rank error'), { scale: 1, color: 'red' })),
  );
  finish(c, b, 'project-context');
}
