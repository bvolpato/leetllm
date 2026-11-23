import {C,words,mono,rect,line,dot,board,header,foot,cue,packet,f2,lerp} from './bench.mjs';
import {gpuReceiptFixtures,classifyGpuReceipt,routeState,fleetState,catalogState,diagState} from './incident.mjs';
export function chip(c,x,y,w,h,label,sub,fill=C.board) {
  for(let j=12;j<h-5;j+=11) {
    rect(c,x-6,y+j,6,4,C.gold); rect(c,x+w,y+j,6,4,C.gold);
  }
  board(c,x,y,w,h);
  rect(c,x+15,y+15,w-30,h-30,fill, C.rail);
  words(c,label,x+w/2,y+h/2+1,w<170?19:23,C.cream,{bold:true,align:'center'});
  mono(c,sub,x+w/2,y+h/2+23,13,C.dim,'center');
}
export function switchPort(c,x,y,closed) {
  rect(c,x-22,y-22,45,44,C.paper);
  dot(c,x-16,y,4,C.paper,C.ink); dot(c,x+16,y,4,C.paper,C.ink);
  line(c,[[x-13,y-2],[x+14,y-(closed?21:2)]],closed?C.rust:C.green,3.5);
}
function replicaRoutes(c,k) {
  const s=routeState(k);
  header(c,'Which streams change owner?','Application readiness   /   two-replica trace');
  const paths=[[[92,309],[291,309],[370,270],[425,270],[480,218],[675,218]],
    [[92,309],[291,309],[377,355],[675,355]]];
  for (const [i,path] of paths.entries())line(c,path,i===0 && s.closed?C.line:C.green,4);
  switchPort(c,566,218,s.closed);
  mono(c,s.closed?'inlet closed':'inlet open',566,255,14,s.closed?C.rust:C.green,'center');
  chip(c,681,168,206,97,'Summarizer','GPU-7f3  /  P17');
  chip(c,681,307,206,97,'Healthy peer','GPU-1  /  P8');
  for(let i=0;i<2;i++){
    const sy=149+i*30;
    const endX=699+i*30;
    line(c,[[186,sy],[endX,sy],[endX,167]],C.blue,3);
    dot(c,186,sy,5,C.blue);
    mono(c,s.streams[i].id+'  /  open',75,sy+5,15,C.ink);
  }
  mono(c,'Existing streams',75,127,14,C.muted);
  mono(c,'New requests',73,286,15,C.muted);
  dot(c,291,309,7,C.green);
  if(s.arrives)packet(c,paths[1],s.travel,'R3');
  foot(c,s.owner?'R3 reached P8. R1 and R2 still belong to P17.':s.closed?'Only future admission has changed.':'The router has two inlets for new work.',
    'An existing stream has an owner. Reconcile completion and side effects before retrying.');
}
function errorRecords(c,k){
  const b=k.beat.beatIndex;
  const clear=Boolean(cue(k,2,'A second read returns success'));
  const http=Boolean(cue(k,2,'both pass an HTTP probe'));
  const relaunch=Boolean(cue(k,3,'Terminate and relaunch'));
  const discretionary=Boolean(cue(k,3,'restart to policy'));
  header(c,'Which CUDA process requires relaunch?','Same-thread last-error reads   /   captured results preserved');
  for(const [i,row] of [gpuReceiptFixtures[0],gpuReceiptFixtures[6]].entries()){
    const x=54+i*437;
    words(c,i?'Vision worker':'Summarizer',x,153,25,C.ink,{font:'Serif',bold:true});
    mono(c,i?'Kernel launch → later sync':'Allocation call → return',x,185,15,C.muted);
    board(c,x,200,408,79);
    mono(c,'FIRST OBSERVED ERROR',x+16,225,13,C.dim);
    mono(c,i?'cudaErrorIllegalAddress':'cudaErrorMemoryAllocation',x+16,255,18,C.cream);
    if(clear){mono(c,'Second last-error read',x,315,15,C.muted);mono(c,'cudaSuccess',x+400,315,16,C.green,'right');}
    if(http){mono(c,'HTTP probe',x,345,15,C.muted);mono(c,'Pass',x+400,345,16,C.green,'right');}
    if(i ? relaunch : discretionary){
      const fatal=classifyGpuReceipt(row).mustRelaunch;
      rect(c,x,367,408,45,fatal?'#edd9c9':C.light);
      words(c,fatal?'Terminate + relaunch':'Restart at owner discretion',x+12,397,20,fatal?C.rust:C.ink,{bold:true});
    }
  }
  foot(c,relaunch?'The exact captured error determines the process obligation.':'Is a cleared last-error record enough?',
    b===3?'A replacement process still needs fresh admission evidence.':'A later synchronization call can report an earlier asynchronous failure.');
}
function scheduler(c,k){
  const s=fleetState(k);
  header(c,'Does device health evict the assigned pod?','Scheduler   /   platform-owned illustration');
  board(c,53,153,854,200);
  mono(c,s.cordon?'NODE  /  CORDONED':'NODE  /  ORDINARY PLACEMENT ENABLED',76,187,15,C.mint);
  for(let i=0;i<s.capacity;i++){
    const x=80+i*208;
    const bad=i===0 && s.unhealthy;
    rect(c,x,214,167,88,bad?'#653d31':C.rail,C.dim,1);
    words(c,'GPU '+i,x+13,243,22,C.cream,{bold:true});
    mono(c,bad?'unhealthy':'healthy',x+13,275,16,bad?'#ffcfad':C.mint);
    if(i===0 && s.pod){line(c,[[x+76,302],[x+76,372]],C.gold,3);rect(c,x-5,372,348,40,C.cream,C.gold,2);mono(c,'assigned pod   /   local cache',x+8,398,16,C.ink);}
  }
  if(!s.pod)mono(c,'Evicted pod  /  local cache removed',76,397,17,C.rust);
  mono(c,'Capacity '+s.capacity+'     Allocatable '+s.allocatable,887,332,18,C.cream,'right');
  foot(c,s.evicted?'Eviction removes this pod and its ephemeral data.':s.cordon?'Cordon blocks new placements. The pod remains.':s.unhealthy?'The device plugin changes future assignments.':'All four devices report healthy.',
    'Placement, application readiness and eviction have separate owners and effects.');
}
export function containment(c,k){
  const b=k.beat.beatIndex;
  if(b<2) replicaRoutes(c,k);
  else if(b<4)errorRecords(c,k);
  else if(b===4)scheduler(c,k);
  else{
    const s=catalogState(k);
    header(c,'How far does the driver event reach?','Xid catalog examples   /   three applications sharing a device');
    mono(c,'Xid '+s.code+'   /   '+(s.uncontained?'uncontained memory error':'contained memory error'),66,159,18,C.ink);
    board(c,53,200,854,135);
    for(const [i,app] of ['A','B','C'].entries()){
      const affected=s.affected.includes(app),x=84+i*276;
      rect(c,x,225,231,84,affected?'#714635':C.rail);
      words(c,'Application '+app,x+16,255,20,C.cream,{bold:true});
      mono(c,affected?'affected':'unaffected',x+16,287,16,affected?'#ffcfad':C.mint);
    }
    words(c,s.action?(s.uncontained?'Isolate → GPU reset → application restarts':'Restart application A'):'Which recovery action applies?',64,396,28,C.ink,{font:'Serif',bold:true});
    foot(c,s.uncontained?'The platform owner controls device-wide recovery.':'Containment identifies the affected application.',
      'Match the exact event to the recovery action for this device and driver.');
  }
}

