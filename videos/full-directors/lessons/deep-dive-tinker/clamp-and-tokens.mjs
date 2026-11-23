import { C, arrow, box, cues, dot, ease, fade, footer, gauge, header, lerp, line, num, plate, poly, signed, text, ticket, token } from './paint.mjs';
import { candidates, capability, cases, grades, group, loss, oldSample, sft, test, tied, trainer } from './model.mjs';

export function opening(g,k) {
  const r=cues(k), b=k.beat.beatIndex;
  const expected=r(1,'Now run'), code=r(1,'It says return x'), observed=r(1,'The dot clears');
  const trained=r(3,'The sample came'), provenance=r(3,'A Tinker sampling client');
  header(g,'Clamp test',b<2?'Where should three land?':'Which weights wrote this answer?', 'clamp(x, lo, hi)     •     x = 3     •     lo = 0     •     hi = 2');
  gauge(g,50,207,720,337,test,observed?oldSample:null,{expect:expected,input:r(0,'Give this clamp',0.7),tag:'VERIFIER   /   INCLUSIVE BOUNDS'});
  text(g,'Sampled function',818,243,28,C.soft);
  text(g,code?oldSample.body:'return  ?',818,301,42,C.ink,'Mono');
  if(b>=2) {
    line(g,820,351,1216,351);
    text(g,'09:12    Trainer loss',818,383,22,C.soft,'Mono');
    const leftY=432, endY=leftY+(loss[0]-loss[1])*80;
    line(g,824,leftY,892,endY,C.teal,5);dot(g,824,leftY,6,C.teal);dot(g,892,endY,6,C.teal);
    text(g,'lower',913,endY,22,C.teal);
    if(trained) text(g,'trainer   v'+trainer.version,819,507,25,C.teal,'Mono','left',600);
    if(provenance) text(g,'sampler   '+oldSample.path,819,546,23,C.red,'Mono','left',600);
  } else if(observed) {
    text(g,'3 falls outside [0, 2]',818,407,30,C.red,'Serif');
  }
  footer(g,provenance?'The sampling path identifies the policy that produced this code.':
    b>=2?'Before changing the learning rate, compare the two versions.':
    observed?'The local verifier rejects this return value.':'The clamp keeps x inside the interval and caps it at the nearest bound outside.');
}

