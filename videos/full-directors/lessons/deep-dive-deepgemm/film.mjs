import assert from 'node:assert/strict';
import * as m from './models.mjs';

const title = 'DeepGEMM From One Dot Product to an Expert Pipeline';
const paper = '#f2eee3', white = '#fffdf5', ink = '#142b31', muted = '#526465';
const faint = '#b8c5bc', hatch = '#cbd5ca', teal = '#087774', tealPale = '#c6e5d9';
const blue = '#295495', bluePale = '#d4e2f1', copper = '#ab4a24', copperPale = '#f2d9bc';
const gold = '#f2b951', plum = '#75426a';
const mix = (a,b,p) => a + (b-a)*p;
const ease = p => p*p*(3-2*p);
const nfmt = n => n.toLocaleString('en-US');
const num = v => String(v).replace(/-/g,'−');
const pct = x => (100*x).toFixed(1).replace(/\.0$/, '')+'%';
const gf = x => x.toFixed(2)+' GFLOPs';
function cue(c, beat, phrase, duration = 0) {
  if(c.beat.beatIndex !== beat) return Number(c.beat.beatIndex > beat);
  return c.reveal(phrase, duration);
}
function text(g,value,x,y,size=23,color=ink,options={}) {
  const {align='left',face='Sans',weight=500} = options;
  g.font = weight+' '+size+'px "Lesson '+face+'"';
  g.textAlign=align; g.textBaseline='middle'; g.fillStyle=color; g.fillText(String(value),x,y);
}
const center = (g,v,x,y,size=23,color=ink,face='Sans') => text(g,v,x,y,size,color,{align:'center',face});
const mono = (g,v,x,y,size=22,color=ink) => text(g,v,x,y,size,color,{face:'Mono'});
function box(g,x,y,w,h,fill,stroke=null,lw=1.5) {
  if(fill) {g.fillStyle=fill; g.fillRect(x,y,w,h);}
  if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.strokeRect(x,y,w,h);}
}
function path(g,points,color=ink,lw=2,dash=[]) {
  g.save();g.lineWidth=lw;g.strokeStyle=color;g.setLineDash(dash);g.beginPath();
  points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.restore();
}
const line = (g,x,y,X,Y,color=faint,w=1.5,dash=[])=>path(g,[[x,y],[X,Y]],color,w,dash);
function hatchArea(g,x,y,w,h) {
  if(h<=0)return;
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();box(g,x,y,w,h,'#e3e8db');
  for(let i=-h;i<w;i+=12)line(g,x+i,y+h,x+i+h,y,hatch,2);
  g.restore();
}
function chip(g,x,y,w,h,value,fill,color=ink,size=25) {
  box(g,x,y,w,h,fill,color,1.4);
  line(g,x+4,y+h-4,x+w-4,y+h-4,color,1);
  center(g,value,x+w/2,y+h/2,size,color,'Mono');
}
const pageLayout = {heading:70.5, subtitle:116, bodyLift:45, noteRule:488.5};
const memoryLayout = {heading:68, subtitle:111, bodyLift:50, noteRule:491};

function header(g,section,heading,sub,layout=pageLayout) {
  box(g,0,0,1200,675,paper);
  line(g,44,35,1154,35,faint);
  text(g,section,48,19,16,muted,{face:'Mono'});
  text(g,heading,46,layout.heading,45,ink,{face:'Serif'});
  if(sub)text(g,sub,48,layout.subtitle,22,muted);
  g.translate(0,-layout.bodyLift);
}
function note(g,value,detail,layout=pageLayout) {
  g.save();
  g.translate(0,layout.bodyLift);
  line(g,47,layout.noteRule,1154,layout.noteRule,faint);
  text(g,value,48,516,28,ink,{face:'Serif'});
  if(detail)text(g,detail,49,549,19,muted);
  g.restore();
}
function scalar(g,caption,value,x,y,color=ink,size=52) {
  text(g,caption,x,y,19,muted);
  text(g,value,x,y+47,size,color,{face:'Mono'});
}
function gridStacks(g, data, {show=true, pending=false, travel=0, newRow=false, height=265, limit=256}={}) {
  const base=467, step=height/limit, w=107, xs=data.rows.map((_,i)=>114+i*163);
  line(g,95,base,772,base,ink,2);
  const guide = data.alignment;
  for(let r=guide;r<=limit;r+=guide){
    const y=base-r*step;
    text(g,r,88,y,16,muted,{align:'right',face:'Mono'});line(g,96,y,769,y,faint,1,[4,6]);
  }
  data.rows.forEach((v,i)=>{
    const x=xs[i],cap=data.capacities[i];
    if(show&&cap)hatchArea(g,x,base-cap*step,w,cap*step);
    if(v)box(g,x,base-v*step,w,v*step,teal);
    for(let row=32;row<v;row+=32)line(g,x+2,base-row*step,x+w-2,base-row*step,'#6baca0',1);
    if(show&&cap){
      box(g,x,base-cap*step,w,cap*step,null,ink,2);
      for(let r=guide;r<cap;r+=guide)line(g,x,base-r*step,x+w,base-r*step,ink,2.4);
      line(g,x-5,base-cap*step,x+w+5,base-cap*step,ink,3);
    }
    if(i===3&&newRow)line(g,x,base-v*step,x+w,base-v*step,copper,3);
    center(g,'E'+i,x+w/2,488,22,ink,'Mono');
    center(g,show?v+' / '+cap:String(v),x+w/2,519,18,teal,'Mono');
    if(i===3&&pending) {
      const ry=base-v*step-mix(31,step,travel);
      line(g,x+4,ry,x+w-4,ry,copper,4);
      center(g,'+1 row',x+w/2,ry-18,18,copper);
    }
  });
}
function packedAddress(g,c,data){
  const expert=2, start=m.packedStart(data,expert), scale=1.36, left=77;
  const tagged=cue(c,4,'Token seven owns');
  const traced=cue(c,4,'Follow the marker',1.4);
  const row=m.weighted[0], weight=row.weights[row.experts.indexOf(expert)];
  header(g,'DeepGEMM   /   Packed row map','Where does token seven land?',
    'One packed array     ·     aligned segments in expert order     ·     a hatched row still occupies an address');
  data.rows.forEach((rows,i)=>{
    const x=left+scale*m.packedStart(data,i), width=scale*data.capacities[i];
    hatchArea(g,x,299,width,82);
    box(g,x,299,scale*rows,82,teal);
    box(g,x,299,width,82,null,ink,2);
    center(g,'E'+i,x+width/2,253,23,ink,'Mono');
    center(g,data.capacities[i]+' reserved',x+width/2,411,18,muted);
  });
  if(tagged){
    const to=left+scale*start;
    chip(g,74,463,266,49,'t7  ·  E2  ·  w '+weight,bluePale,blue,19);
    travelLine(g,[[340,488],[to,488],[to,382]],traced,blue);
    line(g,to,299,to,381,gold,4);
  }
  note(g,traced===1?'Packed row '+start+' carries token 7 and its router weight.':'Skip the reserved widths before E2.',
    traced===1?'128 + 256 = '+start+'. Combine can use the saved ID to return this result.':'E2 receives token seven in its first valid row.');
}
function opening(g,c) {
  const b=c.beat.beatIndex, travel=ease(cue(c,2,'Slide the row into place',1.1)), dock=travel===1;
  const load=b===0 ? 0.75+0.25*ease(Math.min(c.elapsed/1.5,1)) : 1;
  const d=m.pack(m.openingRows(load,dock),128);
  if(b===4){packedAddress(g,c,d);return;}
  const totals=cue(c,1,'The hatched space');
  const waiting=cue(c,1,'Its next assignment')&&!dock;
  header(g,'DeepGEMM   /   Expert routing',b===3?'Who owns the routed rows?':'Where will the next row fit?',
    'Useful rows / reserved rows     ·     one tile holds 128 rows');
  gridStacks(g,d,{pending:waiting,travel,newRow:dock});
  if(b<3){
    scalar(g,'Useful assignments',nfmt(d.useful),818,245,teal);
    scalar(g,'Reserved rows',totals?nfmt(d.capacity):'?',818,387);
    note(g, dock?'One new assignment opens a second tile for E3.':waiting?'Expert 3 has filled its first tile.':'Each expert owns its own tile boundaries.',
      dock?'E0, E1 and E2 keep their original capacities.':'Teal rows contain work. Hatching marks reserved space.');
  } else {
    const op=cue(c,3,'The kernel computes'), restore=cue(c,3,'the caller restores');
    [['Caller','route + pack'],['DeepGEMM','expert projections'],['Caller','restore token order']].forEach(([owner,action],i)=>{
      const y=221+i*108;
      line(g,809,y+50,1115,y+50,faint);text(g,owner,811,y,19,muted);
      text(g,action,811,y+27,24,i===(restore?2:op?1:0)?teal:ink);
    });
    note(g,'A grouped kernel shares a launch across uneven expert segments.','The serving runtime admits requests and chooses batches.');
  }
}

