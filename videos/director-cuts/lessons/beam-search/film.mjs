import assert from 'node:assert/strict';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { WIDTH_TWO, WIDTH_THREE, rawWinner } from '../../../films/beam-search/arithmetic.mjs';

const narrow = WIDTH_TWO;
const wide = WIDTH_THREE;
const firstWords = narrow.history[0].expansions;
const narrowEnd = rawWinner(narrow);
const wideEnd = rawWinner(wide);
const percent = n => Number((n * 100).toFixed(4)) + '%';
const title = 'The room that went dark';

const beats = [
  {
    id: 'the-bedroom',
    say: 'Watch the bedroom on the right. We have three ways to start a sentence about Mia, and room to keep two. What ending did we just lose?',
    hold: 1.1,
  },
  {
    id: 'two-openings',
    say: 'Opened gets forty-five percent. Looked gets thirty-five. Slept comes third. With a beam width of two, only the first two openings get to grow.',
    hold: 0.55,
  },
  {
    id: 'another-word',
    say: 'Each surviving opening gets its own set of next words. After opened, the model gives the word “the” a one-in-two chance. Half of forty-five percent leaves twenty-two and a half percent for “opened the.”',
    hold: 0.65,
  },
  {
    id: 'two-lights',
    say: 'Compare the unfinished paths across both rooms. “Opened the” and “looked outside” have the two highest scores. They get the next turn. Paths that reach the end token go into the finished set.',
    hold: 0.65,
  },
  {
    id: 'the-door',
    say: 'By the fourth step, Mia has opened the door. Including the end token, this path has a fifteen point three percent chance. It leads all the finished sentences we found.',
    hold: 1.1,
  },
  {
    id: 'one-more-room',
    say: 'Back to the first word. Give the beam a third place. Same words, same probabilities. This time we get to see what comes after “slept.”',
    hold: 0.8,
  },
  {
    id: 'lights-out',
    say: 'Look above the pillow. After “slept,” the model gives the end token a ninety-five percent chance. Multiply by the twenty percent that got us here. “Mia slept” finishes at nineteen percent.',
    hold: 0.9,
  },
  {
    id: 'the-last-room',
    say: 'The door still opens at fifteen point three percent. The higher-scoring sentence started with our third choice. The extra place kept it alive long enough to reach the end token.',
    hold: 2.1,
  },
];

const clamp = n => Math.max(0, Math.min(1, n));
function smooth(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
const move = (time, start, duration) => smooth((time - start) / duration);
const mix = (a, b, t) => a + (b - a) * t;
const cream = '#ffebca';
const ink = '#202735';
const gold = '#f3c57d';
const lineCache = new Map();
function path(g, d, fill, stroke, weight = 1) {
  if (!lineCache.has(d)) lineCache.set(d, new Path2D(d));
  const p = lineCache.get(d);
  if (fill) { g.fillStyle = fill; g.fill(p); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = weight; g.stroke(p); }
}
function rect(g, x, y, w, h, color) {
  g.fillStyle = color; g.fillRect(x, y, w, h);
}
function oval(g, x, y, rx, ry, color) {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = color; g.fill();
}
function line(g, x1, y1, x2, y2, color, w) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = color; g.lineWidth = w; g.stroke();
}
function poly(g, points, color) {
  g.beginPath(); g.moveTo(...points[0]);
  for (const point of points.slice(1)) g.lineTo(...point);
  g.closePath(); g.fillStyle = color; g.fill();
}
function type(g, str, x, y, size, color = cream, align = 'center', family = 'Serif', weight = 'normal') {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(str, x, y);
}
function gradient(g, y0, y1, colors) {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  colors.forEach(([at, color]) => grad.addColorStop(at, color));
  return grad;
}
function glow(g, x, y, r, color) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color); grad.addColorStop(1, 'rgba(255,215,148,0)');
  rect(g, x-r, y-r, r*2, r*2, grad);
}
function crescent(g, x, y, s, color) {
  g.save(); g.translate(x, y); g.scale(s, s);
  path(g, 'M 15 -25 C -22 -21 -25 17 0 27 C 11 31 23 26 30 17 C 7 24 -4 -4 15 -25 Z', color);
  g.restore();
}

const bayX = [170, 705, 1240];
const bayY = 337;
const bayW = 510;
const bayH = 379;
const centers = bayX.map(x => x + bayW / 2);

