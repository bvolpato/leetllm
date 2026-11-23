import {
  instructions, replay, hex, contraction, selection, nativeFits, fallbackTarget, capabilityLabel,
  capturedGpu, olderGpu, olderDriver, intervals, warmMs, allocation, lifetimes, spill, requestedBytes,
  mainLine, includeLine, lookup, publication, artifactA, artifactB, access, owners, inputsNki, addOne,
  tile, incrementedTile, tailLength, blockWidth, check,
} from './examples.mjs';

const paper = '#f3efe3', ink = '#163536', muted = '#486260', rule = '#bac7bb';
const deep = '#112e32', rail = '#25454a', light = '#e4f4e6', mint = '#98e1ca', gold = '#ffcc77';
const teal = '#176c66', brick = '#a8462f', lilac = '#b8b7e5', orange = '#ff9870';
const fmt = n => n.toLocaleString('en-US');
const num = n => String(n).replace('-', '−');
const rect = (c,x,y,w,h,color) => { c.fillStyle=color; c.fillRect(x,y,w,h); };
function line(c,x,y,X,Y,color=rule,width=2) {
  c.beginPath(); c.moveTo(x,y); c.lineTo(X,Y); c.lineWidth=width; c.strokeStyle=color; c.stroke();
}
function label(c,str,x,y,size=36,color=ink,face='Sans',weight=400,align='left') {
  c.font=weight+' '+size+'px "Lesson '+face+'"'; c.fillStyle=color; c.textAlign=align;
  c.textBaseline='alphabetic'; c.fillText(String(str),x,y);
}
function mono(c,str,x,y,size=36,color=ink,align='left') {
  label(c,str,x,y,size,color,'Mono',500,align);
}
function arrow(c,x,y,X,Y,color=teal) {
  line(c,x,y,X,Y,color,5);
  const a=Math.atan2(Y-y,X-x);
  for(const d of [-0.55,0.55]) line(c,X,Y,X-18*Math.cos(a+d),Y-18*Math.sin(a+d),color,5);
}
function ground(c,section,heading,context) {
  rect(c,0,0,1920,1080,paper);
  label(c,section,82,72,29,teal,'Mono',600);
  label(c,context,1838,72,29,muted,'Sans',500,'right');
  line(c,82,100,1838,100);
  label(c,heading,80,205,72,ink,'Serif',500);
}
function footer(c,msg,color=muted) {
  line(c,82,870,1838,870);
  label(c,msg,82,928,38,color,'Sans',500);
}
function plate(c,x,y,w,h) {
  rect(c,x+5,y+7,w,h,'#c4ccc0'); rect(c,x,y,w,h,deep);
  for(const dx of [14,w-14]) for(const dy of [14,h-14]){
    c.beginPath(); c.arc(x+dx,y+dy,3.5,0,Math.PI*2); c.fillStyle='#6b8580'; c.fill();
  }
}
function sub(c,text,x,y,color=muted) {label(c,text,x,y,28,color,'Mono',500);}
const ramp=(clock,phrase,duration=0.65)=>clock.reveal(phrase,duration);
const on=(clock,phrase)=>clock.reveal(phrase,0)===1;
const clamp=n=>Math.min(1,Math.max(0,n));
function phraseProgress(clock, phrase) {
  const { start, end } = clock.wordCue(phrase);
  return clock.reveal(phrase, end - start, { captionStart: phrase });
}
const after=(clock,phrase)=>phraseProgress(clock,phrase)===1;

