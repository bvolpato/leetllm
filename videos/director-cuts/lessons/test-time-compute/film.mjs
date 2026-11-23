import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { tables, seats, extras, scored } from '../../../films/test-time-compute/fixtures.mjs';

const beats = [
  {
    id: 'pull-up-a-chair',
    say: "That last chair goes against the wall. How many chairs can the organizer count on? The model's first draft says forty-four.",
    hold: 1,
  },
  {
    id: 'count-the-room',
    say: "Let's check. Eight chairs fit around each table. Four tables give us thirty-two. Count the twelve against the wall as well, and forty-four fits the room.",
    hold: 1.3,
  },
  {
    id: 'another-draft',
    say: "Give the model the same question again. The second draft says thirty-two. That would cover the tables. See what's left along the wall? Generating another draft with the weights held fixed is one way to spend test-time compute.",
    hold: 1,
  },
  {
    id: 'highest-score',
    say: "Suppose we send whichever draft gets the highest score. With these example scores, forty-four leads. Give the model one more try. Which answer will the organizer get now?",
    hold: 2.3,
  },
  {
    id: 'four-without-chairs',
    say: "Watch the reply. The third draft scored point nine five, so the organizer gets forty-eight. Try handing out that many seat numbers. Where would the last four people sit?",
    hold: 2,
  },
  {
    id: 'use-the-room',
    say: "The first draft is still there. Keep all three and change how we choose. Check each one against the chair count. Only forty-four matches. We can send it without asking for another draft.",
    hold: 3,
  },
];

const TAU = Math.PI * 2;
const centers = [[288, 423], [806, 423], [288, 753], [806, 753]];
const wallX = i => 85 + i * 88 + 18 * Math.floor(i / 4);
const wallY = 171;
const chairsAtTables = centers.map(([cx, cy]) => Array.from({ length: seats }, (_, i) => {
  const a = (i + 0.5) * TAU / seats;
  return { x: cx + Math.cos(a) * 127, y: cy + Math.sin(a) * 127, angle: a - Math.PI / 2 };
}));
const chairsAtWall = Array.from({ length: extras }, (_, i) => ({ x: wallX(i), y: wallY, angle: Math.PI }));
const places = [...chairsAtTables.flat(), ...chairsAtWall];
const roomCount = places.length;
const bestScore = pool => pool.reduce((best, row) => row.score > best.score ? row : best);
const matchesRoom = pool => pool.filter(row => row.answer === roomCount);
const firstWinner = bestScore(scored.slice(0, 2));
const thirdWinner = bestScore(scored);
const excess = thirdWinner.answer - roomCount;
const ink = '#203b50';
const red = '#a9422e';
const paper = '#fff6de';
const ease = n => n * n * (3 - 2 * n);
const clamp = n => Math.max(0, Math.min(1, n));

function check() {
  assert.equal(centers.length, tables);
  assert.deepEqual([tables, seats, extras, roomCount], [4, 8, 12, 44]);
  assert.equal(new Set(places.map(({ x, y }) => x + ',' + y)).size, roomCount);
  assert.deepEqual(scored.map(row => row.answer), [44, 32, 48]);
  const trials = [1, 2, 3].map(n => {
    const pool = scored.slice(0, n);
    const { answer, score } = bestScore(pool);
    return [n, matchesRoom(pool).length, score, answer, answer === roomCount];
  });
  assert.deepEqual(trials, [[1, 1, 0.82, 44, true], [2, 1, 0.82, 44, true], [3, 1, 0.95, 48, false]]);
  assert.equal(excess, 4);
  assert.deepEqual(matchesRoom(scored), [scored[0]]);
}

function text(g, value, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  g.font = `${weight} ${size}px "Lesson ${family}"`;
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(String(value), x, y);
}

function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function rounded(g, x, y, w, h, r, color) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
}

function poly(g, points, color) {
  g.beginPath();
  g.moveTo(...points[0]);
  for (const vertex of points.slice(1)) g.lineTo(...vertex);
  g.closePath();
  g.fillStyle = color;
  g.fill();
}

function disc(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = color;
  g.fill();
}

function line(g, x, y, endX, endY, color, width = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(endX, endY);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}

