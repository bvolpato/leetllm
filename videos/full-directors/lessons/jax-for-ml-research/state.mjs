import { C, fmt, vec, smooth } from './drawing.mjs';
import { JAX_KEY_FIXTURE as K, first, second, stepKeys, keyWords, shortMasks, agree, firstMask,
  history, rows, firstBatch, six, emptyStep, learningRate, momentumFactor } from './experiments.mjs';

function bits(g,words,x,y,color) {
  words.forEach((word,r)=>{
    const bits=word.toString(2).padStart(32,'0');
    for(let i=0;i<32;i++)g.box(x+i*12+5*Math.floor(i/8),y+r*24,10,18,bits[i]==='1'?color:C.rule);
  });
}
export function draws(g) {
  const {cue,b}=g;
  const known=cue(2,'Both calls received'), replace=cue(3,'Give the second call child one');
  const compared=cue(4,'False again'), big=cue(4,'A bigger draw');
  const firstDraw=cue(1,'Both say false');
  let title=firstDraw?'Two matching dropout decisions':'Two one-bit dropout draws';
  if(replace) title=compared?'Both draws returned False':'Draw again with child 1';
  if(big) title='The top row of two 8 × 8 masks';
  g.title(title,big?'Same two child keys, now with draw shape (8, 8)':'random.bernoulli(key, p=0.5, shape=(1,))');
  const keys=[K.next,replace?K.A:K.next];
  for(let i=0;i<2;i++){
    const y=344+288*i, color=i?C.violet:C.teal;
    g.text('Call '+(i+1),105,y,62,{face:'Serif',color});
    if(known){
      g.mono('child '+(i&&replace?1:0),110,y+83,41);
      bits(g,keys[i],505,y-9,color);g.mono(keyWords(keys[i]),505,y+84,33,{color});
    }else{g.mono('key ?',505,y+20,54,{color:C.muted});}
    if(big){
      const focus=cue(4,'In the top left')?0:cue(4,'compare the fifth position')?4:-1;
      shortMasks[i].split('').forEach((v,k)=>{
        const x=1115+83*k;
        g.box(x,y-12,78,78,v==='1'?color:C.white,k===focus?C.amber:C.rule,k===focus?7:2);
        g.mono(v,x+39,y+28,35,{align:'center',color:v==='1'?C.white:C.muted});
      });
    }else {
      const knownBit=firstDraw&&(!i||!replace||compared);
      g.text(knownBit?'False':'?',1330,y+36,116,{face:'Serif',color});
    }
  }
  if(b===3&&replace)g.result('Second draw with the new child','Must its bit change?',929,C.violet);
  if(big)g.label('1 keeps an activation.  0 drops it.',1113,899);
}
export function derivation(g) {
  const {b,cue}=g;
  if(b<=3){
    g.title(b===1?'What is inside the key?':'The seed stays seven',b===1?'Typed Threefry key   •   scalar shape ()':'Threefry2x32   •   CPU fixture');
    if(b===1){
      g.mono('key<fry>',122,388,100,{color:C.teal});
      g.arrow(644,388,832,388);bits(g,K.root,930,344,C.teal);g.mono(keyWords(K.root),930,458,52);
      g.label('implementation tag',129,540);g.label('two uint32 words',933,551);
      g.result('Checkpoint conversion','implementation + key_data(key)',898);
    }else if(b===2&&!cue(2,'A separate comparison')){
      g.table(['Owner','Two key words','normal(key, (4,))'],[
        ['next',keyWords(K.next),'retained'],['A',keyWords(K.A),vec(K.sampleA,3)],
        ['A replay',keyWords(K.A),vec(K.sampleA,3)],['B',keyWords(K.B),vec(K.sampleB,3)]
      ],[111,505,1148],{y:336,dy:113,size:35,colors:[C.ink,C.teal,C.violet]});
      g.label('next, A, B = random.split(root, 3)',112,904);
    }else{
      g.label('Three children, one scalar draw from each',118,335);g.cells(K.scalarSequence.map(n=>fmt(n,4)),117,403,{w:325,h:127});
      g.label('One parent, one length-three vector draw',118,633);g.cells(K.vectorSequence.map(n=>fmt(n,4)),117,696,{w:325,h:127,fill:C.lilac,ink:C.violet});
      g.label('seed 7',1385,415);g.label('seed 7',1385,709);
    }
  }else{
    const p=b===5&&cue(5,'Take p equal to one quarter')?.25:.5, d=1-p, side=498, x=199,y=321;
    g.title('How often do independent bits agree?', 'Each axis partitions one draw into drop and keep.');
    g.label('Call 2',x,y-62);g.label('drop',x+side*d/2,y-38,{align:'center'});g.label('keep',x+side*d+side*p/2,y-38,{align:'center'});
    let top=0;
    [d,p].forEach((h,r)=>{let left=0;
      [d,p].forEach((w,c)=>{g.box(x+side*left,y+side*top,side*w,side*h,c===r?(r?C.violet:C.teal):C.white,C.paper,6);
        g.mono(fmt(w*h,4),x+side*(left+w/2),y+side*(top+h/2),39,{align:'center',color:c===r?C.white:C.muted,max:side*w-10});left+=w;});
      g.label(r?'keep':'drop',x-25,y+side*(top+h/2),{align:'right'});top+=h;
    });
    g.label('Call 1',105,874);
    g.mono('p = '+fmt(p),925,355,71,{color:C.violet});
    g.text('Both drop',925,507,56,{face:'Serif',color:C.teal});g.mono('(1 − p)²',1370,507,48);
    g.text('Both keep',925,619,56,{face:'Serif',color:C.violet});g.mono('p²',1370,619,48);
    const showMatch=b===4?cue(4,'Together they give'):p===.5||cue(5,"That's ten sixteenths");
    if(showMatch)g.mono('P(match) = '+fmt(agree(p)),924,801,60);
  }
}
export function owners(g) {
  const {b,cue}=g;
  g.title(b===1?'Who splits the step key?':b===2?'Two processes each have a device zero':'Which key supplies each lane?');
  if(b===1){
    const duplicated=cue(1,'Passing the same parent')&&!cue(1,'Retain a continuation child');
    const nodes=duplicated?[['dropout','split(K₀)[1]'],['augment','split(K₀)[1]']]:
      [['next step','K₁'],['dropout','D₀'],['augment','A₀']];
    g.mono('K₀',159,521,111,{color:C.amber});
    g.line([[339,525],[643,525]],C.amber,7);
    nodes.forEach(([name,key],i)=>{
      const y=nodes.length===2?404+252*i:328+191*i, color=duplicated?C.amber:[C.amber,C.teal,C.violet][i];
      g.line([[643,525],[643,y],[905,y]],color,5);g.dot(643,y,11,color);
      g.mono(key,950,y,54,{color});g.text(name,1440,y,49,{face:'Serif'});
    });
    g.result(duplicated?'Both helpers split K₀':'One split at the owner',duplicated?'same child twice':'next, drop, aug = split(K₀, 3)',909);
  }else if(b===2){
    g.table(['Process','Local index','Global replica','Key derivation'],[
      [0,0,0,'fold_in(step_key, 0)'],[1,0,1,'fold_in(step_key, 1)']
    ],[111,430,811,1195],{y:368,dy:193,size:47,colors:[C.ink,C.amber,C.teal,C.teal]});
    g.result('Step identity','step_key = fold_in(root, step)',910);
  }else{
    g.label('Keys passed to vmap',105,302);g.cells(['K₀','K₁','K₂','K₃'],101,385,{w:172});
    g.arrow(927,430,1148,430,C.amber);
    g.mono('RBG batch',1220,410,63);g.label('can use K₀ for every draw',1218,528);
    g.result('Pinned examples','explicit Threefry keys',895);
  }
}
export function curve(g,series,n,{x=160,y=354,w=1040,h=419,max=4,color=C.teal}={}) {
  g.line([[x,y],[x,y+h],[x+w,y+h]],C.muted,3);
  for(const v of [0,2,4]){const yy=y+h*(1-v/max);g.label(v,x-25,yy,{align:'right'});if(v)g.line([[x,yy],[x+w,yy]],C.rule,1,true);}
  for(const k of [0,20,40,60,80])g.label(k,x+k*w/80,y+h+36,{align:'center'});
  g.label('updates',x+w-100,y+h+93);
  const pts=series.slice(0,n+1).map((v,i)=>[x+i*w/80,y+h*(1-v/max)]);
  g.line(pts,color,7);g.dot(...pts.at(-1),12,color);
}
export function training(g) {
  if(g.b===1){
    g.title('Which values carry over to the next call?');
    g.label('State on entry', 105, 266);
    g.text('batch (read-only)', 920, 226, 46, {align: 'center'});
    g.arrow(920, 264, 920, 308, C.muted);
    g.text('Next call', 1328, 266, 48, {face: 'Serif'});
    g.box(1298, 317, 526, 402, C.white, C.rule, 3);

    const handoff = smooth(g.cue(1, 'the caller keeps', .75));
    const returnedX = 708 + (1328 - 708) * handoff;
    const lanes = [
      ['params', 'new_params', C.teal, C.pale],
      ['optimizer_state', 'new_state', C.violet, C.lilac],
      ['key', 'next_key', C.amber, C.peach],
    ];
    lanes.forEach(([input, output, color, fill], i) => {
      const y = 390 + i * 128;
      g.mono(input, 105, y, 48, {color});
      g.arrow(553, y, 669, y, color);
      g.line([[1328, y], [1780, y]], C.rule, 3, true);
      g.box(returnedX, y - 48, 452, 96, fill);
      g.mono(output, returnedX + 226, y, 50, {align: 'center', color});
    });
    // The returned values emerge from the step together.
    g.box(680, 317, 480, 402, C.dark);
    g.mono('train_step', 920, 518, 62, {align: 'center', color: C.white});
    g.line([[920, 719], [920, 810], [982, 810]], C.muted, 4);
    g.text('Pre-update loss', 1008, 794, 45);
    g.mono('loss(params, batch, step_key)', 1008, 856, 44, {color: C.muted});
  }else{
    const n=Math.floor(80*g.cue(2,'actual gradient-descent recurrence',5)),s=history[n];
    g.title('Follow the returned parameters','Plain SGD   •   same four examples   •   learning rate 0.05');
    curve(g,history.map(r=>r.loss),n);
    g.label('Update '+n,1285,330);g.mono('w = '+vec(s.p.slice(0,2)),1285,440,47,{max:525,color:C.teal});
    g.mono('b = '+fmt(s.p[2]),1285,530,47);
    g.label('Loss at this state',1285,678);g.mono(fmt(s.loss,6),1285,769,72,{color:C.teal});
  }
}
export function momentum(g) {
  const {cue,b}=g;
  if(b<=2){
    g.title('Which features enter the loss?', 'Input dropout    •    keep probability 0.75    •    seed 7');
    const seen=cue(1,'The executed first mask');
    g.table(['Input features','Keep bits','Features × mask / 0.75'],rows.map((r,i)=>[vec(r.x),seen?vec(firstMask[i]):'?',seen?vec(first.features[i]):'?']),[113,670,1170],{y:320,dy:101,colors:[C.ink,C.violet,C.teal],hot:b===2?0:-1});
    if(cue(2,'pre-update loss is still'))g.result('Zero weights and bias','15 / 4 = '+fmt(first.preLoss));
  }else if(b<=4){
    g.title('The first momentum update','v₁ = 0.9 × v₀ + g₀       p₁ = p₀ − 0.05 × v₁');
    const vel=cue(3,'new velocity'),par=cue(3,'returning weight');
    g.table(['Quantity','weight[0]','weight[1]','bias'],[
      ['Old velocity',0,0,0],['Masked gradient',...first.gradient.map(x=>fmt(x))],
      ['New velocity',...first.nextVelocity.map(v=>vel?fmt(v):'?')],
      ['New parameters',...first.nextParams.map(v=>par?fmt(v):'?')]
    ],[109,762,1201,1599],{y:299,dy:105,colors:[C.ink,C.violet,C.violet,C.violet]});
    if(b===4)g.result('First weight after one step','SGD  0.225      dropout  0.1');
  }else{
    const travel=smooth(cue(5,'carry all three across',1.35)), end=cue(5,'The next call returns');
    g.title('What crosses into step two?', 'Caller keeps three returned values. The first loss stays with step one.');
    const seam=921;
    g.line([[seam,246],[seam,758]],C.muted,3,true);
    g.label('Step one returns',106,260);g.label('Step two receives',1030,260);
    const names=['parameters  (w₀, w₁, b)','velocity  (w₀, w₁, b)','continuation key  K₁'];
    const values=[vec(first.nextParams),vec(first.nextVelocity),keyWords(stepKeys[1])];
    values.forEach((v,i)=>{
      const y=330+140*i,color=[C.teal,C.violet,C.amber][i];
      const x=105+944*travel;
      g.fade(Math.max(0,(travel-.81)/.19),()=>{
        g.label(names[i],115,y+6);g.mono(v,115,y+65,42,{color,max:745});
      });
      g.box(x,y-16,723,113,[C.pale,C.lilac,C.peach][i]);g.label(names[i],x+24,y+11,{color});
      g.mono(v,x+24,y+66,40,{color,max:675});
    });
    if(end){
      g.mono('K₂  '+keyWords(stepKeys[2]),1024,810,39,{color:C.amber});
      g.mono('p₂  '+vec(second.nextParams,4),1024,887,39,{color:C.teal});
      g.mono('v₂  '+vec(second.nextVelocity,4),1024,952,39,{color:C.violet});
    }
    g.label('Replay from zero parameters, zero velocity, seed 7',113,781,{max:823});
    g.label('Loss on entry to step one',113,846);g.mono(fmt(first.preLoss),112,926,66,{color:C.teal});
    if(b===6)g.label('Step two entry loss ≈ '+fmt(second.preLoss,4),1030,735);
  }
}
export function shape(g) {
  const {b,cue}=g;
  const data=b===1?six:firstBatch;
  const n=data.loss.count, pad=cue(3,'Pad back to four rows'), slots=pad?data.batch.length:n;
  g.title('Will this batch fit the executable?', 'One stable jitted callable    •    float32 features    •    Boolean validity mask');
  g.label('Feature rows',110,265);g.label('Target',485,265);g.label('Valid',735,265);g.label('Call signature',1050,265);
  for(let i=0;i<slots;i++){
    const row=data.batch[i], y=321+i*112;
    g.cells(row.x,123,y,{w:132,h:93,fill:row.valid?C.pale:C.white});
    g.mono(fmt(row.y),495,y+46,45,{color:row.valid?C.ink:C.muted});
    g.mono(row.valid?'True':'False',739,y+46,45,{color:row.valid?C.teal:C.muted});
  }
  g.mono('X      ('+slots+', 2)',1050,402,56,{color:C.teal});
  g.mono('valid  ('+slots+',)',1050,541,56);
  g.label(slots===2?'Look up a compatible two-row variant.':'Compatible with the four-row variant.',1053,679,{max:736});
  g.line([[96,811],[1824,811]],C.rule,2);
  g.label('Opening reference',110,860);
  g.mono('w = [0, 0]    b = '+fmt(data.bias),110,935,48);
  g.label('MSE over '+n+' valid rows',1050,860);
  g.mono(data.loss.sum+' / '+n+' = '+fmt(data.loss.masked),1050,935,56,{color:C.teal});
}
export function masking(g) {
  const {b,cue}=g;
  const empty=cue(3,'Turn off every validity bit'), masked=cue(2,'Mask the padding');
  const active=six.batch.map(row=>!empty&&row.valid);
  const naive=cue(1,'A mean over the six slots')&&!masked;
  const count=active.filter(Boolean).length, denom=empty?1:naive?6:count;
  const sum=six.batch.reduce((a,r,i)=>a+(naive||active[i]?r.squared:0),0);
  const grad=empty?[0,0,0]:naive?six.naiveGradient:six.validGradient;
  g.title(empty?'Can a zero gradient move a weight?':'Six slots, four examples',empty?'Errors at w = [0, 0], b = 0    •    finite inputs    •    divisor = max(valid count, 1)':'Compare the loss and gradient at the same zero parameters.');
  g.label('Squared error',109,328);g.label('Valid',109,474);
  six.batch.forEach((r,i)=>{const x=506+i*196;
    g.cells([r.squared],x,277,{w:152,h:94,fill:r.valid?C.pale:C.white});
    g.mono(active[i]?'1':'0',x+76,474,57,{align:'center',color:active[i]?C.teal:C.muted});
  });
  if(!empty)g.bracket(506,506+196*(naive?5:3)+152,568);
  g.mono('MSE = '+sum+' / '+denom+' = '+fmt(sum/denom),110,659,55,{color:C.teal});
  g.mono('g = '+vec(grad),1044,659,51,{color:C.violet});
  if(empty){
    const solved=cue(5,'moves the weight to point one nine');
    const oldVelocity=fmt(first.nextVelocity[0]);
    const velocity=solved?fmt(emptyStep.velocity):fmt(momentumFactor)+' × ('+oldVelocity+') + 0';
    const factor=solved?'('+fmt(emptyStep.velocity)+')':'v_new';
    const weight=fmt(emptyStep.oldWeight)+' − '+fmt(learningRate)+' × '+factor+' = '+(solved?fmt(emptyStep.weight):'?');
    g.table(['Empty-batch policy','Velocity (v_new)','First weight'],[
      ['Skip',fmt(first.nextVelocity[0]),fmt(emptyStep.oldWeight)],
      ['Apply optimizer',velocity,weight]
    ],[112,628,1110],{y:813,dy:79,size:39,colors:[C.ink,C.violet,C.teal]});
  }else if(masked) {
    g.table(['Reference','MSE','Gradient (w₀, w₁, b)'],[
      ['All six, unmasked',fmt(six.loss.naive),vec(six.naiveGradient)],
      ['Four real rows alone',fmt(history[0].loss),vec(history[0].gradient)]
    ],[112,730,1140],{y:813,dy:79,size:39,colors:[C.ink,C.teal,C.violet]});
  }
}
