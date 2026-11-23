import assert from 'node:assert/strict';
import { rows, tree, validationRows } from '../../../films/trees/fixtures.mjs';
import { predict } from '../../../films/trees/arithmetic.mjs';

const beats = [
  {
    id: 'the-loose-diamond',
    say: "Watch where that diamond lands. Each jewel is a past access request, set in order of ambiguity. A diamond means the request needed a reviewer. Can you spot the one the tree missed?",
    hold: 2,
  },
  {
    id: 'the-first-seam',
    say: "The glass tells you what the tree predicts. It chose this first split by looking for groups with purer labels, giving more weight to larger groups. All three on the right needed review. On the left, four out of five were routine. That majority sets the route for the whole blue pane.",
    hold: 1,
  },
  {
    id: 'two-more-cuts',
    say: "Keep the first seam. The tree can split just the group to its left. One cut puts the first two circles in their own pane. The diamond still shares blue glass with two circles. Cut between the diamond and those circles. Watch the light change.",
    hold: 1.3,
  },
  {
    id: 'one-example',
    say: "Every jewel now matches its pane. The tree gets all eight training requests right. Look at the narrow amber leaf. How many requests taught the tree to add a review there?",
    hold: 1.9,
  },
  {
    id: 'a-new-request',
    say: "Just one, at two. Leave those seams in place. Here's a new request with an ambiguity of two point one. Trace up from that mark. Which route does it get?",
    hold: 2.1,
  },
  {
    id: 'turn-it-over',
    say: "It gets the extra review. Let's turn it over to see what actually happened. A blue circle. This request was routine.",
    hold: 0.9,
  },
  {
    id: 'the-space-around-it',
    say: "Take out those two seams. The old request loses its reviewer. Put them back. The new one gets a review it didn't need. To choose how deep to grow this tree, count both kinds of mistakes on fresh requests.",
    hold: 3,
  },
];

const layers = [1, 2, 3].map(depth => {
  const panes = [];
  function visit(node, low, high, remaining) {
    if (remaining === 0 || node.feature === undefined) {
      panes.push({ low, high, n: node.n, rate: node.rate, review: node.rate >= 0.5 });
      return;
    }
    assert.equal(node.feature, 0);
    visit(node.left, low, node.cut, remaining - 1);
    visit(node.right, node.cut, high, remaining - 1);
  }
  visit(tree, -Infinity, Infinity, depth);
  return panes;
});

const training = rows.map(([value, , actual], i) => ({ id: `R${i + 1}`, value, actual }));
const singleton = training.find(request => request.id === 'R3');
const [incomingValue, , incomingLabel] = validationRows[1];
const [firstCut, lowCut, highCut] = [tree.cut, tree.left.cut, tree.left.right.cut];
const classify = (panes, value) => panes.find(pane => value <= pane.high);
const route = pane => pane.review ? 'Add review' : 'Usual checks';
function check() {
  assert.deepEqual([firstCut, lowCut, highCut], [3.35, 1.75, 2.4]);
  assert.deepEqual(layers[0].map(p => [p.n, p.rate]), [[5, 0.2], [3, 1]]);
  assert.ok(Math.abs(tree.gain - 0.3) < 1e-12);
  assert.deepEqual(training.filter(r => classify(layers[0], r.value).review !== Boolean(r.actual)).map(r => r.id), ['R3']);
  assert.deepEqual(layers[1].map(p => p.n), [2, 3, 3]);
  assert.equal(training.every(r => classify(layers[2], r.value).review === Boolean(r.actual)), true);
  const leaf = classify(layers[2], incomingValue);
  assert.equal(leaf, classify(layers[2], singleton.value));
  assert.deepEqual([leaf.low, leaf.high, leaf.n, incomingValue, incomingLabel], [1.75, 2.4, 1, 2.1, 0]);
  assert.equal(predict(tree, validationRows[1]), 1);
  assert.equal(classify(layers[2], lowCut).review, false);
  assert.equal(classify(layers[2], highCut).review, true);
}

const width = 1920;
const height = 1080;
const left = 145;
const right = 1775;
const sill = 641;
const minimum = 0.65;
const maximum = 4.85;
const mid = (left + right) / 2;
const xOf = value => left + (value - minimum) * (right - left) / (maximum - minimum);
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => clamp(n) ** 2 * (3 - 2 * clamp(n));
const mix = (a, b, t) => a + (b - a) * t;
const fixed = n => n.toFixed(2);
const jewelY = 414;
const frame = '#181c21';
const ivory = '#fff2d3';

