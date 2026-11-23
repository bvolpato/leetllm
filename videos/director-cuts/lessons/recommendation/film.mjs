import assert from 'node:assert/strict';

const title = 'The other piano solo';
const request = ['quiet', 'solo', 'piano'];
const playCount = 2;

// Each jacket has catalog tags on the shelf and instrument credits from the session.
const records = [
  { name: 'Dawn', tags: ['quiet', 'solo', 'piano'], instruments: ['piano'], credit: 'Solo piano', paper: '#f9c45a', ink: '#423027' },
  { name: 'Brushwork', tags: ['quiet', 'solo'], instruments: ['drums'], credit: 'Solo drums', paper: '#c5b9df', ink: '#332e49' },
  { name: 'Duet', tags: ['quiet', 'piano'], instruments: ['piano', 'sax'], credit: 'Piano + sax', paper: '#ef7459', ink: '#49232a' },
  { name: 'Felt', tags: ['piano'], instruments: ['piano'], credit: 'Solo piano', paper: '#244e9c', ink: '#e4ede8' },
];

const tagHits = (record) => record.tags.filter((tag) => request.includes(tag)).length;
const pianoSolo = (record) => record.instruments.length === 1 && record.instruments[0] === 'piano';
const instrumentScore = (record) => pianoSolo(record) ? 2 : Number(record.instruments.includes('piano'));
// Listening judgments for this request are held outside both serving stages.
const judgedMatches = new Set(['Dawn', 'Felt']);

// Equal tag counts preserve filing order. Equal instrument scores preserve retrieval order.
const catalog = [...records].sort((a, b) => tagHits(b) - tagHits(a));
function selection(budget) {
  const pulled = catalog.slice(0, budget);
  const ranked = [...pulled].sort((a, b) => instrumentScore(b) - instrumentScore(a));
  const found = pulled.filter((record) => judgedMatches.has(record.name)).length;
  const possible = catalog.filter((record) => judgedMatches.has(record.name)).length;
  return { pulled, ranked, picks: ranked.slice(0, playCount), found, possible };
}
const small = selection(3);
const wide = selection(4);
const names = (items) => items.map((item) => item.name);

function check() {
  assert.deepEqual(catalog.map(tagHits), [3, 2, 2, 1]);
  assert.deepEqual(names(small.pulled), ['Dawn', 'Brushwork', 'Duet']);
  assert.deepEqual(names(small.picks), ['Dawn', 'Duet']);
  assert.deepEqual(names(wide.ranked), ['Dawn', 'Felt', 'Duet', 'Brushwork']);
  assert.deepEqual(names(wide.picks), ['Dawn', 'Felt']);
  assert.equal(small.found / small.possible, 0.5);
  assert.equal(wide.found / wide.possible, 1);
}

const beats = [
  {
    id: 'second-side',
    say: 'Here comes the second pick for a listener who asked for quiet solo piano. See the saxophone? How did a duet get into this set?',
    hold: 1.2,
  },
  {
    id: 'filed-under',
    say: 'Back at the shelf, all four records are available. Read the catalog tags. Dawn matches all three words. The blue sleeve, Felt, is filed under just piano.',
    hold: 0.9,
  },
  {
    id: 'pull-three',
    say: 'Keep an eye on Felt. Retrieval pulls the three records with the most matching tags. In a large catalog, a shortlist saves time. Only those candidates need a detailed score.',
    hold: 1.1,
  },
  {
    id: 'read-the-credits',
    say: 'The ranker reads the instrument credits on the sleeves. Watch the red one. Piano alone comes first. Piano with a sax comes ahead of drums.',
    hold: 0.9,
  },
  {
    id: 'left-on-the-shelf',
    say: 'Look up at Felt. Of the two quiet piano solos in the catalog, only Dawn reached the ranker. That fraction, one out of two, is candidate recall.',
    hold: 1.1,
  },
  {
    id: 'pull-four',
    say: 'Give retrieval one more record. The listener still gets two picks, and the ranker uses the same instrument credits. Which two will play now?',
    hold: 1.6,
  },
  {
    id: 'second-place',
    say: 'Follow the blue sleeve. Both solos reach the ranker this time. They tie, so it keeps their catalog order. Dawn stays first, and Felt slips ahead of the duet.',
    hold: 1.0,
  },
  {
    id: 'needle-down',
    say: 'Now the listener gets the other piano solo.',
    hold: 2.8,
  },
];

