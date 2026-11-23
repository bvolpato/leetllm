import { C, base, text, mono, centered, socket, rect, plate, line, tag, footer, on, after, bar, bracket } from './drawing.mjs';
import { bytes, lseBytes, unit, scores, values, first, mergeBars, replay, merged, output, denseOutput, decimals, vector, sum } from './operator.mjs';

export function workspace(c,k) {
  const b=k.beat.beatIndex;
  if(b===4) {
    base(c,'What does more on-chip space buy?','FA1 analysis  /  scalar memory accesses',true);
    tag(c,'Sequence length n, head width d',117,299,C.aqua);
    mono(c,'d ≤ M ≤ 2M ≤ n × d',118,393,51,C.white);
    text(c,'M counts scalar elements that fit on chip.',792,393,46,C.paper);
    const wider=on(k,4,'Double that capacity');
    const w=wider?560:280;
    socket(c,118,505,w,151);
    centered(c,wider?'2M elements':'M elements',118+w/2,602,44,C.white);
    tag(c,'Tiled HBM access bound',807,517,C.aqua);
    mono(c,wider?'O(n²d² / (2M))':'O(n²d² / M)',807,616,59,C.white);
    text(c,'Materializing baseline',119,809,45,C.paper);
    mono(c,'Ω(nd + n²)',807,809,56,C.gold);
    footer(c,'The memory model counts transfers. Predicting elapsed time also requires hardware measurements.',true);
    return;
  }
  if(b===3) {
    base(c,'What happens to the key axis?','HBM allocation');
    const score=after(k,3,'One score tensor','For backward'), compact=on(k,3,'Drop the key axis');
    const compactBytes=after(k,3,'you get eight mebibytes','Dense dot-product work');
    tag(c,'One head',112,283);
    for(let i=0;i<16;i++)for(let j=0;j<16;j++) rect(c,115+j*26,323+i*26,24,24,j===15&&compact?C.orange:C.teal);
    centered(c,'8,192 × 8,192 scores',320,807,40);
    if(compact){
      line(c,[[551,536],[626,536]],C.green,4);
      for(let r=0;r<16;r++)rect(c,639,323+r*26,22,24,C.orange);
      centered(c,'LSE',651,806,34);
    }
    tag(c,'8 examples   ×   32 heads',792,307);
    mono(c,'8 × 32 × 8,192² × 2 B',792,414,52);
    text(c,score?bytes(8,32,8192,8192,2)/unit+' GiB':'?',792,536,86,C.green,{face:'Serif'});
    if(compact){
      mono(c,'8 × 32 × 8,192 × 4 B',792,673,52);
      text(c,compactBytes?lseBytes(8,32,8192)/2**20+' MiB':'?',792,801,86,C.red,{face:'Serif'});
    }
    footer(c,'One score per query–key pair. One saved log-sum-exp per query row.');return;
  }
  if(b===2){
    base(c,'Where do the temporary scores live?','Memory traffic',true);
    const states=['Q, K, V','Scores','Probabilities','Output'];
    tag(c,'Materializing path  /  HBM',104,307,C.aqua);
    states.forEach((s,i)=>{const x=100+i*430;plate(c,x,359,363,105,i===1||i===2?'#7b483a':'#284b48','#0c2524');centered(c,s,x+181,428,43,C.white);if(i<3)line(c,[[x+365,413],[x+427,413]],C.gold,4);});
    tag(c,'Fused path',106,572,C.aqua);
    plate(c,102,616,359,113,'#284b48');centered(c,'Q, K, V',282,690,43,C.white);
    line(c,[[461,673],[710,673]],C.gold,5);socket(c,710,573,528,192);centered(c,'On-chip tile',975,655,54,C.aqua);centered(c,'score → weight → update',975,719,35,C.paper);
    line(c,[[1238,673],[1470,673]],C.gold,5);plate(c,1470,616,322,113,'#284b48');centered(c,'Output',1630,690,43,C.white);
    footer(c,'The scores and weights can expire inside the tile.',true);return;
  }
  base(c,'Where do the next scores go?','One head  /  dense attention');
  const finish=on(k,0,'Multiply them',.85), second=on(k,1,'The next keys'), rest=on(k,1,'The other four queries');
  const last=on(k,1,'then keys five through eight');
  const filled=Math.min(16,12+Math.floor(finish*4)), idx=last?3:rest?2:second?1:0;
  const rowStart=Math.floor(idx/2)*4, colStart=(idx%2)*4;
  tag(c,'On-chip score slots',113,278);socket(c,111,322,606,449);
  for(let r=0;r<4;r++)for(let j=0;j<4;j++){
    const x=139+j*139,y=353+r*97;
    const has=r*4+j<filled;plate(c,x,y,130,86,has?'#c6e6d8':'#47625b','#374e46',5);
    if(has)centered(c,String((rowStart+r+1)*(colStart+j+1)),x+65,y+60,44,C.ink,{face:'Mono'});
  }
  mono(c,'Q: '+[1,2,3,4].map(v=>v+rowStart).join(' ')+'    K: '+[1,2,3,4].map(v=>v+colStart).join(' '),129,835,35);
  tag(c,'Query × key comparisons',871,274);
  const gridX=922,gy=332,cell=52;
  for(let r=0;r<8;r++)for(let j=0;j<8;j++){
    const block=Math.floor(r/4)*2+Math.floor(j/4);
    const seen=block<idx||block===idx&&(r%4*4+j%4)<filled;
    rect(c,gridX+j*cell,gy+r*cell,cell-3,cell-3,seen?(block===idx?C.teal:'#92b6a8'):'#ccd6c8');
  }
  for(let j=0;j<8;j++)centered(c,String(j+1),gridX+(j+.5)*cell,323,25,C.sub);
  for(let r=0;r<8;r++)centered(c,String(r+1),gridX-28,gy+(r+.68)*cell,25,C.sub);
  bracket(c,gridX+colStart*cell,gridX+(colStart+4)*cell-3,777,C.green);
  tag(c,'Scored',1450,436);text(c,String(idx*16+filled)+' / 64',1444,546,72,C.green,{face:'Serif'});
  tag(c,'Live score space',1450,620);mono(c,'32 B',1444,698,52);
  const reuse = after(k,1,'Use the same slots','First keep');
  footer(c,reuse ? 'One reusable tile holds 32 B of scores per visit.' : '4 queries × 4 keys × 2 bytes per score = 32 B.');
}

