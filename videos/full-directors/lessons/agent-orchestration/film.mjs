import assert from 'node:assert/strict';
import { paintStrip } from './fox.mjs';
import { C, arrow, b, clamp, cue, dot, foot, fox, icon, lerp, mono, path, poly, receipt, rect, serif, stage, tag, tick, tints, txt } from './drawing.mjs';
import { REQUEST, RECEIPTS, afterFirst, afterReplay, age, append, badUpdate, branches, canWrite, changedTraffic, checkRelease, clockTime, deferredInspection, digest, duplicate, evalPct, firstWrite, fixed3, fixed4, goodUpdate, healthPct, keyClash, limit, mergeCost, mixed, names, otherTenant, ownedUpdate, pack3, pack4, parallelRead, probeSelection, proposal, readSchedule, replay, saved, serialRead, signed3, signed4, sourceCorrection, validation, values, waitingJoinTrace } from './release.mjs';

const observations = [
  values.eval.failures+' / '+values.eval.cases+' regressions',
  values.health.errors+' / '+values.health.requests.toLocaleString('en-US')+' errors',
  values.policy.maxTraffic+'% traffic cap',
];
const shortDigest = value => value.slice(0,8);
const centered = (g,s,x,y,size=36,color=C.ink,width) => txt(g,s,x,y,size,{align:'center',color,width,weight:600});
const fact = (g,label,value,x,y,w=450) => {
  txt(g,label,x,y,31,{color:C.dim});
  mono(g,value,x,y+63,49,C.ink,'left',w);
};
function afterClause(k,beat,answer,nextPhrase=null,fade=0) {
  if(b(k)!==beat) return Number(b(k)>beat);
  // The host opens a caption on the answer. The picture follows the completed clause.
  k.reveal(answer,0);
  return nextPhrase?k.reveal(nextPhrase,fade):Number(k.elapsed>=k.speechDuration);
}
function openingRequest(g,k) {
  const request=cue(k,0,'An operator',0);
  const quarter=cue(k,0,'a quarter',0.72);
  const question=cue(k,0,'What would you want',0);
  stage(g,'Release review',question?'Which checks does Vega need?':'Fox Run');

  const buildX=request?80:360;
  const buildY=request?281:227;
  const scale=request?7:10;
  fox(g,[3,3,3],buildX,buildY,scale);
  mono(g,'r17 / v3',buildX,buildY+60*scale+57,46,C.plum);

  if(request===0) return;
  txt(g,'Player groups',1032,310,46,{weight:600});
  rect(g,1032,505,790,177,C.lilac);
  txt(g,'Proposed rollout',1066,568,45,{weight:600,color:C.plum});
  if(quarter>0) mono(g,REQUEST.traffic+'%',1066,652,72,C.plum);
  for(let i=0;i<4;i++) {
    const startX=1115+i*193;
    const move=i===3?quarter:0;
    const x=lerp(startX,1665,move);
    const y=lerp(407,596,move);
    dot(g,startX,407,56,C.paper,C.rule,3);
    dot(g,x,y-15,17,C.plum);
    g.beginPath();
    g.arc(x,y+27,31,Math.PI,2*Math.PI);
    g.fillStyle=C.plum;
    g.fill();
  }
  mono(g,'0% live',1032,784,62,C.ink);
}
function opening(g,k) {
  const n=b(k);
  if(n===0) return openingRequest(g,k);
  if(n<3) {
    stage(g,'Fox Run   /   Release 17','Should Vega propose a rollout?');
    fox(g,[3,3,3],80,281,7);
    txt(g,'Build supplied for review',80,760,34,{color:C.dim});
    mono(g,'r17 / v3',920,760,36,C.plum,'right');
    const appear=branches.map((s,i)=>cue(k,1,['Evaluation counts','Health counts','Policy sets'][i]));
    branches.forEach((key,i)=>{
      const y=269+166*i, x=1015;
      rect(g,x,y,818,135,appear[i]?C.paper:C.bg,C.rule);
      icon(g,key,x+61,y+63,.79,appear[i]?C[key]:C.rule);
      txt(g,names[key],x+125,y+54,47,{weight:600,color:appear[i]?C.ink:C.dim});
      if(appear[i]) mono(g,observations[i],x+125,y+105,34,C[key]);
    });
    foot(g,n===1?'Three reads for the same build':'One proposal goes to a reviewer',
      n===1?'Each worker returns its own evidence.':'Only an authorized writer can change the live allocation.');
  } else {
    stage(g,'Choosing the workers','Does this work earn another context?');
    const rows=[
      ['Interpret two sets of notes','Bound the questions','Two specialists',C.eval],
      ['Extract counts from logs','Known transformations','Parallel code',C.policy],
      ['Edit one evolving trace','Each edit changes the next input','One scoped agent',C.plum],
    ];
    rows.forEach(([job,why,owner,col],i)=>{
      const y=279+i*175, active=i===0?afterClause(k,3,'two specialists','interpret independent'):i===1?afterClause(k,3,'ordinary parallel code','does the job'):afterClause(k,4,'one scoped agent','on that trace');
      dot(g,110,y+43,20,active?col:C.rule);
      txt(g,job,164,y+48,47,{weight:600});
      txt(g,why,164,y+100,33,{color:C.dim});
      arrow(g,939,y+44,1120,y+44,active?col:C.rule);
      if(active) { rect(g,1160,y,632,93,i===0?C.mist:i===1?C.mint:C.lilac);txt(g,owner,1190,y+61,48,{color:col,weight:600}); }
    });
    foot(g,n===3?'Choose by the work each branch owns':'What must the next worker know?',
      n===3?'Independent interpretation can justify a specialist.':'Compare quality, total tokens, elapsed time and review effort.');
  }
}

function graph(g,k) {
  const n=b(k), ready=cue(k,0,'Now evaluation'), all=cue(k,0,'Merge needs');
  stage(g,'Release 17   /   Control flow',n<2?'Which operations are ready?':'Trace the review route');
  if(n<2) {
    const ys=[320,505,690];
    path(g,[[345,505],[477,505],[477,320],[677,320]],C.dim);
    path(g,[[477,505],[477,690],[677,690]],C.dim);
    path(g,[[477,505],[677,505]],C.dim);
    branches.forEach((key,i)=>{
      const y=ys[i],col=ready?C[key]:C.rule;
      arrow(g,590,y,705,y,col);
      rect(g,713,y-62,460,124,ready?tints[key]:C.paper,col);
      icon(g,key,776,y,.8,col);txt(g,names[key],837,y+12,46,{weight:600});
      if(n===1) txt(g,['Interpret notes','Read metrics','Compare a cap'][i],837,y+50,27,{color:C.dim});
      path(g,[[1173,y],[1300,y],[1380,505]],all?col:C.rule);
    });
    tag(g,'Triage',91,473,250,C.ink,C.white,43);
    arrow(g,1380,505,1470,505,C.dim);
    tag(g,'Merge',1482,473,304,all?C.mint:C.paper,C.ink,43);
    foot(g,n===0?'Triage fixes the input for all three reads':'A directed acyclic graph',
      n===0?'The merge node needs the three terminal results.':'Every path through this phase goes forward.');
  } else {
    const xs=[270,768,1300], y=485;
    ['Proposal','Review','Writer'].forEach((label,i)=>{
      dot(g,xs[i],y,101,i===1?C.lilac:C.paper,C.ink,3);
      centered(g,label,xs[i],y+14,42);
      if(i<2) arrow(g,xs[i]+109,y,xs[i+1]-110,y,C.dim);
    });
    txt(g,'approval',1004,448,32,{color:C.dim,align:'center'});
    const back=cue(k,3,'return edge',.9);
    if(back) {
      path(g,[[768,381],[768,300],[270,300],[270,360]],C.plum,6);
      arrow(g,270,350,270,378,C.plum,6);
      centered(g,'optional revision',524,273,34,C.plum);
    } else {
      mono(g,'pause',768,667,37,C.plum,'center');
      rect(g,741,696,16,39,C.plum);rect(g,771,696,16,39,C.plum);
    }
    if(cue(k,3,'reviewer rejection')) {
      arrow(g,871,543,1172,706,C.warn,4);
      tag(g,'Cancel',1180,685,243,C.peach,C.warn);
      txt(g,'if declined',1032,592,30,{color:C.warn});
    }
    if(back) foot(g,'The return edge creates a cycle','The article routes a declined review to cancel.');
    else if(cue(k,2,'Waiting adds time')) foot(g,'Waiting adds time to this path','A pause or an internal retry leaves the outer dependencies intact.');
    else foot(g,'Does the pause add a cycle?');
  }
}