// A shallow segmental arch keeps every request on the same straight sill.
function crown(x) {
  const u = (x - mid) / ((right - left) / 2);
  return 135 + 171 * u * u;
}
function windowPath(c) {
  c.beginPath();
  c.moveTo(left, sill);
  c.lineTo(left, crown(left));
  c.quadraticCurveTo(mid, -36, right, crown(right));
  c.lineTo(right, sill);
  c.closePath();
}
function line(c, points, color, thickness) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.strokeStyle = color;
  c.lineWidth = thickness;
  c.stroke();
}
function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function print(c, text, x, y, size, color, options = {}) {
  c.font = `${options.weight || 500} ${size}px "${options.mono ? 'Lesson Mono' : options.serif ? 'Lesson Serif' : 'Lesson Sans'}"`;
  c.textAlign = options.align || 'center';
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(text, x, y);
}
function polygon(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function ellipse(c, x, y, rx, ry, color) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}

function composition(clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (beat, phrase, duration) => index === beat ? smooth(reveal(phrase, duration)) : Number(index > beat);
  let first = cue(2, 'One cut', 1.25);
  let second = cue(2, 'Cut between the diamond', 1.35);
  if (index === 6) {
    const remove = cue(6, 'Take out', 1.8);
    const restore = cue(6, 'Put them back', 1.8);
    second = 1 - smooth(remove * 2) + smooth(restore * 2 - 1);
    first = 1 - smooth(remove * 2 - 1) + smooth(restore * 2);
  }
  const close = cue(3, 'Look at the narrow amber leaf', 2.65);
  const arrival = cue(4, "Here's a new request", 1.8);
  const tracing = cue(4, 'Trace up', 1.25);
  const flip = cue(5, "turn it over", 1.1);
  return {
    index, first, second, arrival, tracing, flip, close,
    zoom: 1 + 0.37 * close,
    center: mix(mid, xOf(2.32), close),
    leftCount: cue(1, 'On the left', 0.7),
    leftSweep: index === 1 ? reveal('On the left', 2.8) : 0,
    rightSweep: index === 1 ? reveal('All three', 2.2) : 0,
    rightCount: cue(1, 'All three', 0.7),
    fall: index === 0 ? clamp(elapsed / 2.1) : 1,
  };
}

