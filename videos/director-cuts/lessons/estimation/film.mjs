import assert from 'node:assert/strict';

// The campaign audit from the lesson. Each campaign contributed ten reviewed signups.
const campaigns = 'ABCDEFGHIJ'.split('').map((id, i) => ({ id, abusive: i < 2, size: 10 }));
const byId = Object.fromEntries(campaigns.map(c => [c.id, c]));
const original = [...'FCABDGEIHJ'];
const redraw = [...'BBGCEJFICD'];
const alternative = [...redraw.slice(0, -1), 'B'];

function tally(ids) {
  let total = 0, red = 0;
  for (const id of ids) {
    const { abusive, size } = byId[id];
    total += size;
    if (abusive) red += size;
  }
  return { red, total, percent: 100 * red / total };
}

const beforeSwap = tally(redraw);
const afterSwap = tally(alternative);
const looseBeadPercent = 100 * (beforeSwap.red + 1) / beforeSwap.total;

const beats = [
  {
    id: 'the-cord',
    say: "Follow the red bead at the bottom. See the nine above it swing with it? Each bead is a signup. All ten came from campaign B, and the reviewer marked all ten as abusive.",
    hold: 0.65,
  },
  {
    id: 'the-audit',
    say: "The audit picked ten campaigns at random and checked every signup in each one. In this example the signups on each cord all got the same label. Two red cords give us twenty abusive signups out of a hundred. Could a redraw give us twenty-one?",
    hold: 1.5,
  },
  {
    id: 'first-draw',
    say: "Let's make a bootstrap sample to see how much the estimate can move. Pick one of these ten campaigns at random. Hang a copy of its cord on the first hook. Now watch the next hook.",
    hold: 0.65,
  },
  {
    id: 'another-b',
    say: "B again. Each draw starts with the same ten campaigns, so we can pick one twice. That's sampling with replacement. Fill the other eight hooks. This redraw happens to have twenty red beads too.",
    hold: 0.9,
  },
  {
    id: 'last-hook',
    say: "How could we get twenty-one? Keep the first nine draws. On the last hook, trade just the bottom bead for a red one. Look at the nine pale beads above it. We've split a campaign.",
    hold: 1.7,
  },
  {
    id: 'ten-at-once',
    say: "Put that bead back. Now change the last draw from D to B. Ten red beads came across together. The estimate jumped from twenty percent to thirty. Counting the beads as independent draws would make the estimate look too precise. To measure the spread, redraw ten whole campaigns each time.",
    hold: 2.8,
  },
];

const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const left = i => 148 + i * 75;
const right = i => 1097 + i * 75;
const top = 274;

