import {C,tag,text,number,box,line,dot,arrow,header,foot,display,cell,scale,cue,count} from './bench.mjs';
import {trials,toleranceCases,ref,atol,rtol,allowance,timings,sectors,traffic,overflow,roof} from './experiments.mjs';

function tolerance(c,k){
  const id=k.beat.id,verdict=id==='tolerance';
  const band=verdict || id==='interval'&&cue(k,'Center the interval');
  const showA=verdict&&cue(k,'B differs'),showB=verdict&&cue(k,'Test small and large');
  header(c,'Numerical policy  /  finite values',band?'Which output fits the tolerance?':'How much error does the rule allow?');
  number(c,'|candidate − reference| ≤ atol + rtol × |reference|',112,329,43);
  text(c,'Reference = '+ref+'       atol = '+atol+'       rtol = '+rtol,115,399,37,C.sub);
  const left=0.0018,right=0.0022,x=v=>245+(v-left)/(right-left)*1440,y=640;
  if(band)box(c,x(ref-allowance),y-78,x(ref+allowance)-x(ref-allowance),122,C.aqua,null,3);
  line(c,x(ref),y-96,x(ref),y+30,C.teal,5);
  text(c,'Reference',x(ref),y-123,36,C.teal,'center');
  scale(c,x(left),y,1440,left,right,4,v=>v.toFixed(4));
  toleranceCases.forEach((cs,i)=>{
    const xx=x(cs.v),yo=i?y+111:y-105,shown=i?showB:showA;
    line(c,xx,y,xx,yo,C.ink,3);
    dot(c,xx,y,14,shown?(cs.pass?C.teal:C.rust):C.ink);
    const nam=(i?'B   ':'A   ')+cs.v.toFixed(5)+(shown?(cs.pass?'   pass':'   fail'):'');
    text(c,nam,xx,yo+(i?48:-18),35,shown?(cs.pass?C.teal:C.rust):C.ink,'center');
  });
  if(band)foot(c,'Allowed interval  ['+(ref-allowance).toFixed(5)+', '+(ref+allowance).toFixed(5)+']','Allowance   '+allowance.toFixed(5));
  else foot(c,'Allowance = '+atol+' + '+rtol+' × '+ref);
}
export function epsilon(c,k){
  if(k.beat.id==='overflow')return largeSquare(c,k);
  if(['band','interval','tolerance'].includes(k.beat.id)) return tolerance(c,k);
  const b=k.beat.beatIndex, id=k.beat.id;
  const enlarged=b>1 || b===1&&cue(k,'Multiply both inputs');
  const fixed=b>2 || b===2&&cue(k,'It moves close to one');
  const replay=b>3 || b===3&&cue(k,'Multiply epsilon');
  const equal=b>3 || b===3&&cue(k,'The two normalized outputs coincide');
  const neg=b===4&&cue(k,'Reverse the input signs');
  header(c,'RMSNorm experiment  /  unit weights','What moves the first feature’s output?');
  tag(c,'First input',111,299);tag(c,'Mean square',516,299,C.teal);tag(c,'+ epsilon',745,299,C.rust);tag(c,'First normalized output',1215,299);
  const trialsNow=[
    {t:trials[0],label:'Original',draw:true,mark:b>0||cue(k,'The normalized output')},
    {t:trials[1],label:'Fixed ε',draw:enlarged,mark:fixed},
    {t:trials[2],label:'Scale ε too',draw:replay,mark:equal},
    {t:trials[3],label:'Reverse sign',draw:neg,mark:neg&&cue(k,'the output reverses sign')},
  ];
  const px=v=>1230+(v+1)*270;
  const fmt=x=>String(Number(x.toPrecision(6)));
  trialsNow.forEach(({t,label,draw,mark},i)=>{
    if(!draw)return;
    const y=386+i*126;
    text(c,label,112,y-2,32,C.sub);
    number(c,fmt(t.x),330,y+4,40);
    const area=525,ratio=t.mean/(t.mean+t.epsilon);
    number(c,fmt(t.mean)+' + '+fmt(t.epsilon),520,y-2,35);
    box(c,520,y+18,area,19,C.copper,null,3);
    box(c,520,y+18,area*ratio,19,C.teal,null,3);
    line(c,1230,y,1770,y,C.line,3);line(c,px(0),y-11,px(0),y+11,C.muted,3);
    if(mark){
      const x=px(t.y), clr=i===1?C.rust:C.teal;
      line(c,px(0),y,x,y,clr,8);dot(c,x,y,14,clr);
      number(c,t.y.toFixed(4),x,y-27,34,clr,'center');
    }else text(c,'?',1500,y-22,42,C.sub,'center','Serif');
  });
  number(c,'−1',px(-1),844,28,C.sub,'center');number(c,'0',px(0),844,28,C.sub,'center');number(c,'+1',px(1),844,28,C.sub,'center');
  if(equal){
    const baseX=px(trials[0].y);
    line(c,baseX,400,baseX,621,C.teal,2,[4,9]);
  }
  if(equal)foot(c,'f(ax, w, a²ε) = f(x, w, ε)   for a > 0',id==='negative'&&trialsNow[3].mark?'a < 0 reverses the sign':'Fixed weights   ·   exact arithmetic');
  else if(id==='enlarge'||id==='fixed')foot(c,'Same weights and ε. Both inputs are 100× larger.','Second input = −first input');
  else foot(c,'Output = x / √(mean square + ε)','Second input = −first input');
}

