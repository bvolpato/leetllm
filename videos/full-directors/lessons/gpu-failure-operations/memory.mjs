import {C,words,mono,rect,line,dot,hatch,board,header,foot,cue,lerp,smooth,f2} from './bench.mjs';
import {layout,receipt,units,request,probe,joinState,eventCase,ringState,gpuReceiptFixtures,memoryReceipt} from './incident.mjs';

const colors={live:C.blue,hole:C.mint,other:C.gold,outside:'#b09bc1',free:C.cream};
function component(c, name, value, x, y, color) {
  rect(c,x,y-13,13,13,color,C.muted);
  words(c,name,x+23,y,16,C.muted);
  words(c,value,x,y+33,26,C.ink,{bold:true});
}
function smallSection(c, x, y, w, h) {
  let end=0;
  for(const b of layout){
    const start=x+w*b.start/4000;
    rect(c,start,y,w*b.size/4000,h,colors[b.kind],C.board,0.6);
    end=start+w*b.size/4000;
  }
  return end;
}
export function allocation(c,k){
  const s=probe(k), b=k.beat.beatIndex, x=70,y=155,w=820,scale=w/4000;
  const docking=cue(k,0,'Slide its outline',1.1);
  const requestSize=f2(request)+' GiB';
  header(c,'Where can the next tensor go?','GPU-7f3   /   r-7812   /   14:03:17 UTC');
  board(c,46,116,868,129);
  mono(c,'GPU ACCOUNTING CROSS SECTION',x,143,14,C.dim);
  mono(c,'40.00 GiB',889,143,16,C.cream,'right');
  smallSection(c,x,y,w,36);
  const focus=x+s.block.start*scale;
  if(docking===1) rect(c,focus,y-5,units(request)*scale,46,null,C.orange,2.8);
  line(c,[[x,y+49],[x,y+55],[x+3670*scale,y+55],[x+3670*scale,y+49]],C.dim);
  mono(c,'36.70 GiB reserved by PyTorch',x,y+76,14,C.cream);
  const edge=115, z=327, rowY=312;
  words(c,s.among?`Inactive span ${s.index+1} of 8`:'Device-free end',74,282,21,C.ink,{bold:true});
  mono(c,'enlarged   /   same scale on both rows',883,282,14,C.muted,'right');
  const amount=s.block.size/100;
  rect(c,edge,rowY,z*amount,39,s.among?C.mint:C.cream,C.green,1.8);
  if(s.among) {
    for(const next of layout.filter(v=>v.start>s.block.start && v.start<s.block.start+units(request))){
      const local=(next.start-s.block.start)/100;
      const width=z*Math.min(request-local,next.size/100);
      rect(c,edge+z*local,rowY,width,39,colors[next.kind]);
      if(next.kind==='live') hatch(c,edge+z*local,rowY,width,39,C.paleBlue,9);
    }
  }
  mono(c,f2(amount)+' GiB',edge+8,rowY+26,17,C.ink);
  const boundary=edge+z*amount;
  line(c,[[boundary,rowY-9],[boundary,rowY+(docking===1?51:39)]],C.green,1.8,[4,4]);
  if(!s.among) mono(c,'Device edge',boundary+10,rowY+26,16,C.muted);
  const requestX=lerp(382,edge,smooth(docking)), requestRight=requestX+z*request;
  rect(c,requestX,rowY+51,z*request,33,C.paper,C.rust,2.6);
  mono(c,requestSize+' request',requestX+10,rowY+74,17,C.rust);
  const shownDeficit=cue(k,1,'by point eight eight',0.95)===1 && !s.among;
  if(shownDeficit){
    rect(c,boundary,rowY+54,requestRight-boundary,27,'#edd9c9');
    hatch(c,boundary,rowY+54,requestRight-boundary,27,C.orange,8);
    line(c,[[boundary,rowY+51],[boundary,rowY+84]],C.rust,1.8);
    mono(c,f2(s.deficit/100)+' GiB over',requestRight+18,rowY+75,18,C.rust);
  }else if(docking===1){
    line(c,[[boundary,rowY+84],[boundary,rowY+93]],C.green,1.8);
  }
  if(s.among) {
    for(let i=0;i<8;i++) dot(c,721+19*i,369,5,i<s.tried?C.green:C.paper,i===s.index?C.rust:C.line);
    mono(c,'spans inspected',787,398,13,C.muted,'center');
  }
  if(s.verdict) foot(c,'Inspect the allocator. Hold new work off this replica.','Capture the request, process, GPU and time before a bounded restart.');
  else if(b>=2) foot(c,'Inspect this replica or drain the node?','Peer replicas still serve. Node health responds. New Xid events: 0. New uncorrectable ECC: 0.');
  else foot(c,s.among?'Can a single inactive span hold the whole request?':'Can this request fit in the device-free space?','Blue = live tensors     •     Green = inactive split blocks     •     Address order is illustrative.');
}

