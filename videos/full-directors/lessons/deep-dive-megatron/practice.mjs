import { C, tint, txt, mono, rect, line, tile, bed, back, note, cue, arrow } from './drawing.mjs';
import { smallMesh, gradientBuffers, reducedGradients, updatedWeights, storagePolicies, residentColumns } from './examples.mjs';

export function smallerMesh(c,k) {
  const tensor = cue(k,6,'Fifteen shares');
  const pipeline = cue(k,6,'Six shares');
  back(c,'Who communicates with rank fourteen?', '16 ranks   /   2 tensor × 2 context × 2 data × 2 pipeline   /   Tensor varies fastest');
  for (let stage=0; stage<2; stage++) {
    const x=181+stage*861;
    bed(c,x,273,683,492);
    txt(c,'Pipeline stage '+stage,x+42,332,43,C.paper,'left','Serif');
    mono(c,'TP 0',x+347,409,34,C.quiet,'center');
    mono(c,'TP 1',x+548,409,34,C.quiet,'center');
    for(let row=0; row<4; row++) {
      const y=452+72*row;
      mono(c,'D'+Math.floor(row/2)+'  C'+row%2,x+41,y+25,30,C.quiet);
      for(let t=0; t<2; t++) {
        const rank=stage*8+row*2+t, xx=x+269+201*t;
        const fill=rank===smallMesh.anchor?C.gold:
          tensor && smallMesh.tensor.includes(rank)?C.mint:
          pipeline && smallMesh.pipeline.includes(rank)?C.ice:'#40595a';
        tile(c,xx,y,155,53,fill);
        mono(c,rank,xx+78,y+28,37,fill==='#40595a'?C.paper:C.ink,'center');
      }
    }
  }
  note(c,pipeline?'Tensor stride 1 gives {14, 15}. Pipeline stride 8 gives {6, 14}.':
    tensor?'Tensor peers share this row. Which cell has the same coordinates on stage zero?':
    'Start at the gold cell. Change only the tensor coordinate, then only the pipeline coordinate.');
}

export function optimizerStep(c,k) {
  const plain=cue(k,3,'Plain data parallelism');
  if(plain){
    const optimizer=cue(k,3,'With a distributed optimizer');
    const full=cue(k,3,'Under full sharding');
    const policy=full?storagePolicies.full:optimizer?storagePolicies.optimizer:storagePolicies.plain;
    back(c,'Which buffers stay on each rank?',policy.name+'   /   Allocated storage between steps   /   Four parameter positions');
    for(const rank of [0,1]){
      const x=126+850*rank;
      bed(c,x,270,816,515);
      txt(c,'Data rank '+rank,x+51,326,43,C.paper,'left','Serif');
      for(const [i,[key,label]] of [['model','Model weights'],['gradient','Main gradients'],['optimizer','Adam state']].entries()){
        const y=400+i*118, owned=residentColumns(policy,key,rank);
        txt(c,label,x+48,y+32,29,C.paper);
        for(const [j,w] of updatedWeights.entries()){
          const xx=x+282+j*123;
          if(i===0) mono(c,'w'+j,xx+51,371,26,C.quiet,'center');
          rect(c,xx,y,102,62,'#395456',5);
          if(owned.includes(j)){
            tile(c,xx,y,102,62,tint[rank]);
            if(key==='model') mono(c,w,xx+51,y+33,36,C.ink,'center');
            else {
              line(c,xx+34,y+31,xx+47,y+44,C.ink,5);
              line(c,xx+47,y+44,xx+70,y+20,C.ink,5);
            }
          }
        }
      }
    }
    txt(c,'A filled slot uses storage on this rank. A dark slot belongs to its peer.',960,822,30,C.sub,'center');
    note(c,full?'Each rank stores two columns of every buffer. It gathers the layer weights when it needs them.':
      optimizer?'Each rank keeps four model and gradient slots. The master weights and moments split by column.':
      'Both ranks allocate every slot. Each Adam slot includes the master weight and both moments.');
    return;
  }
  const reduced=cue(k,3,'reduce-scatter');
  const update=cue(k,3,'Subtract the local updates');
  const gathered=cue(k,3,'An all-gather');
  back(c,'Which entries belong to each optimizer owner?', 'Two equally weighted replicas   /   SGD learning rate 0.1   /   Starting weights [1, 2, 3, 4]');
  for(let rank=0; rank<2; rank++) {
    const x=126+850*rank;
    bed(c,x,270,816,515);
    txt(c,'Data rank '+rank,x+51,326,43,C.paper,'left','Serif');
    ['Local gradient','Mean gradient','New weights'].forEach((s,i)=>txt(c,s,x+48,432+118*i,29,C.paper));
    for(let j=0; j<4; j++) {
      const xx=x+282+j*123, owner=Math.floor(j/2);
      mono(c,'w'+j,xx+52,371,26,C.quiet,'center');
      for(const [i,show,v] of [
        [0,true,gradientBuffers[rank][j]],
        [1,reduced && owner===rank,reducedGradients[j]],
        [2,update && (gathered || owner===rank),updatedWeights[j]],
      ]) {
        const y=400+i*118;
        rect(c,xx,y,102,62,'#395456',5);
        if(show) {
          tile(c,xx,y,102,62,i===0?C.quiet:tint[owner]);
          mono(c,v,xx+51,y+33,36,C.ink,'center');
        }
      }
    }
  }
  note(c,gathered?'Both ranks now have all four updated weights in global order.':
    update?'Subtract 0.1 times each owned gradient from its starting weight.':
    reduced?'Reduce-scatter averages corresponding entries and leaves each owner its two gradients.':
    'Both peers have gradients for all four weights. Follow a column down to find its owner.');
}

