import assert from 'node:assert/strict';
import { CLAIMS } from '../../../films/rag-evaluation/fixtures.mjs';

const claim = CLAIMS.find(({ id }) => id === 'closed');
const box = CLAIMS.find(({ id }) => id === 'box');
const notices = [
  { id: 'A', x: 566, lines: ['The library is closed', 'on Sunday.'], text: [claim.text, box.text], supports: ['closed', 'box'] },
  { id: 'B', x: 1354, lines: ['Return-box receipts are', 'emailed the next day.'], text: ['Return-box receipts are emailed the next day.'], supports: ['next'] },
];

function evaluate(citedId) {
  const cited = notices.find(({ id }) => id === citedId);
  return {
    cited,
    faithful: notices.some(({ supports }) => supports.includes(claim.id)),
    citationPresent: Boolean(citedId),
    citedSupport: Boolean(cited?.supports.includes(claim.id)),
  };
}

const beats = [
  {
    id: 'open-the-footnote',
    say: 'Follow the little B. You want to visit the library on Sunday. What did the assistant send you to read?',
    hold: 1.4,
  },
  {
    id: 'read-the-receipt-notice',
    say: 'A notice about return-box receipts. The receipt comes by email the next day. Can you tell from that notice whether the doors open on Sunday?',
    hold: 1.7,
  },
  {
    id: 'lift-the-other-flap',
    say: 'Lift the other flap. Both notices came back from the library search and went into the assistant’s prompt. There it is, on page A. Closed on Sunday.',
    hold: 1.1,
  },
  {
    id: 'check-the-claim',
    say: 'Page A supports the whole sentence. That makes the claim faithful to the evidence the model received. Now put your finger back on the B.',
    hold: 0.65,
  },
  {
    id: 'check-the-citation',
    say: 'For citation support, follow that one reference. You land back on the passage about receipts. Which letter would take a reader to the Sunday hours?',
    hold: 2.3,
  },
  {
    id: 'follow-the-new-reference',
    say: 'Follow it once more. The answer says exactly what it said before. This time, the footnote opens the line that tells you when the library is closed.',
    hold: 2.8,
  },
];

const ink = '#203c50';
const red = '#b73545';
const ivory = '#fffae9';
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function path(ctx, d, fill, stroke, weight = 2) {
  ctx.beginPath();
  d(ctx);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = weight; ctx.stroke(); }
}
function polygon(ctx, pts, color) {
  path(ctx, p => {
    p.moveTo(...pts[0]);
    for (const pt of pts.slice(1)) p.lineTo(...pt);
    p.closePath();
  }, color);
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function ellipse(ctx, x, y, rx, ry, color) {
  path(ctx, p => p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), color);
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  path(ctx, p => { p.moveTo(x1,y1); p.lineTo(x2,y2); }, null, color, width);
}
function type(ctx, value, x, y, size, options = {}) {
  const { font = 'Serif', color = ink, align = 'center', weight = 400, italic = false } = options;
  ctx.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + font + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}
function grad(ctx, x0, y0, x1, y1, stops) {
  const fill = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}

// The grain in the painted reading table stays fixed as the camera moves.
function table(ctx) {
  rect(ctx, -280, -220, 2490, 1530, grad(ctx, 0,0,1750,1300, [
    [0, '#adcdcf'], [0.54,'#96babc'], [1,'#729ca4'],
  ]));
  for (let i = 0; i < 96; i++) {
    const y = -172 + i * 15.4 + 4 * Math.sin(i * 9);
    path(ctx, p => {
      p.moveTo(-250, y);
      p.bezierCurveTo(285, y + 43 * Math.sin(i*.09), 671, y - 54, 1095, y - 19);
      p.bezierCurveTo(1450, y + 2, 1750, y - 48 * Math.sin(i*.05), 2220, y - 66);
    }, null, i % 3 ? '#57808b35' : '#e8e6cf44', i % 5 === 0 ? 2.3 : 1.1);
  }
}

