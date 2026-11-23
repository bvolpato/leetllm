import { C, clamp, fmt, vec, smooth } from './drawing.mjs';
import { rows, history, regression, gradients, scalarPulls, schema, indexedSet, projectionFixture,
  firstBatch, finalBatch, finalPlain, frac3, savedLayer, restoreSlots, restoreLeaf, learningRate } from './experiments.mjs';

function unitSquare(g, side, x, y, pitch, ink) {
  for(let r=0;r<side;r++) for(let c=0;c<side;c++)
    g.box(x+(c-side/2)*pitch+2,y+(r-side/2)*pitch+2,pitch-4,pitch-4,ink);
}

function residualScale(g, row, origin, y, pitch, ready, error) {
  const x = v => origin + pitch*v;
  g.line([[x(-1.4),y],[x(2.4),y]],C.rule,3);
  for(let t=-1;t<=2;t++)g.line([[x(t),y-8],[x(t),y+8]],C.muted,2);
  g.fade(error,()=>g.line([[x(row.y),y],[x(row.prediction),y]],C.amber,8));
  g.dot(x(row.y),y,13,C.white,C.amber);
  g.fade(ready,()=>g.dot(x(row.prediction),y,9,C.violet));
}

// A miss supplies both the span on the ruler and the side of its square.
function squaredMiss(g, row, center, y, pitch, open, wide, trace = 1) {
  const side = Math.abs(row.prediction - row.y);
  const length = side * pitch;
  const left = center - length / 2;
  const right = center + length / 2;
  const predictionLeft = row.prediction < row.y;
  const overhang = pitch * .55;

  g.line([[left - overhang, y], [right + overhang, y]], C.rule, 4);
  for (let tick = -2; tick <= side * 4 + 2; tick++) {
    const x = left + tick * pitch / 4;
    const height = tick % 4 === 0 ? 24 : tick % 2 === 0 ? 13 : 7;
    g.line([[x, y - height], [x, y]], C.muted, tick % 4 === 0 ? 4 : 2);
  }

  if (open > 0) {
    g.ctx.save();
    g.ctx.beginPath();
    g.ctx.rect(left, y, length, length * open);
    g.ctx.clip();
    for (let r = 0; r < side; r++) {
      for (let c = 0; c < side; c++) {
        const x = left + c * pitch, top = y + r * pitch;
        g.box(x + 3, top + 3, pitch - 6, pitch - 6, C.teal);
        g.mono('1', x + pitch / 2, top + pitch / 2, pitch * .34,
          {color: C.white, align: 'center'});
      }
    }
    g.ctx.restore();
  }

  g.line([[left, y], [right, y]], C.peach, 9);
  const from = predictionLeft ? left : right;
  g.line([[from, y], [from + (predictionLeft ? length : -length) * trace, y]], C.amber, 9);
  for (const [value, name, x, color] of [
    [row.prediction, 'Prediction', predictionLeft ? left : right, C.violet],
    [row.y, 'Target', predictionLeft ? right : left, C.amber],
  ]) {
    g.text(name, x + (x === left ? -38 : 38) * wide, y - 155 + 8 * wide,
      58 - 12 * wide, {align: 'center', color});
    g.mono(fmt(value), x, y - 65, 99 - 25 * wide, {align: 'center', color});
    const prediction = name === 'Prediction';
    g.dot(x, y, prediction ? 15 : 19, prediction ? color : C.white, color);
  }
}

