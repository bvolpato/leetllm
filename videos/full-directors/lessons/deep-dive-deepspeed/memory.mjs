import assert from 'node:assert/strict';
import {base, label, chip, track, row, note, readout, rect, line, socket, cells, event, range, sum, fmt, clamp, colors, ink, paper, mid, blue, mint, orange, gold, plum} from './bench.mjs';

const names=['Weights','Gradients','Master','1st moment','2nd moment'];
const colorsForState=[blue,mint,gold,orange,plum];
function ledger(widths=[2,2,4,4,4],stage=0,ranks=4) {
  return widths.map((width,i)=>1.5*width/(stage >= (i===0?3:i===1?2:1)?ranks:1));
}
const recipe=ledger();
const capacity = 16;
const tray = { x: 205, y: 500, unit: 82, height: 144 };
const componentNames = ['Weights', 'Gradients', 'Master copy', 'First moment', 'Second moment'];

function arrival(k) {
  const placements = [
    event(k, 0, 'The weights take', .8),
    event(k, 1, 'Backward produces', .85),
    event(k, 2, 'Place the master copy', .95),
    event(k, 3, 'Try the first moment', .8),
  ];
  const visible = [
    true,
    !!event(k, 0, 'The gradients come next'),
    !!event(k, 1, 'a master copy with'),
    !!event(k, 2, 'Here comes the first moment'),
  ];
  let allocated = 0;
  const pieces = [];
  for (const [index, progress] of placements.entries()) {
    if (!visible[index]) break;
    const size = recipe[index];
    const shortage = Math.max(0, allocated + size - capacity);
    const seated = progress === 1 && shortage === 0;
    pieces.push({ index, start: allocated, size, progress, shortage, seated });
    if (!seated) break;
    allocated += size;
  }
  return {
    pieces, allocated, free: capacity - allocated,
    refused: !!event(k, 3, 'All six stay outside'),
    second: !!event(k, 3, 'a second moment to track'),
    fullRecipe: !!event(k, 3, 'before activations'),
  };
}

function polygon(g, points, color) {
  g.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = color;
  g.fill();
}

function bracket(g, x, end, y, depth, color) {
  g.beginPath();
  g.moveTo(x, y - depth);
  g.lineTo(x, y);
  g.lineTo(end, y);
  g.lineTo(end, y - depth);
  g.lineWidth = 3;
  g.strokeStyle = color;
  g.stroke();
}

function gpuFace(g, allocated, free) {
  const { x, y, unit, height } = tray;
  const edge = x + capacity * unit;
  // The keyed edge connector and mounting screws belong to the card, outside its memory well.
  rect(g, 290, 791, 622, 56, '#374f51');
  for (let px = 302; px < 908; px += 19) {
    if (px < 566 || px > 597) rect(g, px, 813, 13, 32, '#bd9557');
  }
  polygon(g, [[108,481],[133,456],[edge+34,456],[edge+56,478],[edge+56,786],
    [edge+32,810],[137,810],[108,781]], '#233e44');
  polygon(g, [[108,474],[132,450],[edge+33,450],[edge+56,473],[edge+56,776],
    [edge+32,800],[137,800],[108,771]], '#355854');
  for (const px of [146,edge+23]) {
    for (const py of [477,765]) {
      g.beginPath(); g.arc(px,py,9,0,2*Math.PI); g.fillStyle='#b1b69c'; g.fill();
      line(g,px-4,py+3,px+4,py-3,'#41504b',2);
    }
  }
  rect(g, x-10, y-10, capacity*unit+20, height+21, '#183032');
  rect(g, x, y, capacity*unit, height, '#d8dfce');
  for (let i=0; i<capacity; i++) {
    const px = x + i*unit;
    line(g, px+unit/2, y+height-19, px+unit/2, y+height-6, '#84988a', 3);
  }
  // The raised end stop meets the underside of a piece too wide for the well.
  rect(g, edge, 443, 12, y+height+12-443, '#d9c49a');
  rect(g, edge+12, 449, 6, y+height+6-449, '#182e30');
  const split = x + allocated*unit;
  if (allocated >= 6) {
    bracket(g,x+2,split-2,672,13,'#9fb7a9');
    label(g,fmt(allocated)+' GB allocated',(x+split)/2,719,42,paper,{align:'center'});
  }
  if (allocated > 0 && free > 0) {
    bracket(g,split+2,edge-2,672,13,'#c6d9c7');
    label(g,fmt(free)+' GB free',(split+edge)/2,719,47,'#eff4d7',{align:'center',bold:true});
  }
  label(g,capacity+' GB GPU',x,779,40,'#ecedd9',{bold:true});
  for (let px = 503; px < 746; px += 24) {
    line(g,px,765,px+11,752,'#71918a',4);
  }
}

