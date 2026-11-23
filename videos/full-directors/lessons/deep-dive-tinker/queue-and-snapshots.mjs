import { C, arrow, box, cues, dot, ease, fade, footer, gauge, header, lerp, line, num, plate, poly, text, ticket, token } from './paint.mjs';
import {
  alternateDraw, alternateSamples, artifacts, candidates, clampInner, commonDraw, datums, freshSample,
  groups, minProbabilities, oldSample, paired, practice, queue, requests, samplesAB, test,
} from './model.mjs';

function schedule(g,k) {
  const r=cues(k), b=k.beat.beatIndex;
  header(g,'Worker clock','Who is ready when admission opens?', 'One training client     •     same ordered pair     •     illustrative worker schedule');
  const start=282,unit=302,ys=[302,462];
  ['N','N + 1','N + 2'].forEach((cycle,i)=>{
    const x=start+i*unit;
    text(g,'Cycle '+cycle,x+unit/2,229,25,C.soft,'Mono','center');
    line(g,x,257,x,545,C.edge,2,[5,5]);
  });
  for(const [row,entries] of [queue,paired].entries()){
    const y=ys[row];
    if(row===1 && b===0)continue;
    text(g,row?'Submit pair':'Wait for reply',52,y+36,27,C.ink,'Serif');
    for(const [i,entry] of entries.entries()){
      const visible=row?(i===0?r(1,'Submit forward'):r(1,'Both requests')):(i===0?1:r(0,'The pair spans'));
      if(!visible)continue;
      const px=start+entry.cycle*unit+8+(row?i*143:0),w=row?141:unit-23;
      ticket(g,px,y,w,73,i?'#f0c88f':'#b4d9c4');
      text(g,i?'Optimizer':'Fwd / back',px+w/2,y+38,row?20:25,C.ink,'Sans','center',600);
    }
    if(row===0 && r(0,'The reply comes')){
      text(g,'reply arrives late',start+1.5*unit,y+37,23,C.red,'Sans','center');
      line(g,start+unit+22,y+69,start+2*unit-22,y+69,C.red,2,[5,4]);
    }
  }
  footer(g,b?'Enqueue in client order, then await both results. Admission can group the pair.':'Waiting to submit the second call can lose an admission slot.');
}

function chunking(g,k) {
  const r=cues(k),reveal=r(3,'Their IDs',1.15), ids=r(3,'Three is the next'), free=r(3,'The SDK keeps');
  header(g,'Client sequence','How many IDs does this batch consume?', 'Five small datums     •     count limit 2     •     byte budget fits all five     •     first request ID 0');
  const x=117, gap=172, shift=ease(reveal);
  const positions=datums.map((_,i)=>x+i*gap+Math.floor(i/2)*40*shift);
  for(const req of requests){
    const j=datums.indexOf(req.members[0]),px=positions[j]-22;
    const w=(req.members.length-1)*gap+169;
    fade(g,reveal,()=>{
      box(g,px,280,w,179,'#e1e6d9',12,'#91a696',2);
      text(g,ids?'Request '+req.id:'Chunk',px+14,427,22,C.teal,'Mono');
    });
  }
  datums.forEach((d,i)=>{
    ticket(g,positions[i],311,123,72,C.cream);
    text(g,d,positions[i]+62,347,35,C.ink,'Mono','center',600);
  });
  text(g,'Client order',77,520,23,C.soft);arrow(g,246,520,1147,C.edge);
  footer(g,free?'Chunk sizes 2, 2, 1. IDs 0, 1, 2 are used. The next free ID is '+requests.length+'.':
    'Keep datums in their original order. One ID belongs to one emitted request.');
}

