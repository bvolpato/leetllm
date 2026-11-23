import { C,rect,line,path,dot,txt,mono,title,label,arrow,paper,base,note,codeRow } from './drawing.mjs';
import {cueState,workers,frontier,ttl,graph,schedule,bucket,ledger,ledgerPolicy,locks,lines,parseLines,jobPlan,mergeRecord,checkTraces} from './traces.mjs';

const raceInk = {A:C.teal, B:C.blue};
const setPort = {x:446,y:519};
const networkEdge = 1380;

function workerPointer(g,who,trace,look,insert,release) {
  const direction=who==='A'?-1:1;
  const y=setPort.y+direction*217;
  const color=raceInk[who];
  // Both pointers dock at the same input. After each read, leave the tip
  // just outside the set so the next worker can inspect the same place.
  const read=Object.hasOwn(trace.reads,who);
  const ready=who==='A'?0.52:0.12;
  const reach=(ready+(1-ready)*look)*(1-0.32*release);
  const xTip=237+(setPort.x-237)*reach;
  const yTip=setPort.y+direction*126*(1-reach);
  arrow(g,100,y-direction*44,xTip,yTip,color,8);
  dot(g,87,y,46,color);
  mono(g,who,87,y,47,C.white,'center');
  const adding=insert>0 && trace.status[who]!=='loading';
  const action=adding ? 'add /guide' : read ? (trace.reads[who]?'saw present':'saw empty') : '';
  mono(g,action,153,y,45,color);
}

function requestPacket(g,request,y,motion) {
  const color=raceInk[request.worker];
  const width=380;
  // Dispatch places the nose on the boundary. The whole request then crosses.
  const x=networkEdge-width+(width+53)*motion;
  path(g,[[x,y-52],[x+width-35,y-52],[x+width,y],[x+width-35,y+52],[x,y+52]],color,1,true);
  mono(g,request.worker,x+44,y,49,C.white,'center');
  line(g,x+84,y-32,x+84,y+32,C.white,2);
  mono(g,'GET '+request.page,x+104,y,40,C.white);
}

function race(g,k,s,m) {
  const trace=workers(false,s);
  const beat=k.beat.beatIndex;
  const cue=(phrase,duration)=>k.reveal(phrase,duration);
  const pan=beat===0?0:beat===1?cue('Let them run',1.1):1;
  const slide=pan*pan*(3-2*pan);
  const lookA=beat===0?cue('Worker A looks',0.8):1;
  const lookB=beat===0?cue('Worker B checks',0.8):1;
  const addA=beat===1?cue('A moves first',0.75):Number(beat>1);
  const addB=beat===1?cue('B tries the same spot',0.75):Number(beat>1);
  rect(g,0,0,1920,1080,C.paper);
  g.save();
  g.translate(325*(1-slide),-152*(1-slide));
  const scale=1+0.25*(1-slide);
  g.scale(scale,scale);

  if (pan>0) {
    g.save();
    g.globalAlpha=slide;
    rect(g,networkEdge,214,540,572,C.pale);
    line(g,networkEdge,214,networkEdge,786,C.ink,7);
    title(g,'Network',networkEdge+54,303,67);
    const sent=trace.requests.length;
    txt(g,sent+' sent',networkEdge+54,693,54,{weight:700});
    if (beat===2) txt(g,'Expected 1',networkEdge+54,751,43,{color:C.red});
    g.restore();
  }

  g.beginPath();
  g.roundRect(392,348,592,339,37);
  g.fillStyle=C.dark;
  g.fill();
  txt(g,'Shared set',433,408,50,{color:C.white,weight:600});
  const count=trace.seen.length;
  txt(g,count+(count===1?' entry':' entries'),947,408,44,{color:C.mint,align:'right'});
  const inserting=s===3 || s===4;
  g.beginPath();
  g.roundRect(setPort.x,456,492,126,25);
  g.fillStyle=C.white;
  g.fill();
  if(inserting) {
    g.save();
    g.globalAlpha=1-m;
    g.fillStyle=s===3?C.mint:C.sky;
    g.fill();
    g.restore();
  }
  const contents=count?"{'"+trace.seen.join("', '")+"'}":'set()';
  mono(g,contents,692,setPort.y,73,C.ink,'center');
  mono(g,addA>0?"seen.add('/guide')":"'/guide' in seen",432,635,45,C.mint);
  for (const [worker,look,add,readStep,addStep] of [['A',lookA,addA,1,3],['B',lookB,addB,2,4]]) {
    const atRead=s>=readStep?(s===readStep?m:1):0;
    const atAdd=s>=addStep?(s===addStep?m:1):0;
    workerPointer(g,worker,trace,look,add,atRead*(1-add)+atAdd);
  }

  trace.requests.forEach((request,index)=>{
    const motion=s===5+index?m:1;
    requestPacket(g,request,446+index*142,motion);
  });
  g.restore();

  if(beat===0 && k.elapsed>=k.speechDuration) {
    title(g,'Which steps need one lock?',960,100,75,C.ink,'center');
  }
}