function memoryPiece(g, x, y, size, name, color, { outline = false } = {}) {
  const width = size * tray.unit, height = tray.height;
  rect(g, x+1, y+1, width-2, height-2, outline ? paper : color);
  if (outline) {
    g.setLineDash([12,8]);
    rect(g, x+2, y+2, width-4, height-4, null, color);
    g.setLineDash([]);
  }
  const fg = outline ? color : paper;
  label(g,name,x+width/2,y+55,38,fg,{bold:true,align:'center',width:width-14});
  label(g,fmt(size)+' GB',x+width/2,y+116,55,fg,{font:'Mono',align:'center',width:width-14});
}

function trayHeading(g, title, detail) {
  rect(g,0,0,1920,1080,paper);
  label(g,title,108,127,66,ink,{font:'Serif'});
  label(g,detail,1805,124,38,mid,{align:'right'});
}

export function opening(g,k) {
  const state = arrival(k);
  const { x, y, unit, height } = tray;
  trayHeading(g, 'Mixed-precision Adam', '1.5 billion parameters');
  gpuFace(g,state.allocated,state.free);
  for (const p of state.pieces) {
    const left = x + p.start*unit;
    const landing = p.shortage ? 443-height : y;
    const t = p.progress*p.progress*(3-2*p.progress);
    const top = 210+(landing-210)*t;
    memoryPiece(g,left,top,p.size,componentNames[p.index],colorsForState[p.index]);
    if (p.shortage && state.refused) {
      const edge = x + capacity*unit, end = edge + p.shortage*unit;
      // A hatched lip and its dimension mark only the excess width of the rejected piece.
      const lip = top+height-17;
      rect(g,edge,lip,end-edge,16,'#773722');
      for (let px=edge+5; px < end-10; px+=18) line(g,px,lip+14,px+10,lip+2,'#ffdfb7',3);
      bracket(g,edge,end,top-16,-11,orange);
      label(g,fmt(p.shortage)+' GB over',(edge+end)/2,top-36,47,orange,{align:'center',bold:true});
    }
  }
  if (state.second) {
    memoryPiece(g,x,235,recipe[4],componentNames[4],plum,{outline:true});
    if (state.fullRecipe) label(g,fmt(sum(recipe))+' GB for all five arrays',x,427,38,ink);
  }
}

function shardedTray(g, parts) {
  const allocated = sum(parts), free = capacity-allocated, {x,y,unit,height} = tray;
  trayHeading(g,'ZeRO stage 1','Rank 1 of 4');
  gpuFace(g,allocated,free);
  let start = x;
  for (const [i, size] of parts.entries()) {
    const width = size*unit;
    if (i < 2) {
      memoryPiece(g,start,y,size,componentNames[i],colorsForState[i]);
    } else {
      rect(g,start+1,y+1,width-2,height-2,colorsForState[i]);
      label(g,['Master','m','v'][i-2],start+width/2,y+55,31,paper,{bold:true,align:'center'});
      label(g,fmt(size),start+width/2,y+115,48,paper,{font:'Mono',align:'center'});
    }
    start += width;
  }
  const optimizerStart = x+(parts[0]+parts[1])*unit;
  bracket(g,optimizerStart+2,start-2,467,-13,paper);
  label(g,'Master copy and moments', (optimizerStart+start)/2,365,42,ink,{bold:true,align:'center'});
  label(g,'GB per array', (optimizerStart+start)/2,420,36,mid,{align:'center'});
}

