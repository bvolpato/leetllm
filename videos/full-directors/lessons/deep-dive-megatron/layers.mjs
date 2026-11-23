import { smallerMesh } from './practice.mjs';
import { C,tint,txt,mono,rect,line,dot,bed,tile,back,note,lerp,smooth,cue,brace,arrow,alpha,vec,path } from './drawing.mjs';
import { saved,checkpointRow,trackedColumn,probeInput,partial,probe,groups,input,lanes,channels,active,output,operandDigits,round,range,budget,forwardWave } from './examples.mjs';

const cx=i=>398+i*184;
export function columnFace(c,x,y,w,h,value,marked=false,color=C.mint) {
  tile(c,x-w/2,y,w,h,marked?C.gold:color);
  if(marked) path(c,[[x-w/2+13,y],[x-w/2+37,y],[x-w/2+25,y+15]],C.brass);
  mono(c,value,x,y+h/2+2,44,C.ink,'center');
}
export function opening(c,k) {
  const b=k.beat.beatIndex;
  if(b===3) {
    back(c,'What can another GPU take over?', 'Follow the same example through three different layouts');
    const depth=cue(k,3,'Splitting layer depth'), replicas=cue(k,3,'Adding data replicas');
    const rows=[
      ['Split width','Rank 2: partial 0','Rank 3: partial 3','Sum → 3',1],
      ['Split depth','Early layers','Activation','Late layers',depth],
      ['Add replicas','Example A','Different inputs','Example B',replicas]
    ];
    rows.forEach(([label,left,middle,right,shown],i)=>{
      const y=269+i*174;
      bed(c,124,y,1678,144);
      txt(c,label,176,y+71,43,C.paper,'left','Serif');
      alpha(c,shown,()=>{
        tile(c,549,y+32,335,74,tint[0]);
        mono(c,left,717,y+72,29,C.ink,'center');
        txt(c,middle,1113,y+63,31,C.paper,'center');
        if(i===1) arrow(c,922,y+93,1294,y+93,C.quiet,3);
        tile(c,1343,y+32,374,74,tint[1]);
        mono(c,right,1530,y+72,31,C.ink,'center');
      });
    });
    note(c,replicas?'Each data replica takes another example through a full model copy.':
      depth?'The next stage needs the activation from the previous stage.':'Peers split a layer and combine its partial outputs.');
    return;
  }
  if(b===4) {
    back(c,'Where does the training code live?','Follow the row from a training recipe into a portable model.');
    const stops=[[205,'Megatron-LM','Training recipe'],[754,'Megatron Core','Parallel layer'],[1303,'Megatron Bridge','Checkpoint conversion']];
    const bridges=cue(k,4,'Megatron Bridge',.7);
    stops.forEach(([x,label,role],i)=>{
      const lit=i!==2 || bridges>0;
      bed(c,x,323,410,385);
      txt(c,label,x+205,384,41,lit?C.paper:C.quiet,'center','Serif');
      if(i===0) {
        for(let j=0;j<3;j++){rect(c,x+82,447+j*54,248-j*37,24,[C.mint,C.ice,C.gold][j],4);}
      } else if(i===1){
        for(let j=0;j<4;j++) {tile(c,x+63+j*73,464,60,103,j===3?C.gold:C.mint);mono(c,j,x+93+j*73,515,32,C.ink,'center');}
      } else {
        for(let j=0;j<4;j++)rect(c,x+65+j*70,452,63,42,j===3?C.gold:C.mint,4);
        alpha(c,bridges,()=>{arrow(c,x+204,506,x+204,548,C.paper);rect(c,x+65,561,274,24,C.mint,4);rect(c,x+270,561,69,24,C.gold,4);});
      }
      txt(c,role,x+205,653,31,C.paper,'center');
    });
    arrow(c,628,517,737,517,C.sub);arrow(c,1175,517,1284,517,C.sub);
    note(c,'Use Core to trace a collective, the trainer to reproduce a run, and Bridge to map weights.');return;
  }
  const split=smooth(cue(k,0,'Split the row',1.1));
  const owner=cue(k,1,'Rank three owns'), markedResult=cue(k,1,'contributes three'), zeros=cue(k,1,'contributes zero'), gathered=cue(k,2,'Rank two needs',1.15);
  back(c,'Who computes with column six?', 'One output weight row   /   Four tensor ranks   /   Zero-based global columns');
  txt(c,'Column',103,278,34);txt(c,'Weight',103,390,34);txt(c,'Input',103,537,34);
  for(let i=0;i<8;i++){
    const x=cx(i), marked=i===trackedColumn, rank=Math.floor(i/2);
    mono(c,i,x,277,41,marked?C.brass:C.sub,'center');
    const half=90-12*split;
    const localX=x+(i%2===0?1:-1)*11*split;
    rect(c,localX-half,323,half*2,136,C.well,3+8*split);
    columnFace(c,localX,343,half*2-26,87,checkpointRow[i],marked,owner && rank===3?C.ice:C.mint);
    mono(c,probeInput[i],x,537,44,marked?C.brass:C.sub,'center');
  }
  for(const s of saved.shards) {
    const rank=s.offset/2, x=(cx(s.offset)+cx(s.offset+1))/2;
    alpha(c,split,()=>brace(c,x-168,x+168,465,'rank '+rank,owner && rank===3?C.brass:C.sub));
    line(c,x,581,x,622,C.edge,4);
  }
  bed(c,279,613,1524,192);
  txt(c,gathered===1?'Sum':gathered?'Exchange':'Partials',103,713,31,C.ink);
  for(let r=0;r<4;r++){
    const x=(cx(2*r)+cx(2*r+1))/2;
    if(gathered>0){line(c,x,677,x,650,C.gold,3);if(r<3)line(c,x,650,x+368,650,C.gold,3);}
    const travel=(3-r)/3;
    const reached=gathered>0 && gathered>=travel;
    const ready=r===3?markedResult:zeros;
    tile(c,x-84,676,168,77,reached?C.gold:ready?C.mint:C.quiet);
    mono(c,reached?probe:ready?partial[r]:'?',x,716,43,C.ink,'center');
  }
  if(gathered>0 && gathered<1) dot(c,lerp((cx(6)+cx(7))/2,(cx(0)+cx(1))/2,gathered),650,10,C.gold);
  note(c,b===0?'The next layer takes the full output on each rank. Trace column six to its owner.':b===1?'All other inputs are zero. Only the marked column can contribute.':b===2?'All-reduce sums the four contributions and returns the sum to each participant.':'A wider group reduces storage per rank and adds a communication boundary.');
}