function sky(g) {
  rect(g, 0, 0, 1920, 1080, gradient(g, 0, 1080, [
    [0, '#1f293c'], [.33, '#514253'], [.71, '#c07965'], [1, '#202533'],
  ]));
  for (let j = 0; j < 72; j++) {
    const x = (j * 413 + 165) % 1920, y = (j * 73 + 21) % 312;
    oval(g, x, y, j % 7 ? 1.5 : 2.7, j % 7 ? 1.5 : 2.7, '#d8c1aa89');
  }
  crescent(g, 1379, 157, 1.45, '#e1b58a');
  for (let i = -1; i < 15; i++) {
    const x = i * 148, y = 640 + Math.sin(i * 4.17) * 52;
    rect(g, x, y, 158, 360, '#383440');
    poly(g, [[x-12,y],[x+80,y-76],[x+164,y]], '#343340');
    rect(g, x+83, y-68, 22, 52, '#343340');
    for (let j = 0; j < 3; j++) rect(g, x+17+j*49, y+51, 12, 32, '#a4746577');
  }
  rect(g, 0, 896, 1920, 184, gradient(g, 896, 1050, [[0,'#39333c'],[1,'#212836']]));
  oval(g, 963, 939, 900, 46, '#191f2c78');
}

function building(g) {
  // A single cornice and porch join three simultaneous versions of the house.
  rect(g, 124, 310, 1672, 596, '#723f3c');
  rect(g, 124, 716, 1672, 28, '#312d36');
  rect(g, 116, 733, 1688, 13, '#b07859');
  rect(g, 126, 745, 1668, 148, gradient(g,745,893,[[0,'#523d3c'],[1,'#3c3338']]));
  rect(g, 133, 892, 1654, 7, '#ab7056');
  rect(g, 115, 900, 1690, 15, '#392c33');
  rect(g, 103, 915, 1714, 8, '#835445');
  rect(g, 119, 923, 1683, 11, '#48343a');
  rect(g, 421, 210, 66, 97, '#74494a');
  for (let j = 0; j < 4; j++) line(g,421,220+j*16,487,220+j*16,'#a16e5a',3);
  rect(g, 412, 201, 84, 14, '#c28c6e');
  rect(g, 417, 214, 76, 10, '#59404a');
  poly(g, [[91,307],[191,246],[1729,246],[1829,307]], '#342f3f');
  for (let x = 204; x < 1730; x += 49) line(g,x,248,x-24,304,'#534453',3);
  for (const y of [259,277,294]) line(g,170-(y-259)*1.6,y,1750+(y-259)*1.6,y,'#67515c',2);
  rect(g, 84, 304, 1752, 11, '#d99c71');
  rect(g, 101, 315, 1718, 13, '#523e44');
  rect(g, 118, 328, 1684, 9, '#ad755a');
  for (const x of [140, 679, 1214, 1751]) {
    rect(g,x,337,23,380,'#4e3840');
    rect(g,x+3,337,5,380,'#b78064');
    for (let y = 361; y < 715; y += 53) line(g,x,y,x+21,y,'#9e6a55',3);
  }
  for (const x of [692,1227]) line(g,x,763,x,876,'#795047',2);
}

const roomWall = [
  ['#eed0a3','#c79b79','#927260'],
  ['#d4c7a4','#9fab9b','#6e8a83'],
  ['#bdc9bf','#a1aeaa','#779194'],
];
function wall(g, room) {
  const [top, mid, bottom] = roomWall[room];
  rect(g,0,0,bayW,bayH,gradient(g,0,bayH,[[0,top],[.7,mid],[1,bottom]]));
  for(let y=20;y<306;y+=53) for(let x=16+((y-20)%106?21:0);x<bayW;x+=44) {
    line(g,x,y-4,x,y+4,'#58474a25',2);
    line(g,x-3,y,x+3,y,'#58474a22',2);
  }
  rect(g,0,301,bayW,32, bottom);
  rect(g,0,299,bayW,4,'#f3ddbe7a');
  poly(g,[[0,331],[510,331],[510,379],[0,379]],room===2?'#777f79':'#aa8a70');
  for(let j=-2;j<8;j++) line(g,190+j*71,332,145+j*103,379,'#4c464b40',2);
  rect(g,0,332,510,5,'#63565460');
  rect(g,0,0,510,16,gradient(g,0,16,[[0,'#372e3c70'],[1,'#372e3c00']]));
}

