import assert from 'node:assert/strict';
import { firstFrameAt } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import { line, rect, shape, ellipse, text, gradient, workshop, truingStand, chain } from './workshop.mjs';
import {
  EVENT, OTHER, jobs, deliveries, idOf, replay, replayEvidence, raceTrace, owned, dirtyPaths, inScope,
  runnerCapability, repairView, workingTree, receipt, receiptVerdict,
  practice, practiceKeys, practiceReceipts, matchesF, checkEvidence,
} from './evidence.mjs';

const title = 'Coding Agents: From a Replayed Bug to a Reviewable Patch';
const ink = '#183544', muted = '#50636a', paper = '#fffcf0', blue = '#245994';
const rust = '#a33827', green = '#24634d', amber = '#88501a', rule = '#bdc5bc';
const mid = 'center';
const smooth = (p) => p * p * (3 - 2 * p);
function cue(k, beat, words, span = 0.3) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat ? 1 : 0;
  return k.reveal(words, span);
}
const on = (k, beat, words) => cue(k, beat, words, 0) === 1;
function after(k, beat, words, captionStart) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  if (captionStart) k.reveal(words, 0, { captionStart });
  return firstFrameAt(k.elapsed) >= firstFrameAt(k.wordCue(words).end);
}
function during(k, beat, words) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { start, end } = k.wordCue(words);
  if (firstFrameAt(k.elapsed) >= firstFrameAt(end)) return 1;
  return smooth(Math.max(0, (k.elapsed - start) / (end - start)));
}
const serif = (c, s, x, y, size, col = ink, align = 'left') => text(c,s,x,y,size,col,'Serif',500,align);
const mono = (c, s, x, y, size = 30, col = ink, align = 'left') => text(c,s,x,y,size,col,'Mono',500,align);
const label = (c, s, x, y, size = 34, col = ink, align = 'left') => text(c,s,x,y,size,col,'Sans',600,align);
function board(c, kind, heading, dark = false) {
  const bg = dark ? '#162f3b' : '#e8ede3';
  rect(c,0,0,1920,1080,gradient(c,0,0,1880,1010,[bg,dark?'#22424c':'#f2eee2']));
  for (let x=28;x<1920;x+=48) for(let y=24;y<1080;y+=48) rect(c,x,y,2,2,dark?'#35505a':'#c6cec1');
  mono(c,kind.toUpperCase(),82,78,26,dark?'#acd1c9':green);
  serif(c,heading,78,161,68,dark?paper:ink);
  line(c,[80,231,1840,231],dark?'#557078':rule,2);
}
function slip(c,x,y,w,h,fill=paper) {
  rect(c,x+5,y+10,w,h,'rgba(15,43,48,0.16)',6);
  rect(c,x,y,w,h,fill,6);
  for(let i=x+8;i<x+w-4;i+=19) shape(c,[i,y+h-1,i+7,y+h+5,i+14,y+h-1],fill);
}
function smallJob(c,event,x,y,r=24) {
  const color=jobs[event].color;
  if(event===EVENT) {
    ellipse(c,x,y,r,r,null,color,3.5);
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      line(c,[x,y,x+(r-3)*Math.cos(a),y+(r-3)*Math.sin(a)],color,2.2);
    }
    ellipse(c,x,y,4,4,color);
  } else {
    c.save(); c.translate(x,y); c.rotate(-.55);
    for(const dx of [-.42,.42]) {
      c.beginPath(); c.roundRect((dx-.58)*r,-.36*r,1.16*r,.72*r,.36*r);
      c.strokeStyle=color;c.lineWidth=4;c.stroke();
    }
    c.restore();
  }
}
function tip(c,x,y,d,color) {
  c.save();c.translate(x,y);c.rotate(d);
  shape(c,[0,0,-14,-8,-14,8],color);c.restore();
}
function jobRow(c,x,y,w,invoice,event) {
  const j=jobs[event];rect(c,x,y,w,62,j.tint,5);
  rect(c,x,y,7,62,j.color);smallJob(c,event,x+44,y+31,20);
  mono(c,idOf(invoice),x+91,y+31,33,j.color);
  label(c,j.name,x+184,y+31,32,j.color);
  mono(c,j.key,x+w-20,y+31,27,j.color,'right');
}
function tag(c,x,y,w,s,color,bg) {
  rect(c,x,y,w,49,bg,5);label(c,s,x+w/2,y+25,26,color,mid);
}
function opening(c,k) {
  const b=k.beat.beatIndex;
  const turn=smooth(cue(k,0,'Give the wheel',2.8));
  const firstFlight=smooth(cue(k,0,'Its completion',1.1));
  const retryFlight=smooth(cue(k,1,'sends the completion again',1.1));
  const event=firstFlight>=1;
  const first=cue(k,0,'invoice one',0.4)===1;
  const retry=retryFlight>=1;
  const second=on(k,2,'two');
  const expected=on(k,2,'again');
  const run=replay(false,Number(first)+Number(second));
  workshop(c);
  c.save();c.translate(90,38);c.scale(.87,.87);truingStand(c,turn);chain(c);
  shape(c,[662,414,690,404,690,424],rust);
  c.restore();
  // A fixed pointer and one colored valve make a complete revolution observable.
  rect(c,752,84,1090,830,'#42555a',30);rect(c,744,72,1090,830,'#ae5038',30);
  rect(c,755,83,1068,807,'#df8157',22);rect(c,775,103,1028,767,paper,13);
  mono(c,'SHOP BILLING   /   ORIGINAL HANDLER',821,168,29,green);
  serif(c,'One completed repair',818,247,67);
  line(c,[821,303,1757,303],rule,2);
  label(c,'Delivery',825,355,30,muted);label(c,'Returned invoice',1742,355,30,muted,'right');
  for(const [i,visible] of [event,retry].entries()) {
    const y=426+i*82;
    if(!visible) continue;
    smallJob(c,EVENT,848,y);label(c,i?'Retry':'First',894,y,35);
    mono(c,jobs[EVENT].key,1155,y,35,blue);
    const row=run.deliveries[i];
    if(row) mono(c,idOf(row.invoice),1718,y,48,i?rust:blue,'right');
    else mono(c,'?',1718,y,43,muted,'right');
  }
  for (const [i,f] of [firstFlight,retryFlight].entries()) {
    if (f>0 && f<1) {
      const x=622+(848-622)*f, y=398+(426+i*82-398)*f-32*Math.sin(Math.PI*f);
      ellipse(c,x,y,26,26,jobs[EVENT].tint);smallJob(c,EVENT,x,y,22);
    }
  }
  line(c,[821,561,1757,561],rule,2);
  label(c,'Saved invoices',825,614,33);
  mono(c,String(run.count),1740,614,34,ink,'right');
  run.invoices.forEach((r,i)=>jobRow(c,824,662+i*73,925,r.invoice,r.event));
  if(expected && !second) label(c,'Expected return   #1',860,817,32,blue);
  if(b===1 && retry) label(c,'Which invoice belongs to the retry?',821,821,32,ink);
  if(b>=2 && second) label(c,'Same job on both rows',821,831,29,rust);
}

