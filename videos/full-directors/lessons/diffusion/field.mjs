import assert from 'node:assert/strict';
import {mixture} from '../../../films/diffusion/arithmetic.mjs';
import {CENTERS,SCORE_PROBE} from '../../../films/diffusion/fixtures.mjs';
import {trajectories,trajectoryPoint,densityContours,crossReadFixture} from '../../../films/diffusion/model.mjs';
import {exposure} from '../../../films/diffusion/pixel-study.mjs';
import {TOP_PIXEL,SHADOW_PIXEL} from '../../../films/diffusion/fixtures.mjs';
import {C,cue,mix,num,vec,clamp} from './studio.mjs';

const colors=[C.blue,C.copper,C.green],vProbe=.70;
const probe=mixture(SCORE_PROBE,vProbe,{includeComponents:true});
const fieldAt=(p)=>[606+p[0]*108,548-p[1]*108];
function chart(d,v){
  const {ctx}=d;ctx.save();ctx.beginPath();ctx.rect(89,247,1036,586);ctx.clip();
  d.rect(89,247,1036,586,C.dark);
  for(const {points,level} of densityContours(v)){
    d.path(points.map(fieldAt),level>.09?'#7cbdac':'#568186',level>.09?3:2);
  }
}
function centers(d){
  CENTERS.forEach((pt,i)=>{const [x,y]=fieldAt(pt);d.line(x-8,y,x+8,y,'#eedeb6',3);d.line(x,y-8,x,y+8,'#eedeb6',3);});
}
function scoreArrows(d,v){
  for(let j=-2;j<=2;j++)for(let i=-4;i<=4;i++){
    const point=[i+.15,j+.15],a=fieldAt(point),s=mixture(point,v).score,n=Math.hypot(...s);
    if(n>.02){const k=Math.min(33/n,13);d.arrow(...a,a[0]+k*s[0],a[1]-k*s[1],'#94b8bc',2.5);}
  }
}
export function score(d,c){
  const b=c.beat.beatIndex,v=vProbe*cue(c,0,'Gaussian noise broadens',2);
  d.title('Probability atlas   /   exact Gaussian mixture','Which way is uphill at this point?');
  chart(d,v);centers(d);
  const [px,py]=fieldAt(SCORE_PROBE);
  if(b>=1){
    scoreArrows(d,v);
    d.dot(px,py,13,'#f1bc67');d.dot(px,py,20,C.white,true,3);
  }
  d.ctx.restore();
  if(b===0){
    d.text('Three clean clusters',1206,390,49,C.ink,'serif');
    d.text('Equal prior weights',1206,470,40,C.quiet);
    d.text('Added variance',1206,600,36,C.quiet);
    d.text(num(v,2),1206,695,74,C.blue,'mono');
  }else{
    const names=['Lower left','Lower right','Upper'];
    d.text('At the probe',1190,305,50,C.ink,'serif');
    d.text(vec(SCORE_PROBE,1),1190,365,38,C.quiet,'mono');
    const w=cue(c,2,'The lower right center',.45);
    for(const [i,t] of probe.components.entries()){
      const y=427+77*i;
      d.text(names[i],1190,y,34,C.ink);
      d.fade(w,()=>{d.rect(1437,y-19,t.posteriorWeight*355,18,colors[i]);d.text(Math.round(100*t.posteriorWeight)+'%',1820,y,33,colors[i],'mono','right');});
    }
    const p=cue(c,2,'Add the three weighted arrows',2.2);
    if(p>0){
      // A magnified vector inset uses one scale and a common head-to-tail origin.
      let x=1515,y=729;const scale=250;
      const start=[x,y];
      probe.components.forEach((t,i)=>{
        const fraction=clamp(p*3-i),X=x+fraction*t.contribution[0]*scale,Y=y-fraction*t.contribution[1]*scale;
        d.arrow(x,y,X,Y,colors[i],5);x=X;y=Y;
      });
      if(p>=1){d.arrow(...start,x,y,C.ink,6);d.arrow(px,py,px+probe.score[0]*90,py-probe.score[1]*90,'#f1bc67',6);}
      d.text('Weighted local directions',1190,844,31,C.quiet);
    }
  }
  d.note(b===3?'For Gaussian corruption, score ≈ − predicted noise / noise standard deviation.':
    b===0?'Contour lines join points with the same density.':'The probe stays fixed while we compare the three pulls.');
}
export function transport(d,c){
  const b=c.beat.beatIndex;
  if(b===2){
    d.title('Flow matching   /   one training pair','Which way does time run?');
    const p=cue(c,2,'Run time from noise to data',2.8);
    const x=d.axis(177,595,1550,-1.5,1.5,[-1,0,1]);
    d.text('Noise   −1',x(-1),416,48,C.blue,'serif','center');
    d.text('Data   +1',x(1),416,48,C.green,'serif','center');
    d.arrow(x(-1),505,x(1),505,C.faint,8);
    d.mark(x(-1+2*p),505,C.copper,22);
    d.text('Time   '+num(p,2),109,790,37,C.copper,'mono');
    d.fade(cue(c,2,'target velocity',.4),()=>d.text('Pair velocity   +1 − (−1) = +2',634,790,44,C.ink,'mono'));
    d.note('This training path uses time 0 at noise and time 1 at data.');return;
  }
  d.title('Probability atlas   /   72 starting points','Follow one grain in the cloud');
  const p=.52*cue(c,0,'Turn down the added variance',4)+.48*cue(c,1,'Continue to zero',4.5),v=3*(1-p);
  chart(d,v);centers(d);
  for(const [i,path] of trajectories.entries()){
    const last=Math.floor((path.length-1)*p);
    if(last>1&&i%2===0){
      const trail=[];for(let j=0;j<last;j+=12)trail.push(fieldAt(path[j]));trail.push(fieldAt(trajectoryPoint(i,p)));
      d.path(trail,i===0?'#ffbc72':'#7caaa6',i===0?5:1.7);
    }
    d.dot(...fieldAt(trajectoryPoint(i,p)),i===0?10:4.8,i===0?'#ffba70':'#dddfc7');
  }
  d.ctx.restore();const pt=trajectoryPoint(0,p);
  d.text('Copper particle',1210,378,52,C.ink,'serif');
  d.text(vec(pt),1210,469,48,C.copper,'mono');
  d.text('Added variance',1210,600,38,C.quiet);
  d.text(num(v,2),1210,695,71,C.blue,'mono');
  d.rect(1210,753,520,15,C.pale);d.rect(1210,753,520*v/3,15,C.blue);
  d.note('Same local rule for every particle     •     Added variance runs from 3 to 0.');
}