function tile(c,t,slide=0) {
  const x=113,y=348,w=601,h=311;
  socket(c,x,y,w,h);
  c.save();c.beginPath();c.rect(x+9,y+9,w-18,h-18);c.clip();
  const card=(start,dy)=>{
    for(let j=0;j<2;j++){
      const i=start+j, top=y+17+j*140+dy;
      plate(c,x+19,top,w-38,130,'#e1e4cc','#5b766a',8);
      mono(c,'K'+i,x+38,top+57,39);mono(c,'['+values[i].join(', ')+']',x+155,top+57,36);
      mono(c,String(scores[i]),x+w-74,top+69,61,C.green,{align:'center'});
      bar(c,x+156,top+81,214,26,values[i][0]/10);
    }
  };
  if(slide>0&&slide<1){card(0,-slide*h);card(2,(1-slide)*h);}else card(t===0?0:2,0);
  c.restore();
  tag(c,'Key',135,308);tag(c,'Value',278,308);tag(c,'Score',592,308);
}

export function slots(c,k) {
  base(c,'What survives the overwrite?','On-chip window  /  one query');
  const see=on(k,1,'Subtract the maximum'), weights=after(k,1,'The weights are','Add the weights');
  const saved=after(k,2,'Keep the maximum','The first key contributes'), move=on(k,2,'Bring in the second tile',1.3);
  tile(c,move===1?1:0,move);
  plate(c,116,718,595,95,'#d3b984','#b09978',12);centered(c,'Fixed query  q = 1',411,782,45);
  tag(c,saved?'First pair’s retained state':'Weights for the first pair',857,307);
  const firstScores = scores.slice(0,2);
  const firstWeights = firstScores.map(score => Math.exp(score - first.max));
  if (saved) {
    const fields=[['Maximum m',String(first.max)],['Weight sum ℓ',decimals(first.mass)],['Value sums u',vector(first.u)]];
    fields.forEach(([name,value],i)=>{const y=339+i*137;plate(c,853,y,944,112,'#f9f6e7','#abbcab');
      text(c,name,890,y+74,43,C.sub);mono(c,value,1750,y+76,51,C.ink,{align:'right',max:525});});
    mono(c,'First weights ≈ '+vector(firstWeights),858,809,35);
  } else {
    firstScores.forEach((score,i)=>{
      const y=350+i*198, weight=firstWeights[i];
      plate(c,853,y,944,156,'#f9f6e7','#abbcab');
      mono(c,'K'+i,888,y+66,47);
      if (see) mono(c,'exp('+score+' − '+first.max+')',1024,y+66,42);
      mono(c,weights?(weight===1?'1.000':'≈ '+decimals(weight)):'?',1750,y+67,52,C.ink,{align:'right'});
      rect(c,888,y+97,860,22,'#d9dfd1');
      if (weights) rect(c,888,y+97,860*weight,22,C.teal);
    });
  }
  const note = move>0 ? 'The second pair uses the slots. The first pair still has a share.'
    : saved ? 'The sums use the unrounded weights.' : 'Each key supplies one score and a value with two coordinates.';
  footer(c,note);
}