function queue(g,k,s,m) {
  const f=frontier(s);
  base(g,'Crawler   /   link discovery','Which page comes off the front?');
  paper(g,82,305,660,484);
  label(g,'Open document',122,366);
  title(g,f.current,122,453,71,C.teal);
  line(g,124,506,692,506,C.line);
  label(g,'Links in callback order',124,554);
  if(!f.raw.length) mono(g,'(no links)',124,631,32,C.muted);
  f.raw.forEach((url,i)=>{
    mono(g,url,124,625+i*55,32,s>0 && url.startsWith('https:')?C.red:C.ink);
  });
  label(g,'Deque',844,346);mono(g,'front',844,420,27,C.muted);
  line(g,844,453,1818,453,C.ink,3);line(g,844,569,1818,569,C.ink,3);
  f.queue.forEach((url,i)=>{
    const sliding=(s===2||s===4) ? 277*(1-m) : 0;
    const x=858+i*277+sliding;
    rect(g,x,466,253,90,i===0 && s!==3?C.mint:C.white,C.teal);
    mono(g,url,x+126,512,39,C.teal,'center');
  });
  if(!f.queue.length)mono(g,'empty',865,513,38,C.muted);
  label(g,'Claimed',844,641);mono(g,f.seen.join('   '),844,701,32);
  label(g,'Fetched',844,762);mono(g,f.order.join('   '),844,814,32,C.blue);
  note(g,['Origin   https://repo.example     •     Resolve relative links before checking membership.',
    'Drop #auth. The other origin stays out. Preserve a query string when one is present.',
    'The guide has two links. Which one needs a new claim?',
    `Pages queued: ${f.queue.length}     •     Pages fetched: ${f.order.length}`,
    `Fetch ${f.current} from the front. Its link back to /start adds no work.`,
    'One callback per claimed page. The deque is empty.'][s]);
}