function page(ctx, left, dy, fill) {
  const dir = left ? -1 : 1;
  const X = n => 960 + n * dir;
  path(ctx, p => {
    p.moveTo(960, 322+dy);
    p.bezierCurveTo(X(152), 272+dy, X(528), 299+dy, X(785), 283+dy);
    p.lineTo(X(785), 870+dy);
    p.bezierCurveTo(X(560), 890+dy, X(171), 858+dy, 960, 908+dy);
    p.closePath();
  }, fill);
}
function binding(ctx) {
  path(ctx, p => {
    p.moveTo(143,277); p.lineTo(949,301); p.lineTo(1765,272);
    p.lineTo(1778,895); p.lineTo(997,928);
    p.quadraticCurveTo(958,945,920,927); p.lineTo(145,908); p.closePath();
  }, '#49233377');
  polygon(ctx, [[145,263],[958,297],[1767,263],[1764,889],[963,927],[141,898]], '#233e56');
  polygon(ctx, [[150,262],[960,297],[1761,261],[1759,881],[958,916],[150,890]], '#477684');
  for (let i=0; i<6; i++) {
    const offset = 13 - i*2;
    page(ctx, true, offset, i%2 ? '#d9cdaf' : '#b5a283');
    page(ctx, false, offset, i%2 ? '#ded3b8' : '#b5a283');
  }
  page(ctx, true, 0, grad(ctx,175,0,960,0,[[0,'#f4eed7'],[.16,'#faf5e1'],[.82,'#f7eed6'],[.97,'#dccfb3'],[1,'#b8a88e']]));
  page(ctx, false, 0, grad(ctx,960,0,1745,0,[[0,'#b3a289'],[.035,'#e1d4b9'],[.14,'#f5edd8'],[.87,'#fff7e3'],[1,'#f1e5cb']]));
  // Cloth tag sewn into the head of the book.
  polygon(ctx, [[170,240],[552,242],[554,290],[169,289]], '#254c5a');
  type(ctx, 'Notices in the prompt', 361, 277, 35, {font:'Sans',color:ivory});
}

function openBookMark(ctx, x, y, scale, color) {
  ctx.save();
  ctx.translate(x,y); ctx.scale(scale, scale);
  path(ctx,p=>{
    p.moveTo(0,-9); p.quadraticCurveTo(-27,-26,-58,-17); p.lineTo(-58,18);
    p.quadraticCurveTo(-27,12,0,29); p.quadraticCurveTo(26,12,58,18); p.lineTo(58,-17);
    p.quadraticCurveTo(27,-26,0,-9); p.closePath();
  }, null, color, 4);
  line(ctx,0,-9,0,26,color,3);
  ctx.restore();
}

// Flat ink and offset folds give each pop-up a visible paper edge.
function tree(ctx, x, y, size) {
  ctx.save(); ctx.translate(x,y); ctx.scale(size,size);
  ellipse(ctx,10,4,32,57,'#bfc8ab');
  ellipse(ctx,0,0,32,57,'#79a492');
  path(ctx,p=>{p.moveTo(0,-57); p.bezierCurveTo(45,-54,43,48,0,57);p.closePath();},'#458176');
  line(ctx,0,12,0,83,ink,5);
  line(ctx,0,48,-13,30,ink,3);
  line(ctx,0,30,14,9,ink,3);
  ctx.restore();
}

