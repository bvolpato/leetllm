import {C,txt,mono,line,path,rect,circle,bracket,dotline,bench,note,strip,cue,cueThrough,cueEnd,mix,pointer} from './ink.mjs';
import {work,lease,segments,callAt,sum} from './model.mjs';
import {loadImage} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';

const figure = await loadImage(fileURLToPath(new URL('../../../assets/papers/flashinfer-v2/figure-6.png',import.meta.url)));

function queues(g,c) {
  const tiles = cue(c,3,'two pink tiles'), queues = cue(c,3,'go to different queues');
  const reduced = cue(c,3,'the reduction map sends');
  bench(g, 'Paper scheduler', 'Which partial states feed output four?');
  const x=344, y=238, scale=.80;
  g.save();
  g.translate(x,y);
  g.scale(scale,scale);
  g.drawImage(figure,0,0,1534,775,0,0,1534,775);
  if(tiles) rect(g,251,460,629,80,null,C.rust,3);
  if(queues) {
    rect(g,1051,177,356,81,null,C.rust,3);
    rect(g,1051,256,276,80,null,C.rust,3);
  }
  if(reduced) {
    rect(g,466,689,295,43,null,C.rust,3);
  }
  g.restore();
  note(g,'Ye et al., FlashInfer (2025), Fig. 6. Detail of scheduler diagram, CC BY-SA 4.0.');
}

