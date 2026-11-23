import assert from 'node:assert/strict';
import { checkpointRow, trackedColumn, input, up, down, context, sizes } from '../../../films/deep-dive-megatron/fixtures.mjs';
import { checkpointLayout, forwardWave, expertSkewTrace } from '../../../films/deep-dive-megatron/construction.mjs';
import { gelu, sum } from '../../../films/deep-dive-megatron/arithmetic.mjs';

export { checkpointRow, trackedColumn, input, up, down, context, sizes, forwardWave };
export const range = n => Array.from({length:n}, (_, i) => i);
export const marked = checkpointRow[trackedColumn];
export const probeInput = checkpointRow.map((_, i) => i === trackedColumn ? 2 : 0);
export const dot = (a,b) => sum(a.map((v,i)=>v*b[i]));
export const project = (row,matrix) => matrix[0].map((_,j)=>dot(row,matrix.map(r=>r[j])));
export const saved = checkpointLayout();
export const incomplete = checkpointLayout(2);
export const receivedColumns = incomplete.reconstructed.flatMap((value, column) => value === null ? [] : [column]);
export const markedAddress = width => ({rank:Math.floor(trackedColumn/width), local:trackedColumn%width});
export const partial = saved.shards.map(s=>dot(s.values,probeInput.slice(s.offset,s.offset+s.values.length)));
export const probe = sum(partial);
export const group = (rank, size, stride) => range(size).map(i=>rank+(i-(Math.floor(rank/stride)%size))*stride);
export const groups = {tensor:group(3,sizes.tp,1), pipeline:group(3,sizes.pp,32), data:group(3,sizes.dp,8), context:group(3,sizes.cp,4)};
export const smallMesh = {anchor:14, tensor:group(14,2,1), pipeline:group(14,2,8)};
export const channels = project(input,up);
export const active = channels.map(gelu);
export const lanes = [0,1].map(rank=>{
  const start = rank*2;
  return { rank, ids:[start,start+1], up:up.map(r=>r.slice(start,start+2)), down:down.slice(start,start+2), z:project(active.slice(start,start+2),down.slice(start,start+2)) };
});
export const output = lanes[0].z.map((n,i)=>n+lanes[1].z[i]);
export const operandDigits = 5;
export function budget(dp) {
  const examples=64, micro=2, stages=2;
  const wave=forwardWave(examples/(micro*dp),stages);
  return {...wave, dp, examples, micro, positions:examples*2048};
}
const localPos=[0,1,2,6], awayPos=[3,4,5,7];
export const query=6;
export const keys=[...context[0].map((v,i)=>({v,pos:localPos[i],owner:0})), ...[...context[1],90].map((v,i)=>({v,pos:awayPos[i],owner:1}))];
export const legal=[0,1].map(owner=>keys.filter(k=>k.owner===owner && k.pos<=query));
export const counts=legal.map(a=>a.length), sums=legal.map(a=>sum(a.map(k=>k.v))), means=sums.map((v,i)=>v/counts[i]);
export function blend(localShare) { return means[0]*localShare+means[1]*(1-localShare); }
export const localShare=counts[0]/sum(counts);
export const experts=[{id:2, weight:0.75, value:[2,0]},{id:7, weight:0.25, value:[0,4]}];
export const combined=experts[0].value.map((_,i)=>sum(experts.map(e=>e.weight*e.value[i])));
export const routes=p=>expertSkewTrace(p);
export const attentionAxes=[4,2,8,4], expertAxes=[1,64,1,4];
export const population=axes=>axes.reduce((n,k)=>n*k,1);
export const bytes=(d)=>({parameter:2, grad:4, master:4/d, first:4/d, second:4/d, total:6+12/d});
export const gradRows=[[10],[0,0,0]];
export const gradMeans=gradRows.map(v=>sum(v)/v.length);
export const reductions=[sum(gradRows.flat())/gradRows.flat().length,sum(gradMeans)/gradMeans.length];
export const sgd=(w,g,lr=0.1)=>w-lr*g;
export const startingWeights = [1,2,3,4];
export const gradientBuffers = [[1,3,5,7],[3,5,7,9]];
export const reducedGradients = startingWeights.map((_,i) => sum(gradientBuffers.map(row=>row[i])) / gradientBuffers.length);
export const updatedWeights = startingWeights.map((w,i) => sgd(w,reducedGradients[i]));
// Each column is one model parameter. A main-gradient slot counts as allocated even after its value is cleared.
export const storagePolicies = {
  plain: {name:'Plain data parallelism', partitioned:[]},
  optimizer: {name:'Distributed optimizer', partitioned:['optimizer']},
  full: {name:'Megatron-FSDP · full sharding', partitioned:['model','gradient','optimizer']},
};
export function residentColumns(policy,buffer,rank) {
  const columns=range(startingWeights.length);
  if(!policy.partitioned.includes(buffer)) return columns;
  const width=columns.length/gradientBuffers.length;
  return columns.slice(rank*width,(rank+1)*width);
}
export const recipes=[{name:'FP4',error:.04,ms:8,validation:true,reload:true},{name:'BF16',error:.002,ms:10,validation:true,reload:true}];
export const limit=.01;
export const accepts=r=>r.error<=limit && r.validation && r.reload;
export const momentumDecay = 0.5;
export const resumeRate = 0.1;
export const resumeTolerance = 0.001;
export const resume=(x,previous)=>{
  const target=2, y=marked*x, g=(y-target)*x, carried=momentumDecay*previous, velocity=carried+g;
  return {x,previous,y,target,g,carried,velocity,w:sgd(marked,velocity,resumeRate)};
};
export const reference=resume(2,.8), reset=resume(2,0), stale=resume(1,.8);
export const round=(v,d=3)=>Number(v.toFixed(d));
export function check() {
  assert.deepEqual(saved.reconstructed,checkpointRow);
  assert.deepEqual(incomplete.reconstructed,[1,2,3,4,null,null,1.5,8]);
  assert.equal(incomplete.complete,false);
  assert.deepEqual(receivedColumns,[0,1,2,3,6,7]);
  assert.equal(receivedColumns.indexOf(trackedColumn),4);
  assert.deepEqual(saved.target.flat(),checkpointRow);
  assert.deepEqual(markedAddress(2),{rank:3,local:0}); assert.deepEqual(markedAddress(4),{rank:1,local:2});
  assert.deepEqual(partial,[0,0,0,3]); assert.equal(probe,dot(probeInput,checkpointRow));
  assert.deepEqual(groups,{tensor:[0,1,2,3],pipeline:[3,35],data:[3,11,19,27],context:[3,7]});
  assert.deepEqual(smallMesh.tensor,[14,15]);
  assert.deepEqual(smallMesh.pipeline,[6,14]);
  assert.deepEqual(lanes.flatMap(l=>project(input,l.up)),channels); assert.deepEqual(channels,[1,2,1,.5]);
  for(const [i,v] of project(active,down).entries()) assert.ok(Math.abs(output[i]-v)<1e-12);
  assert.deepEqual(output.map(v=>round(v)),[1.337,3.142]);
  for(const [i,v] of output.entries()) {
    const visibleSum=sum(lanes.map(l=>round(l.z[i],operandDigits)));
    assert.equal(round(visibleSum),round(v));
  }
  for(const [m,slots,idle] of [[1,4,2],[8,18,2],[4,10,2]]) {
    const w=forwardWave(m); assert.equal(w.slots,slots); assert.equal(w.idle,idle);
  }
  assert.equal(budget(4).microbatches,8); assert.equal(budget(8).positions,131072);
  assert.deepEqual(counts,[4,3]); assert.deepEqual(sums,[21,8]); assert.equal(keys.filter(k=>k.pos>query)[0].v,90);
  assert.ok(Math.abs(blend(localShare)-29/7)<1e-12); assert.ok(blend(.5)<blend(localShare));
  assert.deepEqual(combined,[1.5,1]);
  assert.deepEqual(routes(0).counts,[4,4,4,4]); assert.deepEqual(routes(1).counts,[8,3,3,2]);
  for(const p of [0,.4,1]) {assert.equal(routes(p).totalAssignments,16); assert.deepEqual(routes(p).assignments[3],[2,7]);}
  assert.equal(population(attentionAxes),256); assert.equal(population(expertAxes),256);
  for(const d of [1,4,8]) {const b=bytes(d); assert.equal(b.total,b.parameter+b.grad+b.master+b.first+b.second);}
  assert.deepEqual(reductions,[2.5,5]); assert.deepEqual(reductions.map(g=>sgd(1,g)),[.75,.5]);
  assert.deepEqual(reducedGradients,[2,4,6,8]);
  assert.deepEqual(updatedWeights,[.8,1.6,2.4,3.2]);
  for(const [buffer,counts] of [['model',[4,4,2]],['gradient',[4,4,2]],['optimizer',[4,2,2]]]){
    for(const [i,policy] of [storagePolicies.plain,storagePolicies.optimizer,storagePolicies.full].entries()){
      const owners=gradientBuffers.map((_,rank)=>residentColumns(policy,buffer,rank));
      assert.deepEqual(owners.map(row=>row.length),[counts[i],counts[i]]);
      assert.deepEqual(counts[i]===2?owners.flat():owners[0],[0,1,2,3]);
      if(counts[i]===4) assert.deepEqual(owners[0],owners[1]);
    }
  }
  assert.deepEqual(recipes.map(accepts),[false,true]);
  assert.deepEqual([reference,reset,stale].map(t=>[t.y,t.g,round(t.w,2)]),[[3,2,1.26],[3,2,1.3],[1.5,-.5,1.51]]);
  assert.deepEqual([reference,reset,stale].map(t=>[t.carried,round(t.velocity,2)]),[[.4,2.4],[0,2],[.4,-.1]]);
  assert.ok(stale.w>marked && reference.w<marked && reset.w<marked);
  assert.deepEqual([reset,stale,reference].map(t=>round(Math.abs(reference.w-t.w))),[.04,.25,0]);
  assert.deepEqual([reset,stale,reference].map(t=>Math.abs(reference.w-t.w)<=resumeTolerance),[false,false,true]);
}
