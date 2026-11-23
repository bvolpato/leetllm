import { C, cue, ease } from './bench.mjs';
import { citation, sources, hash, shortRule, rule, chunkPage, chunks, overlapText, sections, editions, pageDiff, sectionDiff, followingRelease, patchPages, vectorPack } from './evidence.mjs';

export function provenance(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<4?'Follow the citation to its page':b===4?'Same words, different sources':'Which bytes survive normalization?',
    b<4?'Citation desk   /   release runbook':b===4?'Citation desk   /   three source documents':'Citation desk   /   Handbook.md');
  if(b<4) {
    const follow=cue(k,0,'Follow the citation',1.15);
    const repair=cue(k,1,'Point the link at the immutable revision seven file',1.1);
    const target=repair===1?7:6;
    const data=citation(target);
    a.paper(44,146,363,284,'Reviewed extract    ·    r7 / p.7',C.mist);
    a.para(data.text,65,237,319,23,31);
    a.mono('SHA-256   '+data.textHash.slice(0,12)+'…',65,357,15,C.navy);
    if(cue(k,0,'text hash matches',.4)===1)a.mono('Text hash matches',65,391,16,C.forest);
    const left=544;
    a.paper(left+10,139,353,293,'',C.edge);
    a.paper(left,147,353,288,follow===1?'Opened source    ·    p.7':'Source file');
    if(follow===1) {
      a.serif('Revision '+data.opened.rev,left+21,238,37,C.ink);
      a.para(data.opened.text,left+21,288,308,22,30);
      if(b>=2)a.mono('File SHA   '+data.opened.rawHash.slice(0,10)+'…',left+21,402,15,C.gray);
    } else a.para('Open page 7',left+23,300,290,30,36,C.gray);
    if(repair===0) a.wire([[408,327],[459,327],[459,246],[542,246]],follow,C.gold);
    else a.wire([[408,327],[477,327],[477,227],[542,227]],repair,data.matches?C.green:C.gold);
    if(b===1 && repair===1)a.label('Bound to the immutable r7 file',541,482,365);
    if(b===2)a.label('Compare both hashes with their own inputs.',52,476,828);
    if(b===3) {
      a.mono('Parser 2.4 · layout',47,467,14,C.dim);
      a.mono('Quote → page access',357,467,15,C.green);
      a.mono('Alert → tool permission',641,467,15,C.gold);
    }
  } else if(b===4) {
    a.paper(51,141,860,100,'Normalized prose');
    a.serif(shortRule,73,212,24,C.ink,807);
    sources.forEach(([file,loc],i)=>{
      const y=276+i*67;
      a.serif(file,75,y+24,24,C.paper);
      a.mono(loc,372,y+22,20,C.gold);
      a.mono(hash(shortRule).slice(0,10)+'…',653,y+22,20,C.dim);
      a.path([[69,y+42],[892,y+42]],C.line);
    });
  } else {
    a.paper(57,147,491,318,'Markdown source slice');
    sections[2].text.trimEnd().split('\n').forEach((s,i)=>a.mono(s,76,226+i*43,18,C.ink,450));
    a.label('Preserve',588,183,275);
    ['Fence marks','Leading indentation','Trailing spaces'].forEach((v,i)=>a.serif(v,587,236+i*52,25,C.paper,312));
    a.mono('CRLF → LF',588,427,19,C.gold);
  }
}

