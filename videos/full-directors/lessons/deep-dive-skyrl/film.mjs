import { firstFrameAt } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import { check, names, tokens, vocabulary, customers, sqlResult, returnSum, generatorRows, costs, group, clipped, schedule, steps, margin, ledger, liveGroup, fleet, firstToken, historyRevisions, historical, critic, restores, practice } from './examples.mjs';

const C = {
  paper:'#f6f3e9', ink:'#172e32', muted:'#52666a', line:'#b5bcb0', white:'#fffdf6',
  action:'#1d6576', pale:'#d8e9e8', db:'#a84d2d', peach:'#f4ddcc',
  green:'#296848', mint:'#dcebd8', gold:'#ecc55b', red:'#943e41', gray:'#e6e4d8'
};
const lerp = (a,b,p) => a+(b-a)*p;
const ease = v => v*v*(3-2*v);
const signed = n => n===0?'0':(n>0?'+':'−')+Math.abs(n).toFixed(2);
function text(c,s,x,y,size=22,color=C.ink,face='Sans',weight=500,align='left') {
  c.fillStyle=color;
  c.font=weight+' '+size+'px "Lesson '+face+'"';
  c.textAlign=align;
  c.textBaseline='alphabetic';
  c.fillText(String(s),x,y);
}
function rect(c,x,y,w,h,fill,r=0,stroke=null) {
  c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=fill; c.fill();
  if(stroke){c.lineWidth=1.5;c.strokeStyle=stroke;c.stroke();}
}
function line(c,x,y,x2,y2,color=C.line,width=2,dash=[]) {
  c.beginPath();c.setLineDash(dash);c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();c.setLineDash([]);
}
function dot(c,x,y,r,fill) {
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();
}
function tag(c,s,x,y,fill=C.ink,fg=C.white,w=114) {
  rect(c,x,y,w,34,fill,17);text(c,s,x+w/2,y+23,16,fg,'Mono',600,'center');
}
function ruleLabel(c,s,x,y,color=C.muted) {text(c,s,x,y,17,color,'Sans',700);}
function page(c,section,title,context) {
  c.fillStyle=C.paper;c.fillRect(0,0,1200,675);
  line(c,48,62,1152,62,C.ink,1.5);
  rect(c,48,27,10,21,C.action,3);text(c,'SkyRL',69,45,20,C.ink,'Sans',700);
  text(c,section,158,45,17,C.muted,'Sans',600);
  text(c,context,1152,45,19,C.action,'Mono',600,'right');
  text(c,title,48,127,43,C.ink,'Serif',500);
}
function foot(c,left,right='') {
  rect(c,48,543,1104,63,C.ink,8);
  text(c,left,70,583,22,C.white,'Sans',600);
  if(right)text(c,right,1129,582,19,'#b5e1dc','Mono',500,'right');
}
function beat(clock) {
  const i=clock.beat.beatIndex;
  return {
    i,
    cue:(n,phrase,d=0)=>i<n?0:i>n?1:clock.reveal(phrase,d),
    after(n,phrase,{captionStart=false}={}) {
      if(i!==n)return i>n;
      if(captionStart)clock.reveal(phrase,0,{captionStart:phrase});
      return firstFrameAt(clock.elapsed)>=firstFrameAt(clock.wordCue(phrase).end);
    }
  };
}
const paired = [
  {x:48,author:'Sampler',color:C.action,fill:C.pale},
  {x:621,author:'SQLite',color:C.db,fill:C.peach}
];
function twins(c,marked,echo) {
  for(const [j,p] of paired.entries()){
    rect(c,p.x,163,531,150,p.fill,12);
    c.save();
    if(j===1){
      c.beginPath();c.rect(p.x,163,531*echo,150);c.clip();
    }
    ruleLabel(c,p.author,p.x+20,194,p.color);
    text(c,j?'no such column:':'AND  [field]  >  3',p.x+509,194,19,p.color,'Mono',400,'right');
    text(c,vocabulary[11],p.x+22,259,41,C.ink,'Mono');
    rect(c,p.x+274,215,163,57,marked?(j?C.db:C.action):C.white,8);
    text(c,vocabulary[12],p.x+355,258,39,marked?C.white:C.ink,'Mono',600,'center');
    if(marked)text(c,j?'Database observation':'Sampled action',p.x+22,299,19,p.color,'Sans',700);
    c.restore();
  }
}
function customerTable(c,show) {
  ruleLabel(c,'customers',63,357);
  ['name','active','open_incidents'].forEach((v,i)=>text(c,v,[63,189,298][i],392,19,C.action,'Mono'));
  line(c,63,404,529,404);
  customers.forEach(([n,a,k],i)=>{
    const y=437+i*36;
    if(show&&sqlResult.includes(n))rect(c,56,y-26,478,33,C.mint,4);
    [n,a,k].forEach((v,j)=>text(c,v,[63,206,310][j],y,23,C.ink,'Mono'));
  });
}
function opening(c,b) {
  if(b.i>=4){
    const p=b.cue(5,'Move each whole row',1.65);
    const across=ease(Math.min(1,p*3))-ease(Math.max(0,3*p-2));
    const swap=ease(Math.max(0,Math.min(1,3*p-1)));
    const optional=b.cue(5,'optional value');
    page(c,'Generator output','Where does the first reply belong?','input  r8 → r9');
    ruleLabel(c,'Input order',58,207);ruleLabel(c,'Returned rows',354,207);
    for(let k=0;k<2;k++){
      text(c,'0'+(k+1)+'    r'+(8+k),64,291+k*115,30,C.ink,'Mono',600);
      const row=generatorRows[k], warm=row.id==='r9';
      const x=354+(warm?414*across:0);
      const y=235+115*(warm?swap:1-swap);
      rect(c,x,y,391,92,warm?C.peach:C.pale,9);
      text(c,row.id,x+16,y+37,27,warm?C.db:C.action,'Mono',700);
      text(c,row.sample,x+77,y+37,24,C.ink,'Mono');
      text(c,'mask ['+row.mask.split('').join(', ')+']    reward '+row.reward,x+16,y+73,20,C.ink,'Mono');
    }
    if(optional)text(c,'pixel_values = None',377,498,26,C.action,'Mono');
    foot(c,p===1?'The trainer receives rows in input order.':'Both rows finished. The trainer requested r8 first.',optional?'Declared key present':'');
    return;
  }
  page(c,'Generator and environment',b.i<2?'Which copy did the policy choose?':'Which field finds the right customer?','query-42_0');
  const chosen=b.cue(1,'Even a bad guess'), fixed=b.cue(3,'Exactly three'), verified=b.cue(3,'The environment gives');
  const rewardsKnown=b.cue(3,'That adds'), total=b.cue(3,'The inference engine');
  twins(c,chosen,b.cue(0,'SQLite sent',0.65));
  if(b.i<2){
    ruleLabel(c,'Fixed query',61,374);
    text(c,'SELECT name FROM customers',61,417,30,C.ink,'Mono');
    text(c,'WHERE active = 1 AND',61,465,30,C.ink,'Mono');
    rect(c,456,429,258,50,C.white,7,C.action);
    text(c,names[0],585,463,24,C.action,'Mono',600,'center');
    text(c,'> 3',738,465,30,C.ink,'Mono');
    foot(c,chosen?'The generator keeps the attempt and its reply together.':'Which occurrence belongs to the action?');
  } else {
    customerTable(c,verified);
    ruleLabel(c,'Repair the field',621,358);
    text(c,fixed?names[2]:'______________',621,410,37,fixed?C.action:C.line,'Mono',600);
    if(verified)text(c,'Returned  '+sqlResult.join(', '),621,467,32,C.green,'Serif');
    foot(c,rewardsKnown?'Turn rewards     −0.2  +  1.0  =  '+(total?returnSum.toFixed(1):'?'):'Find active customers with more than three open incidents.',total?'stop reason   stop':'');
  }
}
function masks(c,b) {
  page(c,'Token alignment','Which costs enter the average?','query-42_0');
  const marked = b.cue(1, 'Select the four');
  const rewardsVisible = b.cue(1, 'A turn reward lands') && b.i < 2;
  const echo = b.cue(3, 'Raise the echo to nine', 0.8);
  const sampled = b.cue(3, 'Now add four tenths to the cost of the sampled count', 1.1);
  const baselineKnown = b.after(2, 'Two divided by four gives point five', {captionStart:true});
  const echoMeanKnown = b.after(3, 'The mean stays at point five', {captionStart:true});
  const revisedMeanKnown = b.after(4, 'Two point four divided by four is point six', {captionStart:true});
  const model = costs(echo, sampled);
  const showCosts = b.i >= 2;
  const columnX = i => 257 + i * 133;
  const railY = 497;

  for (const [label, first, last, color] of [
    ['Sampled attempt', 0, 1, C.action],
    ['SQLite reply', 2, 4, C.db],
    ['Sampled repair', 5, 6, C.action],
  ]) {
    const left = columnX(first), right = columnX(last);
    text(c, label, (left + right) / 2, 183, 23, color, 'Sans', 700, 'center');
    line(c, left - 57, 197, right + 57, 197, color, 2);
  }
  ruleLabel(c, 'Token and ID', 52, 249);
  if (marked) ruleLabel(c, 'Loss mask', 52, 325);
  if (rewardsVisible) ruleLabel(c, 'Turn reward', 52, 382);
  if (showCosts) {
    ruleLabel(c, 'Supplied cost', 52, 382);
    ruleLabel(c, 'Costs in sum', 52, 468);
    line(c, columnX(0) - 52, railY, columnX(tokens.length - 1) + 52, C.line, 1.5);
  }

  tokens.forEach(({id, mask, reward}, i) => {
    const x = columnX(i);
    const color = mask ? C.action : C.db;
    const value = model.values[i];
    const changing = sampled > 0 ? i === 1 : echo > 0 && i === 4;
    rect(c, x - 57, 211, 114, 66, mask ? C.pale : C.peach, 7);
    text(c, id === 90 ? 'Error prefix' : vocabulary[id], x, 239, 18, C.ink, 'Mono', 600, 'center');
    text(c, id, x, 266, 21, color, 'Mono', 600, 'center');
    if (marked) {
      if (mask) rect(c, x - 31, 297, 62, 38, C.action, 5);
      text(c, mask, x, 325, 24, mask ? C.white : C.db, 'Mono', 600, 'center');
    }
    if (rewardsVisible) {
      if (reward) rect(c, x - 43, 351, 86, 45, C.pale, 6);
      text(c, reward ? signed(reward) : '0', x, 382, 24, reward ? C.action : C.muted, 'Mono', 600, 'center');
    }
    if (showCosts) {
      if (changing) rect(c, x - 40, 353, 80, 42, C.gold, 6);
      text(c, value.toFixed(1), x, 382, 26, color, 'Mono', 700, 'center');
      if (mask) {
        const height = value * 104;
        rect(c, x - 26, railY - height, 52, height, i === 1 ? C.action : '#78a4aa', 4);
      } else {
        text(c, 'Skip', x, 470, 20, C.db, 'Mono', 500, 'center');
      }
    }
  });

  if (showCosts) {
    const known = sampled > 0 ? revisedMeanKnown : b.i === 3 ? echoMeanKnown : baselineKnown;
    const expression = '(' + model.terms.map(v => v.toFixed(1)).join('  +  ') + ')  ÷  ' + model.terms.length;
    rect(c, 48, 514, 1104, 46, C.ink, 8);
    text(c, 'Sampled mean    ' + expression, 70, 545, 24, C.white, 'Mono', 600);
    text(c, 'Mean  ' + (known ? model.mean.toFixed(2) : '?'), 1129, 545, 26, C.white, 'Mono', 700, 'right');
  } else {
    foot(c, rewardsVisible ? 'Each turn reward sits at its last action token.' : marked ?
      'Keep the reply in context with its mask at zero.' : 'Where should the loss mask be one?');
  }
}
function rewards(c,b) {
  if(b.i>=3){
    const chosen=[b.cue(4,'the smaller product'),b.cue(5,'PPO minimizes')];
    page(c,'Policy objective','Which product does PPO keep?','clip width  0.20');
    text(c,'r = current p / old p',55,198,25,C.action,'Mono');
    text(c,'Here, old trainer p = saved sampler p',577,198,21,C.muted,'Sans',600);
    text(c,'surrogate = min(rA, clip(r, 0.8, 1.2) × A)',55,241,24,C.ink,'Mono');
    const headers=['Advantage','Ratio r','Raw r × A','Clipped × A','Smaller product'];
    const xs=[72,292,492,720,958];
    headers.forEach((h,i)=>ruleLabel(c,h,xs[i],309));
    clipped.slice(0,b.i>=4?2:1).forEach((z,i)=>{
      const y=377+i*99;
      rect(c,49,y-47,1103,78,i?C.peach:C.pale,9);
      [signed(z.advantage),z.ratio.toFixed(1),signed(z.raw),signed(z.bounded),chosen[i]?signed(z.surrogate):'?'].forEach((v,j)=>text(c,v,xs[j],y+5,29,j===4?C.green:C.ink,'Mono',600));
    });
    foot(c,'Use the smaller signed product before negating it for loss.',chosen[1]?'Ratio can move beyond clip':'');
    return;
  }
  const centered=b.cue(1,'Subtract it'), flat=b.cue(2,'Both wrong answers now pass');
  const g=group(flat);
  page(c,'Group-relative rewards','Four answers to the same prompt','expected rows   {Ada}');
  const xs=[238,478,718,958], y=v=>453-188*v;
  text(c,'Reward',54,203,18,C.muted,'Sans',700);
  [0,0.5,1].forEach(v=>{line(c,118,y(v),1120,y(v),C.line,1,[3,6]);text(c,v.toFixed(1),93,y(v)+6,19,C.muted,'Mono',400,'right');});
  if(centered){line(c,118,y(g.mean),1120,y(g.mean),C.db,3);text(c,'mean '+g.mean.toFixed(2),1121,y(g.mean)-12,19,C.db,'Mono',600,'right');}
  xs.forEach((x,i)=>{
    line(c,x,y(0),x,y(g.reward[i]),C.action,9);
    dot(c,x,y(g.reward[i]),12,C.action);
    if(centered)text(c,signed(g.centered[i]),x+19,y(g.reward[i])+32,22,C.action,'Mono',700);
    text(c,g.outputs[i].length?g.outputs[i].join(' + '):'No rows',x,511,23,C.ink,'Serif',500,'center');
  });
  foot(c,flat?'Checker accepts any executed query.': 'Checker compares the returned rows with {Ada}.',centered?'Labels = reward − mean':'');
}

