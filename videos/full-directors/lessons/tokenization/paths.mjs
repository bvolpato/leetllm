import { m, pieces, ids, fixedInput, output, fixedOutput, paths, sum, approx, sampling, raw, marked, noFallback } from './examples.mjs';
import { mix } from './press.mjs';

export function spaceMarkers(p) {
  p.title('What survives the space marker?', 'SentencePiece');
  if(p.b<=3) {
    p.label('Raw sentence',132,286,43,{color:p.dim});
    p.label('rain 関数x42',132,431,135,{family:'Serif'});
    if(p.b===1) {
      p.brace(135,986,560,48,p.gold);
      p.label('One toolkit',136,689,51);
      p.mono('BPE   /   Unigram',655,689,61,p.green);
    } else {
      const parts=['rain','▁関数','x','42'];
      let x=132;
      parts.forEach((piece,i)=>{
        const w=[419,386,178,249][i];
        p.slug(x,581,w-6,112,piece,{size:77,face:i%2?p.light:p.face});
        if(i) p.label(['','space','script','number'][i],x,766,38,{color:p.gold});
        x+=w;
      });
      p.note('The trainer can learn from sentences without an external word splitter.',906);
    }
    return;
  }
  if(p.b===4) {
    p.label('Normalized text',128,316,42,{color:p.dim});
    p.mono('rain falls',621,316,82);
    p.label('Marked stream',128,518,42,{color:p.dim});
    let left=625;
    for(const [i,word] of ['▁rain','▁falls'].entries()) {
      const width=93*word.length-8, cell=38;
      const textLeft=left+(width-cell*word.length)/2;
      const color=i?p.gold:p.green;
      p.slug(left,451,width,114,'',{face:i?p.pale:p.light});
      p.fixedText(word,textLeft,512,cell,60);
      p.brace(textLeft,textLeft+cell,585,23,color);
      p.label(i?'surviving space':'added prefix',textLeft+cell/2,661,35,{align:'center',color});
      left+=width+8;
    }
    p.note('Join pieces, drop the added prefix, then restore spaces.');
    return;
  }
  p.label('Input',112,311,46,{color:p.dim});
  p.fixedText(raw.replaceAll(' ','·'),549,311,57,69);
  p.label('After cleanup',112,493,46,{color:p.dim});
  p.fixedText(marked,549,493,57,69,p.green);
  p.label('Decoded',112,682,46,{color:p.dim});
  p.mono(noFallback.replace('�','⟨unknown⟩'),559,682,70,p.red,'left',1210);
  p.note('The unknown ID cannot identify the missing character.',886);
}

const routeColors=p=>[p.gold,p.green,p.red];
function routes(p, rows, {winner=-1, products=rows.length, factors=true}={}) {
  const x=250, unit=180;
  rows.forEach(({parts,live,score,factors:prob},i)=>{
    const y=306+i*159, color=routeColors(p)[i];
    p.circle(166,y+47,14,i===winner?color:p.rule);
    p.line(181,y+47,x-4,y+47,live?color:p.rule,5);
    let left=x;
    parts.forEach((part,j)=>{
      const w=part.length*unit;
      p.slug(left,y,w-7,91,part,{face:live?p.face:p.edge,ink:live?p.ink:p.dim,size:63});
      if(factors) p.mono(approx(prob[j]),left+w/2,y+122,38,live?color:p.dim,'center');
      left+=w;
    });
    p.line(left+1,y+47,1290,y+47,live?color:p.rule,i===winner?10:4);
    if(!live) {
      p.line(1168,y+23,1223,y+69,p.red,9);
      p.line(1223,y+23,1168,y+69,p.red,9);
    }
    if(i<products) p.mono(live?approx(score):'closed',1341,y+49,61,live?color:p.dim);
  });
}