function plaster(c) {
  c.fillStyle = gradient(c, 200, 0, 1800, 1080, [[0, '#433738'], [0.36, '#342d30'], [0.73, '#29292d'], [1, '#191e23']]);
  c.fillRect(0, 0, width, height);
  // Irregular horizontal strokes show the grain of the wall in raking light.
  for (let i = 0; i < 178; i++) {
    const x = (i * 829) % width;
    const y = (i * 347) % height;
    line(c, [[x, y], [x + 11 + (i * 37) % 145, y - (i % 3)]], i % 3 ? '#ffffff06' : '#03081017', 1 + i % 3);
  }
}
function paneBox(p) {
  return [p.low === -Infinity ? left : xOf(p.low), p.high === Infinity ? right : xOf(p.high)];
}
function paneFill(c, x, end, review, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  c.fillStyle = gradient(c, x + 30, 130, end - 25, sill + 30, review ? [
    [0, '#90552e'], [0.26, '#dc9543'], [0.53, '#f6bd60'], [0.78, '#c48543'], [1, '#995831'],
  ] : [
    [0, '#27606e'], [0.26, '#3a8798'], [0.53, '#6da7b1'], [0.78, '#498e9a'], [1, '#2c6c7b'],
  ]);
  c.fillRect(x, 85, end - x, sill);
  c.restore();
}
function glassTexture(c) {
  // These fixed streaks and seeds belong to the sheet. They stay still as a seam grows.
  for (let i = 0; i < 38; i++) {
    const x = left - 490 + i * 63;
    const wobble = Math.sin(i * 4.71) * 44;
    c.beginPath();
    c.moveTo(x, 70);
    c.bezierCurveTo(x+50, 255, x+175+wobble, 415, x+206+wobble, 690);
    c.bezierCurveTo(x+169+wobble, 484, x+76, 297, x-20-(i%4)*3, 70);
    c.fillStyle = i % 4 ? '#fdfff212' : '#16425410';
    c.fill();
  }
  for (let i = 0; i < 92; i++) {
    const x = left + (i * 739) % (right-left);
    const y = 128 + (i * 223) % 518;
    ellipse(c, x, y, 1.4 + i%5, 1.5 + (i%3)*0.6, '#fffbce39');
  }
}
function solder(c, x, fraction) {
  const bottom = sill + 2;
  const top = mix(bottom, crown(x) - 8, fraction);
  if (bottom - top < 1) return;
  c.fillStyle = '#0d252c46';
  c.fillRect(x+4, top+2, 12, bottom-top);
  c.fillStyle = gradient(c,x-6,0,x+7,0,[[0,'#29363a'],[0.3,'#8e9284'],[0.51,'#656962'],[0.78,'#363b3a'],[1,'#1c292e']]);
  c.fillRect(x-6,top,13,bottom-top);
  if (fraction < 0.99) ellipse(c, x, top, 6.5, 4, '#d0c9aa');
}
function architecture(c, s) {
  c.save();
  windowPath(c);
  c.lineJoin = 'round';
  c.shadowColor = '#090c0fcc';
  c.shadowBlur = 22;
  c.shadowOffsetY = 17;
  c.strokeStyle = '#211c20';
  c.lineWidth = 74;
  c.stroke();
  c.shadowBlur = c.shadowOffsetY = 0;
  for (const [thickness, color] of [[65, '#5a4843'],[52,'#3e3636'],[31,'#72625a'],[26,frame],[10,'#8b8071']]) {
    c.lineWidth = thickness;
    c.strokeStyle = color;
    c.stroke();
  }
  c.restore();
  c.save();
  windowPath(c);
  c.clip();
  for (const p of layers[0]) paneFill(c, ...paneBox(p), p.review);
  const inner = classify(layers[2], singleton.value);
  paneFill(c, ...paneBox(inner), inner.review, smooth((s.second - 0.48) / 0.52));
  glassTexture(c);
  const light = c.createRadialGradient(876, -102, 95, 876, -102, 1170);
  light.addColorStop(0, '#fff5cb4a');
  light.addColorStop(0.67, '#fff2bd04');
  light.addColorStop(1, '#12151d26');
  c.fillStyle = light;
  c.fillRect(left, 80, right-left, 580);
  solder(c, xOf(firstCut), 1);
  solder(c, xOf(lowCut), s.first);
  solder(c, xOf(highCut), s.second);
  c.restore();
  // A shallow projection beneath each pane preserves its extent on the sill.
  for (const [p, alpha] of [...layers[0].map(p => [p, 1]), [inner, s.second]]) {
    if (!alpha) continue;
    const [a, b] = paneBox(p);
    c.save();
    c.globalAlpha = alpha;
    polygon(c, [[a,sill+55],[b,sill+55],[b-184,930],[a-184,930]],
      gradient(c,0,sill+44,0,930,[[0,p.review ? '#e8aa5550' : '#83c5c642'],[1,'#98988100']]));
    c.restore();
  }
  c.fillStyle = gradient(c,0,sill,0,sill+77,[[0,'#191c21'],[0.1,'#817469'],[0.18,'#bfae94'],[0.24,'#74685e'],[0.7,'#554a47'],[0.88,'#393537'],[1,'#191e22']]);
  c.fillRect(left-44, sill, right-left+88, 76);
}