const tableQuery=[.25,.1,.7],shadeQuery=[.1,.8,.15],tile=exposure(.5);
export function attention(d,c){
  const b=c.beat.beatIndex,shift=cue(c,2,'Move the query',0),tie=cue(c,3,'Try a query',0);
  const q=tie?[0,0,0]:shift?shadeQuery:tableQuery;
  const a=crossReadFixture(q);
  const key=a.keys[0];
  const dot=q.reduce((sum,v,i)=>sum+v*key[i],0);
  const pairs=q.map((v,i)=>num(v,2)+'×'+num(key[i],2)).join(' + ');
  const subtotal=tie?cue(c,3,'so all three shares',.3):shift?cue(c,2,'Divide by the same',.3):cue(c,0,'Divide by the square root',.3);
  const scores=tie?subtotal:shift?cue(c,2,'Recompute the shares',.3):cue(c,0,'Repeat for dining',.3);
  const shares=tie?cue(c,3,'Take the average',.35):shift?cue(c,2,'Dining now gets',.35):cue(c,1,'divide by their sum',.5);
  const values=tie?cue(c,3,'A word can contribute',.4):shift?shares:cue(c,1,'Add the weighted values',.65);
  d.title('Text conditioning   /   one attention head','Which words reach this square?');
  d.sheet(tile,97,344,340,tie?null:shift?SHADOW_PIXEL:TOP_PIXEL,'Noisy oak table');
  d.text(tie?'Test query':shift?'Shadow query':'Tabletop query',101,784,35,C.quiet);d.text(vec(q,2),101,838,34,C.blue,'mono','left',376);
  for(const [x,title] of [[514,'Token'],[697,'Text key'],[1113,'Score'],[1305,'Share'],[1587,'Value']])d.text(title,x,295,36,C.quiet);
  ['oak','dining','table'].forEach((word,i)=>{
    const y=382+84*i;d.text(word,514,y,48,C.ink,'serif');
    d.text(vec(a.keys[i],2),697,y,34,i===0?C.copper:C.quiet,'mono','left',395);
    d.fade(scores,()=>d.text(num(a.scores[i]),1113,y,36,C.blue,'mono'));
    d.fade(shares,()=>{
      d.rect(1305,y-23,115,22,C.pale);d.rect(1305,y-23,115*a.shares[i],22,C.green);
      d.text(tie?'1/3':num(a.shares[i]*100,1)+'%',1436,y,32,C.green,'mono');
    });
    d.text(vec(a.values[i],1),1587,y,33,C.ink,'mono');
  });
  d.line(514,591,1810,591,C.faint,2);
  d.text('Oak score',514,659,43,C.copper,'serif');
  d.text('('+pairs+') / √'+q.length,750,659,40,C.ink,'mono','left',1064);
  d.fade(subtotal,()=>d.text('= '+num(dot,tie?0:shift?4:3)+' / √'+q.length,750,721,37,C.blue,'mono'));
  d.fade(scores,()=>d.text((tie?'= ':'≈ ')+num(a.scores[0],3),1218,721,38,C.blue,'mono'));
  d.fade(values,()=>{d.text('Weighted value',592,819,45,C.ink,'serif');d.text('≈ '+vec(a.output,3),980,819,47,C.green,'mono');});
  d.note(tie?(shares?'Average the three values coordinate by coordinate.':'Keep the same keys and values. Predict the output for a zero query.'):
    shift?'Only the query changed. The tabletop gave oak a score of '+num(crossReadFixture(tableQuery).scores[0])+'.':
    b===0?'Match coordinates in the query and key. Divide their dot product by √3.':'Normalize all three scores, then mix the two-coordinate values.');
}
const base=[.20,-.10],prompt=[.05,-.35];
const guide=w=>base.map((x,i)=>x+w*(prompt[i]-x));
export function guidance(d,c){
  const b=c.beat.beatIndex,U=cue(c,0,'with an empty condition',.55),P=cue(c,0,'with the oak-table prompt',.55);
  let w = b > 2 ? 3 : 0;
  if (b === 2) {
    const toGreen = c.wordCue('lands on green').start - c.wordCue('At scale one').start;
    w = c.reveal('At scale one', Math.max(0, toGreen), { captionStart: false })
      + 2 * c.reveal('Raise the scale to three', 2, { captionStart: false });
  }
  const showCoordinates = b > 2 || (b === 2 &&
    c.reveal('The coordinates describe predicted noise', 0, { captionStart: false }));
  d.title('Classifier-free guidance   /   one noisy input','Where will the guided prediction land?');
  d.sheet(tile,85,399,244,null,'Same image and level');
  const branches=[[U,'Empty prompt',base,C.blue,405],[P,'Oak table',prompt,C.green,651]];
  branches.forEach(([show,name,v,col,y])=>d.fade(show,()=>{
    d.path([[354,526],[394,526],[394,y],[470,y]],col,4);
    d.arrow(457,y,485,y,col,4);
    d.text(name,504,y-10,42,col,'serif');d.text(vec(v),504,y+49,36,col,'mono');
  }));
  d.line(908,284,908,828,C.faint,2);
  const ox=1460,oy=347,k=530,pt=v=>[ox+k*v[0],oy-k*v[1]];
  d.text('Noise prediction coordinates',974,279,34,C.quiet);
  d.line(965,oy,1815,oy,C.faint,2);d.line(ox,300,ox,836,C.faint,2);
  d.text('ε₁',1776,oy-17,31,C.quiet,'mono');d.text('ε₂',ox+15,329,31,C.quiet,'mono');
  d.fade(U,()=>{d.arrow(ox,oy,...pt(base),C.blue,9);d.dot(...pt(base),10,C.blue);});
  d.fade(P,()=>{d.arrow(ox,oy,...pt(prompt),C.green,9);d.dot(...pt(prompt),10,C.green);});
  const delta=cue(c,1,'Subtract the empty prediction',.75);
  d.fade(delta,()=>{
    const [x,y]=pt(base),[X,Y]=pt(prompt);
    const ctx=d.ctx;ctx.setLineDash([9,10]);d.line(x,y,X,Y,C.copper,4);ctx.setLineDash([]);
    d.text('Prompt − empty   '+vec(guide(1).map((v,i)=>v-base[i])),89,810,37,C.copper,'mono','left',802);
    d.dot(x,y,15,C.copper,true);
  });
  const guided = guide(w);
  if (b >= 2) {
    d.arrow(...pt(base), ...pt(guided), C.copper, 6);
    for (const scale of [1, 2, 3]) {
      if (w < scale) continue;
      const [x, y] = pt(guide(scale));
      d.line(x - 13, y - 8, x + 13, y + 8, C.copper, 4);
      d.text(String(scale) + '×', x + 26, y + 10, 32, C.copper, 'mono');
    }
    d.dot(...pt(guided), 14, C.copper, true, 5);
    d.text('w = ' + num(w, 2), 990, 439, 43, C.copper, 'mono');
  }
  const note = b < 2 ? 'Both arrows use the same axes. Only the text condition changes.' :
    showCoordinates ? 'Predicted noise at w = 3   ' + vec(guided) : 'Guided = empty + w × (prompt − empty)';
  d.text(note, 87, 876, 42, C.ink, 'serif', 'left', 1740);
}
export function checkField(){
  const near=(x,y,t=1e-8)=>assert.ok(Math.abs(x-y)<t);
  near(probe.components.reduce((s,c)=>s+c.posteriorWeight,0),1);
  assert.ok(probe.components[1].posteriorWeight>Math.max(probe.components[0].posteriorWeight,probe.components[2].posteriorWeight));
  [0,1].forEach(i=>{const left=SCORE_PROBE.slice(),right=left.slice();left[i]-=.00001;right[i]+=.00001;
    const grad=(Math.log(mixture(right,vProbe).density)-Math.log(mixture(left,vProbe).density))/.00002;
    near(grad,probe.score[i]);near(probe.components.reduce((s,c)=>s+c.contribution[i],0),grad);
  });
  assert.equal(trajectories.length,72);const occupied=new Set();
  trajectories.forEach((path,i)=>{const p=trajectoryPoint(i,1);assert.deepEqual(p,path.at(-1));const distances=CENTERS.map(a=>Math.hypot(p[0]-a[0],p[1]-a[1]));occupied.add(distances.indexOf(Math.min(...distances)));});
  assert.equal(occupied.size,3);
  const tie=crossReadFixture([0,0,0]);tie.shares.forEach(w=>near(w,1/3));near(tie.output[0],1.7/3);near(tie.output[1],1/3);
  const table=crossReadFixture(tableQuery),shade=crossReadFixture(shadeQuery);
  assert.deepEqual(table.keys,shade.keys);assert.deepEqual(table.values,shade.values);
  assert.deepEqual(table.keys[0],[.3,.05,.65]);assert.deepEqual(table.values[0],[.7,.2]);
  for(const [a,oakDot] of [[table,.535],[shade,.1675],[tie,0]]){
    near(a.scores[0],oakDot/Math.sqrt(3));
    a.keys.forEach((key,i)=>near(a.scores[i],a.query.reduce((s,v,j)=>s+v*key[j],0)/Math.sqrt(key.length)));
    near(a.shares.reduce((s,v)=>s+v,0),1);
    a.output.forEach((v,j)=>near(v,a.shares.reduce((s,w,i)=>s+w*a.values[i][j],0)));
  }
  assert.ok(shade.shares[0]<table.shares[0]&&shade.shares[1]>shade.shares[0]);
  guide(0).forEach((v,i)=>near(v,base[i])); guide(1).forEach((v,i)=>near(v,prompt[i]));near(guide(2)[0],-.10);near(guide(2)[1],-.60);near(guide(3)[0],-.25);near(guide(3)[1],-.85);
}