export function opening(g) {
  const {cue, b} = g, data = firstBatch;
  const unfold = smooth(cue(1, 'Use that segment', 1.7));
  const pull = smooth(cue(1, 'The second prediction', 1.7));
  const secondArea = smooth(cue(1, 'Squaring that miss', 1));
  const padding = smooth(cue(2, 'Slide two zero rows', 1.1));
  const countAll = cue(2, 'counts all four slots') && !cue(3, 'Count the two real examples again');
  const asked = cue(2, 'Did either prediction');
  const restored = cue(3, 'Count the two real examples again');
  const showMean = b > 1 || g.clock.elapsed >= g.clock.speechDuration;
  const showAnswer = countAll ? asked : !restored || cue(3, 'Before training');
  const count = countAll ? data.batch.length : data.loss.count;

  g.title(b === 2 && asked ? 'Did either prediction get closer?' : 'The last batch');
  g.mono('w = [0, 0]     b = ' + data.bias, 1824, 103, 37, {align: 'right', color: C.muted});

  const nearPitch = 520 - 205 * unfold;
  const pitch = nearPitch + (165 - nearPitch) * pull;
  const nearY = 569 - 237 * unfold;
  const y = nearY + (331 - nearY) * pull;
  const firstX = 960 - 421 * pull;
  squaredMiss(g, data.batch[0], firstX, y, pitch, unfold, pull, smooth(cue(1, 'Our last batch', 1.5)));
  const distance = Math.abs(data.batch[0].prediction - data.batch[0].y);
  g.fade(unfold === 0 ? cue(1, 'The gap', .35) : 0, () => {
    g.bracket(firstX - distance * pitch / 2, firstX + distance * pitch / 2, y + 85);
    g.text(distance + ' units', firstX, y + 150, 67, {align: 'center', face: 'Serif'});
  });
  const secondX = firstX + (1381 - 539) * pitch / 165;
  g.fade(Math.max(0, (pull - .78) / .22), () =>
    squaredMiss(g, data.batch[1], secondX, y, pitch, secondArea, pull));

  const centers = [539, 1381];
  g.fade(padding, () => {
    const top = 707 + (1 - padding) * 32;
    const color = countAll ? C.amber : C.muted;
    data.batch.slice(2).forEach((row, i) => {
      const x = centers[i];
      g.box(x - 307, top, 614, 74, countAll ? C.peach : '#e6e6dc');
      g.text('Padding', x - 262, top + 37, 41, {color});
      g.mono('error² = ' + fmt(row.squared), x + 262, top + 37, 39, {align: 'right', color});
    });
  });

  if (showMean) {
    g.line([[98, 825], [1822, 825]], C.rule, 3);
    g.text('Mean squared error', 103, 918, 55, {face: 'Serif'});
    g.mono(data.loss.sum + ' ÷ ' + count + ' = ' + (showAnswer ? fmt(data.loss.sum / count) : '?'),
      718, 918, 76, {color: C.teal, max: 654});
    g.text(countAll ? 'All four slots' : 'Two real examples', 1820, 917, 45,
      {align: 'right', color: C.muted});
  }
}

