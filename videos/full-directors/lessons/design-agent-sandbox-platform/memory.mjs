import { C, type, rect, dot, line, curve, ground, foot, metal, chapterCue, ease } from './art.mjs';
import { baseWing, wings, writerState, cleanReadState } from './model.mjs';
import { moth } from './moth.mjs';

function byteTile(g,x,y,v,selected=false){
  rect(g,x-51,y-48,102,96,selected?'#ffdfb0':C.paper,C.ink,6);
  for(let j=0;j<8;j++)rect(g,x-42+j*11,y-37,6,8,j%3?C.faint:C.dim);
  type(g,v,x,y+8,37,C.ink,'Mono',600,'center');
}

function secondWriter(g,k){
  const done=k.beat.id==='both-private' && k.reveal('Now count four');
  const counted=k.beat.id==='both-private' && k.reveal('with reads of');
  const s=writerState(done);
  ground(g,k,'What changes when B also writes?','PAGE ACCOUNTING   /   FOUR-PAGE EXERCISE');
  type(g,'Shared base',150,288,44,C.ink,'Serif');
  s.base.forEach((v,i)=>byteTile(g,270+i*175,407,v,i===2));
  type(g,'Index 2',620,332,31,C.dim,'Mono',500,'center');
  for(const [i,who] of ['A','B'].entries()){
    const x=1130+i*435;
    metal(g,x-142,576,284,195,C.dark);
    type(g,'Job '+who,x,620,34,C.ice,'Sans',500,'center');
    type(g,s[who.toLowerCase()][2],x,701,66,C.white,'Mono',600,'center');
    const privateRead=i===0||done;
    const targetX=privateRead?x:620;
    curve(g,[x,576,x,509,targetX,523,targetX,privateRead?455:462],i===0?C.copper:C.blue,6);
    if(privateRead){
      type(g,who+'’s copy',x,289,39,C.ink,'Serif',500,'center');
      byteTile(g,x,407,s[who.toLowerCase()][2],true);
    }
  }
  foot(g,counted?'4 shared + 2 private = '+s.totalPages+' pages   ·   '+s.kib+' KiB':done?'B now maps its own private page. Count the backing pages once.':'B wants to write 52 to index 2.',
    done?'A reads 81. B reads 52. The immutable base retains 13.':'Each modeled page holds 4 KiB. Count the base once.');
}

function coldRead(g,k){
  const file=k.beat.id==='file-read';
  const filling=k.beat.id==='handler-fill';
  const spoken=(phrase,duration=0)=>k.reveal(phrase,duration);
  const fetch=file ? spoken('the host kernel brings',1.1) :
    filling ? 1 : spoken('Now the bytes arrive',1.1);
  const fetchRequested=file ? spoken('the host kernel brings') :
    filling || spoken('It asks the snapshot store');
  const delayed=!file && !filling && spoken('The fetch is delayed') && fetch===0;
  const checkStarted=filling && spoken('checks the bytes');
  const checked=filling && spoken('It supplies the validated page');
  const supply=file ? spoken('in from the snapshot file',1.1) :
    filling ? spoken('It supplies the validated page',1.1) : 0;
  const read=file ? spoken('Both private writes') : filling && spoken('The two private writes');
  const phase=read ? 'read' : supply===1 ? 'supplied' : checked ? 'validated' :
    fetch===1 ? 'received' : 'waiting';
  const s=cleanReadState(file?'File':'Uffd',phase);
  const waiting=s.residentKiB===0;
  ground(g,k,'When can A finish its read of page '+s.index+'?',
    file?'MISSING PAGE   /   FILE-BACKED RESTORE':'MISSING PAGE   /   REPLAY WITH USERFAULTFD');
  if(checkStarted){
    const prefix=s.fetchedDigest ? s.fetchedDigest.slice(0,8) : '…';
    type(g,'SHA-256 prefixes',97,231,29,C.dim,'Mono',500);
    type(g,'Trusted   '+s.snapshotDigest.slice(0,8),677,231,30,C.ink,'Mono',500);
    type(g,'Received   '+prefix,1280,231,30,s.matches?C.teal:C.dim,'Mono',600);
  }

  const left=337, host=960, guest=1583;
  const panels=[
    [left,'Snapshot file','Page '+s.index+'   ·   byte '+s.backing],
    [host,file?'Host kernel':'Host userspace handler',file?'File-backed fault':'userfaultfd'],
    [guest,'Guest A','Read page '+s.index]
  ];
  for(const [x,title,label] of panels){
    metal(g,x-240,280,480,228);
    type(g,title,x,355,40,C.white,'Serif',500,'center');
    type(g,label,x,439,32,C.ice,'Mono',500,'center');
    line(g,x,511,x,557,C.dim,3);
  }
  line(g,left,608,guest,608,C.faint,6);
  for(const x of [left,host,guest]){
    rect(g,x-76,558,152,100,C.paper,C.faint,9);
    line(g,x-39,607,x+39,607,C.faint,3);
  }
  const x=supply>0 ? host+(guest-host)*ease(supply) : left+(host-left)*ease(fetch);
  const tile=(at,label)=>{
    rect(g,at-69,562,138,91,C.ice,C.blue,8);
    for(let j=0;j<8;j++)rect(g,at-53+j*14,574,8,8,j%3?C.blue:C.dim);
    type(g,label,at,613,33,C.ink,'Mono',600,'center');
  };
  tile(left,'P'+s.index);
  if(x>left)tile(x,'P'+s.index);

  type(g,'Immutable source',left,716,34,C.dim,'Sans',500,'center');
  const action=file ? !waiting?'Clean page mapped':supply>0?'Filling A’s mapping':fetchRequested?'Loading from file':'Awaiting fault' :
    s.matches ? 'Digest matched' : checkStarted ? 'Checking digest' : s.received ? 'Bytes received' :
    delayed ? 'Fetch delayed' : fetchRequested ? 'Fetch requested' : 'Awaiting page';
  type(g,action,host,716,34,s.matches?C.teal:C.dim,'Sans',600,'center');
  type(g,s.read!==null?'Read returned '+s.read:waiting?'Read waiting':'Page available',
    guest,716,35,waiting?C.copper:C.teal,'Sans',600,'center');

  type(g,'Page 2    A = '+s.writes[0]+'    B = '+s.writes[1]+'    Base = '+s.baseAtWrite,94,824,34,C.dim,'Mono',500);
  type(g,'Private write copies   '+s.privateCount,1818,824,34,C.ink,'Mono',600,'right');
  foot(g,'Page '+s.index+' resident in A’s mapping     '+s.residentKiB+' KiB',
    file?'The host kernel services this read from the immutable snapshot file.':
    s.matches?'The handler supplies the checked contents to the faulting mapping.':
    s.received?'The fetched page is at the handler. A’s read is still waiting.':
    'The faulting read waits while the host handler obtains the page.');
}

