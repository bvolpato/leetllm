import { C, base, text, mono, centered, plate, line, tag, footer, on, after, rect } from './drawing.mjs';
import { compareCases, trace, transfer, causal, fallback } from './operator.mjs';

export function compare(c,k) {
  const b=k.beat.beatIndex, fixed=after(k,2,'They agree','The cached row now mixes');
  const started=b>0, wrong=started&&!fixed, rows=compareCases(wrong);
  base(c,'Does the reference mix the same keys?','CPU reference  /  dense and streaming arithmetic');
  const cols=[120,512,962,1433];
  ['Case','Dense reference','Streaming result','Max |error|'].forEach((s,i)=>tag(c,s,cols[i],299));
  rows.forEach((r,i)=>{
    const y=330+i*112,active=i===1;
    plate(c,101,y,1716,92,active&&started?(wrong?'#edc7a9':'#bddcc9'):'#edf0df','#abbba9',6);
    text(c,r.name,cols[0]+6,y+60,41);
    const fmt=vs=>vs.map(v=>v.toFixed(3)).join(', ');
    mono(c,started?fmt(r.ref):'·',cols[1],y+61,37);
    mono(c,started?fmt(r.tiled):'·',cols[2],y+61,37);
    mono(c,started?r.diff.toExponential(1):'·',cols[3],y+61,38,wrong&&active?C.red:C.green);
  });
  if(started)mono(c,'Decode mask: dense ['+rows[1].keep[0].join(', ')+']    streaming ['+rows[1].mask[0].join(', ')+']',119,833,36);
  footer(c,wrong?'Scores [1, 2, 3], values [2, 4, 8]. The reference currently reads only key 0.':started?'Matched masks, matched outputs. An empty row returns zero by the chosen convention.':'Compare outputs with the same scale, mask, head mapping and dropout.');
}

export function timing(c,k) {
  if(k.beat.beatIndex===2) return workload(c);
  if(k.beat.beatIndex===3) return published(c,k);
  const b=k.beat.beatIndex,begin=on(k,0,'The device starts',.55),host=on(k,0,'The host returns',.65),
    answer=after(k,1,'One millisecond','That is the part'),finish=on(k,1,'Let the device finish',1.6);
  base(c,'When did the device finish?','Supplied warmed trace  /  milliseconds',true);
  const now=trace.start*begin+(trace.returned-trace.start)*host+(trace.end-trace.returned)*finish;
  const x=t=>440+31*t, lane=(name,y,start,end,col)=>{
    text(c,name,114,y+53,45,C.paper);rect(c,x(0),y,31*42,64,'#2b4847');
    if(end>start)rect(c,x(start),y,31*(end-start),64,col);
  };
  lane('Host submit',408,0,Math.min(now,trace.returned),C.gold);
  lane('Device',560,trace.start,Math.max(trace.start,now),C.aqua);
  for(let i=0;i<=40;i+=5){
    const px=x(i);line(c,[[px,650],[px,674]],C.aqua,2);centered(c,String(i),px,716,30,C.paper,{face:'Mono'});
  }
  mono(c,'ms',1771,715,31,C.paper);
  const cursor=x(now);line(c,[[cursor,353],[cursor,638]],C.white,4);
  const cursorText=(Number.isInteger(now)?now:now.toFixed(1))+' ms';
  centered(c,cursorText,cursor,335,45,C.white,{face:'Mono'});
  if(answer)mono(c,'Completed device work   '+(now.toFixed(1))+' − 1 = '+(now-1).toFixed(1)+' ms',114,834,47,C.aqua);
  else if(host===1)text(c,'Host has returned. How long has the device been executing?',114,831,48,C.white);
  footer(c,finish===1?'Work on the device lasts 40 ms. End-to-end timing includes additional intervals.':'One shared time axis. Read each lane from its own starting point.',true);
}

function workload(c) {
  base(c,'Which attention shape did you time?','Measurement  /  two illustrative shapes');
  for(const [i,qs] of [8,1].entries()){
    const x=130+880*i;
    tag(c,i?'Decode one more token':'Prefill the prompt',x,292);
    for(let q=0;q<qs;q++) for(let key=0;key<8;key++){
      const allowed=qs===1||key<=q;
      rect(c,x+key*74,350+q*49,70,45,allowed?C.teal:C.grey);
    }
    mono(c,qs+' '+(qs===1?'query':'queries')+' × 8 keys',x,826,44);
    if(qs===1) text(c,'Read the cached keys and values.',x,512,42,C.sub);
  }
  footer(c,'Warm and measure each shape on its production backend. Report p50, tail latency, throughput and peak memory.');
}

