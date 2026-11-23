import { drawReceiptOpening } from './receipt-opening.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Small, retained inputs make the illustrated requests reproducible.
const question = 'What is the return window?';
const documentId = 'DOC-12';
const policy = 'Returns are accepted within 30 days of delivery.';
const labInputs = [
  { name: 'Run A', run: 'aaeed0e2', trace: '7646ca20', key: question },
  { name: 'Run B', run: '7298d79b', trace: 'ce366980', key: question.slice(0, -1) },
  { name: 'Replay of B', run: 'c5571b3f', trace: 'bc25a9af', key: question },
];
function answer(input) {
  const retrieved = input.key === question ? [documentId] : [];
  return { ...input, retrieved, reply: '30 days', citations: [...retrieved] };
}
const replies = labInputs.map(answer);
const incident = [
  { name: 'T103', prompt: 17, index: 8, model: 'M3', citation: 'DOC-12' },
  { name: 'T104', prompt: 18, index: 9, model: 'M3', citation: '[ ]' },
];
const promptReplay = { ...incident[0], name: 'Replay of T103', prompt: incident[1].prompt, citation: 'Measure' };
const direct = { run: 'R8', uri: 'U1', route: ['Worker', 'Object store'], principal: 'Worker' };
const proxied = { run: 'New run', uri: 'U2', route: ['Worker', 'Tracking server', 'Object store'], principal: 'Tracking server' };
const canRead = (location, grants) => grants.includes(location.principal);
function editRun(attemptedK, tag) {
  const previous = { k: 40, tag: 'pending' };
  return { k: previous.k, tag, rejected: attemptedK !== previous.k };
}
const run = { commit: '8b2f9e1', snapshot: 'eval-08-01', prompt: 17, run: 'R8', model: 'M3', registry: 3 };
const sequences = [
  { root: 1420, children: [[0,145], [145,255], [255,1385]], names: ['Retrieval','Reranking','Generation'], nested: [275,1255], validation:[1255,1360], owner: 2 },
  { root: 800, children: [[0,300], [200,650]], names: ['Child A','Child B'], nested: [250,550], owner: 1 },
];
function coverageAt(trace, time) {
  let covered = 0, end = 0;
  for (const [a,b] of trace.children) {
    const until = Math.min(b, time);
    covered += Math.max(0, until - Math.max(a, end));
    end = Math.max(end, b);
  }
  return { elapsed: time, covered, outside: time - covered };
}
const selected = [4,12,18,21,24,31,36,40];
const packed = [4,18,21];
const packedReplay = [...packed,12];
const cases = ['A','B','C'];
const allowed = [documentId];
const valid = (ids, expected) => ids.length > 0 && ids.every(id => expected.includes(id));
const labScores = [[],['DOC-99'],[documentId]].map((ids,i) => ({ id:cases[i], ids, pass:valid(ids,allowed) }));
const passing = id => ({ id, ids:[documentId], pass:valid([documentId], allowed) });
function assess(rows) {
  const joined = cases.map(id => rows.find(row => row.id === id));
  const observed = joined.filter(Boolean);
  return { joined, observed:observed.length, passes:observed.filter(row=>row.pass).length,
    ready:joined.every(row => row?.pass === true) };
}
const initialScores = assess(labScores);
const candidateArrivals = ['C', 'A', 'B'].map(passing);
const partialScores = assess(candidateArrivals.slice(0, 2));
const allScores = assess(candidateArrivals);
const expectationSnapshots = [[documentId], ['DOC-99']];
const supportTraces = Array.from({length: 8}, (_, i) => ({id: i + 1}));
const groundednessResults = [2, 4, 6].map(id => ({id, pass: true}));

function sampleSupportTraces(select, judging, received) {
  const rows = supportTraces.map(trace => {
    const sampled = select && trace.id % 2 === 0;
    const score = sampled && judging ? received.find(row => row.id === trace.id) : undefined;
    return {...trace, sampled, score};
  });
  const scores = rows.flatMap(row => row.score ? [row.score] : []);
  return {rows, selected: rows.filter(row => row.sampled).length, scored: scores.length,
    passes: scores.filter(score => score.pass).length};
}
function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
const settings = (version, temperature) => Object.freeze({ version, model:'M3', temperature,
  text:version === 17 ? 'Cite retrieved docs.' : 'Cite retrieved docs. Refuse if none.' });
const v17 = settings(17,0.2), v18 = settings(18,0.2), warmer = settings(18,0.8);
function capture(id, prompt, tick) { return { id, question, ...prompt, tick }; }
// Keep snapshots of reads. An alias edit writes the registry and a load replaces only the worker copy.
function cacheSequence() {
  let alias = 17, worker = v17, candidate = v18, expiry = 3;
  const receipts = [], states = [];
  const snapshot = () => states.push({ alias, worker, candidate, expiry, receipts:[...receipts] });
  const load = (tick, force = false) => {
    if (force || tick >= expiry) {
      worker = alias === 17 ? v17 : candidate;
      expiry = tick + 3;
    }
  };
  snapshot();
  alias = 18; snapshot();
  load(2); receipts.push(capture('R1',worker,2)); snapshot();
  load(3); snapshot();
  receipts.push(capture('R2',worker,3)); snapshot();
  candidate = warmer; snapshot();
  load(4,true); snapshot();
  receipts.push(capture('R3',worker,4)); snapshot();
  return states;
}
const cache = cacheSequence();
const attempts = [{ name:'A', status:'Timed out' }, { name:'B', status:'Served', model:'B1' }];
function exportFields(scrub) {
  const exception = { attemptA:attempts[0].status, 'error.request_body':'[private fixture]' };
  if (scrub) delete exception['error.request_body'];
  const served=attempts.find(a => a.status === 'Served');
  return {...exception, responder:served.name, model:served.model};
}
function queueEvents() {
  const waiting=['A'], sent=[], lost=[], states=[];
  const record = () => states.push({waiting:[...waiting],sent:[...sent],lost:[...lost]});
  record(); sent.push(waiting.shift()); record();
  for(const incoming of ['B','C','D']) { (waiting.length < 2 ? waiting : lost).push(incoming); record(); }
  return states;
}
const queue = queueEvents();
const indexes = { I7:[[documentId,policy]], I8:[[documentId,policy],['DOC-18','Keep the receipt for an exchange.']] };
const evaluatedModel = 'M3:weights=A;flavor=pyfunc;env=locked';
const models = [evaluatedModel, evaluatedModel.replace('weights=A','weights=B')].map(bytes => ({
  bytes, weights:bytes.split(';')[0].split('=')[1], digest:sha(bytes), registry:3, reply:'30 days',
}));
function liveTrace(id, worker, index, bytes=evaluatedModel) {
  const input = { prompt:v18, modelDigest:sha(bytes), index, indexDigest:sha(JSON.stringify(indexes[index])) };
  const source = indexes[index].find(([doc])=>doc === documentId);
  return { id, worker, index, config:sha(JSON.stringify(input)), artifact:input.modelDigest, reply:'30 days', citation:source[0], text:source[1] };
}
const evaluated = liveTrace('eval','Evaluated','I8');
const live = [liveTrace('T106','East','I8'), liveTrace('T107','West','I7'), liveTrace('T108','West replay','I8')];
const same = trace => trace.config === evaluated.config && trace.artifact === evaluated.artifact;
const releasable = (trace,scores) => same(trace) && scores.ready;

