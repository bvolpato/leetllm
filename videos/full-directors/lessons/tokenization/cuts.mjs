import { m, pieces, ids, firstMismatch, decode, sparkleBytes, sparkleStates, rainbow, approx, ruleRuns } from './examples.mjs';
import { mix } from './press.mjs';

const ends = pieces.map((_, i) => pieces.slice(0,i+1).join('').length);

export function registration(p) {
  p.title('One line of type', 'Illustrative ID mapping');
  const x = 414, cell = 79, y = 375;
  const cuts = p.cue(1,'Watch the seams',.9);
  const lower = p.cue(2,'A replacement tokenizer',.8);
  const route = p.cue(3,'Follow the lower guide',1.1);
  const found = p.cue(3,'Falls is the first mismatch');
  // A composing stick holds the letters against a fixed heel and a sliding knee.
  const steel=p.ctx.createLinearGradient(0,y-15,0,y+156);
  steel.addColorStop(0,'#aeb1a4'); steel.addColorStop(.35,'#626d65'); steel.addColorStop(1,'#535e59');
  p.box(x-154,y+94,17*cell+216,63,steel,8);
  p.box(x-53,y-15,45,153,steel,5);
  p.box(x+17*cell+2,y-15,55,159,steel,5);
  p.box(x-21,y-7,17*cell+40,146,p.dim,4);
  p.box(x-14,y-4,17*cell+28,138,p.face,4);
  p.circle(x-101,y+122,24,'#394944');p.circle(x-101,y+122,16,'#c6b080');
  p.line(x-110,y+130,x-92,y+114,p.dim,4);
  for(let k=0;k<=34;k++) p.line(x+k*cell/2,y+143,x+k*cell/2,y+(k%2?149:154),'#dfdac7',2);
  [...m.SENTENCE].forEach((ch,i)=>p.mono(ch===' '?'·':ch,x+(i+.5)*cell,y+65,87,p.ink,'center'));
  p.fade(cuts,()=>{
    for(const end of ends.slice(0,-1)) p.line(x+end*cell,y+5,x+end*cell,y+132,p.rule,4);
    p.label('Training IDs',100,288,43,{color:p.green});
  });
  for (let row=0;row<2;row++) {
    const guideY = row ? y+172 : y-22;
    p.fade(row ? lower : cuts,()=>{
      if(row) p.label('Replacement IDs',100,615,40,{color:p.gold,max:292});
      let start=0;
      for(const [i,end] of ends.entries()) {
        const color = row ? p.gold : p.green;
        const center = x+(start+end)/2*cell;
        p.brace(x+start*cell+3,x+end*cell-3,guideY,row?20:-20,color);
        p.mono(ids[row][i],center,guideY+(row?67:-67),64,color,'center');
        if(found && i===firstMismatch) p.line(center-32,guideY+(row?101:-103),center+32,guideY+(row?101:-103),p.red,6);
        start=end;
      }
    });
  }
  const idx=firstMismatch, original=ids[0][idx], wrong=ids[1][idx];
  if(p.b<3) {
    p.note(p.b===1?'A dot prints as a space.':'Which piece first selects a different row?',846);
    return;
  }
  const col = x+(ends[idx-1]+ends[idx])*.5*cell;
  p.fade(found,()=>{
    p.label('Learned rows',100,774,41,{color:p.dim});
    for(const [i,id] of [original,wrong].entries()) {
      const xx=423+i*644;
      p.slug(xx,730,596,84,'row '+id+'   '+decode(id,m.IDS_A),{size:54,face:i&&route?p.rose:p.light});
      p.mono('[ '+m.TABLE[id].map(v=>v.toFixed(1)).join('  ')+' ]',xx+298,862,42,p.dim,'center');
    }
    p.line(col,660,col,687,p.red,5);
    p.line(col,687,mix(col,1360,route),687,p.red,5);
    if(route>.9) p.line(1360,687,1360,727,p.red,5);
  });
  p.fade(p.cue(3,'still decodes'),()=>p.note('Replacement decodes its own IDs   →   rain falls softly',961,p.dim));
}

function grid(p,x,y,n,unit,mask=false,color=p.green) {
  for(let row=0;row<n;row++) for(let col=0;col<n;col++)
    p.box(x+col*unit,y+row*unit,unit-2,unit-2,mask&&col>row?p.edge:color,1);
}

