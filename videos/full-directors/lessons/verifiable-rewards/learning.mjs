import {C,txt,box,line,dot,title,tape,field,surface,rows,arrow,note,cue,mix,percent,signed,rule} from './studio.mjs';
import {groupStatistics,rlvrClipped,rlvrReduction,rlvrKl,rlvrMixedProbability,rlvrGroupUpdate} from '../../../films/verifiable-rewards/arithmetic.mjs';
import {ANSWERS,REWARDS} from '../../../films/verifiable-rewards/fixtures.mjs';
export const eight=[1,0,0,1,0,1,0,1];
export function sample(c,k){
  title(c,'One prompt, four sampled answers','P14    /    14 × 12    /    same sampling setup and verifier');
  const graded=cue(k,0,'The checker assigns',.65);
  ANSWERS.forEach((n,i)=>{const x=62+i*280;tape(c,x,215,230,156);
    txt(c,'R'+(i+1),x+19,260,27,C.teal);field(c,n,x+61,278,116,64);
    if(graded)txt(c,'Reward '+REWARDS[i],x+115,435,31,REWARDS[i]?C.pass:C.miss,'center');
    if(cue(k,1,'Centering outcomes',0))txt(c,signed(REWARDS[i]-.5),x+115,510,36,C.gold,'center','Mono');
  });
  if(k.beat.beatIndex>=1)note(c,'Group mean    (1 + 0 + 1 + 0) / 4 = 0.5');
}
export function critic(c,k){
  const b=k.beat.beatIndex;
  if(b===1&&cue(k,1,'The critic adds',0)){
    title(c,'What does removing the critic save?','Separate learned value model   /   training memory');
    const blocks=['Weights','Gradients','Optimizer state','Activations'];
    blocks.forEach((s,i)=>{const x=61+i*275;surface(c,x,207,252,122);txt(c,s,x+126,281,30,C.cyan,'center','Serif');});
    txt(c,'Other memory at peak',62,430,33,C.light,'left','Serif');
    txt(c,'Policy + reference + rollout buffers',63,492,36,C.gold);
    note(c,'Sharding and offload determine how much stays on the device.');return;
  }
  if(b<2){
    title(c,'Two futures from the same prefix','Equally likely endings   /   terminal reward only   /   no discount');
    surface(c,74,273,322,105);txt(c,'Shared prefix',234,336,36,C.light,'center','Serif');
    const miss=cue(k,0,'Follow the miss',.8);
    arrow(c,405,321,661,211,C.muted);arrow(c,405,333,661,467,miss?C.gold:C.muted);
    txt(c,'½   →   reward 1',692,228,38,C.pass);txt(c,'½   →   reward 0',692,486,38,C.miss);
    txt(c,'Expected return  0.5',73,437,26,C.cyan);
    if(miss)note(c,b?'Token costs or discounting change the return the critic estimates.':'Observed advantage    0 − 0.5 = −0.5');
  }else{
    title(c,'Keep a baseline for each prompt');
    rows(c,['Prompt','Sampled rewards','Local mean'],[['Easy','1, 1','1'],['Hard','0, 1','0.5']],[78,454,884]);
    note(c,'Pooling gives 0.75 and changes both comparisons.');
  }
}
export function groupState(k,n) {
  let values=n===4?[...REWARDS]:[...eight];
  const b=k.beat.beatIndex;
  if(n===4&&b===5){
    if(cue(k,5,'Replace one miss',0))values[1]=1;
    if(cue(k,5,'then the other',0))values[3]=1;
    if(cue(k,5,'With four misses',0))values.fill(0);
  }else if(n===8&&b===2){
    if(cue(k,2,'all eight rewards to one',0))values.fill(1);
    if(cue(k,2,'then all to zero',0))values.fill(0);
  }else if(n===8&&b===3)values=[2,0,1];
  return {values,...groupStatistics(values)};
}
export function groups(c,k,n){
  const {values,mean,std,advantages}=groupState(k,n), b=k.beat.beatIndex;
  const continuous=values.length===3, top=continuous?2:1, x0=181,w=889;
  title(c,continuous?'A group can have continuous rewards':n===4?'Measure each reward against its group':'Count every response in the spread',
    continuous?'Same prompt   /   three measured responses':n+' measured responses   /   one prompt');
  const y=v=>427-203*v/top;
  for(const v of [0,top]){line(c,133,y(v),1122,y(v),C.edge);txt(c,v,111,y(v)+9,25,C.muted,'right','Mono');}
  values.forEach((v,i)=>{const x=x0+(i+.4)*w/values.length;
    box(c,x-20,y(v),40,Math.max(3,y(0)-y(v)),v>=mean?'#477e75':'#705a4e',4);
    dot(c,x,y(v),11,v?C.pass:C.miss);txt(c,'R'+(i+1),x,468,25,C.muted,'center','Mono');
  });
  const meanVisible=n===8||cue(k,0,'Trace the first answer',0);
  if(meanVisible){
    c.save();c.setLineDash([7,6]);line(c,134,y(mean),1123,y(mean),C.gold,2);c.restore();
    txt(c,'μ '+Number(mean.toFixed(2)),124,y(mean)-16,23,C.gold,'right','Mono');
  }
  const standard=n===8?b>=1:b>=3;
  if(standard||meanVisible){
    txt(c,standard?'A':'r − μ',63,526,23,C.muted,'left','Mono');
    values.forEach((v,i)=>{
      const value=standard?advantages[i]:v-mean;
      const places=standard&&Number.isInteger(value)?0:standard?3:2;
      txt(c,signed(value,places),x0+(i+.4)*w/values.length,526,29,C.light,'center','Mono');
    });
  }
  if(n===8||b>=2){
    const formula=std===0?'σ = 0     Guard division → A = 0':positiveSpread(values,mean,std);
    note(c,formula);
  }
}
function positiveSpread(values,mean,std){
  const squareSum=values.reduce((s,v)=>s+(v-mean)**2,0);
  const rounded=Number(std.toFixed(3));
  return 'Population spread     σ = √('+Number(squareSum.toFixed(3))+' / '+values.length+') '+(rounded===std?'=':'≈')+' '+rounded;
}
export const tokenCases=[{p:.65,old:.5,a:1,len:2},{p:.35,old:.5,a:-1,len:3}];
export const tokenTerm=t=>rlvrClipped(t.p/t.old,t.a);
export const responseMean=t=>(tokenTerm(t).surrogate+(t.len-1)*t.a)/t.len;
export function clipping(c,k){
  const b=k.beat.beatIndex;
  if(b>=4){
    title(c,'Put each term back in its response','Active generated tokens only   /   rollout ratios for other included tokens = 1');
    tokenCases.forEach((t,i)=>{const y=222+i*153;
      txt(c,'Response '+(i+1),60,y+48,32,C.light,'left','Serif');
      for(let j=0;j<3;j++){const x=325+j*157;box(c,x,y,136,81,j<t.len?C.paper:C.slate,4);
        txt(c,j<t.len?signed(j?t.a:tokenTerm(t).surrogate,1):'padding',x+68,y+50,25,j<t.len?C.ink:C.muted,'center','Mono');}
      txt(c,'÷ '+t.len+'   →   '+signed(responseMean(t),3),815,y+50,30,C.cyan,'left','Mono');
    });
    note(c,'Reward loss   =   −mean(response means)   ≈   '+signed(-(responseMean(tokenCases[0])+responseMean(tokenCases[1]))/2,4));return;
  }
  const t=tokenCases[Number(b>=2)],v=tokenTerm(t), neg=t.a<0;
  title(c,'Which product survives clipping?','Current / rollout probability   /   clip interval [0.8, 1.2]');
  txt(c,t.p.toFixed(2)+' / 0.50   ×   ('+signed(t.a,0)+')',66,230,44,C.light,'left','Mono');
  const raw=neg?cue(k,2,'The raw ratio',0):cue(k,0,'In code',0);
  const clip=neg?cue(k,2,'Multiply both',0):cue(k,1,'Keep the smaller',0);
  const win=neg?cue(k,3,'That\'s the term',0):cue(k,1,'Further increases',0);
  const X=v=>625+330*v;
  line(c,130,421,1120,421,C.edge,3);
  for(const v of [-1.5,-1,-.5,0,.5,1,1.5]){line(c,X(v),412,X(v),432,C.edge);txt(c,v,X(v),463,22,C.muted,'center','Mono');}
  if(raw){dot(c,X(v.raw),401,9,C.cyan);txt(c,'raw '+signed(v.raw,1),X(v.raw),351,27,C.cyan,'center');}
  if(clip){dot(c,X(v.alternative),439,9,C.gold);txt(c,'clipped '+signed(v.alternative,1),X(v.alternative),506,27,C.gold,'center');}
  if(win)note(c,'Keep the smaller product    '+signed(v.surrogate,1));else if(neg&&clip)note(c,'Which lies farther left?');
}
const theta=Math.log(4);
export function klTerms(step){
  const v=rlvrKl(theta+.2*step);
  return {...v,frozen:.8*v.sample[0]+.2*v.sample[1]};
}
export function kl(c, k) {
  const b = k.beat.beatIndex;
  const start = klTerms(0);
  const step = b === 4 ? cue(k, 4, 'Raise just the first logit', 1.5) : 0;
  const v = klTerms(step);
  const changed = b === 4 && step > 0;
  function heard(index, phrase) {
    return b > index || (b === index && k.elapsed >= k.wordCue(phrase).end);
  }
  let reweight = 0;
  if (b === 4) {
    const shift = k.wordCue('shifts weight toward the cheaper first token');
    reweight = (k.elapsed - shift.start) / (shift.end - shift.start);
    reweight = Math.min(1, Math.max(0, reweight));
  }
  title(c, b >= 5 ? 'Return to the starting logit' : 'Who weights the two token terms?',
    'Reference q = (0.5, 0.5)   /   ℓ = log(q/p)   /   term = exp(ℓ) − ℓ − 1');
  rows(c, ['Token', 'Current p', 'Reference q', 'Sample term'],
    v.p.map((p, i) => [String(i + 1), p.toFixed(3), '0.500', b ? v.sample[i].toFixed(3) : '…']),
    [71, 303, 620, 925], { step: 56, y: 183, widths: [170, 245, 245, 203] });
  if (changed) {
    txt(c, 'Only logit 1 rises    ' + signed(0.2 * step, 2), 65, 345, 22, C.muted, 'left', 'Mono');
  }

  if (cue(k, 2, 'With current-policy sampling', 0)) {
    for (const [j, name] of ['Current weights', 'Frozen weights'].entries()) {
      if (j && b < 3) continue;
      const y = 366 + j * 91;
      const weight = j ? start.p[0] : changed ? mix(start.p[0], v.p[0], reweight) : v.p[0];
      txt(c, name, 65, y + 26, 25, C.light);
      box(c, 331, y, 505, 34, C.gold, 3);
      box(c, 331, y, 505 * weight, 34, C.cyan, 3);
      txt(c, percent(weight), 345, y + 24, 21, C.ink, 'left', 'Mono');
      txt(c, percent(1 - weight), 824, y + 24, 21, C.ink, 'right', 'Mono');
      if (changed) {
        const anchor = 331 + 505 * start.p[0];
        line(c, anchor, y - 5, anchor, y + 39, C.ink, 2);
        dot(c, anchor, y - 5, 3, C.light);
      }
      const amount = j ? v.frozen : v.full;
      const pending = !j && changed && reweight < 1;
      txt(c, pending ? '…' : amount.toFixed(5), 879, y + 30, 36, j ? C.gold : C.cyan, 'left', 'Mono');
    }
  }
  if (b === 3)
    note(c, 'If only logit 1 rises, will the two sums still agree?', 532);
  if (b === 4 && heard(4, 'the upper one rose less'))
    note(c, 'Current  ' + signed(v.full - start.full, 5) +
      '     /     Frozen  ' + signed(v.frozen - start.frozen, 5), 532);
  if (b >= 5) {
    const full = heard(5, 'point two two two');
    const frozen = heard(5, 'point three');
    txt(c, 'Slope for logit 1', 65, 530, 23, C.muted);
    txt(c, 'Current  ' + (full ? v.fullGradient.toFixed(3) : '?'), 331, 530, 26, C.cyan, 'left', 'Mono');
    txt(c, 'Frozen  ' + (frozen ? v.fixedGradient.toFixed(3) : '?'), 647, 530, 26, C.gold, 'left', 'Mono');
  }
}
export const budget=[0,0,1,0,1,0,0,1];
export function sampling(c,k){
  const f=rlvrMixedProbability(.01,64);
  title(c,'How much of the batch can we use?','Independent binary samples   /   pass probability 0.01   /   64 draws per group');
  txt(c,'P(mixed) = 1 − p^G − (1 − p)^G',65,220,39,C.light,'left','Mono');
  const on=cue(k,0,'forty-seven point four percent',.6);
  box(c,65,265,1065,74,C.slate,5);
  if(on){
    box(c,65,265,1065*f.mixed,74,C.cyan,3);
    txt(c,'Mixed   '+percent(f.mixed,2),83,311,29,C.ink);txt(c,'All fail   '+percent(f.allFail,2),623,311,29,C.light);
  }
  if(k.beat.beatIndex===2){
    const spent=Math.round(8*cue(k,2,'the run can generate eight groups',2));
    budget.forEach((pass,i)=>{const x=70+i*135;box(c,x,426,117,70,i<spent?(pass?C.cyan:C.slate):C.deep,4);txt(c,i<spent?(pass?'mixed':'uniform'):'·',x+58,469,21,i<spent&&pass?C.ink:C.light,'center');});
    note(c,'Groups spent   '+spent+' / 8      ·      Mixed retained   '+budget.slice(0,spent).reduce((a,b)=>a+b,0));
  }else if(on)note(c,'All pass   =   0.01⁶⁴       /       Correlation changes the calculation.');
}
export function reduction(c,k){
  if(k.beat.beatIndex>=2){
    title(c,'What objective will this configuration run?','TRL guide edition recorded in the article   /   inspect the installed version');
    rows(c,['Setting','Recorded choice','What it changes'],[
      ['loss','dapo','total included tokens'],
      ['reward scaling','group','per-prompt spread'],
      ['ratio','token-level','one ratio per token'],
      ['KL coefficient','β = 0','reference term disabled']
    ],[68,416,765],{y:170,step:78,widths:[320,320,365]});
    note(c,'Record ending markers and masks to reproduce the denominator.');return;
  }
  const global=cue(k,0,'Global token averaging',0);
  const r=rlvrReduction(global?1:0);
  title(c,'Six tokens, two different averages',global?'Global active-token mean':'Mean of response means');
  r.lengths.forEach((n,i)=>{
    const y=211+i*141;
    txt(c,'Response '+(i+1),61,y+50,31,C.light,'left','Serif');
    for(let j=0;j<n;j++){const x=335+j*158;tape(c,x,y,132,87);txt(c,String(r.terms[i]),x+66,y+58,39,C.ink,'center','Mono');}
    txt(c,'weight / token',988,y+27,21,C.muted);txt(c,global?'1/6':i?'1/8':'1/4',987,y+67,35,C.gold,'left','Mono');
  });
  note(c,global?'(2 + 2 + 0 + 0 + 0 + 0) / 6  =  ⅔':'(2 + 0) / 2  =  1');
  if(k.beat.beatIndex>0)txt(c,'Record masks, clipping, scaling, KL weight and trainer version.',62,632,23,C.muted);
}
export const scalarProbes = [
  [0.7, 1, 'Now try one point three'],
  [0.7, -1, 'The positive row follows'],
  [1.3, 1, 'With a negative advantage, the raw product'],
  [1.3, -1, 'That last row'],
].map(([ratio, advantage, resultCue]) => {
  const term = rlvrClipped(ratio, advantage);
  const slope = term.raw === term.surrogate ? advantage : 0;
  return {...term, slope, resultCue};
});

