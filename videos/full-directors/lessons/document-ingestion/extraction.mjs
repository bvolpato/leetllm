import { firstFrameAt } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import { C, cue, ease, face, scanPlate, scanWindow, loupe } from './bench.mjs';
import { rule, archive, rows, assemble, crossed, comparison, columns, scrambled, reviewed, suspect, prefixed,
  mainText, html, htmlCases, sections, mdLines, quickstart, hash } from './evidence.mjs';

export function comparator(a,k) {
  const b=k.beat.beatIndex;
  const swap=cue(k,1,'switch to the saved text',.45);
  const back=cue(k,1,'Back to the page',.45);
  const again=cue(k,1,'Now the saved text again',.45);
  const saved=swap===1 && (back<1 || again===1);
  const retried=cue(k,2,'This time both lines survive',.55)===1;
  const hit=cue(k,2,'If search still returns',.6);
  const view= saved ? 'Saved extract' : 'Original page';
  const present=!saved || retried;
  a.base(retried?'Which handoff comes next?':'Where did the paging line disappear?','Release runbook   /   optical comparison');
  a.paper(47,148,548,310,'Release runbook    ·    revision 7    ·    page 7');
  a.rect(43,125,154,26,C.edge);a.mono('Comparator',55,143,13);
  a.mono(view,68,214,15,saved?C.navy:C.copper);
  if(b>0)a.register(67,228,506,87,C.copper);
  if(present) {
    a.serif(rows[0][0]+':',81,258,22);
    a.text(rule.slice(rows[0][0].length+2),81,289,18);
  }
  a.path([[67,332],[574,332]],C.edge);
  a.serif(rows[1][0]+':',81,368,22);
  a.text(archive.slice(rows[1][0].length+2),81,401,18);
  a.path([[43,402],[72,402]],C.copper,2);a.path([[565,402],[598,402]],C.copper,2);
  // The lever selects the exposure. Both plates use the same registration marks.
  a.mono('PAGE',114,487,14,C.dim);a.mono('EXTRACT',406,487,14,C.dim);
  a.path([[175,482],[392,482]],C.line,7);
  a.circle(175+217*(swap-back+again),482,9,C.gold);
  a.label(b < 2 ? 'Question from pay-742' : retried ? 'Second extraction' : 'Returned passage',630,154,285);
  if(b<2) {
    a.para('When do I page on-call after a failed rollback?',630,195,280,27,33,C.white);
    a.mono('Assistant cites p. 7',630,319,15,C.dim);
    a.para('“Archive it within fourteen days.”',630,356,265,24,32,C.paper);
  } else {
    a.wire([[601,366],[614,366],[614,203],[645,203]],retried?hit:1);
    if(!retried || hit===1) {
      a.paper(654,181,259,151,'Search result   /   p.7',C.mist);
      a.para(archive,672,250,226,21,27);
    } else a.label('Run search again',654,236,255);
    if(b===3) a.para('Compare the indexed chunk with this passage.',638,389,265,22,30,C.gold);
  }
}

