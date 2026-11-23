import { C, rect, type, dot, line, ground, foot, fmt, chapterCue } from './art.mjs';
import { budget, group, remainder } from './model.mjs';

function memoryPool(g,k){
  const cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  const growth=cue(1,'grows to two hundred');
  const cost=growth?200:50,b=budget(cost);
  const full=cue(0,'If we count only');
  const initial= k.beat.beatIndex>0 || k.elapsed>=k.speechDuration;
  const finished=cue(2,'Divide the same pool');
  const x=139,w=1560,poolWidth=w*(256-32)/256;
  ground(g,k,'What fits in the remaining memory?','MEMORY   /   HYPOTHETICAL 256 GiB HOST');
  type(g,'Physical RAM',x,265,36,C.ink,'Serif',600);
  rect(g,x,322,w,100,C.ice,C.dim,5);
  rect(g,x+poolWidth,322,w-poolWidth,100,C.dark);
  type(g,'224 GiB available',x+30,372,38,C.ink,'Mono',600);
  type(g,'32 GiB',x+poolWidth+(w-poolWidth)/2,352,34,C.white,'Mono',600,'center');
  type(g,'Reserved',x+poolWidth+(w-poolWidth)/2,399,25,C.ice,'Sans',500,'center');
  const unit=w/5000;
  const row=(y,name,n,show,color)=>{
    type(g,name,x,y,35,C.ink,'Sans',600);
    if(show){
      const measure=fmt(n);
      rect(g,x,y+42,n*unit,47,color);
      type(g,measure,x+n*unit+17,y+66,33,color,'Mono',600);
    } else type(g,'?',x+14,y+66,37,C.dim,'Mono');
  };
  row(505,'Full 2 GiB budget per guest',b.fullSlots,full,C.blue);
  if(growth){
    const reference=x+budget(50).privateSlots*unit;
    line(g,x,774,reference,774,C.faint,3);
    line(g,reference,755,reference,781,C.dim,3);
    type(g,fmt(budget(50).privateSlots)+' at 50 MiB',reference,810,29,C.dim,'Mono',500,'right');
  }
  row(674,fmt(cost)+' MiB of private pages per guest',b.privateSlots,initial&&(!growth||finished),C.copper);
  foot(g,growth&&!finished?'Hold the 224 GiB pool fixed. Predict the new quotient.':
    finished?fmt(b.poolMiB)+' MiB ÷ '+cost+' MiB = '+fmt(b.privateSlots)+' whole footprints':'One physical pool, two different per-guest assumptions.',
    'Private-page-only counts omit per-instance overhead and additional headroom.');
}

function cpu(g,k){
  const b=budget(50),cue=(i,s,d=0)=>chapterCue(k,i,s,d);
  const wake=cue(3,'Suppose all the sessions wake together',1.1);
  const answer=cue(4,'The runnable total');
  ground(g,k,'How many runnable sessions must wait?','CPU   /   SEPARATE BURST WORKSHEET');
  type(g,'128 cores',129,297,48,C.ink,'Serif',600);
  type(g,'One core per column',129,360,32,C.dim);
  type(g,'30 sessions per core',1784,297,46,C.ink,'Serif',500,'right');
  type(g,'One session per dot',1784,359,32,C.dim,'Sans',500,'right');
  const x=160,y=453,dx=12.4,dy=11.3;
  const awake=Math.floor(b.sessions*wake);
  for(let r=0;r<30;r++)for(let c=0;c<128;c++){
    const j=r*128+c;
    const color=j>=awake?'#b8c4bd':answer?(r===0?C.teal:C.copper):C.blue;
    rect(g,x+c*dx,y+r*dy,8.8,8.1,color);
  }
  type(g,awake===0?'Configured sessions':awake===b.sessions?'All sessions awake':'Sessions waking',x,835,31,C.dim,'Mono');
  if(answer){
    type(g,b.admitted+' running',1130,835,33,C.teal,'Mono',600);
    type(g,fmt(b.queued)+' waiting',1777,835,33,C.copper,'Mono',600,'right');
  }
  foot(g,answer?fmt(b.sessions)+' runnable − '+b.admitted+' on cores = '+fmt(b.queued)+' queued':'Mean demand    '+fmt(b.sessions)+' × 3% = '+b.mean.toFixed(1)+' core-equivalents',
    'One active job per core in this worksheet. Size the queue and measure tail latency at the intended load.');
}

function quota(g,k){
  const cue=(i,s,d=0)=>chapterCue(k,i,s,d);
  const spent=Boolean(cue(5,'One thread spends',0.5));
  const answered=Boolean(cue(6,'Threads draw'));
  const x=134,y=485,w=1596,used=spent?group.spend:0;
  const share=used/group.quota;
  ground(g,k,'Whose budget does the thread spend?','CPU.MAX   /   ONE FAIR-CLASS VMM GROUP');
  type(g,'Quota    '+fmt(group.quota)+' µs',x,324,40,C.ink,'Mono',600);
  type(g,'Period    '+fmt(group.period)+' µs',928,324,40,C.ink,'Mono',600);
  rect(g,x,y,w,124,C.ice,C.dim,4);
  if(spent)rect(g,x,y,w*share,124,C.copper);
  if(spent)type(g,'Thread 1    '+fmt(used)+' µs',x+w*share/2,y+61,40,C.white,'Mono',600,'center');
  if(answered)type(g,fmt(remainder)+' µs left',x+w*(1+share)/2,y+61,41,C.ink,'Mono',600,'center');
  type(g,'0',x,y+174,30,C.dim,'Mono');
  type(g,fmt(group.quota)+' µs',x+w,y+174,30,C.dim,'Mono',500,'right');
  type(g,'Configured mean allowance',x,783,37,C.dim);
  type(g,group.quota/group.period+' core-equivalents',878,783,45,C.ink,'Mono',600);
  foot(g,answered?'A second thread draws on the remaining '+fmt(remainder)+' µs.':'All threads draw from one group quota.',
    'The remaining budget changes within the period. The configured quota-to-period ratio stays fixed.');
}
export function capacity(g,k){
  if(k.beat.beatIndex<3)memoryPool(g,k);
  else if(k.beat.beatIndex<5)cpu(g,k);
  else quota(g,k);
}
