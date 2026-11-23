import assert from 'node:assert/strict';
import { P, arrow, box, circle, fixed, leaf, mid, mix, mono, path, phase, punch, result, scene, seal, serif, smooth, tag, text } from './studio.mjs';
import { availableHistory, oneFoldModel } from '../../../films/validation/model.mjs';
import { test, validation } from '../../../films/validation/fixtures.mjs';
import { confusion, f1, mean } from '../../../films/validation/arithmetic.mjs';

const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
function calendarState(k){
  const b=k.beat.beatIndex;
  if(b<2){
    const refit=phase(k,1,'Now begin the next refit')>0;
    const month=1+Number(phase(k,0,'Turn the development calendar to February',1.2)===1)
      +Number(phase(k,0,'Advance to March',.7)===1)+Number(phase(k,0,'then April',.55)===1)
      +Number(phase(k,1,'Advance to May',.7)===1)+Number(phase(k,1,'then June',.55)===1);
    const n=refit?4:phase(k,0,'Fit the pipeline on January and February',.8)>0?2:0;
    return {month,n,roles:months.map((_,i)=>i<n?'Fit':n>0&&i<month?'Score':''),refit};
  }
  if(b===2 && phase(k,2,'For release, fit the candidate')===0){
    return {month:6,n:4,roles:['Fit','Fit','Fit','Fit','Score','Score','',''],refit:false};
  }
  const jul=phase(k,2,'Use July')>0,aug=phase(k,2,'then score August')>0;
  return {month:aug?8:jul?7:6,n:6,roles:months.map((_,i)=>i<6?'Fit':i===6&&jul?'Select':i===7&&aug?'Report':''),refit:false};
}
function calendarArt(c,x,y,w,h,month,action){
  box(c,x+9,y+17,w,h,'#122b2c63',null,5);
  for(let i=3;i>=0;i--)box(c,x+i*2,y+i*4,w,h,P.paper,P.edge,5);
  box(c,x,y,w,76,P.rust,null,4);text(c,'2026',x+29,y+53,31,P.paper,'left','Mono');
  for(let i=0;i<6;i++){const xx=x+28+i*(w-56)/5;circle(c,xx,y+8,7,P.ink);path(c,[[xx,y+7],[xx,y-14],[xx+5,y-21],[xx+10,y-18]],'#bba77d',5);}
  serif(c,months[month-1],x+w/2,y+180,81,P.ink,'center');
  const date=new Date(Date.UTC(2026,month-1,1)),start=(date.getUTCDay()+6)%7,days=new Date(Date.UTC(2026,month,0)).getUTCDate();
  for(let i=0;i<days;i++){
    const slot=i+start;mono(c,i+1,x+26+(slot%7)*(w-52)/6,y+220+Math.floor(slot/7)*22,15,P.soft,'center');
  }
  if(action)tag(c,action,x+16,y+h-48,w-32,action==='Fit'?P.teal:action==='Score'?P.navy:P.rust);
}
export function deployments(c,k){
  const b=k.beat.beatIndex,s=calendarState(k);
  scene(c,b<2?'Which history fitted this pipeline?':b===2?'Reserve July and August':'Is this June request ready to train?',b<2?'ROLLING-ORIGIN VALIDATION':b===2?'RELEASE WINDOW':'LABEL READINESS  /  JULY 1 FIT',true);
  if(b<3){
    calendarArt(c,66,219,289,380,s.month,s.roles[s.month-1]);
    const turns=[phase(k,0,'Turn the development calendar to February',1.2),phase(k,0,'Advance to March',.7),phase(k,0,'then April',.55),phase(k,1,'Advance to May',.7),phase(k,1,'then June',.55)];
    const turning=turns.find(p=>p>0&&p<1);
    if(turning){
      const fold=48*Math.sin(Math.PI*turning);
      c.beginPath();c.moveTo(355-fold,599);c.lineTo(355,599-fold);c.lineTo(355-fold,599-fold);c.closePath();
      c.fillStyle='#e2d2a8';c.fill();c.strokeStyle='#9a8c6d';c.lineWidth=1.4;c.stroke();
    }
    const start=413,step=99;
    months.forEach((m,i)=>{
      const x=start+i*step,role=s.roles[i];box(c,x,287,90,146,role==='Fit'?P.mint:role==='Score'?P.gold:role?P.blue:'#32545a','#6b8988',5);
      mid(c,m,x+45,339,27,role?P.ink:P.paper);path(c,[[x+9,356],[x+80,356]],role?P.soft:'#819697',1.5);
      mid(c,role||'·',x+45,405,24,role?P.ink:P.mint);
    });
    if(s.n>0){
      const right=start+(s.n-1)*step+89;path(c,[[start,451],[start,472],[right,472],[right,451]],P.mint,4);
      text(c,'Fit on Jan – '+months[s.n-1],start,518,28,P.paper);
    }
    const score=s.roles.flatMap((role,i)=>role==='Score'?[months[i]]:[]);
    if(score.length){
      text(c,'Scored with this fit: '+score.join(' + '),start,552,26,P.paper);
    }
    if(b===2 && s.n===6 && phase(k,2,"If July's audit labels")>0){text(c,'Freeze after July labels arrive',start,548,27,P.paper);}
  }else{
    const points=[['June 20','Request opens'],['July 1','Fit begins'],['August 2','Label arrives']];
    path(c,[[137,407],[1125,407]],'#93afa7',5);
    points.forEach(([date,desc],i)=>{const x=185+451*i;circle(c,x,407,18,i===1?P.gold:P.mint);serif(c,date,x,326,42,P.paper,'center');mid(c,desc,x,474,28,P.paper);});
    path(c,[[636,233],[636,510]],P.gold,3,[5,10]);
    if(b===3){mid(c,'Use this row for supervised fitting?',640,606,35,P.paper);}
    else{tag(c,'Prior activity known',118,500,401,P.mint,P.ink,55);tag(c,'Label pending at fit',766,500,401,P.coral,P.ink,55);}
  }
}
const history=availableHistory();
const stamp=t=>new Date(t).toISOString().slice(5,16).replace('T',' ');
const observationDays=[1,2,3,20,21,22];
const testStart=20;
const beforeTest=observationDays.filter(day=>day<testStart);
const lastRetained=beforeTest.at(-2),excluded=beforeTest.at(-1);
const outcome={start:2,end:21},testWindow={start:testStart,end:21};
const embargoWindow={start:testWindow.end,end:22};
const overlapStart=Math.max(outcome.start,testWindow.start);
const overlapEnd=Math.min(outcome.end,testWindow.end);
const dayX=day=>112+(day-1)*50;