function chair(g, x, y, angle) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  rounded(g, -23, -19, 51, 50, 12, '#4b3d3d40');
  for (const side of [-1, 1]) {
    rounded(g, side * 19 - 3, -22, 6, 47, 2, '#713e33');
    rounded(g, side * 19 - 2, -23, 3, 9, 1, '#df9270');
  }
  rounded(g, -23, -17, 46, 38, 10, '#803d32');
  rounded(g, -23, -20, 46, 37, 10, '#c6593e');
  rounded(g, -19, -17, 38, 29, 8, '#df7951');
  line(g, -13, -13, 12, -13, '#ef9971', 2);
  g.beginPath();
  g.moveTo(-25, 13);
  g.quadraticCurveTo(0, 32, 25, 13);
  g.lineWidth = 8;
  g.strokeStyle = '#783d30';
  g.stroke();
  g.translate(0, -3);
  g.lineWidth = 5;
  g.strokeStyle = '#df8356';
  g.beginPath();
  g.moveTo(-25, 13);
  g.quadraticCurveTo(0, 32, 25, 13);
  g.stroke();
  g.restore();
}

function supperTable(g, cx, cy, number) {
  for (const { x, y, angle } of chairsAtTables[number]) chair(g, x, y, angle);
  g.save();
  g.translate(cx, cy);
  disc(g, 5, 9, 104, '#4b3d3d35');
  disc(g, 0, 2, 105, '#3b5262');
  disc(g, 0, -2, 103, '#557990');

  // The weave is clipped by the hem. The place settings keep the table legible in the opening close-up.
  g.save();
  g.beginPath();
  g.arc(0, -2, 101, 0, TAU);
  g.clip();
  g.rotate((number % 2 ? 1 : -1) * 0.13);
  for (let i = -138; i < 140; i += 20) {
    rect(g, i, -150, 5, 300, '#c0d3d526');
    rect(g, -150, i, 300, 4, '#adc8c927');
    rect(g, i + 7, -150, 1.5, 300, '#cad6d533');
  }
  g.restore();

  for (let i = 0; i < seats; i++) {
    const a = (i + 0.5) * TAU / seats;
    const x = 78 * Math.cos(a), y = 78 * Math.sin(a) - 2;
    disc(g, x + 1.5, y + 2.5, 14, '#26435188');
    disc(g, x, y, 14, '#faf0d8');
    disc(g, x, y, 10, '#91abac');
    disc(g, x, y - 0.4, 9, '#f2e6cf');
  }

  g.save();
  g.rotate(number * 0.8);
  line(g, -16, 7, 12, -11, '#294f4c', 3);
  for (const [x, y] of [[2, -8], [-1, 4], [-13, 1]]) {
    g.fillStyle = '#89945e';
    g.beginPath();
    g.ellipse(x, y, 10, 4, -0.5, 0, TAU);
    g.fill();
  }
  disc(g, 8, -10, 9, '#d99e40');
  disc(g, 4, -14, 7.5, '#f2c75e');
  g.restore();
  g.restore();
}

function drawRoom(g) {
  rect(g, 0, 0, 1920, 1080, '#d4aa76');
  const wood = ['#dfb581', '#dcaf7b', '#e3bd8d', '#d9ac79', '#e1b887', '#e5bf91'];
  const block = 98;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 21; col++) {
      const x = col * block - 36, y = row * block + 53;
      for (let k = 0; k < 3; k++) {
        const along = (row + col) % 2 === 0;
        const px = x + (along ? 0 : k * block / 3), py = y + (along ? k * block / 3 : 0);
        rect(g, px, py, along ? block - 1 : block / 3 - 1, along ? block / 3 - 1 : block - 1,
          wood[(col * 23 + row * 7 + k * 5) % wood.length]);
        line(g, px + 6, py + 8, px + (along ? 65 : 7), py + (along ? 9 : 73), '#81563510', 1.2);
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = 66 + i * 338;
    poly(g, [[x, 76], [x + 210, 76], [x + 16, 500], [x - 194, 500]], '#fff1ce4d');
    poly(g, [[x + 100, 76], [x + 108, 76], [x - 86, 500], [x - 94, 500]], '#ae8c6037');
  }
  rect(g, 0, 0, 1920, 87, '#9e5a46');
  const panel = g.createLinearGradient(0, 0, 0, 87);
  panel.addColorStop(0, '#b9745a');
  panel.addColorStop(1, '#a25a43');
  rect(g, 0, 6, 1920, 64, panel);
  for (let i = 0; i < 15; i++) {
    rect(g, i * 142 - 29, 5, 5, 64, '#914c3d');
    rect(g, i * 142 - 24, 5, 2, 64, '#c58765');
  }
  rect(g, 0, 70, 1920, 6, '#cb9166');
  rect(g, 0, 77, 1920, 10, '#87533e');
  const wallShade = g.createLinearGradient(0, 87, 0, 121);
  wallShade.addColorStop(0, '#764b3e45');
  wallShade.addColorStop(1, '#764b3e00');
  rect(g, 0, 87, 1920, 34, wallShade);
  for (const { x, y, angle } of chairsAtWall.slice(0, -1)) chair(g, x, y, angle);
  centers.forEach(([x, y], i) => supperTable(g, x, y, i));
}

