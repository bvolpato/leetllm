import {
  cue, inputs, ranks, totals, order, slot, gradientRack, partials, buffers, rootDevices, root,
  receipts, mismatchRank, tokens, dispatchTo, floatBytes, local, shardView, traffic,
  schedules, cost, stream, grouped, row, step, incident, practice, replay, check,
} from './model.mjs'

const W=1280, H=720
const paper='#f6f3e9', ink='#182d39', subtle='#465e65', rule='#b9c6bc', white='#fffdf5'
const teal='#157468', jade='#cbe4d3', blue='#375c89', ice='#d9e4ed', red='#b44430'
const amber='#c48a33', straw='#f0dfb4', dry='#e5e7dc'
const colors=[blue,teal,'#8b6628',red]
const mix=(a,b,t)=>a+(b-a)*t
const smooth=t=>t*t*(3-2*t)
const fmt=n=>n.toLocaleString('en-US')
function box(g,x,y,w,h,fill,stroke,r=0,lw=1.5) {
  g.beginPath(); g.roundRect(x,y,w,h,r)
  if(fill){g.fillStyle=fill;g.fill()}
  if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}
}
function line(g,x1,y1,x2,y2,color=rule,width=2) {
  g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.stroke()
}
function text(g,v,x,y,size=24,color=ink,align='left',font='Sans',weight=500) {
  g.fillStyle=color;g.font=weight+' '+size+'px "Lesson '+font+'"'
  g.textAlign=align;g.textBaseline='middle';g.fillText(String(v),x,y)
}
function mono(g,v,x,y,size=24,color=ink,align='left') {text(g,v,x,y,size,color,align,'Mono')}
function circle(g,x,y,r,fill,stroke,lw=2) {
  g.beginPath();g.arc(x,y,r,0,2*Math.PI)
  if(fill){g.fillStyle=fill;g.fill()}
  if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}
}
function arrow(g,x1,y1,x2,y2,col=teal,width=3) {
  line(g,x1,y1,x2,y2,col,width)
  const a=Math.atan2(y2-y1,x2-x1)
  for(const d of [-0.48,0.48]) line(g,x2,y2,x2-11*Math.cos(a+d),y2-11*Math.sin(a+d),col,width)
}
function page(g,topic,title) {
  g.fillStyle=paper;g.fillRect(0,0,W,H)
  box(g,0,0,W,8,teal)
  text(g,'NCCL   /   '+topic.toUpperCase(),58,31,17,teal,'left','Mono',600)
  text(g,title,56,74,47,ink,'left','Serif',500)
  line(g,58,107,1222,107,ink,1.4)
}
function note(g,s) {
  line(g,58,155,1222,155,rule,1.5)
  text(g,s,59,130,23,ink,'left','Sans',500)
}
function label(g,s,x,y,col=subtle){text(g,s,x,y,18,col,'left','Mono',600)}
function pad(g,x,y,w,h,fill=white){
  box(g,x+3,y+4,w,h,'#d3d9ce',null,10)
  box(g,x,y,w,h,fill,rule,10)
}
function chip(g,x,y,w,h,fill=ice) {
  for(let i=10;i<w-7;i+=13){box(g,x+i,y-5,5,5,'#84938b');box(g,x+i,y+h,5,5,'#84938b')}
  box(g,x,y,w,h,fill,ink,6,1.5)
  circle(g,x+9,y+9,2.2,subtle)
}
function vector(g,values,x,y,w,h,emphasis=-1){
  values.forEach((v,j)=>{
    const active=j===emphasis
    box(g,x+j*w,y,w-5,h,active?straw:(v===null?null:ice),rule,4)
    mono(g,v===null?'·':v,x+(j+0.5)*w-2,y+h/2+1,Math.min(30,h*.6),v===null?subtle:ink,'center')
  })
}
const rack = {firstSlot: 320, pitch: 158, top: 210, height: 74, rowPitch: 96}
const slotX = index => rack.firstSlot + rack.pitch * index

function tracingGuide(g, progress, c) {
  if (progress === 0) return
  const x = slotX(slot), top = rack.top - 12
  const height = rack.rowPitch * (ranks.length - 1) + rack.height + 24
  const y = top - height * (1 - smooth(progress))
  const left = x - 55, right = x + 55, bottom = y + height
  g.save()
  g.beginPath()
  g.rect(left - 4, top - 3, right - left + 8, height + 6)
  g.clip()
  box(g, left, y, right - left, height, 'rgba(242,196,129,0.29)', null, 20)
  // The notch at the leading edge leaves the numeral clear as the guide slides past.
  g.beginPath()
  g.moveTo(x - 27, bottom)
  g.arcTo(left, bottom, left, bottom - 21, 20)
  g.arcTo(left, y, left + 21, y, 20)
  g.arcTo(right, y, right, y + 21, 20)
  g.arcTo(right, bottom, right - 21, bottom, 20)
  g.lineTo(x + 27, bottom)
  g.strokeStyle = red
  g.lineWidth = 3.5
  g.stroke()
  g.restore()
  if (c.beat.id === 'column') {
    const read = cue(c, 'column', 'Two, three', 0.13)
    const finish = cue(c, 'column', 'Those four gradients', 0.25)
    const cursorRow = cue(c, 'column', 'three, four', 0.2)
      + cue(c, 'column', 'four, one', 0.2)
      + cue(c, 'column', 'one. Those', 0.2)
    const mid = rack.top + rack.height / 2 + rack.rowPitch * cursorRow
    g.save()
    g.globalAlpha = read * (1 - finish)
    g.beginPath()
    g.moveTo(left - 10, mid - 8)
    g.lineTo(left + 4, mid)
    g.lineTo(left - 10, mid + 8)
    g.closePath()
    g.fillStyle = red
    g.fill()
    g.restore()
  }
}