function latency(g,k) {
  const n=b(k);
  const readTime = cue(k,1,'Start the clock',1.05)+cue(k,1,'Evaluation arrives',1.1)
    + .85*cue(k,1,'Watch health keep running',3.2)+.15*cue(k,1,'Health arrives at three',.55);
  let t=readTime;
  if(afterClause(k,1,'three and a half seconds')) {
    t=parallelRead+mergeCost;
  } else if(n===1) {
    // Scale the merge clock from its spoken start through the end of the result clause.
    const sinceStart=k.reveal('half-second merge',k.speechDuration)*k.speechDuration;
    const remaining=k.speechDuration-k.elapsed;
    const ticks=Math.floor(10*mergeCost*sinceStart/(sinceStart+remaining));
    t+=ticks/10;
  }
  const sch=readSchedule(t), lanes=[...branches,'merge'], x=412, unit=204, y0=332;
  stage(g,'Illustrative timings   /   Independent reads','Start three reads on the same clock');
  for(let i=0;i<=6;i++){
    const xx=x+i*unit;
    mono(g,i+' s',xx,279,34,C.dim,'center');
    path(g,[[xx,303],[xx,785]],C.rule,2,[4,9]);
  }
  const durations=[...sch.branches.map(r=>r.duration),mergeCost];
  const stated=['health takes','and policy takes','In sequence','for merge'].map(phrase=>cue(k,0,phrase,0));
  const subtotal=afterClause(k,0,'six seconds','Add half a second');
  const total=afterClause(k,0,'half a second for merge','Now line the starts up');
  lanes.forEach((key,i)=>{
    const y=y0+i*94,start=i===3?parallelRead:0,d=durations[i],xx=x+start*unit;
    const col=i===3?C.plum:C[key], tint=i===3?C.lilac:tints[key];
    txt(g,i===3?'Merge':names[key],84,y+41,43,{weight:600});
    if(!stated[i]) return;
    if(i===3 && !sch.allReads) {
      mono(g,d+' s',x-46,y+39,32,col,'right');
      return;
    }
    rect(g,xx,y,d*unit,55,tint,col,2);
    rect(g,xx,y,Math.min(d,Math.max(0,t-start))*unit,55,col);
    if(t>=start+d) tick(g,xx+d*unit+28,y+29,col);
    else if(n===0) mono(g,d+' s',xx+d*unit/2,y+39,29,col,'center');
  });
  if(n>0) {
    const xx=x+t*unit;
    path(g,[[xx,297],[xx,684]],C.ink,3);
    poly(g,[[xx-9,289],[xx+9,289],[xx,304]],C.ink);
    rect(g,1366,575,475,84,C.bg);
    const clockReading=Math.floor(t*10+1e-9)/10;
    mono(g,clockReading.toFixed(1)+' s elapsed',1818,635,44,C.ink,'right');
  }
  let left=x;
  txt(g,'In sequence',84,777,36,{color:C.dim});
  durations.forEach((duration,i)=>{
    if(!stated[i] || (i===3 && !total)) return;
    const w=duration*unit;
    rect(g,left,737,w-2,44,i===3?C.plum:C[branches[i]]);
    left+=w;
  });
  if(subtotal) mono(g,(total?serialRead+mergeCost:serialRead)+' s',left+22,772,33);
  foot(g,n===0?'At two seconds, which read is missing?':n===1?(sch.mergeComplete?'Reads and merge finish at '+t+' s':t>parallelRead?'Merge is running.':sch.allReads?'All reads are in. Merge can start.':'The clock runs until the last receipt arrives.'):'Same read work. Different elapsed time.',
    n===2?'6 s of read work in either schedule. Queueing and dispatch can change the measured saving.':'One shared time scale for evaluation, health, policy and merge.');
}
function worker(g,k) {
  const n=b(k), ev=RECEIPTS[0];
  const sorted=n===4&&cue(k,4,'sort the branch names');
  const heading=n<3?'Which fields may this worker write?':n===3?'What does list addition preserve?':sorted?'Sort the receipts by branch':'Check one receipt per branch';
  stage(g,n===4?'Packet builder   /   Validated evidence':'Evaluation worker   /   Typed state',heading);
  if(n<3) {
    const inspect=n===2;
    const cols=inspect?[['branch',ev.branch],['observed at',ev.time],['value',values.eval.failures+' / '+values.eval.cases],['digest',shortDigest(ev.digest)+'…']]:
      [['tenant',REQUEST.tenant],['request',REQUEST.request],['release / revision',REQUEST.release+' / v'+REQUEST.version],['traffic',REQUEST.traffic+'%']];
    rect(g,82,258,790,535,C.paper,C.rule);
    rect(g,82,258,790,80,inspect?C.eval:C.ink);
    txt(g,inspect?'Evaluation receipt':'Copied request view',112,312,42,{color:C.white,weight:600});
    cols.forEach(([label,value],i)=>{
      const y=388+i*103;
      txt(g,label,115,y,32,{color:C.dim});mono(g,value,836,y+11,40,C.ink,'right',420);
      path(g,[[114,y+41],[838,y+41]],C.rule,1.5);
    });
    arrow(g,886,526,986,526,C.dim);
    const valid=ownedUpdate('eval',goodUpdate), denied=!ownedUpdate('eval',badUpdate)&&cue(k,1,'approval field');
    if(inspect) {
      txt(g,'Local source registry',1033,324,48,{weight:600});
      fact(g,'eval',observations[0],1033,416,742);
      fact(g,'digest of branch values',shortDigest(digest(values.eval))+'…',1033,605,750);
      foot(g,'Compare the claimed values with their source','In the film registry, scope and time are supplied separately.');
    } else {
      txt(g,'Checked return',1033,322,46,{weight:600});
      receipt(g,1025,370,770,172,ev,{detail:n===1&&cue(k,1,'Two regressions')&&valid?observations[0]:'receipts: [eval]' });
      if(n===1&&denied) {
        rect(g,1025,597,770,121,C.peach,C.warn,2);
        mono(g,'approved: true',1051,650,36,C.warn);
        txt(g,'outside worker contract',1051,698,32,{color:C.warn});
      }
      foot(g,denied?'Wrapper rejects the extra field':'Evaluation owns one receipt',
        denied?'The entire return fails the ownership check.':'The request identity and requested traffic come from trusted application state.');
    }
  } else {
    const reverse=cue(k,3,'Reverse the inputs'), dup=cue(k,3,'again and');
    const inputs=[...RECEIPTS].reverse();
    const list=n===3?append(reverse?['eval','health']:['health','eval'],dup?['eval']:[]):inputs.map(r=>r.branch);
    if(sorted) list.sort((a,b)=>a.localeCompare(b));
    txt(g,n===3?'Reducer inputs':'Validated inputs',90,304,39,{color:C.dim});
    const size=470;
    list.forEach((key,i)=>{
      const x=105+i*574,y=402;
      receipt(g,x,y,size,181,RECEIPTS[branches.indexOf(key)],{detail:'r17 / v3'});
      if(i!==list.length-1) arrow(g,x+size+10,y+90,x+size+85,y+90,C.dim);
    });
    mono(g,n===3?JSON.stringify(list):sorted?'Evidence digest   '+shortDigest(proposal(inputs).evidenceDigest)+'…':'Evidence digest pending',92,726,50,C.plum,'left',1700);
    if(n===3) foot(g,dup?'A duplicate survives the append':'List order follows reducer input order','The join must count the receipts and check their identities.');
    else if(sorted) foot(g,'The digest covers these three evidence records.','The proposal also carries the requested action, including the traffic percentage.');
  }
}