function claim(g,k,s,m) {
  const w=workers(true,s);
  base(g,'Crawler   /   shared claim','Where does the lock end?');
  mono(g,'Unlocked run   /guide × 2',1810,98,29,C.muted,'right');
  const x=104,y=377;
  rect(g,82,303,850,495,C.white,C.line);
  label(g,'visit(url)',x+28,340);
  rect(g,x+10,y+10,780,254,C.pale);
  path(g,[[x+14,y+10],[x,y+10],[x,y+263],[x+14,y+263]],C.teal,5);
  const code=['with lock:','    if url in seen:','        return','    seen.add(url)','fetch(url)'];
  const hot=[-1,0,1,3,-1,4,1,2,3,4,-1,-1,-1][s];
  code.forEach((v,i)=>codeRow(g,v,x+35,y+45+i*61,712,i===hot));
  mono(g,'lock   '+(w.owner?'held by '+w.owner:'free'),x+33,739,32,C.teal);
  const laneX=995;
  label(g,'Elapsed network time',laneX,340);
  const plotX=laneX+27,unit=8;
  const times=[0,0,0,0,0,0,6,12,19,24,50,62,80];
  const nextTimes=[0,0,0,0,0,5,11,18,23,45,61,76,80];
  const time=times[s]+(nextTimes[s]-times[s])*m;
  if(w.requests.length){
    for(const ms of [0,20,40,60,80]){
      const xx=plotX+ms*unit;
      line(g,xx,397,xx,619,C.fine);mono(g,ms+' ms',xx,381,24,C.muted,'center');
    }
  }
  w.requests.forEach((r,i)=>{
    const y=492+i*113;
    const color=i?C.blue:C.teal;
    mono(g,r.worker+'   GET '+r.page,laneX,y-38,32,color);
    const end=r.done?(i?50:80):time;
    const startX=plotX+r.start*unit,endX=plotX+end*unit;
    line(g,startX,y,endX,y,color,17);dot(g,endX,y,r.done?12:9,color);
    mono(g,r.done?'200 OK':'in flight',laneX+800,y-38,29,color,'right');
  });
  if(!w.requests.length) {
    line(g,laneX,459,1797,459,C.line);
    mono(g,'0 started',laneX,423,34,C.muted);
  }
  if(s>=1 && s<=8){
    mono(g,'A   '+w.status.A,laneX,657,31,C.teal);
    mono(g,'B   '+w.status.B,laneX+380,657,31,C.blue);
  }
  mono(g,'seen   '+(w.seen.join('   ')||'∅'),laneX,744,35);
  const foot=s>=12?'Stop set   •   /guide returned   •   children published: '+w.published:
    s===11?'Stop set   •   /guide is still in flight.':
    s>=10?'B has a reply for /api. A is still waiting for /guide.':
    s>=8?'B can use the same lock to claim a different URL.':
    s>=6?'The second lookup sees A’s insertion. Only one worker can fetch /guide.':
    s>=4?'The network call sits one indentation level outside the lock.':
    s>=2?'A owns the critical section. B waits before the membership test.':
    'The shaded block is shared by both workers.';
  note(g,foot);
}

function expiry(g,k,s) {
  const t=ttl(s);
  base(g,s>=4?'TTL store   /   compare-and-set replay':'TTL store   /   injected clock',
    s>=4?'May this caller replace a missing value?':'What can a reader see at equality?');
  const cardX=1090;
  if(s>=4)mono(g,'Earlier read   get at 15.000 → None',1795,97,29,C.muted,'right');
  label(g,'Test clock  ·  seconds',104,339);
  rect(g,103,407,823,193,C.dark);
  mono(g,t.now.toFixed(3),513,507,115,C.white,'center');
  const phases=[['write','10.000'],['read','14.999'],['boundary','15.000']];
  phases.forEach(([name,v],i)=>{
    const x=141+i*290,active=v===t.now.toFixed(3);
    line(g,x,650,x+205,650,active?C.teal:C.line,active?9:3);
    mono(g,v,x,700,35,active?C.teal:C.muted);txt(g,name,x,755,32,{color:C.muted});
  });
  paper(g,cardX,327,717,455,t.record?C.white:C.paper);
  label(g,'Record slot',cardX+41,373);
  title(g,'task:1',cardX+41,453,61);
  line(g,cardX+41,512,1755,512,C.line);
  if(t.record) {
    mono(g,t.record.value,cardX+41,590,53,C.teal);
    mono(g,'expires_at   '+(t.record.until??'None'),cardX+41,683,36);
  }else{
    mono(g,'empty',cardX+41,593,48,C.muted);
  }
  const text=s>=4?['Replay at t = 10. Expected value for the next CAS: None.',
    'Lock held   •   compare-and-set expects None at t = 15.',
    'Lock held   •   expired entry removed.','Lock held   •   None matches the empty slot.',
    'Return True   •   replacement stored with no deadline   •   lock released.'][s-4]:
    ['A five-second lifetime begins at the write.','expires_at = write time + lifetime = 10 + 5',
    'get → running      •      14.999 < 15.000',
    'get → None      •      expire when expires_at ≤ now'][s];
  note(g,text);
}

