import assert from 'node:assert/strict';
import { X, W, B } from '../../../films/model-parallelism/fixtures.mjs';
import { parallelMLP, denseMLP } from '../../../films/model-parallelism/arithmetic.mjs';
import { bench, panel, wire, lamp, box, label, mark, mono, dot, matrix, socket, note, event, between, mix, smooth, num, vec, show, base, gold, rose, ranks, violet, paper, faint } from './bench.mjs';

const x=X[0], relu=v=>Math.max(0,v);
const project=(input,weights)=>weights[0].map((_,j)=>weights.reduce((sum,r,i)=>sum+input[i]*r[j],0));
const sum=(a,b)=>a.map((v,j)=>v+b[j]);
const ref=project(x,W);
const slices=[0,1].map(r=>project(x,W.map(row=>row.slice(r*2,r*2+2))));
const rows=W.map((row,i)=>row.map(w=>w*x[i]));
const rowOutput=sum(...rows);
const hidden=slices.map(a=>a.map(relu));
const parts=hidden.map((h,r)=>project(h,B.slice(r*2,r*2+2)));
const joined=sum(...parts);
export const ge=parallelMLP(), fresh=parallelMLP([-1,3]);
export const freshMean=parallelMLP([-1,3],'mean').output;
export const freshDense=denseMLP([-1,3]);

const pattern=['.............','...#######...','..#########..','.LL.......##.','.LL.......##.','.LL.......##.','.LL.......##.','..L.......#..','...#######...','..#########..','.LL.......##.','.LL.......##.','.LL.......##.','.LL.......##.','..L.......#..','..#########..','...#######...','.............'];
const pixels=[...pattern.join('')];
const pos=5*13+2;
const planes=[pixels.map(v=>v==='.'?0:3),pixels.map(v=>({'.':0,'#':-1,'L':-4})[v])];
const late=sum(...planes).map(relu), early=sum(...planes.map(a=>a.map(relu)));

function digitPlate(c,cx,top,values,accent,scale,selected=true) {
  const pitch=23*scale, w=13*pitch+28, h=18*pitch+28;
  panel(c,cx-w/2,top,w,h,'#79808a');
  for(const [i,v] of values.entries()) {
    const xx=cx-w/2+15+(i%13)*pitch, yy=top+15+Math.floor(i/13)*pitch;
    const light=v>0?accent:v<0?(v===-4?rose:'#ae7462'):'#141c27';
    box(c,xx,yy,pitch-3,pitch-3,light,'#404654',3,1);
    if (v<0) wire(c,[[xx+pitch*.26,yy+pitch*.43],[xx+pitch*.61,yy+pitch*.43]],'#502d28',2);
    if(i===pos && selected) { c.strokeStyle=gold; c.lineWidth=4; c.strokeRect(xx-2,yy-2,pitch+1,pitch+1); }
  }
}

function digit(c,k) {
  const b=k.beat.beatIndex, split=event(k,0,'Now split',1.25);
  const added=event(k,2,'Three minus four',0), activated=event(k,2,'Now apply',0);
  const restore=event(k,4,'Restore the signed products',0), repaired=event(k,4,'Run ReLU on the sum',0);
  const earlyLocal=event(k,3,'Rectify each product',0)&&!restore, wrong=event(k,3,'the pixel lights up',0)&&!repaired;
  bench(c,'Input-channel split','When should this pixel pass through ReLU?');
  const output=wrong?early:late;
  const labels=['GPU 0','GPU 1',wrong?'Local ReLU, then add':activated?'Sum, then ReLU':'One-GPU reference'];
  const cx=[320,900,1545];
  for(let r=0;r<2;r++) show(c,between((split-.55)/.45),()=>{
    label(c,labels[r]+'   /   channel '+(r+1),cx[r],302,ranks[r],'center');
    const plane=earlyLocal?planes[r].map(relu):planes[r];
    digitPlate(c,cx[r],365,plane,ranks[r],1);
    const product=r===0?'3 × (+1) = 3':'4 × (−1) = −4';
    mono(c,earlyLocal?'ReLU → '+num(plane[pos]):b?product:'product  '+num(plane[pos]),cx[r],850,b?36:44,ranks[r]);
  });
  const refX=mix(960,cx[2],smooth(split));
  label(c,labels[2],refX,302,gold,'center');
  digitPlate(c,refX,360,output,gold,1.03);
  mono(c,wrong?'Earlier output  3':activated?'ReLU(−1) = 0':'Reference pixel  0',refX,850,40,gold);
  note(c,b===0?'One reference image. Two input channels.':b===1?'ReLU(x) = max(0, x)    •    When should it run?':repaired?'Full layer restored. Both GPUs together reproduce the reference three.':restore?'Signed products restored. The display holds the previous output.':wrong?'3 + 0 = 3. Early ReLU lights 18 extra pixels.':earlyLocal?'The negative contribution has become zero.':activated?'Left edge   0        Right edge   2':added?'Marked pixel, before ReLU     3 − 4 = −1':'Both contributions address the same pixel.');
}