function afterPhrase(p,beat,phrase) {
  if(p.b !== beat) return p.b > beat;
  return p.clock.elapsed+1e-9 >= p.clock.wordCue(phrase).end;
}

export function granularity(p) {
  p.title('How wide is one position?', 'Words, characters and subwords');
  const typo=p.b===2 && p.cue(2,'drop the T')>.5;
  const sub=p.cue(7,'Cut in the middle')>.5;
  const chars=p.b>=3&&!sub;
  const wordPieces=['rain','falls',typo?'sofly':'softly'];
  if(chars||sub) {
    p.sorts(sub?pieces:[...m.SENTENCE],180,282,91,{height:110,size:66});
  } else {
    let x=250;
    for(const [i,word] of wordPieces.entries()) {
      const width=word.length*88;
      p.slug(x,300,width,160,word,{size:89,face:i===2&&typo?p.rose:p.face});
      x+=width+26;
    }
  }
  if (p.b<=2) {
    p.label('Word dictionary',245,570,43,{color:p.dim});
    p.sorts(['rain','falls','softly'],245,633,59,{height:91,size:48});
    p.note(typo?'sofly  →  [UNK]':'3 dictionary entries  →  3 model positions',848,typo?p.red:p.green);
    return;
  }
  const n=m.SENTENCE.length;
  const masked=!sub && p.cue(6,'hides the later positions')>.5;
  grid(p,300,474,n,21,masked);
  p.mono(n+' × '+n,745,551,66);
  p.label('character positions',746,634,45,{color:p.dim});
  if(masked && afterPhrase(p,6,'a hundred fifty three comparisons'))
    p.label(m.MASKED+' allowed by the causal mask',746,719,42);
  if(!masked && afterPhrase(p,5,'two hundred eighty nine comparisons'))
    p.label(n**2+' cells in a dense grid',746,719,42);
  if(sub) {
    const count=pieces.length;
    grid(p,1296,474,count,21,false,p.gold);
    if(afterPhrase(p,7,'four pieces'))
      p.mono(count+' × '+count,1417,551,62);
    p.label('subword positions',1417,634,39,{color:p.dim});
    if(afterPhrase(p,7,'sixteen comparisons'))
      p.label(count**2+' cells in a dense grid',1417,719,40,{color:p.gold,max:403});
  }
  p.note(sub?'Reusable pieces keep the prompt short.':'One grid per attention head',911,p.dim);
}

const corpusCues = [
  {beat:2, pair:'R A appears', count:'seven times', merge:'We glue R and A together',
    resultBeat:3, loss:'removed seven positions', total:'Twenty three remain'},
  {beat:3, pair:'R A followed by I', count:'occurs seven times', merge:'Glue them together',
    resultBeat:3, total:'sixteen positions remain'},
  {beat:4, pair:'Then R A I and N', count:'five times', merge:'five times',
    resultBeat:4, loss:'five times', total:'five times. Eleven'}
];

