import { optimizerStep, scalingStudy, trace, lineage } from './practice.mjs';
import { C,tint,txt,mono,rect,line,dot,bed,tile,back,note,lerp,smooth,cue,arrow,alpha,vec,path,brace } from './drawing.mjs';
import { range,keys,query,counts,sums,means,blend,localShare,experts,routes,combined,attentionAxes,expertAxes,population,round,bytes,gradRows,gradMeans,reductions,sgd,recipes,limit,accepts } from './examples.mjs';

export function attention(c,k){
  const b=k.beat.beatIndex, mask=cue(k,1,'Mask its score'), totals=cue(k,1,'The local values'), midpoint=cue(k,2,'halfway between them'), mass=cue(k,3,'Give the four local keys',1.65), done=cue(k,3,'Twenty-nine divided by seven');
  back(c,'How much does each context shard count?', 'One causal query at position 6   /   Equal scores at all allowed keys');
  const x=pos=>488+pos*145;
  for(const pos of range(8)) {
    mono(c,pos,x(pos),279,37,pos===query?C.brass:C.sub,'center');
    if(pos===query){path(c,[[x(pos)-10,303],[x(pos)+10,303],[x(pos),316]],C.brass);txt(c,'query',x(pos),239,27,C.brass,'center');}
  }
  txt(c,'Global position',127,279,32,C.sub);
  for(const owner of [0,1]){
    const y=332+owner*117,col=tint[owner];
    bed(c,111,y,1687,106);txt(c,owner?'Remote shard':'Query’s shard',153,y+51,38,C.paper,'left','Serif');
    for(const pos of range(8))dot(c,x(pos),y+54,6,'#637b76');
    for(const key of keys.filter(v=>v.owner===owner)){
      const disabled=mask && key.pos>query;
      tile(c,x(key.pos)-57,y+19,114,64,disabled?C.quiet:col);
      mono(c,key.v,x(key.pos),y+52,38,disabled?C.sub:C.ink,'center');
      if(disabled){line(c,x(key.pos)-51,y+75,x(key.pos)+51,y+26,C.rust,4);}
    }
    if(totals)mono(c,'Σ '+sums[owner],1718,y+54,32,col,'right');
  }
  if(b>=2){
    const lo=371, hi=1548,y=712;
    const u=midpoint?lerp(.5,localShare,smooth(mass)):0;
    line(c,lo,y,hi,y,C.edge,7);
    for(let i=0;i<=7;i++)line(c,lerp(lo,hi,i/7),y-12,lerp(lo,hi,i/7),y+13,C.sub,3);
    for(const [i,px] of [[1,lo],[0,hi]]){
      dot(c,px,y,15,tint[i]);mono(c,(i?'Remote  ':'Local  ')+sums[i]+'/'+counts[i],px,622,37,C.ink,'center');
      mono(c,'≈ '+means[i].toFixed(3),px,660,31,C.sub,'center');
    }
    if(midpoint) {
      const mark=lerp(lo,hi,u);
      path(c,[[mark,y+3],[mark-16,y-25],[mark+16,y-25]],C.brass);
      txt(c,done?'Full prefix':mass>0?'Weighted mix':'Equal worker votes',mark,620,33,C.ink,'center');
      mono(c,'≈ '+blend(u).toFixed(3),mark,670,38,C.brass,'center');
      mono(c,done?'3/7 remote   +   4/7 local':mass===0?'1/2 remote   +   1/2 local':(100*(1-u)).toFixed(1)+'% remote   +   '+(100*u).toFixed(1)+'% local',953,800,35,C.ink,'center');
    }
  }else{
    mono(c,mask?'Allowed positions  0  1  2  3  4  5  6':'Allowed positions?',960,706,44,C.ink,'center');
  }
  note(c,b===0?'The two workers hold different positions in the same sequence.':b<3?'Each allowed key contributes one unit of normalization mass.':done?'(21 + 8) ÷ (4 + 3) ≈ '+blend(localShare).toFixed(3)+'     Equal scores give each allowed key the same weight.':'Keep every legal key on the scale.');
}