function dense(c,k) {
  const selected=event(k,1,'Follow the last column',.6), result=event(k,2,'Five',0), all=event(k,2,'the full reference',0);
  bench(c,'Dense reference   /   y = xW','Which contacts feed the fourth output?');
  label(c,'Input row',130,330,violet); matrix(c,[x],130,445,108,96,violet);
  label(c,'Weight matrix W',608,330);
  matrix(c,W,608,397,130,100,(i,j)=>selected&&j===3?gold:paper,(_,j)=>!selected||j===3);
  const cx=608+3*138+65;
  for(let j=0;j<4;j++) {
    const xx=608+j*138+65;
    wire(c,[[xx,615],[xx,697]],j===3&&selected?gold:'#526572',3);
    lamp(c,xx,710,10,j===3&&selected?gold:'#647681');
    mono(c,all?ref[j]:j===3&&result?ref[j]:'?',xx,788,56,all?paper:gold);
  }
  label(c,'Output',442,785);
  wire(c,[[cx+70,446],[1265,446],[1300,486]],selected?gold:'#40505b',3);
  show(c,selected,()=>{
    label(c,'Fourth column',1322,392,gold);
    mono(c,'1 × 1',1485,491,60); mono(c,'+ 2 × 2',1485,588,60);
    wire(c,[[1325,655],[1645,655]],gold,3);
    mono(c,result?String(ref[3]):'?',1485,739,72,gold);
  });
  note(c,all?'The dense reference keeps all four output coordinates in order.':'One complete column produces one output coordinate.');
}
function columns(c,k) {
  const b=k.beat.beatIndex;
  const ready=[event(k,1,'It produces one and four',0),event(k,1,'It produces six and five',0)];
  const finish=event(k,2,'all-gather places',.85), active=event(k,2,'activate its own slice',0);
  bench(c,'Column-parallel multiply','Which outputs can each GPU finish?');
  for(let r=0;r<2;r++) {
    const ox=105+900*r, color=ranks[r];
    panel(c,ox,292,813,414,color);
    label(c,'GPU '+r+'   /   output columns '+(r?'3, 4':'1, 2'),ox+35,345,color);
    mono(c,vec(x),ox+139,478,44,paper);
    mark(c,'×',ox+289,478,48,faint,'center');
    matrix(c,W.map(a=>a.slice(r*2,r*2+2)),ox+352,405,130,66,color);
    wire(c,[[ox+75,588],[ox+735,588]],'#5b6c77',2);
    mono(c,ready[r]?vec(slices[r]):'?',ox+405,646,48,color);
  }
  for(let r=0;r<2;r++) {
    const xx=510+900*r;
    if(finish) {
      for(let source=0;source<2;source++) {
        const destination=xx+(source===0?-132:132);
        const present=source===r||finish===1;
        box(c,destination-119,783,238,78,'#1d2d36',present?ranks[source]:'#586971',6);
        mono(c,present?vec(hidden[source]):'·',destination,822,39,present?ranks[source]:faint);
      }
      if(finish<1) {
        const y=728+r*30, start=510+900*r, end=510+900*(1-r);
        wire(c,[[start,y],[end,y]],ranks[r],2);
        lamp(c,mix(start,end,smooth(finish)),y,8,ranks[r]);
      }
    } else if(active) mono(c,'ReLU → '+vec(hidden[r]),xx,810,45,ranks[r]);
  }
  note(c,finish?'An all-gather copies the ordered slices to both ranks.':
    active?'ReLU can read each complete slice on its owner.':
    b?'Does the activation need a transfer?':'Both ranks receive the same input row.');
}