const bitWidth = 29;
const bitX = i => 489 + i * bitWidth + Math.floor(i / 8) * 19;
function word(c,word,y,color,showHex=true) {
  for(let i=0;i<32;i++) {
    const bit=(word>>>(31-i))&1, x=bitX(i);
    const base=y+15, top=base-(bit?54:10);
    rect(c,x,base-62,bitWidth-4,62,rail);
    rect(c,x,top,bitWidth-4,base-top,bit?color:'#72928e');
    rect(c,x,top,bitWidth-4,3,light);
    if(showHex && i%8===0) mono(c,hex(word).slice(i/4,i/4+2),x+3*bitWidth+10,base+40,29,'#cedfd6','center');
  }
}
function copyWord(c, word, progress) {
  if (progress <= 0 || progress >= 1) return;
  const base = 603 + 69 * progress;
  for (let i = 0; i < 32; i++) {
    const high = (word >>> (31 - i)) & 1;
    const height = high ? 20 : 4;
    rect(c, bitX(i), base - height, bitWidth - 4, height, high ? mint : '#769c91');
  }
}
function latch(c,k) {
  const id=k.beat.id;
  const p=id==='store'?ramp(k,'Follow the copy',1.0):id==='evidence'?1:0;
  const v=replay(1,p===1);
  ground(c,'NATIVE TRACE  /  sm_120','When does out[1] change?','CUDA vector add  ·  index 1');
  const active=id==='store'&&on(k,'Follow the copy')||p===1?3:2;
  for(const [i,[offset,op,args]] of instructions.entries()) {
    const x=82+i*446;
    rect(c,x,254,419,115,i===active?teal:'#e0e4d9');
    mono(c,'0x'+offset,x+25,293,25,i===active?light:muted);
    mono(c,op+' '+args,x+25,344,34,i===active?light:ink);
    if(id==='choose' && i<2 && on(k,'Two loads') && !on(k,'The add wrote'))rect(c,x,360,419,9,teal);
  }
  plate(c,82,412,1756,401);
  sub(c,'THREAD 1  /  FP32',120,464,mint);
  sub(c,'GLOBAL MEMORY  /  FP32',120,658,mint);
  line(c,112,609,1808,609,'#426164');
  mono(c,'R9',122,552,66,light); word(c,v.word,521,mint);
  mono(c,num(v.r9),1788,551,63,mint,'right');
  mono(c,'out[1]',122,753,56,light); word(c,v.output,724,p===1?mint:gold);
  mono(c,p===1?num(v.r9):'NaN',1788,753,63,p===1?mint:gold,'right');
  copyWord(c,v.word,p);
  footer(c,p===1?'0x0150   •   Global memory now contains a copy of R9.':
    'R4 = '+v.r4+'     +     R7 = '+num(v.r7)+'     →     R9 = '+num(v.r9)+'     ·     Output initialized to all ones');
}
function file(c,x,y,w,h,tab,lines,accent=teal) {
  rect(c,x+8,y+8,w,h,'#c9cdbf'); rect(c,x,y,w,h,'#fffcf2');
  rect(c,x,y,w,12,accent); sub(c,tab,x+30,y+63,accent);
  line(c,x+30,y+88,x+w-30,y+88);
  lines.forEach((s,i)=>mono(c,s,x+30,y+153+i*68,36,ink));
}
function artifacts(c,k) {
  const id=k.beat.id;
  if(id==='package') {
    ground(c,'OBJECT FILES  /  CUDA','Open the executable. Find the device image.','Captured build  ·  CUDA 13.2');
    file(c,82,331,550,394,'vector_add.cu',['main()','add_kernel(…)']);
    arrow(c,657,524,785,524);
    file(c,820,260,1001,545,'Host executable',['main()   ·   CPU']);
    const extracted=ramp(k,'Select the intended target',1.1);
    rect(c,852,494,921,86,'#e3e7dd'); mono(c,'PTX      compute_90',885,549,39);
    rect(c,852+26*extracted,602+26*extracted,921,100,teal);
    mono(c,'CUBIN    sm_120   /   add_kernel',885+26*extracted,666+26*extracted,38,light);
    footer(c,'cuobjdump   →   inventory and extract      •      nvdisasm   →   inspect the extracted cubin');
  } else if(id==='fused'||id==='disassemble') {
    if (id === 'fused') {
      const caption = 'to count the arithmetic instructions encoded for the target';
      k.reveal(caption, 0, { captionStart: caption });
    }
    const revealResult = (phrase, captionStart = phrase) => {
      const { start, end } = k.wordCue(phrase);
      return k.reveal(phrase, end - start, { captionStart }) === 1;
    };
    const opened = id === 'disassemble' &&
      revealResult('one instruction, FFMA', 'Its listing shows one instruction');
    let lowering = 0;
    if (id === 'disassemble') {
      const phrase = 'one instruction, FFMA';
      const { start } = k.wordCue(phrase);
      lowering = clamp((k.elapsed - start) / 0.65);
    }
    const test=opened&&on(k,'For a rounding check');
    ground(c,'EVIDENCE  /  a × b + c','Which file settles the instruction count?','Illustrative multiply-add build');
    file(c,82,264,800,267,'PTX  /  virtual instructions',contraction.ptx);
    file(c,1015,264,823,267,'Target cubin  /  disassembly',opened?contraction.native:[]);
    if (lowering > 0) {
      const jointX = 944;
      const jointY = 417;
      for (const sourceY of [417, 485]) {
        line(c, 884, sourceY, 884 + (jointX - 884) * lowering,
          sourceY + (jointY - sourceY) * lowering, teal, 5);
      }
      if (opened) arrow(c, jointX, jointY, 1010, jointY);
    }
    if (!opened) label(c, 'Listing closed', 1046, 417, 40, muted);
    if(test) {
      const showProduct = revealResult('halfway between two single-precision floats', 'The exact product lands');
      const showFused = revealResult('The fused result is one');
      const roundFirst = on(k, 'If we round the product first');
      const showSeparate = revealResult('we get zero', 'Subtract that number from itself');
      const round = roundFirst
        ? k.reveal('the nearest-even rule picks', 0.78, { captionStart: 'the nearest-even rule picks' })
        : 0;
      const {factor,addend,exactProduct,roundedProduct,nextFloat,fused,separate}=contraction;
      plate(c,82,572,1756,260);
      sub(c,'FP32   /   '+fmt(factor)+' × '+fmt(factor)+' − '+fmt(-addend),120,628,mint);
      const positions=[946,1253,1560], numbers=[roundedProduct,exactProduct,nextFloat];
      if(showProduct) {
        line(c,positions[0],622,positions[2],622,light,3);
        positions.forEach((x,i)=>{
          line(c,x,612,x,632,i===1?gold:mint,5);
          mono(c,fmt(numbers[i]),x,601,27,i===1?gold:mint,'center');
        });
        const x = positions[1] + (positions[0] - positions[1]) * round;
        if (round > 0) line(c, positions[1], 641, x, 641, orange, 4);
        c.beginPath();
        c.arc(x, 641, 8, 0, Math.PI * 2);
        c.fillStyle = round > 0 ? orange : gold;
        c.fill();
      }
      if(showProduct) {
        mono(c,'Exact product',122,710,37,light);
        mono(c,fmt(exactProduct)+' − '+fmt(-addend),610,710,40,light);
        if(showFused) mono(c,'= '+fused,1694,710,48,mint,'right');
      }
      if(roundFirst) {
        mono(c,'Rounded product',122,791,37,light);
        if (round === 1) mono(c,fmt(roundedProduct)+' − '+fmt(-addend),610,791,40,light);
        if(showSeparate) mono(c,'= '+separate,1694,791,48,gold,'right');
      }
    }
    let note='No explicit PTX rounding modifiers   ·   This build permits contraction.';
    if(opened) {
      note=contraction.native.length+' encoded arithmetic instruction   ·   FFMA rounds the combined result once.';
      if(on(k,'If two listings')) note='Rounding conflict? Verify the build, target image and kernel for both listings.';
      if(on(k,'Compare the kernel output')) note='Check the numerical result against the intended reference. Measure elapsed time on the target.';
    }
    line(c, 82, 851, 1838, 851);
    label(c, note, 82, 893, 34, muted, 'Sans', 500);
  } else {
    const hi=id==='capture'?2:on(k,'The target assembler')?3:on(k,'PTX spells')?2:0;
    ground(c,'DISASSEMBLY  /  add_kernel','Follow one lane through the listings.','PTX schematic  ·  captured native excerpts');
    plate(c,82,271,1756,536);
    const cols=[125,651,1157];
    ['Source operation','Virtual PTX','Native  /  sm_120'].forEach((v,i)=>sub(c,v,cols[i],337,mint));
    const a=['a = x[i]','b = y[i]','s = a + b','out[i] = s'];
    const p=['ld.global.f32','ld.global.f32','add.f32','st.global.f32'];
    instructions.forEach(([offset,op,args],i)=>{
      const y=425+i*94;
      if(i===hi)rect(c,105,y-59,1710,82,'#2f5353');
      mono(c,a[i],cols[0],y,42,light); mono(c,p[i],cols[1],y,42,light);
      mono(c,offset+'  '+op+' '+args,cols[2],y,34,i===hi?gold:light);
    });
    footer(c,id==='capture'?'Assembler report   ·   12 registers/thread   ·   stack 0 B   ·   spill loads and stores 0 B':'PTX names virtual values. The cubin records the instructions for this build.');
  }
}
function ptxComparison(c,k) {
  const answer = k.beat.id === 'ptx-limits';
  const showOlder = answer || on(k,'Try a different GPU');
  const showDriver = answer && on(k,'This driver reads only older');
  const driverResult = answer && on(k,'It rejects');
  const target = 'compute_' + fallbackTarget;
  const minimum = capabilityLabel(fallbackTarget);
  ground(c, 'IMAGE SELECTION  /  FORCED PTX', 'Can this driver compile for this GPU?', 'Build B  ·  same ordinary PTX');
  plate(c,82,284,1756,513);
  sub(c,'CASE',124,360,mint); sub(c,'GPU CAPABILITY',564,360,mint);
  sub(c,'DRIVER READS THIS ISA?',970,360,mint); sub(c,'FORCED RUN',1500,360,mint);
  const rows = [['Captured B', capturedGpu, true]];
  if (showOlder) rows.push(['What if: GPU', olderGpu, answer]);
  if (showDriver) rows.push(['What if: driver', olderDriver, driverResult]);
  rows.forEach(([name, device, resolved],i)=>{
    const y = 463 + 130*i;
    const fits = device.capability >= fallbackTarget;
    const compiles = selection(90,fallbackTarget,'force PTX',device) === 'Compile PTX, then load';
    line(c,116,y-68,1792,y-68,rail,2);
    label(c,name,124,y,41,light);
    const relation = resolved ? (fits ? ' ≥ ' : ' < ') + minimum : '';
    mono(c,capabilityLabel(device.capability) + relation,564,y,44,resolved && !fits ? orange : light);
    mono(c,device.readsIsa ? 'Yes' : 'No',970,y,44,device.readsIsa ? light : orange);
    mono(c,resolved ? (compiles ? 'Passed' : 'Blocked') : '?',1500,y,45,resolved ? (compiles ? mint : orange) : gold);
  });
  if (answer && on(k,'Architecture-specific')) {
    footer(c,'Ordinary '+target+' needs GPU '+minimum+' or later. Suffixes such as 90a and 100f have their own rules.');
  } else {
    footer(c,'Ordinary '+target+' requires GPU '+minimum+' or later and a driver that reads the emitted PTX ISA.');
  }
}
function loader(c,k) {
  const id=k.beat.id;
  if (id==='ptx-older' || id==='ptx-limits') return ptxComparison(c,k);
  const removed=id==='strip';
  const swapped=removed || id==='jit' || (id==='swap' && on(k,'Change just'));
  const cubin=swapped?90:120, image='sm_'+cubin, target='compute_'+fallbackTarget;
  const forced=(id==='ptx-control' || id==='swap') ? on(k,'force the PTX path') : id==='jit';
  const mode=removed?'normal':forced?'force PTX':'native only';
  const provedIsa=id==='ptx-control' ? on(k,'This run passes') : ['swap','jit'].includes(id);
  const showMinimum=!removed && (id!=='native' || on(k,'Compute ninety requires'));
  let resolved=false;
  if (mode==='native only') {
    resolved=swapped ? on(k,'The native-only run stops') : (id!=='native' || on(k,'Native-only mode passes'));
  } else if (removed) {
    resolved=on(k,'It stops');
  } else {
    resolved=id==='jit' || (id==='ptx-control' && provedIsa);
  }
  const verdict=selection(cubin,removed?null:fallbackTarget,mode,capturedGpu);
  const deviceLabel=capabilityLabel(capturedGpu.capability);
  ground(c,'IMAGE SELECTION  /  GPU '+deviceLabel,'Which image can reach the device?','Captured runs  ·  fresh processes');
  file(c,82,277,607,484,swapped?'Build B  /  packaged images':'Build A  /  packaged images',[image+' cubin',removed?'PTX removed':target+' PTX']);
  sub(c,'PROCESS MODE',118,603); mono(c,mode,118,671,46);
  if (id==='ptx-control' && on(k,'turn off')) label(c,'Driver disk cache off',118,725,32,muted);
  const nativeStatus=forced?'bypassed':nativeFits(cubin,capturedGpu.capability)?'compatible':'incompatible';
  const ptxStatus=removed?'no PTX':mode==='native only'?'JIT disabled':resolved?'compiled':'forced JIT';
  const paths=[['Native image',image,nativeStatus],['PTX fallback',removed?'absent':target,ptxStatus]];
  for(const [i,[name,tag,status]] of paths.entries()) {
    const y=348+i*239, chosen=resolved&&((i===0&&verdict.startsWith('Load'))||(i===1&&verdict.startsWith('Compile')));
    line(c,688,y+64,805,y+64,chosen?teal:rule,6);
    rect(c,806,y-24,662,168,chosen?teal:'#e0e6db');
    sub(c,name,838,y+22,chosen?light:muted);
    if (i===0 && forced && swapped) label(c,'Native-only run failed',1440,y+22,28,muted,'Sans',500,'right');
    mono(c,tag,838,y+96,43,chosen?light:ink);
    label(c,status,1440,y+94,30,chosen?light:muted,'Sans',500,'right');
    line(c,1468,y+64,1590,y+64,chosen?teal:rule,6);
    if(chosen)arrow(c,1530,y+64,1590,y+64,teal);
  }
  plate(c,1595,320,239,396); mono(c,'GPU',1714,475,58,mint,'center');
  mono(c,deviceLabel,1714,562,49,light,'center');
  if (showMinimum) mono(c,'Ordinary '+target+'   ·   GPU ≥ '+capabilityLabel(fallbackTarget),82,830,35,ink);
  if (provedIsa) label(c,'Build A forced PTX   ·   Driver read this ISA',1838,830,35,teal,'Sans',500,'right');
  let result='Trace the package through this process mode.';
  if (id==='swap' && forced) result='Same PTX, GPU and driver. Will build B run the addition?';
  if (resolved) {
    const note=removed?'No kernel counters exist for this attempt.':verdict==='Stop before launch'?'PTX compilation is disabled.':'The captured boundary tests passed.';
    result=verdict+'   ·   '+note;
  }
  footer(c,result,resolved && verdict==='Stop before launch'?brick:teal);
}
const clockColors=[mint,lilac,orange,gold,'#ecead2'];
function clockRow(c,native,y,revealTotal,fraction=1,collapse=1) {
  const parts=intervals(native), end=parts.at(-1).end, x=345, scale=17.3;
  mono(c,native?'Native':'PTX JIT',120,y+38,39,light);
  c.save(); c.beginPath(); c.rect(x,y,78*scale*fraction,60); c.clip();
  parts.forEach(({start,duration},i)=>{
    if(duration) {
      const movingStart=start+(native&&i>2?60*(1-collapse):0);
      rect(c,x+movingStart*scale,y,duration*scale-2,58,clockColors[i]);
    }
  });
  c.restore();
  if(revealTotal) mono(c,fmt(end)+' ms',x+end*scale,y+106,40,gold,'right');
}
function clockPlot(c,k) {
  const id=k.beat.id, replayed=['clock-result','warm'].includes(id);
  const revealNative=id==='warm'?1:id==='clock-result'?ramp(k,'Take out',1.0):0;
  ground(c,'REQUEST TRACE  /  illustrative','Time the first request from its arrival.','Fresh process  ·  sequential intervals');
  plate(c,82,268,1756,557);
  for(const [i,part] of intervals(false).entries()) {
    const x=120+i*340; rect(c,x,321,20,21,clockColors[i]); sub(c,part.name,x+34,341,light);
    mono(c,part.duration+' ms',x+34,407,41,light);
  }
  let cold=1;
  if(id==='cold') {
    const cues=['Initialization takes','module loading','PTX compilation','application cache publication','and the first launch'];
    cold=intervals(false).reduce((end,phase,i)=>end+phase.duration*ramp(k,cues[i],0.55),0)/78;
  }
  clockRow(c,false,480,id!=='cold'||k.elapsed>=k.speechDuration,cold);
  if(id!=='cold') {
    if(replayed && (id==='warm'||on(k,'Take out')))clockRow(c,true,653,revealNative===1,1,revealNative);
    else {mono(c,'Native',120,690,39,light); line(c,345,683,1695,683,'#557274'); mono(c,'?',355,670,40,gold);}
  }
  if(id==='warm' && on(k,'Give that interval')) {
    rect(c,1131,633,624,155,rail);
    sub(c,'WARM  /  SEPARATE TIMER',1160,678,mint);
    line(c,1160,724,1420,724,mint,8);
    for(const x of [1160,1420])line(c,x,709,x,739,mint,4);
    mono(c,warmMs+' ms',1481,741,46,light);
    footer(c,'Synchronized after warmup   ·   Record the exact specialization and timer scope.');
  }
  else footer(c,'Same scale for both cold paths   ·   Application cache publication costs 2 ms on each path.');
}

