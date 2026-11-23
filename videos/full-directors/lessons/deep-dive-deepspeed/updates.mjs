import assert from 'node:assert/strict';
import {adam,buildOptimizerTrajectory} from '../../../films/deep-dive-deepspeed/arithmetic.mjs';
import {base,label,chip,cells,socket,rect,line,note,row,event,readout,range,sum,fmt,arrow,blue,mint,orange,plum,gold,ink,mid,paper} from './bench.mjs';

const initial=[1,0,0],gradients=[1,3],mean=xs=>sum(xs)/xs.length;
const reduced=mean(gradients);
const first=adam(initial,reduced,1);
const meanSquare=xs=>mean(xs.map(x=>x*x));
function ownerState(window,receipts){
  if(window!==8 || receipts.length!==2 || !receipts.every(Number.isFinite))return initial;
  return adam(initial,mean(receipts),1);
}
export function reduction(g,k){
  const cancel=!!event(k,2,'Try minus three')&&!event(k,2,'Return to the first pair');
  const pair=cancel?[-3,3]:gradients;
  const joined=event(k,0,'The reduced mean',.75), sq=event(k,1,'Square the mean'),local=event(k,1,'Square first'),mom=event(k,1,'those histories'),done=event(k,2,'the first update');
  base(g,'Adam on one owner','Where does the square belong?');
  readout(g,120,332,'Rank 0   /   g',pair[0],blue,330);readout(g,570,332,'Rank 1   /   g',pair[1],orange,330);
  arrow(g,890,392,1110,392);
  if(joined)chip(g,1160,337,565,108,'mean g = '+fmt(mean(pair)),mint,{size:44});
  else socket(g,1160,337,565,108,'Reduce both contributions');
  const cols=[{name:'Reduce, then square',v:mean(pair)**2,ok:sq,c:mint},{name:'Square on each rank first',v:meanSquare(pair),ok:local,c:orange}];
  cols.forEach(({name,v,ok,c},i)=>{
    const x=115+i*879;
    label(g,name,x,542,39,ink,{bold:true});
    rect(g,x,579,710,74,'#e1e1d1');
    if(ok && v)rect(g,x,579,710*v/9,74,c);
    label(g,ok?fmt(v):'?',x+733,634,48,c,{font:'Mono'});
    if(mom)label(g,'v₁ = 0.001 × '+v+' = '+fmt(.001*v),x,745,40,c,{font:'Mono'});
  });
  if(done)label(g,'Start at w = 1, m = v = 0   ·   β₁ = 0.9   ·   β₂ = 0.999   ·   η = 0.01   ·   ε = 10⁻⁸',115,810,29,mid);
  note(g,done?'g = 2   ·   m̂ = 2   ·   v̂ = 4   ·   w₁ ≈ '+first[0].toFixed(2):'Fresh m = v = 0   ·   β₁ = 0.9   ·   β₂ = 0.999   ·   η = 0.01   ·   ε = 10⁻⁸');
}
export function objective(g,k) {
  const values=[[1,1],Array(6).fill(3)],tokens=values.flat(),weighted=mean(tokens),naive=mean(values.map(mean));
  const counted=event(k,1,'Count the valid tokens',.9),result=event(k,1,'two and a half'),rule=event(k,2,'Only then');
  base(g,'Loss weighting','What is the mean across all valid tokens?');
  label(g,'Gradient contributed by each token',100,311,37);
  values.forEach((xs,r)=>{
    const y=378+r*143;
    label(g,'Rank '+r,105,y+61,41,ink,{bold:true});
    cells(g,382,y,xs,{w:140,h:92,color:r?orange:blue,sz:43});
    label(g,'mean  '+mean(xs),1420,y+60,38,r?orange:blue,{font:'Mono'});
  });
  label(g,'Equal rank weights',115,718,33,mid);label(g,fmt(naive),531,730,58,ink,{font:'Mono'});
  label(g,'Equal token weights',795,718,33,mid);label(g,result?fmt(weighted):'?',1320,730,58,mint,{font:'Mono'});
  note(g,rule?'v ← β₂v + (1 − β₂)g²    ·    use the globally weighted gradient g':counted?'Valid positions only   ·   (2 × 1 + 6 × 3) / (2 + 6)':'Two valid tokens on rank 0   ·   six valid tokens on rank 1');
}
function managed(steps,window){return Math.floor(steps/window);}
export function accumulation(g,k){
  const early=event(k,0,'Watch the microsteps',1.5);
  const count=event(k,2,'The eighth call')?8:Math.floor(early*7);
  const updates=managed(count,8);
  base(g,'Managed loop','When can the optimizer advance?');
  label(g,'One call to backward and step per microbatch',100,318,40);
  cells(g,102,390,range(8).map(i=>i<count?i+1:null),{w:204,h:135,color:i=>i===7?mint:blue,sz:54,gap:12});
  readout(g,105,640,'Completed microsteps',count+' / 8',blue,675);
  readout(g,1020,640,'Adam updates',updates,mint,650);
  note(g,updates?'2 per microbatch  ×  8 calls  ×  4 data ranks  =  64 examples':'4 independent data ranks   ·   2 examples per rank per call');
}
export function contracts(g,k){
  const unmanaged=!!event(k,1,'Now run'),version=k.beat.beatIndex>=2;
  base(g,'Step contract',version?'Will the installed engine accept offload?':'What does one call to step advance?');
  if(version){
    label(g,'Requested   /   unmanaged accumulation + optimizer offload',103,328,38);
    row(g,411,'August pin',['c455031',event(k,2,'rejects unmanaged')?'Rejected':'Check source'],{w:425,color:i=>i?orange:blue,sz:34});
    row(g,569,'Later training guide',['Documented API',event(k,2,'documents support')?'Supported':'Check guide'],{w:425,color:i=>i?mint:blue,sz:34});
    note(g,'Record the installed revision, resolved configuration and actual loop.');
    return;
  }
  label(g,'Start at microstep 0   ·   configured window 8   ·   same loop in both trials',100,307,35);
  row(g,380,'Backward calls',range(8).map(i=>i+1),{color:blue});
  row(g,511,'Step calls',range(8).map(i=>i===7?'step':null),{color:mint});
  const known=unmanaged?event(k,1,'One step call'):event(k,0,'advanced one microstep');
  readout(g,110,694,unmanaged?'Unmanaged   /   caller chose the boundary':'Managed   /   microstep 1 of 8',known?(unmanaged?'1 update':'0 updates'):'?',unmanaged?mint:orange,1400);
  note(g,unmanaged?'If the count differs, set scale_wrt_gas=False and supply the intended weights.':'Eight calls to backward   ·   one call to engine.step()');
}
export function groups(g,k){
  const topology=k.beat.beatIndex>=1,wide=event(k,0,'Four-byte elements');
  base(g,'Units and process groups',topology?'How many independent batches are there?':'How much storage does one bucket take?');
  if(!topology){
    const width=wide?4:2,mb=200*width;
    label(g,'200,000,000 elements   ·   actual buffer dtype',100,324,40);
    cells(g,105,392,range(4).map(i=>i<width?'byte':null),{w:200,h:105,color:plum,sz:40});
    readout(g,105,630,'Bytes per element',width,plum);
    readout(g,930,630,'Bucket storage',mb+' MB',blue,720);
    note(g,'200 million × '+width+' bytes   ·   decimal MB   ·   one allocation');return;
  }
  const tp=k.beat.beatIndex===2?4:3,dp=12/tp;
  label(g,'12 physical GPUs   ·   '+tp+' tensor workers share each batch',100,319,39);
  range(dp).forEach(r=>{
    const span=1710/dp,x=100+r*span;
    rect(g,x,381,span-22,228,'#e0e1d2');
    label(g,'Data rank '+r,x+16,432,34,ink,{bold:true});
    cells(g,x+15,473,range(tp).map(i=>'T'+i),{w:(span-70)/tp-5,gap:5,h:89,color:[blue,mint,orange,plum][r],sz:34});
  });
  const result=event(k,k.beat.beatIndex,k.beat.beatIndex===2?'batch to forty-eight':'global batch is sixty-four');
  label(g,'2 examples × 8 microsteps × '+dp+' data replicas',105,749,47,ink);
  note(g,result?'Resolved global batch   =   '+2*8*dp+' examples':'Microbatch and accumulation are fixed across groups.');
}
function firstStepTerms(state) {
  const mHat = state[1] / (1 - 0.9);
  const vHat = state[2] / (1 - 0.999);
  return { mHat, vHat, ratio: mHat / (Math.sqrt(vHat) + 1e-8) };
}
function quotient({mHat, vHat}) {
  return fmt(mHat) + '/(√' + fmt(vHat) + ' + ε)';
}
const localOnly = adam(initial, gradients[0], 1);
function compareFirstSteps(g,k,both) {
  const reducedTerms = firstStepTerms(both);
  const localTerms = firstStepTerms(localOnly);
  const showLocalTerms = !!event(k,4,'would be one');
  let localRatio = '…';
  if (event(k,4,'Take the square root')) {
    localRatio = quotient(localTerms);
    if (event(k,4,'again just under one')) localRatio += ' ≈ '+fmt(localTerms.ratio);
  } else if (showLocalTerms) {
    localRatio = 'm̂ = '+fmt(localTerms.mHat)+', v̂ = '+fmt(localTerms.vHat);
  }
  const showLocalWeight = !!event(k,4,'point nine nine');
  const showLocalM = !!event(k,4,'one tenth in the first');
  const showLocalV = !!event(k,4,'one thousandth in the second');
  base(g,'First Adam step','What gives away the missing gradient?');
  label(g,'Step 1 from w = 1, m = v = 0   ·   β₁ = 0.9   ·   β₂ = 0.999   ·   η = 0.01   ·   ε = 10⁻⁸',102,318,35,mid);
  const columns = [103, 482, 1002, 1320, 1575];
  const headers = ['Gradient used', 'Corrected m̂ / (√v̂ + ε)', 'Weight', 'Stored m', 'Stored v'];
  headers.forEach((header,i) => label(g,header,columns[i],438,36,ink,{bold:true}));
  line(g,100,463,1815,463,'#b6b9a9',2);
  const rows = [
    ['Both ranks', reduced, quotient(reducedTerms)+' ≈ '+fmt(reducedTerms.ratio), both[0].toFixed(2), fmt(both[1]), fmt(both[2])],
    ['Rank 0 alone', gradients[0], localRatio, showLocalWeight ? localOnly[0].toFixed(2) : '…',
      showLocalM ? fmt(localOnly[1]) : '…', showLocalV ? fmt(localOnly[2]) : '…'],
  ];
  rows.forEach(([name,gradient,ratio,weight,m,v],i) => {
    const y=542+i*144, color=i?orange:mint;
    label(g,name,columns[0],y,39,color,{bold:true});
    label(g,'g = '+fmt(gradient),columns[0],y+52,36,mid,{font:'Mono'});
    [ratio,weight,m,v].forEach((value,j) => label(g,value,columns[j+1],y+21,44,color,{font:'Mono'}));
  });
  note(g,showLocalV?'Same weight to two decimals   ·   compare the stored second moments':
    'Both ranks   ·   1 − 0.01 × '+quotient(reducedTerms)+' ≈ '+both[0].toFixed(2));
}
export function late(g,k){
  const arrival=event(k,2,'Receive the three',1.2),ready=arrival===1;
  const firstWritten=!!event(k,3,'first moment becomes point two');
  const secondWritten=!!event(k,3,'second becomes point zero zero four');
  const correctedM=!!event(k,3,'two for the first'),correctedV=!!event(k,3,'four for the second');
  const write=!!event(k,3,'about point nine nine');
  const next=ownerState(8,[1,ready?3:null]);
  if (k.beat.beatIndex === 4) return compareFirstSteps(g,k,next);
  const terms=firstStepTerms(next);
  base(g,'Gradient receipt',k.beat.beatIndex===3?'How far does the reduced gradient move W[0]?':'May rank 0 write its weight yet?');
  label(g,'Rank 0 owns W[0]',104,303,41,ink,{bold:true});
  label(g,'Rank 1',1480,303,41,orange,{bold:true});
  label(g,'8 / 8 microsteps',940,300,34,mint);
  chip(g,117,357,190,102,'1',blue,{size:55});socket(g,355,357,190,102,'R1');
  line(g,557,407,1460,407,'#b6bdaa',6);
  chip(g,1465+(355-1465)*arrival,357,190,102,'3',orange,{size:55});
  if(ready)label(g,event(k,2,'The mean is two')?'(1 + 3) / 2 = '+reduced:'(1 + 3) / 2',635,486,50,mint,{font:'Mono'});
  const values=[write?next[0].toFixed(2):'1.00',firstWritten?fmt(next[1]):'0',secondWritten?fmt(next[2]):'0'];
  ['Weight   W[0]','First moment   m[0]','Second moment   v[0]'].forEach((t,i)=>readout(g,110+i*588,604,t,values[i],[blue,mint,plum][i],548));
  if(correctedM)label(g,'Corrected m̂ = '+fmt(terms.mHat),698,756,39,mint);
  if(correctedV)label(g,'Corrected v̂ = '+fmt(terms.vHat),1286,756,39,plum);
  label(g,'Step 1 from w = 1, m = v = 0   ·   β₁ = 0.9   ·   β₂ = 0.999   ·   η = 0.01   ·   ε = 10⁻⁸',105,811,30,mid);
  if(event(k,3,'Subtract one hundredth'))note(g,'Next weight   =   1 − 0.01 × '+quotient(terms)+(write?'   ≈   '+next[0].toFixed(2):''));
  else if(event(k,3,'Take the square root'))note(g,'m̂ / (√v̂ + ε)   =   '+quotient(terms)+(event(k,3,'just under one')?'   ≈   '+fmt(terms.ratio):''));
  else if(event(k,3,'divide each stored moment'))note(g,'Step 1 bias correction   ·   m̂ = m / (1 − β₁)   ·   v̂ = v / (1 − β₂)');
  else note(g,ready?'Both gradient contributions received   ·   accumulation window complete':'Received 1 of 2 gradient contributions   ·   accumulation window complete');
}
export const history=buildOptimizerTrajectory();
export const continued=adam(history.saved,.4,6), resetMoments=adam([history.saved[0],0,0],.4,6), rewound=adam(history.saved,history.gradients[0],6);
export function checkpoint(g,k) {
  const complete=Math.floor(5*event(k,0,'Apply the five gradients',2.1)),shown=k.beat.beatIndex>=1;
  const step=!!event(k,1,'Apply Adam');
  base(g,'Adam checkpoint','Can two copies of the same weight diverge?');
  if(!shown){
    row(g,344,'Applied gradients',history.gradients.map((v,i)=>i<complete?v:null),{w:185,color:blue});
    ['Weight','First moment','Second moment'].forEach((v,i)=>readout(g,105+i*580,597,v,history.trajectory[complete][i].toFixed(5),[blue,mint,plum][i],525));
    note(g,'Step '+complete+' of 5   ·   w starts at 1   ·   β₁ = 0.9   ·   β₂ = 0.999   ·   η = 0.01');return;
  }
  const original=history.saved;
  label(g,'Shared saved weight '+original[0].toFixed(7)+'   ·   next g = 0.4   ·   next step = 6',100,315,36);
  const reset=!!event(k,1,'reset both moments to zero');
  ['Restore moments',reset?'Reset moments':'Same saved state'].forEach((v,i)=>{
    const x=100+i*875, prior=i&&reset?[original[0],0,0]:original,result=i?resetMoments:continued;
    label(g,v,x,411,43,ink,{bold:true});
    label(g,'Input m = '+prior[1].toFixed(5)+'   v = '+prior[2].toFixed(5),x,486,34,mid);
    chip(g,x,541,796,120,step?'w = '+result[0].toFixed(8):'w = '+original[0].toFixed(8),i?orange:mint,{size:46});
  });
  if(step){
    const low=.965,high=.9665,left=538,right=1655,y=735;
    label(g,'Next weight',103,y+12,35,ink,{bold:true});
    line(g,left,y,right,y,mid,3);
    for(const tick of [low,.9655,.966,high]){
      const x=left+(right-left)*(tick-low)/(high-low);
      line(g,x,y-6,x,y+11,mid,3);
      label(g,tick.toFixed(4),x,y+52,26,mid,{align:'center',font:'Mono'});
    }
    for(const [value,color] of [[continued[0],mint],[resetMoments[0],orange]]){
      const x=left+(right-left)*(value-low)/(high-low);
      g.beginPath();g.arc(x,y,11,0,2*Math.PI);g.fillStyle=color;g.fill();
    }
  }
  const gap=Math.abs(continued[0]-resetMoments[0]);
  note(g,step?'Difference in next weight   '+gap.toFixed(8)+'   ·   same saved weight, next gradient and step':'Compare the next training update   ·   test fixed-input inference separately');
}
export function save(g,k){
  const phase=k.beat.beatIndex;
  if(!phase){
    const all=event(k,0,'Every participating process',1), checkTags=event(k,0,'Now check the four tags');
    const mismatch=checkTags&&!event(k,0,'Give it the same step-five tag');
    base(g,'Distributed checkpoint',checkTags?'Do all four ranks use the same tag?':'Which processes must save step 5?');
    range(4).forEach(i=>{
      const x=100+i*432;
      label(g,'Rank '+i,x,372,39,ink,{bold:true});
      if(i<=Math.floor(3*all))chip(g,x,433,390,152,mismatch&&i===3?'step-4':'step-5',mismatch&&i===3?orange:blue,{size:49});
      else socket(g,x,433,390,152,'No save call');
    });
    let message='Each rank owns part of this save';
    if(all===1)message='Four participants   ·   one checkpoint identity';
    if(mismatch)message=event(k,0,'Rank three used step four')?'Rank 3 used step-4   ·   the other ranks used step-5':'Requested checkpoint tag   step-5';
    note(g,message);return;
  }
  base(g,'Distributed checkpoint','What changed on the next input?');
  const reset=!!event(k,1,'The lower branch repeats'),run=!!event(k,1,'Apply the update');
  label(g,'Same w, m, v, scheduler, RNG and step   ·   fresh engine',100,314,37);
  ['Reference cursor','Restored cursor'].forEach((v,i)=>{
    const y=395+i*179,changed=reset&&i===1,gradient=changed?history.gradients[0]:.4,result=changed?rewound:continued;
    label(g,v,100,y+51,34,ink,{bold:true});
    chip(g,480,y,300,85,'sample '+(changed?1:6),changed?orange:blue);arrow(g,798,y+43,885,y+43);
    chip(g,910,y,300,85,'g = '+gradient,changed?orange:blue);arrow(g,1233,y+43,1317,y+43);
    if(run)chip(g,1340,y,437,85,'w = '+result[0].toFixed(6),changed?orange:mint,{size:34});else socket(g,1340,y,437,85,'Next update');
  });
  note(g,phase===2?'Resume test   ·   next input, loss, update and scheduler state':
    event(k,1,'Save the sampler position')?'Save the sampler position in client_state.':'Compare the next sample before the next update.');
}
export function checkUpdates(){
  assert.equal(meanSquare(gradients),5);assert.equal(reduced**2,4);
  assert.equal(meanSquare([-3,3]),9);assert.equal(mean([-3,3]),0);
  assert.equal(mean([1,1,...Array(6).fill(3)]),2.5);
  assert.equal(managed(7,8),0);assert.equal(managed(8,8),1);assert.equal(managed(1,8),0);
  assert.deepEqual(ownerState(7,[1,3]),initial);assert.deepEqual(ownerState(8,[1,null]),initial);
  assert.deepEqual(ownerState(8,[1,3]),first);assert.equal(first[1],.2);assert.equal(first[2],.004);
  for (const [state, expectedM, expectedV] of [[first,2,4], [localOnly,1,1]]) {
    const {mHat,vHat,ratio}=firstStepTerms(state);
    assert.ok(Math.abs(mHat-expectedM)<1e-12 && Math.abs(vHat-expectedV)<1e-12);
    assert.ok(ratio<1 && ratio>0.99999998);
    assert.equal(initial[0]-0.01*ratio,state[0]);
    assert.equal(state[0].toFixed(2),'0.99');
  }
  assert.deepEqual(localOnly.slice(1),[0.1,0.001]);
  assert.deepEqual(adam(JSON.parse(JSON.stringify(history.saved)),.4,6),continued);
  assert.equal(continued[0].toFixed(8),'0.96616711');assert.equal(resetMoments[0].toFixed(8),'0.96546242');assert.notEqual(rewound[0],continued[0]);
}

