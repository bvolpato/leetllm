import assert from 'node:assert/strict';

// Each row is an event on the spoken track. The picture can seek directly to
// any event without relying on a previous draw.
export const cues = {
  c01: [
    [0,'It is empty'], [0,'Still empty'], [1,'A adds'], [1,'B adds'],
    [1,'A sends'], [1,'B sends'],
  ],
  c02: [
    [1,'Claim the guide'], [2,'Take the guide'], [2,'Append only'],
    [3,'The API comes first'], [3,'Then fetch the FAQ'],
  ],
  c03: [
    [0,'A enters'], [0,'B waits outside'], [0,'inserts the guide'],
    [1,'Leave the block'], [1,'A starts loading'], [1,'B can now inspect'],
    [1,'skips that fetch'], [1,'It claims the API'], [1,'sends its own request'],
    [2,'The API finishes first'], [3,'Set the stop event'], [3,'When the guide returns'],
  ],
  c04: [
    [0,'Write running'], [0,'Set the test clock'], [1,'At fifteen'],
    [2,'Replay the write'], [2,'Keep the lock'], [2,'Remove the expired entry'],
    [2,'Compare against missing'], [2,'Write ready'],
  ],
  'c05-graph': [[1,'Mark lint active'], [1,'then mark test active'], [1,'The edge back'], [1,'Reject the graph']],
  c05: [[0,'Docs completes'], [0,'Test fails once'], [1,'Test succeeds'], [1,'Deploy runs once'],
    [2,'Replay with a budget'], [2,'Docs still completes'], [2,'Test fails and exhausts']],
  c06: [[0,'first request spends'], [0,'second spends'], [0,'third spends'], [1,'Deny the fourth'],
    [1,'Move the clock'], [1,'Deny this request'], [2,'Advance to one second'], [2,'Admit the request']],
  c07: [[0,'Credit one hundred'], [0,'Withdraw thirty'], [1,'Here is deposit one again'],
    [2,'Return the original receipt']],
  'c07-keys': [[0,'Someone changes the amount'], [0,'Reject the mismatch'], [0,'Now try a fresh withdrawal'],
    [0,'Reject it for insufficient credit'], [1,'Credit twenty'], [1,'Retry the withdrawal'], [1,'It succeeds']],
  'c07-lock': [[0,'Sort the unique'], [0,'Acquire A once'], [0,'then B'], [1,'The lookup fails'],
    [1,'releases B'], [1,'then A']],
  'c08-parser': [[0,'Read the orphan'], [0,'Read the first header'], [0,'Attach the indented tail'],
    [1,'Read the malformed header'], [2,'Skip the continuation'], [2,'Read the last header']],
  c08: [[0,'Run them in series'], [0,'Eight seconds','end'], [1,'Overlap both waits'],
    [1,'One Python lane takes A'], [1,'then B'], [1,'Five seconds in total','end'],
    [2,'Send a complete record'], [2,'It returns a count'], [2,'Merge that result'],
    [3,'Try a fresh timing test'], [4,'thirteen and a half seconds','end'],
    [4,'With the waits overlapped'], [4,'five and a half','end']],
};

export function cueState(clock) {
  let step = 0, motion = 1;
  for (const [i, [beat, phrase, anchor]] of cues[clock.beat.chapterId].entries()) {
    if (beat < clock.beat.beatIndex) { step = i + 1; motion = 1; }
    if (beat !== clock.beat.beatIndex) continue;
    if (anchor === 'end') {
      // Start the caption with the result clause. Wait for its last word to show the total.
      clock.reveal(phrase, 0, { captionStart: phrase });
      const elapsed = clock.elapsed - clock.wordCue(phrase).end;
      if (elapsed >= -1e-9) {
        step = i + 1;
        motion = Math.min(1, Math.max(0, elapsed) / 1.5);
      }
      continue;
    }
    const arrived = clock.reveal(phrase, 0);
    const ramp = clock.reveal(phrase, 0.75);
    if (arrived) { step = i + 1; motion = ramp; }
  }
  return {step, motion};
}

