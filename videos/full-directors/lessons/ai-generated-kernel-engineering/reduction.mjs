import {C,tag,text,number,box,line,dot,arrow,header,foot,display,cell,strip,bracket,scale,count,cue} from './bench.mjs';
import {eps,input,tile} from './experiments.mjs';

function lanes(c, run, {reads=5, squares=5, tail=false, tall=false}={}) {
  const x0=133, dx=211, y=305, base=tall?640:553, u=tall?29:20;
  display(c,100,265,1720,base-265+68);
  for(let i=0;i<8;i++){
    const x=x0+dx*i, center=x+89, spare=i>=5, side=run.lanes[i];
    const loaded=spare?tail:i<reads;
    cell(c,x,y,178,78,loaded?side:spare?'?':'·',spare?C.panel:C.panel2,
      spare?C.copper:C.mint,spare?C.copper:C.panelLine,46);
    if(loaded && (spare || i<squares)){
      const ink=spare?C.copper:C.mint;
      for(let h=0;h<side;h++) for(let j=0;j<side;j++){
        box(c,center-side*u/2+j*u,base-(h+1)*u,u-2,u-2,ink,null,2);
      }
      number(c,side*side,center,base+46,33,ink,'center');
    }
  }
  line(c,x0+5*dx-17,290,x0+5*dx-17,base+45,C.panelLine,2,[8,8]);
}
export function opening(c,k){
  const id=k.beat.id;
  const b=k.beat.beatIndex;
  const weighted=id==='weighted';
  const factor=id==='weighted'?2:1;
  const r=tile(0,factor);
  if(id==='choice'&&!cue(k,'Return to unit weights')){
    const failed=cue(k,'It failed');
    header(c,'Generated kernel  /  reported H100 run','How far does one timing reach?');
    const x=560,base=1060;
    tag(c,'Row width',120,337);tag(c,'Two rows per input',x,337);
    for(const [i,width] of [4096,1009].entries()){
      if(i&&!failed)continue;
      const y=411+202*i;
      number(c,width,120,y+78,58);
      for(let j=0;j<2;j++)box(c,x,y+56*j,base*width/4096,45,i?C.peach:C.aqua,i?C.rust:C.teal,5);
      text(c,i?'Numerical check failed':'Reported speedup   1.4×',x,y+150,37,i?C.rust:C.teal);
    }
    foot(c,'Test the operator across its accepted shapes.');
    return;
  }
  header(c,'Weighted RMSNorm  /  one row',id==='choice'?'Which fill preserves the output?':id==='weights'||id==='weighted'?'What changes with one feature weight?':'Follow the five values into the tile');
  if(id==='row'){
    const read=count(cue(k,'Five values enter',1.3),5);
    lanes(c,r,{reads:read,squares:0,tall:true});
    tag(c,'Source',1210,555,C.soft);text(c,'5 stored values',1210,609,34,C.white);
    input.forEach((v,i)=>{
      const x=222+211*i;
      cell(c,x-62,529,124,93,v,C.panel2,C.mint,C.panelLine,42);
      if(i<read)arrow(c,x,511,x,407,C.mint,4);
    });
    bracket(c,133,745,1022,'Caller memory  ·  5 features',C.teal);
    bracket(c,1188,745,600,'3 spare lanes',C.rust);
    foot(c,'Read addresses   '+(read?Array.from({length:read},(_,i)=>i).join('   '):'…'),'8 lanes in the tile');
    return;
  }
  if(id==='squares'||id==='choice'){
    const squared=id==='choice'?5:count(cue(k,'Square each value',1.6),5);
    lanes(c,r,{squares:squared,tall:true});
    if(id==='choice'){
      tag(c,'Masked fill',1265,768);
      cell(c,1265,792,176,70,'0',C.white,C.ink,C.line,40);
      cell(c,1495,792,176,70,'1',C.white,C.ink,C.line,40);
      text(c,'Unit weights',145,792,42);
      foot(c,'Reference fifth output   '+r.values[4].toFixed(3),'ε = 0.00001');
    }else{
      const total=input.slice(0,squared).reduce((s,x)=>s+x*x,0);
      text(c,'Sum of counted squares',135,797,40);
      number(c,total,650,806,70,C.teal);
      if(cue(k,'Divide by the five'))text(c,'Mean square   '+r.squareSum+' ÷ 5 = '+r.mean,910,797,49,C.ink,'left','Serif');
      foot(c,'Each block has one unit square for every contribution.','5 real features');
    }
    return;
  }
  const base=tile(0);
  const done=b>=3||cue(k,'Divide each input');
  const switched=weighted&&cue(k,'Only the fifth output');
  const active=id==='weights'||id==='weighted';
  const actual=switched?r:base;
  tag(c,'Input row',110,318);strip(c,input,410,258,1370,96,{active:[0,1,2,3,4]});
  tag(c,'Shared divisor',110,454);
  display(c,410,386,1370,106);
  text(c,'√(11 + 0.00001)',450,458,57,C.mint,'left','Serif');
  text(c,'same root for every feature',1770,455,32,C.soft,'right');
  tag(c,'Weight',110,598);strip(c,[1,1,1,1,active?2:1],410,531,1370,96,{active:active?[4]:[]});
  tag(c,id==='weights'?'Prior output':'Fresh output',110,754);
  const output=actual.values.map((v,i)=>!done?'·':v.toFixed(3));
  strip(c,output,410,680,1370,108,{active:switched?[4]:[],labelSize:44});
  foot(c,id==='weights'?'Predict the new output row.':switched?'Only feature five uses the doubled weight.':'Each output uses its own weight.','Mean square = 11');
}

