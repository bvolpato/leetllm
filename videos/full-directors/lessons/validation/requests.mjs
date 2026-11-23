import assert from 'node:assert/strict';
import short from '../../../director-cuts/lessons/validation/film.mjs';
import { LEAK_ROWS, foldScores } from '../../../films/validation/fixtures.mjs';
import { openingRule } from '../../../films/validation/model.mjs';
import { mean } from '../../../films/validation/arithmetic.mjs';
import { P, arrow, box, circle, clockface, fixed, leaf, mid, mix, mono, path, phase, punch, result, scene, seal, serif, tag, text } from './studio.mjs';

const opening = { readings:{ambiguity:'High',exceptions:1}, readable:539, signed:622, decision:540 };
const laterAudit = { needsReview:true };
const route = (row)=>row.ambiguity==='High' && row.exceptions>0;
function fileState(minutes,committed,score){
  const inputs=minutes>=opening.readable?opening.readings:null;
  const call=committed&&inputs?route(inputs):null;
  return {minutes,inputs,signed:minutes>=opening.signed,call,scored:call!==null&&score};
}
export function openingDesk(c,k){
  const forward=phase(k,0,'Follow the clock forward',2);
  const rewind=phase(k,2,'Wind the clock back',3.6);
  const minutes=Math.round(mix(opening.decision,opening.signed,forward*(1-rewind)));
  const commit=phase(k,3,'Lock that route',.6),score=phase(k,3,'The auditor found',.8);
  const s=fileState(minutes,commit===1,score===1);
  scene(c,'The request at nine','ACCESS REVIEW  /  REQ-10234',true);
  clockface(c,259,315,153,minutes);
  const time=Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0');
  serif(c,time,259,521,54,P.paper,'center');mid(c,'July 1  ·  UTC',259,551,22,P.mint);
  leaf(c,485,181,719,319);
  text(c,'Request opened',521,231,24,P.soft);mono(c,'JUL 01   09:00',1157,231,26,P.ink,'right');
  path(c,[[520,250],[1162,250]],P.edge);
  [['Text ambiguity',s.inputs.ambiguity],['Prior exceptions',s.inputs.exceptions]].forEach(([name,value],i)=>{
    const y=317+i*81;mono(c,'08:59',521,y,24,P.teal);text(c,name,637,y,27);serif(c,value,1157,y,35,P.ink,'right');
  });
  path(c,[[521,431],[1159,431]],P.edge);
  if(s.signed){
    text(c,'Manager approval',521,468,25,P.soft);
    c.save();c.translate(948,461);c.rotate(-.09);
    path(c,[[-75,18],[-42,-25],[-50,12],[-18,-14],[-23,9],[7,-8],[4,7],[29,-4],[60,0]],P.navy,3.5);
    path(c,[[-78,24],[71,15]],P.navy,1.5);c.restore();
    mono(c,'10:22',1156,480,26,P.navy,'right');
  }else if(s.call===null){text(c,'Manager approval pending',521,479,26,P.soft);}
  else{tag(c,'Route locked',520,441,165,P.teal);seal(c,731,462,true,.72);serif(c,s.call?'Human review':'Routine',1160,479,39,P.teal,'right');}
  if(s.scored){
    box(c,485,509,719,48,P.mint,P.ink,4);text(c,'July 15 audit',506,542,24);
    text(c,laterAudit.needsReview?'Needed review':'Routine',786,542,27,P.teal);
    if(phase(k,3,'so the recorded route matches',.75)===1)text(c,s.call===laterAudit.needsReview?'Match':'Mismatch',1176,542,25,P.ink,'right');
  }else if(k.beat.beatIndex===1 && phase(k,1,'An audit followed')>0){text(c,'July 15 audit filed separately',505,543,25,P.paper);}
  else if(k.beat.beatIndex===2 && rewind===1){text(c,'Rule  ·  high ambiguity + prior exception → review',500,543,25,P.paper);}
}
export function auditReplay(c,k){
  if(k.beat.beatIndex<short.beats.length){
    c.save();c.scale(2/3,2/3);short.draw(c,{...k,index:k.beat.beatIndex});c.restore();return;
  }
  scene(c,'Read the two mismatches','ROUTER REPLAY  /  8 REQUESTS',true);
  LEAK_ROWS.slice(6).forEach((r,i)=>{
    const x=68+600*i,{margin,prediction}=openingRule(r);
    leaf(c,x,198,545,305);mono(c,r.id,x+28,247,32,P.teal);
    mono(c,fixed(r.ambiguity,1)+' − 0.9 × '+r.policy+' = '+fixed(margin,1),x+28,323,31);
    path(c,[[x+25,346],[x+523,346]],P.edge);
    text(c,'Router',x+30,398,24,P.soft);text(c,prediction?'Review':'Routine',x+504,398,31,P.rust,'right');
    text(c,'Audit',x+30,457,24,P.soft);text(c,r.y?'Review':'Routine',x+504,457,31,P.navy,'right');
    serif(c,i?'Missed review':'False alarm',x+26,548,39,P.paper);
  });
}
const losses=[0,0,0,1],future=[{p:.75,loss:0},{p:.25,loss:2}];
const empirical=mean(losses),population=future.reduce((n,r)=>n+r.p*r.loss,0);
const gapAt=n=>(n>2?.75:.25)-Math.min(n,4-n)/4;
export function risk(c,k){
  const b=k.beat.beatIndex;
  scene(c,b<3?'What does an error cost?':'Can the gap be negative?',b<3?'LOSS PER REQUEST':'FOUR INDEPENDENT DRAWS');
  if(b<3){
    text(c,'Training sample',75,221,29);
    losses.forEach((v,i)=>{punch(c,77+i*116,264,v,v?P.coral:P.mint,95);});
    const showTrain=phase(k,1,'The training average is one quarter',1.4)===1;
    result(c,'Average loss',showTrain?fixed(empirical):'(0 + 0 + 0 + 1) / 4',76,409);
    if(b>=1){
      path(c,[[633,185],[633,505]],P.edge,2);text(c,'Specified future population',696,221,29);
      [0,0,0,2].forEach((v,i)=>punch(c,695+i*112,264,v,v?P.coral:P.mint,94));
      text(c,'Probability       ¾ at zero     ·     ¼ at two',697,377,23,P.soft);
      result(c,'Expected loss',phase(k,1,"That's the population risk")>0?fixed(population):'¾ × 0 + ¼ × 2',696,445);
    }
    if(b===2){tag(c,'Generalization gap',260,521,260);serif(c,fixed(population)+' − '+fixed(empirical)+' = '+fixed(population-empirical),560,559,43);}
  }else{
    text(c,'Population error minus training error',74,202,26);
    path(c,[[127,363],[1175,363]],P.soft,2);
    [0,1,2,3,4].forEach(n=>{
      const x=194+213*n,gap=gapAt(n),y=363-gap*200;
      const reveal=n!==2 || phase(k,4,'That gives the point')>0;
      if(reveal){path(c,[[x,363],[x,y]],gap<0?P.rust:P.teal,8);circle(c,x,y,11,gap<0?P.rust:P.teal);mono(c,fixed(gap),x,y+(gap<0?42:-25),27,P.ink,'center');}
      else mid(c,'?',x,344,36,P.rust);
      mono(c,n,x,481,32,P.ink,'center');
    });
    mid(c,'Positive labels in the four training requests',640,511,28);
    if(b===4 && phase(k,4,'That gives the point')>0)mid(c,'Two positives  →  tie  →  predict zero  →  population 0.25, training 0.50',640,549,24,P.rust);
  }
}
export function roles(c,k){
  const b=k.beat.beatIndex;
  scene(c,'Who gets to change the candidate?','RELEASE RECORD  /  CANDIDATE A');
  const gates=[['Fit','Jan – Jun','Weights and transforms'],['Choose','July','Threshold and features'],['Report','August','Frozen rule and metric']];
  const marks=[phase(k,0,'Training fits'),phase(k,0,'Validation helps'),phase(k,0,'Test requests')];
  gates.forEach(([job,date,what],i)=>{
    const x=62+410*i;leaf(c,x,216,343,229);
    text(c,date,x+24,259,23,P.soft);serif(c,job,x+24,333,46);
    if(marks[i]>0){box(c,x+1,375,341,68,[P.mint,P.gold,P.blue][i]);mid(c,what,x+172,417,24);}
    if(i<2)arrow(c,x+348,329,x+397,329,P.soft,3);
  });
  if(b===0){text(c,'A',79+410*(marks[2]>0?2:marks[1]>0?1:0),490,30,P.teal,'left','Mono');return;}
  if(b===1){
    seal(c,883,514,true,.95);
    text(c,'July labels ready before August freeze',85,525,32,P.teal);
  }else{
    arrow(c,1063,455,1063,514,P.rust);
    tag(c,'August errors',914,520,260,P.coral,P.ink);
    if(phase(k,2,'helped design candidate B')>0){
      arrow(c,910,544,749,544,P.rust);
      tag(c,'Revise → B',508,522,219,P.gold,P.ink);
      if(phase(k,2,'Test B on fresh requests')>0){arrow(c,497,544,366,544);tag(c,'Fresh requests',102,522,248);}
    }
  }
}
export function folds(c,k){
  const b=k.beat.beatIndex;
  if(b===2){
    scene(c,'Three positives across five folds','STRATIFICATION  /  LABEL SUPPORT',true);
    const progress=3*phase(k,2,'Deal one to each',2.1);
    const explain=phase(k,2,'Stratification tries')>0;
    for(let i=0;i<5;i++){
      const x=101+i*220,center=x+98;
      box(c,x,326,196,156,'#32565a','#a0b4a9',6);
      mid(c,'F'+(i+1),center,367,26,P.mint);
      if(i<3){
        const deal=Math.max(0,Math.min(1,progress-i));
        const source=528+112*i;
        circle(c,mix(source,center,deal),mix(239,421,deal),22,P.gold);
        mid(c,'+',mix(source,center,deal),mix(239,421,deal)+9,26,P.ink);
      }else if(explain)mid(c,'0 positives',center,430,26,P.paper);
    }
    if(explain)mid(c,'Two folds have no positive case',640,552,34,P.paper);
    return;
  }
  scene(c,'Five turns of the held-out fold','DEVELOPMENT DATA',true);
  const t=phase(k,0,'In each iteration',7.2),done=Math.floor(t*5),active=Math.min(4,done);
  const x=318,y=394,r=182;
  for(let i=0;i<5;i++){
    const a=i*2*Math.PI/5-Math.PI/2,z=a+2*Math.PI/5;
    c.beginPath();c.moveTo(x,y);c.arc(x,y,r,a+.016,z-.016);c.closePath();
    c.fillStyle=i===active?P.gold:'#81b7a9';c.fill();
    const ang=(a+z)/2;mid(c,'F'+(i+1),x+128*Math.cos(ang),y+128*Math.sin(ang)+11,35);
  }
  circle(c,x,y,71,P.night);mid(c,'Fit '+(active+1),x,y+11,27,P.paper);
  text(c,'Gold fold supplies the score',613,225,32,P.paper);
  foldScores.forEach((v,i)=>{
    mono(c,'F'+(i+1),621,281+i*49,23,P.mint);
    box(c,696,259+i*49,382,22,'#3e5d60',null,8);
    if(i<done){box(c,696,259+i*49,v*382,22,P.gold,null,8);mono(c,fixed(v),1110,279+i*49,24,P.paper);}
  });
  if(b===1)serif(c,'Mean  '+fixed(mean(foldScores),3),696,544,42,P.paper);
}
export function checkRequests(){
  assert.equal(short.check(),true);
  assert.deepEqual(fileState(540,false,false),{minutes:540,inputs:{ambiguity:'High',exceptions:1},signed:false,call:null,scored:false});
  assert.equal(fileState(538,true,true).call,null);assert.equal(fileState(540,true,true).call,laterAudit.needsReview);
  assert.equal(fileState(621,false,true).signed,false);assert.equal(fileState(622,false,false).signed,true);
  assert.deepEqual([fileState(540,true,false).call,fileState(540,true,false).scored,fileState(540,true,true).scored],[true,false,true]);
  assert.deepEqual(LEAK_ROWS.map(r=>openingRule(r).prediction===r.y),[true,true,true,true,true,true,false,false]);
  assert.deepEqual([empirical,population,gapAt(2)],[.25,.5,-.25]);
  assert.equal(fixed(mean(foldScores),3),'0.708');
}

