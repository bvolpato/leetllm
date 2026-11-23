import assert from 'node:assert/strict';

export const eps = 0.00001;
export const input = [1,2,3,4,5];
const sum = xs => xs.reduce((a,b)=>a+b,0);
export const squares = xs => xs.map(x=>x*x);
export function normalize(row, weights=row.map(()=>1), epsilon=eps, squareSum=sum(squares(row))) {
  const mean=squareSum/row.length;
  return {mean, values:row.map((x,i)=>x*weights[i]/Math.sqrt(mean+epsilon))};
}
export function tile(n,weight=1) {
  const reads=input.map((_,i)=>i);
  const lanes=[...input, ...Array.from({length:3},(_,i)=>Number(i<n))];
  const squareSum=sum(squares(lanes));
  return {reads, lanes, squareSum, ...normalize(input,[1,1,1,1,weight],eps,squareSum)};
}
export const calls = [
  {width:384,epsilon:eps}, {width:385,epsilon:eps}, {width:384,epsilon:true},
];
export function route({width,epsilon=eps,packed=true,packedWeights=true,activeGrad=false,target=true}) {
  if (typeof epsilon!=='number'||!Number.isFinite(Math.fround(epsilon))||Math.fround(epsilon)<=0||!Number.isInteger(width)||width<=0) return 'Public error';
  return packed && packedWeights && target && !activeGrad && width%128===0 ? 'Fast kernel' : 'Reference';
}
export const storage=[1,2,3,4,5,6,7,8];
export function readRow(buffer,width,stride,offset=0) {
  const addresses=Array.from({length:width},(_,i)=>offset+stride*i);
  return {addresses,values:addresses.map(i=>buffer[i])};
}
export function evaluate(shape,strides,buffer) {
  const packed=shape[0]===2&&shape[1]===4&&strides[0]===4&&strides[1]===1;
  const rows=Array.from({length:shape[0]},(_,r)=>{
    const row=readRow(buffer,shape[1],strides[1],r*strides[0]);
    const ref=normalize(row.values);
    const candidate=packed ? [...ref.values] : row.values.map(()=>0);
    return {...row,mean:ref.mean,ref:ref.values,candidate};
  });
  return {rows,pass:rows.every(row=>row.ref.every((v,i)=>Math.abs(v-row.candidate[i])<=1e-6+1e-5*Math.abs(v)))};
}
export const smoke=[1,10,0.01,-1].map(k=>evaluate([2,4],[4,1],storage.map(v=>v*k)));
export const changedView=evaluate([2,4],[1,2],storage);
export const changedShape=evaluate([3,5],[5,1],Array.from({length:15},(_,i)=>i+1));
export function scaleTrial(a,adjust) {
  const x=0.001*a, epsilon=eps*(adjust?a*a:1);
  const {mean,values}=normalize([x,-x],[1,1],epsilon);
  return {a,epsilon,x,mean,y:values[0]};
}
export const trials=[scaleTrial(1,false),scaleTrial(100,false),scaleTrial(100,true),scaleTrial(-100,true)];
export const ref=0.002, atol=0.0001, rtol=0.01;
export const allowance=atol+rtol*Math.abs(ref);
export const toleranceCases=[0.00211,0.00215].map(v=>({v,err:Math.abs(v-ref),pass:Math.abs(v-ref)<=allowance}));
export function sectors(stride) {
  const starts=Array.from({length:32},(_,i)=>stride*i);
  return {starts, used:[...new Set(starts.flatMap(s=>[0,1,2,3].map(d=>Math.floor((s+d)/32))))]};
}
export const timings=[{name:'Baseline',kernel:8,wrapper:1},{name:'Candidate',kernel:6,wrapper:5}].map(t=>({...t,total:t.kernel+t.wrapper}));
export const traffic=[{name:'Requested',bytes:6*10400*1000},{name:'Device memory',bytes:30000000}].map(t=>({...t,rate:t.bytes/12e-6/1e12}));
export const finalStorage=[5,8,12,15], finalRow=readRow(finalStorage,2,2), finalResult=normalize(finalRow.values,[1,2]);
export const shadow={slots:10,live:8,requested:3};
shadow.start=Math.min(shadow.slots-shadow.live,shadow.requested);
shadow.wait=shadow.requested-shadow.start;
export const recovery=[
  {worker:'W17',state:'Running',route:'Candidate',request:'In flight'},
  {worker:'W17',state:'Unhealthy',route:'Candidate',request:'Interrupted'},
  {worker:'W17',state:'Unhealthy',route:'Reference',request:'Interrupted'},
  {worker:'W17',state:'Terminated',route:'Reference',request:'Retry pending'},
  {worker:'W18',state:'Healthy',route:'Reference',request:'Retry pending'},
  {worker:'W18',state:'Healthy',route:'Reference',request:'Replaying'},
  {worker:'W18',state:'Healthy',route:'Reference',request:'Complete'},
];
export const mutants=['caught','caught','caught','caught','missed','missed','pending','pending'];
export const witnessed=mutants.filter(m=>m!=='pending').length;
export const caught=mutants.filter(m=>m==='caught').length;
export function auditAlias(){
  const input=new Float32Array([1,2,3]);
  const before=Array.from(input);
  input[1]=9;
  const during=Array.from(input);
  input[1]=before[1];
  const output=input.subarray(0);
  return {before,during,after:Array.from(input),shared:output.buffer===input.buffer};
}
export const ownershipAudit=auditAlias();
export const roof={bandwidth:900,intensity:2/3,scalar:500};
roof.memory=roof.bandwidth*roof.intensity;
roof.limit=Math.min(roof.memory,roof.scalar);
const large=2e19, largeF32=Math.fround(large);
export const overflow={input:large,fp32Square:Math.fround(largeF32*largeF32),fp64Square:large*large};
overflow.fp32Result=largeF32/Math.sqrt(overflow.fp32Square+eps);
overflow.fp64Result=large/Math.sqrt(overflow.fp64Square+eps);
export const logits=[[1,1.0001],[1.0002,1.0001]].map(([a,b])=>({a,b,winner:a>b?'A':'B'}));
export function check(){
  for(let n=0;n<=3;n++){
    const run=tile(n); assert.deepEqual(run.reads,[0,1,2,3,4]);assert.equal(run.squareSum,55+n);
    assert.equal(run.mean,(55+n)/5);assert.equal(run.values[4],5/Math.sqrt(run.mean+eps));
  }
  assert.deepEqual([tile(0),tile(3)].map(t=>t.values[4].toFixed(3)),['1.508','1.468']);
  assert.deepEqual(tile(0,2).values,tile(0).values.map((v,i)=>i===4?2*v:v));
  assert.deepEqual(calls.map(route),['Fast kernel','Reference','Public error']);
  assert.equal(route({width:384,epsilon:1}),'Fast kernel');
  for(const option of [{packed:false},{packedWeights:false},{activeGrad:true},{target:false}])assert.equal(route({...calls[0],...option}),'Reference');
  assert.equal(route({width:128,epsilon:1e-60}),'Public error');
  assert.deepEqual(smoke.map(x=>x.pass),[true,true,true,true]);
  assert.deepEqual(changedView.rows[0].addresses,[0,2,4,6]); assert.equal(changedView.rows[0].mean,21);
  assert.equal(changedView.rows[0].ref[2].toFixed(3),'1.091'); assert(!changedView.pass&&!changedShape.pass);
  assert.deepEqual([changedView.rows[0].candidate[2],changedShape.rows[0].candidate[4]],[0,0]);
  assert.deepEqual(trials.map(t=>t.y.toFixed(4)),['0.3015','0.9995','0.3015','-0.3015']);
  assert(Math.abs(trials[0].y-trials[2].y)<1e-14);assert(Math.abs(trials[0].y+trials[3].y)<1e-14);
  assert.deepEqual(toleranceCases.map(t=>t.pass),[true,false]);
  assert.deepEqual([allowance,ref-allowance,ref+allowance].map(x=>x.toFixed(5)),['0.00012','0.00188','0.00212']);
  assert.deepEqual([sectors(8),sectors(4)].map(m=>m.used.length),[8,4]);
  assert.deepEqual(traffic.map(t=>t.rate.toFixed(2)),['5.20','2.50']);assert.deepEqual(timings.map(t=>t.total),[9,11]);
  assert.equal(shadow.start,2);assert.equal(shadow.wait,1);
  assert(recovery.slice(2).every(r=>r.route==='Reference')); assert(recovery.slice(1,6).every(r=>r.request!=='Complete'));
  assert.equal(recovery[6].worker,'W18');
  assert.equal(route({width:2,packed:false}),'Reference');assert.equal(route({width:128}),'Fast kernel');
  assert.deepEqual(finalRow.values,[5,12]);assert.deepEqual(finalResult.values.map(v=>v.toFixed(3)),['0.544','2.611']);
  assert.deepEqual([witnessed,caught],[6,4]);
  assert.deepEqual(ownershipAudit.before,ownershipAudit.after);assert.notDeepEqual(ownershipAudit.during,ownershipAudit.before);assert(ownershipAudit.shared);
  assert.deepEqual([roof.memory,roof.limit],[600,500]);
  assert.equal(overflow.fp32Square,Infinity);assert.deepEqual([overflow.fp32Result,overflow.fp64Result],[0,1]);
  assert.deepEqual(logits.map(l=>l.winner),['B','A']);
  return true;
}
