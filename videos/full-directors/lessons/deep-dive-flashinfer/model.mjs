import assert from 'node:assert/strict';
import { requests } from '../../../films/deep-dive-flashinfer/fixtures.mjs';
import { mergeReference, prefix } from '../../../films/deep-dive-flashinfer/arithmetic.mjs';
export {requests,mergeReference,prefix};
export const query=prefix(requests.map(r=>r.q));
export const page=prefix(requests.map(r=>r.pages.length));
export const flat= requests.flatMap(r=>r.pages);
export const len=(pages,tail,size=4)=>(pages.length-1)*size+tail;
export const addr=(pages,j,size=4)=>[pages[Math.floor(j/size)],j%size];
export const owner=row=>requests.findIndex((_,i)=>row>=query[i]&&row<query[i+1]);
export const visible=(k,q,i)=>Array.from({length:k},(_,j)=>j<=k-q+i);
export const outputs=[[1,0],[0,1]];
export const logs=[2,1];
export const maxLog=Math.max(...logs);
export const rel=logs.map(b=>2**(b-maxLog));
export const sum=a=>a.reduce((all,x)=>all+x,0);
export const join=(a,b)=>mergeReference(outputs[0],a,outputs[1],b);
export const merged=join(...logs);
// Each range has a constant value vector, so changing a score changes only its mass.
export function scoredRanges(lastScore) {
  const masses = [[0, 0, 0, 0], [0, lastScore]].map(scores => scores.map(Math.exp));
  const logMasses = masses.map(range => Math.log2(sum(range)));
  return {masses, logMasses, result: join(...logMasses)};
}
export const wrong=join(...logs.map(b=>b*Math.LN2));
export const duplicate=mergeReference([.5,.5],1,[1,0],0);
export function tailState(pages,size,oldTail,appended,refreshed) {
  const tail=oldTail+Number(appended), planTail=oldTail+Number(refreshed);
  return {pages,size,tail,planTail,length:len(pages,tail,size),planned:len(pages,planTail,size)};
}
export const offsets = (bounds,heads,dim)=>bounds.map(n=>n*heads*dim);
export const bounds=[0,2,5], heads=8, qDim=192, oDim=128;
export const qOffset=offsets(bounds,heads,qDim), oOffset=offsets(bounds,heads,oDim);
export function work(lanes) {
  const tiles=Array.from({length:4},(_,i)=>({lane:i%lanes,start:4*Math.floor(i/lanes),cost:4}));
  const barrier=Math.max(...tiles.map(t=>t.start+t.cost));
  return {tiles,barrier,finish:barrier+1};
}
export function lease(early,read,done) {
  const original={owner:'R2',v:'[0, 1]'}, next={owner:'R9',v:'[1, 0]'};
  return {slot:early||done?next:original,returned:read?(early?next:original).v:null};
}
export const segments=[.8,.2,.1,1.6,.3];
export const callAt=t=>segments.map((v,i)=>i===3?v*(1-t/2):v);
export function check() {
  assert.deepEqual(query,[0,3,4,8]);assert.deepEqual(page,[0,2,3,6]);
  assert.deepEqual(flat,[7,2,11,3,14,6]);assert.equal(owner(3),1);
  assert.deepEqual(requests.map(r=>len(r.pages,r.tail)),[6,2,9]);
  assert.deepEqual(addr(requests[2].pages,5),[14,1]);
  assert.deepEqual(addr([...requests[2].pages].sort((a,b)=>a-b),5),[6,1]);
  assert.deepEqual([0,1,2,3].map(i=>visible(9,4,i).filter(Boolean).length),[6,7,8,9]);
  assert.deepEqual(rel,[1,.5]);assert.deepEqual(merged.output,[2/3,1/3]);
  assert(Math.abs(merged.b-Math.log2(6))<1e-12);assert.equal(wrong.output[0].toFixed(4),'0.6179');
  const baseline = scoredRanges(0), replay = scoredRanges(Math.log(3));
  assert.deepEqual(baseline.result, merged);
  assert.deepEqual(replay.masses.map(range => range.length), [4, 2]);
  assert(Math.abs(replay.masses[1][1] - 3) < 1e-12);
  assert(replay.logMasses.every(logMass => Math.abs(logMass - 2) < 1e-12));
  for (const state of [baseline, replay]) {
    const total = sum(state.masses.flat());
    state.masses.forEach((range, i) => assert(Math.abs(state.result.output[i] - sum(range) / total) < 1e-12));
    assert(Math.abs(state.result.b - Math.log2(total)) < 1e-12);
  }
  assert(Math.abs(replay.result.output[0] - .5) < 1e-12);
  assert(Math.abs(replay.result.b - 3) < 1e-12);
  assert.deepEqual(duplicate.output,[2/3,1/3]);
  assert.equal(mergeReference([1e308],0,[1e308],0).output[0],1e308);
  assert.deepEqual(mergeReference([0,0],-Infinity,[0,1],1).output,[0,1]);
  assert.throws(()=>mergeReference([1,0],-Infinity,[0,1],1),RangeError);
  for (const [pg,size,start] of [[requests[2].pages,4,1],[[9,2],8,7]]) {
    const states=[[false,false],[true,false],[true,true]].map(flags=>tailState(pg,size,start,...flags));
    assert.equal(states[1].planned,states[0].length);
    assert.equal(states[1].length,states[0].length+1);
    assert.equal(states[2].planned,states[1].length);
    assert.deepEqual(addr(pg,states[1].length-1,size),[pg.at(-1),start]);
  }
  assert.deepEqual(qOffset,[0,3072,7680]);assert.deepEqual(oOffset,[0,2048,5120]);
  assert.equal(qOffset[1]/(heads*oDim),3);
  assert.deepEqual([work(4).finish,work(2).finish],[5,9]);
  assert.deepEqual(lease(true,true,true).slot,lease(false,true,true).slot);
  assert.equal(lease(false,true,true).returned,'[0, 1]');assert.equal(lease(true,true,true).returned,'[1, 0]');
  assert.equal(sum(callAt(0)).toFixed(1),'3.0');assert.equal(sum(callAt(1)).toFixed(1),'2.2');
  assert.equal((sum(callAt(0))/sum(callAt(1))).toFixed(2),'1.36');
  return true;
}