function chips(g,list,x,y,w=185) {
  list.forEach((key,i)=>tag(g,names[key],x+i*(w+10),y,w,tints[key],C[key],31));
}
function dynamicJoin(g,k) {
  const indexDone=cue(k,5,'index finishes')>0;
  const pending=indexDone?[]:['Index update'];
  const inspection=deferredInspection(pending);
  const checking=inspection&&cue(k,5,'Merge now inspects');
  stage(g,'Graph runtime   /   Dynamic selection','Two selected reads schedule a deferred merge');
  txt(g,'Selected terminals',90,295,41,{weight:600});
  probeSelection.forEach((key,i)=>{
    const y=375+i*145;
    tag(g,names[key],90,y-28,355,tints[key],C[key],40);
    tick(g,494,y+4,C[key]);
    arrow(g,539,y+4,1000,443+i*12,C[key],4);
  });
  rect(g,1030,337,780,233,checking?C.mint:C.paper,C.rule);
  txt(g,'Deferred merge',1066,405,48,{weight:600});
  if(checking) {
    txt(g,'Inspected receipts',1067,457,32,{color:C.dim});
    chips(g,inspection.identities,1067,480,248);
  } else {
    mono(g,indexDone?'ready to run':'scheduled',1067,500,45,C.plum);
  }
  path(g,[[90,613],[1810,613]],C.rule,2);
  txt(g,'Elsewhere in the graph',90,682,41,{weight:600});
  txt(g,'Index update',90,775,39);
  const trackX=434,trackY=739,trackW=530;
  rect(g,trackX,trackY,trackW,34,C.paper,C.rule);
  const progress=indexDone?1:0.25+0.65*cue(k,5,'still running',2);
  rect(g,trackX,trackY,trackW*progress,34,indexDone?C.green:C.plum);
  if(indexDone) tick(g,1000,trackY+17,C.green);
  mono(g,'Other pending tasks   '+pending.length,1067,770,41,indexDone?C.green:C.plum);
  if(checking) foot(g,inspection.match?'Both receipts match the selected branches':'Selected identities differ',
    'Release 17 still requires evaluation, health and policy before a proposal.');
  else foot(g,indexDone?'All other graph work has finished.':'The receipts are in. The index update is still running.');
}
function supersteps(g,k) {
  const n=b(k);
  if(n===5&&cue(k,5,'separate workflow')) return dynamicJoin(g,k);
  stage(g,'Graph runtime   /   Channel updates',n===0?'When can a node see the new value?':n===1?'Two writers reach one scalar':n===2?'Resume or start another attempt?':n===6?'How far does a read-only view reach?':n===5?'What if routing skips health?':'Health takes an extra step');
  if(n===0) {
    const applied=cue(k,0,'step boundary'),next=cue(k,0,'next step');
    ['Read channels','Return updates','Next step reads'].forEach((name,i)=>{
      const x=80+i*599; txt(g,name,x,335,45,{weight:600});
      rect(g,x,394,517,220,i===1?C.lilac:C.paper,C.rule);
      mono(g,i===0?'[]':i===1?'[eval]':next?'[eval]':'waiting',x+34,529,50,i===1?C.plum:C.ink);
      if(i<2)arrow(g,x+524,509,x+579,509,C.dim);
    });
    if(applied) tag(g,'Updates applied',750,705,420,C.mint,C.green,39);
    foot(g,'Visibility changes at the step boundary','Each selected node reads the state that was available at the start of its step.');
  } else if(n===1) {
    const denied=cue(k,1,'rejects concurrent updates');
    [365,651].forEach((y,i)=>{
      mono(g,'worker '+(i+1),98,y+12,39);
      tag(g,'traffic = 25',412,y-35,387,C.lilac,C.plum,39);
      arrow(g,816,y,1026,511,C.dim);
    });
    rect(g,1054,427,662,157,denied?C.peach:C.paper,C.rule);
    txt(g,denied?'Concurrent update rejected':'traffic   /   scalar',1385,520,48,{weight:600,align:'center',width:612});
    foot(g,denied?'Two equal updates still collide':'One unreduced field, two updates','Use one writer for traffic. The receipt list has a different merge rule.');
  } else if(n===2) {
    const reset=cue(k,2,'replace the channel'),resume=cue(k,2,'same failed attempt');
    txt(g,'Stored writes',92,314,43,{weight:600});chips(g,saved.map(r=>r.branch),92,355,218);
    path(g,[[92,494],[1818,494]],C.rule);
    txt(g,'New attempt',94,601,43,{weight:600});
    if(reset) mono(g,'Overwrite([])   →   []',568,601,43,C.plum);
    else {mono(g,'add []',571,601,38);chips(g,append(saved,[]).map(r=>r.branch),988,552,211);}
    txt(g,'Same attempt',94,745,43,{weight:600});
    if(resume){chips(g,saved.map(r=>r.branch),568,690,215);mono(g,'retry health',1128,739,39,C.health);}
    foot(g,'A restart and a fresh attempt have different inputs','A new thread or an attempt-aware reducer can also separate attempts.');
  } else if(n<6) {
    const separate=n===4,skipped=n===5;
    const partial=separate?cue(k,4,'first merge'):0;
    const earlyArrivals=cue(k,3,'Evaluation and policy have arrived',.9);
    const final=skipped?false:separate?cue(k,4,'next sees all three'):cue(k,3,'until health arrives',1.1);
    const trace=waitingJoinTrace(final>=1?4:2);
    const runs=separate?trace.separateMerges:trace.waitingMerges;
    const healthDone=trace.arrivals.find(r=>r.id==='Health').done&&!skipped;
    const xs=[396,780,1115],ys=[374,540,706];
    txt(g,'Terminal nodes',85,273,31,{color:C.dim});
    txt(g,separate?'Separate incoming edges':'One list-form waiting edge',1132,274,38,{weight:600,width:680});
    branches.forEach((key,i)=>{
      const y=ys[i], arrived=i===1?healthDone:earlyArrivals===1;
      icon(g,key,121,y,.78,C[key]);txt(g,names[key],174,y+12,42,{weight:600});
      path(g,[[xs[0],y],[xs[2],y]],C.rule,3,[6,10]);
      if(i===1){
        if(!skipped)tag(g,'prep',xs[0]+22,y-32,158,C.peach,C.health,32);
        else {rect(g,xs[0]+23,y-38,184,74,C.bg);txt(g,'skipped',xs[0]+44,y+12,38,{color:C.dim});}
      }
      if(!skipped||i!==1){
        const pos=i===1?lerp(xs[1],xs[2]-35,final||0):lerp(xs[0],xs[2]-35,earlyArrivals);
        dot(g,pos,y,21,arrived?C[key]:C.paper,C[key],4);
        if(arrived)tick(g,pos,y,C.white);
      }
      if(separate)arrow(g,xs[2]+8,y,1334,540,C[key]);
    });
    if(!separate) {
      path(g,[[xs[2]+8,ys[0]],[xs[2]+26,ys[0]],[xs[2]+26,ys[2]],[xs[2]+8,ys[2]]],C.plum,5);
      arrow(g,xs[2]+26,540,1324,540,C.plum);
    }
    const gateAnswered=cue(k,3,'gate stays shut');
    rect(g,1350,423,461,241,healthDone?C.mint:C.paper,C.rule);
    centered(g,skipped?'Fixed gate':separate?'Merge calls':'Merge ready?',1581,495,37);
    const status=skipped?'Waiting':separate?(partial?String(runs.length):'…'):healthDone?'Yes':gateAnswered?'Waiting':'';
    if(status) serif(g,status,1581,594,69,healthDone?C.green:C.plum,'center',417);
    if(skipped) foot(g,'A missing terminal keeps this gate shut','This fixed edge names all three terminal nodes.');
    else if(separate) foot(g,healthDone?'Second call sees evaluation, health and policy':partial?'First call sees evaluation and policy':'Replay with three ordinary edges','A real release validator rejects the partial first call.');
    else if(gateAnswered) foot(g,healthDone?'One merge may now inspect the evidence':'The gate is waiting for health','Scheduling counts completions. The evidence still needs validation.');
  } else {
    const copy=cue(k,6,'deep copy'), w=560;
    txt(g,'Worker view',120,334,48,{weight:600});txt(g,'Original nested list',1060,334,48,{weight:600});
    tag(g,'receipts',120,437,w,C.lilac,C.plum,46);
    if(copy) arrow(g,395,516,395,604,C.plum);
    else arrow(g,720,470,1008,470,C.dim);
    tag(g,copy?'[ ]':'[ local edit ]',1060,437,667,copy?C.mint:C.peach,copy?C.green:C.warn,44);
    if(copy){tag(g,'[ local edit ]',120,617,w,C.peach,C.warn,42);txt(g,'Copied list',720,664,37,{color:C.dim});}
    foot(g,copy?'The copy separates these values':'A shallow proxy still points to the same list','Runtime-owned tools, credentials and isolation protect the execution boundary.');
  }
}

