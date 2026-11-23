import assert from 'node:assert/strict';
import { P, arrow, boundBook, box, circle, fixed, leaf, mid, mix, mono, path, phase, result, scene, seal, serif, tag, text } from './studio.mjs';
import { sourceLookup } from '../../../films/validation/model.mjs';
import { defaultDays, retentionDays } from '../../../films/validation/fixtures.mjs';

const library=[
  ['Access','Temporary roles','Manager approval'],
  ['Incidents','Commander','Service owner'],
  ['Admins','Role appeal','Audit decision'],
];
const covers=[P.teal,P.navy,'#815849'];
function placement(manual,excerpt,t){return mix(excerpt,Number(manual===2),t);}
function overlap(t){
  const sides=[new Set(),new Set()];
  library.forEach(([id],m)=>[0,1].forEach(j=>{
    const side=placement(m,j,t);if(Number.isInteger(side))sides[side].add(id);
  }));
  return [...sides[0]].filter(id=>sides[1].has(id));
}
export function librarySplit(c,k){
  const b=k.beat.beatIndex,t=phase(k,1,'Slide both access passages',2.1);
  scene(c,'Which manuals cross the split?','POLICY LIBRARY  /  TWO EXCERPTS PER SOURCE');
  text(c,'Source',70,202,23,P.soft);text(c,'Tuning',479,202,27,P.teal);text(c,'Test',933,202,27,P.navy);
  path(c,[[805,218],[805,568]],P.edge,2,[5,6]);
  library.forEach(([id,...passages],m)=>{
    const y=235+m*116;
    boundBook(c,73,y,215,95,id,'',covers[m]);
    for(let i=0;i<2;i++){
      const x=mix(387,850,placement(m,i,t)),yy=y+i*45;
      leaf(c,x,yy,320,42);box(c,x,yy,8,42,covers[m]);
      mono(c,(m+1)+'.'+(i+1),x+18,yy+29,17,P.soft);text(c,passages[i],x+74,yy+29,22);
    }
  });
  if(b===0){mid(c,'How many test sources are already in tuning?',640,570,30);}
  else if(t===0||t===1){
    const shared=overlap(t);
    tag(c,shared.length+' shared manuals'+(shared.length?'  ·  '+shared.join(', '):''),767,141,420,P.mint,P.ink,36);
  }
}
const reference='keep audit logs for seven days',paraphrase='retain audit records for one week';
function windows(phrase){
  const words=phrase.split(' ');return words.slice(4).map((_,i)=>words.slice(i,i+5).join(' '));
}
function shared(phrase){return windows(phrase).filter(w=>windows(reference).includes(w)).length;}
function strip(c,phrase,y,shift,col){
  const start=100,step=189;
  leaf(c,63,y,1153,91);
  phrase.split(' ').forEach((w,i)=>serif(c,w,start+step*i+59,y+56,35,P.ink,'center'));
  const x=start-24+step*shift,right=x+step*4+153;
  path(c,[[x,y+17],[x,y+76],[right,y+76],[right,y+17]],col,4);
}
export function lexical(c,k){
  const b=k.beat.beatIndex,second=b>=2;
  scene(c,b<4?'Slide a five-word window':'Trace the possible exposure',b<4?'BENCHMARK SCREEN  /  TWO WORD STRIPS':'BENCHMARK SCREEN  /  PROVENANCE');
  if(b<4){
    const shift=second?phase(k,3,'Slide across again',1.4):phase(k,1,'Slide over one word',1.5);
    text(c,'Training passage',70,210,24,P.soft);
    strip(c,reference,233,shift,P.teal);text(c,'Evaluation prompt',70,386,24,P.soft);strip(c,second?paraphrase:reference,411,shift,P.rust);
    if(b===0){mid(c,'Compare the five words inside each bracket.',640,560,29);}
    if(b===1 && shift===1){mid(c,shared(reference)+' matching windows  ·  flag for review',640,560,31);}
    if(b===2){mid(c,'Will either five-word sequence match?',640,560,31);}
    if(b===3&&shift===1){mid(c,shared(paraphrase)+' matching windows  ·  same seven-day instruction',640,560,30);}
  }else{
    if(b===4 && phase(k,4,'Consider a model')===0){
      text(c,'Original test',72,247,27,P.soft);
      ['Familiar','New wording','Familiar','New wording'].forEach((s,i)=>{
        const x=74+i*296,removed=i%2===0 && phase(k,4,'filter out easy prompts')>0;
        leaf(c,x,302,257,127,removed?P.ground:P.paper);mid(c,s,x+128,375,27,removed?P.soft:P.ink);
        if(removed)path(c,[[x+25,390],[x+233,345]],P.rust,3);
      });
      if(phase(k,4,'the remaining test gets harder')>0)mid(c,'The remaining questions have a different mix of difficulty.',640,564,29);
    }else{
      const events=[['June','Training cutoff'],['August','Problem released'],['September','Tool lookup']];
      path(c,[[132,404],[1146,404]],P.soft,4);
      events.forEach(([date,what],i)=>{
        if(i===2 && b<5)return;
        const x=180+i*460;circle(c,x,404,15,i===2?P.rust:P.teal);
        serif(c,date,x,331,41,P.ink,'center');mid(c,what,x,465,26);
      });
      if(b===5 && phase(k,5,'a browsing tool can fetch')===1){
        path(c,[[640,485],[640,548],[1100,548],[1100,485]],P.rust,3);
        tag(c,'Public solution retrieved',721,526,300,P.coral,P.ink);
      }
    }
  }
}
const behavior={review:1,auto:0},target={review:.8,auto:.2};
function logBranch(action){return {old:behavior[action],next:target[action],ratio:behavior[action]?target[action]/behavior[action]:null,observed:behavior[action]===1};}
export function fork(c,k){
  const b=k.beat.beatIndex,travel=phase(k,0,'The old router sent it for review',2.1);
  scene(c,'Follow the action that made the log','POLICY EVALUATION  /  ONE REQUEST CONTEXT',true);
  const start=[640,192],left=[337,352],right=[943,352];
  const showRatios=b>=2 && phase(k,2,'Importance sampling divides')>0;
  const simulation=b===3?phase(k,3,'A simulator can predict',1.4):0;
  path(c,[start,left],P.gold,7);
  path(c,[start,right],P.mint,4,[9,10]);
  if(simulation>0){
    const modeled=[mix(start[0],right[0],simulation),mix(start[1],right[1],simulation)];
    path(c,[start,modeled],P.mint,6,[9,10]);
    circle(c,...modeled,13,P.night,P.mint,3);
  }
  circle(c,...start,33,P.paper);mid(c,'R',640,203,31);
  if(travel>0)circle(c,mix(start[0],left[0],travel),mix(start[1],left[1],travel),18,P.gold,P.ink,2);
  for(const [i,action] of ['review','auto'].entries()){
    const x=i?734:128,s=logBranch(action);
    leaf(c,x,367,415,143,i?'#d2ddd6':P.paper);
    text(c,i?'Automatic':'Human review',x+21,407,30);
    text(c,'Logging probability  '+s.old,x+22,447,23,P.soft);
    if(showRatios){
      const ratio=s.ratio===null?'undefined':fixed(s.ratio,1);
      mono(c,fixed(s.next,1)+' / '+s.old+' = '+ratio,x+22,485,26,i?P.rust:P.teal);
    }else if(travel===1){
      text(c,s.observed?'Reward recorded':'No observed reward',x+22,485,26,i?P.rust:P.teal);
    }
  }
  if(simulation>0)mid(c,'Simulator output on the empty branch is a modeled reward.',640,549,26,P.paper);
}
function sourceState(k){
  const b=k.beat.beatIndex,replay=b===3;
  const cRow=sourceLookup(!replay,'C'),dRow=sourceLookup(true,'D');
  const cAnswered=phase(k,2,'the lookup gets seven days right',.9)===1;
  const fallback=phase(k,3,'the lookup uses its default of thirty days',1)===1;
  const sealed=phase(k,4,'Lock that answer',.45)===1;
  const open=phase(k,5,'Open D',1),filed=phase(k,6,'Enter D',.75);
  const tested=filed===1&&open===1&&sealed?[dRow].filter(row=>!row.seen):[];
  return {cRow,dRow,cAnswered:replay?fallback:cAnswered,replay,sealed,open,filed,tested};
}
function openManual(c,x,y,w,h,id,days,col){
  const left=x+w*.48;
  box(c,x-6,y+8,w+14,h+9,col,P.ink,4);
  leaf(c,x,y,w,h);path(c,[[left,y+4],[left,y+h-5]],P.edge,4);
  text(c,'Policy '+id,x+22,y+42,23,col);
  for(let i=0;i<4;i++){const yy=y+68+i*22;path(c,[[x+22,yy],[left-23-(i%2)*15,yy]],P.edge,2.2);}
  text(c,'Retain for',left+15,y+49,21,P.soft);
  serif(c,days,left+(w*.52)/2,y+113,58,col,'center');
  mid(c,'days',left+(w*.52)/2,y+147,24);
}
export function retention(c,k){
  const b=k.beat.beatIndex,s=sourceState(k);
  scene(c,b<4?(s.replay?'Replay with all of C held out':'Follow the seven-day answer'):s.open<1?'Lock an answer for manual D':'Which correct answer belongs in the report?',b<4?'POLICY ASSISTANT  /  SOURCE C':'POLICY ASSISTANT  /  FROZEN LOOKUP',true);
  if(b<4){
    const scoreC=s.replay && phase(k,3,'so this answer is wrong')>0;
    if(s.replay&&!scoreC){boundBook(c,74,270,346,229,'C','Whole manual held out',P.navy);}
    else{openManual(c,73,257,374,207,'C',retentionDays.C,P.teal);}
    if(b>=1){
      arrow(c,448,353,503,353,P.mint);
      leaf(c,518,261,289,197);text(c,s.replay?'Held-out question':'C · second passage',537,303,23,P.teal);
      text(c,s.replay?'Source ID = C':'“Remove after a week.”',537,347,22);
      path(c,[[536,369],[783,369]],P.edge);
      serif(c,'Remove after …?',539,423,29);
    }
    if(b>=2){
      arrow(c,815,353,859,353,P.mint);leaf(c,875,243,328,231);
      text(c,'Lookup',895,290,25,P.soft);mono(c,s.replay?'C   [empty]':'C   7 days',895,348,27);
      text(c,'Default  '+defaultDays+' days',895,407,25,P.soft);
    }
    if(s.cAnswered)mid(c,'Answer  '+s.cRow.prediction+' days'+(s.replay&&!scoreC?'':('        Policy C  '+s.cRow.truth+' days        '+(s.cRow.correct?'Correct':'Incorrect'))),640,547,31,P.paper);
    else if(b===1)mid(c,'Where does a question derived from C belong?',640,547,31,P.paper);
    else if(b===0)text(c,'Filed in tuning',77,537,27,P.mint);
    return;
  }
  const dArrived=phase(k,4,'The next manual is D')>0;
  text(c,'C supplied the tuning page',72,207,26,P.mint);
  openManual(c,71,238,335,165,'C',s.cRow.truth,P.teal);
  path(c,[[128,425],[128,474],[224,474]],P.mint,4);text(c,'Lookup → '+s.cRow.prediction+' days',75,531,27,P.paper);
  if(dArrived){
    text(c,'D arrived after the freeze',483,207,26,P.mint);
    if(s.open<1){
      boundBook(c,483,239,324,168,'D','Retention policy',P.navy);
      seal(c,758,313,true,1.05);
    }else{openManual(c,483,238,324,165,'D',s.dRow.truth,P.navy);}
    if(s.sealed){
      tag(c,'Answer locked',481,441,215,P.gold,P.ink);
      seal(c,737,460,true,.76);
      text(c,'Default → '+s.dRow.prediction+' days',481,531,27,P.paper);
    }
  }
  const fileX=887;
  box(c,fileX,243,331,296,'#112c31','#7c9a91',3);
  box(c,fileX+23,270,285,16,'#061e22','#93a59a',6);
  mid(c,'Unseen sources',fileX+165,342,29,P.paper);
  if(s.filed>0 && s.filed<1){
    const t=s.filed,x=mix(647,fileX+169,t),y=mix(477,271,t)-70*Math.sin(Math.PI*t);
    c.save();c.translate(x,y);c.rotate(-.1*(1-t));tag(c,'D · correct',-74,-21,148,P.gold,P.ink);c.restore();
  }
  if(s.tested.length){
    const scored=s.tested.filter(row=>row.correct).length;
    serif(c,scored+' / '+s.tested.length,fileX+164,432,72,P.gold,'center');mid(c,'Manual D',fileX+165,493,25,P.mint);
  }else{mid(c,'Awaiting entry',fileX+165,436,25,P.mint);}
  if(b===5 && s.open===1){mid(c,'Both correct. Which manual was new?',640,559,29,P.paper);}
  if(b===6&&s.tested.length){mid(c,'D’s answer is correct on one previously unseen manual.',640,559,28,P.paper);}
  if(b===7){
    text(c,'Next manual sealed',74,554,24,P.gold);
    text(c,'Same frozen rule and metric',356,554,24,P.mint);
  }
}
export function checkManuals(){
  assert.deepEqual(overlap(0),library.map(r=>r[0]));assert.deepEqual(overlap(1),[]);
  assert.deepEqual([shared(reference),shared(paraphrase)],[2,0]);
  assert.equal(logBranch('auto').ratio,null);assert.equal(logBranch('review').ratio,.8);
  const at=(b,after)=>({beat:{beatIndex:b},reveal:()=>Number(after)});
  const held=sourceState(at(3,true));assert.deepEqual([held.cRow.seen,held.cRow.prediction,held.cRow.correct],[false,30,false]);
  const lock=sourceState(at(4,true));assert.deepEqual([lock.sealed,lock.open,lock.tested.length],[true,0,0]);
  const opened=sourceState(at(5,true));assert.deepEqual([opened.cRow.correct,opened.dRow.correct,opened.tested.length],[true,true,0]);
  assert.deepEqual(sourceState(at(7,true)).tested.map(r=>r.source),['D']);
}

