import assert from 'node:assert/strict';
import { historyOwnership, mergeMass, expertAssignments } from '../../../films/model-parallelism/arithmetic.mjs';
import { bench, wire, panel, lamp, dot, box, label, mark, mono, note, event, mix, between, num, bar, matrix, socket, ranks, palette, paper, gold, mint, violet, rose, faint, base } from './bench.mjs';

const positions=32, hist=historyOwnership({positions});
const historyGB=2*1e6*80*8*128*2/2**30, gpuGiB=80e9/2**30;
const ringAt=(owner,step)=>(owner-step+4)%4;
const tokenRoutes=expertAssignments();
const scores=[1000,1000,1000], values=[0,0,9];
function massState(boost) {
  const score=scores.map((v,i)=>v+(i===2&&boost?Math.log(2):0));
  const merged=mergeMass([{scores:score.slice(0,2),values:values.slice(0,2)},{scores:score.slice(2),values:values.slice(2)},{scores:[],values:[]}]);
  const weights=score.map(v=>Math.exp(v-merged.maximum));
  return {...merged,score,weights};
}
const massCases=[massState(false),massState(true)];
const localAnswers = [(values[0] + values[1]) / 2, values[2]];
const unweighted = localAnswers.reduce((a, b) => a + b) / localAnswers.length;
const meanWithEmpty = unweighted * localAnswers.length / (localAnswers.length + 1);