export function chunking(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<2?'Where do the passages overlap?':b===2?'A cut can leave the exception behind':'Cut at the source boundary','Chunking   /   traceable passages');
  if(b<2) {
    const copied=cue(k,0,'Take the rollback sentence',.7);
    const overlap=cue(k,1,'ID requirement',.8);
    const follow=cue(k,1,'Follow the first chunk’s locator',.8);
    const locator=page=>page.file+' · r'+page.rev+' / p.'+page.page+' · '+page.heading;
    a.paper(47,138,868,142,locator(chunkPage));
    const [rollback, archive]=chunkPage.passage.split('\n');
    a.serif(rollback,68,220,23,C.ink,823);
    a.serif(archive,68,256,20,C.gray,823);
    if(copied>0) {
      a.paper(49,318,421,154,'Chunk A · '+locator(chunks[0].source),C.mist);
      const prefix=chunks[0].text.slice(0,-overlapText.length).trimEnd();
      const y=a.para(prefix,68,390,315,21,27)+27;
      a.serif(overlapText,68,y,21,overlap>0?C.forest:C.ink);
      if(follow>0) {
        a.wire([[216,317],[216,282]],follow,C.copper);
        if(follow===1)a.register(62,193,838,36,C.copper);
      }
    }
    if(overlap>0) {
      a.paper(489,318,425,154,'Chunk B · '+locator(chunks[1].source),C.mist);
      a.serif(overlapText,508,390,21,C.forest);
      a.para(chunks[1].text.slice(overlapText.length).trimStart(),508,417,308,21,27);
      a.wire([[696,282],[696,316]],overlap);
    }
  } else if(b===2) {
    a.paper(51,151,862,284,'Example variation    ·    rollback drill');
    a.serif(rule,74,236,25,C.ink,802);
    a.path([[73,266],[887,266]],C.copper,2,[7,6]);
    a.mono('Proposed cut',74,293,14,C.copper);
    a.serif('During a drill, notify the exercise lead instead.',75,363,26,C.ink,798);
    const link=cue(k,2,'Include the exception',.9);
    a.wire([[880,226],[893,226],[893,356],[879,356]],link,C.forest);
    if(link===1)a.label('Return rule and exception together',61,481,800);
  } else {
    a.paper(52,146,475,310,'Handbook.md    ·    lines 5–10');
    sections[2].text.trimEnd().split('\n').forEach((s,i)=>a.mono(s,70,220+i*40,18,C.ink,440));
    a.paper(556,146,354,310,chunkPage.file+'    ·    r'+chunkPage.rev);
    a.serif(chunkPage.heading,578,239,32);
    a.para(chunkPage.text,578,286,309,21,28);
    a.mono('Locator    page '+chunkPage.page,578,413,19,C.forest);
  }
}

export function versioning(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<2?'Which pages belong to the new edition?':b<4?'Move the paragraph. Keep its identity.':'Who can still read rollback?','Publication   /   one coherent revision');
  if(b<2) {
    for(let i=0;i<2;i++){
      const x=53+445*i;a.paper(x,143,405,287,'Release runbook    ·    revision '+(6+i));
      Object.entries(editions[i]).forEach(([page,s],j)=>{
        const y=231+j*72;a.mono('p.'+page,x+21,y,21,C.gray);
        a.serif(s,x+115,y,25,C.ink,269);
        a.path([[x+21,y+19],[x+383,y+19]],C.edge);
      });
    }
    if(b===1){
      const summary=['Added p.'+pageDiff.added,'Removed p.'+pageDiff.removed,'Changed p.'+pageDiff.changed];
      summary.forEach((s,i)=>a.label(s,72+i*292,478,270));
    }
  } else if(b<4) {
    const move=cue(k,2,'move it from page seven to page nine',1.5);
    a.mono('Stable section   release-runbook / rollback',55,158,20,C.gold);
    const x=65+430*ease(move);
    a.paper(55,203,386,175,'Old locator   /   page 7',C.edge);
    a.paper(513,203,389,175,'New locator   /   page 9',C.edge);
    a.paper(x,260,381,92,'');
    a.para(rule,x+16,294,350,19,25);
    if(b===3) {
      const published=cue(k,3,'switch the published version',.8);
      a.label(published===1?'Published edition   →   new':'Prepare complete edition',66,443,712);
      a.mono('rollback    same text    locator p.9',66,482,17,C.dim);
    }
  } else {
    const both=cue(k,5,'also changes to ten minutes',.6)===1;
    const newGrant=cue(k,5,'moves from ops to incident commanders',.6)===1;
    const revoke=cue(k,4,'owner removed the security group',.6)===1;
    const diff=both?followingRelease(newGrant):sectionDiff;
    a.paper(47,142,432,300,both?'Next release   /   rollback':'Section release   /   rollback');
    a.mono('Text',66,222,16);
    a.serif(both?'15 minutes → 10 minutes':'15 minutes → 15 minutes',66,258,23,C.ink,389);
    a.mono('Access',66,316,16);
    a.serif(both?(newGrant?'ops → incident commanders':'ops'):revoke?'ops + security → ops':'ops + security',66,350,23,C.ink,389);
    if(!both && cue(k,4,'must be denied',.4)===1)a.mono('Security reader  ·  denied',66,405,17,C.oxide);
    const labels=['Added','Removed','Text change','Access change'];
    Object.entries(diff).forEach(([field,list],i)=>{
      const y=185+i*73;
      a.mono(labels[i],513,y,15,C.dim);a.serif(field==='access'&&!revoke?'Compare grants':(list.join(', ')||'None'),666,y,23,C.paper,241);
      a.path([[513,y+21],[911,y+21]],C.line);
    });
  }
}