function rowSplit(c, k) {
  const b = k.beat.beatIndex;
  const ready = [event(k, 1, 'Multiply row one', 0), event(k, 1, 'row two by two', 0)];
  const focus = event(k, 1, 'Look at the fourth contact', 0);
  const fourthTravel = event(k, 2, 'Add the aligned contacts', 0.85);
  const otherTravel = b === 2 ? k.reveal('the other three sums', 0.85, { captionStart: false }) : 0;
  const fourthDone = b === 2 && fourthTravel === 1 && k.elapsed >= k.wordCue('restores five').end;
  const allDone = otherTravel === 1 && k.elapsed >= k.wordCue('the same reference vector').end;

  bench(c, 'Row-parallel multiply', 'How do the row shards rebuild the output?');
  const centers = [615, 950, 1285, 1620];
  const rankTops = [335, 500];
  const laneOffsets = [-74, 74];
  const addY = 748;
  const outputY = 850;

  rankTops.forEach((top, r) => {
    panel(c, 110, top, 1700, 150, ranks[r]);
    label(c, 'GPU ' + r + '  /  Weight row ' + (r + 1), 144, top + 34, ranks[r]);
    label(c, '× ' + x[r] + ' → partials', 144, top + 102, paper);
  });
  label(c, 'Add aligned partials', 144, addY);
  label(c, 'Output', 144, outputY);

  centers.forEach((cx, j) => {
    const fourth = j === centers.length - 1;
    const color = fourth && focus ? gold : paper;
    const travel = fourth ? fourthTravel : otherTravel;
    const resolved = fourth ? fourthDone : allDone;
    label(c, 'Output ' + (j + 1), cx, 294, color, 'center');

    rankTops.forEach((top, r) => {
      const lane = cx + laneOffsets[r];
      const partialY = top + 102;
      const rankColor = ranks[r];
      if (travel > 0) {
        wire(c, [[lane, partialY + 29], [lane, addY - 29]], rankColor, 3);
      }
      mono(c, num(W[r][j]), lane, top + 34, 37);
      socket(c, ready[r] ? num(rows[r][j]) : '?', lane - 41, partialY - 29, 82, 58,
        fourth && focus ? gold : rankColor, Boolean(ready[r]));
      if (travel > 0) {
        const y = mix(partialY + 67, addY, smooth(travel));
        show(c, between(travel * 5), () =>
          socket(c, num(rows[r][j]), lane - 41, y - 29, 82, 58, rankColor));
      }
    });

    if (travel === 1) mono(c, '+', cx, addY, 44, color);
    wire(c, [[cx - 118, 802], [cx + 118, 802]], fourth && focus ? gold : '#526572', 2);
    mono(c, resolved ? num(rowOutput[j]) : '?', cx, outputY, 57, color);
  });

  note(c, allDone ? 'Each sum restores the matching coordinate of the dense output.' :
    fourthDone ? 'The fourth output uses both contributions.' :
    'Each GPU fills a partial at every output position.');
}
function pair(c,k) {
  const b=k.beat.beatIndex, focus=event(k,1,'Follow six and five',1);
  const products=[event(k,1,'Six multiplies row three',.65),event(k,1,'Five multiplies row four',.65)];
  const second=event(k,2,'One',0), first=event(k,2,'or sixteen',0), p0=event(k,2,'one and four',0);
  const travel=event(k,2,'Bring the two vectors',1.1), total=event(k,2,'Seventeen and five',0);
  bench(c,'Feed-forward block   /   ReLU','Where do the two activated slices meet?');
  const ys=[390,635];
  label(c,'Activated slice',115,295);label(c,'Projection rows',480,295);label(c,'Row products',826,295);label(c,'Local sum',1150,295);
  for(let r=0;r<2;r++) {
    const yy=ys[r], col=ranks[r];
    label(c,'GPU '+r,120,yy,col);
    hidden[r].forEach((v,i)=>{
      const sy=yy+64+i*60;
      socketValue(c,v,253,sy,col);
      wire(c,[[297,sy],[367,sy],[399,yy+i*67+42],[427,yy+i*67+42]],col,4);
      if(r&&focus) lamp(c,mix(301,425,smooth(focus)),mix(sy,yy+i*67+42,smooth(focus)),6,gold);
      mono(c,'r'+(2*r+i+1),465,yy+i*67+42,31,faint);
      const row=B[r*2+i], terms=row.map(w=>w*v);
      show(c,r?products[i]:p0,()=>mono(c,vec(terms),913,yy+i*67+42,35,col));
    });
    matrix(c,B.slice(r*2,r*2+2),520,yy+9,99,58,col);
    for(let i=0;i<2;i++) wire(c,[[1040,yy+i*67+42],[1055,yy+i*67+42],[1077,yy+75]],col,3);
    const vals=r===0?(p0?vec(parts[0]):'[ ? , ? ]'):'[ '+(first?parts[1][0]:'?')+' , '+(second?parts[1][1]:'?')+' ]';
    mono(c,vals,1230,yy+72,45,col);
    wire(c,[[1385,yy+72],[1435,yy+72],[1515,580]],col,4);
    if(travel>0 && travel<1) {
      const segment=between((travel-.24)/.76);
      lamp(c,mix(mix(1385,1435,between(travel/.24)),1515,segment),mix(yy+72,580,segment),11,col);
    }
  }
  dot(c,1538,580,44,'#17232b');mono(c,'+',1538,580,72,gold);
  wire(c,[[1587,580],[1610,580],[1603,574]],gold,3);
  wire(c,[[1610,580],[1603,586]],gold,3);
  mono(c,total?vec(joined):'?',1758,580,42,gold);
  note(c,total?'One sum at the contraction. The four hidden coordinates stay local.':
    b?'Second contact on GPU 1     6 × 1 + 5 × (−1)':'Each complete hidden coordinate feeds the row with the same index.');
}
function socketValue(c,v,x,y,color) { dot(c,x,y,27,color); mono(c,num(v),x,y,35,base); }