export function lattice(p) {
  if(p.b===7) {bestBoundaries(p);return;}
  const lowered=p.cue(5,'Give the spare probability',0);
  const whole=lowered?m.LOWERED:m.P.whole;
  const rows=paths(whole);
  const win=rows.findIndex(row=>row.score===Math.max(...rows.map(r=>r.score)));
  p.title('Three routes across ▁rain', 'Unigram encoding');
  p.label('Complete segmentations',249,245,40,{color:p.dim});
  p.label('Path product',1340,245,40,{color:p.dim});
  const products=p.cue(3,'Take the marker',0)+p.cue(3,'Split rain again',0)+p.cue(4,'Which path wins',0);
  const showWinner=p.cue(5,'Keep its length',0) && (!lowered || p.cue(5,'Unigram compares',0));
  routes(p,rows,{winner:showWinner?win:-1,products,factors:p.b>=2});
  if(p.b===1) p.note('Each route spells the same five symbols.');
  if(p.b===2) p.note('Multiply the probabilities of the pieces on a complete route.');
  if(p.b===3 && products===2) p.note('What is the product on the three-piece route?');
  if(p.b===4) p.note('Which complete route has the largest product?');
  if(showWinner) p.note((p.b===6?'Largest sum of log probabilities':'Largest product')+'    →    '+rows[win].parts.join('  |  '),903,p.green);
}

function bestBoundaries(p) {
  p.title('Keep the best path to each boundary', 'Viterbi decoding');
  const word='▁rain', x=i=>203+299*i, baseline=560, c=p.ctx;
  const arcs=[
    [0,5,203,m.LOWERED,false], [0,1,339,m.P.marker,true],
    [1,5,338,m.P.rain,true], [1,3,670,m.P.ra,false], [3,5,670,m.P.in,false]
  ];
  const follow=p.cue(7,'follow its links back',1.1);
  for(const [a,b,h,prob,winning] of arcs){
    const col=winning && follow>.3?p.green:p.rule, xa=x(a),xb=x(b);
    c.beginPath();c.moveTo(xa,baseline);
    c.bezierCurveTo(xa+(xb-xa)*.16,h,xb-(xb-xa)*.16,h,xb,baseline);
    c.strokeStyle=col;c.lineWidth=winning?6:4;c.stroke();
    const apex=baseline*.25+h*.75;
    p.mono(word.slice(a,b)+'  '+approx(prob),(xa+xb)/2,apex+(h<baseline?-36:38),43,col===p.rule?p.dim:col,'center');
  }
  [...word].forEach((ch,i)=>p.mono(ch,x(i+.5),baseline+3,67,p.ink,'center'));
  [0,1,3,5].forEach((i,j)=>{
    p.circle(x(i),baseline,10,p.gold);
    p.mono(approx(m.BEST[j]),x(i),770,53,i===5?p.green:p.ink,'center');
  });
  p.label('Best product at each reachable boundary',120,891,44,{color:p.dim});
  p.fade(follow,()=>p.mono('▁  |  rain',1710,892,64,p.green,'right'));
}