// The bun, coral nightdress, and striped cuffs belong to the same cut-paper actor.
function mia(g, x, y, scale, reach) {
  g.save(); g.translate(x,y); g.scale(scale,scale);
  path(g,'M -16 86 L -17 122 Q -10 126 -4 120 L 3 85 Z M 7 84 L 15 123 Q 23 126 28 119 L 25 84 Z','#b9785e');
  path(g,'M -21 118 Q -9 123 -4 117 L 4 124 Q 2 131 -25 127 Z M 12 118 Q 23 122 27 116 L 38 122 Q 41 131 13 128 Z',ink);
  path(g,'M -8 -17 Q -24 -9 -23 12 L -40 89 Q -8 108 39 89 L 16 4 Q 12 -13 5 -17 Z','#ae5647');
  path(g,'M -8 -17 Q -21 -8 -18 15 L -30 87 Q -4 98 28 87 L 11 4 Q 9 -13 2 -17 Z','#de8068');
  path(g,'M -17 -9 L -3 1 L 7 -12 L 2 -20 Z','#fae0b5');
  path(g,'M -10 -21 L -9 -12 Q -4 -6 4 -14 L 4 -33 Z','#b66e55');
  path(g,'M -24 -49 Q -24 -73 -3 -73 Q 16 -74 18 -56 L 24 -45 L 18 -43 Q 18 -24 2 -23 Q -17 -24 -24 -49 Z','#c78e6b');
  path(g,'M -30 -43 Q -36 -70 -19 -78 Q -3 -88 12 -75 L 18 -63 Q 4 -61 -5 -69 Q -7 -53 -19 -49 L -18 -35 Q -29 -30 -30 -43 Z',ink);
  oval(g,-34,-64,13,14,ink); oval(g,-34,-70,9,6,'#3b3940');
  oval(g,12,-50,1.7,2.2,ink);
  g.save(); g.translate(0,2); g.rotate(reach);
  path(g,'M -6 -12 Q 5 -19 11 -8 L 27 11 L 55 1 L 59 8 L 28 26 Q 21 29 13 22 L -6 4 Z','#d78168');
  path(g,'M 22 10 L 29 9 L 34 22 L 27 25 Z','#f7d7ac');
  path(g,'M 34 10 L 57 1 Q 69 -2 69 3 Q 68 8 58 10 L 36 20 Z','#c78e6b');
  g.restore(); g.restore();
}