function clockTrace(c,k){
  const end=cue(k,'wait for completion'),gpu=cue(k,'record CUDA events');
  header(c,'Timing  /  completion','Where does the clock stop?');
  const x0=452,x1=1655;
  tag(c,'Host',118,453);tag(c,'GPU stream',118,649);
  arrow(c,x0,440,x1+90,440,C.line,3);arrow(c,x0,635,x1+90,635,C.line,3);
  box(c,x0,395,285,86,C.wash,C.blue);text(c,'Submit',x0+143,452,35,C.blue,'center');
  line(c,x0+250,487,x0+250,582,C.blue,3,[7,6]);
  box(c,x0+250,590,x1-x0-250,90,C.panel);
  text(c,'Ordered device work',x0+680,647,39,C.mint,'center');
  if(gpu){dot(c,x0+250,635,11,C.copper);dot(c,x1,635,11,C.copper);}
  if(end){
    arrow(c,x1,580,x1,480,C.teal,4);
    dot(c,x1,440,13,C.teal);text(c,'Complete',x1,370,37,C.teal,'center');
  }
  foot(c,end?'Completed wall time includes the wait.':'A host launch can return while the GPU is busy.');
}
function clocks(c,k){
  const total=k.beat.id==='total', w=105,start=425;
  const wrapper=total||cue(k,'The wrapper costs');
  header(c,'Paired timing  /  sequential work','How long does each call take?');
  tag(c,'Common clock  ·  microseconds',start,320);
  scale(c,start,370,w*12,0,12,6,v=>v.toFixed(0));
  timings.forEach((row,i)=>{
    const y=471+i*178;
    text(c,row.name,110,y+64,43,C.ink,'left','Serif');
    let at=start;
    if(wrapper){
      box(c,at,y,w*row.wrapper,97,C.peach,C.rust,5);number(c,row.wrapper,at+w*row.wrapper/2,y+62,43,C.rust,'center');
      text(c,'Wrapper',at+w*row.wrapper/2,y+137,27,C.sub,'center');at+=w*row.wrapper;
    }
    box(c,at,y,w*row.kernel,97,C.panel,null,5);
    number(c,'Kernel   '+row.kernel,at+w*row.kernel/2,y+64,42,C.mint,'center');
    if(total && cue(k,i?'Match the deployed':'The candidate takes')){
      const xx=at+w*row.kernel;
      dot(c,xx,y+47,12,C.teal);
      text(c,row.total+' µs',xx+16,y+137,37,C.teal,'center','Sans',700);
    }
  });
  foot(c,total?'The caller pays for wrapper and kernel.':'Add the two completed intervals for each call.','Illustrative pair');
}
function sectorMap(c,k){
  const id=k.beat.id;
  const spacedCount=id==='packed' || id==='repack'&&cue(k,'Keep the base');
  const packed=id==='packed' || id==='repack'&&cue(k,'Move the starts');
  const packedCount=id==='packed'&&cue(k,'The useful payload');
  const spacing=packed?4:8,map=sectors(spacing),pitch=48;
  header(c,'Warp addresses  /  one aligned load','How many sectors contain the requested bytes?');
  text(c,'32 active lanes    ×    4 bytes per lane',120,315,40);
  for(let s=0;s<8;s++){
    const col=s%4,row=Math.floor(s/4),x=120+col*426,y=417+row*177;
    text(c,'Sector '+s,x,y-25,32,map.used.includes(s)?C.teal:C.muted);
    for(let j=0;j<8;j++){
      const offset=32*s+4*j,active=map.starts.includes(offset);
      box(c,x+j*pitch,y,pitch-3,65,active?C.aqua:C.white,active?C.teal:C.line,3);
      if(active)dot(c,x+(j+0.5)*pitch-1,y+33,6,C.teal);
    }
    number(c,'bytes '+32*s+'–'+(32*s+31),x,y+106,25,C.sub);
  }
  let reading='Start spacing   '+spacing+' B';
  if(packedCount || (!packed && spacedCount)) reading+='     ·     Touched sectors   '+map.used.length;
  const prior=packed?'8 B spacing touched '+sectors(8).used.length+' sectors     ·     ':'';
  foot(c,reading,prior+'Requested payload   '+map.starts.length*4+' B');
}
function bandwidth(c,k){
  const answered=k.beat.id==='rates';
  const prefix=answered||cue(k,'input reads');
  const phys=answered||cue(k,'The supplied device');
  header(c,'Bandwidth  /  one completed interval','What rate belongs under the device-memory ceiling?');
  text(c,'Elapsed time',117,327,40,C.sub);number(c,'12 µs',450,341,69);
  text(c,'10,400 rows   ×   1,000 features   ×   6 logical bytes',1794,323,32,C.sub,'right');
  traffic.forEach((r,i)=>{
    if(!(i?phys:prefix))return;
    const y=460+i*179,w=r.bytes/62400000*890,clr=i?C.teal:C.blue;
    text(c,r.name,118,y+33,40,C.ink,'left','Serif');
    box(c,488,y-39,w,91,clr,null,5);
    number(c,(r.bytes/1e6).toFixed(1)+' MB',505,y+22,42,C.white);
    if(answered && cue(k,i?'The requested rate':'For a real run')){
      number(c,r.rate.toFixed(2),1640,y+23,60,clr,'right');text(c,'TB/s',1665,y+22,32,clr);
    }
  });
  foot(c,answered?'Compare physical traffic with the ceiling at that memory level.':'Divide each byte count by the same completed time.','Supplied traffic example');
}
export function performance(c,k){
  const id=k.beat.id;
  if(id==='roof'||id==='limit')return roofline(c,k);
  if(id==='clock')return clockTrace(c,k);
  if(['wrapper','total'].includes(id))return clocks(c,k);
  if(['sectors','repack','packed'].includes(id))return sectorMap(c,k);
  bandwidth(c,k);
}

