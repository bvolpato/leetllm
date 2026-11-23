import assert from 'node:assert/strict';
import { customers } from '../../../films/deep-dive-skyrl/sql-repair.mjs';
import { actionMeanNll, admissionReceipt, advantages, criticPairGate, fleetReady, liveRewardDecision, ppoReceipt, scalarResume } from '../../../films/deep-dive-skyrl/arithmetic.mjs';
import { trace } from '../../../films/deep-dive-skyrl/fixtures.mjs';

export { customers };
export const vocabulary = {11:'unresolved', 12:'_count', 90:'no such column: ', 21:'open', 22:'_incidents'};
const turns = [
  { author: 'Sampler', ids: [11,12], reward: -0.2 },
  { author: 'SQLite', ids: [90,11,12], reward: 0 },
  { author: 'Sampler', ids: [21,22], reward: 1 }
];
export const names = turns.map(t => t.ids.map(id => vocabulary[id]).join(''));
export const tokens = turns.flatMap(t => t.ids.map((id,i) => ({
  id, mask: Number(t.author === 'Sampler'), reward: i === t.ids.length - 1 ? t.reward : 0
})));
export const sqlResult = customers.filter(([,active,count]) => active && count > 3).map(row => row[0]);
export const returnSum = tokens.reduce((s,t) => s + t.reward, 0);
export function costs(echo, sampled) {
  const values = [0.2,(4 + Math.round(4*sampled))/10,0,0,Math.round(90*echo)/10,0.6,0.8];
  const terms = values.filter((_,i) => tokens[i].mask);
  return {values, terms, mean: actionMeanNll(values.map(v => -v),tokens.map(t=>t.mask))};
}
export const generatorRows = [
  {id:'r8', sample:'open_incidents', mask:'11', reward:1},
  {id:'r9', sample:'unresolved_count', mask:'11', reward:-0.2}
];
const outputs = [['Ada'],['Ada','Ben'],['Ada'],[]];
export function group(flat) {
  const reward = outputs.map(names => Number(flat || (names.length === 1 && names[0] === 'Ada')));
  return {outputs,reward,...advantages(reward)};
}
export const clipped = [ppoReceipt(1.4,0.5),ppoReceipt(0.6,-0.5)];
export function schedule(async) {
  const groups = [{id:'A',end:4}, ...(async ? [{id:'B',end:4}] : []), {id:'L',end:40}];
  const batch = [...groups].sort((a,b) => a.end-b.end).slice(0,2);
  const start = Math.max(...batch.map(g => g.end));
  return {groups,batch,start,trained:start+3,synced:start+5};
}
const occupancy = [['A','B','L'],['C','B','L'],['C',null,'L'],[null,null,'L']];
export const steps = trace.map((r,i) => ({...r, ...admissionReceipt({B:1,S:2,workers:3,...r}), slots:occupancy[i], lag:r.step-r.scheduled}));
export const margin = admissionReceipt({B:2,S:2,step:4,accepted:10,running:1,workers:6});
export const liveGroup = liveRewardDecision([1,1],[true,true]);
export function ledger(moved, admitted) {
  const entries = [
    {id:'A',status:'accepted'},{id:'B',status:'accepted'},{id:'F',status:moved?'filtered':'accepted'},
    {id:'J',status:'running'},{id:'K',status:'running'}
  ];
  if (admitted) entries.push({id:'Q52',status:'running'});
  const count = status => entries.filter(e=>e.status === status).length;
  const accepted = count('accepted'), running = count('running'), filtered = count('filtered');
  return {entries,accepted,running,filtered,submitted:entries.length,charged:accepted+running};
}
export function fleet(versions,target,finished,probes) {
  const ready = versions.filter(v=>v===target).length;
  return {versions,target,ready,finished,probes,pass:fleetReady(versions,target,finished,probes)};
}
export function firstToken(state) {
  if (!state.pass) return null;
  return {request:'Q52', position:0, text:vocabulary[21], replica:'C', revision:state.versions[2]};
}
export const historyRevisions = { sampled: 11, replay: 11, current: 12 };
export const historical = [
  {id:12, p:0.2, now:0.3, replay:0.25},
  {id:22, p:0.4, now:0.1, replay:null}
].map(row => ({
  ...row,
  ratio: row.now / row.p,
  substituteRatio: row.replay === null ? null : row.now / row.replay
}));
export function critic(fixed) {
  const weights=[1,1,1],values=[0.2,0.3,0.5],returns=fixed?[0.4,0.8,1]:[0.4,0.8];
  return {weights,values,returns,pass:criticPairGate(values,returns,weights)};
}
export const restores = [
  {label:'Full restore',v:0.4,g:0.5}, {label:'Weights only',v:0,g:0.5}, {label:'Stale cursor',v:0.4,g:-0.25}
].map(r=>({...r,...scalarResume({weight:2,velocity:r.v},r.g)}));
export function practice(started) {
  return admissionReceipt({B:2,S:1,step:7,accepted:13,running:2+Number(started),workers:4});
}
export function check() {
  assert.equal(names[1], 'no such column: ' + names[0]);
  assert.deepEqual(sqlResult,['Ada']);
  assert.equal(names[2],'open_incidents');
  assert.deepEqual(generatorRows.map(({id,sample,mask,reward})=>[id,sample,mask,reward]),[
    ['r8',names[2],'11',tokens[6].reward],['r9',names[0],'11',tokens[1].reward]
  ]);
  assert.equal(tokens[1].id,tokens[4].id);
  assert.deepEqual(tokens.map(t=>t.mask),[1,1,0,0,0,1,1]);
  assert.deepEqual(tokens.map(t=>t.reward),[0,-0.2,0,0,0,0,1]);
  assert.equal(returnSum,0.8);
  for (const k of [0,0.25,0.5,1]) {
    assert.equal(costs(k,0).mean,0.5);
    assert(Math.abs(costs(1,k).mean-(0.5+Math.round(4*k)/40))<1e-10);
  }
  assert.deepEqual(group(false).reward,[1,0,1,0]);
  assert.deepEqual(group(false).centered,[0.5,-0.5,0.5,-0.5]);
  assert.deepEqual(group(true).centered,[0,0,0,0]);
  assert.deepEqual(clipped.map(x=>x.surrogate),[0.6,-0.4]);
  assert.deepEqual([schedule(false).start,schedule(true).start],[40,4]);
  assert.deepEqual(steps.map(r=>r.outstanding),[3,3,2,1]);
  for (const r of steps) {
    const occupied=r.slots.filter(Boolean);
    assert.equal(occupied.length,r.outstanding);
    assert(occupied.includes(r.id));
    assert.equal(r.slots[2],'L');
    assert.equal(occupied.length-r.running,r.accepted-r.consumed);
  }
  assert.equal(steps[3].lag,3);
  assert.equal(margin.available,1);
  assert.equal(liveGroup.keep,false);
  assert.deepEqual([ledger(false,false),ledger(true,false),ledger(true,true)].map(r=>[r.submitted,r.accepted,r.filtered,r.running,r.charged]),[[5,3,0,2,5],[5,2,1,2,4],[6,2,1,3,5]]);
  for (const [vs,done,ps,pass] of [
    [[12,12,11],true,[true,true,true],false],[[12,12,12],false,[true,true,true],false],
    [[12,12,12],true,[true,true,false],false],[[12,12,12],true,[true,true,true],true]
  ]) {
    const state=fleet(vs,12,done,ps);
    assert.equal(state.ready,vs[2]===11?2:3);
    assert.equal(state.pass,pass);
    assert.deepEqual(firstToken(state),pass?{request:'Q52',position:0,text:'open',replica:'C',revision:12}:null);
  }
  assert.equal(historyRevisions.sampled,historyRevisions.replay);
  assert.notEqual(historyRevisions.sampled,historyRevisions.current);
  const [count,incidents]=historical;
  assert.deepEqual([vocabulary[count.id],count.p,count.replay,count.now],['_count',0.20,0.25,0.30]);
  assert.deepEqual([vocabulary[incidents.id],incidents.p,incidents.replay,incidents.now],['_incidents',0.40,null,0.10]);
  assert.deepEqual(historical.map(r=>r.ratio.toFixed(2)),['1.50','0.25']);
  assert.equal(count.substituteRatio.toFixed(2),'1.20');
  assert.equal(incidents.substituteRatio,null);
  assert.deepEqual([critic(false).pass,critic(true).pass],[false,true]);
  assert.deepEqual(restores.map(r=>r.weight.toFixed(3)),['1.920','1.950','1.995']);
  assert.deepEqual([practice(false).available,practice(true).available],[1,0]);
}
