import { approval, exchanges, limit, mandatory, output } from '../../films/context-packing/fixtures.mjs';
import { pack, verifyNote } from '../../films/context-packing/model.mjs';

export const small = { capacity: limit, rules: mandatory / 2, question: mandatory / 2, reserve: output };
export const fresh = { capacity: 40, rules: 6, question: 2, reserve: 12 };

// The unit costs stand in for complete serialized packets. Order is chronological in the prompt.
export const newest = { ...exchanges[0], tag: 'E3', order: 3, color: 'green', text: 'Rollback complete.' };
export const middle = { ...exchanges[1], tag: 'E2', order: 2, color: 'blue', text: 'Deploy owner requested rollback.' };
export const oldest = { ...exchanges[2], tag: 'E1', order: 1, color: 'yellow' };
export const source = { ...approval, version: 3, requestedBy: 'deploy owner', reason: 'Canary callback returned HTTP 500.' };
export const draft = { approved: true, actor: source.requestedBy, source: source.source, version: source.version };
export const checked = { ...draft, actor: source.actor };
export const notePacket = { tag: 'D1', units: 4, order: 1, color: 'yellow', evidence: checked };
export const freshNote = { ...notePacket, units: 6 };
export const freshRecent = { ...newest, units: 8 };
export const excerpt = { ...freshNote, units: 9, evidence: { ...checked, reason: source.reason } };

export function matchesRecord(note) {
  return verifyNote(note) && note.version === source.version;
}

export function packRequest(shape, candidates = []) {
  return pack(candidates, shape.rules + shape.question, shape.reserve, shape.capacity);
}

export function citedAnswer(request, field) {
  return request.kept.find(packet => packet.evidence && matchesRecord(packet.evidence))?.evidence[field];
}