export function lanes(g,c) {
  const b=c.beat.beatIndex;
  if(b===3) return queues(g,c);
  const solve=cue(c,1,'All four start together'),two=cue(c,1,'give the job only two lanes');
  const done=two?cue(c,2,'The merge finishes'):cue(c,1,'the merge finishes');
  const n=two?2:4,{tiles,barrier,finish}=work(n);
  bench(g,'Split-KV scheduling',two?'How long with only two lanes?':'When can the merge finish?');
  const x=310,pitch=84,sy=327;
  txt(g,'One worker',105,sy+38,32,C.ink);
  rect(g,x,sy,16*pitch,78,C.board,null,5);
  for(let i=1;i<4;i++) {
    const at=x+i*4*pitch;
    line(g,at,sy+4,at,sy+15,C.mint,3);
    line(g,at,sy+63,at,sy+74,C.mint,3);
  }
  mono(g,'16 cost units',x+8*pitch,sy+39,35,C.white,'center');
  const y=472,h=76;
  const visibleFinish=two?cue(c,2,'Two waves take eight'):solve;
  for(let i=0;i<n;i++){
    txt(g,'Lane '+(i+1),105,y+i*h+30,30,C.subtle);
    line(g,x,y+i*h+61,x+16*pitch,y+i*h+61,C.grid,2);
  }
  for(const [i,t] of tiles.entries()){
    const start=(!visibleFinish&&two&&i>=2)?null:t.start;
    if(start===null) continue;
    const X=x+start*pitch,Y=y+t.lane*h;
    rect(g,X,Y,t.cost*pitch-5,59,visibleFinish?C.mint:C.pale,visibleFinish?C.teal:C.grid,5);
    mono(g,'chunk '+(i+1)+'  ·  4',X+t.cost*pitch/2,Y+30,29,C.ink,'center');
  }
  if(two&&!visibleFinish)txt(g,'Chunks 3 and 4 waiting',x+4*pitch+53,y+31,33,C.plum);
  if(visibleFinish){
    const BX=x+barrier*pitch;
    line(g,BX,y-17,BX,y+(n-1)*h+62,C.rust,4);
    if(done) {
      rect(g,BX+2,y,pitch-4,59,C.orange,C.rust,5);
      txt(g,'+1',BX+pitch/2,y+31,30,C.rust,'center');
      txt(g,'merge',BX+pitch+16,y+31,29,C.rust);
    }
  }
  line(g,x,808,x+16*pitch,808,C.subtle,3);
  for(const i of [0,4,8,12,16]){
    line(g,x+i*pitch,807,x+i*pitch,821,C.subtle,3);mono(g,i,x+i*pitch,847,28,C.subtle,'center');
  }
  note(g,done?n+' lanes     /     '+barrier+' units of chunk work on the critical path + 1 merge = '+finish+' cost units.':
    'Toy costs     /     4 independent chunks × 4 units each     /     1 dependent merge unit.');
}
export function reads(g,c) {
  const early=cue(c,0,'overwrites the slot'),read=cue(c,1,'The reads land'),done=cue(c,2,'last reader’s completion') || false;
  const transfer=cue(c,2,'hand the lower slot');
  bench(g,'Page lifetime','What will the pending R2 read return?');
  txt(g,'Physical page 14, slot 1',109,294,39,C.ink,'left','Serif',600);
  txt(g,'Device reader completion   /   tick 10',1799,294,32,C.subtle,'right');
  const tags=['Reassign early','Hold the page'];
  for(let i=0;i<2;i++){
    const y=410+239*i,state=lease(i===0&&early,read,i===1&&transfer), fill=state.slot.owner==='R2'?C.mint:C.orange;
    txt(g,tags[i],107,y+63,38,C.ink,'left','Serif',600);
    strip(g,487,y,495,135);
    mono(g,state.slot.owner,523,y+67,39,fill);
    rect(g,648,y+20,301,93,fill,null,4);mono(g,state.slot.v,798,y+67,39,C.ink,'center');
    line(g,997,y+67,1202,y+67,C.grid,5);
    path(g,[[1192,y+56],[1212,y+67],[1192,y+78]],C.grid);
    rect(g,1229,y+6,452,118,state.returned?C.pale:null,C.grid,5);
    mono(g,state.returned??'read pending',1455,y+65,37,read&&i===0?C.rust:C.ink,'center');
  }
  txt(g,'Live slot',505,365,27,C.subtle);txt(g,'Value captured by R2',1245,365,27,C.subtle);
  note(g,done?'Completion event observed. After the last reader finishes, the held page can change owners.':
    read?'The address is the same. Each read has captured the value present at its own load.':
    'Tick 9     /     host claim released     /     R2 device read outstanding');
}
const names=['plan','copy','gap','attention','merge'];
const tones=[C.plum,'#9eaf99','#b8bcc5',C.teal,C.rust];
export function trace(g,c) {
  const b=c.beat.beatIndex;
  if(b===4) {
    const active=['wrong token address','wrong work assignment','wrong weight'].map(phrase=>cue(c,4,phrase));
    const sources=[
      ['Token address','flashinfer/page.py','csrc/page.cu','page 14, slot 1'],
      ['Work assignment','flashinfer/decode.py','csrc/batch_decode.cu','tile and split buffers'],
      ['Merge weight','flashinfer/cascade.py','attention/cascade.cuh','base-two log mass'],
    ];
    bench(g,'Reading the implementation','Where does the first wrong quantity come from?');
    txt(g,'Quantity',115,326,31,C.subtle); txt(g,'Python entry',505,326,31,C.subtle);
    txt(g,'Device source',1060,326,31,C.subtle);
    sources.forEach(([label,wrapper,kernel,operand],i)=>{
      const y=425+i*145;
      const color=active[i]?C.teal:C.subtle;
      line(g,111,y+70,1810,y+70,C.grid,2);
      txt(g,label,115,y,39,color,'left','Serif',600);
      mono(g,wrapper,505,y,31,color);
      mono(g,kernel,1060,y,31,color);
      if(active[i]) txt(g,operand,1060,y+46,28,C.rust);
    });
    note(g,'The cascade kernel lives under include/flashinfer/. Compare its input state with the dense reference.');
    return;
  }
  if(b===3){
    const result=cue(c,3,'inter-token latency fell');
    bench(g,'Paper measurement','What did the SGLang experiment measure?');
    txt(g,'MLSys 2025   /   FlashInfer v0.2   /   8B on 1×H100, 70B on 4×H100   /   FP16',111,296,34,C.subtle);
    txt(g,'Reduction in inter-token latency',112,411,48,C.ink,'left','Serif',600);
    const x=203,pitch=14.6,y=588;
    line(g,x,y,x+100*pitch,y,C.subtle,3);
    for(let i=0;i<=100;i+=10){
      line(g,x+i*pitch,y-12,x+i*pitch,y+12,C.subtle,2);
      if(i%20===0)mono(g,i+'%',x+i*pitch,y+53,27,C.subtle,'center');
    }
    if(result){
      line(g,x+29*pitch,y,x+69*pitch,y,C.teal,15);
      for(const p of [29,69]){
        circle(g,x+p*pitch,y,15,C.mint,C.teal);mono(g,p+'%',x+p*pitch,y-57,40,C.teal,'center');
      }
    }
    txt(g,'SGLang v0.3.4    /    FlashInfer versus Triton v3.0    /    Llama 3.1 8B and 70B',116,754,35,C.ink);
    note(g,'Online serving on ShareGPT and Variable workloads, with P99 time to first token below 200 ms.');
    return;
  }
  const half=cueThrough(c,1,'Shrink the attention interval alone');
  const dump=cue(c,2,'synchronize the stream');
  const changed=cueEnd(c,1,'The new total is two point two milliseconds');
  const speed=cueEnd(c,1,'for a whole-call speedup of about one point three six');
  const revised=callAt(half);
  bench(g,'Serving measurement',b<2?'Where does the whole call finish?':'What else changed in the timing run?');
  const x=326,pitch=430;
  txt(g,'Original call   /   warmed serial example   /   milliseconds',107,290,37,C.subtle);
  names.forEach((n,i)=>{
    const xx=122+i*349;
    rect(g,xx,355,25,25,tones[i]);
    txt(g,n+'   '+segments[i].toFixed(1),xx+36,370,32,C.ink);
  });
  function bar(y,label,data,complete){
    txt(g,label,106,y+42,35,C.ink,'left','Serif',600);
    let X=x;
    data.forEach((ms,i)=>{
      if(i===4&&!complete) return;
      rect(g,X,y,ms*pitch-2,88,tones[i]);
      if(i===3&&(complete||half===1))mono(g,ms.toFixed(2)+' ms',X+ms*pitch/2,y+45,33,C.white,'center');
      X+=ms*pitch;
    });
    if(complete) mono(g,sum(data).toFixed(2),X+18,y+45,35,C.ink);
  }
  bar(464,'Original',segments,true);
  const end=x+sum(segments)*pitch;
  if(half>0||changed){
    bar(618,'Changed',revised,changed);
    if(!changed) txt(g,'Merge still costs '+segments.at(-1).toFixed(1)+' ms',
      x+sum(revised.slice(0,-1))*pitch+22,662,30,C.rust);
  }else {
    dotline(g,x,660,end,660);
    txt(g,'Only attention time will halve',x,620,34,C.subtle);
  }
  for(const i of [0,.5,1,1.5,2,2.5,3]){
    line(g,x+i*pitch,736,x+i*pitch,752,C.subtle,2);mono(g,i,x+i*pitch,783,28,C.subtle,'center');
  }
  if(dump) {
    txt(g,'Level 10 adds stream synchronization and snapshot writes. Their cost is unmeasured here.',118,851,32,C.rust);
  }
  note(g,dump?'Repeat the warmed trace at the same logging level before attributing a latency change.':
    speed?'Whole-call speedup     '+sum(segments).toFixed(2)+' / '+sum(revised).toFixed(2)+' ≈ '+(sum(segments)/sum(revised)).toFixed(2)+'×':
    'Planning, metadata copies, launch gaps and merging all count toward the serial total.');
}
