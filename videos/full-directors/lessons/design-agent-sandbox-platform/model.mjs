import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cowSnapshot, sandboxPages, sandboxAck, sandboxCapacity } from '../../../films/design-agent-sandbox-platform/arithmetic.mjs';

export const baseWing = cowSnapshot(0, 0).base;
const wingIndex = 2;
const inkByte = 136;
const baseMemory = baseWing.map((value, i) => {
  const page = Uint8Array.from({length: 4096}, (_, j) => (i * 11 + j * 7) % 256);
  page[inkByte] = value;
  return page;
});

export function wingState(copied, mapped, strokes) {
  assert(!mapped || copied);
  assert(strokes.length === 0 || mapped);
  const privatePage = copied ? baseMemory[wingIndex].slice() : null;
  const a = mapped ? privatePage : baseMemory[wingIndex];
  for (const ink of strokes) a[inkByte] = ink;
  const pages = new Set([...baseMemory, ...(copied ? [privatePage] : [])]);
  return { a: a[inkByte], b: baseMemory[wingIndex][inkByte], mapped, privatePage, pages: pages.size,
    kib: [...pages].reduce((bytes, page) => bytes + page.length, 0) / 1024 };
}

export const wings = [wingState(false, false, []), wingState(true, false, []),
  wingState(true, true, []), wingState(true, true, [99]), wingState(true, true, [99, 76])];
export function writerState(bWrote) {
  const writes = [{clone:'A', index:2, value:81}];
  if (bWrote) writes.push({clone:'B', index:2, value:52});
  return sandboxPages([7,11,13,17], writes);
}

