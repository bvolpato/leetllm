import { assertEqual, boxOf, dot, line, place, to } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { scopedKey } from '../../../films/prefix-reuse/model.mjs';
import { board, caption, guideVersion, readings, tenantLanes } from '../parts.mjs';

export default function isolation(s, c) {
  board(
    s,
    c,
    'Which tenant can select the stored guide?',
    'Private sharing · authenticated sessions',
  );
  const keys = ['A', 'B'].map((id) => scopedKey('session ' + id, 'tenant A'));
  assertEqual(keys[0].key === keys[1].key, false, 'The verified scopes produce separate keys.');
  const { headers, lanes } = tenantLanes();
  s.add(
    ['Incoming guide', 'Gateway', 'Namespace', 'Key prefix'].map((t, i) =>
      caption(t, headers[i], { color: 'dim', size: 34 }),
    ),
  );
  const paths = lanes.map(({ cells, auth, scope }, i) => {
    const tag = guideVersion(cells[0], 7);
    const key = place(
      mono(keys[i].key.slice(0, 9), { size: 40, color: i ? 'pink' : 'green' }),
      cells[3],
    );
    const points = cells.map((cell) => [cell.cx, boxOf(scope).bottom + 32]);
    const bead = dot(13, 'yellow').moveTo(points[1]);
    s.add(tag, auth, bead);
    return { tag, auth, scope, key, bead, points, cells };
  });
  const b = paths[1];
  const claim = caption('Claims A', b.cells[0], { color: 'red', size: 32 });
  const gateway = b.cells[1].left;
  const claimY = boxOf(b.tag).top - 30;
  const claimHalf = boxOf(claim).width / 2;
  claim.moveTo([b.cells[0].cx, claimY]);
  const stop = line([gateway, claimY - 20], [gateway, claimY + 20], { stroke: 'red', width: 5 });
  const revision = guideVersion(b.cells[0], 8);
  const replacement = place(
    mono(scopedKey('session B', 'tenant A', 'guide 8').key.slice(0, 9), {
      size: 40,
      color: 'pink',
    }),
    paths[1].cells[3],
  );
  c.show(
    'authenticated-scope',
    paths.map((r) => r.scope),
  );
  c.on('authenticated-scope', () => s.play(to(paths[0].bead, (n) => n.moveTo(paths[0].points[2]))));
  c.show('scoped-key', paths[0].key, { after: true });
  c.show('untrusted-label', [claim, stop]);
  c.on(
    'untrusted-label',
    () => s.play(to(claim, (n) => n.moveTo([gateway - claimHalf - 14, claimY]))),
    0.32,
  );
  c.on('trusted-session', () => s.play(to(paths[1].bead, (n) => n.moveTo(paths[1].points[2]))));
  c.after('distinct-key', () => s.play(to(paths[1].bead, (n) => n.moveTo(paths[1].points[3]))));
  c.show('distinct-key', paths[1].key, { after: true });
  c.hide('version-key', [claim, stop]);
  c.swap('version-key', b.tag, revision);
  c.swap('version-key', paths[1].key, replacement, { after: true });
  c.keep(paths.flatMap((p) => [p.auth, p.scope]));
  c.keep([paths[0].tag, revision]);
  readings(s, c, 'Both requests carry identical guide tokens.', [
    ['trusted-session', 'The verified session selects B.', 'blue'],
    ['distinct-key', 'B cannot read A’s private entry.', 'red'],
    ['version-key', 'Changing the guide revision also changes the digest.', 'pink'],
    ['sharing-authority', 'Authentication decides who can share.'],
  ]);
}