let background;
function roomImage() {
  if (!background) {
    background = createCanvas(1920, 1080);
    drawRoom(background.getContext('2d'));
  }
  return background;
}

function slip(g, x, y, w, h) {
  poly(g, [[x + 8, y + 10], [x + w + 12, y + 9], [x + w + 8, y + h + 13], [x + 8, y + h + 9]], '#5c3a3138');
  poly(g, [[x, y], [x + w, y], [x + w, y + h - 30], [x + w - 32, y + h], [x, y + h]], paper);
  poly(g, [[x + w - 32, y + h - 2], [x + w - 31, y + h - 32], [x + w - 1, y + h - 30]], '#e1cd9e');
}

// A return marker and a single number change together. The other drafts keep their places on the sheet.
function replySheet(g, s) {
  const x = 1233, y = 73, w = 615;
  slip(g, x, y, w, 846);
  rect(g, x, y, 13, 846, '#9d4838');
  line(g, x + 23, y + 8, x + 23, y + 834, '#c39c73', 2);
  text(g, 'Reply to the organizer', 1315, 161, 46, ink, 'Serif');
  line(g, 1315, 185, 1770, 185, ink, 2.5);

  // The outgoing number rolls out through the top of the same printed window.
  const first = scored[0].answer, over = thirdWinner.answer, checked = matchesRoom(scored)[0].answer;
  const baseY = 364, travel = 173;
  g.save();
  g.beginPath();
  g.rect(1303, 196, 472, 181);
  g.clip();
  const roll = (n, offset, a = 1) => {
    g.globalAlpha = a;
    text(g, n, 1539, baseY + offset, 188, ink, 'Serif', 'center');
  };
  if (s.audit > 0) {
    roll(over, -travel * s.audit);
    roll(checked, travel * (1 - s.audit));
  } else if (s.chooseThird > 0) {
    roll(firstWinner.answer, -travel * s.chooseThird);
    roll(over, travel * (1 - s.chooseThird));
  } else if (s.drafts[0] > 0) {
    roll(first, travel * (1 - s.drafts[0]), s.drafts[0]);
  }
  g.restore();
  text(g, 'chairs', 1540, 428, 47, ink, 'Serif', 'center');
  line(g, 1315, 469, 1770, 469, ink, 3);
  text(g, 'Draft', 1352, 532, 37, ink, 'Sans');
  if (s.showScores > 0) {
    g.save();
    g.globalAlpha = s.showScores;
    text(g, s.checks > 0 ? 'Room check' : 'Score', 1763, 532, 37, ink, 'Sans', 'right');
    g.restore();
  }

  const active = s.audit >= 0.5 ? scored[0] : s.chooseThird >= 0.5 ? thirdWinner : firstWinner;
  scored.forEach((row, i) => {
    const baseline = 614 + i * 103;
    line(g, 1316, baseline + 28, 1769, baseline + 28, '#cbbd9f', 1.8);
    const built = s.drafts[i];
    if (!built) return;
    g.save();
    g.globalAlpha = built;
    g.translate(0, 16 * (1 - built));
    text(g, row.answer, 1350, baseline, 60, ink, 'Mono');
    if (row === active) {
      poly(g, [[1309, baseline - 32], [1327, baseline - 19], [1309, baseline - 6]], red);
    }
    if (s.checks > 0) {
      const checked = clamp(s.checks * 3 - i);
      g.globalAlpha *= checked;
      const delta = row.answer - roomCount;
      const verdict = delta === 0 ? 'matches' : (delta > 0 ? '+' : '−') + Math.abs(delta);
      text(g, verdict, 1762, baseline - 1, 44, delta === 0 ? '#315e56' : red, 'Sans', 'right');
    } else {
      g.globalAlpha *= s.showScores;
      text(g, row.score.toFixed(2), 1762, baseline, 50, ink, 'Mono', 'right');
    }
    g.restore();
  });
}