export function pageSearch(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<=5?'Where did each query word match?':'How large are this page’s vectors?','Visual retrieval   /   example patch scores');
  if(b<=5) {
    const split=cue(k,3,'try a time log',.55)===1;
    const page=patchPages[Number(split)];
    const scores=cue(k,1,'example dot products',.5)===1;
    const winners=split?cue(k,4,'different parts of the page',.5):cue(k,2,'policy line wins',.5);
    const sum=split?cue(k,4,'The sum is still',0):cue(k,2,'The page scores',0);
    a.paper(43,141,415,296,page.title+'    /    page patches');
    page.regions.forEach((s,i)=>{
      const y=185+i*77;
      if(winners===1 && page.winners.includes(i))a.rect(57,y+6,385,55,'#c6dfcc');
      a.mono(['Header',split?'Log entry':'Policy line','Footer'][i],67,y+25,13);
      a.serif(s,67,y+52,22,C.ink,373);
    });
    a.label('Query words',497,164,246);
    const xs=[649,750,855];
    ['Header',split?'Log':'Policy','Footer'].forEach((s,i)=>a.mono(s,xs[i],219,15,C.dim));
    page.scores.forEach((row,i)=>{
      const y=286+i*78;a.serif(['15','minutes'][i],500,y,23,C.white);
      if(scores)row.forEach((v,j)=>{
        const win=winners===1 && page.winners[i]===j;
        a.mono(v.toFixed(2),xs[j],y,22,win?C.green:C.paper);
        if(win)a.path([[xs[j],y+10],[xs[j]+49,y+10]],C.green,2.5);
      });
    });
    if(sum===1) {
      a.serif(page.maxima.map(v=>v.toFixed(2)).join(' + ')+' = '+page.score.toFixed(2),497,433,32,C.gold,400);
      if(split && cue(k,4,'gives you no such rule',.5)===1)a.label('No paging rule on this page',500,478,408);
    }
  } else {
    const v=vectorPack,side=216,cell=side/v.side;
    a.paper(47,141,304,334,'One page    /    patch grid');
    const grid=cue(k,6,'grid of thirty-two by thirty-two',1.1);
    const count=Math.floor(grid*v.side*v.side);
    for(let j=0;j<v.side;j++)for(let i=0;i<v.side;i++) {
      const drawn=j*v.side+i<count;
      a.rect(90+i*cell,207+j*cell,cell-1,cell-1,drawn?((i+j)%7===0?'#478086':'#39696d'):C.edge);
    }
    a.mono(v.side+' × '+v.side+' patches',89,454,17,C.gray);
    a.label('Vector payload',393,168,486);
    const tokens=cue(k,6,'six text vectors',.5)===1;
    a.serif(count.toLocaleString('en-US')+' image'+(tokens?'  +  '+v.text+' text':''),391,227,31,C.paper);
    if(cue(k,6,'two bytes apiece',.4)===1)a.mono(v.vectors.toLocaleString('en-US')+' × '+v.dims+' coordinates × '+v.bytes+' bytes',393,280,18,C.dim);
    if(cue(k,7,'That is the vector payload',.1)===1){
      a.path([[390,306],[882,306]],C.line);
      a.serif(v.kib+' KiB per page',390,365,42,C.gold);
      if(b===8)a.para('Measure recall, grounding, latency and total index size on your pages.',391,412,490,21,27,C.white);
      if(b===9)a.para('Encode query and page separately. Compare their vectors.',391,412,487,22,30,C.white);
    }
  }
}
