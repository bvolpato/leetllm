import assert from 'node:assert/strict';
import {trace, sequential, speechChunks, toolTrace, chunks, pendingText, interrupt} from '../../../films/voice-agents/fixtures.mjs';
import {voiceReconcile} from '../../../films/voice-agents/arithmetic.mjs';
import {handset} from './handset.mjs';
import recordedHotline from './recorded-hotline.json' with {type:'json'};
import queued from './recorded-queue.json' with {type:'json'};
import {paper as p,night as n,txt,mono,serif,line,box,dot,page,bottom,bracket,cue,opacity,wave} from './drawing.mjs';

const rows=[
  ['Turn decision',0,trace.commit],['Recognition tail',0,trace.sttDone],
  ['First clause',trace.clauseStart,trace.clauseDone],['First synthesis',trace.synthesisStart,trace.synthesisDone],
  ['Playout buffer',trace.playoutStart,trace.firstAudio],
];
export function clocks(g,c){
  const b=c.beat.beatIndex;
  if (c.beat.id==='c02-frames-batch') {
    page(g,n,'Separate recording   /   batch recognition','When do the words become available?');
    const left=119, scale=.83, segments=[['Speech',1200,n.blue],['Endpoint',300,n.gold],['Decode',450,n.green]];
    let time=0;
    for(const [i,[label,duration,color]] of segments.entries()){
      const x=left+time*scale, wid=duration*scale;
      if(i===0 || c.reveal(i===1?'three hundred millisecond endpoint':'four hundred fifty',0)){
        box(g,x,460,wid-5,78,color,7);
        txt(g,label,x,420,48,color);
        mono(g,duration+' ms',x,605,41,n.ink);
      }
      time+=duration;
    }
    if(c.reveal('That is already',0)) bracket(g,left+1200*scale,left+time*scale,670,'750 ms after speech end',n.gold);
    bottom(g,n,'The transcript still has to go through generation, synthesis and playback.');
    return;
  }
  const x=ms=>468+ms*3.31, baseY=350;
  page(g,n,'Synthetic hotline trace   /   milliseconds after speech end','Where does the wait begin?');
  const active=[
    cue(c,0,'sixty milliseconds',.45),cue(c,0,'recognition is already',.45),
    cue(c,1,'The model starts',.65),cue(c,1,'Speech synthesis begins',.65),
    cue(c,1,'playback buffer',.65),
  ];
  for(const [i,[label,start,end]] of rows.entries()) {
    const y=baseY+i*67, color=[n.gold,n.blue,n.green,n.blue,n.gold][i];
    txt(g,label,95,y+17,37,n.ink);
    line(g,x(0),y+5,x(trace.firstAudio),y+5,n.rule,1);
    opacity(g,active[i],()=>{
      box(g,x(start),y-13,x(end)-x(start),36,color,4);
      mono(g,start+'–'+end,x(start)+(x(end)-x(start))/2,y+13,27,n.white,'center',x(end)-x(start)-6);
    });
  }
  mono(g,'0',x(0),300,34,n.soft,'center');
  if(active[0]) mono(g,'60',x(trace.commit),300,34,n.gold,'center');
  if(active[4]){
    line(g,x(trace.firstAudio),315,x(trace.firstAudio),800,n.blue,3);
    dot(g,x(trace.firstAudio),baseY+4*67+30,8,n.blue);
    mono(g,'First audible sample',x(trace.firstAudio),296,35,n.blue,'right');
  }
  if(b>=2){
    bracket(g,x(0),x(trace.firstAudio),665,cue(c,3,'That top bracket')?(trace.firstAudio-trace.speechEnd)+' ms':'From speech end   ?',n.ink);
    bracket(g,x(trace.commit),x(trace.firstAudio),766,cue(c,3,'Both brackets')?(trace.firstAudio-trace.commit)+' ms':'From commitment   ?',n.gold);
  }
  bottom(g,n,cue(c,2,'Now read the overlaps')?'Serial sum   '+rows.map(r=>r[2]-r[1]).join(' + ')+' = '+sequential+' ms':
    b===0?'The recognizer was already listening while Alex was speaking.':'The first speakable fragment starts synthesis before the clause is finished.');
}

