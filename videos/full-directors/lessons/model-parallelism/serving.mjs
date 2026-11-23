import assert from 'node:assert/strict';
import { localPlacement, usefulCost } from '../../../films/model-parallelism/arithmetic.mjs';
import { fresh, freshMean, freshDense } from './tensor.mjs';
import { bench, wire, panel, lamp, dot, box, label, mark, mono, note, event, mix, smooth, bar, vec, num, show, ranks, palette, paper, gold, mint, violet, rose, faint, base } from './bench.mjs';

const limits=[400,55];
const candidates=[
  {tp:1, fits:false, ttft:null,tpot:null, tps:null},
  {tp:2, fits:true, ttft:310,tpot:45,tps:620},
  {tp:4, fits:true, ttft:430,tpot:62,tps:700}
];
const eligible=r=>r.fits&&r.ttft<=limits[0]&&r.tpot<=limits[1];
const prices=[{tp:2,hour:6,rate:620},{tp:4,hour:12,rate:900}];
const initial=localPlacement([31,15]), spread=localPlacement([23,23]);
const delta=initial.values[0]-spread.values[0];

function serving(c,k) {
  const b=k.beat.beatIndex;
  const title=['Which GPUs share an attention replica?','What must follow a request into decode?','Which run qualifies for this workload?','Which run qualifies for this workload?','Which eligible run costs less per useful token?'][b];
  bench(c,b<2?'Serving layout   /   request ownership':b===4?'GPU-only cost   /   separate price exercise':'Eligibility   /   synthetic measurements',title);
  if(b===0) {
    const pairs=event(k,0,'four independent',0), request=event(k,0,'Route another request',1.2);
    const coupled=event(k,0,'expert work couples',0);
    const start=145, dx=202;
    label(c,pairs?'Four TP 2 replicas':'One TP 8 replica',start,324);
    const n=pairs?4:1;
    for(let i=0;i<n;i++) {
      const xx=start+(pairs?2*i*dx:0);
      panel(c,xx,421,dx*(pairs?2:8)-18,230,pairs?palette[i]:violet);
      label(c,'Replica '+(i+1),xx+34,469,pairs?palette[i]:violet);
    }
    for(let i=0;i<8;i++) {
      const xx=start+i*dx+25;
      box(c,xx,521,dx-72,76,'#132330','#798c98',6);
      mono(c,'GPU '+i,xx+(dx-72)/2,560,30);
    }
    if(request>0) {
      const dest=start+5*dx;
      wire(c,[[dest,760],[dest,663]],palette[2],4);
      lamp(c,dest,mix(760,664,request),10,gold);
      label(c,'New request',dest,816,gold,'center');
    }
    if(coupled) {
      wire(c,[[start+5*dx,417],[start+5*dx,372],[start+dx,372],[start+dx,418]],gold,4);
      lamp(c,start+dx,416,9,gold);
      label(c,'Expert dispatch',start+3*dx,337,gold,'center');
    }
    note(c,coupled?'Cross-group expert dispatch can couple these attention replicas.':pairs?'Independent experts and caches allow separate request queues.':'All eight ranks advance one batch through the model.');
    return;
  }
  if(b===1) {
    const sent=event(k,1,"from the prefill worker",1.6);
    for(let i=0;i<2;i++) {
      const xx=150+i*970;
      panel(c,xx,393,635,297,ranks[i]);label(c,i?'Decode worker':'Prefill worker',xx+317,455,ranks[i],'center');
      for(let j=0;j<8;j++)box(c,xx+68+j*63,558,51,68,'#111a25','#6e7c87',3);
      mark(c,i?'Decode queue':'Prefill queue',xx+317,779,39,faint,'center');
    }
    wire(c,[[792,591],[1114,591]],'#87969f',5);
    for(let j=0;j<8;j++) {const xx=218+j*63+970*smooth(sent);box(c,xx,558,51,68,gold,null,3);mono(c,j,xx+25.5,592,32,base);}
    note(c,'Follow the same eight KV blocks. Charge both queue waits and the exposed transfer.');
    return;
  }
  if(b===4) {
    const costOn=event(k,4,'Per million useful tokens',0);
    for(let i=0;i<2;i++) {
      const xx=135+i*865, p=prices[i], tokens=p.rate*3600;
      label(c,p.tp+'-GPU group   /   eligible',xx,335,ranks[i]);
      mark(c,'$'+p.hour+' / group-hour',xx,424,56,paper,'left','Serif');
      mono(c,p.rate+' useful tokens/s',xx,526,41,ranks[i],'left');
      bar(c,xx,597,670,63,3.4e6,[{value:tokens,color:ranks[i]}]);
      label(c,tokens.toLocaleString('en-US')+' useful tokens in one hour',xx,719);
      if(costOn)mono(c,'$'+usefulCost(p.hour,p.rate).toFixed(2)+' / million',xx,821,54,gold,'left');
    }
    note(c,'Assumed sustained rates and billed group prices. Both pass the same fit, quality and latency gates.');
    return;
  }
  const answer=event(k,3,'Only the pair qualifies',0);
  const xs=[133,465,948,1409];
  ['Group','p95 first token','p95 per output token','Raw tokens/s'].forEach((v,i)=>label(c,v,xs[i],326));
  for(const [i,r] of candidates.entries()) {
    const yy=424+i*155;
    wire(c,[[112,yy+86],[1793,yy+86]],'#53636c',2);
    mark(c,'TP '+r.tp,xs[0],yy,47,r.fits?paper:rose);
    if(!r.fits){mark(c,'86 GB required  /  80 GB budget',xs[1],yy,38,rose);continue;}
    [[r.ttft,limits[0],500],[r.tpot,limits[1],75]].forEach(([val,lim,max],j)=>{
      const ox=xs[j+1], w=350;
      mark(c,val+' ms',ox,yy-10,38,paper);
      bar(c,ox,yy+24,w,31,max,[{value:val,color:answer&&!eligible(r)?rose:ranks[i-1]}]);
      wire(c,[[ox+w*lim/max,yy+14],[ox+w*lim/max,yy+62]],gold,4);
    });
    mono(c,r.tps,xs[3],yy,46,paper,'left');
    if(answer)label(c,eligible(r)?'Eligible':'Miss',1690,yy,eligible(r)?mint:rose,'center');
  }
  note(c,'Gold limits   •   p95 first token ≤ 400 ms    /    p95 time per output token ≤ 55 ms');
}
function practice(c,k) {
  const b=k.beat.beatIndex;
  const mean=event(k,1,'A mean before bias',0), sum=event(k,1,'Switch to a sum',0);
  const memory=event(k,2,'Can the same pair',0), verdict=event(k,3,'GPU zero is two short',0);
  const shift=event(k,3,'Reassign eight gigabytes',1.25);
  bench(c,'Fresh case   /   the same two GPUs',memory?'Will the proposed history fit?':'Can these partials reproduce the dense output?');
  if(!memory){
    label(c,'Input   [−1, 3]',131,321,gold);
    label(c,'Dense reference   ≈   '+vec(freshDense),1767,321,paper,'right');
    for(let r=0;r<2;r++) {
      const xx=144+r*873;panel(c,xx,401,752,187,ranks[r]);
      label(c,'GPU '+r+'   /   projection contribution',xx+33,443,ranks[r]);
      mono(c,vec(fresh.partials[r]),xx+376,526,53,ranks[r]);
    }
    const chosen=sum?fresh.output:mean?freshMean:null;
    mark(c,sum?'Sum, then one bias':mean?'Mean, then one bias':'Mean or sum before adding the bias?',960,691,48,sum?mint:mean?rose:gold,'center','Serif');
    if(chosen)mono(c,'≈   '+vec(chosen),960,817,63,sum?mint:rose);
    note(c,'Same GeLU, matrices and output bias [0.5, −0.5]. Compare both coordinates.');
    return;
  }
  const current=shift===0?initial:spread;
  const inFlight=shift>0&&shift<1;
  const values=inFlight?[spread.values[0],initial.values[1]]:current.values;
  const remaining=localPlacement(values).free;
  label(c,'Layer verified   ≈   '+vec(freshDense),130,308,mint);
  label(c,'46 GB requested   /   two 29 GB pools',1783,308,paper,'right');
  const xx=[388,1186], y=791, s=11;
  for(let r=0;r<2;r++) {
    const col=ranks[r],v=values[r],lw=340;
    box(c,xx[r],y-35*s,lw,35*s,'#15242d','#566d78',4);
    box(c,xx[r],y-v*s,lw,v*s,col,null,4);
    mono(c,v+' GB',xx[r]+lw/2,y-v*s*.45,53,base);
    wire(c,[[xx[r]-35,y-29*s],[xx[r]+lw+35,y-29*s]],gold,5);
    label(c,'GPU '+r,xx[r]+lw/2,842,col,'center');
    if(verdict && !inFlight) label(c,Math.abs(remaining[r])+' GB '+(remaining[r]<0?'short':'free'),xx[r]+lw/2,895,remaining[r]<0?rose:mint,'center');
  }
  if(inFlight){
    const u=Math.min(1,shift*4), travel=betweenSlide(shift), down=Math.max(0,(shift-.75)*4);
    const px=mix(xx[0],xx[1],smooth(travel));
    const startY=y-initial.values[0]*s,endY=y-spread.values[1]*s;
    const py=mix(mix(startY,354,u),endY,down);
    box(c,px,py,340,delta*s,gold,null,4);mono(c,delta+' GB',px+170,py+delta*s/2,37,base);
  }
  mark(c,'29 GB',960,y-29*s,38,gold,'center');
  if(shift===1) mark(c,'Supported even split',960,664,34,mint,'center');
  if(!verdict)note(c,'Check each allocation against the gold line before admitting the request.');
}
function betweenSlide(shift){return Math.max(0,Math.min(1,(shift-.25)*2));}
export const servingScenes={'c09-serving':serving,'c09':practice};
export function checkServing(){
  assert.deepEqual(candidates.filter(eligible).map(r=>r.tp),[2]);
  assert.deepEqual(prices.map(p=>usefulCost(p.hour,p.rate).toFixed(2)),['2.69','3.70']);
  assert.deepEqual(initial.free,[-2,14]);assert.deepEqual(spread.free,[6,6]);
  assert.equal(delta,spread.values[1]-initial.values[1]); assert.equal(initial.groupTotal,spread.groupTotal);
  assert.equal(spread.values[0]+initial.values[1]+delta,46);
}