const colors = { bg:'#f4f0e5', white:'#fffdf6', ink:'#192e33', muted:'#506263', line:'#a8b2a8', teal:'#046b65',
  mint:'#d5e8da', rust:'#a3472d', sand:'#f2d5ae', night:'#162c33', light:'#f7f3e7', fog:'#afc8c4', aqua:'#83d0c2', gold:'#efb96e' };
const {bg,white,ink,muted,line,teal,mint,rust,sand,night,light,fog,aqua,gold}=colors;
const mono='Lesson Mono', sans='Lesson Sans', serif='Lesson Serif';
function rect(c,x,y,w,h,color) { c.fillStyle=color; c.fillRect(x,y,w,h); }
function stroke(c,pts,color=line,width=3,dash=[]) {
  c.save(); c.beginPath(); c.moveTo(...pts[0]);
  for(const pt of pts.slice(1)) c.lineTo(...pt);
  c.strokeStyle=color; c.lineWidth=width; c.lineJoin='round'; c.setLineDash(dash); c.stroke(); c.restore();
}
function shape(c,pts,color) {
  c.beginPath(); c.moveTo(...pts[0]); for(const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.fillStyle=color; c.fill();
}
function circle(c,x,y,r,color) { c.beginPath(); c.arc(x,y,r,0,2*Math.PI); c.fillStyle=color; c.fill(); }
function text(c,s,x,y,size=40,color=ink,family=sans,weight=400,align='left') {
  c.font=weight+' '+size+'px "'+family+'"'; c.fillStyle=color; c.textAlign=align; c.fillText(String(s),x,y); c.textAlign='left';
}
function header(c,section,title,dark=false) {
  rect(c,0,0,1920,1080,dark?night:bg);
  text(c,'MLflow',82,70,34,dark?aqua:teal,sans,700);
  stroke(c,[[225,38],[210,74]],dark?fog:line,2);
  text(c,section,254,69,33,dark?fog:muted);
  text(c,title,80,184,79,dark?light:ink,serif);
  stroke(c,[[82,223],[1838,223]],dark?'#476268':line,2);
}
function foot(c,label,dark=false) {
  stroke(c,[[82,922],[1838,922]],dark?'#476268':line,2);
  text(c,label,84,991,42,dark?light:ink,serif);
}
function file(c,x,y,w,h,color=teal,fold=26) {
  shape(c,[[x,y],[x+w-fold,y],[x+w,y+fold],[x+w,y+h],[x,y+h]],color);
  shape(c,[[x+w-fold,y],[x+w,y+fold],[x+w-fold,y+fold]],color===teal?'#83c3ad':'#b1baae');
}
function doc(c,ids,x,y,scale=1) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  text(c,'[',0,64,65,muted,mono);
  if(ids.length) {
    file(c,46,0,218,82,teal,19); text(c,ids.join(', '),62,55,42,white,mono);
  }
  text(c,']',ids.length?278:58,64,65,muted,mono); c.restore();
}
function prog(k,b,words,duration=.45) { return k.beat.beatIndex<b?0:k.beat.beatIndex>b?1:k.reveal(words,duration); }
function on(k,b,words) { return prog(k,b,words,0)===1; }
function result(k,b,after) { return on(k,b,after); }
function after(k,beatIndex,phrase) {
  if (k.beat.beatIndex !== beatIndex) return k.beat.beatIndex > beatIndex;
  k.reveal(phrase, 0, { captionStart: phrase });
  return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
}
function cells(c,headers,rows,xs,top,gap=95) {
  headers.forEach((h,i)=>text(c,h,xs[i],top,30,muted));
  rows.forEach((row,r)=>{
    const y=top+gap*(r+1);
    stroke(c,[[xs[0],y+22],[1832,y+22]],line,1.5);
    row.forEach((s,i)=>text(c,s,xs[i],y,39,ink,i?mono:sans));
  });
}

function paintReplies(c,k) {
  if (k.beat.beatIndex < 2 || (k.beat.beatIndex === 2 && !on(k,2,'Start a fresh run'))) {
    drawReceiptOpening(c, k, replies);
    return;
  }
  const b=k.beat.beatIndex;
  if(b>=4){
    header(c,'Release example  /  controlled replay','Which index isolates the prompt change?');
    text(c,'Same question   ·   commit 8b2f9e1   ·   model M3',84,307,38,teal,mono);
    const reveal=result(k,5,'Keep the model');
    const rows=incident.map(r=>[r.name,'v'+r.prompt,'I'+r.index,r.citation]);
    rows.push([promptReplay.name,'v'+promptReplay.prompt,reveal?'I'+promptReplay.index:'?',reveal?promptReplay.citation:'…']);
    cells(c,['Request','Prompt','Index','Citation'],rows,[100,644,1000,1370],420,123);
    foot(c,reveal?'Compare the new result with T103.':'Choose the index relative to T103.'); return;
  }
  const zoom=prog(k,1,'Look all the way',.9);
  const replayMode=on(k,2,'Start a fresh run');
  const repair=on(k,2,'Restore just');
  const returned=result(k,3,'Look underneath');
  const pair=replayMode?[replies[1],replies[2]]:[replies[0],replies[1]];
  header(c,'Local SDK lab  /  commit 86c3c902',replayMode?'Replay the return question':'Which request lost its source?');
  pair.forEach((r,i)=>{
    const x=82+i*900;
    rect(c,x,267,855,602,i? '#e7e8df':white);
    const pending=replayMode&&i===1&&!returned;
    text(c,r.name,x+48,352,54,ink,serif);
    text(c,pending?'new request':zoom>0?'trace '+r.trace:'run '+r.run,x+800,349,30,muted,mono,400,'right');
    stroke(c,[[x+48,386],[x+808,386]],line,2);
    if(zoom>0){
      const key=pending&&!repair?replies[1].key:r.key;
      text(c,'retrieve(question)',x+48,453,33,teal,mono);
      text(c,'What is the return',x+48,524,46,ink,serif);
      text(c,'window',x+48,652,116,ink,serif);
      // A fixed empty character cell makes an absent final byte visible.
      const size=100+32*zoom; rect(c,x+495,536,size,size, key.endsWith('?')?sand:'#d4dad0');
      if(key.endsWith('?')) text(c,'?',x+495+size/2,536+size*.82,size, rust,serif,400,'center');
      stroke(c,[[x+48,694],[x+805,694]],line,2);
      if(!pending) {
        text(c,replayMode?r.reply:'Retrieved',x+48,813,replayMode?65:47,ink,serif);
        doc(c,r.citations,x+391,744,.89);
      } else text(c,'Awaiting retrieval',x+48,810,38,muted);
    } else {
      text(c,r.reply,x+43,585,137,ink,serif);
      text(c,'Citations',x+50,694,36,muted);
      doc(c,r.citations,x+46,729);
    }
  });
  const selected=on(k,1,'In this local lab');
  foot(c,returned?'The same answer now has a source.':replayMode?'Run B stays in view. Predict the replay’s citations.':selected?'Open B’s retrieval span and compare its input with A’s.':'Which request would you replay to investigate the missing citation?');
}

