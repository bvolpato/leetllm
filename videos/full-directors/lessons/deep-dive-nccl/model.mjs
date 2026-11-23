import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const chapters = JSON.parse(readFileSync(new URL('./narration.json', import.meta.url), 'utf8'))
const positions = new Map(chapters.flatMap(ch => ch.beats.map((beat, i) => [beat.id, { chapter: ch.id, i }])))
// Resolve the decision on the first word after the answer clause. Earlier frames
// keep the known operands, including while a packet is in flight.
export function cue(c, id, phrase, seconds = 0) {
  const target = positions.get(id)
  assert.equal(target.chapter, c.beat.chapterId)
  if (c.beat.beatIndex !== target.i) return Number(c.beat.beatIndex > target.i)
  return c.reveal(phrase, seconds)
}
export const inputs = [[2,1,2,0],[0,2,3,1],[1,0,4,2],[1,3,1,2]]
export const ranks = inputs.map((_,i) => i)
export const slot = 2
export function gradientRack(c) {
  const guide = cue(c, 'column', 'Circle the third slot', 1.35)
  const fullModel = cue(c, 'replicas', 'Each rank owns weights') === 1
  const ownerOpen = cue(c, 'owner', 'Open its socket', 0.6)
  const replicasOpen = cue(c, 'replica-sockets', 'Open the other three sockets', 0.6)
  const sockets = ranks.map(rank => ({
    weights: fullModel ? ranks : [rank],
    open: rank === slot ? ownerOpen : replicasOpen,
  }))
  return {guide, fullModel, sockets}
}
export const totals = ranks.map(col => inputs.reduce((n,row) => n + row[col], 0))
export const order = [3,0,1,2]
export const partials = order.map((rank,i) => {
  const contributors = order.slice(0,i+1)
  const units = contributors.flatMap(r => Array(inputs[r][slot]).fill(r))
  return {rank, contributors, units, value:units.length}
})
export function buffers(hop) {
  return ranks.map(rank => totals.map((sum,col) => (rank-col+4)%4 <= hop ? sum : null))
}
export const rootDevices = [5,1,7,0]
export const root = rootDevices.indexOf(7)
export const mismatchRank = 2
export function receipts(fixed) {
  return ranks.map(r => ({op: r === mismatchRank && !fixed ? 'Broadcast' : 'All-gather', count:1, root:r === mismatchRank && !fixed ? 0 : null}))
}
export const tokens = [[1,2,3],[4,5,6],[7,8,9]]
export const dispatchTo = dest => tokens.map(row => row[dest])
export const floatBytes = Float32Array.BYTES_PER_ELEMENT
export function shardView(rank,count,buffer) {
  return buffer.subarray(rank*count, (rank+1)*count)
}
export const local = Float32Array.from(inputs[2])
shardView(2,1,local)[0] = totals[2]
export function traffic(k, bytes) {
  const chunk = bytes/k, rounds = 2*(k-1)
  return {chunk, rounds, sent:chunk*rounds, factor:rounds/k}
}
export const schedules = [
  {name:'Ring',rounds:6,rate:50},
  {name:'Tree',rounds:4,rate:30},
]
export function cost(kB, schedule) {
  const startup = 2*schedule.rounds
  const payload = traffic(4,kB*1000).sent/(schedule.rate*1000)
  return {startup,payload,total:startup+payload}
}
export const stream = {ready:1,returned:2,finished:7,other:[2,6],weightsUntil:8}
export const grouped = {pending:2,enqueued:4,launched:5,finished:9}
export const row = {mib:256, us:6000, ranks:4, timed:20, warmups:5, wrong:[0,0]}
row.bytes = row.mib*2**20
row.count = row.bytes/floatBytes
row.algbw = row.bytes/(row.us*1e-6)/1e9
row.busbw = row.algbw*traffic(row.ranks,row.bytes).factor
export function step(hidden) {
  const compute = 8, duration = row.us/1000, begin = compute-hidden
  return {compute,duration,begin,end:begin+duration,wait:duration-hidden}
}
export const incident = ranks.map(rank => ({rank, previous:1, entry:rank===2?null:4, allocationFailure:rank===2?3:null, timeout:rank===2?null:10}))
export const practice = {ready:4,read:3,write:7,consumer:5}
export function replay() {
  const read = Math.max(practice.ready,practice.read)
  const write = read + (practice.write-practice.read)
  return {ready:practice.ready,read,write,consumer:write}
}
export function check() {
  assert.deepEqual(inputs.map(row => row[slot]), [2, 3, 4, 1])
  const rackAt = (id, progress) => gradientRack({
    beat: {chapterId: 'c01', beatIndex: positions.get(id).i},
    reveal: () => progress,
  })
  assert.equal(rackAt('column', 0.5).guide, 0.5)
  const held = rackAt('who', 1)
  assert.equal(held.guide, 1)
  assert.deepEqual(held.sockets.map(s => s.weights), [[0], [1], [2], [3]])
  assert.deepEqual(held.sockets.map(s => s.open), [0, 0, 0, 0])
  for (const progress of [0, 0.5, 1]) {
    assert.deepEqual(rackAt('owner', progress).sockets.map(s => s.open), [0, 0, progress, 0])
    assert.deepEqual(rackAt('replica-sockets', progress).sockets.map(s => s.open), [progress, progress, 1, progress])
  }
  const replicas = rackAt('replicas', 1)
  assert(replicas.sockets.every(s => s.weights.length === inputs[0].length && s.weights.includes(slot)))
  assert.deepEqual(replicas.sockets.map(s => s.open), [0, 0, 1, 0])
  assert.deepEqual(totals,[4,6,10,5])
  assert.deepEqual(partials.map(p=>[p.rank,p.value]),[[3,1],[0,3],[1,6],[2,10]])
  partials.forEach((p,i)=>{
    assert.equal(new Set(p.contributors).size,i+1)
    assert.equal(p.units.filter(r=>r===3).length,1)
    p.contributors.forEach(r=>assert.equal(p.units.filter(v=>v===r).length,inputs[r][slot]))
  })
  for(let hop=0;hop<4;hop++) {
    const out=buffers(hop)
    for(const r of ranks) {
      assert.equal(out[r].filter(x=>x!==null).length,hop+1)
      for(const col of ranks) {
        const owners = Array.from({length:hop+1},(_,d)=>(col+d)%4)
        assert.equal(out[r][col],owners.includes(r)?totals[col]:null)
      }
    }
  }
  assert.equal(totals[2]/ranks.length,2.5)
  assert.equal(root,2)
  assert.deepEqual(receipts(false).map(x=>x.op),['All-gather','All-gather','Broadcast','All-gather'])
  assert(receipts(true).every(x=>x.op==='All-gather' && x.count===1 && x.root===null))
  assert.equal(shardView(2,1,local).byteOffset,8)
  assert.deepEqual([...local],[1,0,10,2])
  assert.deepEqual(dispatchTo(1),[2,5,8])
  assert.deepEqual(traffic(4,16),{chunk:4,rounds:6,sent:24,factor:1.5})
  assert.deepEqual([100,200,1000].map(kB=>schedules.map(s=>cost(kB,s).total)),[[15,13],[18,18],[42,58]])
  assert(stream.ready<=stream.returned && stream.returned<stream.finished && stream.finished<stream.weightsUntil)
  assert(grouped.pending<grouped.enqueued && grouped.enqueued<grouped.launched && grouped.launched<grouped.finished)
  assert.deepEqual([row.bytes,row.count,row.algbw.toFixed(2),row.busbw.toFixed(2)],[268435456,67108864,'44.74','67.11'])
  assert.deepEqual([step(0).end,step(4).end,step(4).wait],[14,10,2])
  assert.deepEqual(incident.filter(e=>e.entry===null).map(e=>e.rank),[2])
  assert(incident.filter(e=>e.timeout).every(e=>incident[2].allocationFailure<e.entry && e.entry<e.timeout))
  assert(practice.read<practice.ready && practice.consumer<practice.write)
  assert.deepEqual(replay(),{ready:4,read:4,write:8,consumer:8})
  return true
}
