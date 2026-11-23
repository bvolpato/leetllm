// The working scenes retain Alex's case beside the active read or write.
import { column, dynamic, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
import { original } from '../../films/design-conversational-ai-support-bot/fixtures.mjs';
import { money } from '../../films/design-conversational-ai-support-bot/arithmetic.mjs';
import { sampleModel } from '../../films/design-conversational-ai-support-bot/model.mjs';
export {
  original,
  small,
  confirmed,
  documents,
  serial,
  parallel,
  timeout,
  freshExpectedPayload,
} from '../../films/design-conversational-ai-support-bot/fixtures.mjs';
export {
  money,
  hash,
  tuple,
  supportCost,
} from '../../films/design-conversational-ai-support-bot/arithmetic.mjs';

// Blue: invoice facts. Cyan: conversation and requests. Green: admitted evidence.
// Pink: retained consent and review. Yellow: current comparison. Red: failure.
export const COLORS = {
  invoice: 'blue',
  request: 'cyan',
  evidence: 'green',
  consent: 'pink',
  focus: 'yellow',
  failure: 'red',
};
export const [CASE, WORK] = area.columns([1, 3], 'loose');
export const [MAIN, FOOT] = WORK.rows([7, 1], 'normal');
const caseFields = (state) => ({
  customer: state.customer,
  ticket: state.ticket,
  invoice: state.invoice,
  total: money(state.total),
  revision: 'R' + state.revision,
  policy: state.policy,
});
export const CASES = [caseFields(original), caseFields(sampleModel('state', { beat: 1 }).current)];

// The same form holds invoice evidence at intake and the customer's receipt at close.
export function caseSlip(region, issuer, reference, color) {
  const [head, body] = region.inset('normal').rows([1, 5], 'normal');
  const [name, ref] = head.columns([3, 2], 'tight');
  const seam = (head.bottom + body.top) / 2;
  const paper = [
    place(
      rect(region.width, region.height, { fill: 'surface', stroke: color, radius: 14 }),
      region,
    ),
    place(note(issuer, { size: 30, color }), name, 'left'),
    ...(reference ? [place(mono(reference, { size: 30, color }), ref, 'right')] : []),
    line([head.left, seam], [head.right, seam], { stroke: color, width: 2, dash: [8, 9] }),
  ];
  return { paper, body };
}

function caseConsole(s) {
  const identity = s.value(0);
  const pending = s.value(0);
  const [chatArea, recordArea, effectArea] = CASE.rows([2, 4, 2], 'normal');
  const chatFrame = place(
    rect(chatArea.width, chatArea.height, { fill: 'surface', stroke: 'grid', radius: 16 }),
    chatArea,
  );
  const chatRows = chatArea.inset('tight').rows([1, 2], 'tight');
  const speaker = dynamic(() =>
    place(
      label(CASES[Math.round(identity.value)].customer, { color: 'cyan', size: 34 }),
      chatRows[0],
      'left',
    ),
  );
  const message = place(
    column([label('I think I was', { size: 34 }), label('charged twice.', { size: 34 })], {
      gap: 'tight',
      align: 'left',
    }),
    chatRows[1],
    'left',
  );
  const recordFrame = place(
    rect(recordArea.width, recordArea.height, { fill: 'surface', stroke: 'blue', radius: 16 }),
    recordArea,
  );
  const rows = recordArea.inset('normal').rows(7, 'tight');
  const title = place(note('TRUSTED CASE', { color: 'blue' }), rows[0], 'left');
  const keys = ['ticket', 'invoice', 'total', 'revision', 'policy', 'customer'];
  const fields = keys.map((key, i) => {
    const [name, value] = rows[i + 1].columns([1, 1.7], 'tight');
    return [
      place(note(key === 'total' ? 'charge' : key), name, 'left'),
      dynamic(() =>
        place(
          mono(CASES[Math.round(identity.value)][key], { size: 30, color: 'blue' }),
          value,
          'left',
        ),
      ),
    ];
  });
  const effectFrame = place(
    rect(effectArea.width, effectArea.height, { fill: 'surface', stroke: 'grid', radius: 16 }),
    effectArea,
  );
  const effectRows = effectArea.inset('normal').rows(3, 'tight');
  const effectName = place(note('EFFECT LEDGER'), effectRows[0], 'left');
  const queued = dynamic(() =>
    place(
      label('pending  ' + Math.round(pending.value), { size: 34, color: 'cyan' }),
      effectRows[1],
      'left',
    ),
  );
  const applied = place(label('applied   0', { size: 34, color: 'dim' }), effectRows[2], 'left');
  return {
    identity,
    pending,
    effectName,
    nodes: [
      chatFrame,
      speaker,
      message,
      recordFrame,
      title,
      ...fields.flat(),
      effectFrame,
      effectName,
      queued,
      applied,
    ],
  };
}

export function open(s, c, previous = 'start') {
  // The partial-credit replay ends at the ledger. Alex's original request has no credit entry.
  const board = caseConsole(s);
  board.title = heading(c.title);
  s.add(board.title);
  if (previous === 'start' || previous === 'intro' || previous === 'ledger') s.add(board.nodes);
  else c.take(board.nodes);
  if (c.id !== 'ledger' && c.id !== 'ticket-budget') c.keep(board.nodes);
  return board;
}