function trace(c,k) {
  const b=k.beat.beatIndex;
  board(c,'Repository trace','Where did the second invoice come from?');
  const steps=[['Provider','Retry delivery'],['Webhook route','Dispatch'],['Handler','Create invoice'],['Invoice store','Append row']];
  const active=[true,on(k,0,'webhook route'),on(k,0,'into the handler'),on(k,0,'invoice storage')];
  const ownedState=b>=1;
  const xs=[115,545,975,1405], y=394;
  for(let i=0;i<steps.length;i++) {
    if(i) {
      line(c,[xs[i-1]+342,y+102,xs[i]-16,y+102],active[i]?blue:rule,6);
      if(active[i])tip(c,xs[i]-13,y+102,0,blue);
    }
    slip(c,xs[i],y,335,241,active[i]?paper:'#e4e8df');
    const col=active[i]?ink:muted;
    if(i===0)smallJob(c,EVENT,xs[i]+54,y+58);
    else if(i===3) {
      for(let j=0;j<3;j++) {rect(c,xs[i]+29,y+34+j*16,68,24,col,4);ellipse(c,xs[i]+63,y+34+j*16,34,8,'#c0d0c7',col,3);}
    } else mono(c,i===1?'POST':'ƒ (event)',xs[i]+27,y+57,32,active[i]?blue:muted);
    serif(c,steps[i][0],xs[i]+26,y+126,42,col);
    label(c,steps[i][1],xs[i]+26,y+186,27,col);
  }
  if(!ownedState) {
    const admitted=on(k,0,'host admits');
    tag(c,119,716,430,admitted?'Host admitted the read':'Agent proposes a read',admitted?green:blue,admitted?'#d0e1d2':'#d9e8ef');
    return;
  }
  label(c,'Write scope',120,730,32,muted);
  mono(c,'webhook.ts  +  webhook.test.ts',120,800,37);
  const resolved=on(k,2,'Request that file');
  tag(c,1375,697,410,resolved?'Request a rescope':'Outside write scope',rust,'#f3dcd0');
  line(c,[1570,643,1570,690],rust,3);
  label(c,'Checks',120,876,27,muted);mono(c,'pnpm test --run billing    ·    pnpm lint',255,876,29);
}
function runner(c,k) {
  board(c,'Execution policy','What can the test process reach?',true);
  rect(c,95,310,1120,560,'#dce6db',18);
  rect(c,116,332,1078,517,'#264754',11);
  label(c,'Restricted runner',159,386,43,paper);
  mono(c,'pnpm test --run billing',158,478,42,'#c7ebe0');
  line(c,[185,522,185,620,236,620],'#9dcdbf',5);tip(c,242,620,0,'#9dcdbf');
  label(c,'Child process',270,620,40,paper);
  const allowed=on(k,3,'read the fixture');
  if(allowed) {
    for(const [i,[verb,path,action,kind]] of [
      ['READ','fixtures/retry.json','read','fixtures/retry.json'],
      ['WRITE','scratch/result.json','write','/tmp/runner/result.json'],
    ].entries()) {
      const y=711+i*66;
      if(runnerCapability(action,kind)) {mono(c,verb,270,y,27,'#b3d8c7');mono(c,path,416,y,30,paper);}
    }
  }
  label(c,'Outside the runner',1290,388,39,paper);
  for(const [i,[name,reason]] of [['Production token','Unmounted'],['Payment API','Egress denied'],['Log upload','Needs admission']].entries()) {
    const show=i===0?on(k,3,'no production token'):i===1?on(k,3,'route is closed'):on(k,4,'upload a log');
    const y=506+i*128;
    line(c,[1215,y,1264,y],show?'#efae84':'#60777c',5);
    line(c,[1252,y-20,1252,y+20],show?'#efae84':'#60777c',7);
    label(c,name,1290,y-6,34,paper);
    if(show) mono(c,reason,1291,y+41,27,'#f6cba0');
  }
}

