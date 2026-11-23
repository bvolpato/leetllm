import assert from 'node:assert/strict';
import {voiceLateAck,voiceReconcile,voiceWorksheet} from '../../../films/voice-agents/arithmetic.mjs';
import {interrupt,trace} from '../../../films/voice-agents/fixtures.mjs';
import {paper as p,night as n,txt,mono,serif,line,box,dot,page,bottom,bracket,cue,opacity} from './drawing.mjs';

const worksheet=voiceWorksheet();
const cost=worksheet.costRows.reduce((sum,row)=>sum+row.tokens*row.rate/1e6,0);
const stable=['Policy','Tools'];
const stored=[...stable,'Incident A'];
const request=[...stable,'Incident B'];
const reusable=(key,query)=>key.length<=query.length && key.every((s,i)=>s===query[i]);

export function cache(g,c){
  const b=c.beat.beatIndex;
  if(b<=1){
    const paired=cue(c,0,'next request'), marked=cue(c,1,'Mark and store'), hit=cue(c,1,'can reuse');
    const key=marked?stable:stored;
    page(g,p,'Inference   /   example route with explicit endpoints','Which saved prefix fits the next request?');
    function tape(y,label,parts){
      txt(g,label,104,y+62,40,p.soft);
      parts.forEach((part,i)=>{
        const x=490+i*425;
        box(g,x,y,404,104,i<2?p.pale:p.field,8);
        serif(g,part,x+202,y+66,54,p.ink,374,'center');
      });
    }
    tape(384,'Saved request',stored);
    const endpoint=490+(key.length-1)*425+403;
    line(g,endpoint,352,endpoint,504,p.red,7);
    mono(g,'Saved endpoint',endpoint,333,33,p.red,'right');
    if(paired) tape(606,'Next request',request);
    if(hit && reusable(key,request)) bracket(g,490,endpoint,752,'Reusable prefix',p.green);
    bottom(g,p,b===0?'An entry can be reused only through an eligible stored endpoint.':
      marked?'Stable policy and tools still lead both requests.':'The saved entry includes incident A.');
    return;
  }
  const show=cue(c,3,'Each input token');
  page(g,n,'Input accounting   /   invented worksheet prices','How much did the input cost?');
  const cols=[125,643,1073,1695];
  ['Bucket','Tokens','$/million','Input charge'].forEach((v,i)=>mono(g,v,cols[i],343,32,n.soft,i===3?'right':'left'));
  worksheet.costRows.forEach((row,i)=>{
    const y=450+i*112;
    line(g,99,y+31,1800,y+31,n.rule,2);
    txt(g,row.name[0].toUpperCase()+row.name.slice(1),cols[0],y,53,n.ink);
    mono(g,row.tokens.toLocaleString('en-US'),cols[1],y,48,n.blue);
    mono(g,row.rate.toFixed(2),cols[2],y,48,n.gold);
    if(show) mono(g,'$'+(row.tokens*row.rate/1e6).toFixed(5),cols[3],y,46,n.ink,'right');
  });
  if(show) mono(g,'Input subtotal    $'+cost.toFixed(5),1695,806,60,n.green,'right');
  bottom(g,n,'Disjoint buckets   ·   Each charge = tokens × price per million ÷ 1,000,000');
}