function compare(c, {reference, previous, next, showReference, showKernel, progress, pending, settled}) {
  const left = 1160, width = 575, min = 1.45, max = 1.53;
  const project = value => left + (value - min) / (max - min) * width;
  const fixed = project(reference);
  const live = project(previous + (next - previous) * progress);
  const referenceTrack = 715, kernelTrack = 781;
  tag(c, 'Fifth output', 945, 659);
  number(c, input.at(-1) + ' / √(mean square + ε)', 1735, 659, 32, C.sub, 'right');
  text(c, 'Reference', 945, referenceTrack + 9, 32, C.teal);
  text(c, 'Kernel', 945, kernelTrack + 9, 32, C.rust);
  line(c, left, referenceTrack, left + width, referenceTrack);
  line(c, left, kernelTrack, left + width, kernelTrack);
  scale(c, left, 817, width, min, max, 4, value => value.toFixed(2));
  if (showReference) {
    line(c, fixed, referenceTrack, fixed, kernelTrack + 17, C.teal, 2, [4, 7]);
    dot(c, fixed, referenceTrack, 10, C.teal);
    number(c, '≈ ' + reference.toFixed(3), fixed, referenceTrack - 17, 34, C.teal, 'center');
  }
  if (showKernel) {
    dot(c, live, kernelTrack, 11, pending || (progress > 0 && progress < 1) ? C.paper : C.rust, C.rust);
    if (pending) text(c, 'Prior result', live, kernelTrack - 17, 31, C.rust, 'center');
    else if (progress === 0 || settled) {
      number(c, '≈ ' + (settled ? next : previous).toFixed(3), live, kernelTrack - 17, 34, C.rust, 'center');
    }
  }
}