function graphCheck(g,k,s) {
  base(g,'CI scheduler   /   dependency validation','May the independent task run yet?');
  const positions={docs:[1410,516],lint:[430,482],test:[803,647]};
  const colors=s===0?{}:graph.events[s===1?2:3];
  label(g,'Three-state depth-first search',101,338);label(g,'Independent task',1260,338);
  arrow(g,516,457,753,570,C.blue,6);
  arrow(g,719,676,486,555,s>=3?C.red:C.line,s>=3?9:4);
  Object.entries(positions).forEach(([name,[x,y]])=>{
    const active=colors[name]==='active',done=colors[name]==='done';
    dot(g,x,y,89,active?C.mint:done?C.sky:C.white,active?C.teal:C.ink,4);
    mono(g,name,x,y,40,C.ink,'center');
    mono(g,colors[name]??'unseen',x,y+133,30,active?C.teal:C.muted,'center');
  });
  mono(g,'run calls   0',1410,754,39,C.blue,'center');
  note(g,['Each arrow points to a prerequisite. Docs has no prerequisites.',
    'Lint is on the current path. The independent docs node has finished validation.',
    'The active path is lint → test. Follow the next prerequisite.',
    'The edge test → lint returns to an active ancestor.',
    'Cycle rejected. No task executed, including docs.'][s],s>=3?C.red:C.teal);
}

function scheduler(g,k,s) {
  const f=schedule(s);
  base(g,'CI scheduler   /   ready heap','What makes deploy eligible?');
  label(g,'Priority / task',100,326);
  mono(g,'attempt budget   '+f.budget,1805,326,34,C.muted,'right');
  if(s>=5)mono(g,'First run   '+schedule(4).history.join(' → '),426,326,28,C.muted);
  const positions={docs:343,test:893,deploy:1535}, y=540;
  const color={ready:C.blue,retry:C.red,waiting:C.muted,blocked:C.red,failed:C.red,complete:C.teal};
  arrow(g,positions.deploy-112,y,positions.test+112,y,f.unmet?C.muted:C.teal,6,34);
  mono(g,'deploy requires test',1215,y-58,29,C.ink,'center');
  mono(g,'unmet   '+f.unmet,1215,y+58,29,f.unmet?C.muted:C.teal,'center');
  Object.entries(positions).forEach(([name,x],i)=>{
    const state=f.states[name],shade=color[state];
    dot(g,x,y,110,C.white,shade,5);dot(g,x-70,y-80,28,shade);
    mono(g,i+1,x-70,y-80,28,C.white,'center');
    mono(g,name,x,y-16,49,C.ink,'center');mono(g,state,x,y+40,31,shade,'center');
    mono(g,'attempts  '+f.attempts[name],x,y+167,35,C.ink,'center');
  });
  label(g,'Ready heap',104,790);mono(g,f.queue.join('   ')||'empty',342,790,38,C.blue);
  note(g,'Run calls in order    '+(f.history.join('   →   ')||'(none)'));
}

function quota(g,k,s,m) {
  const b=bucket(s,m), left=200,top=344,bottom=773,w=445,unit=(bottom-top)/3;
  base(g,'Rate limiter   /   one bucket per host','Can the next request spend a token?');
  const water=bottom-unit*b.tokens;
  rect(g,left,top,w,bottom-top,C.white);
  if(b.tokens>0)rect(g,left,water,w,bottom-water,C.mint);
  path(g,[[left,top-18],[left,bottom],[left+w,bottom],[left+w,top-18]],C.ink,8);
  line(g,left,water,left+w,water,C.teal,6);
  for(let i=0;i<=3;i++){
    const y=bottom-i*unit;
    line(g,left-25,y,left+28,y,C.ink,3);mono(g,i,left-43,y,31,C.muted,'right');
  }
  g.setLineDash([12,10]);line(g,left+31,bottom-unit,left+w+145,bottom-unit,C.red,4);g.setLineDash([]);
  mono(g,'cost 1',left+w+25,bottom-unit-31,27,C.red);
  label(g,'Balance after the latest operation',903,340);
  title(g,Number(b.tokens.toFixed(2))+(b.tokens===1?' token':' tokens'),905,444,90,C.teal);
  mono(g,'clock    '+b.time.toFixed(2)+' s',911,546,40);
  mono(g,'refill   1 token/s',911,606,40);
  const lasts=b.history.at(-1);
  if(b.verdict){
    rect(g,906,672,880,104,b.verdict==='allow'?C.mint:C.salmon);
    mono(g,'#'+b.history.length+'   '+b.verdict+'   '+(b.verdict==='allow'?'spent 1':'retry in '+b.retry+' s'),934,725,38,
      b.verdict==='allow'?C.teal:C.red);
  }else{
    mono(g,lasts?'refilling  •  no spend':'ready for first request',910,725,37,C.muted);
  }
  note(g,s<4?'Capacity 3    •    Each start costs 1 token.':
    s<=6?'If balance < cost: keep the balance. Estimated wait = (cost − balance) / rate.':
    'When balance ≥ cost, admit and subtract cost. Cap refill at capacity.');
}