// Track residency of one untouched page in A's mapping, alongside both writes to page 2.
const afterBothWrites = writerState(true);
const coldIndex = 1;
const snapshotPage = new Uint8Array(4096).fill(afterBothWrites.base[coldIndex]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const snapshotDigest = digest(snapshotPage);
export function cleanReadState(backend, stage, fetched = snapshotPage) {
  const file = backend === 'File';
  const received = ['received', 'validated', 'supplied', 'read'].includes(stage);
  const checked = !file && ['validated', 'supplied', 'read'].includes(stage);
  const fetchedDigest = checked ? digest(fetched) : null;
  const matches = checked && fetchedDigest === snapshotDigest;
  const resident = ['supplied', 'read'].includes(stage) && (file || matches);
  const contents = file ? snapshotPage : fetched;
  return {
    backend, index:coldIndex, backing:afterBothWrites.base[coldIndex],
    privateCount:afterBothWrites.privateCount, writes:[afterBothWrites.a[2], afterBothWrites.b[2]],
    baseAtWrite:afterBothWrites.base[2], snapshotDigest, fetchedDigest,
    received, matches, residentKiB:resident ? contents.length / 1024 : 0,
    read:resident && stage === 'read' ? contents[0] : null
  };
}

export function lease({time, unmounted = false, disposed = false}) {
  const gen = 9;
  const notice = time >= 5 ? gen : time >= 2 ? 10 : null;
  const stopped = time >= 1 && notice === gen;
  const reader = time < 9;
  const vmHandle = time < 7;
  const mounted = !(stopped && !reader && unmounted);
  const free = stopped && !vmHandle && !mounted && disposed;
  return {time, gen, notice, stopped, reader, vmHandle, mounted, free};
}

export const runTrace = [
  {rc:-1, reason:'EINTR', stop:false},
  {rc:0, reason:'MMIO', stop:false},
  {rc:-1, reason:'EINTR', stop:true},
].map(row => ({...row, action:row.rc === 0 && row.reason === 'MMIO' ? 'Handle device' :
    row.rc < 0 && row.reason === 'EINTR' ? (row.stop ? 'Stop loop' : 'Check, then retry') : 'Handle error'}));
export const probeNames = ['Wall clock', 'Kernel randomness', 'Routing', 'Control session', 'Application state'];
export function probes(appGen) {
  const rows = probeNames.map((name, i) => ({name, gen:i === 4 ? appGen : 9, passed:true}));
  return {rows, ready:rows.every(row => row.passed && row.gen === 9)};
}
export const marks = [['Accept',0],['Placed',4],['Loaded',6],['Ready',17],['User entry',18]];
export const latency = marks.at(-1)[1] - marks[0][1];
export const target = 15;

export const lower = {'policy.txt':'v1', 'runtime.bin':'v1'};
export function fileView(step) {
  const upper = {};
  if (step === 'copy') upper['policy.txt'] = lower['policy.txt'];
  if (step === 'edit') upper['policy.txt'] = 'v2';
  if (step === 'hide' || step === 'output') upper['policy.txt'] = null;
  if (step === 'output') upper['result.json'] = 'B';
  const merged = Object.fromEntries(Object.entries({...lower, ...upper}).filter(([,v]) => v !== null));
  return {upper, merged, fresh:step === 'fresh'};
}

const guestPort = 5000;
const hostPort = 1073741831;
export const handshake = {
  guestPort, hostPort, command:`CONNECT ${guestPort}\n`, reply:`OK ${hostPort}\n`
};
export const exchanges = [
  {from:'host', to:'vmm', label:handshake.command.trimEnd()+'\\n', cue:'sends a CONNECT line'},
  {from:'vmm', to:'guest', label:'Forwarded connection', cue:'forwards the connection'},
  {from:'vmm', to:'host', label:handshake.reply.trimEnd()+'\\n', cue:'then sends OK back'}
];
export const ackInputs = [handshake.reply + 'PAYLOAD', 'OK 2147483648\n'];
export const replies = ackInputs.map(bytes => sandboxAck(bytes));
const grant = {tenant:'A', generation:9, method:'GET', resource:'moth.sprite', expiresAt:60};
const libraryTargets = new Set(['library-public', 'library-private']);
function authorize(request, capability) {
  const current = request.time < capability.expiresAt;
  const scoped = ['tenant','generation','method','resource'].every(k=>request[k] === capability[k]);
  const approved = libraryTargets.has(request.target);
  const destination = (approved ? 'Approved ' : 'Unapproved ') + request.addressClass;
  return {...request, current, scoped, approved, destination, allow:scoped && current && approved};
}
const read = {tenant:'A',generation:9,method:'GET',resource:'moth.sprite',time:20,target:'library-public',addressClass:'public'};
export const attempts = [read, {...read,target:'outside-policy',addressClass:'private'}, {...read,time:60}].map(r=>authorize(r,grant));

export const budget = privateMiB => sandboxCapacity({privateMiB});
export const group = {quota:120000, period:100000, spend:70000};
export const remainder = group.quota - group.spend;

export function check() {
  const [shared, copy, mapped, orange, pink] = wings;
  assert.deepEqual([shared.a, shared.b, shared.pages, shared.kib], [30,30,6,24]);
  assert.notEqual(copy.privatePage, baseMemory[wingIndex]);
  assert.deepEqual(copy.privatePage, baseMemory[wingIndex]);
  assert.deepEqual([mapped.a, mapped.b, mapped.kib, mapped.mapped], [30,30,28,true]);
  assert.deepEqual([orange.a, orange.b, orange.pages, orange.kib], [99,30,7,28]);
  assert.deepEqual([pink.a, pink.b, pink.pages, pink.kib], [76,30,7,28]);
  for (const frame of [orange,pink]) assert.equal(frame.privatePage.filter((v,i)=>v!==baseMemory[2][i]).length, 1);
  for (const [wrote, b, kib] of [[false,13,20],[true,52,24]]) {
    const s = writerState(wrote);
    assert.deepEqual([s.a[2],s.b[2],s.base[2],s.kib], [81,b,13,kib]);
  }
  for (const backend of ['File','Uffd']) {
    for (const phase of ['waiting','received','validated','supplied','read']) {
      const s = cleanReadState(backend, phase);
      assert.deepEqual([s.index,s.backing,s.writes,s.baseAtWrite,s.privateCount], [1,11,[81,52],13,2]);
      assert.equal(s.residentKiB, ['supplied','read'].includes(phase) ? 4 : 0);
      assert.equal(s.read, phase === 'read' ? 11 : null);
      assert.equal(s.matches, backend === 'Uffd' && ['validated','supplied','read'].includes(phase));
    }
  }
  const damaged = snapshotPage.slice();
  damaged[4095] ^= 1;
  const rejected = cleanReadState('Uffd','read',damaged);
  assert.deepEqual([rejected.matches,rejected.residentKiB,rejected.read,rejected.privateCount], [false,0,null,2]);
  assert.deepEqual(runTrace.map(r=>r.action), ['Check, then retry','Handle device','Stop loop']);
  assert.equal(probes(8).ready,false);
  assert.equal(probes(9).ready,true);
  assert.deepEqual([latency,latency-target],[18,3]);
  assert.deepEqual(fileView('copy').upper,{'policy.txt':'v1'});
  assert.deepEqual(fileView('edit').merged,{'policy.txt':'v2','runtime.bin':'v1'});
  assert.deepEqual(fileView('hide').merged,{'runtime.bin':'v1'});
  assert.deepEqual(fileView('output').merged,{'runtime.bin':'v1','result.json':'B'});
  assert.deepEqual(fileView('fresh').merged,lower);
  assert.deepEqual([replies[0].status,replies[0].port,replies[0].leftover,replies[1].status],
    ['valid',1073741831,'PAYLOAD','invalid']);
  assert.equal(handshake.command, 'CONNECT 5000\n');
  assert.deepEqual(exchanges.map(({from,to,label})=>[from,to,label]), [
    ['host','vmm','CONNECT 5000\\n'], ['vmm','guest','Forwarded connection'], ['vmm','host','OK 1073741831\\n']
  ]);
  assert.equal(replies[0].line, handshake.reply);
  assert.equal(replies[0].port, handshake.hostPort);
  assert.equal(replies[0].consumed, handshake.reply.length);
  assert.deepEqual(attempts.map(a=>a.allow),[true,false,false]);
  assert.deepEqual(attempts.map(a=>[a.destination,a.current]), [
    ['Approved public',true], ['Unapproved private',true], ['Approved public',false]
  ]);
  const privateTarget = {...read,target:'library-private',addressClass:'private'};
  assert.equal(authorize(privateTarget,grant).allow,true);
  assert.equal(authorize({...privateTarget,time:60},grant).allow,false);
  assert.equal(authorize({...read,generation:8},grant).allow,false);
  assert.equal(authorize({...read,method:'POST'},grant).allow,false);
  const {poolMiB,fullSlots,privateSlots,sessions,mean,admitted,queued} = budget(50);
  assert.deepEqual([poolMiB,fullSlots,privateSlots,budget(200).privateSlots],[229376,112,4587,1146]);
  assert.deepEqual([sessions,Number(mean.toFixed(1)),admitted,queued],[3840,115.2,128,3712]);
  assert.deepEqual([remainder,group.quota/group.period],[50000,1.2]);
  assert.equal(lease({time:2}).stopped,false);
  for (const time of [0,1,2,5,7]) assert.equal(lease({time,unmounted:true,disposed:true}).free,false);
  assert.equal(lease({time:9}).mounted,true);
  assert.equal(lease({time:9,unmounted:true}).free,false);
  assert.equal(lease({time:9,unmounted:true,disposed:true}).free,true);
}