function tenant(g,k) {
  const n=b(k), repaired=cue(k,1,'Refresh health for tenant seven',1.0)===1;
  stage(g,'Semantic join   /   Release 17',n<2?'Do these receipts belong together?':n===2?'Measure the corrected batch':n===3?'Is the requested amount in range?':'The reference stayed the same');
  if(n<2) {
    const rows=repaired?RECEIPTS:otherTenant, rejected=afterClause(k,1,'Reject the batch','A barrier can tell us');
    mono(g,'request   '+REQUEST.tenant+' / '+REQUEST.release+' / v'+REQUEST.version,88,292,38);
    rows.forEach((row,i)=>{
      const x=80+i*602, bad=row.tenant!==REQUEST.tenant&&rejected;
      receipt(g,x,367,558,320,row,{detail:observations[i]});
      rect(g,x+25,550,508,101,bad?C.peach:C.bg);
      mono(g,row.tenant,x+49,618,51,bad?C.warn:C.ink);
      if(bad) mono(g,'≠',x+476,617,50,C.warn,'right');
    });
    foot(g,!rejected?'Would you put these three in one packet?':validation(rows,REQUEST)?'Scope matches on the refreshed batch':'Join rejected the cross-tenant result',
      n===0?'Three workers finished. Compare each tenant to the request.':'Check identity, age, source content and one receipt per required branch.');
  } else if(n===2){
    const gauges=[['Evaluation',evalPct,3,values.eval.failures+' / '+values.eval.cases,C.eval],
      ['Health',healthPct,0.1,values.health.errors+' / '+values.health.requests.toLocaleString('en-US'),C.health]];
    gauges.forEach(([label,val,max,sample,col],i)=>{
      const y=313+i*242, shown=i?afterClause(k,2,'point zero four percent','or four tenths',0.35):
        afterClause(k,2,'two percent','within this example',0.35);
      txt(g,label,88,y+41,52,{weight:600}); mono(g,sample,90,y+107,39,C.dim);
      const left=626,w=1020;
      rect(g,left,y+45,w,41,C.paper,C.rule);
      path(g,[[left+w,y+24],[left+w,y+110]],C.ink,5);
      mono(g,max+'% limit',left+w,y+149,34,C.dim,'center');
      if(shown) {
        g.save();
        g.globalAlpha=shown;
        rect(g,left,y+45,w*val/max,41,col);
        mono(g,val+'%',left,y+13,49,col);
        g.restore();
      }
    });
    foot(g,k.elapsed>=k.speechDuration?'Both rates fit the illustrative limits':'Compare each observed rate with its own limit',
      afterClause(k,2,'ten seconds old','Evaluation has two')?'At the supplied clock time, the corrected receipts are 10 seconds old.':'');
  } else if(n===3) {
    const negative=afterClause(k,3,'Minus one','would pass a test');
    const explained=cue(k,3,'Twenty-five is in range',0);
    const returned=cue(k,3,'is in range',0), answered=afterClause(k,3,'is in range','These thresholds');
    const val=negative&&!returned?-1:REQUEST.traffic, pos=(v)=>578+v*41;
    const col=val<0&&explained?C.warn:C.plum;
    txt(g,val<0?'Test request':'Requested traffic',82,403,42,{weight:600});serif(g,val+'%',80,526,94,col);
    path(g,[[460,540],[1765,540]],C.rule,7);
    rect(g,pos(0),527,pos(25)-pos(0),26,C.mint);
    [0,5,10,15,20,25].forEach(v=>{path(g,[[pos(v),510],[pos(v),566]],C.ink,3);mono(g,v+'%',pos(v),614,33,C.ink,'center');});
    dot(g,pos(val),504,20,col);
    const verdict=answered?(validation(RECEIPTS,{...REQUEST,traffic:val})?'The integer request is inside the cap':'Request rejected'):'Check the integer and both ends of the range';
    foot(g,verdict,
      explained?'An upper bound alone would admit −1%. The lower bound excludes it.':'The traffic percentage must be an integer from 0 to 100 and satisfy the policy cap.');
  } else {
    const change=cue(k,4,'corrected from two regressions to one'),compare=cue(k,4,'old receipt fails'),fresh=cue(k,4,'Read the corrected source');
    const cols=[[fresh?'Refreshed receipt':'Returned receipt',fresh?sourceCorrection:values.eval,fresh?digest(sourceCorrection):RECEIPTS[0].digest],['Resolved source',change?sourceCorrection:values.eval,change?digest(sourceCorrection):RECEIPTS[0].digest]];
    cols.forEach(([label,val,hash],i)=>{
      const x=86+i*903;txt(g,label,x,320,45,{weight:600});
      mono(g,'eval / same reference',x,412,35,C.dim);
      serif(g,val.failures+' / '+val.cases,x,553,87,C.eval);
      mono(g,shortDigest(hash)+'…',x,685,48,fresh?C.green:compare&&i?C.warn:C.plum);
    });
    foot(g,fresh?'New source content needs a new review packet':compare?'Both pass policy. The evidence changed.':'Compare the evidence under the reference',
      fresh?'The refreshed evaluation receipt now matches the corrected source.':'The join resolves trusted content, recomputes its digest and checks the returned receipt.');
  }
}
function checkpoint(g,k) {
  const n=b(k);
  stage(g,'Recovery   /   One release thread',n<3?'What survives a restart?':n===3?'Resume the thread. Advance the clock.':'Give the failure to its owner');
  if(n<2) {
    // Show saved branch writes beside volatile worker state. The central
    // shutter closes over the process only, leaving its checkpoint readable.
    const parked=cue(k,0,'Evaluation and policy reached storage'),restart=cue(k,0,'process restarts');
    const restored = n === 1 && k.reveal('Restore the same authorized thread', 0, { captionStart: false });
    const reattach = n === 1 ? k.reveal('two saved results', 0.55, { captionStart: false }) : 0;
    const retry = n === 1 && k.reveal('Retry health', 0, { captionStart: false });
    rect(g,92,289,732,466,C.dark,C.ink,5);
    txt(g,'Worker process',128,358,49,{weight:600,color:C.white});
    branches.forEach((key,i)=>{
      const y=430+i*106, alive=!restart||restored;
      const active = alive && (key === 'health' ? retry : !restored || reattach === 1);
      dot(g,151,y,16,active?C.gold:C.dim);
      txt(g,names[key],190,y+15,40,{color:alive?C.white:'#ADBAC2'});
      let state = restored ? (reattach === 1 ? 'reused write' : 'reattaching') : 'returned';
      if (key === 'health') state = retry ? 'retry read' : 'timeout';
      if (!alive) state = 'offline';
      mono(g,state,788,y+12,32,alive?C.white:'#ADBAC2','right');
    });
    arrow(g,restored?1024:856,530,restored?856:1024,530,C.plum,6);
    if (reattach > 0 && reattach < 1) {
      for (const offset of [0, 24])
        dot(g, lerp(1024, 856, reattach), 515 + offset, 8, C.gold);
    }
    rect(g,1054,310,747,458,C.paper,C.rule,3);
    rect(g,1054,273,533,67,C.lilac);
    txt(g,'Thread checkpoint',1080,319,40,{weight:600,color:C.plum});
    saved.forEach((row,i)=>{
      const y=377+i*166;
      if(parked) receipt(g,1081,y,686,145,row,{detail:row.tenant+'   v'+row.version+'   t='+row.time});
      else rect(g,1081,y,686,145,C.bg,C.rule);
    });
    const replay = retry
      ? `${saved.length} writes reused. ${branches.length - saved.length} read retried.`
      : reattach === 1
        ? `${saved.length} writes reattached to the thread.`
        : restored
          ? 'Restoring the authorized thread'
          : restart
            ? 'The process stopped. Two writes remain.'
            : 'A checkpointer can keep completed writes';
    foot(g,replay,'Integration sketch with a checkpointer and an authorized thread.');
  } else if(n===2) {
    const again=cue(k,2,'from the beginning',1.1),external=cue(k,2,'external write');
    txt(g,'Resumed node',90,324,48,{weight:600});
    const left=209,right=1005,y=513;
    arrow(g,left,y,right,y,C.dim,5);
    [left,626,right].forEach((x,i)=>{
      dot(g,x,y,21,i===2?C.plum:C.ink);
      centered(g,['Enter node','Earlier work','Interrupt'][i],x,604,35,C.ink,308);
    });
    if(again){
      path(g,[[right,478],[right,412],[left,412],[left,451]],C.plum,5);
      arrow(g,left,451,left,480,C.plum,5);
      centered(g,'Resume re-enters here',584,382,36,C.plum);
    }
    rect(g,1234,363,575,326,external?C.peach:C.paper,C.rule);
    centered(g,'External destination',1522,459,41,C.ink,530);
    serif(g,external?'Effect unknown':'?',1522,577,62,C.warn,'center',529);
    foot(g,'Ask the destination what happened','A caller checkpoint can restore the node. It cannot establish the outcome of an external write.');
  } else if(n===3) {
    const baseline=afterClause(k,3,'ten seconds. Resume','Resume at twelve hundred');
    const resumed=afterClause(k,3,'twelve hundred','and their age is');
    const now=resumed?1200:clockTime;
    const showAge=resumed?afterClause(k,3,'two hundred ten seconds','Our sixty-second limit'):baseline;
    const elapsed=age(saved[0],now);
    const expired=afterClause(k,3,'has expired','Use a trusted current clock') && elapsed>limit;
    fact(g,'Observation time',saved[0].time,85,352,420);
    fact(g,'Trusted clock',now,85,548,420);
    if(resumed) mono(g,'At '+clockTime+'   '+age(saved[0],clockTime)+' s old',85,741,33,C.dim);
    const x=640,y=523,w=1100,scale=w/220;
    const reading=showAge?'age   '+elapsed+' s':now+' − '+saved[0].time+' = ?';
    const color=expired?C.warn:showAge&&!resumed?C.policy:C.ink;
    mono(g,reading,x,407,59,color);
    rect(g,x,y,w,65,C.paper,C.rule);
    if(showAge) rect(g,x,y,elapsed*scale,65,expired?C.health:resumed?C.plum:C.policy);
    path(g,[[x+limit*scale,y-28],[x+limit*scale,y+105]],C.ink,5);
    mono(g,limit+' s limit',x+limit*scale,y+157,36,C.ink,'center');
    const verdict=expired?'Saved evidence has expired':resumed&&showAge?'Compare the age with the limit':
      showAge?'The observations are fresh at this clock time':'How old are the saved observations?';
    foot(g,verdict,'Age = current trusted time minus observation time. The article uses a separate 300 s limit.');
  } else {
    const routes=[
      ['Metrics read timed out','Bounded retry','a bounded retry','A permanently unknown'],
      ['Permanently unknown release','Resolve alias or review','alias resolution','A reviewer who declines'],
      ['Reviewer declined','Cancel','cancel','A writer that lost'],
      ['Lost writer reply','Reconcile the same key','asks the target',null],
    ];
    routes.forEach(([symptom,action,answer,nextClause],i)=>{
      const y=317+i*127,go=afterClause(k,4,answer,nextClause);
      dot(g,110,y+7,15,go?C.plum:C.rule);txt(g,symptom,158,y+22,44,{weight:600});
      arrow(g,829,y+6,1083,y+6,go?C.plum:C.rule);
      if(go)txt(g,action,1150,y+22,44,{weight:600,color:C.plum});
    });
    foot(g,'The failure determines the next action',
      k.elapsed>=k.speechDuration?'Bound retry attempts and deadlines. An unknown write outcome belongs at the target.':'');
  }
}