const TAU = Math.PI * 2;
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const ink = '#303731';
const cream = '#ffefd1';

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function circle(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}
function line(ctx, points, color, width) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function polygon(ctx, points, color) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function label(ctx, text, x, y, size, color, face = 'Sans', style = '400', align = 'left') {
  ctx.font = style + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function wash(ctx, x1, y1, x2, y2, stops) {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

function wood(ctx, x, y, w, h, light) {
  box(ctx, x, y, w, h, wash(ctx, x, y, x, y + h, light
    ? [[0, '#c9926c'], [0.48, '#eac49c'], [1, '#c39b79']]
    : [[0, '#885b46'], [0.2, '#ac7958'], [1, '#94654b']]));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 1; i < h / 9; i++) {
    const phase = i * 1.71;
    ctx.beginPath();
    ctx.moveTo(x, y + 10 * i);
    ctx.bezierCurveTo(x + 0.29 * w, y + 10 * i + 8 * Math.sin(phase),
      x + 0.68 * w, y + 10 * i - 12 * Math.cos(phase), x + w, y + 10 * i);
    ctx.strokeStyle = i % 3 ? '#53372217' : '#fff1c02b';
    ctx.lineWidth = i % 3 ? 1.4 : 2;
    ctx.stroke();
  }
  ctx.restore();
}

function room(ctx) {
  box(ctx, 0, 0, 1920, 1080, wash(ctx, 0, 0, 1820, 1030, [
    [0, '#f4e4c7'], [0.47, '#e9d7ba'], [1, '#b9c5b5'],
  ]));
  // Window light falls across the plaster above the listening counter.
  polygon(ctx, [[1020, 0], [1460, 0], [760, 1080], [337, 1080]], '#fff5da4d');
  polygon(ctx, [[1490, 0], [1550, 0], [852, 1080], [791, 1080]], '#fff5da41');
  for (let i = 0; i < 190; i++) {
    const x = (i * 907) % 1919;
    const y = (i * 577) % 1079;
    box(ctx, x, y, 2 + i % 5, 1.3, '#644e3b1c');
  }
}

function requestSign(ctx) {
  label(ctx, 'Listener request', 106, 70, 32, ink);
  label(ctx, 'Quiet solo piano', 100, 161, 84, ink, 'Serif', 'italic');
}

function keyboard(ctx, x, y, w, h, paper, black) {
  box(ctx, x, y, w, h, paper);
  const key = w / 9;
  for (let i = 1; i < 9; i++) {
    box(ctx, x + i * key - 0.009 * w, y, 0.009 * w, h, black);
    if (i % 7 !== 3 && i % 7 !== 0) {
      box(ctx, x + i * key - 0.29 * key, y, 0.56 * key, h * 0.62, black);
    }
  }
}

// Jacket artwork is drawn in a 300 by 300 square, so it travels with the record.
function coverArt(ctx, rec) {
  const { ink: print, paper } = rec;
  box(ctx, 0, 0, 300, 300, paper);
  if (rec.name === 'Dawn') {
    circle(ctx, 192, 145, 73, '#dc623d');
    polygon(ctx, [[0, 212], [77, 139], [152, 211], [217, 183], [300, 217], [300, 300], [0, 300]], '#ea9250');
    ctx.save();
    ctx.translate(-12, 189); ctx.rotate(-0.16);
    keyboard(ctx, 0, 0, 330, 84, '#ffedbf', print);
    ctx.restore();
  } else if (rec.name === 'Brushwork') {
    ctx.save();
    ctx.translate(148, 208); ctx.rotate(-0.16); ctx.scale(1, 0.48);
    circle(ctx, 0, 23, 119, print);
    circle(ctx, 0, 0, 119, '#f0d3a6');
    circle(ctx, 0, 0, 108, '#827799');
    circle(ctx, 0, 0, 104, '#f0ded1');
    ctx.restore();
    for (const [x, direction] of [[77, 1], [230, -1]]) {
      const end = x + 27 * direction;
      line(ctx, [[x, 104], [end, 161]], print, 9);
      for (let j = -5; j <= 5; j++) {
        line(ctx, [[end + j * 0.6, 158], [end + 22 * direction + j * 6, 206 - Math.abs(j) * 2]], print, 1.9);
      }
    }
  } else if (rec.name === 'Duet') {
    ctx.save();
    ctx.translate(5, 183); ctx.rotate(-0.17);
    keyboard(ctx, -2, 0, 163, 73, '#f5c2ad', print);
    ctx.restore();
    // A tenor sax curves back up into its wide bell.
    ctx.save();
    ctx.translate(6, -2);
    ctx.beginPath();
    ctx.moveTo(105, 101);
    ctx.bezierCurveTo(127, 82, 153, 76, 156, 102);
    ctx.lineTo(177, 197);
    ctx.bezierCurveTo(187, 244, 233, 232, 236, 188);
    ctx.lineTo(238, 160);
    ctx.lineWidth = 25;
    ctx.lineCap = 'round';
    ctx.strokeStyle = print;
    ctx.stroke();
    polygon(ctx, [[224, 180], [207, 137], [266, 114], [246, 178]], print);
    line(ctx, [[206, 138], [267, 114]], '#ffd9a9', 5);
    for (let i = 0; i < 4; i++) circle(ctx, 158 + i * 2.8, 125 + i * 13, 4.6, '#ffd9a9');
    ctx.restore();
  } else {
    circle(ctx, 216, 139, 54, '#93c9df');
    ctx.save();
    ctx.translate(14, 212); ctx.rotate(-0.34);
    keyboard(ctx, 0, 0, 291, 77, '#d8e8e4', '#1b376e');
    ctx.restore();
  }
  // Faint ink and edge wear stay fixed to each printed sleeve.
  for (let i = 0; i < 135; i++) {
    const x = (i * 71 + 13) % 301;
    const y = (i * 53 + 7) % 301;
    box(ctx, x, y, 0.9 + i % 4, 1, '#ffffe836');
  }
  label(ctx, rec.name, 15, 59, rec.name === 'Brushwork' ? 46 : 63, print, 'Serif', rec.name === 'Felt' ? 'italic' : '600');
  box(ctx, 0, 255, 300, 45, paper);
  label(ctx, rec.credit, 16, 290, 33, print, 'Sans', '600');
  box(ctx, 2, 3, 3, 294, '#fff6d94d');
}

function jacket(ctx, rec, x, y, size, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size / 300, size / 300);
  ctx.translate(-150, -150);
  ctx.shadowColor = '#392c3050';
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 13;
  box(ctx, 0, 0, 300, 300, rec.paper);
  ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.rect(0, 0, 300, 300); ctx.clip();
  coverArt(ctx, rec);
  ctx.restore();
}