function splitExample(c,k){
  const purge=phase(k,4,'purge training examples',0)===1;
  const embargo=phase(k,5,'leave a buffer after the test block',0)===1;
  const title=embargo?'Purging and embargo':purge?'Purge the row whose outcome overlaps test':'One sample between training and test';
  scene(c,title,purge?'TIME SPLITS  /  OUTCOME WINDOWS':'TIME SPLITS  /  IRREGULAR ARRIVALS');
  const y=356;
  path(c,[[90,y],[1190,y]],P.edge,4);
  observationDays.forEach(day=>{
    let color=P.soft;
    if(day===testStart)color=P.navy;
    if(!purge && day<=lastRetained)color=P.teal;
    if(day===(purge?outcome.start:excluded))color=P.rust;
    if(embargo && day>=embargoWindow.start && day<embargoWindow.end)color=P.gold;
    circle(c,dayX(day),y,10,color);
    mono(c,day,dayX(day),y+46,24,P.ink,'center');
  });
  text(c,'Day',74,y+46,22,P.soft,'right');
  if(!purge){
    const left=dayX(excluded),right=dayX(testStart);
    path(c,[[left,y-14],[left,258],[right,258],[right,y-14]],P.rust,2.5);
    const measured=phase(k,4,'seventeen days before test',1.6)===1;
    mid(c,(measured?(testStart-excluded)+' days':'Interval')+' from excluded row to test', (left+right)/2,232,30,P.rust);
    path(c,[[dayX(lastRetained),414],[dayX(lastRetained),506]],P.teal,2.5);
    mid(c,'Last training row',dayX(lastRetained),548,25,P.teal);
    path(c,[[left,414],[left,442],[left+62,464]],P.rust,2.5);
    text(c,'Excluded row',left+70,473,25,P.rust);
    path(c,[[right,414],[right,506]],P.navy,2.5);
    mid(c,'First test row',right,548,25,P.navy);
    return;
  }

  const band=(range,top,color)=>box(c,dayX(range.start),top,dayX(range.end)-dayX(range.start),33,color,null,2);
  for(const day of [outcome.start,testWindow.start,testWindow.end]){
    path(c,[[dayX(day),280],[dayX(day),y-16]],P.edge,2,[4,5]);
  }
  text(c,'Outcome window for the day '+outcome.start+' row',dayX(outcome.start),219,29);
  band(outcome,243,P.coral);
  if(overlapStart<overlapEnd){
    band({start:overlapStart,end:overlapEnd},243,P.rust);
    const center=(dayX(overlapStart)+dayX(overlapEnd))/2;
    mid(c,'Overlap',center,219,24,P.rust);
  }
  for(const day of [testWindow.start,testWindow.end]){
    path(c,[[dayX(day),411],[dayX(day),440]],P.edge,2,[4,5]);
  }
  text(c,'Test outcome window',dayX(testStart)-15,467,25,P.navy,'right');
  band(testWindow,443,P.navy);
  if(embargo){
    band(embargoWindow,443,P.gold);
    const x=(dayX(embargoWindow.start)+dayX(embargoWindow.end))/2;
    path(c,[[x,480],[x,502],[x-43,522]],P.soft,2);
    text(c,'Embargo the day '+embargoWindow.start+' row',x-50,539,25,P.ink,'right');
  }
  if(overlapStart<overlapEnd)text(c,'Purge the day '+outcome.start+' row. Its outcome includes the test day.',78,548,28,P.rust);
}
export function arrivals(c,k){
  const b=k.beat.beatIndex;
  if(b>=4){splitExample(c,k);return;}
  scene(c,b<3?'When could the router read it?':'An unready label still leaves a history',b<3?'SERVING CACHE  /  SEVEN-DAY WINDOW':'ENTITY HISTORY  /  USER 2');
  if(b<3){
    const from=Date.UTC(2026,5,29),to=Date.UTC(2026,6,1,21),pos=t=>100+1085*(t-from)/(to-from),cut=pos(history.decision);
    path(c,[[cut,205],[cut,549]],P.rust,3,[6,6]);
    text(c,'July 1 · 00:05',cut,188,23,P.rust,'center');
    const travel=phase(k,1,'Add when the router could read',2);
    history.events.forEach((e,i)=>{
      const x=pos(e.event),xx=mix(x,pos(e.observed),travel),y=278+104*i;
      path(c,[[95,y],[1183,y]],P.edge,2);circle(c,x,y,12,P.navy);text(c,stamp(e.event),x,y-25,21,P.navy,'center','Mono');
      if(travel>0){
        path(c,[[x,y],[xx,y]],P.teal,4);circle(c,xx,y,6,P.teal);if(travel===1)text(c,(i<2?'Synced +1 second':'Synced '+stamp(e.observed)),xx,y+37,21,P.teal,'center');
      }
    });
    const label=b===0?history.naive+' events in the window':b===1?'How many records had arrived?':history.ready+' readable records at the cutoff';
    mid(c,label,640,548,32);
  }else{
    [['June','Request received'],['July','Same user returns'],['August','Audit arrives']].forEach(([d,s],i)=>{
      const x=77+i*405;leaf(c,x,274,333,164);text(c,d,x+23,313,25,P.teal);serif(c,s,x+23,378,32);
      if(i<2)arrow(c,x+339,349,x+391,349,P.soft);
    });
    if(phase(k,3,'count them among returning users')>0)tag(c,'Returning user in July',372,503,523,P.teal,P.white,61);
  }
}
const nearest=(v,a,b)=>Number(Math.abs(v-b)<Math.abs(v-a));
const inner=[{x:4,y:0},{x:10,y:1}];
const development=oneFoldModel();
export function nested(c,k){
  const b=k.beat.beatIndex,opened=phase(k,2,'Open the outer labels')===1,refit=phase(k,1,'this time on all four development rows')>0;
  scene(c,'Choose inside. Score outside.','NESTED SELECTION');
  leaf(c,70,208,574,359);text(c,refit?'Development refit':'Inner split',105,258,32);
  if(!refit){
    text(c,'Training means by class',106,323,23,P.soft);mono(c,'Class 0: 2     Class 1: 8',107,370,24);
    text(c,'Inner validation labels',106,435,23,P.soft);mono(c,'x = 4 → 0     x = 10 → 1',107,483,24);
    if(b===1)text(c,'A  2 / 2        B  1 / 2',107,538,29,P.teal);
  }else{
    text(c,'Refit the chosen rule on all four',106,329,27);
    development.training.forEach(({x},i)=>punch(c,107+i*126,364,x,i<2?P.mint:P.coral,94));
    if(phase(k,1,'Its threshold moves from five to six',1.3)===1){
      text(c,'Boundary',106,497,26,P.soft);serif(c,'5 → 6',456,507,43,P.teal);
    }
  }
  leaf(c,724,208,483,359,opened?P.paper:'#dbc799');
  if(!opened){
    path(c,[[727,245],[965,392],[1202,245]],'#9e865d',3);seal(c,965,389,true,1.7);
    mid(c,'Outer labels sealed',965,497,28);
  }else{
    text(c,'Outer requests',752,257,31);
    ['x','Call','Audit'].forEach((s,i)=>text(c,s,755+i*142,318,23,P.soft));
    development.held.forEach((r,i)=>[r.x,development.predictions[i],r.y].forEach((n,j)=>mono(c,n,759+142*j,355+41*i,27)));
  }
  const score=development.held.filter((r,i)=>r.y===development.predictions[i]).length;
  if(opened)text(c,score+' / 4 correct',752,533,31,P.teal);
  else{
    const instruction=b===0?'A uses the nearer mean. B always predicts zero.':'Inner rows select A. The outer rows measure that procedure.';
    mid(c,instruction,640,174,26);
  }
}
const choices=[.3,.5,.7];
const best=choices.reduce((a,t)=>f1(confusion(validation,t))>f1(confusion(validation,a))?t:a);
function thresholdState(k){
  const threshold=Math.round(30+20*phase(k,1,'Raise the threshold',1.5)+20*phase(k,2,'Try point seven',1.3)-20*phase(k,3,'Freeze the one-half threshold',1.4))/100;
  const aug=k.beat.beatIndex>=4,open=!aug||phase(k,5,'Open the labels')===1;
  const rows=aug?test:validation;
  return {threshold,aug,open,rows,counts:open?confusion(rows,threshold):null};
}
export function threshold(c,k){
  const b=k.beat.beatIndex,s=thresholdState(k),left=196,right=829,x=p=>mix(left,right,p);
  scene(c,s.aug?'Score six August requests':'Find the July cut',s.aug?'LOCKED RELEASE  /  AUGUST':'THRESHOLD SELECTION  /  JULY',true);
  text(c,'Score',64,215,23,P.mint);text(c,'Audit',858,215,23,P.mint);
  const showMiss = s.aug && s.open && afterAuditPhrase(k, 5, 'needed review');
  const showAlarm = s.aug && s.open && afterAuditPhrase(k, 5, 'turned out to be routine');
  s.rows.forEach((r,i)=>{
    const y=269+i*54,chosen=r.p>=s.threshold;
    const auditedError = chosen ? showAlarm && !r.y : showMiss && r.y;
    mono(c,fixed(r.p),66,y+7,24,P.paper);
    path(c,[[left,y],[right,y]],'#547275',2);circle(c,x(r.p),y,12,chosen?P.gold:P.blue);
    if(auditedError)circle(c,x(r.p),y,20,null,P.coral,3);
    text(c,s.open?r.y?'Needed':'Routine':'Sealed',857,y+8,23,s.open?P.paper:P.mint);
  });
  path(c,[[x(s.threshold),225],[x(s.threshold),567]],P.gold,3);
  mono(c,fixed(s.threshold),x(s.threshold)+34,208,27,P.gold);
  const locked=b>=3 && s.threshold===best;
  if(locked)seal(c,x(s.threshold),202,true,.78);
  const nr=s.rows.filter(r=>r.p>=s.threshold).length;
  if(s.aug){
    text(c,'To review',1030,274,25,P.mint);serif(c,nr+' of 6',1030,341,45,P.paper);
    if(s.counts && afterAuditPhrase(k, 5, 'one false alarm and one miss')){
      const {tp,fp,fn}=s.counts;
      text(c,'TP / FP / FN',1030,417,23,P.mint);mono(c,[tp,fp,fn].join(' / '),1030,464,28,P.paper);
      if(afterAuditPhrase(k, 5, 'four over six'))
        serif(c,'F1   '+(2*tp)+' / '+(2*tp+fp+fn),1030,550,41,P.gold);
    }
  }else{
    text(c,'Cut       F1',1012,247,23,P.mint);
    choices.slice(0,Math.min(3,b+1)).forEach((t,i)=>{
      if(i===b && t!==s.threshold)return;
      mono(c,fixed(t)+'   '+fixed(f1(confusion(validation,t))),1012,309+i*75,25,t===s.threshold?P.gold:P.paper);
    });
    if(locked)text(c,'Frozen',1031,561,28,P.gold);
  }
}
const queue=test.filter(r=>r.p>=best),automatic=test.filter(r=>r.p<best);
function visibility(covered, sampled) {
  return automatic.map((r, i) => !covered || (sampled && i === 0) ? r.y : null);
}
const missCues = [
  ['one, two or three missed reviews', 'start'],
  ['Each extra miss adds one to the denominator', 'start'],
  ['Each extra miss adds one to the denominator', 'end'],
];