function warp(c,a) {
  sub(c,'ONE WARP  /  32 THREADS',90,287);
  mono(c,a.registers+' regs/thread',90,359,54);
  mono(c,fmt(a.requested)+' requested',90,424,37,muted);
  for(let j=0;j<a.units;j++) {
    const x=668+j*145, used=clamp((a.requested-256*j)/256);
    rect(c,x,312,132,70,'#d3dcd0'); rect(c,x,312,132*used,70,teal);
    mono(c,'256',x+66,425,29,ink,'center');
  }
  sub(c,'ALLOCATION',1620,292);
  mono(c,fmt(a.perWarp),1620,359,48);
  sub(c,'regs/warp',1620,423);
}
function registerFile(c,k) {
  const id=k.beat.id;
  const extra=id==='grow'&&on(k,'Give each thread');
  const original=allocation(32);
  let demand=32;
  if(extra||id==='repack')demand=33;
  if(id==='plateau')demand=on(k,'the warp needs a sixth unit')?41:40;
  const a=allocation(demand);
  const compareOld=id==='grow'||id==='repack'&&!on(k,'Pack them');
  const packed=compareOld?original:a;
  let packing=1;
  if(id==='pack')packing=ramp(k,'Pack the blocks',1.5);
  if(id==='repack'&&!compareOld)packing=ramp(k,'Pack them',1.0);
  const filled=Math.round(packed.blocks*packing);
  const x0=250, dx=42, y0=566, dy=24;
  const capacity=original.blocks*original.perBlock+original.free;
  const columnRegisters=packed.perBlock/packed.units;
  const registerColumns=capacity/columnRegisters;
  const capacityX=x0+registerColumns*dx;
  const showWarps=id==='repack'&&after(k,"seventy-five percent of the model's limit");
  const showGap=id==='repack'&&after(k,'The gap holds four thousand ninety-six registers');
  const showCandidate=id==='repack'&&on(k,'A seventh block needs');
  const slide=id==='repack'?ramp(k,'A seventh block needs',1.2):0;
  const compareCandidate=id==='repack'&&after(k,'A seventh block needs all ten thousand two hundred forty');
  ground(c,'RESIDENCY  /  simplified model','Pack the register file in whole blocks.','256 registers per allocation unit');
  warp(c,a);
  plate(c,82,475,1756,367);
  sub(c,(compareOld?'PREVIOUS PACKING':'REGISTER FILE')+'   /   '+packed.registers+' REGISTERS PER THREAD',120,531,mint);
  mono(c,fmt(capacity)+' registers',capacityX,531,30,light,'center');
  if((id==='repack'&&!compareOld)||id==='plateau') {
    mono(c,'at 32',128,557,24,light);
    for(let b=0;b<original.blocks;b++)rect(c,x0+b*original.units*dx,543,original.units*dx-7,13,b%2?'#9d9dbc':'#7ba99b');
  }
  mono(c,'8 warps',115,y0+82,25,light); mono(c,'/ block',115,y0+119,25,light);
  for(let b=0;b<registerColumns;b++)for(let w=0;w<8;w++) {
    const index=Math.floor(b/packed.units);
    const edge=(b+1)%packed.units===0;
    const color=index<filled?(index%2?lilac:mint):showGap?'#705a40':rail;
    rect(c,x0+b*dx,y0+w*dy,dx-(edge?7:2),dy-3,color);
  }
  for(let b=0;b<filled;b++)mono(c,'B'+(b+1),x0+(b+0.5)*packed.units*dx-3,797,29,light,'center');
  if (showCandidate) {
    const gapX=x0+packed.blocks*packed.units*dx;
    const candidateX=gapX+(capacityX+25-gapX)*(1-slide);
    for(let u=0;u<packed.units;u++)for(let w=0;w<8;w++) {
      const x=candidateX+u*dx, y=y0+w*dy;
      const outside=Math.max(x,capacityX);
      if(outside<x+dx-2)rect(c,outside,y,x+dx-2-outside,dy-3,'#775844');
      rect(c,x,y,dx-2,3,gold);
    }
    mono(c,'Block '+(packed.blocks+1),candidateX+packed.units*dx/2,797,32,gold,'center');
  }
  line(c,capacityX,542,capacityX,760,light,4);
  if(compareOld && demand!==32)footer(c,'New block   ·   8 × '+fmt(a.perWarp)+' = '+fmt(a.perBlock)+' registers. How many fit in 65,536?');
  else if(id==='pack' && packing<1)footer(c,'65,536 registers   ·   64-warp limit   ·   8 warps must enter together.');
  else if(compareCandidate)footer(c,'Block '+(packed.blocks+1)+' needs '+fmt(packed.perBlock)+' registers. The gap has '+fmt(packed.free)+'.',brick);
  else if(id==='repack') {
    const warps=showWarps?'   ·   '+packed.warps+' / 64 resident warps':'', gap=showGap?'   ·   '+fmt(packed.free)+' registers free':'';
    footer(c,compareOld?'The original packing used all '+fmt(capacity)+' registers.':filled+' blocks packed'+warps+gap,teal);
  }
  else footer(c,filled+' blocks packed   ·   '+(filled*8)+' / 64 warps   ·   '+fmt(65536-filled*packed.perBlock)+' registers free');
}
function pressure(c,k) {
  const id=k.beat.id;
  if(id==='lifetimes') {
    const extended=on(k,"Now A"),v=lifetimes(extended);
    ground(c,'REGISTER PRESSURE  /  live ranges','Which values need space at the same time?','Illustrative instruction sequence');
    plate(c,82,284,1756,523);
    for(let i=0;i<8;i++) {
      const x=408+i*174; mono(c,i,x,363,34,light,'center'); line(c,x,394,x,761,rail,3);
    }
    v.spans.forEach(([start,end],i)=>{
      const y=444+i*120, x=408+start*174;
      mono(c,['A','B','C'][i],156,y+32,49,light);
      rect(c,x-50,y-18,(end-start)*174+100,60,[mint,lilac,gold][i]);
      for(let j=start;j<=end;j++)rect(c,408+j*174-4,y+5,8,8,deep);
    });
    footer(c,'Inclusive live ranges   ·   Peak overlap = '+v.peak+' values');
  } else {
    const solved=id==='requests'&&on(k,'Count both');
    ground(c,'SPILL TRAFFIC  /  one thread','Count each trip through the loop.','Illustrative executed loop');
    plate(c,82,306,1756,434);
    mono(c,'Register',183,530,56,mint); mono(c,'Local memory',1710,530,50,gold,'right');
    arrow(c,581,438,1277,438,mint); arrow(c,1277,600,581,600,gold);
    mono(c,spill.write+' B store',919,411,38,light,'center'); mono(c,spill.read+' B load',919,661,38,light,'center');
    if(solved) {
      for(let i=0;i<spill.repeats;i++)rect(c,122+83*i,782,72,36,i%2?'#57968a':teal);
    } else sub(c,'× '+spill.repeats+' ITERATIONS',85,811);
    footer(c,solved?'('+spill.write+' + '+spill.read+') B × '+spill.repeats+' = '+requestedBytes(spill)+' requested bytes/thread   ·   Profile cache misses and elapsed time.':'What byte count follows from the executed accesses?');
  }
}
function imageRun(c,y,name,image,showResult) {
  sub(c,name,109,y+41);
  if(!image) {mono(c,'Miss  ·  rebuild needed',497,y+47,38,muted); return;}
  rect(c,500,y-15,426,97,deep);
  mono(c,'scale = '+image.image,544,y+48,43,mint);
  arrow(c,947,y+33,1098,y+33);
  mono(c,'('+4+' + '+5+') × '+image.image,1136,y+49,40);
  if(showResult) {
    arrow(c,1426,y+33,1520,y+33);
    rect(c,1553,y-15,246,97,teal); mono(c,image.result,1675,y+52,59,light,'center');
  }
}
function cache(c,k) {
  const id=k.beat.id, edited=id!=='original';
  const shownStale=id==='stale'&&on(k,'The image contains')||['rebuild','contracts'].includes(id);
  const miss=id==='stale'&&on(k,'The changed dependency')||['rebuild','contracts'].includes(id);
  const rebuilt=id==='rebuild'&&on(k,'Follow the new')||id==='contracts';
  const first=lookup(1,true), stale=lookup(2,false), current=lookup(2,true);
  if(id==='contracts') {
    ground(c,'BUILD MANIFEST  /  scaled add','What identifies the requested build?','Illustrative key prefixes');
    file(c,82,282,855,475,'Main-file identity',['scale 1   '+lookup(1,false).key.slice(0,12),'scale 2   '+stale.key.slice(0,12),'cached image   ×1 → 9']);
    file(c,971,282,864,475,'Recipe with header',['scale 1   '+first.key.slice(0,12),'scale 2   '+current.key.slice(0,12),'rebuilt image   ×2 → 18']);
    footer(c,'Before loading   ·   Validate the actual bytes and check compatibility with the deployment GPU.');
    return;
  }
  ground(c,'SPECIALIZATION  /  scaled add','Which multiplier did the cache return?','Fixture inputs  ·  x = 4, y = 5');
  file(c,82,270,1030,277,'vector_add.cu',[includeLine,mainLine]);
  file(c,1150,270,685,277,'scale.cuh',['#define SCALE '+(edited?2:1)],edited?brick:teal);
  if(id==='original') {
    imageRun(c,635,'First compile',first,on(k,'Save that image'));
    footer(c,'The compiler substitutes the header value into the image.');
  } else {
    imageRun(c,604,'Main-file key',stale,shownStale);
    if(miss)imageRun(c,751,'Dependency key',rebuilt?current:null,rebuilt);
    if(rebuilt)footer(c,'Same main file and inputs   ·   Rebuilding with the new header changes the stored value.');
    else if(miss)footer(c,'The full recipe misses on the edited header. What will the new image write?');
    else footer(c,shownStale?'The main-file key retrieved the same image. Its scale is still 1.':
      'The original build wrote 9. Replay its compiled image after the header edit.');
  }
}
function byteRow(c,x,y,bytes,color,count=bytes.length) {
  for(let i=0;i<bytes.length;i++) {
    rect(c,x+i*89,y,77,64,i<count?color:rail);
    if(i<count)mono(c,bytes[i].toString(16).padStart(2,'0').toUpperCase(),x+i*89+38,y+45,34,deep,'center');
  }
}
function publish(c,k) {
  const id=k.beat.id;
  if(id==='private') {
    const fill=ramp(k,'Watch one worker',3.0),closed=on(k,'Close and validate'),switched=on(k,'publish the complete');
    ground(c,'PUBLICATION  /  same filesystem','What can a reader open during a write?','Eight-byte illustrative artifacts');
    plate(c,82,290,1756,497);
    const rows=[['Private B',artifactB,Math.floor(8*fill),mint],['Public name',switched?artifactB:artifactA,8,gold]];
    rows.forEach(([name,bytes,count,color],i)=>{
      const y=366+214*i;
      mono(c,name,137,y+51,45,light);
      if(!switched||i===1)byteRow(c,578,y,bytes,color,count);
      else mono(c,'renamed',578,y+46,37,mint);
      mono(c,i===0?(switched?'moved':closed?'closed':count+' / 8'):(switched?'B':'A'),1688,y+51,42,color,'right');
    });
    footer(c,switched?'One rename changes the public name from complete A to complete B.':
      closed?'The new bytes are complete and private. The public name still opens A.':'The public name stays on A while B is under construction.');
  } else if(id==='lock') {
    const owns=on(k,'After acquiring'),hit=on(k,'The second worker');
    ground(c,'COOPERATION  /  exact recipe K','Who compiles after a shared cache miss?','Two writers  ·  cooperating lock');
    plate(c,82,300,1756,456);
    for(const [i,title] of ['Writer 1','Writer 2'].entries())mono(c,title,136,447+i*187,44,light);
    const x=478;
    rect(c,x,373,787,102,teal); mono(c,'lock  →  build  →  publish K',x+35,438,38,light);
    rect(c,x,560,787,102,rail); mono(c,'wait for the same lock',x+35,625,38,light);
    if(owns){arrow(c,1284,610,1370,610,mint); mono(c,hit?'reuse K':'recheck K',1400,624,38,mint);}
    footer(c,'Shared visibility and matching recipe are both required for reuse.');
  } else {
    const swapped=id==='reject'||on(k,'The writer stops');
    const compared=id==='reject'&&on(k,'They differ');
    const pair=publication(swapped);
    ground(c,'ARTIFACT GROUP  /  one reader','Do the complete files belong together?','SHA-256 prefixes shown');
    plate(c,82,284,1756,525);
    sub(c,'KERNEL BYTES',132,354,mint); mono(c,swapped?'B':'A',139,465,81,light);
    byteRow(c,350,399,pair.bytes,mint);
    mono(c,pair.actual.slice(0,12),1777,459,51,mint,'right');
    line(c,113,531,1807,531,rail,4);
    sub(c,'MANIFEST',132,605,gold); mono(c,'A',139,723,81,light);
    label(c,'Expected kernel digest',350,707,42,light);
    mono(c,pair.expected.slice(0,12),1777,707,51,gold,'right');
    footer(c,compared&&!pair.matches?'Reject this pair   ·   Recover bytes and metadata for the intended recipe.':
      swapped?'The writer stopped between the two replacements. Compare the digests.':'Start with the kernel and manifest for build A.',compared?brick:muted);
  }
}

