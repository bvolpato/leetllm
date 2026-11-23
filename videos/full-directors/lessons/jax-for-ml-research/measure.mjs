import { C, clamp, fmt, vec } from './drawing.mjs';
import { weightPenalty, history, regularized, completed, gradients, projectionFixture, rows } from './experiments.mjs';
import { curve } from './state.mjs';

export function regularizer(g) {
  const {b,cue}=g;
  if(b===1||b===4){
    const zero=b===1&&!cue(1,'At weights two and minus one');
    const w=zero?[0,0]:[2,-1], p=weightPenalty(w), x=333, y=574, u=79;
    g.title('Which parameters does the penalty charge?', 'R(w) = λ × (w₀² + w₁²)     •     λ = 0.1     •     bias excluded');
    w.forEach((v,i)=>{
      const xx=x+360*i,side=Math.abs(v);
      g.mono('w'+(i?'₁':'₀')+' = '+fmt(v),xx,336,55,{align:'center'});
      if(!side)g.mono('0',xx,y,69,{align:'center',color:C.teal});
      for(let r=0;r<side;r++)for(let c=0;c<side;c++)g.box(xx+(c-side/2)*u,y+(r-side/2)*u,u-5,u-5,C.teal);
    });
    g.mono('0.1 × '+w.reduce((s,v)=>s+v*v,0)+' = '+fmt(p.value),1055,432,67,{color:C.teal,max:720});
    g.label('∂R/∂w = 2λw',1062,620);g.mono(vec(p.gradient),1055,711,67,{color:C.violet});
    g.mono('∂R/∂b = 0',119,879,52);
    if(b===4)g.mono('[R(w+h e₀) − R(w−h e₀)] / (2h)',915,884,42,{color:C.muted,max:890});
  }else{
    const plain=b===3;
    const n=plain?80:Math.floor(80*cue(2,'Train the changed objective',3.8));
    const series=plain?history.map(r=>r.loss):regularized.map(r=>r.objective);
    g.title(plain?'Read the definition beside the curve':'Train the regularized objective',
      plain?'Plain SGD run    •    MSE only    •    same initial weights':'Changed run    •    MSE + 0.1 × Σw²    •    same initial weights');
    curve(g,series,n,{color:plain?C.teal:C.violet});g.label('Update '+n,1300,362);
    g.text(plain?'MSE':'MSE + penalty',1300,489,53,{face:'Serif',max:500});
    g.mono(fmt(series[n],6),1300,618,77,{color:plain?C.teal:C.violet,max:500});
    if(plain)g.label('Other run: objective 0.399595',1298,774,{max:504});
  }
}
export function stopwatch(g) {
  const { b, clock, cue } = g;
  function after(beat, phrase, transition = 0) {
    if (beat !== b) return Number(b > beat);
    const { start, end } = clock.wordCue(phrase);
    if (clock.reveal(phrase, end - start + transition, { captionStart: phrase }) === 1) return 1;
    return transition ? clamp((clock.elapsed - end) / transition) : 0;
  }

  const issued = cue(1, 'Python issues the call', 1.6);
  const handle = after(2, 'At one millisecond, Python receives a handle');
  const executing = after(2, 'Underneath it, the device keeps running', 1.7);
  const waiting = after(3, 'Wait for all the result leaves');
  const following = after(3, 'Follow the device trace', 1.4);
  const ready = after(4, 'At twelve milliseconds, the last leaf becomes ready');
  const elapsed = b === 1 ? 0.99 * issued
    : b === 2 ? (handle ? 1 + 7 * executing : 0.99)
    : b === 3 ? 8 + 3 * following
    : ready ? 12 : 11;
  const state = completed(elapsed);

  g.box(0, 0, 1920, 1080, C.dark);
  g.text('One call, two stop times', 104, 103, 76, { face: 'Serif', color: C.white });
  g.text('Warm executable · inputs on device · illustrative milliseconds', 106, 196, 39, { color: '#c3d3ce' });

  const x = 445, span = 1035, at = ms => x + ms / 12 * span;
  for (let ms = 0; ms <= 12; ms++) {
    const major = ms % 3 === 0;
    g.line([[at(ms), 301], [at(ms), 696]], major ? '#628078' : '#314c51', major ? 3 : 1);
    g.mono(ms, at(ms), 737, 38, { align: 'center', color: '#c3d3ce' });
  }
  g.label('ms from call start', x, 792, { color: '#c3d3ce' });

  const lanes = [
    { label: 'Python', value: state.host, y: 413, color: '#f0ba85' },
    { label: 'Device', value: state.work, y: 620, color: C.glow },
  ];
  for (const { label, value, y, color } of lanes) {
    g.text(label, 106, y, 61, { face: 'Serif', color: C.white });
    g.line([[x, y], [at(12), y]], '#405d61', 5);
    if (value) g.box(x, y - 13, at(value) - x, 26, color);
    g.dot(at(value), y, 15, color);
  }
  if (state.handle) {
    g.line([[at(1), 394], [at(1), 346], [at(1) + 40, 346]], '#f0ba85', 3);
    g.text('Handle returned', at(1) + 59, 344, 39, { color: '#f0ba85' });
    g.mono('1 ms', 1535, 413, 60, { color: '#f0ba85' });
  }
  if (state.ready) {
    g.line([[at(12), 601], [at(12), 556], [at(12) - 42, 556]], C.glow, 3);
    g.text('Last leaf ready', at(12) - 62, 555, 39, { align: 'right', color: C.glow });
    g.mono('12 ms', 1535, 620, 60, { color: C.glow });
  } else if (state.handle) {
    g.text(waiting ? 'Final leaf pending' : 'Still running', 1519, 620, 43, {
      color: '#c3d3ce', max: 336,
    });
  }

  if (b === 2 && state.handle)
    g.text('Where would you stop the completed-work clock?', 106, 842, 48, { color: C.white });
  if (waiting)
    g.mono('jax.block_until_ready(result)', 106, 842, 47, { color: C.glow });
}
function benchmarkRows(g) {
  const xs=[591,868,1145,1422];
  ['trace / compile','dispatch','execute','wait'].forEach((n,i)=>g.label(n,xs[i]+115,333,{align:'center',max:248}));
  ['Cold call','Warm call','Throughput'].forEach((v,i)=>{
    const y=444+i*157, start=i?1:0;g.text(v,105,y,53,{face:'Serif'});
    for(let k=start;k<4;k++){
      g.box(xs[k],y-40,248,81,i===0?C.lilac:i===1?C.pale:C.peach);
      const s=i===2?['','enqueue N','N calls','wait once'][k]:['build','submit','run','all leaves'][k];
      g.mono(s,xs[k]+124,y,34,{align:'center'});}
    g.bracket(xs[start],xs[3]+248,y+66,i===0?C.violet:i===1?C.teal:C.amber);
  });
}
export function benchmark(g) {
  const {b,cue}=g;
  g.title(b===1?'What did the CPU benchmark run?':b===2?'Declare the timing interval':'Match both measurements');
  if(b===1){
    g.label('Input placed before timing',108,269);
    // The outlines show matrix aspect ratios, with dimensions printed beside each.
    g.box(215,360,60,480,C.pale,C.teal,3);g.mono('512',97,588,43);
    g.mono('64',245,320,41,{align:'center'});
    g.mono('float32',137,902,40,{color:C.teal});
    g.mono('X.T @ (X − mean(X, axis=0))',424,480,48,{max:764});
    g.arrow(467,603,1154,603,C.teal,5);
    if(cue(1,'It computes')){
      g.box(1309,401,291,291,C.lilac,C.violet,3);g.mono('64 × 64',1454,549,52,{align:'center'});
      g.label('finite, cold ≈ warm',1281,754);
    }
  }else if(b===2){benchmarkRows(g);g.label('A persistent cache can reduce the cold compilation cost.',111,955);}
  else{
    g.table(['Boundary','JAX run','Comparison run'],[
      ['Input','512 × 64, float32','same shape and dtype'],['Placement','before timer','same placement boundary'],
      ['Stop event','all result leaves ready','synchronize result'],['Cold / warm','report separately','warm up both paths']
    ],[110,662,1230],{y:294,dy:128,size:39,colors:[C.ink,C.teal,C.violet]});
    g.label('Report loading, transfers, evaluation and checkpoints when they fall inside the interval.',113,925);
  }
}
export function replay(g) {
  const {b,cue}=g,p=projectionFixture();
  if(b<=2){
    const mapped=cue(1,'then map'),compiled=cue(1,'and compile it');
    g.title('Keep the first call that differs','Same four rows    •    w = [0, 0]    •    b = 0');
    g.label('Eager loss',107,303);g.mono('3.75',115,410,79,{color:C.teal});
    if(cue(1,'Check the gradient')){g.label('Gradient leaves',107,568);g.mono('weight  '+vec(history[0].gradient.slice(0,2)),112,672,48);g.mono('bias    −2.5',113,759,48);}
    if(mapped){
      const gs=gradients.map(row=>vec(row));
      g.table(['Example','vmap(grad)','jit(vmap(grad))'],rows.map((r,i)=>[i+1,gs[i],compiled?gs[i]:'?']),[878,1105,1488],{y:337,dy:108,size:33,colors:[C.ink,C.violet,C.teal]});
      g.label('Columns in each row: ∂w₀, ∂w₁, ∂b',876,851,{max:900});
    }
    if(b===2)g.mono('jax.make_jaxpr(f)(params, X, y)',112,943,46,{color:C.teal});
  }else if(b===3||b===4){
    g.title('Can both implementations replay this input?', 'Checkpoint, data order, precision, optimizer and key schedule fixed.');
    g.label('Same input row',112,319);g.cells(p.x,113,397,{w:125,h:110});g.arrow(456,453,669,453);
    g.table(['Weight layout','Output','Weight shape'],[['W',vec(p.output),'(2, 2)'],['W.T',vec(p.transposed),'(2, 2)']],[735,1164,1541],{y:356,dy:140,colors:[C.ink,C.violet,C.teal]});
    g.result(b===3?'Port comparison':'Deployment port','compare named outputs and gradients',909);
  }else{
    g.title('Save the regression case','The next test changes the bias to expose an error in the padded slot.');
    const ys=rows.slice(0,3).map(r=>r.y);
    g.label('Three supplied targets',117,332);g.cells(ys,114,403,{w:205,h:136,size:65});
    g.label('Synthetic target',1050,332);g.cells([0],1047,403,{w:205,h:136,fill:C.white,ink:C.muted,size:65});
    g.result('Same parameter tree for both calls','w = [0, 0]       b = 1',885);
  }
}
