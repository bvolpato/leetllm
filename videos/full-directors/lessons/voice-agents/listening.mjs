import assert from 'node:assert/strict';
import {handset} from './handset.mjs';
import {drawPlaybackReceipt} from './playback-receipt.mjs';
import recordedHotline from './recorded-hotline.json' with {type:'json'};
import {partialTurns,trace} from '../../../films/voice-agents/fixtures.mjs';
import {turnComplete,voiceWorksheet} from '../../../films/voice-agents/arithmetic.mjs';
import {paper as p,night as n,txt,mono,serif,line,box,dot,page,bottom,bracket,cue,wave} from './drawing.mjs';

export function opening(g,c) {
  if (drawPlaybackReceipt(g,c)) return;
  g.fillStyle=p.bg; g.fillRect(0,0,1920,1080);
  handset(g);
  mono(g,'Incident hotline   /   4219',480,115,38,p.soft);
  serif(g,'Back to the call',480,245,88,p.ink);
  txt(g,'Alex',480,351,42,p.red);
  serif(g,'“What is the status of incident 4219?”',480,450,62,p.ink,1310);
  line(g,480,558,1740,558,p.rule);
  txt(g,'Player’s record',480,675,43,p.blue);
  txt(g,'Incident is open',480,740,40,p.ink);
  if(c.reveal('A second record',0)){
    line(g,480,795,1760,795,p.rule);
    txt(g,'Service record',480,860,43,p.green);
    txt(g,'Actions accepted by the incident service',480,924,40,p.ink);
  }
}

function action(flag) {
  if(typeof flag !== 'boolean') return 'Reject event';
  return flag ? 'Apply turn policy' : 'Reversible reads only';
}
const hotlineTurns = partialTurns.map((partial,i) => i === partialTurns.length-1
  ? {...partial,silenceMs:trace.commit-trace.speechEnd}
  : partial);

export function listen(g,c) {
  const b=c.beat.beatIndex;
  if (b===3) {
    const revised=c.reveal('changes to',0), malformed=c.reveal('the string false',0);
    const flag=malformed?'false':false;
    page(g,p,'Recognition   /   interim events','What can this transcript authorize?');
    txt(g,'Provisional transcript',112,340,42,p.soft);
    serif(g,revised?'“Track incident 4219”':'“Page incident 4219”',110,470,96,p.ink);
    if(revised) txt(g,'Previous hypothesis   ·   Page incident 4219',114,555,39,p.soft);
    mono(g,'committed = '+JSON.stringify(flag),115,690,53,malformed?p.red:p.blue);
    serif(g,action(flag),110,804,64,malformed?p.red:p.blue);
    bottom(g,p,malformed?'The adapter requires a Boolean.':'An interim transcript can still change.');
    return;
  }
  const i=cue(c,2,'then one nine')?2:cue(c,2,'adds two')?1:0;
  const partial=hotlineTurns[i], digits=partial.text.split(' ')[1];
  const committed=cue(c,2,'the server accepts') && turnComplete(partial);
  page(g,p,'Alex’s microphone   /   partial transcript','Has Alex finished the number?');
  txt(g,'Incident',134,436,58,p.soft);
  const showDigits=b>0 || cue(c,0,'finished the request');
  for(let j=0;j<4;j++){
    const x=480+290*j;
    line(g,x,625,x+225,625,committed?p.green:p.rule,7);
    if(showDigits && j<digits.length) serif(g,digits[j],x+105,566,177,p.ink,230,'center');
  }
  if (b>=1) {
    const quiet=(i===0 && cue(c,1,'The last word')) || committed;
    const finalPause=i===2 && cue(c,2,'After Alex stops');
    mono(g,quiet?partial.silenceMs+' ms quiet':finalPause?'Timing final pause':'Receiving speech',135,767,43,p.blue);
    txt(g,committed?'Turn accepted':'Listening',920,777,65,committed?p.green:p.blue);
  } else {
    txt(g,'Local speech onset',135,767,45,p.red);
    txt(g,'Server turn decision',920,767,45,p.blue);
  }
  bottom(g,p,committed?'A stable four-digit identifier is ready for the authorized lookup.':
    b===1 && cue(c,1,'The last word')?'There is a pause. Would you look up this incident?':'The hotline expects four digits.');
}

