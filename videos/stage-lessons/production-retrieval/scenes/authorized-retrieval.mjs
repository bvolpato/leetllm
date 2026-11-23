import { indicate, pipeline, place, seq } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, RUN } from '../parts.mjs';
export default function authorizedRetrieval(s, c) {
  const f = evidenceFrame(c);
  const flow = place(
    pipeline(['Date', 'Region', 'ACL', 'Rank'], {
      width: f.work.width,
      lanes: 5,
      gates: true,
      tray: 'rejected payloads',
      counts: true,
      size: 27,
    }),
    f.work,
  );
  const names = ['K2', 'K1', 'US', 'S1', 'ADM'];
  const key = place(
    note('K2: key v2 · K1: expired key · US: US key · S1: sessions · ADM: admin'),
    f.foot,
  );
  const result = place(
    label(RUN.allowedCount + ' permitted records → reranker', { color: 'yellow' }),
    f.foot,
  );
  s.add(heading(c.title), f.nodes, flow, key);
  carryIdentity(c, f);
  c.on('trusted-request', () => s.play(indicate(f.identity.nodes, { scale: 1, color: 'blue' })));
  c.on('form-evidence-set', () => {
    s.play(
      flow.put(
        names.map((id, lane) => ({
          id,
          lane,
          color: id === 'K2' ? 'cyan' : id === 'S1' ? 'pink' : 'dim',
        })),
        { duration: 0.3 },
      ),
    );
    s.play(flow.stop('K1', 'expired', { duration: 0.2 }));
    s.wait(0.65);
    s.play(
      seq(
        flow.eject('K1', { duration: 0.3 }),
        flow.move(['K2', 'US', 'S1', 'ADM'], 'Region', { duration: 0.4 }),
        flow.stop('US', 'wrong region', { duration: 0.2 }),
      ),
    );
    s.wait(0.65);
    s.play(
      seq(
        flow.eject('US', { duration: 0.3 }),
        flow.move(['K2', 'S1', 'ADM'], 'ACL', { duration: 0.4 }),
        flow.stop('ADM', 'ACL denied', { duration: 0.2 }),
      ),
    );
    s.wait(0.65);
    s.play(flow.eject('ADM', { duration: 0.3 }));
  });
  c.on('rank-allowed', () =>
    s.play(
      seq(
        flow.move(['K2', 'S1'], 'Rank', { duration: 0.8 }),
        flow.setBadge('K2', String(RUN.hits[0].score), { duration: 0.3 }),
        flow.setBadge('S1', String(RUN.hits[1].score), { duration: 0.3 }),
      ),
    ),
  );
  c.on('preserve-permission', () => s.play(indicate(flow.names[2], { scale: 1, color: 'yellow' })));
  c.on('deny-near-match', () => s.play(indicate(flow.item('ADM'), { scale: 1, color: 'red' })));
  c.swap('permitted-only', key, result, { after: true });
  c.clear(
    flow.items.map((n) => n.content),
    0.8,
    0.01,
  );
  c.clear(flow.rails, 0.7, 0.2);
}
