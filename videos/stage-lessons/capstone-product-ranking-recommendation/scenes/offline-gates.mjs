import { place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { dcg, open } from '../parts.mjs';

export default function offlineGates(s,c) {
  const [head,board,foot] = open(s,c).rows([1,5,1],'wide');
  const rows = board.rows(2,'wide');
  const baseline = [[3,1,2],[1,3,2]].map(g=>dcg(g)/dcg([3,2,1]));
  const title = place(label('Two authored regression queries'),head,'left');
  const names = ['Insulated bag','Label printer'].map((v,i)=>place(label(v),rows[i].columns([2,3,2],'normal')[0],'left'));
  s.add(title,names);
  const scores = baseline.flatMap((v,i)=>{
    const [,area,out] = rows[i].columns([2,3,2],'normal'), [old,now] = area.rows(2,'normal');
    return [rect(area.width*v,35,{fill:'blue',stroke:null}).moveTo([area.left+area.width*v/2,old.cy]),
      rect(area.width,35,{fill:'green',stroke:null}).moveTo(now.point('center')),place(mono(v.toFixed(3)+' → 1.000',{size:33}),out)];
  });
  c.show('offline-per-query',scores);
  const mean = place(mono('Equal-query mean    '+((baseline[0]+baseline[1])/2).toFixed(3)+' → 1.000'),foot,'left');
  c.show('offline-mean',mean);
  const bag = [place(label('Insulated bag loses P3 before ranking'),head,'left'),
    place(mono('Judged       P1 (3)      P3 (2)      P2 (1)'),rows[0],'left'),
    place(mono('Retrieved    P1 (3)       ───        P2 (1)'),rows[1],'left')];
  c.swap('offline-drop',[title,...names,...scores,mean],bag);
  const fixed = place(mono('Fixed-universe NDCG  '+(dcg([3,1])/dcg([3,2,1])).toFixed(3)+'     Recall  1/2',{color:'yellow'}),foot,'left');
  c.show('offline-universe',fixed);
  const sorted = [11,13,12,15,14,16,13,12,17,18].sort((a,b)=>a-b);
  const heading = place(label('Ten synthetic scoring times'),head,'left');
  const bars = sorted.flatMap((v,i)=>{
    const lane=board.columns(10,'normal')[i], height=board.height*0.66*v/20;
    return [rect(lane.width*0.55,height,{fill:'blue',stroke:null}).moveTo([lane.cx,board.bottom-60-height/2]),
      mono(String(v),{size:32}).moveTo([lane.cx,board.bottom-25])];
  });
  c.swap('offline-gates',[...bag,fixed],[heading,...bars]);
  const rank = Math.ceil(.95*sorted.length);
  const p95 = place(mono('Nearest rank  '+rank+' of '+sorted.length+'    →    '+sorted[rank-1]+' ms',{color:'yellow'}),foot,'left');
  c.show('offline-percentile',p95);
  c.swap('offline-synthetic',p95,place(note('18 ms passes the 20 ms fixture threshold. Service latency needs measurements.'),foot,'left'));
}