function book(g,k,s,m) {
  const l=ledger(s);
  // Give the spoken amount its own subtitle before the receipt comes back.
  if(k.beat.beatIndex===2) k.reveal('one hundred',0);
  base(g,'Credit ledger   /   account A','Which balance goes on the reply?');
  rect(g,89,345,1163,442,C.dark);
  rect(g,107,331,1128,442,C.white,C.line);
  rect(g,121,330,19,443,C.fine);
  label(g,'Successful events',177,384);
  const x=[179,651,939];
  ['Request key','Change','Balance after'].forEach((word,i)=>label(g,word,x[i],460));
  for(let row=0;row<3;row++)line(g,163,497+row*84,1203,497+row*84,C.line);
  l.events.forEach((e,i)=>{
    const y=538+i*84;
    if(s===4 && i===0)rect(g,162,y-34,1042,68,C.mint);
    mono(g,e.key,x[0],y,37);
    mono(g,(e.delta>0?'+':'')+e.delta,x[1],y,39);
    mono(g,e.after,x[2],y,39,C.teal);
  });
  mono(g,'Events   '+l.events.length,176,721,35);
  mono(g,'Current balance   '+l.balance,1203,721,35,C.ink,'right');
  const rx=1300+(s===4?(1-m)*38:0),ry=326,rw=510,rh=455;
  // The serrated edge identifies the returned copy, apart from the bound book.
  const points=[[rx,ry],[rx+rw,ry],[rx+rw,ry+rh]];
  for(let n=0;n<17;n++){
    points.push([rx+rw-30*n-15,ry+rh-13],[rx+rw-30*(n+1),ry+rh]);
  }
  points.push([rx,ry]);
  path(g,points,s===5?C.salmon:C.pale,1,true);path(g,points,C.ink,2);
  label(g,s>=3?'Incoming replay':'Request',rx+34,ry+47);
  mono(g,l.key??'waiting',rx+34,ry+120,38);
  if(l.delta!==null)mono(g,'A    '+(l.delta>0?'+':'')+l.delta,rx+34,ry+182,35);
  g.setLineDash([11,10]);line(g,rx+17,ry+239,rx+rw-17,ry+239,C.muted);g.setLineDash([]);
  label(g,'Reply',rx+34,ry+289);
  title(g,l.reply??'?',rx+34,ry+363,s===5?63:78,s===5?C.red:C.teal);
  note(g,['A successful key stores the operation and its balance after posting.',
    'The first receipt belongs to deposit-1.',
    'The withdrawal has its own key and its own balance after posting.',
    'The client repeats deposit-1. Which event owns its reply?',
    'Same key, account and amount. Copy the first result. Leave both entries in place.',
    'Same key, different amount. Reject the call and keep both entries.'][s],s===5?C.red:C.teal);
}

