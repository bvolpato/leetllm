import {C,txt,box,line,dot,title,tape,field,surface,rows,arrow,note,cue,percent} from './studio.mjs';
import {rlvrDecimalCheck} from '../../../films/verifiable-rewards/arithmetic.mjs';
export const answers=[17,16,17,16,16,15,17,16];
export function aggregate(a,target){
  const counts=new Map();
  a.forEach(v=>counts.set(v,(counts.get(v)??0)+1));
  const [mode,votes]=[...counts].sort((a,b)=>b[1]-a[1])[0];
  return {hits:counts.get(target)??0,mode,votes};
}
export function reports(c,k){
  const b=k.beat.beatIndex;
  if(!b){
    title(c,'Two starting points in the R1 report','January 2025   /   reported DeepSeek experiments');
    for(let i=0;i<2;i++){const y=210+i*163;
      txt(c,i?'R1':'R1-Zero',65,y+51,40,C.light,'left','Serif');
      tape(c,287,y,252,90);txt(c,'V3-Base',414,y+58,35,C.ink,'center','Mono');
      arrow(c,561,y+45,678,y+45);txt(c,i?'Readable cold-start traces':'Reasoning RL',710,y+55,31,i?C.gold:C.cyan);
    }
    note(c,'R1-Zero produced some hard-to-read and mixed-language responses.');
  }else if(b===1||!cue(k,2,'Try eight answers',0)){
    title(c,'Read the aggregation with the number','R1-Zero   /   AIME 2024   /   reported historical results');
    const rec=[['Original curve','16 draws · mean correctness','15.6% → 71.0%']];
    if(cue(k,1,'Table two separately',0))rec.push(['Original Table 2','64 draws · consensus','86.7%']);
    if(b===2)rec.push(['Expanded curve','revised endpoint','77.9%']);
    rows(c,['Edition','Procedure','Reported score'],rec,[73,409,896],{widths:[295,465,241]});
  }else{
    title(c,'Eight answers to the same question','Correct answer   17');
    answers.forEach((v,i)=>{const x=60+i*137;tape(c,x,213,117,94);txt(c,v,x+58,274,40,C.ink,'center','Mono');});
    const z=aggregate(answers,17);
    if(cue(k,2,'Mean correctness',0)){txt(c,z.hits+' / 8 correct',62,421,46,C.pass,'left','Serif');txt(c,z.mode+' wins '+z.votes+' votes',624,421,46,C.miss,'left','Serif');note(c,'At least one correct answer?   Yes.');}
  }
}
function node(c,x,y,w,label,sub,col){
  surface(c,x,y,w,99);txt(c,label,x+15,y+41,28,col,'left','Serif',w-30);txt(c,sub,x+15,y+75,20,C.muted,'left','Sans',w-30);
}
const r1Data = {
  reasoning: {source:'Stage 2 checkpoint', count:600},
  general: {source:'V3 data pipeline', count:200},
};
const totalThousands = r1Data.reasoning.count + r1Data.general.count;
export function pipeline(c,k){
  title(c,'What goes into stage three?','DeepSeek-R1   /   January 2025 report');
  node(c,61,168,179,'V3-Base','initial weights',C.gold);
  arrow(c,245,218,285,218);
  node(c,291,168,243,'1   Cold-start SFT','readable traces',C.light);
  arrow(c,539,218,579,218);
  node(c,585,168,257,'2   Reasoning RL','accuracy + language reward',C.cyan);
  if(cue(k,1,'six hundred thousand',0)){
    arrow(c,714,271,714,306);
    tape(c,585,317,257,63);
    txt(c,r1Data.reasoning.count+'k reasoning',714,359,27,C.ink,'center','Mono',223);
  }
  if(cue(k,1,'V3 data pipeline',0)){
    node(c,879,168,257,r1Data.general.source,'includes reused V3 SFT data',C.cyan);
  }
  if(cue(k,1,'two hundred thousand',0)){
    arrow(c,1008,271,1008,306);
    tape(c,879,317,257,63);
    txt(c,r1Data.general.count+'k general',1008,359,27,C.ink,'center','Mono',223);
  }
  if(cue(k,1,'Stage three starts',0)){
    line(c,714,383,714,407,C.cyan,3);line(c,1008,383,1008,407,C.cyan,3);
    line(c,1008,407,714,407,C.cyan,3);arrow(c,714,407,714,438);
    line(c,151,271,151,497,C.gold,3);arrow(c,151,497,401,497,C.gold);
    node(c,408,447,411,'3   New SFT run',totalThousands+'k examples  ·  2 epochs',C.light);
  }
  if(k.beat.beatIndex>=2){arrow(c,825,497,872,497);node(c,879,447,257,'4   Final RL','rules + learned preferences',C.cyan);
    note(c,'Helpfulness grades the summary. Harmlessness grades the whole response.');}
}
export function trace(c,k){
  title(c,'Read the correction in the token stream','Authored example   /   earlier text stays in context');
  const items=[['14 × 12 = 148',1],['Wait.',cue(k,0,'Then it says wait',0)],['10 × 12 + 4 × 12',cue(k,0,'splits fourteen',0)],['120 + 48 = 168',cue(k,0,'You can still read',0)]];
  tape(c,95,187,1008,306);
  items.forEach(([s,on],i)=>{if(on){txt(c,s,140+(i%2)*505,282+Math.floor(i/2)*135,38,i===0?C.mark:C.ink,'left','Mono');}});
  if(k.beat.beatIndex>0)note(c,k.beat.beatIndex===1?'Test whether this check changes accuracy on matched prompts.':'Extra tokens have a latency cost. Compare equal budgets.');
}
const gainOrigin = 365;
const gainScale = 24;
const reportedGains = [
  {label: 'Random rewards', points: 21.4, phrase: 'twenty-one point four', resultCue: 'versus twenty-nine', color: C.gold},
  {label: 'Ground-truth rewards', points: 29.1, phrase: 'versus twenty-nine', resultCue: 'The same report', color: C.cyan},
];