function dotTileState(c) {
  const after = (beat, phrase) => {
    if (c.beat.beatIndex !== beat) return c.beat.beatIndex > beat;
    const {start,end} = c.wordCue(phrase);
    return c.reveal(phrase,end-start) === 1;
  };
  const repeat = 'Repeat both pairings';
  if (cue(c,1,repeat)) {
    // Give each unspoken pairing the same time on screen.
    const start = c.wordCue(repeat).start;
    const settled = c.speechDuration + c.beat.hold - .65;
    const replay = cue(c,1,repeat,Math.max(0,settled-start));
    const row = Number(replay >= .5);
    const step = 2 * replay - row;
    return {
      row, channel:1, coordinate:step >= .36 ? 1 : 0,
      products:[step >= .16, step >= .48],
      sumReady:step >= .62,
      transfer:ease(Math.max(0, Math.min(1, (step - .67) / .20))),
    };
  }
  if (cue(c,1,'The next activation row')) {
    return {
      row:1, channel:0,
      coordinate:cue(c,1,'Negative one times four') ? 1 : cue(c,1,'Zero times three') ? 0 : -1,
      products:[after(1,'contributes zero'), after(1,'gives negative four')],
      sumReady:after(1,'gives negative four'),
      transfer:ease(cue(c,1,'Write that below',.55)),
    };
  }
  return {
    row:0, channel:0,
    coordinate:cue(c,0,'Move right') ? 1 : cue(c,0,'Read down the first coordinate') ? 0 : -1,
    products:[after(0,'gives three'), after(0,'adds eight')],
    sumReady:cue(c,1,'Eleven. Write it'),
    transfer:ease(cue(c,1,'Write it at the intersection',.55)),
  };
}

function dotTile(g,c) {
  const {a:A,z:B,result:D} = m.matrix;
  const {row,channel,coordinate,products,sumReady,transfer} = dotTileState(c);
  const xs = [102,455,865], ys = [258,338], colStep = 120, cellWidth = 112;
  header(g,'DeepGEMM   /   NT matrix product','Where does this dot product land?',
    'A stores token rows. B stores one row per output channel. C = 0.');
  const matrices = [
    {name:'Activations  A', values:A, prefix:'A', selectedRow:row, color:blue, fill:bluePale},
    {name:'Stored weights  B', values:B, prefix:'B', selectedRow:channel, color:copper, fill:copperPale},
    {name:'Output  D', values:D, prefix:'A', selectedRow:row, color:teal, fill:tealPale},
  ];
  matrices.forEach(({name,values,prefix,selectedRow,color,fill},i)=>{
    const x = xs[i];
    const isOutput = i === 2;
    text(g,name,x,198,28,color);
    for (let col=0; col<values[0].length; col++) {
      const active = col === (isOutput ? channel : coordinate);
      const cx = x+col*colStep+cellWidth/2;
      center(g,(isOutput ? 'B' : 'k = ')+col,cx,233,20,active?color:muted,'Mono');
      if (active) line(g,cx-20,248,cx+20,248,color,2);
    }
    values.forEach((valuesRow,r)=>{
      const selected = r === selectedRow;
      text(g,prefix+r,x-14,ys[r]+32,20,selected?color:muted,{align:'right',face:'Mono'});
      valuesRow.forEach((value,col)=>{
        const active = selected && col === (isOutput ? channel : coordinate);
        const shown = !isOutput || col < channel ||
          (col === channel && (r < row || (active && sumReady && transfer === 1)));
        chip(g,x+col*colStep,ys[r],cellWidth,64,shown?num(value):'·',
          selected && (!isOutput || active)?fill:white,active?color:muted,37);
      });
    });
  });

  const workY = 435, resultX = 695, resultWidth = 93;
  mono(g,'D['+row+', '+channel+']',72,workY+34,25,teal);
  products.forEach((ready,k)=>{
    const x = 233+k*234;
    const a = A[row][k], b = B[channel][k];
    box(g,x,workY,188,68,white,faint);
    center(g,'k = '+k,x+94,417,19,muted,'Mono');
    if (k<=coordinate) {
      center(g,num(a),x+64,workY+19,23,blue,'Mono');
      center(g,'×',x+94,workY+19,23,muted);
      center(g,num(b),x+124,workY+19,23,copper,'Mono');
    }
    if (ready) center(g,num(a*b),x+94,workY+49,28,teal,'Mono');
  });
  center(g,'+',444,workY+48,27,muted);
  center(g,'=',674,workY+48,27,muted);
  chip(g,resultX,workY,resultWidth,68,sumReady?num(D[row][channel]):'?',
    sumReady?tealPale:white,sumReady?teal:muted,32);
  if (sumReady && transfer > 0) {
    const cellX = xs[2]+channel*colStep+cellWidth/2, cellY = ys[row];
    travelLine(g,[[resultX+resultWidth,workY+34],[810,workY+34],[810,cellY-8],
      [cellX,cellY-8],[cellX,cellY]],transfer,teal);
  }
  note(g,row === 1 && channel === 1 && transfer === 1
    ? 'Each output column uses one stored row of B.'
    : 'Multiply matching coordinates, then add the two products.');
}

function dot(g,c){
  const b=c.beat.beatIndex;
  if(b<=1){dotTile(g,c);return;}
  const whole=b===2 || !cue(c,3,'A thread block');
  header(g,'DeepGEMM   /   '+(whole?'Whole matrix':'Block tile'),whole?'How much work is in the whole matrix?':'How many outputs reuse a loaded row?',
    whole?'NT layout     ·     A[M,K] × transpose(B[N,K])     ·     optional addend C[M,N]':'One block stages a rectangle of A and B for its output tile.');
  const one=!whole&&cue(c,3,'One input row');
  const rows=whole?6:one?1:6, cols=10, x=113,y=239;
  for(let a=0;a<6;a++)for(let j=0;j<cols;j++){
    const fill=a>=rows?'#e5e5d9':(!whole&&j<4)?teal:tealPale;
    box(g,x+j*46,y+a*37,43,33,fill,(!whole&&j<4&&a<rows)?teal:faint);
  }
  center(g,whole?'N channels':'Output channels',x+225,y-22,20);
  text(g,whole?'M rows':one?'M = 1':'M = 6',x,y+250,22);
  if(whole){
    const shape=cue(c,3,'The output has'), work=cue(c,3,'Counting two operations');
    const {M,N,K}=m.ntShape;
    mono(g,'M = '+nfmt(M)+'    N = '+nfmt(N),685,257,25,blue);
    mono(g,'K = '+nfmt(K),685,307,25,blue);
    text(g,shape?'D shape    ['+nfmt(M)+', '+nfmt(N)+']':'D shape    ?',685,392,25);
    text(g,work?'2MNK ≈ '+gf(m.ntWork):'GEMM operations    ?',685,451,25,teal);
    note(g,'M × N cells, each reducing K coordinates.','Count one multiply and one add per coordinate. The optional addition of C is separate.');
  }else{
    text(g,'Staged A row',711,248,24,blue);chip(g,707,275,249,59,'K fragment',bluePale,blue);
    text(g,'Staged weight rows',711,376,24,copper);chip(g,707,403,304,59,'shared across M',copperPale,copper,22);
    note(g,one?'One valid row leaves five rows of this tile idle.':'A block can reuse a loaded fragment across several outputs.','Extra accumulators use registers. Shared memory and register pressure limit resident blocks.');
  }
}

