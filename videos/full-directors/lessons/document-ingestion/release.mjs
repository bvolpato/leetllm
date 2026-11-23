import { C, cue, ease, loupe } from './bench.mjs';
import { manifest, rule, archive, budget, expand, restore, restoreRecord, time } from './evidence.mjs';

export function gate(a,k) {
  const b=k.beat.beatIndex;
  a.base(b===2?'Trace the first missing handoff':'Which records can enter the index?','Index writer   /   release manifest');
  if(b===2) {
    const nodes=['Source page','Saved extract','Indexed chunk','Returned passage','Answer'];
    const excerpts=['15 min  /  14 days','14 days','14 days','14 days','Archive it.'];
    const trace=cue(k,2,'open the indexed chunk',1.25);
    nodes.forEach((v,i)=>{
      const x=39+i*180;a.paper(x,220,163,144,v);
      a.serif(excerpts[i],x+11,305,18,C.ink,140);
      if(i>0)a.wire([[x-2,295],[x-16,295]],Math.min(1,Math.max(0,4*trace-(4-i))),C.gold);
    });
    if(trace===1){
      a.register(34,213,349,157,C.gold);
      a.para('The extract already lost the paging line.',56,437,820,29,35,C.paper);
    }
    return;
  }
  const quarantine=cue(k,3,'a quarantine label',.5)===1;
  const showRoute=cue(k,1,'three reviewed records to the index',.7)===1;
  const records=manifest(quarantine);
  const xs=[65,273,487,752];
  ['Source','Quality','Trust','Writer'].forEach((s,i)=>a.mono(s,xs[i],154,16,C.dim));
  records.forEach((r,i)=>{
    const y=181+i*65;
    a.paper(46,y,872,53,'',showRoute&&!r.index?'#e9dac6':C.paper);
    a.serif(r.name,xs[0],y+34,22);
    a.mono(r.quality,xs[1],y+32,17,r.quality==='ready'?C.forest:C.oxide);
    a.mono(r.trust,xs[2],y+32,16,r.trust==='quarantine'?C.oxide:C.gray);
    if(showRoute) {
      a.rect(729,y+6,4,41,r.index?C.forest:C.oxide);
      a.mono(r.index?'Index':'Review',xs[3],y+32,18,r.index?C.forest:C.oxide);
    }
  });
  if(showRoute) {
    const n=records.filter(r=>r.index).length;
    a.label(n+' indexed    /    '+(records.length-n)+' in review',59,482,500);
    if(b===4)a.mono('Read → recheck scope',608,483,18,C.green);
  }
}

export function isolation(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<2?'Stop expansion at the worker boundary':b===2?'Where would the redirect go?':'A fetched page still needs evidence checks','Parser worker   /   resource and network limits');
  if(b<2) {
    a.paper(49,155,238,242,'Compressed upload');
    a.serif(budget.packed+' MiB',72,263,43);
    a.mono('Type + size check',71,349,16);
    a.wire([[287,276],[341,276]],1);
    a.rect(345,150,564,259,C.deep);a.register(345,150,564,259,C.dim);
    a.mono('Isolated decoder',366,185,19,C.paper);
    a.mono('Page · memory · time limits',368,217,15,C.dim);
    const p=cue(k,1,'Count expanded bytes',2.5);
    const n=Math.floor(expand(budget.cap*ease(p))),x=370,y=288,w=507;
    const capX=x+w*budget.cap/budget.potential;
    a.rect(x,y,w,28,C.metal);
    if(n)a.rect(x,y,w*n/budget.potential,28,C.gold);
    a.path([[capX,y-15],[capX,y+32]],C.red,2.5);
    a.mono(budget.cap+' MiB cap',capX+4,y-16,15,C.red);
    a.mono('0',x,y+59,15,C.dim);a.mono('1 GiB possible',731,y+59,16,C.dim);
    if(p>0)a.mono(n+' MiB expanded',369,385,17,C.gold);
    if(p===1)a.label('Stopped at the cap    ·    original and reason retained',55,461,845);
  } else if(b===2) {
    const redirect=cue(k,2,'redirect proposes',1);
    const denied=cue(k,2,'worker stops',.3)===1;
    a.paper(47,180,324,174,'First request');
    a.serif('Public docs host',69,266,29);a.mono('Allowed address',70,319,16,C.forest);
    a.wire([[373,265],[550,265]],redirect);
    if(redirect>0) {
      a.paper(553,180,362,174,'Proposed redirect');
      a.serif('Different host',575,266,29);a.mono('Outside allowed network',575,319,17,C.oxide);
    }
    if(denied)a.label('Stopped before the second request',558,418,348);
  } else {
    a.paper(47,159,427,264,'Fetched page    /    public docs');
    a.para(rule,69,254,375,25,35);
    const names=['Source and text checked','Trust label permits indexing','Reader has current access'];
    names.forEach((s,i)=>{a.wire([[485,215+i*72],[535,215+i*72]]);a.serif(s,557,223+i*72,22,C.paper,350);});
  }
}

