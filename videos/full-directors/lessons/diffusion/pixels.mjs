import assert from 'node:assert/strict';
import {forwardValue,generator,normal} from '../../../films/diffusion/arithmetic.mjs';
import {TOP_PIXEL as top,SHADOW_PIXEL as shadow} from '../../../films/diffusion/fixtures.mjs';
import {image,imageNoise,posteriorFixture,scalarReverseTrace} from '../../../films/diffusion/model.mjs';
import {blend,exposure,worksheet,ddimTerms,recoverClean} from '../../../films/diffusion/pixel-study.mjs';
import {C,cue,mix,num,clamp} from './studio.mjs';

export const trace=scalarReverseTrace();
const betas=[.02,.03,.04];
const schedule=betas.map((beta,k)=>({
  beta, alpha:1-beta, retained:betas.slice(0,k+1).reduce((a,b)=>a*(1-b),1),
}));
const tabletopLevels = {input: .5, destination: .9};
const shadowLevels = {input: .36, destination: .64};
const saved=exposure(tabletopLevels.destination),half=exposure(tabletopLevels.input);
const jump=worksheet(tabletopLevels.input,tabletopLevels.destination);
const shadowJump=worksheet(shadowLevels.input,shadowLevels.destination);
const known=imageNoise[top],clean=image[top],root=Math.sqrt;
const random=generator(942);
const batch=[.92,.55,.18,.008].map(a=>image.map(x=>forwardValue(x,normal(random),a)));