function packet(c,points,t,color) {
  if(t<=0||t>=1)return;
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let d=t*lengths.reduce((a,b)=>a+b,0);
  for(const [i,length] of lengths.entries()) {
    if(d<=length){const f=d/length; const [x,y]=points[i], [u,v]=points[i+1]; file(c,x+(u-x)*f-18,y+(v-y)*f-17,36,34,color,8);return;} d-=length;
  }
}
function disk(c,x,y,color) {
  rect(c,x-67,y,134,56,color); c.fillStyle=color;
  for(const dy of [0,56]){c.beginPath(); c.ellipse(x,y+dy,67,20,0,0,2*Math.PI); c.fill();}
  c.strokeStyle=white; c.lineWidth=2; c.beginPath(); c.ellipse(x,y,62,15,0,0,2*Math.PI);c.stroke();
}
function paintStores(c,k) {
  const b=k.beat.beatIndex;
  header(c,'Storage  /  checkpoint download','Follow the recorded location');
  const worker=[275,552], server=[960,552], object=[1645,552];
  // Separate the direct lane from the server on the diagram.
  const oldPath=[[1707,608],[1707,755],[275,755],[275,636]];
  const newPath=[[1545,552],[1062,552],[850,552],[380,552]];
  const showOld=on(k,1,'Its experiment recorded'), showNew=on(k,2,'Its checkpoint comes');
  stroke(c,[[1034,515],[1228,515],[1228,352],[1485,352]],muted,3,[8,9]);
  stroke(c,[[275,595],[275,628],[782,628],[782,552],[862,552]],muted,3,[8,9]);
  text(c,'SQL backend',1525,348,34,ink); text(c,'4 kB  /  run metadata',1525,396,25,muted,mono);
  if(showOld) stroke(c,oldPath,teal,6);
  if(showNew) stroke(c,newPath,rust,6);
  for(const [i,[x,y]] of [worker,server,object].entries()){
    if(i===0) {rect(c,x-70,y-44,140,81,ink);rect(c,x-60,y-35,120,57,mint);stroke(c,[[x-86,y+49],[x+86,y+49]],ink,10);}
    if(i===1) {for(let n=0;n<3;n++){rect(c,x-74,y-51+34*n,148,28,ink);circle(c,x+51,y-37+34*n,5,mint);}}
    if(i===2)disk(c,x,y-26,teal);
    text(c,[direct.route[0],proxied.route[1],direct.route[1]][i],x,y-94,42,ink,sans,600,'center');
  }
  text(c,'2 GB checkpoint',1543,678,29,teal,mono,400,'center');
  if(showOld){
    text(c,'R8  /  U1  /  direct',770,817,37,teal,mono);
    packet(c,oldPath,prog(k,1,'The worker reads',1.7),teal);
  }
  if(showNew){
    text(c,'New run  /  U2  /  proxy',402,523,27,rust,mono);
    packet(c,newPath,prog(k,2,'Its checkpoint comes',1.8),rust);
  }
  const revoked=on(k,3,'The worker loses');
  if(revoked){text(c,'Storage grant removed',112,860,28,rust);text(c,'Scoped server grant',836,628,28,muted);}
  const denied=result(k,4,'Its recorded route');
  if(denied&&!canRead(direct,[proxied.principal])) {circle(c,465,755,25,rust);stroke(c,[[454,755],[476,755]],white,5);}
  foot(c,denied?'U1 denies the direct read. Authorize the worker at the recorded location.':revoked?'Can the server’s grant authorize the old U1 download?':showNew?'Proxy reads use the server’s storage role.':showOld?'Direct reads use the worker’s storage grant.':'Small searchable records and large files share a run ID.');
}