export function finalPractice(g) {
  const {b, clock, cue} = g;
  // A caption can start with the sentence while the picture waits for its result.
  function after(beat, phrase, {seconds = 0, captionStart} = {}) {
    if (beat !== b) return Number(b > beat);
    if (captionStart) clock.reveal(phrase, 0, {captionStart});
    const elapsed = clock.elapsed + 1e-9 - clock.wordCue(phrase).end;
    return seconds ? smooth(clamp(elapsed / seconds)) : Number(elapsed >= 0);
  }

  const biasSet = after(1, 'Set the bias to one', {captionStart: 'Set the bias to one'});
  const predicted = after(1, 'Every slot now predicts one');
  const squared = cue(1, 'Square the difference', .6);
  const firstTwo = after(3, 'Keep the first three examples', {seconds: .55, captionStart: 'Keep the first three examples'});
  const thirdError = after(3, 'it adds zero error', {seconds: .55});
  const thirdCount = after(3, 'as one example', {seconds: .35});
  const excluded = after(3, 'Leave its error out', {seconds: .35});
  const answer = after(3, 'Five divided by three gives a loss of five thirds', {captionStart: 'Five divided by three'});
  const {batch, loss, bias} = finalBatch;
  const errorY = 636, sumY = 764, countY = 865, totalX = 1737;
  const center = {align: 'center'};

  g.title('One last batch', 'w = [0, 0]' + (biasSet ? '     •     b = ' + fmt(bias) : ''));
  g.text('Features', 105, 303, 40);
  g.text('Target', 105, 358, 40, {color: C.amber});
  if (predicted) g.text('Prediction', 105, 414, 40, {color: C.violet});
  g.fade(squared, () => g.text('Squared error', 105, errorY, 40));

  if (b === 3) {
    g.line([[104, 700], [1824, 700]], C.rule, 3);
    g.text('Add to sum', 105, sumY, 40, {color: C.teal});
    g.text('Add to count', 105, countY, 40, {color: C.violet});
    g.line([[1619, 725], [1619, 911]], C.rule, 2);
    g.label('MSE', totalX, 726, center);
    g.line([[1667, 813], [1807, 813]], C.muted, 4);
    g.mono(answer ? loss.sum : '?', totalX, 770, 63, {...center, color: C.teal});
    g.mono(answer ? loss.count : '?', totalX, 869, 63, {...center, color: C.violet});
  }

  for (const [i, row] of batch.entries()) {
    const x = 458 + i * 345;
    const color = !row.valid && excluded ? C.amber : C.teal;
    const side = Math.abs(row.prediction - row.y);
    g.text(row.valid ? 'Example ' + (i + 1) : 'Padding', x, 220, 41, center);
    g.line([[x - 134, 255], [x + 134, 255]], C.rule, 4, !row.valid);
    g.mono(vec(row.x), x, 303, 45, center);
    g.mono(fmt(row.y), x, 358, 45, {...center, color: C.amber});
    if (predicted) g.mono(fmt(row.prediction), x, 414, 45, {...center, color: C.violet});
    residualScale(g, row, x - 22, 475, 54, predicted, predicted);
    g.fade(squared, () => {
      if (side) unitSquare(g, side, x, 552, 47, color);
      g.mono(row.squared, x, errorY, 56, {...center, color});
    });

    if (b === 3) {
      for (const y of [sumY, countY]) g.box(x - 98, y - 34, 196, 68, C.white, C.rule);
      if (row.valid) {
        const addError = i === 2 ? thirdError : firstTwo;
        const addCount = i === 2 ? thirdCount : firstTwo;
        if (addError > 0) {
          const start = errorY + 59;
          const y = start + (sumY - start) * addError;
          g.line([[x, start - 30], [x, y - 29]], C.teal, 3);
          g.box(x - 54, y - 29, 108, 58, C.pale);
          g.mono(row.squared, x, y, 48, {...center, color: C.teal});
        }
        g.fade(addCount, () => {
          g.box(x - 54, countY - 29, 108, 58, C.lilac);
          g.mono(Number(row.valid), x, countY, 48, {...center, color: C.violet});
        });
      } else {
        g.fade(excluded, () => {
          for (const y of [sumY, countY]) g.text('Excluded', x, y, 37, {...center, color: C.amber});
        });
      }
    }
    if (b === 4 && !row.valid) g.text('Excluded', x, 691, 37, {...center, color: C.amber});
  }

  if (b === 2) {
    g.text('Which slots enter the sum? Which slots count?', 960, 839, 57, {...center, face: 'Serif'});
  }
  if (b === 4) {
    const weights = after(4, 'The two weight derivatives are minus two thirds and four thirds', {captionStart: 'The two weight derivatives'});
    const biasGradient = after(4, 'The bias derivative is two thirds', {captionStart: 'The bias derivative'});
    const match = after(4, 'All four numbers match the masked run', {captionStart: 'All four numbers match'});
    const grad = finalPlain.validGradient.map((value, i) => {
      const visible = i === 2 ? biasGradient : weights;
      return visible ? frac3(value) : '?';
    });
    const columns = [112, 690, 1000, 1295, 1600];
    const tableTop = 770, rowHeight = 76;
    g.table(['Run', 'MSE', '∂L/∂w₀', '∂L/∂w₁', '∂L/∂b'], [
      [finalPlain.loss.count + ' real rows', frac3(finalPlain.loss.masked), ...grad],
      [batch.length + ' slots, masked', frac3(loss.masked), ...finalBatch.validGradient.map(v => match ? frac3(v) : '?')],
    ], columns, {y: tableTop, dy: rowHeight, size: 44, colors: [C.ink, C.teal, C.violet, C.violet, C.violet]});
    if (match) {
      for (const x of columns.slice(1)) g.mono('=', x - 43, tableTop + 1.5 * rowHeight, 35, {color: C.teal});
    }
  }
}