function recordPlayer(ctx, rec, seconds, drop) {
  ctx.save();
  ctx.translate(1465, 596);
  ctx.transform(1, 0.025, -0.08, 0.84, 0, 0);
  wood(ctx, -329, -291, 715, 573, false);
  box(ctx, -326, -301, 708, 553, '#aab7aa');
  box(ctx, -317, -293, 688, 529, '#c9cfbc');
  const discX = -38, discY = -27;
  circle(ctx, discX, discY + 4, 242, '#57615b');
  circle(ctx, discX, discY, 237, '#dbe0ca');
  circle(ctx, discX, discY, 229, '#20232a');
  ctx.save();
  ctx.translate(discX, discY);
  for (let r = 90; r < 226; r += 7) {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    ctx.strokeStyle = r % 3 ? '#45464c' : '#626169';
    ctx.lineWidth = 1.2; ctx.stroke();
  }
  for (const angle of [-0.8, Math.PI - 0.8]) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 228, angle, angle + 0.26); ctx.closePath();
    ctx.fillStyle = '#d3dddc18'; ctx.fill();
  }
  ctx.rotate(seconds * TAU * 33.333 / 60);
  circle(ctx, 0, 0, 79, rec.paper);
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 76, 0, TAU); ctx.clip();
  box(ctx, -79, -75, 158, 34, rec.ink);
  label(ctx, rec.name, 0, 35, 35, rec.ink, 'Serif', '600', 'center');
  ctx.restore();
  circle(ctx, 0, 0, 8, '#272a2b');
  circle(ctx, -1, -1, 4, '#deded2');
  ctx.restore();
  // The pickup swings in from its rest and settles on the outside groove.
  const pivot = [282, -181];
  circle(ctx, ...pivot, 48, '#757d72');
  circle(ctx, ...pivot, 35, '#454c47');
  ctx.save();
  ctx.translate(...pivot); ctx.rotate(mix(-0.34, 0.31, drop));
  line(ctx, [[6, -46], [0, 0], [-7, 207], [-46, 272]], '#64685d', 18);
  line(ctx, [[3, -46], [-3, 0], [-10, 205], [-49, 270]], '#ebe9ce', 9);
  ctx.translate(-48, 264); ctx.rotate(0.46);
  box(ctx, -12, -9, 24, 48, '#414b44');
  box(ctx, -8, 31, 16, 15, rec.paper);
  ctx.restore();
  circle(ctx, ...pivot, 13, '#d6d8c4');
  box(ctx, -289, 196, 59, 19, '#6e7970');
  box(ctx, -284, 192, 52, 17, '#eef0d5');
  ctx.restore();
}

