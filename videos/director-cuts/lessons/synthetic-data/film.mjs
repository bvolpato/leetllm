import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { cursorClient, firstPageOnlyClient } from '../../../films/synthetic-data/fixtures.mjs';
import { runSearchFixture } from '../../../films/synthetic-data/model.mjs';

const first = runSearchFixture({ run: firstPageOnlyClient });
const second = runSearchFixture({ run: cursorClient });
const [front, back] = second.trace.filter(({ response }) => response.status === 200);
const expected = [...front.response.items, ...back.response.items];
const anyName = (run) => run.result.items.length > 0;

const beats = [
  {
    id: 'two-names',
    say: "Ada, Grace. The client stops, and its test passes. Would you use this answer to teach another model to fetch every name?",
    hold: 0.55,
  },
  {
    id: 'weak-test',
    say: "We asked a model to turn a reviewed search task into a two-page exercise and write the client. Suppose it wrote the test, too. Ada alone earns that check mark.",
    hold: 0.85,
  },
  {
    id: 'pull-the-tab',
    say: "Look under Grace. Our test directory follows the service's own rules. That orange tab is the cursor for the next page. Pull it.",
    hold: 1.65,
  },
  {
    id: 'the-gap',
    say: "There's Linus. His page ends with an empty cursor. Look across at the output. The first client stopped one page early. Set this answer aside.",
    hold: 0.9,
  },
  {
    id: 'another-answer',
    say: "Try a second generated answer on the same directory. Again we get Ada and Grace. Watch its next request.",
    hold: 1.4,
  },
  {
    id: 'the-third-name',
    say: "It sends back the first page's cursor. Here comes the reply. There's Linus. The empty cursor tells the client to stop.",
    hold: 0.65,
  },
  {
    id: 'keep-the-evidence',
    say: "This answer passes the two-page test. Keep the result with the training example. A reviewer can see exactly what the client returned.",
    hold: 3.1,
  },
];

function check() {
  assert.deepEqual(expected, ['Ada', 'Grace', 'Linus']);
  assert.equal(front.response.nextCursor, back.request.cursor);
  assert.equal(back.response.nextCursor, null);
  assert.deepEqual(first.requests, second.requests.slice(0, 2));
  assert.equal(anyName(first), true);
  assert.deepEqual(first.result.items, front.response.items);
  assert.equal(first.checks.followedCursor, false);
  assert.equal(first.accepted, false);
  assert.deepEqual(second.result.items, expected);
  assert.equal(second.checks.followedCursor, true);
  assert.equal(second.accepted, true);
}

const navy = '#202b52';
const cream = '#fff2c7';
const orange = '#ff8253';
const mint = '#b1f8d1';
const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => value * value * (3 - 2 * value);

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function label(ctx, value, x, y, size, color = navy, face = 'Sans', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.fillText(value, x, y);
}