function packetPage(g,x,heading,packet,sign) {
  rect(g,x,262,794,488,C.paper,C.rule,2);
  rect(g,x,262,794,75,sign?C.plum:C.dark);
  txt(g,heading,x+30,314,43,{weight:600,color:C.white});
  const rows=[['tenant / request',packet.tenant+' / '+packet.request],['release / revision',packet.release+' / v'+packet.version],['traffic',packet.traffic+'%'],['evidence digest',shortDigest(packet.evidenceDigest)+'…']];
  rows.forEach(([name,value],i)=>{
    const y=402+i*86;
    txt(g,name,x+28,y,31,{color:C.dim});
    mono(g,value,x+761,y+4,38,i===3?C.plum:C.ink,'right',434);
    path(g,[[x+30,y+25],[x+762,y+25]],C.rule,1);
  });
}
function approval(g,k) {
  const n=b(k);
  const live=cue(k,1,'live release advance')?4:3;
  const current=n>=3?pack4:pack3, approved=n>=3?signed4:signed3;
  stage(g,'Write boundary   /   Release 17',n<3?'What exactly did the reviewer sign?':n===3?'A current approval reaches the target':n===4?'Replay the same operation key':n===5?'Which system remembers the effect?':'Before another write');
  if(n<3 || (n===3&&!cue(k,3,'target records one effect'))) {
    packetPage(g,81,'Release proposal',current,false);
    packetPage(g,1043,'Reviewer’s copy',approved,true);
    const match=n===3?cue(k,3,'Their fields match'):cue(k,0,'approves this exact packet');
    if(match){dot(g,960,501,45,C.green);tick(g,960,502,C.white);}
    const outcome=canWrite(approved,live,current);
    const blocked=!outcome&&cue(k,2,'Block the write');
    mono(g,'live target   r17 / v'+live,84,816,38,blocked?C.warn:C.ink);
    foot(g,n===0?'A yes belongs to one set of fields':n===3?'Fresh review for the revision-four proposal':blocked?'Write blocked. Review v3, target v4.':'Can the writer still use this review?',
      blocked?'Build a fresh packet from verified v4 evidence and obtain fresh approval.':'The two evidence digests are shown as eight-character prefixes.');
  } else if(n<6) {
    const written=cue(k,3,'target records one effect'),lost=cue(k,3,'reply goes missing');
    const replayed=cue(k,4,'returns the same result');
    const changed=n===4&&cue(k,4,'twenty percent');
    const clash=changed&&cue(k,4,'rejects the reused key')&&keyClash;
    const incoming=changed?changedTraffic:pack4;
    const vanished=n===5&&cue(k,5,'loses its replay protection');
    const effects=written?(replayed?afterReplay:afterFirst):0;
    txt(g,'Caller',89,319,43,{weight:600});
    mono(g,firstWrite.operation,87,431,67,C.plum);
    mono(g,incoming.release+' / v'+incoming.version+' / '+incoming.traffic+'%',90,510,41,clash?C.warn:C.ink);
    txt(g,'Evidence digest',90,596,33,{color:C.dim});
    mono(g,shortDigest(incoming.evidenceDigest)+'…',90,648,42);
    txt(g,'Packet fingerprint',90,713,33,{color:C.dim});
    mono(g,shortDigest(digest(incoming))+'…',90,767,42,clash?C.warn:C.ink);
    arrow(g,650,451,919,451,C.plum,6);
    if(lost&&!vanished&&(!changed||clash)){
      if(replayed)arrow(g,920,547,651,547,clash?C.warn:C.green);
      else path(g,[[920,547],[793,547]],C.warn,4,[9,8]);
      txt(g,clash?'key conflict':replayed?'saved reply':'reply lost',778,644,33,{align:'center',color:replayed&&!clash?C.green:C.warn});
    }
    rect(g,954,257,856,532,C.dark);
    txt(g,'Target ledger',990,329,47,{weight:600,color:C.white});
    path(g,[[991,360],[1774,360]],'#71828B',2);
    if(written&&!vanished){
      mono(g,'key       '+firstWrite.operation,993,423,41,C.white);
      mono(g,'result    '+(replayed?replay:firstWrite).change,993,487,41,C.white);
      mono(g,'traffic   '+firstWrite.traffic+'%',993,551,41,C.white);
      txt(g,'Saved packet fingerprint',994,622,33,{color:C.white});
      mono(g,shortDigest(digest(pack4))+'…',993,675,42,C.white);
      mono(g,'effects   '+effects,993,750,50,C.gold);
    } else {
      mono(g,vanished?'Record unavailable':'Waiting for write',991,533,47,C.white,'left',773);
    }
    foot(g,vanished?'Caller state cannot restore a target-side ledger':clash?'Different packet fingerprint. Key reuse rejected.':changed?'Compare the two packet fingerprints':replayed?'Same result. One traffic change.':lost?'Timeout at the caller, one effect at the target':written?'The target has recorded the change':'Match the new approval to the new proposal',
      n===5?'Persist the record atomically with the effect, or reconcile the destination’s actual state.':'The example target keeps operation records in memory.');
  } else {
    const labels=['Authenticate','Check current state','Commit at the target'];
    const details=[['Reviewer and writer','Permission to read saved results'],['Exact packet and review','Policy revision, expiry, live dependencies'],['Atomic preconditions','Durable operation record and effect']];
    const phases=[1,cue(k,6,'Before a new effect'),cue(k,6,'atomically')];
    labels.forEach((label,i)=>{
      const x=78+i*597;
      rect(g,x,327,550,332,phases[i]?i===2?C.mint:C.paper:C.bg,C.rule);
      dot(g,x+50,389,22,phases[i]?C.green:C.rule);
      if(phases[i])tick(g,x+50,390,C.white);
      txt(g,label,x+31,480,44,{weight:600,width:488});
      details[i].forEach((v,j)=>txt(g,v,x+31,551+j*55,33,{color:C.dim,width:488}));
    });
    foot(g,'Verify the resulting release state','Production checks current authority and records the effect at its destination.');
  }
}

