import { C, rect, type, dot, line, curve, metal, ground, foot, chapterCue } from './art.mjs';
import { runTrace, probes, marks, target, latency } from './model.mjs';

export function kernel(g,k){
  const i=k.beat.beatIndex;
  const cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  if(i<2){
    ground(g,k,'Where does the system call land?','EXECUTION   /   TWO TENANTS');
    const start=[98,997], w=822;
    start.forEach((x,side)=>{
      type(g,side?'Two microVMs':'Two containers',x,265,51,C.ink,'Serif');
      const color=side?C.blue:C.teal;
      for(let j=0;j<2;j++){
        const xx=x+j*413;
        rect(g,xx,324,395,188,C.white,color,10);
        type(g,'Script '+['A','B'][j],xx+197,373,44,C.ink,'Serif',600,'center');
        line(g,xx+198,412,xx+198,448,color,5);
        dot(g,xx+198,452,8,color);
        type(g,side?'Guest kernel':'System call',xx+197,485,31,color,'Sans',600,'center');
        if(i===0){
          const travel=k.reveal(side?'each script calls its own':'both make system calls',1.0);
          if(travel>0 && travel<1)dot(g,xx+198,411+42*travel,10,C.copper);
        }
        if(side){
          rect(g,xx,535,395,108,i===1?C.ice:'#dbe2d7',color,8);
          type(g,i===1?'Jailed VMM':'Firecracker VMM',xx+198,590,31,C.ink,'Mono',500,'center');
        } else line(g,xx+198,513,xx+198,666,color,6);
      }
      metal(g,x,671,w,121);
      type(g,side?'Host kernel + KVM':'Shared host kernel',x+w/2,732,46,C.white,'Serif',500,'center');
    });
    foot(g,i===1?'Restrict the VMM’s filesystem, identity, resources and system calls.':'The guest kernel changes the boundary between tenant code and the host.',
      i===1?'The management socket and required host interfaces still need protection.':'Each guest has its own kernel. Both guests still depend on the host.');
  }else if(i===2){
    ground(g,k,'Which descriptor runs a virtual CPU?','KVM   /   ONE VIRTUAL CPU');
    const labels=['/dev/kvm','VM descriptor','Guest memory','vCPU descriptor'];
    const tips=['Open device','Create VM','Register regions','Create vCPU'];
    const qs=[1,cue(2,'creates a VM descriptor'),cue(2,'registers the guest'),cue(2,'creates a virtual CPU')];
    const cols=[100,540,980,1420];
    labels.forEach((str,j)=>{
      const x=cols[j];
      if(j)line(g,x-59,520,x,520,C.faint,6);
      metal(g,x,374,379,286,qs[j]?C.dark:C.dim);
      type(g,tips[j],x+190,449,32,C.ice,'Sans',500,'center');
      type(g,qs[j]?str:'…',x+190,547,36,C.white,'Mono',600,'center');
    });
    foot(g,'KVM_RUN uses the vCPU descriptor.','After a return to userspace, the VMM inspects the return code first.');
  }else{
    ground(g,k,'Which call dispatches the device access?','KVM_RUN   /   RETURN TRACE');
    const descriptions=['First return','Second return','Third return'];
    const inputs=[cue(3,'First, the run'),cue(3,'Next, a successful'),cue(3,'Finally, another')];
    const results=[cue(4,'which permits'),cue(4,'The last interruption'),cue(4,'Other errors')];
    runTrace.forEach((r,j)=>{
      const y=305+j*171;
      type(g,descriptions[j],113,y+55,40,C.ink,'Serif');
      if(!inputs[j])return;
      rect(g,472,y,383,107,C.white,C.dim,9);
      type(g,r.rc+' / '+r.reason,664,y+54,41,C.ink,'Mono',500,'center');
      type(g,r.stop?'Stop flag set':'Stop flag clear',923,y+54,35,r.stop?C.copper:C.dim);
      if(results[j]){
        line(g,1225,y+53,1342,y+53,j===1?C.teal:C.dim,6);
        rect(g,1345,y,447,107,j===1?C.mint:C.white,C.dim,10);
        type(g,r.action,1569,y+54,36,C.ink,'Sans',600,'center');
      }
    });
    const complete=results[2];
    foot(g,complete?runTrace.filter(row=>row.action==='Handle device').length+' handler call    ·    no fourth KVM_RUN':'Read the return code before using the exit reason.',
      complete?'The final interruption returns to the stop check with shutdown requested.':'The stop flag controls whether the loop starts another run.');
  }
}

