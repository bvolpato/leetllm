import {C,words,mono,rect,line,dot,board,header,foot,cue,clamp,packet,f2} from './bench.mjs';
import {receipt,request,exercise,memoryReceipt,admissionChecks,burnState,soakTelemetry,latchState,classifyGpuReceipt} from './incident.mjs';
import {chip,switchPort} from './operations.mjs';

function trace(c,k) {
  const s=burnState(k),x=95,y=382,step=68,scale=90;
  const b = k.beat.beatIndex;
  const finished = (beat, phrase) =>
    b > beat || (b === beat && k.elapsed + 1e-9 >= k.wordCue(phrase).end);
  const fifthKnown = finished(1, 'At one point four gibibytes');
  const pendingFifth = b === 1 && s.completed === 5 && !fifthKnown;
  const completed = pendingFifth ? 4 : s.completed;
  const reading = pendingFifth ? soakTelemetry[3] : s.reading;
  const belowLimit = !s.revised && s.abort && finished(1, 'below the replay size');
  const stopped = !s.revised && s.abort && finished(1, 'Stop the test and save the trace');
  header(c,'Will the largest block stay above the limit?','Summarizer   /   bounded allocation-and-release cycles');
  mono(c,'Largest reusable block (GiB)',56,149,15,C.ink);
  for(const v of [0,1,2]){
    line(c,[[x,y-v*scale],[x+7*step+12,y-v*scale]],C.line);
    mono(c,v,x-16,y-v*scale+4,14,C.muted,'right');
  }
  const threshold=y-request*scale;
  line(c,[[x,threshold],[x+step*7+15,threshold]],C.rust,2,[6,5]);
  rect(c,x+5,threshold-20,108,18,C.paper);
  mono(c,'abort < 1.50',x+10,threshold-6,13,C.rust);
  const plot=(revised,n,color,weight)=>{
    const pts=soakTelemetry.slice(0,n).map((r,i)=>[x+i*step,y-(revised?r.revised:r).layout*scale]);
    if(pts.length)line(c,pts,color,weight);
    for(const [a,b] of pts)dot(c,a,b,3.5,color);
    if(pts.length)dot(c,...pts.at(-1),5,color);
  };
  if (s.revised) {
    plot(false, 5, C.line, 2.3);
    const stopX = x + 4 * step, stopY = y - soakTelemetry[4].layout * scale;
    dot(c, stopX, stopY, 6, C.rust);
    mono(c, 'Original stop · cycle 5', stopX + 13, stopY + 32, 15, C.rust);
  }
  plot(s.revised, completed, s.revised ? C.green : C.blue, 3.6);
  if (pendingFifth) {
    const { start, end } = k.wordCue('At one point four gibibytes');
    const travel = clamp((k.elapsed - start) / (end - start));
    const sampleX = x + (3 + travel) * step;
    const sampleY = y - (soakTelemetry[3].layout + travel * (soakTelemetry[4].layout - soakTelemetry[3].layout)) * scale;
    if (travel > 0) {
      line(c, [[x + 3 * step, y - soakTelemetry[3].layout * scale], [sampleX, sampleY]], C.blue, 2.5, [4, 4]);
      dot(c, sampleX, sampleY, 5, C.paper, C.blue);
    }
  }
  if(belowLimit){
    const sampleX=x+(s.completed-1)*step, sampleY=y-s.reading.layout*scale;
    const bracketX=sampleX+12, labelX=bracketX+21, labelY=sampleY+33;
    dot(c,sampleX,sampleY,6,C.rust);
    line(c,[[sampleX+8,threshold],[bracketX,threshold],[bracketX,sampleY],[sampleX+8,sampleY]],C.rust,1.8);
    line(c,[[bracketX,sampleY],[bracketX+13,labelY-6]],C.rust,1.5);
    mono(c,f2(request-s.reading.layout)+' GiB below limit',labelX,labelY,17,C.rust);
  }
  for(let i=0;i<8;i++)mono(c,i+1,x+i*step,y+21,14,C.muted,'center');
  mono(c,'Cycle',x-22,y+21,14,C.muted,'right');
  board(c,650,143,253,263);
  mono(c,s.revised?'LOWER CONCURRENCY':'AFTER RESTART',668,172,14,C.mint);
  const showPeak = reading && (!s.revised || completed < 8 || finished(2, 'peak use of thirty-one point three gibibytes'));
  const showHeadroom = reading && (!s.revised || completed < 8 || finished(2, 'eight point seven gibibytes'));
  const items = [
    ['Cycle', completed || 'Ready'],
    ['Largest block', reading ? f2(reading.layout) : '··'],
    ['Peak use', showPeak ? f2(receipt.capacity_gib - reading.headroom) : '··'],
    ['Headroom', showHeadroom ? f2(reading.headroom) : '··'],
  ];
  items.forEach(([label,value],i)=>{
    mono(c,label,668,215+i*41,14,C.dim);
    mono(c,value,884,215+i*41,18,C.cream,'right');
  });
  mono(c,`Memory in GiB  /  ${receipt.capacity_gib} total`,668,383,13,C.dim);
  if (stopped) mono(c, 'TRACE SAVED · CYCLE 5', 667, 402, 17, C.rust);
  const outcome = s.revised ? 'The lower cap repeats the same allocation lifecycle.' :
    stopped ? 'Stop at cycle 5. Save the threshold crossing.' : 'Compare each sample with the 1.50 GiB request.';
  const context = s.revised ? 'The first run stays visible. Headroom = capacity minus peak use.' :
    'This is the declared stop limit. Other pools may still serve the allocation.';
  line(c, [[46, 413], [914, 413]], C.line);
  words(c, outcome, 46, 435, 22, C.ink, { bold: true });
  words(c, context, 46, 455, 16, C.muted);
}
function canary(c,k){
  const alloc=cue(k,4,'allocate the workspace');
  const send=cue(k,4,'exchange the buffer',1.6);
  const freed=cue(k,4,'then release it');
  const repeat=cue(k,4,'Repeat that lifecycle',5.0);
  // Repeat allocate, exchange and release in three discrete cycles on the same pair.
  const u=repeat*3, iter=Math.min(2,Math.floor(u)), phase=u-iter;
  const repeating=repeat>0;
  const live=repeating?phase<.82:Boolean(alloc&&!freed);
  const travel=repeating?clamp((phase-.2)/.52):send;
  const cycle=repeating?2+iter:1;
  header(c,'Which canary exercises both ranks?','Isolated workload replay   /   same allocation size and peer pair');
  chip(c,65,167,205,110,'Rank 0','summarizer');
  chip(c,689,167,205,110,'Rank 1','collective peer');
  const cable=[[277,225],[361,225],[380,205],[581,205],[603,225],[681,225]];
  line(c,cable,travel>0?C.green:C.line,4);
  if(live && travel>0 && travel<1)packet(c,cable,travel,'buf');
  rect(c,79,309,179,40,live?C.orange:C.cream,live?C.rust:C.line,1.7);
  mono(c,live?'1.50 GiB live':'workspace free',168,335,15,live?C.ink:C.muted,'center');
  rect(c,707,309,169,40,travel===1?C.mint:C.cream,C.line,1.7);
  mono(c,travel===1?'exchange seen':'await exchange',791,335,15,C.ink,'center');
  mono(c,'Cycle '+cycle,476,280,18,C.ink,'center');
  foot(c,repeating?'Repeat allocation, peer exchange and release under load.':alloc?'Watch the workspace through the two-rank exchange.':'Can one successful HTTP response test this peer path?',
    'Observe memory, links, errors, clocks, power, temperature and latency against the declared limits.');
}
function samplePair(c,k){
  const cycle=5,r=soakTelemetry[cycle-1];
  const compare=cue(k,3,'Under the lower cap');
  header(c,'What changed at the same cycle?','Burn-in receipts   /   cycle 5   /   repeated 1.50 GiB workspace');
  mono(c,'MEASUREMENT',72,148,14,C.muted);
  mono(c,'ORIGINAL CAP',500,148,14,C.muted,'center');
  mono(c,'LOWER CAP',772,148,14,C.muted,'center');
  const measures=[['Largest block','layout',2,'GiB'],['Link rate','link',1,'GB/s'],['Link errors','errors',0,''],
    ['Power','power',0,'W'],['Temperature','temperature',1,'°C'],['Request p95','latency',1,'ms']];
  measures.forEach(([name,key,places,unit],i)=>{
    const y=180+i*40;
    if(i%2===0)rect(c,54,y-20,850,35,C.light);
    words(c,name,72,y+4,18,C.ink);
    mono(c,r[key].toFixed(places)+' '+unit,500,y+4,17,C.ink,'center');
    mono(c,compare?r.revised[key].toFixed(places)+' '+unit:'··',772,y+4,17,compare?C.green:C.muted,'center');
  });
  foot(c,compare?'Compare the two runs at the same point in the workload.':'The original run stopped at this sample.',
    'Power, temperature, link errors and latency are observed alongside the allocator reading.');
}
export function burnIn(c,k) {
  if(k.beat.beatIndex<3) trace(c,k);
  else if(k.beat.beatIndex===3) samplePair(c,k);
  else canary(c,k);
}