export function boundary(g) {
  const {cue,b}=g;
  g.title('Follow one training call','train_step(params, velocity, batch, key)');
  const names=['parameters','momentum','random key'];
  const values=['w₀, b₀','v₀','K₀'], newer=['w₁, b₁','v₁','K₁'];
  const palette=[C.teal,C.violet,C.amber];
  const carried=cue(2,'Follow the return values',1.3);
  g.box(776,310,330,461,C.dark);
  g.text('step',941,520,83,{align:'center',face:'Serif',color:C.white});
  g.label('batch ↓',942,265,{align:'center'});
  names.forEach((name,i)=>{
    const y=390+i*145, color=palette[i];
    g.label(name,104,y); g.mono(values[i],455,y,51,{color});
    g.arrow(654,y,765,y,color);
    g.line([[1110,y],[1666,y]],C.rule,3,true);
    g.fade(carried,()=>{const x=1175+420*carried;g.box(x-82,y-48,180,96,C.paper);g.mono(newer[i],x,y,51,{align:'center',color});});
  });
  g.label('caller',110,278);g.label('next call',1600,278,{align:'center'});
  if(b>1) {g.line([[941,776],[941,838],[1170,838]],C.muted);g.mono('metrics["loss"]',1192,841,39);}
  if(b===3) g.mono('grad(loss)     vmap(loss_one, in_axes=(None, 0, 0))     jit(train_step)',120,963,37,{color:C.teal,max:1685});
}
export function oracle(g) {
  const switchP=g.cue(2,'Try weights two and minus one');
  const p=switchP?[2,-1,0]:[0,0,0], r=regression(p);
  const extra=g.cue(1,'Two more examples join',.7);
  const lower=g.cue(2,'On the bottom row'), rest=g.cue(2,'Apply that rule'), zero=g.cue(1,'all four predictions are zero');
  const done=switchP?g.cue(2,'The loss is zero'):g.cue(1,'Divide by four');
  g.title('Can the loss pass both checks?', 'prediction = x₀ × w₀ + x₁ × w₁ + b');
  g.label('weights',118,262);g.mono(vec(p.slice(0,2)),325,262,50,{color:C.teal});g.mono('b = 0',790,262,44);
  g.table(['Features','Target','Prediction','Squared error'],rows.slice(0,extra?4:2).map((row,i)=>{
    const visible=switchP?(i===3?lower:rest):zero;
    return [vec(row.x),fmt(row.y),visible?fmt(r.pred[i]):'?',visible?fmt(r.error[i]**2):'?'];
  }),[125,622,1010,1450],{y:388,dy:96,colors:[C.teal,C.ink,C.violet,C.amber],hot:switchP&&lower&&!rest?3:-1});
  if(done) g.result('Mean squared error',fmt(r.error.reduce((s,e)=>s+e*e,0))+' / 4 = '+fmt(r.loss),908);
}