function segmentReplay(c,s) {
  const x=105,y=222,h=70,scale=3.4;
  mono(c,'ONE NATIVE SEGMENT   /   ONE POOL AND STREAM',x,150,16,C.muted);
  const [a,mid,d]=s.lengths;
  const middleX=x+scale*a;
  const middleEnd=middleX+mid*scale;
  const end=x+s.available*scale;
  line(c,[[x,211],[x,203],[end,203],[end,211]],C.muted,1.5);
  rect(c,x,y,end-x,h,C.mint,C.green,2);
  if(!s.freed) rect(c,middleX,y,middleEnd-middleX,h,C.blue);

  if(s.merge<1){
    c.save();
    c.globalAlpha=1-s.merge;
    for(const seam of [middleX,middleEnd]){
      line(c,[[seam,197],[seam,210]],C.muted,1.5);
      line(c,[[seam,y],[seam,y+h]],C.green,1.6);
    }
    mono(c,f2(a/100)+' GiB inactive',x+15,y+43,17,C.ink);
    mono(c,f2(mid/100),(middleX+middleEnd)/2,y+43,17,s.freed?C.ink:C.cream,'center');
    mono(c,f2(d/100)+' GiB inactive',middleEnd+15,y+43,17,C.ink);
    c.restore();
  }
  if(!s.placement){
    const label=s.freed?'Free complete':s.lastUse?'Last use':'Live tensor';
    mono(c,label,(middleX+middleEnd)/2,183,17,s.freed?C.green:C.blue,'center');
    if(s.merge===1) words(c,f2(s.available/100)+' GiB contiguous',x+15,y+44,26,C.green,{bold:true});
  }

  const requestY=lerp(323,y,smooth(s.placement));
  const width=units(request)*scale;
  rect(c,x,requestY,width,h,s.placed?C.orange:C.cream,C.rust,2.5);
  mono(c,f2(request)+' GiB '+(s.placed?'allocated':'request'),x+15,requestY+43,18,s.placed?C.ink:C.rust);
  if(s.remainder) mono(c,f2(s.remaining/100)+' GiB left',x+width+11,y+43,17,C.ink);
}
export function fragments(c,k){
  const b=k.beat.beatIndex;
  header(c,['What separates two holes?','When do the two holes join?','Can the layout explain this event?','Could perfect packing fix this worker?'][b],
    b===3?'r-7813   /   embedder   /   40.00 GiB':'r-7812   /   native allocator snapshot and illustrated replays');
  if(b<2){
    const s=joinState(k);
    segmentReplay(c,s);
    if(b===0) foot(c,'36.70 reserved  −  30.10 live  =  6.60 GiB gap','6.10 GiB in inactive split blocks  +  0.50 GiB other reserve');
    else foot(c,s.placed?'The request fits in the joined block.':s.merge===1?'One contiguous block spans the original pieces.':s.freed?'The middle block is free.':'Follow the lifetime of the blue tensor.',
      'Check pending frees, streams and pools in the incident snapshot.');
  } else if (b===2) {
    const s=eventCase(k);
    board(c,46,126,868,117);
    mono(c,'ORIGINAL MEMORY LAYOUT   /   FIXED',73,155,14,C.mint);
    smallSection(c,73,171,810,29);
    mono(c,'40.00 capacity   •   39.38 used   •   6.10 split   •   0.88 largest   (GiB)',73,224,15,C.cream);
    component(c,'Captured operation',s.row.cuda_error==='success'?'Success':'OOM',68,296,C.orange);
    component(c,'Request size',s.row.oom_request_gib===null?'Unknown':f2(s.row.oom_request_gib)+' GiB',350,296,C.gold);
    component(c,'Backend',s.row.allocator_backend,628,296,C.mint);
    const statements={'allocator-fragmentation':'Inspect fragmentation under pressure',unclassified:'No captured failure to explain',
      'oom-unresolved':s.row.oom_request_gib===null?'Failed size unknown':'Use backend-specific memory evidence'};
    words(c,statements[s.hypothesis],68,405,26,C.green,{font:'Serif',bold:true});
    foot(c,'Which inference follows from this receipt?','A successful allocation and a later successful error query describe different operations.');
  } else {
    const row=gpuReceiptFixtures[1], scale=19.5,x=79,y=221,cap=row.capacity_gib, live=row.pytorch_allocated_gib,q=row.oom_request_gib;
    const added=cue(k,3,'a request for one more fails');
    const answered=cue(k,3,'Reduce live demand');
    mono(c,'REPACK LIVE TENSORS EDGE TO EDGE',x,164,15,C.muted);
    rect(c,x,y,cap*scale,80,C.cream,C.ink,2);
    rect(c,x,y,live*scale,80,C.blue);
    words(c,'39.10 GiB live',x+18,y+50,28,C.cream,{bold:true});
    if(added)rect(c,x+live*scale,y-4,q*scale,88,null,C.rust,2.5);
    line(c,[[x+cap*scale,186],[x+cap*scale,327]],C.ink,2,[5,4]);
    mono(c,'capacity 40.00',x+cap*scale,175,16,C.ink,'right');
    if(added){
      mono(c,'Magnified last 0.90 GiB',x,335,16,C.muted);
      const span=226;
      rect(c,x,351,(cap-live)*span,25,C.cream,C.ink,1.5);
      rect(c,x,381,q*span,25,null,C.rust,2);
      mono(c,'+ 1.00 requested',x+13,400,15,C.rust);
      line(c,[[x+(cap-live)*span,343],[x+(cap-live)*span,413]],C.muted,1,[4,4]);
    }
    if(cue(k,3,'forty point one')) words(c,`${f2(live+q)} GiB needed`,x+337,387,32,C.rust,{font:'Serif',bold:true});
    foot(c,answered?'Reduce live demand before tuning the allocator.':'Could a contiguous block solve this OOM?','This separate receipt comes from the embedder on GPU-a11.');
  }
}

