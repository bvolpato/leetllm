import assert from 'node:assert/strict';
import { drawWindow } from './window.mjs';

const title = 'Structured generation: the last character on the token';
const beats = [
  {
    id: 'window',
    say: "The florist just turned the sign. Let's update the shop directory from this photo.",
    hold: 0.6,
  },
  {
    id: 'prefix',
    say: 'The directory accepts either of these JSON records. The model has already started its reply. See where the cursor sits? Three letters into the word closed.',
    hold: 1.1,
  },
  {
    id: 'one-piece',
    say: "Here's a possible next token in our example vocabulary. Those last three letters come attached to some punctuation. How much of this piece can the decoder use?",
    hold: 1.4,
  },
  {
    id: 'trial',
    say: "Follow the grammar as it tries the token. The letters finish the word. The quote closes the string. The brace closes the record. Look one character further.",
    hold: 1.2,
  },
  {
    id: 'mask',
    say: "That exclamation mark would spoil the JSON. The decoder masks out the whole token before sampling. Look back at the reply. The cursor hasn't moved.",
    hold: 1,
  },
  {
    id: 'other-token',
    say: "Here's a different token. Start from the same cursor and follow this one to the end. It fits exactly.",
    hold: 0.65,
  },
  {
    id: 'append',
    say: 'Watch the cursor. When the sampler picks this token, all five characters arrive together. Now the end token is allowed. Once the decoder chooses it, the directory can read the record.',
    hold: 0.65,
  },
  {
    id: 'read-back',
    say: 'The directory says closed. Open would also have fit the grammar at the start of the value. To check which one the florist meant, look at the window.',
    hold: 2.8,
  },
];

// Each token spells ASCII here, so a character in the picture is one byte.
const language = ['open', 'closed'].map(status => JSON.stringify({ status }));
const prefix = '{"status":"clo';
const shortToken = 'sed"}';
const longToken = shortToken + '!';
const end = Symbol('end');

function scan(text, token) {
  let trial = text;
  return Array.from(token, char => {
    trial += char;
    return {
      char,
      viable: language.some(record => record.startsWith(trial)),
      complete: language.includes(trial),
    };
  });
}

function allowed(text, token) {
  if (token === end) return language.includes(text);
  return token.length > 0 && scan(text, token).every(step => step.viable);
}

function append(text, token) {
  assert(allowed(text, token), 'Only a sampled, unmasked token may extend the reply');
  return token === end ? text : text + token;
}

const shortTrace = scan(prefix, shortToken);
const longTrace = scan(prefix, longToken);
// In this two-token draw only one candidate survives the grammar mask.
const candidates = [longToken, shortToken].filter(token => allowed(prefix, token));
const result = append(prefix, candidates[0]);
const directoryStatus = JSON.parse(append(result, end)).status;

function check() {
  assert.equal(new Set(beats.map(b => b.id)).size, beats.length);
  assert.deepEqual(language, ['{"status":"open"}', '{"status":"closed"}']);
  assert.equal(allowed('{"status":"', 'open'), true);
  assert.equal(allowed(prefix, end), false);
  assert(shortTrace.every(step => step.viable));
  assert.deepEqual(longTrace.slice(0, -1), shortTrace);
  assert.equal(longTrace.findIndex(step => step.complete), 4);
  assert.equal(longTrace.findIndex(step => !step.viable), 5);
  assert.deepEqual(candidates, [shortToken]);
  assert.deepEqual([longToken, shortToken, end].filter(t => allowed(prefix, t)), [shortToken]);
  assert.throws(() => append(prefix, longToken));
  assert.equal(result.length - prefix.length, 5);
  assert.equal(allowed(result, end), true);
  assert.equal(directoryStatus, 'closed');
}

