import assert from 'node:assert/strict';
import { rows, history, regression, JAX_KEY_FIXTURE } from '../../../films/jax-for-ml-research/fixtures.mjs';
import { batchComparison } from '../../../films/jax-for-ml-research/batch.mjs';
import { exampleGradients, capturedCalls, projectionFixture, momentumFixture, regularizedHistory,
  weightPenalty, doublingTraces } from '../../../films/jax-for-ml-research/arithmetic.mjs';

export { rows, history, regression, JAX_KEY_FIXTURE, batchComparison, exampleGradients,
  projectionFixture, momentumFixture, weightPenalty, doublingTraces };
export const regularized = regularizedHistory();
export const firstMask = [[1,0],[1,1],[1,1],[0,0]];
export const secondMask = [[0,1],[1,0],[1,0],[0,1]];
export const first = momentumFixture(firstMask);
export const second = momentumFixture(secondMask,first.nextParams,first.nextVelocity);
export const stepKeys = [JAX_KEY_FIXTURE.root,JAX_KEY_FIXTURE.next,[2737751932,2099591257]];
export const keyWords = k => k.map(w=>w.toString(16).padStart(8,'0')).join(' ');
export const shortMasks = ['00110111','00111000']; // Top rows of the approved 8 × 8 CPU draws.
export const capture = (lengths, globals) => capturedCalls(lengths.map((length,i)=>({length,global:globals[i]}))).results;
export const capturesA = capture([4,4,2],[1,3,3]);
export const capturesB = capture([3,3,5],[2,4,4]);
export const finalBatch = batchComparison(3,4,1);
export const finalPlain = batchComparison(3,3,1);
export const firstBatch = batchComparison(2,4);
export const six = batchComparison(4,6);
export const gradients = exampleGradients();
const projectionWeights = projectionFixture().w;
export const savedLayer = {
  weight: {shape: [projectionWeights.length, projectionWeights[0].length], values: Float32Array.from(projectionWeights.flat())},
  bias: {shape: [2], values: Float32Array.of(0, 0)},
};
export const restoreSlots = [
  {key: 'weight', shape: [2, 2], dtype: 'float32'},
  {key: 'bias', shape: [2], dtype: 'float32'},
];
export function restoreLeaf(layer, slot) {
  const leaf = layer[slot.key];
  if (leaf?.values instanceof Float32Array && slot.dtype === 'float32'
    && leaf.shape.length === slot.shape.length && leaf.shape.every((size, i) => size === slot.shape[i])
    && leaf.values.length === slot.shape.reduce((count, size) => count * size, 1)) return leaf;
}
export const scalarPulls = [{x:1,y:3},{x:3,y:-1}].map(({x,y})=>2*(0*x-y)*x);
export const agree = p => p*p + (1-p)*(1-p);
export const learningRate = 0.05;
export const momentumFactor = 0.9;
export const emptyStep = {velocity:momentumFactor*first.nextVelocity[0], oldWeight:first.nextParams[0]};
emptyStep.weight = emptyStep.oldWeight - learningRate*emptyStep.velocity;
export const partials = [[1,2],[3,4]].map((s,i)=>s.reduce((sum,x,j)=>sum+x*([5,6,7,8][2*i+j]),0));
export function guardLog(x, guard, offset=0) {
  const active = x > offset, argument = guard && !active ? 1 : x-offset;
  const logarithm = Math.log(argument);
  return {active,argument,logarithm,out:active?logarithm:0,grad:active?1/argument:0/argument};
}
export function indexedSet(values,index,update) {
  return values.map((v,i)=>i===index?update:v);
}
export function weakCalls() {
  const variants=new Map();
  return [{input:'Python 1.0',value:1,weak:true},{input:'array(1, float32)',value:1,weak:false},
    {input:'array(2, float32)',value:2,weak:false}].map(row=>{
    if(!variants.has(row.weak)) variants.set(row.weak,String.fromCharCode(65+variants.size));
    return {...row,variant:variants.get(row.weak),out:row.value+1};
  });
}
export function schema(mode) {
  const name=mode===1?'kernel':'weight';
  const value=mode===2?history[0].gradient[0]:history[0].gradient.slice(0,2);
  const candidate=[0,0].map((v,i)=>v-learningRate*(Array.isArray(value)?value[i]:value));
  return {name,value,shape:Array.isArray(value)?'(2,)':'()',candidate,
    verdict:name!=='weight'?'gradient tree mismatch':!Array.isArray(value)?'gradient shape mismatch':'compatible leaves'};
}
export function completed(t) {return {host:Math.min(1,t),work:Math.min(12,t),handle:t>=1,ready:t>=12};}
export const frac3 = x => Math.round(x*3).toString().replace('-','−')+'/3';