function stageAt(k) {
  return Number(event(k,1,'Stage one'))+Number(event(k,2,'Stage two'))+Number(event(k,2,'Stage three'));
}
export function ownership(g,k) {
  const stage=stageAt(k),parts=ledger(undefined,stage);
  if (stage === 1 && event(k,1,"Put rank one's share")) return shardedTray(g,parts);
  base(g,'State ownership','Which rank keeps slice B?');
  label(g,['Data parallel','ZeRO stage 1','ZeRO stage 2','ZeRO stage 3'][stage],100,305,46,ink,{bold:true});
  const owners=['A','B','C','D'];
  ['Weights','Gradients','Master + moments'].forEach((name,i)=>{
    const y=400+i*130, shared=stage >= [3,2,1][i];
    label(g,name,98,y+39,36,ink,{width:342,bold:true});
    range(4).forEach(rank=>{
      const x=480+rank*338;
      if(!i)label(g,'Rank '+rank,x,362,30,rank===1?orange:mid,{bold:true});
      cells(g,x,y,owners.map((s,j)=>shared&&j!==rank?null:s),{w:64,h:69,sz:31,color:j=>j===1?orange:blue});
    });
  });
  const grouped=[parts[0],parts[1],sum(parts.slice(2))];
  note(g,grouped.map(fmt).join(' + ')+' = '+fmt(sum(parts))+' GB per rank   ·   persistent state only');
}

export function dtype(g,k) {
  const wide=!!event(k,1,'The gradient now');
  const stage=event(k,2,'Stage three quarters')?3:event(k,2,'stage two keeps')?2:0;
  const widths=[2,wide?4:2,4,4,4],parts=ledger(widths,stage);
  base(g,'Buffer dtypes','How many bytes does this recipe keep?');
  const x=100, pitch=348, floor=667;
  parts.forEach((n,i)=>{
    const left=x+i*pitch;const height=n*40;
    label(g,names[i],left,314,36,ink,{width:pitch-16,bold:true});
    label(g,widths[i]+' B / parameter',left,368,29,mid);
    rect(g,left,floor-265,254,265,'#e3e3d4');
    rect(g,left,floor-height,254,height,colorsForState[i]);
    label(g,fmt(n)+' GB',left,floor+61,42,colorsForState[i],{font:'Mono'});
  });
  label(g,'P = 1.5B parameters   ·   N = 4 data ranks   ·   '+(stage?'ZeRO stage '+stage:'replicated arrays'),x,807,31,mid);
  const formulas=['P(p + g + o)','', 'P[p + (g + o)/N]','P(p + g + o)/N'];
  note(g,formulas[stage]+'   =   '+fmt(sum(parts))+' GB per rank');
}