function row(d,name,value,x,y,w=790,col=C.ink) {
  d.text(name,x,y,37,C.quiet);d.text(value,x+w,y,42,col,'mono','right',w*.58);
  d.line(x,y+24,x+w,y+24,C.faint,2);
}
function readPlate(d,p,x,y,w,index,label,col){
  d.text(label,x,y-29,40,col);
  d.sheet(p,x,y,w,index);
  d.text(num(p[index]),x+w/2,y+w+65,54,col,'mono','center');
}
export function forward(d,c){
  const b=c.beat.beatIndex;
  d.title('Oak table   /   forward process',b===3?'One batch, four noise levels':'Save one exposure');
  if(b===3){
    batch.forEach((px,i)=>{
      const n=[.92,.55,.18,.008][i],x=99+453*i;
      d.sheet(px,x,330,365,null,'Retained '+num(n,3));
      d.text('Draw '+(i+1),x,300,34,C.green,'mono');
    });
    d.note('Sample the level, draw fresh noise, then mix each image directly.');return;
  }
  const a=1-.1*cue(c,1,'Shrink the clean image',2.3)-.4*cue(c,2,'turn the retained variance',2)-.499*cue(c,2,'Turn it almost to zero',2.2);
  const capture=cue(c,1,'save a copy',.75),px=exposure(a);
  readPlate(d,px,97,322,440,top,'Working exposure',C.green);
  d.text('Marked tabletop pixel',638,346,40,C.ink,'serif');
  row(d,'Retained variance',num(a),639,431,575);
  row(d,'Signal amplitude',num(root(a)),639,509,575);
  row(d,'Noise amplitude',num(root(1-a)),639,587,575);
  row(d,'Fixed draw',num(known,1),639,665,575);
  d.fade(capture,()=>readPlate(d,saved,1320,357,351,top,'Saved exposure',C.blue));
  d.note(b===0?'The tabletop and the noise draw have opposite signs.':b===1?'Keep the light exposure as an independent reference.':'Same clean pixels and same grain at every setting.');
}
export function coefficients(d,c){
  const b=c.beat.beatIndex;
  if(b===0){
    d.title('Oak table   /   noise schedule','How much signal survives two steps?');
    const v=.8,vals=[1,v,v*v],labels=['Start','After one step','After two steps'];
    vals.forEach((a,i)=>{
      const show=i===2?cue(c,0,'leave sixty-four',.7):1;
      d.text(labels[i],100,390+155*i,43,C.ink,'serif');
      d.rect(540,340+155*i,1000,60,C.pale);
      d.fade(show,()=>{d.rect(540,340+155*i,1000*a,60,C.green);d.text(num(a,2),1670,390+155*i,45,C.ink,'mono');});
    });
    d.note('Cumulative retained variance is the product of the stepwise fractions.');return;
  }
  d.title('Oak table   /   one coordinate','Where does the negative draw carry the mark?');
  const a=root(.5),signal=a*clean,noise=a*known;
  d.sheet(half,103,326,367,top,'Half variance');
  d.text('Signal',583,369,38,C.blue);d.text('√0.5 × 1',851,369,48,C.blue,'mono');
  d.text('Noise',583,447,38,C.copper);d.text('√0.5 × (−0.4)',851,447,48,C.copper,'mono');
  const at=d.axis(602,667,1095,-.1,1, [0,.25,.5,.75,1],'Normalized brightness');
  const p=cue(c,2,'add the clean contribution',1.5),q=cue(c,2,'Now add the negative draw',1.5);
  const z=signal*p+noise*q;
  d.arrow(at(0),598,at(signal*p),598,C.blue,9);
  d.arrow(at(signal*p),634,at(z),634,C.copper,9);
  d.mark(at(z),667,C.ink);d.text(num(z),at(z),548,47,C.ink,'mono','center');
  d.note(b===3?'Independent unit-variance inputs     SNR = 0.50 / 0.50 = 1     •     At 0.90, SNR = 9.':'Signal amplitude² + noise amplitude² = 1');
}
const guessed=[-.2,.2],target=[imageNoise[top],imageNoise[shadow]];
const errors=guessed.map((v,i)=>(v-target[i])**2);
const meanError=errors.reduce((s,x)=>s+x)/2;
function learningStep(progress){
  const predictions=guessed.map((g,i)=>g-.5*progress*(g-target[i]));
  const squared=predictions.map((g,i)=>(g-target[i])**2);
  return {predictions,squared,loss:(squared[0]+squared[1])/2};
}
const vel=root(.5)*known-root(.5)*clean;
export function training(d,c){
  const b=c.beat.beatIndex;
  if(b<2){
    d.title('Training   /   known Gaussian draws','Which answer does training know?');
    d.sheet(image,97,348,320,null,'Clean table');
    d.arrow(452,500,552,500,C.blue);
    d.sheet(half,595,348,320,top,'Input at half variance');
    d.text('Noise targets',1022,314,47,C.ink,'serif');
    const pred=cue(c,1,'its noise estimates',.55),squares=cue(c,1,'Square each error',.7);
    const fit=learningStep(cue(c,1,'take a half step',1.5));
    for(let i=0;i<2;i++){
      const y=439+i*156;
      d.text(i?'Shadow':'Tabletop',1025,y,37,C.quiet);
      d.text(num(target[i],1),1258,y,46,C.green,'mono');
      d.fade(pred,()=>d.text('guess '+num(fit.predictions[i],3),1450,y,38,C.blue,'mono'));
      d.fade(squares,()=>d.text('squared error   '+num(fit.squared[i],3),1258,y+66,33,C.copper,'mono'));
    }
    d.fade(cue(c,1,'average the two',.6),()=>d.text('Mean squared error   '+num(fit.loss,3),1025,799,41,C.ink,'mono','left',800));
    d.note('The loss reads the recorded draws. The denoiser sees the noisy input and its level.');return;
  }
  if(b<4){
    d.title('Training   /   prediction target','What did the network predict?');
    d.sheet(half,96,340,360,top,'Noisy input');
    d.text('Rotational velocity',561,358,43,C.quiet);d.text('v = a ε − b x₀ = '+num(vel),561,445,51,C.ink,'mono');
    d.text('a = b = √0.5     x ≈ '+num(half[top],6),562,516,36,C.quiet,'mono');
    const correct=root(.5)*half[top]-root(.5)*vel, wrong=recoverClean(half[top],vel,.5);
    const at=d.axis(570,693,1170,0,1.8,[0,.5,1,1.5]);
    d.fade(cue(c,2,'use the velocity inverse',.5),()=>{
      d.mark(at(correct),693,C.green);d.text('a x − b v = '+num(correct),at(correct),651,41,C.green,'mono','center');
    });
    d.fade(cue(c,3,'as noise',.6),()=>{
      d.mark(at(wrong),693,C.copper);d.text('wrong '+num(wrong),at(wrong),791,37,C.copper,'mono','center');
    });
    d.note(b===2?'For a velocity prediction, the clean estimate is a x − b v.':'Using (x − b ε) / a with v in the ε slot overshoots the clean pixel.');return;
  }
  d.title('Reverse uncertainty   /   observed pixel = 0','What spread survives when the clean cause is hidden?');
  const f=posteriorFixture(),at=d.axis(123,727,1058,-2.4,2.4,[-2,-1,0,1,2],'Previous noisy value');
  const density=(x,m)=>Math.exp(-((x-m)**2)/(2*f.within))/root(2*Math.PI*f.within);
  const curve=(fn,col,w)=>d.path(Array.from({length:181},(_,i)=>{
    const x=-2.4+i*4.8/180;return [at(x),727-fn(x)*510];
  }),col,w);
  f.means.forEach((m,i)=>{
    curve(x=>density(x,m),i?C.copper:C.blue,4);
    d.text((m<0?'−':'+')+'√2/3',at(m)+(i?35:-35),327,35,i?C.copper:C.blue,'mono','center');
  });
  const pooled=cue(c,5,'Mix the two curves',1);
  d.fade(pooled,()=>curve(x=>(density(x,f.means[0])+density(x,f.means[1]))/2,C.green,10));
  d.text('Equal posterior weights',1242,379,42,C.ink,'serif');
  row(d,'Within','1/3',1242,483,557,C.blue);
  d.fade(cue(c,5,'Add the exact fractions',.35),()=>row(d,'Between','2/9',1242,576,557,C.copper));
  d.fade(cue(c,5,'This wider green curve',.35),()=>row(d,'Total','5/9 ≈ '+num(f.total),1242,669,557,C.green));
  d.note(pooled<1?'Each colored curve conditions on one possible clean cause.':'The green density mixes both causes. Its mean is zero.');
}
const imageSide = Math.sqrt(half.length);
const patchSide = imageSide / 2;
const patchPositions = ['A', 'B', 'C', 'D'].map((label, index) => {
  const column = index % 2;
  const row = Math.floor(index / 2);
  const pixels = Array.from({length: patchSide ** 2}, (_, i) =>
    (row * patchSide + Math.floor(i / patchSide)) * imageSide + column * patchSide + i % patchSide);
  return {
    label, row, column, tokenX: 680 + index * 165,
    input: pixels.map(i => half[i]),
    prediction: pixels.map(i => imageNoise[i]),
  };
});