export function pulls(g) {
  const {cue,b}=g;
  g.title('Which row pulls hardest?', 'w = [0, 0]    b = 0     •     First-weight contribution = 2 × (prediction − target) × first feature');
  const show=cue(1,'This row contributes minus twelve');
  const sum=cue(2,'Average all four');
  const zero=cue(2,'The second row');
  g.label('Features',103,270);g.label('Twice the residual × feature',430,270);g.label('First-weight derivative',1185,270);
  rows.forEach((r,i)=>{
    const y=367+i*100, v=gradients[i][0], seen=sum||(i===3&&show)||(i===1&&zero);
    g.mono(vec(r.x),104,y,48);g.mono('2 × '+fmt(-r.y)+' × '+r.x[0],430,y,45);
    g.line([[1030,y],[1640,y]],C.rule,2);g.line([[1640,y-26],[1640,y+26]],C.muted,3);
    if(seen){g.box(1640+v*47,y-15,-v*47,30,i===3?C.violet:C.teal);g.dot(1640+v*47,y,9,C.ink);g.mono(fmt(v),1700,y,48);}
  });
  if(b<3 && sum)g.result('Mean over four rows','(−4 + 0 − 2 − 12) / 4 = −4.5');
  if(b>=3) {
    g.table(['Leaf','weight[0]','weight[1]','bias'],[
      ['Mean gradient',...history[0].gradient.map(x=>fmt(x))],
      ['p − 0.05 × g',...history[1].p.map(x=>b===4?fmt(x):'?')]
    ],[105,670,1090,1490],{y:813,dy:82,size:41});
  }
}
export function transforms(g) {
  const {cue,b}=g;
  if(b===1){
    g.title('What can grad differentiate?','The loss must return one real scalar for this experiment.');
    for(const [i,s] of ['3.75','[3.75]'].entries()){
      const x=200+850*i;
      g.mono(s,x,408,121,{color:i?C.violet:C.teal});g.label('shape '+(i?'(1,)':'()'),x,551);
      g.arrow(x,635,x+500,635,i?C.violet:C.teal);
      g.text(i?'vector output':'scalar output',x,741,54,{face:'Serif'});
    }
    if(cue(1,'Value-and-grad'))g.result('value_and_grad(loss)','scalar loss, gradient tree',921);
  }else if(b===2||b===3){
    const agg=b===3;
    const operation=agg?'grad(mean_loss)(params, X, y)':'vmap(grad(loss_one), in_axes=(None, 0, 0))';
    const params = agg ? 'w = [0, 0]    b = 0' : 'shared parameters: w = [0, 0]    b = 0';
    g.title(agg?'Reduce the example axis':'Keep the example axis',operation+'     •     '+params);
    const showWeight = cue(2, 'The weight-gradient leaf');
    const showBias = cue(2, 'the bias-gradient leaf');
    const weight = gradients.map(row => row.slice(0, 2));
    const bias = gradients.map(row => row[2]);
    const columns = [110, 495, 1030, 1520];
    g.table(['Example', 'Features', '∂weight', '∂bias'], rows.map((row, i) => [
      i + 1, vec(row.x), showWeight ? vec(weight[i]) : '?', showBias ? fmt(bias[i]) : '?',
    ]), columns, {y:331, dy:96, colors:[C.muted, C.teal, C.violet, C.violet]});
    if (agg) {
      g.result('Mean of each column', vec(history[0].gradient.slice(0,2))+'       '+fmt(history[0].gradient[2]), 900);
    } else if (showWeight) {
      g.line([[110, 823], [1824, 823]], C.rule, 2);
      g.text('Returned per-example gradient shapes', columns[0], 900, 43, {max: 895});
      g.label('Weight gradient', columns[2], 866);
      g.mono('(' + weight.length + ', ' + weight[0].length + ')', columns[2], 938, 55, {color: C.violet});
      if (showBias) {
        g.label('Bias gradient', columns[3], 866);
        g.mono('(' + bias.length + ',)', columns[3], 938, 55, {color: C.violet});
      }
    }
  }else{
    g.title('Two examples, one scalar weight','w = 0     •     prediction = w × x     •     squared error');
    const q=[cue(4,'Its gradient is minus six'),cue(4,'Its gradient is plus six')];
    const origin=970;
    scalarPulls.forEach((v,i)=>{
      const y=383+219*i;
      g.label(i?'x = 3, target = −1':'x = 1, target = 3',115,y-60);g.line([[535,y],[1420,y]],C.rule);
      g.dot(origin,y,9,C.ink);
      if(q[i]) {g.arrow(origin,y,origin+v*65,y,i?C.teal:C.violet,9);g.mono(fmt(v),origin+v*65,y-55,60,{align:'center'});}
    });
    if(cue(4,'Taking absolute values'))g.mono('Individual norms    [6, 6]',105,783,51,{color:C.teal});
    if(cue(4,'Averaging the signed gradients'))g.result('Signed mean','(−6 + 6) / 2 = 0',934);
  }
}
export function trees(g) {
  const mode=g.cue(2,'Restore the name')?2:g.cue(2,'Rename weight')?1:0, s=schema(mode);
  g.title('Match the leaves before the update','At each matching path    •    new parameter = old parameter − '+fmt(learningRate)+' × gradient');
  for(const [i,root] of ['params','grads'].entries()){
    const x=158+880*i, branch=x+97;
    g.mono(root,x,319,65,{color:i?C.violet:C.teal});
    g.line([[branch,365],[branch,637]],C.rule,5);
    for(const [j,name] of [i?s.name:'weight','bias'].entries()){
      const y=470+j*167;
      g.line([[branch,y],[branch+75,y]],C.rule,5);
      g.mono(name,branch+96,y-26,49,{color:j===0&&i&&mode?C.amber:C.ink});
      const value=j===0?(i?(Array.isArray(s.value)?vec(s.value):fmt(s.value)):'[0, 0]'):(i?'−2.5':'0');
      g.mono(value+'   '+(j===0?(i?s.shape:'(2,)'):'()'),branch+96,y+40,37,{color:C.muted,max:530});
    }
  }
  const unchecked=g.cue(2,'That would move both weights');
  const contrast=g.cue(2,'The second should move');
  g.result(s.verdict,mode===2?(unchecked?'Broadcast → '+vec(s.candidate):'shape () supplied for (2,)'):mode===1?'weight ≠ kernel':'w → '+vec(s.candidate),865,mode?C.amber:C.teal);
  if(contrast)g.mono('Correct update    '+vec(schema(0).candidate),696,966,42,{color:C.teal});
}
function checkpointGrid(g, shape, values, x, y, fill, ink) {
  const rows = shape.length === 1 ? 1 : shape[0];
  const columns = shape.at(-1);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const left = x + col * 84, top = y + (row - rows / 2) * 76;
      g.box(left, top, 79, 71, fill, values ? undefined : C.rule);
      if (values) g.mono(values[row * columns + col], left + 39, top + 36, 48, {align: 'center', color: ink});
    }
  }
}