function scaleScene(g,c){
  const b=c.beat.beatIndex;
  if(b===3){
    const hopper=cue(c,3,'A common Hopper'), packed=cue(c,3,'Four eight-bit scales');
    header(g,'DeepGEMM   /   Native scale layout','Which representation does the kernel read?','Low-bit GEMM contracts for the selected paths');
    text(g,'Blackwell SM100',83,222,32);text(g,'FP8 activations × packed FP4 weights',83,275,22);
    for(let i=0;i<4;i++)chip(g,83+i*110,323,110,76,packed?'s'+i:'8 bits',i%2?copperPale:bluePale,ink,23);
    text(g,'4 UE8M0 scales / 32-bit word',83,437,23);
    text(g,'K group = 32 in this Mega MoE path',83,479,20,muted);
    if(hopper){line(g,597,205,597,494,faint);text(g,'Hopper SM90',661,222,32);
      text(g,'FP8 × FP8',661,275,22);chip(g,661,323,350,76,'FP32 scale',tealPale,teal,28);
      text(g,'1 scale / 32-bit float',661,437,23);text(g,'Common K group = 128',661,479,20,muted);}
    note(g,'Select the scale dtype, stride and grouping with the architecture.','On this Blackwell path, each UE8M0 scale byte encodes a power of two.');
    return;
  }
  const raw=cue(c,0,'How much of each');
  const left=cue(c,1,'Keep all four'),right=cue(c,1,'Mark the two and a half',.8);
  const out=cue(c,2,'Write that in the cell');
  const borrowed=cue(c,2,'Borrow the second');
  header(g,'DeepGEMM   /   Block-scaled dot','What reaches the accumulator?','Two K groups of 32     ·     the other 30 pairs in each group contain zeros');
  m.groups.forEach((group,i)=>{
    const x=83+i*576;
    text(g,'K = '+i*32+' … '+(i*32+31),x,198,21,muted,{face:'Mono'});
    [['A',group.a,bluePale,blue],['B',group.b,copperPale,copper]].forEach(([name,row,fill,color],r)=>{
      text(g,name,x,260+r*65,22,color);row.forEach((v,j)=>chip(g,x+42+j*74,235+r*65,67,51,num(v),fill,color));
      text(g,'0 × 30',x+206,260+r*65,19,muted,{face:'Mono'});
      chip(g,x+326,235+r*65,112,51,'× '+num(r?group.bScale:group.aScale),fill,color,20);
    });
    if(raw){
      text(g,'Raw dot  '+group.raw,x,401,21,ink);
      const unit=64;box(g,x,429,group.raw*unit,40,'#e1e4da',muted);
      const fraction=i?right:left;
      if(fraction){g.save();g.globalAlpha=fraction;box(g,x,429,group.part*unit,40,i?plum:teal);g.restore();}
      for(let j=1;j<group.raw;j++)line(g,x+j*unit,429,x+j*unit,469,white,1.3);
      if(fraction===1)text(g,'× '+group.factor+'   →   '+group.part,x,503,24,i?plum:teal,{face:'Mono'});
    }
  });
  note(g,out?'4  +  2.5  =  '+m.scaled.result:raw?'The outline measures the raw group dot.':'Read each blue value with the copper value below it.',
    borrowed?'One borrowed factor gives (4 + 5) × 0.5 = 4.5. The first group needs its own factor of 1.':
      out?'Dequantize both rows coordinate by coordinate and their dot gives the same result.':'Each group has one activation scale and one weight scale.');
}

function tileState(c){
  const stage=ease(cue(c,0,'Stage the operands',1.7));
  const transfer=ease(cue(c,1,'Follow both pairs',2.0));
  const issued=!!cue(c,1,'Issue the multiply') && stage===1 && transfer===1;
  const complete=issued && !!cue(c,2,'When it completes');
  const read=complete ? ease(cue(c,2,'Read six and a half',0.85)) : 0;
  return {stage,transfer,issued,complete,read,output:read===1};
}
function memoryScene(g,c){
  const b=c.beat.beatIndex;
  if(b>=3){
    const showView=cue(c,4,'The view reads element twenty'),showPacked=cue(c,4,'It would read element seven');
    const names=['Strided view','Packed reader'];
    header(g,'DeepGEMM   /   TMA descriptor','Which element does [2, 1] address?','Illustrative [4, 3] views     ·     same base address     ·     strides in elements',memoryLayout);
    m.strides.forEach((stride,i)=>{
      const y=224+i*152, active=i?showPacked:showView, address=m.address(stride);
      text(g,names[i],55,y,25,i?copper:blue);
      mono(g,'strides ['+stride.join(', ')+']',55,y+38,19);
      const x=325,cw=33;
      for(let j=0;j<24;j++){
        const chosen=active&&j===address;
        box(g,x+cw*j,y-7,cw-2,44,chosen?(i?copper:blue):white,faint);
        if(j%4===0||chosen)center(g,j,x+cw*(j+.46),y+15,15,chosen?white:muted,'Mono');
      }
      mono(g,'2 × '+stride[0]+' + 1 × '+stride[1]+(active?' = '+address:''),x,y+73,23,i?copper:blue);
    });
    note(g,showPacked?'The same coordinate lands thirteen elements away.':'Multiply each coordinate by its stride, then add.',
      'Validate the descriptor or materialize the required layout before staging the tile.',memoryLayout);
    return;
  }
  const v=tileState(c), xs=[54,443,832], w=294, top=212;
  header(g,'DeepGEMM   /   Blackwell SM100','When can this tile multiply?','Selected tcgen05 block-scaled path     ·     each K group has 2 nonzero pairs and 30 zero pairs',memoryLayout);
  ['Global memory','Shared memory','Tensor memory'].forEach((name,i)=>{
    text(g,name,xs[i],194,25);
    box(g,xs[i],top,w,280,i===2?'#e5e0e7':'#e4e8de',muted);
    for(let k=0;k<19;k++)line(g,xs[i]+8+k*15,top+280,xs[i]+8+k*15,top+288,muted);
  });
  const operands=(x)=>{
    for(const [i,key] of ['a','b'].entries()){
      const row=m.groups.map(group=>group[key].map(num).join(', ')).join('  |  ');
      chip(g,x+12,235+i*50,270,43,key.toUpperCase()+'    '+row,i?copperPale:bluePale,i?copper:blue,19);
    }
  };
  const factors=(x,ready)=>{
    center(g,'A scale',x+156,345,17,blue);
    center(g,'B scale',x+239,345,17,copper);
    m.groups.forEach((group,i)=>{
      const y=365+i*63;
      text(g,'K '+(i*group.width)+'–'+((i+1)*group.width-1),x+12,y+21,18,muted);
      [group.aScale,group.bScale].forEach((value,j)=>{
        const sx=x+116+j*83;
        if(ready)chip(g,sx,y,80,42,String(value),j?copperPale:bluePale,j?copper:blue,20);
        else box(g,sx,y,80,42,null,faint);
      });
    });
  };
  operands(xs[0]);
  if(v.stage===1)operands(xs[1]);
  else for(const y of [235,285])box(g,xs[1]+12,y,270,43,null,faint);
  xs.forEach((x,i)=>factors(x,i===0 || (i===1 ? v.stage===1 : v.transfer===1)));
  // Each transfer uses the gap between banks. Stored values stay under their own group.
  function copyLane(bank,y,progress,colors){
    if(progress<=0 || progress>=1)return;
    const start=xs[bank]+w+3, end=xs[bank+1]-3;
    const tip=mix(start+5,end-5,progress);
    line(g,start,y,end,y,faint,1.5,[3,4]);
    colors.forEach((color,i)=>{
      const lane=y+(i-(colors.length-1)/2)*9;
      line(g,start,lane,tip,lane,color,2);
      path(g,[[tip-5,lane-4],[tip,lane],[tip-5,lane+4]],color,2.5);
    });
  }
  copyLane(0,256,v.stage,[blue]);
  copyLane(0,306,v.stage,[copper]);
  for(const y of [386,449]){
    copyLane(0,y,v.stage,[blue,copper]);
    copyLane(1,y,v.transfer,[blue,copper]);
  }
  box(g,xs[2]+14,235,266,93,ink);
  center(g,'FP32 accumulator',xs[2]+147,259,18,'#c8dbd6');
  center(g,v.complete?m.scaled.result:v.issued?'in flight':'·',xs[2]+147,301,30,white,'Mono');
  if(v.complete){
    const track=[[xs[2]+280,281],[1144,281],[1144,521],[1119,521]];
    path(g,track,v.output?teal:faint,2,v.output?[]:[4,5]);
    if(v.output)chip(g,882,504,237,33,'D = '+m.scaled.result,tealPale,teal,20);
    else{
      box(g,882,504,237,33,null,faint);
      if(v.read>0){
        const x=v.read<.1?mix(xs[2]+280,1144,v.read/.1):v.read<.9?1144:mix(1144,1119,(v.read-.9)/.1);
        const y=mix(281,521,Math.max(0,Math.min(1,(v.read-.1)/.8)));
        chip(g,x-27,y-13,54,26,m.scaled.result,tealPale,teal,16);
      }
    }
  }
  const dependency=cue(c,1,'scales take an additional path');
  const state=v.output?'Epilogue read  →  D = '+m.scaled.result:v.complete?'MMA complete':v.issued?'tcgen05 issued':v.transfer===1?'Ready to issue':dependency?'Waiting for TMEM scales':v.stage===1?'Shared-memory copy complete':'TMA input stage';
  const detail=v.output?'The epilogue has read the completed accumulator.':
    v.stage===1?'The activation and weight fragments stay in shared memory.':
      'TMA uses the source shape, strides and alignment to select the rectangle.';
  text(g,state,48,558,28,ink,{face:'Serif'});
  text(g,detail,49,583,19,muted);
}