export function checkExperiments() {
  assert.deepEqual(firstBatch.batch.map(row => [row.prediction, row.y, row.squared, row.valid]),
    [[0, 2, 4, true], [0, -1, 1, true], [0, 0, 0, false], [0, 0, 0, false]]);
  assert.equal(firstBatch.loss.count, 2);
  assert.equal(firstBatch.loss.sum,5); assert.equal(firstBatch.loss.masked,2.5); assert.equal(firstBatch.loss.naive,1.25);
  assert.deepEqual(regression([2,-1,0]).pred,rows.map(r=>r.y)); assert.equal(regression([2,-1,0]).loss,0);
  assert.deepEqual(history[0].gradient,[-4.5,-1.5,-2.5]);
  assert.deepEqual(gradients.map(row => row.map(value => value === 0 ? 0 : value)),
    [[-4, 0, -4], [0, 2, 2], [-2, -2, -2], [-12, -6, -6]]);
  const columnMeans = gradients[0].map((_, col) =>
    gradients.reduce((sum, row) => sum + row[col], 0) / gradients.length);
  assert.deepEqual(columnMeans, history[0].gradient);
  assert.deepEqual(scalarPulls,[-6,6]); assert.equal(scalarPulls.reduce((a,b)=>a+b)/2,0);
  assert.deepEqual([0,1,2].map(i=>schema(i).verdict),['compatible leaves','gradient tree mismatch','gradient shape mismatch']);
  assert.deepEqual(schema(2).candidate,[.225,.225]);
  const [weight, bias] = restoreSlots.map(slot => restoreLeaf(savedLayer, slot));
  assert.deepEqual(Array.from(weight.values), projectionFixture().w.flat());
  assert.deepEqual(Array.from(bias.values), [0, 0]);
  assert.equal(restoreLeaf(savedLayer, {...restoreSlots[0], key: 'kernel'}), undefined);
  assert.equal(restoreLeaf(savedLayer, {...restoreSlots[0], shape: [4]}), undefined);
  assert.equal(restoreLeaf(savedLayer, {...restoreSlots[0], dtype: 'float64'}), undefined);
  assert.deepEqual(projectionFixture().output, [7, 10]);
  assert.deepEqual(projectionFixture().transposed, [5, 11]);
  assert.deepEqual(indexedSet([10,20,30],1,99),[10,99,30]); assert.deepEqual(indexedSet([10,20,30],9,99),[10,20,30]);
  assert.equal(agree(.5),.5); assert.equal(agree(.25),.625); assert.equal(shortMasks[0][4]+shortMasks[1][4],'01');
  assert.deepEqual(first.nextVelocity,[-2,0,-2.5]); assert.deepEqual(first.nextParams,[.1,0,.125]);
  assert.deepEqual(second.nextParams.map(x=>x.toFixed(6)),['0.214722','0.095833','0.346667']);
  assert.equal(second.preLoss.toFixed(6),'3.399236'); assert.notDeepEqual(stepKeys[1],stepKeys[2]);
  assert.equal(emptyStep.velocity,-1.8); assert.equal(emptyStep.weight,.19);
  assert.equal(six.loss.masked,3.75); assert.equal(six.naiveGradient[0],-3);
  assert.deepEqual(six.validGradient,history[0].gradient);
  assert.deepEqual(capturesA.map(r=>r.result),[4,4,6]); assert.deepEqual(capturesB.map(r=>r.result),[6,6,20]);
  assert.deepEqual(weakCalls().map(r=>r.variant+r.out),['A2','B2','B3']);
  assert(Number.isNaN(guardLog(0,false).grad)); assert.equal(guardLog(0,true).grad,0);
  assert.equal(guardLog(2,true).grad,.5); assert.equal(guardLog(3,true,1).out,Math.log(2));
  assert.deepEqual(doublingTraces(3),{dynamic:[3,6,12],fixed:[3,6,12,24],derivative:8});
  assert.deepEqual(partials,[17,53]); assert.equal(regularized.at(-1).objective.toFixed(6),'0.399595');
  assert.equal(history.at(-1).loss.toFixed(6),'0.007605'); assert.deepEqual(weightPenalty([2,-1]).gradient,[.4,-.2]);
  for(const t of [0,.5,1,6,11.9,12]) { const c=completed(t);assert.equal(c.work,t);assert.equal(c.host,Math.min(1,t));assert.equal(c.ready,t===12); }
  assert.deepEqual(finalBatch.batch.map(r=>r.squared),[1,4,0,1]); assert.equal(finalBatch.loss.masked,5/3);
  assert.deepEqual(finalBatch.validGradient,[-2/3,4/3,2/3]); assert.deepEqual(finalBatch.validGradient,finalPlain.validGradient);
}
