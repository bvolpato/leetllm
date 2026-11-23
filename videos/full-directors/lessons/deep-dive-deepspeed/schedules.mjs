import assert from 'node:assert/strict';
import {adam} from '../../../films/deep-dive-deepspeed/arithmetic.mjs';
import {base,label,chip,cells,socket,rect,line,note,row,event,readout,range,sum,fmt,arrow,measure,blue,mint,orange,plum,gold,ink,mid,paper} from './bench.mjs';

export function access(g,k){
  const ext=k.beat.beatIndex===0,leaf=!!event(k,1,'Both ranks gather');
  base(g,'Parameter access',ext?'Who needs the embedding weight after return?':'Can both ranks enter the same gather?');
  if(ext){
    const accessed=event(k,0,'Watch the same weight',.85);
    label(g,'Embedding module',110,352,43,ink,{bold:true});label(g,'Classifier',1180,352,43,ink,{bold:true});
    chip(g,105,418,412,104,'W   /   shard',blue);
    arrow(g,535,468,1150,468);
    if(accessed)chip(g,1180,418,533,104,'W   /   full view',mint);else socket(g,1180,418,533,104,'Read W after release');
    label(g,'Tied parameter identity   ·   W',110,670,46,blue);
    note(g,accessed?'Registered external reader   ·   gather W for that read':'Owning module returned   ·   classifier still needs W');return;
  }
  label(g,'Router contains experts A and B   ·   one conditional choice per rank',100,315,36);
  ['Rank 0','Rank 1'].forEach((name,i)=>{
    const y=395+i*170,choice=['A','B'][i];
    label(g,name,105,y+60,42,ink,{bold:true});
    cells(g,429,y,leaf?['A','B']:[choice],{w:211,h:96,color:leaf?blue:orange,sz:42});
    arrow(g,914,y+48,1130,y+48);
    if(leaf)chip(g,1160,y,531,96,'execute '+choice,mint);else socket(g,1160,y,531,96,'Waiting on peers');
  });
  note(g,leaf?'Enclosing ZeRO leaf   ·   common gather order, conditional forward':'Rank 0 requests A   ·   rank 1 requests B   ·   collective order differs');
}
const ring={ranks:4,vector:12};
const chunk=ring.vector/ring.ranks,rounds=ring.ranks-1,volume=rounds*chunk;
function ringTravel(g,k){
  const loc=[[375,391],[797,391],[797,664],[375,664]];
  label(g,'N = 4 ranks   ·   P = 12 elements',110,303,37,ink);
  const t=event(k,0,'the three rounds run',2.4)*rounds,j=Math.min(rounds-1,Math.floor(t)),f=t-j;
  loc.forEach(([x,y],i)=>{
    const [ex,ey]=loc[(i+1)%4];line(g,x,y,ex,ey,mid,4);
    arrow(g,x,y,(x+ex)/2,(y+ey)/2,mid);
  });
  loc.forEach(([x,y],i)=>{
    rect(g,x-14,y-14,28,28,mid);
    const left=i===0||i===3;
    chip(g,left?x-260:x+98,y-40,154,80,'R'+i,i===0?blue:mid);
  });
  const [x,y]=loc[j],[ex,ey]=loc[j+1];chip(g,x+(ex-x)*f-80,y+(ey-y)*f-28,160,56,'0 1 2',orange,{size:24});
  readout(g,1110,385,'Elements per chunk',chunk,blue,520);
  readout(g,1110,611,'Sent per rank',Math.floor(t)+' × '+chunk+' = '+Math.floor(t)*chunk,orange,630);
}
export function collectives(g,k){
  const b=k.beat.beatIndex;
  base(g,'Collective schedule',['How far does a chunk travel?','How many elements does each rank send?','How does every replica get the new slices?','What would these schedules take in series?'][b]);
  if(b===0){ringTravel(g,k);note(g,'One ring all-gather or reduce-scatter   ·   sends per rank = (N − 1)P / N');return;}
  if(b===1){
    const z=event(k,1,'A simple stage-three'),a=event(k,1,'Two volumes'),d=event(k,1,'Three volumes');
    label(g,'Four ranks   ·   12 elements per vector   ·   9 sent per collective per rank',100,321,35);
    row(g,411,'Replicated DP',['grad RS','grad AG'],{w:258,sz:35});
    if(a)label(g,2*volume+' sent',1480,471,45,blue);
    if(z){row(g,596,'ZeRO stage 3',['W AG','W AG','grad RS'],{w:258,color:mint,sz:35});
      if(d)label(g,3*volume+' sent',1480,656,45,mint);}
    note(g,'RS   reduce-scatter       AG   all-gather       Equal element widths, one forward and backward.');return;
  }
  if(b===2){
    const gathered=event(k,2,'All-gather the updated slices',1.6),round=Math.floor(gathered*3);
    const weights=[1,2,3,4],fresh=weights.map(w=>adam([w,0,0],w,1)[0]);
    label(g,'Each owner has updated one weight   ·   ring forwards one more slice per round',100,308,35);
    range(4).forEach(r=>{
      const y=353+r*109,seen=i=>(r-i+4)%4<=round;
      row(g,y,'Replica '+r,weights.map((w,i)=>seen(i)?fresh[i].toFixed(2):w+' old'),{w:240,color:i=>seen(i)?mint:mid,sz:34,h:77});
    });
    note(g,'All-gather round '+round+' / 3   ·   each green cell holds the owner’s updated weight');return;
  }
  const solved=event(k,3,'takes twelve versus fourteen');
  label(g,'Illustrative service times   ·   compute 4 ms per pass   ·   collectives 2 ms each',100,324,36);
  const paths=[[['F',4],['B',4],['RS',2],['AG',2]],[['AG',2],['F',4],['AG',2],['B',4],['RS',2]]];
  paths.forEach((path,i)=>{
    const y=415+i*175;label(g,i?'ZeRO-3':'DP',105,y+57,42,ink,{bold:true});
    let at=0;path.forEach(([l,n])=>{chip(g,355+at*90,y,90*n-5,100,l,l==='F'||l==='B'?blue:orange);at+=n;});
    if(solved)label(g,at+' ms',1660,y+58,38,ink);
  });
  note(g,'Compare the full step at the target batch, dtypes, bucket sizes and overlap.');
}

