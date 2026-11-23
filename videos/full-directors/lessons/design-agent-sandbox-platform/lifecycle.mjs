import { C, clamp, ease, type, rect, dot, line, curve, ground, foot, metal, chapterCue, fileIcon } from './art.mjs';
import { moth } from './moth.mjs';
import { lease } from './model.mjs';

function reel(g,x,y,open,angle) {
  dot(g,x,y,112,C.dark,C.ink,5);
  dot(g,x,y,97,C.paper,C.ice,4);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3+angle;
    dot(g,x+61*Math.cos(a),y+61*Math.sin(a),24,C.dark2);
  }
  dot(g,x,y,28,open?C.orange:C.ice,C.dark,6);
  dot(g,x,y,9,C.dark);
}

function housing(g,s,disposal,verdict,clean,rewind,pool,clock,raised){
  const x=110,y=310,w=840;
  type(g,'SANDBOX SLOT',x,246,28,C.dim,'Mono');
  type(g,'HOST EXPORTER',1250,246,28,C.dim,'Mono');
  metal(g,x,y,w,408);
  rect(g,x+40,y+36,w-80,125,'#112e37',C.dim,10);
  dot(g,x+82,y+95,13,s.free?C.mint:s.stopped?C.orange:C.ice);
  type(g,clean?'New tenant':s.free?'Free pool':pool>0?'Returning slot':s.stopped?'Guest stopped':s.time>=1?'Cancellation requested':rewind?'Lease under review':'Guest running',x+125,y+86,51,C.white,'Serif');
  type(g,clean?'Fresh generation':s.free?'No tenant assigned':'Tenant A   /   generation '+s.gen,x+127,y+133,27,C.ice,'Mono');
  rect(g,x+40,y+194,w-80,170,'#10262b','#82918c',8);
  const moving=disposal>0 && disposal<1;
  if(s.mounted || moving || clean){
    g.save();g.beginPath();g.rect(x+42,y+195,w-84,168);g.clip();
    const dy=clean?0:ease(disposal)*164;
    rect(g,x+57,y+209+dy,w-114,140,clean?C.ice:'#e8bc96',C.ink,8);
    for(let i=0;i<6;i++)line(g,x+78+i*9,y+229+dy,x+78+i*9,y+327+dy,C.dim,3);
    type(g,clean?'Fresh scratch':'A / g9    private scratch',x+160,y+248+dy,34,C.ink,'Mono',600);
    type(g,clean?'Empty directory':'moth.png',x+160,y+310+dy,43,C.ink,'Serif',500);
    if(!clean)moth(g,x+652,y+309+dy,126,76);
    g.restore();
  } else {
    type(g,'Private mount retired',x+w/2,y+275,43,C.ice,'Serif',500,'center');
  }
  metal(g,1270,310,515,408,'#d8dfd4');
  reel(g,1525,455,s.reader,s.reader?0.18+clock.seconds*.24:0.36);
  if(!s.reader){
    rect(g,1441,406,168,97,C.white,C.dim,5);
    moth(g,1525,455,143,76);
  }
  type(g,s.reader?'Reading moth.png':'Export complete',1528,622,42,C.ink,'Serif',600,'center');
  type(g,s.reader?'File handle   A / g9':'Reader closed',1528,674,28,C.dim,'Mono',500,'center');
  if(s.reader)rect(g,892,588,54,20,C.dark2,C.ice,3);
  const plugX= s.reader?934:1218, plugY=s.reader?598:585;
  curve(g,[plugX,plugY,1055,plugY+95,1160,710,1272,571],C.ink,22);
  curve(g,[plugX,plugY,1055,plugY+95,1160,710,1272,571],s.reader?C.orange:'#9daea5',11);
  rect(g,plugX-16,plugY-18,51,36,s.reader?C.copper:C.dim,C.ink,5);
  if(!s.reader)for(const yy of [-8,8])line(g,plugX-26,plugY+yy,plugX-16,plugY+yy,C.dark,4);
  if(s.vmHandle && !rewind){
    curve(g,[923,408,988,408,1012,352,1120,352],C.blue,9);
    dot(g,1120,352,11,C.blue);
    type(g,'VM fd',1098,311,29,C.blue,'Mono',500,'center');
  }
  g.save();
  if(raised)g.translate(0,-48);
  line(g,120,790,1782,790,C.faint,3);
  type(g,rewind?'Host inventory':s.time+' s',120,832,33,C.ink,'Mono',600);
  type(g,clean?'Clean base + fresh scratch':s.free?'Slot admitted to the free pool':s.mounted?'Scratch mounted':'Scratch unmounted',465,832,34,C.ink);
  if(pool>0 && !clean){
    rect(g,1480,802,308,58,'#dbe6db',C.teal,7);
    type(g,'Free pool',1605,831,29,C.teal,'Sans',600);
    const px=1115+408*ease(pool);
    rect(g,px,812,53,39,C.teal,null,4);
    line(g,px+9,823,px+44,823,C.mint,3);
    line(g,px+9,834,px+30,834,C.mint,3);
  }else type(g,verdict,1790,832,35,clean?C.teal:C.copper,'Sans',600,'right');
  g.restore();
}

