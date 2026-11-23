import { circle, group, line, place, svgPath } from 'vizmatic/stage';
import { area, chip, heading, label, mono, para } from '../../kit-narrated.mjs';
import { packet } from '../../../films/capstone-production-llm-agent/model.mjs';
import { C, countQuery, evidence, field, paper, question } from '../parts.mjs';

function key() {
  const blade = svgPath(
    'M -90 -41 L 214 -41 L 252 -3 L 224 25 L 192 25 L 166 51 L 139 25 ' +
    'L 105 59 L 73 26 L -90 26 Z',
    { fill: C.active, stroke: null },
  );
  const bow = circle(104, { fill: C.active, stroke: null }).moveTo([-150, 0]);
  const hole = circle(36, { fill: 'bg', stroke: null }).moveTo([-178, -5]);
  const groove = line([-40, -21], [196, -21], { stroke: 'bg', width: 7 });
  return group(blade, bow, hole, groove).rotate(-0.18);
}

export default function intro(s, c) {
  const [desk, audit, decision] = area.rows([5.4, 1.65, 0.85], 'wide');
  const [account, document] = desk.columns([2, 3], 'loose');
  const [accountName, item, status] = account.rows([1, 3.5, 1.2], 'tight');
  const [docHead, docBody, docFoot] = document.inset('wide').rows([1, 3.6, 0.85], 'normal');
  const ticketTitle = field(docHead, 'Support ticket   ' + packet.ticket, C.ticket, 44);
  const inquiry = place(para(question, docBody.width, { size: 58 }), docBody, 'left');
  const ticketType = field(docFoot, 'Policy inquiry', C.ticket, 35);
  const seal = line(docFoot.point('top left'), docFoot.point('top right'), {
    stroke: 'dim', width: 2, dash: [9, 9],
  });
  const sourceTitle = field(docHead, 'Reviewed policy', C.stored, 44);
  const policy = place(para(evidence.policy, docBody.width, { size: 46 }), docBody, 'left');
  const citation = field(docFoot, evidence.policyId, C.stored, 35);
  const draftTitle = field(docHead, 'Draft for human review', C.ticket, 44);
  const [query, count] = audit.inset('normal').columns([4, 1], 'wide');
  const [measure, sql] = query.rows(2, 'tight');
  const unknown = place(label('?', { size: 82, color: C.active }), count);
  const zero = place(mono('0', { size: 82, color: C.effect }), count);
  const ask = field(decision, 'How many restores did this ticket leave?', C.active, 42);
  const needs = field(decision, 'Operator request   →   saved approval   →   commit', C.review, 40);
  const next = field(decision, 'What if execution fails just before commit?', C.active, 42);

  s.add(heading('What happens to the key when support replies?'),
    place(label('Production API key', { size: 52 }), accountName),
    place(key(), item), place(chip('Disabled', { color: C.active, size: 42 }), status),
    paper(document, C.ticket), ticketTitle, inquiry, seal, ticketType,
    paper(audit), field(measure, 'Committed restores in SQLite', C.stored, 36), unknown);
  c.swap('read-policy', [ticketTitle, inquiry, ticketType], [sourceTitle, policy, citation]);
  c.swap('make-draft', sourceTitle, draftTitle);
  c.show('count-query', place(mono(countQuery, { size: 39 }), sql, 'left'));
  c.show('count-question', ask);
  c.hide('draft-count', ask);
  c.swap('draft-count', unknown, zero, { after: true, lead: 0 });
  c.show('separate-request', needs);
  c.swap('before-commit', needs, next);
}