const paper = '#f7eddd';
const ink = '#293854';
const blue = '#344ab1';
const dim = '#615c61';
const red = '#a53c3b';
const butter = '#ffe294';
const limit = v => Math.max(0, Math.min(1, v));
const ease = v => { const t = limit(v); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const photo = { x: 112, y: 145, w: 800, h: 500 };
const line = { x: 174, y: 828, cell: 69 };
const tokenX = 1050, tokenY = 324, tokenCell = 105;

function text(c, value, x, y, size, { color = ink, face = 'Sans', weight = '', align = 'left' } = {}) {
  c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle';
  c.font = (weight ? weight + ' ' : '') + size + 'px "Lesson ' + face + '"';
  c.fillText(value, x, y);
}

function stroke(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function faded(c, opacity, draw) {
  if (opacity <= 0) return;
  c.save(); c.globalAlpha *= Math.min(1, opacity); draw(); c.restore();
}

function paperAndPhoto(c, turn, settle) {
  const wash = c.createLinearGradient(0, 0, 1760, 1080);
  wash.addColorStop(0, '#fffae9'); wash.addColorStop(0.58, paper); wash.addColorStop(1, '#eaded1');
  c.fillStyle = wash; c.fillRect(-128, -128, 2176, 1336);
  c.save();
  c.translate(photo.x + photo.w / 2, photo.y + photo.h / 2);
  c.rotate(-0.025 * settle);
  c.translate(-photo.w / 2, -photo.h / 2);
  c.shadowColor = '#45362543'; c.shadowOffsetX = 3; c.shadowOffsetY = 9; c.shadowBlur = 18;
  c.fillStyle = '#fffbef'; c.fillRect(-15, -15, 830, 552);
  c.shadowColor = 'transparent';
  drawWindow(c, turn);
  c.restore();
}

function format(c, alpha) {
  faded(c, alpha, () => {
    text(c, 'Allowed records', 1034, 168, 38, { color: dim });
    language.forEach((record, i) => {
      text(c, record, 1033, 292 + 98 * i, 49, { face: 'Mono' });
    });
  });
}

function recordLine(c, committed, complete) {
  text(c, complete ? 'Completed reply' : 'Reply so far', line.x, 730, 39, { color: dim });
  const value = committed ? result : prefix;
  const origin = line.x + value.length * line.cell;
  stroke(c, line.x - 3, 907, 1750, 907, '#bfb3a9', 2);
  for (let i = 0; i < value.length; i++) {
    text(c, value[i], line.x + (i + 0.5) * line.cell, line.y, line.cell * 1.45,
      { face: 'Mono', align: 'center', color: i >= prefix.length ? blue : ink });
  }
  if (!complete) {
    stroke(c, origin + 2, line.y - 55, origin + 2, line.y + 55, red, 6);
    stroke(c, origin - 4, line.y + 55, origin + 9, line.y + 55, red, 4);
  }
}

function tokenContour(c, w) {
  c.beginPath();
  c.moveTo(12, -78); c.lineTo(w - 13, -78); c.lineTo(w, -65);
  c.lineTo(w, 66); c.lineTo(w - 12, 78); c.lineTo(12, 78);
  c.lineTo(0, 66); c.lineTo(0, -66); c.closePath();
}

function tokenPiece(c, token, trace, amount, x, y, scale, alpha, printed, masked = 0) {
  faded(c, alpha, () => {
    c.translate(x, y); c.scale(scale, scale);
    const w = token.length * tokenCell;
    faded(c, 1 - printed, () => {
      c.save(); c.translate(3, 10); tokenContour(c, w); c.fillStyle = '#36385e2d'; c.fill(); c.restore();
      tokenContour(c, w);
      const enamel = c.createLinearGradient(0, -78, 0, 78);
      enamel.addColorStop(0, '#485bc8'); enamel.addColorStop(1, '#33429f');
      c.fillStyle = enamel; c.fill();
      stroke(c, 13, -74, w - 14, -74, '#97a3e6', 2);
    });
    for (let i = 0; i < token.length; i++) {
      const hit = amount >= i + 0.5;
      let color = hit ? butter : '#fffbf0';
      if (hit && !trace[i].viable) {
        c.fillStyle = '#f7b0a0'; c.fillRect(i * tokenCell + 11, -59, tokenCell - 22, 118);
        color = '#652c36';
      }
      const center = (i + 0.5) * tokenCell;
      if (printed < 1) text(c, token[i], center, 0, tokenCell * 1.45, { face: 'Mono', color, align: 'center' });
      faded(c, printed, () => text(c, token[i], center, 0, tokenCell * 1.45, { face: 'Mono', color: blue, align: 'center' }));
    }
    if (amount > 0) {
      faded(c, 1 - printed, () => {
        const firstBad = trace.findIndex(step => !step.viable);
        const viableCount = firstBad < 0 ? trace.length : firstBad;
        const edge = Math.max(12, tokenCell * Math.min(viableCount, amount) - 9);
        stroke(c, 12, 65, edge, 65, butter, 4);
        if (amount >= viableCount && trace[viableCount - 1].complete)
          stroke(c, edge, 65, edge, 51, butter, 4);
      });
    }
    if (masked > 0) {
      // One deletion stroke spans the entire vocabulary entry.
      const reach = lerp(-7, w + 7, masked), rise = lerp(42, -40, masked);
      c.lineCap = 'round';
      stroke(c, -7, 42, reach, rise, '#ffedd3', 12);
      stroke(c, -7, 42, reach, rise, '#ab383e', 7);
    }
  });
}

function trialNote(c, note, progress, rejected) {
  if (!note) return;
  const tip = tokenX + (Math.max(1, progress) - 0.5) * tokenCell;
  const color = rejected ? red : blue;
  stroke(c, tip, tokenY + 87, tip, 472, color, 2);
  stroke(c, tokenX + 3, 472, tip, 472, color, 2);
  text(c, note, tokenX, 518, 46, { color, weight: 'bold' });
}

function listing(c, alpha) {
  faded(c, alpha, () => {
    text(c, 'Shop directory', 1034, 166, 36, { color: dim });
    stroke(c, 1035, 211, 1750, 211, '#827e81', 2);
    text(c, 'Aster Flowers', 1030, 318, 91, { face: 'Serif' });
    c.fillStyle = red; c.beginPath(); c.arc(1054, 420, 13, 0, 2 * Math.PI); c.fill();
    text(c, directoryStatus[0].toUpperCase() + directoryStatus.slice(1), 1091, 418, 60, { color: red });
  });
}

function draw(c, clock) {
  const { index, elapsed, reveal } = clock;
  const turn = index === 0 ? ease(elapsed / 2.15) : 1;
  let settle = index === 0 ? 0 : index === 1 ? ease(elapsed / 1.7) : 1;
  if (index === 7) settle = 1 - ease(reveal('look at the window', 1.5));
  const onPage = ease((settle - 0.88) / 0.12);
  // Pull straight out of the photographed window onto the directory's working copy.
  const zoom = lerp(2.45, 1, settle);
  c.save();
  c.fillStyle = paper; c.fillRect(0, 0, 1920, 1080);
  c.translate(960, 540); c.scale(zoom, zoom);
  c.translate(-lerp(photo.x + 400, 960, settle), -lerp(photo.y + 250, 540, settle));
  paperAndPhoto(c, turn, settle);
  const landed = index === 6 ? ease(reveal('When the sampler picks this token', 0.88)) : Number(index > 6);
  const read = index === 6 ? ease(reveal('Once the decoder chooses it', 0.65)) : Number(index > 6);
  faded(c, onPage, () => recordLine(c, landed === 1, read > 0));
  if (index <= 2) format(c, onPage * (index === 2 ? 1 - ease(elapsed / 0.38) : 1));

  if (index >= 2 && index <= 6) {
    const badOut = index === 5 ? ease(elapsed / 0.52) : Number(index > 5);
    const badIn = index === 2 ? ease((elapsed - 0.36) / 0.72) : 1;
    let longProgress = index >= 4 ? longToken.length : 0;
    if (index === 3) {
      longProgress = 3 * reveal('The letters finish', 0.85)
        + reveal('The quote closes', 0.42) + reveal('The brace closes', 0.42)
        + reveal('Look one character further', 0.46);
    }
    let masked = index > 4 ? 1 : 0;
    if (index === 4) masked = ease(reveal('masks out', 0.3));
    const shortIn = index === 5 ? ease((elapsed - 0.52) / 0.75) : Number(index > 5);
    const scanShort = index === 5 ? reveal('follow this one', 1.55) * shortToken.length : shortToken.length;
    const stillAtTrial = 1 - ease(landed / 0.10);
    const labelAlpha = index === 2 ? badIn : stillAtTrial;
    faded(c, labelAlpha, () => text(c, 'Candidate token', tokenX, 165, 39, { color: dim }));
    if (index <= 5) {
      tokenPiece(c, longToken, longTrace, longProgress,
        tokenX + (1 - badIn) * 210 + badOut * 430, tokenY - badOut * 82, 1, badIn * (1 - badOut), 0, masked);
      let note = '';
      if (longProgress >= 2.99) note = 'Word complete';
      if (longProgress >= 3.99) note = 'String closed';
      if (longProgress >= 4.99) note = 'Record could end here';
      if (longProgress >= 5.99) note = 'No continuation';
      if (masked >= 0.5) note = 'Masked out · 0% chance';
      faded(c, 1 - badOut, () => trialNote(c, note, longProgress, longProgress >= 5.99));
    }
    if (index >= 5 && landed < 1) {
      const x = lerp(tokenX, line.x + prefix.length * line.cell, landed);
      const y = lerp(tokenY + (1 - shortIn) * 180, line.y, landed);
      tokenPiece(c, shortToken, shortTrace, scanShort, x, y, lerp(1, line.cell / tokenCell, landed),
        shortIn, ease((landed - 0.82) / 0.18));
      if (scanShort >= shortToken.length) faded(c, stillAtTrial, () => trialNote(c, 'Eligible to sample', scanShort, false));
    }
  }
  if (index === 6 && landed === 1) {
    faded(c, ease(reveal('Now the end token is allowed', 0.42)) * (1 - read), () => {
      text(c, 'End token allowed', tokenX, 328, 52, { color: blue });
    });
  }
  listing(c, read * onPage);
  c.restore();
}

export default { title, beats, draw, check };