export function memory(g,k){
  const i=k.beat.beatIndex;
  if(i>=7)return coldRead(g,k);
  if(i>=5)return secondWriter(g,k);
  const cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  const lift=ease(cue(2,'The host copies',1.35));
  let stage=lift>0?1:0;
  if(cue(2,'Now the stroke lands'))stage=2;
  if(cue(2,"B's line still ends"))stage=3;
  if(cue(4,'Count the pages again'))stage=4;
  const a=wings[stage],cx=435,cy=444;
  ground(g,k,i===3||i===4?'Does a second stroke need another page?':'Which byte colors the wing?', 'COPY-ON-WRITE   /   MOTH.SPRITE');
  rect(g,92,238,690,393,C.white,C.faint,12);
  type(g,'A’s canvas',128,285,39,C.ink,'Serif');type(g,'Ink '+a.a,746,285,31,C.copper,'Mono',600,'right');
  moth(g,cx,cy,473,a.a);
  rect(g,1152,238,675,393,C.white,C.faint,12);
  type(g,'B’s canvas',1187,285,39,C.ink,'Serif');type(g,'Ink '+a.b,1791,285,31,C.blue,'Mono',600,'right');
  moth(g,1489,cy,470,a.b);
  // Magnify the marked part of A's right forewing at the original pixel scale.
  const wx=cx+139,wy=cy-45;
  dot(g,wx,wy,42,null,C.copper,4);
  line(g,wx+42,wy,830,420,C.copper,3);
  dot(g,936,432,111,C.white,C.ink,5);
  g.save();g.beginPath();g.arc(936,432,105,0,Math.PI*2);g.clip();
  moth(g,936-139*3,432+45*3,473*3,a.a);g.restore();
  type(g,'Byte 136',936,587,32,C.dim,'Mono',500,'center');
  const baseX=j=>780+j*169,sourceX=baseX(2),privateX=475, tileY=771;
  const privateDest=a.mapped?privateX:sourceX-12;
  curve(g,[435,632,435,701,privateDest,645,privateDest,719],C.copper,6);
  curve(g,[1489,632,1489,690,sourceX+12,651,sourceX+12,719],C.blue,6);
  baseWing.forEach((v,j)=>byteTile(g,baseX(j),tileY,v,j===2));
  type(g,'Backing pages 0–5',1202,853,30,C.dim,'Mono',500,'center');
  if(lift>0){
    const x=sourceX+(privateX-sourceX)*lift;
    const y=tileY-77*Math.sin(Math.PI*lift);
    byteTile(g,x,y,a.privatePage[136],true);
    if(lift===1)type(g,'A’s page 2',privateX,853,30,C.copper,'Mono',500,'center');
  }
  if(i===1)foot(g,'A requests orange at one offset.','Follow both read pointers while you predict B’s color.');
  else if(i===3)foot(g,'A requests pink at the same offset.','The first private page is already attached.');
  else foot(g,a.pages+' modeled pages   ×   4 KiB   =   '+a.kib+' KiB',
    stage===0?'Both views read the ink from backing page 2.':stage===1?'A copy exists. Both read pointers still end on the shared page.':stage===2?'A now maps its own page. Both versions still contain 30.':stage===3?'Only A’s ink byte changed. B still reads blue from backing page 2.':'A changed its own byte from 99 to 76. No new page was allocated.');
}