function ownership(c,k) {
  const id=k.beat.id;
  if(id==='ten'||id==='eight-nine') {
    const a=access(10,4,false),resolved=id==='eight-nine'&&on(k,'Ten and eleven');
    ground(c,'INDEX OWNERSHIP  /  width 4','Who may access the final block?','10 outputs  ·  zero-based indices');
    plate(c,82,283,1756,515);
    const x=242,dx=124;
    for(let b=0;b<a.count;b++) {
      const bx=x+b*dx*4;
      sub(c,'BLOCK '+b,bx,360,mint);
      line(c,bx,382,bx+dx*4-18,382,'#69877c',3);
    }
    sub(c,'i',135,476,light); sub(c,'out',120,669,light);
    a.lanes.forEach(({i,exists},j)=>{
      const xx=x+j*dx;
      const final=j>=8,color=final&&resolved?(exists?mint:orange):light;
      mono(c,i,xx+47,479,46,color,'center');
      if(exists) {
        rect(c,xx,591,98,116,rail);
        mono(c,i,xx+49,667,40,light,'center');
      }
      if(final&&resolved) {
        if(exists)arrow(c,xx+49,492,xx+49,579,mint);
        else {line(c,xx+31,525,xx+65,559,orange,5);line(c,xx+31,559,xx+65,525,orange,5);}
      }
    });
    footer(c,resolved?'Mask both loads and the store   ·   2 valid + 2 masked in block 2.':'Last block starts at 8   ·   Choose the indices that satisfy i < 10.');
  } else if(id==='lower') {
    const emitted=on(k,'But its PTX');
    ground(c,'LOWERING  /  captured Triton build','Follow two adjacent values into PTX.','Four warps × 32 threads × 2 floats');
    const stages=['Triton IR','GPU IR','LLVM IR','PTX','cubin'];
    stages.forEach((s,i)=>{
      const x=82+i*359; rect(c,x,282,319,92,(emitted?3:1)===i?teal:'#dce4d8');
      mono(c,s,x+160,342,36,(emitted?3:1)===i?light:ink,'center');
      if(i<4)arrow(c,x+324,329,x+351,329,muted);
    });
    plate(c,82,423,846,371);
    sub(c,'GPU LAYOUT  /  BLOCK 0',122,487,mint);
    for(const [i,y] of [578,704].entries()){
      mono(c,'Thread '+i,122,y,38,light);
      owners(i,2).forEach((v,j)=>{rect(c,524+j*140,y-57,118,80,i?lilac:mint);mono(c,v,582+j*140,y,43,deep,'center');});
    }
    if(emitted) {
    file(c,1001,423,833,388,'PTX excerpt  /  x addresses',['@p0   ld.global.b32','      x + 0 bytes','@p1   ld.global.b32','      x + 4 bytes']);
    } else {
      sub(c,'TARGET QUESTIONS',1022,524);
      label(c,'Which loads carry those values?',1022,621,44,ink,'Serif',500);
    }
    footer(c,'Inspect the native cubin for encoded access widths. Measure transactions and bandwidth on the GPU.');
  } else {
    ground(c,'ALIGNMENT  /  four FP32 values','Does this layout imply a 16-byte load?','Illustrative base address');
    const x=188, dx=89;
    plate(c,82,304,1756,470);
    for(let i=0;i<=16;i++) {
      const xx=x+i*dx;
      line(c,xx,469,xx,603,i%4===0?light:'#51706c',i%4===0?4:2);
      if(i%4===0)mono(c,'+'+(i*4)+' B',xx,422,32,light,'center');
    }
    owners(0,4).forEach((v,j)=>{rect(c,x+(j+1)*dx+3,497,dx-5,72,mint);mono(c,v,x+(j+1.5)*dx,546,35,deep,'center');});
    line(c,x+dx,608,x+5*dx,608,gold,5);
    mono(c,'16 B span',x+3*dx,683,38,gold,'center');
    mono(c,'start = boundary + 4 B',x+7*dx,683,39,light);
    footer(c,'Only the ownership and addresses follow from this layout.');
  }
}
function tensor(c,x,y,step,colorAt,numberAt=(i)=>i) {
  for(let i=0;i<16;i++) {
    const xx=x+(i%4)*step, yy=y+Math.floor(i/4)*step;
    rect(c,xx,yy,step-7,step-7,colorAt(i));
    mono(c,numberAt(i),xx+(step-7)/2,yy+0.64*step,Math.floor(step*0.39),deep,'center');
  }
}
function surfaces(c,k) {
  const id=k.beat.id;
  if(id==='neuron') {
    const moved=ramp(k,'Carry the four inputs',0.9);
    const computed=on(k,'then write them');
    const stored=ramp(k,'write them back',1.0);
    ground(c,'HARDWARE CONTROL  /  AWS Neuron','Who moves data into the on-chip buffer?','NKI  ·  teaching tile');
    const positions=[84,696,1306],names=['HBM input','SBUF','HBM output'];
    const out=addOne(inputsNki);
    positions.forEach((x,i)=>{
      plate(c,x,329,524,407); sub(c,names[i],x+37,415,i===1?gold:mint);
      for(let j=0;j<4;j++){
        const xx=x+38+j*115;
        rect(c,xx,513,101,106,rail);
        const contents=i===0?inputsNki:i===1&&moved===1?(computed?out:inputsNki):i===2&&stored===1?out:null;
        if(contents)mono(c,contents[j],xx+50,584,55,i===1?gold:mint,'center');
      }
    });
    if(moved>0)arrow(c,616,543,679,543,teal);
    if(stored>0)arrow(c,1228,543,1290,543,teal);
    footer(c,stored===1?'The author chose the placement, engine operation and destination.':'HBM → SBUF    ·    engine adds 1    ·    SBUF → HBM output');
  } else {
    const titles={surfaces:'Who maps this tile to threads?',cute:'Who chooses the hardware atom?',pallas:'Which slice belongs to program zero?'};
    const mode=id==='surfaces'?(on(k,'CUDA Tile')?'CUDA Tile':on(k,'Triton lets')?'Triton':'CUDA C++'):id==='cute'?'CUTLASS / CuTe':'JAX Pallas';
    ground(c,'AUTHORING SURFACES  /  4 × 4 tile',titles[id],'Six control contracts');
    plate(c,82,276,769,552); sub(c,'LOGICAL VALUES',123,341,mint);
    const colors=[mint,lilac,gold,orange];
    const sliceVisible=id==='pallas'&&on(k,'Which transformations');
    const choose=i=>mode==='CUDA C++'?(i===6?gold:'#91aaa4'):mode==='CUTLASS / CuTe'?colors[Math.floor(i/8)*2+Math.floor(i%4/2)]:
      mode==='JAX Pallas'?(sliceVisible&&Math.floor(i/4)<2&&i%4<2?gold:'#91aaa4'):mint;
    tensor(c,275,391,98,choose,i=>tile[i]);
    label(c,mode,939,415,69,teal,'Serif',500);
    const lines={
      'CUDA C++':['One thread calculates','its address and predicate.'],
      Triton:['One blocked program supplies','offsets and a mask.'],
      'CUDA Tile':['You specify the operation','on an immutable tile per block.'],
      'CUTLASS / CuTe':['Choose a hierarchical layout.','Select copy and MMA atoms.'],
      'JAX Pallas':['BlockSpec selects a slice','of a reference for each program.'],
    }[mode];
    if(mode==='CUDA Tile'&&on(k,'The new tile')) {
      sub(c,'ORIGINAL + 1',946,486);
      tensor(c,947,522,68,()=>gold,i=>incrementedTile[i]);
      label(c,'Result tile',1282,683,48,ink,'Serif',500);
    } else lines.forEach((s,i)=>label(c,s,943,533+i*75,50,ink));
    let surfaceNote='Start with framework operations. Choose a lower layer when you need its controls.';
    if(mode==='CUDA C++') surfaceNote='CUDA C++   ·   The author computes the index for each thread.';
    if(mode==='Triton' && on(k,'Its compiler maps')) surfaceNote='The Triton compiler maps the offsets of the block program to threads.';
    if(mode==='CUDA Tile') surfaceNote=on(k,'The CUDA Tile compiler')?
      'You specify the block operation. The CUDA Tile compiler maps it to threads within the block.':
      'Block operation   ·   Add one to each tile element.';
    footer(c,mode==='JAX Pallas'?(sliceVisible?'Here the upper-left 2 × 2 slice belongs to grid program (0, 0).':'2 × 2 grid of programs   ·   Each program owns one 2 × 2 slice in grid order.'):
      mode==='CUTLASS / CuTe'?'Illustrative 2 × 2 grouping   ·   Check the target layout and emitted matrix instructions.':
      surfaceNote);
  }
}
function finalStore(c,k) {
  const index=tailLength-1, block=Math.floor(index/blockWidth), thread=index%blockWidth;
  const hasSum=after(k,'our inputs add to one hundred ninety-four');
  const missed=after(k,'In a missed-store replay the NaN survives');
  const progress=phraseProgress(k,'Replay with the store');
  const stored=progress===1;
  const matched=after(k,'The word now matches the reference');
  const v=replay(index,stored);
  ground(c,'CORRECTNESS  /  final partial block','Check the last output word.','Test design  ·  illustrative readback');
  plate(c,82,281,1756,548);
  sub(c,'BLOCK '+block+'   /   THREAD '+thread+'   /   INDEX '+index+'   /   GUARD   '+index+' < '+tailLength,126,340,mint);
  mono(c,'Inputs   '+v.r4+' + '+v.r7,126,407,42,light);
  mono(c,hasSum?'Reference   '+v.r9:'Reference',1788,407,42,light,'right');
  line(c,112,430,1808,430,rail,3);
  line(c,112,609,1808,609,rail,3);
  mono(c,'Thread sum',122,551,45,light);
  if(hasSum) {
    word(c,v.word,521,mint);
    mono(c,v.r9,1788,551,59,mint,'right');
  }
  mono(c,'out['+index+']',122,753,49,light);
  word(c,v.output,724,stored?mint:gold);
  mono(c,stored?v.r9:'NaN',1788,753,59,stored?mint:gold,'right');
  copyWord(c,v.word,progress);
  const status=matched?'Store replay   ·   finite output matches the reference':
    stored?'Store replay   ·   the word reached global memory':
    progress>0?'Store replay   ·   copying the thread word to global memory':
    missed?'Skipped store   ·   initialized NaN fails the finite check':
    'On target   ·   compare every slot with its reference and run memcheck on length '+tailLength+'.';
  footer(c,status,stored?teal:missed&&progress===0?brick:muted);
}
function boundary(c,k) {
  const id=k.beat.id;
  if(id==='finish')return finalStore(c,k);
  const full=id==='whole'||(id==='partial'&&!on(k,'A seventh block'));
  const n=full?tailLength-1:tailLength;
  const strict=id==='strict'&&after(k,'Use strictly less than');
  const inclusive=!strict;
  const a=access(n,blockWidth,inclusive),first=(a.count-1)*blockWidth;
  const reveal=id==='strict'||(id==='overrun'&&after(k,'Index seven hundred sixty-nine'));
  const known=full||reveal;
  ground(c,'BOUNDARY TEST  /  CPU enumeration','Which threads may access memory?','Vector add  ·  '+blockWidth+' positions per block');
  mono(c,'n = '+n,83,306,49); mono(c,'Guard   i '+(inclusive?'≤':'<')+' n',676,306,49);
  mono(c,a.count+' blocks',1832,306,49,teal,'right');
  const width=1746/a.count;
  for(let i=0;i<a.count;i++) {
    const x=83+i*width;
    rect(c,x,348,width-8,87,i===a.count-1?teal:'#d6dfd4');
    mono(c,i*blockWidth+'…'+((i+1)*blockWidth-1),x+(width-8)/2,405,32,i===a.count-1?light:ink,'center');
  }
  plate(c,82,479,1756,352);
  sub(c,'BLOCK '+(a.count-1)+'  /  LOCAL THREADS 0–'+(blockWidth-1),121,536,mint);
  const dx=29,dy=27,left=141,top=568;
  for(const lane of a.lanes.slice(first)) {
    const j=lane.i-first,color=!known?'#67817d':!lane.admit?rail:lane.exists?mint:orange;
    rect(c,left+(j%32)*dx,top+Math.floor(j/32)*dy,dx-4,dy-4,color);
  }
  const indexX=1130, slotX=1370, guardX=1650;
  sub(c,'GLOBAL INDEX',indexX,541,mint);
  sub(c,'OUTPUT SLOT',slotX,541,mint);
  sub(c,'GUARD',guardX,541,mint);
  for(let j=0;j<3;j++) {
    const l=a.lanes[first+j],y=601+j*74;
    const blocked=!l.admit, invalid=l.admit&&!l.exists;
    mono(c,l.i,indexX,y,42,known&&invalid?orange:light);
    mono(c,l.exists?'out['+l.i+']':'no slot',slotX,y,39,l.exists?light:gold);
    mono(c,known?(blocked?'Skip':'Pass'):'?',guardX,y,39,!known?light:invalid?orange:blocked?'#a7bfbb':mint);
  }
  let summary='Predict which indices the inclusive guard will admit.';
  if(full)summary=blockWidth+' valid threads in the last block. The endpoint i = n never occurs.';
  if(reveal&&inclusive)summary='Index '+a.extra+' passes i ≤ n and has no output slot.';
  if(strict)summary=after(k,'The other hundred twenty-seven threads skip the accesses')?
    (blockWidth-a.masked)+' valid thread + '+a.masked+' masked in the last block':
    'The guard now skips the thread with index '+n+'.';
  label(c,summary,119,787,38,light);
  const counted=id==='strict'&&after(k,'Exactly seven hundred sixty-nine addresses survive');
  footer(c,counted?a.valid+' valid addresses in '+a.lanes.length+' positions. Each valid address occurs once.':
    'Each square is one thread in the last block. Both input loads and the output store use this guard.');
}
const painters={
  c01:latch, c02:artifacts, c03:loader, 'c03-clock':clockPlot, c04:registerFile,
  'c04-spills':pressure, c05:cache, c06:publish, c07:ownership,
  'c07-control':surfaces, 'c07-tail':boundary,
};
export default {
  title:'From Kernel Source to Executable Evidence',
  draw(ctx,clock) { painters[clock.beat.chapterId](ctx,clock); },
  check,
};
