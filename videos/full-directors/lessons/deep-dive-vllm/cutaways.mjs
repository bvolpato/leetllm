import {ink, cream, dim, blue, red, green, gold, line, bluePale, redPale,
  txt, mid, cap, box, path, header, note, tag, cell, empty, chip, sockets} from './art.mjs';
import {r0, r1, tables, size, promptSlice, releaseOrder, acquired, surviving, runningCap, runningStates,
  pixelLimit, mediaRuns, pixels, workerTopologies} from './examples.mjs';

export function openingPages(c,k) {
  const resolving=k.beat.id==='c01-two-pages';
  const first=resolving&&k.reveal('The fifth input',0);
  const second=resolving&&k.reveal('Now on fits',0);
  const filled=second&&k.reveal('The worker has storage',0);
  const blocks=second?2:1;
  const plan=promptSlice(blocks);
  const count=filled?plan.words.length:first?promptSlice(1).words.length:0;
  header(c,'Opening step  /  memory replay','Can “on” take the fifth prompt place?');
  tag(c,'R1',91,292,blue,85);
  for(const [i,word] of r1.entries())cell(c,word,215+i*175,280,168,74,
    i<count?bluePale:cream,i===4?gold:line,ink,35);
  cap(c,'R1 KV space',95,484);
  chip(c,460,405,570,73,r1.slice(0,Math.min(count,size)));
  if(second)chip(c,1100,405,570,90,r1.slice(size,count));
  else {
    empty(c,1100,405,570,137);
    mid(c,'No second block',1385,479,37,dim,'Serif');
  }
  const assigned=['R0 decode',...r1.slice(0,count)];
  const labels=Array.from({length:6},(_,i)=>assigned[i]??null);
  cap(c,'GPU step',98,676);
  sockets(c,338,627,1460,labels,i=>i===0?red:blue);
  note(c,filled?'“On” occupies the first cell of the second block.':second?'One more block is available.':first?'Four prompt positions run. The sixth step place stays empty.':'Which prompt inputs have a place to store their keys and values?',
    filled?'Five prompt inputs and one decode fill the step. Four prompt inputs wait.':
    'Six input places. The decode has its own storage. Each free block backs four prompt inputs.');
}

export function project(c,k) {
  const assets=k.reveal('Suppose you ship',0);
  const license=k.reveal('Check the weight',0);
  header(c,'Project source','Which terms apply to the bird model?');
  const items=[['vLLM engine','Block allocator','Scheduler','Model runners'],['Model bundle','Bird weights','Tokenizer','Model configuration']];
  items.forEach(([name,...rows],i)=>{
    if(i&&!assets)return;
    const x=110+i*930,color=i?blue:green;
    path(c,[[x,342],[x,310],[x+260,310],[x+292,342],[x+745,342],[x+745,709],[x,709],[x,342]],color,4);
    txt(c,name,x+32,402,50,color,{font:'Serif'});
    rows.forEach((s,j)=>{
      path(c,[[x+33,459+j*79],[x+712,459+j*79]],line,2);
      txt(c,s,x+35,496+j*79,32,ink);
    });
  });
  note(c,license?'Engine source at v0.28.0  ·  Apache-2.0':'From Berkeley’s Sky Computing Lab to the community vLLM repository.',
    license?'Check the license and publisher of each model artifact before distribution.':'Contributors maintain serving code for models supplied by many publishers.');
}

export function retiring(c,k) {
  const allocate=k.beat.id==='c05-reclaim';
  const partial=allocate||k.reveal('In the pinned pool',0);
  const full=allocate||k.reveal('Which two slots',0);
  const take=allocate&&k.reveal('Remove the suffix hash',0);
  const queue=take?surviving:full?releaseOrder:partial?releaseOrder.slice(0,1):[];
  const released=full?releaseOrder:partial?releaseOrder.slice(0,1):[];
  const left=tables.R1.filter(id=>!released.includes(id));
  header(c,'v0.28 block pool','Which slots does a fresh writer get?');
  cap(c,'R1 table',95,279,blue);
  txt(c,left.length?left.join('   /   '):'finished',352,278,37,blue);
  cap(c,'FREE QUEUE  /  HEAD FIRST',95,405);
  for(let j=0;j<3;j++){
    const x=644+j*325;
    if(queue[j])cell(c,queue[j],x,352,283,93,cream,line,ink,44);
    else empty(c,x,352,283,93);
  }
  const payloads={12:r0.slice(0,4),41:['A','wren'],73:r1.slice(4,8),90:r1.slice(8)};
  for(const [i,id] of [12,41,73,90].entries()){
    const x=94+i*442;
    const owner=id===41?'R2':left.includes(id)?'R1':take&&acquired.includes(id)?'R3':'free';
    const hashed=[12,73].includes(id)&&!(take&&acquired.includes(id));
    chip(c,x,548,396,id,payloads[id],{free:owner==='free',size:24});
    mid(c,owner+'  /  '+(hashed?'cached':'no hash'),x+198,743,28,ink,'Mono');
  }
  note(c,take?'R3 reserves 90 and 73. Block 12 keeps its cached prefix.':full?'A new request needs two fresh blocks. Which two leave first?':
    partial?'The partial block goes to the head.':'R1 releases its table from the last position back to the first.',
    'R2 keeps block 41. A reservation acquires a reference and removes any old cache identity before writing.');
}