function jit(g,c){
  const done=[
    cue(c,1,'File it under'),cue(c,1,'Watch which binary'),
    cue(c,2,'File it separately'),cue(c,3,'D hits the second binary')
  ].filter(Boolean).length;
  const trace=m.cacheTrace(done);
  const visible= c.beat.beatIndex===0?1:cue(c,2,'Call D repeats')?4:cue(c,2,'Call C changes')?3:cue(c,1,'Call B changes')?2:1;
  header(g,'DeepGEMM   /   DeepJIT, October snapshot','Which calls build a binary?',
    'Generated source S and compiler C are fixed. Only the effective flag changes the tracked signature here.');
  ['Call','Rows','Flags','PTX dump?','Result'].forEach((v,i)=>text(g,v,[64,165,285,410,584][i],206,19,muted));
  m.requests.slice(0,visible).forEach((r,i)=>{
    const y=261+i*71, call=trace.calls[i];
    box(g,50,y-26,684,56,i%2?'#e9e9de':white);
    [r.id,r.rows,r.flag,r.dump?'yes':'no',call?(call.hit?'hit':'compile'):'?'].forEach((v,k)=>
      mono(g,v,[64,165,285,410,584][k],y,22,k===4&&call?teal:ink));
  });
  text(g,'Binary cache',830,206,24);
  for(let i=0;i<2;i++){
    const y=250+i*109, entry=trace.entries[i];
    box(g,823,y,317,81,entry?tealPale:white,entry?teal:faint);
    text(g,entry?'Binary '+entry.binary:'Empty slot',842,y+28,23,entry?teal:muted);
    if(entry)mono(g,trace.calls.find(r=>r.binary===entry.binary).signature,842,y+58,20);
  }
  if(done && visible===done){
    const recent=trace.calls.at(-1), fromY=261+(done-1)*71, toY=290+(recent.binary-1)*109;
    path(g,[[736,fromY],[768,fromY],[794,toY],[820,toY]],teal,2.5);
  }
  text(g,'PTX files produced   '+trace.entries.filter(e=>e.dump).length,824,490,20,muted);
  note(g,done===4?'Two builds and two hits. D loads binary 2.':'A runtime row count can change while generated source stays the same.',
    done===4?'A compile-only dump needs an actual compilation.':'The cache also tracks dependencies, included source and post-hook identity.');
}

function alignment(g,c){
  const b=c.beat.beatIndex;
  if(b===3){
    const assign=cue(c,3,'assignments across the node'), avg=cue(c,3,'The four stacks');
    header(g,'DeepGEMM   /   Flash benchmark shape','What does one routed row count?',
      '256 experts     ·     top-k 6     ·     eight GPU ranks');
    const xs=[74,461,847];
    const y=288;
    for(let j=0;j<8;j++){
      const x=xs[0]+(j%4)*52, yy=y+Math.floor(j/4)*60;
      box(g,x,yy,43,44,bluePale,blue);center(g,j,x+21,yy+22,20,blue,'Mono');
    }
    text(g,'512 tokens per rank',xs[0],445,21);
    for(let j=0;j<6;j++){
      const yy=252+j*30;
      path(g,[[323,341],[360,341],[400,yy],[442,yy]],copper,2);
      box(g,450,yy-8,102,16,copperPale,copper);
    }
    text(g,'6 routes / token',380,475,22);
    scalar(g,'Assignments on the node',assign?nfmt(m.assignments):'?',730,255,teal,43);
    scalar(g,'Per rank if balanced',avg?nfmt(m.balanced):'?',730,385,teal,43);
    note(g,'8 × 512 source tokens  ×  6 selected experts','Measure actual received rows on each rank when routing is uneven.');return;
  }
  if(b===4 && cue(c,4,'To find which layout')){
    procedure(g,c,true);return;
  }
  const alignment=cue(c,2,'Each expert gets')?256:cue(c,1,'At a hundred and twenty-eight')?128:64;
  const data=m.pack(m.original,alignment);
  const showTotals=cue(c,1,'Four hundred and forty-eight');
  header(g,'DeepGEMM   /   Grouped GEMM',b===4?'Who knows the row counts?':'How much work fits in full tiles?',
    'Alignment '+alignment+' rows     ·     useful / reserved per expert     ·     H = 4,096 and I = 2,048');
  gridStacks(g,data);
  if(b===4){
    const masked=cue(c,4,'During decode');
    text(g,'Contiguous segments',812,253,24);
    text(g,'Host has the counts',812,289,21,muted);
    if(masked){
      text(g,'Masked layout',812,377,24,teal);
      text(g,'GPU has the counts',812,413,21,muted);
    }
    note(g,masked?'A fixed-shape launch can read valid row counts on the GPU.':'Pack along M and save the source-token map.','The required layout depends on who has the counts at launch.');return;
  }
  const padReady=alignment===128&&cue(c,1,'of the reservation');
  scalar(g,'Useful rows',data.useful,812,203,teal,41);
  scalar(g,'Reserved rows',showTotals?data.capacity:'?',812,325,ink,41);
  if(padReady)text(g,'Padding '+data.padding+' / '+data.capacity+' = '+pct(data.paddingShare),812,426,20,muted);
  if(showTotals){
    text(g,'full tiles',811,475,22,ink);
    mono(g,gf(data.fullWork),811,512,26,ink);
  }
  note(g,'Two expert GEMMs     4MHI + 2MHI = 6MHI',
    'Useful work '+gf(data.usefulWork)+'. Full tiles count every reserved row. A kernel may skip invalid work.');
}