function prefill(c,k) {
  const b=k.beat.beatIndex;
  bench(c,'Context-parallel prefill',b===0?'Can four GPUs hold this prompt history?':b===1?'Which KV block meets query zero next?':'Who owns each head after the exchange?');
  if(b===0) {
    const split=event(k,0,'split the raw history',.8), compared=event(k,0,'above an eighty',0);
    label(c,'Hypothetical full-attention history',126,323);
    mono(c,'2 arrays (K, V) × 1M positions × 80 layers × 8 heads × 128 × 2 B',960,421,36,paper);
    const total=historyGB, x=135, w=1610;
    wire(c,[[x,584],[x+w,584]],'#516672',3);
    if(split===0) box(c,x,569,w,115,mint,null,4);
    else for(let i=0;i<4;i++){
      const xx=x+i*w/4, gap=15*split;
      box(c,xx+gap,569,w/4-gap-2,115,palette[i],null,4);
      if(split)mono(c,(total/4).toFixed(1)+' GiB',xx+w/8,626,42,base);
    }
    mono(c,split===0?total.toFixed(1)+' GiB total':total.toFixed(1)+' GiB ÷ 4',960,774,53,gold);
    note(c,compared?'One 80 GB device holds 74.5 GiB before weights. This placement exceeds it.':'Raw history for a supported sequence. Check model limits separately.');
    return;
  }
  if(b===1) {
    const t=event(k,1,'Rotate the key-value blocks',3.1)*3, step=Math.floor(t), f=t-step;
    const xs=[291,736,1181,1626];
    xs.forEach((x,j)=>{
      panel(c,x-166,329,332,179,'#6a7e88');
      label(c,'GPU '+j,x,376,faint,'center');mono(c,'Q'+j,x,451,55,paper);
      wire(c,[[x,510],[x,616]],'#687e87',4);
    });
    wire(c,[[xs[0],642],[xs[3],642],[xs[3],808],[xs[0],808],[xs[0],642]],'#506874',5);
    for(let j=0;j<4;j++){
      const source=ringAt(j,step), dest=(j+1)%4;
      let xx=mix(xs[j],xs[dest],f), yy=642;
      if(j===3&&f>0) {
        xx=mix(xs[j],xs[dest],between((f-.15)/.7));
        yy=642+166*Math.min(1,f/.15,(1-f)/.15);
      }
      box(c,xx-94,yy-43,188,86,palette[source],null,14);
      mono(c,'KV '+source,xx,yy,40,base);
    }
    note(c,'Q0 has visited   '+Array.from({length:step+1},(_,i)=>'KV '+ringAt(0,i)).join('   →   '));return;
  }
  const head=event(k,2,'An all-to-all gives',0), restore=event(k,2,'a second all-to-all returns',0);
  const byHead=head&&!restore, ox=615, oy=367, w=178, h=87;
  label(c,'Heads',ox+2*(w+8),301,faint,'center');
  for(let j=0;j<4;j++) mono(c,'H'+j,ox+j*(w+8)+w/2,344,30,faint);
  for(let i=0;i<4;i++) {
    label(c,'Position '+i,ox-28,oy+i*(h+8)+h/2,paper,'right');
    for(let j=0;j<4;j++){const owner=byHead?j:i;box(c,ox+j*(w+8),oy+i*(h+8),w,h,palette[owner],null,5);mono(c,'GPU '+owner,ox+j*(w+8)+w/2,oy+i*(h+8)+h/2,33,base);}
  }
  mono(c,byHead?'Local attention over all positions':restore?'Output projection reads position slices':'Local Q, K, V projections',960,823,44,gold);
  note(c,'Simple four-way transpose with divisible query and KV head counts.');
}
function history(c,k) {
  const b=k.beat.beatIndex, selected=event(k,1,'Follow position five',0), assigned=event(k,2,'Lane one keeps five',0);
  bench(c,'Decode cache   /   TP 8 and two KV heads','Who keeps position five for head A?');
  const ox=560, w=31, pitch=w+4, top=349, h=47, dy=59;
  label(c,'Rank    /    KV head',113,300);
  label(c,'History positions    0 to 31',ox,300);
  for (const row of hist.ranks) {
    const yy=top+row.rank*dy+Math.floor(row.rank/4)*22, col=ranks[row.head];
    mono(c,'GPU '+row.rank+'   '+String.fromCharCode(65+row.head),250,yy+h/2,35,col);
    for(let j=0;j<positions;j++){
      const owned=!assigned||row.positions.includes(j), isFocus=selected&&j===5&&row.head===0;
      box(c,ox+j*pitch,yy,w,h,owned?col:'#21323c',isFocus?gold:'#455660',3,isFocus?4:1);
      if(isFocus&&owned)mono(c,assigned?'5':'?',ox+j*pitch+w/2,yy+h/2,25,base);
    }
    mono(c,assigned?row.positions.length:positions,1765,yy+h/2,35,col);
  }
  label(c,'Pairs',1765,300,faint,'center');
  note(c,assigned?'8 ranks × 8 owned positions = 64 physical pairs. Each unique pair has one owner.':b===1?'Proposed rule   •   Within each head group, lane = position modulo 4.':'Plain replicated history   •   8 ranks × 32 positions = 256 physical pairs.');
}
function mass(c,k) {
  const b = k.beat.beatIndex;
  const firstAnswer = event(k, 1, 'Three. Subtract', 0);
  const shifted = event(k, 1, 'Subtract the shared maximum', 0);
  const boost = b === 2 && k.reveal('natural log of two', 0, { captionStart: false });
  const rescale = event(k, 2, 'Rescale the left weights', 0.8);
  const updatedMass = b === 2 && k.elapsed >= k.wordCue('The updated denominator is two').end;
  const updatedAnswer = b === 2 && k.elapsed >= k.wordCue('gives four point five').end;
  const [initial, boosted] = massCases;
  const m = boost ? boosted : initial;
  const maxLabel = boost ? num(scores[2]) + ' + ln 2' : num(initial.maximum);
  bench(c,'Decode attention   /   one query','What value should the query receive?');
  const keys = [385, 730, 1130], emptyX = 1580;
  label(c, 'Left shard  /  two keys', (keys[0] + keys[1]) / 2, 327, violet, 'center');
  label(c, 'Right shard  /  one key', keys[2], 327, mint, 'center');
  label(c, 'Empty shard', emptyX, 327, faint, 'center');
  wire(c, [[240, 368], [875, 368]], violet, 3);
  wire(c, [[980, 368], [1280, 368]], mint, 3);
  wire(c, [[1430, 368], [1730, 368]], '#60727c', 3);
  label(c, 'No valid key', emptyX, 512, faint, 'center');
  for (const [j, xx] of keys.entries()) {
    const color = j === 2 ? mint : violet;
    mono(c, boost && j === 2 ? maxLabel : num(scores[j]), xx, 430, 41, color);
    label(c, 'value  ' + values[j], xx, 512, paper, 'center');
    box(c, xx - 115, 603, 230, 80, '#111b22', '#83939a', 6);
    // Hold the bars during the score change, then rescale against the new maximum.
    if (shifted && (!boost || rescale > 0 || j === 2)) {
      const weight = mix(initial.weights[j], m.weights[j], rescale);
      box(c, xx - 112, 606, 224 * weight, 74, color, null, 4);
      if (rescale === 0 || rescale === 1 || j === 2) mono(c, num(weight), xx, 719, 37, color);
    } else if (shifted) {
      box(c, xx - 112, 606, 224 * initial.weights[j], 74, '#566572', null, 4);
    }
  }
  label(c, 'Score', 107, 430);
  label(c, 'Shifted weight', 106, 580);
  if (shifted) mono(c, '0 mass', emptyX, 719, 37, faint);

  const numeratorX = 989, denominatorX = 1310, answerX = 1630;
  label(c, 'Weighted value sum', numeratorX, 780, faint, 'center');
  label(c, 'Total mass', denominatorX, 780, faint, 'center');
  label(c, 'Query output', answerX, 780, faint, 'center');
  if (shifted) mono(c, 'M = ' + maxLabel, 418, 849, 43, paper);
  mono(c, shifted ? num(m.numerator) : '?', numeratorX, 849, 53, paper);
  mono(c, '÷', 1150, 849, 47, faint);
  mono(c, shifted && (!boost || (rescale === 1 && updatedMass)) ? num(m.mass) : '?',
    denominatorX, 849, 53, paper);
  mono(c, '=', 1470, 849, 47, faint);
  mono(c, (boost ? rescale === 1 && updatedAnswer : firstAnswer) ? num(m.output) : '?',
    answerX, 849, 61, gold);
  const compare = b > 1 || (b === 1 && k.elapsed >= k.wordCue('would give four point five').end);
  const emptyMean = b === 2 && k.elapsed >= k.wordCue('would still give three').end;
  const general = event(k, 2, 'For arbitrary finite scores', 0);
  note(c, general ? 'Rescale both local sums by exp(local max − M). Empty shards add zero mass.' :
    emptyMean ? 'Counting the empty shard as a zero answer would give ' + num(meanWithEmpty) + '.' :
    boost && rescale === 0 ? 'The grayed bars hold the left weights from the previous scale.' :
    boost ? 'The right key sets the new maximum and keeps weight 1.' :
    compare ? 'An unweighted mean of the two local answers gives ' + num(unweighted) + '.' :
    shifted ? 'Each valid key contributes exp(score − M) to the denominator.' :
    'The nonempty shards return local answers of ' + localAnswers.map(num).join(' and ') + '.');
}
function experts(c,k) {
  const counted=event(k,1,'Eight assignments',0), trace=event(k,1,'Follow token four',1.1), raw=event(k,1,'That gives four and twelve',0);
  const gates=[event(k,1,'three quarters',0),event(k,1,'one quarter',0)];
  const products=[event(k,2,'three on the first',0),event(k,2,'three on the second',0)];
  const output=event(k,2,'six',0);
  const assignments=tokenRoutes.assignments.filter(a=>a.input===4);
  bench(c,'Expert parallelism   /   six top-two routes',trace?'What value does token four receive?':'How many assignments reach each GPU?');
  label(c,'Input',140,318);label(c,'Selected experts',302,318);
  tokenRoutes.routes.forEach((route,i)=>{
    const yy=391+i*76, highlight=trace>0&&i===3;
    if(highlight)box(c,116,yy-31,498,62,'#4a432e',gold,6);
    mono(c,i+1,182,yy,38,highlight?gold:paper);
    for(let j=0;j<2;j++) {
      const expert=route[j], xx=364+j*135;
      mono(c,'E'+expert,xx,yy,40,ranks[expert<2?0:1]);
    }
  });
  for(let r=0;r<2;r++) {
    const yy=389+r*254, col=ranks[r], a=assignments[r];
    wire(c,[[626,619],[694,619],[780,yy+56]],trace?col:'#43545d',3);
    if(trace>0&&trace<1)lamp(c,mix(694,780,trace),mix(619,yy+56,trace),9,col);
    panel(c,787,yy-45,515,185,col);
    label(c,'GPU '+r+'   /   E'+(2*r)+' & E'+(2*r+1),820,yy+2,col);
    mono(c,raw?'E'+a.expert+'(4) = '+a.raw:counted?tokenRoutes.loads[r]+' assignments':'? assignments',1044,yy+77,40);
    wire(c,[[1312,yy+60],[1405,yy+60],[1550,568]],col,4);
    if(gates[r]) {
      const term=a.raw+' × '+num(a.gate);
      mono(c,products[r]?term+' = '+num(a.weighted):term,1530,r===0?384:748,34,col);
    }
  }
  dot(c,1570,568,38,'#34414c');mono(c,'+',1570,568,57,gold);
  if(trace)mono(c,output?String(tokenRoutes.outputs[3]):'?',1736,568,84,gold);
  label(c,'Token 4',1670,663,gold,'center');
  note(c,output?'GPU assignment counts 8 and 4   •   peak / average = 8 / 6 ≈ 1.33':gates[0]?'The multiplier on each return is its router gate.':raw?'Expert e returns (e + 1) × input.':'Count assignments by expert owner. The input values run from 1 to 6.');
}
export const attentionScenes={'c08-prefill':prefill,'c08-history':history,'c08-mass':mass,'c08-expert':experts};
export function checkAttention() {
  assert.equal((historyGB/4).toFixed(1),'76.3');assert.equal(gpuGiB.toFixed(1),'74.5');
  for(let q=0;q<4;q++)assert.equal(new Set([0,1,2,3].map(s=>ringAt(q,s))).size,4);
  assert.equal(hist.plainPairs,256);assert.equal(hist.physicalPairs,64);
  assert.deepEqual(hist.ranks.filter(r=>r.head===0&&r.positions.includes(5)).map(r=>r.lane),[1]);
  assert.equal(hist.ranks.every(r=>r.positions.length===8),true);
  for(const [i,m] of massCases.entries()){
    assert.ok(m.mass>=1); assert.ok(Math.abs(m.mass-(3-i))<1e-10);
    assert.ok(Math.abs(m.output-[3,4.5][i])<1e-10);
    assert.ok(Math.abs(m.weights.reduce((a,b)=>a+b)-m.mass)<1e-10);
    assert.equal(m.numerator,9);
  }
  assert.equal(unweighted,4.5);assert.equal(meanWithEmpty,3);
  assert.deepEqual(tokenRoutes.loads,[8,4]);
  assert.deepEqual(tokenRoutes.assignments.filter(a=>a.input===4).map(a=>[a.owner,a.expert,a.gate,a.raw,a.weighted]),[[0,0,.75,4,3],[1,2,.25,12,3]]);
  assert.equal(tokenRoutes.outputs[3],6);
}