function replayPair(c,k,head,counts,assess=[false,false]) {
  board(c,'Unchanged verifier K',head);
  const width=832, ys=[478,561,644];
  for(const [j,fixed] of [false,true].entries()) {
    const x=96+j*893, run=replay(fixed,counts[j]);
    slip(c,x,300,width,585);
    mono(c,fixed?'CANDIDATE C':'BASE',x+38,354,29,fixed?green:ink);
    label(c,'Job and event',x+39,416,28,muted);
    label(c,'Return',x+width-45,416,28,muted,'right');
    for(const [i,event] of deliveries.entries()) {
      const y=ys[i], job=jobs[event];
      const d=run.deliveries[i];
      if(d) {
        rect(c,x+23,y-32,width-46,64,job.tint,5);
        rect(c,x+23,y-32,7,64,job.color);
      }
      if (k.beat.chapterId==='c08' && k.beat.beatIndex===1 && i===2) {
        line(c,[x+25,y+32,x+width-25,y+32],job.color,4);
      }
      smallJob(c,event,x+63,y,23);label(c,i===1?'Wheel retry':job.name,x+113,y,33,job.color);
      mono(c,job.key,x+445,y,32,job.color);
      if(d) mono(c,idOf(d.invoice),x+width-51,y,42,ink,'right');
      else mono(c,'·',x+width-54,y,43,muted,'right');
      line(c,[x+40,y+40,x+width-42,y+40],rule,1.5);
    }
    label(c,'Stored rows',x+41,747,28,muted);
    mono(c,String(run.count),x+width-51,746,35,ink,'right');
    run.invoices.forEach(({event,invoice},i)=>{
      const left=x+40+i*245;
      rect(c,left,790,227,58,jobs[event].tint,5);
      smallJob(c,event,left+33,819,18);mono(c,idOf(invoice),left+68,819,30,jobs[event].color);
      mono(c,jobs[event].key,left+123,819,23,jobs[event].color);
    });
    if(assess[j] && run.deliveries.length===3) {
      const pass=replayEvidence(run).every(check=>check.passed);
      tag(c,x+width-237,329,192,pass?'PASS':'FAIL',pass?green:rust,pass?'#d5e6d5':'#f2dbcf');
    }
  }
}
function verifier(c,k) {
  const base=Number(on(k,1,'one'))+Number(on(k,1,'two'))+Number(on(k,1,'three'));
  const count=Number(on(k,2,'one'))+Number(on(k,2,'finds that invoice'))+Number(on(k,2,'two'));
  const verdict=on(k,1,'retry assertion fails');
  replayPair(c,k,'Does the retry create a second invoice?', [base,count],[verdict,on(k,2,'two stored invoices')]);
}

function traceDot(c, route, progress, fill, stroke) {
  if (progress <= 0 || progress >= 1) return;
  const lengths = route.slice(1).map(([x, y], i) => Math.hypot(x - route[i][0], y - route[i][1]));
  let distance = progress * lengths.reduce((sum, length) => sum + length, 0);
  for (const [i, length] of lengths.entries()) {
    if (distance <= length) {
      const [x, y] = route[i];
      const [nextX, nextY] = route[i + 1];
      const t = distance / length;
      ellipse(c, x + (nextX - x) * t, y + (nextY - y) * t, 12, 12, fill, stroke, 2);
      return;
    }
    distance -= length;
  }
}