const A = 'A', B = 'B', guide = '/guide', api = '/api';
export function workers(locked, step) {
  const seen = new Set(), reads = {}, requests = [], status = {A:'at lookup', B:'at lookup'};
  let owner = null, stop = false, published = null;
  function read(w, page) {
    if (locked) assert.equal(owner, w);
    reads[w] = seen.has(page);
    status[w] = reads[w] ? 'present' : 'absent';
  }
  function add(w, page) {
    if (locked) assert.equal(owner, w);
    assert.equal(reads[w], false);
    seen.add(page); status[w] = 'inserted';
  }
  function send(w, page, start=0) {
    assert.notEqual(owner, w);
    requests.push({worker:w, page, start, done:false}); status[w]='loading';
  }
  function finish(w) {
    requests.find(r=>r.worker === w).done = true;
    status[w] = '200 OK';
  }
  const unlocked = [
    ()=>read(A,guide), ()=>read(B,guide), ()=>add(A,guide), ()=>add(B,guide),
    ()=>send(A,guide), ()=>send(B,guide),
  ];
  const protectedSteps = [
    ()=>{owner=A; status.A='holds lock';},
    ()=>{status.B='waiting'; read(A,guide);},
    ()=>add(A,guide),
    ()=>{owner=null; status.A='can fetch';},
    ()=>send(A,guide),
    ()=>{owner=B; read(B,guide);},
    ()=>{owner=null; status.B='skipped';},
    ()=>{owner=B; read(B,api); add(B,api); status.B='claimed /api';},
    ()=>{owner=null; send(B,api,24);}, ()=>finish(B),
    ()=>{stop=true;}, ()=>{finish(A); published=stop ? 0 : 1;},
  ];
  for (const action of (locked ? protectedSteps : unlocked).slice(0, step)) action();
  return {seen:[...seen], reads, requests, status, owner, stop, published};
}

const origin='https://repo.example';
export const links = {'/start':['/guide','/api#auth','https://other.example/x'],
  '/guide':['/api','/faq'], '/api':['/start'], '/faq':[]};
export function frontier(step) {
  const queue=['/start'], seen=new Set(queue), order=[];
  let current='/start';
  function take() { current=queue.shift(); order.push(current); }
  function admit() {
    for (const raw of links[current]) {
      const url=new URL(raw,origin+current);
      const key=url.pathname+url.search;
      if (url.origin===origin && !seen.has(key)) {seen.add(key); queue.push(key);}
    }
  }
  take();
  if (step>=1) admit();
  if (step>=2) take();
  if (step>=3) admit();
  if (step>=4) {take(); admit();}
  if (step>=5) {take(); admit();}
  return {queue,seen:[...seen],order,current,raw:links[current]};
}

export function ttl(step) {
  let record=null, result=null, held=false;
  let now=10;
  const deadline=now+5;
  function clean() { if (record && record.until!==null && record.until<=now) record=null; }
  if (step>=1) record={value:'running',until:deadline};
  if (step>=2) {now=14.999; clean(); result=record?.value ?? 'None';}
  if (step>=3) {now=15; clean(); result=record?.value ?? 'None';}
  if (step>=4) {now=10; record={value:'running',until:deadline}; result=null;}
  if (step>=5) {now=15; held=true;}
  if (step>=6) clean();
  if (step>=7) {assert(held); result=record===null?'match':'mismatch';}
  if (step>=8 && result==='match') {record={value:'ready',until:null}; result='True'; held=false;}
  return {record,result,held,now,deadline};
}

const invalidGraph={docs:[],lint:['test'],test:['lint']};
export function graphWalk(graph) {
  const colors={}, events=[]; let back=null;
  function visit(name) {
    if (colors[name]==='done') return;
    colors[name]='active'; events.push({...colors});
    for (const dep of graph[name]) {
      if (colors[dep]==='active') {back=[name,dep]; return;}
      visit(dep);
      if (back) return;
    }
    colors[name]='done'; events.push({...colors});
  }
  for (const name of Object.keys(graph)) {visit(name); if(back) break;}
  return {events,back};
}
export const graph=graphWalk(invalidGraph);

export function schedule(step) {
  const replay=step>=5, budget=replay?1:2;
  const priorities={docs:1,test:2,deploy:3}, attempts={docs:0,test:0,deploy:0};
  const states={docs:'ready',test:'ready',deploy:'waiting'}, queue=['docs','test'];
  const history=[]; let unmet=1;
  function run() {
    queue.sort((a,b)=>priorities[a]-priorities[b] || a.localeCompare(b));
    const name=queue.shift(); attempts[name]++; history.push(name);
    if (name==='test' && attempts.test===1) {
      if (attempts.test<budget) {states.test='retry'; queue.push(name);}
      else {states.test='failed'; states.deploy='blocked';}
    } else {
      states[name]='complete';
      if (name==='test') {unmet--; states.deploy='ready'; queue.push('deploy');}
    }
  }
  for (let i=0;i<(replay?step-5:step);i++) run();
  return {states,attempts,history,queue,unmet,budget};
}

