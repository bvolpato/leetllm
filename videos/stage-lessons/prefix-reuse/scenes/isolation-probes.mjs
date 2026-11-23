import { assertEqual, boxOf, column, line, place } from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { scopedKey } from '../../../films/prefix-reuse/model.mjs';
import { storedTokens } from '../../../films/prefix-reuse/fixtures.mjs';
import { board, caption, foot, guideVersion, pointAt, tenantLanes } from '../parts.mjs';

export default function isolationProbes(s, c) {
  board(s, c, 'Whose entry did the worker read?', 'Two verified sessions · ' + storedTokens.length + ' test tokens');
  const aKey = scopedKey('session A', '');
  const bKey = scopedKey('session B', '');
  const ownerByKey = new Map([[aKey.key, aKey.scope]]);
  const lookup = (request) => {
    const owner = ownerByKey.get(request.key);
    return { owner, read: owner ? storedTokens.length : 0 };
  };
  const aRead = lookup(aKey), bCold = lookup(bKey);
  ownerByKey.set(bKey.key, bKey.scope);
  const bRead = lookup(bKey);
  assertEqual(aRead.owner, aKey.scope, 'Session A reads the A entry.');
  assertEqual(bCold.read, 0, 'B starts cold with only the A entry stored.');
  assertEqual(bRead.owner, bKey.scope, 'A later B request reads the B entry.');

  const { headers, lanes, record } = tenantLanes();
  const [a, b] = lanes;
  const input = [guideVersion(a.cells[0], 7), guideVersion(b.cells[0], 8)];
  const same = guideVersion(b.cells[0], 7);
  c.take(input);
  c.take(lanes.flatMap((lane) => [lane.auth, lane.scope]));
  s.add(['Input', 'Session', 'Lookup scope', 'Entry owner'].map((words, i) =>
    caption(words, headers[i], { size: 34, color: 'dim' })));
  const owner = (lane, scope) => place(namedBox(scope, { width: 260, height: 78, color: 'blue' }), lane.cells[3]);
  const entryA = owner(a, aRead.owner), entryB = owner(b, bRead.owner);
  const empty = place(namedBox('Empty', { width: 260, height: 78, color: 'dim', dash: true }), b.cells[3]);
  const path = (lane, target, color) => line(boxOf(lane.scope).point('right'), boxOf(target).point('left'), {
    stroke: color, width: 4,
  });
  const readA = path(a, entryA, 'green'), readB = path(b, entryB, 'green');
  const logFields = record.columns(3, 'normal');
  const readings = [aRead, bCold, bRead].map((result, i) => {
    const request = ['A', 'B', 'B again'][i];
    return place(column([
      mono(request + '   ' + result.read + ' tokens read', { size: 31, color: result.read ? 'green' : 'cyan' }),
      note(result.owner ? 'Entry owner · ' + result.owner : 'No entry read', { size: 30 }),
    ], { gap: 'tight' }), logFields[i]);
  });
  const noteAt = (words, color) => caption(words, foot, { color, size: 40 });
  const ask = noteAt('Which session can read the stored copy?', 'yellow');
  const check = noteAt('Compare the verified scope with the owner of the entry used.', 'ink');
  c.swap('both-guides', input[1], same);
  c.show('scope-snapshot', [entryA, empty]);
  c.show('scope-question', ask);
  c.hide('a-read', ask);
  c.show('a-read', [readA, readings[0]], { after: true, lead: 0 });
  c.show('b-miss', readings[1], { after: true, lead: 0 });
  c.swap('b-write', empty, entryB, { after: true, lead: 0 });
  c.on('b-repeat', () => s.play(pointAt(b.auth)));
  c.show('b-read', [readB, readings[2]], { after: true, lead: 0 });
  c.on('audit-owner', () => s.play(pointAt(entryA), pointAt(entryB)));
  c.show('scope-evidence', check);
  c.on('scope-policy', () => s.play(pointAt(a.scope), pointAt(b.scope)));
}