export function workingSet(lengths,ranks,live) {
  const shards=lengths.map(n=>Math.ceil(n/ranks)),padded=shards.map(n=>n*ranks);
  const resident=sum(shards),total=resident+sum(live.map(index=>padded[index]));
  return {shards,padded,resident,total};
}
export function gather(g,k) {
  const a=event(k,1,'Reserve a separate',1.6),b=event(k,2,'Reserve layer B',1.6),released=event(k,2,'release its full view');
  const live=[...(a>0&&!released?[0]:[]),...(b>0?[1]:[])];
  const ws=workingSet([8,8,8,8],4,live);
  base(g,'Stage 3 on rank 0','What stays allocated when a layer releases?');
  label(g,'Four tensors of eight weights   ·   four data ranks',100,300,37);
  row(g,370,'Resident shards',['A0','A1','B0','B1','C0','C1','D0','D1'],{color:blue});
  function dest(i,y,progress){
    label(g,'Full view of '+['A','B'][i],100,y+48,35,ink,{bold:true});
    if(!live.includes(i)){label(g,i===0&&released?'Released after last use':'No allocation',585,y+47,34,mid);return;}
    const copied=Math.floor(progress*8);
    range(8).forEach(j=>{const x=585+j*130;
      if(j<copied)chip(g,x,y,122,76,['A','B'][i]+j,i?plum:mint,{size:32});
      else socket(g,x,y,122,76,'·');});
  }
  dest(0,512,a);dest(1,654,b);
  note(g,ws.resident+' resident  +  '+(ws.total-ws.resident)+' in separate full buffers  =  '+ws.total+' live parameter slots');
}
function paddedState(k) {
  const first=event(k,1,'Reserve eight slots',1.7),second=event(k,2,'Prefetch that second tensor',1.5);
  const lengths=k.beat.beatIndex<2?[5]:[5,7],live=[...(first>0?[0]:[]),...(second>0?[1]:[])];
  return {first,second,lengths,live,...workingSet(lengths,4,live)};
}
export function padded(g,k) {
  const s=paddedState(k);
  base(g,'Padded all-gather','Where do the local two go during the gather?');
  for(let r=0;r<4;r++){
    const x=390+r*345;label(g,'Rank '+r,x,312,31,mid,{bold:true});
    cells(g,x,335,[2*r,2*r+1].map(n=>n<5?'A'+n:'pad'),{w:134,h:71,color:r===0?blue:mid,sz:32});
  }
  label(g,'A · 5 weights',100,335,33,ink,{bold:true});
  if(s.lengths.length>1)label(g,'B · 7 weights',100,389,33,ink,{bold:true});
  row(g,455,'Rank 0 keeps',s.lengths.length===1?['A0','A1']:['A0','A1','B0','B1'],{color:blue});
  function destination(y,idx,t){
    label(g,'Gather '+['A','B'][idx],100,y+44,35,ink,{bold:true});
    if(!s.live.includes(idx)){label(g,'Waiting to allocate',585,y+45,33,mid);return;}
    const size=s.padded[idx],n=Math.floor(t*size);
    range(size).forEach(j=>{const x=585+j*130;
      if(j<n)chip(g,x,y,122,76,j<s.lengths[idx]?['A','B'][idx]+j:'pad',j>=s.lengths[idx]?gold:j<2?blue:idx?plum:mint,{size:31});
      else socket(g,x,y,122,76,'·');
    });
  }
  destination(582,0,s.first);
  if(s.lengths.length>1)destination(698,1,s.second);
  else label(g,s.first>0?'A0 and A1 copy locally. Six slots come from peers, including three pads.':'Five model values   ·   four equal chunks   ·   each pad occupies one slot',100,776,31,mid);
  note(g,[s.resident+' resident',...s.live.map(i=>s.padded[i]+' in '+['A','B'][i])].join('  +  ')+'  =  '+s.total+' slots on rank 0');
}
const planLengths = [7, 11, 5];
const planRanks = 3, normalLimit = 30, replayLimit = 29;
const overlap = workingSet(planLengths, planRanks, [1, 0]).total;
const separatePeak = Math.max(...[0, 1].map(i => workingSet(planLengths, planRanks, [i]).total));

function afterClause(k, beat, phrase, {duration = 0, captionBreak = false} = {}) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  if (captionBreak) k.reveal(phrase, 0, {captionStart: phrase});
  const elapsed = k.elapsed - k.wordCue(phrase).end + 1e-9;
  return duration ? clamp(elapsed / duration) : Number(elapsed >= 0);
}

export function planState(k) {
  const replay = k.beat.beatIndex >= 4;
  const limit = afterClause(k, 4, 'twenty-nine-slot allowance') ? replayLimit : normalLimit;
  const bSized = afterClause(k, 2, 'B takes twelve slots');
  const bReserve = afterClause(k, 2, 'Now twenty-one are live', {duration: .65, captionBreak: true});
  const aSized = afterClause(k, 3, 'Its three slots per rank require nine for the full view');
  const rejected = afterClause(k, 5, 'The overlap would require thirty', {captionBreak: true});
  // Clear B before moving the pending request into the space it freed.
  const reorder = afterClause(k, 5, 'release its full twelve-slot buffer', {duration: 1.6});
  const bRelease = clamp(2 * reorder), aShift = clamp(2 * reorder - 1);
  const aReserve = replay
    ? afterClause(k, 5, 'Eighteen slots are now live', {duration: .65, captionBreak: true})
    : afterClause(k, 3, 'and all thirty are occupied', {duration: .65, captionBreak: true});
  const hasB = bReserve === 1 && bRelease < 1;
  const hasA = aReserve === 1;
  const live = [...(hasB ? [1] : []), ...(hasA ? [0] : [])];
  const peakRevealed = afterClause(k, 5, 'and the scheduled peak was twenty-one', {captionBreak: true});
  return {
    ...workingSet(planLengths, planRanks, live), live, limit, replay, hasB, hasA, bSized, bReserve,
    bRelease, aSized, aShift, aReserve, rejected, peakRevealed,
  };
}