function checkpoint(g) {
  const {b, cue} = g;
  const committed = cue(1, 'A registered custom class');
  const typed = cue(1, 'Both leaves hold');
  const traces = [cue(1, 'weight key', 0.85), cue(1, 'bias key', 0.85)];
  g.title(b === 1 ? 'Which checkpoint leaf fills each slot?' : 'Which settings can specialize a call?');
  g.label('Saved parameter tree', 105, 218);
  g.mono('layer', 108, 309, 61);
  g.label(b === 1 ? 'Destination layer' : 'Static activation setting', 1100, 218);
  g.line([[1034, 211], [1034, 764]], C.rule, 2);
  g.line([[168,351],[168,686],[284,686]], C.rule, 5);
  g.line([[168,450],[284,450]], C.rule, 5);

  restoreSlots.forEach((slot, i) => {
    const y = 450 + i * 236;
    const leaf = savedLayer[slot.key];
    const arrived = restoreLeaf(savedLayer, slot);
    const shape = '(' + slot.shape.join(', ') + (slot.shape.length === 1 ? ',' : '') + ')';
    const t = smooth(traces[i]);
    // Follow the path down from the parent, then across to the key.
    const start = 351, corner = y - start, length = corner + 116;
    const travel = t * length;
    if (t > 0) g.line([[168,start],[168,start + Math.min(travel,corner)],
      [168 + Math.max(0,travel - corner), start + Math.min(travel,corner)]], C.teal, 7);
    g.mono(slot.key, 302, y, 51, {color: t > 0 ? C.teal : C.ink});
    g.line([[500,y],[549,y]], t === 1 ? C.teal : C.rule, 4);
    checkpointGrid(g, leaf.shape, leaf.values, 564, y, t === 1 ? C.pale : C.white, C.ink);
    g.mono(shape, 780, y - 27, 39);
    if (typed) g.mono('float32', 780, y + 29, 34, {color: C.teal});
    if (b === 1) {
      const restored = committed && arrived;
      g.box(1092, y - 100, 704, 199, C.white, restored ? C.teal : C.rule, 3);
      g.mono('layer.' + slot.key, 1124, y - 27, 44);
      g.mono(shape + '  ' + slot.dtype, 1124, y + 37, 34, {color: C.muted});
      checkpointGrid(g, slot.shape, restored ? arrived.values : null, 1595, y,
        restored ? C.pale : C.paper, C.teal);
    }
  });
  if (b === 1) {
    if (committed) {
      g.line([[104,819],[1800,819]], C.rule, 2);
      g.label('Custom class', 107, 902);
      g.text('Registered node → its children', 395, 902, 37);
      if (cue(1, 'An unsupported object')) g.text('Unsupported object → may be one leaf', 1060, 902, 37);
    }
  } else {
    const choice = cue(2, 'Small activation choices');
    const changed = cue(2, 'Changing those settings');
    if (choice) {
      g.mono('activation', 1100, 363, 47);
      g.cells([changed ? 'tanh' : 'relu'], 1100, 432, {w: 330, h: 115, fill: C.peach, ink: C.amber});
      if (changed) g.text('A new static choice can need a new variant.', 1100, 644, 37, {max: 702});
    }
    g.result('Dynamic leaves', 'array values can change within a contract');
  }
}

