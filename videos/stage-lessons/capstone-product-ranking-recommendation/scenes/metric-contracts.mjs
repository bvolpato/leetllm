import { place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, dcg, open, ORDERING_PRODUCTS } from '../parts.mjs';

export default function metricContracts(s,c) {
  const [head,board,foot] = open(s,c).rows([1,5,1], 'wide');
  const cols = board.columns([1,1,2,2], 'normal');
  const cell = (col,row,v,color='ink') => place(mono(v,{size:35,color}),cols[col].rows(4,'wide')[row]);
  const grades = ORDERING_PRODUCTS.map(p=>p.grade);
  const title = place(label('One grade, two uses'),head,'left');
  const base = [title,cell(0,0,'Product'),cell(1,0,'Grade')];
  ORDERING_PRODUCTS.forEach((p,i)=>base.push(cell(0,i+1,p.id,COLOR[p.id]),cell(1,i+1,String(p.grade))));
  s.add(base);
  const gains = [cell(2,0,'Gain'),...grades.map((g,i)=>cell(2,i+1,String(2**g-1)))];
  c.show('metric-gains', gains);
  const discounted = [cell(3,0,'Discounted gain'), ...grades.map((g,i)=>cell(3,i+1,((2**g-1)/Math.log2(i+2)).toFixed(3)))];
  c.show('metric-discount', discounted);
  const ideal = dcg([...grades].sort((a,b)=>b-a)), actual = dcg(grades);
  const normalized = place(mono('NDCG = '+actual.toFixed(3)+' / '+ideal.toFixed(3)+' = '+(actual/ideal).toFixed(3),{color:'yellow'}),foot,'left');
  c.show('metric-normalize',normalized);
  const binary = [cell(2,0,'Relevant?'),...grades.map((g,i)=>cell(2,i+1,g>=2?'yes':'no',g>=2?'green':'dim'))];
  c.swap('metric-recall',[...gains,...discounted,normalized],binary);
  const guard = place(note('Fixed universe: one known product per row, with its original grade.'),foot,'left');
  c.show('metric-guards',guard);
  const rr = [place(label('Where is the first relevant result?'),head,'left'),
    ...['1   irrelevant','2   irrelevant','3   relevant'].map((v,i)=>place(mono(v,{color:i===2?'green':'dim'}),board.rows(3,'wide')[i],'left')),
    place(mono('Reciprocal rank = 1 / 3',{color:'yellow'}),foot,'left')];
  c.swap('metric-mrr',[...base,...binary,guard],rr);
}