export function routing(c,k){
  const b=k.beat.beatIndex;
  if(b>=3){
    const solved=cue(k,4,'One copy');
    back(c,'How many copies fit in the expert grid?', 'One 256-rank population   /   Four pipeline stages in both layouts');
    const layouts=[['Attention',attentionAxes,['TP','CP','DP','PP']],['Experts',expertAxes,['ETP','EP','EDP','PP']]];
    layouts.forEach(([label,axes,names],row)=>{
      const y=295+row*257;bed(c,119,y,1680,205);txt(c,label,179,y+97,49,C.paper,'left','Serif');
      for(const [j,v] of axes.entries()){
        const x=525+j*254;
        mono(c,names[j],x+75,y+53,33,C.quiet,'center');tile(c,x,y+82,149,86,row?C.ice:C.mint);
        mono(c,row===1 && j===2 && !solved?'?':v,x+75,y+126,45,C.ink,'center');
        if(j<3) txt(c,'×',x+199,y+125,45,C.paper,'center');
      }
      mono(c,'= '+population(axes),1579,y+122,40,C.gold);
    });
    note(c,solved?'EDP = 256 ÷ (1 × 64 × 4) = 1. Each expert keeps its full matrix.':'ETP splits an expert matrix. EP distributes expert ownership. EDP repeats an expert shard.');return;
  }
  if(b===2){
    const m=routes(cue(k,2,'Change which experts',2.6));
    back(c,'Which expert makes the others wait?', 'Eight source tokens   /   Two assignments per token   /   Same sixteen assignments');
    for(const [i,id] of m.experts.entries()){
      const x=206+i*410, count=m.counts[i];bed(c,x,272,296,511);
      txt(c,'Expert '+id,x+148,320,36,C.paper,'center','Serif');
      for(let j=0;j<count;j++) {
        const ids=m.assignments.flatMap((p,t)=>p.includes(id)?[t]:[]);
        const y=714-j*45;tile(c,x+49,y,198,34,ids[j]===3?C.gold:tint[i%2]);mono(c,'T'+ids[j],x+149,y+16,25,C.ink,'center');
      }
      mono(c,count+' queued',x+148,815,33,C.ink,'center');
    }
    note(c,'Each queue retains the source token. A capacity of four accepts the bottom four assignments.');return;
  }
  const depart=smooth(cue(k,0,'Dispatch creates',1.6)), ready=cue(k,0,'The experts return'), home=smooth(cue(k,1,'Add them at the source',1.25)), result=cue(k,1,'the token gets');
  back(c,'Which token gets both expert outputs?', 'Top-two routing   /   The source index travels with each assignment');
  const y=460, sx=362;
  bed(c,110,353,490,222);txt(c,'Source position',355,404,38,C.paper,'center','Serif');
  tile(c,sx-95,y-6,190,73,C.gold);mono(c,'T3',sx,y+32,46,C.ink,'center');
  for(const [i,e] of experts.entries()){
    const yy=298+i*311;
    bed(c,1255,yy-24,508,225);txt(c,'Expert '+e.id,1318,yy+24,41,C.paper,'left','Serif');
    mono(c,ready?'returns  '+vec(e.value):'assignment  T3',1318,yy+104,35,tint[i]);
    const a=[610,i?518:417], d=[1231,yy+81];
    line(c,...a,...d,C.edge,5);
    const t=home>0?1-home:depart;
    const px=lerp(a[0],d[0],t), py=lerp(a[1],d[1],t);
    const label=home>0?vec(e.value.map(v=>v*e.weight)):'T3';
    tile(c,px-71,py-23,142,46,tint[i]);mono(c,label,px,py+1,27,C.ink,'center');
    mono(c,'× '+e.weight,887,(a[1]+d[1])/2+(i?48:-48),35,C.sub,'center');
  }
  mono(c,result?'T3  ←  '+vec(combined):'T3 output  [ ? ,  ? ]',374,737,42,C.ink,'center');
  note(c,result?'0.75 × [2, 0] + 0.25 × [0, 4] = [1.5, 1]':'Reassemble by source position after the expert workers finish.');
}

export function optimizer(c,k){
  const b=k.beat.beatIndex;
  if(b>=4){
    const token=cue(k,5,'point seven five'), rep=cue(k,5,'point five');
    back(c,'Which gradient averages the four tokens?', 'Scalar SGD   /   Initial weight 1   /   Learning rate 0.1');
    for(const [i,row] of gradRows.entries()){
      const y=299+205*i;bed(c,140,y,793,163);txt(c,'Replica '+(i?'B':'A'),189,y+79,42,C.paper,'left','Serif');
      row.forEach((v,j)=>{column(c,471+134*j,y+38,v,tint[i]);});
    }
    const roads=[['Per valid token','(10 + 0 + 0 + 0) / 4',token],['Per replica','(10 + 0) / 2',rep]];
    roads.forEach(([name,eq,on],i)=>{const y=303+205*i;txt(c,name,1035,y+13,39,C.ink,'left','Serif');mono(c,eq,1037,y+72,36,C.sub);mono(c,on?'g = '+reductions[i]+'    w → '+sgd(1,reductions[i]):'g = ?    w → ?',1037,y+130,38,C.ink);});
    note(c,'The loss gives every valid token equal weight. Multiply local means by their valid-token counts.');return;
  }
  if(b===3) return optimizerStep(c,k);
  const four=cue(k,1,'Nine bytes'), eight=cue(k,2,'Seven and a half');
  const d=eight?8:four?4:1, f=bytes(d);
  back(c,'How many persistent bytes belong to one rank?', 'Per assigned dense parameter   /   BF16 model weight, FP32 main gradient, master and Adam moments');
  const ledger=[['Weight',f.parameter,C.mint],['Gradient',f.grad,C.ice],['Master',f.master,C.gold],['Moment 1',f.first,C.rose],['Moment 2',f.second,'#c5bfdf']];
  bed(c,130,284,1660,495);
  txt(c,'Optimizer sharding group',184,339,39,C.paper,'left','Serif');mono(c,'d = '+d,1716,339,42,C.gold,'right');
  const x0=214, pitch=82;let x=x0;
  for(const [name,n,col] of ledger){rect(c,x,421,n*pitch-2,115,col,3);x+=n*pitch;}
  for(let j=0;j<=18;j++){const px=x0+j*pitch;line(c,px,546,px,546+(j%3===0?20:10),C.quiet,2);if(j%3===0)mono(c,j,px,598,28,C.quiet,'center');}
  ledger.forEach(([name,n,col],j)=>{const xx=196+j*312;dot(c,xx,687,9,col);txt(c,name,xx+21,686,29,C.paper);mono(c,n+' B',xx+20,729,32,col);});
  mono(c,'6 + 12 / '+d+' = '+f.total+' B',960,816,39,C.ink,'center');
  note(c,'Persistent storage excludes activations and temporary buffers. Use the actual sharding group.');
}
function column(c,x,y,v,col){tile(c,x,y,111,85,col);mono(c,v,x+55,y+44,43,C.ink,'center');}