function schedules(c,b) {
  const async=b.i>=2;
  const m=schedule(async);
  page(c,'Scheduling',async?'Let two finished groups reach the trainer':'A slow database holds the batch open','two groups per update');
  const X=t=>211+t*19.7;
  const query=b.cue(0,'long group waits',1.2), barrier=b.cue(1,'Now train',0.8);
  const starts=b.cue(2,'It starts B',0.6), trains=b.cue(2,'can take those two completed groups',0.8);
  const visibleTrain=async?trains:barrier;
  const lane=(label,y,start,end,color)=>{text(c,label,55,y+28,20,C.ink,'Sans',600);line(c,X(0),y+20,X(45),y+20,C.gray,4);if(end>start)rect(c,X(start),y,X(end)-X(start),39,color,5);};
  lane('A  /  short',219,0,4,C.action);
  if(async)lane('B  /  short',281,0,4*starts,C.action);
  lane('L  /  database',343,0,40*(async?1:query),C.db);
  lane('Trainer',410,m.start,lerp(m.start,m.trained,visibleTrain),C.green);
  if(!async && b.cue(1,'one-step pipelining')){
    text(c,'Pipelined alternative',55,306,17,C.muted,'Sans',600);
    rect(c,X(m.start),281,X(m.trained)-X(m.start),39,C.pale,5,C.action);
    text(c,'sample next batch',X(m.start)-14,308,18,C.action,'Sans',600,'right');
  }
  if(visibleTrain===1)rect(c,X(m.trained),410,X(m.synced)-X(m.trained),39,C.gold,3);
  [0,4,10,20,30,40,45].forEach(v=>{const x=X(v);line(c,x,469,x,479,C.muted,1);text(c,v,x,505,18,C.muted,'Mono',400,'center');});
  text(c,'seconds',55,504,19,C.muted,'Sans');
  if(visibleTrain>0){line(c,X(m.start),188,X(m.start),461,C.ink,2,[5,6]);text(c,'batch '+m.batch.map(r=>r.id).join(' + '),X(m.start),182,20,C.ink,'Mono',600,'center');}
  foot(c,async?(visibleTrain?'L keeps waiting while A and B train.':'A and L keep their original durations.'):'The batch contains A and L.', 'Green  update    Gold  sync');
}
function capacity(c,b) {
  if(b.i>=3){
    page(c,'Async admission','How many groups could start?','before consumption  /  step 4');
    spaceCase(c,margin,Boolean(b.cue(4,'Take the smaller')));
    return;
  }
  const idx=Number(b.cue(1,'Consume A'))+Number(b.cue(1,'Consume B'))+Number(b.cue(2,'L finally arrives'));
  const r=steps[idx];
  page(c,'Async admission','Follow L through four training steps','B = 1     S = 2');
  ruleLabel(c,'Trainer step',54,194);
  steps.forEach((s,i)=>{
    const x=281+i*229;line(c,x-79,189,x+79,189,C.line,2);
    dot(c,x,189,22,i===idx?C.ink:C.gray);text(c,s.step,x,196,20,i===idx?C.white:C.muted,'Mono',600,'center');
    if(i<=idx)text(c,s.id,x,246,27,C.ink,'Mono',700,'center');
  });
  ruleLabel(c,'Outstanding groups',56,300);ruleLabel(c,'3 places = B × (S + 1)',801,300);
  for(let j=0;j<3;j++){
    const x=55+j*367,id=r.slots[j],running=r.running&&id==='L',fill=running?C.peach:id?C.pale:C.white;
    rect(c,x,323,347,104,fill,9,C.line);
    if(id){tag(c,id,x+16,341,running?C.db:C.action,C.white,60);text(c,running?'running':'buffered',x+89,367,25,C.ink,'Serif');}
    else text(c,'free',x+26,376,26,C.muted,'Serif');
    if(id==='L')text(c,'scheduled at step 1',x+18,409,17,C.db,'Mono');
  }
  text(c,r.accepted+' accepted   +   '+r.running+' running   −   '+r.consumed+' trained   =   '+r.outstanding+' outstanding',58,493,26,C.ink,'Mono');
  const lagKnown=b.cue(2,'It exceeds the setting');
  foot(c,lagKnown?'L arrives within the budget, with a lag of 4 − 1 = '+r.lag+'.':'Accepted includes groups used by earlier updates.', 'Occupied   '+r.outstanding+' / '+r.budget);
}
function spaceCase(c,m,solved) {
  ruleLabel(c,'Cumulative group capacity',58,210);ruleLabel(c,'Worker capacity',671,210);
  text(c,'(S + step) × B = ('+m.S+' + '+m.step+') × '+m.B,58,255,24,C.ink,'Mono');
  for(let i=0;i<m.limit;i++)rect(c,60+i*43,293,36,56,i<m.accepted?C.pale:i<m.charged?C.peach:C.white,5,C.line);
  text(c,m.accepted+' accepted    '+m.running+' running',59,393,23,C.ink,'Mono');
  for(let i=0;i<m.workers;i++){dot(c,694+i*73,320,25,i<m.running?C.db:C.white);if(i<m.running)dot(c,694+i*73,320,7,C.white);else {c.beginPath();c.arc(694+i*73,320,17,0,2*Math.PI);c.strokeStyle=C.muted;c.lineWidth=2;c.stroke();}}
  text(c,m.workers+' workers    '+m.running+' busy',671,393,23,C.ink,'Mono');
  if(solved){
    text(c,m.capacityMargin+' accounting place',59,468,33,C.action,'Serif');
    text(c,m.workerMargin+' idle workers',670,468,33,C.action,'Serif');
  }
  foot(c,solved?'Available = min('+m.capacityMargin+', '+m.workerMargin+') = '+m.available+' group':'Take the smaller of the two margins.', 'B = '+m.B+'    S = '+m.S);
}
function chip(c,id,x,y,color,scale=1) {
  rect(c,x-40*scale,y-26*scale,80*scale,52*scale,color,8);
  text(c,id,x,y+9*scale,26*scale,C.white,'Mono',700,'center');
}
function filtering(c,b) {
  if(b.i===4){
    const discarded=b.cue(4,'partial batch is discarded');
    page(c,'Epoch boundary','What happens to the last group?','sample_full_batch');
    ruleLabel(c,'Required mini-batch',56,228);ruleLabel(c,'Epoch input',752,228);
    for(let j=0;j<2;j++)rect(c,58+j*196,277,172,119,C.white,10,C.line);
    if(!discarded)chip(c,'Q61',145,337,C.action);
    else text(c,'empty',145,345,23,C.muted,'Mono',400,'center');
    text(c,'empty',339,345,23,C.muted,'Mono',400,'center');
    text(c,'0 prompts left',752,338,32,C.db,'Serif');
    if(discarded){line(c,59,448,1144,448);text(c,'Skipped on resume    Q61',59,499,28,C.db,'Mono');}
    foot(c,discarded?'The partial batch is discarded. Its prompt is recorded as consumed.':'A full update needs two useful groups.', 'Optimizer steps  +0');
    return;
  }
  const out=ease(b.cue(2,'Move F to filtered',0.65)), inside=ease(b.cue(3,'Admit query fifty-two',0.65));
  const r=ledger(out===1,inside===1),x=[139,340,541,742,943],y=314;
  page(c,'Full-batch sampling','What would make room for query 52?','step 3    limit 5');
  ruleLabel(c,'Accepted + running',57,207);
  line(c,66,220,1030,220,C.ink,2);
  for(let j=0;j<5;j++)rect(c,x[j]-77,y-46,154,92,C.white,10,C.line);
  const initial=ledger(false,false);
  initial.entries.forEach((e,i)=>{
    if(e.id==='F')return;
    chip(c,e.id,x[i],y,e.status==='accepted'?C.action:C.db);
    text(c,i<2?'trained':'running',x[i],258,19,C.muted,'Sans',600,'center');
  });
  rect(c,389,440,286,77,C.peach,10);
  text(c,'Filtered',409,486,21,C.db,'Sans',700);
  rect(c,711,421,405,96,C.gray,10);
  text(c,inside===1?'Worker assigned':'Waiting prompt',731,505,21,C.muted,'Sans',600);
  chip(c,'F',lerp(x[2],602,out),lerp(y,478,out),out===1?C.db:C.action);
  const traverse=Math.max(0,Math.min(1,(inside-0.2)/0.55));
  const qx=lerp(1048,x[2],traverse);
  const qy=lerp(453,396,Math.min(1,inside/0.2))-82*Math.max(0,(inside-0.75)/0.25);
  chip(c,'Q52',qx,qy,inside===1?C.db:C.muted);
  const status=inside===1?'running':inside>0?'assigning':out===1?'free':out>0?'filtering':'accepted';
  text(c,status,x[2],258,19,C.muted,'Sans',600,'center');
  if(b.i>=1 && !out)text(c,'F rewards  '+liveGroup.selected.join(', ')+'    spread '+liveGroup.spread,1136,207,19,C.db,'Mono',500,'right');
  foot(c,r.submitted+' submitted  =  '+r.accepted+' accepted  +  '+r.filtered+' filtered  +  '+r.running+' running','Charged   '+r.charged+' / 5');
}
function replica(c,x,y,id,v,target,probe) {
  const color=v===target?C.green:C.db;
  rect(c,x,y,256,140,C.white,12,C.line);
  line(c,x+17,y+42,x+239,y+42,C.line,1);
  dot(c,x+25,y+23,6,color);text(c,'Replica '+id,x+42,y+30,17,C.muted,'Sans',700);
  for(let k=0;k<5;k++)rect(c,x+188+k*9,y+14,4,16,C.gray,2);
  text(c,'v'+v,x+18,y+101,45,color,'Mono',600);
  if(probe)tag(c,'probe OK',x+134,y+68,C.mint,C.green,99);
  line(c,x+16,y+123,x+236,y+123,color,4);
}
function probabilityHistory(c,b) {
  const [count,incidents]=historical;
  const savedCount=b.cue(4,'point two for underscore count'), savedIncidents=b.cue(4,'point four for underscore incidents');
  const currentCount=b.cue(4,'point three'), currentIncidents=b.cue(4,'point one');
  const clear=b.cue(4,'Clear the key'), rebuilt=b.cue(4,'rebuild the context');
  const replay=b.cue(5,'Its replay gives');
  const selected=b.cue(6,"Use the sampler's");
  const countResult=b.cue(6,'one point five'), replayResult=b.cue(6,'give one point two');
  const incidentsResult=b.cue(6,'one quarter');
  const {sampled:oldVersion,replay:replayVersion,current:newVersion}=historyRevisions;
  page(c,'Behavior probabilities',b.i===4?'What survives a cache refresh?':'Which ratio compares today’s policy with the sampler?','query-73_0');
  ruleLabel(c,'Prefix cache',61,179);
  text(c,rebuilt?'Rebuilt at v'+newVersion:clear?'Cleared':'Built at v'+oldVersion,180,179,19,C.muted,'Mono',500);
  if(replay)text(c,'Replay uses the same prefix and token.',1141,179,19,C.muted,'Sans',500,'right');
  const xs=[68,268,507,652,804];
  ['Retained action','Score source','p at v'+oldVersion,'Current p · v'+newVersion,'Current p ÷ source p'].forEach((s,i)=>ruleLabel(c,s,xs[i],225));
  rect(c,49,240,1102,167,C.pale,8);
  rect(c,49,424,1102,89,C.gray,8);
  text(c,vocabulary[count.id],xs[0],290,29,C.ink,'Mono',600);
  text(c,vocabulary[incidents.id],xs[0],475,29,C.ink,'Mono',600);

  function scoreRow(y,source,prior,now,answer,caption) {
    text(c,source,xs[1],y,22,C.ink,'Sans',600);
    if(prior!==null){
      text(c,prior.toFixed(2),xs[2],y,26,C.ink,'Mono',600);
      rect(c,xs[2],y+10,prior*205,5,C.action,2);
    }
    if(now!==null)text(c,now.toFixed(2),xs[3],y,26,C.ink,'Mono',600);
    const expression=prior!==null&&now!==null?now.toFixed(2)+' ÷ '+prior.toFixed(2)+' = '+(answer??'?'):'?';
    text(c,expression,xs[4],y,24,C.ink,'Mono',600);
    if(caption)text(c,caption,xs[4],y+25,17,C.muted,'Sans',600);
  }
  scoreRow(287,'Sampler · v'+oldVersion,savedCount?count.p:null,currentCount?count.now:null,
    countResult?count.ratio.toFixed(2):null,selected?'Compared with the sampler':'');
  if(replay){
    line(c,xs[1],322,1127,322,C.line,1);
    scoreRow(365,'Trainer replay · v'+replayVersion,count.replay,count.now,
      replayResult?count.substituteRatio.toFixed(2):null,replayResult?'Compared with the trainer replay':'');
  }
  scoreRow(472,'Sampler · v'+oldVersion,savedIncidents?incidents.p:null,currentIncidents?incidents.now:null,
    incidentsResult?incidents.ratio.toFixed(2):null,'');
  if(b.i===4)foot(c,'Follow the two retained actions through the cache rebuild.');
  else if(!selected)foot(c,'Compare today’s policy with the sampler that drew _count.');
  else if(b.cue(6,'If a sampler score is missing'))foot(c,'Missing sampler score? Flag the action for review.');
  else foot(c,'Use the probability recorded when the sampler drew the token.');
}
function fleetScene(c,b) {
  if(b.i>=4)return probabilityHistory(c,b);
  const two=b.cue(1,'Read the third one');
  const retry=ease(b.cue(2,'retry its missing transfer',1.15));
  const three=b.after(2,'C now reports twelve');
  const finished=b.after(3,'The transfer finishes');
  const first=b.after(3,'A and B pass'), last=b.after(3,'Now C passes too');
  const proceed=ease(b.cue(3,'Resume query fifty-two',0.8));
  const state=fleet([two?12:11,two?12:11,three?12:11],12,finished,[first,first,last]);
  page(c,'Weight transfer','Can the router release this request?','trainer target   v12');
  const xs=[109,472,835],cy=278;
  rect(c,483,159,235,46,C.ink,8);
  text(c,'transfer control',600,190,20,C.white,'Mono',600,'center');
  line(c,600,205,600,234,C.action,3);line(c,237,234,963,234,C.action,3);
  xs.forEach((x,i)=>{line(c,x+128,234,x+128,cy,C.action,3);replica(c,x,cy,'ABC'[i],state.versions[i],12,state.probes[i]);});
  if(retry>0 && !three) {
    const across=424*retry;
    const x=600+Math.min(363,Math.max(0,across-29));
    const y=205+Math.min(29,across)+Math.min(32,Math.max(0,across-392));
    rect(c,x-39,y-16,78,32,C.action,7);
    text(c,'v12',x,y+6,20,C.white,'Mono',700,'center');
  }
  const qx=lerp(145,960,state.pass?proceed:0);
  line(c,142,467,963,467,C.line,4,[8,7]);
  if(!state.pass||!proceed){line(c,432,443,432,492,C.red,7);text(c,'PAUSED',455,474,21,C.red,'Mono',700);}
  chip(c,'Q52',qx,467,C.action);
  const sampled=proceed===1 && b.after(3,'C samples its first token, open, at revision twelve') && firstToken(state);
  if(sampled)text(c,sampled.request+'['+sampled.position+']   '+sampled.text+'   ·   '+sampled.replica+' / v'+sampled.revision,961,512,20,C.green,'Mono',600,'center');
  c.save();
  c.translate(0,-24);
  foot(c,state.ready+' of 3 at revision 12',!finished?'Finish pending':!state.pass?'Finished   /   '+state.probes.filter(Boolean).length+' of 3 probes passed':sampled?'Sampling   /   v'+sampled.revision:proceed===1?'Q52 at replica C':proceed>0?'Routing to C':'Finished   /   probes passed');
  c.restore();
}

