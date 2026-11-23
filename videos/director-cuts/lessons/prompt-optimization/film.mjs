import assert from 'node:assert/strict';

const prompts = [
  { id: 'A', instruction: 'Return a number' },
  { id: 'B', instruction: 'Copy all five digits' },
];

// These are worked model responses. Both graders replay this same development run.
const validation = [
  { city: 'Cambridge, MA', zip: '02139', copies: ['2139', '02139'], stamp: 'bridge' },
  { city: 'New York, NY', zip: '10001', copies: ['10001', '10001'], stamp: 'tower' },
];
const nextLetter = { city: 'Cambridge, MA', zip: '02138', stamp: 'bridge' };
const nextCopy = '02138';
const numeric = (expected, answer) => Number(expected) === Number(answer);
const exact = (expected, answer) => expected === answer;

function score(match) {
  return prompts.map((_, p) => validation.reduce(
    (points, letter) => points + Number(match(letter.zip, letter.copies[p])), 0,
  ));
}

function best(scores) {
  const high = Math.max(...scores);
  return prompts.filter((_, i) => scores[i] === high);
}

const winner = best(score(exact))[0];

const beats = [
  {
    id: 'four-digits',
    say: 'Count the digits that came off the Cambridge envelope. There should be one more. Look at the empty space on the left.',
    hold: 1.1,
  },
  {
    id: 'second-copy',
    say: 'We gave the same model two different prompts. The first asked for a number. Watch what comes out when we ask it to copy all five digits.',
    hold: 1.1,
  },
  {
    id: 'two-envelopes',
    say: 'There’s the missing zero. Let’s try the other envelope in our validation set. Both prompts make the same copy of the New York ZIP.',
    hold: 1.2,
  },
  {
    id: 'numeric-grade',
    say: 'Give each prompt a point for every ZIP it gets right. Suppose our grader reads the codes as numbers. Would you give that short Cambridge copy a point?',
    hold: 1.5,
  },
  {
    id: 'tie',
    say: 'It gets one. Drop the leading zero and the number has the same value. Both prompts get full marks. The search has a tie.',
    hold: 1.0,
  },
  {
    id: 'text-grade',
    say: 'The address label needs every digit. Keep these copies on the table and grade them again. This time, compare the text exactly as printed. Watch Cambridge.',
    hold: 1.4,
  },
  {
    id: 'choose',
    say: 'The empty box costs the first prompt a point. The second prompt kept both ZIP codes intact, so its instruction goes into the next run.',
    hold: 1.2,
  },
  {
    id: 'next-letter',
    say: 'Here comes another envelope, with a different Cambridge ZIP. Follow the first digit onto the new label.',
    hold: 3,
  },
];