function library(ctx) {
  // Coordinates are relative to the foot of the cutout at the center of the page.
  ellipse(ctx,5,-115,150,113,'#efd7a2');
  for (let n=0;n<8;n++) line(ctx,138+n*7,-175,154+n*7,-175,'#dcbe8c',2);
  tree(ctx,-194,-76,.89); tree(ctx,192,-87,1.02);
  polygon(ctx,[[-170,-3],[-151,-12],[162,-11],[192,-3],[178,4],[-178,7]],'#b2b6a0');
  // Folded side wall, brick courses and paper cornice.
  polygon(ctx,[[125,-130],[153,-111],[153,-12],[125,-22]],'#b27666');
  rect(ctx,-134,-134,262,118,'#c98971');
  for(let row=0;row<6;row++){
    const y=-127+row*19;
    line(ctx,-133,y,127,y,'#deb19a',2);
    for(let x=-120+(row%2)*17;x<124;x+=38)line(ctx,x,y,x,y+17,'#deb19a',2);
  }
  for (const wx of [-104,87]) {
    rect(ctx,wx-15,-102,31,58,'#f7dfac');
    rect(ctx,wx-11,-97,23,49,'#35636b');
    line(ctx,wx,-96,wx,-50,'#d9d9ae',3);
    line(ctx,wx-11,-75,wx+12,-75,'#d9d9ae',3);
    rect(ctx,wx-18,-46,37,5,'#855c56');
  }
  rect(ctx,-135,-139,264,10,'#f7e8c7');
  polygon(ctx,[[-74,-142],[0,-198],[80,-142]],'#224858');
  polygon(ctx,[[-64,-144],[0,-190],[69,-144]],'#eed5a4');
  polygon(ctx,[[-48,-147],[0,-180],[49,-147]],'#cc9b79');
  ellipse(ctx,0,-158,8,8,'#f7e4bd');
  rect(ctx,-67,-144,134,31,'#35626b');
  type(ctx,'LIBRARY',0,-121,24,{font:'Sans',weight:700,color:ivory});
  for (const cx of [-63,58]) {
    rect(ctx,cx,-111,13,86,'#ffe5b7');
    rect(ctx,cx+9,-111,4,86,'#c49779');
    rect(ctx,cx-3,-30,19,9,'#efcf9f');
  }
  rect(ctx,-39,-109,78,89,'#835c54');
  rect(ctx,-33,-103,66,84,'#284956');
  for (const dx of [-27,5]) {
    rect(ctx,dx,-97,21,38,'#78a5a4');
    rect(ctx,dx+2,-47,17,21,'#416474');
  }
  line(ctx,0,-101,0,-20,'#d0b594',3);
  for(let i=0;i<3;i++) {
    rect(ctx,-76-i*9,-21+i*7,154+i*18,7,'#e5c8a1');
    rect(ctx,-76-i*9,-16+i*7,154+i*18,2,'#a58272');
  }
  line(ctx,-222,2,210,2,'#7e8979',2);
}

function mailTerminal(ctx) {
  ellipse(ctx,5,-105,145,108,'#e7b792');
  // A folding tab holds the monitor upright. Its mail icon is printed on the glass.
  polygon(ctx,[[-170,0],[-111,-12],[130,-11],[175,-3],[135,6],[-157,7]],'#c2b49f');
  polygon(ctx,[[93,-190],[131,-165],[123,-43],[91,-59]],'#61899c');
  polygon(ctx,[[-114,-191],[93,-193],[98,-46],[-112,-41]],'#96bfbd');
  polygon(ctx,[[-115,-192],[94,-194],[104,-187],[-111,-184]],'#d0dfcb');
  path(ctx,p=>p.roundRect(-94,-172,170,100,12),'#214552');
  path(ctx,p=>p.roundRect(-88,-166,158,88,8),'#325e6a');
  path(ctx,p=>{p.moveTo(-86,-164);p.lineTo(-40,-164);p.lineTo(-85,-116);p.closePath();},'#49727a');
  polygon(ctx,[[-61,-141],[22,-141],[22,-93],[-61,-93]],'#fae3c3');
  polygon(ctx,[[-61,-93],[-20,-127],[22,-93]],'#ebc5a7');
  polygon(ctx,[[-64,-143],[25,-143],[-19,-110]],'#ffefcf');
  ellipse(ctx,43,-101,22,22,'#b43d49');
  type(ctx,'@',43,-91,32,{font:'Sans',weight:700,color:ivory});
  for(let i=0;i<6;i++)line(ctx,-93+i*11,-59,-87+i*11,-59,'#59818c',3);
  ellipse(ctx,75,-57,4,3,'#da734f');
  rect(ctx,-40,-43,87,24,'#688a8f');
  polygon(ctx,[[-65,-23],[63,-24],[79,-15],[-77,-12]],'#abc3ad');
  polygon(ctx,[[-111,-15],[71,-18],[115,-2],[-140,1]],'#b4cfc0');
  polygon(ctx,[[-140,1],[115,-2],[114,5],[-140,8]],'#628592');
  for(let row=0;row<3;row++){
    for(let col=0;col<14;col++){
      const x=-104+col*12-row*4;
      line(ctx,x,-13+row*4,x+7,-13+row*4,'#6e8e92',2);
    }
  }
  // Two returned volumes alongside the terminal.
  polygon(ctx,[[125,-35],[189,-36],[209,-26],[143,-25]],'#bb614e');
  polygon(ctx,[[143,-25],[209,-26],[209,-16],[143,-15]],'#f2d6aa');
  polygon(ctx,[[125,-35],[143,-25],[143,-15],[125,-24]],'#964e49');
  polygon(ctx,[[120,-22],[187,-22],[209,-13],[140,-11]],'#437a83');
  polygon(ctx,[[140,-11],[209,-13],[209,-3],[140,0]],'#e2c59f');
  polygon(ctx,[[120,-22],[140,-11],[140,0],[120,-9]],'#2e5664');
}