function race(c,k) {
  const atomic = k.beat.beatIndex >= 2;
  const bothEmpty = atomic && after(k,2,'Both lookups still see an empty store');
  const looked = atomic ? [bothEmpty,bothEmpty] : [after(k,0,'finds nothing'),after(k,0,'checks it too')];
  const replies = atomic
    ? [after(k,3,'A commits invoice one','invoice one'),after(k,4,'B reads invoice one','invoice one')]
    : [after(k,1,'A creates invoice one','invoice one'),after(k,1,'B creates invoice two','invoice two')];
  const stage = [...looked,...replies].filter(Boolean).length;
  const result = raceTrace(atomic,stage);
  const claim = atomic ? during(k,2,'A claims the key') : 0;
  const request = atomic ? during(k,2,'B requests that key and waits') : 0;
  const conflict = atomic && after(k,3,'B’s insert conflicts');
  const follow = atomic ? smooth(cue(k,4,'Trace both replies',1.4)) : 0;
  const enforcing = atomic && after(k,2,'in the transaction that creates the invoice');
  board(c,atomic?'Replay  /  same requests':'Original  /  separate lookup and insert','Two workers, one wheel event',true);
  const workerX = 97, workerRight = 732, storeX = 1088, slotX = 1131, slotWidth = 644;
  const rows = [540,709];
  const waitingY = rows[0]+23, bendX = 963, stopX = slotX-28;
  const requestColor = '#eed19b', replyColor = '#b8dcf2', lookupColor = '#a0bdba';
  rect(c,storeX,301,735,555,'#c6d2c7',16);
  rect(c,storeX+15,317,705,523,paper,9);
  serif(c,'Invoice store',slotX,372,48);
  mono(c,'SHOP 04  /  EVENT '+jobs[EVENT].key,slotX,432,30,blue);

  for (const [i,y] of rows.entries()) {
    rect(c,workerX,y-99,workerRight-workerX,143,'#f7f4e5',9);
    label(c,'Worker '+(i?'B':'A'),workerX+29,y-54,39);
    mono(c,'04 / '+jobs[EVENT].key,workerX+350,y-54,32,blue);
    if (replies[i]) {
      const row = result.rows[atomic?0:i];
      const fromY = atomic && i===1 ? waitingY : y;
      const route = [[slotX,fromY]];
      if (fromY !== y) route.push([bendX,fromY],[bendX,y]);
      route.push([workerRight+12,y]);
      line(c,route.flat(),replyColor,5);
      tip(c,workerRight+9,y,Math.PI,replyColor);
      traceDot(c,route,follow,paper,blue);
      const action = atomic ? (i ? 'Read winner' : 'Committed') : 'Created';
      mono(c,action+'  ·  Return '+idOf(row.id),workerX+29,y+3,32,blue);
    } else if (i===0 && claim>0) {
      const route = [[workerRight+13,y],[slotX,y]];
      line(c,route.flat(),requestColor,5);
      traceDot(c,route,claim,requestColor,amber);
      mono(c,claim===1?'Key held':'Claiming key',workerX+29,y+3,32,amber);
    } else if (i===1 && request>0) {
      const route = [[workerRight+13,y],[bendX,y],[bendX,waitingY],[stopX,waitingY]];
      const color = conflict ? '#ecad95' : requestColor;
      line(c,route.flat(),color,5);
      if (request<1) traceDot(c,route,request,color,amber);
      else {
        ellipse(c,stopX,waitingY,11,11,color);
        line(c,[slotX-10,waitingY-16,slotX-10,waitingY+16],color,5);
      }
      const action = conflict ? 'Insert conflict' : request===1 ? 'Waiting for A' : 'Requesting key';
      mono(c,action,workerX+29,y+3,32,conflict?rust:amber);
    } else {
      const stale = !atomic && i===1 && replies[0];
      const status = stale ? 'Earlier lookup: empty' : looked[i] ? 'Lookup returned empty' : 'Lookup pending';
      mono(c,status,workerX+29,y+3,32,stale?amber:muted);
      if (looked[i]) {
        c.save();c.setLineDash([10,10]);
        line(c,[workerRight+13,y,storeX-19,y],lookupColor,4);
        c.restore();
        tip(c,storeX-13,y,0,lookupColor);
      }
    }
  }

  for (const [i,y] of rows.entries()) {
    const row = result.rows[i];
    if (row) jobRow(c,slotX,y-31,slotWidth,row.id,row.event);
    else if (i===0 && claim===1) {
      rect(c,slotX,y-31,slotWidth,62,'#f7e7c5',5);
      label(c,'Key held by A',slotX+25,y,32,amber);
      label(c,'Uncommitted',slotX+slotWidth-25,y,29,amber,'right');
    } else {
      c.save();c.setLineDash([8,9]);
      line(c,[slotX,y+31,slotX+slotWidth,y+31],rule,2);
      c.restore();
    }
  }
  label(c,'Stored invoices',slotX,792,32,muted);
  mono(c,String(result.count),slotX+slotWidth,792,44,ink,'right');
  if (atomic) label(c,'Separate writes: '+raceTrace(false).count+' stored invoices',workerX,894,30,'#cfdbd7');
  if (enforcing) label(c,'Unique (shop, event) in invoice transaction',storeX,894,29,'#d3e3d5');
}