export function categorical(c,k,n){
  const isFour=n===4, v=rlvrGroupUpdate(isFour?REWARDS:eight,isFour?1:.1,cue(k,1,isFour?'Take one gradient step':'One gradient step',1.8));
  if(!isFour&&k.beat.beatIndex===2&&cue(k,2,'Compare the four rows',0)){
    title(c,'Which probes have a nonzero slope?','r = current / rollout token probability     ·     A = advantage     ·     clip r to [0.8, 1.2]');
    const records = scalarProbes.map(({ratio, advantage, raw, alternative, surrogate, slope, resultCue}) => {
      const showResult = cue(k,2,resultCue,0);
      return [
        ratio.toFixed(1), signed(advantage,0), signed(raw,1), signed(alternative,1),
        showResult ? signed(surrogate,1) : '…',
        showResult ? (slope === 0 ? '0 · plateau' : signed(slope,0)) : '…',
      ];
    });
    rows(c,['Ratio r','Advantage A','r × A','clip(r) × A','Minimum','Slope in r'],records,
      [66,223,435,617,816,982],{y:178,step:80});
    const prompt = cue(k,2,'Now try one point three',0) ? 'At 1.3, which row stays flat?' : 'At 0.7, which row stays flat?';
    note(c,cue(k,2,'That last row',0) ? 'At 1.3, the last row follows −r. Its slope is −1.' : prompt);
    return;
  }
  title(c,isFour?'Where does the probability go?':'Zero loss can have a nonzero slope',n+' response categories   /   initial logits 0   /   learning rate '+(isFour?'1':'0.1'));
  const width=1024/n;
  for(const [i,p] of v.probabilities.entries()){
    const x=106+(i+.5)*width;
    const color=v.rewards[i]?C.pass:C.miss;
    const h=p*(isFour?715:1350);
    box(c,x-width*.26,429-h,width*.52,h,color,3);
    txt(c,percent(p,isFour?1:2),x,414-h,24,C.light,'center','Mono');
    txt(c,'R'+(i+1),x,471,25,C.muted,'center','Mono');
    txt(c,signed(v.logits[i],isFour?2:4),x,527,isFour?28:22,color,'center','Mono');
  }
  txt(c,'logit',40,526,21,C.muted);
  note(c,'Passing mass   '+percent(v.expectedReward,isFour?1:3)+'     /     total probability 1');
  if(!isFour&&k.beat.beatIndex===0)txt(c,'Initial loss = 0     ·     each logit gradient = −A / 8',63,636,24,C.muted);
}

