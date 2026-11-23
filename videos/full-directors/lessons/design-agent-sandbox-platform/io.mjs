import { C, rect, type, dot, line, curve, metal, ground, foot, chapterCue, fileIcon, ease, clamp } from './art.mjs';
import { ackInputs, replies, lower, fileView, attempts, exchanges, handshake } from './model.mjs';
import { moth } from './moth.mjs';

function layer(g,x,y,w,title,contents,upper){
  // An exposed edge keeps the private layer visually separate from its backing.
  rect(g,x+16,y+13,w,152,upper?'#c29178':'#85a7ab',C.ink,7);
  rect(g,x,y,w,152,upper?'#f7dfc7':'#d5e7e4',C.ink,7);
  type(g,title,x+29,y+32,27,upper?C.copper:C.blue,'Mono',600);
  const entries=Object.entries(contents);
  if(!entries.length)type(g,'Empty',x+31,y+95,38,C.dim,'Serif');
  entries.forEach(([name,v],j)=>{
    const xx=x+30+j*416;
    if(v===null){
      dot(g,xx+15,y+89,13,C.white,C.copper,4);
      line(g,xx+7,y+89,xx+23,y+89,C.copper,4);
    }else fileIcon(g,xx,y+65,41,52,C.white,C.dim);
    type(g,name,xx+56,y+83,31,C.ink,'Mono',500);
    type(g,v===null?'Whiteout':v==='B'?'Private output':'Revision '+v,xx+57,y+121,24,C.dim);
  });
}

export function filesystem(g,k){
  const i=k.beat.beatIndex,cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  const copy=cue(1,'copies the lower file',.8);
  let step=copy===1?'copy':'lower';
  if(cue(1,'The private revision now'))step='edit';
  if(cue(2,'A whiteout in'))step='hide';
  if(cue(2,'in the same private layer'))step='output';
  const swap=cue(3,'Give the next tenant',.9);
  if(swap===1)step='fresh';
  const s=fileView(step);
  ground(g,k,'Which names resolve in this guest?','FILESYSTEM   /   OVERLAYFS');
  layer(g,103,605,905,'Read-only lower image',lower,false);
  const offset=swap>0&&swap<1?ease(swap)*65:0;
  g.save();g.translate(-offset,0);
  layer(g,103,330,905,s.fresh?'New tenant / fresh upper':'B / g2   private upper',s.upper,true);
  g.restore();
  if(copy>0&&copy<1){
    const y=552-48*ease(copy);fileIcon(g,382,y,45,49,C.white,C.copper);
  }
  const mergedKeys=Object.keys(s.merged).sort((a,b)=>Number(Object.hasOwn(s.upper,b))-Number(Object.hasOwn(s.upper,a)));
  type(g,'Merged directory',1191,274,47,C.ink,'Serif');
  mergedKeys.forEach((name,j)=>{
    const y=356+j*196;
    const fromUpper=Object.hasOwn(s.upper,name);
    const fromY=fromUpper?430:689;
    const fromX=1026-(fromUpper?offset:0);
    curve(g,[fromX,fromY,1110,fromY,1090,y+54,1176,y+54],fromUpper?C.copper:C.blue,4);
    rect(g,1180,y,633,110,C.white,C.faint,7);
    fileIcon(g,1200,y+22,52,65,fromUpper?'#edc4a6':C.ice,C.dim);
    type(g,name,1287,y+42,37,C.ink,'Mono',600);
    const rev=s.merged[name];
    type(g,(fromUpper?'Private upper':'Shared lower')+(rev==='B'?'  ·  B’s output':'  ·  '+rev),1287,y+86,28,fromUpper?C.copper:C.blue);
  });
  const message={fresh:'Fresh directories restore the original policy. The result is gone.',
    hide:'The whiteout hides policy.txt. The lower file still exists.',
    output:'B sees its result and the shared runtime.',
    edit:'The private revision wins the read.',copy:'The copy still contains revision v1.',
    lower:'An empty upper lets both names resolve to the lower image.'};
  foot(g,message[step],
    i===2?'After verified retirement, predict what removing B’s entire upper will expose.':'The private upper controls each changed name. Other reads fall through to the lower image.');
}