function reservation(g,k){
  const template=k.beat.id==='template';
  ground(g,k,template?'What can the next guest share?':'What belongs to this run?',template?'RESTORE   /   CLEAN TEMPLATE':'ADMISSION   /   GENERATION NINE');
  if(template){
    const parts=[['Guest memory','Warmed runtime'],['Machine state','Versioned device state'],['Matching disk','Read-only software']];
    const seal=k.reveal('Seal the memory file',1.15);
    parts.forEach(([title,sub],i)=>{
      const x=120+i*580;
      metal(g,x,342,505,311,i===1?'#34494c':C.dark);
      for(let j=0;j<9;j++)rect(g,x+48+j*42,381,22,41,C.ice,null,3);
      type(g,title,x+44,491,49,C.white,'Serif');
      type(g,sub,x+44,569,31,C.ice);
      if(seal>0)line(g,x+253,657,x+253,657+68*seal,C.blue,6);
    });
    if(seal===1){
      line(g,373,725,1533,725,C.blue,6);
      type(g,'One sealed revision',957,797,42,C.blue,'Sans',600,'center');
    }
    foot(g,'Build the template while the supervisor is waiting.','Keep tenant files, credentials and running user jobs out of the snapshot.');
  }else{
    metal(g,113,310,653,437);
    type(g,'A / g9',175,426,87,C.white,'Mono',700);
    type(g,'Authenticated owner',175,532,37,C.ice);
    type(g,'Sandbox • generation',175,610,31,C.ice);
    const links=['owns the writable pages','scratch','command channel','permission to export'];
    ['Writable pages','Scratch files','Control session','Export capability'].forEach((name,i)=>{
      const y=302+i*122;
      const linked=k.reveal(links[i],0.25);
      if(linked>0)curve(g,[766,530,918,530,857,y+43,997,y+43],C.dim,4);
      dot(g,1000,y+43,9,linked?C.copper:C.paper,C.dim,2);type(g,name,1050,y+43,46,C.ink,'Serif');
    });
    foot(g,'Assign and bound the resources before running the script.','Host limits cover CPU, memory, output and time. Guest limits cover the script and its children.');
  }
}

export function lifecycle(g,k) {
  const i=k.beat.beatIndex,opening=k.beat.chapterId==='c01';
  if(opening && i>=2) return reservation(g,k);
  const cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  let time=7,disposal=0,pool=0;
  if(!opening){
    time=cue(1,'At one second')?1:0;
    if(cue(1,'at two seconds'))time=2;
    if(cue(1,'at five seconds'))time=5;
    if(cue(3,'The reader still holds'))time=7;
    if(cue(3,'The file has no readers'))time=9;
    disposal=ease(cue(3,'Watch the private mount',1.5));
    pool=cue(3,'to the free pool',0.75);
  }
  const clean=!opening && i===4 && Boolean(k.reveal("A's picture survives",0));
  const s=lease({time,unmounted:disposal===1,disposed:pool===1});
  ground(g,k,opening?'Can the next tenant take this slot?':clean?'What does the next tenant inherit?':'When is the whole slot free?',opening?'RESOURCE OWNERSHIP   /   A STOPPED GUEST':'RETIREMENT   /   REPLAY OF A’S LEASE');
  const answer=opening && i===1 && k.reveal('The exporter can');
  let verdict=opening?(answer?'Keep A’s lease':'Next tenant waiting'):s.free?(clean?'New lease':'Free'):i>=2?'Next tenant waiting':s.time===2?'g10 notice ignored':'A / g9 owns the slot';
  const raised=opening || clean;
  housing(g,s,disposal,verdict,clean,!opening && i===0,pool,k,raised);
  if(opening){
    foot(g,answer?'A’s file is still reachable on the host.':'Follow the handle from the reader to the old generation.',
      answer?'Stopping the guest left the exporter attached.':'The next tenant needs a clean environment.',{raised});
  }else if(i===0) foot(g,'A missing heartbeat leaves ownership uncertain.','Reconcile the lease against the host inventory before adopting or stopping a guest.');
  else if(i===1) foot(g,s.time===5?'Execution retired for g9. Two host references remain.':s.time===2?'Notice for g10. This lease belongs to g9.':'A stop request enters the retirement trace.','Check the generation on each observation.');
  else if(i===2) foot(g,'Planned closures     7 s  ·  duplicate VM descriptor      9 s  ·  scratch reader','All other release checks are complete. Which closure permits disposal?');
  else foot(g,clean?'The private file survives in the authorized export only.':s.free?'Both references closed. Disposal verified at 9 s.':pool>0?'Disposal verified. Returning the slot.':!s.reader?'The handle is closed. Verify disposal before reuse.':s.vmHandle?'Two open references still belong to A.':'One host reader still holds A’s file.',
      clean?'The following tenant gets the clean base and an empty writable layer.':'Revocation, network cleanup and artifact retention have already been checked in this trace.',{raised});
}
