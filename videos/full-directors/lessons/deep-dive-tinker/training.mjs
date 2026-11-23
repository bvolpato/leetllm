import { C, arrow, box, cues, dot, ease, footer, header, line, num, plate, signed, text, ticket, token } from './paint.mjs';
import { actions, backendWeights, badCredits, importance, layer, receipt, rewardPayload, sft, slopes } from './model.mjs';

function derivatives(g,k) {
  const r=cues(k), sent=r(8,'Negating those weights'), matched=r(8,'The service propagates');
  header(g,'Custom loss','Which weights reproduce these slopes?', 'Two generated targets     •     local loss C(ℓ) = −2ℓ₁ + ½ℓ₂');
  const ys=[297,419], xs=[85,370,690,1010];
  ['Target','Local ∂C/∂ℓ','Weight sent','Backend −w'].forEach((s,i)=>text(g,s,xs[i],224,23,C.soft));
  receipt.forEach(({token:target},i)=>{
    const y=ys[i];line(g,62,y+57,1217,y+57,C.rule);
    token(g,66,y-34,136,67,target,true);
    text(g,signed(slopes[i]),xs[1],y,39,C.ink,'Mono');
    arrow(g,505,y,626,C.edge);
    text(g,sent?signed(backendWeights[i]):'?',xs[2],y,39,sent?C.teal:C.soft,'Mono');
    if(sent)arrow(g,820,y,947,C.edge);
    if(matched)text(g,signed(-backendWeights[i]),xs[3],y,39,C.teal,'Mono');
  });
  text(g,'Backend cross entropy   L = −sum(weight × log probability)',70,541,28,C.ink,'Serif');
  footer(g,matched?'Both logprob slopes match. The hosted backward pass computes parameter gradients.':'The minus sign in the backend loss determines which weights to send.');
}
function scoredTarget(g, x, target, score, isAction) {
  ticket(g,x,298,153,132,isAction?'#eeb979':'#c7dcd1');
  text(g,target,x+76.5,336,36,C.ink,'Mono','center',600);
  line(g,x+11,368,x+142,368,isAction?'#b47d42':'#93aa9d',1,[5,3]);
  text(g,isAction?num(score):'0 · pad',x+76.5,399,23,C.ink,'Mono','center');
}
function importanceSampling(g,k) {
  const r=cues(k);
  const current=r(5,'Its saved score'), matched=r(5,'Now try using'), swap=r(5,'Keep token twenty');
  const difference=r(6,'Its exponential'), result=r(6,'That wrong score'), impact=r(6,'Use the score recorded');
  const [correct, borrowed]=importance;
  header(g,'Ordinary importance sampling','What changes token 20’s importance ratio?',
    'Fixed prefix ['+correct.prefix.join(', ')+']     •     action '+correct.action+'     •     advantage '+signed(correct.advantage));
  text(g,'Sampler receipts',708,230,29,C.ink,'Serif');
  text(g,'Target',609,336,20,C.soft);
  text(g,'Log p',609,400,20,C.soft);
  importance.forEach(({saved},i)=>{
    const x=707+i*228;
    scoredTarget(g,x,saved.token,saved.score,true);
    text(g,i?'Neighboring action':'Scored action',x+76.5,465,20,C.soft,'Sans','center');
  });
  text(g,'Ratio = exp(current log p − saved log p)',58,233,27,C.ink,'Serif');
  text(g,'Current log p for token '+correct.action,59,284,22,C.soft);
  text(g,current?num(correct.currentLogP):'?',470,284,24,C.ink,'Mono');
  function comparison(row,y,name,answer) {
    text(g,name,59,y,22,C.soft);
    text(g,'exp('+num(row.currentLogP)+' − ('+num(row.saved.score)+'))',59,y+49,27,C.ink,'Mono');
    text(g,answer,407,y+49,29,C.ink,'Mono','left',600);
  }
  if(current)comparison(correct,345,'Use token '+correct.saved.token+'’s receipt',matched?'= '+correct.ratio:'= ?');
  if(swap) {
    const exponent=num(borrowed.currentLogP-borrowed.saved.score);
    const answer=difference?'= exp('+exponent+')'+(result?' ≈ '+borrowed.ratio.toFixed(2):''):'= ?';
    comparison(borrowed,474,'Try token '+borrowed.saved.token+'’s receipt',answer);
  }
  const extraPercent=Math.round((borrowed.ratio/correct.ratio-1)*100);
  footer(g,impact?'Borrowing the neighboring score gives token 20 about '+extraPercent+'% more weight.':
    result?'The ratio multiplies the advantage in this reward term.':
    swap?'Keep the action, its prefix and its advantage fixed. What changes in the ratio?':
    'Compare both policies on the action taken in this prefix.');
}
function branch(g) {
  header(g,'Trajectory branch','Which context produced the next action?', 'An observation comes from the environment. Its target gets zero action credit.');
  text(g,'First history',62,267,25,C.soft);
  [10,11,20,30,40].forEach((v,i)=>token(g,261+i*170,214,141,91,v,[2,4].includes(i),[2,4].includes(i)?'action':'observation'));
  text(g,'Next turn',62,431,25,C.soft);
  [50,60].forEach((v,i)=>token(g,261+i*170,383,141,91,v,!!i,i?'action':'new context'));
  line(g,240,343,1120,343,C.edge,2,[8,7]);
  text(g,'50 starts a different history.',660,416,25,C.ink);
  text(g,'Build a separate datum.',660,457,25,C.teal,'Sans','left',600);
  footer(g,'Use the token IDs and scores returned for each action in its own context.');
}
export function trajectory(g,k) {
  const b=k.beat.beatIndex,r=cues(k);
  if(b>=7)return derivatives(g,k);
  if(b>=5)return importanceSampling(g,k);
  if(b===2 && r(2,'If a later observation'))return branch(g);
  const slide=ease(r(1,'Slide the input strip',1.45));
  const copied=r(2,'A tool observation'), draft=b>=3, repair=r(4,'Leave both action'), sent=r(4,'Also compare');
  header(g,'RL datum',draft?'What reaches the reward loss?':'Which input predicts the scored action?',
    draft?'Audit a proposed copy of the first passing completion.':'Sample A     •     group advantage +0.5     •     two generated targets');
  const x=251,step=228,w=153;
  const left=68;
  // The action token and its behavior score are one physical unit on the lower strip.
  sft.inputs.forEach((v,i)=>token(g,x+step*(i+slide),210,w,63,v,i===2));
  text(g,'Input',left,240,23,C.soft);
  text(g,'Target',left,337,23,C.soft);
  text(g,'Behavior log p',left,400,23,C.soft);
  actions.forEach((a,i)=>{
    const px=x+(i+1)*step;
    scoredTarget(g,px,a.token,a.score,a.mask);
    if(slide===1)line(g,px+w/2,275,px+w/2,292,C.teal,3);
  });
  if(copied||draft) {
    const credits=draft&&!repair?badCredits:rewardPayload(badCredits).map(a=>a.credit);
    text(g,'Advantage',left,548,23,C.soft);
    text(g,sent?'Mask removed':'Action mask',left,475,23,sent?C.ghost:C.soft);
    actions.forEach((a,i)=>{
      const center=x+(i+1)*step+w/2;
      text(g,sent?'·':a.mask,center,475,27,sent?C.ghost:C.ink,'Mono','center');
      const bad=!a.mask&&credits[i]!==0;
      box(g,center-68,516,136,57,bad?C.pale:(a.mask?'#d5e7cf':'#e5e6da'),6);
      text(g,signed(credits[i]),center,546,28,bad?C.red:C.teal,'Mono','center',600);
    });
  }
  footer(g,sent?'Submitted fields keep the original pairs (20, −0.4) and (21, −0.8).':
    draft?(repair?'Prompt credit is zero. The action columns keep their sampled evidence.':'The local mask will be removed before submission. Inspect the prompt credit.'):
    copied?'Copy advantage to the generated targets. Mask the observation.':
    slide===1?'Both behavior scores stayed with the targets the sampler actually chose.':'Keep the score on the action strip as the input row slides into alignment.');
}