function patchGrid(d, x, field, color, caption) {
  for (const patch of patchPositions) {
    const left = x + patch.column * 168;
    const top = 370 + patch.row * 168;
    d.sheet(patch[field], left, top, 154, null);
    d.rect(left, top, 39, 41, color);
    d.text(patch.label, left + 20, top + 32, 32, C.white, 'mono', 'center');
  }
  d.text(caption, x + 161, 749, 37, C.ink, 'sans', 'center');
}

function patchAttention(d, c) {
  const tokens = cue(c, 3, 'forms patch tokens', .35);
  const mixed = cue(c, 3, 'mixes them by attention', .4);
  const projected = cue(c, 3, 'projects them back', .4);
  patchGrid(d, 111, 'input', C.blue, 'Noisy input patches');
  d.fade(mixed, () => {
    for (const output of patchPositions) {
      for (const input of patchPositions) {
        d.line(input.tokenX, 428, output.tokenX, 631, '#79a69c', 4);
      }
    }
  });
  d.fade(tokens, () => {
    d.arrow(469, 492, 624, 431, C.blue);
    d.text('Patch tokens', 928, 352, 38, C.blue, 'sans', 'center');
    for (const patch of patchPositions) {
      d.dot(patch.tokenX, 428, 29, C.blue);
      d.text(patch.label, patch.tokenX, 439, 34, C.white, 'mono', 'center');
    }
  });
  d.fade(mixed, () => {
    for (const patch of patchPositions) {
      d.dot(patch.tokenX, 631, 29, C.green);
      d.text(patch.label, patch.tokenX, 642, 34, C.white, 'mono', 'center');
    }
    d.text('After self-attention', 928, 749, 38, C.green, 'sans', 'center');
  });
  d.fade(projected, () => {
    d.arrow(1230, 631, 1360, 548, C.green);
    patchGrid(d, 1410, 'prediction', C.green, 'Predicted noise');
  });
  d.note(projected >= 1 ? 'Each output token predicts the noise in its own patch at this timestep.' :
    mixed >= 1 ? 'Each of the four positions can read all four input tokens.' :
    tokens >= 1 ? 'One patch gives one token. The letters keep track of their positions.' :
    'The four patches cover the noisy image at the current timestep.');
}

