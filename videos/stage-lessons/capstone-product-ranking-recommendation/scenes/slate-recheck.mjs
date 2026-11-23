import { place } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, open } from '../parts.mjs';

export default function slateRecheck(s, c) {
  const [head, slate, stock, command, output, foot] = open(s, c).rows([0.7, 1.35, 1.05, 0.85, 1.3, 0.75], 'wide');
  const order = ['P5', 'P6', 'P4'];
  s.add(place(note('REQ-501 · label printer · proposed treatment order'), head, 'left'));
  s.add(order.map((id, i) => place(namedBox((i + 1) + '    ' + id, { width: 355, height: 94, color: COLOR[id] }), slate.columns(3, 'wide')[i])));
  const stockAt = stock.columns(3, 'wide');
  const good = order.map((id, i) => place(mono(id + '  in stock', { size: 38 }), stockAt[i]));
  c.show('stock-first', good);
  c.show('stock-call', place(mono('impression_rows("REQ-501", "SHOP-200", "2026-05-01T12:00:05Z",', { size: 32 }), command, 'top'));
  c.show('stock-call', place(mono('"label-printer", "treatment")', { size: 32 }), command, 'bottom'));
  const response = place(label('Returned positions     1  P5      2  P6      3  P4', { color: 'green' }), output);
  c.show('stock-return', response, { after: true });
  const sold = place(mono('P5  sold out', { size: 38, color: 'red' }), stockAt[0]);
  const ask = place(label('Same call, current catalog. Can it write these three rows?', { color: 'yellow' }), output);
  c.swap('stock-change', [good[0], response], [sold, ask]);
  const error = place(mono('ValueError: eligibility changed before display; rebuild the slate', { size: 34, color: 'red' }), output);
  c.swap('stock-error', ask, error, { after: true });
  c.show('stock-history', place(note('Audit the first response against its saved catalog. Fetch eligible candidates for the new response.'), foot));
}