export function diagnostics(c,k) {
  const s=diagState(k),b=k.beat.beatIndex;
  header(c,'Can this pair sustain the required transfer?','DCGM   /   isolated pair A ↔ B   /   required: PCIe + nvbandwidth');
  const y=214;
  chip(c,60,151,175,108,'GPU A','rank 0');
  const skipped=s.stage===1 && !s.testing;
  chip(c,725,151,175,108,'GPU B',skipped?'unavailable':'rank 1');
  for(let i=0;i<4;i++){
    const yy=y-24+i*13;
    line(c,[[240,yy],[324,yy],[343,yy-9],[618,yy-9],[637,yy],[719,yy]],skipped?C.line:C.green,2.2);
  }
  if(skipped) {
    rect(c,466,165,30,90,C.paper);line(c,[[471,246],[492,171]],C.rust,3);
  }else if(s.measured!==null){
    const phase=cue(k,s.stage===2?2:3,s.stage===2?'reaches eleven point two':'A third run reaches',1.4);
    dot(c,lerp(250,710,phase),y-7,5,C.orange,C.ink);
  }
  mono(c,s.results.pcie?'PCIe   PASS':'PCIe   awaiting test',73,293,16,s.results.pcie?C.green:C.muted);
  mono(c,'Run '+s.run+'  /  exit '+(s.exit===null?'pending':s.exit),891,293,16,C.ink,'right');
  const gx=80,gy=350,gw=530,scale=gw/24;
  mono(c,'Measured bandwidth (GB/s)',gx,329,16,C.ink);
  rect(c,gx,gy,gw,25,C.light);
  if(s.measured!==null) rect(c,gx,gy,s.measured*scale,25,s.measured>=s.required?C.green:C.rust);
  for(const n of [0,8,16,24]){line(c,[[gx+n*scale,gy+26],[gx+n*scale,gy+34]],C.muted);mono(c,n,gx+n*scale,gy+56,14,C.muted,'center');}
  line(c,[[gx+s.required*scale,gy-11],[gx+s.required*scale,gy+31]],C.ink,2.2);
  mono(c,'min 16',gx+s.required*scale,gy-18,14,C.ink,'center');
  words(c,s.measured===null?(skipped?'Skipped':'Awaiting test'):s.measured.toFixed(1)+' GB/s',659,371,27,s.stage===2?C.rust:C.ink,{bold:true});
  if(s.results.memory)mono(c,'Memory test: FAIL',659,406,16,C.rust);
  const coverage=s.results.memory==='Fail' && b===3?'Does the extra memory failure change coverage?':
    s.results.memory==='Fail'?'Coverage incomplete. Decode the extra memory failure.':
    s.complete?'Both required tests passed in this run.':s.results.bandwidth==='Fail'?'Coverage incomplete. The measured rate missed the minimum.':
    s.testing?'Fresh run on the pair. Await the measured rate.':
    s.stage===1 && b>=2?'Coverage incomplete. The peer path has no measurement.':
    s.stage===1?'Does exit 0 establish bandwidth coverage?':'Which test exercises the path that stalled?';
  foot(c,coverage,'A lane check tests connectivity. A timed transfer measures throughput between the selected GPUs.');
}