function architecture(d,c){
  const b=c.beat.beatIndex;
  if(b===3){
    const patches=cue(c,3,'A diffusion transformer',0);
    d.title('One denoiser call   /   two backbones',patches>.5?'How do patch tokens return a prediction?':'Where does a U-Net keep local detail?');
    d.fade(1-patches,()=>{
      const pts=[[235,434],[560,545],[910,644],[1260,545],[1590,434]];
      for(let i=0;i<4;i++)d.arrow(pts[i][0]+62,pts[i][1],pts[i+1][0]-78,pts[i+1][1],C.quiet,5);
      pts.forEach(([x,y],i)=>{
        const side=[160,112,72,112,160][i];d.sheet(i===4?imageNoise:half,x-side/2,y-side/2,side,null);
      });
      d.path([[235,338],[235,298],[1590,298],[1590,338]],C.copper,5);
      d.text('Skip features',914,282,32,C.copper,'sans','center');
      d.text('Downsample',380,780,40,C.blue);d.text('Upsample',1250,780,40,C.green);
      d.note('Schematic feature maps. Both backbones evaluate the whole noisy state at the supplied timestep.');
    });
    d.fade(patches,()=>patchAttention(d,c));
    return;
  }
  d.title('Timestep conditioning   /   one feature','How can one feature respond to a different noise level?');
  const p=cue(c,4,'Change the timestep',1.5);
  const scale=mix(.5,.05,p),shift=mix(-.05,.02,p),v=.5*(1+scale)+shift;
  d.text('Feature',122,383,44,C.quiet);d.text('0.50',122,510,95,C.blue,'mono');
  d.text('× (1 + scale) + shift',520,383,44,C.quiet);
  d.text('× (1 + '+num(scale,3)+') + ('+num(shift,3)+')',500,497,54,C.ink,'mono');
  const at=d.axis(146,725,1599,0,.8,[0,.2,.4,.6,.8]);
  d.mark(at(v),725,C.green,19);d.text(num(v),at(v),673,58,C.green,'mono','center');
  d.note('Timestep embeddings can modulate intermediate features throughout the network.');
}
export function reverse(d,c){
  const b=c.beat.beatIndex;if(b>=3)return architecture(d,c);
  const final=cue(c,2,'At index zero',0);
  const current=b<2?0:final?2:1, rr=trace.rows[current];
  const {beta,alpha,retained}=schedule[rr.step];
  const predict=current===0?cue(c,0,'Watch the white mark',.35):current===1?cue(c,2,'Read the new prediction',.35):1;
  const equation=current===0?cue(c,1,'Use the schedule',.4):predict;
  const move=current===0?cue(c,1,'Move the mark to the mean',1.1):
    current===1?cue(c,2,'Apply the mean',.9):cue(c,2,'Apply the final mean',1.1);
  const draw=current===0?cue(c,1,'Now add the fresh draw',1.1):
    current===1?cue(c,2,'then add its fresh draw',.9):0;
  const val=mix(rr.input,rr.mean,move)+(rr.next-rr.mean)*draw;
  d.title('Sampler   /   scalar DDPM trace','Who moves the pixel?');
  d.text(current===0?'Supplied checkpoint':'Previous landing',102,286,36,C.quiet);
  d.text('x = '+num(rr.input,4),100,359,55,C.ink,'mono');
  d.text('Toy predictor at k = '+rr.step,668,286,36,C.quiet);
  d.text('0.45 x + 0.02 k',666,359,48,C.ink,'mono');
  d.text('Predicted noise',1390,286,36,C.quiet);
  d.fade(predict,()=>d.text(num(rr.prediction,4),1390,359,54,C.blue,'mono'));
  d.text('β = '+num(beta,2)+'     α = '+num(alpha,2)+'     ᾱ = '+num(retained,6),101,449,41,C.quiet,'mono');
  const meanFormula=(current===0?'μ = (':'μ ≈ (')+num(rr.input,current===0?2:4)+' − '+num(beta,2)+' × '+num(rr.prediction,4)+
    ' / √(1 − '+num(retained,6)+')) / √'+num(alpha,2);
  d.fade(equation,()=>d.text(meanFormula,99,534,46,C.ink,'mono','left',1715));
  const axis=d.axis(148,700,1580,1.05,1.28,[1.05,1.10,1.15,1.20,1.25]);
  d.dot(axis(rr.input),700,23,C.blue,true);d.mark(axis(val),700,C.dark,16);d.dot(axis(val),700,8,C.white);
  d.text(num(val,4),axis(val),638,55,C.ink,'mono','center');
  d.fade(move,()=>d.text('Reverse mean ≈ '+num(rr.mean,4),99,833,39,C.blue,'mono'));
  if(current===2)d.text('Final draw omitted',984,833,38,C.copper,'mono');
  else d.fade(draw,()=>d.text('Add √'+num(beta,2)+' × ('+num(rr.draw,6)+')',984,833,38,C.copper,'mono'));
  d.note(b===0?'Three forward steps retain 0.98 × 0.97 × 0.96 of the signal variance.':
    b===1?'Correct the input with predicted noise, then rescale by 1 / √α.':'Each step uses its own schedule values. Readouts are rounded.');
}