function paintLineage(c,k) {
  const b=k.beat.beatIndex;
  if(b>=5){
    const opened=on(k,5,'In this miniature file');
    result(k,6,'Compare the full');
    const proof = (first, last = first) => {
      if(k.beat.beatIndex !== 6) return Number(k.beat.beatIndex > 6);
      const start = k.wordCue(first).start;
      return k.reveal(first,k.wordCue(last).end-start,{captionStart:false});
    };
    const comparisons = [
      proof('The first worker matches the evaluated bytes'),
      proof('Compare the full package digests','The second differs'),
    ];
    header(c,'Model package  /  registry v3','Which worker loaded the evaluated bytes?');
    text(c,'Evaluated package',90,304,36,muted);
    text(c,'SHA-256    '+models[0].digest.slice(0,14)+'…',504,304,41,teal,mono);
    text(c,'Digest labels show prefixes.',1819,304,30,muted,sans,400,'right');
    models.forEach((m,i)=>{
      const x=85+900*i;
      const p=comparisons[i];
      const matches=m.digest===models[0].digest;
      const color=matches?teal:rust;
      file(c,x,353,844,321,ink,43);
      text(c,'Worker '+(i+1)+'    /    registry v'+m.registry,x+43,411,38,white,sans,600);
      text(c,'Sample reply    '+m.reply,x+43,472,39,fog,serif);
      if(opened){
        text(c,'weights = '+m.weights,x+43,548,63,white,mono);
        text(c,'pyfunc  ·  locked environment',x+43,598,31,fog);
        text(c,m.digest.slice(0,14)+'…',x+43,649,42,light,mono);
      }
      if(p>0) {
        const port=x+716;
        const tracer=p===1?color:gold;
        stroke(c,[[port,609],[port,714]],line,3);
        const y=609+105*p;
        stroke(c,[[port,609],[port,y]],tracer,5);
        circle(c,port,y,10,tracer);
        if(p===1){
          rect(c,x+43,721,757,57,matches?mint:'#ecd7c5');
          text(c,matches?'Matches evaluated package':'Package differs',x+421,760,35,color,sans,600,'center');
        }
      }
    });
    stroke(c,[[82,796],[1838,796]],line,2);
    text(c,comparisons[1]===1
      ? 'Reuse worker 1’s evaluation for these bytes. Evaluate worker 2’s changed package.'
      : 'Which digest matches the package used by the earlier evaluation?',
      83,830,34,ink,serif);
    return;
  }
  if(b===2||b===3){
    header(c,'Run R8  /  MLflow 3.16.1 lab contracts','What survives the two writes?');
    const rejected=result(k,3,'The tracking store');
    const tagged=on(k,3,'In the pinned SDK');
    const state=editRun(50,tagged?'approved':'pending');
    cells(c,['Field','Saved value','Attempt','Read back'],[
      ['Parameter  /  retrieval_k','40','50',rejected?String(state.k):'…'],
      ['Tag  /  review_state','pending','approved',tagged?state.tag:'…'],
    ],[90,760,1130,1500],407,142);
    foot(c,tagged?'Same run ID. The tag can change after the parameter write is rejected.':'Each write has its own storage rule.'); return;
  }
  if(b===4) {
    header(c,'Request lineage  /  evaluation dataset','Turn one failure into a repeatable case');
    const saved=on(k,4,'Save its question');
    file(c,104,334,680,486,ink,60);
    text(c,'MLflow trace',156,416,38,fog);text(c,'T104',156,547,101,white,mono);
    text(c,'“30 days”',156,668,70,white,serif);text(c,'Citations    [ ]',156,760,38,fog,mono);
    if(saved) {
      stroke(c,[[811,580],[959,580]],teal,5);shape(c,[[959,580],[936,567],[936,593]],teal);
      file(c,994,334,805,486,teal,60);text(c,'Saved regression case',1045,416,38,white);
      text(c,'RET-104',1045,547,93,white,mono);
      text(c,question,1045,651,42,white,serif);
      text(c,'Allowed source   DOC-12',1045,750,37,white,mono);
    }
    foot(c,'Retain the input and expected source with the snapshot that was scored.');return;
  }
  header(c,'Model lineage  /  release example','Follow the model back to its inputs');
  const inputs=[['Git revision',run.commit],['Frozen data',run.snapshot],['Resolved prompt','support-answer / v17']];
  inputs.forEach(([key,val],i)=>{
    if(i===1&&!on(k,0,'A retained dataset'))return;
    if(i===2&&!on(k,0,'A resolved prompt'))return;
    const y=337+157*i;
    text(c,key,97,y,30,muted);text(c,val,96,y+58,43,ink,mono);
    stroke(c,[[660,y+38],[695,y+38],[737,550]],line,3);
  });
  file(c,743,389,391,343,teal,47);
  text(c,'MLflow run',790,472,36,white);text(c,run.run,788,583,92,white,mono);
  if(on(k,0,'Reading its ranking score'))text(c,'nDCG@8   0.81',790,674,32,white,mono);
  if(b===0&&on(k,0,'Reading its ranking score')){
    stroke(c,[[1134,550],[1210,550]],teal,4);
    text(c,'Metric readback',1250,454,35,muted);text(c,'0.81',1244,597,113,ink,serif);
    text(c,'nDCG at rank 8',1250,672,35,muted);
  }
  if(b===1){
    stroke(c,[[1134,550],[1214,550]],teal,5);
    file(c,1220,320,560,250,ink,43);text(c,'Logged model    '+run.model,1268,416,44,white);
    text(c,'weights · loader · environment',1268,488,28,fog);
    if(on(k,1,'Registering it')){
      stroke(c,[[1500,570],[1500,639]],muted,4);
      text(c,'Registry version',1330,696,34,muted);text(c,String(run.registry),1469,806,84,ink,mono);
    }
  }
  foot(c,b===1?'A registry version points to a logged model with its own identity.':'The inputs give the stored ranking score its meaning.');
}

function paintClock(c,k,trace,overlap) {
  const b=k.beat.beatIndex, start=overlap?2:0;
  header(c,'Trace timing  /  elapsed milliseconds',overlap?'Two children share one interval':'Count each instant once',true);
  const left=430, width=1370, X=t=>left+t*width/trace.root;
  const axisY=340, first=463, dy=95;
  const ticks=overlap?[0,200,300,650,800]:[0,255,750,1130,1420];
  const sweep=prog(k,start+1,overlap?'Trace the shared part':'Sweep the clock',overlap?2.1:3.2);
  if(sweep>0)rect(c,left,axisY,width*sweep,450,'#213c41');
  for(const t of ticks) {
    stroke(c,[[X(t),axisY-8],[X(t),786]],'#345057',1.5,[5,8]);
    text(c,t,X(t),axisY-22,29,fog,mono,400,'center');
  }
  stroke(c,[[left,axisY],[X(trace.root),axisY]],fog,3);
  text(c,'Root request',81,405,37,light);
  rect(c,left,365,width,48,'#33515a');stroke(c,[[left,389],[X(trace.root),389]],fog,3);
  trace.children.forEach(([a,z],i)=>{
    if(!on(k,start,overlap?(i===0?'A runs':'B starts'):'Retrieval, reranking'))return;
    const y=first+dy*i, owner=trace.owner===i, h=owner?90:49;
    text(c,trace.names[i],81,y+36,40,light);
    rect(c,X(a),y,X(z)-X(a),h,owner?'#567875':'#437e76');
    if(owner&&on(k,start,overlap?'with a model call':'The model call')){
      const [u,v]=trace.nested;
      rect(c,X(u),y+36,X(v)-X(u),38,night);
      text(c,'model call   '+(v-u)+' ms',X(u)+14,y+64,27,aqua,mono);
      text(c,(z-a)+' ms',X(a)+11,y+26,25,light,mono);
      if(trace.validation){
        const [from,to]=trace.validation, center=(X(from)+X(to))/2;
        rect(c,X(from)+1,y+36,X(to)-X(from)-1,38,'#c7d7c1');
        stroke(c,[[center,y+77],[center,y+114],[center-23,y+114]],fog,2);
        text(c,'citation check   '+(to-from)+' ms',center-31,y+122,25,fog,mono,400,'right');
      }
    } else {
      const small=X(z)-X(a)<165;
      text(c,(z-a)+(small?'':' ms'),(X(z)+X(a))/2,y+35,small?29:30,light,mono,400,'center');
    }
  });
  if(sweep>0){
    const t=Math.round(trace.root*sweep), data=coverageAt(trace,t);
    const y=803;
    text(c,'Child coverage',82,y+24,36,aqua);
    rect(c,left,y,width,29,'#3c4e53');
    // On these timelines the interval union is contiguous from zero.
    rect(c,left,y,X(data.covered)-left,29,aqua);
    if(data.outside)rect(c,X(data.covered),y,X(t)-X(data.covered),29,gold);
    if(sweep<1){
      shape(c,[[X(t)-10,axisY-4],[X(t)+10,axisY-4],[X(t),axisY+8]],gold);
      stroke(c,[[X(t),782],[X(t),y+35]],gold,3);
    }
  }
  const settled=sweep===1&&result(k,start+1,overlap?'The two children together':'The uncovered tail');
  const total=coverageAt(trace,trace.root);
  const instruction = settled
    ? trace.root+' ms root  −  '+total.covered+' ms covered  =  '+total.outside+' ms outside'
    : b===start ? 'How much elapsed time falls outside the direct children?' : 'Follow the sweep along the root clock.';
  text(c,instruction,84,271,42,light,serif);
  stroke(c,[[82,858],[1838,858]],'#476268',2);
}
function docTile(c,x,y,id,emphasize=false) {
  file(c,x,y,178,67,emphasize?teal:'#d9dbcd',17);
  text(c,'DOC-'+id,x+12,y+45,30,emphasize?white:ink,mono);
}
function paintPacking(c,k) {
  const replay=on(k,5,'Add twelve'), verdict=result(k,5,'Generation received');
  header(c,'Trace T104  /  generation inputs','Where did the returns policy disappear?');
  text(c,'Retrieval',85,341,46,ink,serif);
  text(c,'40 candidates',87,400,34,muted);
  for(let i=0;i<40;i++){
    const x=91+75*(i%5),y=453+45*Math.floor(i/5),hot=i+1===12;
    rect(c,x,y,63,38,hot?teal:'#dde0d2');
    text(c,i+1,x+31,y+28,26,hot?white:ink,mono,400,'center');
  }
  text(c,'Reranked',570,341,46,ink,serif);text(c,'8 kept',571,400,34,muted);
  selected.forEach((id,i)=>docTile(c,572+188*(i%2),453+83*Math.floor(i/2),id,id===12));
  text(c,'Packed context',1060,341,46,ink,serif);text(c,replay?'Replay':'Original request',1062,400,34,muted);
  (replay?packedReplay:packed).forEach((id,i)=>docTile(c,1064,453+83*i,id,id===12));
  stroke(c,[[1350,365],[1350,842]],line,2);
  text(c,'Original reply',1390,406,33,muted);
  text(c,'30 days',1388,539,82,ink,serif);doc(c,[],1387,592,.77);
  if(replay) text(c,'Replay awaits scoring',1376,773,32,teal);
  foot(c,replay?'DOC-12 reached the replay. Check the new output before assigning a score.':verdict?'Packing discarded DOC-12 after reranking kept it.':'Follow DOC-12 from retrieval to the context the model actually received.');
}
function paintTrace(c,k) {
  const b=k.beat.beatIndex;
  if(b>=4) paintPacking(c,k); else paintClock(c,k,sequences[Number(b>=2)],b>=2);
}