const calls={onTime:86,late:4,silent:10,minimum:.95};
const attempts=calls.onTime+calls.late+calls.silent;
const attainment=calls.onTime/attempts;
const makesSound=calls.onTime+calls.late;
const muteTest={onset:420,lastSample:492,p95Target:100};
const muteDelay=muteTest.lastSample-muteTest.onset;
export function loadCalls(g,c){
  const b=c.beat.beatIndex;
  if(b===0){
    const failed=c.reveal('If it fails',0), recovered=c.reveal('restore the trusted',0);
    page(g,n,'Media edge   /   Alex’s active connection','Which worker can play the next packet?');
    txt(g,'Alex • incident 4219',100,361,43,n.ink);
    for(let i=0;i<4;i++){
      box(g,111+i*135,408,108,82,n.pale,8);mono(g,'P'+(i+1),164+i*135,463,36,n.ink,'center');
    }
    line(g,665,451,863,451,failed?n.rule:n.blue,6);
    const owners=['A','B','C'];
    owners.forEach((name,i)=>{
      const y=317+i*157,selected=name==='C';
      box(g,885,y,365,112,selected?n.pale:n.field,12);
      txt(g,'Media '+name,932,y+72,51,selected?n.ink:n.soft);
    });
    if(!failed){
      line(g,862,451,862,687,n.blue,5);line(g,862,687,885,687,n.blue,5);
      txt(g,'Session keys',1321,640,42,n.blue);txt(g,'Jitter buffer',1321,703,42,n.blue);
      txt(g,'Playback cursor',1321,766,42,n.blue);
    }else{
      txt(g,'Connection lost',1321,660,42,n.red);
      if(recovered) txt(g,'Reconnect + restore',1321,736,42,n.gold);
    }
    bottom(g,n,failed?'Restore identity and trusted playout state when rebuilding the connection.':'The same worker owns this call’s media state.');
    return;
  }
  if(b>=3){
    const target=cue(c,3,'at the ninety-fifth percentile');
    const onset=cue(c,3,'on the device clock');
    const stop=cue(c,3,'on that same clock');
    const result=cue(c,4,'This interruption');
    const x=t=>490+(t-muteTest.onset)*10.5;
    page(g,n,'Illustrative device test   /   local playback','How long did this phone take to mute?');
    txt(g,'Alex speaks',99,438,48,n.red);
    line(g,x(412),428,x(534),428,n.rule,3);
    txt(g,'Speaker',99,637,48,n.blue);
    line(g,x(412),625,x(534),625,n.rule,3);
    if(target){
      const limit=x(muteTest.onset+muteTest.p95Target);
      g.save();g.setLineDash([10,10]);line(g,limit,384,limit,688,n.gold,4);g.restore();
      mono(g,'+'+muteTest.p95Target+' ms target',limit,350,38,n.gold,'center');
    }
    if(onset){
      dot(g,x(muteTest.onset),428,15,n.red);
      mono(g,'Speech onset · '+muteTest.onset+' ms',x(muteTest.onset),381,36,n.red);
    }
    if(stop){
      line(g,x(muteTest.onset),625,x(muteTest.lastSample),625,n.blue,7);
      dot(g,x(muteTest.lastSample),625,15,n.blue);
      mono(g,'Last audible sample · '+muteTest.lastSample+' ms',x(muteTest.lastSample),581,36,n.blue,'right');
      bracket(g,x(muteTest.onset),x(muteTest.lastSample),701,result?muteDelay+' ms':'Mute delay   ?',n.ink);
    }
    bottom(g,n,result?'Compare the 95th percentile across interruptions on this device with the target.':
      'Measure from local speech onset to the last audible reply sample.');
    return;
  }
  const showFast=cue(c,1,'Eighty-six start'),showLate=cue(c,1,'four play late'),showSilent=cue(c,1,'ten time out');
  const verdict=cue(c,2,'Eighty-six out'),alternate=cue(c,2,'Report successful');
  page(g,p,'Network slice   /   first audio within 500 ms','Did the hotline meet its 95% target?');
  const x=125, y=336, step=47;
  for(let i=0;i<attempts;i++){
    const fast=i<calls.onTime,late=i<makesSound;
    const color=fast && showFast?p.blue:!fast && late && showLate?p.gold:!late && showSilent?p.red:p.field;
    box(g,x+(i%10)*step,y+Math.floor(i/10)*step,32,32,color,5);
  }
  const legends=[
    [showFast,p.blue,'86 on time'],[showLate,p.gold,'4 late'],[showSilent,p.red,'10 silent'],
  ];
  legends.forEach(([show,color,caption],i)=>{
    if(show){dot(g,712,374+i*79,11,color);txt(g,caption,746,389+i*79,46,color);}
  });
  txt(g,'Target',1220,378,40,p.soft);
  serif(g,'95 of 100',1215,485,90,p.ink,558);
  if(verdict){
    line(g,692,615,1770,615,p.rule);
    serif(g,(100*attainment).toFixed(0)+'%   ·   Hold',704,723,82,p.red);
    mono(g,calls.onTime+' / '+attempts+' attempts',710,791,40,p.ink);
  }
  bottom(g,p,alternate?'Among calls with sound, 86 / 90 = 95.6%. The target counts all attempts.':
    'Each square represents one eligible attempted call in this slice.');
}