function gelu(c,k) {
  const b=k.beat.beatIndex, partsOn=event(k,1,"That gives",.65);
  const summed=event(k,1,'Both receive the same sum',0), bias=event(k,2,'Add the bias once',.55);
  bench(c,'Signed projection   /   article fixture','Where does the output bias belong?');
  const cols=[280,715,1200,1640];
  ['xA slice','GeLU','Rows of B','Contribution'].forEach((v,i)=>label(c,v,cols[i],326,faint,'center'));
  for(let r=0;r<2;r++) {
    const y=450+r*200, color=ranks[r];
    label(c,'GPU '+r,86,y-64,color);
    mono(c,vec(ge.expansion.slice(r*2,r*2+2)),cols[0],y,47,color);
    mono(c,vec(ge.hidden.slice(r*2,r*2+2)),cols[1],y,39,color);
    matrix(c,ge.B.slice(r*2,r*2+2),cols[2]-101,y-59,96,53,color);
    mono(c,partsOn?vec(ge.partials[r]):'?',cols[3],y,38,color);
    wire(c,[[cols[2]+116,y],[1390,y]],color,3);
  }
  const pre=sum(...ge.partials);
  mono(c,bias?'SUM '+vec(pre)+'   +   '+vec(ge.bias)+'   ≈   '+vec(ge.output):summed?'SUM  ≈  '+vec(pre):'Output bias   '+vec(ge.bias),960,818,bias?39:48,gold);
  note(c,bias?'Dense reference   ≈   '+vec(denseMLP(x)):b?'Should the bias enter each partial or each complete output?':'Both ranks receive x = [1, 2]. Displayed decimals are rounded.');
}
function collective(c, k) {
  const spoken = (i, phrase) =>
    k.beat.beatIndex > i ||
    (k.beat.beatIndex === i && k.elapsed + 1e-9 >= k.wordCue(phrase).end);
  const ar = event(k, 1, 'All-reduce with sum', 0);
  const ag = spoken(1, 'All-gather would instead');
  const split = event(k, 2, 'Change the consumer', 0);
  const rs = event(k, 2, 'Reduce-scatter gives', 0);
  const gathering = ag && !split;
  const reducing = rs || (ar && !ag && !split);
  const mode = rs ? 'Reduce-scatter' : gathering ? 'All-gather' : reducing ? 'All-reduce with sum' : 'Choose the collective';
  const sourceX = [260, 390], rows = [441, 675], sumX = [737, 990], destX = 1291, pitch = 122;
  const readout = gathering
    ? spoken(1, 'Four values would reach each GPU')
    : reducing && !rs && spoken(1, 'seventeen and five to each GPU');

  bench(c, 'Collective communication', 'What does each consumer receive?');
  label(c, 'Source contributions', 322, 316, faint, 'center');
  label(c, 'Destination on each GPU', 1510, 316, faint, 'center');
  mark(c, mode, 879, 350, 37, gold, 'center', 'Serif');
  for (const [rank, values] of parts.entries()) {
    const y = rows[rank], color = ranks[rank];
    label(c, 'GPU ' + rank, 109, y, color);
    label(c, 'GPU ' + rank, 1168, y, color);
    values.forEach((value, col) => socket(c, value, sourceX[col] - 46, y - 33, 92, 66, color));
    if (gathering) {
      parts.flat().forEach((value, i) =>
        socket(c, readout ? value : null, destX + pitch * i, y - 33, 100, 66, ranks[Math.floor(i / 2)]));
    } else {
      joined.forEach((value, col) => {
        if (split && rank !== col) return;
        const ready = readout || (rs && spoken(2, col ? 'five to the second' : 'seventeen to the first'));
        socket(c, ready ? value : null, destX + pitch * col, y - 33, 102, 66, gold);
      });
    }
  }

  if (reducing) {
    const p = smooth(rs ? event(k, 2, 'Reduce-scatter gives', 1.15) : event(k, 1, 'adds corresponding coordinates', 1.15));
    joined.forEach((_, col) => {
      const x = sumX[col], targetY = 545;
      panel(c, x - 114, targetY - 52, 228, 104, gold);
      label(c, 'Coordinate ' + (col + 1), x, targetY - 19, faint, 'center');
      mono(c, parts.map(v => v[col]).join(' + '), x, targetY + 24, 37, gold);
      if (p > 0 && p < 1) {
        for (const [rank, values] of parts.entries()) {
          const px = mix(sourceX[col], x + (rank ? 47 : -47), p);
          const py = mix(rows[rank], targetY + 24, p);
          socket(c, values[col], px - 31, py - 24, 62, 48, ranks[rank]);
        }
      }
    });
  } else if (gathering) {
    const p = smooth(event(k, 1, 'concatenate those inputs', 1.25));
    const flat = parts.flat();
    flat.forEach((value, i) => {
      const rank = Math.floor(i / 2), x = 670 + i * 139;
      socket(c, p === 1 ? value : null, x - 43, 516, 86, 62, ranks[rank]);
      if (p > 0 && p < 1) {
        const px = mix(sourceX[i % 2], x, p), py = mix(rows[rank], 547, p);
        socket(c, value, px - 32, py - 24, 64, 48, ranks[rank]);
      }
    });
    label(c, 'Rank order', 879, 619, faint, 'center');
  }
  mark(
    c,
    split ? 'Requested: GPU 0 owns coordinate 1. GPU 1 owns coordinate 2.'
      : gathering && readout ? 'Four concatenated entries reach each GPU.'
      : 'Requested: both GPUs need the complete sum.',
    960, 829, 35, paper, 'center', 'Serif',
  );
}
export const tensorScenes={'c01':digit,'c02':dense,'c03':columns,'c04':rowSplit,'c05':pair,'c05-reference':gelu,'c06':collective};
export function checkTensor() {
  assert.deepEqual(planes.map(a=>a[pos]),[3,-4]); assert.equal(late[pos],0); assert.equal(early[pos],3);
  assert.equal(late[5*13+10],2); assert.equal(early.filter((v,i)=>v>0&&late[i]===0).length,18);
  assert.deepEqual(late,pixels.map(p=>p==='#'?2:0)); assert.deepEqual(ref,[1,4,6,5]);
  assert.deepEqual(slices.flat(),ref); assert.deepEqual(rowOutput,ref);
  assert.deepEqual(parts,[[1,4],[16,1]]); assert.deepEqual(joined,project(ref.map(relu),B));
  for(const run of [ge,fresh]){
    const dense=denseMLP(run.input);
    run.output.forEach((v,j)=>assert.ok(Math.abs(v-dense[j])<1e-11));
    assert.deepEqual(sum(sum(...run.partials),run.bias),run.output);
  }
  assert.ok(Math.abs(freshMean[1]-freshDense[1])>7);
}