function procedure(g,c,question){
  header(g,'DeepGEMM   /   Layer benchmark','Where should the layer timing start and end?',
    'Both layouts run on the same hardware, at the same precision, with the same routing decisions.');
  const names=['pack + cast','dispatch','GEMMs','combine','restore'], colors=[bluePale,copperPale,tealPale,copperPale,bluePale];
  let x=60;const widths=[201,198,254,214,195];
  names.forEach((name,i)=>{
    chip(g,x,287,widths[i]-7,95,name,colors[i],ink,22);x+=widths[i];
  });
  const measured=!question && cue(c,0,'Start the clock');
  if(measured)path(g,[[60,411],[60,443],[1115,443],[1115,411]],teal,4);
  center(g,measured?'Synchronized layer time':'Choose the timing window',587,485,24,measured?teal:muted);
  note(g,question?'Both layouts contain the five stages above.':'Validate outputs, warm the signatures, then time repeated runs.',
    'Record route counts, rank placement and the reference path with the result.');
}
function timing(g,c){
  const b=c.beat.beatIndex;
  if(b===0){procedure(g,c,false);return;}
  if(b===4){
    const changed=cue(c,4,'Now switch'), timed=cue(c,4,'Read its own'), ratio=cue(c,4,'Carry the shape');
    header(g,'DeepGEMM   /   April 2026 comparison','What changes when the expert matrices grow?',
      'Same 512 source tokens per rank, eight ranks and six routes per token.');
    ['Flash','Pro'].forEach((name,i)=>{
      if(i && !changed)return;
      const d=i?m.pro:m.flash, x=83+540*i;
      text(g,name+'    ·    '+d.experts+' experts',x,207,27);
      const w=350*d.hidden/m.pro.hidden,h=115*d.intermediate/m.pro.intermediate;
      box(g,x,378-h,w,h,i?copperPale:bluePale,i?copper:blue);
      mono(g,'H '+nfmt(d.hidden)+' × I '+nfmt(d.intermediate),x,410,22);
      if(!i||timed)mono(g,d.us+' µs',x,464,28,ink);
      if(!i||ratio)text(g,d.ratio+'× versus its legacy path',x,510,21,muted);
    });
    note(g,'The Pro run has more expert weights and more work per assignment.',
      'These times are rank averages from PR 316. Each ratio uses the matching legacy shape.');
    return;
  }
  if(b===3){
    header(g,'DeepGEMM   /   Mega MoE benchmark, PR 316','What did the Flash comparison measure?',
      'Eight-rank mean     ·     512 source tokens per rank     ·     compared with the legacy expert pipeline');
    scalar(g,'Mega MoE time',m.flash.us+' µs',75,246,teal);
    if(cue(c,3,'The reported work rate'))scalar(g,'Legacy time / Mega MoE time',m.flash.ratio+'×',607,246,ink);
    text(g,'Balanced expert GEMM work / elapsed time',79,420,26);
    mono(g,'6 × 3,072 × 4,096 × 2,048  /  146.5 µs',79,474,26,teal);
    note(g,'The workload determines the denominator.','This rate estimates useful work. The historical report has an incomplete hardware and correctness receipt.');return;
  }
  const outer=!!cue(c,2,'Include preparation'), predict=!!cue(c,1,'Before we move');
  const prepKnown=[cue(c,2,'twenty more microseconds'),cue(c,2,'the candidate needs sixty')];
  const totals=!!cue(c,2,'Read both endpoints');
  header(g,'DeepGEMM   /   Illustrative timings',prepKnown[1]?'Which complete layer finishes first?':outer?'Add the preparation time for each run':predict?'Which measurement is missing?':'Which kernel finishes first?',
    'Two-stage example     ·     equal correct outputs     ·     all other costs are zero');
  const x0=256,scale=5.6;
  m.timings.forEach((r,i)=>{
    const y=250+133*i;
    text(g,r.name,55,y+38,27);
    let x=x0;
    if(prepKnown[i]){
      box(g,x,y,r.prep*scale,71,copperPale,copper);
      center(g,r.prep+' µs',x+r.prep*scale/2,y+35,23,copper,'Mono');
      x+=r.prep*scale;
    }
    box(g,x,y,r.kernel*scale,71,tealPale,teal);
    center(g,r.kernel+' µs',x+r.kernel*scale/2,y+35,26,teal,'Mono');
    if(totals)mono(g,r.total+' µs',x+r.kernel*scale+17,y+35,24);
  });
  box(g,x0,191,22,22,tealPale,teal);
  text(g,'Kernel',x0+32,202,21,teal);
  if(outer){
    box(g,x0+156,191,22,22,copperPale,copper);
    text(g,'Preparation',x0+188,202,21,copper);
  }
  if(predict)mono(g,'Kernel   100 / 70 ≈ '+(m.timings[0].kernel/m.timings[1].kernel).toFixed(2)+'×',727,492,20,teal);
  note(g,totals?'120 µs versus 130 µs. The extra preparation reverses the choice.':outer?'Move the timing boundary to include preparation.':'Hold the kernel durations fixed as the timing boundary changes.',
    'Use a process trace for the layer. Use a kernel profile for the selected operation.');
}