function afterAuditPhrase(k, beat, phrase) {
  const b = k.beat.beatIndex;
  return b > beat || (b === beat && k.elapsed >= k.wordCue(phrase).end);
}

function possibleCompletion(k) {
  const b = k.beat.beatIndex;
  if (b === 2 && afterAuditPhrase(k, 2, 'Suppose all three hidden outcomes were routine')) {
    return automatic.map(() => 0);
  }
  if (b === 3 && !afterAuditPhrase(k, 3, 'An unknown outcome has to stay unknown')) {
    return missCues.map(([phrase, edge]) => smooth((k.elapsed - k.wordCue(phrase)[edge]) / .25));
  }
  return null;
}

function drawPossibleCompletion(c, completion, caught, cardX, showRecall) {
  const tagTop = 528;
  const tagWidth = 189;
  text(c, 'Suppose', 59, 560, 26, P.soft);
  completion.forEach((progress, i) => {
    const x = cardX(i);
    const miss = progress === 1;
    const center = x + 105;
    const color = miss ? P.rust : P.soft;
    path(c, [[center, 508], [center, tagTop - 4]], color, 2, [3, 4]);
    box(c, x + 10, tagTop, tagWidth, 46, miss ? P.coral : P.paper, color, 4);
    if (progress > 0 && !miss) {
      path(c, [[x + 15, tagTop + 42], [x + 15 + (tagWidth - 10) * progress, tagTop + 42]], P.rust, 3);
    }
    mid(c, miss ? 'Missed review' : 'Routine', center, tagTop + 31, 24, color);
  });
  const misses = completion.filter(progress => progress === 1).length;
  text(c, 'Recall if true', 1018, 419, 25, P.soft);
  serif(c, caught + ' / ' + (showRecall ? caught + misses : '?'), 1017, 480, 47);
  const assumed = misses === 1 ? 'assumed miss' : 'assumed misses';
  mid(c, 'Needed reviews = ' + caught + ' caught + ' + misses + ' ' + assumed, 640, 368, 28);
}