function countedPlaces(g, s, deal) {
  centers.forEach(([x, y], i) => {
    const on = clamp(s.tableCount * centers.length - i) * (1 - clamp(deal * centers.length - i));
    if (!on) return;
    g.save();
    g.globalAlpha = on;
    g.translate(x, y - 2);
    rounded(g, -26, -24, 54, 52, 3, '#35465155');
    rounded(g, -29, -28, 54, 52, 3, paper);
    text(g, seats, -2, 11, 43, ink, 'Serif', 'center');
    g.restore();
  });
  if (!s.wallCount) return;
  g.save();
  g.globalAlpha = s.wallCount;
  const start = wallX(0) - 28, end = wallX(extras - 1) + 28;
  const mid = (start + end) / 2;
  line(g, start, 226, mid - 133, 226, '#684738', 2.8);
  line(g, mid + 133, 226, end, 226, '#684738', 2.8);
  line(g, start, 216, start, 226, '#684738', 2.8);
  line(g, end, 216, end, 226, '#684738', 2.8);
  text(g, extras + ' by the wall', mid, 238, 36, '#4c352e', 'Serif', 'center');
  g.restore();
  if (!s.roomTotal) return;
  g.save();
  g.globalAlpha = s.roomTotal;
  const x = 193, y = 930;
  rect(g, x + 3, y + 5, 725, 73, '#58403933');
  rect(g, x, y, 725, 73, '#fff5dc');
  text(g, 'Room count', x + 25, y + 50, 39, ink, 'Serif');
  text(g, tables + ' × ' + seats + ' + ' + extras + ' = ' + roomCount, x + 698, y + 51, 46, ink, 'Mono', 'right');
  g.restore();
}

function distributeNumbers(g, deal, amount) {
  places.forEach(({ x, y }, i) => {
    const landed = ease(clamp(deal * (places.length + 2) - i));
    if (!landed) return;
    g.save();
    g.globalAlpha = landed;
    g.translate(x, y - 2 - 15 * (1 - landed));
    g.rotate(Math.sin(i * 1.7) * 0.08);
    rect(g, -18, -11, 38, 28, '#683d2e55');
    rect(g, -20, -14, 38, 27, '#fff7e4');
    rect(g, -18, -13, 34, 2, red);
    text(g, i + 1, -1, 9, 24, ink, 'Sans', 'center', 600);
    g.restore();
  });
  if (!amount) return;
  for (let i = 0; i < excess; i++) {
    const on = ease(clamp(amount * excess - i));
    if (!on) continue;
    g.save();
    g.translate(1084 + (1 - on) * 76, 363 + i * 123);
    g.rotate([-0.12, 0.08, -0.06, 0.13][i] * on);
    g.scale(1.25, 1.25);
    g.globalAlpha = on;
    poly(g, [[-51, -30], [59, -30], [63, 37], [-46, 37]], '#714b3538');
    poly(g, [[-55, -40], [54, -40], [59, 29], [-49, 29]], '#fff7e4');
    poly(g, [[-49, 29], [59, 29], [62, 35], [-47, 35]], '#b99a70');
    line(g, -47, -30, 46, -30, red, 3);
    text(g, roomCount + 1 + i, 3, 16, 50, red, 'Serif', 'center');
    g.restore();
  }
}

function draw(g, clock) {
  function cue(beat, phrase, duration = 0.65) {
    if (clock.index !== beat) return Number(clock.index > beat);
    return ease(clock.reveal(phrase, duration));
  }
  const wide = cue(0, 'How many chairs', 1.8);
  const chairAtWall = clock.index === 0 ? ease(clamp(clock.elapsed / 1.6)) : 1;
  const s = {
    drafts: [cue(0, 'first draft'), cue(2, 'The second draft'), cue(3, 'one more try', 1)],
    tableCount: cue(1, 'Eight chairs', 2),
    wallCount: cue(1, 'Count the twelve', 0.9),
    roomTotal: cue(1, 'as well'),
    showScores: cue(3, 'highest score'),
    chooseThird: cue(4, 'Watch the reply', 0.85),
    checks: cue(5, 'Check each one', 1.65),
    audit: cue(5, 'against the chair count', 0.85),
  };
  const deal = cue(4, 'Try handing out', 2.4);
  const extraTags = clamp((deal - 0.85) / 0.15) * (1 - s.audit);
  g.save();
  const close = 1 - wide;
  g.translate(-1700 * close, -112 * close);
  g.scale(1 + 1.65 * close, 1 + 1.65 * close);
  g.drawImage(roomImage(), 0, 0);
  chair(g, wallX(extras - 1) + 35 * (1 - chairAtWall), wallY + 112 * (1 - chairAtWall),
    Math.PI + 0.55 * (1 - chairAtWall));
  countedPlaces(g, s, deal);
  distributeNumbers(g, clamp(deal / 0.85), extraTags);
  g.translate(700 * close, 0);
  replySheet(g, s);
  g.restore();
}

export default { title: 'Four chairs short', beats, draw, check };