export function mesh(c,k) {
  const b=k.beat.beatIndex;
  if(b>=5) return smallerMesh(c,k);
  const tp=cue(k,1,'The first four cells'), pp=cue(k,2,'Across to rank thirty-five'), dp=cue(k,3,'Three eleven'), cp=cue(k,3,'The context peer');
  const which=cp?'context':dp?'data':pp?'pipeline':tp?'tensor':null;
  back(c,'Who communicates with rank three?', '64 ranks   /   4 tensor × 2 context × 4 data × 2 pipeline');
  for(const stage of [0,1]){
    const left=117+stage*865;
    bed(c,left,246,820,555);
    txt(c,'Pipeline stage '+stage,left+49,297,40,C.paper,'left','Serif');
    for(let t=0;t<4;t++)mono(c,'TP '+t,left+251+t*145,355,27,C.mint,'center');
    for(let row=0;row<8;row++) {
      const y=390+row*48;
      mono(c,'D'+Math.floor(row/2)+'  C'+row%2,left+41,y+17,27,C.quiet);
      for(let t=0;t<4;t++){
        const r=t+4*row+32*stage, x=left+190+t*145, on=which && groups[which].includes(r);
        rect(c,x,y,122,37,r===3?C.gold:on?C.mint:'#344d50',5);
        mono(c,r,x+61,y+19,29,r===3||on?C.ink:'#d0ddda','center');
      }
    }
  }
  note(c,b===4?'64 ÷ (4 × 2 × 2) = 4 independent data replicas. Sequence parallelism uses existing tensor ranks.':which?which[0].toUpperCase()+which.slice(1)+' group    '+groups[which].join('   ·   '):'Hold three coordinates fixed. Change only the coordinate used by this operation.');
}