function indexer(g,c){
  const b=c.beat.beatIndex;
  if(b===0){
    const decoded=cue(c,0,'The first query head'),dots=cue(c,0,'Apply ReLU'),relu=cue(c,0,'Weight the surviving'),score=cue(c,0,'That score helps');
    header(g,'DeepGEMM   /   Multi-query indexer','Which heads contribute to this score?','FP8 reference calculation     ·     two query heads share one dequantized key');
    text(g,'Stored key',66,218,23);
    chip(g,64,251,239,72,'[2, −1] × ½',copperPale,copper,24);
    if(decoded)chip(g,64,371,239,72,'[1, −0.5]',bluePale,blue,24);
    const names=['Query head','Dot','ReLU','Weight'];
    names.forEach((n,i)=>text(g,n,[394,628,799,981][i],216,21,muted));
    m.heads.queries.forEach((q,i)=>{
      const y=291+i*112;
      mono(g,'['+q.join(', ')+']',395,y,26);
      mono(g,dots?num(m.heads.dots[i]):'·',635,y,27,dots&&i?copper:ink);
      chip(g,783,y-28,98,59,relu?m.heads.relu[i]:'·',relu?tealPale:white,teal,27);
      mono(g,m.heads.weights[i],985,y,27);
    });
    note(g,score?'0.4 × 1  +  0.6 × 0  =  '+m.heads.score:'Clip negative head dots before weighting and adding.',
      'The indexer returns scores for choosing positions. Attention uses the selected positions downstream.');return;
  }
  const empty=!!cue(c,3,'Now the valid span is empty');
  const masked=!!cue(c,2,'Mask the third slot');
  const wrong=!!cue(c,1,'Look where it points');
  const winner=!!cue(c,2,'Follow its wire');
  const mapped=!!cue(c,2,'Return that cache position');
  if(b>=4){
    const s=m.sparse,selected=m.sparseWinner;
    const focus=cue(c,4,'Look at compressed column');
    const blockBase=cue(c,5,'Add the within-block');
    const mapped=cue(c,5,'Follow the marked position');
    header(g,'DeepGEMM   /   Sparse block map','Which cache position does column five select?',
      'Separate sparse example     ·     4 tokens per block     ·     valid absolute blocks [2, 5]');
    s.blocks.forEach((block,i)=>{
      const x=81+i*547;
      text(g,'Absolute block '+block,x,247,27);
      for(let j=0;j<s.width;j++){
        const col=i*s.width+j, addr=block*s.width+j,chosen=focus&&col===s.column;
        center(g,'c'+col,x+54+j*108,316,20,chosen?blue:muted);
        chip(g,x+j*108,355,104,94,(mapped||blockBase&&i===selected.blockIndex&&j===0)?addr:'+'+j,chosen?bluePale:white,chosen?blue:muted,31);
      }
    });
    note(g,mapped?'Column '+s.column+' → block '+selected.block+' × 4 + '+selected.offset+' = token '+selected.token:
      blockBase?'Start at token '+selected.block*s.width+' and add the offset within the block.':'Each listed block contributes four consecutive columns.',
      'Only the valid, increasing block prefix contributes cache positions.');return;
  }
  const end=empty?40:42, selected=m.range(end)[0];
  const xs=[162,479,796], w=229;
  header(g,'DeepGEMM   /   Compressed score row',empty?'What can an empty span return?':'Which cache token wins?',
    'Source span [40, '+end+')     ·     '+(end-40)+' valid columns     ·     99 is a deliberately planted test value');
  text(g,'Compressed scores',53,196,23);
  m.scores.forEach((v,i)=>{
    const x=xs[i], excluded=masked && i>=end-40, illegal=!masked && wrong&&i===m.unboundedColumn;
    center(g,'column '+i,x+w/2,234,21,muted);
    box(g,x,262,w,93,excluded?'#e4e4dc':illegal?copperPale:winner&&i===selected?.column?tealPale:white,excluded?muted:ink,2);
    if(excluded)hatchArea(g,x+2,264,w-4,89);
    center(g,excluded?'masked':v,x+w/2,306,excluded?25:36,excluded?muted:illegal?copper:ink,'Mono');
    if(excluded)center(g,'raw '+v,x+w/2,337,15,muted);
  });
  const startX=251, cw=161;
  text(g,'Cache',77,467,25);
  [39,40,41,42,43].forEach((id,i)=>{
    const eligible=id>=40&&id<end, hot=mapped&&!empty&&id===selected?.token;
    chip(g,startX+cw*i,435,cw-6,66,id,hot?tealPale:eligible?white:'#e4e4dc',hot?teal:muted,25);
  });
  if(!masked&&wrong){
    const x=xs[m.unboundedColumn]+w/2;
    path(g,[[x,355],[x,393],[x+24,393]],copper,3);
    text(g,'out of span',x+30,393,18,copper);
  }
  if(!empty && winner){
    const x=xs[selected.column]+w/2, dest=startX+(selected.token-39)*cw+(cw-6)/2;
    const p=cue(c,2,'Follow its wire',1.15), points=[[x,356],[x,397],[dest,397],[dest,432]];
    travelLine(g,points,p,teal);
  }
  note(g,empty?(cue(c,3,'even if the caller')?'No valid columns. Return [ ].':'No cache positions are eligible.'):mapped?'Column '+selected.column+' + start 40 = cache token '+selected.token:
    masked?'Rank only the valid prefix.':wrong?'An unrestricted maximum chooses the unwritten slot.':'The compressed column number starts at zero.',
    'A compressed row carries its source offset and valid length into selection.');
}

function travelLine(g,points,p,color){
  const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
  let left=m.sum(lengths)*p;
  for(let i=0;i<lengths.length && left>0;i++){
    const k=Math.min(1,left/lengths[i]), [x,y]=points[i], [X,Y]=points[i+1];
    line(g,x,y,mix(x,X,k),mix(y,Y,k),color,4);left-=lengths[i];
  }
}

