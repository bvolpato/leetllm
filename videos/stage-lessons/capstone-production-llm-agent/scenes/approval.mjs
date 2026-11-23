import { arrow, draw, group, place } from 'vizmatic/stage';
import { packet, operation, reviewed } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading, label } from '../../kit-narrated.mjs';
import { C, field, fingerprint, paper, short } from '../parts.mjs';

export default function approval(s, c) {
  const [process, desk, foot] = area.rows([1, 6.5, 1], 'normal');
  const [left, right] = desk.columns(2, 'wide');
  const slots = (r) => r.inset('normal').rows([0.8, 1, 1, 0.9, 2.8], 'tight');
  const [packetHead, target, content, expiry, pHash] = slots(left);
  const [reviewHead, reviewer, decision, expiryCopy, rHash] = slots(right);
  const packetKey = short(operation) + '…';
  const tag = field(process, 'Process 1    stage    ·    clock 1000', C.ticket);
  const next = field(process, 'Process 2    execute    ·    same SQLite file', C.active);
  const approve = field(process, 'Process 3    approve    ·    same SQLite file', C.review);
  const retained = field(foot, 'Operation ID    ' + packetKey, C.stored);
  const unavailable = field(foot, 'blocked:not_approved', C.blocked);
  const decisionSaved = field(foot, 'approval_recorded', C.review);
  const firstWindow = field(foot, 'Same five inputs   →   same operation ID   →   first expiry kept', C.stored, 39);
  const subject = group(field(target, [packet.ticket, packet.account, packet.scope].join('   /   '), C.ticket, 44),
    field(content, 'Policy ' + short(packet.policy) + '…  +  exact draft', 'ink', 35));
  const clock = field(expiry, 'Expires at   ' + packet.expiresAt, C.active, 44);
  const pending = place(label('Awaiting a decision', { size: 44, color: 'dim' }), decision);
  const dbDigest = fingerprint(pHash, 'Full packet digest', reviewed, C.stored);
  const reviewDigest = fingerprint(rHash, 'Saved review digest', reviewed, C.review);
  const copied = arrow(dbDigest.band.point('right'), reviewDigest.band.point('left'),
    { stroke: C.review, width: 4 });
  s.add(heading(c.title), tag, paper(left, C.stored), paper(right),
    field(packetHead, 'PACKET', C.stored, 32), field(reviewHead, 'APPROVAL', C.review, 32), pending);
  c.show('stage-fields', subject);
  c.show('operation-key', retained, { after: true });
  c.show('first-expiry', clock, { after: true });
  c.swap('reopen-db', tag, next);
  c.swap('before-review', retained, unavailable, { after: true });
  c.swap('include-expiry', next, approve);
  c.show('include-expiry', [dbDigest.header, dbDigest.print]);
  c.swap('record-review', pending, [
    field(reviewer, 'manager-1   ·   fixture reviewer', C.review, 38),
    field(decision, 'Approved   ·   ' + packetKey, C.review, 43),
    field(expiryCopy, 'Reviewed expiry   ' + packet.expiresAt, C.review, 37),
    reviewDigest.header,
  ], { lead: 0, fade: 0.15 });
  c.on('record-review', () => s.play(draw(copied), { duration: 0.55 }));
  c.show('record-review', reviewDigest.print, { after: true });
  c.swap('record-review', unavailable, decisionSaved, { after: true });
  c.swap('restage', decisionSaved, firstWindow);
}