export function corpus(p) {
  p.title('Count the neighbors again', 'BPE training');
  const round = p.b >= 4 ? p.b-2 : p.cue(3,'Count the neighbors again',0);
  const step = m.HISTORY[round];
  const next = m.HISTORY[round+1];
  const cue = corpusCues[round];
  const counting = cue && p.cue(cue.beat,cue.pair,0);
  const counted = counting && afterPhrase(p,cue.beat,cue.count);
  const joined = cue ? p.cue(cue.beat,cue.merge,.95) : 0;
  const pair = next?.merged;
  const weights = [];
  const x = 300, unit = 134, gap = 20, height = 101;
  p.label('Copies',108,253,39,{color:p.dim});
  p.label('Pieces',x,253,39,{color:p.dim});
  if(counting && joined < 1) p.label('Adds',1012,253,38,{align:'center',color:p.green});
  step.words.forEach((word,i)=>{
    const y = 313+i*157;
    p.mono('× '+word.count,126,y+50,56,p.dim);
    let start = 0;
    for(let j=0;j<word.pieces.length;j++){
      const a = word.pieces[j], b = word.pieces[j+1];
      const matches = counting && a === pair.left && b === pair.right;
      const part = matches && joined > 0 ? a+b : a;
      const left = x+start*unit;
      const width = part.length*unit;
      p.slug(left,y,width-gap,height,'',{face:part.length>1?p.light:p.face});
      if(matches) {
        weights.push(word.count);
        if(joined>0){
          const seam = left+a.length*unit-gap/2;
          const opening = gap*(1-joined);
          p.box(seam-opening/2,y-1,opening,height+12,p.page);
          j++;
        }
        p.fade(1-joined,()=>{
          const right = left+(a.length+b.length)*unit-gap;
          p.brace(left+4,right-4,y+119,15,p.green);
          p.mono('+'+word.count,1012,y+50,47,p.green,'center');
        });
      }
      p.fixedText(part,left-gap/2,y+height*.53,unit,72);
      start += part.length;
    }
  });
  p.line(1090,253,1090,755);
  if(!next) {
    p.label('Saved merge order',1150,253,43,{color:p.dim});
    m.RULES.forEach(([a,b],i)=>p.mono((i+1)+'. '+a+' + '+b+' → '+a+b,1150,357+i*114,49,p.ink,'left',627));
  } else if(counting || joined) {
    p.label(joined===1?'Saved merge':'Count these neighbors',1150,253,43,{color:p.dim});
    const {left,right,count} = pair;
    const operation = left+' + '+right;
    p.mono(joined===1 ? operation+' → '+left+right : operation,1150,370,58,joined===1?p.green:p.ink);
    if(counted) p.mono(weights.join(' + ')+' = '+count,1150,480,62,p.green);
    if(joined<1 && round===0 && afterPhrase(p,2,'and so does A I')){
      const {pair:tied,count:tiedCount} = next.ranked[1];
      p.mono(tied.replace(' ',' + ')+' also has '+tiedCount,1150,604,48,p.dim);
      if(afterPhrase(p,2,'the first pair it saw'))
        p.label('First seen wins the tie.',1150,689,42,{color:p.dim});
    } else if(joined<1 && round>0 && counted) {
      const other = next.ranked[1];
      p.mono(other.pair.replace(' ',' + ')+' has '+other.count,1150,612,48,p.dim);
    }
  } else if(round===1) {
    p.label('Which pair now includes ra?',1150,370,49,{max:665});
  }
  const mergedRound = joined>0 ? round : !counting ? round-1 : -1;
  corpusPositions(p,round,mergedRound,joined);
}

function corpusPositions(p,round,mergedRound,joined) {
  if(!afterPhrase(p,2,'Thirty positions')) return;
  const history = m.HISTORY;
  let label = 'Weighted positions';
  let calculation = history[round].positions;
  if(round===m.RULES.length) {
    calculation = history.map(step=>step.positions).join('  →  ');
  } else if(mergedRound>=0) {
    const {resultBeat,loss,total} = corpusCues[mergedRound];
    const after = history[mergedRound+1];
    calculation = history[mergedRound].positions;
    if(loss && !afterPhrase(p,resultBeat,loss)) label = 'Positions before merge';
    else calculation += ' − '+after.merged.count;
    if((mergedRound<round || joined===1) && afterPhrase(p,resultBeat,total))
      calculation += ' = '+after.positions;
  }
  p.line(111,773,1809,773);
  p.label(label,111,861,46,{color:p.dim});
  p.mono(calculation,650,861,69,p.green);
}

export function replay(p) {
  const fork=p.b>=3;
  p.title(fork?'Two rules need the same A':'Replay the saved merges', 'BPE encoding');
  if(!fork) {
    const n=Number(p.cue(1,'join R to A')>.5)+Number(p.cue(1,'attaches I')>.5)+Number(p.cue(1,'attaches N')>.5);
    const word=p.b===1?'rainly':'rainy';
    p.label(p.b===1?'Unseen spelling':'Five letters',160,291,42,{color:p.dim});
    p.sorts(m.applyRules(word,m.RULES.slice(0,n)),160,372,204,{height:155,size:100});
    m.RULES.forEach(([a,b],i)=>p.mono(a+' + '+b,170+i*560,626,64,i<n?p.green:p.dim));
    if(p.b===2) p.note('rail    →    '+m.applyRules('rail',m.RULES).join('  |  '),865);
    else p.note('l and y have no saved merge.',860,p.dim);
    return;
  }
  const joined=[p.cue(3,'The next rule needs',0),p.cue(4,'That leaves',0)];
  const lowerRun=p.cue(3,'Now reverse',0);
  for(const [i,{rules,result}] of ruleRuns.entries()) {
    if(i===1 && !lowerRun) continue;
    const y=300+i*269;
    const color=i?p.gold:p.green;
    rules.forEach((pair,rank)=>p.mono((rank+1)+'. '+pair.join(' + '),134,y+32+rank*66,48,color));
    const list=joined[i]?result:[...'rain'];
    p.sorts(list,655,y,228,{height:130,size:90,faces:list.map(k=>k.length>1?(i?p.pale:p.light):p.face)});
    if(joined[i]) p.label(rules[1].join(' + ')+' needs a separate a.',660,y+196,39,{color:p.dim});
    else if(i===1) p.label('Which pieces remain after both rules?',660,y+196,39,{color:p.dim});
  }
  p.note('Both runs read the same four letters.',914);
}