export function ablationState(k) {
  const bars = reportedGains.map(gain => ({
    ...gain,
    end: gainOrigin + gain.points * gainScale,
    introduced: cue(k, 0, gain.phrase, 0),
    opacity: cue(k, 0, gain.resultCue, 0.4),
  }));
  return {
    bars,
    gap: bars[1].points - bars[0].points,
    bracketOpacity: cue(k, 1, 'Now change the starting model', 0.5),
    showOtherFamilies: cue(k, 0, 'weak or harmful results', 0),
    showMatchedTest: cue(k, 2, 'Score both runs', 0),
  };
}

export function ablation(c, k) {
  const {bars, gap, bracketOpacity, showOtherFamilies, showMatchedTest} = ablationState(k);
  title(c, 'How much larger was the ground-truth gain?',
    'Qwen2.5-Math-7B   /   MATH-500   /   reported change in accuracy (percentage points)');
  const top = 200, bottom = 360, height = 52;
  for (const [index, bar] of bars.entries()) {
    const y = index === 0 ? top : bottom;
    txt(c, bar.label, 62, y + 36, 32, bar.introduced ? bar.color : C.light, 'left', 'Serif', gainOrigin - 85);
    line(c, gainOrigin, y + height / 2, 1114, y + height / 2, C.edge, 2);
    c.save();
    c.globalAlpha *= bar.opacity;
    box(c, gainOrigin, y, bar.end - gainOrigin, height, bar.color, 4);
    txt(c, '+' + bar.points.toFixed(1) + ' pp', bar.end - 18, y + 36, 31, C.ink, 'right', 'Mono');
    c.restore();
  }
  const [random, truth] = bars;
  const bracketY = (top + height + bottom) / 2;
  c.save();
  c.globalAlpha *= bracketOpacity;
  line(c, random.end, top + height, random.end, bracketY + 9, C.light, 3);
  line(c, random.end, bracketY, truth.end, bracketY, C.light, 3);
  line(c, truth.end, bracketY - 9, truth.end, bottom, C.light, 3);
  txt(c, gap.toFixed(1) + ' pp', (random.end + truth.end) / 2, bracketY - 12, 31, C.light, 'center', 'Mono');
  c.restore();
  if (showOtherFamilies) {
    txt(c, 'Random rewards helped little or hurt the tested Llama 3 and OLMo 2 variants.',
      62, 503, 29, C.muted, 'left', 'Sans', 1080);
  }
  if (showMatchedTest) note(c, 'Compare the two reward rules on the same held-out questions.');
}
export const gates=[
  {name:'Checked reasoning',base:61,next:74,operator:'>',limit:0},
  {name:'Follows instructions',base:92,next:81,operator:'≥',limit:-3},
  {name:'Unneeded refusal',base:4,next:13,operator:'≤',limit:2}
];
const pointChange = n => (n<0?'−':n>0?'+':'')+Math.abs(n)+' pp';
export function within(r){
  const delta = r.next-r.base;
  switch(r.operator){
    case '>': return delta>r.limit;
    case '≥': return delta>=r.limit;
    case '≤': return delta<=r.limit;
    default: throw Error('Unknown release threshold: '+r.operator);
  }
}
export function releaseGate(c,k){
  title(c,'Can this checkpoint ship?','Product worksheet   /   differences in percentage points');
  const verdict=cue(k,0,'Hold this candidate',0);
  rows(c,['Capability','Baseline → candidate','Change','Allowed change'],gates.map(r=>[
    r.name,r.base+'%  →  '+r.next+'%',pointChange(r.next-r.base),r.operator+' '+pointChange(r.limit)
  ]),[66,448,783,965],{widths:[357,300,152,173],step:92,tone:(j,i)=>i>=2&&verdict?(within(gates[j])?C.pass:C.miss):C.light});
  if(verdict){
    const failed=gates.filter(r=>!within(r));
    note(c,failed.length?'Hold   /   '+failed.length+' of '+gates.length+' requirements failed.':'All three release requirements pass.');
  }
}
export const decimalCases=[['50.36','50.35','0.01'],['50.361','50.35','0.01'],['0.10000000000000000001','0.1','0']];
export function decimal(c,k){
  const b=k.beat.beatIndex;
  if(!b){
    title(c,'Which reference may enter the lab?');
    rows(c,['Supplied reference','Representation','Route'],[['"50.35"','bounded decimal text','validate'],['50','integer','validate'],['true','Boolean','quarantine'],['50.35','floating object','quarantine']],[73,438,873],{step:70});
    note(c,'Exactly one candidate field   /   nonnegative decimal-string tolerance');return;
  }
  const j=b===2?2:Number(cue(k,1,'fifty point three six one',0)>0);
  const [p,e,t]=decimalCases[j],r=rlvrDecimalCheck(p,e,t);
  title(c,'Compare the exact distance','One boxed field   /   at most 20 digits on each side of the point');
  tape(c,67,203,1062,111);
  txt(c,'| '+p+' − '+e+' |  ≤  '+t+' ?',94,275,38,C.ink,'left','Mono',1012);
  const diff=j===2?'0.00000000000000000001':j?'0.011':'0.01';
  txt(c,'Distance',69,402,26,C.muted);txt(c,diff,67,473,44,C.cyan,'left','Mono',755);
  txt(c,r.pass?'Pass':'Fail',1060,470,61,r.pass?C.pass:C.miss,'right','Serif');
  note(c,j===2?'Zero tolerance preserves the last decimal place.':'The tolerance includes equality.');
}
const qwenRuns = [
  {name:'Distilled', score:72.6, scoreCue:'The direct RL run', costs:[
    ['Teacher answer generation','generating the teacher'],
    ['Filtering','filtering them'],
    ['Verification','verifying them'],
    ['Student training on saved answers','training the student'],
  ]},
  {name:'Direct RL', score:47.0, scoreCue:'To compare costs', costs:[
    ['Student rollouts','the student’s own rollouts'],
    ['Verifier calls','the verifier calls'],
    ['Policy updates','the policy updates'],
  ]},
];