function paintCandidate(c, k) {
  const joined = on(k, 3, 'Run B');
  const count = on(k, 3, 'B passes') ? 3 : on(k, 2, 'then A') ? 2 : Number(on(k, 2, 'C first'));
  const arrivals = candidateArrivals.slice(0, count);
  const assessment = assess(arrivals);
  const heading = joined ? (assessment.ready ? 'Every required case has passed' : 'Which check should we run next?')
                         : 'Which required case still needs a score?';
  header(c, 'Offline replay  /  candidate citation checks', heading);
  if (joined) {
    ['Required case', 'Matched assessment', 'Citation check'].forEach((label, i) =>
      text(c, label, [98, 550, 1330][i], 350, 36, muted));
    assessment.joined.forEach((row, i) => {
      const y = 385 + i * 132;
      rect(c, 82, y, 1756, 117, row ? white : sand);
      text(c, cases[i], 109, y + 83, 68, ink, serif);
      text(c, row ? 'Result for ' + row.id : 'No result for ' + cases[i], 550, y + 76, 46, ink);
      text(c, row ? (row.pass ? 'Pass' : 'Fail') : 'Missing', 1330, y + 76, 46, row?.pass ? teal : rust, sans, 600);
    });
  } else {
    text(c, 'Required IDs', 95, 321, 38, muted);
    cases.forEach((id, i) => {
      const x = 97 + i * 160;
      file(c, x, 365, 132, 139, ink, 22);
      text(c, id, x + 64, 462, 74, white, mono, 500, 'center');
    });
    stroke(c, [[731, 301], [731, 771]], line, 2);
    text(c, 'Incoming assessments', 831, 321, 48, ink, serif);
    text(c, 'Arrival', 831, 415, 34, muted);
    text(c, 'Case ID', 1066, 415, 34, muted);
    text(c, 'Citation check', 1402, 415, 34, muted);
    arrivals.forEach((row, i) => {
      const y = 455 + i * 126;
      rect(c, 809, y, 1029, 109, white);
      text(c, String(i + 1), 836, y + 71, 41, muted, mono);
      text(c, row.id, 1067, y + 78, 63, ink, serif);
      text(c, row.pass ? 'Pass' : 'Fail', 1402, y + 73, 46, row.pass ? teal : rust, sans, 600);
    });
  }
  text(c, 'Scored   ' + assessment.observed + '/' + cases.length, 93, 861, 39, muted, mono);
  const mean = assessment.observed ? assessment.passes + '/' + assessment.observed : 'pending';
  text(c, 'Observed pass rate   ' + mean, 682, 861, 39, ink, mono);
}

function paintLiveEvaluation(c, k) {
  const selected = on(k, 6, 'Here we sample');
  const judging = on(k, 6, 'a configured judge');
  const arrived = on(k, 6, 'then six') ? 3 : on(k, 6, 'then four') ? 2 : Number(on(k, 6, 'for trace two'));
  const state = sampleSupportTraces(selected, judging, groundednessResults.slice(0, arrived));
  const revealTotals = on(k, 7, 'Three of eight');
  header(c, 'Evaluation  /  citation evidence', 'Which live replies has the judge scored?');

  text(c, 'Offline replay', 84, 311, 48, ink, serif);
  text(c, 'Same reply and citation', 85, 373, 33, muted);
  text(c, '30 days', 82, 474, 79, ink, serif);
  text(c, documentId, 86, 538, 43, teal, mono);
  expectationSnapshots.forEach((expected, i) => {
    const y = 637 + i * 124;
    stroke(c, [[84, y - 49], [588, y - 49]], line, 2);
    text(c, i ? 'Edited snapshot' : 'Saved snapshot', 84, y, 32, muted);
    text(c, 'Allows ' + expected[0], 84, y + 56, 38, ink, mono);
    const pass = valid([documentId], expected);
    text(c, pass ? 'Pass' : 'Fail', 585, y + 56, 41, pass ? teal : rust, sans, 600, 'right');
  });
  stroke(c, [[638, 277], [638, 887]], line, 2);
  text(c, 'Saved support traces', 693, 311, 48, ink, serif);
  text(c, selected ? 'Sample every second arrival' : 'Eligible requests in arrival order', 695, 373, 34, muted);
  state.rows.forEach((row, i) => {
    const x = 694 + (i % 4) * 290, y = 415 + Math.floor(i / 4) * 180;
    const color = row.sampled ? mint : white;
    rect(c, x, y, 261, 153, color);
    if (row.sampled) rect(c, x, y, 8, 153, teal);
    text(c, 'T' + row.id, x + 23, y + 68, 54, ink, mono);
    const status = row.score ? (row.score.pass ? 'Pass' : 'Fail') : row.sampled ? (judging ? 'Pending' : 'Selected')
      : selected ? 'Unsampled' : 'Saved';
    text(c, status, x + 23, y + 124, 38, row.score ? (row.score.pass ? teal : rust) : muted);
  });
  if (revealTotals) {
    text(c, 'Coverage  ' + state.scored + '/' + state.rows.length, 694, 854, 41, ink, mono);
    text(c, 'Pass rate  ' + state.passes + '/' + state.scored, 1270, 854, 41, teal, mono);
  } else if (selected) {
    text(c, state.selected + ' selected   /   ' + state.rows.length + ' eligible', 694, 854, 36, ink, mono);
  }
}

