import {ink,paper,cream,dim,blue,red,green,gold,line,light,bluePale,redPale,clamp,smooth,
  txt,mid,cap,box,path,dot,wire,header,note,tag,cell,empty,bracket,finch,chip,sockets} from './art.mjs';
import {r0,r1,sharedPrefix,size,tables,steps,stepInputs,smallMs,largeMs,locate,prefixPlan,keyFields,
  online,processes,poolStates,queueStates,admit,runs,events,gaps,mean,sum,traces,check} from './examples.mjs';
import {openingPages, project, retiring, activeLimit, parallel, media} from './cutaways.mjs';

const title='vLLM: Trace Token Work, Cached State and Useful Completions';
const phase=(k,b,phrase,span=0)=>k.beat.beatIndex===b?k.reveal(phrase,span):Number(k.beat.beatIndex>b);
const ended=k=>k.elapsed>=k.speechDuration;
function titleline(c,s,x,y,color=dim){cap(c,s,x,y,color,27);}
function wordRow(c,words,x,y,w,options={}) {
  const pitch=w/(options.n??words.length);
  words.forEach((word,i)=>{
    const f=options.fill?.(i)??cream, col=options.color?.(i)??ink;
    cell(c,word,x+i*pitch,y,pitch-5,options.h??78,f,options.edge?.(i)??line,col,options.size??34);
  });
}
function processMap(c,k){
  const count=k.beat.beatIndex===3;
  header(c,'Request path',count?'How many processes own the work?':'Who decides what runs?');
  const xs=[130,717,1296], labels=['API server','Engine core','GPU workers'];
  const desc=['Tokenize  /  stream','Schedule  /  reserve KV','Execute  /  sample'];
  const cols=[red,green,blue];
  for(let i=0;i<3;i++){
    const x=xs[i],y=381;
    if(i<2)path(c,[[x+405,y+95],[x+569,y+95]],dim,3);
    box(c,x,y,414,185,cream,cols[i],12,4);
    txt(c,labels[i],x+25,y+54,47,cols[i],{font:'Serif'});
    txt(c,desc[i],x+25,y+123,30,ink);
    if(count){
      const n=[online.apis,online.ranks,online.workers][i];
      for(let j=0;j<n;j++)box(c,x+9+j*48,y+217,35,53,cols[i],null,4);
      cap(c,n+' processes',x+10,y+310,cols[i],28);
    }
  }
  if(count){
    const coord=phase(k,3,'A coordinator');
    if(coord){tag(c,'+1',720,273,green,68);txt(c,'DP coordinator',810,296,32);}
    const ready=phase(k,3,'If you set');
    note(c,ready?`${online.apis} + ${online.ranks} + ${online.workers} + 1 = ${processes(online)} main processes`:'Four data-parallel ranks with two GPUs each.',
      'Online multiprocessing deployment. Add a coordinator when DP exceeds one.');
  }else{
    const stage=phase(k,2,'A GPU worker')?2:phase(k,2,'An engine core')?1:0;
    tag(c,'R1',xs[stage]+143,279,blue,112);
    wire(c,xs[stage]+198,327,xs[stage]+198,379,blue);
    note(c,'Follow the same request ID across each handoff.','Input handling, engine queueing and worker execution have different owners.');
  }
}
function opening(c,k){
  const b=k.beat.beatIndex;
  if(b>=4)return openingPages(c,k);
  if(b>=2)return processMap(c,k);
  header(c,'Live stream','Who gets the next GPU step?');
  finch(c,168,389,0.91);
  cap(c,'R0  /  streaming',323,290,red);
  const arrival=phase(k,0,'A second prompt arrives',0.95);
  const printed=b?r0.join(' '):r0.slice(0,5+Math.floor(phase(k,0,'The little bird',2.7)*2)).join(' ');
  const phrase=!b&&arrival>0?printed+' '+r0[7].slice(0,Math.ceil(arrival*r0[7].length)):printed;
  txt(c,phrase,320,377,66,ink,{font:'Serif'});
  const left=320+c.measureText(phrase).width+12;
  box(c,left,342,7,72,Math.cos(k.seconds*5)>-0.45?red:redPale);
  const slide=arrival;
  if(slide>0){
    c.save();c.globalAlpha=smooth(slide);c.translate((1-smooth(slide))*84,(1-smooth(slide))*57);
    tag(c,'R1',94,498,blue,105);
    wordRow(c,r1,232,480,1580,{fill:()=>bluePale});c.restore();
  }
  cap(c,'NEXT GPU STEP',94,638,dim);
  const decode=b===1||k.elapsed>=k.wordCue('The live answer needs one').end;
  const answer=phase(k,1,'Count the places',0.8);
  const n=Math.floor(answer*steps[0].r1Prefill+1e-8);
  const labels=Array.from({length:6},(_,i)=>i===0?(decode?'R0 decode':null):i<=n?r1[i-1]:null);
  sockets(c,388,609,1425,labels,i=>i===0?red:blue);
  if(answer===1)bracket(c,628,1800,738,`${n} prompt inputs`,blue);
  note(c,answer===1?`${r1.length-n} prompt inputs wait for another step.`:decode?'R0 has reserved one place. How many can R1 use?':'One ongoing decode. Nine incoming prompt positions.',
    'Six input places in this step. Assume enough KV space and no prefix reuse.');
}
function addresses(c,k){
  const b=k.beat.beatIndex;
  if(b===4)return project(c,k);
  if(b===0){
    header(c,'KV memory','Why do long reservations leave holes?');
    const y1=353,y2=621;
    titleline(c,'Inside a reservation',100,y1-52);
    for(let i=0;i<12;i++){
      const x=120+i*136;
      cell(c,i<5?r0[i]:'',x,y1,128,88,i<5?redPale:cream,i<5?red:line,ink,31);
    }
    bracket(c,122,1748,472,'Reserved maximum  /  5 used, 7 unused',red);
    const gaps=phase(k,0,'Separate gaps',0.6);
    if(gaps>0){
      c.save();c.globalAlpha=gaps;
      titleline(c,'Between live allocations',100,y2-53);
      const free=[2,3,7,8];
      for(let i=0;i<12;i++)cell(c,free.includes(i)?'free':'live',120+i*136,y2,128,79,free.includes(i)?cream:ink,line,free.includes(i)?dim:cream,29);
      c.restore();
    }
    note(c,gaps?'Four free cells in two gaps.':'Unused cells inside the reservation remain tied to this request.',
      gaps?'A contiguous request for four cells cannot use these two separate pairs.':'Five of the twelve reserved cells contain live state.');
    return;
  }
  if(b===3&&phase(k,3,'A new workload')){
    header(c,'PagedAttention  /  historical measurement','What did the 2023 comparison establish?');
    cap(c,'THROUGHPUT AT COMPARABLE LATENCY',94,295);
    const x=t=>354+t*320;
    for(let t=1;t<=4;t++){
      path(c,[[x(t),365],[x(t),618]],line,2);mid(c,t+'×',x(t),669,37,ink,'Mono');
    }
    cap(c,'Baseline',96,420);dot(c,x(1),420,13,dim);
    cap(c,'vLLM',96,562);
    path(c,[[x(2),558],[x(4),558]],blue,14);dot(c,x(2),558,15,blue);dot(c,x(4),558,15,blue);
    mid(c,'reported range across workloads',x(3),506,34,blue,'Serif');
    note(c,'Matched comparisons need a workload, hardware and latency target.',
      'Kwon et al., 2023. Comparisons with FasterTransformer and Orca in the evaluated configurations.');
    return;
  }
  header(c,'Logical → physical','Where does “green” live?');
  const chosen=6, addr=locate(tables.R0,chosen), ready=phase(k,2,'Follow the index');
  const selected=phase(k,1,'Select the word green');
  cap(c,'R0 / logical position',95,266,red);
  const x=235,p=180;
  for(let i=0;i<8;i++){
    mid(c,i,x+p*i+p/2,326,26,dim,'Mono');
    cell(c,r0[i],x+p*i,353,p-7,72,i===chosen&&selected?'#f5dfa1':cream,line,ink,37);
  }
  bracket(c,x,x+p*4-8,457,'table[0] = 12');
  bracket(c,x+p*4,x+p*8-8,457,'table[1] = 41');
  wire(c,x+p*2,516,446,611,dim,3);wire(c,x+p*6,516,1436,611,dim,3);
  chip(c,143,615,624,12,r0.slice(0,4),{tint:redPale});
  chip(c,1122,615,624,41,r0.slice(4),{tint:redPale,mark:ready?addr.offset:-1});
  path(c,[[825,680],[892,680],[905,661],[920,701],[935,661],[948,680],[1047,680]],line,3);
  if(b===3){
    note(c,'Keys and values arrive through this table.','Backend choice also depends on the model, hardware, data type and features.');
  }else note(c,ready?`6 = 4 × 1 + 2     →     block ${addr.id}, offset ${addr.offset}`:'Position six, counting from zero. Which cell will attention read?',
    'The quotient selects the table entry. The remainder selects a cell inside the block.');
}
function aligned(c,k){
  const b=k.beat.beatIndex;
  const isWren=b>=2&&b<=3;
  const stored='Finch',adapter=isWren?'Wren':stored;
  const plan=prefixPlan(r1.length,sharedPrefix,adapter);
  const found=isWren?phase(k,3,'Its nine positions'):phase(k,1,'Follow the four');
  const output=phase(k,4,'Now feed and'),decoded=phase(k,4,'The hit saved');
  header(c,'Automatic prefix caching',b===4?'When does the next word exist?':'Which cached block can this prompt borrow?');
  const x=360,p=156;
  for(const [j,words] of [r0,r1].entries()){
    const y=302+j*190;
    tag(c,j?'R1':'R0',94,y+11,j?blue:red,82);
    txt(c,j?adapter:stored,194,y+34,37,j?blue:red,{font:'Serif'});
    wordRow(c,words,x,y,p*words.length,{fill:i=>found&&i<plan.skipped?'#b9d9c5':cream,size:32});
    if(j===0){
      bracket(c,x,x+4*p-5,y+101,'KV 12',red);
      bracket(c,x+4*p,x+8*p-5,y+101,'KV 41',red);
    }else{
      bracket(c,x,x+4*p-5,y+103,found?(plan.skipped?'reuse 12':'compute'):'?',found&&plan.skipped?green:dim);
      bracket(c,x+4*p,x+9*p-5,y+103,output?'suffix computed':found?'compute suffix':'?',dim);
    }
  }
  cap(c,'R1 OUTPUT',94,723,blue);
  cell(c,output?'and':'',360,677,160,77,output?bluePale:cream,line);
  cell(c,decoded?'sings':'',771,677,160,77,decoded?bluePale:cream,line);
  if(output){
    mid(c,'decode',645,689,25,blue,'Mono');
    path(c,[[534,723],[746,723],[736,714],[746,723],[736,732]],blue,3);
  }
  if(found)txt(c,`${plan.skipped} cached  +  ${plan.fresh} ${output?'computed':'to prefill'}`,1048,720,42,ink,{font:'Serif'});
  const limit='Four positions per block. Same parent history and gateway-assigned namespace.';
  if(b===4)note(c,decoded?'Decode computed the second sample.':output?'The first sample came from final prefill logits.':'The Finch hit skips four prompt inputs.', 'Each empty output position waits for model execution and sampling.');
  else if(isWren)note(c,found?'Wren must compute all nine prompt positions.':'Same token IDs, different adapter. Which Finch blocks qualify?', 'Previous Finch lookup: block 12 supplied four positions. Wren starts with an empty cache for this prefix.');
  else note(c,found?'Six matching words save one complete four-position block.':'Six matching words. How much prefill can R1 skip?',limit);
}
function prefix(c,k){
  const b=k.beat.beatIndex;
  if(b<5)return aligned(c,k);
  if(b===5){
    header(c,'Full-attention APC  /  v0.28','What if the whole prompt matched?');
    const eighth=phase(k,5,'Add a ninth'),ninth=ended(k);
    const cases=[[8,8],[9,8]];
    cases.forEach(([length,match],j)=>{
      if(j&&!eighth)return;
      const p=prefixPlan(length,match,'Finch'),y=335+j*235;
      cap(c,length+' inputs',90,y+35);
      const known=j?ninth:eighth;
      wordRow(c,[...r0,'again'].slice(0,length),339,y,152*length,{fill:i=>known?(i<p.skipped?'#bddbc7':redPale):cream,size:32});
      if(known)bracket(c,339,339+152*p.skipped-5,y+115,p.skipped+' skipped',green);
      if(known)bracket(c,339+152*p.skipped,339+152*length-5,y+115,p.fresh+' run',red);
    });
    note(c,'Leave an input to produce logits, then round down to complete blocks.',
      'Eligible full-attention hit: 4 × floor(min(matching positions, prompt length − 1) / 4).');
    return;
  }
  header(c,'Adapter identity','Does changing only the path change the key?');
  const changed=phase(k,6,'The older extra-key'),old=phase(k,6,'Version zero'),newer=phase(k,6,'A path is metadata');
  const pathName=changed?'ash':'oak';
  cap(c,'MANIFEST',94,305);
  txt(c,'Adapter name',94,388,36,dim);txt(c,'Finch',480,388,58,blue,{font:'Serif'});
  txt(c,'Adapter path',985,388,36,dim);txt(c,pathName,1370,388,58,changed?red:blue,{font:'Serif'});
  path(c,[[94,466],[1825,466]],line,2);
  for(const [i,version] of ['0.28','0.31'].entries()){
    const y=545+120*i,fields=keyFields(version,'Finch',pathName);
    cap(c,'v'+version,94,y,dim,32);cap(c,'oak',413,y,dim,28);
    txt(c,keyFields(version,'Finch','oak').join('  /  '),560,y,37,dim);
    if((i?newer:old)){cap(c,'ash',1040,y,red,28);txt(c,fields.join('  /  '),1200,y,37,i?red:ink);}
  }
  note(c,'The recorded fields determine which changes the lookup can see.','Shown for the two pinned LoRA extra-key functions, with parent and token IDs fixed.');
}
function stepClock(c,k){
  header(c,'Chunk size and latency','Who benefits from a bigger step?');
  const six=phase(k,4,'The first reader'),sixReturns=phase(k,4,'With a ten-place cap'),ten=phase(k,4,'A shorter wait');
  const x=t=>365+t*90;
  cap(c,'Toy clock  /  2 ms setup + 1 ms per input',94,280);
  for(let t=0;t<=15;t++){
    path(c,[[x(t),343],[x(t),718]],t%5===0?'#bdc7bd':'#e2e5d9',1);
    if(t%5===0)mid(c,t+' ms',x(t),322,26,dim,'Mono');
  }
  for(const [j,times] of [smallMs,[largeMs]].entries()){
    const y=409+183*j,show=j?ten:six;
    cap(c,j?'Cap 10':'Cap 6',94,y+32,ink,34);
    if(!show){path(c,[[x(0),y+31],[x(15),y+31]],line,3);continue;}
    let start=0;
    times.forEach((duration,i)=>{
      const w=x(duration)-x(0);
      box(c,x(start),y,w-5,78,i===1?blue:ink,null,5);
      mid(c,duration+' ms',x(start)+w/2,y+39,35,cream,'Mono');
      start+=duration;
      dot(c,x(start),y+88,7,i===0?red:blue);
    });
    const first=times[0], last=sum(times);
    if(j===1){
      mid(c,'Both readers at '+last+' ms',x(last),y+123,27,ink);
    }else if(sixReturns){
      mid(c,'R0 at '+first+' ms',x(first),y+123,27,red);
      mid(c,'R1 at '+last+' ms',x(last),y+123,27,blue);
    }
  }
  note(c,ten?'R1 improves from 15 to 12 ms. R0 waits 12 instead of 8.':'Compare each reader’s first return on the same clock.',
    'Same nine prompt inputs, one active decode per step and sufficient KV space.');
}
function batching(c,k) {
  const b=k.beat.beatIndex;
  if(b===4)return stepClock(c,k);
  header(c,'Decode-first scheduling','How far does the prompt move each pass?');
  const r=Math.max(0,b-1);
  const row=steps[r], inputs=stepInputs[r];
  const decode=b===0?phase(k,0,'Reserve the live'):1;
  const dispatchCue=['','Run that slice','Run the second slice','Feed the sampled and'][b];
  const entering=b===0?0:k.reveal(dispatchCue,row.r1Decode?0.75:1.35);
  const returnCue=['','four words remain','The worker finishes all nine prompt inputs'][b];
  const returns=row.r1Decode?phase(k,3,'This is continuous'):
    b>0&&k.elapsed>=k.wordCue(returnCue).end;
  const before=r1.length-row.r1Prefill-row.left;
  const done=before+(returns?row.r1Prefill:0);
  const capacity=row.used+row.unused;
  const moving=entering>0&&entering<1;
  const prompt={x:190,y:310,pitch:170,w:165,h:78};
  const stepPitch=1460/capacity;
  const step={x:338,y:520,pitch:stepPitch,w:stepPitch-9,h:92};
  const output={x:step.x+step.pitch+(step.w-prompt.w)/2,y:695};
  titleline(c,'R1  /  prompt',94,239,blue);
  const inSlice=i=>i>=before&&i<before+row.r1Prefill;
  const promptWords=r1.map((word,i)=>moving&&inSlice(i)?'':word);
  wordRow(c,promptWords,prompt.x,prompt.y,prompt.pitch*r1.length,{
    fill:i=>i<done?'#d2dacf':entering&&inSlice(i)?bluePale:cream,
  });
  for(let i=0;i<done;i++){
    const x=prompt.x+prompt.pitch*i;
    path(c,[[x+20,403],[x+prompt.w-20,403]],green,4);
  }
  if(done<r1.length){
    const x=prompt.x+done*prompt.pitch+prompt.w/2;
    mid(c,'Next input',x,265,28,blue,'Mono');
    path(c,[[x,284],[x,301],[x-7,294],[x,301],[x+7,294]],blue,3);
  }
  cap(c,'STEP '+r,94,step.y+step.h/2,ink,34);
  const cells=Array.from({length:capacity},(_,i)=>i===0?(decode?'R0 decode':null):entering===1?inputs[i]??null:null);
  cells.forEach((word,i)=>{
    const x=step.x+i*step.pitch, color=i===0?red:blue;
    if(word)cell(c,word,x,step.y,step.w,step.h,color,color,cream,36);
    else box(c,x,step.y,step.w,step.h,cream,line,5,3);
  });
  cap(c,'R1 OUTPUT',95,output.y+prompt.h/2,blue);
  const firstSample=b===3||b===2&&k.elapsed>=k.wordCue('its first sample, and').end;
  const sample=firstSample&&!(moving&&row.r1Decode)?stepInputs[2][1]:'';
  cell(c,sample,output.x,output.y,prompt.w,prompt.h,firstSample?bluePale:cream);
  if(b===3&&returns)cell(c,'sings',output.x+step.pitch,output.y,prompt.w,prompt.h,bluePale);
  if(moving){
    const lerp=(start,end,p)=>start+(end-start)*p;
    // Move sideways in the gap so the slice stays clear of words that are waiting.
    const travelY=415;
    const across=smooth((entering-0.24)/0.52);
    const y=row.r1Decode?lerp(output.y,step.y,smooth(entering)):
      entering<0.24?lerp(prompt.y,travelY,smooth(entering/0.24)):
      lerp(travelY,step.y,smooth((entering-0.76)/0.24));
    inputs.slice(1).forEach((word,i)=>{
      const fromX=row.r1Decode?output.x:prompt.x+(before+i)*prompt.pitch;
      const progress=row.r1Decode?smooth(entering):across;
      cell(c,word,lerp(fromX,step.x+(i+1)*step.pitch,progress),y,
        lerp(prompt.w,step.w,progress),lerp(prompt.h,step.h,progress),blue,blue,cream,36);
    });
  }
  txt(c,`${r1.length-done} prompt inputs left`,1180,output.y+prompt.h/2,42,blue,{font:'Serif'});
  if(b===0)note(c,decode?'One live decode takes the first input place.':'Which words can run beside the live decode?','Prefix caching off. Each step has six input places and enough KV capacity.');
  else if(moving)note(c,row.r1Decode?'Feed the first sample back as a decode input.':'Send the prompt slice beside the live decode.');
  else if(!returns)note(c,`Step ${r}  /  ${cells.filter(x=>x!==null).length} of ${capacity} places assigned`,
    row.r1Decode?'R1 uses its first sample to predict the next token.':'The prompt cursor advances when the worker returns.');
  else note(c,`${row.used} inputs computed   ·   ${row.unused} unused   ·   ${done} of ${r1.length} prompt inputs complete`,
    ['R0 streams another sample. R1 still has prompt work.',firstSample?'Final prefill logits produced R1’s first sample.':'R1 has finished prefill. The sampler can now use its final logits.','The two decode inputs each produce a new sample.'][r]);
}
function ownership(c,k) {
  const b=k.beat.beatIndex;
  if(b>=5)return retiring(c,k);
  if(b>=3)return queue(c,k);
  header(c,'Physical block pool','Which block can change hands?');
  const released=phase(k,1,'Release the table'),cleared=phase(k,2,'before writing'),assigned=phase(k,2,'R one can still');
  const state=poolStates[assigned?3:cleared?2:released?1:0];
  const slotIds=[12,41,73,90], locations=slotIds.map((_,i)=>95+442*i),chipY=576;
  const owners=[['R0',red,146],['R1',blue,793],['R2',green,1526]];
  for(const [id,color,x] of owners){
    tag(c,id,x,272,color,84);
    const table=state.tables[id];
    if(!table){txt(c,id==='R0'?'finished':cleared?'reserving 41':'waiting',x+101,296,29,dim);continue;}
    table.forEach((slot,i)=>{
      const sx=x+78+i*86,tx=locations[slotIds.indexOf(slot)]+182+(id==='R0'?-12:12);
      wire(c,sx,407,tx,chipY-5,color,3);
      cell(c,slot,sx-38,348,75,54,cream,color,color,31);
    });
  }
  const words=[r0.slice(0,4),state.words41,r1.slice(4,8),r1.slice(8)];
  slotIds.forEach((id,i)=>{
    const n=state.refs.get(id)??0;
    chip(c,locations[i],chipY,397,id,words[i],{size:24,free:state.free.includes(id),tint:i===0||i===1&&assigned?'#cce1c9':i===1?redPale:bluePale});
    mid(c,n+' live '+(n===1?'reader':'readers'),locations[i]+196,chipY+179,29,n?ink:dim,'Mono');
  });
  const hash=state.hash41?'old full-block hash present':'old hash removed';
  note(c,`Free queue  [${state.free.join(', ')}]     ·     KV 41: ${hash}`,
    assigned?'R2 writes into 41. The three entries in R1’s table still point to their original blocks.':cleared?'R2 owns 41. Its old bytes remain until the worker writes.':released?'The zero-reference slot remains cached while it waits for reuse.':'Four physical blocks hold five logical block references.');
}
function queue(c,k){
  header(c,'Cache hit and allocation','What happens to the free queue?');
  const stage=phase(k,4,'Fifty-five is left')?3:phase(k,4,'without removing')?2:phase(k,4,'Give it one reader')?1:0;
  const s=queueStates[stage];
  titleline(c,'Free queue  /  head first',95,292);
  for(let i=0;i<3;i++){
    const x=260+i*492,id=s.free[i];
    if(id===undefined){empty(c,x,346,353,114);continue;}
    cell(c,id,x,346,353,114,cream,line,ink,56);
    if(i<s.free.length-1)path(c,[[x+361,403],[x+455,403],[x+443,393],[x+455,403],[x+443,413]],dim,3);
  }
  for(const [i,id] of [71,55,9].entries()){
    const x=260+i*492,n=s.refs[id];
    chip(c,x,566,353,id,id===9?['The','bird','sat','still']:[],{size:23,free:!n});
    mid(c,n+' live '+(n===1?'reader':'readers'),x+176,748,29,ink);
  }
  note(c,['Two lookups for block 9, then one fresh allocation.','The first lookup removes 9 from the free queue.','The second lookup adds one live reader to 9.','Fresh space comes from the head. Only 55 remains free.'][stage],
    'A zero-reference cached block can be touched by its hash or reclaimed by the allocator.');
}
function admission(c,k){
  const b=k.beat.beatIndex,replay=b>=3;
  if(b===5)return activeLimit(c,k);
  const freed=replay||phase(k,2,'One block becomes free');
  const enlarged=phase(k,3,'This time propose five');
  const s=admit(enlarged?5:2,freed?1:0);
  const reserved=!replay&&s.admitted&&phase(k,2,'Reserve it');
  const dispatched=reserved&&phase(k,2,'Now the same');
  const writes=dispatched?[
    phase(k,2,'One fills the old page',0.78),
    phase(k,2,'the other starts the new one',0.72),
  ]:[0,0];
  const written=writes.filter(progress=>progress===1).length;
  header(c,'Admission','Can this whole slice enter the step?');
  cap(c,'PROPOSED INPUTS',94,281);cap(c,'STEP  /  4 PLACES AT START',981,281);
  const names=['a','b','c','d','e'].slice(0,s.inputs);
  wordRow(c,names,95,329,136*s.inputs,{fill:()=>bluePale});
  sockets(c,980,329,820,Array.from({length:4},(_,i)=>dispatched&&i<2?names[i]:null),()=>blue,{h:78});
  titleline(c,'Current page  /  one tail cell at start',94,488);
  titleline(c,freed?(reserved?'Newly reserved page':'One free physical page'):'Physical pool  /  zero free pages',b===2&&freed?1340:978,488);
  chip(c,130,557,686,73,['x','y','z',...(written>=1?['a']:[])],{mark:written===1?3:-1});
  if(freed)chip(c,987,557,686,41,written===2?['b']:[],{free:!reserved,mark:written===2?0:-1});
  else{
    empty(c,987,557,686,137);
    mid(c,'No page available',1330,625,42,dim,'Serif');
  }
  const pagePitch=(686-24)/4;
  const destinations=[130+12+3*pagePitch,987+12];
  writes.forEach((progress,i)=>{
    if(progress<=0||progress>=1)return;
    const pitch=820/4;
    const source=980+i*pitch+(pitch-9)/2;
    const target=destinations[i]+(pagePitch-8)/2;
    const t=smooth(progress);
    const turnY=527;
    const y=423+(648-423)*t;
    const x=source+(target-source)*clamp((y-turnY)/(648-turnY));
    const trail=[[source,412]];
    if(y>turnY)trail.push([source,turnY]);
    trail.push([x,y]);
    path(c,trail,blue,3);
    cell(c,names[i],x-23,y-22,46,44,blue,blue,cream,27);
  });
  const cursorX=written===0?destinations[0]:destinations[1]+(written===2?pagePitch:0);
  path(c,[[cursorX+2,711],[cursorX+2,730],[cursorX+39,730]],blue,6);
  const decided=replay?phase(k,4,'Hold the five-input'):phase(k,1,'The two positions');
  if(b===2){
    const status=written===s.inputs
      ? `${written} inputs entered. ${s.budget-written} step places remain.`
      : dispatched?'Same two inputs dispatched.'
      : reserved?'KV 41 reserved for this request.'
      : freed?'KV 41 is free. The cursor still waits.'
      :'The second input has no KV cell.';
    path(c,[[90,775],[1830,775]],line,2);
    txt(c,status,94,832,42,ink,{font:'Serif'});
  }
  else if(replay)note(c,decided&&s.memory&&!s.compute?`${s.inputs} inputs exceed ${s.budget} step places. The whole slice waits.`:enlarged?'Five inputs. One tail cell and one free four-position page.':'Rewind to the two-input proposal, just before reservation.',
    'The two-input slice fit. This replay starts with the same budget and free pool.');
  else if(freed)note(c,'A free block is available for the same request.','Next, reserve that block before advancing the write cursor.');
  else note(c,decided&&s.compute&&!s.memory?'Step space fits. The second input has no KV cell.':'Four input places remain. Where would the second position write?',
    'The cursor marks the next writable position in the request’s page table.');
}
function goodput(c,k){
  const b=k.beat.beatIndex;
  if(b>=3)return spacing(c,k);
  header(c,'Useful completions','Which run served more readers on time?');
  cap(c,'100-second window',96,275);
  txt(c,'TTFT < 300 ms     ·     per-request p99 token gap < 50 ms',570,275,32,dim);
  const colors=[green,gold,'#b7c3bc'];
  const legend=['Passed both limits','Completed late','Failed or unfinished'];
  for(let i=0;i<3;i++){
    dot(c,105+565*i,357,11,colors[i]);txt(c,legend[i],131+565*i,356,29,dim);
  }
  const rate=phase(k,1,'Compare the green');
  const bias=phase(k,2,'That estimate'),fixed=phase(k,2,'Replay matched');
  for(const [j,row] of runs.entries()){
    const x=204,y=459+177*j;
    cap(c,row.id,99,y+32,ink,46);
    let offset=x;
    for(const [i,n] of [row.pass,row.late,row.unresolved].entries()){
      const w=n*1.26;
      box(c,offset,y,w,55,colors[i]);offset+=w;
    }
    path(c,[[x,y+72],[x+1260,y+72]],line,2);
    txt(c,`${row.offered} offered   =   ${row.pass} on time   +   ${row.late} late   +   ${row.unresolved} failed or open`,x,y+106,29,ink);
    if(rate)txt(c,row.rate.toFixed(2)+'/s',1535,y+28,56,j?green:dim,{font:'Serif'});
  }
  const a=runs[0];
  if(b===2)note(c,fixed?`${a.offered/100} × (${a.pass} / ${a.offered.toLocaleString('en-US')}) = ${a.rate.toFixed(2)} useful completions/s`:bias?`${a.offered/100} × (${a.pass} / ${a.complete}) ≈ ${a.biased.toFixed(2)}/s  ·  inflated estimate`:'Which population supplied the pass fraction?',
    'Run A  /  1,000 offers, 600 successes, 550 successes within both limits.');
  else note(c,rate?'752 qualifying completions / 100 seconds = 7.52 per second.':'Count successful completions that meet both limits.',
    'Each bar uses the same request-count scale. The full measurement window includes failed and unfinished offers.');
}
function spacing(c,k){
  header(c,'Stream timestamps','What can these three events measure?');
  const axis=t=>305+t*54, y=523;
  path(c,[[146,y],[1786,y]],dim,4);
  events.forEach((e,i)=>{
    const x=axis(e.t);
    path(c,[[x,y-61],[x,y+33]],ink,3);dot(c,x,y,10,blue);
    const w=e.words.length*126;
    cap(c,'EVENT '+(i+1),x-w/2,313,dim,25);
    wordRow(c,e.words,x-w/2,359,w,{fill:()=>bluePale,size:30});
    mid(c,e.t+' ms',x,y+74,35,ink,'Mono');
  });
  const observed=phase(k,4,'The request mean'),result=phase(k,4,'The token-level tail');
  if(observed)for(let i=0;i<2;i++)bracket(c,axis(events[i].t)+8,axis(events[i+1].t)-8,y+137,gaps[i]+' ms between events',blue);
  note(c,result?`(24 − 0) / (4 − 1) = ${mean} ms mean time per output token`:'The first event carries two tokens with one timestamp.',
    result?'The within-event gap is unknown. Token-level p99 needs individual token timings.':'Engine event time relative to the first event. The clock measures reported events.');
}
const phaseNames=['Input','Queue','Prefill','Delivery'];
const phaseColors=[red,blue,green,gold];
function trace(c,k,final=false){
  const b=k.beat.beatIndex,which=Number(final),data=traces[which],total=sum(data);
  const known=final?phase(k,10,'Inspect admission'):phase(k,1,'Eighty of the');
  header(c,'Time to first token',final?'Which observation would you open first?':'Where did R1 wait for its first token?');
  cap(c,final?'Separate Finch request  /  supplied timings':'R1   /   arrival to first streamed token',94,278);
  const x=136,y=418,w=1630/total;
  let elapsed=0;
  data.forEach((duration,i)=>{
    const x0=x+elapsed*w;
    box(c,x0,y,duration*w-3,113,phaseColors[i],null,3);
    path(c,[[x0,y+115],[x0,y+138]],dim,2);
    elapsed+=duration;
    mid(c,duration,x0+duration*w/2,y+57,36,cream,'Mono');
  });
  cap(c,'0 ms',x,587,dim);txt(c,total+' ms',x+total*w,587,28,dim,{font:'Mono',align:'right'});
  data.forEach((duration,i)=>{
    const dx=125+i*441;
    dot(c,dx,689,10,phaseColors[i]);txt(c,`${phaseNames[i]}   ${duration} ms`,dx+25,689,32,ink);
  });
  if(known)bracket(c,x+w*data[0]+3,x+w*(data[0]+data[1])-5,389,'',blue);
  note(c,known?`${data[1]} of ${total} ms in the engine queue.`:'Find the longest interval. Which process owns it?',
    known?'Read the admission attempt for this request. If both resources fit, check scheduler CPU and dispatch time.':'These intervals locate the next observation. They do not establish a root cause.');
}
function handoff(c,k){
  header(c,'Scheduler → worker','What does the worker need for R1?');
  tag(c,'R1',105,271,blue,100);
  txt(c,'9 prompt positions',233,295,39,ink,{font:'Serif'});
  wordRow(c,r1,106,366,1695,{fill:i=>i<4?'#c6ddc6':bluePale});
  bracket(c,106,854,469,'4 cached',green);bracket(c,860,1796,469,'5 scheduled',blue);
  const rows=[['Request','R1'],['Assigned inputs',prefixPlan(9,6,'Finch').fresh],['Block table',tables.R1.join('   /   ')],['Sampling mode','greedy']];
  for(const [i,[label,value]] of rows.entries()){
    const x=104+i*433;
    cap(c,label,x,587,dim);txt(c,value,x,659,i===3?40:51,ink,{font:'Serif'});
    path(c,[[x,718],[x+379,718]],line,2);
  }
  const runner=phase(k,2,'The worker makes');
  note(c,runner?'Runner  →  tensors  →  compatible attention backend  →  sample':'Keep the ID, assigned count and physical addresses together.',
    'Tensor parallelism exchanges results inside layers. Pipeline stages exchange activations.');
}
function privateNet(c,k){
  header(c,'Serving boundaries','Who can send work to a worker?');
  const net=phase(k,4,'Keep internal');
  tag(c,'Client',95,433,red,166);
  path(c,[[261,456],[426,456]],dim,4);
  box(c,427,373,449,170,cream,green,8,4);
  mid(c,'Gateway',651,426,50,green,'Serif');
  mid(c,'Authenticate every route',651,487,30);
  path(c,[[877,455],[1010,455]],dim,4);
  c.save();c.setLineDash([12,8]);box(c,967,280,813,382,null,blue,20,3);c.restore();
  cap(c,'PRIVATE NETWORK',1006,324,blue);
  tag(c,'API',1006,430,blue,138);
  path(c,[[1145,454],[1280,454]],dim,4);
  tag(c,'Engine core',1280,430,ink,227);
  if(net){
    path(c,[[1393,480],[1393,556],[1517,556]],dim,4);tag(c,'Worker',1516,534,blue,169);
  }
  note(c,'HTTP route authorization and worker isolation govern different connections.',
    'Accept public ingress through the route gateway. Limit internal network traffic to required peers.');
}
function practice(c,k){
  const b=k.beat.beatIndex,newCase=b===8||b===7&&phase(k,7,'In a separate replay');
  const miss=phase(k,7,'All thirteen'),hit=phase(k,8,'Two full matching');
  const finish=phase(k,8,'The caller chose');
  const plan=prefixPlan(13,10,newCase?'Finch':'Wren');
  header(c,'Practice  /  whole-prompt admission','Will all thirteen prompt inputs fit?');
  cap(c,'REQUESTED ADAPTER',94,274);
  txt(c,newCase?'Finch':'Wren',455,272,46,blue,{font:'Serif'});
  cap(c,'Cached under Finch   ·   block size 4',981,277,dim);
  const x=157,p=121;
  for(let i=0;i<13;i++){
    const xx=x+i*p+Math.floor(i/4)*16;
    cell(c,'q'+i,xx,358,111,76,hit&&i<plan.skipped?'#b7d9c0':cream,line,ink,34);
  }
  bracket(c,x,x+9*p+32+110,469,'First 10 token IDs match',dim);
  cap(c,'STARTING RESOURCES',94,567);
  txt(c,'14 step places  ·  1 active decode  ·  3 free blocks',490,565,37,ink);
  for(const [i,adapter] of ['Wren','Finch'].entries()){
    const visible=i?hit:miss;
    if(!visible)continue;
    const pp=prefixPlan(13,10,adapter),y=659+i*84;
    tag(c,adapter,95,y-22,i?green:red,147);
    txt(c,`${pp.skipped} cached + ${pp.fresh} fresh`,284,y,32);
    if(i&&!finish)continue;
    txt(c,`${pp.fresh+1}/14 inputs`,770,y,31);
    for(let j=0;j<4;j++){
      const bx=1085+174*j;
      if(j>=3&&j>=pp.pages)continue;
      box(c,bx,y-28,156,55,j===3?paper:cream,j===3?red:line,3);
      for(let t=0;t<4;t++){
        const fresh=j*4+t;
        if(fresh>=pp.fresh)continue;
        box(c,bx+5+t*37,y-20,32,39,j===3?red:i?green:blue,null,2);
      }
    }
    if(i===0)cap(c,'4th',1792,y,red,22);
  }
  note(c,finish?'Finch can run the whole slice with the live decode.':hit?'The two matching blocks cover eight inputs. Five remain.':newCase?'Same resources. A separate caller requests Finch.':miss?'Wren fits the step but needs a fourth block.':'Ten matching IDs. Is there room for the whole Wren prompt?',
    finish?'Two fresh pages hold the five new KV positions. One free page remains.':'The active decode already has storage. Only complete compatible prefix blocks can be reused.');
}
function synthesis(c,k){
  switch(k.beat.beatIndex){
    case 0: case 1: return trace(c,k);
    case 2: return handoff(c,k);
    case 3: return parallel(c,k);
    case 4: return privateNet(c,k);
    case 5: return media(c,k);
    case 6: case 7: case 8: return practice(c,k);
    default: return trace(c,k,true);
  }
}
const painters=[opening,addresses,prefix,batching,ownership,admission,goodput,synthesis];
function draw(c,k){painters[k.beat.chapterIndex](c,k);}
export default {title,draw,check};