function door(g, openness) {
  rect(g,249,54,156,279,'#71534c');
  rect(g,256,60,144,270,'#eed4a2');
  rect(g,266,70,125,258,'#253c4c');
  poly(g,[[266,246],[334,190],[390,241],[390,328],[266,328]],'#485955');
  for (const [x,y] of [[305,106],[368,132],[347,90]]) oval(g,x,y,2,2,'#f6dcad');
  const hinge = 390, outer = mix(266,352,openness), drop=17*openness;
  poly(g,[[hinge,70],[outer,70+drop],[outer,328+drop],[hinge,328]],'#a65f49');
  const w = hinge-outer;
  for (const [a,b] of [[87,189],[204,308]]) {
    poly(g,[[hinge-.1*w,a+2],[hinge-.89*w,a+drop*.89],[hinge-.89*w,b+drop*.89],[hinge-.1*w,b+2]],'#c17a59');
    poly(g,[[hinge-.17*w,a+9],[hinge-.81*w,a+8+drop*.81],[hinge-.81*w,b-9+drop*.81],[hinge-.17*w,b-9]],'#ab694f');
  }
  oval(g,outer+w*.15,214+drop*.85,4+2*(1-openness),6,'#f3d598');
  oval(g,217+70*openness,349,61,8,'#50424a30');
  mia(g,217+70*openness,218,1.02,.02+.11*openness);
  // A key on a hook.
  oval(g,449,159,7,7,'#7a5a50'); line(g,449,160,449,181,'#8e6650',4); line(g,449,177,458,177,'#8e6650',4);
}
function outside(g) {
  rect(g,209,38,210,201,'#65756c'); rect(g,218,45,192,185,'#ebd4a9');
  rect(g,225,52,178,169,gradient(g,52,221,[[0,'#324158'],[1,'#9d8d92']]));
  crescent(g,339,104,.5,'#f1dbad');
  path(g,'M 225 202 L 254 173 L 277 187 L 308 156 L 339 186 L 369 165 L 404 194 L 404 221 L 225 221 Z','#586473');
  path(g,'M 225 220 L 241 205 L 272 210 L 299 182 L 324 204 L 359 193 L 382 209 L 404 203 L 404 221 Z','#394e59');
  rect(g,313,49,7,175,'#d2bd96'); rect(g,221,141,187,6,'#d2bd96');
  rect(g,201,231,226,9,'#536562');
  path(g,'M 199 29 L 259 29 Q 250 100 220 141 Q 231 176 220 223 L 192 225 Q 209 148 199 29 Z','#c58665');
  path(g,'M 425 29 L 372 29 Q 375 102 402 141 Q 391 178 402 223 L 432 225 Q 414 141 425 29 Z','#b87a61');
  line(g,192,28,430,28,'#6b6155',6);
  oval(g,189,349,76,9,'#4d4c4830');
  mia(g,187,228,.94,-.85);
}
function bedroom(g, seconds) {
  path(g,'M 70 273 Q 74 252 101 253 L 424 253 L 424 323 L 70 323 Z','#59676d');
  rect(g,71,264,359,51,'#f2dfb9');
  rect(g,63,224,13,120,'#584e51');
  oval(g,69,221,11,10,'#ad845f');
  rect(g,417,158,19,188,'#685651');
  oval(g,426,154,14,12,'#ad845f');
  const breathe = 1.6*Math.sin(seconds*1.6);
  g.save(); g.translate(0,breathe);
  path(g,'M 294 246 Q 307 206 346 206 Q 393 206 414 244 Q 377 255 294 246 Z','#f3deb8');
  path(g,'M 302 237 Q 310 207 343 213 Q 370 211 377 232 L 376 244 L 298 249 Z',ink);
  oval(g,375,225,11,11,ink);
  path(g,'M 313 222 Q 317 239 346 235 L 356 241 Q 347 254 324 251 L 304 245 L 294 239 L 304 236 Z','#cb9270');
  path(g,'M 309 238 Q 315 242 320 239',null,'#58464a',2.5);
  path(g,'M 72 264 Q 118 235 165 243 Q 212 231 263 241 Q 283 240 301 232 L 325 253 L 315 292 L 102 298 L 73 290 Z','#b96856');
  path(g,'M 77 271 Q 150 252 211 264 Q 263 266 306 251 L 298 299 L 78 299 Z','#d4836d');
  for (let x=98;x<296;x+=36) {
    line(g,x,268,x-5,295,'#e7a284',4);
    line(g,x+10,268,x+6,296,'#bd715f',2);
  }
  g.restore();
  rect(g,65,301,367,16,'#775e53'); rect(g,67,301,365,4,'#bd916c');
  rect(g,97,317,12,27,'#695750'); rect(g,385,317,13,27,'#695750');
  // A low moon-shaped light over the bed leaves space for the end-token mobile.
  line(g,136,0,136,79,'#807a72',2); crescent(g,133,95,.85,'#ddbd82');
}

function shutter(g, fraction) {
  if(fraction<=0) return;
  const bottom = -8 + (bayH+8)*fraction;
  g.save(); g.translate(0,bottom-bayH);
  rect(g,0,0,bayW,bayH,gradient(g,0,bayH,[[0,'#3e4c59'],[1,'#4f5a61']]));
  for(let y=7;y<bayH;y+=29) {
    rect(g,0,y,510,4,'#35414c'); rect(g,0,y+4,510,2,'#687174');
  }
  rect(g,0,bayH-10,bayW,9,'#243341');
  rect(g,226,bayH-17,58,6,'#bb9c79');
  g.restore();
}

function scoreShade(g, room, amount, marked) {
  if (amount<=0) return;
  const h=320;
  const candidates=narrow.history[1].expansions.filter(c=>c.parent===firstWords[room].text);
  g.save(); g.translate(0,(h+5)*(amount-1));
  rect(g,14,0,bayW-28,h,gradient(g,0,h,[[0,'#25353d'],[1,'#364348']]));
  rect(g,18,0,2,h,'#878370'); rect(g,bayW-20,0,2,h,'#878370');
  type(g,'Path probability',bayW/2,43,30,'#e1c9a1','center','Sans');
  candidates.forEach((c,i)=>{
    const y=106+78*i;
    const retained=c.status==='active';
    const col=retained?cream:'#d4c1a9';
    g.save();
    if (marked && !retained) g.globalAlpha=1-.46*marked;
    type(g,c.token==='EOS'?'end':c.token,51,y-3,43,col,'left');
    type(g,percent(c.probability),452,y-2,39,col,'right','Mono');
    rect(g,50,y+21,405,5,'#52605e'); rect(g,50,y+20,405*c.probability/.25,7,retained?'#efbe77':'#b5a489');
    if(retained && marked) {
      g.globalAlpha=marked;
      oval(g,32,y-3,6,6,'#ffd088');
    }
    g.restore();
  });
  rect(g,9,h-5,bayW-18,10,'#b79677'); oval(g,bayW/2,h+3,8,6,'#dec39a');
  g.restore();
}