function listener(ctx, clock, result) {
  room(ctx);
  requestSign(ctx);
  wood(ctx, 0, 731, 1920, 349, true);
  polygon(ctx, [[0, 736], [1120, 736], [1040, 785], [0, 811]], '#5d49311c');
  const arrival = ease(clock.elapsed / 1.35);
  const [first, second] = result.picks;
  jacket(ctx, first, 310, 526, 431, -0.035);
  jacket(ctx, second, 827 + 35 * (1 - arrival), 529 - 132 * (1 - arrival), 438, mix(0.12, 0.018, arrival));
  wood(ctx, 56, 752, 1031, 27, false);
  box(ctx, 56, 750, 1031, 5, '#edc295');
  label(ctx, '1', 300, 831, 41, ink, 'Mono', '400', 'center');
  label(ctx, '2', 825, 831, 41, ink, 'Mono', '400', 'center');
  recordPlayer(ctx, second, clock.seconds, ease((clock.elapsed - 0.18) / 1.25));
}

const columns = [413, 797, 1181, 1565];
const topY = 350, tableY = 749, sleeveSize = 290;

function progressAt(clock, which, phrase, duration) {
  if (clock.index < which) return 0;
  if (clock.index > which) return 1;
  return clock.reveal(phrase, duration);
}