function jewelShape(c, review, radius) {
  c.beginPath();
  if (review) {
    c.moveTo(0,-radius);
    c.lineTo(radius,0);
    c.lineTo(0,radius);
    c.lineTo(-radius,0);
    c.closePath();
  } else {
    c.arc(0,0,radius,0,Math.PI*2);
  }
}
function jewel(c, x, y, label, size) {
  const review = Boolean(label);
  c.save();
  c.translate(x,y);
  jewelShape(c, review, size);
  c.shadowColor = '#16202799';
  c.shadowBlur = 8;
  c.shadowOffsetY = 7;
  c.fillStyle = '#27343a';
  c.fill();
  c.shadowBlur = c.shadowOffsetY = 0;
  const r = size * 0.84;
  jewelShape(c, review, r);
  c.fillStyle = gradient(c,-r,-r,r,r,review ?
    [[0,'#fbdc8f'],[0.33,'#eeb14f'],[0.55,'#ab5e25'],[1,'#663c28']] :
    [[0,'#b5f2ec'],[0.32,'#6bb9c9'],[0.66,'#287080'],[1,'#103e53']]);
  c.fill();
  if (review) {
    polygon(c, [[0,-r],[-r,0],[-r*0.40,0],[0,-r*0.45]],'#fff0ad');
    polygon(c, [[0,-r],[r,0],[r*0.40,0],[0,-r*0.45]],'#f0bd6c');
    polygon(c, [[r,0],[0,r],[0,r*0.45],[r*0.40,0]],'#a86028');
    polygon(c, [[0,r],[-r,0],[-r*0.40,0],[0,r*0.45]],'#da9440');
    polygon(c, [[0,-r*0.45],[r*0.40,0],[0,r*0.45],[-r*0.40,0]],'#ffdd8a');
  } else {
    c.beginPath(); c.arc(0,0,r*0.74,Math.PI*1.04,1.69*Math.PI);
    c.strokeStyle = '#d7f8ea'; c.lineWidth = r*0.092; c.stroke();
    ellipse(c,r*0.2,r*0.33,r*0.32,r*0.12,'#a2dfe151');
  }
  c.restore();
}

function oldRequests(c, s) {
  if (s.fall < 1) {
    c.save();
    c.translate(xOf(singleton.value), jewelY);
    jewelShape(c, true, 50);
    c.fillStyle = '#234957';
    c.fill();
    c.strokeStyle = '#b7c8bb';
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  }
  for (const row of training) {
    const hero = row === singleton;
    const t = s.fall;
    const bounce = t < 0.76 ? -250*(1-(t/0.76)**2) : -13*Math.sin(Math.PI*(t-0.76)/0.24);
    const x = xOf(row.value), y = jewelY + (hero ? bounce : 0);
    const size = row.actual ? 51 : 40;
    jewel(c,x,y,row.actual,size);
    if (s.index === 1 && row !== singleton) {
      const sweep = row.actual ? s.rightSweep : s.leftSweep;
      const start = row.actual ? xOf(firstCut) : left;
      const end = row.actual ? right : xOf(firstCut);
      const beam = start - 100 + sweep * (end - start + 200);
      const gleam = clamp(1 - Math.abs(beam - x)/100);
      if (gleam > 0) {
        c.save();
        c.translate(x,y);
        c.globalAlpha = 0.84*gleam;
        jewelShape(c, Boolean(row.actual), size + 6);
        c.strokeStyle = '#fff4ca';
        c.lineWidth = 5;
        c.stroke();
        c.restore();
      }
    }
    if (hero && t > 0.93) {
      c.save();
      c.globalAlpha = smooth((t-0.93)/0.07);
      print(c,`${row.id} · ${row.value.toFixed(1)}`, x, jewelY+79, 38, '#122f37', {weight:700});
      c.restore();
    }
  }
}