function endMobile(g, f, conditional) {
  if(f<=0) return;
  g.save(); g.translate(318,-115+115*f); g.rotate((1-f)*.09);
  line(g,0,-10,0,61,'#746d66',3);
  path(g,'M -102 64 Q -100 57 -90 57 L 90 57 Q 99 57 102 66 L 109 103 Q 66 120 0 119 Q -65 120 -110 103 Z','#eed1a1','#867561',3);
  type(g,'end  '+percent(conditional),0,90,37,'#473e42','center','Sans','bold');
  g.restore();
}

function sceneState(clock) {
  const {index:i,elapsed:t,reveal}=clock;
  let shut=i===0?move(t,-.34,3.65):1;
  let aperture=2, shade=0, marked=0, next=0, leftEnd=0, dimMiddle=0, mobile=0, sleepEnd=0;
  if(i===2) shade=move(t,.05,1.05);
  if(i===3) {
    marked=move(t,.05,.8);
    next=smooth(reveal('They get the next turn',1));
    shade=1-next;
  }
  if(i===4) {
    next=1; leftEnd=move(t,.05,1.3);
    dimMiddle=leftEnd;
  }
  if(i===5) {
    const rewind=move(t,0,1.05);
    next=1-rewind; leftEnd=1-rewind; dimMiddle=1-rewind;
    const third=smooth(reveal('Give the beam a third place',1.3));
    aperture=third>0?3:2; shut=1-third;
  }
  if(i>=6) {
    aperture=3; shut=0; mobile=i===6?move(t,-.15,1.55):1;
    sleepEnd=i===6?smooth(reveal('finishes at nineteen percent',.55)):1;
  }
  if(i===7) {
    leftEnd=move(t,-.1,1.1); dimMiddle=leftEnd;
  }
  return {shut,aperture,shade,marked,next,leftEnd,dimMiddle,mobile,sleepEnd};
}
function plaque(g, room, state, clock) {
  const {shut,next,leftEnd,dimMiddle,sleepEnd}=state;
  const x=centers[room], first=firstWords[room];
  let label=first.text, score=first.probability;
  if (room<2 && next>.5) {
    const surviving=narrow.history[1].active.find(c=>c.parent===first.text);
    label=surviving.text; score=surviving.probability;
  }
  if (room===0 && leftEnd>.5) { label=narrowEnd.text; score=narrowEnd.probability; }
  if (room===2 && sleepEnd>.5) { label=wideEnd.text; score=wideEnd.probability; }
  let dim=room===2 ? shut*(.34+.66*leftEnd) : room===1 ? dimMiddle : 0;
  if(room===1 && clock.index===6) dim=state.mobile;
  if(room===1 && clock.index===7) dim=1;
  g.save(); g.globalAlpha=1-dim;
  const lamp=room===2?sleepEnd:room===0?leftEnd:0;
  type(g,label,x,786,label.length>13?49:56,cream);
  let number=percent(score);
  if(room===2 && clock.index===6 && sleepEnd<=.5 && clock.reveal('the end token')>0) {
    number=percent(first.probability)+' × '+percent(wideEnd.conditionalProbability);
  }
  type(g,number,x,850,50,lamp>.5?gold:'#e4c7a9','center','Mono');
  g.restore();
}
let grain;
function paintGrain(g) {
  if(!grain) {
    const tile=createCanvas(117,103), tc=tile.getContext('2d'), pixels=tc.createImageData(117,103);
    let seed=9021;
    for(let i=0;i<pixels.data.length;i+=4) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const v=(seed>>>22)&1?255:0;
      pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;
      pixels.data[i+3]=(seed>>>26)%13;
    }
    tc.putImageData(pixels,0,0); grain=tile;
  }
  g.fillStyle=g.createPattern(grain,'repeat'); g.fillRect(0,0,1920,1080);
}
function framing(clock) {
  const {index,elapsed,reveal}=clock;
  // Start and end the replay at the same pillow. Widen to compare scores.
  if(index===0) return {amount:1-move(elapsed,.4,3.25),x:1900,y:740,zoom:.72};
  if(index===2) return {amount:move(elapsed,.2,1.5),x:320,y:565,zoom:.25};
  if(index===3) return {amount:1-smooth(reveal('They get the next turn',1.3)),x:320,y:565,zoom:.25};
  if(index===5) return {amount:smooth(reveal('what comes after',1.75)),x:1900,y:740,zoom:.72};
  if(index===6) return {amount:1,x:1900,y:740,zoom:.72};
  if(index===7) return {amount:1-move(elapsed,0,2.2),x:1900,y:740,zoom:.72};
  return {amount:0,x:0,y:0,zoom:0};
}

