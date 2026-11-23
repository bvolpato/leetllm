import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { place, rect, to, indicate, assertEqual } from 'vizmatic/stage';
import { candidateFunnel } from '../parts.mjs';
import { AUTH } from '../../../films/embedding-geometry/fixtures.mjs';
import { authorizedSearch } from '../../../films/embedding-geometry/model.mjs';

export default function authorizedFunnel(s, c) {
  const [body, foot] = area.rows([7, 1], 'wide');
  const f = candidateFunnel(body, false);
  const target = (col, row) => f.cols[col].rows(3, 'normal')[row].point('center');
  const ring = rect(100, 100, { stroke: 'yellow', width: 5, fill: null }).moveTo(target(1, 0));
  const mode = place(label('unfiltered K = 1', { color: 'dim' }), foot, 'left');
  const one = place(label('K = 1: empty', { color: 'red' }), foot, 'left');
  const two = place(label('K = 2: Rotation survives', { color: 'yellow' }), foot, 'left');
  const native = place(label('K = 1 + prefilter: Rotation', { color: 'yellow' }), foot, 'left');
  const rejected = place(
    label('rejected', { color: 'red', size: 34 }),
    f.candidates[0].gate,
    'right',
  );
  const headerRegions = body.rows([1, 6, 1], 'wide')[0].columns(4, 'wide');
  const permissionFirst = place(
    label('permission', { color: 'yellow', size: 34 }),
    headerRegions[1],
  );
  const shortlistSecond = place(label('shortlist', { color: 'dim', size: 34 }), headerRegions[2]);
  const bits = (v) => v.map((x) => Number(x > 0)).join('');
  const ordered = authorizedSearch(3).rows;
  const distances = ordered.map((row, i) =>
    place(
      mono(bits(row.vector) + '   H = ' + row.hamming, { size: 30 }),
      f.candidates[i].start,
      'bottom left',
    ),
  );
  const queryCode = place(
    note('Query signs   ' + bits(AUTH.query)),
    body.rows([1, 6, 1], 'wide')[2],
    'left',
  );
  const ask = place(
    label('Who can be fetched from one unfiltered slot?', { color: 'yellow', size: 40 }),
    foot,
  );
  const wider = place(label('Unfiltered shortlist    K = 2'), foot, 'left');
  const reset = place(label('Filter during search    K = 1'), foot, 'left');
  assertEqual(authorizedSearch(2).winner, 'Rotation', 'one allowed survivor at two');
  assertEqual(authorizedSearch(1, true).winner, 'Rotation', 'prefiltered winner at one');
  s.add(heading(c.title), f.nodes, mode, queryCode);
  c.show('tie', distances);
  c.swap('ask', mode, ask);

  c.on('tie', () => s.play(indicate(f.marks.slice(0, 2), { scale: 1 })));
  c.on('select', () => s.play(to(f.marks[0], (n) => n.moveTo(target(1, 0)), { duration: 1.1 })));
  c.show('select', ring, { after: true });
  c.on('denied', () => s.play(to(f.marks[0], (n) => n.moveTo(target(2, 0)), { duration: 1.1 })));
  c.hide('denied', f.rails[2]);
  c.show('denied', rejected, { after: true });
  c.hide('denied', [f.marks[0], ring], { after: true });
  c.swap('empty', ask, one, { after: true });
  assertEqual(authorizedSearch(1).winner, null, 'denied shortlist is empty');
  c.swap('widen', one, wider);
  c.on('widen', () => s.play(to(f.marks[1], (n) => n.moveTo(target(1, 1)), { duration: 1 })));
  c.on('survive', () => s.play(to(f.marks[1], (n) => n.moveTo(target(2, 1)), { duration: 1 })));
  c.swap('survive', wider, two, { after: true });
  c.on('rescore', () => s.play(to(f.marks[1], (n) => n.moveTo(target(3, 1)), { duration: 1.5 })));
  c.swap('native', two, reset);
  c.swap('native', [f.headers[1], f.headers[2]], [permissionFirst, shortlistSecond]);
  c.hide('native', rejected);
  c.on('native', () =>
    s.play(
      to(f.gate, (n) => n.moveTo(f.cols[1].point('center')), { duration: 1 }),
      to(f.marks[1], (n) => n.moveTo(target(0, 1)), { duration: 0.2 }),
    ),
  );
  c.on('native', () => s.play(to(f.marks[1], (n) => n.moveTo(target(1, 1)), { duration: 1 })), 1.2);
  c.on('native', () => s.play(to(f.marks[1], (n) => n.moveTo(target(2, 1)), { duration: 1 })), 2.4);
  c.swap('kept', reset, native, { after: true });
  c.on('access', () => s.play(to(f.marks[1], (n) => n.moveTo(target(3, 1)), { duration: 1.5 })));
}