const W = 840;
const ink = '#182f4d';
const cobalt = '#255595';
const rust = '#a33735';
const paper = '#f7ecce';
const clamp = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx, x, y, radius, color, stroke = 0) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (stroke) {
    ctx.lineWidth = stroke;
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function type(ctx, text, x, y, size, family = 'Sans', color = ink, align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(text, x, y);
}

function desktop(ctx) {
  const blue = ctx.createLinearGradient(0, 0, 1690, 1080);
  blue.addColorStop(0, '#8ca8ba');
  blue.addColorStop(0.6, '#7394ae');
  blue.addColorStop(1, '#5b7e98');
  rect(ctx, 0, 0, 1920, 1080, blue);
  // Flecks in the blue linoleum stay still under the camera.
  for (let i = 0; i < 630; i++) {
    const x = (i * 2069 + i * i * 17) % 1920;
    const y = (i * 1637 + i * i * 31) % 1080;
    rect(ctx, x, y, 2 + i % 4, 1 + i % 2, i % 3 ? '#d0e0dd33' : '#20466624');
  }
}

// A two-ink landscape, cut into the silhouette of a postage stamp.
function postage(ctx, tower) {
  ctx.save();
  ctx.translate(563, 31);
  ctx.fillStyle = '#fff6dd';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x < 216; x += 12) {
    ctx.lineTo(x + 2, 0); ctx.quadraticCurveTo(x + 6, 8, x + 10, 0);
  }
  ctx.lineTo(216, 0);
  for (let y = 0; y < 228; y += 12) {
    ctx.lineTo(216, y + 2); ctx.quadraticCurveTo(208, y + 6, 216, y + 10);
  }
  ctx.lineTo(216, 228);
  for (let x = 216; x > 0; x -= 12) {
    ctx.lineTo(x - 2, 228); ctx.quadraticCurveTo(x - 6, 220, x - 10, 228);
  }
  ctx.lineTo(0, 228);
  for (let y = 228; y > 0; y -= 12) {
    ctx.lineTo(0, y - 2); ctx.quadraticCurveTo(8, y - 6, 0, y - 10);
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(12, 12, 192, 204); ctx.clip();
  const sky = tower ? '#f1bc85' : '#c3d8d4';
  const dark = tower ? '#713e53' : '#244d68';
  rect(ctx, 12, 12, 192, 204, sky);
  circle(ctx, tower ? 63 : 143, 68, 38, '#ce5c43');
  if (tower) {
    for (let i = 0; i < 9; i++) {
      const h = 36 + (i * 23) % 61;
      rect(ctx, i * 26, 185 - h, 23, h, '#be7b72');
      for (let j = 0; j < 4; j++) rect(ctx, i * 26 + 3, 193 - h + j * 12, 12, 2, '#ecb58d');
    }
    polygon(ctx, [[12, 177], [55, 177], [55, 164], [130, 164], [130, 151], [206, 151], [206, 216], [12, 216]], dark);
    line(ctx, 117, 115, 111, 167, dark, 5); line(ctx, 151, 115, 159, 168, dark, 5);
    line(ctx, 114, 149, 153, 126, dark, 3); line(ctx, 154, 149, 117, 127, dark, 3);
    rect(ctx, 106, 70, 57, 53, dark);
    polygon(ctx, [[99, 72], [135, 46], [171, 72]], dark);
    for (let i = 0; i < 6; i++) line(ctx, 110 + i * 9, 76, 110 + i * 9, 115, '#d4937c', 2);
    for (const y of [86, 107]) line(ctx, 106, y, 163, y, dark, 3);
  } else {
    for (let i = 0; i < 14; i++) {
      const h = 12 + (i * 13) % 22;
      rect(ctx, i * 17, 122 - h, 16, h, '#829f9e');
    }
    rect(ctx, 12, 119, 192, 97, '#89b5bc');
    for (let i = 0; i < 28; i++) {
      const x = (i * 79) % 200;
      line(ctx, x, 146 + i * 2.6, x + 15 + i % 18, 146 + i * 2.6, '#e6e8cb', 1.6);
    }
    // The arch cutouts leave the river visible underneath the deck.
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(-19, 112); ctx.lineTo(237, 112); ctx.lineTo(237, 153);
    for (let x = 237; x > -19; x -= 64) {
      ctx.lineTo(x - 6, 153);
      ctx.bezierCurveTo(x - 6, 119, x - 56, 119, x - 56, 153);
      ctx.lineTo(x - 64, 153);
    }
    ctx.closePath(); ctx.fill();
    for (let x = 17; x < 210; x += 12) line(ctx, x, 103, x, 113, dark, 2);
    line(ctx, 10, 102, 206, 102, dark, 3);
    line(ctx, 10, 116, 206, 116, '#e6d9af', 2);
  }
  ctx.restore();
  ctx.restore();
}

function envelope(ctx, letter) {
  ctx.save();
  ctx.shadowColor = '#20344855';
  ctx.shadowBlur = 11; ctx.shadowOffsetY = 9;
  rect(ctx, 0, 0, W, 293, paper);
  ctx.shadowColor = 'transparent';
  const shade = ctx.createLinearGradient(0, 180, W, 0);
  shade.addColorStop(0, '#dfd0b6'); shade.addColorStop(0.42, '#f4e6c9'); shade.addColorStop(1, '#fff2d9');
  rect(ctx, 0, 0, W, 293, shade);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, 9); ctx.clip();
  for (let x = -28; x < W; x += 70) {
    polygon(ctx, [[x, 9], [x + 19, 9], [x + 29, 0], [x + 10, 0]], '#ae4743');
    polygon(ctx, [[x + 35, 9], [x + 54, 9], [x + 64, 0], [x + 45, 0]], '#3a6484');
  }
  ctx.restore();
  postage(ctx, letter.stamp === 'tower');
  // Cancellation waves extend past the etched image and onto the envelope.
  ctx.strokeStyle = '#39495880'; ctx.lineWidth = 2.4;
  for (let n = 0; n < 4; n++) {
    const y = 63 + n * 7;
    ctx.beginPath(); ctx.moveTo(500, y);
    ctx.bezierCurveTo(519, y - 12, 532, y + 11, 553, y);
    ctx.bezierCurveTo(568, y - 9, 584, y + 7, 605, y); ctx.stroke();
  }
  type(ctx, letter.city, 109, 125, 50, 'Serif');
  line(ctx, 108, 143, 482, 143, '#aa9c82', 1.5);
  for (let i = 0; i < 5; i++) {
    const x = 145 + i * 68;
    type(ctx, letter.zip[i], x, 249, 91, 'Mono', ink, 'center');
    line(ctx, x - 28, 261, x + 28, 261, '#9e8e74', 2);
  }
  ctx.restore();
}