function paintScores(c,k) {
  const b=k.beat.beatIndex;
  if(on(k,5,'Track which eligible')) return paintLiveEvaluation(c,k);
  if(b===2||b===3) return paintCandidate(c,k);
  if(b>=4){
    const edited=on(k,4,'The edited one'), scored=result(k,5,'fails on the edit');
    header(c,'Evaluation dataset  /  same native ID','Score one reply against two snapshots');
    text(c,'Retained reply',92,335,34,muted);text(c,'30 days',92,442,95,ink,serif);
    doc(c,[documentId],545,365,.88);
    expectationSnapshots.forEach((expected,i)=>{
      const x=90+900*i, active=!i||edited;
      rect(c,x,525,840,300,i?'#e5e5d9':white);
      text(c,i?'Edited snapshot':'Saved snapshot',x+39,597,45,ink,serif);
      if(active) {
        text(c,'Allowed  '+expected[0],x+39,683,40,ink,mono);
        text(c,'SHA-256   '+sha(JSON.stringify({question,expected})).slice(0,10)+'…',x+39,767,29,muted,mono);
      }
      if(i ? scored : on(k,5,'It passes'))text(c,valid([documentId],expected)?'PASS':'FAIL',x+783,683,42,valid([documentId],expected)?teal:rust,mono,700,'right');
    });
    foot(c,scored?'The changed expectation explains the changed score.':'How will the same citation score against each allowed set?');return;
  }
  const labJudged=result(k,1,'The first list');
  const assessment=initialScores;
  header(c,'Local SDK lab  /  citation_contract','Which replies cite an allowed source?');
  text(c,'Allowed source    DOC-12',90,318,40,teal,mono);
  const hs=['Case','Returned citations','Citation check'];
  hs.forEach((h,i)=>text(c,h,[100,550,1330][i],413,34,muted));
  assessment.joined.forEach((row,i)=>{
    const y=450+i*119;rect(c,82,y,1756,108,i%2?'#e9e9de':white);
    text(c,cases[i],105,y+76,67,ink,serif);
    doc(c,row.ids,548,y+23,.70);
    if(labJudged)text(c,row.pass?'Pass':'Fail',1330,y+74,48,row.pass?teal:rust,sans,600);
    else text(c,'?',1330,y+73,46,muted,mono);
  });
  if(labJudged) {
    text(c,'Scored   '+assessment.observed+'/3',93,869,39,muted,mono);
    text(c,'Observed pass rate   '+(assessment.observed?assessment.passes+'/'+assessment.observed:'pending'),682,869,39,ink,mono);
  }
  foot(c,labJudged?'One allowed citation out of three responses.':'Require a nonempty list. Every cited ID must be allowed.');
}

function cacheFrame(k) {
  const move=prog(k,1,'Move production',.8);
  const load=prog(k,3,'refresh the entry',.7);
  const secondLoad=prog(k,6,'Refresh again',.7);
  let n=0;
  if(move===1)n=1;
  if(result(k,2,'Read its trace'))n=2;
  if(load===1)n=3;
  if(result(k,4,'Both requests used'))n=4;
  if(on(k,5,'Its template text'))n=5;
  if(secondLoad===1)n=6;
  if(result(k,6,'The previous eighteen'))n=7;
  return { ...cache[n], move, load, secondLoad };
}
function paintCache(c,k){
  const s=cacheFrame(k), b=k.beat.beatIndex, transfer=(s.load>0&&s.load<1)||(s.secondLoad>0&&s.secondLoad<1);
  header(c,'Prompt Registry  /  support-answer',b<5?'Which prompt handled the return question?':'Can v18 identify the temperature?');
  text(c,'Registry',85,311,43,ink,serif);
  text(c,'Worker memory',1163,311,43,ink,serif);
  const x=240+420*s.move;
  text(c,'production',x,385,33,teal,mono,600,'center');
  shape(c,[[x-14,397],[x+14,397],[x,417]],teal);
  [v17,s.candidate].forEach((p,i)=>{
    const px=80+420*i;
    file(c,px,431,372,205,p.version===17?ink:teal,33);
    text(c,'v'+p.version,px+30,518,67,white,mono);
    text(c,'temp '+p.temperature.toFixed(1),px+32,596,37,fog,mono);
  });
  const w=s.worker;
  rect(c,1135,406,698,245,mint);rect(c,1135,406,11,245,teal);
  text(c,'Held prompt  v'+w.version,1177,490,49,ink,mono);
  text(c,w.model+'   ·   temperature '+w.temperature.toFixed(1),1179,563,35,teal,mono);
  text(c,w.text,1178,619,31,muted,serif);
  if(transfer){
    const t=s.secondLoad>0&&s.secondLoad<1?s.secondLoad:s.load;
    text(c,'Loading',1001,497,28,teal,mono,400,'center');
    stroke(c,[[881,532],[1124,532]],teal,3,[6,7]);circle(c,893+217*t,532,12,teal);
  }
  stroke(c,[[83,693],[1838,693]],line,2);
  text(c,question,84,749,40,ink,serif);
  const tickTwo=on(k,1,'At tick two');
  if(s.receipts.length===0)text(c,tickTwo?'Tick 2   /   Which version will the request record?':'Requests will record the loaded settings.',90,842,40,muted);
  s.receipts.forEach((r,i)=>{
    const ax=85+590*i;
    text(c,r.id+'  /  tick '+r.tick,ax,809,31,muted);
    text(c,'v'+r.version+'   '+r.model+'   temp '+r.temperature.toFixed(1),ax,869,40,ink,mono);
  });
  const notes=['A loaded prompt is a separate object.','Tick 2 is before this entry’s expiry at tick 3.',
    'The request uses the worker’s held object.','At expiry, support reloads. The summary prompt keeps its own cache entry.',
    'Compare the request records for the same question.','An edit to the registry leaves the held copy intact.',
    'Keep the exact settings each request used.'];
  foot(c,b===1&&!tickTwo?'The alias selects a registry version. The worker holds its own copy.':notes[b]);
}