function exerciseFrame(c,k){
  const r=exercise,m=memoryReceipt(r),x=71,w=816,scale=w/r.capacity_gib;
  header(c,'What can you infer from this new receipt?','Practice   /   GPU A   /   native allocator, captured OOM');
  mono(c,'Capacity '+r.capacity_gib+' GiB',x,150,16,C.ink);
  const bands=[[r.pytorch_allocated_gib,C.blue],[r.inactive_split_block_total_gib,C.mint],[m.other,C.gold],[m.outside,'#ad91bd'],[m.free,C.cream]];
  let edge=x;
  for(const [size,fill] of bands){rect(c,edge,173,size*scale,48,fill,C.ink,1);edge+=size*scale;}
  const live=r.pytorch_allocated_gib,reserve=r.pytorch_reserved_gib,used=r.nvml_device_used_gib,split=r.inactive_split_block_total_gib,req=r.oom_request_gib;
  mono(c,live+' live',x+13,204,18,C.cream);
  mono(c,split+' split',x+live*scale+9,203,14,C.ink);
  line(c,[[x,229],[x,238],[x+reserve*scale,238],[x+reserve*scale,229]],C.green,1.8);
  mono(c,reserve+' reserved',x+reserve*scale,260,16,C.green,'right');
  mono(c,used+' device-used',x+used*scale,150,16,C.ink,'right');
  line(c,[[x+used*scale,153],[x+used*scale,169]],C.ink);
  mono(c,'request '+f2(req)+' GiB',x,265,17,C.rust);
  const steps=[
    ['Reserve gap',reserve+' − '+live,m.gap,'is six'],
    ['Other reserve',reserve+' − '+live+' − '+split,m.other,'one gibibyte of other reserve'],
    ['Outside reserve',used+' − '+reserve,m.outside,'three and a half'],
    ['Request deficit',req+' − ('+r.capacity_gib+' − '+used+')',m.deficit,'by half a gibibyte']
  ];
  for(const [i,[label,formula,value,phrase]] of steps.entries()) {
    const xx=59+i*218;
    words(c,label,xx,312,17,C.muted,{bold:true});mono(c,formula,xx,345,14,C.ink);
    const shown=cue(k,1,phrase);
    words(c,shown?f2(value)+' GiB':'?',xx,400,30,shown?C.green:C.muted,{font:'Serif',bold:true});
  }
  foot(c,cue(k,1,'Investigate the layout')?'Investigate the layout and attribute outside use.':'Work each difference from the same snapshot.',
    'The colored lengths represent accounting totals. The outside owners still need evidence.');
}
function mixedFault(c,k) {
  const row={...exercise,cuda_error:'illegal_address',new_uncorrectable_ecc:1};
  const result=classifyGpuReceipt(row);
  header(c,'Who acts on each part of the new report?','GPU A   /   incident 04   /   evidence after the allocation failure');
  board(c,54,187,286,157);
  mono(c,'ONE RECEIPT',75,219,14,C.mint);
  words(c,'Decoded memory defect',75,259,19,C.cream,{bold:true});
  mono(c,'cudaErrorIllegalAddress',75,306,15,C.cream);
  const branches=[
    [169,'Platform owner',result.hypothesis==='device-memory-fault'?'Quarantine GPU A':'Investigate GPU A','The platform owner quarantines'],
    [325,'Workload owner',result.mustRelaunch?'Relaunch the process':'Review process state','relaunches the affected process']
  ];
  for(const [y,owner,action,phrase] of branches){
    const shown=cue(k,2,phrase);
    line(c,[[340,266],[396,266],[459,y+32],[510,y+32]],shown?C.rust:C.line,3);
    dot(c,510,y+32,5,shown?C.rust:C.line);
    words(c,owner,535,y+6,19,C.muted);
    words(c,shown?action:'Which action?',535,y+47,27,shown?C.ink:C.muted,{font:'Serif',bold:true});
  }
  foot(c,'Preserve both obligations under their respective owners.','Interpret each driver Xid in its catalog and correlate it with device and application evidence.');
}
function incidentClock(c,k,s) {
  header(c,'Can ten quiet minutes clear a quarantine?','Authenticated fault reports   /   one record per device and incident');
  const cx=207,cy=266,r=101,angle=-Math.PI/2+s.time/600*2*Math.PI;
  dot(c,cx,cy,r,C.cream,C.ink);
  for(let i=0;i<60;i++){
    const a=i*Math.PI/30,ri=i%5===0?r-14:r-5;
    line(c,[[cx+Math.cos(a)*ri,cy+Math.sin(a)*ri],[cx+Math.cos(a)*(r-2),cy+Math.sin(a)*(r-2)]],i%5===0?C.ink:C.line,1.4);
  }
  line(c,[[cx,cy],[cx+Math.cos(angle)*(r-20),cy+Math.sin(angle)*(r-20)]],C.green,4);
  dot(c,cx,cy,6,C.ink);
  rect(c,cx-43,cy+30,86,30,C.paper);
  mono(c,`${String(Math.floor(s.time/60)).padStart(2,'0')}:${String(s.time%60).padStart(2,'0')}`,cx,cy+52,18,C.ink,'center');
  mono(c,'quiet interval  /  min:sec',cx,398,14,C.muted,'center');
  mono(c,'INCIDENT KEY',395,164,15,C.muted);mono(c,'REPORTS',680,164,15,C.muted,'center');mono(c,'ROUTE',851,164,15,C.muted,'center');
  s.records.forEach((record,i)=>{
    const y=190+i*85;
    rect(c,384,y,523,64,C.light);
    mono(c,record.key,399,y+38,18,C.ink);
    mono(c,record.recurrence,680,y+39,23,C.ink,'center');
    switchPort(c,852,y+34,record.quarantined);
  });
  words(c,s.time===600?'Collection complete  /  0 new faults':'Count recurrences for each key.',390,399,21,C.ink);
  foot(c,'What did the quiet collection change?','The count belongs to the incident. The clock measures only the observation window.');
}
const gateLabels={identity:'Identity + owners',idle:'Idle baseline',functional:'Functional output',memory:'Memory envelope',device:'Device findings',
  fabric:'Fabric path','thermal-power':'Thermal + power',soak:'Observed soak'};