// Roles occupy fixed positions. A moving message travels independently of the
// filled ownership token. A transfer moves the token itself.
function portrait(g,x,y,who,active=false) {
  const col=who==='Operator'?C.eval:who==='Health'?C.health:who==='Release'?C.policy:C.plum;
  dot(g,x,y,79,active?col:C.paper,col,4);
  const ink=active?C.white:col, base=active?col:C.paper;
  if(who==='Vega'||who==='Triage') {
    poly(g,[[x,y-47],[x+42,y-12],[x+23,y+39],[x-23,y+39],[x-42,y-12]],ink);
    rect(g,x-25,y-13,50,24,base);rect(g,x-16,y-6,8,8,ink);rect(g,x+9,y-6,8,8,ink);
  } else if(who==='Health')icon(g,'health',x,y,1.1,ink);
  else if(who==='Release'){
    rect(g,x-32,y-27,64,54,null,ink,4);
    poly(g,[[x-9,y-16],[x+18,y],[x-9,y+16]],ink);
  } else {
    dot(g,x,y-18,20,ink);g.beginPath();g.arc(x,y+37,34,Math.PI,2*Math.PI);g.fillStyle=ink;g.fill();
  }
  centered(g,who,x,y+137,46);
}
function travelling(g,x,u,y,t,col,s) {
  if(t<=0)return;
  const tip=lerp(x,u,t), tail=tip-Math.sign(u-x)*Math.min(24,Math.abs(tip-x));
  path(g,[[x,y],[tail,y]],col,5);
  poly(g,[[tip,y],[tail,y-11],[tail,y+11]],col);
  if(s) centered(g,s,(x+u)/2,y-25,33,col,Math.abs(u-x)-24);
}
function healthConsultation(g,k) {
  const reply=cue(k,1,'Vega replies',1.15);
  const ownsTurn=cue(k,1,'keeps the next turn');
  const named=cue(k,1,'tool call');
  stage(g,'Conversation ownership',reply?'Vega answers the operator':'Who answers the operator?');

  // The same request anchors the outgoing and returning paths.
  rect(g,78,394,510,306,C.paper,C.eval,3);
  rect(g,78,394,510,82,C.mist);
  txt(g,'Operator request',111,449,38,{weight:600,color:C.eval});
  serif(g,'Assess '+REQUEST.release+' for a',111,557,56);
  serif(g,REQUEST.traffic+'% rollout.',111,627,56);
  portrait(g,1005,551,'Vega',ownsTurn>0);
  portrait(g,1697,551,'Health');

  travelling(g,591,932,507,cue(k,0,'asks Vega',1.1),C.eval);
  travelling(g,1079,1624,507,cue(k,0,'count failed canary requests',1.35),C.plum,'Count canary errors');
  const back=cue(k,1,'that bounded result',1.3);
  if(cue(k,1,'Four errors',0)) {
    const x=lerp(1660,1005,back);
    const count=values.health.errors+' / '+values.health.requests.toLocaleString('en-US');
    rect(g,x-183,716,366,125,C.peach);
    centered(g,'Errors / requests',x,760,36,C.health);
    mono(g,count,x,821,53,C.ink,'center');
  }
  if(cue(k,1,'Health returns')) {
    travelling(g,1624,1079,595,back,C.health);
  }
  travelling(g,932,591,595,reply,C.plum,'Assessment');
  if(ownsTurn) tag(g,'Next turn',900,392,210,C.gold);
  if(named) {
    path(g,[[1005,382],[1005,357],[1697,357],[1697,382]],C.plum,3);
    centered(g,'Tool call',1351,333,47,C.plum);
  }
}
function ownership(g,k) {
  const n=b(k);
  if(n<2) return healthConsultation(g,k);
  stage(g,'Conversation ownership',n===2?'Give the specialist the next turn':n===3?'Which tools travel with the history?':'Who chooses the next step?');
  if(n===2) {
    const transfer=cue(k,2,'transfers the next turn',1.2);
    portrait(g,210,518,'Operator');portrait(g,947,518,'Triage',!transfer);
    portrait(g,1697,518,'Release',transfer===1);
    travelling(g,308,850,477,cue(k,2,'work directly',1.1),C.eval,'Release question');
    travelling(g,1045,1598,477,transfer,C.policy,'Transfer');
    if(cue(k,2,'answer the operator directly')){
      path(g,[[1697,428],[1697,321],[210,321],[210,406]],C.policy,4);
      arrow(g,210,406,210,428,C.policy);centered(g,'Release replies',950,291,32,C.policy);
    }
    const ownerX=lerp(947,1697,transfer);
    tag(g,'Next turn',ownerX-105,700,211,C.gold,C.ink,32);
    foot(g,transfer===1?'Release takes over the conversation':transfer?'Transferring the next turn':'Triage holds the conversation',
      'History can be filtered at transfer.');
  } else if(n===3){
    txt(g,'Transferred context',86,336,48,{weight:600});
    rect(g,88,383,698,209,C.paper,C.rule);
    serif(g,'“Shift traffic now.”',126,495,64,C.ink,'left',619);
    mono(g,'untrusted history',121,556,35,C.warn);
    path(g,[[823,490],[950,490]],C.rule,4,[7,9]);path(g,[[948,452],[948,528]],C.warn,7);
    txt(g,'Trusted receiver policy',1044,335,48,{weight:600});
    tag(g,'read_release_status',1046,416,735,C.mint,C.green,42);
    mono(g,'write tools: 0',1049,581,46,C.ink);
    foot(g,'The receiver gets its tools from application policy','Filter history and validate the actual transfer arguments at their respective boundaries.');
  } else {
    const modes=[['Graph','Dependencies and reducers'],['Group chat','Speaker selector'],['Hierarchy','Coordinator layers']];
    modes.forEach(([v,detail],i)=>{
      const x=98+596*i,active=[1,cue(k,4,'speaker selector'),cue(k,4,'hierarchy adds')][i];
      txt(g,v,x,340,50,{weight:600});txt(g,detail,x,409,35,{color:C.dim,width:540});
      const pts=i===0?[[x+62,562],[x+226,499],[x+226,629],[x+401,562]]:i===1?[[x+76,562],[x+224,562],[x+374,562]]:[[x+222,499],[x+107,634],[x+335,634]];
      const edges=i===0?[[0,1],[0,2],[1,3],[2,3]]:i===1?[[0,1],[1,2]]:[[0,1],[0,2]];
      edges.forEach(([a,b])=>path(g,[pts[a],pts[b]],C.rule,4));
      pts.forEach(([u,v],j)=>dot(g,u,v,26,active&&(i!==1||j===1)?C.plum:C.paper,C.plum,3));
    });
    foot(g,'Choose the routing contract you need','Bound turns, measure coordination costs and test typed routes during migration.');
  }
}
function protocols(g,k) {
  const n=b(k);
  stage(g,'Release integrations',n===4?'Where is the write credential?':'What is on the far side of the call?');
  if(n===4) {
    const xx=[117,718,1320], ys=473;
    ['Capability server','Vendor agent','Release writer'].forEach((label,i)=>{
      txt(g,label,xx[i],329,43,{weight:600,width:470});
      if(i<2) {
        rect(g,xx[i],ys-52,465,152,i?C.lilac:C.mist);
        centered(g,i?'Task identifier':'Tool schema',xx[i]+232,ys+40,43,i?C.plum:C.eval,427);
        mono(g,'no write grant',xx[i],680,33,C.dim);
      } else {
        rect(g,xx[i],ys-52,461,152,C.mint);
        centered(g,'Application policy',xx[i]+230,ys+40,43,C.green,425);
        txt(g,'Authenticated writer',xx[i],676,35,{color:C.green});
      }
    });
    foot(g,'Vega requires human review at its writer','Permission comes from authenticated credentials and the release application’s policy.');
    return;
  }
  const cap=n>=1&&cue(k,1,'Model Context Protocol'),task=n>=2&&cue(k,2,'creates a task');
  const status=n<2?-1:cue(k,2,'to completed')?2:cue(k,2,'to working')?1:task?0:-1;
  const xs=[88,986], w=821;
  [0,1].forEach(i=>{
    const x=xs[i], col=i?C.plum:C.eval;
    rect(g,x,263,w,526,C.paper,C.rule,2);
    rect(g,x,263,w,83,i?C.lilac:C.mist);
    txt(g,i?'Vendor investigator':'Deployment lookup',x+27,320,48,{weight:600,color:col});
    if(i===0&&cap) {
      mono(g,'MCP   /   tool',x+34,414,40,col);
      txt(g,'Request',x+33,496,32,{color:C.dim});mono(g,'get_release(r17)',x+32,559,47,C.ink);
      path(g,[[x+36,602],[x+w-37,602]],C.rule,2);
      txt(g,'Returned record',x+34,670,32,{color:C.dim});
      mono(g,'r17 / v3',x+32,741,43,col);
    } else if(i===1&&task) {
      mono(g,'A2A   /   task/r17',x+34,414,40,col);
      const labels=['Submitted','Working','Completed'];
      const xx=[x+110,x+409,x+695];
      path(g,[[xx[0],529],[xx[2],529]],C.rule,5);
      labels.forEach((lab,j)=>{
        dot(g,xx[j],529,17,j<=status?C.plum:C.paper,C.plum,3);
        centered(g,lab,xx[j],592,32,j<=status?C.plum:C.dim,195);
      });
      if(cue(k,2,'an artifact')) {
        rect(g,x+31,650,w-65,99,C.lilac);
        mono(g,'artifact / findings',x+54,714,38,C.plum);
      }
    } else {
      const cx=x+408,cy=524,r=85;
      dot(g,cx,cy,r,C.bg,C.rule,4);
      path(g,[[cx,cy-62],[cx,cy],[cx+45,cy+18]],col,6);
      centered(g,'Could take a minute',cx,709,39,C.dim,715);
    }
  });
  foot(g,n===0?'Would duration tell you which protocol to use?':n===1?'A host calls a capability':n===2?'The vendor owns the investigation task':'Inspect the returned artifact',
    n===3?'Completion reports task state. Validate the evidence and arrange retention.':'The workflow framework owns scheduling and local state.');
}