function closedFlap(ctx, source, opening) {
  if (opening >= 1) return;
  const y = 389, h = 438, w = 660;
  const shrink = 1 - ease(opening);
  ctx.save(); ctx.translate(source.x,y); ctx.scale(1,shrink);
  polygon(ctx,[[-w/2+5,0],[w/2,0],[w/2+5,h-2],[-w/2,h+7]],'#7e6c5e55');
  polygon(ctx,[[-w/2,-3],[w/2-2,0],[w/2,h-8],[-w/2-3,h]],source.id==='A'?'#d6dfc4':'#ead0b6');
  ctx.strokeStyle = source.id==='A'?'#9baa90':'#c5a992';
  ctx.lineWidth = 2; ctx.strokeRect(-309,18,617,h-52);
  const c = source.id==='A' ? '#6b8a7c' : '#ae8574';
  for (const r of [104,96]) path(ctx,p=>p.ellipse(0,206,r,r,0,0,Math.PI*2),null,c,2);
  openBookMark(ctx,0,203,.94,c);
  for(let i=0;i<12;i++){
    const angle = i*Math.PI/6;
    line(ctx,109*Math.cos(angle),206+109*Math.sin(angle),116*Math.cos(angle),206+116*Math.sin(angle),c,2);
  }
  polygon(ctx,[[269,h-5],[329,h-8],[328,h-65]],'#f7eed8');
  line(ctx,269,h-5,328,h-65,c,1.5);
  if(opening>0) rect(ctx,-330,0,660,h,'rgba(94,85,67,'+(Math.sin(opening*Math.PI)*.15)+')');
  ctx.restore();
}

function pencil(ctx, x, baseline, width, amount) {
  if (amount<=0) return;
  path(ctx,p=>{
    p.moveTo(x,baseline); p.quadraticCurveTo(x+width*amount*.48,baseline+3,x+width*amount,baseline-2);
  },null,'#377f78',4.5);
}

function folio(ctx, source, opening, underline) {
  ctx.save(); ctx.translate(source.x,0);
  // This letter stays visible while the reader lifts the flap.
  ellipse(ctx,0,343,27,27,'#e4d5b6');
  type(ctx,source.id,0,359,45,{font:'Serif',weight:600});
  if (opening > 0) {
    const rise = ease(opening);
    ctx.save(); ctx.translate(0,638); ctx.transform(1.12,0,-.15*(1-rise),.15+.96*rise,0,0);
    if (source.id==='A') library(ctx); else mailTerminal(ctx);
    ctx.restore();
    const [first,second] = source.lines;
    type(ctx,first,0,721,53);
    type(ctx,second,0,782,53);
    const firstWidth=ctx.measureText(first).width, secondWidth=ctx.measureText(second).width;
    if (source.id==='A') pencil(ctx,-firstWidth/2,730,firstWidth,clamp(underline*2));
    pencil(ctx,-secondWidth/2,791,secondWidth,source.id==='A' ? clamp(underline*2-1) : underline);
  }
  ctx.restore();
  closedFlap(ctx,source,opening);
}

// A single strip of woven ribbon. Sample its centerline by position so the
// stitches, bent edges and swallowtail follow the same moving bookmark.
function ribbon(ctx, startX, endX, drop, lift, glint) {
  const sy=172, ey=mix(214,313,drop)-52*lift;
  function sample(t) {
    const u=1-t;
    const dx=endX-startX;
    const p1x=startX+16, p1y=sy+105+28*lift;
    const p2x=endX-dx*.09, p2y=ey-92-16*lift;
    const x=u*u*u*startX+3*u*u*t*p1x+3*u*t*t*p2x+t*t*t*endX;
    const y=u*u*u*sy+3*u*u*t*p1y+3*u*t*t*p2y+t*t*t*ey;
    const vx=3*u*u*(p1x-startX)+6*u*t*(p2x-p1x)+3*t*t*(endX-p2x);
    const vy=3*u*u*(p1y-sy)+6*u*t*(p2y-p1y)+3*t*t*(ey-p2y);
    const len=Math.hypot(vx,vy) || 1;
    return {x,y,nx:vy/len,ny:-vx/len,tx:vx/len,ty:vy/len};
  }
  const points=Array.from({length:65},(_,i)=>sample(i/64));
  const edge=(p,k)=>[p.x+k*p.nx,p.y+k*p.ny];
  const tip=points.at(-1);
  const outline=[...points.map(p=>edge(p,12)),[tip.x-11*tip.tx,tip.y-11*tip.ty],...points.slice().reverse().map(p=>edge(p,-12))];
  ctx.save(); ctx.translate(4+6*lift,6+11*lift);
  polygon(ctx,outline,'#4a292c44');
  ctx.restore();
  polygon(ctx,outline,red);
  for(const k of [-9,8]){
    path(ctx,p=>points.forEach((v,i)=>p[i?'lineTo':'moveTo'](...edge(v,k))),null,'#efa298',1.4);
  }
  if (glint>0 && glint<1) {
    const point=sample(glint);
    line(ctx,...edge(point,-11),...edge(point,11),'#ffdfab',4);
  }
}