function largeSquare(c,k){
  const squared=cue(k,'The square overflows'),zero=cue(k,'the direct result is zero'),wide=cue(k,'In float sixty-four');
  header(c,'Reference arithmetic  /  overflow','What happens to a large finite input?');
  text(c,'Single feature    x = 2 × 10¹⁹    ·    weight = 1    ·    ε = 0.00001',113,321,39);
  tag(c,'Arithmetic',120,431);tag(c,'Stored square',525,431);tag(c,'Reciprocal root',1040,431);tag(c,'Output',1560,431);
  [[false,'FP32'],[true,'FP64']].forEach(([isWide,label],i)=>{
    if(isWide&&!wide)return;
    const y=548+i*173,clr=isWide?C.teal:C.rust;
    text(c,label,126,y+20,55,C.ink,'left','Serif');
    line(c,292,y,470,y,C.line);
    const qty=isWide?overflow.fp64Square:overflow.fp32Square;
    const squareText=isWide?(qty/1e38).toFixed(0)+' × 10³⁸':squared?'∞':'?';
    number(c,squareText,535,y+17,52,clr);
    arrow(c,830,y,979,y,C.line);
    if(isWide||zero){
      number(c,isWide?'5e−20':'0',1040,y+17,49,clr);
      arrow(c,1330,y,1510,y,C.line);
      number(c,isWide?'≈ '+overflow.fp64Result:overflow.fp32Result,1564,y+17,55,clr);
    }
  });
  foot(c,'Largest finite FP32 value   ≈   3.4 × 10³⁸','Compare the declared arithmetic.');
}

function roofline(c,k){
  const limit=k.beat.id==='limit';
  const mem=limit||cue(k,'The scalar instructions'),compute=limit||cue(k,'Which ceiling');
  const result=limit&&cue(k,'Even if memory');
  header(c,'Roofline  /  instruction and memory limits','Which ceiling sets the bound?');
  text(c,'900 GB/s   ×   ⅔ operation per byte',120,332,49,C.ink,'left','Serif');
  const x=549,sz=1.72;
  [[roof.memory,'Memory supply',mem,C.blue],[roof.scalar,'Scalar compute',compute,C.teal]].forEach(([v,label,on,color],i)=>{
    const y=449+i*180;
    text(c,label,119,y+62,43);
    if(on){
      box(c,x,y,v*sz,94,color,null,6);
      number(c,v+' Gop/s',x+27,y+63,45,C.white);
    }else line(c,x,y+44,x+roof.memory*sz,y+44,C.line,2,[9,10]);
  });
  if(result)line(c,x+roof.limit*sz,415,x+roof.limit*sz,766,C.rust,4,[8,8]);
  foot(c,result?'Upper bound   '+roof.limit+' billion operations per second':'Intensity must use bytes at the chosen memory level.','Illustrative model');
}
