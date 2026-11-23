import assert from 'node:assert/strict';
import {image,imageNoise,releaseJob} from '../../../films/diffusion/model.mjs';
import {exposure} from '../../../films/diffusion/pixel-study.mjs';
import {C,cue,mix,num} from './studio.mjs';
import {practice,trace} from './pixels.mjs';

const preview={jobs:20,variants:4,steps:6,branches:1};
const quality={jobs:2,variants:4,steps:50,branches:2};
const work=r=>r.jobs*r.variants*r.steps*r.branches;
const capacity=120*.75;
const workers=r=>Math.ceil(work(r)/capacity);
const tensor=[512,512,3],latent=[64,64,4];
const count=shape=>shape.reduce((k,n)=>k*n,1);
const labelShape=s=>s.join(' × ');
const centerNoise=Array.from({length:64},(_,i)=>imageNoise[(i%8)*2+Math.floor(i/8)*32]);
const centerClean=Array.from({length:64},(_,i)=>image[(i%8)*2+Math.floor(i/8)*32]);
const layers=['#627f8e','#52807d','#9c7955','#9e957a'];
function tensorStack(d,x,y,w,level){
  const px=centerNoise.map((v,i)=>mix(v,centerClean[i],level));
  for(let j=3;j>0;j--){
    d.rect(x+j*16,y-j*18,w,w,layers[j]);d.frame(x+j*16,y-j*18,w,w,C.paper,2);
  }
  d.sheet(px,x,y,w,null);
}
const stripe=Array.from({length:256},(_,i)=>{const x=i%16,y=Math.floor(i/16);return y>=5&&y<=7&&x>=3&&x<=12?(x%2?1:-.9):image[i];});
function pool(px){
  return Array.from({length:64},(_,i)=>{
    const j=Math.floor(i/8)*32+(i%8)*2;
    return [0,1,16,17].reduce((s,k)=>s+px[k+j],0)/4;
  });
}
function stretch(px){
  return Array.from({length:256},(_,i)=>px[Math.floor(i/32)*8+Math.floor(i%16/2)]);
}
const rebuilt=stretch(pool(stripe));
const rounds=[
  {words:['mark','the','tail'],entropy:.006},
  {words:['mark','the','eye'],entropy:.004},
  {words:['mark','the','eye'],entropy:.003}
];
const uncertain={...rounds[2],entropy:.014};
function stopDecision(previous,round){
  const same=Boolean(previous)&&round.words.every((word,j)=>word===previous.words[j]);
  const low=round.entropy<.01;
  return {same,low,stop:same&&low};
}
function textCanvas(d,c){
  const b=c.beat.beatIndex,first=cue(c,3,'Follow its last word',.6),second=cue(c,3,'replace it',.6),third=cue(c,5,'another round',.5);
  const i=third>0?2:second>0?1:0,filled=first>0;
  const replay=b===6,changed=replay&&cue(c,6,'Raise the third round',0);
  const round=changed?uncertain:rounds[i],decision=stopDecision(rounds[i-1],round);
  const showDecision=replay?cue(c,6,'Keep refining',0)>0:b===5&&cue(c,5,'finished block can join',.2)>0;
  const commit=showDecision&&decision.stop;
  const refining=showDecision&&!decision.stop;
  const candidate=(replay||b===4||(b===5&&i===2))&&!showDecision;
  const section=replay?'replay round three':b===3?'one provisional block':'stopping rule';
  d.title('Text diffusion   /   '+section,'Can this block join the fixed prefix?');
  d.text('Cached prefix',98,356,39,C.blue);
  d.text('Field notes',97,484,54,C.blue,'serif');d.line(97,520,416,520,C.blue,4);
  const x=552;
  const label=candidate?'Candidate block':commit?'Committed block':'Provisional canvas';
  d.text(label,x,356,42,candidate?C.ink:commit?C.green:C.copper);
  if(replay)d.text('First run committed at '+num(rounds[2].entropy,3)+'. Factual check pending.',1815,356,30,C.quiet,'sans','right');
  round.words.forEach((word,j)=>{
    const X=x+j*386;d.text(filled?word:'[mask]',X+164,490,filled?78:53,j===2&&!candidate&&!commit?C.copper:C.ink,'serif','center');
    d.line(X,521,X+328,521,candidate?C.faint:commit?C.green:C.quiet,5);
  });
  if(filled){
    d.text('Round '+(i+1),97,658,37,C.quiet,'mono');
    d.text('Mean entropy  '+num(round.entropy,3)+(decision.low?'  <  ':'  ≥  ')+'0.010',550,651,40,C.ink,'mono');
    d.text('Same as previous?   '+(i===0?'First round':decision.same?'Yes':'No'),550,730,40,C.ink,'mono');
    if(i>0){d.text('Previous ending',101,746,31,C.quiet);d.text(rounds[i-1].words[2],102,817,49,C.quiet,'serif');}
  }
  d.note(refining?'Continue refining. The words match, but mean entropy must fall below 0.010.':
    commit?'Block complete. Factual check pending.':b===4?'The last word changed in round two. Decide whether both conditions hold.':'Stopping requires mean entropy below 0.010 and two identical complete predictions.');
}
export function compression(d,c){
  const b=c.beat.beatIndex;
  if(b>=3)return textCanvas(d,c);
  if(b===2){
    d.title('Compression   /   reconstruction test','Where did the fine stripe disappear?');
    d.sheet(stripe,106,339,353,null,'Before compression');
    const a=cue(c,2,'encode and decode round trip',.7);
    d.fade(a,()=>d.sheet(rebuilt,556,339,353,null,'Round trip alone'));
    d.text('Image',1039,352,37,C.quiet);d.text(labelShape(tensor),1038,420,55,C.blue,'mono');
    d.text('Continuous latent',1039,505,37,C.quiet);d.text(labelShape(latent),1038,573,55,C.green,'mono');
    d.text('Scalar ratio',1039,668,36,C.quiet);
    d.text((count(tensor)/count(latent))+' : 1',1038,765,75,C.ink,'mono');
    d.note('Stripe test illustrates loss with block averaging. Measure the actual autoencoder separately.');return;
  }
  const train=b===0;
  d.title('Latent diffusion   /   '+(train?'training':'text-to-image'),'What goes into the decoder?');
  if(train){
    d.sheet(image,95,388,265,null,'Training image');
    d.arrow(397,518,526,518,C.blue);d.text('encode',397,470,33,C.blue);
    tensorStack(d,578,400,240,1);d.text('Clean latent',576,720,39,C.green);
    d.fade(cue(c,0,'Add noise there',.65),()=>{
      d.arrow(894,518,1028,518,C.copper);d.text('corrupt',893,470,33,C.copper);
      tensorStack(d,1095,400,240,.45);d.text('Noisy latent',1092,720,39,C.ink);
      d.arrow(1400,518,1515,518,C.green);d.text('Predict',1554,519,51,C.ink,'serif');d.text('added noise',1555,572,34,C.quiet);
    });
  }else{
    const evolve=cue(c,1,'At each step',3),decode=cue(c,1,'Decode the final latent',.7);
    tensorStack(d,100,405,245,0);d.text('Random start',98,720,39,C.blue);
    d.arrow(447,527,650,527,C.quiet);d.text('sampler',448,469,34,C.quiet);
    tensorStack(d,749,405,245,evolve);d.text('Current latent',748,720,39,C.green);
    d.fade(decode,()=>{
      d.arrow(1110,527,1310,527,C.green);d.text('decode',1108,469,34,C.green);
      d.sheet(image,1428,382,291,null,'Output pixels');
    });
  }
  d.note(train?'Schematic feature planes. Training knows the injected noise.':'The decoder takes the final latent state. The prediction first goes through the sampler.');
}