export function plan(g, k) {
  const s = planState(k), {shards, padded, resident, limit, live, total} = s;
  const x = 100, width = 1692, y = 552, height = 111, waitingY = 432;
  const at = slots => x + width * slots / normalLimit;
  const bEnd = resident + padded[1];
  const gatherTile = i => ({n: padded[i], label: ['A', 'B'][i] + '  ' + padded[i], color: i ? mint : plum});
  const parts = [{n: resident, label: 'Shards  ' + resident, color: blue}];
  for (const i of live) {
    if (i !== 1 || s.bRelease === 0) parts.push(gatherTile(i));
  }
  const tile = (i, slot, top) => {
    const {n, label: content, color} = gatherTile(i);
    chip(g, at(slot) + 1, top, at(n) - x - 2, height - 4, content, color, {size: 37});
  };
  const lower = t => waitingY + (y + 2 - waitingY) * t;
  const aQueued = !!event(k, 2, 'A prefetch of the seven-element tensor');
  const showATile = s.replay ? s.rejected : s.aReserve > 0;
  const blocked = s.rejected && s.bRelease < 1;

  base(g, 'Prefetch admission', 'Count the live parameter slots');
  label(g, 'One of ' + planRanks + ' ranks   ·   A has ' + planLengths[0] + ' weights, B has ' +
    planLengths[1] + ', C has ' + planLengths[2], 100, 285, 37);
  label(g, 'Local shards', 100, 380, 32, mid, {bold: true});
  cells(g, 370, 324, shards.map((v, i) => ['A', 'B', 'C'][i] + ' × ' + v), {w: 186, h: 78, color: blue});
  track(g, x, y, width, normalLimit, parts, {h: height});
  if (limit < normalLimit) rect(g, at(limit), y, at(normalLimit) - at(limit), height, '#d0c7b8');

  if (s.bReserve > 0 && !s.hasB && !s.replay) tile(1, resident, lower(s.bReserve));
  if (s.hasB && s.bRelease > 0) tile(1, resident, lower(1 - s.bRelease));
  if (aQueued && !s.hasA) {
    if (showATile) tile(0, bEnd - padded[1] * s.aShift, lower(s.aReserve));
    else socket(g, x, waitingY, 412, 78, !s.replay && s.aSized ? 'A needs ' + padded[0] + ' slots' : 'A prefetch pending', 38);
  } else if (s.bReserve === 0 && event(k, 1, 'B is next')) {
    socket(g, x, waitingY, 412, 78, s.bSized ? 'B needs ' + padded[1] + ' slots' : 'B gather pending', 38);
  }

  if (blocked) {
    const excess = overlap - limit;
    const edge = at(limit), end = at(overlap);
    rect(g, edge, waitingY, end - edge - 1, height - 4, orange);
    label(g, excess + ' slot over', end, waitingY - 16, 38, orange, {align: 'right', bold: true});
  }
  line(g, at(limit), blocked ? waitingY - 5 : y - 12, at(limit), y + height + 12, orange, 5);
  label(g, limit + '-slot limit', at(limit), 722, 36, orange, {align: 'right', bold: true});
  label(g, total + ' live    /    ' + limit + ' parameter slots', x, 722, 47, ink, {font: 'Mono'});
  label(g, 'Outside this allowance', x, 802, 31, mid, {bold: true});
  ['Gradients', 'Adam state', 'Activations', 'Workspace'].forEach((v, i) => socket(g, 520 + i * 318, 750, 301, 68, v));

  if (s.hasA && s.peakRevealed) {
    const peakX = at(separatePeak);
    line(g, peakX, y - 25, peakX, y + height, mid, 3);
    label(g, 'Replay peak  ' + separatePeak, peakX, y - 41, 39, mid, {align: 'center', bold: true});
  }
  const message = s.hasB && s.bRelease > 0 ? 'Releasing B’s full buffer after its last use.' :
    blocked ? 'Overlap needs ' + overlap + ' slots. Wait for B’s last use.' :
    s.replay && s.hasA ? 'A is live on its own. The resident shards stayed in place.' :
    s.rejected ? 'B’s full buffer is gone. Its local shard stays.' :
    s.replay ? 'Replay with B still in use. Can A overlap it?' :
    s.hasA ? 'Exact fit for parameters. Other training allocations need their own budget.' :
    s.hasB ? 'B is in use. ' + (limit - total) + ' parameter slots are free.' :
    'Full gathers use separate storage. Local shards stay resident.';
  note(g, message);
}
export function checkMemory() {
  assert.deepEqual(recipe,[3,3,6,6,6]);
  assert.deepEqual(recipe.map((_,i)=>sum(recipe.slice(0,i+1))),[3,6,12,18,24]);
  assert.equal(recipe.findIndex((_,i)=>sum(recipe.slice(0,i+1))>16),3);
  assert.deepEqual(range(4).map(stage=>sum(ledger(undefined,stage))),[24,10.5,8.25,6]);
  assert.deepEqual([0,2,3].map(stage=>sum(ledger([2,4,4,4,4],stage))),[27,9,6.75]);
  assert.deepEqual([[],[0],[0,1],[1]].map(live=>workingSet([8,8,8,8],4,live).total),[8,16,24,16]);
  assert.deepEqual(workingSet([5],4,[0]),{shards:[2],padded:[8],resident:2,total:10});
  assert.deepEqual([[0],[0,1]].map(live=>workingSet([5,7],4,live).total),[12,20]);
  assert.deepEqual([[],[1],[1,0],[0]].map(live=>workingSet(planLengths,planRanks,live).total),[9,21,30,18]);
  assert.equal(overlap, normalLimit);
  assert.equal(overlap - replayLimit, 1);
  assert.equal(separatePeak, 21);
  const timedPlan = (beatIndex, elapsed, ends = {}) => planState({
    beat: {beatIndex}, elapsed, wordCue: phrase => ({end: ends[phrase] ?? Infinity}), reveal() {},
  });
  const take = {
    'The overlap would require thirty': 2,
    'release its full twelve-slot buffer': 6,
    'Eighteen slots are now live': 13,
    'and the scheduled peak was twenty-one': 15,
  };
  const at = t => timedPlan(5, t, take);
  assert.deepEqual([timedPlan(1, 0).total, timedPlan(2, 0).total, timedPlan(3, 0).total], [9, 9, 21]);
  assert.equal(timedPlan(3, 8, {'and all thirty are occupied': 7}).total, 30);
  assert.equal(timedPlan(4, 2, {'twenty-nine-slot allowance': 3}).limit, 30);
  assert.equal(timedPlan(4, 3, {'twenty-nine-slot allowance': 3}).limit, 29);
  assert.deepEqual([at(1.99).rejected, at(2).rejected, at(2).total], [0, 1, 21]);
  assert.deepEqual([at(6.4).hasB, at(6.4).aShift], [true, 0]);
  assert.deepEqual([at(7.2).hasB, at(7.2).hasA, at(7.2).total], [false, false, 9]);
  assert.deepEqual([at(13.5).total, at(14).total], [9, 18]);
  assert.deepEqual([at(14.99).peakRevealed, at(15).peakRevealed], [0, 1]);
  const clock=(beatIndex,cues={})=>({beat:{beatIndex},reveal:phrase=>cues[phrase]??0});
  const seated = (b,cues) => {
    const s = arrival(clock(b,cues));
    return [s.pieces.filter(p=>p.seated).map(p=>p.index),s.allocated,s.free,s.refused];
  };
  assert.deepEqual(seated(0,{'The weights take':.5}),[[],0,16,false]);
  assert.deepEqual(seated(0,{'The weights take':1}),[[0],3,13,false]);
  assert.deepEqual(seated(1,{'Backward produces':1}),[[0,1],6,10,false]);
  assert.deepEqual(seated(2,{'Place the master copy':1}),[[0,1,2],12,4,false]);
  for (const p of [0,.5,1]) {
    const cues = {'Try the first moment':p};
    const last = arrival(clock(3,cues)).pieces.at(-1);
    assert.deepEqual([last.index,last.start,last.size,last.shortage],[3,12,6,2]);
    assert.deepEqual(seated(3,cues),[[0,1,2],12,4,false]);
  }
  assert.deepEqual(seated(4),[[0,1,2],12,4,true]);
  assert.deepEqual(ledger(undefined,1),[3,3,1.5,1.5,1.5]);

  assert.equal(paddedState(clock(1,{'Reserve eight slots':.5})).total,10);
}