function worksheetShot(d, c, study, levels, idx) {
  const shadowStudy = idx === shadow;
  const {input, destination} = levels;
  const subtract = cue(c, 1, shadowStudy ? 'Undo that mix' : 'Subtract the noise contribution', .7);
  const divide = cue(c, 1, shadowStudy ? 'recover the negative clean pixel' : 'then divide by the signal amplitude', .9);
  const scale = cue(c, 1, shadowStudy ? 'At the destination' : 'Scale that clean value', 1);
  const carry = cue(c, 2, shadowStudy ? 'Add the positive noise contribution' : 'Put back the carried noise direction', 1.25);
  const uncover = cue(c, 2, shadowStudy ? 'right on an independently mixed' : 'The grain lines up', 0);
  const compare = carry === 1 && uncover === 1;
  const current = blend(study.input, study.signal, subtract);
  const recovered = blend(current, study.recovered, divide);
  const scaled = blend(recovered, study.scaled, scale);
  const pixels = blend(scaled, study.destination, carry);
  const epsilon = imageNoise[idx];
  const cleanValue = study.recovered[idx];
  const signal = study.scaled[idx];
  const noise = root(1-destination)*epsilon;

  d.title(shadowStudy ? 'Independent check   /   shadow pixel' : 'Sampler check   /   DDIM with η = 0',
    shadowStudy ? 'Where should the shadow land?' : 'Can we return to the saved square?');
  const left = 112, right = 1474, plateY = 309, side = 315;
  d.text(shadowStudy ? 'Forward reference' : 'Saved at '+num(destination,2), left, 286, 40, C.blue);
  if (compare) {
    d.sheet(study.reference, left, plateY, side, idx, '', C.blue);
    d.text(num(study.reference[idx]), left+side/2, 699, 46, C.blue, 'mono', 'center');
  } else {
    d.rect(left, plateY, side, side, C.pale);
    d.frame(left, plateY, side, side, C.blue, 3);
    d.text('Reference covered', left+side/2, plateY+side/2+12, 36, C.blue, 'sans', 'center', side-36);
  }
  d.text(carry === 1 ? 'DDIM destination' : 'Working exposure', right, 286, 40, C.green);
  d.sheet(pixels, right, plateY, side, idx, '', C.green);

  d.text('Retained variance', 960, 312, 38, C.quiet, 'sans', 'center');
  d.text(num(input,2)+' → '+num(destination,2), 960, 384, 57, C.ink, 'mono', 'center');
  d.text('Known ε = '+num(epsilon,1), 960, 449, 42, C.copper, 'mono', 'center');

  const term = (a, value) => '√'+num(a,2)+' × ('+num(value,1)+')';
  if (carry > 0) {
    d.text('Clean contribution', 710, 520, 38, C.blue, 'serif', 'center');
    d.text(term(destination,cleanValue), 710, 577, 43, C.blue, 'mono', 'center');
    d.text('≈ '+num(signal,4), 710, 627, 40, C.blue, 'mono', 'center');
    d.text('+', 960, 577, 43, C.ink, 'mono', 'center');
    d.text('Carried noise', 1210, 520, 38, C.copper, 'serif', 'center');
    d.text(term(1-destination,epsilon), 1210, 577, 43, C.copper, 'mono', 'center');
    if (carry === 1) d.text('≈ '+num(noise,4), 1210, 627, 40, C.copper, 'mono', 'center');
  } else {
    const inputNoise = term(1-input,epsilon);
    let operation = 'Start at the noisy input';
    let calculation = 'x ≈ '+num(study.input[idx]);
    if (scale > 0) {
      operation = 'Scale the clean value to the destination';
      calculation = term(destination,cleanValue);
    } else if (divide > 0) {
      operation = 'Divide by the input signal amplitude';
      calculation = num(study.signal[idx],6)+' / √'+num(input,2);
    } else if (subtract > 0) {
      operation = 'Subtract the input noise contribution';
      calculation = num(study.input[idx],6)+' − '+inputNoise;
    } else if (shadowStudy && c.beat.beatIndex === 1) {
      operation = 'The input contributions cancel';
      calculation = term(input,cleanValue)+' + '+inputNoise+' = '+num(study.input[idx]);
    } else if (shadowStudy) {
      operation = 'The shadow inputs';
      calculation = 'Clean = '+num(image[idx],1)+'     η = 0';
    }
    d.text(operation, 960, 520, 42, C.ink, 'serif', 'center');
    d.text(calculation, 960, 582, 44, scale > 0 ? C.blue : C.ink, 'mono', 'center', 860);
  }

  const axisY = 779;
  const at = d.axis(165, axisY, 1590, -1.1, 1.1, [-1,-.5,0,.5,1]);
  const x = at(pixels[idx]);
  if (scale === 1) {
    const tip = at(signal);
    d.arrow(at(0), 713, tip, 713, C.blue, 8);
    d.line(tip, 713, tip, axisY, C.blue, 3);
    if (carry > 0) {
      d.arrow(tip, 746, x, 746, C.copper, 8);
      d.line(x, 746, x, axisY, C.copper, 3);
    }
  }
  d.mark(x, axisY, C.green, 12);
  if (compare) d.dot(at(study.reference[idx]), axisY, 23, C.blue, true, 4);
  d.text(num(pixels[idx]), x, 683, 49, C.green, 'mono', 'center');
  d.note(compare ? 'The independently mixed reference has the same grain and marked brightness.' :
    carry > 0 ? 'The sign of the carried noise sets the direction on the ruler.' : 'Normalized brightness of the marked pixel.');
}
export function sampler(d,c){
  const b=c.beat.beatIndex;
  if(b<=2)return worksheetShot(d,c,jump,tabletopLevels,top);
  if(b===4){
    d.title('DDIM schedule   /   same initial state and model','Which evaluations can a sparse schedule skip?');
    const stride=cue(c,4,'widely spaced levels',.7);
    for(const [row,levels] of [[0,[12,11,10,9,8,7,6,5,4,3,2,1]],[1,[12,9,6,3]]]){
      const y=421+230*row,col=row?C.copper:C.blue;
      d.text(row?'Sparse':'Dense',95,y+10,51,col,'serif');
      d.line(414,y,1602,y,C.faint,3);
      d.fade(row?stride:1,()=>{
        levels.forEach(k=>{const x=414+(12-k)*99;d.mark(x,y,col);d.text(String(k),x,y+65,33,col,'mono','center');});
        d.text(levels.length+' calls',1817,y+10,40,col,'mono','right');
      });
    }
    d.note('Example schedules, one call per selected level, η = 0. Benchmark detail on matched generations.');return;
  }
  d.title('DDIM replay   /   same input and prediction','What happens when the fresh draw changes sign?');
  const eta=cue(c,3,'eta set to one',1);
  const terms=ddimTerms(clean,known,.5,.9,eta);
  const neg=cue(c,3,'A draw of minus one',.8),pos=cue(c,3,'Plus one',.8);
  row(d,'Fresh noise scale σ',num(terms.sigma,6),100,321,790);
  row(d,'Shared center',num(terms.center,6),990,321,790);
  [-1,1].forEach((z,i)=>{
    const y=493+i*214,at=d.axis(411,y,1299,.5,1.3,[.5,.7,.9,1.1,1.3]);
    d.text('z = '+num(z,0),96,y+11,43,C.ink,'mono');
    d.dot(at(terms.center),y,17,C.blue,true);
    const reveal=i?pos:neg;
    const end=terms.center+z*terms.sigma;
    d.fade(eta===0?1:reveal,()=>{d.arrow(at(terms.center),y,at(end),y,C.copper,6);d.mark(at(end),y,C.copper,10);d.text(num(end),at(end),y-33,42,C.copper,'mono','center');});
  });
  d.text('σ = η √(0.10 / 0.50) √(1 − 0.50 / 0.90)     •     η = '+num(eta,2),100,830,37,C.quiet,'mono');
  d.note('Jump 0.50 → 0.90     •     Center = √0.90 × 1 + √(0.10 − σ²) × (−0.4)     •     Landing = center + σ z');
}
export function practice(d,c){worksheetShot(d,c,shadowJump,shadowLevels,shadow);}
export function checkPixels(){
  const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t);
  assert.equal(patchPositions.length, 4);
  assert.equal(new Set(patchPositions.map(patch => patch.tokenX)).size, 4);
  for (const [field, grid] of [['input', half], ['prediction', imageNoise]]) {
    const assembled = [];
    for (const patch of patchPositions) {
      assert.equal(patch[field].length, patchSide ** 2);
      for (let y = 0; y < patchSide; y++) {
        const start = (patch.row * patchSide + y) * imageSide + patch.column * patchSide;
        for (let x = 0; x < patchSide; x++) assembled[start + x] = patch[field][y * patchSide + x];
      }
    }
    assert.deepEqual(assembled, Array.from(grid));
  }
  near(saved[top],.822192,.000001);near(half[top],.424264,.000001);
  for (const [study, levels, idx, expected] of [[jump, tabletopLevels, top, '0.822'], [shadowJump, shadowLevels, shadow, '−0.280']]) {
    study.destination.forEach((v,i)=>near(v,study.reference[i]));
    const carriedNoise = root(1-levels.destination)*imageNoise[idx];
    near(study.signal[idx], study.input[idx]-root(1-levels.input)*imageNoise[idx]);
    near(study.scaled[idx]+carriedNoise, study.destination[idx]);
    assert.equal(num(Number(study.scaled[idx].toFixed(4))+Number(carriedNoise.toFixed(4))), expected);
    assert.equal(num(study.destination[idx]), expected);
    assert.equal(num(study.reference[idx]), expected);
  }
  near(shadowJump.input[shadow],0);
  near(meanError,.10);near(learningStep(0).loss,meanError);near(learningStep(1).loss,.025);
  near(root(.5)*half[top]-root(.5)*vel,1);near(recoverClean(half[top],vel,.5),1.58995,.00002);
  const f=posteriorFixture();near(f.within,1/3);near(f.between,2/9);near(f.total,5/9);
  near(f.means[1],root(2)/3);near((f.means[0]+f.means[1])/2,0);
  near(trace.rows[0].prediction,.6025);near(trace.rows[0].input,1.25);
  near(schedule[2].retained,.912576);assert.equal(num(trace.rows[0].mean,4),'1.1926');
  trace.rows.forEach((r,i)=>{
    const {beta,alpha,retained}=schedule[r.step];
    near(r.prediction,.45*r.input+.02*r.step);
    near(r.mean,(r.input-beta*r.prediction/root(1-retained))/root(alpha));
    near(r.next,r.mean+root(beta)*r.draw);
    if(i)near(r.input,trace.rows[i-1].next);
  });
  assert.equal(trace.rows[2].draw,0);
  const e=ddimTerms(1,-.4,.5,.9,1);near(e.center-e.sigma,.608377,.000002);near(e.center+e.sigma,1.204662,.000002);
  for(const z of [-1,1]){
    const visible=Number(e.center.toFixed(6))+z*Number(e.sigma.toFixed(6));
    assert.equal(num(visible),num(e.center+z*e.sigma));
  }
}