function pruningShelf(p) {
  const round=p.cue(8,'Before the next cut',0)+p.cue(8,'Repeat that cycle',0)+p.cue(8,'The required characters',0);
  const removed=new Set(m.PRUNE_ROUNDS.slice(0,round).flatMap(r=>r.gone));
  const x=135, y=277, w=186, h=104;
  for(const [i,part] of m.CANDIDATES.entries()) {
    const col=i%9,row=Math.floor(i/9), xx=x+col*w, yy=y+row*h;
    p.box(xx,yy,w-8,81,p.edge,4);
    if(!removed.has(part)) p.slug(xx,yy,w-11,70,part,{face:part.length===1?p.light:p.face,ink:part.length===1?p.green:p.ink,size:42});
  }
  p.mono(m.CANDIDATES.length-removed.size+' pieces',134,874,71);
  p.label('Green sorts are required characters.',850,883,47,{color:p.green});
  if(round===1 || round===2) p.label('Refit the surviving pieces on the corpus.',134,962,41,{color:p.dim});
}
export function prune(p) {
  p.title(p.b>=7?'Prune the vocabulary':'Which piece costs less to lose?', 'Unigram training');
  if(p.b>=7) {pruningShelf(p);return;}
  const dropIn=p.cue(3,'Take away I N')>.3;
  const restore=p.cue(4,'Put I N back')>.3;
  const dropWhole=p.cue(4,'take away marker rain')>.3;
  const gone=dropWhole?'▁rain':dropIn&&!restore?'in':undefined;
  const rows=paths(undefined,gone);
  const total=sum(rows.map(r=>r.score)), baseline=sum(m.PATHS);
  p.label('One word, fixed piece probabilities',245,242,36,{color:p.dim});
  p.label('Path probability',1340,242,36,{color:p.dim});
  routes(p,rows,{factors:false,winner:rows.findIndex(r=>r.score===Math.max(...rows.map(r=>r.score)))});
  const wordReached = phrase => p.clock.reveal(phrase, 0, {captionStart: false});
  const knowBaseline = p.b > 2 || (p.b === 2 && wordReached('five'));
  const adding = (gone === 'in' && p.b === 3 && !wordReached('five')) ||
    (dropWhole && (p.b === 4 || (p.b === 5 && !wordReached('five percent'))));
  if(knowBaseline) {
    const label = adding ? 'Original total   '+baseline.toFixed(5) : 'Total   '+total.toFixed(5);
    p.mono(label,251,841,62,p.ink);
  }
  if(gone) {
    if(!adding) p.label((100*total/baseline).toFixed(2)+'% retained',1098,844,58,{color:p.gold});
    p.note(p.b>=6?'Estimate the cost across training words before pruning.':'Removed piece    '+gone,950,p.dim);
  } else p.note('Add the probabilities of every complete path.',956,p.dim);
}

export function regularize(p) {
  p.title('Draw a cut for this training pass', 'Subword regularization');
  const change=p.cue(2,'Turn the exponent down',1.6);
  const exponent=mix(1,.25,change), shares=sampling(exponent), colors=routeColors(p);
  const c=p.ctx,cx=495,cy=559,r=267, zero=-Math.PI/2;
  let start=zero;
  shares.forEach((share,i)=>{
    const end=start+2*Math.PI*share;
    c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,start,end);c.closePath();c.fillStyle=colors[i];c.fill();
    start=end;
  });
  p.circle(cx,cy,r*.59,p.page);
  p.mono(approx(exponent,2),cx,cy-15,82,p.ink,'center');
  p.label('exponent',cx,cy+59,38,{align:'center',color:p.dim});
  p.label('Training cuts',922,281,45,{color:p.dim});
  const rows=paths();
  rows.forEach((row,i)=>{
    const y=361+i*126;
    p.circle(900,y+27,13,colors[i]);
    p.mono(row.parts.join(' | '),941,y+27,54);
    p.mono((shares[i]*100).toFixed(2)+'%',1776,y+27,49,colors[i],'right');
  });
  const second=p.cue(1,'The next')>.5;
  if(p.b===1) {
    const sample=second ? .972 : .36;
    const angle=zero+2*Math.PI*sample;
    p.line(cx+Math.cos(angle)*(r-33),cy+Math.sin(angle)*(r-33),cx+Math.cos(angle)*(r+25),cy+Math.sin(angle)*(r+25),p.ink,12);
    const chosen=sample<shares[0]?0:1;
    p.note('Example pass '+(second?'2':'1')+'     →     '+rows[chosen].parts.join('  |  '),911,colors[chosen]);
  } else p.note('Sampling shares are proportional to path score raised to the exponent.',919);
}