function schedule(coalesced,calls,exited=false,updated=false) {
  const reduced=coalesced ? Number(exited) : calls;
  const retained=calls===0 ? 0 : coalesced && !exited ? 4 : 1;
  return {events:reduced,retained,updates:Number(updated)};
}
export function coalescing(g,k){
  const b=k.beat.beatIndex,coal=b>0;
  const progress=coal?event(k,1,'Replay those four calls',2):event(k,0,'each backward reduces',2);
  const count=Math.floor(progress*4);
  const exited=coal&&!!event(k,1,'At scope exit');
  const updated=coal?!!event(k,1,'Adam advances once'):count===4&&!!event(k,0,'Now Adam takes');
  const s=schedule(coal,count,exited,updated);
  base(g,'Reduction and accumulation','What stays live between backward calls?');
  if(b===2){
    label(g,'Same four backward calls   ·   one completed optimizer update on each path',100,324,38);
    row(g,407,'Default reductions',[1,2,3,4],{w:224,color:orange});
    row(g,528,'Coalesced reductions',[null,null,null,1],{w:224,color:orange});
    label(g,'Between calls',100,734,35,ink,{bold:true});
    chip(g,585,675,350,85,'Default: 1 slice',blue,{size:31});
    chip(g,963,675,517,85,'Coalesced: 4 slices',mint,{size:31});
    note(g,'Time the complete step and measure the peak buffer on each path.');return;
  }
  label(g,coal?'Coalesced scope   ·   retain full local gradient until exit':'Default ZeRO-2 or ZeRO-3   ·   reduce and retain owned slice',100,313,36);
  const gs=[1,3,-2,2];row(g,382,'Backward inputs',gs.map((v,i)=>i<count?v:null),{w:214});
  row(g,503,'Reduction events',gs.map((_,i)=>i<count&&(!coal||(exited&&i===3))?'reduce':null),{w:214,color:orange,sz:31});
  row(g,637,'Retained slices',range(4).map(i=>i<s.retained?'slice '+i:null),{w:214,color:mint,sz:32});
  note(g,s.events+' reduction'+(s.events===1?'':'s')+'   ·   '+s.updates+' optimizer update'+(s.updates===1?'':'s')+'   ·   '+s.retained+' retained gradient slice'+(s.retained===1?'':'s'));
}
function timing(bytes,rate,compute,dependent){
  const transfer=bytes/rate,start=dependent?transfer:0,finish=Math.max(transfer,start+compute);
  return {transfer,start,finish};
}
export function transfer(g,k) {
  const beat = k.beat.beatIndex;
  const bytes = 12, rate = 6, compute = 3;
  const overlap = timing(bytes, rate, compute, false);
  const serial = timing(bytes, rate, compute, true);
  const x = 105, y = 405, width = 1650, scale = serial.finish;
  const at = (seconds) => x + 315 + (width - 315) * seconds / scale;
  const speak = (phrase, captionStart = phrase) => {
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart }) === 1;
  };
  const summary = (message) => {
    g.save();
    g.translate(0, -28);
    note(g, message);
    g.restore();
  };
  base(g, 'Offload timing', beat === 2
    ? 'What changes when compute needs the bytes first?'
    : 'When can the consumer use the state?');
  label(g, bytes + ' GB to move   ·   ' + rate + ' GB/s achieved   ·   ' +
    (beat ? compute + ' seconds of compute' : 'single transfer'), 104, 324, 42);

  if (beat < 2) {
    const time = beat === 0
      ? event(k, 0, 'Follow twelve decimal', 1.7) * overlap.transfer
      : event(k, 1, 'Start compute', 1.8) * overlap.transfer + event(k, 1, 'With ideal overlap', 0.9);
    const sent = Math.min(overlap.transfer, time);
    const items = [['Transfer', 0, sent, orange]];
    if (beat === 1) items.push(['Compute', 0, Math.min(time, compute), mint]);
    measure(g, x, y, width, scale, items);
    label(g, 'Delivered   ' + fmt(sent * rate) + ' / ' + bytes + ' GB', 110, 777, 43,
      orange, { font: 'Mono' });
    if (beat === 0)
      summary(sent === overlap.transfer
        ? 'All ' + bytes + ' GB ready after ' + overlap.transfer + ' seconds'
        : 'Service time = bytes / achieved bottleneck bandwidth');
    else if (speak('both finish at three seconds', 'With ideal overlap'))
      summary(overlap.finish + ' s with ideal overlap. What if compute needs the transferred state?');
    else
      summary('The transfer and compute start together.');
    return;
  }

  const startPhrase = 'Compute begins at two seconds';
  const { end } = k.wordCue(startPhrase);
  const move = speak(startPhrase) ? Math.min(1, Math.max(0, (k.elapsed - end) / 1.15)) : 0;
  const computeStart = serial.start * move;
  const bounded = speak('The lower bound is now five');
  const showFinish = bounded && move === 1;
  measure(g, x, y, width, scale, [
    ['Transfer', 0, serial.transfer, orange],
    ['Compute', computeStart, computeStart + compute, mint],
  ]);
  if (move > 0) {
    g.save();
    g.setLineDash([9, 7]);
    rect(g, at(0), y + 110, at(overlap.finish) - at(0), 74, null, mint);
    line(g, at(serial.transfer), y + 74, at(serial.transfer), y + 111, orange, 3);
    g.restore();
    label(g, 'Old finish: ' + overlap.finish + ' s', at(overlap.finish), y + 302,
      28, mint, { align: 'center' });
  }
  label(g, 'Delivered   ' + bytes + ' / ' + bytes + ' GB', 110, 777, 43, orange,
    { font: 'Mono' });
  summary(showFinish
    ? serial.finish + ' s lower bound: ' + serial.transfer + ' s transfer, then ' + compute + ' s compute'
    : move > 0 ? 'Same work. Compute moves to the data-ready mark.' : 'What changes if compute must wait?');
}
export function domains(g,k){
  const b=k.beat.beatIndex,staged=event(k,0,'into host memory'),executing=event(k,0,'The CPU reads');
  base(g,'Offload domains',b===1?'How much of this slower transfer is exposed?':'Where does Adam run with state on NVMe?');
  if(b===1){
    const dep=event(k,1,'If that compute waits'),s=timing(20,5,6,!!dep);
    label(g,'20 GB   /   5 GB per second achieved   ·   6 seconds of compute',100,322,41);
    measure(g,104,403,1630,10,[['Transfer',0,s.transfer,orange],['Compute',s.start,s.start+6,mint]]);
    note(g,dep?'Dependency   ·   4 + 6 = '+s.finish+' seconds minimum':'Ideal overlap   ·   max(4, 6) = '+s.finish+' seconds minimum');return;
  }
  const boxes=[['NVMe','Optimizer state'],['Host RAM','Staging buffer'],['CPU','Adam executes']];
  boxes.forEach(([h,v],i)=>{
    const x=100+i*605;label(g,h,x,380,49,ink,{bold:true});
    if(i<2)arrow(g,x+440,512,x+576,512,mid);
    const yes=i===0||(i===1?staged:executing);
    if(yes)chip(g,x,451,415,125,v,i===2?mint:i===0?plum:blue,{size:36});else socket(g,x,451,415,125,'');
  });
  if(b===2||event(k,0,'Optimizer offload is documented'))label(g,b===2?'Check NVMe path and I/O operators   ·   measure pinned memory and CPU time':'Optimizer offload   ·   stages 1–3       Parameter offload   ·   stage 3',104,743,37);
  note(g,b===2?'Compare completed tokens per second at fixed batch and sequence lengths.':executing?'The CPU performs the optimizer work on state staged in host memory.':'Offload configuration   ·   optimizer state stored on NVMe');
}
export function checkSchedules(){
  assert.equal(volume,9);assert.deepEqual([2,3].map(n=>n*volume),[18,27]);
  assert.deepEqual(schedule(false,3),{events:3,retained:1,updates:0});
  assert.deepEqual(schedule(true,3),{events:0,retained:4,updates:0});
  assert.deepEqual(schedule(true,4,false,false),{events:0,retained:4,updates:0});
  assert.deepEqual(schedule(true,4,true,false),{events:1,retained:1,updates:0});
  assert.deepEqual([false,true].map(c=>schedule(c,4,true,true).events),[4,1]);
  assert.deepEqual([false,true].map(d=>timing(12,6,3,d).finish),[3,5]);
  assert.deepEqual([false,true].map(d=>timing(20,5,6,d).finish),[6,10]);
}