function chunks(g,c){
  const b=c.beat.beatIndex;
  if(b===5){
    const split=ease(cue(c,5,'Split the columns',1.2)), fallback=cue(c,5,'record the even');
    header(g,'DeepGEMM   /   Weight locality','Does splitting weights move the expert?',
      'Expert 2     ·     one GPU rank     ·     two locality domains inside that GPU');
    ['Gate and up weights','Down weights'].forEach((name,i)=>{
      const x=105+550*i;
      text(g,name,x,210,25);
      for(let row=0;row<4;row++)for(let col=0;col<6;col++){
        box(g,x+col*58+(col>=3?split*43:0),245+row*39,53,34,col>=3&&split?copperPale:bluePale,col>=3&&split?copper:blue);
      }
      if(split===1){
        text(g,'Domain 0',x,441,20,blue);
        text(g,'Domain 1',x+218,441,20,copper);
      }
    });
    note(g,fallback?'An unstable probe falls back to an even SM mapping.':'The same rank owns both of expert 2’s matrices.',
      'Partition the selected dimension evenly and use consistent localization for both projections.');
    return;
  }
  if(b>=6){
    const hasC=!!cue(c,6,'Now add an existing C'), decision=!!cue(c,7,'Reject this call');
    const r=m.directBf16(hasC),initial=cue(c,6,'Now add an existing C')||cue(c,6,'that choice fits');
    header(g,'DeepGEMM   /   October SM100 epilogue','Can this call use stochastic rounding?',
      'Selected epilogue: stochastic rounding to direct BF16 output');
    chip(g,98,267,240,95,'A × transpose(B)',bluePale,blue,21);
    chip(g,98,396,240,72,r.hasC?'C present':'C absent',r.hasC?copperPale:white,r.hasC?copper:muted,24);
    path(g,[[338,314],[438,314],[438,348],[543,348]],blue,3);
    if(r.hasC)path(g,[[338,432],[438,432],[438,348]],copper,3);
    chip(g,543,296,241,104,'round to '+r.output,white,ink,23);
    const label=r.hasC?(decision?'Reject call':'?'):(initial?'Allowed':'Check inputs');
    chip(g,855,308,229,79,label,r.hasC&&decision?copperPale:r.accepted&&initial?tealPale:white,ink,25);
    note(g,decision?'This BF16 rounding path requires C to be absent.':'Check the accumulation input as well as the output type.',
      'One epilogue per call: identity, scaling, FP8 quantization or BF16 stochastic rounding.');
    return;
  }
  if(b===0){
    header(g,'DeepGEMM   /   Mega MoE','What has to finish before combine?','One expert path on the selected SM100 implementation');
    const y=337, split=cue(c,0,'The first projection'), gate=cue(c,0,'SwiGLU gates'),comb=cue(c,0,'Combine uses');
    chip(g,53,y-28,150,61,'dispatch',bluePale,blue,23);
    line(g,203,y,255,y,muted,3);
    chip(g,255,y-36,160,76,'linear 1',white,ink,21);
    if(split){
      path(g,[[415,y],[443,y],[467,270],[485,270]],blue,3);
      path(g,[[415,y],[443,y],[467,410],[485,410]],copper,3);
      chip(g,485,243,111,54,'gate',bluePale,blue,22);chip(g,485,383,111,54,'up',copperPale,copper,22);
    }
    if(gate){
      path(g,[[596,270],[623,270],[647,y],[675,y]],blue,3);
      path(g,[[596,410],[623,410],[647,y],[675,y]],copper,3);
      chip(g,675,y-31,127,65,'SwiGLU',tealPale,teal,21);
      line(g,802,y,834,y,muted,3);chip(g,834,y-31,140,65,'linear 2',white,ink,21);
    }
    if(comb){line(g,974,y,995,y,muted,3);chip(g,995,y-31,155,65,'combine',bluePale,blue,21);}
    note(g,'Dispatch to the expert, compute its projection, then return to the source.','The router supplies each source token’s expert IDs and combine weights.');return;
  }
  const slots=b>=2?2:1;
  const delayed=b===4 && !!cue(c,4,'Replay at three and a half');
  let time, allowB=true;
  if(b===1){
    allowB=!!cue(c,1,'Then dispatch B');
    time=4*cue(c,1,'Run A through combine',3.1)+3.96*cue(c,1,'Then dispatch B',3.1)+.04*cue(c,1,'Read the endpoint');
  }else if(b===2){
    allowB=false;
    time=cue(c,2,'Start A',1.0);
  }else if(b===3){
    time=1+2*cue(c,3,'Dispatch B on the wire',2.0)+2*cue(c,3,'Later combine A',2.0)+.96*cue(c,3,'then combine B',1.5)+.04*cue(c,3,'Read the two lanes');
  }else time=delayed?3.5:6;
  const state=m.scheduleState(slots,time,delayed,allowB);
  const x0=204, tick=112, y0=272;
  header(g,'DeepGEMM   /   Expert-parallel schedule',slots===1?'When is the slot free for B?':'When can B use the wire?',
    slots+' reusable storage slot'+(slots===1?'':'s')+'     ·     independent wire and compute unit     ·     illustrative time units');
  for(let i=0;i<=8;i++){
    const x=x0+i*tick;line(g,x,242,x,402,faint,1,[3,6]);center(g,i,x,216,20,muted,'Mono');
  }
  ['Wire','Compute'].forEach((name,lane)=>{text(g,name,60,y0+lane*75+19,23);line(g,x0,y0+lane*75+43,x0+tick*8,y0+lane*75+43,muted);});
  state.events.forEach(e=>{
    const elapsed=Math.max(0,Math.min(time,e.end)-e.start);
    if(!elapsed)return;
    const x=x0+tick*e.start, y=y0+e.lane*75,w=tick*elapsed, owner=e.id[0],col=owner==='A'?blue:copper;
    box(g,x,y,w,43,owner==='A'?bluePale:copperPale);
    if(w>98)center(g,e.id,x+w/2,y+21,17,col);
    else if(w>28)center(g,owner,x+w/2,y+21,17,col);
  });
  const head=x0+time*tick;line(g,head,241,head,403,teal,3);
  if(b===2 && time===1){
    box(g,head+2,y0+75,7,43,blue);
    text(g,'A starts compute',head+18,y0+96,18,blue);
  }
  state.slotOwners.forEach((owner,i)=>{
    const x=211+i*286;
    chip(g,x,452,245,54,'slot '+i+'   '+(owner??'free'),owner==='A'?bluePale:owner==='B'?copperPale:white,ink,19);
  });
  if(b===4){
    text(g,'Rank barrier',813,453,22);
    text(g,delayed?'Peer A is late':'Matching groups',813,489,22,delayed?copper:muted);
  }
  note(g,delayed?'At t = 3.5, A is still waiting to combine. Both slots are occupied.':time===state.end?'Last combine completes at unit '+state.end+'.':
    b===2?'A owns slot 0. Slot 1 is free.':'Each lease lasts through its chunk’s last combine.',
    delayed?'The wire is idle. An arriving producer must wait for a release.':slots===1?'One slot forces both chunks through the three stages in sequence.':'One slot took 8 units. Each chunk keeps its dispatch, compute and combine order.');
}

function weighted(g,c){
  const results=[cue(c,3,'Token seven gets seven'),cue(c,3,'Token nine gets three')];
  header(g,'DeepGEMM   /   Opening batch replay','What value comes back to each token?',
    'Token 7’s E2 return comes from packed row '+m.packedStart(m.pack(m.plusOne,128),2)+'. Its router weight is '+m.weighted[0].weights[1]+'.');
  text(g,'Source ID',71,195,22,muted);
  text(g,'Expert return × router weight',278,195,22,muted);
  text(g,'Weighted reference',808,195,22,muted);
  m.weighted.forEach((r,i)=>{
    const y=268+i*142, result=results[i];
    chip(g,71,y-30,133,60,r.token,white,ink,25);
    for(let j=0;j<2;j++){
      const x=278+j*234;
      const color=j?copper:blue;
      box(g,x,y-35,180,70,j?copperPale:bluePale,color);
      center(g,'E'+r.experts[j],x+90,y-15,18,color,'Mono');
      center(g,r.results[j]+' × '+r.weights[j],x+90,y+13,23,color,'Mono');
    }
    center(g,'+',480,y,28,muted);
    line(g,705,y,806,y,muted,3);
    chip(g,808,y-36,258,72,r.token+'  →  '+(result?r.total:'?'),result?tealPale:white,ink,26);
  });
  note(g,'Multiply each expert return by that token’s router weight.','The source ID selects the destination row.');
}

function practice(g,c){
  const b=c.beat.beatIndex;
  if(b===2||b===3&&!cue(c,3,'Floating-point reduction order')){weighted(g,c);return;}
  if(b===3){
    const first=cue(c,3,'rounds back to the same large value');
    const zero=cue(c,3,'the result is zero'), cancelFirst=cue(c,3,'Cancel first'), one=cue(c,3,'the result is one');
    header(g,'DeepGEMM   /   FP32 reduction','Can the same inputs give different sums?','a = 2²⁵ = 33,554,432     ·     round to nearest, ties to even, after every FP32 addition');
    const eqs=['(a + 1) + (−a)','(a + (−a)) + 1'], expr=[first?'a + (−a)':'?',cancelFirst?'0 + 1':'?'];
    for(let i=0;i<2;i++){
      const y=296+132*i;
      mono(g,eqs[i],86,y,32);
      line(g,420,y,526,y,muted,2);
      center(g,expr[i],651,y,29,ink,'Mono');
      line(g,787,y,872,y,muted,2);
      const ready=i?one:zero;
      chip(g,882,y-40,167,80,ready?m.reductions[i][1]:'?',ready?tealPale:white,ink,34);
    }
    note(g,'At 2²⁵ the next larger FP32 number is four units away.',
      'Test reduction order, deterministic kernel selection and output rounding on the target stack.');return;
  }
  if(b<=1){
    const ready=cue(c,1,'Five hundred and twelve'), wider=cue(c,1,'A wider block size');
    const d=m.pack(m.freshRows,wider?256:128);
    header(g,'DeepGEMM   /   Fresh batch','How many rows do the three experts reserve?',
      'New route histogram     ·     '+d.alignment+' rows per block     ·     round each nonempty segment up');
    gridStacks(g,d,{limit:512,show:!!ready});
    scalar(g,'Assignments',d.useful,810,234,teal);
    scalar(g,'Reserved rows',ready?d.capacity:'?',810,363);
    if(ready)text(g,d.padding+' / '+d.capacity+' padding',810,478,22,muted);
    note(g,ready?'The empty expert reserves zero rows.':'Round each of the three segments independently.',
      ready?'Padding share = '+d.padding+' / '+d.capacity+' = '+pct(d.paddingShare):'The middle expert has one assignment beyond row 256.');return;
  }
  const clocked=cue(c,4,'The reference gives'), evidence=cue(c,4,'Both runs return');
  const verdict=cue(c,5,'Keep the narrow pack');
  header(g,'DeepGEMM   /   Fresh batch, complete layer','Which run would you keep?',
    '353 assignments     ·     two sampled reference outputs     ·     illustrative synchronized times');
  const xs=[64,418,802];
  ['Source reference','128-row blocks','256-row blocks'].forEach((v,i)=>text(g,v,xs[i],215,26));
  m.outcomes.forEach((r,i)=>{
    if(clocked){mono(g,r.elapsed+' µs',xs[i+1],257,26);box(g,xs[i+1],280,r.elapsed*1.9,9,i?copper:blue);}
  });
  m.freshReference.tokens.forEach((token,i)=>{
    const y=347+i*87, val=m.freshReference.values[i];
    chip(g,xs[0],y,241,61,clocked?token+'    '+val:token+'    ?',white,ink,25);
    m.outcomes.forEach((run,j)=>{
      const correct=run.matches[i],color=verdict?(correct?teal:copper):ink;
      chip(g,xs[j+1],y,242,61,token+'    '+(evidence?run.returned[i]:'?'),verdict?(correct?tealPale:copperPale):white,color,25);
      if(verdict)text(g,correct?'✓':'×',xs[j+1]+259,y+29,29,color);
    });
  });
  if(evidence){
    text(g,'Pair sum',xs[0],524,20,muted);m.outcomes.forEach((r,j)=>mono(g,r.total,xs[j+1],524,22,muted));
  }
  note(g,verdict?'Keep the 128-row run. Repair the wider pack and retime it.':'Compare the value at each source token before choosing a time.',
    verdict?'Both sums are 14. The wider layout exchanges the two owners.':'A fast return still has to reach the source token that earned it.');
}