function repair(c,k) {
  const alternate = k.beat.beatIndex>=3;
  const starts = [true,on(k,0,'On the first patch'),alternate?on(k,3,'a dependency'):on(k,2,'On the second repair')];
  const results = [
    true,
    after(k,0,'One one two'),
    alternate?after(k,3,'fails to import on attempt two'):after(k,2,'Two rows remain'),
  ];
  const queued = after(k,0,'the retry also queued a write');
  const write = during(k,0,'Let it finish A third row appears for the wheel');
  const rechecked = after(k,2,'assertions pass as well');
  const views = [repairView(0),repairView(1,write===1),repairView(2,true,alternate)];
  const failures = views.slice(1).filter((view,i)=>results[i+1] && view.verdict==='FAIL').length;
  const failureBudget = 3;
  board(c,alternate?'Alternate run  /  same baseline':'Repair log  /  local billing test',
    alternate?'How many repairs failed the assertion?':'What should go back to the worker?');
  const names=['Baseline','Repair 1','Repair 2'];
  for(let i=0;i<3;i++) {
    const x=96+i*589, w=550;
    const v=views[i];
    slip(c,x,320,w,489,starts[i]?paper:'#e2e6dc');
    mono(c,i===0?'BEFORE ANY PATCH':'PATCH + SAME VERIFIER',x+30,369,23,muted);
    serif(c,names[i],x+29,436,51);
    line(c,[x+32,488,x+w-32,488],rule,2);
    if (!results[i]) {
      label(c,starts[i]?'Running verifier':'Awaiting run',x+32,564,35,muted);
      continue;
    }
    if(v.returns.length) {
      label(c,'Replies',x+32,546,27,muted);
      mono(c,v.returns.join('   '),x+176,546,38);
      label(c,'Saved rows',x+32,618,27,muted);
      for(const [j,row] of v.rows.entries()) {
        const left=x+35+j*100;
        rect(c,left,645,87,79,jobs[row.event].tint,5);
        if (i===1 && j===v.rows.length-1 && write===1) rect(c,left,645,5,79,rust,2);
        smallJob(c,row.event,left+23,667,15);
        mono(c,idOf(row.invoice),left+43,667,22,jobs[row.event].color);
        mono(c,jobs[row.event].key,left+44,702,20,jobs[row.event].color,mid);
      }
      mono(c,String(v.rows.length),x+w-33,686,35,ink,'right');
      if (i===1 && queued && write<1) {
        const nextRow = v.rows.length;
        const event = repairView(1).rows[nextRow].event;
        const left = x+383+(35+nextRow*100-383)*write;
        const y = 591+(645-591)*write;
        rect(c,left,y,126,48,jobs[event].tint,5);
        smallJob(c,event,left+22,y+24,16);
        label(c,'Queued',left+46,y+24,23,jobs[event].color);
      }
    } else {
      mono(c,'ImportError',x+32,550,37,rust);
      label(c,'Test never started',x+32,631,34,muted);
    }
    const checking = i===2 && !alternate && !rechecked;
    const verdict = checking ? 'PENDING' : v.verdict;
    const reason = checking ? 'Checking assertions' : i===1 && !queued ? 'Checking stored rows' : v.reason;
    const col = verdict==='FAIL'?rust:verdict==='PASS'?green:amber;
    label(c,verdict,x+32,761,34,col);
    if(v.returns.length) text(c,reason,x+w-26,762,25,muted,'Sans',500,'right',325);
  }
  const answer = !alternate || after(k,4,'One repair','One repair');
  label(c,'Failed repairs after baseline',97,882,34);
  mono(c,answer?failures+' / '+failureBudget:'? / '+failureBudget,681,882,40,failures && answer?rust:ink);
  if (k.beat.beatIndex===1 && after(k,1,'failed count assertion')) {
    const row = views[1].rows.at(-1);
    label(c,`Send row ${idOf(row.invoice)}  ·  Event ${jobs[row.event].key}  ·  Count assertion failed`,
      1830,882,30,rust,'right');
  }
}