const routes=['Positioned text','OCR candidate','Main content','Heading tokens'];
function swatch(a,i,x,y,w,h) {
  a.paper(x,y,w,h,['runbook.pdf','Photograph','Docs HTML','Quickstart.md'][i]);
  if(i===0) {
    ['Rollback failure:', 'page on-call within', '15 minutes', 'with deploy ID.'].forEach((s,j)=>{
      a.serif(s,x+18+(j===2?16:0),y+68+28*j,18,C.ink,w-36);
      a.path([[x+15,y+72+28*j],[x+w-15,y+72+28*j]],C.edge,1,[1,5]);
    });
  } else if(i===1) {
    a.c.save();a.c.translate(x+16,y+75);a.c.rotate(-.042);
    a.c.drawImage(scanPlate('15'),0,0,w-30,72);a.c.restore();
  } else if(i===2) {
    a.rect(x+15,y+54,w-30,25,C.edge);a.mono('nav   Archive',x+21,y+71,12);
    a.mono('<main>',x+16,y+111,15,C.copper);
    a.serif('Page within 15 min',x+21,y+141,17,C.ink,w-39);
  } else {
    quickstart.forEach((s,j)=>a.mono(s,x+14,y+71+j*26,15,j===0?C.copper:C.ink,w-28));
  }
}
export function adapters(a,k) {
  const b=k.beat.beatIndex;
  a.base(b===3?'One record for a reviewed extract':'How was the rule put on the page?','Source inspection   /   four adapters');
  if(b<3) {
    const gates=[cue(k,2,'reconstruct the reading order'),cue(k,2,'optical character recognition'),cue(k,2,'find the main content'),cue(k,2,'keep the heading')];
    const inspecting = b===0 ? (cue(k,0,'A web page')>0?2:cue(k,0,'A photographed note')>0?1:0) : 3;
    for(let i=0;i<4;i++){
      const x=40+i*224;
      swatch(a,i,x,178,204,174);
      if(gates[i]>0){
        a.wire([[x+102,353],[x+102,402]],gates[i]);
        if(gates[i]===1)a.text(routes[i],x+102,441,21,C.paper,'Serif',400,206,'center');
      } else if(b<2 && i===inspecting) {
        a.register(x-5,173,214,183,C.gold);
        a.label(['Glyph positions','Retained pixels','Page shell','Fence marks'][i],x+8,389,190);
      }
    }
  } else {
    swatch(a,0,48,186,224,190);a.wire([[272,277],[348,277]],cue(k,3,'This one names the PDF'));
    a.paper(350,137,566,330,'Evidence record   /   PDF');
    a.serif('runbook.pdf',374,216,32);
    a.mono('revision 7     page 7',376,248,18,C.gray);
    a.para(rule,375,288,501,22,28);
    if(cue(k,3,'which parser produced it')>0) a.mono('native-pdf     reviewed',376,388,18,C.forest);
    if(cue(k,3,'a checksum')>0) a.mono('SHA-256   '+hash(rule).slice(0,12)+'…',376,426,17);
  }
}

export function pdf(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<2?'Two columns, two reading orders':b<5?'What lies beneath the page?':'Which repeated line can be removed?','PDF inspection   /   native text');
  if(b<2) {
    a.paper(46,139,524,250,'Page 3   /   native layout');
    const horizontal=cue(k,0,'read straight across',1.4);
    const x=[75,321],ys=[238,290,342];
    columns.forEach((col,i)=>col.forEach((v,j)=>a.serif(v,x[i],ys[j],19,C.ink,226)));
    const vertical=[[61,224],[61,329]];
    if(horizontal<1) a.wire(vertical,1-horizontal,C.copper);
    if(horizontal>0) for(const y of ys)a.wire([[74,y+9],[500,y+9]],horizontal,C.copper);
    if(horizontal===1) {
      a.label('Saved reading order',601,168,300);
      scrambled.forEach((line,i)=>a.para(line,601,222+i*75,310,19,24,C.white));
    } else if(horizontal>0) {
      a.label('Read across both columns',601,168,300);
    } else {
      a.label('Read the source column',601,168,300);
      a.para('Follow the rollback column down the page.',601,228,296,23,32,C.paper);
    }
    const counts=cue(k,0,'returned sixty-four',.7);
    comparison.forEach((s,i)=>{
      const x=53+i*292;
      a.paper(x,414,55,69,'');
      if(i!==1) for(let row=0;row<3;row++) {
        a.rect(x+7,430+row*11,i===0?40:17,2,C.gray);
        if(i===2)a.rect(x+31,430+row*11,17,2,C.gray);
      }
      a.mono('Page '+(i+1),x+70,441,16,C.dim);
      if(counts===1)a.mono(s.length+' characters',x+70,472,17,C.paper);
    });
  } else if(b<5) {
    const damaged=b===3, short=b===4;
    if(short) {
      a.paper(73,153,381,260,'Short native note');
      a.serif('Done',108,297,59);
      a.wire([[455,278],[537,278]]);
      a.mono('4 characters',560,240,22,C.gold);
      a.para('Read the note on the page. All four letters survived.',560,302,330,25,36,C.white);
    } else {
      const pictures=damaged?['Copyable OCR layer','Damaged encoding','Tagged PDF']:['Blank page','Photographed rule','Visible native text'];
      const subs=damaged?['1S minutes','Runb�ok','Left column first']:['','15 minutes','Page on-call'];
      const decisions=damaged?['Compare with pixels','Hold for review','Verify tag order']:['Keep blank outcome','OCR, then review','Inspect extractor'];
      pictures.forEach((name,i)=>{
        const x=40+300*i;a.paper(x,153,275,190,name);
        if(!damaged && i===1)a.c.drawImage(scanPlate('15'),x+13,227,249,87);
        else a.serif(subs[i],x+19,263,30,C.ink,236);
        a.wire([[x+136,345],[x+136,382]],1);
        a.label(decisions[i],x+17,419,244);
      });
    }
  } else {
    const stripped=cue(k,5,'match the exact header',.7);
    a.paper(60,139,508,330,'Header sample    ·    page 7');
    const lines=['PLATFORM RUNBOOK | INTERNAL','Stop if verification fails.',rule.split(': ')[0]+':',rule.split(': ')[1],'Page 7'];
    lines.forEach((s,i)=>a.text(s,87,223+i*47,20,i===0?C.gray:C.ink,i===0?'Mono':'Serif',400,455));
    if(stripped>0)a.path([[85,216],[85+448*stripped,216]],C.oxide,2.5);
    a.label('Fixture thresholds',606,172,293);
    a.mono('30 chars   route',606,217,19,C.paper);a.mono('40 chars   rule check',606,252,19,C.paper);
    if(b===6) {
      a.para('Safety warning stays in the text.',606,317,286,22,29,C.green);
      a.mono('Header sample · r1 / p.7',606,416,17,C.paper);
    }
  }
}