function answer(ctx, citedId, underline) {
  const x=289,y=48,w=1342,h=157;
  polygon(ctx,[[x+5,y+8],[x+w+11,y+1],[x+w+9,y+h+12],[x+3,y+h+13]],'#48253266');
  polygon(ctx,[[x,y+2],[x+w,y-2],[x+w-2,y+h-1],[x+1,y+h+2]],'#fffae9');
  type(ctx,'Library assistant',x+65,y+45,34,{font:'Sans',color:'#52676c',align:'left'});
  type(ctx,claim.text,x+65,y+126,68,{align:'left'});
  const wText=ctx.measureText(claim.text).width;
  pencil(ctx,x+65,y+137,wText,underline);
  const cx=x+65+wText+63;
  type(ctx,'['+citedId+']',cx,y+126,64,{font:'Serif',color:red});
  line(ctx,cx-32,y+137,cx+32,y+137,red,4);
}

function timeFor(clock,index,phrase,span) {
  if(clock.index < index) return 0;
  if(clock.index > index) return 1;
  return ease(clock.reveal(phrase,span));
}
function draw(ctx,clock) {
  const bOpening=ease((clock.seconds+.14)/1.38);
  const pullBack=timeFor(clock,2,'Lift the other flap',1.25);
  const aOpening=timeFor(clock,2,'Both notices',1.1);
  const move=timeFor(clock,5,'Follow it once more',1.65);
  const sundayLine=timeFor(clock,2,'There it is',.7);
  const releaseLine=timeFor(clock,3,'put your finger',.5);
  const readReceipt=timeFor(clock,1,'The receipt comes',.7) * (1-pullBack);
  const revisit=timeFor(clock,4,'the passage about receipts',.6) * (1-move);
  const intoPage=timeFor(clock,0,'What did the assistant',1.45) * (1-pullBack);
  const zoom = 1+.042*(1-pullBack)+.68*intoPage;
  const centerX=mix(980,1328,intoPage), centerY=mix(535,600,intoPage);
  const reading=evaluate(move < .5 ? 'B' : 'A');
  const first=notices[0], second=notices[1];
  const match=reading.faithful*sundayLine*(1-releaseLine);
  ctx.save();
  ctx.translate(960,540); ctx.scale(zoom,zoom); ctx.translate(-centerX,-centerY);
  table(ctx); binding(ctx);
  folio(ctx,first,aOpening,Math.max(match, reading.citedSupport*move));
  folio(ctx,second,bOpening,Math.max(readReceipt,revisit));
  ctx.font='400 68px "Lesson Serif"';
  const startX=354+ctx.measureText(claim.text).width+63;
  const trace=timeFor(clock,4,'follow that one reference',1.3);
  ribbon(ctx,startX,mix(second.x,first.x,move),bOpening,Math.sin(move*Math.PI),trace);
  answer(ctx,reading.cited.id,match);
  ctx.restore();
}

function check() {
  assert.equal(claim.source,'A');
  for(const source of notices) assert.equal(source.lines.join(' '),source.text[0]);
  const before=evaluate('B'), after=evaluate('A');
  assert.deepEqual([before.faithful,before.citationPresent,before.citedSupport],[true,true,false]);
  assert.deepEqual([after.faithful,after.citationPresent,after.citedSupport],[true,true,true]);
  assert.equal(before.cited.text[0],'Return-box receipts are emailed the next day.');
  assert.equal(after.cited.text[0],claim.text);
  return true;
}

export default { title: 'Follow the library footnote', beats, draw, check };