export function metadata(g) {
  if (g.b < 3) return checkpoint(g);
  const p = projectionFixture();
  const flip = g.cue(3, 'Transpose the weights');
  const weights = flip ? p.w[0].map((_, i) => p.w.map(row => row[i])) : p.w;
  const reading = flip ? g.cue(3, 'five, eleven') : g.cue(3, 'seven, ten');
  const reference = g.cue(3, 'Keep that pair');
  const compared = g.cue(3, 'Both copies still');
  g.title('What does the same input produce?');
  g.mono('x',130,348,46); g.cells(p.x,130,412);
  g.mono(flip ? 'W.T    (2, 2)' : 'W     (2, 2)',661,348,46,{color:C.violet});
  weights.forEach((row, i) => g.cells(row,670,410+i*108,{fill:C.lilac,ink:C.violet,w:136,h:102}));
  g.arrow(1045,510,1260,510,reading ? C.teal : C.rule);
  g.label(flip ? 'x @ W.T' : 'x @ W',1310,348);
  const output = flip ? p.transposed : p.output;
  const visible = flip ? compared : reference;
  g.cells(visible ? output : output.map(() => '?'), 1310, 410, {w:170,h:112,fill:visible ? C.pale : C.white});
  if (flip) g.result('Before and after the transpose', vec(p.output) + '    →    ' + (compared ? vec(output) : '[?, ?]'));
}
export function arrays(g, bounds=false) {
  const {b,cue}=g,a=[10,20,30], updated=indexedSet(a,1,99);
  if(bounds&&b===3) {
    g.title('Who can still use this buffer?', 'Separate contract    •    explicitly donated input');
    g.label('Donated input',115,311);g.cells(a,115,390,{w:150,h:112});
    g.arrow(663,445,905,445,C.violet);
    g.mono('jit(f, donate_argnums=(0,))',998,456,45,{max:810,color:C.violet});
    if(cue(3,'explicitly donated inputs')) {
      g.line([[117,511],[571,380]],C.amber,8);
      g.label('Caller retires the input binding.',115,618,{color:C.amber});
      g.mono('result = compiled(original)',1001,615,42,{max:800,color:C.teal});
      g.result('After donation','keep and use the returned value',898);
    }
    return;
  }
  g.title(bounds?(b===1?'What stayed under the old name?':'What does index nine reach?'):'Keep both array values',bounds?'Default .at indexing on an ordinary JAX array':'updated = original.at[1].set(99)');
  if(bounds&&b>=2){
    g.label('original',107,323);g.cells(a,510,275,{w:219,h:114});
    g.label('set(99) at index 9',107,542);g.cells(indexedSet(a,9,99),510,485,{w:219,h:114,fill:C.lilac,ink:C.violet});
    g.line([[1215,541],[1610,541]],C.amber,4,true);g.mono('9',1648,541,58,{color:C.amber});g.label('outside',1600,626);
    if(cue(2,'getting index nine')){g.arrow(1580,669,1080,669,C.teal,5);g.result('a.at[9].get() → clip to index 2',String(a.at(-1)));}
  }else{
    g.label('original',111,365);g.cells(a,546,305,{w:270,h:129,size:72});
    const q=bounds?1:cue(1,'Set its middle entry',.7);
    g.fade(q,()=>{
      const y=514+(1-smooth(q))*-90;
      g.label('returned',111,y+65);g.cells(updated,546,y,{w:270,h:129,size:72,fill:[C.pale,C.lilac,C.pale],ink:C.ink});
    });
    if(b===2||bounds)g.result('Discard the return, read original[1]',fmt(a[1]));
    if(!bounds&&b===2&&cue(2,'Compiled execution can reuse buffers')) {
      g.mono('updated[1] → '+updated[1],545,762,47,{color:C.violet});
    }
  }
}
