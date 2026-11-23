import {C,txt,mono,line,rect,circle,path,bracket,bench,note,strip,cue,cueThrough,cueEnd,mix,dotline,pointer} from './ink.mjs';
import {rel,sum,logs,maxLog,merged,wrong,duplicate,mergeReference,bounds,heads,qDim,oDim,qOffset,oOffset,scoredRanges} from './model.mjs';

const xB=305,xA=1615;
function beam(g,{guess,share,mark,previous=null,moving=false,mass=true,left='B    [0, 1]',right='A    [1, 0]',y=573}) {
  line(g,xB,y,xA,y,C.board,14);
  for(let i=0;i<=12;i++){
    const x=mix(xB,xA,i/12);line(g,x,y-11,x,y+15,i%3===0?C.ink:C.subtle,3);
  }
  for(const [x,tag,fill] of [[xB,left,C.violet],[xA,right,C.mint]]){
    circle(g,x,y,26,fill,C.ink);
    mono(g,tag,x,y-77,38,C.ink,'center');
  }
  if(mass) {
    const pos=[xB,xA],nums=[logs[1],logs[0]];
    nums.forEach((n,i)=>{
      mono(g,'b = '+n,pos[i],y-164,34,C.subtle,'center');
      const count=2**n;
      for(let k=0;k<count;k++)circle(g,pos[i]+(k-(count-1)/2)*35,y-122,11,i?C.teal:C.plum);
    });
  }
  if(guess){
    const x=(xA+xB)/2;
    circle(g,x,y,16,C.paper,C.subtle);
    dotline(g,x,y+18,x,y+87,C.subtle);
    txt(g,'½ each',x,y+118,32,C.subtle,'center');
  }
  if(previous!==null) {
    const x=mix(xB,xA,previous);
    circle(g,x,y,16,C.paper,C.subtle);
    dotline(g,x,y+18,x,y+69,C.subtle);
  }
  if(share!==null) {
    const x=mix(xB,xA,share);
    path(g,[[x,y-24],[x+19,y],[x,y+24],[x-19,y]],C.rust);
    if(moving||mark) {
      line(g,x,y-30,x,y-116,C.rust,3);
      txt(g,moving?'placing result':mark,x,y-151,39,C.rust,'center','Serif',600);
    }
  }
}
export function balance(g,c) {
  if (c.beat.beatIndex >= 4) return scoreReplay(g, c);
  const b=c.beat.beatIndex, guess=cue(c,1,'Try the midpoint'),move=cue(c,3,'Move the point',1.2);
  const ready=cue(c,2,'Divide by their sum'),parent=cue(c,3,'Keep the parent statistic');
  bench(g,'Attention-state merge','Where do the two outputs meet?');
  txt(g,'R2, first new query, one head     /     B reads t4–t5     /     A reads t0–t3',110,290,32,C.subtle);
  const share=move?mix(.5,merged.output[0],move):null;
  beam(g,{guess,share,mark:'[⅔, ⅓]',moving:move>0&&move<1,y:581});
  if(ready) {
    const v=rel.map(n=>n.toFixed(1));
    mono(g,'B   '+v[1]+' / '+sum(rel).toFixed(1)+' = 1/3',157,801,36,C.plum);
    mono(g,'A   '+v[0]+' / '+sum(rel).toFixed(1)+' = 2/3',1180,801,36,C.teal);
  }else if(b===2){
    mono(g,'Common shift m = '+maxLog+'       B   2^(-1) = 0.5       A   2^0 = 1',138,801,37,C.ink);
  }else{
    txt(g,guess?'The hollow marker gives each worker one equal vote.':'Each dot is one unit of normalization mass.',960,803,35,C.subtle,'center');
  }
  note(g,parent?'Parent log₂ mass  =  2 + log₂(1.5)  =  log₂(6)  ≈  '+merged.b.toFixed(3):
    'For nonempty ranges with matching score scale and mask, b = log₂ Σ exp(score).');
}
function scoreReplay(g, c) {
  const growing = cueThrough(c, 4, 'Its exponential goes from one to three');
  const move = cueThrough(c, 5, 'Back to the midpoint');
  const equal = cueEnd(c, 5, "Worker B now has one plus three units of mass, matching A's four");
  const parent = cueEnd(c, 5, 'The parent keeps the base-two log of eight, which is three');
  const state = scoredRanges(Math.log(3) * growing);
  const totals = state.masses.map(sum);
  bench(g, 'Replay one score', 'Six keys again. Where does the output land?');
  txt(g, 'Mass contributed by each key', 960, 280, 34, C.subtle, 'center');
  for (const [worker, values] of state.masses.entries()) {
    const start = worker === 1 ? xB : xA;
    const firstKey = worker === 1 ? 4 : 0;
    values.forEach((mass, k) => {
      const x = start + (k - (values.length - 1) / 2) * 95;
      const height = 34 * mass;
      rect(g, x - 29, 466 - height, 58, height, worker === 1 ? C.plum : C.teal);
      const changing = worker === 1 && k === values.length - 1 && growing > 0 && growing < 1;
      if (!changing) mono(g, mass.toFixed(0), x, 448, 28, C.white, 'center');
      mono(g, 't' + (firstKey + k), x, 492, 28, C.ink, 'center');
    });
  }
  const oldX = mix(xB, xA, merged.output[0]);
  beam(g, {
    guess:false, mass:false, y:673,
    share:move>0 ? mix(merged.output[0],state.result.output[0],move) : null,
    previous:merged.output[0],
    mark:move===1?'[½, ½]':null,
  });
  txt(g, 'Previous result  [⅔, ⅓]', oldX, 782, 34, C.subtle, 'center');
  if(equal) totals.forEach((mass,i)=>mono(g,'Total '+mass.toFixed(0),i===1?xB:xA,771,32,i===1?C.plum:C.teal,'center'));
  note(g, parent ? 'New parent log₂ mass  =  log₂('+totals.map(mass=>mass.toFixed(0)).join(' + ')+')  =  ' + state.result.b.toFixed(0) :
    growing===1 ? 'Only t5 changed. Its score is ln(3), so exp(score) = '+state.masses[1].at(-1).toFixed(0)+'.' :
    growing>0 ? 'Only the mass of t5 changes.' :
    'Same query, head, mask, partitions and values. All six scores start at zero.');
}
export function mergeFaults(g,c) {
  const b=c.beat.beatIndex;
  if(b===0){
    const fed=cue(c,0,'Feed those numbers'),fixed=cue(c,0,'Divide each natural log');
    bench(g,'Normalization units','Which units did the producer write?');
    const input=[Math.log(4),Math.log(2)];
    const v=fixed?merged:wrong;
    txt(g,'Producer     ln(4), ln(2)',117,307,37,C.ink);
    txt(g,fixed?'÷ ln(2)     →     base two':'Native statistics     →     merge expects base two',1794,307,33,fixed?C.teal:C.rust,'right');
    beam(g,{guess:false,share:fed?v.output[0]:null,mark:'A share   '+v.output[0].toFixed(4),mass:false});
    mono(g,'Merge inputs     '+(fixed?logs:input).map(n=>n.toFixed(3)).join('     /     '),125,755,38,C.ink);
    note(g,fixed?'Convert natural logarithms once. Pass an already base-two statistic through unchanged.':'The endpoint vectors and key ranges are unchanged.');
    return;
  }
  if(b===1||b===2) {
    const proposed=cue(c,1,'another worker the right key'), copied=cue(c,2,'Count the right key twice');
    bench(g,'Partition membership','How many times did each key enter the merge?');
    const owners=proposed?[0,1,0]:[0,1];
    txt(g,'Equal scores',118,321,33,C.subtle);
    owners.forEach((k,i)=>{
      const x=490+i*315;strip(g,x,274,260,90,i===2?C.rust:C.board);
      mono(g,'key '+k,x+130,321,38,C.white,'center');
      txt(g,i===2?(copied?'range 2':'proposed range 2'):'range 1',x+130,395,29,C.subtle,'center');
    });
    beam(g,{guess:copied,share:copied?duplicate.output[0]:.5,mark:copied?'⅔ right':'Direct: ½ right',mass:false,left:'key 1    [0, 1]',right:'key 0    [1, 0]',y:640});
    note(g,copied?'Two copies of key 0 supply two of the three units of mass.':'Direct softmax sees one copy of each key.');
    return;
  }
  if(b===3){
    const safe=cue(c,3,'Taking two half shares');
    const value=1e308, answer=mergeReference([value],0,[value],0).output[0];
    bench(g,'CPU reference','At what point do you divide by two?');
    txt(g,'Two finite outputs with equal mass',109,310,39,C.ink,'left','Serif',600);
    for (let i=0;i<2;i++){
      const X=190+850*i;
      strip(g,X,404,560,145);mono(g,safe?'½ × 10³⁰⁸':'10³⁰⁸',X+280,473,62,C.white,'center');
    }
    txt(g,'+',900,477,66,C.ink,'center');
    bracket(g,470,1320,623,C.subtle,30);
    if(cue(c,3,'Adding those two')||safe){
      txt(g,safe?'Finite sum     '+answer.toExponential(0):'Unscaled sum     +∞',900,732,58,safe?C.teal:C.rust,'center','Serif',600);
    }
    note(g,'Finite worker states     /     normalize the relative weights before scaling the coordinates.');
    return;
  }
  const invalid=cue(c,4,'Change the first coordinate');
  const rejected=cue(c,5,'Reject this pair');
  bench(g,'CPU reference',invalid?'Can the reference still skip this range?':'What can an empty range contribute?');
  txt(g,'Empty range',147,337,41,C.ink,'left','Serif',600);
  txt(g,'Nonempty range',1082,337,41,C.ink,'left','Serif',600);
  strip(g,142,395,650,171,rejected?C.rust:C.board);strip(g,1074,395,650,171);
  mono(g,(invalid?'[1, 0]':'[0, 0]')+'     b = −∞',467,479,47,C.white,'center');
  mono(g,'[0, 1]     b = 1',1399,479,47,C.white,'center');
  if(rejected || (!invalid && cue(c,4,'Skip that range'))) {
    bracket(g,467,1400,635,invalid?C.rust:C.teal,25);
    txt(g,invalid?'Reject the nonzero empty vector':'Carry [0, 1] and b = 1',930,735,53,invalid?C.rust:C.teal,'center','Serif',600);
  }
  note(g,'This empty-state convention belongs to the CPU reference. Check the device operator separately.');
}
export function stride(g,c) {
  const b=c.beat.beatIndex;
  if(b===3) return dispatch(g,c);
  if(b===0){
    const hl=cue(c,0,'groups of four');
    bench(g,'Wrapper contract','Which heads share a cache allocation?');
    txt(g,'FA2  /  paged prefill  /  v0.6.18',110,291,38,C.subtle);
    const x=210,pitch=48;
    txt(g,'32 query heads',110,380,34,C.ink);
    txt(g,'8 KV heads',110,693,34,C.ink);
    for(let k=0;k<8;k++){
      const center=x+(k*4+2)*pitch;
      for(let j=0;j<4;j++){
        const X=x+(k*4+j+.5)*pitch;
        line(g,X,468,center,585,hl&&k===0?C.rust:C.grid,3);
        rect(g,X-19,430,38,42,hl&&k===0?C.orange:C.mint);
      }
      circle(g,center,605,32,k===0&&hl?C.orange:C.mint,C.ink);
      mono(g,k,center,607,29,C.ink,'center');
    }
    mono(g,'NHD cache page      4 slots × 8 KV heads × 128 coordinates',153,796,35);
    note(g,'Q    [8, 32, 128]       /       packed cache    [15, 2, 4, 8, 128]       /       indices    int32');
    return;
  }
  const qStride=cueEnd(c,2,'gives the query stride');
  const oStride=cueEnd(c,2,'gives the smaller output stride');
  const copying=cueThrough(c,2,'The copied offset would start at output row three');
  const correcting=cueThrough(c,2,'The correct pointer lands at row two');
  const arrays=cueEnd(c,2,"Multiply every token boundary by its tensor's own stride");
  const tokens=cueEnd(c,2,'both arrays can use the same row counts');
  bench(g,'Element offsets','Where does token row two begin?');
  txt(g,'FlashInfer v0.7.1  /  cuDNN  /  element units  /  '+heads+' heads  /  token boundaries  ['+bounds.join(', ')+']',110,287,33,C.subtle);
  const x=307,unit=1325/qOffset.at(-1);
  function tape(label,dim,offs,y,measured,selected) {
    const stride=heads*dim;
    txt(g,label,110,y+40,44,C.ink,'left','Serif',600);
    for(let i=0;i<bounds.at(-1);i++){
      const left=x+i*stride*unit,w=stride*unit;
      rect(g,left,y,w-4,91,selected&&i===bounds[1]?C.mint:C.pale);
      mono(g,'row '+i,left+w/2,y+43,29,C.ink,'center');
    }
    txt(g,measured?heads+' × '+dim+' = '+stride+' elements per row':dim+' coordinates per head',x,y-35,32,C.subtle);
    if(arrays)mono(g,'['+offs.join(', ')+']',x,y+136,31,C.ink);
  }
  tape('Q',qDim,qOffset,396,qStride,true);
  tape('O',oDim,oOffset,668,oStride,correcting===1);
  const qx=x+qOffset[1]*unit,ox=x+oOffset[1]*unit;
  line(g,qx,397,qx,487,C.teal,7);
  if(copying>0) {
    const y=mix(493,660,copying);
    dotline(g,qx,493,qx,y,C.rust);
    pointer(g,qx,y,true,C.rust);
    if(copying===1) {
      line(g,qx,669,qx,756,C.rust,6);
      mono(g,'Copied '+qOffset[1],qx+20,578,30,C.rust);
    }
  }
  if(correcting>0){
    const at=mix(qx,ox,correcting);
    pointer(g,at,686,true,C.teal);
    if(correcting===1) {
      line(g,ox,669,ox,756,C.teal,7);
      bracket(g,ox,qx,774,C.rust,11);
    }
  }
  const copiedRow=qOffset[1]/(heads*oDim);
  const footer=tokens?'In token units, both tensors use ['+bounds.join(', ')+'].':
    correcting===1?'O row '+bounds[1]+' starts at '+oOffset[1]+' elements. '+qOffset[1]+' would start at O row '+copiedRow+'.':
    copying===1?'Copy '+qOffset[1]+' elements from Q and the O pointer starts at row '+copiedRow+'.':
    'Both buffers use the same element scale. Each block is one token row.';
  note(g,footer);
}
function dispatch(g,c) {
  const limit=cue(c,3,'which accepts one query'), selected=cue(c,3,'Select an implementation');
  const compile=cue(c,3,'compile and cache');
  bench(g,'Backend selection','Can the selected backend take all four rows?');
  txt(g,'FlashInfer v0.7.1    /    MLA prefill entry point    /    example auto selection: XQA',110,292,33,C.subtle);
  txt(g,'One request',110,422,38,C.ink);
  for(let i=0;i<4;i++) {
    const x=485+i*216;
    rect(g,x,368,196,107,C.violet,C.plum,5);
    mono(g,'q'+i,x+98,422,40,C.ink,'center');
  }
  if(limit) {
    bracket(g,487,681,507,C.rust,20);
    txt(g,'XQA accepts 1 row',487,553,36,C.rust);
  }
  if(selected) {
    bracket(g,487,1327,643,C.teal,20);
    txt(g,'Choose a compatible multi-row implementation',487,703,38,C.teal);
  }
  if(compile) mono(g,'Supported specialization  →  compile once  →  cached binary',180,810,34,C.ink);
  note(g,'Check GPU, precision, layout and features. The serving engine must select the eligible implementation.');
}