function lagGate(g,k) {
  const r=cues(k), reveal=r(5,'Subtract the sampled'), gaps=r(5,'Withhold the group'), all=r(5,'An optimizer receipt');
  header(g,'Policy lag','Which groups fit the version budget?', 'Trainer step 12     •     admit a trajectory when 0 ≤ trainer step − sampled step ≤ 1');
  const start=396,dx=211;
  const x=v=>start+(v-9)*dx;
  box(g,x(11)-22,246,dx+44,288,'#dcead9',12);
  [9,10,11,12].forEach(n=>{
    text(g,n,x(n),224,27,C.ink,'Mono','center');
    line(g,x(n),257,x(n),526,C.edge,1,[5,5]);
  });
  groups.forEach((a,i)=>{
    const y=304+i*95;
    text(g,'Group '+(i+1),67,y,23,C.soft);
    line(g,x(9)-35,y,x(12)+33,y,C.edge,2);
    dot(g,x(a.sampleStep),y,11,C.dark);
    const show=a.admit?reveal:all;
    if(show){
      if(a.gap>0)line(g,x(a.sampleStep)+12,y,x(a.trainerStep),y,a.admit?C.teal:C.red,4);
      text(g,a.admit?'keep':'withhold',1213,y,24,a.admit?C.teal:C.red,'Sans','right',600);
      if(gaps)text(g,'gap '+a.gap,205,y,21,C.ink,'Mono');
    }
  });
  footer(g,all?'Groups 2 and 3 meet the inclusive lag limit. Group 1 retains its step-9 origin.':
    'Each dot marks the policy that sampled that group.');
}

function recovery(g,k) {
  const r=cues(k), sample=r(7,'Check the charge'), charge=r(7,'A training sequence');
  header(g,'Recovery','Which record can settle the timeout?', 'The application deadline expired. The sample request is still outstanding.');
  const lanes=[
    ['Sampling request','sample/47','Outstanding at SDK','Reconcile this request',sample],
    ['Environment charge','charge/C8','Local start only','Check destination status',charge],
  ];
  lanes.forEach(([title,id,status,action,show],i)=>{
    const y=231+i*156; text(g,title,62,y,27,C.ink,'Serif');
    ticket(g,64,y+31,266,63,C.cream);text(g,id,83,y+64,24,C.ink,'Mono');
    arrow(g,352,y+64,456,C.edge);
    text(g,status,476,y+64,25,C.soft);
    if(show){arrow(g,723,y+64,813,C.teal);text(g,action,838,y+64,25,C.teal,'Sans','left',600);}
  });
  footer(g,charge?'Use the charge’s destination-supported key. Its outcome remains unknown until reconciled.':
    'The SDK request and the external effect each have an owner.');
}
export function pipeline(g,k) {
  const b=k.beat.beatIndex;
  if(b<2)return schedule(g,k);
  if(b<4)return chunking(g,k);
  if(b<6)return lagGate(g,k);
  return recovery(g,k);
}

function artifactShelf(g,k) {
  const r=cues(k);
  header(g,'Checkpoint shelf','Who will open the saved artifact?', 'Three consumers need different contents.');
  const triggers=[r(0,'A training checkpoint'),r(0,'Sampler weights'),r(0,'A merged')];
  artifacts.forEach((a,i)=>{
    const x=58+i*402,y=276, tint=['#b4d9c4','#eeb979','#d2d6cc'][i];
    // The indexed tab carries the path, and the inset is the stored payload.
    poly(g,[[x,y+5],[x,y-30],[x+147,y-30],[x+171,y+5]],tint);
    box(g,x,y,358,178,tint,8);
    text(g,a.file,x+20,y+47,27,C.ink,'Mono','left',600);
    if(triggers[i]){
      box(g,x+15,y+84,328,62,C.cream,5);
      text(g,a.content,x+30,y+115,23,C.ink);
      text(g,a.consumer,x,y+226,25,C.teal,'Sans','left',600);
    }
  });
  footer(g,'save_state preserves a recovery point. Select the matching load path for its next job.');
}