export function rescale(c,k) {
  if(k.beat.beatIndex===4) return checkSeam(c,k);
  const shrink=on(k,1,'Watch the old weight sum',1.15);
  const add=after(k,2,'Its weight is one','The key that scored zero');
  const finalKey=after(k,2,'The key that scored zero','Now the denominator');
  const divide=on(k,2,'Divide both value sums'), answer=after(k,3,'The answer','Here are the two tiles'), ref=on(k,3,'Slide the dense result',.8);
  base(c,answer?'Where do the two output coordinates meet?':'How much of the first tile survives?','Online softmax  /  same four keys',true);
  if(answer) {
    tag(c,'Each value has blue + orange = 10',120,296,C.aqua);
    values.forEach((v,j)=>{const x=120+420*j;text(c,'K'+j+'   ['+v.join(', ')+']',x,373,37,C.paper,{face:'Mono'});bar(c,x,402,320,48,v[0]/10);});
    const x=356,w=1340;const drawRow=(v,y,name)=>{text(c,name,117,y+60,41,C.white);bar(c,x,y,w,89,v[0]/10);centered(c,decimals(v[0]),x+w*v[0]/20,y+61,44,C.deep,{face:'Mono'});centered(c,decimals(v[1]),x+w*(.5+v[0]/20),y+61,44,C.deep,{face:'Mono'});};
    drawRow(output,540,'Two tiles');
    if(ref){c.save();c.globalAlpha=ref;const y=701+35*(1-ref);drawRow(denseOutput,y,'Dense');line(c,[[x+w*output[0]/10,629],[x+w*output[0]/10,y]],C.gold,3);c.restore();}
    footer(c,ref?'One division per coordinate. Both paths give the same seam to three decimals.':'Each width is a coordinate of the final weighted average.',true);return;
  }
  const state=mergeBars(shrink,finalKey?2:add?1:0), orig=[first.mass,...first.u];
  tag(c,'First tile   s = [1, 2]',123,292,C.aqua);tag(c,'Incoming tile   s = [3, 0]',937,292,C.gold);
  mono(c,shrink?'Old share × '+decimals(state.factor):'Old reference  m = 2',121,380,55,C.white);
  mono(c,'Target maximum  m = 3',932,380,55,C.white);
  const descriptions=['Weight sum','Blue value sum','Orange value sum'];
  for(let i=0;i<3;i++){
    const y=449+i*126, scale=i===0?607:98;
    text(c,descriptions[i],120,y+48,40,C.paper);
    const x=536,h=54,w=orig[i]*scale;
    c.strokeStyle='#b9cfc0';c.lineWidth=3;c.setLineDash([9,7]);c.strokeRect(x,y,w,h);c.setLineDash([]);
    rect(c,x,y,state.retained[i]*scale,h,C.aqua);
    if(add)rect(c,x+state.retained[i]*scale,y,state.additions[i]*scale,h,C.gold);
    mono(c,decimals(state.totals[i]),1770,y+46,44,C.white,{align:'right'});
  }
  const note=divide?'Output ≈ '+vector(merged.u)+' ÷ '+decimals(merged.mass):finalKey?'K3 adds exp(−3) to the weight sum and exp(−3) × [9, 1] to the value sums.':add?'K2 adds weight 1 and value sums [5, 5]. K3 still has to contribute.':shrink?'Old share only. Multiply ℓ and both components of u by exp(2 − 3).':'The dashed outlines mark the first tile’s original sums.';
  footer(c,note,true);
}

