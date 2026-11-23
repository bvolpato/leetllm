import {m,stripWidths,langRatios,langWindow,cellsPerEnglishPassage,rare,special,ordinary,ordinaryIds,specialId,bracketed,windowParts,snowball,snowPaths,output,hidden,stale,fixed,otherMax,decode,codeAudit} from './examples.mjs';
import { mix, clamp } from './press.mjs';

export function economics(p) {
  if(p.b<=3) {
    p.title('What do the vocabulary weights cost?', 'Vocabulary weights');
    const choices=[32000,128000,...(p.b===3?[1000000]:[])];
    const opened=p.cue(1,'Double it if the output table is separate',0);
    p.mono('rows  ×  4,096 values  ×  2 bytes  ×  '+(opened?'2 tables':'1 table'),125,276,55);
    const max=m.mebibytes(choices.at(-1));
    choices.forEach((v,i)=>{
      const y=387+i*135, amount=m.mebibytes(v);
      p.mono(v.toLocaleString('en-US')+' rows',120,y+34,50);
      const w=789*amount/max;
      p.box(639,y,w/2,67,p.green);
      p.box(639+w/2,y,w/2*opened,67,p.gold);
      p.mono((opened?amount:amount/2).toLocaleString('en-US')+' MiB',1787,y+34,46,p.ink,'right',267);
    });
    p.label('Input table',644,806,45,{color:p.green});
    p.fade(opened,()=>p.label('Untied output table',1060,806,45,{color:p.gold}));
    p.note(p.b===1?'Each additional row has the same width.':p.b===2?'32,000 → 128,000 rows adds 1,500 MiB.':'The million-row dictionary uses 16.384 GB for these weights.',918);
    return;
  }
  const measured=p.b>=6;
  const rates=measured?[3.17,3.94]:[3,4], remaining=rates[0]/rates[1];
  const names=measured?['Llama 2','Llama 3']:['Before','After'];
  p.title('How much shorter is the prompt?', measured?'Published English sample':'Fixed text');
  p.label('Characters per token',112,254,40,{color:p.dim});
  p.label('Positions for the same text',890,254,40,{color:p.dim});
  rates.forEach((rate,i)=>{
    const y=357+i*172;
    p.label(names[i],115,y+32,52,{family:'Serif'});
    p.mono(rate.toFixed(measured?2:0),536,y+32,67);
    p.box(894,y,665*(i?remaining:1),66,i?p.green:p.rule);
    p.mono((i?100*remaining:100).toFixed(measured?1:0)+'%',1795,y+31,55,p.ink,'right');
  });
  if(measured) {
    p.mono('1 − (3.17 / 3.94)²  ≈  '+Math.round(100*(1-remaining**2))+'%',119,735,61);
    p.label('fewer dense attention cells',1164,735,45,{color:p.dim});
    p.note(p.b===8?'28,000 added multilingual tokens left English cuts unchanged.':'Measure rates on representative text before pricing a larger vocabulary.',908);
  } else {
    p.mono('12 characters    /    3 or 4    =    '+stripWidths.join(' or ')+' positions',116,754,55);
    p.note('A third more characters per token saves a quarter of the positions.');
  }
}

export function fertility(p) {
  p.title('One passage, different token bills', 'Translations in a 2023 study');
  p.label('Tokens relative to the English translation',110,251,43,{color:p.dim});
  const names=['English','Shan','Italian'];
  names.forEach((name,i)=>{
    const y=333+i*119, value=langRatios[name];
    const show=i===0?1:i===1?p.cue(2,'fifteen times'):p.cue(3,'Italian needed');
    p.label(name,112,y+25,53,{family:'Serif'});
    p.line(469,y+55,1702,y+55,p.rule,2);
    p.fade(show,()=>{
      p.box(469,y,80*value,52,[p.rule,p.gold,p.green][i]);
      p.mono(value+'×',1790,y+25,49,p.ink,'right');
    });
  });
  if(p.b<4) p.note('Same content translated into each language. Counts depend on the tokenizer.');
  else {
    const fill=p.cue(4,'fills all thirty',1.1), used=Math.round(mix(cellsPerEnglishPassage,langWindow,fill));
    for(let i=0;i<langWindow;i++) p.box(116+i*55,783,51,71,i<used?(fill>.02?p.gold:p.green):p.edge,2);
    p.label('Illustrative window    '+used+' of '+langWindow+' positions',116,911,53);
  }
}