function rehearsal(g,k) {
  const solving = k.beat.beatIndex === 2;
  const said = (phrase) => solving && k.elapsed + 1e-9 >= k.wordCue(phrase).end;
  const scan = solving ? k.reveal('Six to nine is a gap of three', 0.9) : 0;
  const fresh = solving ? k.reveal('A newly sampled B from nine', 0.65) : 0;
  const [a, b] = samplesAB;
  header(g,'Practice run','Can sample A enter this update?',
    'A comes from step 6     •     trainer at 9     •     maximum lag 1     •     3 prompt + 3 answer tokens');
  const x=215,dx=163;
  text(g,'Sequence A',56,255,22,C.soft);
  practice.full.forEach((v,i)=>token(g,x+dx*i,214,134,80,v,i>=practice.promptLength,i<3?'prompt':'answer'));
  text(g,'Mean weight',56,342,21,C.soft);
  practice.mean.forEach((v,i)=>{
    const show = i < practice.promptLength - 1 ? said('The prompt targets get zero')
      : i === practice.promptLength - 1 ? said('Forty gets one third')
        : said('The other two answer targets get one third each');
    text(g,show?(v?'⅓':'0'):'·',x+dx*(i+1)+67,344,32,show?C.teal:C.ghost,'Serif','center',600);
  });

  const station = (step) => 300 + 230 * (step - a.sampleStep);
  const start = station(a.sampleStep), current = station(a.trainerStep);
  const eligible = station(a.trainerStep - a.maxLag);
  box(g, eligible, 398, current - eligible, 165, '#dceade', 5);
  text(g, 'Admit lag ≤ ' + a.maxLag, (eligible + current) / 2, 418, 22, C.teal, 'Mono', 'center');
  line(g, start, 473, current, 473, C.edge, 3);
  for (let step=a.sampleStep;step<=a.trainerStep;step++) {
    const at=station(step);
    line(g, at, 466, at, 480, C.edge, 2);
    text(g, 'step ' + step, at, 500, 21, C.soft, 'Mono', 'center');
  }
  text(g, 'Trainer', current, 449, 22, C.teal, 'Mono', 'center');
  text(g, 'Sample A', 57, 473, 26, C.ink);
  if (scan) line(g, start, 473, lerp(start, current, scan), 473, C.red, 4);
  dot(g, start, 473, 10, C.dark);
  if (said('Six to nine is a gap of three'))
    text(g, 'gap ' + a.gap, eligible - 128, 449, 24, C.red, 'Mono', 'center');
  if (said('Withhold A') && !a.admit)
    text(g, 'Withhold', 1080, 473, 25, C.red, 'Sans', 'left', 600);
  if (fresh) {
    text(g, 'Sample B', 57, 542, 26, C.ink);
    dot(g, current, lerp(473, 542, ease(fresh)), 10, C.teal);
    if (said('has zero lag') && b.admit) {
      text(g, 'gap ' + b.gap, current - 27, 542, 24, C.teal, 'Mono', 'right');
      text(g, 'Admit', 1080, 542, 25, C.teal, 'Sans', 'left', 600);
    }
  }
}
function drawInterval(g, x, width, probability, draw, drawLabel, sharedRegion) {
  const y = 259, height = 28;
  const cutoff = x + width * probability;
  const percent = probability * 100;
  const minLabel = 'min · ' + (Number.isInteger(percent) ? '' : '≈') + Math.round(percent) + '%';
  box(g, x, y, width, height, C.pale);
  box(g, x, y, width * probability, height, '#abd5ba');
  text(g, minLabel, (x + cutoff) / 2, 235, 24, C.teal, 'Mono', 'center');
  text(g, 'x', (cutoff + x + width) / 2, 235, 24, C.ink, 'Mono', 'center');
  text(g, '0', x, 303, 19, C.soft, 'Mono');
  text(g, '1', x + width, 303, 19, C.soft, 'Mono', 'right');
  if (sharedRegion) {
    const start = Math.max(...minProbabilities) * width;
    box(g, x + start, y, width - start, height, null, 0, C.warm, 3);
  }
  if (draw !== null) {
    const marker = x + width * draw;
    poly(g, [[marker,y+4],[marker-7,y-8],[marker+7,y-8]], C.ink);
    line(g, marker, y+3, marker, y+height, C.ink, 3);
    text(g, drawLabel, x + width, 204, 22, C.ink, 'Mono', 'right', 600);
  }
}