function published(c,k) {
  const evidence=on(k,3,'Look at the published comparison');
  base(c,evidence?'Which experiment does the speedup describe?':'What changes across kernel generations?',evidence?'Published FA4 forward benchmark  /  article snapshot':'Scheduling  /  same legal keys',true);
  if(evidence){
    tag(c,'Figure 4 conditions',128,302,C.aqua);
    mono(c,'Forward  /  BF16  /  head width 128',125,397,53,C.white);
    mono(c,'1k–32k positions  /  32k tokens per batch',125,497,46,C.white);
    line(c,[[125,551],[1780,551]],'#527268',3);
    text(c,'Reported maximum speedup over cuDNN 9.13',126,634,47,C.paper);
    mono(c,'1.3×',1560,644,61,C.gold);
    if(on(k,3,'Check the hardware label'))text(c,'Main text: B200     Appendix A.1: B100',126,789,51,C.gold,{face:'Mono'});
    footer(c,'The paper also reports similar performance with a newer cuDNN. Time the version you would replace.',true);
    return;
  }
  const cols=[125,725,1325], names=['FA2','FA3','FA4'];
  const steps=[on(k,3,'The second generation'),on(k,3,'The third overlaps'),on(k,3,'The fourth also')];
  const labels=[['Query tiles','Parallel blocks'],['Copy K/V','Multiply'],['Matrix work','Exponentials']];
  names.forEach((name,i)=>{
    const x=cols[i];
    tag(c,name,x,316,C.aqua);
    if(!steps[i]) return;
    labels[i].forEach((label,j)=>{
      text(c,label,x,430+183*j,44,C.white);
      if(i===0) for(let n=0;n<4;n++) rect(c,x+n*99,459+183*j,88,67,j?C.gold:C.aqua);
      else if(i===1) rect(c,x+j*120,459+183*j,270,67,j?C.gold:C.aqua);
      else for(let n=0;n<(j?6:3);n++) rect(c,x+n*(j?64:128),459+183*j,j?52:116,67,j?C.gold:C.aqua);
    });
  });
  footer(c,'The kernel schedules the same attention operator around different hardware bottlenecks.',true);
}

export function decision(c,k) {
  const empty=after(k,1,'Both return zero','The next three'), known=after(k,1,'Six then nine','Keep those answers');
  const budget=on(k,1,'Suppose our checked fallback'), three=after(k,2,'Three need seven hundred twenty','That crosses');
  const each=after(k,2,'One item needs','Three need seven hundred twenty'), two=after(k,3,'Two need four hundred eighty','Run the pair');
  const single=after(k,3,'Its buffer needs','The peak stays');
  const res=causal(5,transfer);
  base(c,'Would you dispatch this batch?','Fresh case  /  bottom-right causality');
  tag(c,'Equal scores',115,280);tag(c,'Key values',339,279);tag(c,'Output',822,280);
  transfer.forEach((v,j)=>centered(c,String(v),394+j*140,349,53,C.green,{face:'Mono'}));
  res.forEach((r,i)=>{
    const y=375+i*92;
    const visible=i<2?empty:known;
    text(c,'q'+i,116,y+53,40,C.ink,{face:'Mono'});
    mono(c,'@ '+(i+3-5),206,y+51,29,C.sub);
    r.keep.forEach((yes,j)=>{
      const x=329+j*140;plate(c,x,y,127,72,visible&&yes?'#a7d8bf':'#dce3d4',C.rule,5);
      centered(c,visible?(yes?String(transfer[j]):'×'):'?',x+63,y+50,38,C.ink,{face:'Mono'});
    });
    mono(c,visible?String(r.mean):'?',833,y+54,43,C.green);
  });
  line(c,[[974,254],[974,853]],C.rule,2);
  if(!budget){
    tag(c,'Key positions',1041,321);
    for(let j=0;j<5;j++){
      const x=1092+146*j;
      centered(c,'q'+j,x,487,36,C.sub);
      if(j>=2){plate(c,x-53,555,106,87,'#f2c78e');centered(c,'k'+(j-2),x,616,38,C.ink,{face:'Mono'});}
      line(c,[[x,509],[x,548]],C.green,4);
    }
    text(c,'Align the right ends.',1043,755,50,C.ink,{face:'Serif'});
  }else{
    tag(c,'FP32 score buffer',1044,279);
    mono(c,'4 heads × 5 × 3 × 4 B',1040,354,38);
    mono(c,each?'= '+fallback(1).each+' B per item':'= ? B per item',1040,412,41,C.green);
    const x=1051,scale=.96, cap=512,capX=x+cap*scale;
    const limits=(items,y,visible)=>{
      const s=fallback(items);
      text(c,items+(items===1?' item':' items'),x,y-15,34,C.ink);
      rect(c,x,y,scale*740,52,'#d1dbce');
      if(visible){
        for(let i=0;i<items;i++)rect(c,x+i*s.each*scale,y,s.each*scale-2,52,s.fits?C.teal:'#cb895e');
        mono(c,s.total+' B',x+scale*740,y-15,34,s.fits?C.green:C.red,{align:'right'});
      }
      line(c,[[capX,y-5],[capX,y+57]],C.ink,4);
    };
    centered(c,'512 B limit',capX,478,31);
    limits(3,552,three);
    if(three)limits(2,674,two);
    if(two)limits(1,795,single);
  }
  const note=single?'Run 2, release the buffer, then run 1. Peak score space: 480 B.':two?'The pair fits. Release its buffer before allocating the next one.':three?'720 B exceeds the 512 B score allowance. Could two items fit?':budget?'Count every materialized score, including each masked cell.':known?'The two leading empty rows use the zero-output convention.':'Centers = i + 3 − 5. Use the documented empty-row convention.';
  footer(c,note);
}