function paper(ctx, x, y, w, h, top, bottom) {
  const wash = ctx.createLinearGradient(x, y, x + w * 0.45, y + h);
  wash.addColorStop(0, top);
  wash.addColorStop(1, bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
}

function ground(ctx) {
  paper(ctx, 0, 0, 1920, 1080, '#293fa1', '#172865');
  // Coarse, irregular fibers in the blue cloth stay in place as the leaves move.
  for (let n = 0; n < 560; n++) {
    const x = (n * 149 + (n * n) % 127) % 1920;
    const y = (n * 197 + (n * n) % 251) % 1080;
    line(ctx, x, y, x + 1 + n % 7, y + 0.8, n % 2 ? '#ffffff13' : '#07093a20', 1.5);
  }
}

// The tiny two-ink portraits belong to the directory. The API returns only the names.
const portraits = [
  { paper: '#eeaf9d', ink: '#613d61', head: 'M28 91 Q35 79 48 76 L49 64 Q34 60 35 37 Q35 17 55 16 Q75 14 79 36 L85 49 L77 51 Q78 69 64 68 L65 78 Q79 80 88 95 L28 95Z', hair: 'M33 60 Q17 64 22 49 Q29 39 27 32 Q25 17 42 13 Q64 3 74 19 L78 31 Q67 31 57 26 Q51 40 44 44 Q46 59 33 60Z' },
  { paper: '#a6c4cb', ink: '#305771', head: 'M15 96 Q25 80 42 76 L43 66 Q32 59 31 40 Q29 22 44 15 Q64 8 73 27 L76 39 L83 49 L75 51 Q73 67 60 67 L62 77 Q81 80 88 96Z', hair: 'M28 54 Q18 30 33 17 Q44 7 55 11 Q73 7 78 23 L68 27 Q48 22 42 40 L38 55 L34 68Z' },
  { paper: '#eeb68a', ink: '#723d46', head: 'M15 97 Q24 82 42 76 L45 66 Q33 59 32 39 Q31 23 45 15 Q65 9 74 28 L75 39 L82 49 L74 51 Q71 68 59 66 L61 76 Q82 82 87 97Z', hair: 'M29 47 Q19 39 25 31 Q18 20 30 18 Q32 7 43 10 Q49 0 60 9 Q76 3 76 18 Q86 24 72 31 L63 28 L57 32 L46 28 L40 42 L37 53Z' },
].map(({ head, hair, ...inks }) => ({ ...inks, cut: new Path2D(head + hair) }));

function portrait(ctx, person, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.91, 0.91);
  ctx.beginPath();
  ctx.ellipse(52, 51, 48, 51, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = person.paper;
  ctx.fillRect(0, 0, 105, 103);
  for (let i = -4; i < 11; i++) line(ctx, i * 13, 0, i * 13 + 50, 103, '#fff1cc72', 2);
  ctx.fillStyle = person.ink;
  ctx.fill(person.cut);
  line(ctx, 66, 38, 72, 37.2, cream, 1.7);
  line(ctx, 45, 76, 55, 86, person.paper, 2);
  line(ctx, 55, 86, 62, 76, person.paper, 2);
  ctx.restore();
}

const tagWidth = 248;
function cursorTag(ctx, x, y, value) {
  polygon(ctx, [[x,y], [x + tagWidth - 21,y], [x + tagWidth,y + 30], [x + tagWidth - 21,y + 60], [x,y + 60]], orange);
  ctx.beginPath();
  ctx.arc(x + 20, y + 30, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = navy;
  ctx.fill();
  label(ctx, value, x + 41, y + 46, 45, navy, 'Mono');
}

const left = 122;
const width = 858;
const foldY = 606;

function directory(ctx, fold, cue) {
  ctx.save();
  ctx.shadowColor = '#090e427e';
  ctx.shadowBlur = 29;
  ctx.shadowOffsetX = 11;
  ctx.shadowOffsetY = 19;
  ctx.fillStyle = '#ba554e';
  ctx.beginPath();
  ctx.roundRect(left - 26, 111, width + 43, 519, [16, 12, 13, 18]);
  ctx.fill();
  ctx.restore();
  paper(ctx, left - 18, 117, 31, 505, '#fc8c69', '#b75351');
  for (let y = 128; y < 616; y += 13) {
    line(ctx, left - 12, y, left - 8, y + 6, '#ffbf9d', 2);
  }
  for (let i = 3; i >= 1; i--) {
    ctx.fillStyle = ['#f3d6aa', '#ddbc98', '#ead3b0'][i - 1];
    ctx.fillRect(left + 2 * i, 120 + 4 * i, width, 486);
  }
  // Page two is a concertina leaf. Its two halves meet at the middle crease.
  if (fold > 0.002) {
    const depth = Math.sin(fold * Math.PI) * 31;
    const leafHeight = 242;
    ctx.save();
    ctx.translate(left, foldY);
    ctx.transform(1, 0, -depth / (leafHeight / 2), fold, 0, 0);
    paper(ctx, 0, 0, width, leafHeight / 2, '#e6b990', '#ffe5b6');
    label(ctx, 'PAGE 2', 55, 53, 35, '#815449', 'Mono');
    ctx.restore();
    ctx.save();
    ctx.translate(left - depth, foldY + leafHeight / 2 * fold);
    ctx.transform(1, 0, depth / (leafHeight / 2), fold, 0, 0);
    paper(ctx, 0, 0, width, leafHeight / 2, '#fff0c8', '#f9ddae');
    ctx.restore();
    // The contact straddles the crease and becomes legible as the leaf flattens.
    ctx.save();
    ctx.translate(left - depth * 0.75, foldY);
    ctx.scale(1, fold);
    portrait(ctx, portraits[2], 56, 76);
    label(ctx, back.response.items[0], 193, 151, 89, navy, 'Serif');
    label(ctx, 'next', 530, 207, 39, '#634a4d', 'Mono');
    label(ctx, String(back.response.nextCursor), 665, 207, 44, navy, 'Mono');
    ctx.restore();
  }

  paper(ctx, left, 120, width, 486, '#fff4d4', '#f6e2b6');
  // The crease next to the binding catches the light.
  paper(ctx, left, 120, 20, 486, '#d5ad8f', '#e1bea0');
  label(ctx, 'Test directory', 178, 213, 67, navy, 'Serif');
  label(ctx, 'PAGE 1', 793, 200, 35, '#6e595b', 'Mono');
  line(ctx, 179, 239, 925, 239, navy, 2.6);
  front.response.items.forEach((name, i) => {
    const y = 267 + i * 137;
    portrait(ctx, portraits[i], 178, y);
    label(ctx, name, 315, y + 77, 92, navy, 'Serif');
    line(ctx, 180, y + 112, 924, y + 112, '#b09280', 1.6);
  });
  label(ctx, 'next', 545, 575, 39, '#634a4d', 'Mono');
  cursorTag(ctx, 675, 531, front.response.nextCursor);
  if (cue > 0) {
    const length = 211 * cue;
    line(ctx, 682, 598, 682 + length, 598, '#ac462c', 4);
  }
}

// Each returned character lights a column at a time in the output display.
const letters = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  G: ['01111','10000','10000','10111','10001','10001','01111'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  a: ['00000','00000','01110','00001','01111','10001','01111'],
  c: ['00000','00000','01111','10000','10000','10000','01111'],
  d: ['00001','00001','01111','10001','10001','10001','01111'],
  e: ['00000','00000','01110','10001','11111','10000','01111'],
  i: ['00100','00000','01100','00100','00100','00100','01110'],
  n: ['00000','00000','11110','10001','10001','10001','10001'],
  r: ['00000','00000','10110','11001','10000','10000','10000'],
  s: ['00000','00000','01111','10000','01110','00001','11110'],
  u: ['00000','00000','10001','10001','10001','10011','01101'],
};

const outputX = 1144;
function pixelName(ctx, name, y, progress) {
  const pitch = 12.7;
  const litColumns = progress * (6 * name.length);
  ctx.beginPath();
  [...name].forEach((letter, i) => {
    letters[letter].forEach((row, v) => {
      [...row].forEach((bit, u) => {
        const column = 6 * i + u;
        if (bit !== '1' || column >= litColumns) return;
        const x = outputX + column * pitch;
        const cy = y + v * pitch;
        ctx.moveTo(x + 5.65, cy);
        ctx.arc(x, cy, 5.65, 0, Math.PI * 2);
      });
    });
  });
  ctx.fillStyle = mint;
  ctx.fill();
}

function tick(ctx, x, y, color) {
  ctx.save();
  ctx.lineCap = 'round';
  line(ctx, x, y, x + 12, y + 12, color, 7);
  line(ctx, x + 12, y + 12, x + 34, y - 15, color, 7);
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const attemptB = index >= 4;
  const run = attemptB ? second : first;
  const fold = index < 2 ? 0 : index === 2 ? ease(reveal('Pull it', 1.05)) : 1;
  const cue = index < 2 ? 0 : index === 2 ? reveal('That orange tab') : 1;
  ground(ctx);
  directory(ctx, fold, cue);

  label(ctx, 'Fetch every name', 127, 80, 40, '#f3e2b9', 'Serif');
  label(ctx, attemptB ? 'Generated client B' : 'Generated client A', 1070, 205, 63, '#fff2d3', 'Serif');
  line(ctx, 1072, 239, 1793, 239, '#829ad9', 2);
  // The margin runs through both candidates, so a missing line retains its location.
  line(ctx, 1090, 279, 1090, 811, '#8ca5e075', 2);
  const typing = index === 0 ? elapsed : index === 4 ? elapsed - 0.25 : 8;
  const ada = clamp(typing / 0.48);
  const grace = clamp((typing - 0.5) / 0.75);
  pixelName(ctx, run.result.items[0], 271, ada);
  pixelName(ctx, run.result.items[1], 408, grace);

  if (!attemptB && typing > 1.31) {
    line(ctx, 1139, 521, 1172, 521, '#c8d2f4', 4);
    label(ctx, 'end of output', 1190, 533, 39, '#c8d2f4', 'Mono');
  }
  const weak = index === 0 ? clamp((elapsed - 1.4) / 0.3) : Number(index < 3);
  if (weak) {
    ctx.save();
    ctx.globalAlpha = weak;
    label(ctx, 'Any names?', 1138, 665, 48, '#eaedff');
    if (anyName(first)) tick(ctx, 1438, 647, mint);
    if (index === 1) {
      const highlight = ease(reveal('Ada alone', 0.5));
      line(ctx, 1140, 365, 1140 + 213 * highlight, 365, mint, 3);
    }
    ctx.restore();
  }

  if (index === 3) {
    const mark = reveal('Look across', 0.55);
    ctx.save();
    ctx.globalAlpha = mark;
    ctx.setLineDash([9, 14]);
    line(ctx, 1140, 752, 1512, 752, '#ffb39a', 3);
    ctx.setLineDash([]);
    label(ctx, 'missing', 1543, 760, 39, '#ffc1a3');
    ctx.restore();
  }

  const send = index === 4 ? ease(reveal('its next request', 1.05)) : Number(index > 4);
  if (send > 0) {
    ctx.save();
    ctx.globalAlpha = clamp((send - 0.92) / 0.08);
    label(ctx, 'request', 1139, 576, 40, '#e1e5fd', 'Mono');
    ctx.globalAlpha = 1;
    const x = 675 + (1343 - 675) * send;
    const y = 531 + 24 * Math.sin(Math.PI * send);
    cursorTag(ctx, x, y, back.request.cursor);
    ctx.restore();
  }
  const finalName = index === 5 ? ease(reveal('Here comes the reply', 0.92)) : index === 6 ? 1 : 0;
  if (finalName > 0) pixelName(ctx, second.result.items[2], 682, finalName);

  const complete = index === 5 ? reveal('empty cursor', 0.6) : index === 6 ? 1 : 0;
  const failed = index === 3 ? reveal('Set this answer aside', 0.6) : 0;
  if (failed > 0 || complete > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(failed, complete);
    const ink = run.checks.followedCursor ? mint : '#ffc1a3';
    line(ctx, 1070, 851, 1793, 851, '#91a3d5', 2);
    label(ctx, `${run.result.items.length} of ${expected.length} names`, 1138, 916, 50, ink, 'Serif');
    if (run.checks.followedCursor) tick(ctx, 1460, 895, ink);
    ctx.restore();
  }
}

export default { title: 'Testing synthetic data with a two-page search', beats, draw, check };