function ellipse(c, x, y, rx, ry, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function line(c, x1, y1, x2, y2, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.stroke();
}

function words(c, s, x, y, size, color, family = 'Lesson Sans', align = 'left') {
  c.font = `400 ${size}px "${family}"`;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}

function backdrop(c) {
  const light = c.createRadialGradient(668, 320, 80, 970, 390, 1240);
  light.addColorStop(0, '#324f4b');
  light.addColorStop(0.55, '#243f3d');
  light.addColorStop(1, '#142b2c');
  c.fillStyle = light;
  c.fillRect(0, 0, 1920, 1080);
  // Short stitches make the felt visible where the grazing light falls.
  c.lineWidth = 1.3;
  c.strokeStyle = '#b6cbb612';
  c.beginPath();
  for (let i = 0; i < 1500; i++) {
    const x = (i * 773 + (i % 63) * 23) % 1920;
    const y = (i * 947 + (i % 41) * 3) % 1080;
    c.moveTo(x, y); c.lineTo(x + 4 + i % 8, y - 2);
  }
  c.stroke();
}

function beam(c, start, end) {
  const x = start - 72, w = end - start + 144;
  c.fillStyle = '#102726';
  c.fillRect(x + 4, 210, w, 57);
  const wood = c.createLinearGradient(0, 202, 0, 251);
  wood.addColorStop(0, '#ac7c52'); wood.addColorStop(0.07, '#845b40');
  wood.addColorStop(0.55, '#664332'); wood.addColorStop(1, '#483129');
  c.fillStyle = wood;
  c.beginPath(); c.roundRect(x, 202, w, 49, 6); c.fill();
  c.save();
  c.clip();
  for (let i = 0; i < 9; i++) {
    c.strokeStyle = i % 2 ? '#e2b48621' : '#2a191632';
    c.lineWidth = 1 + i % 2;
    c.beginPath(); c.moveTo(x, 205 + 5 * i);
    c.bezierCurveTo(x + w * 0.32, 198 + i * 4, x + w * 0.42, 222 + i * 3, x + w, 206 + i * 5);
    c.stroke();
  }
  c.restore();
  for (const sx of [x + 19, x + w - 19]) {
    ellipse(c, sx, 227, 6, 6, '#d4ac74');
    line(c, sx - 3, 229, sx + 3, 224, '#705640', 1.5);
  }
  for (let i = 0; i < 10; i++) {
    const px = start + i * 75;
    line(c, px + 4, 240, px + 4, top + 5, '#172c2999', 8);
    line(c, px, 238, px, top, '#9a7448', 7);
    line(c, px - 1, 238, px - 1, top, '#c5a270', 2.5);
    ellipse(c, px, top, 8, 6, '#dcb781');
  }
}

// Glossy faceted red stones and turned ivory beads keep the two outcomes distinguishable in silhouette.
function bead(c, x, y, red, j) {
  c.save(); c.translate(x, y);
  if (red) {
    c.beginPath();
    c.moveTo(-11, -17); c.lineTo(10, -17); c.lineTo(21, -5);
    c.lineTo(20, 8); c.lineTo(9, 17); c.lineTo(-10, 17);
    c.lineTo(-20, 6); c.lineTo(-21, -6); c.closePath();
    c.fillStyle = '#ae422e'; c.fill();
    c.beginPath(); c.moveTo(-20, -6); c.lineTo(-11, -17); c.lineTo(10, -17);
    c.lineTo(7, -9); c.lineTo(-8, -7); c.closePath(); c.fillStyle = '#f5a479'; c.fill();
    c.beginPath(); c.moveTo(-8,-7); c.lineTo(7,-9); c.lineTo(13,1); c.lineTo(7,10);
    c.lineTo(-8,11); c.lineTo(-14,1); c.closePath(); c.fillStyle = j % 3 ? '#e7754d' : '#de6745'; c.fill();
    c.beginPath(); c.moveTo(13,1); c.lineTo(21,-5); c.lineTo(20,8);
    c.lineTo(9,17); c.lineTo(7,10); c.closePath(); c.fillStyle = '#8b3429'; c.fill();
    line(c, -12, -12, -4, -14, '#ffc6a0', 2.2);
  } else {
    const g = c.createLinearGradient(-16, -10, 19, 12);
    g.addColorStop(0,'#f3e3c4'); g.addColorStop(0.52,'#dbc8a8'); g.addColorStop(1,'#a58c71');
    ellipse(c, 0, 0, 19, 15, g);
    c.beginPath(); c.moveTo(-17, 2); c.bezierCurveTo(-11, 8, 9, 9, 17, 3);
    c.strokeStyle = '#a28b6f'; c.lineWidth = 1.8; c.stroke();
  }
  c.restore();
}

function strand(c, id, x, y, lean = 0, opacity = 1, loose = 0) {
  if (opacity <= 0) return;
  const { abusive, size } = byId[id];
  c.save(); c.globalAlpha *= opacity;
  c.translate(x, y); c.rotate(lean);
  c.strokeStyle = '#dbc39a'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(0, 7, 10, 16, 0, 0, Math.PI * 2); c.stroke();
  const bottom = 70 + 43 * (size - 1);
  line(c, 0, 22, 0, bottom + 32, '#b7986b', 3.8);
  // Leave the source letter attached when a cord travels.
  c.fillStyle = '#d3b37f';
  c.beginPath(); c.roundRect(-18, 23, 36, 32, 7); c.fill();
  words(c, id, 0, 49, 29, '#3a322c', 'Lesson Mono', 'center');
  for (let i = 0; i < size; i++) {
    const by = 75 + i * 43;
    ellipse(c, 4.5, by + 5.5, abusive ? 20 : 18, 16, '#142b2b77');
    if (i === size - 1 && loose > 0) {
      const out = ease(loose * 2);
      const arrive = ease(loose * 2 - 1);
      c.save(); c.globalAlpha *= 1 - out;
      bead(c, 20 * out, by + 48 * out, abusive, i);
      c.restore();
      c.save(); c.globalAlpha *= arrive;
      bead(c, -28 * (1 - arrive), by + 48 * (1 - arrive), true, i);
      c.restore();
    } else {
      bead(c, 0, by, abusive, i);
    }
    ellipse(c, 0, by + 20, 3.2, 2.6, '#c9ae83');
  }
  for (let i = -1; i <= 1; i++) line(c, 0, bottom + 29, i * 4, bottom + 39 + i, '#c4a57e', 2.4);
  c.restore();
}

function countLabel(c, ids, cx, opacity, changed = false) {
  if (opacity <= 0) return;
  const { percent, red, total } = tally(ids);
  c.save(); c.globalAlpha *= opacity;
  words(c, `${percent}%`, cx, 859, 88, changed ? '#ffc29d' : '#f4e7cf', 'Lesson Serif', 'center');
  words(c, `${red} abusive / ${total} signups`, cx, 914, 37, '#e2d6bf', 'Lesson Sans', 'center');
  c.restore();
}

function draw(c, clock) {
  const { index: b, elapsed, reveal } = clock;
  const open = b === 0;
  const assemble = b > 1 ? 1 : b === 1 ? ease(elapsed / 2.1) : 0;
  const widen = b > 2 ? 1 : b === 2 ? ease(elapsed / 2.25) : 0;
  const close = b === 4 ? ease(elapsed / 2.2) : b === 5 ? 1 - ease(reveal('To measure the spread', 2.4)) : 0;
  const zoom = mix(mix(mix(1.68, 1.15, assemble), 1, widen), 1.52, close);
  const cx = mix(mix(mix(518, 486, assemble), 960, widen), 1590, close);
  const cy = mix(mix(mix(520, 529, assemble), 540, widen), 516, close);
  backdrop(c);
  c.save(); c.translate(960, 540); c.scale(zoom, zoom); c.translate(-cx, -cy);
  beam(c, left(0), left(9));
  if (widen > 0) {
    c.save(); c.globalAlpha *= widen;
    beam(c, right(0), right(9));
    c.globalAlpha *= clamp(1 - 3 * close);
    words(c, 'Bootstrap redraw', (right(0) + right(9)) / 2, 149, 57, '#f3e7d2', 'Lesson Serif', 'center');
    c.restore();
  }

  const hero = original.indexOf('B');
  for (let i = 0; i < original.length; i++) {
    const id = original[i];
    if (i === hero) continue;
    const p = b > 1 ? 1 : ease((assemble * 1.55 - Math.abs(i - hero) * 0.075));
    strand(c, id, left(i), top - 35 * (1 - p), 0.08 * (1 - p), p);
  }
  const swing = open ? -0.29 * Math.cos(elapsed * 2.15) * Math.exp(-elapsed * 0.58) : 0;
  strand(c, 'B', left(hero), top, swing);
  if (assemble < 1) {
    c.save(); c.globalAlpha *= 1 - assemble;
    words(c, 'Campaign B', left(hero) + 128, 492, 57, '#fae9d1', 'Lesson Serif');
    if (open) {
      c.globalAlpha *= reveal('Each bead is a signup');
      words(c, '1 bead = 1 signup', left(hero) + 131, 548, 32, '#e8c3a1');
    }
    c.restore();
  }
  c.save(); c.globalAlpha *= assemble;
  words(c, 'Reviewed campaigns', (left(0) + left(9)) / 2, 149, 57, '#f3e7d2', 'Lesson Serif', 'center');
  c.restore();
  const auditCount = b > 1 ? 1 : b === 1 ? ease(reveal('Two red cords')) : 0;
  countLabel(c, original, (left(0) + left(9)) / 2, auditCount);

  // A copy departs from the peg identified by its letter. The reviewed campaign stays in the audit.
  function copyTo(id, slot, t) {
    if (t <= 0) return;
    const p = ease(t);
    const arc = Math.sin(Math.PI * p);
    const x = mix(left(original.indexOf(id)), right(slot), p);
    strand(c, id, x, top - arc * 143, -0.19 * arc, clamp(t * 6));
  }

  const first = b > 2 ? 1 : b === 2 ? reveal('Hang a copy', 1.7) : 0;
  const second = b > 2 ? 1 : b === 2 ? reveal('the next hook', 1.25) : 0;
  const fill = b > 3 ? 1 : b === 3 ? reveal('Fill the other eight hooks', 3.2) : 0;
  const loose = b === 4 ? reveal('trade just the bottom bead', 1.3) : b === 5 ? 1 - ease(elapsed / 1.15) : 0;
  const swap = b === 5 ? reveal('Now change the last draw', 2.45) : 0;
  const last = redraw.length - 1;
  copyTo(redraw[0], 0, first);
  copyTo(redraw[1], 1, second);
  for (let i = 2; i < redraw.length; i++) {
    const t = clamp(fill * 3.9 - (i - 2) * 0.415);
    if (i === last && loose > 0) {
      strand(c, redraw[i], right(i), top, 0, 1, loose);
    } else if (i !== last || swap === 0) {
      copyTo(redraw[i], i, fill === 1 ? 1 : t);
    }
  }
  if (swap > 0) {
    const leave = ease(swap / 0.55);
    strand(c, redraw[last], right(last) + 34 * leave, top - 170 * leave, 0.1 * leave, 1 - leave);
    copyTo(alternative[last], last, clamp((swap - 0.28) / 0.72));
  }
  if (fill > 0 && swap < 1) countLabel(c, redraw, (right(0) + right(9)) / 2, ease((fill - 0.98) / 0.02) * (1 - ease(swap * 4)) * clamp(1 - 3 * close));
  if (swap > 0) countLabel(c, alternative, (right(0) + right(9)) / 2, ease((swap - 0.86) / 0.14) * clamp(1 - 3 * close), true);
  if (close > 0) {
    c.save(); c.globalAlpha *= ease((close - 0.75) / 0.25);
    const x = right(last);
    const captionX = x + 99;
    // Suppress the settled tally while the final hook is between states.
    const inTransit = swap > 0 && swap < 1 ? swap : loose;
    c.globalAlpha *= 1 - ease(Math.min(inTransit, 1 - inTransit) * 8);
    const changed = swap > 0.86;
    const percent = changed ? afterSwap.percent : loose >= 0.98 ? looseBeadPercent : beforeSwap.percent;
    words(c, 'Redraw total', captionX, 578, 37, '#f3ddbe', 'Lesson Serif');
    words(c, percent + '%', captionX, 692, 86, '#ffc09d', 'Lesson Serif');
    const label = loose > 0.85 ? 'One loose bead' : changed ? 'Whole campaign' : 'All cords intact';
    words(c, label, captionX, 737, 29, '#ebd9bf');
    line(c, x + 25, 736, captionX - 16, 736, '#d6be9a', 2.5);
    c.restore();
  }
  c.restore();
}

function check() {
  assert.equal(new Set(original).size, campaigns.length);
  assert.deepEqual(tally(original), { red: 20, total: 100, percent: 20 });
  assert.equal(redraw.length, 10);
  assert.equal(redraw[0], redraw[1]);
  assert.equal(redraw.at(-1), 'D');
  assert.deepEqual(tally(redraw), tally(original));
  assert.deepEqual(tally(alternative), { red: 30, total: 100, percent: 30 });
  // Enumerate possible abusive counts after ten draws of whole observed campaigns.
  let counts = new Set([0]);
  for (let i = 0; i < redraw.length; i++) {
    counts = new Set([...counts].flatMap(n => campaigns.map(c => n + (c.abusive ? c.size : 0))));
  }
  assert.deepEqual([...counts].sort((a, b) => a - b), Array.from({ length: 11 }, (_, i) => i * 10));
  assert.equal(looseBeadPercent, 21);
  assert.ok(!counts.has(looseBeadPercent));
  // In this equal-size, single-label fixture, the bootstrap share has binomial variance p(1-p)/n.
  const p = beforeSwap.red / beforeSwap.total;
  const rowVariance = p * (1 - p) / beforeSwap.total;
  const campaignVariance = p * (1 - p) / redraw.length;
  assert.ok(Math.abs(campaignVariance / rowVariance - 10) < 1e-10);
}

export default { title: 'Could a Redraw Give Us Twenty-One?', beats, draw, check };