function release(c,k,s){
  const b=k.beat.beatIndex;
  header(c,'May the repaired worker take this arrival?','Replacement process on GPU A   /   incident 04');
  mono(c,'CURRENT GATE EVIDENCE',55,137,14,C.muted);
  for(const [i,name] of admissionChecks.entries()){
    const x=55+Math.floor(i/4)*216,y=168+(i%4)*47,pass=s.checks.includes(name);
    rect(c,x,y-15,14,14,pass?C.green:C.paper,pass?C.green:C.rust,1.5);
    if(pass)line(c,[[x+2,y-8],[x+6,y-4],[x+12,y-12]],C.cream,1.7);
    words(c,gateLabels[name],x+23,y,16,pass?C.ink:C.rust);
  }
  words(c,s.checks.length+' / 8 pass',55,384,35,C.ink,{font:'Serif',bold:true});
  mono(c,s.approved?'Owners authorized release':'Release pending',56,412,15,s.approved?C.green:C.rust);
  const hi=[[510,253],[558,253],[615,196],[726,196]],lo=[[510,253],[558,253],[615,321],[726,321]];
  line(c,hi,s.held?C.line:C.green,3.5);line(c,lo,C.green,3.5);dot(c,558,253,6,C.green);
  line(c,[[726,196],[751,196]],s.held?C.line:C.green,3.5);line(c,[[726,321],[751,321]],C.green,3.5);
  switchPort(c,662,196,s.held);
  chip(c,758,151,144,88,'GPU A',s.held?'quarantined':'small share');
  chip(c,758,279,144,88,'Healthy peer','accepting');
  if(b===4 && cue(k,4,'Where should the next arrival'))packet(c,lo,0,'R4');
  if(b>=5)packet(c,lo,s.first,'R4');
  if(b===6 && s.approved)packet(c,hi,s.second,'R5');
  mono(c,'GPU B / 09   held',750,406,14,C.rust);
  const main=s.approved?(s.second===1?'R5 reached the repaired worker in the small traffic share.':'Owners released GPU A for a small traffic share.'):
    s.checks.length===8?'All evidence is present. The release is a separate action.':
    s.checks.length===7?'The HTTP probe passed. The fabric gate is pending.':'Quarantine remains in force while fresh checks arrive.';
  foot(c,main,s.approved?'Expand only after the agreed observation window. Close the route if a gate fails.':'The healthy replica remains available for new requests.');
}
export function readmit(c,k) {
  const b=k.beat.beatIndex;
  if(b<2)exerciseFrame(c,k);
  else if(b===2)mixedFault(c,k);
  else {
    const s=latchState(k);
    if(b===3 || (b===4 && !cue(k,4,'For the repaired worker')))incidentClock(c,k,s);else release(c,k,s);
  }
}

