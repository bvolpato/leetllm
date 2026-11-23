import { place, row } from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, open } from '../parts.mjs';

export default function response(s, c) {
  const [board, evidence, foot] = open(s, c).rows([4, 2, 1], 'wide');
  const slates = [], metadata = [], statuses = [], acks = [];
  const ids = [['P4','P5','P6'], ['P5','P6','P4']];
  board.columns(2, 'wide').forEach((panel, i) => {
    const [head, order, request] = panel.rows(3, 'normal');
    s.add(place(label(['REQ-500 · control','REQ-501 · treatment'][i]), head));
    slates.push(place(row(ids[i].map((id, j) => chip((j + 1) + ' ' + id, { color: COLOR[id] })), { gap: 'normal' }), order));
    metadata.push(place(mono(['SHOP-100  12:00:00 UTC','SHOP-200  12:00:05 UTC'][i], { size: 32 }), request));
  });
  evidence.columns(4, 'normal').forEach((area, i) => {
    const [name, value] = area.rows(2, 'normal');
    statuses.push(place(label(['Returned','Rendered','Visible','Examined'][i]), name));
    acks.push(place(chip(i ? 'No receipt' : 'Server row', { color: i ? 'dim' : 'green' }), value));
  });
  const validation = place(note('Check each position and product against the saved slate.'), foot);
  c.show('response-rows', slates);
  c.show('response-identity', metadata);
  c.show('response-observed', statuses);
  c.show('response-ack', acks);
  c.show('response-validate', validation);
  c.swap('response-history', validation, place(note('Replay the historical catalog. New responses recheck current eligibility.'), foot));
}