export function ownership(c,k){
  const b=k.beat.beatIndex;
  if(b<2) {
    const absent=Boolean(cue(k,1,'remove the device reading'));
    const delta=Boolean(cue(k,1,'two point six eight'));
    const row={...receipt,nvml_device_used_gib:absent?null:receipt.nvml_device_used_gib};
    const m=memoryReceipt(row);
    header(c,'Who owns the bytes beyond PyTorch?','GPU-7f3   /   matched device scope   /   14:03:17 UTC');
    const x=72,s=20.2;
    mono(c,'PyTorch reserve',x,166,16,C.ink);
    rect(c,x,180,row.pytorch_reserved_gib*s,50,C.mint,C.green,1);
    rect(c,x,180,row.pytorch_allocated_gib*s,50,C.blue);
    mono(c,'30.10 live',x+10,212,17,C.cream);
    mono(c,'36.70 GiB',x+row.pytorch_reserved_gib*s,164,18,C.green,'right');
    mono(c,'NVML device use',x,283,16,C.ink);
    if(m.outside===null){
      rect(c,x,297,40*s,49,null,C.line);
      hatch(c,x,297,40*s,49,C.line,11);
      rect(c,x+17,304,210,34,C.paper);
      mono(c,'query unavailable',x+25,327,17,C.muted);
    }else{
      rect(c,x,297,row.nvml_device_used_gib*s,49,C.dark);
      rect(c,x+s*row.pytorch_reserved_gib,297,s*m.outside,49,'#ad91bd');
      mono(c,'39.38 GiB',x+row.nvml_device_used_gib*s,283,18,C.ink,'right');
      line(c,[[x+row.pytorch_reserved_gib*s,232],[x+row.pytorch_reserved_gib*s,261]],C.green,1.5,[4,4]);
      line(c,[[x+row.pytorch_reserved_gib*s,288],[x+row.pytorch_reserved_gib*s,348]],C.green,1.5,[4,4]);
    }
    if(delta)words(c,m.outside===null?'Unknown device use  →  unknown difference':`39.38  −  36.70  =  ${f2(m.outside)} GiB outside reserve`,x,405,27,C.ink,{font:'Serif',bold:true});
    foot(c,absent?'Keep the allocator evidence. Leave outside use unknown.':'Match the GPU, partition, scope and time before subtracting.',
      absent?'A failed query supplies no zero.':'Look for ownership in direct CUDA, library allocations and process accounting.');
  }else{
    const s=ringState(k),x=128,y=208,gap=201;
    const readOrder=Boolean(cue(k,3,'Read from the oldest slot'));
    header(c,'Which events will the snapshot keep?','Process P17   /   bounded allocator history   /   four-entry example');
    mono(c,'PHYSICAL SLOT',x,158,15,C.muted);
    for(let i=0;i<s.slots.length;i++){
      const v=s.slots[i],sx=x+i*gap;
      mono(c,'0'+i,sx+51,y-14,16,C.muted,'center');
      rect(c,sx,y,107,89,v==='A'?C.orange:v==null?C.light:C.board);
      words(c,v==null?'·':v,sx+53,y+59,40,v==='A'?C.ink:C.cream,{font:'Mono',align:'center'});
      if(v==='A') mono(c,'OOM',sx+53,y+80,13,C.ink,'center');
      if(readOrder){
        const order=s.retained.indexOf(v)+1;
        const label=order===1?'Read 1  /  oldest':'Read '+order;
        mono(c,label,sx+53,y+130,18,C.green,'center');
      }else if(i===s.pointer){
        line(c,[[sx+52,y+120],[sx+52,y+97]],C.green,3);
        mono(c,'next write',sx+53,y+141,14,C.green,'center');
      }
    }
    if(s.overwritten.length)mono(c,'Overwritten: '+s.overwritten.join('   '),x,391,18,C.rust);
    if(s.saved) foot(c,'Saved dump  /  '+s.retained.join('  →  '),'Restricted incident storage preserves these entries when P17 exits.');
    else if(readOrder) foot(c,'Read from the oldest slot, then wrap to slot 00.','The snapshot preserves events in arrival order.');
    else foot(c,b===2?'Events E and F will need slots.':'The next write replaces the oldest remaining event.',
      'If the ring wrapped, a missing failure record can still correspond to a real alert.');
  }
}