function remembered(g,k,s) {
  const state=ledgerPolicy(s);
  base(g,'Credit ledger   /   success-only cache','Can a rejected withdrawal use its key again?');
  label(g,'Keys with successful receipts',99,328);
  label(g,'Amount',574,328);label(g,'Saved result',811,328);
  state.events.forEach((e,i)=>{
    const y=417+i*85;
    if(state.call?.key===e.key)rect(g,83,y-37,997,74,C.mint);
    mono(g,e.key,103,y,39);
    mono(g,(e.delta>0?'+':'')+e.delta,574,y,39);mono(g,e.after,811,y,39);
    line(g,83,y+43,1080,y+43,C.line);
  });
  mono(g,'Balance   '+state.balance,102,783,37,C.teal);
  mono(g,'Events   '+state.events.length,747,783,37,C.teal);
  paper(g,1170,323,630,439);
  label(g,'Account A  /  incoming call',1210,376);
  mono(g,state.call?.key??'waiting',1210,459,44);
  if(state.call)mono(g,'change   '+(state.call.delta>0?'+':'')+state.call.delta,1210,534,34);
  line(g,1210,598,1755,598,C.line);
  mono(g,state.reply??'awaiting decision',1210,672,39,typeof state.reply==='string'?C.red:C.teal);
  note(g,['Carry both successful events into the next call.',
    'Compare this payload with the saved operation.',
    'The stored deposit was +100. The proposed +200 conflicts.',
    'This is a fresh key. The balance is 70 and the request would spend 80.',
    'Which receipt, if any, belongs to this request key?',
    'A new deposit makes 90 available.',
    'Same withdrawal, same key, new available balance.',
    'The successful withdrawal now owns a receipt. Commit the key, event and balance together.'][s]);
}

function accountLocks(g,k,s,motion) {
  const l=locks(s);
  const arrived=locks(Math.max(0,s-1));
  base(g,'Transfers   /   ordered account locks','What gets released if C is missing?');
  mono(g,'Requested   '+l.request.join(', '),105,318,38);
  mono(g,s>=1?'Acquisition order   '+l.order.join(' → '):'Acquisition order   ?',106,375,38,C.teal);
  const cards=[
    {x:105,w:446,title:'Shared registry'},
    {x:685,w:509,title:'ExitStack  /  top first'},
    {x:1331,w:482,title:'Released, in order'},
  ];
  for(const card of cards){
    paper(g,card.x,441,card.w,371);
    label(g,card.title,card.x+29,492);
    line(g,card.x+29,522,card.x+card.w-29,522,C.line);
  }
  for(const [i,name] of l.order.entries()){
    const y=580+79*i, missing=l.missing===name;
    mono(g,name,152,y,43,missing?C.red:C.ink);
    mono(g,missing?'KeyError':name==='C'?'lookup pending':'registered',241,y,36,
      missing?C.red:C.muted);
  }
  const rackY=name=>name==='B'?580:712;
  for(const y of [580,712]){
    line(g,730,y+44,1148,y+44,C.line,3);
    line(g,1376,y+44,1768,y+44,C.line,3);
  }
  const position=(state,name)=>state.held.includes(name)
    ? [940,rackY(name)]
    : state.released.includes(name)
      ? [1572,580+132*state.released.indexOf(name)]
      : [490,580+79*state.order.indexOf(name)];
  for(const name of l.order.slice(0,2)){
    const [fromX,fromY]=position(arrived,name),[toX,toY]=position(l,name);
    const moving=fromX!==toX && motion<1;
    if(!moving && !l.held.includes(name) && !l.released.includes(name))continue;
    const t=motion*motion*(3-2*motion),x=fromX+(toX-fromX)*t,y=fromY+(toY-fromY)*t;
    const color=name==='A'?C.teal:C.blue;
    if(moving)arrow(g,fromX,fromY,toX,toY,C.line,4);
    rect(g,x-56,y-35,112,71,name==='A'?C.mint:C.white,color,4);
    mono(g,name,x,y+12,44,color,'center');
  }
  mono(g,s<4?'The transfer body has not started.':'The transfer body never ran.',
    105,868,34,s<4?C.muted:C.red);
}
function parser(g,k,s) {
  const p=parseLines(lines.slice(0,s));
  base(g,'Log parser   /   multiline records','Who owns the indented line?');
  paper(g,83,315,886,489);
  label(g,'Input lines',123,363);
  lines.forEach((v,i)=>{
    const y=435+i*61;
    if(s===i+1)rect(g,108,y-27,822,54,C.mint);
    mono(g,String(i+1),135,y,29,C.muted);
    mono(g,v.replace(/^  /,'··'),215,y,37,i+1>s?C.muted:C.ink);
  });
  label(g,'Accepted messages',1062,365);
  if(!p.records.length)mono(g,'(none)',1062,477,39,C.muted);
  p.records.forEach((v,i)=>{
    const y=492+i*121;
    line(g,1062,y+52,1794,y+52,C.line);
    mono(g,v,1062,y,39,C.ink);
    if(i===p.current)dot(g,1778,y,12,C.teal);
  });
  mono(g,'current   '+(p.current===null?'None':'record '+(p.current+1)),1062,744,38,C.teal);
  note(g,['Two leading dots on the input mark two spaces.',
    'An indented line needs a current record. The orphan has none.',
    'Split the header twice. Keep the remaining bar in the message.',
    'The continuation extends record 1.',
    'The malformed header cleared current. Does the next line still have an owner?',
    `“${lines[4].trim()}” has no current record. The first message stays intact.`,
    `The last header adds “done”. Both “${lines[0].trim()}” and “${lines[4].trim()}” arrived with current set to None.`][s]);
}

