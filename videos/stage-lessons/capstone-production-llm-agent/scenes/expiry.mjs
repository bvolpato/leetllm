import { dot, line, place, to } from 'vizmatic/stage';
import { execute, operation, packet, packetBinding, reviewed } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { C, field, fingerprint, paper, records, short } from '../parts.mjs';

export default function expiry(s, c) {
  const [meta, body, result, foot] = area.rows([1, 4.8, 1, 1], 'normal');
  const [ruler, ledger] = body.columns([3, 1.65], 'wide');
  const [cap, ticks, values] = ruler.inset('normal').rows([1, 1, 1], 'normal');
  const times = [1298, 1299, packet.expiresAt, 1301];
  const pts = ticks.columns(4).map((r) => r.point('center'));
  const marks = pts.map(([x, y], i) => line([x, y - 24], [x, y + 24], {
    stroke: times[i] === packet.expiresAt ? C.review : 'dim', width: 4,
  }));
  const marker = dot(18, C.active).moveTo(pts[1]);
  const axis = [
    paper(ruler), field(cap, 'Execution clock   ·   deadline 1300', C.review),
    line(pts[0], pts[3], { stroke: 'dim', width: 4 }), marks,
    values.columns(4).map((r, i) => place(mono(String(times[i]), { size: 38 }), r)),
  ];
  const [countTitle, number, key] = ledger.inset('normal').rows([1, 2, 1], 'normal');
  const effects = new Set([operation]);
  const countBefore = field(countTitle, 'Effects before retry', C.effect);
  const countAfter = field(countTitle, 'Effects after retry', C.effect);
  const row = [paper(ledger, C.effect),
    place(label(String(effects.size), { size: 108, color: C.effect }), number),
    place(mono(short(operation) + '…', { size: 36 }), key)];
  const execution = field(meta, 'Same operation   ·   same packet   ·   same approval', C.stored);
  const previous = field(result, '1299    ' + execute({ now: 1299, effects }), C.stored);
  const expired = field(result, '1300    ' + execute({ now: 1300, effects }), C.blocked);
  const ask = field(foot, 'At 1300, what does execute return? How many restores remain?', C.active);
  const prior = field(foot, 'Deadline reached    ·    the earlier commit stays in the table', C.effect);
  s.add(heading(c.title), execution, axis, row, countBefore);
  c.show('before-boundary', marker);
  c.show('before-result', previous, { after: true });
  c.hide('at-boundary', previous);
  c.on('at-boundary', () => s.play(to(marker, (n) => n.moveTo(pts[2]), { duration: 0.65 })));
  c.show('at-boundary', ask, { after: true });
  c.show('expiry-verdict', expired, { after: true });
  c.swap('prior-count', [ask, countBefore], [prior, countAfter], { after: true });

  const [left, right] = body.columns(2, 'wide');
  const db = field(meta, 'Fresh database   ·   operator request   ·   0 committed effects', C.stored);
  const stored = fingerprint(left, 'Stored packet', reviewed, C.stored, packet.expiresAt);
  const saved = fingerprint(right, 'Saved approval', reviewed, C.review, packet.expiresAt);
  const updated = { ...packet, expiresAt: 2300 };
  const changed = fingerprint(left, 'Stored packet', packetBinding(updated), C.stored, updated.expiresAt);
  const restaged = field(foot, 'Stage again at 1200    ·    same operation ID', C.stored);
  const now = field(result, 'Execution clock    1301', C.active);
  const denied = field(foot, 'blocked:packet_changed    ·    0 committed effects', C.blocked);
  const sheets = [paper(left), paper(right)];
  c.swap('fresh-case', [execution, axis, row, marker, expired, prior, countAfter],
    [db, sheets, stored.header, stored.print, saved.header, saved.print]);
  c.show('restage-time', restaged);
  c.swap('change-field', stored.print, changed.print, { after: true });
  c.show('execute-time', now);
  c.swap('binding-fails', restaged, denied, { after: true });

  const rows = records(body, [
    ['id', 'One change per run', 0.40], ['status', 'Executor return', 0.40], ['rows', 'Effects', 0.20],
  ], [{ id: 'Verification revoked' }, { id: 'Account scope changed' }, { id: 'Ticket reworded' }], { size: 41 });
  const cases = [
    ['revoke-live', 'Verification revoked', { currentVerified: false }],
    ['rescope-live', 'Account scope changed', { currentScope: 'admin' }],
    ['reword-live', 'Ticket reworded', { currentTicketMatches: false }],
  ];
  const separate = field(meta, 'Three fresh databases   ·   original packet and approval', C.stored);
  c.swap('live-cases', [db, sheets, stored.header, saved.header, saved.print, changed.print, now, denied], [separate, rows]);
  for (const [cue, id] of cases) c.on(cue, () => s.play(rows.light(id)));
  c.after('stale-result', () => {
    for (const [, id, input] of cases) {
      const local = new Set();
      const outcome = execute({ ...input, effects: local });
      s.play(rows.setCell(id, 'status', outcome), rows.setCell(id, 'rows', local.size), { duration: 0.28 });
    }
  });
}