function scope(c,k) {
  const b=k.beat.beatIndex;
  if(b>=2) {
    if(on(k,3,'A benchmark')) {
      board(c,'Selecting a worker','What did the benchmark measure?');
      slip(c,105,331,880,488);serif(c,'Repository task set',144,402,51);
      mono(c,b===4?'SWE-bench Verified':'SWE-bench',147,477,38,blue);
      if (b===4) {
        const sample=on(k,4,'hard problems from');
        for(let i=0;i<500;i++) {
          const x=150+(i%50)*15.9,y=540+Math.floor(i/50)*15;
          rect(c,x,y,12,10,sample && i<138?'#a45c31':'#b6c6bf',2);
        }
        label(c,sample?'138 selected for difficulty / 500 tasks':'500 tasks in Verified',145,755,32,sample?amber:ink);
      } else {
        ['Task split and version','Model, scaffold and tools','Attempt budget'].forEach((s,i)=>{
          line(c,[150,559+i*76,213,559+i*76],green,5);
          label(c,s,241,559+i*76,34);
        });
      }
      slip(c,1059,331,748,488);serif(c,'Delivery replies on C',1098,402,51);
      const result=replay(true,3);
      result.deliveries.forEach((d,i)=>jobRow(c,1099,491+i*76,663,d.invoice,d.event));
      label(c,result.count+' invoices stored',1099,765,32,green);
      return;
    }
    board(c,b===2?'Implementation review':'Shared-file ownership',
      b===2?'Where does the retry leave the handler?':'Who owns the combined change?');
    const narrowed=on(k,2,'lookup comes first');
    slip(c,105,320,1120,518);
    mono(c,'billing/webhook.ts',145,387,36,green);
    line(c,[145,438,1184,438],rule,2);
    mono(c,'base',146,500,27,muted);
    mono(c,'return create(event)',147,558,40);
    mono(c,'candidate C',146,651,27,muted);
    if(narrowed) mono(c,'return find(event) ?? create(event)',147,715,39,blue);
    else mono(c,'Inspect the patch',147,715,32,muted);
    if(b===2) {
      label(c,'Repeat of event '+jobs[EVENT].key,1291,407,36);
      const runs=[replay(false,2),replay(true,2)];
      for(const [i,r] of runs.entries()) {
        if(i && !narrowed)continue;
        const y=526+i*177;
        mono(c,i?'CANDIDATE C':'BASE',1295,y,26,muted);
        mono(c,r.deliveries.map(d=>idOf(d.invoice)).join('  →  '),1292,y+65,47,i?green:rust);
      }
    } else {
      label(c,'One writer',1291,410,38,green);mono(c,'webhook.ts',1291,474,31);
      label(c,'Shared inputs',1291,602,38);
      ['Database','Port','Fixture directory'].forEach((s,i)=>label(c,s,1291,669+i*55,32,muted));
    }
    return;
  }
  board(c,'Scope review','Which changes belong to billing?');
  const resolved=on(k,1,'two billing files');
  const paths=resolved?[...owned]:dirtyPaths;
  slip(c,96,319,1030,539);
  serif(c,resolved?'Revised diff':'Candidate diff',132,385,50);
  for(const [i,p] of paths.entries()) {
    const y=477+i*94;
    line(c,[133,y+47,1088,y+47],rule,1.6);
    mono(c,'M',142,y,31,blue);mono(c,p,204,y,39);
    if(resolved)tag(c,875,y-24,190,'Owned',green,'#daead9');
  }
  serif(c,resolved?'Removed from patch':'Owned by the task',1200,384,43);
  const comparison=resolved?dirtyPaths.filter(p=>!owned.has(p)):[...owned];
  comparison.forEach((p,i)=>mono(c,p,1201,490+i*93,32,resolved?rust:green));
  if(resolved && on(k,1,'both ends of renames')) {
    label(c,'Example rename to check',1203,700,29,muted);
    mono(c,'billing/webhook.ts',1203,758,31);
    mono(c,'→  payments/issue.ts',1203,811,31,rust);
  }
}