function numeral(p,value,cuts,y,color) {
  const x=511,unit=159;
  [...value].forEach((digit,i)=>p.mono(digit,x+(i+.5)*unit,y,98,i===value.length-1?p.gold:p.ink,'center'));
  let start=0;
  cuts.forEach(piece=>{
    const end=start+piece.length;
    p.brace(x+start*unit+8,x+end*unit-8,y+73,25,color);
    start=end;
  });
}
export function numbers(p) {
  const digit=p.cue(2,'single digits')>.3, grouped=p.cue(2,'groups digits from the left')>.3;
  p.title('Where do the digits separate?', grouped?'Up to three per span':digit?'Single-digit spans':'Illustrative learned pieces');
  [m.NUMBER,m.NUMBER_B].forEach((n,i)=>{
    const y=376+i*251;
    p.label(i?'Value B':'Value A',150,y,52,{color:p.dim});
    numeral(p,n,grouped?n.match(/\d{1,3}/g):digit?[...n]:m.LEARNED_CUTS[i],y,i?p.gold:p.green);
  });
  p.note(grouped?'BPE may split each three-digit span further.':digit?'Every digit has its own span.':'Changing the last digit can change an earlier boundary.');
}

export function codePieces(p) {
  if(p.b===3){
    p.title('Which string uses the most tokens?', 'Article measurement  /  cl100k_base');
    p.label('Input',118,260,43,{color:p.dim});
    p.label('Characters',731,260,43,{color:p.dim});
    p.label('Token positions',1139,260,43,{color:p.dim});
    codeAudit.forEach(({name,text,tokens},i)=>{
      const y=345+i*146;
      p.label(name,119,y,54,{family:'Serif'});
      p.mono(text.length,794,y,55);
      p.box(1144,y-20,tokens*13,40,i===2?p.gold:p.green);
      p.mono(tokens,1738,y,51,p.ink,'right');
      if(i===2) p.mono(text.slice(0,28)+'…',120,y+76,38,p.dim);
    });
    p.note('Measure the exact strings in a representative code request.',923);
    return;
  }
  if(p.b===1) {
    const grouped=p.cue(1,'learned a four space piece')>.5;
    p.title('Indentation occupies positions', 'A Python line at depth four');
    const n=grouped?4:16;
    for(let row=0;row<4;row++) {
      const y=289+row*103;
      for(let i=0;i<(row+1)*4;i++) {
        p.box(143+i*59,y,grouped&&i%4<3?59:55,66,row===3?p.light:p.edge,2);
        p.mono('·',171+i*59,y+35,39,p.dim,'center');
      }
      p.mono(['if active:','for row in rows:','if row.ready:','return total'][row],173+(row+1)*4*59,y+34,48);
    }
    p.brace(145,1083,693,29,p.green);
    p.mono('16 leading spaces   →   '+n+' tokens',150,792,65);
    p.note(grouped?'Four space runs save 75% on this indentation.':'Here each single space uses one token.',927);
  } else {
    const measured=p.cue(2,'A second tokenizer')>.4;
    p.title('The capital C changes the match', 'Code identifiers');
    p.label('tokenCount',957,343,127,{family:'Mono',align:'center'});
    p.label('Article mini-BPE',134,545,49,{color:p.dim});
    p.sorts(m.CAMEL,596,483,103,{height:117,size:69,faces:[p.light,p.rose,p.face,p.face,p.face]});
    if(measured){
      p.label('cl100k_base',137,752,49,{color:p.dim});
      p.mono('2 tokens',598,751,75,p.green);
    }
    p.note('Measure the identifiers and indentation your tokenizer will actually see.',920);
  }
}

export function glitches(p) {
  p.title('Was this token undertrained?', 'Invented corpus and coordinates');
  p.label('Vocabulary entry',123,258,42,{color:p.dim});
  p.label('Training occurrences',731,258,41,{color:p.dim});
  const more=p.cue(2,'compare its vector',.85);
  const observed=p.cue(1,'barely appear',.9);
  rare.forEach(([word,n],i)=>{
    const y=335+i*78, selected=i===4, color=selected?p.red:p.green;
    p.mono(word,124,y,43,color);
    p.fade(observed,()=>{
      p.box(755,y-14,n*3.35,28,color);
      p.mono(n,1212,y,42,color,'right');
    });
  });
  if(more>0){
    const ox=1531,oy=521,k=222;
    p.line(1308,oy,1771,oy,p.rule,3);p.line(ox,283,ox,762,p.rule,3);
    for (const [i,[,,[x,y]]] of rare.entries()) p.circle(ox+x*k*more,oy-y*k*more,i===4?15:10,i===4?p.red:p.green);
    p.label('First two weights',1540,805,38,{align:'center',color:p.dim});
    p.note('Counts, neighboring vectors and repeated prompts test the hypothesis.',929);
  } else p.note(p.b===2?'The reply says “banana.” Which observation could explain it?':'A vocabulary entry can be rare in model training.');
}