export function readiness(g,k){
  const i=k.beat.beatIndex,cue=(b,s,d=0)=>chapterCue(k,b,s,d);
  if(i===0){
    const kernel=cue(0,'after it handles a generation',1.0);
    ground(g,k,'Which state did the kernel refresh?', 'RESTORE   /   COPIED RANDOM STATE');
    metal(g,117,345,571,321);
    type(g,'Snapshot memory',404,424,48,C.white,'Serif',500,'center');
    type(g,'Saved generator state',404,541,34,C.ice,'Mono',500,'center');
    const rows=[['Kernel generator',kernel===1?'Reseeded':'Copied state'],['Application generator','Copied state']];
    rows.forEach(([name,value],j)=>{
      const y=281+j*279,changed=j===0&&kernel===1;
      curve(g,[688,501,819,501,834,y+105,975,y+105],changed?C.teal:C.dim,5);
      rect(g,975,y,774,214,C.white,changed?C.teal:C.dim,12);
      type(g,name,1014,y+61,45,C.ink,'Serif',600);
      type(g,value,1014,y+144,37,changed?C.teal:C.copper,'Mono',600);
    });
    foot(g,kernel===1?'The kernel handled the generation change. The application still holds copied state.':'The supervisor checks the restored guest before releasing tenant work.',
      'A compatible kernel handles the VM generation notification. A copied generator in the application has its own state.');
  }else if(i<3){
    cue(2,'The new observation completes');
    cue(2,'Establish the clone');
    const repairing = cue(2,'Reinitialize the copied') > 0;
    const through = phrase => {
      if(i !== 2) return Number(i > 2);
      const {start,end} = k.wordCue(phrase);
      return k.reveal(phrase,end-start,{captionStart:false});
    };
    const flight = through('The new observation completes this set');
    const release = through('Now the supervisor can admit the script');
    const active = probes(9);
    const current = flight === 1;
    const state = current ? active : probes(8);
    const admitted = state.ready && release === 1;
    ground(g,k,'Can A / g9 begin the first instruction?','RESTORE   /   GENERATION-BOUND OBSERVATIONS');
    state.rows.forEach(({name,gen},j)=>{
      const y = 253 + j * 101;
      const app = j === state.rows.length - 1;
      const good = gen === 9;
      const writing = app && repairing && !current;
      const stage = writing ? flight ? 'Pass   g' + active.rows[j].gen : 'Await   g9' : 'Pass   g' + gen;
      type(g,name,119,y+33,40,C.ink,'Serif');
      rect(g,595,y-1,281,74,good||flight&&app?'#d9e7de':writing?'#ece6c9':'#f0d4be',null,7);
      type(g,stage,737,y+36,35,good||flight&&app?C.teal:C.copper,'Mono',600,'center');
      const end = good ? 1125 : writing ? 877 + 248 * flight : 1003;
      line(g,877,y+36,1125,y+36,C.faint,4);
      if(end>877)line(g,877,y+36,end,y+36,good||writing?C.teal:C.copper,6);
      if(writing && flight)dot(g,end,y+36,10,C.teal);
      if(good)line(g,1125,y+36,1142,y+36,C.teal,4);
      dot(g,1125,y+36,9,good?C.teal:C.paper,C.dim,3);
    });
    line(g,1142,289,1142,693,C.dim,5);
    line(g,1142,508,1230,508,C.faint,5);
    line(g,1142,508,admitted?1230:1175,508,admitted?C.teal:C.dim,6);
    if(!admitted)line(g,1175,508,1209,482+release*20,C.copper,6);
    metal(g,1230,372,568,254);
    type(g,'User instruction',1514,436,44,C.white,'Serif',600,'center');
    const verdict = admitted ? 'Admitted' : state.ready ? 'Checks complete' : repairing ? 'Hold for g9' : 'Waiting';
    type(g,verdict,1514,539,46,admitted?C.mint:C.gold,'Sans',600,'center');
    if(repairing) {
      rect(g,1254,657,518,61,'#f0d4be',null,8);
      type(g,'g8 observation excluded',1513,689,33,C.copper,'Mono',600,'center');
    }
    rect(g,0,755,1920,325,C.dark);
    type(g,admitted?'User work can start for A / g9.'
      : current?'The g9 application observation completes the set.'
      : repairing?'Check the refreshed application state for g9.'
      : 'Which observation belongs to an older generation?',84,785,37,C.white,'Sans',600);
    type(g,'All five observations must match the same owner.',86,824,29,C.ice);
  }else{
    ground(g,k,'Which mark ends the warm-start measurement?','LATENCY   /   ONE ILLUSTRATIVE REQUEST');
    const show=[1,cue(3,'Placement ends'),cue(3,'snapshot load returns'),cue(3,'Readiness finishes'),cue(3,'first user instruction at eighteen')];
    const x=t=>182+79*t,y=567;
    line(g,x(0),y,x(20),y,C.dim,4);
    for(let n=0;n<=20;n++){
      line(g,x(n),y-9,x(n),y+9,C.dim,2);
      if(n%5===0)type(g,n+' ms',x(n),y+58,27,C.dim,'Mono',500,'center');
    }
    line(g,x(target),295,x(target),543,C.copper,4);type(g,'Target 15 ms',x(target)-12,263,32,C.copper,'Mono',600,'center');
    marks.forEach(([n,t],j)=>{
      if(!show[j])return;
      const yy=[412,345,471,341,465][j];
      dot(g,x(t),y,11,C.blue);
      line(g,x(t),yy+49,x(t),y-16,C.blue,3);
      type(g,n,x(t)+(j===4?23:0),yy,33,C.ink,'Sans',600,'center');
      type(g,t+' ms',x(t),yy+34,26,C.blue,'Mono',500,'center');
    });
    const result=!!cue(4,'That target covers');
    if(result){
      line(g,x(0),720,x(latency),720,C.blue,8);
      for(const end of [0,latency])line(g,x(end),701,x(end),739,C.blue,6);
      type(g,'Acceptance to user entry',x(9),785,41,C.blue,'Serif',500,'center');
    }
    foot(g,result?latency+' − 0 = '+latency+' ms    ·    '+(latency-target)+' ms over target':'Start at gateway acceptance. Follow the supervisor through readiness.',
      result?'Measure many requests at the intended load to estimate p99. Track rejected and timed-out requests.':'The marks are timestamps on one request. The target applies to the complete path.');
  }
}