export function boundaries(p) {
  p.title(p.b===3?'What can cross this cut?':'Which neighbors may merge?', 'Pre-tokenization');
  if(p.b===1){
    for(const [i,term] of ['failed.','failed!'].entries()){
      const x=182+i*825;
      p.slug(x,353,696,177,term,{size:113,face:i?p.pale:p.light});
      p.label('separate word-plus-punctuation entry',x,610,39,{max:700,color:p.dim});
    }
    p.note('Unrestricted merges can spend two entries on the same stem.');
  } else if(p.b===2){
    const labels=['letters','space','digits','space','letters','punctuation'];
    p.mono(m.SPAN_PATTERN.map(([pattern])=>pattern).join('  |  '),960,279,53,p.dim,'center');
    let x=110;
    m.SPANS.forEach((v,i)=>{
      const w=v.length*88+(v===' '?12:0);
      p.slug(x,383,w-7,139,v.replace(' ','·'),{size:74,face:[p.face,p.pale,p.light,p.pale,p.face,p.rose][i]});
      p.label(labels[i],x+w/2,600,36,{align:'center',max:i===5?221:w-2}); x+=w;
    });
    p.note('Merges stay inside each span of the example pattern.');
  } else {
    const remove=p.cue(3,'Pull the divider out',.8);
    p.mono('r a i n',960,300,86,p.ink,'center');
    p.sorts(m.CHUNKS.flat(),492,435,239,{height:156,size:84});
    p.fade(1-remove,()=>p.box(962,381,12,254,p.red));
    if(remove===1) {
      p.line(492,666,1440,666,p.green,4);
      p.sorts(m.WHOLE,492,711,239,{height:115,size:78,faces:[p.light]});
    }
    p.note(remove===1?'Whole string   ·   1 position':'Encoded in two chunks   ·   3 positions',914);
  }
}

export function bytes(p) {
  p.title(p.b>=6?'When can the cursor advance?':'From characters to bytes', 'UTF-8');
  if(p.b<=3) {
    p.label('Corpus alphabet',149,286,45,{color:p.dim});
    p.sorts(m.ALPHABET,150,342,146,{size:94,height:139});
    if(p.b===1) {
      p.slug(1270,342,175,139,'b',{ink:p.red,size:94});
      p.label('outside the alphabet',1180,576,45,{color:p.red});
      p.note('Characters seen in rain, rainy and rail');
    } else {
      for(let j=0;j<16;j++) for(let i=0;i<16;i++) p.box(1155+i*23,280+j*23,19,19,(i+j)%4?p.green:p.gold,2);
      p.mono('00',1115,259,32);p.mono('FF',1527,670,32);
      p.mono('16 × 16 = 256',175,613,83);
      p.note('All byte values have a starting piece. Merges decide the final length.');
    }
    return;
  }
  const streaming=p.b>=6, prefix=m.BYTE_TEXT.slice(0,2);
  const coordinates=[315,742,1350];
  const zoom=p.cue(4,'Under the lens',.95);
  p.label('Code points',110,254,39,{color:p.dim});
  m.BYTE_CHARS.forEach(({ch,bytes},i)=>{
    const x=coordinates[i];
    if(i===2) {
      p.fade(zoom,()=>{
        p.circle(x,397,122,p.gold);p.circle(x,397,111,p.face);
        p.line(x+86,487,x+148,552,p.gold,23);
      });
      p.sparkle(x,397,mix(42,84,zoom));
    } else p.label(ch,x,398,147,{family:'Sans',align:'center'});
    for (const [j,byte] of bytes.entries()) {
      const bx=x+(j-1)*108;
      const show=i===2?zoom:p.cue(4,'Each takes three');
      p.fade(show,()=>{
        p.line(x,531,bx,576,i===2?p.gold:p.rule,3);
        p.slug(bx-49,585,97,76,m.hex(byte),{face:i===2?p.pale:p.face,size:45});
      });
    }
  });
  if(!streaming) {p.note('3 code points   ·   9 bytes   ·   9 positions without merges',835);return;}
  const arrivals = [
    p.cue(6, 'Send the first sparkle byte'),
    p.cue(7, 'Send the second'),
    p.cue(8, 'Send the third'),
  ];
  const received = arrivals.filter(progress => progress === 1).length;
  const emitted = sparkleStates[received];
  p.label('Output',122,827,52,{color:p.dim});
  p.label(prefix,361,819,90,{max:205});
  if(emitted) p.sparkle(606,819,48);
  p.box(emitted?672:561,769,7,93,p.green);
  p.label(emitted ? 'Decoded bytes' : 'Buffered bytes', 930, 910, 39, {color:p.dim});
  sparkleBytes.forEach((byte, i) => {
    const x = 930 + i * 133;
    const progress = arrivals[i];
    p.box(x, 783, 118, 78, p.edge, 5);
    if (progress > 0) {
      const fromX = coordinates[2] + (i - 1) * 108 - 49;
      p.slug(mix(fromX, x, progress), mix(585, 783, progress), mix(97, 118, progress),
        76, m.hex(byte), {face: emitted ? p.light : p.pale, size: 45});
    }
  });
  p.mono(received + ' / ' + sparkleBytes.length, 1450, 824, 48, p.dim);
}