export function bucket(step,ramp=1) {
  const cap=3,rate=1,cost=1,history=[];
  let time=0,tokens=cap,verdict=null,retry=null;
  function request() {
    verdict=tokens>=cost?'allow':'deny';
    retry=verdict==='allow'?0:(cost-tokens)/rate;
    if (verdict==='allow') tokens-=cost;
    history.push({time,tokens,verdict});
  }
  function advance(t) {
    tokens=Math.min(cap,tokens+(t-time)*rate); time=t; verdict=null; retry=null;
  }
  for (let i=0;i<Math.min(step,4);i++) request();
  if (step>=5) advance(0.5*(step===5?ramp:1));
  if (step>=6) request();
  if (step>=7) advance(0.5+0.5*(step===7?ramp:1));
  if (step>=8) request();
  return {cap,rate,cost,time,tokens,verdict,retry,history};
}

export function ledger(step) {
  let balance=0, key=null, delta=null, reply=null, matched=null;
  const account='A',events=[],saved=new Map();
  function apply(k,d) {
    key=k; delta=d;
    const old=saved.get(k);
    if (old) {
      matched=old.account===account && old.delta===d;
      reply=matched?old.after:'conflict'; return;
    }
    balance+=d;
    const receipt={key,delta,account,after:balance};
    events.push(receipt); saved.set(key,receipt); reply=balance;
  }
  if (step>=1) apply('deposit-1',100);
  if (step>=2) apply('withdraw-1',-30);
  if (step===3) {key='deposit-1'; delta=100; reply=null;}
  if (step>=4) apply('deposit-1',100);
  if (step>=5) apply('deposit-1',200);
  return {balance,key,delta,reply,matched,events};
}

// Continue the same account history across the cut. Rejections do not add
// events or cache entries. Only the lookup and commit change a pending call.
export function ledgerPolicy(step) {
  const opening=ledger(4), events=[...opening.events];
  const saved=new Map(events.map(e=>[e.key,e]));
  let balance=opening.balance, call=null, reply=null;
  function propose(key,delta) {call={key,account:'A',delta}; reply=null;}
  function decide() {
    const prior=saved.get(call.key);
    if (prior) {
      reply=prior.account===call.account && prior.delta===call.delta ? prior.after : 'key conflict';
    } else if (balance+call.delta<0) {
      reply='insufficient';
    } else {
      balance+=call.delta;
      const event={...call,after:balance};
      events.push(event); saved.set(call.key,event); reply=balance;
    }
  }
  if(step>=1) propose('deposit-1',200);
  if(step>=2) decide();
  if(step>=3) propose('withdraw-2',-80);
  if(step>=4) decide();
  if(step>=5) {propose('deposit-2',20);decide();}
  if(step>=6) propose('withdraw-2',-80);
  if(step>=7) decide();
  return {balance,events,saved,call,reply};
}

export function locks(step) {
  const request=['B','A','A','C'], order=[...new Set(request)].sort();
  const registry=new Set(['A','B']), held=[],released=[];
  for (const name of order.slice(0,Math.min(2,Math.max(0,step-1)))) {
    assert(registry.has(name)); held.push(name);
  }
  if (step>=4) assert(!registry.has(order[2]));
  for(let i=4;i<step;i++) released.push(held.pop());
  return {request,order,held,released,missing:step>=4?order[2]:null};
}

export const lines=['  connecting','t|ERROR|build|red','  tail','bad','  retry in 2 s','u|INFO|done'];
export function parseLines(input) {
  const records=[]; let current=null;
  for(const line of input) {
    if (line.startsWith(' ')) {
      if (current!==null) records[current]+=' '+line.trim();
      continue;
    }
    const match=/^([^|]+)\|([^|]+)\|(.*)$/.exec(line);
    current=match?records.length:null;
    if(match) records.push(match[3]);
  }
  return {records,current};
}

export function jobPlan(jobs,wait,cpu,overlap) {
  return Array.from({length:jobs},(_,i)=>{
    const start=overlap?0:i*(wait+cpu), available=start+wait;
    const parse=overlap?wait+i*cpu:available;
    return {start,available,parse,end:parse+cpu};
  });
}
export function mergeRecord(step) {
  const input={id:'job-A',message:parseLines(lines).records[0]},parent={};
  const workerCopy=step>=7?JSON.parse(JSON.stringify(input)):null;
  let result=null;
  if (step>=8) {
    result={id:workerCopy.id,words:workerCopy.message.split(' ').length};
  }
  if (step>=9) parent[result.id]=result.words;
  return {result,parent,workerCopy};
}