function draw(g,clock) {
  const s=sceneState(clock), camera=framing(clock);
  const z=1+camera.zoom*camera.amount;
  g.save(); g.translate(camera.x*(1-z),camera.y*(1-z)); g.scale(z,z);
  sky(g); building(g);
  for(let room=0;room<3;room++) {
    g.save(); g.translate(bayX[room],bayY);
    g.beginPath(); g.rect(0,0,bayW,bayH); g.clip();
    wall(g,room);
    if(room===0) door(g,.06+.84*s.leftEnd);
    if(room===1) outside(g);
    if(room===2) { bedroom(g,clock.seconds); endMobile(g,s.mobile,wideEnd.conditionalProbability); }
    if(room<2) {
      let mark=s.marked;
      if(room===0 && clock.index===2) mark=smooth(clock.reveal('After opened',.75));
      scoreShade(g,room,s.shade,mark);
    }
    if(room===0 && clock.index===7) rect(g,0,0,bayW,bayH,'rgba(31,39,52,'+s.leftEnd*.24+')');
    if(room===1) rect(g,0,0,bayW,bayH,'rgba(29,40,48,'+s.dimMiddle*.73+')');
    if(room===2) shutter(g,s.shut);
    g.restore();
    // Each bay has a brass footlight. The sleeve slides over its glass when a path is cut.
    const light=room===2?1-s.shut:room===1?1-s.dimMiddle:1;
    rect(g,bayX[room],718,bayW,9,'#433b3e');
    g.save(); g.globalAlpha=light;
    rect(g,bayX[room]+1,719,bayW-2,4,'#edbe83');
    glow(g,centers[room],725,90,'rgba(249,188,111,0.14)');
    g.restore(); plaque(g,room,s,clock);
  }
  g.restore();
  g.save();
  g.globalAlpha=1-move(z,1.03,.2);
  let sentence='Mia …';
  if(clock.index===4 && s.leftEnd>.6) sentence='Mia opened the door.';
  if(clock.index===7 && clock.elapsed>1.4) sentence='Mia slept.';
  type(g,sentence,130,140,96,cream,'left');
  type(g,'Beam width '+s.aperture,1788,139,53,'#f0d0a8','right','Sans');
  g.restore(); paintGrain(g);
}

function check() {
  assert.deepEqual(firstWords.map(c=>[c.text,c.probability]),[['opened',.45],['looked',.35],['slept',.2]]);
  assert.deepEqual(narrow.history[0].active.map(c=>c.text),['opened','looked']);
  assert.deepEqual(wide.history[0].active.map(c=>c.text),['opened','looked','slept']);
  assert.equal(narrow.history[1].expansions.length,6);
  assert.deepEqual(narrow.history[1].active.map(c=>c.text),['opened the','looked outside']);
  const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12);
  near(narrow.history[1].active[0].probability,.45*.5);
  near(narrow.history[1].active[1].probability,.35*.55);
  assert.deepEqual(narrowEnd.tokens,['opened','the','door','EOS']);
  near(narrowEnd.probability,.45*.5*.8*.85);
  assert.equal(percent(narrowEnd.probability),'15.3%');
  assert.equal(narrow.completed.some(c=>c.tokens[0]==='slept'),false);
  assert.deepEqual(wideEnd.tokens,['slept','EOS']);
  near(wideEnd.conditionalProbability,.95);
  near(wideEnd.probability,.2*.95);
  assert.equal(percent(wideEnd.probability),'19%');
  assert.ok(wideEnd.probability>narrowEnd.probability);
  near(wide.completed.find(c=>c.text===narrowEnd.text).probability,narrowEnd.probability);
}
export default {title,beats,draw,check};
