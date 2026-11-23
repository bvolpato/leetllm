import assert from 'node:assert/strict';
import { P, arrow, box, circle, fixed, leaf, mid, mix, mono, path, phase, punch, result, scene, serif, tag, text } from './studio.mjs';
import { SELECTOR, allFeatures, foldScores, users } from '../../../films/validation/fixtures.mjs';
import { fitSelector, oneFoldModel } from '../../../films/validation/model.mjs';
import { f1, mean } from '../../../films/validation/arithmetic.mjs';

const fold=oneFoldModel();
const second={tp:1,fp:0,fn:0,tn:0};
const pooled=Object.fromEntries(Object.entries(second).map(([key,n])=>[key,n+fold.counts[key]]));
const spread=Math.sqrt(foldScores.reduce((s,v)=>s+(v-mean(foldScores))**2,0)/(foldScores.length-1));
const scoreFraction=s=>(2*s.tp)+' / '+(2*s.tp+s.fp+s.fn);
function fitRuler(c,k){
  const b=k.beat.beatIndex,place=x=>143+96*x,y=366;
  const classColors=[P.navy,'#a43c6b'];
  text(c,'Class 0',81,222,25,classColors[0]);text(c,'Class 1',229,222,25,classColors[1]);
  box(c,113,y-14,1102,56,'#e3c48d',P.soft,3);
  for(let i=0;i<=11;i++){const x=place(i);path(c,[[x,y-14],[x,y+5]],P.ink,2);mono(c,i,x,y+33,20,P.ink,'center');}
  fold.training.forEach(({x,y:label})=>{
    path(c,[[place(x),y-16],[place(x),y-59]],P.soft,2);circle(c,place(x),y-69,15,classColors[label]);
  });
  if(phase(k,0,'The training mean')>0){
    path(c,[[place(fold.center),y-64],[place(fold.center),y+117]],P.ink,3,[5,5]);
    for(let j=0;j<=10;j++)mono(c,j-fold.center,place(j),y+82,21,P.soft,'center');
    mid(c,'Centered at '+fold.center,place(fold.center),y+152,26);
  }
  if(b>=1){for(const [i,m] of fold.means.entries()){
    const x=place(m+fold.center);mid(c,'Mean '+(m>0?'+':'')+m,x,270,24,classColors[i]);
    path(c,[[x,280],[x,332]],classColors[i],3);
  }}
  if(b>=2){
    const x=place(9);arrow(c,x,515,x,462,P.navy,4);mid(c,'Held 9',x,554,25,P.navy);
    if(b===2)mid(c,'Which mean is closer?',640,620,32);
  }
}
function countStrip(c,v,x,y,name){
  text(c,name,x,y,28);
  ['tp','fp','fn'].forEach((key,i)=>{punch(c,x+i*95,y+24,v[key],key==='tp'?P.mint:P.coral,77);mono(c,key.toUpperCase(),x+39+i*95,y+108,21,P.soft,'center');});
  serif(c,'F1 = '+scoreFraction(v),x,y+177,37);
}
export function calculation(c,k){
  const b=k.beat.beatIndex;
  const title=b<3?'Find the nearer class mean':b<5?'Open the fold audit':b<7?'Where do the folds combine?':b===7?'Read the lowest fold':b===8?'How much training data overlaps?':'Can five folds each get a positive?';
  scene(c,title,'REFIT AND SCORE  /  DEVELOPMENT');
  if(b<3){fitRuler(c,k);return;}
  if(b<5){
    const cols=[122,354,586,816,1079];['Held x','x − 6','Predict','Audit','Count'].forEach((s,i)=>mid(c,s,cols[i],216,25,P.soft));
    const open=phase(k,3,'Open the audit for nine',.6);
    fold.held.forEach((r,i)=>{
      const y=275+i*69,pred=fold.predictions[i];box(c,73,y-35,1129,57,r.x===9?P.blue:i%2?P.ground:P.paper,null,4);
      [r.x,r.x-fold.center,pred,open===1?r.y:'?',open===1?(pred?(r.y?'TP':'FP'):(r.y?'FN':'TN')):'—'].forEach((v,j)=>mono(c,v,cols[j],y+4,27,P.ink,'center'));
    });
    if(b===3 && phase(k,3,'Precision and recall')>0)mid(c,'Precision  1 / 2          Recall  1 / 2',640,598,30);
    if(b===4){text(c,'F1 = 2TP / (2TP + FP + FN)',91,532,31);if(phase(k,4,"Here that's two over four",1.3)===1)serif(c,scoreFraction(fold.counts)+' = '+fixed(fold.f1),864,537,42,P.teal);}
    return;
  }
  if(b<7){
    countStrip(c,fold.counts,85,247,'Fold A · four requests');countStrip(c,second,474,247,'Fold B · one request');
    path(c,[[832,196],[832,577]],P.edge,2);
    if(b===5){
      result(c,'One vote per fold','(½ + 1) / 2',877,289);
      if(phase(k,5,'three quarters',.85)===1)serif(c,fixed(mean([fold.f1,f1(second)])),879,475,62,P.teal);
    }else{countStrip(c,pooled,885,247,'Pooled counts');serif(c,'= ⅔',886,491,44,P.teal);}
    mid(c,b===5?'Average the two scores':'Add the counts before computing F1',640,553,31);return;
  }
  if(b===7){
    const min=Math.min(...foldScores);foldScores.forEach((v,i)=>{
      const x=158+204*i,h=v*316;box(c,x,526-h,123,h,v===min?P.rust:P.teal,null,3);mono(c,fixed(v),x+62,506-h,27,P.ink,'center');mid(c,'F'+(i+1),x+62,565,25);
    });
    mid(c,'Mean  '+fixed(mean(foldScores),3)+'        Sample standard deviation  '+fixed(spread,3),640,225,27);return;
  }
  if(b===8){
    const fitStrip=(name,n,held,y)=>{
      text(c,name,67,y+31,27);for(let i=0;i<n;i++){box(c,327+i*67,y,56,42,held.includes(i)?P.gold:P.teal,null,4);}
      mono(c,(n-held.length)+' / '+n,1115,y+32,26);
    };
    text(c,'Teal trains the model. Gold is held out.',69,218,26,P.soft);
    fitStrip('Five folds',5,[0],255);fitStrip('Ten folds',10,[0],330);fitStrip('Leave one out · A',10,[0],406);fitStrip('Leave one out · B',10,[1],476);
    mid(c,'Example with ten rows  ·  the two leave-one-out fits share eight',640,549,27);
  }else{
    for(let i=0;i<5;i++){const x=80+232*i;leaf(c,x,263,184,192);mid(c,'Fold '+(i+1),x+92,314,26);if(i>1){circle(c,x+92,380,32,P.rust);mid(c,'+',x+92,391,34,P.paper);}else mid(c,'0',x+92,395,45,P.soft);}
    mid(c,'Three positive labels distributed across five folds',640,554,33);
  }
}
function lookupRows(split){
  const known=split?users.slice(0,4):users,held=split?users.slice(4):users;
  return held.map(u=>({ ...u, prediction:known.find(row=>row.id===u.id)?.label??0 }));
}
export function people(c,k){
  const b=k.beat.beatIndex,split=phase(k,1,'Now keep both requests',1)===1;
  scene(c,'Who is already in the lookup?',split?'WHOLE USERS HELD OUT':'ONE REQUEST PER USER HELD OUT');
  text(c,'User',70,224,23,P.soft);text(c,'Training',70,315,23,P.soft);text(c,'Held out',70,418,23,P.soft);text(c,'Call',70,497,23,P.soft);
  const loaded=phase(k,0,'A lookup table remembers',2.6),rows=lookupRows(split);
  users.forEach((u,i)=>{
    const x=238+i*127,hasTrain=!split||i<4,hasHeld=!split||i>=4,pred=rows.find(row=>row.id===u.id)?.prediction;
    circle(c,x,203,20,i%2?P.navy:P.teal);mid(c,'u'+(i+1),x,247,23);
    if(hasTrain){punch(c,x-45,269,split?'2 × '+u.label:u.label,P.mint,90);}
    if(hasHeld){punch(c,x-45,372,split?'2 × '+u.label:u.label,P.blue,90);}
    if(hasHeld && (split || i<Math.ceil(loaded*8))){mono(c,pred,x,497,32,pred===u.label?P.teal:P.rust,'center');}
  });
  if(b===2){
    tag(c,'Returning cohort    8 / 8',167,517,386,P.navy,P.white,44);
    tag(c,'New cohort    2 / 4',680,517,386,P.teal,P.white,44);
  }else if(split)mid(c,'Unknown user → predict 0       '+rows.filter(r=>r.label===r.prediction).length+' of '+rows.length+' new users correct',640,552,30);
  else if(b>=1)mid(c,'8 of 8 returning users correct',640,552,30);
}
function rulerState(t){
  const training=mean(allFeatures.slice(0,3)),all=mean(allFeatures),origin=Math.round(10*mix(training,all,t))/10;
  const label=t===0?'Training mean':t===1?'All-row mean':'Origin';
  return {origin,label,offsets:allFeatures.map(x=>x-origin)};
}
export function scaler(c,k){
  const t=phase(k,3,'Watch the origin slide',1.7),s=rulerState(t),pos=v=>185+v*45;
  scene(c,'Slide the origin under the same observations','PREPROCESSING  /  CENTERING');
  allFeatures.forEach((v,i)=>{
    const x=pos(v),col=i===3?P.rust:P.teal;path(c,[[x,305],[x,368]],col,3);circle(c,x,302,13,col);
    mono(c,v,x,275,28,col,'center');
  });
  text(c,'Training',197,212,26,P.teal);text(c,'Held out',1084,212,26,P.rust,'center');
  box(c,82,374,1120,69,'#dbbe89',P.soft,5);
  for(let n=-20;n<=28;n++){
    const x=pos(n+s.origin);if(x<101||x>1182)continue;
    path(c,[[x,376],[x,389+(n%2===0?9:0)]],P.ink,2);
    if(n%2===0)mono(c,n,x,430,20,P.ink,'center');
  }
  const x=pos(s.origin);arrow(c,x,522,x,449,P.rust,4);
  mono(c,s.label+' '+fixed(s.origin,t>0&&t<1?1:0),x,546,25,P.rust,'center');
  const b=k.beat.beatIndex;
  if(b>=1){
    const formula=b<2?'(2 + 4 + 6) / 3 = 4':t===1?'(2 + 4 + 6 + 20) / 4 = 8':'Proposed mean   (2 + 4 + 6 + 20) / 4';
    text(c,formula,1172,500,24,P.ink,'right');
  }
  mono(c,'Centered: '+s.offsets.map(v=>fixed(v,t>0&&t<1?1:0)).join('   '),1172,542,23,P.ink,'right');
}
const targetFit=SELECTOR.y.slice(0,4);
const trainSelector=fitSelector(4), allRowSelector=fitSelector(8);