function paintGateway(c,k){
  const scrub=on(k,1,'Keep the status'), fields=exportFields(scrub);
  const fallback=on(k,0,'The fallback');
  header(c,'Operations  /  AI Gateway','What belongs in the exported trace?');
  text(c,'Provider attempts',85,341,45,ink,serif);
  attempts.slice(0,fallback?2:1).forEach((a,i)=>{
    const y=430+i*143;circle(c,137,y+20,42,i?teal:rust);
    text(c,a.name,137,y+35,43,white,mono,700,'center');
    text(c,a.status,221,y+32,54,ink,serif);
    if(a.model)text(c,'Model '+a.model,224,y+79,32,muted,mono);
  });
  if(fallback){
    file(c,870,302,938,540,ink,53);
    text(c,scrub?'Fields for export':'Captured fields',927,398,48,white,serif);
    text(c,'Attempt A',927,493,31,fog,mono);text(c,fields.attemptA,1390,493,35,white);
    text(c,'Responder / model',927,574,31,fog,mono);text(c,fields.responder+' / '+fields.model,1390,574,35,white,mono);
    stroke(c,[[927,627],[1740,627]],'#718783',2);
    if('error.request_body' in fields){
      text(c,'error.request_body',927,700,35,gold,mono);
      text(c,fields['error.request_body'],927,768,35,white,mono);
    } else text(c,'Exception body removed before export',927,723,36,aqua);
  } else {
    stroke(c,[[138,502],[138,572]],line,3,[5,8]);
    text(c,'B',137,611,43,muted,mono,400,'center');
    text(c,'Fallback',221,610,43,muted);
    file(c,870,302,938,540,ink,53);text(c,'Gateway trace',927,398,48,white,serif);
    text(c,'Requesting provider response…',927,597,42,fog);
  }
  foot(c,scrub?'Retain the responder and failure status under the trace access policy.':'Input capture is off. Inspect the exception as well.');
}
function queueFrame(k) {
  if(k.beat.beatIndex===2)return queue[0];
  const cues=['Send A','B takes','C takes','The exporter drops D'];
  return queue[cues.filter(cue=>on(k,3,cue)).length];
}
function paintQueue(c,k) {
  const s=queueFrame(k);
  header(c,'Operations  /  bounded FIFO','Which trace is missing from this batch?',true);
  text(c,'Application log     D answered',84,330,39,aqua,mono);
  text(c,'Send one trace. B, C and D arrive in order before the next send.',84,402,36,light);
  text(c,'If both slots are full, drop the incoming trace.',84,458,36,light);
  const slots=[['Sent',s.sent,90],['Waiting  /  2 slots',s.waiting,650],['Dropped',s.lost,1425]];
  for(const [name,ids,x] of slots) {
    text(c,name,x,555,44,light,serif);
    const count=name.startsWith('Waiting')?2:1;
    for(let i=0;i<count;i++){
      const px=x+i*182;rect(c,px,603,162,139,'#29434b');
      if(ids[i]){file(c,px+13,616,136,112,name==='Dropped'?rust:teal,20);text(c,ids[i],px+80,698,66,white,mono,600,'center');}
    }
    text(c,ids.length+' '+(name.startsWith('Waiting')?'waiting':name.toLowerCase()),x,820,33,fog,mono);
  }
  if(s===queue.at(-1)){
    const total=s.sent.length+s.waiting.length+s.lost.length;
    text(c,total+' arrived  =  '+s.sent.length+' sent  +  '+s.waiting.length+' waiting  +  '+s.lost.length+' dropped',90,904,42,light,serif);
  }
}
function indexTile(c, index, x, y, fill = mint) {
  rect(c, x, y, 104, 58, fill);
  text(c, index, x + 52, y + 43, 39, ink, mono, 600, 'center');
}

function paintRelease(c, k) {
  const replay = live[2];
  const showReplies = after(k, 4, 'Both reply thirty days and cite document twelve');
  const showDigests = on(k, 4, 'Here are the indexes');
  const eastCompared = after(k, 5, 'East matches');
  const westCompared = after(k, 5, 'West searched index seven');
  const reload = prog(k, 5, 'Reload the evaluated index', 1.35);
  const replayCaptured = after(k, 6, 'Read the new trace');
  const replayCompared = after(k, 6, 'West now matches the evaluated digest');
  const sourceOpened = after(k, 6, 'Open its cited revision');
  const [requestX, replyX, indexX, digestX, matchX] = [88, 501, 995, 1170, 1580];
  const citationX = 724;
  const firstRowY = 551, rowGap = 88, replayY = firstRowY + 2 * rowGap;

  header(c, 'Release receipt  /  retained inputs', 'Which worker served the evaluated release?');
  text(c, 'Evaluated', requestX, 316, 42, ink, serif);
  text(c, `v${v18.version}   ·   ${v18.model}   ·   temp ${v18.temperature.toFixed(1)}`, 325, 316, 39, ink, mono);
  indexTile(c, evaluated.index, indexX, 272);
  text(c, 'Cases   ' + allScores.passes + '/' + cases.length + ' pass', 1445, 316, 36, teal, mono);
  text(c, 'Configuration SHA-256    ' + evaluated.config.slice(0, 12) + '…', requestX, 380, 35, teal, mono);
  ['Request', 'Reply / citation', 'Index', 'SHA-256 prefix', 'Release match'].forEach((label, i) =>
    text(c, label, [requestX, replyX, indexX, digestX, matchX][i], 464, 32, muted));

  const compared = [eastCompared, westCompared, replayCompared];
  const rows = live.slice(0, replayCaptured ? live.length : 2);
  rows.forEach((trace, i) => {
    const y = firstRowY + rowGap * i;
    text(c, trace.id + '  ' + trace.worker, requestX, y, 38, ink, sans, 500);
    if (showReplies) {
      text(c, trace.reply, replyX, y, 39, ink, serif);
      text(c, trace.citation, citationX, y, 36, trace === replay && sourceOpened ? teal : ink, mono);
    }
    if (showDigests) {
      const matches = releasable(trace, allScores);
      indexTile(c, trace.index, indexX, y - 43, compared[i] ? (matches ? mint : sand) : white);
      text(c, trace.config.slice(0, 12) + '…', digestX, y, 37, ink, mono);
      if (compared[i]) text(c, matches ? 'Matches' : 'Differs', matchX, y, 38, matches ? teal : rust, sans, 600);
    }
    stroke(c, [[requestX, y + 22], [1837, y + 22]], line, 1.5);
  });

  if (reload > 0 && !replayCaptured) {
    text(c, 'West worker', requestX, replayY, 38, ink, sans, 500);
    const loaded = reload === 1;
    text(c, loaded ? 'Loaded index' : 'Reloading index', replyX, replayY, 36, muted);
    if (loaded) {
      text(c, 'Awaiting replay trace', digestX, replayY, 37, muted);
    } else {
      rect(c, indexX, replayY - 43, 104, 58, white);
      stroke(c, [[indexX + 104, replayY - 14], [1542, replayY - 14]], line, 3, [6, 7]);
    }
    indexTile(c, evaluated.index, indexX + (1490 - indexX) * (1 - reload), replayY - 43);
    stroke(c, [[requestX, replayY + 22], [1837, replayY + 22]], line, 1.5);
  }
  if (sourceOpened) {
    c.font = `400 36px "${mono}"`;
    const anchor = citationX + c.measureText(replay.citation).width / 2;
    stroke(c, [[anchor, replayY + 11], [anchor, 798]], teal, 3);
    rect(c, 83, 798, 1755, 84, mint);
    text(c, replay.citation + '    “' + replay.text + '”', 111, 855, 45, ink, serif);
  }
}
function paintOperations(c,k){
  const b=k.beat.beatIndex;
  if(b<2)paintGateway(c,k);else if(b<4)paintQueue(c,k);else paintRelease(c,k);
}
const painters=[paintReplies,paintStores,paintLineage,paintTrace,paintScores,paintCache,paintOperations];
function draw(c,k){painters[k.beat.chapterIndex](c,k);}