function dotRow(d,x,y,steps,branches,progress,col,spacing=23){
  for(let step=0;step<steps;step++)for(let j=0;j<branches;j++){
    const index=step*branches+j;
    d.dot(x+spacing*step,y+j*28,Math.min(8.2,spacing*.38),index<Math.round(steps*branches*progress)?col:C.faint);
  }
}
function controls(d,c){
  d.title('Control   /   repair the background','Which part of the image is allowed to change?');
  const mask=image.map(v=>v<0?1:-1),p=cue(c,5,'repaint just the background',1.3);
  const repaired=image.map((v,i)=>v>0?v:mix(v,-.32+.3*Math.sin(i%16*.7),p));
  d.sheet(image,103,359,344,null,'Original table');
  d.sheet(mask,750,359,344,null,'Mask · light = editable');
  d.sheet(repaired,1413,359,344,null,'Masked repair');
  d.arrow(499,524,694,524,C.quiet);d.arrow(1151,524,1350,524,C.green);
  d.note('Inpainting preserves protected pixels here. Edge conditioning targets geometry. LoRA specializes weights.');
}
export function budget(d,c){
  const b=c.beat.beatIndex;if(b===5)return controls(d,c);
  if(b<2){
    d.title('Service cost   /   per-image work','How many predictions does one image take?');
    [[50,1,C.blue,'One branch',1],[50,2,C.green,'Ordinary guidance',cue(c,0,'Add ordinary guidance',1.7)],[6,1,C.copper,'Distilled preview',cue(c,1,'six-step preview',1)]].forEach(([steps,branches,col,name,show],i)=>{
      if(i===2&&b===0)return;
      const y=374+i*169;d.text(name,98,y+19,43,col,'serif');dotRow(d,563,y,steps,branches,show,col);
      if(show>0)d.text(String(Math.round(steps*branches*show)),1812,y+22,51,col,'mono','right');
    });
    d.note('One filled dot = one prediction. Paired dots can share a batched call.');return;
  }
  d.title('Service cost   /   reserved capacity',b===2?'Which lane offers more work?':'How many workers does each lane need?');
  for(const [i,r] of [preview,quality].entries()){
    const x=100+885*i,col=i?C.copper:C.blue;
    d.text(i?'Quality':'Preview',x,322,53,col,'serif');
    d.text(r.jobs+' jobs/s  ×  '+r.variants+' variants',x,400,37,C.ink,'mono');
    d.text(r.steps+' steps  ×  '+r.branches+' branch'+(r.branches===2?'es':''),x,461,37,C.ink,'mono');
    const result=cue(c,3,i?'Quality offers':'Preview offers',.4);
    d.fade(result,()=>{d.rect(x,521,650*work(r)/800,36,col);d.text(work(r)+' predictions/s',x,624,48,col,'mono');});
    const reserve=cue(c,3,'under those assumptions',.45);
    const full=cue(c,3,'At full load',.3);
    if(!i&&full>0&&reserve===0)d.text(work(r)+' / 120 = 4 at full load',x,751,37,C.quiet,'mono');
    d.fade(reserve,()=>{
      for(let j=0;j<workers(r);j++){
        d.frame(x+65*j,678,48,60,col,3);for(let k=0;k<3;k++)d.line(x+65*j+9,693+12*k,x+65*j+39,693+12*k,col,3);
      }
      d.text('ceil('+work(r)+' / '+capacity+') = '+workers(r)+' workers',x,810,40,C.ink,'mono');
    });
  }
  const planned=cue(c,3,'Divide each load',0);
  d.note(b===2?'Multiply jobs × variants × steps × branches.':!planned?'Benchmark at the same shape, precision and batch size.':
    b===3?'Planned capacity per worker = 120 predictions/s × 75% = 90 predictions/s.':'75% ceiling, 90 predictions/s per worker. Measure latency through release.');
}

