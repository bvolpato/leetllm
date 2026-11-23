import { place, row, rect } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { REQUIRED_GATES } from '../../../films/capstone-product-ranking-recommendation/fixtures.mjs';
import { open } from '../parts.mjs';

export default function receipt(s,c) {
  const [head, gates, evidence, verdict] = open(s,c).rows([1,1,3,1], 'normal');
  s.add(place(label('Local fixture receipt'),head));
  const cells = fill => place(row(REQUIRED_GATES.map(() => rect(48,48,{fill, stroke:fill || 'dim',radius:5})),{gap:'normal'}),gates);
  const empty = cells(null);
  s.add(empty);
  c.swap('receipt-gates',empty,cells('green'));
  const launch = place(mono(REQUIRED_GATES.length + ' / ' + REQUIRED_GATES.length + ' checks pass     Live launch: false',{color:'yellow'}),verdict);
  c.show('receipt-live',launch);
  const records = [
    ['Hand-entered order', 'Two-query mean  0.854 → 1.000'],
    ['Temporal model fit', '3 train  /  2 validation  /  2 test'],
    ['Synthetic scoring', '10 samples  ·  p95  18 ms'],
    ['Online worksheet', '100 searches per arm'],
  ];
  const rows = evidence.rows(records.length,'normal');
  const receipts = records.map(([key, value],i) => {
    const [a,b] = rows[i].columns([2,3],'wide');
    return [place(note(key),a,'left'),place(mono(value,{size:32}),b,'left')];
  });
  c.show('receipt-identities',receipts.slice(0,3).flat());
  c.show('receipt-online',receipts[3]);
  c.swap('receipt-extension',receipts.flat(),place(label('Next evidence: measured serving latency and a tested rollback.'),evidence));
}