const delayedCommit=300;
const afterCommit=trace.firstAudio-trace.commit;
const replayAudio=delayedCommit+afterCommit;
export function delayReplay(g,c) {
  const changed=cue(c,0,'This time the endpoint');
  const outcome=cue(c,1,'The caller'), post=cue(c,1,'Investigate');
  const move=c.beat.beatIndex===0 ? c.reveal('This time the endpoint',1.5,{captionStart:false}) : 1;
  const showTotal=c.beat.beatIndex===1 && c.reveal('Six hundred twenty milliseconds from speech end',0,{captionStart:false});
  const commit=trace.commit+(delayedCommit-trace.commit)*move;
  page(g,n,'Replay   /   same response path','Which limit does a longer endpoint wait miss?');
  const x=ms=>420+ms*2.12;
  mono(g,'Time from speech end',99,323,38,n.soft);
  function run(y,name,commit,end,visible) {
    txt(g,name,99,y+17,42,n.ink);
    box(g,x(0),y-25,x(commit)-x(0),55,n.gold,5);
    box(g,x(commit),y-25,x(end)-x(commit),55,name==='Replay'&&!visible?n.pale:n.blue,5);
    mono(g,Math.round(commit)+' ms',x(0)+(x(commit)-x(0))/2,y+13,31,n.white,'center');
    mono(g,afterCommit+' ms after commit',x(commit)+(x(end)-x(commit))/2,y+13,34,
      name==='Replay'&&!visible?n.ink:n.white,'center');
    if(visible) mono(g,end+' ms',x(end),y+85,39,outcome&&name==='Replay'?n.red:n.ink,'center');
  }
  run(453,'Original',trace.commit,trace.firstAudio,true);
  if(changed) run(675,'Replay',commit,commit+afterCommit,showTotal);
  const limit=x(500);
  line(g,limit,370,limit,629,n.red,3);
  line(g,limit,708,limit,735,n.red,3);
  mono(g,'500 ms limit',limit,348,33,n.red,'center');
  if(post) mono(g,'Post-commit  '+afterCommit+' < 400 ms',1070,813,38,n.green);
  txt(g,outcome?'The longer endpoint wait pushes first sound past the caller’s limit.':'Point limits   ·   500 ms from speech end   /   400 ms after commitment',
    92,870,39,n.ink);
}
export function firstClause(g,c){
  const b=c.beat.beatIndex;
  if(b===3){
    page(g,p,'Synthesizer   /   phrase queue','When should the producer pause?');
    const full=!!c.reveal('eight chunks',0), two=!!c.reveal('only two played',0);
    const num=full?8:2, played=two?2:0;
    if(!full){
      serif(g,'Incident is open,',125,490,96,p.blue);
      serif(g,'severity is two.',960,490,89,p.soft);
      bracket(g,124,835,563,'Speakable at the comma',p.blue);
    }else{
      for(let i=0;i<num;i++){
        const x=113+213*i;
        box(g,x,420,185,156,i<played?p.blue:p.field,12);
        mono(g,String(i+1),x+93,526,55,i<played?p.white:p.soft,'center');
      }
      if(played) bracket(g,113,511,626,'Played',p.blue);
      if(c.reveal('Pause at the queue',0)) bracket(g,539,1789,626,(num-played)+' waiting',p.red);
    }
    bottom(g,p,full?'A bounded queue lets the phone discard pending speech quickly.':'Split long text on a word boundary. Test digits and abbreviations by ear.');
    return;
  }
  const arrival=cue(c,0,'speakable fragment',.7);
  const synthesized=cue(c,0,'first audio is ready',.7);
  const first=cue(c,1,'starts playing',.5);
  const neutral=cue(c,2,'neutral continuation',.8);
  const lookup=cue(c,2,'service returns open',.7);
  const makeFact=cue(c,2,'factual generation begin',.9);
  const played=cue(c,2,'Its first audio plays',1);
  const moment=Math.round(60+150*arrival+135*synthesized+35*first+150*neutral+110*lookup+280*makeFact+35*played);
  const x=t=>377+t*1.43;
  const yrow=i=>355+i*90;
  const lookupDone=moment>=toolTrace.completed, factualAudio=moment>=speechChunks[2].play[0];
  page(g,p,'Status lookup   /   shared call clock',lookupDone?
    'When does the verified reply reach Alex?':'What can Alex hear while the lookup runs?');
  mono(g,'Call time  '+moment+' ms',97,302,37,p.soft);
  const labels=['Model','Synthesis','Phone','Lookup'];
  labels.forEach((name,i)=>{
    txt(g,name,95,yrow(i)+14,43,p.ink);
    line(g,x(0),yrow(i),x(1000),yrow(i),p.rule,2);
  });
  const span=(i,[start,end],color)=>{
    if(moment>start) box(g,x(start),yrow(i)-14,x(Math.min(moment,end))-x(start),28,color,4);
  };
  for(const [i,chunk] of speechChunks.entries()){
    const color=[p.blue,p.rule,p.green][i];
    [chunk.llm,chunk.tts,chunk.play].forEach((pair,j)=>span(j,pair,color));
  }
  span(3,[toolTrace.started,toolTrace.completed],p.red);
  for(const ms of [0,200,400,600,800,1000]) {
    line(g,x(ms),664,x(ms),678,p.rule,2);
    mono(g,String(ms),x(ms),710,30,p.soft,'center');
  }
  line(g,x(moment),320,x(moment),662,p.soft,2);
  if(moment>=380) dot(g,x(380),yrow(2),9,p.blue);
  if(lookupDone) {
    dot(g,x(toolTrace.completed),yrow(3),12,p.green);
    txt(g,'Open',x(toolTrace.completed)+18,yrow(3)-19,34,p.green);
  }
  if(factualAudio) dot(g,x(speechChunks[2].play[0]),yrow(2),12,p.green);
  const ackKnown=cue(c,2,'The model can');
  serif(g,factualAudio?'Status reply begins   “Incident…”':lookupDone?'Preparing the verified reply':ackKnown?'“I’ll check that.”':moment>=380?
    '“I’ll check that”   or   “Incident is open”?':'A status lookup on incident 4219',100,815,64,p.ink);
  bottom(g,p,factualAudio?'955 ms   ·   factual reply begins':lookupDone?'640 ms   ·   the lookup returned open':
    moment>=380?'380 ms   ·   first audio   /   lookup pending':'The speaker and the incident service have separate timelines.');
}