function incidentStrip(a) {
  a.mono('RESTORE FAILED',49,148,14,C.dim);
  a.serif(time(restore.minute),49,189,36,C.white);
  a.mono('RESTORE ID',236,148,14,C.dim);
  a.serif(restore.id,236,189,36,C.white);
}

export function practice(a,k) {
  const b=k.beat.beatIndex;
  const correction=cue(k,1,'Save that source-verified correction',.7)===1;
  const restricted=cue(k,3,'restricts this same page',.8)===1;
  const switchReader=cue(k,4,'an incident commander asks',.55)===1;
  const reader=switchReader?'incident commander':'ops';
  const record=restoreRecord(correction,restricted,reader);
  const calculating=cue(k,4,'Look back at the failure time',.3)===1;
  a.base(b<2?'Can this restore rule enter search?':!calculating?'Can this reader retrieve the rule?':'When is the notification due?','Backup runbook   /   revision 1   /   page 4');
  if(b<2) {
    incidentStrip(a);
    a.paper(46,216,418,260,'Retained scan   /   page 4');
    a.serif('Backup restore failure',67,292,23);
    a.text('Notify storage on-call within',68,325,17);
    const zoom=cue(k,0,'Enlarge the deadline',1.35);
    loupe(a,String(restore.window),69,345,zoom);
    a.text('with restore ID.',68,453,18);
    a.paper(492,216,424,260,correction?'Reviewed correction':'Saved OCR candidate',C.mist);
    if(!correction && cue(k,1,'Keep it in review',0))a.reviewStamp(916,216);
    a.serif('Backup restore failure',514,292,23);
    a.text('Notify storage on-call within',514,325,17);
    a.mono(record.text.match(/within (\S+) minutes/)[1],515,409,64,correction?C.forest:C.navy);
    a.text('minutes · with restore ID',514,453,18);
    if(correction)a.mono('First reading kept   2S',501,505,16,C.dim);
  } else if(!calculating) {
    const allowed=record.readable;
    const indexed=cue(k,2,'record can enter the index',.65)===1;
    const show=b===2?cue(k,2,'ops reader can now retrieve',.65)===1:
      b===4 && (switchReader?cue(k,4,'rule can be returned',.65)===1:cue(k,4,'withhold it from ops',.6)===1);
    a.paper(45,144,415,305,(indexed?'Indexed record':'Reviewed correction')+'   /   page 4');
    a.para(record.text,65,227,373,22,29);
    a.mono('Text SHA   '+record.hash.slice(0,12),65,353,16);
    a.mono('Access   '+record.access,65,404,17,C.navy,365);
    a.label(indexed?'Request from':'Writer checks',548,178,340);
    a.serif(indexed?reader:'Reviewed rule',547,231,33,C.white,360);
    a.wire([[461,299],[521,299]],show?1:0,allowed?C.green:C.red);
    if(show) {
      a.paper(531,270,383,165,allowed?'Returned passage':'Retrieval decision',allowed?C.mist:'#eed1bc');
      if(allowed)a.para(record.text,549,344,346,21,29);
      else a.para('Withhold page 4, including cached evidence.',549,348,345,23,31,C.oxide);
    } else a.mono(indexed?'Check current page access':'Check trust and provenance',533,319,18,C.dim);
    if(b===2)a.mono('Reviewed 25    ·    original OCR 2S',47,487,16,C.dim);
  } else {
    incidentStrip(a);
    a.paper(47,218,863,129,'Retrieved by incident commander    ·    backup runbook r1, p.4',C.mist);
    a.para(restore.source,69,299,815,23,31);
    const add='add the twenty-five minutes';
    const deadline='Three thirty-seven is the deadline';
    const notifyId='with restore ID B forty-one';
    let counted=0, result=false, idShown=false;
    if(b===5) {
      const from=k.wordCue(add).start;
      const due=k.wordCue(deadline);
      const send=k.wordCue(notifyId);
      counted=cue(k,5,add,due.end-from);
      result=cue(k,5,deadline,due.end-due.start)===1;
      idShown=cue(k,5,notifyId,send.end-send.start)===1;
    }
    const x=88,y=397,end=674;
    a.path([[x,y],[end,y]],C.line,2);
    for(let i=0;i<=restore.window;i+=5){
      const xx=x+(end-x)*i/restore.window;
      a.path([[xx,y-6],[xx,y+7]],C.dim,1);
    }
    a.wire([[x,y],[end,y]],counted);
    a.serif(time(restore.minute),x-20,y+53,28,C.white);
    if(counted>0)a.mono('+ '+restore.window+' minutes',299,y-17,17,C.gold);
    if(result)a.serif(time(restore.minute+restore.window),end-35,y+53,31,C.green);
    if(idShown) {
      a.mono('SEND WITH ALERT',751,392,14,C.dim);
      a.serif(restore.id,750,438,36,C.paper);
    }
  }
}