function matrix(g,x,y,values,cell,fill,outline,showNumbers,rowFocus=-1) {
  for(const [i,row] of values.entries())for(const [j,v] of row.entries()) {
    box(g,x+j*cell,y+i*cell,cell-2,cell-2,rowFocus===i?C.gold:fill,2,outline,1);
    if(showNumbers)text(g,num(v),x+(j+.5)*cell-1,y+(i+.5)*cell-1,cell*0.61,C.ink,'Mono','center');
  }
}
export function adapter(g,k) {
  const b=k.beat.beatIndex,r=cues(k);
  const rank=r(3,'Widen the rank')?4:2,m=layer(rank),wide=rank===4;
  const base=Array.from({length:4},(_,i)=>Array.from({length:6},(_,j)=>Number(i===j)));
  const focus=b===1;
  header(g,'LoRA projection',b>=2?'How many entries receive updates?':'One input takes two paths.', 'Toy layer     •     6 inputs     •     4 outputs     •     W′x = Wx + γB(Ax)     •     γ = ½');
  text(g,'Frozen W',73,233,32,C.ink,'Serif');
  text(g,'Trainable A',452,233,32,C.teal,'Serif');
  text(g,'Trainable B',853,233,32,C.teal,'Serif');
  matrix(g,73,277,base,32,'#d6dacf','#b0b7a9',focus,focus?1:-1);
  matrix(g,454,277,m.A,32,'#a6d4b8','#7ca992',focus);
  matrix(g,855,277,m.B,32,'#a6d4b8','#7ca992',focus,focus?1:-1);
  text(g,'4 × 6',73,448,23,C.soft,'Mono');
  text(g,rank+' × 6',454,448,23,C.teal,'Mono');
  text(g,'4 × '+rank,855,448,23,C.teal,'Mono');
  arrow(g,683,309,813,C.teal);text(g,'rank '+rank,744,346,19,C.teal,'Mono','center');
  if(focus) {
    const showA=r(1,'The second row'), scaled=r(1,'Add it to'), final=r(1,'The adapted output is') && k.elapsed>=k.speechDuration;
    text(g,'x = ['+m.input.map(num).join(', ')+']',73,498,19,C.soft,'Mono');
    if(r(1,'A gives zero'))text(g,'(Wx)₂ = '+num(m.base[1]),73,548,29,C.ink,'Mono');
    if(showA)text(g,'Ax → ['+m.narrow.map(num).join(', ')+']',454,515,25,C.teal,'Mono');
    if(scaled)text(g,'½ × '+m.expanded[1]+' = '+(m.expanded[1]*m.scale),855,515,25,C.teal,'Mono');
    footer(g,final?'Second output   '+m.base[1]+' + '+m.expanded[1]*m.scale+' = '+m.output[1]:'Trace the second output coordinate with the same six-number input.');
  } else if(b>=2) {
    const showCount=wide?r(3,'Each direction'):r(3,'Twelve in A');
    text(g,'24 frozen',73,523,26,C.soft,'Mono');
    text(g,m.A.flat().length+' entries',454,523,26,C.teal,'Mono');
    text(g,m.B.flat().length+' entries',855,523,26,C.teal,'Mono');
    footer(g,showCount?'Rank '+rank+'   •   '+m.A.flat().length+' + '+m.B.flat().length+' = '+m.count+' trainable values. The base still executes.':
      'Count the green entries in A and B. Each direction costs six plus four.');
  } else {
    text(g,'x → Wx',73,518,27,C.soft,'Mono');
    text(g,'x → Ax',454,518,27,C.teal,'Mono');
    text(g,'Ax → B(Ax)',855,518,27,C.teal,'Mono');
    footer(g,'Add the scaled adapter output to the output of the frozen matrix.');
  }
}