function identifierPrefix(p, x, y, prefix, suffix, face, separation = 1) {
  const width = 440, height = 184;
  const chars = [...prefix];
  const gap = 48 * separation;
  const tileWidth = (width - (chars.length - 1) * gap) / chars.length;
  chars.forEach((ch, i) => {
    const left = x + i * (tileWidth + gap);
    const center = left + tileWidth / 2;
    p.slug(left, y, tileWidth, height, '', {face});
    // The letters open from the original ligature as the two faces separate.
    const joined = x + width / 2 + (i === 0 ? -23 : 23);
    p.label(ch, mix(joined, center, separation), y + 60, 112,
      {family: 'Serif', align: 'center'});
    p.fade(separation, () => p.mono(m.codePoint(ch), center, y + 142, 46, p.ink, 'center'));
  });
  p.mono(suffix, x + width + 15, y + 66, 83, p.dim);
}

function identifierComparison(p, nfkc, fold, collision) {
  p.label('Original identifiers', 184, 270, 58);
  p.label(fold > 0 ? 'After NFKC' : 'After NFC', 1085, 270, 58, {color: p.green});
  [m.LIGATURE, m.SECOND_IDENTIFIER].forEach((word, i) => {
    const suffix = m.LIGATURE.slice(1), y = 335 + i * 255;
    const prefix = word.slice(0, -suffix.length);
    identifierPrefix(p, 184, y, prefix, suffix, p.face);
    p.line(805, y + 90, 995, y + 90, p.rule, 5);
    p.line(995, y + 90, 968, y + 69, p.rule, 5);
    p.line(995, y + 90, 968, y + 111, p.rule, 5);
    const normalized = prefix.normalize(fold > 0 ? 'NFKC' : 'NFC');
    identifierPrefix(p, 1085, y, normalized, suffix, p.light, i === 0 && fold > 0 ? fold : 1);
  });
  if(collision) p.note('NFKC maps both identifiers to “'+m.LIGATURE.normalize('NFKC')+'”.', 903, p.green);
  else if(nfkc && !fold) p.note('NFKC also unifies the two spellings of café.', 903);
  else p.note('Each tile holds one code point.', 903);
}

export function normalization(p) {
  p.title(p.b<3?'Two spellings of café':'Which identifiers stay distinct?', 'Unicode normalization');
  if(p.b<=2) {
    [m.COMPOSED,m.DECOMPOSED].forEach((word,i)=>{
      const y=326+i*244;
      p.label(word,119,y+57,98,{family:'Serif'});
      const chars=[...word];
      chars.forEach((ch,j)=>{
        const x=527+j*221, mark=ch==='\u0301';
        p.slug(x,y,203,104,mark?'◌́':ch,{face:j>2?(i?p.pale:p.light):p.face,size:75});
        p.mono(m.codePoint(ch),x+100,y+158,36,p.dim,'center');
      });
      p.mono(chars.length,1741,y+57,79,p.ink,'center');
    });
    p.label('Code points',1618,261,36,{color:p.dim});
    p.note(p.b===2?'Different IDs can miss an exact-prefix cache.':'Look at the accent on the last letter.');
    return;
  }
  if(p.b===4 && p.cue(4,'Once the ligature is folded')>.5){
    p.label('Original identifiers',126,266,41,{color:p.dim});
    p.label('Stored after NFKC',1278,266,41,{color:p.dim});
    [m.LIGATURE,m.SECOND_IDENTIFIER].forEach((v,i)=>{
      const y=403+i*234;
      p.slug(127,y-43,420,122,v,{size:86});
      p.mono([...v].map(ch=>ch.codePointAt(0).toString(16).toUpperCase()).join(' '),145,y+146,40,p.dim);
      p.line(594,y+15,1159,529,i?p.green:p.gold,6);
    });
    p.slug(1200,460,552,140,m.LIGATURE.normalize('NFKC'),{size:93,face:p.rose});
    p.note('From this one spelling, the decoder cannot recover which input was typed.');
    return;
  }
  const nfkc = p.b > 3 || p.clock.reveal('NFKC', 0, {captionStart: 'The form called NFKC'});
  if(p.b===3 && !p.clock.reveal('and leaves', 0, {captionStart: false})) {
    p.label(m.COMPOSED,140,360,125,{family:'Serif'});
    p.label(m.DECOMPOSED,140,567,125,{family:'Serif'});
    p.line(510,365,850,470,p.green,8);p.line(510,573,850,470,p.green,8);
    p.mono('NFC',875,467,62,p.green);
    p.label(m.DECOMPOSED.normalize('NFC'),1190,467,135,{family:'Serif'});
    p.note('NFC gives both spellings the same final é (U+00E9).');
  } else {
    const fold = p.b > 3 ? 1 : p.clock.reveal('folds', .65, {captionStart: false});
    const collision = p.b > 3 || p.clock.reveal('collapse', 0, {captionStart: false});
    identifierComparison(p, nfkc, fold, collision);
  }
}