function endpoint(g,x,y,w,title,lines,hosted=false) {
  const fg=hosted?C.cream:C.ink;
  if(hosted) plate(g,x,y,w,195);
  else {
    box(g,x,y,w,181,C.cream,9,C.edge,2);
    poly(g,[[x-7,y+181],[x+w+7,y+181],[x+w+23,y+192],[x-23,y+192]],'#95a99e');
  }
  text(g,title,x+26,y+44,30,fg,'Serif');
  lines.forEach((s,i)=>text(g,s,x+26,y+96+i*43,20,hosted?C.mint:C.teal,'Mono'));
}
export function boundary(g,k) {
  const b=k.beat.beatIndex,r=cues(k);
  if(b<=1) {
    const training=b===1, sent=training?r(1,'Forward backward sends',1.8):r(0,'Follow the prompt',1.8);
    const reply=training?r(1,'Your client gets',1.4):r(0,'The reply carries',1.6);
    header(g,'Ownership','Follow the request across the boundary.',training?'The verifier runs here. The adapter update happens on the worker.':'The sampling client holds a path to a hosted policy.');
    endpoint(g,70,252,334,'Local Python loop',training?['grade clamp','build Datum']:['render template','SamplingClient']);
    endpoint(g,868,252,345,training?'Training worker':'Sampling worker',training?['accumulate gradients',r(1,'The optimizer step')?'update adapter':'forward_backward']:['selected snapshot','generate tokens'],true);
    text(g,training?'Datum + loss inputs':'Tokenized prompt',632,262,22,C.teal,'Sans','center',600);
    arrow(g,431,309,842,C.teal);
    fade(g,sent>0?1:0,()=>{ const px=lerp(446,824,ease(sent)); dot(g,px,309,10,C.teal); });
    arrow(g,842,392,431,C.warm);
    text(g,training?'Loss and step metrics':'IDs + sampled scores',632,440,22,C.warm,'Sans','center',600);
    fade(g,reply>0?1:0,()=>dot(g,lerp(824,446,ease(reply)),392,10,C.warm));
    text(g,training?'Local reward → training example':'Local client handle',72,514,23,C.soft);
    text(g,training?'Adapter + optimizer moments':'Hosted model state',866,514,23,C.soft);
    footer(g,training?'The trainer returns metrics. Parameter gradients stay on the hosted worker.':'Request the log probabilities when constructing a behavior-policy record.');
  } else if (b<4) {
    const decide=r(3,'Inference is the listed use');
    header(g,'Admission','Can this account train model M?', 'The local SDK probe passed. The proposed job needs an RL training loss.');
    plate(g,61,219,684,326);
    text(g,'ACCOUNT CAPABILITIES',92,255,19,C.mint,'Mono');
    text(g,'Model '+capability.model,95,314,46,C.cream,'Serif');
    line(g,96,351,706,351,'#73988d');
    text(g,'Inference',96,410,28,C.cream); text(g,capability.inference?'listed':'unlisted',690,410,26,C.mint,'Mono','right');
    text(g,'Training',96,485,28,C.cream); text(g,capability.training?'listed':'unlisted',690,485,26,C.gold,'Mono','right');
    text(g,'Training request',802,286,28,C.soft);
    text(g,decide?'Hold':'?',795,378,82,decide?C.red:C.soft,'Serif');
    if(decide) {text(g,'Check training access,',803,464,27);text(g,'loss and modality.',803,505,27);}
    footer(g,decide?'Check permissions for the operation and data you plan to use.':'Local code and account capabilities answer different questions.');
  } else {
    header(g,'Source map','Where would you trace this token?', 'Tinker training example and a separate self-hosted expert layer');
    const wire=r(4,'The SDK serializes',1.4), dispatch=r(4,'dispatch a token',1.4),combine=r(4,'combine its output',1.2);
    text(g,'Tinker loop',60,248,30,C.ink,'Serif');
    token(g,273,210,132,70,20,true);
    text(g,'Cookbook datum',250,314,22,C.soft);
    arrow(g,438,248,715,C.teal);
    if(wire){dot(g,lerp(450,690,ease(wire)),248,9,C.teal);text(g,'SDK request + ID',750,249,28,C.teal);}
    line(g,60,363,1218,363,C.edge);
    text(g,'DeepEP',60,452,30,C.ink,'Serif');
    text(g,'Token activation',260,449,24);
    arrow(g,466,451,668,C.teal);
    box(g,678,417,175,69,'#cfe2cf',5);
    text(g,'Expert',765,452,25,C.teal,'Sans','center',600);
    if(dispatch)dot(g,lerp(474,657,ease(dispatch)),451,9,C.teal);
    if(combine){arrow(g,862,451,1024,C.teal);dot(g,lerp(876,1008,ease(combine)),451,9,C.teal);text(g,'Combine',1044,451,25);}
    text(g,'Self-hosted model',60,525,21,C.soft);
    footer(g,'Check a stale policy at the sampling client. Trace a full dispatch buffer at the transport layer.');
  }
}

export function supervised(g,k) {
  const r=cues(k), slide=ease(r(1,'Slide the targets',1.25)), raw=r(2,'Masking by'), norm=r(3,'Divide the raw weights');
  header(g,'Supervised datum','Which prediction earns a weight?', 'Toy token IDs     •     prompt 10, 11     •     desired answer 20, 21');
  const x=270, step=228, w=179;
  if(!r(0,'Keep all but the last')){
    text(g,'Full sequence',52,335,27,C.soft);
    sft.full.forEach((v,i)=>token(g,x+i*step,288,w,95,v,i>=sft.promptLength,i>=sft.promptLength?'answer':'prompt'));
    footer(g,'Start with the rendered prompt followed by its known answer.');
    return;
  }
  text(g,'Input',52,259,27,C.soft);
  text(g,'Next target',52,398,27,C.soft);
  for(let i=0;i<sft.inputs.length;i++) {
    token(g,x+i*step,218,w,82,sft.inputs[i],i>=sft.promptLength,i>=sft.promptLength?'answer':'prompt');
    if(slide===1) line(g,x+i*step+w/2,308,x+i*step+w/2,347,C.edge,2,[5,4]);
    token(g,x+(i+1-slide)*step,354,w,82,sft.targets[i],!!sft.mask[i],sft.mask[i]?'answer':'prompt');
  }
  if(raw) {
    text(g,norm?'Mean weight':'Raw weight',52,513,25,C.soft);
    const weights=norm?sft.mean:sft.mask;
    weights.forEach((v,i)=>{
      const cx=x+i*step+w/2;
      text(g,v===0.5?'½':v,cx,513,43,v?C.teal:C.soft,'Serif','center');
      box(g,cx-65,555,130,9,C.rule,4);
      if(v)box(g,cx-65,555,130*v,9,C.teal,4);
    });
  } else if(slide===1) {
    text(g,'Last prompt input',x+step+w/2,496,20,C.soft,'Sans','center');
    text(g,'11 predicts 20',x+step+w/2,535,24,C.teal,'Mono','center',600);
  }
  footer(g,norm?'Mean reduction gives the example a total weight of one.':raw?'Weight each answer target, including the first one.':
    slide===1?'Look at the role of the target underneath eleven.':'Keep the prefix as input and use its next token as the target.');
}