export function requests(p) {
  const b=p.b;
  p.title(b<3?'Which IDs enter the conversation?':'Does the whole request fit?', b<3?'Chat template':'Seven-position window');
  if(b===1) {
    p.label('Template control',125,342,45,{color:p.dim});
    p.label('Ordinary user text',125,599,45,{color:p.dim});
    [343,601].forEach(y=>p.fixedText(special,563,y,49,76));
    p.mono('ID '+specialId,1215,348,74,p.green);
    ordinary.forEach((piece,i)=>{
      const x=1090+i*139;
      p.slug(x,541,132,92,piece,{size:54});
      p.mono(ordinaryIds[i],x+65,703,49,p.dim,'center');
    });
    p.note('One spelling takes two paths in this example encoder.');
  } else if(b===2) {
    bracketed.forEach(({parts,ids},i)=>{
      const y=324+i*278;
      p.mono(parts.join(''),118,y,64);
      let x=124;
      for(const id of ids) {
        p.slug(x,y+58,115,79,id,{size:46,face:i?p.pale:p.light}); x+=131;
      }
    });
    p.note('The roles are the same. The serialized characters select different IDs.',922);
  } else {
    const showMore=p.cue(3,'three positions for system')>.5;
    const all=p.cue(4,'The reply marker',0);
    const x=132,unit=207;
    p.label('Formatted positions',132,319,43,{color:p.dim});
    for(let i=0;i<7;i++){
      p.box(x+i*unit,424,unit-7,175,p.edge,3);
      p.mono(i+1,x+(i+.5)*unit,672,47,p.dim,'center');
    }
    p.line(x+7*unit-3,349,x+7*unit-3,729,p.red,7);
    p.label('limit',x+7*unit-3,784,41,{align:'center',color:p.red});
    const parts=showMore?windowParts.slice(0,all?8:7):['rain','y'];
    parts.forEach((v,i)=>{
      const fill=v==='reply'?p.rose:['rain','y'].includes(v)?p.light:p.pale;
      p.slug(x+i*unit,445,unit-11,119,v,{size:54,face:fill});
    });
    p.note(all?'8 positions required. The reply marker is outside the window.':showMore?'The template still needs one position to start the reply.':'rainy alone needs two positions.',916,all?p.red:p.ink);
  }
}

export function practice(p) {
  const b=p.b;
  if(b<=2) {
    const counted=p.cue(2,'O W appears',0);
    const solved=p.cue(2,'Nine positions disappear',0);
    const step=m.SNOW[solved];
    p.title('Which pair merges first?', 'Practice  /  BPE');
    step.words.forEach(({pieces,count},i)=>{
      p.mono('× '+count,149,349+i*153,67,p.dim);
      p.sorts(pieces,398,294+i*153,164,{height:99,size:71,faces:pieces.map(v=>v==='ow'?p.light:p.face)});
    });
    if(solved) p.mono('ow × '+step.merged.count,1390,498,66,p.green);
    const remaining=p.b===2 && p.clock.elapsed>=p.clock.speechDuration;
    let caption='Count neighboring pairs across all nine words.';
    if(counted) caption=m.SNOW[0].positions+' weighted positions';
    if(solved) caption='Nine occurrences merge.';
    if(remaining) caption=m.SNOW[0].positions+' − '+step.merged.count+' = '+step.positions+' weighted positions';
    p.note(caption);
  } else if(b<=4) {
    const solved=p.cue(4,'and nothing can finish',0), dead=b===4 && p.clock.elapsed>=p.clock.speechDuration;
    p.title('What happens to snowball?', 'Practice  /  WordPiece');
    p.mono('snow     ##ball     snowb',960,303,61,p.dim,'center');
    const parts=solved?['snowball'.slice(0,snowball.stuckAt),'snowball'.slice(snowball.stuckAt)]:['snowball'];
    p.sorts(parts,208,429,186,{height:139,size:91,faces:solved?[p.light,p.rose]:[p.face]});
    if(dead){
      p.brace(208,1685,594,33,p.red);
      p.mono(snowball.pieces[0],950,755,96,p.red,'center');
    }
    p.note(dead?'The missing continuation discards snowb too.':'Find the longest matching prefix, then inspect the remaining letters.');
  } else {
    const product=p.cue(6,'and that beats',0), solved=p.cue(6,'The path with fewer pieces',0);
    p.title('Which path has the higher probability?', 'Practice  /  Unigram');
    [['▁snow'],['▁','snow']].forEach((parts,i)=>{
      const y=315+i*228;
      p.sorts(parts,166,y,177,{size:70,height:115,faces:parts.map(()=>i&&solved?p.light:p.face)});
      p.mono(i?'0.25 × 0.40':'0.05',1190,y+54,66);
      if(i&&product) p.mono('= '+snowPaths[i].toFixed(2),1190,y+148,61,solved?p.green:p.ink);
    });
    p.note(solved?'The two-piece route wins.':'Score each complete segmentation before choosing.');
  }
}