export function costComparison(k) {
  return qwenRuns.map(run => ({
    name: run.name,
    score: cue(k,2,run.scoreCue,0) ? run.score : null,
    costs: run.costs.filter(([,phrase]) => cue(k,2,phrase,0)).map(([label]) => label),
  }));
}

export function teaching(c,k){
  const b=k.beat.beatIndex;
  if(b===0){
    title(c,'Which signal reaches the student?');
    const methods=[['Teacher text','Fixed tokens','Cross-entropy'],['Student sample','Checked reward','Policy update']];
    methods.forEach(([a,z,f],i)=>{const y=208+i*162;tape(c,65,y,298,95);txt(c,a,87,y+58,32,C.ink);arrow(c,374,y+47,450,y+47);
      txt(c,z,469,y+58,33,C.gold);arrow(c,746,y+47,825,y+47);txt(c,f,844,y+59,31,C.cyan);});
  }else if(b===1){
    title(c,'What went into the distilled student?','Original R1 report   /   fixed examples from the stage-three dataset');
    box(c,63,199,799,78,C.cyan,4);box(c,862,199,267,78,C.gold,4);
    txt(c,r1Data.reasoning.count+'k reasoning examples',87,248,31,C.ink);txt(c,r1Data.general.count+'k general',995,248,28,C.ink,'center');
    txt(c,r1Data.reasoning.source,87,311,24,C.cyan);
    txt(c,r1Data.general.source,995,311,24,C.gold,'center');
    note(c,'Qwen and Llama students fit the examples by supervised learning.');
  }else{
    title(c,'What work goes into each score?',
      'Original R1 report, Table 6    /    Qwen 32B    /    AIME 2024 pass@1');
    costComparison(k).forEach(({name,score,costs},i) => {
      const x=63+i*559;
      surface(c,x,172,516,429);
      txt(c,name,x+29,238,42,C.light,'left','Serif');
      txt(c,score===null?'…':score.toFixed(1)+'%',x+485,241,45,C.gold,'right','Mono');
      line(c,x+29,268,x+487,268,C.edge,2);
      if(costs.length)txt(c,'Work to count',x+29,320,23,C.muted);
      costs.forEach((item,row) => {
        const y=370+row*59;
        dot(c,x+40,y-9,5,C.cyan);
        txt(c,item,x+60,y,29,C.light,'left','Sans',425);
      });
    });
  }
}