const {probabilities}=voiceWorksheet();
function frameRun(quietMs) {
  const width=20, pre=2, threshold=.5, first=probabilities.findIndex(v=>v>=threshold);
  const last=probabilities.findLastIndex(v=>v>=threshold);
  const required=Math.ceil(quietMs/width), end=last+required;
  const start=Math.max(0,first-pre);
  return {first,last,start,required,end,complete:end<probabilities.length,retained:(last-start+1)*width};
}
export function frames(g,c) {
  const b=c.beat.beatIndex;
  if(b===3){
    page(g,n,'Speakerphone   /   recorded example','Whose voice reached the microphone?');
    const x=520, width=1020;
    txt(g,'Speaker',98,410,51,n.ink); wave(g,recordedHotline.peaks,x,400,width,135,n.blue);
    line(g,x,425,1770,425,n.rule);
    txt(g,'Microphone',98,624,51,n.ink);
    if(c.reveal('hear the hotline',0)){
      wave(g,recordedHotline.peaks,x+200,620,width,65,n.gold);
      txt(g,'Illustrated echo',1480,729,35,n.gold);
    }
    line(g,x,645,1770,645,n.rule);
    bottom(g,n,c.reveal('Request acoustic',0)?'Compare the captured reply on speakerphone and headphones.':'A returned copy of the speaker signal can trigger a false mute.');
    return;
  }
  const raised=cue(c,2,'sixty-one milliseconds'), run=frameRun(raised?61:60);
  const thresholdY=534, left=145, step=205, barW=123;
  const atEnd=cue(c,1,'frame seven');
  page(g,n,'Microphone detector   /   20 ms frames','Which frames reach recognition?');
  mono(g,'Speech probability',100,329,36,n.soft);
  const y=v=>710-v*352;
  line(g,95,thresholdY,1810,thresholdY,n.gold,2);
  mono(g,'0.50',1780,thresholdY-12,29,n.gold,'right');
  probabilities.forEach((v,i)=>{
    const x=left+i*step, voiced=v>=.5;
    box(g,x,y(v),barW,710-y(v),voiced?n.blue:(i<run.first?n.soft:n.rule),5);
    mono(g,v.toFixed(2),x+barW/2,y(v)-15,32,n.ink,'center');
    mono(g,String(i),x+barW/2,758,35,n.soft,'center');
  });
  if(atEnd) bracket(g,left, left+run.last*step+barW,778,
    raised?'Candidate window':cue(c,2,'Count the five')?run.retained+' ms retained':'Retained window',n.green);
  if(atEnd) mono(g,raised?'3 of 4 quiet frames':'3 of 3 quiet frames',1420,828,34,n.gold,'center');
  bottom(g,n,raised?'61 ms requested  ·  4 whole frames required  ·  waiting for one more':
    atEnd?'Keep pre-roll and speech. Trim the quiet frames that closed the utterance.':'Threshold 0.50   ·   Pre-roll 40 ms   ·   Trailing silence 60 ms');
}

export function checkListening(){
  assert.deepEqual(hotlineTurns.map(t=>[t.text,t.silenceMs,turnComplete(t)]),[
    ['incident 4',80,false],['incident 42',0,false],['incident 4219',60,true],
  ]);
  assert.equal(turnComplete({...hotlineTurns[2],silenceMs:59}),false);
  assert.deepEqual([action(false),action('false')],['Reversible reads only','Reject event']);
  assert.deepEqual(frameRun(60),{first:2,last:4,start:0,required:3,end:7,complete:true,retained:100});
  assert.equal(frameRun(61).complete,false);
  assert.equal(frameRun(61).required,4);
  assert.equal(recordedHotline.say,'Incident is open.');
  assert.ok(recordedHotline.peaks.some(([lo,hi])=>lo<0 && hi>100));
}