function shelf(ctx, clock) {
  // Move in to read the filing tags, then step back as the records come off the shelf.
  const closer = ease(progressAt(clock, 1, 'Read the catalog tags', 1.35));
  const pan = ease(progressAt(clock, 1, 'The blue sleeve', 1.65));
  const back = ease(progressAt(clock, 2, 'Keep an eye on Felt', 1.65));
  const zoom = closer * (1 - back);
  const lens = 1 + 1.25 * zoom;
  const cx = mix(960, mix(494, 1447, pan), zoom);
  const cy = mix(540, 395, zoom);
  ctx.translate(960, 540);
  ctx.scale(lens, lens);
  ctx.translate(-cx, -cy);

  room(ctx);
  ctx.save();
  ctx.globalAlpha = 1 - ease(zoom / 0.08);
  requestSign(ctx);
  ctx.restore();
  wood(ctx, 0, 502, 1920, 71, false);
  box(ctx, 0, 501, 1920, 6, '#f0d0a8');
  box(ctx, 0, 573, 1920, 16, wash(ctx, 0, 573, 0, 589, [[0, '#58391f35'], [1, '#58391f00']]));
  label(ctx, 'Catalog tags', 53, 548, 30, cream);
  for (const [index, rec] of catalog.entries()) {
    const x = columns[index];
    const width = 348;
    box(ctx, x - width / 2 + 3, 518, width, 42, '#593a2f6b');
    box(ctx, x - width / 2, 515, width, 42, '#f6e5c8');
    label(ctx, rec.tags.join(' · '), x, 548, 34, ink, 'Sans', '500', 'center');
  }

  wood(ctx, 0, 604, 1920, 362, true);
  box(ctx, 0, 604, 1920, 6, '#b38e72');
  wood(ctx, 0, 963, 1920, 117, false);
  box(ctx, 0, 963, 1920, 5, '#e1b88a');
  const pull = progressAt(clock, 2, 'Retrieval pulls', 1.85);
  if (pull > 0) {
    ctx.save();
    ctx.globalAlpha = ease(pull);
    label(ctx, 'Shortlist', 53, 755, 39, ink, 'Serif', 'italic');
    ctx.restore();
  }

  const reordered = progressAt(clock, 3, 'Piano alone comes first', 1.35);
  if (reordered > 0) {
    ctx.save();
    ctx.globalAlpha = ease(reordered);
    // The two play positions stay fixed when the candidate budget grows.
    for (let i = 0; i < playCount; i++) {
      line(ctx, [[columns[i] - 144, 900], [columns[i] - 144, 911],
        [columns[i] + 144, 911], [columns[i] + 144, 900]], '#463b32', 3);
      label(ctx, 'Pick ' + (i + 1), columns[i], 949, 33, ink, 'Sans', '600', 'center');
    }
    ctx.restore();
  }

  const extra = progressAt(clock, 5, 'Give retrieval one more record', 1.35);
  const finalOrder = progressAt(clock, 6, 'Follow the blue sleeve', 1.7);
  const positions = catalog.map((rec, index) => {
    const wasPulled = small.pulled.includes(rec);
    const down = wasPulled ? ease((pull - 0.1 * index) / 0.8) : ease(extra);
    const firstRank = wasPulled ? small.ranked.indexOf(rec) : index;
    const lastRank = wide.ranked.indexOf(rec);
    const firstSwap = ease(reordered), lastSwap = ease(finalOrder);
    const before = mix(columns[index], columns[firstRank], firstSwap);
    const x = mix(before, columns[lastRank], lastSwap);
    const pulling = Math.sin(Math.PI * down);
    const arc = (from, to, t) => (to === from ? 0 : to < from ? -1 : 0.35) * 116 * Math.sin(Math.PI * t);
    const y = mix(topY, tableY, down)
      + arc(index, firstRank, firstSwap) + arc(firstRank, lastRank, lastSwap);
    const tilt = 0.035 * pulling + (firstRank - index) * 0.055 * Math.sin(Math.PI * firstSwap)
      + (lastRank - firstRank) * 0.045 * Math.sin(Math.PI * lastSwap);
    const lifted = pulling + Math.max(0, tableY - y) / tableY * down;
    return { rec, x, y, tilt, lifted, size: sleeveSize + 12 * pulling };
  });
  for (const pose of positions.sort((a, b) => a.lifted - b.lifted)) {
    jacket(ctx, pose.rec, pose.x, pose.y, pose.size, pose.tilt);
  }

  if (clock.index >= 4) {
    const caption = progressAt(clock, 4, 'Of the two quiet piano solos', 0.5);
    const settled = extra === 0 || extra === 1;
    if (settled && caption > 0) {
      ctx.save();
      ctx.globalAlpha = ease(caption);
      const sample = extra === 1 ? wide : small;
      label(ctx, 'Piano solos retrieved', 1576, 113, 34, ink, 'Sans', '400', 'right');
      label(ctx, sample.found + ' / ' + sample.possible, 1834, 130, 70, ink, 'Serif', '600', 'right');
      ctx.restore();
    }
  }
}

function draw(ctx, clock) {
  ctx.save();
  if (clock.index === 0 || clock.index === beats.length - 1) {
    listener(ctx, clock, clock.index === 0 ? small : wide);
  } else {
    shelf(ctx, clock);
  }
  ctx.restore();
}

export default { title, beats, draw, check };