function snapshot(c,k) {
  const dirty=on(k,0,'working file to two'),extra=on(k,0,'untracked fixture');
  const {index,working,untracked}=workingTree;
  board(c,'Snapshot identity','Which files does tree T describe?');
  const sides=[['Git index','git write-tree'],['Working directory','read by the test']];
  for(const [i,[name,sub]] of sides.entries()) {
    const x=100+i*888;
    rect(c,x,328,826,519,i?'#254855':'#d3dacb',15);
    serif(c,name,x+35,397,49,i?paper:ink);
    mono(c,sub,x+38,465,29,i?'#c2e0d4':muted);
    slip(c,x+39,530,747,125);
    mono(c,'handler.py',x+67,575,30,muted);
    mono(c,'VALUE = '+(i&&dirty?working:index),x+67,624,35,i&&dirty?blue:ink);
    if(i && extra) {
      slip(c,x+39,683,747,105,'#e3efdf');
      mono(c,untracked,x+67,736,32,ink);
      label(c,'untracked',x+756,737,28,green,'right');
    }
    if(!i) {
      mono(c,'Tree T',x+40,741,39,green);
      if(k.beat.beatIndex===1)label(c,'Index unchanged',x+235,740,32,muted);
    }
  }
}

function receipts(c,k) {
  const current = on(k,2,'fresh receipt names C');
  const found = after(k,2,'discovered both tests');
  const newEventRan = after(k,2,'ran the new-event check');
  const retrySkipped = after(k,2,'skipped the retry');
  const revealGap = after(k,3,'The retry. Rerun');
  const rerun = after(k,3,'with verifier K');
  const execution = during(k,3,'both checks execute and pass');
  const ran = execution === 1;
  const countChecked = after(k,3,'includes the stored count');
  on(k,3,'pass The retry test');
  board(c,'Runner receipts','Which run covers candidate C?');
  const samples=[receipt('B'),receipt('C',!ran)];
  for(const [i,r] of samples.entries()) {
    const x=106+i*884;
    if(i&&!current)continue;
    slip(c,x,317,815,535);
    if (i && rerun) label(c,'C rerun · first receipt skipped Same-event replay',x+34,281,24,muted);
    mono(c,'VERIFIER '+r.verifier+'    /    '+r.environment,x+34,371,28,muted);
    serif(c,'Tested source '+r.source,x+33,448,52);
    label(c,'Required test',x+35,533,28,muted);
    label(c,'Found',x+523,533,28,muted,mid);
    label(c,'Result',x+708,533,28,muted,mid);
    r.outcomes.forEach(({test,result},j)=>{
      const y=605+j*74;
      const hasResult = i === 0 || (rerun ? ran : j ? newEventRan : retrySkipped);
      line(c,[x+35,y-36,x+777,y-36],rule,2);
      label(c,test,x+35,y,30);
      if (!i || found) mono(c,r.collected.includes(test)?'YES':'NO',x+523,y,29,ink,mid);
      if (i && rerun) {
        line(c,[x+562,y,x+653,y],rule,3);
        const end = x+562+91*execution;
        line(c,[x+562,y,end,y],green,4);
        ellipse(c,end,y,6,6,green);
      }
      if (hasResult) mono(c,result,x+708,y,30,result==='SKIP'?rust:green,mid);
    });
    if (i && countChecked) label(c,'Replay checks the stored invoice count',x+35,730,24,green);
    if (!i || ran || (revealGap && !rerun)) {
      const verdict=receiptVerdict(r,'C');
      tag(c,x+32,771,372,verdict,verdict==='Checks verified'?green:rust,
        verdict==='Checks verified'?'#d7e7d7':'#f0dad0');
    }
    if (!i || (retrySkipped && !rerun) || ran)
      mono(c,'exit '+r.exit,x+767,796,28,muted,'right');
    else if (rerun)
      mono(c,'running',x+767,796,28,blue,'right');
  }
}