function matrix(c,m,x,y,col,label) {
  txt(c,label,x,y-34,30,C.paper);
  for(const [r,row] of m.entries()) for(const [i,v] of row.entries()){
    rect(c,x+i*95,y+r*58,87,50,col,4);mono(c,v,x+i*95+43,y+r*58+26,32,C.ink,'center');
  }
}
export function mlp(c,k) {
  const b=k.beat.beatIndex;
  if(b===6){
    back(c,'How wide is one tensor shard?', 'Hidden width 8   /   Intermediate width 16   /   Tensor parallel degree 4');
    for(let j=0;j<16;j++){
      const x=218+93*j;
      tile(c,x,319,87,182,tint[Math.floor(j/4)]);mono(c,j,x+44,404,35,C.ink,'center');
    }
    for(let r=0;r<4;r++)brace(c,218+372*r,582+372*r,528,'rank '+r);
    const stored=cue(k,6,'the stored shapes transpose');
    txt(c,'Mathematical weight',225,665,41);mono(c,'up [8, 4]     down [4, 8]',887,665,43);
    if(stored){txt(c,'PyTorch storage',225,758,41);mono(c,'up [4, 8]     down [8, 4]',887,758,43);}
    note(c,'The first projection produces four channels. Four matching rows consume them.');return;
  }
  if(b>=4){
    const one=cue(k,5,'you get six'),two=cue(k,5,'you get nine');
    back(c,'Where does the shared bias go?', 'One output coordinate   /   Partial outputs 1 and 2   /   Shared bias 3');
    const rows=[['After the sum','(1 + 2) + 3',one?1+2+3:'?'],['Before the sum','(1 + 3) + (2 + 3)',two?(1+3)+(2+3):'?']];
    rows.forEach(([label,expr,res],i)=>{const y=305+i*234;bed(c,158,y,1598,187);txt(c,label,222,y+91,44,C.white,'left','Serif');mono(c,expr,694,y+91,48,C.mint);txt(c,'=',1362,y+93,47,C.paper);tile(c,1475,y+44,198,95,res==='?'?C.quiet:i?C.rose:C.gold);mono(c,res,1574,y+94,54,C.ink,'center');});
    note(c,two?'Both sums finish. One includes a second copy of the bias.':'Does the output of one shared layer need one bias per rank?');return;
  }
  const leftReady=cue(k,1,'Rank zero writes'), rightReady=cue(k,1,'Rank one writes'), slide=smooth(cue(k,1,'Slide the two pairs',1.5));
  const nonlinear=cue(k,2,'Apply GeLU'), projected=cue(k,2,'Each rank multiplies'), summed=cue(k,3,'The serial calculation');
  back(c,b<2?'What does each rank write in its two channels?':b===2?'Which activations can stay local?':'What crosses the tensor group?', 'One token   /   Two tensor ranks   /   Bias-free forward pass, sequence parallelism off');
  for(const l of lanes) {
    const x=126+l.rank*842, col=tint[l.rank];bed(c,x,253,816,354);
    txt(c,'Rank '+l.rank,x+40,302,43,C.paper,'left','Serif');
    mono(c,nonlinear?'channels '+l.ids.join(', '):'input  '+vec(input),x+765,303,36,col,'right');
    matrix(c,nonlinear?l.down:l.up,x+56,422,col,nonlinear?'Down weights':'Up weights');
    txt(c,nonlinear?'Local GeLU (rounded)':'Channels '+l.ids.join(' and '),x+365,397,32,C.paper);
    mono(c,nonlinear?vec(l.ids.map(i=>active[i]),operandDigits):(l.rank?rightReady:leftReady)?vec(l.ids.map(i=>channels[i])):'[ ? ,  ? ]',x+368,465,nonlinear?32:41,col);
    if(projected) mono(c,'Partial ≈ ['+l.z.map(v=>v.toFixed(operandDigits)).join(',  ')+']',x+48,553,32,C.white);
  }
  if(!nonlinear){
    for(const l of lanes)for(let j=0;j<2;j++){
      const i=l.ids[j], x=lerp(325+l.rank*842+j*205,628+i*218,slide);
      const y=lerp(653,703,slide);
      columnFace(c,x,y,185,84,(l.rank?rightReady:leftReady)?channels[i]:'?',false,tint[l.rank]);
      mono(c,'channel '+i,x,y-25,28,C.sub,'center');
    }
    note(c,'Color follows the channel owner, including when you read the pairs in global order.');
  }else{
    for(const r of [0,1])arrow(c,525+r*842,622,779+r*342,702,C.sub,4);
    bed(c,420,710,1080,104);
    mono(c,summed?'Sum ≈ '+vec(output):projected?'Add the two partials coordinate by coordinate.':'Each channel keeps its owner.',960,762,projected&&!summed?33:38,C.paper,'center');
    note(c,projected?'The ranks add unrounded partials. The final display rounds each sum to three decimal places.':'Each rank uses its own two channels to contribute to both output coordinates.');
  }
}

