import assert from 'node:assert/strict';
import {r0, r1, sharedPrefix} from '../../../films/deep-dive-vllm/fixtures.mjs';
import {reuse} from '../../../films/deep-dive-vllm/arithmetic.mjs';
import {schedule, references, vvReleaseRequest, vvTouchAllocate} from '../../../films/deep-dive-vllm/model.mjs';

export {r0,r1,sharedPrefix,reuse};
export const size=4, tables={R0:[12,41],R1:[12,73,90]};
export const steps=schedule(r1.length,6);
export const stepInputs = steps.map((row,i) => ['R0',...(row.r1Decode?['and']:r1.slice(r1.length-row.left-row.r1Prefill,r1.length-row.left))]);
export const stepCost = row => 2+row.used;
export const smallMs=steps.slice(0,2).map(stepCost), largeMs=stepCost(schedule(9,10)[0]);
export const locate = (table,p) => ({id:table[Math.floor(p/size)],offset:p%size});
export function promptSlice(freeBlocks) {
  const capacity = freeBlocks * size;
  const count = Math.min(steps[0].r1Prefill, capacity);
  return {capacity, words:r1.slice(0,count), waiting:r1.slice(count), spare:6-1-count};
}
export function prefixPlan(length,match,adapter,stored='Finch') {
  const skipped=adapter===stored?reuse(match,length,size):0;
  return {skipped,fresh:length-skipped,pages:Math.ceil((length-skipped)/size)};
}
export function keyFields(version,name,path) {
  return version==='0.28'?[name]:['lora',name,path];
}
export const online={apis:4,ranks:4,workers:8};
export const processes=({apis,ranks,workers})=>apis+ranks+workers+Number(ranks>1);
const released=vvReleaseRequest(tables,new Set([12,41,73]),'R0');
export const poolStates=[
  {tables,free:[],hash41:true,words41:r0.slice(4)},
  {tables:released.tables,free:released.free,hash41:true,words41:r0.slice(4)},
  {tables:{...released.tables,R2:[released.free[0]]},free:[],hash41:false,words41:r0.slice(4)},
  {tables:{...released.tables,R2:[released.free[0]]},free:[],hash41:false,words41:['A','wren']},
].map(s=>({...s,refs:references(s.tables)}));
const remaining = poolStates.at(-1).tables;
const r1Released = vvReleaseRequest(remaining,new Set([12,73]),'R1');
export const releaseOrder = r1Released.free;
export const acquired = releaseOrder.slice(0,2);
export const surviving = releaseOrder.slice(2);
export const runningCap = 3;
export const runningStates = [['R0','R1','R2'],['R0','R2'],['R0','R2','R3']];
export const mediaRuns = [{count:6,color:'red'},{count:6,color:'blue'}];
export const pixelLimit = 10;
export const pixels = mediaRuns.flatMap(run=>Array(run.count).fill(run.color));
export const workerTopologies = {
  tensor:{label:'Tensor parallel',ranks:['Layer shard A','Layer shard B'],work:['partial sum','partial sum'],link:'collective',
    detail:'Workers exchange partial results within a single layer.'},
  pipeline:{label:'Pipeline parallel',ranks:['Layers 1–4','Layers 5–8'],work:['activation','next layers'],link:'handoff',
    detail:'A stage can wait for activations from the stage before it.'},
  data:{label:'Data parallel',ranks:['Replica A','Replica B'],work:['R0','R1'],link:'Request router',
    detail:'Separate requests run on separate replicas of the dense model.'},
  expert:{label:'Expert parallel',ranks:['Expert A','Expert B'],work:['token 1','token 2'],link:'Token router',
    detail:'Tokens travel to the ranks holding their selected experts.'}
};
const free=[71,55,9], refs={71:0,55:0,9:0};
const touched=vvTouchAllocate(free,refs,9,false);
const twice=vvTouchAllocate(touched.free,touched.refs,9,false);
export const queueStates=[{free,refs},touched,twice,{free:twice.free.slice(1),refs:{...twice.refs,[twice.free[0]]:1}}];
export function admit(inputs,freePages,tail=1,budget=4) {
  const pages=Math.ceil(Math.max(inputs-tail,0)/size);
  const memory=pages<=freePages,compute=inputs<=budget;
  return {inputs,freePages,tail,budget,pages,memory,compute,admitted:compute&&memory};
}
export const runs=[['A',1000,600,550],['B',800,780,752]].map(([id,offered,complete,pass])=>({
  id,offered,complete,pass,late:complete-pass,unresolved:offered-complete,rate:pass/100,biased:(offered/100)*(pass/complete),
}));
export const events=[{t:0,words:['The','bird']},{t:12,words:['sat']},{t:24,words:['still']}];
export const gaps=events.slice(1).map((e,i)=>e.t-events[i].t);
export const mean=(events.at(-1).t-events[0].t)/(events.flatMap(e=>e.words).length-1);
export const sum=xs=>xs.reduce((a,b)=>a+b,0);
export const traces=[[20,80,40,10],[7,65,24,6]];
export function check(){
  assert.deepEqual(steps.map(r=>[r.r0Decode,r.r1Prefill,r.r1Decode,r.unused]),[[1,5,0,0],[1,4,0,1],[1,0,1,4]]);
  assert.deepEqual(stepInputs.map(r=>r.length),steps.map(r=>r.used));
  assert.deepEqual(stepInputs.slice(0,2).flatMap(r=>r.slice(1)),r1);
  assert.deepEqual([1,2].map(n=>{const p=promptSlice(n);return [p.words.at(-1),p.waiting.length,p.spare]}),
    [['sat',5,1],['on',4,0]]);
  assert.deepEqual([smallMs,largeMs],[[8,7],12]);
  assert.equal(processes(online),17);assert.equal(processes({...online,apis:1,ranks:2}),12);
  assert.deepEqual(locate(tables.R0,6),{id:41,offset:2});
  assert.equal(r0[6],'green');assert.equal(sharedPrefix,6);
  assert.deepEqual([prefixPlan(9,6,'Finch').skipped,prefixPlan(9,6,'Wren').skipped],[4,0]);
  assert.deepEqual([prefixPlan(8,8,'Finch').skipped,prefixPlan(9,8,'Finch').skipped],[4,8]);
  assert.deepEqual(keyFields('0.28','Finch','oak'),keyFields('0.28','Finch','ash'));
  assert.notDeepEqual(keyFields('0.31','Finch','oak'),keyFields('0.31','Finch','ash'));
  assert.deepEqual(poolStates.map(s=>[s.refs.get(12),s.refs.get(41)??0,s.free,s.hash41]),
    [[2,1,[],true],[1,0,[41],true],[1,1,[],false],[1,1,[],false]]);
  assert.deepEqual(poolStates[2].words41,poolStates[1].words41);
  assert.notDeepEqual(poolStates[3].words41,poolStates[2].words41);
  assert.deepEqual([releaseOrder,acquired,surviving],[[90,73,12],[90,73],[12]]);
  assert.deepEqual(r1Released.tables,{R2:[41]});
  assert.deepEqual(runningStates.map(r=>runningCap-r.length),[0,1,0]);
  assert.deepEqual([pixels.length,pixels.filter(c=>c==='red').length,pixels.length>pixelLimit],[12,6,true]);
  assert.deepEqual(Object.values(workerTopologies).map(t=>[t.work,t.link]),[
    [['partial sum','partial sum'],'collective'],[['activation','next layers'],'handoff'],
    [['R0','R1'],'Request router'],[['token 1','token 2'],'Token router']
  ]);
  assert.deepEqual(queueStates.map(q=>[q.free,q.refs[9],q.refs[71]]),
    [[[71,55,9],0,0],[[71,55],1,0],[[71,55],2,0],[[55],2,1]]);
  assert.deepEqual([admit(2,0),admit(2,1),admit(5,1)].map(s=>[s.memory,s.compute,s.admitted]),
    [[false,true,false],[true,true,true],[true,false,false]]);
  assert.deepEqual(runs.map(r=>[r.pass+r.late+r.unresolved,r.rate.toFixed(2),r.biased.toFixed(2)]),
    [[1000,'5.50','9.17'],[800,'7.52','7.71']]);
  assert.deepEqual([gaps,mean],[[12,12],8]);
  for(const [i,adapter] of ['Wren','Finch'].entries()){
    const p=prefixPlan(13,10,adapter);
    assert.deepEqual([p.skipped,p.fresh,p.pages,1+p.fresh,p.pages<=3],[[0,13,4,14,false],[8,5,2,6,true]][i]);
  }
  assert.deepEqual(traces.map(t=>[sum(t),t.indexOf(Math.max(...t))]),[[150,1],[102,1]]);
}