// Fit each recorded phrase to its own synthetic chunk. Recording time and call time have different origins.
function recordedParts(){
  const take=recordedHotline;
  const bin=word=>Math.round(word*1000/take.binMs);
  const open=bin(take.words[2].start), end=bin(take.words[2].end);
  const split=Math.round((queued.words[3].start*queued.sampleRate-queued.first)/(queued.end-queued.first)*queued.peaks.length);
  return [take.peaks.slice(bin(take.words[0].start),open),take.peaks.slice(open,end),
    queued.peaks.slice(0,split),queued.peaks.slice(split)];
}
const recordedChunks=recordedParts();
const firstReceipt=chunks[0].endMs;
const wholeWordReceipt=chunks[1].endMs;
const replayReceipt=wholeWordReceipt-1;
const receivedThrough=chunks.at(-1).endMs;
const chunkLines=chunks.map((chunk,i)=>{
  const words=chunk.text.trim().split(' ');
  return i<2?[words.join(' ')]:[words.slice(0,2).join(' '),words.slice(2).join(' ')];
});

function sinceReceiptPhrase(c,beat,phrase) {
  if(c.beat.beatIndex!==beat) return c.beat.beatIndex>beat?Infinity:-Infinity;
  c.reveal(phrase,0,{captionStart:phrase});
  return c.elapsed-c.wordCue(phrase).end;
}

function receiptCloseup(g,seamX,position) {
  const zoom=ms=>seamX+(ms-wholeWordReceipt)*132;
  const first=wholeWordReceipt-2, last=wholeWordReceipt+2, y=765;
  txt(g,'Receipt close-up',420,746,38,p.ink);
  mono(g,'1 ms per tick',420,798,32,p.soft);
  line(g,zoom(first),y,zoom(last),y,p.rule,3);
  for(let ms=first;ms<=last;ms++){
    const x=zoom(ms), seam=ms===wholeWordReceipt;
    line(g,x,seam?y-42:y-9,x,y+11,seam?p.ink:p.rule,seam?4:2);
    mono(g,ms,x,813,37,seam?p.ink:p.soft,'center');
  }
  txt(g,'“'+chunks[1].text.trim()+'” ends',seamX+18,747,35,p.ink);
  dot(g,zoom(position),y,12,p.blue);
}