function receivingSocket(g, y, open) {
  const x = 1090, width = 95, height = 40
  box(g, x, y, width, height, ink, '#536660', 6, 2)
  for (let pin = 0; pin < 7; pin++) {
    box(g, x + 17 + pin * 10, y + height - 12, 4, 6, '#f1cb82')
  }
  g.save()
  g.beginPath()
  g.roundRect(x + 3, y + 3, width - 6, height - 6, 4)
  g.clip()
  const lidY = y + 3 - smooth(open) * (height - 6)
  box(g, x + 3, lidY, width - 6, height - 6, '#c4d0c7', '#75887f', 3)
  line(g, x + 28, lidY + 23, x + width - 28, lidY + 23, '#7b9086', 3)
  g.restore()
}

function spec(g, c) {
  const {guide, fullModel, sockets} = gradientRack(c)
  page(g, 'Local gradients', fullModel ? 'Which ranks need the sum now?' : 'Which rank needs the sum for slot 2?')
  label(g, 'SLOT', 165, 174)
  for (const j of ranks) mono(g, j, slotX(j), 174, 24, subtle, 'center')
  text(g, 'Weight IDs', 975, 174, 21, subtle, 'center')
  text(g, 'Slot 2 socket', 1138, 174, 21, subtle, 'center')

  for (const r of ranks) {
    const y = rack.top + rack.rowPitch * r, mid = y + rack.height / 2
    box(g, 62, y + 3, 1154, rack.height, '#c4cfc3', null, 9)
    box(g, 60, y, 1154, rack.height, '#e1e9df', '#92a79a', 9)
    for (const pinY of [y + 13, y + rack.height - 13]) {
      circle(g, 72, pinY, 3, '#8c9e91')
    }
    chip(g, 90, y + 16, 139, 42, ink)
    mono(g, 'Rank ' + r, 160, mid, 22, white, 'center')
    const pitch = rack.pitch, start = slotX(0) - pitch / 2 + 10
    box(g, start, y + 7, pitch * ranks.length - 20, rack.height - 14, white, '#a4b4a7', 5)
    for (const j of ranks.slice(1)) {
      const boundary = slotX(j) - pitch / 2
      line(g, boundary, y + 17, boundary, y + rack.height - 17, '#d7dfd6')
    }
    const {weights, open} = sockets[r]
    mono(g, weights.length === 1 ? weights[0] : weights[0] + '–' + weights.at(-1), 975, mid, 27, ink, 'center')
    receivingSocket(g, mid - 20, open)
  }

  tracingGuide(g, guide, c)
  for (const r of ranks) {
    for (const j of ranks) {
      const mid = rack.top + rack.rowPitch * r + rack.height / 2
      const traced = j === slot && guide > 0
      mono(g, inputs[r][j], slotX(j), mid, 40, traced ? ink : subtle, 'center')
    }
  }
  if (cue(c, 'replica-sockets', 'NCCL coordinates') === 1) {
    note(g, 'Sum all-reduce gives every rank the full vector.')
  } else if (!fullModel && cue(c, 'owner', 'A sum reduce-scatter') === 1) {
    note(g, 'Sum reduce-scatter gives each rank its own shard.')
  }
}
function agreement(g,c) {
  const i=c.beat.beatIndex
  if(i<2){
    page(g,'Communicator','Which rank is the broadcast root?')
    const chosen=cue(c,'root','root two')===1
    label(g,'COMMUNICATOR RANK',155,186);label(g,'PHYSICAL DEVICES',792,186)
    const devices=[0,1,5,7]
    for(const r of ranks){
      const y=247+r*90,y2=247+devices.indexOf(rootDevices[r])*90
      g.beginPath();g.moveTo(374,y);g.bezierCurveTo(580,y,626,y2,806,y2)
      g.strokeStyle=chosen&&r===root?red:'#9aacaa';g.lineWidth=chosen&&r===root?6:3;g.stroke()
    }
    for(const r of ranks){
      const y=247+r*90,d=devices[r]
      pad(g,155,y-25,220,50,chosen&&r===root?straw:white)
      mono(g,'Rank '+r,264,y,24,ink,'center')
      chip(g,806,y-25,188,50,d===7?straw:ice);mono(g,'GPU '+d,900,y,26,ink,'center')
      if(d===7)text(g,'input weights',1013,y,22,ink)
    }
    note(g,chosen?'root = 2 selects the weights on GPU 7.':'The launcher starts processes. Bootstrap assigns ranks to devices.')
    return
  }
  const shown=cue(c,'compare','Move to sequence one',.45)
  const diagnosed=cue(c,'mismatch','Rank two requests broadcast')===1
  const fixed=cue(c,'repair','to all-gather')===1
  page(g,'Call order',fixed?'Do the repaired calls agree?':'Where do the rank logs first disagree?')
  const rows=receipts(fixed)
  label(g,'COMMUNICATOR C0',70,192);label(g,'SEQUENCE 0',300,192);label(g,'SEQUENCE 1',776,192)
  for(const r of ranks) {
    const y=227+r*84
    chip(g,74,y+8,124,44);mono(g,'Rank '+r,136,y+30,23,ink,'center')
    box(g,233,y,438,62,ice,rule,6);text(g,'All-reduce',254,y+31,25)
    mono(g,'4 × f32 • SUM',435,y+32,20,subtle)
    arrow(g,685,y+30,728,y+30,subtle)
    if(shown){
      g.save();g.globalAlpha=shown
      const e=rows[r],off=diagnosed&&!fixed&&r===mismatchRank
      box(g,747,y,461,62,off?straw:fixed?jade:white,off?red:rule,6,off?3:1.5)
      text(g,e.op,770,y+31,24)
      mono(g,e.root===null?'1 × f32':'1 × f32 • root 0',970,y+32,19,subtle)
      g.restore()
    }
  }
  note(g,fixed?'All four ranks now request all-gather at sequence 1.':diagnosed?'Rank 2 entered broadcast while its peers entered all-gather.':'Compare the operation and its arguments at the same sequence number.')
}
function ribbon(g,x,y,units,w=167,h=49,number=true) {
  box(g,x-w/2,y-h/2,w,h,white,ink,6)
  const pitch=Math.min(11,(w-44)/10), first=x-w/2+12
  units.forEach((r,i)=>line(g,first+i*pitch,y-h*.26,first+i*pitch+2,y+h*.26,colors[r],4.5))
  if(number)mono(g,units.length,x+w/2-10,y+1,21,ink,'right')
}
const stops=[180,485,790,1095]
function ring(g,c) {
  page(g,'Reduce-scatter','How many times does the red one count?')
  const legs=[
    {id:'hop-one',send:'Send the one'},
    {id:'hop-two',send:'Carry those three'},
    {id:'predict-ten',send:'Look at the six'},
  ]
  const arrives=[true,
    cue(c,'hop-one','three. Count')===1,
    cue(c,'hop-two','six. Trace')===1,
    cue(c,'hop-three','ten. Count')===1]
  label(g,'SLOT 2   /   ONE STROKE PER UNIT',65,183)
  text(g,'Clockwise neighbors, with the ring opened at rank 3',65,218,23,subtle)
  for(let i=0;i<4;i++) {
    const x=stops[i],r=order[i]
    if(i<3)arrow(g,x+90,314,stops[i+1]-90,314,subtle,2.5)
    chip(g,x-82,278,164,72,i===3?straw:ice)
    mono(g,'Rank '+r,x,304,24,ink,'center')
    text(g,'local  '+inputs[r][slot],x,332,19,subtle,'center')
    line(g,x,360,x,421,rule,2)
    for(let u=0;u<inputs[r][slot];u++)
      line(g,x-((inputs[r][slot]-1)*5)+u*10,374,x-((inputs[r][slot]-1)*5)+u*10+2,397,colors[r],4)
    if(i<3)line(g,x+66,455,stops[i+1]-66,455,rule,2)
    if(arrives[i]){
      ribbon(g,x,455,partials[i].units)
      mono(g,i===0?'starts here':partials[i-1].value+' + '+inputs[r][slot]+' = '+partials[i].value,x,515,23,ink,'center')
    }else if(i>0){
      const leg=legs[i-1],t=cue(c,leg.id,leg.send,1.6)
      if(t>0 && arrives[i-1]) {
        const p=smooth(t)
        ribbon(g,mix(stops[i-1],x,p),455-50*Math.sin(p*Math.PI),partials[i-1].units)
        if(p===1)mono(g,partials[i-1].value+' + '+inputs[r][slot]+' = ?',x,515,23,ink,'center')
      }
    }
  }
  note(g,arrives[3]?'Rank 2 owns slot 2. Each contributor appears once in its finished sum.':'The upper row holds local contributions. The lower path keeps the partial sum at each stop.')
}
function gather(g,c){
  if(c.beat.id==='offset')return offset(g,c)
  if(c.beat.id==='dispatch')return dispatch(g,c)
  const hops = [
    ['copy-one', 'Rank two sends the bundle', 'Rank three receives ten'],
    ['copy-rest', 'Rank three sends a copy', 'Zero receives ten'],
    ['copy-rest', 'Zero passes a copy', 'One receives ten'],
  ];
  const progress = hops.map(([id, send, receive]) => {
    if (c.beat.id !== id) return cue(c, id, send);
    const start = c.wordCue(send).start;
    const end = c.wordCue(receive).end;
    return Math.max(0, Math.min(1, (c.elapsed - start) / (end - start)));
  });
  const n = progress.filter((p) => p === 1).length;
  const data = buffers(n);
  const title = c.beat.id === 'scaling' ? 'What if the update uses the mean?'
    : n ? 'Who holds the finished ten?' : 'What will rank 3 store in slot 2?';
  page(g, n ? 'All-gather' : 'Rank buffers', title);
  label(g, n ? 'COPIES OF THE FINISHED SLOT' : 'SLOT 2', 76, 187);
  label(g, 'SUM BUFFERS', 712, 178);
  const rowY = (r) => 263 + r * 85;
  const slotX = 793 + slot * 90;
  for (const i of ranks) mono(g, 'slot ' + i, 838 + i * 90, 210, 18, i === slot ? teal : subtle, 'center');
  for (const r of ranks) {
    const y = rowY(r);
    mono(g, 'R' + r, 82, y, 26);
    line(g, 145, y, 595, y, rule, 1.5);
    if (data[r][slot] !== null) ribbon(g, 315, y, partials[3].units, 170, 46);
    mono(g, 'R' + r, 717, y, 25);
    vector(g, data[r], 793, y - 24, 90, 48, data[r][slot] === null ? -1 : slot);
  }
  const active = progress[n] ?? 0;
  const src = (slot + n) % 4;
  const dst = (src + 1) % 4;
  if (n === 0 || active) box(g, slotX - 1, rowY(dst) - 25, 83, 50, null, amber, 6, 3);
  if (active) {
    const y = mix(rowY(src), rowY(dst), smooth(active));
    line(g, 522, rowY(src), 522, y, teal, 3);
    ribbon(g, 522, y, partials[3].units, 117, 34);
  }
  const mean=cue(c,'scaling','two and a half')===1
  if(mean){
    box(g,145,555,995,42,jade,null,5)
    mono(g,'equal-rank mean   =   '+totals[2]+' ÷ '+ranks.length+'   =   '+totals[2]/ranks.length,640,576,23,ink,'center')
  }
  note(g,mean?'Choose average, or choose sum and divide once.':n===3?'Every rank can reconstruct the full vector in rank order.':n===0?'The diagonal holds one reduced shard per rank.':'Each receiver stores the same ten strokes. Earlier copies stay in their buffers.')
}
function offset(g,c){
  page(g,'In-place layout','Which address holds rank 2’s shard?')
  const show=cue(c,'offset','eight bytes from the base')===1
  label(g,'RANK 2   /   ONE FLOAT32 ELEMENT PER SHARD',107,205)
  const start=240,pitch=227
  for(const j of ranks){
    const x=start+j*pitch
    mono(g,'element '+j,x,288,22,subtle,'center')
    box(g,x-100,322,200,100,show&&j===2?jade:white,rule,7)
    mono(g,local[j],x,371,46,ink,'center')
    mono(g,'+'+j*floatBytes+' B',x,460,24,subtle,'center')
  }
  if(show){
    const slice=shardView(2,1,local)
    arrow(g,start+2*pitch,538,start+2*pitch,490,teal)
    mono(g,'sendBuff = base + '+slice.byteOffset+' bytes',start+2*pitch,568,24,teal,'center')
  }
  note(g,'Byte offset = rank × elements per shard × bytes per element.')
}
function dispatch(g,c){
  page(g,'Expert dispatch','Which tokens travel to destination 1?')
  const transit=smooth(cue(c,'dispatch','Follow those three tokens',1.6))
  const show=transit===1
  label(g,'EQUAL CHUNKS   /   ONE TOKEN EACH',92,194)
  for(let j=0;j<3;j++)mono(g,'dst '+j,320+j*112,252,20,subtle,'center')
  for(let r=0;r<3;r++){
    mono(g,'Source '+r,91,320+r*83,24)
    vector(g,tokens[r],267,291+r*83,112,59,1)
  }
  arrow(g,650,402,768,402,teal)
  label(g,'DESTINATION 1',810,302);vector(g,show?dispatchTo(1):[null,null,null],809,355,104,85)
  for(let r=0;r<3;r++)mono(g,'src '+r,858+r*104,463,18,subtle,'center')
  if(transit>0 && transit<1 && !show){
    dispatchTo(1).forEach((v,r)=>{
      const x=mix(433,858+104*r,transit),y=mix(320+83*r,398,transit)
      circle(g,x,y,20,straw,ink);mono(g,v,x,y,22,ink,'center')
    })
  }
  note(g,'Each source sends its destination-1 chunk. Unequal counts require a different layout or exchange.')
}
function trafficScene(g,c){
  const calc=traffic(4,4*floatBytes)
  page(g,'Ring traffic','How many bytes leave one rank?')
  const answer=cue(c,'volume','Twenty-four bytes leave')===1
  label(g,'ONE INPUT BUFFER',76,197)
  vector(g,['4 B','4 B','4 B','4 B'],74,230,78,51)
  text(g,'16 bytes per rank',74,308,23,subtle)
  const blocks=(start,y,title)=>{
    text(g,title,75,y,28,ink,'left','Serif')
    for(let j=0;j<3;j++){
      const x=375+j*195
      box(g,x,y-25,123,51,title==='Reduce-scatter'?ice:jade,rule,6)
      mono(g,calc.chunk+' B',x+61,y,24,ink,'center')
      arrow(g,x+132,y,x+166,y,subtle,2)
      mono(g,'send '+(start+j),x+60,y+49,17,subtle,'center')
    }
  }
  blocks(1,390,'Reduce-scatter');blocks(4,504,'All-gather')
  if(answer){
    box(g,989,349,207,197,ink,null,13)
    text(g,'Sent per rank',1093,388,20,white,'center')
    mono(g,calc.sent+' B',1093,446,43,white,'center')
    text(g,'in '+calc.rounds+' rounds',1093,505,20,white,'center')
  }
  note(g,answer?'Sent bytes = 2(k − 1) × M/k for k equal chunks of a per-rank input M.':'Follow the outgoing link for both phases. Received bytes have their own count.')
}
function costScene(g,c){
  if(c.beat.beatIndex<2)return trafficScene(g,c)
  page(g,'Schedule cost','Which schedule finishes first?')
  const smallKB=100, tieKB=200, largeKB=1000
  const toTie=smooth(cue(c,'sweep','Raise the payload',1.25))
  const toLarge=smooth(cue(c,'large','The ring finishes first',1.8))
  const pending=cue(c,'sweep','Take the input to one decimal megabyte')===1 && toLarge===0
  const moving=(toTie>0 && toTie<1) || (toLarge>0 && toLarge<1)
  const size=Math.round(toLarge>0 ? mix(tieKB,largeKB,toLarge) : mix(smallKB,tieKB,toTie))
  const values=schedules.map(s=>cost(size,s))
  const startCost=values[0].startup/schedules[0].rounds
  const trafficFactor=traffic(ranks.length,size*1000).factor
  label(g,'TOY MODEL   /   DECIMAL UNITS',72,180)
  text(g,'Input per rank   '+fmt(size)+' kB',73,224,31,ink,'left','Serif')
  if(pending)text(g,'Next input   '+fmt(largeKB)+' kB',1198,224,31,ink,'right','Serif')
  mono(g,'Start = '+startCost+' µs/round     Modeled traffic = '+trafficFactor+' × input',73,265,20,subtle)
  const x=330,scale=13
  const timeX=us=>x+us*scale
  for(let t=0;t<=60;t+=10){
    line(g,timeX(t),322,timeX(t),512,rule,1)
    mono(g,t,timeX(t),536,17,subtle,'center')
  }
  mono(g,'µs',1155,536,18,subtle)
  if(toTie===1){
    const tieX=timeX(cost(tieKB,schedules[0]).total)
    mono(g,tieKB+' kB tie',tieX,304,20,subtle,'center')
    g.save()
    g.setLineDash([5,5])
    line(g,tieX,322,tieX,499,subtle,2)
    g.restore()
  }
  schedules.forEach((s,i)=>{
    const y=338+i*108, v=values[i]
    text(g,s.name,73,y,31,ink,'left','Serif')
    mono(g,s.rounds+' starts · '+s.rate+' GB/s',73,y+36,18,subtle)
    box(g,x,y-10,v.startup*scale,49,straw)
    for(let j=1;j<s.rounds;j++)line(g,timeX(j*startCost),y-9,timeX(j*startCost),y+38,paper,2)
    box(g,timeX(v.startup),y-10,v.payload*scale,49,i===0?teal:blue)
    if(!moving)mono(g,v.total+' µs',timeX(v.total)+12,y+15,23,ink)
  })
  box(g,75,570,17,14,straw);text(g,'startup',102,577,21)
  box(g,223,570,10,14,teal);box(g,233,570,10,14,blue);text(g,'payload time',253,577,21)
  const [ringCost,treeCost]=values
  if(toLarge===1){
    const ringEnd=timeX(ringCost.total), treeEnd=timeX(treeCost.total)
    line(g,ringEnd,563,treeEnd,563,ink,2)
    for(const end of [ringEnd,treeEnd])line(g,end,557,end,569,ink,2)
    mono(g,(treeCost.total-ringCost.total)+' µs sooner',(ringEnd+treeEnd)/2,587,22,ink,'center')
  }
  const compareParts=toLarge===1 && cue(c,'large','The fixed startup blocks')===1
  note(g,compareParts?
    'At 1 MB the ring saves '+(treeCost.payload-ringCost.payload)+' µs on payload and spends '+
      (ringCost.startup-treeCost.startup)+' µs more on startup.':
    'Modeled time = rounds × start cost + modeled traffic ÷ sustained bandwidth.')
}
function axis(g,max,x=320,end=1170,y1=240,y2=510){
  const tx=t=>x+t/max*(end-x)
  const stride=max>11?2:1
  for(let t=0;t<=max;t+=stride){
    line(g,tx(t),y1,tx(t),y2,rule,1)
    mono(g,t,tx(t),y2+27,18,subtle,'center')
  }
  mono(g,'ms',end+25,y2+27,18,subtle)
  return tx
}
function interval(g,tx,a,b,y,h,fill,s='',col=ink){
  box(g,tx(a),y,tx(b)-tx(a),h,fill,null,3)
  if(s)text(g,s,(tx(a)+tx(b))/2,y+h/2+1,19,col,'center')
}
function event(g,x,y,col=teal) {
  g.beginPath();g.moveTo(x,y-9);g.lineTo(x+9,y);g.lineTo(x,y+9);g.lineTo(x-9,y);g.closePath();g.fillStyle=col;g.fill()
}
function streamScene(g,c) {
  if(c.beat.beatIndex>=3)return groupScene(g,c)
  page(g,'CUDA streams','Which event makes the shard readable?')
  const read=cue(c,'ready','seven milliseconds')===1
  const weights=cue(c,'ready','Backward still reads')===1
  const tx=axis(g,9,314,1160,222,548)
  const writes=cue(c,'streams','Follow the device writes',1.8)
  label(g,'ILLUSTRATIVE TRACE',64,182)
  const names=['Producer','Collective writes','Other backward work','Shard reader','Old weight in use']
  const ys=[246,307,368,429,490]
  names.slice(0,weights?5:4).forEach((s,i)=>text(g,s,70,ys[i]+16,23))
  interval(g,tx,0,stream.ready,ys[0],32,blue)
  event(g,tx(stream.ready),ys[0]+16)
  text(g,'input ready',tx(stream.ready)+16,ys[0]+14,18)
  if(writes>0){
    const t=mix(stream.ready,stream.finished,writes)
    interval(g,tx,stream.ready,t,ys[1],32,teal,writes>.4?'reduce-scatter':'',white)
    if(t>stream.other[0]){
      const finish=Math.min(t,stream.other[1])
      interval(g,tx,stream.other[0],finish,ys[2],32,ice,finish-stream.other[0]>2?'independent buffers':'')
    }
    if(writes===1)event(g,tx(stream.finished),ys[1]+16,ink)
  }
  if(cue(c,'streams','The host returns')){
    line(g,tx(stream.returned),ys[1]-6,tx(stream.returned),ys[1]-20,amber,2)
    text(g,'enqueue returned',tx(stream.returned)+8,ys[1]-17,17,subtle)
  }
  if(read){
    arrow(g,tx(stream.finished),ys[1]+34,tx(stream.finished),ys[3]-2,ink)
    event(g,tx(stream.finished),ys[3]+15)
    text(g,'read at 7',tx(stream.finished)+16,ys[3]+16,20,teal)
  } else text(g,'separate stream',76,ys[3]+47,17,subtle)
  if(weights){
    interval(g,tx,2,stream.weightsUntil,ys[4],30,straw,'backward reads the old weights')
    event(g,tx(stream.weightsUntil),ys[4]+15)
  }
  note(g,weights?'The gradient reader can start at 7 ms. Updating these weights must also wait until 8 ms.':
    read?'Record a CUDA event after the collective. Make the consumer stream wait on that event.':
    'Ordinary blocking communicator, outside a group. Host return establishes enqueue.')
}
function groupScene(g,c){
  page(g,'Grouped calls','Which boundary releases the output?')
  const read=cue(c,'group-read','Record the event')===1
  const tx=axis(g,10,230,1170,252,528)
  label(g,'NONBLOCKING COMMUNICATOR',65,192)
  const events=[
    [grouped.pending,'GroupEnd','in progress'],
    [grouped.enqueued,'Poll','enqueued'],
    [grouped.launched,'Launch','notification'],
    [grouped.finished,'Writes','complete'],
  ]
  const phrases=['Group end reports','Polling reports','A launch notification','Writes finish at nine']
  events.forEach(([t,first,second],i)=>{
    if(!cue(c,'group',phrases[i]))return
    const x=tx(t),y=(i===2?405:302)
    line(g,x,478,x,y+38,subtle,2)
    event(g, x, 478, read && t === grouped.finished ? teal : subtle)
    text(g,first,x,y,26,ink,'center','Serif');text(g,second,x,y+29,19,subtle,'center')
  })
  if(read){
    const x = tx(grouped.finished)
    box(g,x-65,201,130,45,jade,teal,5)
    text(g,'read at '+grouped.finished,x,223,22,ink,'center')
  }
  note(g,read?'Use an event ordered after device writes. The earlier host and launch events have different jobs.':
    'The output reader runs on a separate CUDA stream.')
}
function receiptScene(g,c){
  if(c.beat.beatIndex>=4)return waitScene(g,c)
  const acc=c.beat.id==='accuracy'
  page(g,'Benchmark receipt',acc?'Which buffers passed this check?':'What rate does this all-reduce row measure?')
  const a=cue(c,'alg','forty-four point seven four')===1,b=cue(c,'bus','sixty-seven point one one')===1
  pad(g,70,194,1138,167,white)
  label(g,'all_reduce_perf   /   illustrative out-of-place row',93,225,teal)
  const fields=[['size (bytes)',fmt(row.bytes)],['count (f32)',fmt(row.count)],['ranks',row.ranks],['op','sum'],['time (µs)',fmt(row.us)],['#wrong',row.wrong[0]]]
  const xs=[95,345,597,734,850,1090]
  fields.forEach(([k,v],i)=>{mono(g,k,xs[i],270,18,subtle);mono(g,v,xs[i],316,26)})
  if(!acc){
    label(g,'LOGICAL PAYLOAD ÷ TIME',93,411)
    mono(g,fmt(row.bytes)+' B ÷ 0.006 s',93,464,27)
    if(a){text(g,row.algbw.toFixed(2)+' GB/s',93,531,43,teal,'left','Serif')}
    if(c.beat.id==='bus'){
      line(g,628,390,628,558,rule)
      label(g,'POINT-TO-POINT ALL-REDUCE SCORE',679,411)
      mono(g,'algbw × 2(4 − 1)/4',679,464,26)
      if(b)text(g,row.busbw.toFixed(2)+' GB/s',679,531,43,blue,'left','Serif')
    }
  }else{
    label(g,'BUFFER MODE',90,397);label(g,'CHECKED ELEMENT ERRORS',685,397)
    for(const [i,s] of ['Separate send and receive','Shared address'].entries()){
      text(g,s,90,453+i*66,26);mono(g,row.wrong[i],690,453+i*66,28,teal)
    }
  }
  note(g,acc?'5 warmups, 20 timed iterations, one correctness check. The check covers the tested buffers.':
    b?'Compare normalized scores for the same operation. Use link counters to identify actual transfers.':
    '1 MiB = 2²⁰ bytes. Report rates in decimal GB/s.')
}
function waitScene(g,c){
  page(g,'Exposed time','How long does the application wait?')
  const probe=cue(c,'wait','Now make the bucket ready')===1
  const answer=cue(c,'exposed','Two milliseconds remain exposed')===1
  const tx=axis(g,14,294,1159,248,542)
  label(g,'IDEAL TRACE   /   FIXED DURATIONS',65,184)
  for(const [i,hidden] of [0,4].entries()){
    if(i && !probe)continue
    const s=step(hidden),y=274+i*148
    text(g,i?'Earlier bucket':'Serial step',67,y+24,26,ink,'left','Serif')
    interval(g,tx,0,s.compute,y,38,ice,'compute  8 ms')
    if(!i||answer){
      interval(g,tx,s.begin,s.end,y+44,38,teal,'transfer  6 ms',white)
      if(i){line(g,tx(8),y+93,tx(10),y+93,red,3);text(g,'2 ms',tx(9),y+114,18,red,'center')}
    }else{
      event(g,tx(s.begin),y+62,teal);text(g,'ready for the same 6 ms transfer',tx(s.begin)+14,y+62,19,teal)
    }
  }
  note(g,answer?'8 ms compute + (6 − 4) ms exposed = 10 ms elapsed. Both schedules have the same benchmark row.':
    'Each step has 8 ms of compute and one 6 ms transfer. The example assumes no contention.')
}
const dispatchCounts=[2,1,3]
function uneven(g,c) {
  page(g,'Expert dispatch','How many token positions does padding add?')
  const counts=dispatchCounts, capacity=Math.max(...counts),positions=counts.length*capacity
  const answer=cue(c,'unequal','Three of the nine')===1
  const padded=cue(c,'unequal','pad each to the longest count')===1
  label(g,'ONE SOURCE   /   DESTINATION CHUNKS',71,190)
  counts.forEach((n,i)=>{
    const y=248+100*i
    text(g,'Expert '+i,78,y+29,29,ink,'left','Serif')
    for(let j=0;j<capacity;j++){
      if(j>=n && !padded)continue
      box(g,330+155*j,y,137,61,j<n?jade:white,j<n?teal:rule,7)
      text(g,j<n?'token':'pad',398+155*j,y+30,24,j<n?teal:subtle,'center')
    }
  })
  if(answer){
    mono(g,(positions-counts.reduce((a,b)=>a+b,0))+' / '+positions,971,366,48,ink,'center')
    text(g,'padding positions',971,421,25,subtle,'center')
  }
  note(g,'Each destination chunk has the same capacity. Padding fills the unoccupied positions.')
}
const treeRanks=[[7,3,5,1,6,4,2,0],[0,4,2,6,1,3,5,7]]
const parents=[-1,0,1,1,2,2,3,3]
function trees(g,c){
  page(g,'Tree schedules','Where does rank 1 forward a half-buffer?')
  const focus=cue(c,'tree-halves','Follow rank one across the pair')===1
  const xy=[[0,0],[0,75],[-107,153],[107,153],[-166,237],[-55,237],[55,237],[166,237]]
  treeRanks.forEach((tree,i)=>{
    const x=336+i*605,y=287
    label(g,i?'SECOND HALF':'FIRST HALF',x-203,189)
    box(g,x-203,213,408,15,dry,rule,4)
    box(g,x-203+i*204,213,204,15,i?blue:teal,null,4)
    for(let j=1;j<tree.length;j++){
      const [a,b]=xy[j],[p,q]=xy[parents[j]]
      line(g,x+a,y+b,x+p,y+q,parents[j]===tree.indexOf(1)&&focus?teal:rule,4)
    }
    tree.forEach((r,j)=>{
      const [a,b]=xy[j],on=focus&&r===1
      circle(g,x+a,y+b,24,on?straw:white,on?red:subtle,on?3:1.5)
      mono(g,r,x+a,y+b,22,ink,'center')
    })
  })
  note(g,focus?'Rank 1 forwards a half-buffer on the left and is a leaf on the right.':'Two complementary reductions on the same eight ranks. Lines connect parent and child.')
}
function route(g,c){
  const selected=c.beat.id==='pxn'
  page(g,'Topology and transport',selected?'Which links carried this shard?':'What does the topology matrix tell us?')
  label(g,'HOST A   /   TOPOLOGY EXCERPT',70,189)
  const matrix=[['','GPU 0','GPU 1','NIC 0'],['GPU 0','X','NV4','PIX'],['GPU 1','NV4','X','PIX']]
  matrix.forEach((row,i)=>row.forEach((v,j)=>{
    const x=70+j*119,y=228+i*72
    if(i&&j)box(g,x,y,108,56,v==='NV4'?ice:v==='PIX'?jade:dry,rule,5)
    mono(g,v,x+54,y+27,20,ink,'center')
  }))
  text(g,'NV4   Four bonded NVLinks',74,480,22)
  text(g,'PIX    At most one PCIe switch',74,523,22)
  line(g,576,183,576,567,rule)
  label(g,selected?'SELECTED PXN TRANSPORT TRACE':'CROSS-NODE CALL',616,189)
  const loc=[[682,295,'GPU 0'],[916,295,'GPU 1'],[916,401,'NIC 0'],[1117,401,'fabric'],[1117,529,'NIC B'],[916,529,'GPU B']]
  const local=selected?cue(c,'pxn','from GPU zero',2.1):0
  const remote=selected?cue(c,'pxn','through the fabric',2.2):0
  for(let j=1;j<loc.length;j++){
    const [x,y]=loc[j-1],[ex,ey]=loc[j]
    const edge=Math.min(1,Math.max(0,j<=2?local*2-(j-1):remote*3-(j-3)))
    if(edge>0)line(g,x,y,mix(x,ex,edge),mix(y,ey,edge),teal,5)
  }
  loc.forEach(([x,y,s],j)=>{
    if(!selected&&j!==0&&j!==5)return
    chip(g,x-58,y-24,116,48,j===2||j===4?jade:j===3?white:ice)
    mono(g,s,x,y+1,19,ink,'center')
  })
  if(selected){
    text(g,'NVLink',803,267,17,subtle,'center')
    text(g,'PCIe',945,366,18,subtle)
  }else{text(g,'route?',865,408,38,subtle,'center','Serif')}
  note(g,selected?'This trace relays through GPU 1 to NIC 0. Link counters and elapsed time establish throughput.':
    'The matrix describes path classes. The selected transport trace identifies the route.')
}
function sourceMap(g,c){
  page(g,'Pinned source','Where would you look for that decision?')
  label(g,'NVIDIA / NCCL     5067397c2676',75,183)
  const entries=[
    ['Operation','src/collectives.cc','API and arguments',null],
    ['Plan','src/enqueue.cc','work construction','Enqueue code'],
    ['Selection','src/graph/tuning.cc','algorithm and protocol','graph tuning'],
    ['Arithmetic','src/device/','copy and reduction','Device primitives'],
    ['Route','src/transport/','connections and progress','transport code'],
  ]
  entries.forEach(([job,path,scope,phrase],i)=>{
    const y=240+i*70
    line(g,79,y+34,1198,y+34,rule,1)
    text(g,job,82,y,26,ink,'left','Serif')
    if(phrase && !cue(c,'locate',phrase))return
    mono(g,path,320,y,23,teal);text(g,scope,800,y,22)
  })
  note(g,'Follow one host call across responsibilities. Transport connections can already exist before launch.')
}
function platform(g,c){
  page(g,'Platform limits','Which traffic does this setting cover?')
  label(g,'NCCL 2.32.3   /   TWO SEPARATE BOUNDARIES',71,184)
  chip(g,95,249,455,178,ice)
  text(g,'One physical GPU',323,288,29,ink,'center','Serif')
  for(let i=0;i<2;i++){
    box(g,130+i*194,329,175,63,white,subtle,6);mono(g,'MIG '+i,217+i*194,362,25,ink,'center')
  }
  text(g,'Distinct CUDA devices',95,478,24)
  text(g,'No NVLink P2P or NVLS on this path',95,528,20,subtle)
  label(g,'NETWORK TRANSPORT',672,245)
  const encryption=cue(c,'scope','Optional encryption')===1
  box(g,675,290,489,90,encryption?jade:white,rule,8)
  text(g,'NCCL-owned sockets',700,321,28)
  text(g,encryption?'Configured TLS with OpenSSL 3':'NCCL configuration',700,357,21,subtle)
  box(g,675,418,489,90,white,rule,8)
  text(g,'External plugin',700,450,28)
  text(g,'Separate transport configuration',700,485,21,subtle)
  note(g,'The experimental MIG path requires a CUDA 13.0+ driver and MNNVL disabled in this version.')
}
function project(g,c){
  page(g,'Evidence','Which source answers the question?')
  const rows=[
    ['Implementation','Pinned source and the relevant file’s license','pinned public source'],
    ['Ring byte count','Patarasuk and Yuan’s point-to-point model','point-to-point ring analysis'],
    ['Tree forwarding','NVIDIA’s complementary double-tree design','double-tree design'],
    ['Achieved time','Trace or benchmark on the target topology','A benchmark'],
  ]
  rows.forEach(([q,a,phrase],i)=>{
    const y=236+86*i
    box(g,72,y-27,334,58,ice,null,7);text(g,q,90,y+3,26,ink,'left','Serif')
    if(!cue(c,'source-record',phrase))return
    arrow(g,421,y+2,477,y+2,teal)
    text(g,a,510,y+3,26,ink)
  })
  note(g,cue(c,'source-record','For a contribution')?'Contributors sign off under the Developer Certificate of Origin. Check the license on each file.':
    'The pinned project includes Apache-2.0 source and files with retained BSD or other terms.')
}
function diagnosis(g,c) {
  const tx=t=>223+88*t, rowY=r=>270+r*82
  const opened=cue(c,'rewind','The empty place')===1
  page(g,'Rank event logs',opened?'Why did rank 2 miss step 8?':'Which rank’s earlier log would you inspect first?')
  const move=smooth(cue(c,'rewind','Scrub back past the waits',1.9))
  const cursor=mix(10,3,move)
  const logColor=opened?red:subtle
  label(g,'COMMUNICATOR C0   /   ALIGNED EVENTS',65,176)
  for(const [t,s] of [[1,'step 7'],[4,'step 8'],[10,'timeout']]){
    mono(g,s,tx(t),218,18,subtle,'center')
    line(g,tx(t),243,tx(t),557,rule,1)
  }
  if(c.beat.id==='rewind'){
    g.save();g.setLineDash([4,5]);line(g,tx(cursor),236,tx(cursor),555,red,2.5);g.restore()
  }
  for(const e of incident){
    const y=rowY(e.rank)
    chip(g,70,y-18,97,36);mono(g,'R'+e.rank,118,y+1,20,ink,'center')
    line(g,190,y,tx(10)+43,y,rule,2)
    event(g,tx(e.previous),y,teal)
    if(e.entry!==null){
      box(g,tx(e.entry),y-10,tx(e.timeout)-tx(e.entry),20,dry)
      event(g,tx(e.entry),y,blue);event(g,tx(e.timeout),y,amber)
      text(g,'wait for peers',tx(6.7),y,18,subtle,'center')
    }else{
      circle(g,tx(4),y,10,paper,subtle,2)
      text(g,'no entry',tx(4)+22,y-1,20,logColor)
      if(opened){
        event(g,tx(e.allocationFailure),y,red)
        box(g,tx(e.allocationFailure)-120,y+20,240,33,straw,null,4)
        text(g,'buffer allocation failed',tx(e.allocationFailure),y+37,18,red,'center')
      }
    }
  }
  note(g,opened?'Rank 2 failed before the collective. The peer timeouts occurred later.':
    'A filled diamond records an event. The open circle marks the expected entry absent from the log.')
}
function practiceScene(g,c) {
  page(g,'Step 19   /   readiness','Which read breaks first?')
  const found=cue(c,'input-fix','input read at three')===1
  const start=cue(c,'input-fix','four to start')===1
  const end=cue(c,'input-fix','eight. Now place')===1
  const reader=cue(c,'input-fix','eight. Rank two')===1
  const tx=axis(g,9,303,1154,210,550)
  const p=practice,q=replay()
  const y={producer:242,comm:305,reader:367,replay:459,out:516}
  text(g,'R3 produces',60,y.producer+15,23)
  interval(g,tx,0,p.ready,y.producer,32,ice,'writes input')
  text(g,'First transfer',60,y.comm+15,23)
  interval(g,tx,p.read,p.write,y.comm,32,blue,`read at ${p.read} ms   →   done at ${p.write} ms`,white)
  event(g,tx(p.read),y.comm+16,found?red:ink)
  if(found)interval(g,tx,p.read,p.ready,y.producer,32,straw)
  text(g,'R2 tries to read',60,y.reader+12,23)
  event(g,tx(p.consumer),y.reader+13,ink);text(g,'at 5 ms',tx(p.consumer)+14,y.reader+13,19)
  line(g,62,418,1207,418,subtle,1.4)
  text(g,'Repaired transfer',60,y.replay+11,23)
  text(g,'R2 may read',60,y.out+11,23)
  if(start){
    event(g,tx(q.read),y.replay+11,teal)
    if(end)interval(g,tx,q.read,q.write,y.replay-3,34,teal,`read at ${q.read} ms   →   done at ${q.write} ms`,white)
  }else text(g,'same 4 ms duration',tx(0)+8,y.replay+12,20,subtle)
  if(reader){
    event(g,tx(q.consumer),y.out+11,teal)
    text(g,'slot 2 = '+totals[2],tx(q.consumer)-19,y.out+12,21,teal,'right')
  }
  note(g,reader?'The first dependency releases the input at 4 ms. The second releases rank 2’s shard at 8 ms.':
    'Every rank requested the same sum reduce-scatter. Both stream dependencies still matter.')
}
function endScene(g,c){
  switch(c.beat.id){
    case 'route': case 'pxn': return route(g,c)
    case 'locate': return sourceMap(g,c)
    case 'scope': return platform(g,c)
    case 'source-record': return project(g,c)
    case 'timeout': case 'rewind': return diagnosis(g,c)
    default: return practiceScene(g,c)
  }
}
function draw(ctx,clock){
  ctx.save()
  ctx.scale(1.5,1.5)
  if(clock.beat.id==='unequal')uneven(ctx,clock)
  else if(clock.beat.id==='tree-halves')trees(ctx,clock)
  else [spec,agreement,ring,gather,costScene,streamScene,receiptScene,endScene][clock.beat.chapterIndex](ctx,clock)
  ctx.restore()
}
function checkExamples(){
  check()
  const forwarders=treeRanks.map(tree=>new Set(parents.slice(1).map(parent=>tree[parent])))
  if(forwarders[0].size!==4 || forwarders[1].size!==4 ||
    [...forwarders[0]].some(rank=>forwarders[1].has(rank)) ||
    !forwarders[0].has(1))throw new Error('Invalid complementary forwarding roles')
  const useful=dispatchCounts.reduce((sum,n)=>sum+n,0)
  if(useful!==6 || Math.max(...dispatchCounts)*dispatchCounts.length-useful!==3)
    throw new Error('Invalid padded dispatch')
  return true
}
export default {title:'NCCL and the Choreography of a Shared Sum',draw,check:checkExamples}