export function ocr(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<2?'Can this deadline enter search?':b<4?'Read the words around the match':'What should the reviewer inspect first?','Page 7   /   optical character recognition');
  if(b<2) {
    const corrected=cue(k,1,'Save a reviewed correction',.65)===1;
    a.paper(45,141,411,314,'Retained scan   /   p.7');
    a.serif('Rollback failure',66,224,25);
    a.text('Page on-call within',66,264,18);
    loupe(a,'15',67,292,cue(k,1,'Enlarge the same spot',1.1));
    a.text('with deploy ID.',66,416,21);
    a.paper(500,141,415,314,corrected?'Reviewed transcription':'OCR transcription',C.mist);
    if(!corrected && cue(k,1,'Hold the candidate for review',0))a.reviewStamp(915,141);
    a.serif('Rollback failure',522,224,25);
    a.text('Page on-call within',522,264,18);
    a.mono((corrected?rule:suspect).match(/within (\S+ minutes)/)[1],522,340,40,C.navy);
    a.text('with deploy ID.',522,416,21);
    if(corrected)a.mono('Original reading retained   1S',507,492,16,C.dim);
  } else if(b<4) {
    const prefix=cue(k,2,'Read the extra line',.5)>0;
    const held=cue(k,3,'Hold it',0)===1;
    const cleanPasses=cue(k,3,'The clean copy passes',.6)===1;
    const extras=cue(k,3,'An extra rollback rule',.6)>0;
    const candidate=extras?rule+' '+rule.replace('15','30'):prefixed;
    for(const [i,label] of ['Approved wording','New candidate'].entries()) {
      const x=45+i*447;a.paper(x,151,419,263,label);
      if(i && !extras)a.serif('Obsolete rule.',x+22,246,27,prefix?C.oxide:C.ink);
      a.para(rule,x+22,i && !extras?291:249,372,23,31);
      if(i && extras)a.para(rule.replace('15','30'),x+22,343,372,19,25,C.oxide);
      if(i && held && !reviewed(candidate,rule))a.reviewStamp(x+419,151);
      if(!i && cleanPasses)a.label('Whole sentence matches',x+15,464,386);
    }
  } else {
    a.paper(53,160,430,259,'Scan input   /   critical field');
    scanWindow(a,'15',79,237,372,112,b===5?1:.35);
    a.label(b===4?'Image preparation':'Review order',527,187,359);
    const labels=b===4?['Skew and contrast','Segmentation and resolution','300 DPI input target']:['Low confidence first','Check the complete rule','Blank page → verify empty'];
    labels.forEach((v,i)=>{a.path([[528,222+i*65],[898,222+i*65]],C.line);a.serif(v,530,258+i*65,23,C.paper,365);});
  }
}