function values(p,row,x,y,color) {
  row.forEach((v,i)=>p.mono(v.toFixed(1),x+i*105,y,40,color,'center'));
}
export function lookup(p) {
  const b=p.b, swap=b>=5;
  if(b===7) {
    p.title('Compare a fixed encoding', 'Checkpoint compatibility');
    const x=500, cell=63, all=[...pieces,'<end>'];
    p.sorts(all,x,320,cell,{height:101,size:61});
    for(const [r,label] of ['Expected IDs','Replacement IDs'].entries()){
      const y=547+r*141;
      p.label(label,109,y,45,{color:p.dim});
      let start=0;
      all.forEach((part,i)=>{
        const center=x+(start+.5*part.length)*cell, changed=ids[0][i]!==ids[1][i];
        p.mono(i===pieces.length?7:ids[r][i],center,y,76,changed?p.red:p.green,'center');
        start+=part.length;
      });
    }
    p.note('The control ID matches. The ordinary pieces falls and soft change rows.',902);
    return;
  }
  const repaired=p.cue(8,'remaps only the input table')>.5;
  const fixOut=p.cue(9,'Move the input rows')>.5;
  const inputTable=repaired?fixedInput:m.TABLE;
  const showOut=b===3||b===4||b>=8;
  const selected=swap?ids[1]:ids[0];
  p.title('Read a piece by its ID', 'Eight illustrative rows');
  p.label(swap?'Replacement IDs':'Training IDs',130,253,43,{color:p.dim});
  p.label('Input weights',855,253,43,{color:p.dim});
  if(showOut) p.label(b===3?'Tied output':'Untied output',1385,253,43,{color:p.dim});
  for(let i=0;i<8;i++){
    const y=331+i*63, hit=selected.includes(i);
    p.box(800,y-24,435,52,hit?p.light:p.face,3);
    p.mono(i,761,y+2,38,p.dim,'center');
    values(p,inputTable[i],862,y+2,p.ink);
    if(showOut) {
      const table=b===3?m.TABLE:fixOut?fixedOutput:output;
      p.box(1360,y-24,435,52,p.face,3);
      values(p,table[i],1420,y+2,p.ink);
    }
  }
  pieces.forEach((piece,i)=>{
    const y=355+i*132,id=selected[i],col=(swap&&!repaired&&ids[0][i]!==id)?p.red:p.green;
    p.slug(131,y-35,264,80,piece,{size:49});
    p.mono(id,453,y+9,55,col);
    const end=331+id*63;
    p.line(527,y+10,706,end,col,4);
    p.circle(708,end,8,col);
  });
  const notes=[
    'rain reads row 2. The next piece reads row 5.',
    'Four pieces produce four vectors, in order.',
    'One set of weights can serve both directions.',
    'Each output row scores the piece with the same ID.',
    'Both lookups succeed. Two pieces read each other’s trained values.',
    'The ending ly keeps row 6 in both dictionaries.',
    'Compare the IDs of fixed inputs, including control tokens.',
    repaired?'Input rows follow the new IDs. Output rows are still in training order.':'Which input rows must trade places?',
    fixOut?'Input and output rows now follow the same permutation.':'The model reads correctly, but its output weights still use the old order.',
    'Pin the verified tokenizer and checkpoint together.'
  ];
  p.note(notes[b-1],907);
}