export function outputPress(p) {
  const b=p.b, swapping=p.cue(6,'Swap the two output weight rows',1.35);
  const printed=p.cue(5,'Row five still wins',0);
  const again=p.cue(6,"That's the piece",0);
  const slots=[fixed.id,stale.id], ys=[428,624];
  p.title('What will the model write?', 'Greedy decoding');
  if(b===1){
    p.label('Replacement dictionary',126,267,49,{color:p.dim});
    p.label('Repaired input lookup',950,267,49,{color:p.dim});
    slots.forEach((id,i)=>{
      const word=decode(id,m.IDS_B),y=ys[i];
      p.slug(134,y-67,420,120,word,{size:73});
      p.mono('ID '+id,633,y,71,p.green);
      p.line(834,y,957,y,p.green,5);
      const row=m.TABLE[m.IDS_A[word]];
      p.slug(981,y-67,712,120,'[ '+row.map(v=>v.toFixed(1)).join('  ')+' ]',{size:61,face:p.light});
    });
    p.note('The input swap restores the vector for each piece.',899);
    return;
  }
  p.label('Fixed hidden vector',111,255,39,{color:p.dim});
  p.mono('[ '+hidden.join('  ')+' ]',111,350,68,p.green);
  p.label('Output weights',643,254,39,{color:p.dim});
  p.label('ID',1323,254,39,{color:p.dim});
  p.label('Replacement dictionary',1430,254,39,{color:p.dim,max:385});
  slots.forEach((id,i)=>{
    p.box(596,ys[i]-72,644,142,p.edge,6);
    p.mono(id,1346,ys[i],79,p.ink,'center');
    const engaged = (id===stale.id && printed && swapping===0) || (id===fixed.id && again);
    p.line(1397,ys[i],1441,ys[i],engaged?p.green:p.rule,engaged?8:4);
    p.label(decode(id,m.IDS_B),1490,ys[i],75,{family:'Serif',color:engaged?p.green:p.ink});
  });
  slots.forEach((id,i)=>{
    const side=Math.min(clamp(swapping*4),clamp((1-swapping)*4));
    const y=mix(ys[i],ys[1-i],clamp((swapping-.25)*2));
    const width=mix(591,282,side);
    const center=916+side*(i?-165:165), x=center-width/2;
    const win=stale.scores[id]===stale.score;
    const routed=printed && (swapping===0 || again);
    p.slug(x,y-65,width,120,'[ '+output[id].map(n=>n.toFixed(1)).join('  ')+' ]',{size:50,face:routed&&win?p.pale:p.face});
    if(b>=3) p.mono('score '+stale.scores[id].toFixed(1),center,y+88,38,printed&&win?p.gold:p.dim,'center');
  });
  if(b>=3) {
    p.label('Best other score',110,500,40,{color:p.dim});
    p.mono(otherMax.toFixed(1),110,577,78);
  }
  const printedWord=(s)=>s.piece.replace('·','');
  if(b<5) {
    p.note(b===1?'The replacement now reads the original input vectors.':b===2?'Score every row with the same hidden vector.':'Follow the largest score to the piece it will print.',916);
  } else {
    p.box(112,775,1701,199,'#dbcaad',5);
    p.box(112,771,1694,194,'#fff9ea',4);
    for(let x=132;x<1795;x+=45) p.circle(x,788,5,p.edge);
    p.fade(printed,()=>{
      p.label('Before the swap',126,843,35,{color:p.dim});
      p.label(printedWord(stale),428,897,94,{family:'Serif',color:p.red});
      p.mono('ID '+stale.id,128,924,48,p.dim);
    });
    p.fade(again,()=>{
      p.label('After the swap',1038,843,35,{color:p.dim});
      p.label(printedWord(fixed),1375,mix(860,897,again),94,{family:'Serif',color:p.green});
      p.mono('ID '+fixed.id,1040,924,48,p.dim);
    });
  }
}