function recovery(c,b) {
  if(b.i===0 && !b.cue(0,'At the Tinker training interface')){
    const returned=b.cue(0,'The trainer still consumes');
    page(c,'Change of environment','What can the trainer reuse?','task   /   terminal-18');
    ruleLabel(c,'Sampled command',69,207);
    rect(c,55,229,1092,85,C.pale,9);
    text(c,'pytest -q test_total.py',75,284,33,C.action,'Mono',600);
    ruleLabel(c,'Process output',69,367);
    rect(c,55,388,1092,89,returned?C.peach:C.white,9,C.line);
    text(c,returned?'1 passed':'Waiting for test result…',75,445,32,returned?C.db:C.muted,'Mono',600);
    foot(c,returned?'Keep the command as an action and the process output as an observation.':'The environment runs the test.');
    return;
  }
  if(b.i<2) {
    const fixed=Boolean(b.cue(1,'Supply its matching return'));
    const m=critic(fixed);
    page(c,'Tinker batch conversion','Can the critic pair each prediction with a target?','loss = ppo');
    const rows=[['Token weight',m.weights],['Predicted value',m.values],['Return target',m.returns]];
    [0,1,2].forEach(j=>text(c,'token '+(j+1),469+j*232,208,21,C.action,'Mono',600,'center'));
    rows.forEach(([s,values],i)=>{
      const y=235+90*i;
      text(c,s,58,y+42,25,C.ink,'Serif');
      for(let j=0;j<3;j++){
        rect(c,377+j*232,y,184,64,j<values.length?C.pale:C.peach,7);
        text(c,j<values.length?values[j]:'?',469+j*232,y+43,28,j<values.length?C.ink:C.db,'Mono',600,'center');
      }
    });
    foot(c,m.pass?'Three weights, three values, three returns.':b.i===1?'Token three needs a corresponding return.':'Inspect the lengths before converting the batch.',m.pass?'Shape check   pass':'');
    return;
  }
  if(b.i<4) {
    const visible=[b.cue(3,'just like the reference'),b.cue(3,'Keep velocity'),b.cue(3,'A fresh restore')];
    page(c,'Checkpoint recovery','Which restore takes the same next step?','toy momentum update');
    text(c,'v′ = 0.75v + g       w′ = 2 − 0.1v′',56,204,28,C.ink,'Mono');
    const xs=[64,361,546,730,953];
    ['Restore','Restored v','Next g','New v','Next weight'].forEach((s,j)=>ruleLabel(c,s,xs[j],270));
    restores.forEach((r,i)=>{
      const y=321+i*76;
      rect(c,49,y-24,1100,62,i===0&&visible[i]?C.pale:C.white,8,C.line);
      [r.label,r.v.toFixed(2),r.g.toFixed(2),visible[i]?r.velocity.toFixed(2):'?',visible[i]?r.weight.toFixed(3):'?'].forEach((v,j)=>text(c,v,xs[j],y+17,j?26:23,j===4&&visible[i]?C.action:C.ink,j?'Mono':'Sans',600));
    });
    foot(c,'Same saved weight: 2.000. The next update also depends on velocity and data.',visible[0]?'Reference  1.920':'');
    return;
  }
  const changed = b.after(6, 'A reports nineteen');
  const finished = b.after(6, 'The update finishes');
  const passed = b.after(6, 'All three probes pass');
  const fleetState = fleet([changed ? 19 : 18, 19, 19], 19, finished, [passed, passed, passed]);
  const admission = b.cue(6, 'Start the new group', 1.05);
  const travel = fleetState.pass ? admission : 0;
  const started = travel === 1;
  const m = practice(started);
  const trainedKnown = b.after(5, 'twelve have trained');
  const outstandingKnown = b.after(5, 'Three are outstanding');
  const budgetKnown = b.after(5, 'the budget is four');
  const verdict = b.after(5, 'One new group fits', {captionStart:true});
  const scheduledLagKnown = b.after(5, "The older group's lag of four");
  const holdKnown = b.after(5, 'Hold sampling', {captionStart:true});
  const scheduled = 3;
  page(c, 'Transfer exercise', 'Is there room? May it sample?', 'query-74   /   step ' + m.step);
  ruleLabel(c, 'Group budget', 57, 194);
  ruleLabel(c, 'Sampler versions  /  target ' + fleetState.target, 658, 194);
  text(c, 'B = ' + m.B + '     S = ' + m.S, 57, 237, 24, C.ink, 'Mono');
  text(c, m.accepted + ' accepted   ' + m.running + ' running', 57, 271, 22, C.ink, 'Mono');
  text(c, m.workers + ' workers   ' + m.running + ' busy', 57, 305, 22, C.ink, 'Mono');
  text(c, 'Older group scheduled at step ' + scheduled, 57, 343, 20, C.muted, 'Sans', 600);

  fleetState.versions.forEach((version, i) => {
    const x = 660 + i * 161;
    const atTarget = version === fleetState.target;
    rect(c, x, 223, 144, 87, atTarget ? C.mint : C.peach, 8);
    text(c, 'ABC'[i], x + 16, 251, 18, C.muted, 'Sans', 700);
    text(c, 'v' + version, x + 72, 289, 31, atTarget ? C.green : C.db, 'Mono', 600, 'center');
  });
  text(c, finished ? 'Transfer finished' : 'Finish pending', 660, 357, 24, C.ink, 'Serif');
  text(c, passed ? fleetState.probes.length + ' probes passed' : 'Probes pending', 660, 399, 21, C.muted, 'Sans', 600);
  if (holdKnown) {
    const status = started ? 'Sampling' : travel ? 'Admitting group' : fleetState.pass ? 'Ready to sample' : 'Sampling paused';
    rect(c, 658, 446, 206, 40, fleetState.pass ? C.mint : C.peach, 20);
    text(c, status, 761, 473, 22, fleetState.pass ? C.green : C.db, 'Sans', 700, 'center');
  }

  const slotLeft = j => 58 + j * 106;
  const slotWidth = 86;
  const slotTop = 401;
  const slotHeight = 54;
  if (trainedKnown) {
    const difference = m.accepted + ' + ' + m.running + ' − ' + m.consumed;
    const count = outstandingKnown ? difference + ' = ' + m.outstanding + ' outstanding' : difference + ' = ?';
    text(c, count, 57, 382, 21, C.ink, 'Mono');
  }
  if (budgetKnown) {
    for (let j = 0; j < m.budget; j++) {
      rect(c, slotLeft(j), slotTop, slotWidth, slotHeight,
        j < m.outstanding ? C.action : C.white, 6, C.line);
    }
    text(c, m.outstanding + ' / ' + m.budget, 484, 436, 25, C.ink, 'Mono', 600);
  }
  const x = lerp(100, slotLeft(m.budget - 1) + slotWidth / 2, ease(Math.min(1, travel / 0.7)));
  const y = lerp(499, slotTop + slotHeight / 2, ease(Math.max(0, (travel - 0.7) / 0.3)));
  chip(c, 'Q74', x, y, started ? C.action : C.muted, 0.87);

  const explanation = started ? 'Q74 takes the last place and starts sampling.' :
    fleetState.pass ? 'Every replica passed. Q74 can sample.' :
    holdKnown ? 'One group fits. Q74 waits for the fleet.' :
    verdict ? 'One group fits. Can it sample yet?' : 'Count consumed groups, idle workers and sampler versions.';
  const lag = 'Lag   ' + m.step + ' − ' + scheduled + ' = ' + (m.step - scheduled);
  foot(c, explanation, scheduledLagKnown && !started ? lag : '');
}
const painters=[opening,masks,rewards,schedules,capacity,filtering,fleetScene,recovery];
function draw(ctx,clock) {
  ctx.save();
  ctx.scale(1.6,1.6);
  painters[clock.beat.chapterIndex](ctx,beat(clock));
  ctx.restore();
}
export default {title:'SkyRL and the Identity of a Learning Trajectory',draw,check};

