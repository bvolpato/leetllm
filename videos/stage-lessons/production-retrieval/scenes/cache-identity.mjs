import { indicate, pipeline, place, seq, table } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, RULE } from '../parts.mjs';
export default function cacheIdentity(s, c) {
  const f = evidenceFrame(c);
  const [keyRoom, pathRoom] = f.work.rows([5, 3], 'wide');
  const key = place(
    table(
      ['dimension', 'cached', { key: 'request', marks: true }],
      [
        { id: 'scope', dimension: 'principal / region', cached: 'Luna / EU', request: 'Luna / EU' },
        { id: 'acl', dimension: 'ACL revision', cached: 'current grant', request: 'current grant' },
        {
          id: 'versions',
          dimension: 'index / prompt / model',
          cached: 'pinned bundle',
          request: 'pinned bundle',
        },
        { id: 'intent', dimension: 'intent', cached: 'rotation', request: 'rotation' },
        {
          id: 'ages',
          dimension: 'stale / signal',
          cached: RULE.requestDays + ' d / ' + RULE.requestHours + ' h',
          request: RULE.requestDays + ' d / ' + RULE.requestHours + ' h',
        },
        {
          id: 'audit',
          dimension: 'exact audit data',
          cached: 'controlled store',
          request: 'controlled store',
        },
      ],
      { width: f.work.width, size: 29, leading: 1.7 },
    ),
    keyRoom,
  );
  const flow = place(
    pipeline(['Cached yes', 'Bind inputs', 'Current grant'], {
      width: f.work.width,
      size: 31,
      gates: true,
    }),
    pathRoom,
  );
  const refuse = place(label('15 days cannot reuse the cached yes', { color: 'yellow' }), f.foot);
  s.add(heading(c.title), f.nodes, key, flow);
  carryIdentity(c, f);
  c.on('pr-key', () =>
    s.play(
      seq(
        flow.put({ id: 'Luna', color: 'blue' }, { duration: 0.4 }),
        flow.move('Luna', 'Bind inputs', { duration: 0.9 }),
      ),
    ),
  );
  c.on('pr-ages', () =>
    s.play(
      key.setCell(
        'ages',
        'request',
        { value: RULE.outsideDays + ' d / ' + RULE.requestHours + ' h', state: 'fail' },
        { duration: 0.7 },
      ),
    ),
  );
  c.after('pr-ages', () => s.play(flow.stop('Luna', { duration: 0.6 })));
  c.show('pr-ages', refuse, { after: true });
  c.on('pr-audit', () => s.play(key.light('audit')));
  c.clear(
    flow.items.map((n) => n.content),
    0.8,
    0.01,
  );
  c.clear(flow.rails, 0.7, 0.2);
}
