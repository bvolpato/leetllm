import assert from 'node:assert/strict';
import {pipelineOccupancy, weightLedger, localPlacement} from '../../../films/model-parallelism/arithmetic.mjs';
import { bench, wire, panel, lamp, box, label, mark, mono, dot, note, event, mix, smooth, vec, num, bar, show, paper, base, rose, faint, mint, violet, gold, ranks, palette } from './bench.mjs';

const calls=80*2, iterations=128-1, tp=4, hidden=4096, bytes=2;
const traffic=batch=>({activation:batch*hidden*bytes, sent:batch*hidden*bytes*2*(tp-1)/tp});
const schedule=pipelineOccupancy(3,4);
const compute=[2,2,2], gap=.2;
const computeMs=compute.reduce((total,stage)=>total+stage,0);
const transfers=compute.length-1, transferMs=transfers*gap;
const single=weightLedger(), pair=weightLedger(35e9,2,80e9,16e9,2);
const local=localPlacement([35,15],pair.free/1e9);
const toy=[4,2,1,1];

function comm(c,k) {
  const b=k.beat.beatIndex, counted=event(k,0,'That makes',0), completed=event(k,1,'or twenty thousand',0);
  const doubled=event(k,2,'With eight requests',0), sentOn=event(k,2,'or ninety-six',0);
  const rate=event(k,3,'about point zero five',0), startup=event(k,3,'gives three point two',0);
  bench(c,'Classic dense forward pass   /   TP > 1',b<2?'How many reductions does one batch launch?':'How many bytes does each rank send?');
  if(b<2) {
    label(c,'One layer',135,317);
    for(let i=0;i<2;i++) {
      const xx=140+i*440, col=ranks[i];
      panel(c,xx,390,378,160,col);
      mark(c,i?'Feed-forward':'Attention heads',xx+189,439,37,paper,'center');
      mono(c,'Σ',xx+189,505,57,col);
    }
    label(c,'80 layers',1130,317,gold);
    for(let i=0;i<80;i++) {
      const xx=1118+i%16*37, yy=405+Math.floor(i/16)*41;
      box(c,xx,yy,28,27,'#314350');
      wire(c,[[xx+7,yy+5],[xx+7,yy+21]],violet,4);
      wire(c,[[xx+20,yy+5],[xx+20,yy+21]],mint,4);
    }
    mono(c,counted?'2 × 80 = '+calls+' calls / iteration':'2 calls per layer',960,709,60,gold);
    if(b===1) mono(c,completed?'127 × 160 = '+(iterations*calls).toLocaleString('en-US'):'128 tokens − 1 from prefill',960,825,48,paper);
    note(c,b===1?'Batch size 4. Predict the call count when it grows to 8.':'Count only the in-layer attention and feed-forward reductions.');
    return;
  }
  const batch=doubled?8:4, t=traffic(batch);
  label(c,'Activation in one collective',130,323);
  for(let r=0;r<batch;r++) {
    const xx=146+r*66;
    box(c,xx,407,48,222,r%2?'#648a85':'#81bbb0',null,5);
    for(let p=0;p<7;p++)wire(c,[[xx+6,431+p*27],[xx+42,431+p*27]],'#385e61',2);
  }
  mono(c,batch+' × 4,096 × 2 B',435,707,41,paper);
  label(c,(t.activation/1024)+' KiB  /  BF16',435,781,mint,'center');
  label(c,'Ring all-reduce   /   sent per rank',1015,323);
  const round=[[1155,465],[1410,405],[1575,545],[1300,625]];
  wire(c,[...round,round[0]],'#7c939e',6);
  round.forEach(([xx,yy],i)=>{lamp(c,xx,yy,23,ranks[i%2]);mono(c,i,xx,yy+1,28,base);});
  mono(c,sentOn?'2 × ¾ × '+t.activation/1024+' = '+t.sent/1024+' KiB':'2 × (TP − 1) / TP × bytes',1360,715,42,gold);
  label(c,'160 calls / iteration',1360,785,faint,'center');
  note(c,startup?'Serial startup alone: 160 × 20 µs = 3.2 ms. Profile exposed time.':rate?'Payload alone: 160 × 96 KiB at 300 GB/s ≈ 0.052 ms.':'Doubling the batch changes payload per call. The layer count is fixed.');
}
function pipeline(c,k) {
  const b=k.beat.beatIndex;
  let tick=1;
  if(event(k,0,'Its activation enters',0))tick=2;
  if(event(k,1,'Advance one slot',0))tick=3;
  if(event(k,1,'When D enters',0))tick=4;
  if(event(k,2,'Stage one goes idle',0))tick=5;
  if(event(k,2,'Now stages one and two',0))tick=6;
  const showCount=event(k,3,'Twelve of the eighteen',0);
  const idle=event(k,3,'Six are idle',0), overhead=event(k,3,'giving one half',0);
  bench(c,'Pipeline schedule   /   one forward traversal',tick===6?'How many stage slots were idle?':'Which stage has work in the next slot?');
  const cellW=210, cellH=118, x0=395, y0=386;
  for(let s=0;s<schedule.stages;s++) {
    const yy=y0+s*(cellH+17);
    label(c,'Stage '+(s+1),133,yy+cellH/2);
    for(let t=0;t<schedule.ticks;t++) {
      const xx=x0+t*(cellW+13), item=schedule.layout[s][t], observed=t<tick;
      if(s===0) mono(c,'t'+(t+1),xx+cellW/2,330,34,t+1===tick?gold:faint);
      box(c,xx,yy,cellW,cellH,'#17232e',t+1===tick?gold:'#586771',9,2);
      if(!observed) continue;
      if(!item) {
        c.save();c.beginPath();c.rect(xx+4,yy+4,cellW-8,cellH-8);c.clip();
        for(let j=-cellH;j<cellW;j+=20)wire(c,[[xx+j,yy+cellH],[xx+j+cellH,yy]],'#394854',2);
        c.restore();
        box(c,xx+65,yy+40,80,42,'#17232e');label(c,'idle',xx+cellW/2,yy+cellH/2,faint,'center');
      } else {
        const color=palette[item-1];box(c,xx+7,yy+8,cellW-14,cellH-16,color,null,6);
        mono(c,String.fromCharCode(64+item),xx+cellW/2,yy+cellH/2,65,base);
      }
    }
  }
  const observed=schedule.layout.flatMap(r=>r.slice(0,tick)), used=observed.filter(Boolean).length;
  mark(c,showCount?used+' occupied   /   '+observed.length+' observed stage slots':
    tick===4?'D has entered. No fifth input is waiting.':'Completed schedule through slot '+tick,960,848,43,showCount?gold:paper,'center');
  note(c,overhead?'Equal slots, no transfer delay. Idle 6/18 = ⅓. Elapsed overhead (6 − 4)/4 = ½.':
    idle?'Equal slots, no transfer delay. Idle fraction = 6/18 = ⅓.':
    b===3?'Count all three stages in each of the six equal slots. Assume no transfer delay.':'A letter follows one input. A shaded empty slot records idle time.');
}
function timing(c,k) {
  const b=k.beat.beatIndex, gapGiven=event(k,0,'point two milliseconds',0);
  const travel=event(k,1,'Insert the two transfers',.9), result=event(k,1,'six point four',0);
  bench(c,'Pipeline latency   /   a single request',b===2?'Where should the pipeline cross nodes?':'When does this token finish stage three?');
  if(b<2) {
    const start=180, scale=215;
    label(c,'Time along the request path',start,356);
    const duration=computeMs+transferMs*travel;
    let xx=start;
    compute.forEach((v,i)=>{
      if(i>0 && travel>0) {box(c,xx,473,gap*travel*scale,140,gold,null,1);xx+=gap*travel*scale;}
      box(c,xx,473,v*scale,140,palette[i===2?3:i],null,4);
      mono(c,'S'+(i+1)+'  '+v+' ms',xx+v*scale/2,546,45,base);
      xx+=v*scale;
    });
    wire(c,[[start,665],[start+7*scale,665]],faint,3);
    for(let i=0;i<=7;i++) {wire(c,[[start+i*scale,658],[start+i*scale,682]],faint,3);mono(c,i+'',start+i*scale,717,29,faint);}
    label(c,'ms',start+7*scale+40,716);
    const computeLabel=num(computeMs)+' ms compute';
    mono(c,result?computeLabel+' + '+num(transferMs)+' ms transfer = '+num(duration)+' ms':computeLabel,960,823,52,gold);
    note(c,gapGiven?transfers+' boundary transfers at '+num(gap)+' ms each. Each stage waits for its input.':'The three blocks show compute time in stage order.');
    return;
  }
  const send=event(k,2,'Send the intermediate activation',1.5);
  for(let n=0;n<2;n++) {
    const ox=122+n*1000;panel(c,ox,386,665,344,ranks[n]);label(c,'Node '+(n+1)+'   /   pipeline stage '+(n+1),ox+48,440,ranks[n]);
    for(let g=0;g<2;g++) {
      box(c,ox+72+g*325,531,170,104,'#14242e','#8aa2ad',6);mono(c,'GPU '+(n*2+g),ox+157+g*325,586,37);
    }
    wire(c,[[ox+246,576],[ox+390,576]],mint,9); wire(c,[[ox+246,601],[ox+390,601]],mint,9);
  }
  wire(c,[[790,573],[1118,573]],gold,5);lamp(c,mix(790,1118,smooth(send)),573,13,gold);
  label(c,'Activation',955,523,gold,'center');note(c,'Test frequent local collectives and the transfer at the stage boundary.');
}
function memory(c,k) {
  const b=k.beat.beatIndex, two=event(k,2,'At least two',0), request=event(k,3,'It places',0), verdict=event(k,3,'GPU zero is six over',0);
  bench(c,'Per-rank memory   /   serving admission',b===0?'What stays resident on each device?':b===1?'How many GPUs can hold the weights?':b===2?'How much room remains on each GPU?':'Does the request fit on both GPUs?');
  if(b===0) {
    for(let r=0;r<2;r++) {
      const xx=280+r*825;label(c,'GPU '+r,xx+245,315,ranks[r],'center');
      let yy=810;
      toy.forEach((v,i)=>{const h=v*55;yy-=h;box(c,xx,yy,490,h-3,palette[i],null,5);mark(c,['Weights','KV history','Activations','Workspace'][i]+'   '+v,xx+245,yy+h/2,36,base,'center');});
    }
    note(c,'4 + 2 + 1 + 1 = 8 units per rank');return;
  }
  const ledger=two?pair:single, n=ledger.ranks, cap=ledger.capacity/1e9, w=ledger.weight/1e9, reserve=ledger.reserve/1e9;
  const start=318, width=1275, scale=width/90, limit=start+cap*scale;
  label(c,'Decimal GB   /   80 GB per GPU',start,312);
  for(let r=0;r<n;r++) {
    const y=422+r*222, kv=request?local.values[r]:0;
    label(c,'GPU '+r,110,y+40,ranks[r]);
    bar(c,start,y,width,80,90,[{value:w,color:violet},{value:reserve,color:'#aebcc3'},{value:kv,color:mint}]);
    mono(c,w+' GB weights',start+w*scale/2,y+42,32,base);
    mono(c,reserve+' GB',start+(w+reserve/2)*scale,y+42,31,base);
    if(kv)mono(c,kv+' GB',start+(w+reserve+kv/2)*scale,y+42,31,base);
    wire(c,[[limit,y-15],[limit,y+16]],gold,5);
    wire(c,[[limit,y+64],[limit,y+96]],gold,5);
    const free=cap-w-reserve-kv;
    if(two&&!request||verdict)label(c,free<0?num(-free)+' GB over':num(free)+' GB free',start,y+130,free<0?rose:mint);
    else if(!two)label(c,'70 GB of weights + 16 GB reserved',start,y+132);
  }
  note(c,request?'Required history = 50 GB. Available history space = 29 GB on each device.':two?'Each rank retains its own 16 GB reserve.':'35 billion resident parameters × 2 bytes = 70 GB. Usable per GPU = 64 GB.');
}
export const scheduleScenes={'c06-wire':comm,'c07':pipeline,'c07-path':timing,'c08':memory};
export function checkSchedule() {
  assert.equal(calls*iterations,20320); assert.equal(traffic(8).sent,96*1024); assert.equal(traffic(4).sent*2,traffic(8).sent);
  assert.equal((traffic(8).sent*calls/300e9*1000).toFixed(3),'0.052');assert.equal(20*calls/1000,3.2);
  assert.deepEqual(schedule.layout.map(r=>r.slice(3)),[[4,null,null],[3,4,null],[2,3,4]]);
  assert.equal(schedule.occupied,12);assert.equal(schedule.total,18);assert.equal(schedule.idle,6);assert.equal(schedule.overhead,.5);
  assert.equal(computeMs,6);assert.equal(transfers,2);assert.equal(transferMs,.4);
  assert.equal(computeMs+transferMs,6.4);assert.equal(single.minimumRanks,2);
  assert.equal(single.free/1e9,-6);assert.equal(pair.free/1e9,29);assert.deepEqual(local.free,[-6,14]);
  assert.equal(toy.reduce((a,b)=>a+b),8);
}