const fresh=worksheet.freshChunks;
const callEnd=interrupt.replyStartWallMs+interrupt.acknowledgedThrough;
const frozen={response:'reply-7',session:'call-Alex',cursor:460,received:700,cancelled:true};
const next={response:'reply-8',session:'call-Alex',cursor:0,received:0,cancelled:false};
const stale={response:'reply-7',session:'call-Alex',cursor:700};
const oldAfter=voiceLateAck(frozen,stale);
const nextAfter=voiceLateAck(next,stale);
const retained=voiceReconcile(worksheet.freshText,fresh,frozen.cursor);
export function transfer(g,c){
  const b=c.beat.beatIndex;
  if(b<2){
    const shown=cue(c,1,'That is when'),cut=cue(c,1,'That leaves'),gap=cue(c,1,'Log the receipt');
    const x=t=>147+t*.96;
    page(g,p,'Call clock   /   continuous factual playout','When did the chunk ending in “open” finish playing?');
    txt(g,'Alex stops',x(0),707,41,p.soft);
    line(g,x(0),524,x(1660),524,p.rule,6);
    for(const [at,caption,y,color] of [[0,'0',595,p.soft],[trace.firstAudio,'380',462,p.blue],
      [interrupt.replyStartWallMs,'955',593,p.blue]]){
      dot(g,x(at),524,14,color);mono(g,caption+' ms',x(at),y,37,color,'center');
    }
    txt(g,'“I’ll check that.”',x(380),385,51,p.blue,{align:'center'});
    txt(g,'Factual audio starts',x(955),675,41,p.ink,{align:'center'});
    bracket(g,x(interrupt.replyStartWallMs),x(callEnd),435,'+'+interrupt.acknowledgedThrough+' ms',p.green,true);
    dot(g,x(callEnd),524,15,p.green);
    if(shown){
      mono(g,callEnd+' ms',x(callEnd),595,36,p.green,'center');
      txt(g,'“open”',x(callEnd),673,50,p.green,{align:'center'});
    }
    if(cut){
      line(g,x(interrupt.wallMs),460,x(interrupt.wallMs),553,p.red,6);
      mono(g,'Alex · '+interrupt.wallMs+' ms',x(interrupt.wallMs)+65,390,32,p.red,'right');
    }
    bottom(g,p,gap?'The chunk finished playing '+(interrupt.wallMs-callEnd)+' ms before Alex interrupted.':
      shown?'The green mark is the end of playout for the confirmed chunk.':
      'Add the playback position in the receipt to the start time of the factual reply.');
    return;
  }
  const keep=cue(c,3,'Only the first piece'),opened=cue(c,3,'opens reply eight');
  const late=cue(c,3,'A late receipt'),rejected=cue(c,4,'Reply seven stays') && !oldAfter.accepted && !nextAfter.accepted;
  const answer=b===4 && c.elapsed>=c.speechDuration;
  page(g,p,'Incident 4219   /   later in the call',b===2?'Which sentence can reply seven keep?':opened?'Can a late receipt change reply eight?':'What fits inside the receipt?');
  const x=t=>107+t*1.66, mid=(a,b)=>(x(a)+x(b))/2;
  mono(g,'Reply 7   /   '+(keep?'frozen':'received audio'),103,332,37,p.soft);
  for(const [i,chunk] of fresh.entries()){
    const start=i?fresh[i-1].endMs:0, color=i===0 && keep?p.blue:p.field;
    box(g,x(start),382,x(chunk.endMs)-x(start)-5,102,color,7);
    serif(g,chunk.text.trim(),mid(start,chunk.endMs),450,49,i===0 && keep?p.white:p.ink,x(chunk.endMs)-x(start)-27,'center');
    mono(g,chunk.endMs+' ms',x(chunk.endMs),530,34,p.soft,'center');
  }
  if(cue(c,2,'last receipt says')) {
    line(g,x(460),356,x(460),407,p.blue,5);mono(g,'ACK 460',x(460),349,34,p.blue,'center');
  }
  if(cue(c,2,'Alex interrupts')) {
    line(g,x(560),375,x(560),405,p.red,4);
    mono(g,'Alex 560',x(560)+16,370,28,p.red);
  }
  txt(g,'Incident record',1390,352,42,p.green);
  serif(g,'Owner replied.',1385,444,56,p.ink,432);
  if(keep) {
    txt(g,'Assistant history',102,623,40,p.blue);
    serif(g,retained.retained,99,714,70,p.ink);
  }
  if(opened){
    txt(g,'Active reply 8',1040,623,40,p.blue);
    mono(g,'Cursor  '+(rejected?nextAfter:next).cursor+' ms',1038,701,49,p.ink);
    if(late) txt(g,rejected?'Reply 7 receipt rejected':'Incoming receipt   ·   reply 7, 700 ms',1038,781,40,rejected?p.red:p.soft,{max:795});
  }
  bottom(g,p,answer?'Hotline to Alex   “Yes, the owner replied.”':b===2?'Find the last complete piece the phone confirmed playing.':
    late?'The service fact and the player receipt belong to different records.':'A later question can use the service’s record.');
}

export function checkOperations(){
  assert.equal(reusable(stored,request),false);
  assert.equal(reusable(stable,request),true);
  assert.equal(cost,.00205);
  assert.deepEqual(worksheet.costRows.map(r=>Math.round(r.tokens*r.rate)),[400,1250,400]);
  assert.equal(attempts,100); assert.equal(attainment,.86);
  assert.ok(calls.onTime/makesSound>calls.minimum && attainment<calls.minimum);
  assert.deepEqual([muteDelay,muteTest.onset+muteTest.p95Target],[72,520]);
  assert.equal(callEnd,1475); assert.equal(interrupt.wallMs-callEnd,130);
  assert.deepEqual([retained.retained,retained.endChar],['Lookup is ready.',16]);
  for(const state of [frozen,next]) {
    assert.deepEqual(voiceLateAck(state,stale),{...state,accepted:false});
  }
}