function compareCalls(c,k){
  scene(c,'Both classifiers fit rows 0–3','FEATURE SELECTION  /  HELD-OUT PREDICTIONS');
  // The delays from each sentence start follow the approved take and keep the caption intact.
  const columns=[
    {model:trainSelector,x:385,scope:'training labels',cue:'Using T',score:phase(k,6,'The training-only selector gets two',1.425)},
    {model:allRowSelector,x:824,scope:'all eight labels',cue:'Using L',score:phase(k,6,'The all-row selector gets four out of four',1.563)},
  ];
  text(c,'Held-out request',70,204,30);
  for(const {model,x,scope} of columns){
    text(c,model.selected+' chosen on '+scope,x,198,30);
    text(c,'Class means   '+model.mu.join(' and '),x,237,25,P.soft);
  }
  for(const [index,row] of [5,6].entries()){
    const y=255+index*135,truth=SELECTOR.y[row];
    leaf(c,55,y,1169,119);
    serif(c,'Row '+row,78,y+46,39);
    text(c,'Audit '+truth,80,y+91,33,P.navy);
    for(const {model,x,cue} of columns){
      const value=SELECTOR[model.selected][row],prediction=model.predictions[row-4];
      text(c,'Input '+value,x,y+47,32);
      arrow(c,x+132,y+35,x+176,y+35,P.soft,3);
      text(c,'Call '+(phase(k,5,cue,.3)===1?prediction:'?'),x+197,y+47,32);
      const verdict=prediction===truth?'Correct':prediction===1?'False alarm':'Miss';
      const verdictDelay=prediction===truth?.55:prediction===1?1.262:2.45;
      if(phase(k,5,cue,verdictDelay)===1){
        text(c,verdict,x+197,y+91,31,prediction===truth?P.teal:P.rust);
      }
    }
  }
  if(columns.some(({score})=>score===1)){
    text(c,'All four held rows',73,550,30);
    for(const {model,x,score} of columns){
      if(score===1)serif(c,model.correct+' / '+model.predictions.length+' correct',x,552,39);
    }
  }
}