const [old,live]=releaseJob.candidates;
const {currentAttempt}=releaseJob;
const verdict=(attempt,asset,checked,manifest,policy='pass',watermark=true,humanReview=false)=>{
  if(!Number.isInteger(attempt)||attempt<1||attempt!==currentAttempt)return 'Stale attempt';
  if(policy!=='pass'||watermark!==true||humanReview!==false||checked!==asset||manifest!==true)return 'Hold';
  return 'Release';
};
function release(d,c){
  d.title('Publication   /   current attempt '+currentAttempt,'Which bytes may leave the service?');
  const fence=cue(c,4,'The old attempt is stale',.2);
  const rechecked=cue(c,4,'Recheck the resized file',.4)>=1;
  const stringTrue=cue(c,4,'A text string',.3)>0;
  const committed=cue(c,5,'Now release those exact bytes',0)>0;
  const checked=rechecked?live.file:live.checked,manifest=committed?true:stringTrue?'true':false;
  [old,live].forEach((candidate,i)=>{
    const x=i?1010:105,check=i?checked:old.checked;
    const show=i?cue(c,4,'Hold the replacement',.2):fence;
    const status=i?'current':'expired';
    d.text('Attempt '+candidate.attempt+(show>0?'   •   '+status:''),x,312,44,show>0?(i?C.green:C.blue):C.ink,'serif');
    d.sheet(candidate.file.samples.map(v=>v/127.5-1),x,350,219,null);
    const info=x+269;d.text(candidate.file.side+' × '+candidate.file.side+'  file',info,385,38,C.ink,'mono');
    d.text('Asset     '+candidate.file.digest.slice(0,8),info,449,35,C.ink,'mono');
    const checkedColor=check===candidate.file?C.green:C.copper;
    d.text('Checked   '+check.digest.slice(0,8),info,505,35,show>0?checkedColor:C.ink,'mono');
    const mf=i?manifest:true;
    d.text('Manifest     '+JSON.stringify(mf),x,640,35,C.ink,'mono');
    if(i&&rechecked)d.text('Policy pass   •   mark detected   •   no review',x,707,32,C.green);
    d.fade(show,()=>d.text(verdict(candidate.attempt,candidate.file.digest,check.digest,mf),x,812,62,i&&committed?C.green:C.copper,'serif'));
  });
  d.note(committed?'Manifest and checks now bind the final immutable bytes.':rechecked?'Evidence has to match the final digest. The manifest requires Boolean true.':'Check the attempt fence and compare the two digests for each file.');
}
const publishedJob={
  id:42, owner:'Cove', file:live.file,
  status:verdict(live.attempt,live.file.digest,live.file.digest,true)==='Release'?'Complete':'Hold',
};
function readJob(job,authenticatedTenant,jobId){
  if(authenticatedTenant!==job.owner||jobId!==job.id)return null;
  return {status:job.status,file:job.status==='Complete'?job.file:null};
}
function retrieval(d,c){
  const job=publishedJob,owner=job.owner,other='Reed';
  d.title('Retrieval   /   same released illustration','Who may read job '+job.id+'?');
  d.sheet(job.file.samples.map(v=>v/127.5-1),105,347,310,null,'Synthetic illustration');
  d.text('Owner   '+owner,104,766,38,C.ink,'mono');
  d.text('Digest  '+job.file.digest.slice(0,8),104,825,36,C.quiet,'mono');
  const left=556;
  for(const [x,label] of [[left,'Signed in as'],[898,'Job ID'],[1121,'Status read'],[1500,'File read']])d.text(label,x,338,35,C.quiet);
  for(const [i,tenant] of [owner,other].entries()){
    const y=464+i*163,out=readJob(job,tenant,job.id),col=out?C.green:C.copper;
    d.line(left,y+38,1810,y+38,C.faint,2);
    d.text(tenant,left,y,60,C.ink,'serif');d.text(String(job.id),899,y,47,C.ink,'mono');
    const show=cue(c,6,i?'Deny Reed both reads':'Cove receives',.35);
    d.fade(show,()=>{
      d.text(out?out.status:'Denied',1122,y,47,col);
      d.text(out?out.file.digest.slice(0,8):'Denied',1500,y,44,col,out?'mono':'sans');
    });
  }
  const claim=cue(c,6,'get the authenticated source record',.35);
  d.fade(claim,()=>{d.text('Real UI or incident claim',left,811,40,C.ink,'serif');
    d.text('Authenticated event record required',1033,811,38,C.copper);});
  d.note('Check the signed-in tenant against the job owner for every status and file read.');
}
export function recovery(d,c){
  const b=c.beat.beatIndex;
  if(b===6)return retrieval(d,c);
  if(b>=3)return release(d,c);
  d.title('Recovery   /   stochastic sampler',b===0?'What does a seed preserve?':'Will both copies resume the same sample?');
  if(b===0){
    d.sheet(image,107,343,375,null,'Retained file');
    const x=616;
    d.text('Generation recipe',x,353,54,C.ink,'serif');
    ['Model, VAE, text encoder and prompt','Sampler, selected levels and guidance','Seed, precision, kernels and batch order'].forEach((str,i)=>{
      d.line(x,408+97*i,1788,408+97*i,C.faint,2);d.text(str,x+17,473+97*i,43,C.ink);
    });
    d.note('To return an identical file, serve its stored bytes.');return;
  }
  const q=cue(c,2,'Consume the next draw',1.35),rr=trace.rows[1];
  d.text('Shared checkpoint   x ≈ '+num(trace.saved,4),99,328,44,C.ink,'mono');
  d.text('Next x ≈ '+num(rr.mean,6)+' + √0.03 × z',909,328,42,C.quiet,'mono');
  const draws=[rr.draw,trace.rows[0].draw];
  [trace.restoredNext,trace.resetNext].forEach((end,i)=>{
    const y=468+i*234,col=q>0?(i?C.copper:C.green):C.ink;
    d.text(i?'Reset to seed':'Restore RNG',99,y,46,col,'serif');
    d.text(i?'First draw again':'Next unused draw',99,y+57,36,C.quiet);
    const at=d.axis(710,y,1040,1.0,1.2,[1,1.05,1.10,1.15,1.20]);
    d.dot(at(trace.saved),y,16,C.blue,true);const v=mix(trace.saved,end,q);
    d.arrow(at(trace.saved),y,at(v),y,col,7);d.mark(at(v),y,col,11);
    d.fade(q,()=>{d.text('z ≈ '+num(draws[i],6),407,y+4,32,col,'mono','left',279);d.text(num(v,4),at(v),y-29,41,col,'mono','center');});
  });
  d.note('Same model, latent, timestep and solver state. Only the generator position differs.');
}
const experiment=[[50,3],[25,3],[50,6],[25,6]];
export function ending(d,c){
  const b=c.beat.beatIndex;
  if(b<3)return practice(d,c);
  d.title('Final experiment   /   matched seeds and prompts','How would you isolate a change in detail?');
  const visible=[1,cue(c,3,'steps-only run',.6),cue(c,3,'guidance-only run',.6),cue(c,3,'combined run',.65)];
  experiment.forEach(([steps,w],i)=>{
    const x=112+(i%2)*889,y=320+Math.floor(i/2)*274,col=i?C.green:C.blue;
    d.fade(visible[i],()=>{
      d.text(['Baseline','Fewer steps','Higher guidance','Both changes'][i],x,y,48,col,'serif');
      d.text(steps+' steps    w = '+w,x,y+63,39,C.ink,'mono');
      const filled=cue(c,4,'Halving steps',.45);
      d.fade(filled,()=>{
        // Each column represents a selected level and each row a CFG branch.
        dotRow(d,x+4,y+114,steps,2,1,col,10.4);
        d.text((steps*2)+' predictions',x+558,y+152,33,C.ink,'sans','left',283);
      });
    });
  });
  d.note(b===3?'Keep model, prompt, starting noise and execution fixed across all four runs.':'Measure adherence, detail, diversity and end-to-end latency on the resulting images.',C.ink,857);
}
export function checkService(){
  assert.equal(count(tensor)/count(latent),48);assert.notDeepEqual(stripe,rebuilt);
  assert.equal(stopDecision(rounds[0],rounds[1]).stop,false);
  assert.equal(stopDecision(rounds[1],rounds[2]).stop,true);
  assert.deepEqual(stopDecision(rounds[1],uncertain),{same:true,low:false,stop:false});
  assert.deepEqual([preview,quality].map(work),[480,800]);assert.deepEqual([preview,quality].map(workers),[6,9]);
  assert.equal(work(preview)/120,4);assert.equal(capacity,90);
  assert.equal(trace.rows[1].next,trace.restoredNext);assert.notEqual(trace.restoredNext,trace.resetNext);
  [trace.rows[1].draw,trace.rows[0].draw].forEach((draw,i)=>{
    const displayed=Number(trace.rows[1].mean.toFixed(6))+Math.sqrt(.03)*Number(draw.toFixed(6));
    assert.equal(num(displayed,4),num(i?trace.resetNext:trace.restoredNext,4));
  });
  assert.notEqual(old.file.digest,live.file.digest);
  assert.equal(verdict(old.attempt,old.file.digest,old.checked.digest,true),'Stale attempt');
  assert.equal(verdict(currentAttempt,live.file.digest,old.file.digest,true),'Hold');
  assert.equal(verdict(currentAttempt,live.file.digest,live.file.digest,'true'),'Hold');
  assert.equal(verdict(currentAttempt,live.file.digest,live.file.digest,true),'Release');
  for(const fields of [['fail',true,false],['pass',false,false],['pass',true,'false']])
    assert.equal(verdict(currentAttempt,live.file.digest,live.file.digest,true,...fields),'Hold');
  assert.deepEqual(readJob(publishedJob,'Cove',42),{status:'Complete',file:live.file});
  assert.equal(readJob(publishedJob,'Reed',42),null);assert.equal(readJob(publishedJob,'Cove',41),null);
  assert.equal(readJob({...publishedJob,status:'Hold'},'Cove',42).file,null);
  assert.deepEqual(experiment.map(([steps])=>steps*2),[100,50,100,50]);
}
