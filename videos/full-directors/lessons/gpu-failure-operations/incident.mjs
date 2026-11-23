import assert from 'node:assert/strict';
import {gpuReceiptFixtures, admissionChecks, soakTelemetry} from '../../../films/gpu-failure-operations/fixtures.mjs';
import {classifyGpuReceipt, memoryReceipt, historyRing, covered, gpuIncident, readmission,freshGpuReceipt} from '../../../films/gpu-failure-operations/arithmetic.mjs';
import {cue} from './bench.mjs';
export {gpuReceiptFixtures, classifyGpuReceipt, memoryReceipt, admissionChecks, soakTelemetry};
export const receipt = gpuReceiptFixtures[0];
export const request = receipt.oom_request_gib;
export const units = n=>Math.round(n*100);
// The eight span lengths come from the selected master and short. This arrangement is illustrative.
export const holes=[88,86,84,82,80,78,62,50];
const live=[250,26,340,380,460,350,280,460,464];
let offset=0;
const blocks=[];
function append(size,kind) {
  blocks.push({start:offset,size,kind}); offset+=size;
}
for(let i=0;i<holes.length;i++){append(live[i],'live'); append(holes[i],'hole');}
append(live.at(-1),'live');
append(units(memoryReceipt(receipt).other),'other');
append(units(memoryReceipt(receipt).outside),'outside');
append(units(memoryReceipt(receipt).free),'free');
export const layout=blocks;
export const spans=blocks.filter(b=>b.kind==='hole');
export function probe(k) {
  const walk=cue(k,1,'visits each one',4.5);
  const index=cue(k,2,'Even the widest piece') ? holes.indexOf(Math.max(...holes)) : Math.min(7,Math.floor(walk*8));
  const among=cue(k,1,'Now try');
  const block=among ? spans[index] : blocks.at(-1);
  return {block,index,among,deficit:units(request)-block.size,
    tried: walk===1 ? 8 : Math.floor(walk*8), verdict:cue(k,3,'Inspect the allocator')};
}
export function joinState(k){
  const lastUse=cue(k,1,'In this replay',1.3)===1;
  const freed=cue(k,1,'Its free completes',0.65)===1;
  const merge=cue(k,1,'The adjacent pieces join',0.65);
  const placement=cue(k,1,'place the request',1.05);
  const placed=placement===1;
  const remainder=cue(k,1,'and leave half a gibibyte',1.35)===1 && placed;
  const lengths=[holes[0], live[1], holes[1]];
  const available=lengths.reduce((a,b)=>a+b,0);
  return {lastUse,freed,merge,placement,placed,remainder,lengths,available,remaining:available-units(request)};
}
export function eventCase(k) {
  const which=cue(k,2,'With an asynchronous allocator') ? 3 : cue(k,2,'Go back to the original failure') ? 0 :
    cue(k,2,'remove its size') ? 2 : cue(k,2,'to success') ? 1 : 0;
  const delta=[{}, {cuda_error:'success'}, {oom_request_gib:null}, {allocator_backend:'cudaMallocAsync'}][which];
  const row={...receipt,...delta};
  return {which,row,...classifyGpuReceipt(row)};
}
export function ringState(k) {
  const p=cue(k,2,'records events',2);
  let n=Math.min(4,Math.floor(4*p));
  if(k.beat.beatIndex>=3){
    n=4+cue(k,3,'E replaces A')+cue(k,3,'F replaces B');
  }
  const events='ABCDEF'.slice(0,n).split('');
  const slots=Array(4).fill(null);
  events.forEach((id,i)=>{slots[i%4]=id;});
  return {...historyRing(events,4),slots,n,saved:Boolean(cue(k,3,'Restrict access'))};
}
export function routeState(k) {
  const closed=Boolean(cue(k,1,'Close the inlet'));
  const arrives=Boolean(cue(k,1,'a later request arrives'));
  const travel=cue(k,1,'Follow it',1.7);
  return {closed,arrives,travel,owner:travel===1?'P8':null,streams:[{id:'R1',owner:'P17'},{id:'R2',owner:'P17'}]};
}
export function fleetState(k) {
  const unhealthy=cue(k,4,'Mark one assigned device');
  const cordon=cue(k,4,'A platform cordon');
  const evicted=cue(k,4,'Once this pod is evicted');
  return {unhealthy,cordon,evicted,capacity:4,allocatable:4-unhealthy,pod:!evicted,cache:!evicted};
}
export function catalogState(k) {
  const uncontained=Boolean(cue(k,5,'Code ninety-five'));
  const action=Boolean(uncontained?cue(k,5,'resets it before'):cue(k,5,'Restart that application'));
  return {code:uncontained?95:94,uncontained,action,affected:uncontained?['A','B','C']:['A']};
}
export function diagState(k){
  const stage=cue(k,3,'reports a memory failure') ? 4 : cue(k,3,'A third run reaches') ? 3 :
    cue(k,2,'reaches eleven point two') ? 2 : cue(k,1,'bandwidth is skipped') ? 1 : 0;
  const testing=stage===1 && Boolean(cue(k,2,'In a fresh run'));
  const pcie=Boolean(testing ? cue(k,2,'PCIe passes again') : cue(k,1,'PCIe passes'));
  const results=pcie?{pcie:'Pass'}:{};
  if(stage && !testing) results.bandwidth=['','Skip','Fail','Pass','Pass'][stage];
  if(stage===4) results.memory='Fail';
  const measured=[null,null,11.2,18.4,18.4][stage];
  const anyFail=Object.values(results).includes('Fail');
  return {stage,testing,results,measured,complete:covered(results),exit:stage && !testing?Number(anyFail):null,
    run:testing?2:[1,1,2,3,3][stage],required:16};
}
export function burnState(k) {
  const revised=cue(k,2,'Start a separate run');
  const step=cue(k,0,'Follow the first four cycles',3.2);
  const fifth=cue(k,1,'Take the fifth sample');
  const completed=revised ? Math.min(8,Math.floor(cue(k,2,'Complete eight cycles',3.2)*8)) : (fifth?5:Math.floor(4*step));
  const abort=Boolean(!revised && completed && soakTelemetry[completed-1].layout < request);
  const sample=completed ? soakTelemetry[completed-1] : null;
  const reading=revised ? sample?.revised : sample;
  return {revised,completed,abort,reading,peak:reading?receipt.capacity_gib-reading.headroom:null};
}
export const exercise=freshGpuReceipt();
const firstKey='GPU-A / 04', secondKey='GPU-B / 09';
export function latchState(k) {
  const n=k.beat.beatIndex<3?1:1+Math.floor(cue(k,3,'Two fault reports',.7))+Math.floor(cue(k,3,'and one for B',.7));
  let records=[];
  for(const key of [firstKey,firstKey,secondKey].slice(0,n))
    records=gpuIncident(records,{kind:'fault',key});
  const time=Math.round(600*cue(k,3,'advance the incident clock',3.5));
  if(time===600) records=gpuIncident(records,{kind:'quiet',key:firstKey});
  const soak=Boolean(cue(k,4,'soak now passes'));
  const fabric=Boolean(cue(k,5,'The probe passes'));
  const evidence={identity:'check identity',idle:'the idle baseline',functional:'functional output',memory:'the memory envelope',device:'device findings', 'thermal-power':'thermal and power limits'};
  const checks=admissionChecks.filter(g=>g==='soak'?soak:g==='fabric'?fabric:cue(k,4,evidence[g]));
  const owner='GPU-A/replacement';
  const receipts=checks.map(check=>({check,owner,status:'Pass'}));
  const authorized=Boolean(cue(k,6,'Open the route'));
  const approval={workload:authorized,platform:authorized};
  if(authorized) records=gpuIncident(records,{kind:'readmit',key:firstKey,owner,receipts,approval});
  return {records,time,checks,approved:authorized,gate:readmission(receipts,owner,approval),held:records[0].quarantined,
    first:cue(k,5,'Send that arrival',1.8),second:cue(k,6,'Follow the next selected request',1.8)};
}
function clock(beat,active={}) {
  return {beat:{beatIndex:beat},reveal:(phrase)=>active[phrase]??0};
}
export function checkModel(){
  const {gap,other,outside,free,deficit}=memoryReceipt(exercise);
  assert.deepEqual([gap,other,outside,free,deficit].map(units),[600,100,350,250,50]);
  assert.equal(offset,units(receipt.capacity_gib));
  for(const [kind,size] of [['hole',610],['live',3010],['free',62],['other',50],['outside',268]]) {
    assert.equal(layout.filter(b=>b.kind===kind).reduce((n,b)=>n+b.size,0),size);
  }
  for(let i=0;i<8;i++){const s=probe(clock(1,{'Now try':1,'visits each one':(i+.4)/8})); assert.equal(s.block.size,holes[i]);assert(s.deficit>0);}
  const lastUse={'In this replay':1};
  const freed={...lastUse,'Its free completes':1};
  const merged={...freed,'The adjacent pieces join':1};
  const placing={...merged,'place the request':0.5};
  const placed={...placing,'place the request':1};
  for(const [cues,expected] of [
    [{},[false,false,0,0,false,false]],
    [lastUse,[true,false,0,0,false,false]],
    [freed,[true,true,0,0,false,false]],
    [{...freed,'The adjacent pieces join':0.5},[true,true,0.5,0,false,false]],
    [merged,[true,true,1,0,false,false]],
    [placing,[true,true,1,0.5,false,false]],
    [placed,[true,true,1,1,true,false]],
    [{...placed,'and leave half a gibibyte':1},[true,true,1,1,true,true]],
  ]){
    const s=joinState(clock(1,cues));
    assert.deepEqual([s.lastUse,s.freed,s.merge,s.placement,s.placed,s.remainder],expected);
  }
  const joined=joinState(clock(2));
  assert.deepEqual([joined.available,joined.remaining],[200,50]);
  assert.deepEqual([{}, {'to success':1},{'remove its size':1},{'With an asynchronous allocator':1}].map(x=>eventCase(clock(2,x)).hypothesis),
    ['allocator-fragmentation','unclassified','oom-unresolved','oom-unresolved']);
  assert.equal(classifyGpuReceipt(gpuReceiptFixtures[1]).hypothesis,'application-capacity');
  assert.equal(memoryReceipt({...receipt,nvml_device_used_gib:null}).outside,null);
  const ring=ringState(clock(4));assert.deepEqual(ring.slots,['E','F','C','D']);assert.deepEqual(ring.retained,['C','D','E','F']);assert.deepEqual(ring.overwritten,['A','B']);
  const route=routeState(clock(2));assert.equal(route.owner,'P8');assert.deepEqual(route.streams.map(s=>s.owner),['P17','P17']);
  assert.equal(classifyGpuReceipt(receipt).mustRelaunch,false);assert.equal(classifyGpuReceipt(gpuReceiptFixtures[6]).mustRelaunch,true);
  const fleet=fleetState(clock(4,{'Mark one assigned device':1}));assert.deepEqual([fleet.capacity,fleet.allocatable,fleet.pod,fleet.cache],[4,3,true,true]);
  assert.equal(fleetState(clock(5)).cache,false);
  assert.deepEqual(catalogState(clock(5,{'Restart that application':1})),{code:94,uncontained:false,action:true,affected:['A']});
  assert.deepEqual(catalogState(clock(6)),{code:95,uncontained:true,action:true,affected:['A','B','C']});
  assert.deepEqual([soakTelemetry[4],soakTelemetry[4].revised].map(r=>[r.errors,r.link,r.latency,r.power,r.temperature]),[[1,21.8,32.8,254,67.8],[0,25,19.5,225,59]]);
  for(const [beat,phrase,bw,pass,exit] of [[1,'bandwidth is skipped',null,false,0],[2,'reaches eleven point two',11.2,false,1],[3,'A third run reaches',18.4,true,0],[4,'Coverage becomes false',18.4,false,1]]){
    const d=diagState(clock(beat,{[phrase]:1,'PCIe passes':1}));assert.deepEqual([d.measured,d.complete,d.exit],[bw,pass,exit]);if(bw!==null)assert.equal(d.results.bandwidth,bw<d.required?'Fail':'Pass');
  }
  const old=burnState(clock(1,{'Take the fifth sample':1}));assert.deepEqual([old.completed,units(old.reading.layout),units(old.peak),old.abort],[5,140,3540,true]);
  const revised=burnState(clock(3));assert.deepEqual([revised.completed,units(revised.reading.layout),units(revised.peak),units(revised.reading.headroom),revised.abort],[8,230,3130,870,false]);
  const quiet=latchState(clock(4));assert.equal(quiet.time,600);assert.deepEqual(quiet.records.map(r=>[r.recurrence,r.quarantined]),[[2,true],[1,true]]);
  const seven=latchState(clock(5));assert.equal(seven.checks.length,7);assert(!seven.checks.includes('fabric'));assert(seven.held);
  const eight=latchState(clock(6));assert.equal(eight.checks.length,8);assert.equal(eight.gate.eligible,true);assert(eight.held);
  const open=latchState(clock(7));assert.deepEqual(open.records.map(r=>r.quarantined),[false,true]);assert(!open.gate.quarantined);
}