function compareClients(g,k) {
  const r=cues(k), b=k.beat.beatIndex;
  function after(beat, phrase) {
    if (b !== beat) return b > beat;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  }
  const saved=r(3,'Open that path'), attached=r(3,'Give both clients');
  const decoder=r(3,'Look at the green');
  const showMark=after(3,'Put the same draw, about point six eight, on each strip');
  const newBody=after(4,'The fresh client selects the nested expression');
  const inner=after(4,'Its inner maximum keeps three');
  const outer=after(4,'Its outer minimum caps the result at two');
  const checked=after(4,'The verifier passes the fresh answer on this case');
  const replay=b>=5;
  const move=r(5,'Look to the right',1.15);
  const sharedRegion=r(5,'Look to the right');
  const selectedAgain=after(5,'A draw there would select x twice');
  const replayResult=move===1 && selectedAgain;
  const draw = showMark ? lerp(commonDraw, alternateDraw, ease(move)) : null;
  const drawLabel = move === 0 ? 'draw ≈ ' + commonDraw.toFixed(2) :
    move === 1 ? 'draw = ' + alternateDraw.toFixed(2) : 'same draw';
  const [leftSample, rightSample] = sharedRegion
    ? (replayResult ? alternateSamples : [null, null])
    : [oldSample, outer ? freshSample : null];
  const title = replay ? 'Change only the draw.' :
    showMark ? 'What does the fresh client return for three?' : 'Two clients, one clamp test.';
  header(g,'Snapshot replay',title,'Same prompt for both clients     •     x = 3     •     allowed interval [0, 2]     •     local example');
  const left=54,right=662,w=563,y=320,h=226;
  text(g,'Old client',left,204,29,C.ink,'Serif');
  text(g,attached?'Fresh client':'Trainer v2',right,204,29,C.ink,'Serif');
  if(decoder){
    drawInterval(g,left,w,minProbabilities[0],draw,drawLabel,sharedRegion);
    drawInterval(g,right,w,minProbabilities[1],draw,drawLabel,sharedRegion);
  }
  gauge(g,left,y,w,h,test,leftSample,{tag:oldSample.path,expect:true});
  if(attached)gauge(g,right,y,w,h,test,rightSample,{tag:freshSample.path,expect:outer,showVerdict:checked});
  else {
    plate(g,right,y,w,h);
    text(g,saved?'Sampler snapshot saved':'Training adapter',right+32,y+52,25,C.mint);
    text(g,saved?freshSample.path:'adapter v2',right+32,y+119,37,C.cream,'Mono');
  }
  if(leftSample)text(g,'FAIL',left+w-30,y+30,21,'#ffad85','Mono','right',600);
  if(rightSample && checked)text(g,rightSample.passed?'PASS':'FAIL',right+w-30,y+30,21,rightSample.passed?C.mint:'#ffad85','Mono','right',600);
  text(g,leftSample?.body ?? 'return  ?',left+2,565,26,C.ink,'Mono');
  if(leftSample)text(g,leftSample.value+' exceeds the upper bound',left+2,590,21,C.red);
  const rightBody = sharedRegion ? rightSample?.body : newBody ? freshSample.body : null;
  if(attached)text(g,rightBody ?? 'return  ?',right+2,565,26,C.ink,'Mono');
  if(replayResult)text(g,rightSample.value+' exceeds the upper bound',right+2,590,21,C.red);
  if(!sharedRegion && inner){
    const max = `max(${test.x}, ${test.lo}) = ${clampInner}`;
    const min = `min(${clampInner}, ${test.hi}) = ${freshSample.value}`;
    text(g,outer ? max+'    '+min : max,right+2,590,22,C.teal,'Mono');
  }
  footer(g,b>=6?'Keep the sampler path, returned code and verifier result together.':
    replayResult?'The larger min interval still leaves room for x.':
    sharedRegion?'The outlined region is to the right of both cutoffs.':
    checked?'The old client fails. The fresh client passes at the upper bound.':
    decoder?'Toy decoder     •     x → return '+candidates[3].code+'       •       min → return '+candidates[0].code:
    attached?'The two clients keep their own paths. Replay the same prompt and draw.':
    'Save the trainer’s weights for sampling. The old client keeps its existing path.');
}
export function snapshots(g,k) {
  const b=k.beat.beatIndex;
  if(b===0)return artifactShelf(g,k);
  if(b<3)return rehearsal(g,k);
  return compareClients(g,k);
}