export function auditQueue(c,k){
  const b = k.beat.beatIndex;
  const covered = afterAuditPhrase(k, 1, 'Cover the three automatic outcomes');
  const sampled = afterAuditPhrase(k, 4, 'It reveals one miss');
  const shown = visibility(covered, sampled);
  const tp = queue.filter(r => r.y).length;
  const completion = possibleCompletion(k);
  const sampling = afterAuditPhrase(k, 4, 'This draw opens the one at point four nine');
  const cardX = i => 268 + i * 241;
  scene(c,'Which outcomes did the audit observe?','AUGUST  /  THRESHOLD ' + fixed(best));
  for(const [row,items] of [queue,automatic].entries()){
    const y=220+row*164;
    text(c,row?'Automatic':'Review queue',59,y+66,25,P.soft);
    items.forEach((r,i)=>{
      const x=cardX(i),label=row?shown[i]:r.y;
      const selected = row === 1 && i === 0 && sampling;
      leaf(c,x,y,209,116,label===null?'#d9d3bf':P.paper,selected?P.teal:P.edge);
      mono(c,fixed(r.p),x+15,y+43,28);
      if(label===null){path(c,[[x+8,y+59],[x+203,y+59]],P.edge,2,[6,4]);text(c,'Unobserved',x+15,y+94,23,P.soft);}
      else{text(c,label?'Needed':'Routine',x+15,y+94,25,label?P.rust:P.teal);}
      if (selected) mid(c, sampled ? 'Sampled audit' : 'Selected for audit', x + 105, y + 155, 24, P.teal);
    });
  }
  text(c,'Precision',1018,257,25,P.soft);serif(c,tp+' / '+queue.length,1017,319,47);
  if(b===0){mid(c,'All six audits available',638,604,29);}
  if(b===1 && covered){mid(c,'How many needed reviews are hidden?',638,604,32);}
  if (completion) {
    const allMissed = completion.every(progress => progress === 1);
    const showRecall = b === 2
      ? afterAuditPhrase(k, 2, 'recall would be two out of two')
      : !allMissed || afterAuditPhrase(k, 3, 'as low as two fifths');
    drawPossibleCompletion(c, completion, tp, cardX, showRecall);
  } else if (b === 3) {
    mid(c, 'Possible recall     ' + tp + ' / ' + (tp + automatic.length) + ' to ' + tp + ' / ' + tp, 640, 368, 30);
  }
  if(sampled){
    const misses=shown.filter(y=>y===1).length,left=shown.filter(y=>y===null).length;
    mid(c,misses+' known missed review'+(misses===1?'':'s')+'      ·      '+left+' unknown automatic outcomes',640,368,30);
  }
  if (b === 5 && afterAuditPhrase(k, 5, 'Calibration asks a separate question')) {
    mid(c,'Calibration compares a stated probability with its observed frequency.',640,638,23,P.soft);
  }
}
export function checkCalendar(){
  function at(b,q){return {beat:{beatIndex:b},reveal:p=>q.includes(p)?1:0};}
  const janApr=calendarState(at(0,['Turn the development calendar to February','Fit the pipeline on January and February','Advance to March','then April']));
  assert.equal(janApr.month,4);assert.deepEqual(janApr.roles.slice(0,4),['Fit','Fit','Score','Score']);
  assert.equal(calendarState(at(1,[])).n,2);
  const next=calendarState(at(1,['Now begin the next refit','Advance to May','then June']));
  assert.deepEqual(next.roles,['Fit','Fit','Fit','Fit','Score','Score','','']);
  assert.deepEqual(calendarState(at(2,[])).roles,next.roles);
  assert.deepEqual(calendarState(at(2,['For release, fit the candidate'])).roles,['Fit','Fit','Fit','Fit','Fit','Fit','','']);
  assert.deepEqual([history.naive,history.ready],[3,2]);
  assert.deepEqual([lastRetained,excluded,testStart,testStart-excluded],[2,3,20,17]);
  assert.deepEqual([overlapStart,overlapEnd],[20,21]);
  assert.deepEqual(observationDays.filter(d=>d>=embargoWindow.start && d<embargoWindow.end),[21]);
  const innerMeans=[2,8];assert.equal(inner.filter(r=>nearest(r.x,...innerMeans)===r.y).length,2);
  assert.equal(inner.filter(r=>r.y===0).length,1);assert.deepEqual([mean(innerMeans),development.center],[5,6]);
  assert.deepEqual(choices.map(t=>f1(confusion(validation,t))),[.75,1,.5]);
  const locked=thresholdState(at(4,[]));assert.equal(locked.threshold,best);assert.equal(locked.counts,null);
  assert.deepEqual(thresholdState(at(6,[])).counts,{tp:2,fp:1,tn:2,fn:1});
  assert.deepEqual(visibility(true,false),[null,null,null]);assert.deepEqual(visibility(true,true),[1,null,null]);
  assert.equal(missCues.length, automatic.length);
  const on = (b, elapsed, cleared = false) => ({
    beat: { beatIndex: b },
    elapsed,
    wordCue: cue => {
      if (cue === missCues[0][0]) return { start: 1, end: 2 };
      if (cue === missCues[1][0]) return { start: 3, end: 5 };
      return { start: 6, end: cleared ? 6.5 : 9 };
    },
  });
  assert.equal(possibleCompletion(on(2, 8)), null);
  assert.deepEqual(possibleCompletion(on(2, 9)), [0, 0, 0]);
  assert.deepEqual(possibleCompletion(on(3, 2)), [1, 0, 0]);
  assert.deepEqual(possibleCompletion(on(3, 4)), [1, 1, 0]);
  assert.deepEqual(possibleCompletion(on(3, 6)), [1, 1, 1]);
  assert.equal(possibleCompletion(on(3, 7, true)), null);
  assert.equal(possibleCompletion(on(4, 8)), null);
}

