import { C,txt,mono,line,path,rect,circle,bracket,dotline,bench,note,strip,socket,pointer,cue,cueThrough,cueEnd,mix } from './ink.mjs';
import { requests,query,page,flat,owner,addr,len,visible,tailState } from './model.mjs';

const colors=[C.teal,C.rust,C.plum];
const fills=[C.mint,C.orange,C.violet];

export function packed(g,c) {
  const b=c.beat.beatIndex, selected=3, who=owner(selected);
  const answered=cue(c,1,'The middle request owns it');
  const inked=cue(c,0,'Put a bracket',.55);
  const showCache=cue(c,2,'two keys available');
  bench(g,'Packed queries',b<2?'Who owns row three?':b===2?'What can this row look up?':'Who supplies the mapping?');
  const x=340,pitch=152, Y=590;
  requests.forEach((r,i)=>{
    const X=155+i*568,y=319;
    txt(g,r.id,X,y,47,colors[i],'left','Mono',600);
    txt(g,i===1?'Decode':'Chunked prefill',X+110,y,32);
    for(let j=0;j<4;j++) {
      const xx=X+j*96;
      rect(g,xx,y+52,85,74,j<r.q?fills[i]:null,j<r.q?colors[i]:C.grid,5);
      if(j<r.q) mono(g,'Q',xx+42,y+89,35,colors[i],'center');
      else for(let a=8;a<62;a+=12)line(g,xx+a,y+107,xx+a+15,y+74,C.grid,2);
    }
  });
  txt(g,'Packed row',98,Y+61,33);
  for(let j=0;j<query.at(-1);j++){
    const id=owner(j), colored=answered && id===who;
    rect(g,x+j*pitch,Y,pitch-5,116,colored?fills[id]:C.board);
    mono(g,j,x+(j+.5)*pitch,Y+58,50,colored?C.ink:C.white,'center');
  }
  const bracketColor=answered?colors[who]:C.ink;
  bracket(g,x+pitch*selected,x+pitch*selected+pitch-5,Y+155-inked*13,bracketColor,24);
  const at=x+(selected+.5)*pitch;
  txt(g,answered?'R1 owns row 3':'Which request?',at,Y+203,38,bracketColor,'center','Serif',600);
  if (answered) {
    const start=155+who*568+42;
    path(g,[[start,451],[start,500],[at,536],[at,580]],null,C.rust,4);
    pointer(g,at,589,true,C.rust);
  }
  if(showCache) {
    strip(g,1130,754,356,81);for(let i=0;i<4;i++)socket(g,1146+i*80,765,80,57,i<2?i:null,i===1);
    txt(g,'page 11',1505,795,32,C.subtle);
  }
  const noteText=b===0?'Incoming query counts     3  /  1  /  4':b===1?'8 useful query rows in a batch that would otherwise occupy 12 slots.':
    b===2?'Each occupied cache slot holds one key and its paired value.':'Serving engine    →    row and page mapping    →    FlashInfer plan and run';
  note(g,noteText);
}
function rail(g,{name,offsets,values,y,focus,x,pitch,motion}) {
  txt(g,name,104,y-76,33,C.ink,'left','Mono',600);
  txt(g,'offsets',105,y+4,28,C.subtle);
  offsets.forEach(v=>{line(g,x+v*pitch,y-17,x+v*pitch,y+25,C.subtle,3);mono(g,v,x+v*pitch,y-39,36,C.ink,'center');});
  const previous=Math.max(0,focus-1);
  const low=mix(offsets[previous],offsets[focus],motion);
  const high=mix(offsets[previous+1],offsets[focus+1],motion);
  values.forEach((v,j)=>{
    const selected=motion===1 && low<=j&&j<high;
    rect(g,x+j*pitch+3,y+24,pitch-6,68,selected?fills[focus]:C.pale);
    mono(g,v,x+(j+.5)*pitch,y+59,32,selected?colors[focus]:C.subtle,'center');
  });
  bracket(g,x+low*pitch+3,x+high*pitch-3,y+108,colors[focus],15);
  pointer(g,x+low*pitch,y+12,true,colors[focus]);pointer(g,x+high*pitch,y+12,true,colors[focus]);
}
export function rulers(g,c) {
  const middle=cue(c,1,'Slide both brackets',.80), last=cue(c,3,'Slide to the final request',.80);
  const focus=last>0?2:middle>0?1:0;
  const motion=focus===0?1:focus===1?middle:last;
  const opened=cue(c,2,'Open page eleven')&&!last;
  bench(g,'Row and page boundaries',focus===1&&motion===1?'One row, one address. How many keys?':'What does each pointer count?');
  const x=340,pitch=171;
  rail(g,{name:'qo_indptr',offsets:query,values:Array.from({length:8},(_,i)=>'q'+i),y:373,focus,x,pitch,motion});
  rail(g,{name:'kv_indptr',offsets:page,values:flat.map(v=>'p'+v),y:621,focus,x,pitch,motion});
  if(opened){
    const at=x+2.5*pitch;
    line(g,at,732,at,766,C.rust,4);
    strip(g,at-198,766,396,88);
    for(let i=0;i<4;i++)socket(g,at-181+91*i,778,91,58,i<requests[1].tail?i:null,i===1);
    txt(g,'Page 11     2 keys in 4 slots',at+240,808,36,C.rust);
  }else if(motion===1){
    txt(g,'Selected range',103,810,30,C.subtle);
    mono(g,'R'+focus+'     rows ['+query[focus]+', '+query[focus+1]+')      page entries ['+page[focus]+', '+page[focus+1]+')',355,810,36,colors[focus]);
  }else txt(g,'Follow the two boundaries on each ruler.',103,810,34,C.subtle);
  note(g,opened?'A page-list entry names a page. Its tail length counts valid tokens.':'Read from the starting offset up to, but excluding, the next offset.');
}
const ordered=requests[2].pages;
const pageSize=4;
const lookupToken=5;
const pageRow=i=>408+i*164;
const slotX=k=>1200+k*145;