export function cutoff(g,c){
  const b=c.beat.beatIndex, replay=b>=3;
  const first=sinceReceiptPhrase(c,1,'The first receipt covers Incident is')>=0;
  const second=sinceReceiptPhrase(c,1,'The next reaches the end of open')>=0;
  const cut=sinceReceiptPhrase(c,1,'Alex cuts in at six hundred fifty milliseconds')>=0;
  const clear=cue(c,1,'clear its queue',.65);
  const shift=Math.max(0,Math.min(1,sinceReceiptPhrase(c,3,'The latest receipt now says five hundred nineteen milliseconds')/.55));
  const cursor=shift===1?replayReceipt:second?wholeWordReceipt:first?firstReceipt:0;
  const position=wholeWordReceipt+(replayReceipt-wholeWordReceipt)*shift;
  const state=voiceReconcile(pendingText,chunks,cursor);
  const confirmed=(replay?sinceReceiptPhrase(c,4,'The word “is.”'):sinceReceiptPhrase(c,2,'Keep “Incident is open.”'))>=0;
  const showOffset=(replay
    ?sinceReceiptPhrase(c,4,'The first piece ends at two hundred forty milliseconds and character eleven')
    :sinceReceiptPhrase(c,2,'Its last whole piece ends at character sixteen'))>=0;
  const ask=cue(c,1,'Which complete pieces');
  const x=t=>419+t*1.22;
  const edge=x(replay?position:cursor), mute=interrupt.replyElapsedMs;
  page(g,p,'Example playout clock   /   milliseconds into the factual reply',replay?'Which word survives the replay?':'Where does the phone stop?');
  g.save();g.beginPath();g.rect(0,250,399,590);g.clip();g.translate(26,254);g.scale(.59,.59);handset(g);g.restore();
  mono(g,'Reply 1   ·   '+receivedThrough.toLocaleString('en-US')+' ms received',418,326,34,p.soft);
  const visibleThrough=receivedThrough-(receivedThrough-mute)*clear;
  function audio(left,right,color){
    if(right<=left) return;
    g.save();g.beginPath();g.rect(left,350,right-left,210);g.clip();
    for(const [i,peaks] of recordedChunks.entries()){
      const from=i?chunks[i-1].endMs:0, to=chunks[i].endMs;
      if(x(from)<right && x(to)>left) wave(g,peaks,x(from),460,x(to)-x(from),105,color);
    }
    g.restore();
  }
  if(cut) {
    opacity(g,.17,()=>box(g,edge,400,x(mute)-edge,94,p.gold));
    dot(g,1489,314,9,p.gold);
    txt(g,'May have played',1514,326,35,p.gold);
  }
  audio(x(0),x(visibleThrough),p.rule);
  if(cut) {
    audio(edge,x(mute),p.gold);
    line(g,x(mute),388,x(mute),480,p.red,4);
    mono(g,'Alex · '+mute,x(mute),370,32,p.red,'center');
  }
  if(clear) {
    g.save();g.setLineDash([12,12]);line(g,x(visibleThrough),460,x(receivedThrough),460,p.rule,3);g.restore();
    if(clear===1) txt(g,'Queue cleared',x((mute+receivedThrough)/2),432,35,p.soft,{align:'center'});
  }
  audio(x(0),edge,p.blue);
  let start=0;
  chunks.forEach((chunk,i)=>{
    const a=x(start), z=x(chunk.endMs),mid=(a+z)/2;
    line(g,z,489,z,517,p.rule);
    mono(g,String(chunk.endMs),z,551,32,p.soft,'center');
    for(const [k,row] of chunkLines[i].entries()) serif(g,row,mid,622+k*49,47,
      confirmed && chunk.endMs<=cursor?p.blue:cut?p.soft:p.ink,z-a-12,'center');
    start=chunk.endMs;
  });
  if(cursor){
    line(g,edge,379,edge,498,p.blue,6);
    mono(g,shift>0 && shift<1?'ACK':'ACK '+cursor,edge-10,400,32,p.blue,'right');
  }
  if(replay) receiptCloseup(g,x(wholeWordReceipt),position);
  if(confirmed){
    const left=replay?1432:420;
    txt(g,'Assistant history',left,745,37,p.blue);
    serif(g,state.retained,left,replay?801:833,replay?58:75,p.ink);
    if(showOffset) mono(g,'Text offset '+state.endChar,replay?left:1400,replay?843:813,35,p.blue);
  }else if(ask && !replay){
    txt(g,'Which complete pieces fit inside the receipt?',418,795,49,p.ink);
  }
  bottom(g,p,replay?'Keep a whole piece when its endpoint is at or before the receipt.':
    cut?'Gold marks audio that may have played after the last receipt.':
    'Each seam pairs the end of a piece of audio with the end of its text.');
}