function transfer(g,s) {
  const {parent,result,workerCopy}=mergeRecord(s);
  label(g,'Parent dictionary',108,350);label(g,'Isolated worker',1148,350);
  paper(g,100,400,635,337);paper(g,1135,400,650,337);
  mono(g,'counts',148,471,37,C.muted);
  mono(g,JSON.stringify(parent).replaceAll('"',"'").replace(':',': '),147,572,56,C.teal);
  if(workerCopy){
    mono(g,workerCopy.id,1177,476,39,C.teal);
    mono(g,workerCopy.message,1177,554,39);
    if(result)mono(g,'word count   '+result.words,1177,649,34,C.blue);
    arrow(g,754,480,1110,480,C.teal,6);
    mono(g,'record',929,431,30,C.teal,'center');
  }
  if(s>=8){
    arrow(g,1110,642,754,642,C.blue,6);mono(g,'('+result.id+', '+result.words+')',927,601,29,C.blue,'center');
  }
  note(g,s<7?'Use a complete record as the unit of work.':
    s===7?'An importable worker function receives its own copy of the record.':
    s===8?'The worker has returned a result. The parent dictionary is still empty.':
    'The parent merges the returned count under the original job ID.');
}

function timing(g,k,s,m) {
  if (k.beat.beatIndex === 2) {
    base(g,'Parallel parsing   /   ownership','Who updates the parent’s count?');
    transfer(g,s);
    return;
  }

  const fresh = k.beat.beatIndex >= 3;
  const jobs = fresh ? 3 : 2;
  const wait = fresh ? 4 : 3;
  const cpu = fresh ? 0.5 : 1;
  base(g,fresh?'Timing exercise   /   three jobs':'Runtime choice   /   two jobs',
    fresh?'What are the two finish times?':'How much of the wait can overlap?');
  const serial = jobPlan(jobs,wait,cpu,false);
  const overlap = jobPlan(jobs,wait,cpu,true);
  const serialEnd = serial.at(-1).end;
  const overlapEnd = overlap.at(-1).end;
  const serialVisible = fresh ? s >= 11 : s >= 1;
  const showSerialTotal = fresh || s >= 2;
  const waitsVisible = fresh ? s >= 12 : s >= 3;
  const waitsMoving = fresh ? s === 12 : s === 3;
  const slide = waitsMoving ? m * m * (3 - 2 * m) : 1;
  let parsesVisible = s >= 6 ? jobs : Number(s >= 4);
  if (fresh) parsesVisible = s < 13 ? 0 : Math.min(jobs,1 + Math.floor(m * jobs));
  const showTotal = fresh ? s >= 13 && m === 1 : s >= 6;

  const x0 = 480, span = 1300, scale = span / serialEnd;
  const serialY = 405, waitsY = 535, rowGap = 57, laneY = 729, axisY = 796, barHeight = 48;
  const xAt = seconds => x0 + seconds * scale;
  const ids = ['A','B','C'];
  function segment(start,end,y,kind,id) {
    const x = xAt(start);
    const width = (end - start) * scale;
    rect(g,x,y,width,barHeight,kind === 'wait' ? C.sky : C.teal,C.paper,2);
    mono(g,id,x+width/2,y+barHeight/2,32,kind === 'wait' ? C.blue : C.white,'center');
  }

  label(g,'Each job',94,326);
  mono(g,wait+' s wait   +   '+cpu+' s Python',276,326,37);
  if (!serialVisible) {
    label(g,'Unplaced jobs',94,429);
    const slotWidth = span / jobs;
    const width = slotWidth - 72;
    const waitWidth = width * wait / (wait + cpu);
    serial.forEach((_,i) => {
      const x = x0 + i * slotWidth;
      rect(g,x,serialY,waitWidth,barHeight,C.sky);
      rect(g,x+waitWidth,serialY,width-waitWidth,barHeight,C.teal);
      mono(g,'Job '+ids[i],x+23,serialY+barHeight/2,36,C.blue);
    });
    note(g,'Use one Python lane. Assume startup, transfer and merge take 0 s.');
    return;
  }

  const rulerEnd = showSerialTotal ? serialEnd : serial.at(-1).parse;
  for (let seconds = 0; seconds <= rulerEnd; seconds += 2) {
    const x = xAt(seconds);
    line(g,x,serialY,x,axisY,C.fine,2);
    mono(g,seconds+' s',x,axisY+26,30,C.muted,'center');
  }
  line(g,x0,axisY,xAt(rulerEnd),axisY,C.line,3);
  label(g,'Serial',94,serialY+barHeight/2);
  serial.forEach(({start,available,parse,end},i) => {
    segment(start,available,serialY,'wait',ids[i]);
    if (showSerialTotal || i < jobs - 1) segment(parse,end,serialY,'cpu',ids[i]);
  });
  if (showSerialTotal) mono(g,serialEnd+' s',xAt(serialEnd),serialY-26,38,C.teal,'right');

  label(g,waitsVisible && slide < 1 ? 'Align the waits' : 'Overlapped waits',94,485);
  if (waitsVisible) {
    const readyX = xAt(overlap[0].available);
    if (slide === 1) {
      line(g,readyX,516,readyX,laneY+barHeight,C.blue,4);
      mono(g,'Inputs ready at '+overlap[0].available+' s',readyX+19,490,34,C.blue);
    }
    overlap.forEach(({start,available},i) => {
      const displacement = (serial[i].start - start) * (1 - slide);
      const y = waitsY + i * rowGap;
      segment(start+displacement,available+displacement,y,'wait',ids[i]);
    });
    label(g,'One Python lane',94,laneY+barHeight/2,C.teal);
    if (slide === 1) rect(g,readyX,laneY,xAt(serialEnd)-readyX,barHeight,C.pale);
    overlap.slice(0,parsesVisible).forEach(({parse,end},i) => {
      segment(parse,end,laneY,'cpu',ids[i]);
    });
    if (!fresh && s === 5) mono(g,'B next',xAt(overlap[1].parse)+14,laneY+barHeight/2,32,C.teal);
    if (showTotal) mono(g,overlapEnd+' s',xAt(overlapEnd)+27,laneY+barHeight/2,38,C.teal);
  }
  note(g,showTotal ?
    'Serial  '+jobs+' × ('+wait+' + '+cpu+') = '+serialEnd+' s    •    Overlap  '+wait+' + '+jobs+' × '+cpu+' = '+overlapEnd+' s' :
    'Blue spans are network waits. Green spans use the Python lane. Overhead is 0 s.');
}

const painters={c01:race,c02:queue,c03:claim,c04:expiry,'c05-graph':graphCheck,c05:scheduler,c06:quota,
  c07:book,'c07-keys':remembered,'c07-lock':accountLocks,'c08-parser':parser,c08:timing};
export default {
  title:'Python systems: preserve the transition as requirements grow',
  draw(ctx,clock){
    const {step,motion}=cueState(clock);
    painters[clock.beat.chapterId](ctx,clock,step,motion);
  },
  check:checkTraces,
};