export function table(a,k) {
  const b = k.beat.beatIndex;
  const afterClause = (beat, phrase) => b === beat
    ? firstFrameAt(k.elapsed) >= firstFrameAt(k.wordCue(phrase).end)
    : b > beat;
  const saved = cue(k, 0, 'read what the parser saved', .6) === 1;
  const findWindow = cue(k, 0, 'Follow it to the Window column', 1);
  const detour = cue(k, 1, 'Watch the path drop', 1.5);
  const rejoin = cue(k, 1, 'then jump back for the deploy ID', .85);
  const repair = cue(k, 1, 'read straight across the reviewed rollback row', 1.2);
  const move = cue(k, 3, 'Move down one row', .65);
  const readArchive = cue(k, 3, 'Follow the cells across again', 1.15);
  const reviewedRollback = afterClause(2, 'Page on-call within fifteen minutes with the deploy ID');
  const reviewedArchive = afterClause(3, 'There’s no required ID on this row');
  const showFields = cue(k, 2, 'Save the row and its column headers', .5) === 1;
  const showLocator = afterClause(3, 'A citation to table one, row two takes you back to those cells');

  const headers = ['Event', 'Action', 'Window', 'Required detail'];
  const positions = [75, 329, 542, 729];
  const widths = [234, 193, 164, 160];
  const firstY = 239, secondY = 291;
  const left = 66, windowLeft = 525, windowRight = 709, right = 890;
  const takingArchive = move > 0;
  const wrongWindow = detour === 1 && repair === 0;
  const rowTrace = takingArchive ? readArchive : repair;

  a.base('Which row supplied the window?','Release runbook   /   table 1');
  a.paper(46, 126, 870, 186, 'Release runbook    ·    page 7    ·    table 1');
  if (wrongWindow || rowTrace === 1) {
    const sourceWindowY = wrongWindow || takingArchive ? secondY : firstY;
    a.rect(windowLeft + 3, sourceWindowY - 34, windowRight - windowLeft - 6, 38,
      wrongWindow ? '#eed1bc' : C.mist);
  }
  a.path([[left, 248], [right, 248]], C.edge);
  headers.forEach((header, i) => a.mono(header, positions[i], 187, 17));
  rows.forEach((row, j) => row.forEach((value, i) => {
    a.serif(value, positions[i], (j === 0 ? firstY : secondY) - 8, 24, C.ink, widths[i]);
  }));

  if (!saved && findWindow > 0) {
    a.wire([[left, firstY], [windowLeft, firstY]], findWindow, C.copper);
  }
  if (detour > 0 && repair === 0) {
    a.wire([[left, firstY], [windowLeft, firstY], [windowLeft, secondY], [windowRight, secondY]], detour, C.oxide);
    if (rejoin > 0) a.wire([[windowRight, secondY], [windowRight, firstY], [right, firstY]], rejoin, C.oxide);
  }
  if (repair > 0 && !takingArchive) {
    a.wire([[left, firstY], [right, firstY]], repair, C.forest);
  }
  if (takingArchive) {
    if (readArchive > 0) a.wire([[left, secondY], [right, secondY]], readArchive, C.forest);
    else a.wire([[left, firstY], [left, secondY]], move, C.forest);
  }

  if (!saved) return;
  const rowIndex = reviewedArchive ? 1 : 0;
  const cells = reviewedRollback ? rows[rowIndex] : crossed;
  const sentence = assemble(cells);
  const outputLabel = reviewedRollback ? `Reviewed row ${rowIndex + 1}` : 'Saved parser output';
  a.mono(outputLabel, left, 347, 17, C.dim);
  if (showLocator) a.mono('p.7 · table 1 · row 2 · Window', 583, 347, 16, C.green);
  if (detour === 1) {
    const window = cells[2];
    a.c.font = face(26, 'Serif');
    const start = left + a.c.measureText(sentence.slice(0, sentence.indexOf(window))).width;
    a.rect(start - 2, 358, a.c.measureText(window).width + 4, 29, reviewedRollback ? C.forest : C.oxide);
  }
  a.serif(sentence, left, 381, 26, C.paper);

  if (showFields) {
    a.paper(46, 400, 870, 64, '', C.mist);
    headers.forEach((header, i) => {
      a.mono(header, positions[i], 422, 17);
      a.serif(cells[i], positions[i], 448, 22, i === 2 ? C.forest : C.ink, widths[i]);
    });
  }
}