function pageStatus({authorized,confirmed,accepted}) {
  if(!confirmed)return 'Await confirmation';
  if(!authorized)return 'Withhold dispatch';
  return accepted?'Accepted':'Sent';
}
export function paging(g,c){
  const b=c.beat.beatIndex, auth=cue(c,0,'permission passes'), sent=cue(c,0,'executor sends');
  const checked=cue(c,0,'A denial'), timeout=cue(c,1,'times out');
  const lookup=cue(c,2,'Look up'), accepted=cue(c,2,'If a retry'), retry=cue(c,2,'idempotency contract');
  const emptyHistory=cue(c,3,'The accepted page remains');
  page(g,p,'Incident 4219   /   page request P47',timeout && !lookup?
    'Should the hotline send a second page?':'What did the paging service confirm?');
  const columns=[['Hotline executor',sent?'P47 sent':auth?'Allowed':checked?'Check permission':'Confirm request',p.blue],
    ['Paging service',accepted?pageStatus({authorized:true,confirmed:true,accepted}):timeout?'Acceptance unknown':'Await receipt',accepted?p.green:p.soft],
    ['Owner','Delivery unknown',p.soft]];
  for(let i=0;i<3;i++){
    const x=120+i*590;
    txt(g,columns[i][0],x,371,44,columns[i][2]);
    line(g,x,411,x+479,411,columns[i][2],4);
    serif(g,columns[i][1],x,517,66,p.ink,485);
    if(i<2) mono(g,'→',x+490,458,52,p.rule);
  }
  if(timeout) txt(g,'Client timed out',120,588,39,p.red);
  if(emptyHistory){
    txt(g,'Spoken history for this update',120,670,40,p.blue);
    serif(g,'0 words confirmed',120,774,73,p.ink);
    txt(g,'Service record',1070,670,40,p.green);serif(g,'P47 accepted',1070,774,73,p.green);
  }else if(b>=1){
    mono(g,'Request ID   P47',122,703,52,p.ink);
    if(lookup) txt(g,retry?'If a retry is needed, reuse P47.':accepted?'Service record found for P47.':
      'Look up P47 in the service record.',121,786,45,p.soft);
  }else if(checked && !auth) serif(g,'If permission is denied, withhold dispatch.',117,736,67,p.red);
  bottom(g,p,emptyHistory?'Interrupting the spoken update leaves the accepted action on record.':'Service acceptance, delivery and human acknowledgement are separate events.');
}
export function checkReply(){
  const widths=rows.map(r=>r[2]-r[1]);
  assert.ok(recordedChunks.every(peaks=>peaks.length>0));
  assert.deepEqual(widths,[60,100,180,135,35]);
  assert.deepEqual([afterCommit,replayAudio],[320,620]);
  assert.ok(trace.firstAudio<=500 && replayAudio>500 && afterCommit<=400);
  assert.equal(widths.reduce((s,w)=>s+w,0),510);
  assert.deepEqual([trace.firstAudio-trace.speechEnd,trace.firstAudio-trace.commit],[380,320]);
  assert.deepEqual([speechChunks[0].play[0],toolTrace.completed,speechChunks[2].play[0]],[380,640,955]);
  assert.deepEqual([firstReceipt,replayReceipt,wholeWordReceipt],[240,519,520]);
  assert.equal(wholeWordReceipt,interrupt.acknowledgedThrough);
  assert.ok(wholeWordReceipt<interrupt.replyElapsedMs && interrupt.replyElapsedMs<chunks[2].endMs);
  for(const [cursor,offset,words] of [[0,0,''],[firstReceipt,11,'Incident is'],[replayReceipt,11,'Incident is'],[wholeWordReceipt,16,'Incident is open']]){
    const state=voiceReconcile(pendingText,chunks,cursor);
    assert.deepEqual([state.endChar,state.retained],[offset,words]);
  }
  assert.equal(pageStatus({authorized:false,confirmed:true,accepted:false}),'Withhold dispatch');
  assert.equal(pageStatus({authorized:true,confirmed:true,accepted:true}),'Accepted');
}