function imprint(ctx, x, value, label, progress) {
  if (progress <= 0) return;
  ctx.save();
  ctx.translate(x, 80);
  ctx.rotate(label === 'Text' ? 0.055 : -0.06);
  ctx.globalAlpha *= Math.min(1, progress * 4);
  const size = 1 + 0.09 * (1 - progress);
  ctx.scale(size, size);
  const color = !value ? rust : label === 'Text' ? cobalt : '#56675e';
  circle(ctx, 0, 0, 54, color, 3.5);
  circle(ctx, 0, 0, 48, color, 1.2);
  type(ctx, label, 0, -10, 25, 'Sans', color, 'center', 600);
  type(ctx, String(Number(value)), 0, 35, 52, 'Mono', color, 'center');
  ctx.restore();
}

function strip(ctx, row, answer, letter, y, angle, grades, selected = false) {
  ctx.save();
  ctx.translate(20, y);
  ctx.rotate(angle);
  const width = W - 40, height = 155;
  ctx.shadowColor = '#19354744'; ctx.shadowOffsetY = 5; ctx.shadowBlur = 7;
  rect(ctx, 0, 0, width, height, '#faf2dc');
  ctx.shadowColor = 'transparent';
  rect(ctx, 0, 0, 67, height, row === 0 ? '#a64d40' : cobalt);
  type(ctx, prompts[row].id, 33, 93, 52, 'Serif', '#fff4d6', 'center');
  type(ctx, prompts[row].instruction, 93, 43, 36, 'Sans', ink, 'left', 600);
  const digits = answer.padStart(5, ' ');
  for (let i = 0; i < 5; i++) {
    const x = 94 + 68 * i;
    // Each printed box has room for exactly one character, even if the answer is short.
    ctx.strokeStyle = '#b8b1a0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 105); ctx.lineTo(x, 131); ctx.lineTo(x + 61, 131); ctx.lineTo(x + 61, 105); ctx.stroke();
    type(ctx, digits[i], x + 30.5, 122, 71, 'Mono', ink, 'center');
    if (digits[i] === ' ' && grades.text > 0) {
      line(ctx, x, 132, x + 61 * grades.text, 132, rust, 5);
    }
  }
  for (let i = 0; i < 9; i++) line(ctx, 479, 6 + i * 18, 479, 14 + i * 18, '#b3ac95', 2);
  if (selected) {
    type(ctx, 'Selected', 640, 91, 44, 'Serif', cobalt, 'center');
  } else {
    imprint(ctx, 567, numeric(letter.zip, answer), 'Number', grades.number);
    imprint(ctx, 705, exact(letter.zip, answer), 'Text', grades.text);
  }
  ctx.restore();
}

const letters = [
  { x: 98, y: 100, angle: -0.016 },
  { x: 988, y: 91, angle: 0.017 },
  { x: 2320, y: 123, angle: -0.012 },
];

function camera(wide, closeInspection, closing, second) {
  const openX = mix(513, 960, wide);
  const openY = mix(mix(304, 388, second), 496, wide);
  const openZoom = mix(mix(1.62, 1.36, second), 1, wide);
  const focusX = mix(mix(openX, 456, closeInspection), letters[2].x + W / 2, closing);
  const focusY = mix(mix(openY, 526, closeInspection), 370, closing);
  const zoom = mix(mix(openZoom, 1.86, closeInspection), 1.54, closing);
  return { x: 960 - zoom * focusX, y: 500 - zoom * focusY, zoom };
}