function handoff(c,k) {
  const b=k.beat.beatIndex;
  if(b<=1) {
    const base=Number(on(k,0,'the base send the wheel'))+Number(on(k,0,'repeat it'))+Number(on(k,0,'send the chain wax'));
    const head=Number(on(k,0,'C send the wheel repair'))+Number(on(k,0,'replay the completion'))+Number(on(k,0,'bill the chain wax'));
    replayPair(c,k,'Can the reviewer reproduce the repair?',[base,head],[b===1,b===1]);
    if(b===1)label(c,'Sequential fixture   ·   Real storage concurrency and restart remain open',110,921,30,muted);
    return;
  }
  if(b===2) {
    board(c,'Integration owner','Does the receipt follow the branch?');
    const moved=on(k,2,'advances to D'),target=on(k,2,'target advances too');
    const xs=[352,900,1465], y=528;
    line(c,[xs[0],y,xs[1],y],blue,8);
    for(const [i,name] of ['Base','C','D'].entries()) {
      if(i===2&&!moved)continue;
      if(i===2)line(c,[xs[1]+44,y,xs[2]-45,y],blue,8);
      ellipse(c,xs[i],y,47,47,paper,blue,6);mono(c,name,xs[i],y,31,blue,mid);
    }
    const x=moved?xs[2]:xs[1];
    tag(c,x-127,340,254,'Branch head',blue,'#cfe0ed');
    line(c,[x,389,x,470],blue,3);tip(c,x,478,Math.PI/2,blue);
    slip(c,xs[1]-226,653,452,120);
    label(c,'Receipt K on C',xs[1],716,36,green,mid);line(c,[xs[1],577,xs[1],650],green,3);
    tag(c,120,813,311,'Target   '+(target?'T2':'T1'),ink,'#d7dfcf');
    if(moved)label(c,'Refresh checks and review for D',1083,830,37);
    return;
  }
  const pick=on(k,4,'choose a receipt');
  if(!pick) {
    board(c,'Practice  /  one account','Who shares an invoice?',true);
    const shared=after(k,4,'The first three share invoice one','The first three');
    const other=after(k,4,'The fourth gets invoice two','The fourth');
    const counted=after(k,4,'Two keys leave two rows','Two keys');
    const xs=[315,745,1175,1605],cardY=343;
    for(const [i,key] of practiceKeys.entries()) {
      slip(c,xs[i]-170,cardY,340,179);
      label(c,'Caller '+String.fromCharCode(65+i),xs[i],cardY+49,32,muted,mid);
      mono(c,String(key),xs[i],cardY+114,48,i<3?blue:amber,mid);
      if(i<3?shared:other) {
        const invoice=practice.returned[i],endX=invoice===1?745:1605;
        line(c,[xs[i],cardY+185,xs[i],605,endX,605,endX,687],invoice===1?'#b8d3e6':'#ecc498',5);
      }
    }
    for(const [i,row] of practice.rows.entries()) {
      if(i===0?!shared:!other)continue;
      const x=i===0?745:1605;
      slip(c,x-185,691,370,123,i?'#f6dfbd':'#dbe9f4');
      mono(c,'Invoice #'+row.invoice,x,752,39,i?amber:blue,mid);
    }
    if (on(k,3,'A commits first')) mono(c,'A commits first',100,285,26,'#d2e0db');
    if(counted)label(c,practice.count+' stored rows',100,883,35,paper);
    return;
  }
  board(c,'Practice  /  local patch F','Which receipt goes with the patch?');
  const resolve=after(k,5,'Take the third receipt','third receipt');
  for(const [i,r] of practiceReceipts.entries()) {
    const x=95+i*585, selected=resolve&&matchesF(r);
    slip(c,x,324,540,496,selected?'#deeddb':paper);
    mono(c,'RECEIPT '+(i+1)+'    /    VERIFIER '+r.verifier,x+27,379,26,muted);
    serif(c,'Source '+r.source,x+26,462,54);
    for(const [j,name] of REQUIRED_NAMES.entries()) {
      const y=559+j*65;
      label(c,name,x+26,y,29);
      const pass=r.executed.includes(name.toLowerCase());
      mono(c,pass?'PASS':'SKIP',x+509,y,29,pass?green:rust,'right');
    }
    if(selected)tag(c,x+27,741,485,'Return with F to the owner',green,'#c0dac4');
  }
  if(resolve)label(c,'Local patch and evidence   →   Integration owner',95,890,37,ink);
}
const REQUIRED_NAMES=['Concurrent replay','New event','Stored count'];
function draw(c,k) {
  switch(k.beat.chapterId) {
    case 'c01': return opening(c,k);
    case 'c02': return k.beat.beatIndex<3?trace(c,k):runner(c,k);
    case 'c03': return verifier(c,k);
    case 'c04': return race(c,k);
    case 'c05': return repair(c,k);
    case 'c06': return scope(c,k);
    case 'c07': return k.beat.beatIndex<2?snapshot(c,k):receipts(c,k);
    case 'c08': return handoff(c,k);
    default: throw new Error('Unknown chapter '+k.beat.chapterId);
  }
}

function check() {
  checkEvidence();
  for(const count of [0,1,2,3]) {
    const base=replay(false,count),candidate=replay(true,count);
    assert.deepEqual(base.deliveries.map(d=>d.event),deliveries.slice(0,count));
    assert.deepEqual(candidate.deliveries.map(d=>d.event),deliveries.slice(0,count));
    assert.equal(candidate.count,new Set(deliveries.slice(0,count)).size);
    assert.equal(base.count,count);
  }
  const outside=dirtyPaths.filter(p=>!owned.has(p));
  assert.deepEqual(outside,['checkout/PayButton.tsx','pnpm-lock.yaml']);
  assert(!inScope(['billing/webhook.ts','payments/issue.ts']));
  assert.deepEqual(practiceReceipts.map(r=>REQUIRED_NAMES.map(n=>r.executed.includes(n.toLowerCase()))),
    [[true,true,true],[false,true,true],[true,true,true]]);
  return true;
}
export default {title,draw,check};