export function precision(c,k){
  const b=k.beat.beatIndex;
  if(b===0){
    back(c,'Which peak sets the scale?', 'Illustrative tensor magnitudes   /   FP8 scale selection');
    const newer=cue(k,0,'Current scaling');
    for(const [j,vals] of [[0,[1,4,2,3]],[1,[2,3,4,32]]]){
      const x=170+j*839;bed(c,x,285,720,474);
      txt(c,j?'This tensor':'Previous tensor',x+40,347,46,C.paper,'left','Serif');
      for(const [i,v] of vals.entries()){const xx=x+53+i*158;rect(c,xx,653-v*7.8,110,v*7.8,j?C.ice:C.mint,4);mono(c,v,xx+55,694,37,C.paper,'center');}
      if((j===1)===Boolean(newer))rect(c,x+40,733,637,6,C.gold,3);
    }
    note(c,newer?'Current scaling sees the 32 in this tensor.':'Delayed scaling uses saved magnitude history to set a later scale.');return;
  }
  if(b===3){
    const capacity=100, useful=40, extra=10, repeated=cue(k,3,'Counting the repeated work');
    back(c,'Which work belongs in model FLOPs utilization?', 'Illustrative completed interval   /   Same peak, precision and timing window');
    bed(c,166,319,1590,394);
    const x=276,pitch=13.5;
    rect(c,x,428,capacity*pitch,111,'#455d60',5);rect(c,x,428,useful*pitch,111,C.mint,5);
    if(repeated)rect(c,x+useful*pitch,428,extra*pitch,111,C.gold,5);
    mono(c,'40 useful',x+useful*pitch/2,485,44,C.ink,'center');
    for(let j=0;j<=100;j+=10){const xx=x+j*pitch;line(c,xx,550,xx,568,C.quiet,3);mono(c,j,xx,605,30,C.quiet,'center');}
    txt(c,'Peak arithmetic capacity over the completed interval',960,664,34,C.paper,'center');
    note(c,repeated?'MFU = 40%. Counting 10 units of recomputation raises the hardware-work ratio to 50%.':'Use device events or synchronized streams so the timer includes completed work.');return;
  }
  if(b===4) return scalingStudy(c,k);
  if(b===5) return trace(c,k);
  if(b>=6) return lineage(c,k);
  const ok=cue(k,2,'The BF16 step meets'), showB=cue(k,1,'The BF16 step'), showA=cue(k,1,'The FP4 step');
  back(c,'Which run meets the update tolerance?', 'Fixed batch   /   Supplied step times   /   Validation and reload pass for both');
  const x0=566, scale=22500, threshold=x0+limit*scale;
  bed(c,140,287,1639,459);
  mono(c,'absolute update error',x0,349,33,C.paper);
  for(const [i,r] of recipes.entries()){
    const y=442+i*132;txt(c,r.name,206,y+17,48,C.paper,'left','Serif');mono(c,r.ms+' ms',215,y+63,30,C.quiet);
    if(i?showB:showA){rect(c,x0,y+8,r.error*scale,39,tint[i],3);mono(c,r.error,x0+r.error*scale+22,y+28,34,C.paper);}
    if(ok)mono(c,accepts(r)?'PASS':'FAIL',1713,y+30,31,accepts(r)?C.mint:C.rose,'right');
  }
  line(c,threshold,412,threshold,663,C.gold,4);mono(c,'limit 0.01',threshold,691,31,C.gold,'center');
  note(c,ok?'BF16 qualifies. Count persistent optimizer buffers at their own stored precision.':'Read the end of each bar against the same error limit.');
}