export function association(p) {
  p.title('Frequency or association?', 'WordPiece training proxy');
  const scored=p.cue(4,'The scores come out')>.25 || p.b===5;
  for(const [i,e] of [m.TH,m.BOW].entries()){
    const x=124+i*875,col=i?p.green:p.gold;
    p.label(e.name,x,299,70,{family:'Serif'});
    p.label('pair occurrences',x,407,39,{color:p.dim});
    p.box(x,463,6*e.pair,39,col);
    p.mono(e.pair,x+6*e.pair+23,483,49,col);
    if(p.b>=2) {
      p.mono(String(e.pair),x+270,608,66,col,'center');
      p.line(x+39,663,x+500,663,p.rule);
      p.mono(e.a+' × '+e.b,x+270,730,64,p.ink,'center');
    }
    if(scored) p.mono('= '+approx(e.score),x+270,844,66,col,'center');
  }
  if(p.b===1) p.note('How often do the pieces meet, given how common each one is?');
  if(p.b===5) p.note('rain + ##bow   ·   about '+Math.round(m.PROXY_RATIO)+' times the association score',950,p.green);
}

export function wordpiece(p) {
  const local=p.b-3;
  if(local>=0 && local<rainbow.beats.length) {
    rainbow.draw(p.ctx,{...p.clock,index:local});
    return;
  }
  const success=p.b<=2;
  p.title(success?'Find the longest prefix':'What reaches the model?', 'BERT-style WordPiece');
  const n=success?(p.b===1?0:p.cue(2,'Rain? Yes')>.5?4:0):m.TRAP_PASS.stuckAt;
  const parts=n?['rainbow'.slice(0,n),'rainbow'.slice(n)]:['rainbow'];
  p.sorts(parts,230,392,208,{height:160,size:110,faces:n?[p.light,success?p.face:p.rose]:[p.face]});
  if(p.b===1) {
    p.mono('Rainbow!    →    rainbow    !',960,680,65,p.ink,'center');
    p.note('Example with lowercasing and punctuation splitting');
  } else if(p.b===2) {
    const attempts=m.FIRST_PASS.attempts;
    const trial=p.cue(2,'Bow is there')>.1?4:n?3:p.cue(2,'R A I N B')>.1?2:p.cue(2,'Rainbo')>.1?1:0;
    const match=attempts[trial];
    p.mono(match.candidate+'   '+(match.found?'✓':'×'),960,684,87,match.found?p.green:p.red,'center');
    p.note('Vocabulary     rain      ##bow');
  } else {
    p.brace(232,1684,583,34,p.red);
    p.mono(m.TRAP_PASS.pieces[0],960,721,101,p.red,'center');
    p.note('A failed continuation discards the entire partial match.');
  }
}