function check(){
  const [a,b,replay]=replies;
  assert.equal(a.reply,b.reply); assert.equal(b.key+'?',replay.key);
  assert.deepEqual([a,b,replay].map(r=>r.citations),[[documentId],[],[documentId]]);
  assert.equal(new Set(replies.map(r=>r.trace)).size,3);
  assert.deepEqual([promptReplay.prompt,promptReplay.index,promptReplay.model],[18,8,'M3']);
  assert.equal(canRead(direct,[proxied.principal]),false);assert.equal(canRead(proxied,[proxied.principal]),true);
  assert.deepEqual(editRun(50,'approved'),{k:40,tag:'approved',rejected:true});
  assert.deepEqual(sequences.map(s=>coverageAt(s,s.root).outside),[35,150]);
  for(const s of sequences){
    const parent=s.children[s.owner];
    assert.ok(parent[0]<=s.nested[0] && s.nested[1]<=parent[1]);
    if(s.validation){
      assert.equal(s.validation[1]-s.validation[0],105);
      assert.ok(s.nested[1]<=s.validation[0] && s.validation[1]<=parent[1]);
    }
    for(let t=0;t<=s.root;t++){
      const count=coverageAt(s,t);
      assert.equal(count.covered+count.outside,t);
      if(t) assert.equal(count.covered-coverageAt(s,t-1).covered,Number(s.children.some(([a,z])=>t>a&&t<=z)));
    }
  }
  assert.ok(selected.includes(12)&&!packed.includes(12)&&packedReplay.includes(12));
  assert.deepEqual(labScores.map(r=>r.pass),[false,false,true]);
  assert.deepEqual(candidateArrivals.map(row => row.id), ['C','A','B']);
  assert.deepEqual([partialScores.observed,partialScores.passes,partialScores.ready],[2,2,false]);
  assert.deepEqual(partialScores.joined.map(row => row?.id), ['A',undefined,'C']);
  assert.deepEqual(allScores.joined.map(row => row.id), cases); assert.ok(allScores.ready);
  assert.ok(!assess([passing('A'),labScores[1],passing('C')]).ready);
  assert.ok(!valid([documentId],['DOC-99'])&&!valid([documentId,'DOC-99'],allowed));
  assert.deepEqual(expectationSnapshots.map(expected => valid([documentId],expected)), [true,false]);
  const saved = sampleSupportTraces(false, false, []);
  assert.deepEqual([saved.rows.length, saved.selected, saved.scored], [8,0,0]);
  const sampled = sampleSupportTraces(true, false, []);
  assert.deepEqual(sampled.rows.filter(row => row.sampled).map(row => row.id), [2,4,6,8]);
  assert.equal(sampled.scored, 0);
  for (let n = 0; n <= groundednessResults.length; n++) {
    const judged = sampleSupportTraces(true, true, groundednessResults.slice(0,n));
    assert.deepEqual(judged.rows.filter(row => row.score).map(row => row.id), [2,4,6].slice(0,n));
    assert.deepEqual([judged.rows.length, judged.selected, judged.scored, judged.passes], [8,4,n,n]);
    assert.equal(judged.rows[7].score, undefined);
  }
  assert.deepEqual(cache.map(s=>s.worker.version),[17,17,17,18,18,18,18,18]);
  assert.deepEqual(cache.map(s=>s.worker.temperature),[.2,.2,.2,.2,.2,.2,.8,.8]);
  assert.equal(cache[2].worker,cache[0].worker);assert.equal(cache[5].worker,cache[4].worker);
  assert.deepEqual(cache.at(-1).receipts.map(r=>[r.version,r.temperature,r.model,r.question]),[
    [17,.2,'M3',question],[18,.2,'M3',question],[18,.8,'M3',question],
  ]);
  assert.equal(cache.at(-1).receipts[0],cache[2].receipts[0]);
  assert.deepEqual(exportFields(true),{attemptA:'Timed out',responder:'B',model:'B1'});
  assert.deepEqual(queue.at(-1),{waiting:['B','C'],sent:['A'],lost:['D']});
  assert.equal(new Set(Object.values(queue.at(-1)).flat()).size,4);
  assert.deepEqual(live.map(r=>releasable(r,allScores)),[true,false,true]);
  assert.equal(releasable(live[0],partialScores),false);
  assert.deepEqual(live.map(r=>r.index),[evaluated.index,'I7',evaluated.index]);
  assert.equal(new Set(live.map(r=>r.id)).size,live.length);
  for(const trace of live) {
    assert.deepEqual([trace.reply,trace.citation,trace.artifact],[evaluated.reply,evaluated.citation,evaluated.artifact]);
  }
  const replaced=liveTrace('changed','East','I8',models[1].bytes);
  assert.equal(models[0].registry,models[1].registry);assert.equal(models[0].reply,models[1].reply);
  assert.notEqual(models[0].digest,models[1].digest);assert.equal(replaced.artifact,models[1].digest);
  assert.equal(replaced.reply,live[0].reply);assert.equal(releasable(replaced,allScores),false);
  assert.equal(live[2].text,policy);
}
export default {title:'MLflow and the Evidence Behind an AI Release',draw,check};