export function activeLimit(c,k) {
  const result=k.reveal('A cap can contain',0);
  const opened=k.reveal('Its place opens',0);
  const state=runningStates[result?2:opened?1:0];
  header(c,'Running requests  /  v0.31','Can R3 enter the running set?');
  cap(c,'RUNNING  /  CAP '+runningCap,94,286);
  const slots=['R0',result?'R3':'R1','R2'];
  for(const [i,name] of slots.entries()){
    const x=152+i*533;
    if(state.includes(name))cell(c,name,x,379,448,152,name==='R3'?bluePale:cream,name==='R3'?blue:line,ink,62);
    else empty(c,x,379,448,152);
  }
  cap(c,'WAITING',94,685,blue);
  if(!result)tag(c,'R3',375,658,blue,150);
  else txt(c,'empty',375,686,39,dim);
  txt(c,'Token budget fits   ·   KV space fits',808,687,37,green);
  note(c,state.length+' of '+runningCap+' running places occupied.',
    'The active-request limit governs entry into the running set. The token budget governs work in a step.');
}

export function parallel(c,k) {
  const ep=k.reveal('Expert parallel workers',0), dp=k.reveal('Data parallel replicas',0);
  const pp=k.reveal('Pipeline workers split',0);
  const topology=workerTopologies[ep?'expert':dp?'data':pp?'pipeline':'tensor'];
  header(c,'Worker topology','What work does each GPU receive?');
  cap(c,topology.label.toUpperCase(),94,282);
  for(let i=0;i<2;i++){
    const x=168+i*992;
    box(c,x,392,595,258,ink,null,12);
    for(let j=0;j<8;j++){
      box(c,x+32+j*69,375,34,17,gold);
      box(c,x+32+j*69,650,34,17,gold);
    }
    mid(c,topology.ranks[i],x+297,477,54,cream,'Serif');
    mid(c,topology.work[i],x+297,573,34,bluePale,'Mono');
  }
  if(topology.link==='handoff'||topology.link==='collective'){
    path(c,[[765,525],[1148,525],[1129,511],[1148,525],[1129,540]],blue,6);
    if(topology.link==='collective')path(c,[[1150,564],[768,564],[787,578],[768,564],[787,549]],green,6);
  }else{
    mid(c,topology.link,960,330,35,blue,'Serif');
    path(c,[[952,353],[952,367],[468,367],[468,377]],blue,4);
    path(c,[[968,353],[968,367],[1450,367],[1450,377]],blue,4);
  }
  note(c,topology.detail,'Measure worker compute and communication on the topology serving this request.');
}

export function media(c,k) {
  const expand=k.reveal('Expand the runs',0.85);
  const verdict=k.reveal('Stop at the API server',0);
  header(c,'API input  /  decoded size','Does the decoded image fit?');
  cap(c,'TWO ENCODED RUNS',94,284);
  mediaRuns.forEach((run,i)=>{
    const x=105+i*457,color=i?blue:red;
    cell(c,run.count+' × '+run.color,x,337,416,99,i?bluePale:redPale,color,color,44);
  });
  cap(c,'DECODED PIXELS',94,535);
  cap(c,'Service cap  /  '+pixelLimit+' pixels',1114,535);
  const p=136,x0=128,y=598;
  for(const [i,color] of pixels.entries()){
    empty(c,x0+i*p,y,118,95);
    if(i<Math.floor(expand*pixels.length))box(c,x0+i*p,y,118,95,color==='blue'?blue:red,null,5);
  }
  const stop=x0+pixelLimit*p-10;
  path(c,[[stop,y-22],[stop,y+110]],ink,5);
  note(c,verdict?pixels.length+' pixels exceed the limit of '+pixelLimit+'. The API server stops the request.':
    'The download passed its byte limit. Check the size after expansion.',
    verdict?'No prompt enters the engine queue. Record download and decode time against the request ID.':
      'Compressed bytes and decoded pixels consume different resources.');
}