function wire(g, from, to, progress=1, color=C.grid, width=5) {
  // Split the curve at progress so the marker stays on the same wire.
  const [a,b,c,d]=[[577,from],[780,from],[790,to],[976,to]];
  const lerp=(p,q)=>[mix(p[0],q[0],progress),mix(p[1],q[1],progress)];
  const ab=lerp(a,b), bc=lerp(b,c), cd=lerp(c,d);
  const abc=lerp(ab,bc), bcd=lerp(bc,cd);
  const end=lerp(abc,bcd);
  g.beginPath();g.moveTo(...a);g.bezierCurveTo(...ab,...abc,...end);
  g.lineWidth=width;g.strokeStyle=color;g.stroke();
  return end;
}

export function routes(g,c) {
  const physical=[...ordered].sort((a,b)=>a-b);
  const sorted=cue(c,2,'sorts the list')&&!cue(c,3,'Restore the original order');
  const pages=sorted?physical:ordered;
  const knownFive=cueEnd(c,1,'Slot one holds token five');
  const followFive=cue(c,1,'Follow the second wire',.95);
  const followTail=cue(c,1,'The tail has its own wire',.95);
  const knownTail=cueEnd(c,1,'Position eight lands on page six, slot zero');
  const length=cueEnd(c,1,'give nine keys');
  const followSorted=cue(c,2,'Follow entry one again',.95);
  const knownSorted=cueEnd(c,2,'Now it reaches the empty slot on page six');
  const returning=cue(c,2,'Go back to token five');
  const keys=len(ordered,requests[2].tail,pageSize);
  const tailRead=followTail>0&&!returning;
  const pos=tailRead?keys-1:lookupToken;
  const entry=Math.floor(pos/pageSize);
  const [target,slot]=addr(pages,pos,pageSize);
  const travel=sorted?followSorted:tailRead?followTail:followFive;
  const arrived=sorted?knownSorted:tailRead?knownTail:knownFive;

  bench(g,'Logical to physical',sorted?'Where does the sorted list send token five?':c.beat.beatIndex===3?'Why preserve list order?':tailRead?'Which socket holds the last key?':'Which socket holds token five?');
  txt(g,'R2  /  ordered page list',112,282,39,C.ink,'left','Serif',600);
  txt(g,'Physical pool',1020,282,39,C.ink,'left','Serif',600);
  for(let k=0;k<pageSize;k++) mono(g,'slot '+k,slotX(k)+70.5,326,27,C.subtle,'center');
  pages.forEach((id,i)=>wire(g,pageRow(i),pageRow(physical.indexOf(id))));
  const targetY=pageRow(physical.indexOf(target));
  const tracing=travel>0&&(!tailRead||arrived);
  const marker=tracing?wire(g,pageRow(entry),targetY,travel,C.rust,9):null;
  physical.forEach((id,i)=>{
    const y=pageRow(i), pageIndex=ordered.indexOf(id);
    const used=pageIndex===ordered.length-1?requests[2].tail:pageSize;
    const selected=i===entry&&tracing;
    circle(g,577,y,10,C.paper,selected?C.rust:C.grid);
    circle(g,976,y,10,C.paper,arrived&&id===target?C.rust:C.grid);
    txt(g,'entry '+i,112,y,32,C.subtle,'left','Mono');
    rect(g,344,y-42,216,84,selected?C.orange:C.pale,selected?C.rust:C.grid,8);
    mono(g,'p'+pages[i],450,y,45,C.ink,'center');
    strip(g,993,y-62,818,124);
    mono(g,'p'+id,1092,y,42,C.white,'center');
    for(let k=0;k<pageSize;k++){
      const active=arrived&&target===id&&slot===k;
      const token=k<used?pageIndex*pageSize+k:null;
      const showToken=knownTail||(knownFive&&token!==keys-1);
      socket(g,slotX(k),y-44,141,88,token,active,showToken);
      if(active) bracket(g,slotX(k)+8,slotX(k)+128,y+52,C.orange,12);
    }
  });
  if(marker&&travel<1) circle(g,...marker,14,C.orange,C.rust);
  const divided=cueEnd(c,1,'Five divided by four gives entry one with a remainder of one');
  const [firstPage,firstSlot]=addr(ordered,lookupToken,pageSize);
  const address='Page '+target+', slot '+slot;
  const foot=arrived?address+(sorted?' is empty.':' holds token '+pos+'.')+
      (tailRead&&length?'     /     '+(ordered.length-1)+' × '+pageSize+' + '+requests[2].tail+' = '+keys+' keys':''):
    tailRead?'Token '+lookupToken+' is on page '+firstPage+', slot '+firstSlot+'. Follow the last wire for the tail.':
    divided?pos+' ÷ '+pageSize+' selects entry '+entry+', remainder '+slot+'.':
    'Page size '+pageSize+'     /     '+(ordered.length-1)+' full pages + '+requests[2].tail+' valid tail slot';
  note(g,foot,sorted?C.rust:C.teal);
}
export function mask(g,c) {
  const steps=[cue(c,1,'Stop at position five'),cue(c,2,'Advance one query'),cue(c,2,'Advance again'),cue(c,2,'The newest query')];
  const last=steps.filter(Boolean).length-1,K=9,Q=4;
  bench(g,'Bottom-right causality',c.beat.beatIndex===3?'Which wrapper accepts all four rows?':'Where does each causal row stop?');
  const x=390,y=397,w=125,h=101;
  txt(g,'5 earlier keys',x+2.5*w,278,32,C.subtle,'center');
  txt(g,'4 appended keys',x+7*w,278,32,C.rust,'center');
  bracket(g,x+4,x+5*w-4,311,C.grid,-10);
  bracket(g,x+5*w+4,x+9*w-4,311,C.rust,-10);
  for(let j=0;j<K;j++)mono(g,j,x+(j+.5)*w,353,36,C.ink,'center');
  for(let i=0;i<Q;i++){
    const bits=visible(K,Q,i),selected=i===last;
    mono(g,'q'+i,124,y+(i+.5)*h,40,selected?C.rust:C.ink);
    txt(g,'at t'+(K-Q+i),216,y+(i+.5)*h,28,C.subtle);
    bits.forEach((on,j)=>{
      const known=i<=last, X=x+j*w, Y=y+i*h;
      rect(g,X+3,Y+3,w-6,h-6,known?(on?C.mint:C.well):C.pale);
      if(known&&on){circle(g,X+w/2,Y+h/2,11,selected?C.teal:C.subtle);}
      if(known&&!on){line(g,X+w/2-9,Y+h/2-9,X+w/2+9,Y+h/2+9,C.grid,3);line(g,X+w/2+9,Y+h/2-9,X+w/2-9,Y+h/2+9,C.grid,3);}
    });
    if(i<=last) {
      const n=bits.filter(Boolean).length;
      line(g,x+n*w,y+i*h+5,x+n*w,y+(i+1)*h-5,selected?C.rust:C.teal,8);
      mono(g,n+' keys',1568,y+(i+.5)*h,34,selected?C.rust:C.ink);
    }
  }
  for(let k=0;k<3;k++){
    const lo=k*4,hi=Math.min(K,lo+4),X=x+lo*w,end=x+hi*w;
    bracket(g,X+4,end-4,826,C.subtle,11);
    mono(g,'p'+ordered[k],(X+end)/2,851,26,C.subtle,'center');
  }
  note(g,last<0?'5 earlier keys + 4 appended keys. Each query may use its own key.':
    c.beat.beatIndex===3?'Paged prefill accepts variable query counts. Dedicated decode expects one per request.':
    'After append, for local row i, key j is visible when 0 ≤ j ≤ K − Q + i.');
}
export function tails(g,c,practice=false) {
  const b=c.beat.beatIndex, pages=practice?[9,2]:ordered;
  const size=practice?8:4,old=practice?7:1;
  const insert=practice?cueThrough(c,0,'Fill the last slot'):cue(c,1,'Add one key',.78);
  const added=insert===1;
  const onePlan=!practice&&b===4;
  const replacement=onePlan&&cue(c,4,'Prepare a new wrapper');
  let refresh = practice ? cueThrough(c,1,'refresh brings the plan up to that key') : Number(b > 3);
  if (!practice && b === 3) {
    const motion = c.wordCue('The lower marker catches up').start;
    const payoff = c.wordCue('The plan now includes token nine').start;
    refresh = c.reveal('The lower marker catches up', Math.max(0, payoff - motion), { captionStart: false });
  }
  const updated = onePlan ? replacement : refresh === 1;
  const missed = !practice && (
    b === 2 && c.reveal('It misses token nine', 0, { captionStart: false }) ||
    b === 3 && !updated
  );
  const tickTwelve=practice&&cueEnd(c,0,'At tick twelve a reader still needs page nine');
  const validCount=practice&&cueEnd(c,1,'Sixteen keys are now valid');
  const earlier=practice&&cueEnd(c,1,'stays on page two, slot five');
  const completion=practice&&cueEnd(c,2,'at tick fourteen the last read completes');
  const release=practice&&cueEnd(c,2,'page nine pass to its next owner');
  const st=tailState(pages,size,old,added,updated);
  const earlierToken=13;
  const [earlierPage,earlierSlot]=addr(pages,earlierToken,size);
  bench(g,practice?'Transfer exercise':'Plan and run',practice?'When can page nine change hands?':b<3?'Which key would the old plan miss?':b===3?'How far does the refreshed plan reach?':'Which plan can reach the tenth key?');
  const x=164, pitch=practice?88:165, gap=101, start=pages.length-2, y=475;
  const width=size*pitch+36, x2=x+width+gap;
  txt(g,practice?'Two allocated pages  /  eight slots each':'R2 page list     [3, 14, 6]     /     zoom on its final two pages',115,293,36,C.subtle);
  pages.slice(-2).forEach((id,i)=>{
    const left=i?x2:x;
    strip(g,left,y,width,188);
    mono(g,'page '+id,left+24,y+151,32,C.white);
    if(practice&&i===0)txt(g,release?'new owner':'original owner',left+width-29,y+151,30,release?C.orange:C.mint,'right');
    for(let j=0;j<size;j++) {
      const valid=i===0||j<st.tail;
      const token=(start+i)*size+j;
      const highlight=earlier&&b===1?id===earlierPage&&j===earlierSlot:i===1&&j===old&&added;
      socket(g,left+18+j*pitch,y+21,pitch,88,valid?token:null,highlight);
    }
  });
  if(insert>0&&insert<1) {
    const X=x2+18+old*pitch;
    const token=(pages.length-1)*size+old;
    if(practice) {
      g.save();
      g.globalAlpha=insert;
      socket(g,X,y+21,pitch,88,token,true,false);
      g.restore();
    }else {
      socket(g,X,y+21-132*(1-insert),pitch,88,token,true);
    }
  }
  if (missed || (!practice && b === 3 && updated)) {
    const slot = x2 + 18 + old * pitch;
    rect(g, slot + 2, y + 18, pitch - 4, 94, null, missed ? C.rust : C.teal, 8);
    mono(g, missed ? 'Outside old plan' : 'Included by plan', slot + pitch / 2, y - 132, 28, missed ? C.rust : C.teal, 'center');
  }
  function marker(tail,up,label,color) {
    const end=x2+18+tail*pitch, left=x2+18;
    const Y=up?y-24:y+212;
    bracket(g,left,end,Y,color,up?-16:16);
    pointer(g,end,up?y-2:y+190,up,color);
    const tileInFlight=!practice&&up&&insert>0&&insert<1;
    txt(g,label,tileInFlight?left-32:left,up?Y-39:Y+43,34,color,tileInFlight?'right':'left','Sans',600);
  }
  marker(st.tail,true,'Used tail     '+st.tail+' / '+size,C.rust);
  const extending=refresh>0&&refresh<1;
  marker(extending?mix(old,old+1,refresh):st.planTail,false,
    extending?'Refreshing plan':(onePlan?(replacement?'New wrapper':'Original wrapper'):'Planned tail')+'     '+st.planTail+' / '+size,C.teal);
  const counts='Current history     '+st.length+' keys        /        plan covers     '+st.planned;
  const pending=tickTwelve?'At tick 12, a GPU read still holds page 9.':'';
  const lengths=practice&&release?'Page 9 changes hands. Its stored bits can stay in place.':
    practice&&completion?'Tick 14     /     the last read completes.':
    practice&&!validCount?pending:onePlan?(replacement?'Original plan fixed at 9 keys. New wrapper covers 10.':'Original wrapper covers 9 keys. The cache holds 10.'):
    counts;
  txt(g,lengths,115,825,practice?33:39,C.ink,'left','Serif',600);
  if(tickTwelve){
    const X=1318,E=1755,Y=823;
    line(g,X,Y,E,Y,C.subtle,3);
    mono(g,'tick 12',X,Y+39,28,C.subtle,'center');
    if(completion) mono(g,'tick 14',E,Y+39,28,C.teal,'center');
    else txt(g,'Reader pending',E,Y-37,30,C.subtle,'right');
    circle(g,completion?E:X,Y,12,completion?C.teal:C.rust);
  }
  const foot=practice?(release?'After cancellation, the last reader releases its claim at its completion event.':
    b===0?'This wrapper permits a tail refresh within these two pages. Its current plan covers '+st.planned+' keys.':
    earlier&&b===1?'Token '+earlierToken+' stays on page '+earlierPage+', slot '+earlierSlot+'.':
    'The same two pages stay allocated as the tail grows.'):
    b===0?'The plan assigns tiles and workspace. Run uses that plan with the query and cache.':
    onePlan?(replacement?'The new wrapper has its own plan and capture. Both can use the same compiled kernel.':'This wrapper holds one plan. Its replay contract fixes the original plan’s length at 9 keys.'):
    !updated?(cue(c,2,'It misses token nine')?'t9 occupies slot 1 on page 6. The old plan stops just before it.':'The page addresses stay fixed. Compare the two endpoints.'):
    'Refresh outside capture when the wrapper permits it and the launch shape still fits.';
  if (practice) note(g,foot);
  else txt(g,foot,115,867,31,C.ink);
}