const scenes={c01:opening,c02:dot,c03:scaleScene,c04:memoryScene,'c04-jit':jit,c05:alignment,
  'c05-time':timing,c06:indexer,c07:chunks,'c07-practice':practice};
function draw(g,c){
  g.save();g.scale(1.6,1.6);scenes[c.beat.chapterId](g,c);g.restore();
}
function check(){
  const initial=m.pack(m.original,128),extra=m.pack(m.plusOne,128);
  assert.deepEqual(initial.capacities,[128,256,128,128]);assert.equal(initial.useful,416);
  assert.deepEqual(extra.capacities,[128,256,128,256]);assert.equal(extra.capacity-initial.capacity,128);
  assert.equal(extra.useful-initial.useful,1);
  assert.equal(m.packedStart(extra,2),384);
  for(const load of [.75,.875,1]){
    const moving=m.pack(m.openingRows(load,false),128);
    assert.deepEqual(moving.rows,[64,192,32,Math.floor(128*load)]);
    assert.deepEqual(moving.capacities,initial.capacities);
    assert.equal(moving.useful,m.sum(moving.rows));
  }
  assert.deepEqual(m.openingRows(1,true),m.plusOne);
  assert.deepEqual(m.matrix.result,[[11,-1],[-4,1]]);
  assert.equal(m.ntWork*1e9,17179869184);
  assert.deepEqual(m.groups.map(g=>g.raw),[4,5]);assert.deepEqual(m.groups.map(g=>g.part),[4,2.5]);
  for(const group of m.groups){
    const a=[...group.a,...group.tail],b=[...group.b,...group.tail];
    assert.equal(a.length,group.width);
    assert.equal(m.sum(a.map((v,j)=>v*group.aScale*b[j]*group.bScale)),group.part);
  }
  assert.equal(m.scaled.result,m.scaled.explicit);assert.equal(m.scaled.result,6.5);
  const readTile=(beat,partial)=>tileState({beat:{beatIndex:beat},reveal:(phrase)=>partial[phrase]??0});
  assert.equal(readTile(1,{'Follow both pairs':.5,'Issue the multiply':1}).issued,false);
  assert.equal(readTile(1,{'Follow both pairs':1,'Issue the multiply':1}).issued,true);
  assert.equal(readTile(0,{'Stage the operands':.5}).issued,false);
  assert.equal(readTile(2,{'When it completes':1}).output,false);
  assert.equal(readTile(2,{'When it completes':1,'Read six and a half':1}).output,true);
  assert.deepEqual(m.strides.map(m.address),[20,7]);
  const cache=m.cacheTrace(4);assert.deepEqual(cache.calls.map(c=>c.hit),[false,true,false,true]);
  assert.deepEqual(cache.calls.map(c=>c.binary),[1,1,2,2]);assert.equal(cache.entries.some(e=>e.dump),false);
  for(const [a,cap,expected] of [[64,448,[64,192,64,128]],[128,640,[128,256,128,128]],[256,1024,[256,256,256,256]]]){
    const p=m.pack(m.original,a);assert.deepEqual(p.capacities,expected);assert.equal(p.capacity,cap);assert.equal(p.useful,416);
    assert.equal(p.fullWork,6*cap*4096*2048/1e9);
  }
  assert.equal(m.assignments,24576);assert.equal(m.balanced,3072);assert.deepEqual(m.timings.map(r=>r.total),[120,130]);
  assert.equal(m.pro.perRank*m.pro.ranks*m.pro.topK,m.assignments);
  assert.ok(m.pro.hidden*m.pro.intermediate>m.flash.hidden*m.flash.intermediate);
  assert.equal(m.directBf16(false).accepted,true);assert.equal(m.directBf16(true).accepted,false);
  assert.deepEqual(m.heads.relu,[1,0]);assert.equal(m.heads.score,.4);assert.equal(m.unboundedColumn,2);
  assert.deepEqual(m.range(42).map(r=>r.token),[41,40]);assert.equal(m.range(42)[0].column,1);assert.deepEqual(m.range(40),[]);
  assert.deepEqual(m.sparseWinner,{blockIndex:1,block:5,offset:1,token:21});
  for(const slots of [1,2]){
    const {events,end}=m.scheduleState(slots,0);
    for(const chunk of ['A','B']){
      const stages=events.filter(e=>e.id[0]===chunk);
      assert.ok(stages[0].end<=stages[1].start&&stages[1].end<=stages[2].start);
    }
    for(const lane of [0,1]){
      const laneEvents=events.filter(e=>e.lane===lane).sort((a,b)=>a.start-b.start);
      laneEvents.slice(1).forEach((e,i)=>assert.ok(laneEvents[i].end<=e.start));
    }
    assert.equal(end,slots===1?8:6);assert.ok(m.scheduleState(slots,end).slotOwners.every(o=>o===null));
  }
  assert.deepEqual(m.scheduleState(2,3.5).slotOwners,['A','B']);assert.deepEqual(m.scheduleState(2,4).slotOwners,[null,'B']);
  assert.deepEqual(m.scheduleState(2,1,false,false).slotOwners,['A',null]);
  const late=m.scheduleState(2,3.5,true);
  assert.deepEqual(late.slotOwners,['A','B']);
  assert.deepEqual(late.events.filter(e=>e.start<=late.time && e.end>late.time).map(e=>e.id),['B compute']);
  assert.deepEqual(m.pack(m.freshRows,128).capacities,[128,384,0]);assert.deepEqual(m.pack(m.freshRows,256).capacities,[256,512,0]);
  assert.deepEqual(m.weighted.map(r=>[r.token,r.experts,r.weights,r.contributions,r.total]),[
    ['t7',[0,2],[.25,.75],[1,6],7],
    ['t9',[0,2],[.75,.25],[1.5,1.5],3],
  ]);
  assert.deepEqual(m.reductions,[[m.large,0],[0,1]]);
  assert.deepEqual(m.outcomes.map(r=>r.pass),[true,false]);assert.deepEqual(m.outcomes.map(r=>r.total),[14,14]);assert.ok(m.outcomes[1].elapsed<m.outcomes[0].elapsed);
  return true;
}
export default {title,draw,check};