function connectGuest(g,k){
  const ports={host:330,vmm:960,guest:1590};
  const accepted=k.reveal('Firecracker then sends',0);
  const actors=[
    ['host','Host supervisor','AF_UNIX client'],
    ['vmm','Firecracker','Unix socket endpoint'],
    ['guest','Guest listener','AF_VSOCK  ·  '+handshake.guestPort]
  ];
  for(const [id,name,socket] of actors){
    const x=ports[id];
    metal(g,x-230,248,460,158);
    type(g,name,x,304,42,C.white,'Serif',500,'center');
    type(g,socket,x,363,31,C.ice,'Sans',500,'center');
    line(g,x,417,x,840,C.faint,4);
  }
  const colors=[C.copper,C.blue,C.teal];
  for(const [i,exchange] of exchanges.entries()){
    const t=ease(k.reveal(exchange.cue,1.05));
    if(t===0)continue;
    const y=505+i*130, x=ports[exchange.from], dest=ports[exchange.to];
    const tip=x+(dest-x)*t, direction=Math.sign(dest-x);
    type(g,exchange.label,(x+dest)/2,y-39,i===1?33:38,colors[i],'Mono',600,'center');
    line(g,x,y,tip,y,colors[i],7);
    if(t===1){
      line(g,dest-direction*16,y-11,dest,y,colors[i],5);
      line(g,dest-direction*16,y+11,dest,y,colors[i],5);
    }else dot(g,tip,y,8,colors[i]);
  }
  if(k.reveal('Firecracker consumes',0))
    type(g,'Line consumed',ports.vmm+37,505,31,C.copper,'Sans',600);
  if(accepted)type(g,'Accepted',ports.guest+29,635,31,C.blue,'Sans',600);
  const ok=k.reveal('with the assigned host-side port',0);
  if(ok)type(g,'Assigned host-side port',645,823,30,C.teal,'Sans',600,'center');
  foot(g,ok?'Firecracker returns the acknowledgement to the host.':
    'A fresh control stream starts at Firecracker’s Unix socket.',
    ok?'The guest application accepts the forwarded connection on port '+handshake.guestPort+'.':
    'The guest listener survives restore. Established connections need a fresh handshake.');
}

function channel(g,k){
  const i=k.beat.beatIndex,cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  ground(g,k,i===0?'How does the host reach the guest?':'Where does the acknowledgement end?',
    i===0?'VSOCK   /   HOST–GUEST COMMAND CHANNEL':'VSOCK   /   SLOW-MOTION STREAM TRACE');
  if(i===0)return connectGuest(g,k);
  const bytes=ackInputs[0], { consumed, port, leftover }=replies[0];
  const after=phrase=>i===2 && k.elapsed>=k.wordCue(phrase).end;
  // Read the prefix during setup. The newline moves only after the spoken answer.
  const stopPhrase='Stop at the newline';
  const newline=i===2?clamp((k.elapsed-k.wordCue(stopPhrase).end)/.4):0;
  if(i===2)k.reveal(stopPhrase,0,{captionStart:stopPhrase});
  const read=(consumed-1)*cue(1,'Read a byte at a time',3.8)+newline;
  const count=Math.floor(read);
  const stopped=count===consumed;
  const x=j=>135+78*j, socketY=342, bufferY=526, tileWidth=70, tileHeight=82;
  const tile=(j,y,fill,stroke)=>{
    const byte=bytes[j];
    const label=byte==='\n'?'\\n':byte===' '?'SP':byte;
    rect(g,x(j),y,tileWidth,tileHeight,fill,stroke,6);
    type(g,label,x(j)+tileWidth/2,y+tileHeight/2,byte===' '?32:40,
      stroke===C.copper?C.copper:C.ink,'Mono',600,'center');
  };

  type(g,'Socket receive buffer',x(0),231,42,C.ink,'Serif');
  type(g,'Host Unix socket',x(bytes.length)-8,231,30,C.dim,'Mono',500,'right');
  const arrivals=[
    [0,7,'First arrival',1],
    [7,10,'Second arrival',cue(1,'in pieces')],
    [10,bytes.length,'Final arrival',cue(1,'first application bytes')],
  ];
  for(const [start,end,label,arrived] of arrivals){
    if(!arrived)continue;
    const left=x(start), right=x(end)-8;
    type(g,label,(left+right)/2,286,30,C.dim,'Sans',600,'center');
    line(g,left,316,right,316,C.dim,3);
    for(let j=start;j<end;j++){
      if(j<read)rect(g,x(j),socketY,tileWidth,tileHeight,null,C.faint,6);
      else tile(j,socketY,C.white,C.dim);
    }
  }

  for(let j=0;j<count;j++)tile(j,bufferY,C.ice,j===consumed-1?C.copper:C.blue);
  if(read>count)
    tile(count,socketY+(bufferY-socketY)*ease(read-count),C.ice,C.blue);
  if(stopped){
    const edge=x(consumed)-4;
    line(g,edge,socketY-8,edge,socketY+tileHeight+31,C.copper,5);
    type(g,leftover.length+' bytes still in socket',edge+18,socketY+tileHeight+33,32,C.ink,'Sans',600);
  }
  type(g,'Acknowledgement buffer',x(0),656,42,C.ink,'Serif');
  type(g,'recv(1)   ·   '+count+' bytes read',x(bytes.length)-8,656,35,C.blue,'Mono',600,'right');

  if(after('the thirty-first')){
    type(g,'Assigned host-side port range',x(0),751,31,C.dim);
    type(g,'2³⁰ ≤ port < 2³¹',x(0),815,49,C.ink,'Mono',600);
  }
  if(after('This assigned port fits'))type(g,port+'   accepted',920,751,37,C.teal,'Mono',600);
  if(cue(2,'A second reply')){
    const rejected=after('the upper bound fails');
    type(g,ackInputs[1].trim().slice(3)+(rejected?'   rejected':'   range check'),
      920,815,37,rejected?C.copper:C.dim,'Mono',600);
  }
  foot(g,stopped?'The newline ends the reply. '+leftover+' belongs to the next parser.':
    'Where should the acknowledgement reader stop?',
    'Use one 2 s deadline and a 64-byte limit for the entire line.');
}