function ledger(ctx, byText, progress, chosen) {
  if (progress <= 0) return;
  const points = score(byText ? exact : numeric);
  ctx.save();
  ctx.translate(278, 790 + 280 * (1 - ease(progress)));
  ctx.fillStyle = '#f3df9e';
  ctx.shadowColor = '#24394b44'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 5;
  ctx.fillRect(0, 0, 1364, 127);
  ctx.shadowColor = 'transparent';
  line(ctx, 0, 9, 1364, 9, '#ad9968', 1.4);
  line(ctx, 0, 117, 1364, 117, '#ad9968', 1.4);
  type(ctx, byText ? 'Exact text match' : 'Numeric match', 58, 80, 51, 'Serif');
  points.forEach((pointsForPrompt, i) => {
    const x = 620 + 393 * i;
    type(ctx, prompts[i].id, x, 84, 53, 'Sans', i ? cobalt : rust, 'left', 700);
    type(ctx, pointsForPrompt + ' / ' + validation.length, x + 66, 84, 52, 'Mono');
  });
  if (chosen > 0) {
    ctx.strokeStyle = cobalt; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(1116, 66, 151, 49, -0.03, Math.PI * 1.2, Math.PI * (1.2 + 2 * chosen));
    ctx.stroke();
  }
  ctx.restore();
}

function draw(ctx, clock) {
  desktop(ctx);
  const at = (i, phrase, duration) => clock.index < i ? 0 : clock.index > i ? 1 : ease(clock.reveal(phrase, duration));
  const second = at(1, 'Watch what comes out', 1.3);
  const wide = at(2, 'try the other envelope', 1.75);
  const inspectNumber = at(3, 'Would you give', 1.2) - at(4, 'Both prompts', 1.2);
  const inspectText = at(5, 'This time', 1.2) - at(6, 'The second prompt', 1.2);
  // Land the numeric stamps in the prediction hold, after the viewer has seen both answers.
  const numericPress = clock.index === 3 ? ease((clock.elapsed - clock.speechDuration) / 0.45) : Number(clock.index > 3);
  const exactPress = at(5, 'Watch Cambridge', 0.55);
  const circled = at(6, 'The second prompt', 1.0);
  const closing = at(7, 'Here comes', 1.7);
  const freshPrint = at(7, 'Follow the first digit', 1.1);
  const lens = camera(wide, inspectNumber + inspectText, closing, second);
  ctx.save();
  ctx.translate(lens.x, lens.y); ctx.scale(lens.zoom, lens.zoom);
  for (let j = 0; j < letters.length; j++) {
    if (j === 1 && !wide || j === 2 && !closing) continue;
    const pose = letters[j];
    const letter = validation[j] ?? nextLetter;
    ctx.save();
    ctx.translate(pose.x, pose.y); ctx.rotate(pose.angle);
    if (j === 2) {
      const p = prompts.indexOf(winner);
      strip(ctx, p, nextCopy, letter, mix(118, 310, freshPrint), 0.006, {}, true);
    } else {
      const number = ease(numericPress * 1.3 - j * 0.10);
      const text = ease(exactPress * 1.3 - j * 0.10);
      const grades = { number, text };
      if (second > 0 || j === 1) {
        strip(ctx, 1, letter.copies[1], letter, mix(266, 478, second), 0.005, grades);
      }
      const emerge = clock.index > 0 ? 1 : ease(clock.elapsed / 1.3);
      strip(ctx, 0, letter.copies[0], letter, mix(224, 310, emerge), -0.004, grades);
    }
    envelope(ctx, letter);
    ctx.restore();
  }
  ledger(ctx, exactPress >= 0.5, numericPress * (1 - inspectNumber - inspectText), circled);
  ctx.restore();
}

function check() {
  assert.ok(validation.every(letter => /^\d{5}$/.test(letter.zip)));
  assert.deepEqual(validation.map(letter => letter.copies.map(answer => numeric(letter.zip, answer))), [[true, true], [true, true]]);
  assert.deepEqual(validation.map(letter => letter.copies.map(answer => exact(letter.zip, answer))), [[false, true], [true, true]]);
  assert.deepEqual(score(numeric), [2, 2]);
  assert.deepEqual(best(score(numeric)).map(p => p.id), ['A', 'B']);
  assert.deepEqual(score(exact), [1, 2]);
  assert.deepEqual(best(score(exact)).map(p => p.id), ['B']);
  assert.equal(winner.instruction, 'Copy all five digits');
  assert.equal(nextCopy, nextLetter.zip);
  assert.ok(validation.every(letter => letter.zip !== nextLetter.zip));
}

export default { title: 'A point for the missing zero?', beats, draw, check };
