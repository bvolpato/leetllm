import assert from 'node:assert/strict';
import {packets} from '../../../films/voice-agents/fixtures.mjs';
import {playoutSchedule} from '../../../films/voice-agents/arithmetic.mjs';
import {paper as p,night as n,txt,mono,serif,line,box,dot,page,bottom,bracket,cue,opacity} from './drawing.mjs';

function deliveryState(c){
  const shift=cue(c,1,'increase the buffer',.8);
  const buffer=Math.round(30+30*shift);
  const old=cue(c,1,'Conceal that gap'), result=cue(c,2,'Its new deadline');
  return {shift,buffer,slots:playoutSchedule(buffer),judged:(old && !shift) || result};
}
export function transport(g,c){
  if(c.beat.beatIndex===3){
    page(g,n,'Negotiated transport   /   one missing packet','Can packet four keep its slot?');
    const tcp=c.reveal('On a TCP WebSocket',0);
    function strip(y,caption,color,labels) {
      txt(g,caption,100,y+27,45,color);
      labels.forEach((v,i)=>{
        const x=550+i*310;
        box(g,x,y-65,283,121,i<2?n.pale:n.field,12);
        mono(g,'P'+(i+1),x+22,y-18,33,n.soft);
        txt(g,v,x+22,y+35,37,i===2?n.gold:n.ink,{max:245});
      });
    }
    strip(468,'WebRTC / UDP',n.blue,['Played','Played','Concealed','Plays on time']);
    if(tcp) strip(730,'WebSocket / TCP',n.gold,['Delivered','Delivered','Missing bytes','Held behind P3']);
    bottom(g,n,'A receiver can use recovery only while the media deadline permits it.');
    return;
  }
  const {buffer,slots,judged,shift}=deliveryState(c);
  const x=ms=>450+ms*8.75;
  page(g,n,'Jitter buffer   /   fixed arrivals','Which packets reach their deadlines?');
  mono(g,'Buffer  '+buffer+' ms',100,315,38,n.gold);
  dot(g,700,301,10,n.blue);txt(g,'Arrival',724,315,34,n.ink);
  line(g,949,284,949,316,n.gold,5);txt(g,'Deadline = timestamp + buffer',972,315,34,n.ink);
  slots.forEach((s,i)=>{
    const y=429+i*104;
    txt(g,'Packet '+s.id,99,y+11,37,n.ink);
    mono(g,'t = '+s.timestamp,273,y+11,32,n.soft);
    line(g,x(0),y,x(131),y,n.rule,2);
    if(shift) line(g,x(s.timestamp+30),y-11,x(s.timestamp+30),y+11,n.rule,3);
    line(g,x(s.deadline),y-19,x(s.deadline),y+20,n.gold,5);
    dot(g,x(s.arrival),y,10,n.blue);
    mono(g,String(s.arrival),x(s.arrival),y+48,30,n.blue,'center');
    mono(g,String(s.deadline),x(s.deadline),y-23,30,n.gold,'center');
    if(judged) txt(g,s.disposition==='play'?'Play':'Conceal',1640,y+12,40,s.disposition==='play'?n.green:n.red);
  });
  bottom(g,n,shift===1 && !judged?'Same arrivals. Look at packet three against its new deadline.':
    judged?'Packet 3   ·   arrival '+slots[2].arrival+' ms   /   deadline '+slots[2].deadline+' ms':
    'Each dot stays at its arrival time. Each vertical mark is a playback slot.');
}