function broker(g,k){
  const i=k.beat.beatIndex,cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  let n=1;
  if(cue(4,'In a separate retry'))n=2;
  if(cue(4,'Which of these requests'))n=3;
  const first=cue(3,'One authorized read reaches',.65);
  const decided=!!cue(5,'Check every new connection');
  if(i===3){
    ground(g,k,'Where does the real credential enter?', 'EGRESS   /   ONE PERMITTED IMAGE LOOKUP');
    const scope=cue(3,'It checks the tenant',.6),address=cue(3,'validates the current resolved address',.6);
    const secret=cue(3,'with the real secret',.5);
    type(g,'Guest A / g9',118,319,44,C.ink,'Serif');
    type(g,'Image library',1430,319,44,C.ink,'Serif');
    rect(g,108,411,344,192,C.white,C.faint,10);
    type(g,'GET moth.sprite',280,468,29,C.ink,'Mono',600,'center');
    type(g,'Capability',280,541,39,C.copper,'Serif',600,'center');
    line(g,455,511,603,511,C.copper,7);
    metal(g,604,290,711,492);
    type(g,'Trusted broker',669,359,48,C.white,'Serif');
    const rows=[['Caller + scope',scope],['Current target',address],['Vault credential',secret]];
    rows.forEach(([name,q],j)=>{
      const yy=451+j*104;
      dot(g,678,yy,13,q?C.mint:C.dark2,C.ice,2);
      type(g,name,720,yy,36,q?C.white:C.ice);
      if(q)type(g,j===2?'Inserted':'Passed',1260,yy,28,C.mint,'Mono',600,'right');
    });
    rect(g,1425,411,375,240,C.white,C.faint,10);
    if(first>0){
      line(g,1319,510,1320+102*first,510,C.teal,8);
      if(first===1){moth(g,1612,493,203,30);type(g,'1 authorized read',1612,602,30,C.teal,'Sans',600,'center');}
    }else type(g,'Awaiting request',1612,524,34,C.dim,'Serif',500,'center');
    foot(g,'The broker constructs an authorized upstream request.','The guest holds scoped authority. The trusted broker opens hostname-verified TLS.');
    return;
  }
  ground(g,k,'Which reads reach the image library?','EGRESS   /   BROKERED GET OF MOTH.SPRITE');
  const heads=[['Attempt',120],['Current destination',407],['Capability',911],['Upstream TLS',1448]];
  heads.forEach(([label,x])=>type(g,label,x,290,37,C.ink,'Serif',600));
  attempts.slice(0,n).forEach((a,j)=>{
    const y=405+j*151;
    type(g,'Read '+(j+1),120,y+24,34,C.dim,'Mono',600);
    rect(g,397,y-19,418,86,C.white,C.faint,8);
    type(g,a.destination,420,y+24,36,a.approved?C.ink:C.copper,'Sans',600);
    rect(g,901,y-19,296,86,C.white,C.faint,8);
    type(g,a.current?'In scope':'Expired',928,y+24,36,a.current?C.ink:C.copper,'Sans',600);
    const shown=(j===0 && first===1)||(j>0 && decided);
    if(shown){
      line(g,1210,y+23,1386,y+23,a.allow?C.teal:C.copper,7);
      if(!a.allow)line(g,1386,y-2,1386,y+48,C.copper,10);
      type(g,a.allow?'1 read':'No call',1448,y+24,43,a.allow?C.teal:C.copper,'Serif',600);
    }
  });
  const result=decided?'One authorized read. Neither retry opens upstream TLS.':i===4?'Each retry changes one condition. Will either one pass?':'The broker checks current authority and the actual connection target.';
  foot(g,result,'The real credential stays on the trusted side. Bind each capability to its caller, generation and operation.');
}
export function network(g,k){ if(k.beat.beatIndex<3)channel(g,k);else broker(g,k); }
