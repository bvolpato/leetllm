import {C,txt,box,line,dot,title,surface,tape,field,rack,strip,rows,arrow,note,cue,mix,clamp,signed} from './studio.mjs';
import {openingFields, capacityScore} from '../../../films/verifiable-rewards/capacity.mjs';
import {arithmeticEvaluation} from '../../../films/verifiable-rewards/arithmetic.mjs';
const submissions=openingFields.map(v=>v.join(' then '));
export const scores=strict=>submissions.map(v=>capacityScore(v,168,strict));
const digits=openingFields.map(r=>r.map(v=>v.match(/\d+/)[0]));
export function scanner(c,k,replay=false) {
  const b=k.beat.beatIndex;
  const fill=replay?1:cue(k,0,'Slide one job',2.2);
  const count=Math.round(168*fill);
  rack(c,62,116,12,14,count,21);
  txt(c,'14 workers',64,86,34,C.light,'left','Serif');
  txt(c,'12 slots per worker',63,508,23,C.muted);
  txt(c,count+' jobs',61,569,41,C.cyan,'left','Mono');
  const strict=replay && b>=1;
  txt(c,strict?'Count every box':'Read the first box',417,86,43,C.light,'left','Serif');
  const read=replay?cue(k,0,'It reads',.9):cue(k,2,'Follow the read head',1.1);
  const second=strict?cue(k,1,'Watch where',1.5):0;
  const data=scores(strict);
  for(const [i,row] of digits.entries()){
    const closed=replay
      ? (strict ? cue(k,2,i?'Zero for the lower row':'One for the upper row',0) : cue(k,0,'Both submissions get one point',0))
      : cue(k,2,i?'So does A':'The score applies',0);
    const y=170+i*177;
    tape(c,418,y,682,118);
    txt(c,i?'B':'A',452,y+75,44,C.teal,'left','Serif');
    field(c,row[0],590,y+28,122);
    if(i){txt(c,'then',750,y+68,24,C.ink);field(c,row[1],855,y+28,122);}
    const head=i?mix(mix(534,651,read),916,second):mix(534,651,read);
    if(replay||i){
      box(c,head-29,y+96,58,16,C.teal,4);
      box(c,head-19,y+100,38,5,C.gold,2);
      c.beginPath();c.moveTo(head-7,y+96);c.lineTo(head,y+85);c.lineTo(head+7,y+96);
      c.fillStyle=C.teal;c.fill();
    }
    txt(c,closed?'reward '+data[i]:'reward ?',1100,y+153,24,closed?C.gold:C.muted,'right','Mono');
  }
  if(replay&&b>=1) note(c,'First pass     A = 1      B = 1',611);
  else if(!replay&&b===1)txt(c,'What will B earn?',417,570,38,C.gold,'left','Serif');
}
function tuluTerminalScore(correct,hasEOS){
  if(!hasEOS)return -10;
  return correct?10:0;
}
export function tuluTerminalRows(k){
  const showCorrect=cue(k,4,'An incorrect answer',0);
  const showIncorrect=cue(k,4,'What happens if',0);
  const showMissing=cue(k,4,'These terminal scores',0);
  return [true,false].map(correct=>[
    correct?'Correct answer':'Incorrect answer',
    (correct?showCorrect:showIncorrect)?tuluTerminalScore(correct,true):null,
    showMissing?tuluTerminalScore(correct,false):null,
  ]);
}
export function methods(c,k){
  const b=k.beat.beatIndex;
  if(b===4){
    const scores=tuluTerminalRows(k);
    title(c,'Which terminal score does PPO use?','Tülu 3 8B recipe   /   EOS = end-of-sequence token');
    const table=scores.map(([answer,...values])=>[answer,...values.map(v=>v===null?'?':signed(v,0))]);
    rows(c,['Checked result','Terminal score with EOS','Terminal score without EOS'],
      table,[64,395,771],{y:230,step:97,widths:[310,355,368]});
    if(scores[0][2]!==null)note(c,'Without EOS, both answers receive the same terminal score.');
    else if(scores[1][1]!==null)note(c,'What happens if both answers lose the end token?');
    return;
  }
  title(c,'Where does the training signal go?');
  const list=[['Demonstration','target tokens','SFT · cross-entropy'],['Preference ranking','learned scorer','RLHF · policy RL'],['Ordered pair','chosen / rejected','DPO · pair objective'],['Sampled answer','executable check','RLVR · policy RL']];
  list.forEach(([a,z,f],i)=>{
    if(i===1&&!cue(k,1,'Now suppose',0)||i===2&&!cue(k,1,'Direct preference',0)||i===3&&!cue(k,2,'RLVR uses',0))return;
    const y=153+i*103;tape(c,61,y,315,75);txt(c,a,82,y+48,29,C.ink);
    arrow(c,391,y+37,467,y+37);txt(c,z,493,y+45,28,C.cyan);
    arrow(c,732,y+37,794,y+37);txt(c,f,816,y+46,28,C.light,'left','Sans',322);
  });
}
export function contract(c,k){
  const b=k.beat.beatIndex;
  title(c,'What can this checker return?','Version 1   /   first boxed integer   /   expected 168');
  tape(c,63,215,386,130);txt(c,'Response',87,287,27,C.teal);field(c,'148',282,244);
  arrow(c,460,281,547,281);
  surface(c,567,210,255,143);txt(c,'148 = 168 ?',694,294,31,C.light,'center','Mono');
  const failed=b>=2&&cue(k,2,'stops before',0);
  if(failed){line(c,861,261,883,302,C.miss,5);line(c,879,261,901,302,C.miss,5);}
  else arrow(c,839,281,927,281);
  txt(c,failed?'Unscored':'0',1024,294,failed?32:62,failed?C.gold:C.miss,'center','Serif');
  if(b>0)note(c,failed?'Queue this submission for retry.':'A numeric comparison checks this one field.');
}
export function ownership(c,k){
  const b=k.beat.beatIndex;
  title(c,'Who owns the failure?','Prompt P14    /    reference checked first');
  if(b===2){
    const bad=cue(k,2,'the average drops',0);
    strip(c,181,'R1','Pass under the checker',1);
    strip(c,291,'R2','Measured miss',0);
    if(bad)strip(c,401,'R3','Lost host · erroneous score',0);
    note(c,bad?'Including a false zero     (1 + 0 + 0) / 3 = ⅓':'Measured answers     (1 + 0) / 2 = ½');
    return;
  }
  const all=[['A','invalid gold','malformed text','unscored'],['B','healthy runner','time limit exceeded','0'],['C','lost host','no result','unscored']];
  rows(c,['ID','Measurement','Candidate','Reward'],all.map(r=>[...r.slice(0,3),cue(k,0,'A host crash',0)?r[3]:'…']),[78,232,576,979],{widths:[110,315,375,155],tone:(j,i)=>i===3?(j===1?C.miss:C.gold):C.light});
  if(b===1)note(c,'Retry the same ID and the same submitted work.');
  if(b===3)note(c,'Audit the route taken by bad references, repeated fields and timeouts.');
}
export function twoWays(c,k){
  const b=k.beat.beatIndex;
  title(c,b===0?'Count the same rack in two pieces':'Which answer earns more?');
  if(!b){
    const slotsPerWorker = 12;
    const firstWorkers = 10, extraWorkers = 4;
    const firstSlots = firstWorkers * slotsPerWorker, extraSlots = extraWorkers * slotsPerWorker;
    const more = cue(k, 0, 'Four more workers', .6);
    const add = cue(k, 0, 'Add the two groups', 0);
    const capacity = cue(k, 0, 'Their hundred', 0);

    rack(c, 65, 165, slotsPerWorker, firstWorkers, firstSlots, 18);
    txt(c, firstWorkers + ' × ' + slotsPerWorker, 194, 449, 31, C.cyan, 'center');
    if (more) {
      rack(c, 429, 291, slotsPerWorker, extraWorkers, Math.round(extraSlots * more), 18);
      txt(c, extraWorkers + ' × ' + slotsPerWorker, 558, 449, 31, C.cyan, 'center');
      txt(c, firstSlots, 194, 533, 60, C.light, 'center', 'Mono');
    }
    if (add) {
      txt(c, '+', 376, 533, 54, C.muted, 'center');
      txt(c, extraSlots, 558, 533, 60, C.light, 'center', 'Mono');
      txt(c, '=', 734, 533, 54, C.muted, 'center');
      const showTotal = capacity && k.elapsed >= k.speechDuration;
      txt(c, showTotal ? firstSlots + extraSlots : '?', 916, 533, 60, showTotal ? C.gold : C.light, 'center', 'Mono');
    }
    return;
  }
  const done=cue(k,2,'If a customer',0);
  strip(c,189,'A','',done?'1':'?');strip(c,329,'B','10 × 12 + 4 × 12',done?'1':'?');
  field(c,'168',692,202);field(c,'168',692,342);
  txt(c,'Reward',1000,163,24,C.muted,'center');note(c,'Reference value    168');
}
export function prime(c,k){
  const beat=k.beat.beatIndex;
  if(beat===1){
    const atRack=cue(k,1,'Back at our rack',0);
    title(c,atRack?'What does the rack checker read?':'Who scores the solutions before selection?');
    const studies=[
      ['Lightman et al. · MATH','Human labels on steps','Process reward model'],
      ['Cobbe et al. · GSM8K','Final-answer correctness','Outcome verifier'],
    ];
    const visible=[true,cue(k,1,'Cobbe’s team',0)];
    const selected=[cue(k,1,'It ranked solutions',0),cue(k,1,'It scored completed solutions',0)];
    studies.forEach(([study,labels,model],i)=>{
      if(!visible[i])return;
      const y=146+135*i;
      txt(c,study,66,y,27,C.cyan);
      tape(c,63,y+16,313,62);txt(c,labels,78,y+56,24,C.ink);
      arrow(c,387,y+47,445,y+47);
      txt(c,model,465,y+56,27,C.light,'left','Sans',263);
      if(selected[i]){
        arrow(c,745,y+47,799,y+47);
        txt(c,'Select a sampled solution',819,y+56,26,C.gold);
      }
    });
    if(atRack){
      line(c,63,402,1138,402,C.edge);
      txt(c,'Rack checker   /   expected 168',63,453,32,C.light,'left','Serif');
      for(const [i,n] of [168,148].entries()){
        const x=64+548*i;
        field(c,n,x,489,112,65);
        if(cue(k,1,i?'misses':'matches',0)){
          const earned=capacityScore('\\boxed{'+n+'}',168,true);
          arrow(c,x+129,521,x+185,521);
          txt(c,'Reward '+earned,x+211,532,32,earned?C.pass:C.miss);
        }
      }
    }
    return;
  }
  if(beat===2&&cue(k,2,'start with two copies',0)){
    title(c,'Did the update improve the generator?','Proposed experiment   /   same starting weights and sampling budget');
    for(const [i,label] of ['Keep starting weights','Update with checked rewards'].entries()){
      const y=208+152*i;
      tape(c,66,y,430,82);
      txt(c,label,91,y+50,29,C.ink,'left','Sans',380);
      if(cue(k,2,'Give both copies',0)){
        arrow(c,512,y+41,583,y+41);
        txt(c,'Same fresh problems',607,y+51,32,C.light);
      }
    }
    if(cue(k,2,'independently checked accuracy',0))note(c,'Compare accuracy under an independent check.');
    return;
  }
  title(c,'Is 97 prime?','Outcome checker   /   required final field: Yes or No');
  tape(c,63,182,490,144);txt(c,'Ends in 7',87,241,35,C.ink);field(c,'Yes',396,222,110);
  tape(c,630,182,506,144);txt(c,'Try 2, 3, 5, 7',655,241,31,C.ink);field(c,'Yes',970,222,110);
  const pass=cue(k,0,'Test the first',0);if(pass){txt(c,'Reward 1',78,390,34,C.pass);txt(c,'Reward 1',649,390,34,C.pass);}
  if(cue(k,0,'It ends in seven too',0)){txt(c,'27 = 3 × 9',77,493,43,C.miss,'left','Mono');txt(c,'97 mod d   →   1, 1, 2, 6',648,493,29,C.cyan,'left','Mono');note(c,'The counterexample breaks the first rule.');}
}
export function parser(c,k){
  const b=k.beat.beatIndex;
  title(c,'Extract one bounded number','Input ≤ 4,096 characters   /   exactly one marker   /   numeric field ≤ 64 characters');
  if(b===0){
    strip(c,195,'Gold',String.raw`\boxed{1/2}`);strip(c,324,'Given',String.raw`\boxed{0.5}`);
    if(cue(k,0,'without accepting',0))note(c,'5 / 10  =  1 / 2      →      reward 1');
  }else if(b===1){
    rows(c,['Owner','Field','Disposition'],[['Reference','1/0','quarantine task'],['Candidate','1/0','reward 0'],['Candidate','[168] then [148]','reward 0']],[74,420,824],{widths:[300,373,292]});
  }else{
    tape(c,67,207,1066,114);txt(c,'Working: [1/4] + [1/4]         Final: [1/2]',91,277,33,C.ink,'left','Mono',1005);
    note(c,'If working needs boxes, give the final answer its own field.',478);
    txt(c,'Symbolic comparison also needs a domain, assumptions and a time limit.',63,551,25,C.muted);
  }
}
export const hostPass=(value,target)=>Number.isInteger(value)&&value===target;
export function host(c,k){
  const b=k.beat.beatIndex;
  title(c,'The host owns the expected answer');
  if(b===0){
    const ok=cue(k,0,'A child',0);
    const examples=[[1,true,cue(k,0,'An integer twenty',0)],[27,27,ok]];
    rows(c,['Host expects','Child returns','Exact integer match'],examples.map(([target,value,known])=>[target,String(value),known?(hostPass(value,target)?'Pass':'Fail'):'?']),[65,436,795]);
    note(c,'Fixed trusted programs   /   parsed JSON output');
  }else{
    surface(c,67,184,420,250);txt(c,'Host grader',92,239,38,C.light,'left','Serif');
    txt(c,'Expected results',92,306,30,C.cyan);txt(c,'Hidden cases',92,360,30,C.cyan);
    surface(c,640,184,484,250);txt(c,'Execution boundary',667,239,37,C.light,'left','Serif');
    txt(c,b===1?'Restricted mounts and network':'Sleeping worker + descendants',667,300,28,C.cyan,'left','Sans',430);
    txt(c,b===1?'CPU, memory, elapsed time':'Wall time expires',667,358,28,C.gold);
    arrow(c,622,304,506,304);note(c,b===1?'Local isolated-mode Python runs only the fixed exercise.':'Cancel the whole sandbox. Keep bounded output for the grader.');
  }
}
const lookup=new Map([['14 × 12',168],['8 × 12',96]]);
export const look=(factors)=>factors.map(([a,b])=>lookup.get(a+' × '+b));
export function hidden(c,k){
  const fresh=cue(k,0,'Hold the table fixed',0);
  title(c,'Can a lookup multiply a new pair?','Stored entries stay fixed while the probes change.');
  const factors=fresh?[[7,9],[11,13]]:[[14,12],[8,12]];
  surface(c,63,185,425,309);txt(c,'Lookup memory',94,243,35,C.light,'left','Serif');
  [...lookup].forEach(([key,v],i)=>txt(c,key+'   →   '+v,93,322+i*87,32,C.cyan,'left','Mono'));
  const answers=look(factors);
  factors.forEach(([a,b],i)=>{const y=231+i*124;tape(c,576,y,551,90);txt(c,a+' × '+b,600,y+55,35,C.ink,'left','Mono');txt(c,answers[i]??'no entry',1099,y+55,30,C.mark,'right','Mono');});
  if(!fresh||cue(k,0,'The visible checker',0))note(c,answers.filter((v,i)=>v===factors[i][0]*factors[i][1]).length+' / 2 cases pass');
}
export function gradeBullets(lines) {
  const marked = lines.filter(line => line.startsWith('- '));
  const filled = marked.filter(line => line.slice(2).trim().length > 0);
  return {
    markers: marked.length, total: lines.length, filled: filled.length,
    weak: Number(marked.length === 3),
    strict: Number(lines.length === 3 && filled.length === 3),
  };
}
export function bullets(c,k){
  const empty = cue(k,1,'Erase the item text',0);
  const lines = empty ? ['- ', '- ', '- '] : ['- north', '- south', '- west'];
  if (!empty && cue(k,0,'Append a fourth line',0)) lines.push('Done.');
  const grade = gradeBullets(lines);
  const checked = empty ? cue(k,1,'Zero again',0) : cue(k,0,'The strict checker gives',0);
  title(c,'Count the entire response','Exactly 3 lines. Each begins with a hyphen and a space, followed by nonblank item text.');
  tape(c,66,191,480,327);
  lines.forEach((v,i) => {
    const y = 256+i*68;
    txt(c,i+1,96,y,22,C.teal,'left','Mono');
    txt(c,v,153,y,34,i===3?C.mark:C.ink,'left','Mono');
  });
  for (const [i,[label,value]] of [['Markers',grade.markers],['Total lines',grade.total],['Filled items',grade.filled]].entries()) {
    const x = 665 + 181*i;
    txt(c,label,x,230,26,C.muted,'center');
    txt(c,value,x,300,55,C.cyan,'center','Mono');
  }
  if (cue(k,0,'The weak checker gives',0)) {
    txt(c,'Marker-only reward',590,406,29,C.muted);
    txt(c,grade.weak,1070,406,41,C.gold,'center','Mono');
  }
  if (checked) {
    txt(c,'Strict format reward',590,478,29,C.light);
    txt(c,grade.strict,1070,478,41,grade.strict?C.pass:C.miss,'center','Mono');
  }
  if(cue(k,1,'Helpfulness needs',0))note(c,'Helpfulness needs a separate judgment.');
}
export const proofPass=deps=>deps.every(d=>['Classical.choice','propext','Quot.sound'].includes(d));
// Each reading is [label, value, batch, rack]. Both queries project the same two columns.
const sharedReadings=[['A',1,1,1],['B',null,1,1]];
const batchOnly=['A',1,1,2];
const rackOnly=['B',null,2,1];
export const snapshots=[
  [...sharedReadings,batchOnly,rackOnly],
  sharedReadings,
  [...sharedReadings,batchOnly],
];
export function queryTrays(readings){
  return [2,3].map(key=>readings.filter(row=>row[key]===1)
    .map(([label,value])=>[label,value])
    .sort(([a],[b])=>a.localeCompare(b)));
}
function drawQueryTrays(c,readings){
  const trays=queryTrays(readings);
  for(const [i,tray] of trays.entries()){
    const y=191+i*135;
    txt(c,i?'Rack query':'Batch query',65,y+37,32,C.light,'left','Serif');
    txt(c,i?'rack = 1':'batch = 1',65,y+73,24,C.cyan,'left','Mono');
    tray.forEach(([label,value],j)=>{
      const x=301+j*275;
      tape(c,x,y,251,82);
      txt(c,label+', '+(value??'NULL'),x+125,y+52,31,C.ink,'center','Mono');
    });
  }
}
export function theorem(c,k){
  const b=k.beat.beatIndex;
  if(b<2){
    const bad=cue(k,0,'sorryAx',0);
    title(c,'What did the proof establish?','Supplied audit record   /   theorem T matches   /   proof accepted');
    const deps=['Classical.choice','propext',...(bad?['sorryAx']:[])];
    rows(c,['Dependency in proof','Approved set'],deps.map(d=>[d,proofPass([d])?'Member':'Outside']),[78,764]);
    note(c,proofPass(deps)?'Dependency audit passes.':'The dependency audit rejects this proof of T.');
  }else{
    const second=cue(k,3,'On a second snapshot',0);
    const insert=cue(k,3,'Now add another',0);
    const rerun=cue(k,4,'It returns two copies',0);
    const data=snapshots[rerun?2:second?1:0];
    title(c,insert&&!rerun?'Which query picks up the extra copy?':'Do the queries return the same rows?',
      'Unordered results   /   reference selects batch 1   /   candidate selects rack 1');
    drawQueryTrays(c,data);
    if(insert){
      txt(c,'New reading',66,466,26,C.muted);
      tape(c,64,482,607,70);
      txt(c,'A, 1     batch 1     rack 2',89,528,30,C.ink,'left','Mono');
      txt(c,rerun?'Results after insertion':'Results before insertion',712,526,26,C.cyan);
    }
    if(rerun)note(c,'The extra A is a counterexample to equivalence.',610);
    else if(insert)note(c,'Predict the two results before running the queries again.',610);
    else if(second)note(c,'Snapshot 2   /   each query returns one A and one B.');
    else if(cue(k,2,'Different multiplicities',0))note(c,'Snapshot 1   /   A, 1 occurs twice in the target and once in the result.');
  }
}
export function formatOnly(c,k){
  if(k.beat.beatIndex===1){
    title(c,'Which property earned the point?','Final field equals 168   /   one box required');
    strip(c,208,'A','Unexplained guess',1);field(c,'168',692,221);
    strip(c,344,'B','10 × 12 + 4 × 12',1);field(c,'168',692,357);
    note(c,'The checker reads the boxed field in both responses.');
    return;
  }
  title(c,'Which counter moves?','Capacity    14 × 12 = 168');
  tape(c,64,197,425,190);field(c,'148',210,251,130,82);
  const paid=cue(k,0,'advances only',0);
  txt(c,'Box present',619,218,31,C.muted);txt(c,'Value correct',884,218,31,C.muted);
  txt(c,paid?'1':'?',690,345,85,paid?C.pass:C.muted,'center','Mono');txt(c,paid?'0':'?',974,345,85,paid?C.miss:C.muted,'center','Mono');
  if(k.beat.beatIndex>=1)note(c,k.beat.beatIndex===1?'Even a correct value leaves the derivation unchecked.':'Helpfulness needs its own rubric and disagreement review.');
}
const priorityInputs=[{value:'148',boxed:true},{value:'168',boxed:false},{value:'168',boxed:true}];
export function priorityRows(strict){
  return priorityInputs.map(({value,boxed})=>{
    if(strict)return Number(boxed&&value==='168');
    if(boxed)return 0.7;
    return value.includes('168') ? 0.3 : 0;
  });
}
export function priority(c,k){
  const b=k.beat.beatIndex,strict=b>=2;
  const resultCues=['The boxed wrong answer also','It gets zero','Only the boxed correct answer'];
  title(c,strict?'One correct boxed field':'Which answer earns more?');
  txt(c,'Response',65,158,25,C.muted);txt(c,'Box bonus rule',817,158,23,C.muted,'center');if(strict)txt(c,'Single-box rule',1044,158,23,C.muted,'center');
  priorityInputs.forEach(({value,boxed},i)=>{const y=194+i*111;tape(c,64,y,592,86);txt(c,'Answer',92,y+51,27,C.ink);
    const paid=cue(k,1,i===2?'Even the correct':'The boxed wrong answer wins',0);
    if(boxed)field(c,value,245,y+14,118,59);else txt(c,value,305,y+54,33,C.ink,'center','Mono');
    txt(c,strict||paid?priorityRows(false)[i].toFixed(1):'?',817,y+56,39,C.gold,'center','Mono');
    if(strict)txt(c,cue(k,3,resultCues[i],0)?priorityRows(true)[i]:'?',1044,y+56,39,C.cyan,'center','Mono');
  });
  note(c,strict?'Require one box AND the expected value.':'Any recognized box earns 0.7. Otherwise, plain text with 168 earns 0.3.');
}
export function transfer(c,k){
  const trained=cue(k,0,'Fourteen times twelve now passes',0);
  const model=arithmeticEvaluation(trained?168:167);
  title(c,'Does the fixed answer travel?','Toy policy prints '+model.training.policyAnswer+' on every prompt');
  [model.training,...model.heldOut].forEach((row,i)=>{
    const active=!i||(i===1?cue(k,1,'Remove one worker',0):cue(k,1,'In held-out rack B',0));
    const [h,w]=active?row.factors:[14,12];const x=60+i*384;
    txt(c,['Training','Held out · A','Held out · B'][i],x,187,29,C.muted);
    rack(c,x,209,12,14,168,15,(r,col)=>r>=h||col>=w);
    txt(c,active?h+' × '+w+' = '+h*w:'Original rack',x,531,29,C.cyan,'left','Mono');
    if(active)txt(c,'Reward '+row.reward,x,583,29,row.reward?C.pass:C.miss);
  });
}