const chunk={frames:480,channels:1,bits:16,rate:24000};
function pcm(rate){
  return {rate,bytes:chunk.frames*chunk.channels*chunk.bits/8,ms:chunk.frames*1000/rate};
}
export function samples(g,c) {
  const b=c.beat.beatIndex;
  const newRate=cue(c,1,'set the sink'), result=cue(c,2,'Each unchanged'), sized=cue(c,0,'before protocol overhead');
  page(g,p,'Decoded audio   /   mono 16-bit PCM','What stays fixed when the sink slows down?');
  mono(g,chunk.frames+' sample frames',109,322,40,p.blue);
  if(sized) mono(g,pcm(chunk.rate).bytes+' bytes',1773,322,40,p.blue,'right');
  const sourceRate=pcm(chunk.rate), slow=pcm(16000);
  // Draw the same sample sequence at the sample spacing of each sink.
  function comb(y,state,color){
    const x0=486, width=state.ms*40;
    txt(g,(state.rate/1000)+' kHz sink',103,y+13,43,color);
    line(g,x0,y,x0+width,y,p.rule);
    for(let i=0;i<chunk.frames;i++) {
      const x=x0+(i+.5)*width/chunk.frames;
      const amp=(.25+.7*Math.abs(Math.sin(i*.021)))*Math.sin(i*.44)*46;
      line(g,x,y,x,y-amp,color,2);
    }
    return [x0,x0+width];
  }
  const first=comb(435,sourceRate,p.blue);
  if(cue(c,1,'twenty milliseconds')) bracket(g,...first,512,'20 ms',p.blue);
  if(newRate) {
    if(result){
      const second=comb(665,slow,p.red);
      bracket(g,...second,742,slow.ms+' ms',p.red);
    }else{
      txt(g,'16 kHz sink',103,680,43,p.red);
      mono(g,'480 frames ÷ 16,000 frames/s = ?',484,682,47,p.ink);
    }
  }
  bottom(g,p,b===0?'Payload = frames × channels × bytes per sample':
    'Duration in milliseconds = sample frames ÷ actual playback rate × 1,000');
}
function session(receivedDeltas,ack) {
  const received=receivedDeltas.reduce((sum,ms)=>sum+ms,0);
  assert.ok(Number.isInteger(ack) && ack>=0 && ack<=received);
  return {received,ack,unconfirmed:received-ack};
}
export function architecture(g,c){
  const b=c.beat.beatIndex;
  if(b===2){
    page(g,p,'Same transcript   /   two readings','What can a text transcript lose?');
    serif(g,'“Incident four two one nine.”',98,367,74,p.ink);
    const appear=c.reveal('tone and pacing',.7);
    const xs=[548,838,1127,1416,1698];
    function contour(y,heights,color,name){
      txt(g,name,101,y+13,42,color);
      line(g,490,y+38,1794,y+38,p.rule,2);
      g.beginPath(); g.moveTo(xs[0],y-heights[0]);
      for(let i=1;i<xs.length;i++){
        const mid=(xs[i-1]+xs[i])/2;
        g.bezierCurveTo(mid,y-heights[i-1],mid,y-heights[i],xs[i],y-heights[i]);
      }
      g.strokeStyle=color;g.lineWidth=6;g.stroke();
      xs.forEach((x,i)=>dot(g,x,y-heights[i],8,color));
    }
    contour(548,[5,30,12,0,-22],p.blue,'Falling pitch');
    opacity(g,appear,()=>contour(747,[5,30,12,14,71],p.red,'Rising pitch'));
    bottom(g,p,'Illustrated pitch contours   ·   Compare the words and the final inflection.');
    return;
  }
  if(b<3){
    page(g,p,'Hotline architecture   /   evidence at the handoffs','Where could you inspect a wrong incident number?');
    const cascade=['Speech','Recognize','Transcript','Generate','Synthesize','Phone'];
    mono(g,'Cascaded',105,345,42,p.blue);
    cascade.forEach((name,i)=>{
      const x=103+i*294;
      box(g,x,393,243,107,i===2?p.pale:p.field,12);
      txt(g,name,x+121,461,40,p.ink,{align:'center',max:221});
      if(i<5) mono(g,'→',x+249,460,41,p.soft);
    });
    if(b>=1){
      mono(g,'Native audio',105,603,42,p.red);
      line(g,226,720,1670,720,p.rule,5);
      for(const [name,x,width] of [['Speech',103,243],['Audio model',638,655],['Phone',1573,243]]) {
        box(g,x,666,width,108,p.field,12);txt(g,name,x+width/2,735,43,p.ink,{align:'center'});
      }
    }
    bottom(g,p,b===0?'Inspect the recognizer’s words before the tool gate.':'Both paths still need a player receipt and an authorized tool executor.');
    return;
  }
  const firstAck=cue(c,3,'acknowledges all'), second=cue(c,3,'another two hundred twenty');
  const state=session(second?[160,220]:[160],firstAck?160:0);
  const known=cue(c,4,'Subtract the sink');
  page(g,n,'Native session   /   one response','How much audio still lacks a playback receipt?');
  const x=466, factor=3.1;
  function bar(y,name,count,color){
    txt(g,name,95,y+14,42,n.ink);
    box(g,x,y-31,count*factor,52,color,5);
    if(count) mono(g,count+' ms',x+count*factor+19,y+13,37,n.ink);
  }
  bar(415,'Received',state.received,n.soft);
  bar(551,'Sink receipt',state.ack,n.blue);
  if(known) bracket(g,x+state.ack*factor,x+state.received*factor,629,state.unconfirmed+' ms unconfirmed',n.gold);
  if(second) serif(g,'Transcript   “Incident is still open.”',99,806,55,n.ink);
  bottom(g,n,known?'A tool proposal still passes through the executor’s permission check.':'The transcript and the audio deltas can arrive ahead of playback.');
}

export function checkMedia(){
  const short=playoutSchedule(30),long=playoutSchedule(60);
  assert.deepEqual(short.map(r=>r.disposition),['play','play','conceal','play']);
  assert.deepEqual(long.map(r=>r.deadline),[60,80,100,120]);
  assert.ok(long.every(r=>r.disposition==='play'));
  for(let i=0;i<packets.length;i++){
    assert.equal(short[i].arrival,long[i].arrival);
    assert.equal(long[i].deadline-short[i].deadline,30);
  }
  assert.deepEqual([playoutSchedule(54)[2].disposition,playoutSchedule(55)[2].disposition],['conceal','play']);
  assert.deepEqual(pcm(16000),{rate:16000,ms:30,bytes:960});
  assert.deepEqual(pcm(24000),{rate:24000,ms:20,bytes:960});
  assert.deepEqual(session([160,220],160),{received:380,ack:160,unconfirmed:220});
}