function tailReduction(c, k) {
  const id = k.beat.id;
  const control = id === 'control', repair = id === 'repair';
  const reference = tile(0);
  const filled = tile(3);
  const previous = repair ? filled : reference;
  const next = id === 'ones' ? filled : reference;
  const edits = control ? 0 : count(cue(k, repair ? 'Restore the zero fill' : 'Count the three extra squares', 1.8), 3);
  const run = tile(repair ? 3 - edits : edits);
  const meanCue = control || cue(k, repair ? 'the divisor stays five' : 'gives eleven point six');
  const showMean = edits === 0 || (edits === 3 && meanCue);
  const move = control ? 1 : cue(k, repair ? 'the needles meet' : 'pushes the fifth output down', 1.2);
  const progress = control || (edits === 3 && showMean) ? move : 0;
  const valueCue = id !== 'ones' || cue(k, 'about one point four six eight');
  const settled = progress === 1 && valueCue;

  header(c, 'Reduction  /  eight-lane tile', 'What changes the fifth output?');
  tag(c, 'Five input values', 133, 253, C.teal);
  tag(c, 'Three masked fills', 1188, 253, C.rust);
  lanes(c, run, {tail: true});

  tag(c, 'Square sum', 135, 679);
  tag(c, 'Feature count', 378, 679);
  tag(c, 'Mean square', 637, 679);
  number(c, run.squareSum, 135, 769, 68, edits > 0 && !repair ? C.rust : C.ink);
  number(c, '÷', 310, 764, 48, C.sub);
  number(c, input.length, 378, 769, 68);
  number(c, '=', 562, 764, 48, C.sub);
  number(c, showMean ? run.mean.toFixed(1) : '…', 637, 769, 68);
  text(c, reference.squareSum + ' from input  +', 135, 834, 34, C.teal);
  text(c, (run.squareSum - reference.squareSum) + ' from fill', 412, 834, 34, C.rust);
  line(c, 899, 644, 899, 854, C.line, 2);

  compare(c, {
    reference: reference.values.at(-1),
    previous: previous.values.at(-1),
    next: next.values.at(-1),
    showReference: !control || cue(k, 'Here is the reference'),
    showKernel: !control || cue(k, 'Beside it'),
    progress,
    pending: edits > 0 && progress === 0,
    settled,
  });
  foot(c, 'Read offsets   ' + run.reads.join('   '), 'Fifth weight = 1     ·     ε = ' + eps);
}

function timingTrace(c,k) {
  const id=k.beat.id;
  const barrier=id==='checker'&&cue(k,'Put a valid block barrier');
  const divergent=id==='checker'&&cue(k,'If only some threads');
  header(c,'Runtime safety  /  shared memory',divergent?'Who reaches the block barrier?':'When is the shared value ready?');
  const x=410,w=1330;
  tag(c,'Producer',110,465);tag(c,'Consumer',110,665);
  for(const y of [450,650])arrow(c,x,y,x+w,y,C.line,4);
  text(c,'Time within one CUDA block',x,325,36,C.sub);
  function event(xx,y,msg,clr){
    dot(c,xx,y,18,clr);text(c,msg,xx,y-48,37,clr,'center','Sans',600);
  }
  event(815,450,'Write 7',C.teal);
  if(!divergent)event(barrier?1460:615,650,barrier?'Read 7':'Read ?',barrier?C.teal:C.rust);
  if(barrier){
    line(c,1160,376,1160,735,C.blue,5,[10,8]);
    dot(c,1160,450,14,C.blue);
    if(divergent){
      arrow(c,1010,650,1140,757,C.rust);
      text(c,'Skips barrier',1190,767,34,C.rust);
    }else dot(c,1160,650,14,C.blue);
    text(c,'Block barrier',1160,335,35,C.blue,'center');
  }
  foot(c,id==='order'?'Choose the checker for the early read.':divergent?'Invalid block synchronization   →   synccheck':barrier?'All participating threads synchronize before the read.':'Shared ordering hazard   →   racecheck');
}
export function reduction(c,k){
  const id=k.beat.id;
  if(id==='order'||id==='checker')return timingTrace(c,k);
  if(id==='bounds'){
    const init=cue(k,'An unwritten slot');
    header(c,'Runtime safety  /  allocation','Which check explains this read?');
    const x=120,dx=175;
    display(c,100,389,1410,232);
    for(let i=0;i<9;i++){
      number(c,i,x+i*dx+70,362,32,C.sub,'center');
      cell(c,x+i*dx,430,143,132,i===8?'×':i===3&&init?'?':'·',i===8?C.peach:i===3&&init?C.copper:C.panel2,i===8?C.rust:init&&i===3?C.ink:C.soft,i===8?C.rust:C.panelLine,58);
    }
    bracket(c,109,644,1392,'Allocated indices 0 through 7');
    text(c,init?'Read before initialization at index 3':'Index 8 falls beyond the allocation',123,806,49,C.ink,'left','Serif');
    foot(c,init?'initcheck   ·   select the relevant address space':'memcheck   ·   invalid address');
    return;
  }
  tailReduction(c,k);
}