export function scalingStudy(c,k) {
  const a=cue(k,4,'forty-seven percent'), b=cue(k,4,'forty-two percent');
  back(c,'What changed at the same global batch?', 'Megatron-LM reported H100 strong-scaling study   /   1,152 sequences per update   /   Sequence length 4,096');
  bed(c,143,288,1626,456);
  const x0=527, unit=10.9;
  for(let pct=0; pct<=100; pct+=25) {
    const x=x0+pct*unit;
    mono(c,pct+'%',x,359,29,C.quiet,'center');
    line(c,x,396,x,680,'#526d6c',2);
  }
  for(const [i,gpus,pct,show] of [[0,'96',47,a],[1,'4,608',42,b]]) {
    const y=432+i*145;
    txt(c,gpus+' GPUs',192,y+41,42,C.paper,'left','Serif');
    if(show) {
      rect(c,x0,y,pct*unit,80,tint[i],5);
      mono(c,pct+'% MFU',x0+pct*unit+24,y+42,38,C.paper);
    }
  }
  note(c,'MFU measures useful model arithmetic relative to peak. Learning quality requires validation.');
}

export function trace(c,k) {
  const pipe=cue(k,5,'A gap at a pipeline boundary');
  back(c,pipe?'Where does the second stage wait?':'Where does the tensor group wait?',
    'Illustrative device timeline   /   Horizontal distance measures elapsed time');
  bed(c,130,280,1660,486);
  const blocks=pipe?[
    ['Early layers',[[0,3,'M1',C.mint],[3,3,'M2',C.ice],[6,3,'M3',C.rose]]],
    ['Late layers',[[0,3,'idle',C.quiet],[3,3,'M1',C.mint],[6,3,'M2',C.ice],[9,3,'M3',C.rose]]],
  ]:[
    ['Tensor rank 0',[[0,3,'GEMM',C.mint],[3,3,'reduce',C.gold],[6,3,'GEMM',C.mint],[9,3,'reduce',C.gold]]],
    ['Tensor rank 1',[[0,3,'GEMM',C.ice],[3,3,'reduce',C.gold],[6,3,'GEMM',C.ice],[9,3,'reduce',C.gold]]],
  ];
  blocks.forEach(([name,spans],i)=>{
    const y=405+i*167;
    txt(c,name,184,y+42,39,C.paper,'left','Serif');
    for(const [start,duration,label,col] of spans) {
      const x=564+start*96;
      tile(c,x,y,96*duration-8,80,col);
      mono(c,label,x+48*duration-4,y+42,37,C.ink,'center');
    }
  });
  arrow(c,564,348,1708,348,C.quiet,3);
  note(c,pipe?'Inspect stage balance and microbatch count. Compare completed steps with the same workload.':
    'Check tensor-peer placement and link time. The trace locates the wait. Its cause needs a measurement.');
}

export function lineage(c,k) {
  const b=k.beat.beatIndex;
  if (b===7) {
    back(c,'Which stack fits the job?', 'One GPU for a small fine-tune   /   Several nodes for a transformer that exceeds one GPU');
    for(const [i,name,desc] of [[0,'One device','A trainer and a model that fit'],[1,'Several nodes','A sharded model and a rank map']]) {
      const x=150+837*i;
      bed(c,x,300,782,421);
      txt(c,name,x+48,361,47,C.paper,'left','Serif');
      const n=i?4:1;
      for(let j=0; j<n; j++) {
        tile(c,x+80+147*j,447,130,109,tint[j]);
        mono(c,i?'W'+j:'W',x+145+147*j,503,40,C.ink,'center');
      }
      txt(c,desc,x+49,637,34,C.paper);
    }
    note(c,'Record placement and versions. Check peak memory and compare the next update on a fixed batch.');
    return;
  }
  back(c,'Which research result explains this operation?', 'Megatron research lineage   /   Predict the communication, then check the implementation');
  const rows=[
    ['Shoeybi et al. · 2019','Channels stay local','Sum the row-parallel outputs'],
    ['Narayanan et al. · 2021','Overlap microbatches','Send activations between stages'],
    ['Korthikanti et al. · 2022','Shard activations','Recompute selected intermediates'],
  ];
  rows.forEach(([name,operation,consequence],i)=>{
    const y=271+i*165;
    bed(c,135,y,1651,137);
    txt(c,name,182,y+69,37,C.paper,'left','Serif');
    txt(c,operation,710,y+69,33,tint[i]);
    arrow(c,1065,y+68,1153,y+68,C.quiet,3);
    txt(c,consequence,1193,y+69,31,C.paper);
  });
  note(c,'The article pins the source revision. Weights, tokenizers and training data have their own terms.');
}