export function checkTraces() {
  assert.deepEqual(workers(false,2).reads,{A:false,B:false});
  assert.deepEqual(workers(false,2).seen,[]);
  assert.deepEqual(workers(false,2).requests,[]);
  assert.deepEqual(workers(false,3).seen,[guide]);
  assert.deepEqual(workers(false,4).seen,[guide]);
  assert.deepEqual(workers(false,4).requests,[]);
  assert.deepEqual(workers(false,5).requests.map(r=>r.worker),[A]);
  assert.deepEqual(workers(false,6).requests.map(r=>r.worker),[A,B]);
  assert.deepEqual(workers(false,6).requests.map(r=>r.page),[guide,guide]);
  assert.deepEqual(workers(false,6).seen,[guide]);
  assert.equal(workers(true,3).owner,A);
  assert.equal(workers(true,4).owner,null);
  assert.equal(workers(true,8).owner,B); assert.equal(workers(true,9).owner,null);
  assert.deepEqual(workers(true,7).requests.map(r=>r.page),[guide]);
  assert.deepEqual(workers(true,10).requests.map(r=>[r.page,r.done]),[[guide,false],[api,true]]);
  assert.equal(workers(true,12).published,0);
  assert.deepEqual(frontier(1).queue,[guide,api]); assert.deepEqual(frontier(3).queue,[api,'/faq']);
  assert.deepEqual(frontier(3).order,['/start',guide]);
  assert.deepEqual(frontier(4).order,['/start',guide,api]);
  assert.deepEqual(frontier(4).queue,['/faq']);
  assert.deepEqual(frontier(5).order,['/start',guide,api,'/faq']);
  assert.equal(ttl(2).result,'running'); assert.equal(ttl(3).record,null);
  assert.deepEqual([ttl(5).held,ttl(6).record,ttl(7).result,ttl(8).record.until],[true,null,'match',null]);
  assert.deepEqual(graph.back,['test','lint']); assert(!graphWalk({a:[],b:['a']}).back);
  assert.deepEqual(schedule(2).queue,['test']); assert.equal(schedule(3).unmet,0);
  assert.deepEqual([schedule(2).states.deploy,schedule(2).unmet],['waiting',1]);
  assert.deepEqual([schedule(3).queue,schedule(3).states.deploy],[['deploy'],'ready']);
  assert.deepEqual(schedule(4).history,['docs','test','test','deploy']);
  assert.deepEqual([schedule(7).states.deploy,schedule(7).attempts.deploy,schedule(7).unmet],['blocked',0,1]);
  for(let i=0;i<9;i++) assert(bucket(i).tokens>=0 && bucket(i).tokens<=3);
  assert.equal(bucket(5,.5).tokens,.25);
  assert.deepEqual([bucket(4).retry,bucket(6).retry,bucket(6).tokens,bucket(7).tokens,bucket(8).tokens],[1,.5,.5,1,0]);
  assert.deepEqual([ledger(3).reply,ledger(4).reply,ledger(4).balance,ledger(4).events.length],[null,100,70,2]);
  assert.deepEqual(ledger(5).events,ledger(4).events); assert.equal(ledger(5).reply,'conflict');
  assert.deepEqual([ledgerPolicy(2).reply,ledgerPolicy(4).reply,ledgerPolicy(4).events.length],['key conflict','insufficient',2]);
  assert(!ledgerPolicy(4).saved.has('withdraw-2'));
  assert.deepEqual([ledgerPolicy(5).balance,ledgerPolicy(7).balance,ledgerPolicy(7).events.length],[90,10,4]);
  assert.deepEqual(locks(3).held,['A','B']); assert.deepEqual(locks(6).released,['B','A']);
  assert.deepEqual(parseLines(lines.slice(0,4)),{records:['build|red tail'],current:null});
  assert.deepEqual(parseLines(lines.slice(0,5)),{records:['build|red tail'],current:null});
  assert.deepEqual(parseLines(lines).records,['build|red tail','done']);
  assert.deepEqual([jobPlan(2,3,1,false).at(-1).end,jobPlan(2,3,1,true).at(-1).end],[8,5]);
  assert.deepEqual([jobPlan(3,4,.5,false).at(-1).end,jobPlan(3,4,.5,true).at(-1).end],[13.5,5.5]);
  assert.deepEqual(
    jobPlan(3,4,.5,true).map(({start,available,parse,end}) => [start,available,parse,end]),
    [[0,4,4,4.5],[0,4,4.5,5],[0,4,5,5.5]],
  );
  assert.deepEqual(mergeRecord(8).parent,{}); assert.equal(mergeRecord(9).parent['job-A'],2);
}