export function selector(c,k){
  const b=k.beat.beatIndex;
  const repaired=phase(k,6,'Refit the selector inside each training fold',.7)===1;
  if(b>=5 && b<7 && !repaired){compareCalls(c,k);return;}
  const title=b>=7?'Encode a category seen once':'Which column does the selector choose?';
  scene(c,title,b<7?'FEATURE SELECTION  /  TWO CANDIDATES':'TARGET ENCODING  /  TRAINING ROW A');
  if(b>=7){
    const cover=phase(k,7,"Now cover A's fold",.7),shown=phase(k,8,'B contributes',.3)>0;
    ['A','B','C','D'].forEach((id,i)=>{
      const x=83+i*182,covered=cover>0&&i%2===0;leaf(c,x,238,147,170,covered?P.ground:P.paper);
      mid(c,id,x+73,297,37);mono(c,covered?'?':targetFit[i],x+73,376,44,covered?P.soft:P.teal,'center');
    });
    text(c,'Encoded A',890,262,28,P.soft);
    serif(c,cover===0?'1':shown?fixed(mean([targetFit[1],targetFit[3]])):'?',890,363,70,P.teal);
    if(cover>0)text(c,'(B + D) / 2',886,413,26);
    mid(c,cover>0?'Fit the fallback mean on B and D':'Using A’s own label copies its target',640,549,31);
    if(b===9)mid(c,'Apply the full training mapping to the next held-out request.',640,616,27);return;
  }
  const count=repaired?4:4+Math.floor(4*phase(k,3,'Now extend the bracket',2.25));
  const model=fitSelector(count);
  const labels=['Row','T','L','Label'];
  const xs=[137,310,455,622];
  labels.forEach((s,i)=>mid(c,s,xs[i],213,24,P.soft));
  for(let i=0;i<8;i++){
    const y=251+i*43+(i>=4?19:0),held=i>=4;
    box(c,69,y-27,630,39,i<count?(held?P.coral:P.mint):P.paper,null,3);
    const row=[i,SELECTOR.T[i],SELECTOR.L[i],i<count?SELECTOR.y[i]:'?'];
    row.forEach((v,j)=>mono(c,v,xs[j],y+2,23,P.ink,'center'));
  }
  const x=772,bottom=262+43*(count-1)+(count>4?19:0);
  path(c,[[713,224],[728,224],[728,bottom],[713,bottom]],repaired?P.teal:P.rust,4);
  text(c,'Selector sees '+count+' labels',x,234,30);
  for(const [i,col] of ['T','L'].entries()){
    const [zero,one]=model.classMeans[col],y=311+i*132;
    text(c,col+'   positive − negative',x,y,23,P.soft);
    const positives=SELECTOR.y.slice(0,count).reduce((s,v)=>s+v,0),negatives=count-positives;
    const sign=Math.abs(Number(model.gaps[col].toFixed(2))-model.gaps[col])<1e-9?' = ':' ≈ ';
    mono(c,Math.round(one*positives)+'/'+positives+' − '+Math.round(zero*negatives)+'/'+negatives+sign+fixed(model.gaps[col]),x,y+49,27,P.ink);
  }
  if(repaired||(b===2&&phase(k,2,'Its class means')>0)||(b===4&&phase(k,4,'The held-out labels')>0))tag(c,'Keep '+model.selected,x,516,231);
}
export function checkFits(){
  assert.deepEqual(fold.predictions,[0,1,1,0]);assert.deepEqual(fold.counts,{tp:1,fp:1,fn:1,tn:1});
  assert.equal(f1(pooled),2/3);assert.equal(mean([fold.f1,f1(second)]),.75);assert.equal(fixed(spread,3),'0.093');
  for(const [t,label] of [[0,'Training mean'],[.25,'Origin'],[.5,'Origin'],[1,'All-row mean']]){
    const s=rulerState(t);
    assert.equal(s.label,label);
    s.offsets.forEach((v,i)=>assert.equal(v+s.origin,allFeatures[i]));
  }
  assert.deepEqual(rulerState(1).offsets,[-6,-4,-2,12]);
  assert.equal(lookupRows(true).filter(r=>r.prediction===r.label).length,2);
  assert.deepEqual(fitSelector(4).predictions,[1,1,0,0]);assert.deepEqual(fitSelector(8).predictions,[1,0,1,0]);
  assert.deepEqual(fitSelector(4).mu,[0,1]);assert.deepEqual(fitSelector(8).mu,[0,.5]);
  assert.equal(mean([targetFit[1],targetFit[3]]),.5);
}