function checkSeam(c,k) {
  const stale = on(k, 4, 'but leave both old value sums');
  const showMerge = on(k, 4, 'The blue and orange pieces');
  const repair = on(k, 4, 'Rescale those values too', 1.35);
  const saidResult = after(k, 4, 'The right edge comes back to ten');
  const reachedLimit = saidResult && repair === 1;
  const { oldValues, newValues, result, total } = replay(repair);
  const valueTotal = sum(values[0]);
  const x = 565, labelX = 120, totalX = 1786;
  base(c, 'Can these coordinates be a weighted average?', 'Online softmax  /  same four keys', true);
  mono(c, 'Fixed weight sum ℓ ≈ ' + decimals(merged.mass), labelX, 280, 44, C.white);

  rect(c, x, 326, 35, 22, C.gold);
  text(c, 'Incoming tile', x + 52, 349, 35, C.paper);
  if (stale) {
    const factor = repair ? 'exp(' + first.max + ' − ' + merged.max + ')' : '1';
    mono(c, 'Old value sums × ' + factor, 1100, 280, 43, C.aqua);
    rect(c, x + 330, 326, 35, 22, C.aqua);
    text(c, 'Old tile', x + 382, 349, 35, C.paper);
  }
  const numeratorScale = 61;
  for (const [i, name] of ['Blue value sum', 'Orange value sum'].entries()) {
    const y = 389 + i * 88, h = 52;
    const incomingWidth = newValues[i] * numeratorScale;
    const oldX = x + incomingWidth;
    text(c, name, labelX, y + 39, 43, i ? C.orange : C.blue);
    rect(c, x, y, incomingWidth, h, C.gold);
    if (stale) rect(c, oldX, y, oldValues[i] * numeratorScale, h, C.aqua);
    if (repair) {
      c.save();
      c.strokeStyle = C.rule;
      c.lineWidth = 2;
      c.setLineDash([9, 7]);
      c.strokeRect(oldX, y, first.u[i] * numeratorScale, h);
      c.restore();
    }
  }

  line(c, [[labelX, 568], [totalX, 568]], '#46685d', 2);
  const scale = 66, denseY = 656, mergeY = 760, height = 70;
  const limit = x + valueTotal * scale;
  tag(c, 'Value sums ÷ ℓ', labelX, 621, C.paper);
  centered(c, valueTotal + ' units', limit, 625, 39, C.gold);
  tag(c, 'Total', totalX - 108, 621, C.paper);

  const drawRow = (name, coordinates, sumValue, y, showValues) => {
    text(c, name, labelX, y + 49, 43, C.white);
    bar(c, x, y, sumValue * scale, height, coordinates[0] / sumValue);
    if (!showValues) return;
    const seam = x + coordinates[0] * scale;
    centered(c, decimals(coordinates[0]), (x + seam) / 2, y + 49, 38, C.deep, { face: 'Mono' });
    centered(c, decimals(coordinates[1]), seam + coordinates[1] * scale / 2, y + 49, 38, C.deep, { face: 'Mono' });
    mono(c, '≈ ' + decimals(sumValue), totalX, y + 49, 36, C.paper, { align: 'right' });
  };
  drawRow('Dense output', denseOutput, sum(denseOutput), denseY, true);
  if (showMerge) drawRow('Merge output', result, total, mergeY, repair === 0 || reachedLimit);
  line(c, [[limit, 635], [limit, denseY]], C.gold, 3);
  line(c, [[limit, denseY + height], [limit, mergeY]], C.gold, 3);
  line(c, [[limit, mergeY + height], [limit, 856]], C.gold, 3);
  if (reachedLimit) {
    const seam = x + denseOutput[0] * scale;
    line(c, [[seam, denseY + height], [seam, mergeY]], C.blue, 3);
  }
}
