import { C, fmt, vec } from './drawing.mjs';
import { capturesA, capturesB, weakCalls, guardLog, doublingTraces, partials } from './experiments.mjs';

export function compilation(g) {
  const {b,cue}=g;
  g.title('Follow one addition through JIT','Example signature    •    x: float32[4]    •    one stable callable');
  const layers=[
    ['Python','def twice(x): return x + x'],
    ['Jaxpr','b:f32[4] = add a a'],
    ['Lowered IR','stablehlo.add %arg0, %arg0'],
    ['Executable','A   •   selected CPU backend']
  ];
  const active=[1,cue(1,'records compatible numerical primitives'),cue(1,'Lowering converts'),cue(1,'Compilation then builds')];
  layers.forEach(([name,value],i)=>{
    const y=288+i*144,c=i%2?C.teal:C.violet;
    g.label(name,128,y+36);g.line([[442,y+36],[524,y+36]],active[i]?c:C.rule,4);g.dot(442,y+36,9,active[i]?c:C.rule);
    if(active[i]){g.box(545,y-9,1189,94,i===3?C.dark:C.white);g.mono(value,576,y+37,44,{color:i===3?C.glow:c,max:1120});}
    else g.line([[545,y+36],[1660,y+36]],C.rule,2,true);
  });
  if(b===2)g.result('New values, same contract','[2, 3, 5, 8] → A → [4, 6, 10, 16]',924);
  if(b===3)g.result('Python side effects','print / append → trace time',924,C.amber);
}
export function captured(g,practice=false) {
  const {b,cue}=g, runs=practice?capturesB:capturesA;
  const repair=b===3, edit=practice?cue(1,'Change the global to four'):cue(1,'Edit the global to three');
  const second=practice?cue(2,'Three times two'):cue(1,'It still returns four');
  const third=practice?cue(2,'five times four'):cue(2,'That returns six');
  const shape2=practice?(edit?1:0):cue(2,'Two ones introduce shape two');
  const first=practice?cue(1,'Three ones at scale two'):cue(1,'The first trace captures');
  g.title(practice?'Which coefficient will each call use?':'Where does the coefficient live?',
    repair?'explicit(x, scale) = sum(x) × scale':'cached(x) = sum(x) × SCALE    •    float32 ones');
  if(repair){
    // Keep the result of the original cached calculation beside the repair.
    const row=runs[1], next=row.global*row.length;
    const answer=practice?cue(3,'The repaired call returns twelve'):cue(3,'now return twelve');
    g.label('Same input array',112,308);g.cells(Array(row.length).fill(1),112,367,{w:102});
    g.table(['Source of scale','Coefficient','Result'],[
      ['Captured in '+row.variant,fmt(row.captured),fmt(row.result)],
      ['Scalar-array argument',fmt(row.global),answer?fmt(next):'?']
    ],[112,862,1400],{y:608,dy:125,colors:[C.ink,C.violet,C.teal]});
    g.mono('explicit(ones('+row.length+'), array('+fmt(row.global)+'.0, float32))',115,956,41);
    return;
  }
  g.label('Python global now',110,269);
  g.mono('SCALE = '+(edit?runs[1].global:runs[0].global),582,269,54,{color:C.amber});
  const vis=[first,second,third], available=[true,edit,shape2];
  const entries=runs.filter((r,i)=>available[i]).map((r,i)=>{
    const known=vis[i];
    return ['ones('+r.length+')',fmt(r.global),known?r.variant+'  × '+r.captured:'?',known?fmt(r.result):'?'];
  });
  g.table(['Call','Global at call','Inside executable','Output'],entries,[112,590,1020,1583],{y:420,dy:115,colors:[C.teal,C.amber,C.violet,C.ink]});
  if(!practice&&b===2)g.result('Trace-time Python list',third?'[(4,), (2,)]':'[(4,), …]',909);
  if(practice&&b===1&&edit)g.text('Predict both pending returns.',110,898,59,{face:'Serif'});
  if(practice&&b===2&&third)g.result('Two cached multipliers','A × 2       B × 4',908);
}
export function weak(g) {
  const calls = weakCalls();
  const visible = g.cue(1, 'Change the explicit scalar') ? 3 : g.cue(1, 'Now pass one') ? 2 : 1;
  const returned = [visible >= 2, visible === 3, g.cue(2, 'Its weak type is still false')];
  const reused = g.cue(2, 'it reuses trace B') && g.clock.elapsed >= g.clock.speechDuration;
  g.title('Which scalar calls share a trace?', 'plus_one(x) = x + 1    •    scalar inputs    •    controlled CPU run');
  g.label('Input', 120, 300);
  g.label('weak_type', 635, 300);
  g.label('Output', 886, 300);
  g.label('Trace log', 1305, 300);

  const cardRows = new Map();
  calls.slice(0, visible).forEach((call, index) => {
    const y = 420 + index * 205;
    const color = call.weak ? C.violet : C.teal;
    g.box(96, y - 65, 960, 130, C.white);
    g.mono(call.input, 120, y, 49, {max: 480});
    g.mono(String(call.weak), 635, y, 49, {color});
    g.mono(returned[index] ? fmt(call.out) : '?', 944, y, 62, {align: 'center'});

    if (!cardRows.has(call.variant)) {
      cardRows.set(call.variant, y);
      g.arrow(1056, y, 1290, y, color);
      g.box(1300, y - 75, 524, 150, call.weak ? C.lilac : C.pale, color, 3);
      g.text('Trace ' + call.variant, 1330, y - 28, 50, {weight: 600, color});
      g.mono('float32   weak=' + call.weak, 1330, y + 35, 38, {color});
    } else if (reused) {
      g.line([[1056, y], [1410, y]], color, 5);
      g.arrow(1410, y, 1410, cardRows.get(call.variant) + 78, color);
    } else {
      g.line([[1056, y], [1160, y]], C.muted, 3, true);
      g.mono('?', 1180, y, 54, {color: C.muted});
    }
  });
}
export function branch(g) {
  const {b,cue}=g;
  g.title(b===1?'Can Python choose this branch?':b===2?'Let a scalar predicate choose a function':'Which choice belongs in the signature?');
  if(b===1){
    g.mono('if x > 0:',120,340,85,{color:C.violet});
    g.mono('    return x',120,461,66);g.mono('return -x',120,562,66);
    g.label('At trace time',1050,331);g.mono('x: float32[]',1050,439,58,{color:C.teal});g.label('The runtime sign is unknown.',1050,550);
    if(cue(1,'jit raises'))g.result('Python needs a Boolean','TracerBoolConversionError',910,C.amber);
  }else if(b===2){
    g.mono('lax.cond(x > 0, keep, negate, x)',113,260,51);
    const show=cue(2,'returns two for minus two');
    for(const [i,x] of [-2,3].entries()){
      const y=438+234*i,color=i?C.teal:C.violet;
      g.mono('x = '+fmt(x),119,y,57);g.arrow(414,y,625,y,color);
      g.mono(x>0?'True':'False',669,y,62,{color});g.arrow(922,y,1089,y,color);
      g.mono(x>0?'keep(x)':'negate(x)',1121,y,53,{color});
      g.mono(show?fmt(Math.abs(x)):'?',1625,y,89,{color});
    }
    g.label('Both branch functions are traced.',117,924);
  }else{
    g.label('Per-example array data',107,318);g.cells([1,0,1,0],108,392,{w:140,h:111});
    g.mono('where(mask, a, b)',108,603,48,{color:C.teal});
    g.line([[922,264],[922,766]],C.rule);
    g.label('Small static configuration',1041,318);g.cells(['relu','tanh'],1041,392,{w:259,h:111,fill:C.peach,ink:C.amber});
    g.mono('static_argnames=("mode",)',1041,603,43,{max:770,color:C.amber});
    g.result('Host I/O','return the metric → log on host',916);
  }
}
export function logarithm(g) {
  const {b,cue}=g, fixed=cue(2,'Feed it one'),shift=cue(3,'Now suppose the intended argument'),offset=shift?1:0;
  const xs=[offset,offset+2];
  g.title('What reaches the logarithm?',shift?'Intended function: log(x − 1) for x > 1, zero elsewhere.':'Intended function: log(x) for x > 0, zero elsewhere.');
  const arg=offset?'x − 1':'x';
  g.mono('arg = '+(fixed?'where(x > '+offset+', '+arg+', 1)':arg),110,286,56,{color:fixed?C.teal:C.amber});
  g.mono('out = where(x > '+offset+', log(arg), 0)',110,376,52);
  const showGrad=cue(1,'Differentiate that same call');
  g.table(['x','Active?','Log input','log(arg)','Output','Gradient'],xs.map(x=>{
    const s=guardLog(x,!!fixed,offset);
    const log=s.logarithm===-Infinity?'−∞':fmt(s.logarithm,4),grad=Number.isNaN(s.grad)?'NaN':fmt(s.grad);
    return [x,s.active?'yes':'no',s.argument,log,fmt(s.out,4),showGrad?grad:'?'];
  }),[116,312,642,986,1283,1549],{y:535,dy:124,colors:[C.ink,C.muted,fixed?C.teal:C.amber,C.ink,C.teal,C.violet],hot:0});
  if(fixed)g.label('The inactive argument is finite. The active row keeps its original logarithm.',119,903);
}
export function loops(g) {
  const {cue}=g;
  const start=cue(2,'Change the starting value')?3:1, trace=doublingTraces(start);
  let shown;
  if(start===1)shown=cue(1,'then eight')?3:cue(1,'then four')?2:cue(1,'pass through two')?1:0;
  else shown=cue(3,'and reaches twenty-four')?3:cue(3,'to twelve')?2:cue(3,'reaches six')?1:0;
  g.title('When does each loop stop?', 'Fixed carry shape and dtype    •    each iteration doubles the carried scalar');
  const xs=[540,882,1224,1566];
  ['Start','Double 1','Double 2','Double 3'].forEach((v,i)=>g.label(v,xs[i],309,{align:'center'}));
  [trace.dynamic,trace.fixed].forEach((vals,i)=>{
    const y=473+i*234,color=i?C.violet:C.teal;
    g.text(i?'scan':'while',115,y-21,63,{face:'Serif',color});
    g.label(i?'3 iterations':'value < 8',114,y+49);
    for(let j=0;j<=Math.min(shown,vals.length-1);j++){
      if(j)g.arrow(xs[j-1]+75,y,xs[j]-78,y,color,5);
      g.dot(xs[j],y,67,i?C.lilac:C.pale);
      g.mono(vals[j],xs[j],y,53,{align:'center',color});
    }
    if(start===3&&!i&&shown>=2){g.line([[xs[2]+98,y-49],[xs[2]+98,y+48]],C.amber,7);g.label('stop',xs[2]+130,y,{color:C.amber});}
  });
  if(start===3)g.label('Starting from 1, both loops reached 8.',112,825);
  if(cue(2,'Its derivative is'))g.result('Three fixed doublings','2 × 2 × 2 = '+trace.derivative,956);
}
export function shards(g) {
  const {b,cue}=g;
  g.title(b===1?'A mapped axis is a logical axis':'Partition a contracting axis',
    b===1?'vmap(loss_one, in_axes=(None, 0, 0))    •    shared parameters':'Supplied two-shard arithmetic    •    global shape (4,)    •    local shape (2,)');
  if(b===1){
    for(let i=0;i<4;i++){
      const y=303+i*141;g.label('lane '+i,120,y+42);g.cells(['x['+i+']','y['+i+']'],440,y,{w:180});
      g.arrow(885,y+44,1120,y+44,C.teal);g.mono('loss_one(p, x['+i+'], y['+i+'])',1160,y+44,42,{max:660});
    }
    g.label('Placement is a separate mesh and partition specification.',119,958);
  }else{
    for(let k=0;k<2;k++){
      const x=130+k*870,color=k?C.violet:C.teal;
      g.label('Shard '+k,x,284,{color}); g.line([[x,323],[x+711,323]],color,5);
      for(let j=0;j<2;j++){
        const i=2*k+j, xx=x+130+j*299;g.mono((i+1)+' × '+(i+5),xx,442,61,{align:'center'});
        g.line([[xx,500],[xx,554],[x+340,615]],color,4);
      }
      if(k?cue(2,'second fifty-three'):cue(2,'first partition contributes seventeen'))
        g.mono(fmt(partials[k]),x+340,674,86,{color,align:'center'});
    }
    if(cue(2,'Their sum seventy'))g.result('Combine partial sums',partials.join(' + ')+' = '+partials.reduce((a,b)=>a+b),892);
    if(b===3)g.mono('shard_map    •    local dot → psum over the contracting partitions',116,990,33);
    if(b===4)g.label('Two partitions in this diagram. One CPU in the numerical fixtures.',116,992);
  }
}