function paneNames(c, s) {
  const depth = s.second > 0.82 ? 2 : s.first > 0.82 ? 1 : 0;
  const panes = layers[depth];
  const hideOld = t => 1 - smooth(t/0.35);
  const showNew = t => smooth((t-0.82)/0.18);
  const viewX = x => mid + (x - s.center)*s.zoom;
  for (const pane of panes) {
    const [a,b] = paneBox(pane), x = (a+b)/2;
    const name = route(pane);
    if (viewX(x) < 145 || viewX(x) > width-145) continue;
    let alpha = 1;
    if (pane.low < firstCut) {
      if (depth === 0) alpha = hideOld(s.first);
      if (depth === 1) alpha = showNew(s.first) * (pane.low === lowCut ? hideOld(s.second) : 1);
      if (depth === 2 && pane.low >= lowCut) alpha = showNew(s.second);
    }
    c.save();
    c.globalAlpha = alpha * (s.index === 0 ? smooth((s.fall-0.70)/0.30) : 1);
    print(c,name,x,338,depth > 0 && b-a < 420 ? 39 : 50, '#132f35', {serif:true,weight:600});
    c.restore();
  }
  if (s.index !== 1) return;
  for (const [i,p] of layers[0].entries()) {
    const [a,b] = paneBox(p);
    const majority = Math.round(p.n * (p.review ? p.rate : 1-p.rate));
    c.save();
    c.globalAlpha = i === 0 ? s.leftCount : s.rightCount;
    print(c,`${majority} of ${p.n} ${p.review ? 'needed review' : 'routine'}`,(a+b)/2,565,37,'#172f32');
    c.restore();
  }
}
function scale(c, s) {
  for (let q = 4; q <= 24; q++) {
    const x = xOf(q/5);
    line(c, [[x,sill+10],[x,sill+(q%5 ? 20:31)]], '#302f2e', q%5 ? 2 : 4);
    if (q%5 === 0) print(c,String(q/5),x,sill+53,39,ivory,{mono:true});
  }
  for (const [value, visible] of [[firstCut,1],[lowCut,s.first],[highCut,s.second]]) {
    if (visible <= 0) continue;
    const x = xOf(value);
    c.save();
    c.globalAlpha = visible;
    polygon(c,[[x-8,sill+7],[x+8,sill+7],[x,sill+20]],'#f4d199');
    print(c,fixed(value),x,crown(x)-49,40,'#f0dbb8',{mono:true});
    line(c,[[x,crown(x)-29],[x,crown(x)-14]],'#c2ac8b',2);
    c.restore();
  }
}
function newRequest(c, s) {
  if (s.arrival <= 0) return;
  const x = xOf(incomingValue);
  const y = mix(754,578,s.tracing);
  const rad = 53;
  c.save();
  c.globalAlpha = s.arrival;
  // A pin rises from the value on the scale. Its shaft stays on the same x coordinate.
  line(c,[[x,sill+6],[x,y]],'#202f32',8);
  line(c,[[x-1,sill+6],[x-1,y]],'#ddd2b4',3);
  c.save();
  c.translate(x, y+45*(1-s.arrival));
  const cosine = Math.cos(Math.PI*s.flip);
  c.scale(Math.max(0.025,Math.abs(cosine)),1);
  if (cosine < 0) {
    jewel(c,0,0,incomingLabel,rad);
  } else {
    ellipse(c,0,3,rad,rad,'#384048');
    ellipse(c,0,0,rad-4,rad-4,gradient(c,-rad,-rad,rad,rad,[[0,'#fff3d3'],[0.56,'#ded1af'],[1,'#938879']]));
    print(c,incomingValue.toFixed(1),0,0,40,'#46403c',{mono:true,weight:600});
  }
  c.restore();
  const labelAlpha = clamp(s.tracing*2);
  if (labelAlpha > 0) {
    c.globalAlpha *= labelAlpha;
    const result = s.flip > 0.56;
    const leadStart = x + rad + 8;
    const captionX = xOf(highCut) + 34;
    line(c,[[leadStart,y],[captionX-12,y]],'#244249',2.5);
    print(c, result ? 'Actually routine' : 'New request',captionX,y-9,35,'#142f36',{align:'left',weight:600});
    print(c,incomingValue.toFixed(1),captionX,y+29,29,'#153943',{align:'left',mono:true});
  }
  c.restore();
}
function key(c,s) {
  c.save();
  c.globalAlpha = 1 - s.close;
  line(c,[[162,836],[311,836]],'#a5947e',2);
  print(c,'Past requests',160,886,44,'#ead9c4',{align:'left',serif:true});
  jewel(c,497,884,0,25);
  print(c,'Routine',545,885,41,'#e6d9c7',{align:'left'});
  jewel(c,812,884,1,30);
  print(c,'Needed review',865,885,41,'#e6d9c7',{align:'left'});
  c.restore();
}
function draw(c, clock) {
  const s = composition(clock);
  plaster(c);
  c.save();
  c.translate(mid,220);
  c.scale(s.zoom,s.zoom);
  c.translate(-s.center,-220);
  architecture(c,s);
  paneNames(c,s);
  oldRequests(c,s);
  scale(c,s);
  newRequest(c,s);
  c.restore();
  const axisX = mix(right+10,width-102,s.close);
  print(c,'Ambiguity →',axisX,mix(767,945,s.close),39,'#e2d4c2',{align:'right',serif:true});
  key(c,s);
}

export default { title: 'Who shares a decision tree leaf?', beats, draw, check };