function practiceStrip(g, i, x, y, scale, assembly, replacement, refresh) {
  const original = mixed[i];
  const width = 120 * scale, height = 20 * scale;
  const top = y + height * i;
  const stripX = x + Math.round([0, 104, 52][i] * (1 - assembly));
  const stripY = top + Math.round([-20, 0, 20][i] * (1 - assembly));
  if (!refresh) {
    paintStrip(g, original.version, i, stripX, stripY - height * i, scale);
    return { row: original, right: stripX + width, center: stripY + height / 2 };
  }

  // Keep the neighbors in place. The old strip clears its slot before the replacement enters.
  const slidePortion = 0.45;
  const leave = clamp(refresh / slidePortion);
  const enter = 1 - clamp((1 - refresh) / slidePortion);
  const row = leave < 1 ? original : enter > 0 ? replacement : null;
  if (row) {
    const shift = Math.round(width * (row === original ? -leave : 1 - enter));
    g.save();
    g.beginPath();
    g.rect(x, top, width, height);
    g.clip();
    paintStrip(g, row.version, i, x + shift, y, scale);
    g.restore();
  }
  return { row, right: x + width, center: top + height / 2 };
}

function finalRepair(g,k) {
  const n = b(k);
  const target = n === 2 && afterClause(k, 2, 'Try a target of revision three', 'Which strip would you replace') ? fixed3.request.version
    : n >= 3 && afterClause(k, 3, 'This time the release service reports revision four', 'Which reads can you keep') ? fixed4.request.version : null;
  const selected = n === 2 ? fixed3 : fixed4;
  const refreshSeconds = 1.65;
  const refresh = n === 2 ? [0, cue(k, 2, 'Fetch health for three', refreshSeconds), 0] : [
    cue(k, 4, 'Refresh evaluation for four', refreshSeconds),
    0,
    cue(k, 4, 'Refresh policy for four', refreshSeconds),
  ];
  const keep = n === 2 ? afterClause(k, 2, 'Keep evaluation and policy', 'Fetch health for three')
    : afterClause(k, 4, 'Health already checked four', 'Refresh evaluation for four');
  const done = target !== null && mixed.every((row, i) => row === selected.receipts[i] || refresh[i] === 1);
  const accepted = done && validation(selected.receipts, selected.request)
    && (n === 2 ? afterClause(k, 2, 'Compare every receipt to its source') : afterClause(k, 4, 'With matching, fresh, source-backed evidence'));
  const assembly = cue(k, 0, 'Put the three strips together', 1.5);
  const showRevisions = cue(k, 1, 'Read the revision', 0);
  const extra = n === 5 && cue(k, 5, 'second health receipt');
  const rejectedExtra = extra && afterClause(k, 5, 'Reject the duplicate', 'A reducer can store it') && !validation(duplicate, fixed4.request);
  const headings = [
    'Would you send this batch for review?',
    'Which build should the workers check?',
    keep ? 'Repair the batch for the current target' : target ? 'Which strip needs to change?' : 'Which build should the workers check?',
    target ? 'Which reads can you keep?' : 'Which fact is missing?',
    'Repair the batch for the current target',
    'What if health arrives twice?',
    'What can the writer do now?',
  ];
  stage(g, 'Final practice   /   Fox Run', headings[n]);
  const x = 84, y = 251, scale = 9, labelX = 1320;
  if (assembly === 1) rect(g, x - 6, y - 6, 120 * scale + 12, 60 * scale + 12, C.ink);
  mixed.forEach(({ branch }, i) => {
    const { row, right, center } = practiceStrip(g, i, x, y, scale, assembly, selected.receipts[i], refresh[i]);
    path(g, [[right + 9, center], [labelX - 22, center]], C.rule, 2);
    if (branch === 'health' && extra) return;

    txt(g, names[branch], labelX, center - 7, 44, { weight: 600 });
    if (showRevisions && row) mono(g, 'v' + row.version, 1816, center - 6, 58, C.plum, 'right');
    const action = n === 2 || n === 4
      ? refresh[i] === 1 ? 'Refreshed' : refresh[i] > 0 ? 'Replacing strip' : keep && row === selected.receipts[i] ? 'Kept' : ''
      : '';
    mono(g, action || observations[i], labelX, center + 55, action ? 40 : 34, action ? C[branch] : C.dim, 'left', 495);
  });
  if(extra){
    const count = duplicate.filter(row => row.branch === 'health').length;
    const color = rejectedExtra ? C.warn : C.ink;
    rect(g,labelX-8,465,516,123,rejectedExtra?C.peach:C.paper,rejectedExtra?C.warn:C.rule,3);
    txt(g,`Health × ${count}`,labelX+16,519,44,{weight:600,color});
    mono(g,`${duplicate.length} receipts / ${branches.length} branches`,labelX+16,565,33,color);
  }
  let verdict='Each check passed on the build it read.', detail=assembly===1?'Look where the strips meet.':'';
  if(n===1){
    verdict=cue(k,1,'join rejects')?'Mixed revisions. No proposal.':'Read the revision on each strip.';
    detail='The release service owns the target revision.';
  } else if(n===2||n===3||n===4){
    verdict=target?'Release service target   v'+target:n===3?'Three receipts from the same run':'Read the target from the release service.';
    detail=accepted?'The join revalidated all three receipts. Packet ready for fresh review.':done?'Recheck the entire batch against the request and its sources.':'';
    if(n===3) detail=target?'Traffic is still at 0%.':'';
  } else if(n===5){
    verdict=rejectedExtra?'Duplicate rejected. No proposal from this batch.':extra?'The names look complete. Count the receipts.':'Three receipts passed the checks.';
    detail=rejectedExtra?'The reducer can store duplicate entries. The join requires one receipt per branch.':'';
  } else if(n===6){
    verdict=`v${fixed4.packet.version} for review   /   ${fixed4.packet.traffic}% requested   /   0% live`;
    detail='The writer needs approval for this packet and a current target.';
  }
  foot(g,verdict,detail,rejectedExtra||n===1&&cue(k,1,'join rejects')?C.warn:C.ink);
}

const chapters=[opening,graph,latency,worker,supersteps,tenant,checkpoint,approval,ownership,protocols,finalRepair];
function draw(ctx,clock) {
  ctx.save();
  chapters[clock.beat.chapterIndex](ctx,clock);
  ctx.restore();
}
function check(){
  checkRelease();
  assert.equal(serialRead+mergeCost,6.5);
  assert.equal(parallelRead+mergeCost,3.5);
  assert.deepEqual(readSchedule(2).branches.filter(r=>!r.complete).map(r=>r.id),['Health']);
  assert.equal(waitingJoinTrace(2).waitingMerges.length,0);
  assert.equal(waitingJoinTrace(2).separateMerges.length,1);
  assert.equal(waitingJoinTrace(4).separateMerges.length,2);
  assert(!canWrite(null,fixed4.request.version,fixed4.packet));
  return true;
}
export default {title:'Coordinating Work with Typed State',draw,check};