const bodyLetters=['A','B','C','D'];
export function reward(g,k) {
  const r=cues(k), b=k.beat.beatIndex;
  if (b<2) {
    const first=r(1,'The reversed nesting'), second=r(1,'Now run all five'), all=r(1,'Only the first'), verdict=r(1,'The last just');
    header(g,'Local verifier','Which test separates the two nestings?', 'A completion earns one only when it passes every fixture.');
    text(g,'Body after return',55,221,22,C.soft); text(g,'Input and bounds  →  expected',536,206,19,C.soft);
    const start=569, delta=133;
    cases.forEach(([x,l,h,answer],i)=>{
      const cx=start+i*delta;
      text(g,num(x)+' ['+num(l)+','+num(h)+']',cx,248,16,C.soft,'Mono','center');
      text(g,'→ '+num(answer),cx,277,19,C.ink,'Mono','center');
    });
    text(g,'R',1210,264,23,C.soft,'Mono','center');
    grades.forEach((gr,i)=>{
      const y=331+i*65;
      line(g,52,y+31,1230,y+31,C.rule,1);
      text(g,bodyLetters[i],55,y,24,C.teal,'Serif');
      text(g,candidates[i].code,101,y,23,C.ink,'Mono');
      cases.forEach((_,j)=>{
        const show=all || (j===2 && i<2 && r(0,'Which test')) || (j===0 && ((i===0 && first)||(i===1 && second)));
        if(show){
          box(g,start+j*delta-31,y-21,62,42,gr.passed[j]?'#c2dfca':C.pale,5);
          text(g,num(gr.values[j]),start+j*delta,y+1,23,gr.passed[j]?C.teal:C.red,'Mono','center',600);
        } else dot(g,start+j*delta,y,3,C.edge);
      });
      if(verdict)text(g,gr.reward,1210,y,28,gr.reward?C.teal:C.red,'Mono','center',600);
    });
    footer(g,second?'At x = −1, the reversed nesting jumps to the upper bound.':'Read each body against the same five expected outputs.');
  } else {
    const secondGroup=b>=3 && r(3,'Try a second group');
    const data=secondGroup?tied:group;
    const mean=secondGroup?r(4,'Each reward equals'):r(2,'Subtract that baseline');
    const credit=secondGroup?r(4,'Each reward equals'):r(2,'Read the direction');
    header(g,'Group credit',secondGroup?'What if all four samples pass?':'Subtract the mean for this prompt.',secondGroup?'Second group     •     four passing clamp samples':'First group     •     same four bodies     •     reward for passing all tests');
    text(g,'Sample',67,231,22,C.soft);text(g,'Reward',324,231,22,C.soft);
    text(g,'Centered advantage',738,231,23,C.soft);
    const zero=895;line(g,zero,264,zero,552,C.edge);
    data.rewards.forEach((value,i)=>{
      const y=300+i*73, a=data.advantages[i];
      text(g,secondGroup?'Pass '+(i+1):'Body '+bodyLetters[i],70,y,28);
      text(g,value,378,y,34,C.teal,'Mono','center',600);
      if(mean)text(g,'− '+num(data.mean)+'  =',478,y,26,C.soft,'Mono');
      if(credit){
        const end=zero+a*373;
        if(a)box(g,Math.min(zero,end),y-13,Math.abs(end-zero),26,a>0?C.teal:C.warm,3);
        dot(g,end,y,5,C.ink);
        text(g,signed(a),a<0?end-13:end+13,y,23,C.ink,'Mono',a<0?'right':'left');
      }
    });
    footer(g,secondGroup?(credit?'Uniform rewards supply zero centered credit. An auxiliary term can still contribute.':'Predict each advantage before subtracting the new group mean.'):
      mean?'The baseline belongs to this prompt group.':'Center the rewards within the four samples for this prompt.');
  }
}