export function webPage(a,k) {
  const b=k.beat.beatIndex;
  a.base(b<2?'A tag inside a number':b===2?'Five static pages through one adapter':b===3?'Where do spaces carry meaning?':'What can the document authorize?','HTML   /   main-content extraction');
  if(b<2) {
    a.paper(44,139,872,147,'HTML source');
    a.mono('<nav>Archive in 14 days.</nav>',67,213,19,b?C.gray:C.ink);
    a.mono('<main><p>Rollback failure.</p><p>Page within 1<strong>5</strong> minutes.</p></main>',67,255,17,C.ink,818);
    const join=cue(k,0,'Join those two characters',.85);
    a.text('1',85,400,68,C.white,'Mono');
    a.text('5',191-65*join,400,68,C.gold,'Mono',700);
    a.mono(join===1?'Inline text':'Inline boundary',71,441,15,C.dim);
    const space=cue(k,0,'insert a space',.4);
    a.label('Main text',310,343,260);
    if(space===1)a.para(mainText(html),310,390,550,29,39,C.paper);
    if(b===1)a.path([[67,207],[390,207]],C.oxide,3);
  } else if(b===2) {
    const names=['Inline digits','Paragraph boundary','Navigation outside main','Missing main','Empty main'];
    htmlCases.forEach((v,i)=>{
      const y=151+i*65; a.mono(names[i],52,y+25,18,C.dim);
      const out=mainText(v);
      a.ruleLine(out??'Review required',346,y,562,out?C.mist:'#f0cabb');
    });
  } else if(b===3) {
    a.paper(48,151,439,264,'Preformatted block');
    a.mono('<pre>',67,227,18,C.copper);
    a.mono('if ready:',67,269,22,C.ink);
    a.mono('    record_id()',67,311,22,C.ink);
    a.mono('</pre>',67,358,18,C.copper);
    a.label('A prose flattener would produce',527,193,379);
    a.para('if ready: record_id()',526,256,360,26,34,C.paper,'Mono');
    a.para('Keep the indentation and line boundary with the block.',527,346,353,23,30,C.green);
  } else {
    const result=cue(k,4,'sets the quotation aside',.65)===1;
    for(const [i,vals] of [['Training manual','Quoted marker','Quarantine for review'],['Release notes','Ordinary prose','Untrusted source']].entries()) {
      const x=51+i*447;
      a.paper(x,153,408,204,vals[0]);
      a.serif(vals[1],x+21,247,27);
      a.mono('Transcription  ·  ready',x+21,291,17,C.forest);
      if(result)a.mono(vals[2],x+21,332,17,i?C.gray:C.oxide);
    }
    if(b===5)a.para('Tool permissions come from the application.',78,439,800,31,34,C.paper);
  }
}

export function markdown(a,k) {
  const b=k.beat.beatIndex,cut=cue(k,1,'four ordered records',.8);
  a.base('Two sections carry the same heading','Markdown   /   source-line map');
  a.paper(38,127,541,354,'Handbook.md   /   revision 7');
  mdLines.forEach((s,i)=>{
    const y=194+i*23;
    a.mono(String(i+1).padStart(2,' '),55,y,13,C.gray);
    const heading=[1,4,10].includes(i);
    a.mono(s,88,y,14,heading?C.copper:C.ink,467);
    if(b>=2 && i===11) {
      a.c.font='400 14px "Lesson Mono"';
      const x=88+a.c.measureText(s.trimEnd()).width;
      a.path([[x,y+3],[x+15,y+3]],C.copper,2);
    }
  });
  if(b===0) {
    a.mono('line 5',619,271,19,C.gold);a.serif('Command',620,305,27,C.white);
    a.mono('line 11',619,395,19,C.gold);a.serif('Report instruction',620,430,25,C.white);
  } else if(b===1) {
    sections.forEach((s,i)=>{
      if(cut===0)return;
      const x=621,y=141+i*82;
      a.paper(x,y,287,64,'',i===2?C.paper:C.mist);
      a.mono('LINES '+(s.start+1)+'–'+s.end,x+14,y+21,13,C.gray);
      a.serif(s.heading,x+14,y+49,22,C.ink);
    });
    if(cut>0)a.wire([[580,293],[597,293],[597,339],[618,339]],cut);
  } else if(b===2) {
    a.register(82,266,483,142,C.copper);
    a.paper(602,157,317,227,'Raw command slice    ·    lines 5–10');
    sections[2].text.trimEnd().split('\n').forEach((s,i)=>a.mono(s,614,228+i*32,15,C.ink,291));
    a.wire([[579,334],[600,334]],cue(k,2,'Copy those bytes'));
    if(cue(k,2,'two spaces at the end')>0) {
      a.mono('Two trailing spaces',613,433,14,C.dim);
      a.mono('report.··',613,469,22,C.gold);
    }
  } else {
    const shift=cue(k,3,'After an edit moves the lines',1);
    a.paper(610,153,302,274,'Section locators');
    a.serif('Agent command',628,239,22);
    a.mono('Command  /  line '+(shift===1?'7':'5'),628,275,16);
    a.serif('Agent command',628,328,22);
    a.mono('Report   /  line '+(shift===1?'13':'11'),628,365,16);
    a.mono(shift===1?'r8 · 2 new lines above':'r7 · source at left',627,404,14,C.copper);
    a.mono('Left page   /   revision 7',55,509,15,C.dim);
  }
}