export function pipeline(c,k){
  const b=k.beat.beatIndex;
  const eight=cue(k,1,'Eight microbatches'), four=cue(k,3,'Four microbatches');
  const w=four?budget(8):eight?budget(4):forwardWave(1);
  const replay=b===1 && eight || b===3 && four;
  const run=b===0?cue(k,0,'Trace its forward pass',2.6):replay?(b===1?cue(k,1,'Eight microbatches',3.1):cue(k,3,'Four microbatches',2)):1;
  const current=run*w.ticks;
  back(c,'How much of the pipeline sits idle?', 'Forward wave   /   Two equally timed stages   /   One microbatch contains two examples');
  bed(c,117,292,1685,457);
  const x0=441,pitch=140;
  const prior=budget(4);
  const extent=four?lerp(prior.ticks,w.ticks,smooth(run)):w.ticks;
  const ruler=eight?prior.ticks:w.ticks;
  for(let t=0;t<ruler;t++){
    const oldSlot=four && t>=w.ticks;
    mono(c,t+1,x0+(t+.5)*pitch,356,30,oldSlot?'#9aafa8':C.quiet,'center');
  }
  txt(c,'Time slot',180,357,31,C.quiet);
  for(let s=0;s<2;s++){
    const y=405+s*154;txt(c,s?'Late layers':'Early layers',175,y+60,41,C.paper,'left','Serif');
    for(let t=0;t<ruler;t++){
      if(four && t>=w.ticks){
        const x=x0+t*pitch;
        const oldBatch=t-s;
        const opacity=Math.max(0,Math.min(1,extent-t));
        alpha(c,opacity*0.5,()=>{
          rect(c,x,y,pitch-9,112,oldBatch<prior.microbatches?tint[oldBatch%4]:'#6e8580',7);
          if(oldBatch<prior.microbatches)mono(c,'M'+(oldBatch+1),x+(pitch-9)/2,y+56,36,C.ink,'center');
        });
        line(c,x+5,y+108,x+pitch-12,y+108,'#6e8580',2);
        continue;
      }
      const j=t-s, work=j>=0 && j<w.microbatches;
      rect(c,x0+t*pitch,y,pitch-9,112,'#395254',7);
      if(!work){
        for(let a=12;a<97;a+=21)line(c,x0+t*pitch+a,y+92,x0+t*pitch+a+24,y+23,'#6e8580',3);
      }else if(current>t){
        const frac=Math.min(1,current-t);
        rect(c,x0+t*pitch,y,(pitch-9)*frac,112,tint[j%4],7);
        if(frac>.8)mono(c,'M'+(j+1),x0+(t+.5)*pitch-4,y+56,36,C.ink,'center');
      }
    }
  }
  if(four){
    const edge=x0+extent*pitch-4;
    line(c,edge,384,edge,697,C.brass,5);
    mono(c,'Previous: '+prior.idle+' idle / '+prior.slots+' slots',x0+prior.ticks*pitch-13,718,32,C.quiet,'right');
  }
  const idleReady=b===0?cue(k,0,'Two out of four'):four?cue(k,3,'one fifth'):cue(k,2,'one ninth');
  const m=w.microbatches;
  mono(c,idleReady?'Idle fraction = '+w.idle+' / '+w.slots+' = 1 / '+(m+1):b===1 && !eight?'Previous wave: 1 microbatch':m+' microbatch'+(m===1?'':'es')+' per replica',964,801,43,C.ink,'center');
  const relative= b===2 && cue(k,2,'one eighth');
  const summary=relative?'Relative to useful work: 2 / 16 = 1 / 8.':
    b===4?'64 × 2,048 = '+w.positions.toLocaleString('en-US')+' token positions per update in both launches.':
    b===0?'Hatching marks a slot with no microbatch to run.':
    four?'64 examples ÷ (2 per microbatch × 8 replicas) = 4 microbatches per replica.':
    eight?'64 examples ÷ (2 per microbatch × 4 replicas) = 8 microbatches per replica.':
    'Next launch: 64 examples, 2 per microbatch, 4 data replicas.';
  mono(c,summary,121,852,30,C.sub);
}
