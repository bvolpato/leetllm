import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { makePrintFile } from './moth.mjs';

const signed = makePrintFile('07', false);
const revision = makePrintFile('08', true);
const exhibition = 'Museum / Night Wings / exhibition print';
const curator = 'I. Rao';
const approval = Object.freeze({
  reviewer: curator,
  forUse: exhibition,
  fileDigest: signed.digest,
  decision: 'Approved',
});

// The archive supplies an authenticated staff record. Check its authority and scope
// separately from the content comparison. The printer acts on the bytes it checks.
function gate(bytes, forUse, record) {
  const fileDigest = createHash('sha256').update(bytes).digest('hex');
  const eligible =
    record.reviewer === curator &&
    record.forUse === forUse &&
    record.decision === 'Approved' &&
    record.fileDigest === fileDigest;
  return { fileDigest, eligible };
}
function completedJob(file, printerObservation) {
  const decision = gate(file.bytes, exhibition, approval);
  if (!decision.eligible) return { file, decision, outcome: 'Held', prints: 0 };
  if (!printerObservation) return { file, decision, outcome: 'Ready', prints: 0 };
  assert.equal(
    printerObservation.completedDigest,
    decision.fileDigest,
    'Print completion names a different file',
  );
  return { file, decision, outcome: 'Printed', prints: 1 };
}
const held = completedJob(revision);
const ready = completedJob(signed);
const observed = completedJob(signed, { completedDigest: signed.digest });

const beats = [
  {
    id: 'new-proof',
    say: 'Watch the right wing as the new proof settles. See the little ring beside the big one? The museum is using AI to restore this moth illustration for an exhibition.',
    hold: 0.9,
  },
  {
    id: 'signed-copy',
    say: "Here's the copy the curator signed. Just one eyespot on that wing. Both files are called Moth study. Can the printer use her signature for the new one?",
    hold: 1.8,
  },
  {
    id: 'fingerprints',
    say: "The museum requires its curator's approval for exhibition prints. Her signed record includes the fingerprint of the exact file she reviewed. The printer calculates its own from the file waiting on the right. Here are the first eight characters of each.",
    hold: 0.7,
  },
  {
    id: 'hold-the-print',
    say: 'The printer compares the full fingerprints. They differ, so it holds the job. The curator can examine the new mark and make a fresh decision about showing it to visitors.',
    hold: 1,
  },
  {
    id: 'recall',
    say: 'For tonight, she asks for the earlier file. Follow it back to the printer. One spot again. This time the fingerprint matches the signed record for this exhibition.',
    hold: 0.8,
  },
  {
    id: 'the-impression',
    say: 'The match gives the printer permission. Watch what comes out. That single spot is on the exhibition print. The printer logs the file it actually printed alongside the earlier hold.',
    hold: 3.1,
  },
];
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const paper = '#f4e8ce',
  plum = '#382936',
  ink = '#3b2c34',
  red = '#92392f',
  blue = '#324d64';

function label(
  ctx,
  value,
  x,
  y,
  size,
  { color = ink, face = 'Lesson Sans', weight = 400, align = 'left', italic = false } = {},
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "${face}"`;
  ctx.fillText(value, x, y);
}
function stroke(ctx, coords, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(new Path2D(coords));
}
function deskSurface() {
  const canvas = createCanvas(1920, 1080),
    g = canvas.getContext('2d');
  const grad = g.createLinearGradient(130, -70, 1730, 1150);
  grad.addColorStop(0, '#835c6a');
  grad.addColorStop(0.44, '#654450');
  grad.addColorStop(1, '#3e303c');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1920, 1080);
  // Subtle interlaced fibers in the book cloth, lit from the upper left.
  for (let y = 0; y < 1080; y += 4) {
    g.fillStyle = y % 12 === 0 ? 'rgba(31,18,35,.08)' : 'rgba(240,214,208,.048)';
    g.fillRect(0, y, 1920, 1);
  }
  for (let x = 0; x < 1920; x += 5) {
    g.fillStyle = x % 10 === 0 ? 'rgba(247,232,208,.036)' : 'rgba(26,18,35,.04)';
    g.fillRect(x, 0, 1, 1080);
  }
  const haze = g.createRadialGradient(440, 40, 10, 440, 40, 1100);
  haze.addColorStop(0, 'rgba(255,219,177,.15)');
  haze.addColorStop(1, 'rgba(255,219,177,0)');
  g.fillStyle = haze;
  g.fillRect(0, 0, 1920, 1080);
  return canvas;
}
const desk = deskSurface();

const W = 850,
  H = 550;
function paperBase(ctx, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(28,15,23,.41)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#c7ab92';
  ctx.fillRect(0, 3, w, h);
  ctx.restore();
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, 'rgba(255,254,231,.21)');
  wash.addColorStop(0.69, 'rgba(255,248,210,0)');
  wash.addColorStop(1, 'rgba(130,79,69,.1)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
}
function autograph(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  stroke(
    ctx,
    'M 0 1 Q 29 -2 53 -29 Q 31 -33 21 1 Q 24 12 45 2 M 50 4 L 53 3 M 67 3 Q 87 -29 98 -31 Q 119 -31 101 -15 Q 90 -8 77 -9 Q 98 -13 101 -1 Q 107 8 120 -6 Q 110 9 123 1 Q 131 -10 131 -3 Q 123 9 139 2 L 156 -2',
    blue,
    3.1,
  );
  ctx.restore();
}
function stamp(ctx, text, x, y, color, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(-0.055);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.3;
  const width = text === 'Held' ? 126 : 151;
  ctx.strokeRect(0, -34, width, 48);
  label(ctx, text, width / 2, 2, 35, { align: 'center', weight: 700, color });
  ctx.restore();
}
function sleeve(ctx, file, { archive = false, amount = 0, status = null, stampAmount = 0 } = {}) {
  paperBase(ctx, W, H);
  label(ctx, 'Moth study', 34, 62, 47, { face: 'Lesson Serif', italic: true });
  label(ctx, `Proof ${file.number}`, W - 34, 59, 34, { face: 'Lesson Mono', align: 'right' });
  ctx.drawImage(file.canvas, 24, 82, 802, 354);
  stroke(ctx, 'M 34 452 L 816 452', '#a38b78', 1.3);
  if (archive) {
    autograph(ctx, 40, 494);
    label(ctx, 'I. Rao, curator', 39, 531, 27, { color: blue });
  } else if (status) {
    stamp(ctx, status, 42, 503, status === 'Held' ? red : blue, stampAmount);
  }
  if (amount > 0) {
    ctx.save();
    ctx.globalAlpha *= amount;
    label(ctx, 'File', W - 293, 518, 32, { align: 'right', color: '#6f5a58' });
    label(ctx, file.digest.slice(0, 8), W - 32, 520, 50, {
      face: 'Lesson Mono',
      weight: 600,
      align: 'right',
      color: plum,
    });
    ctx.restore();
  }
}
function placed(ctx, cx, cy, scale, angle, paint) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(angle);
  ctx.translate(-W / 2, -H / 2);
  paint();
  ctx.restore();
}
const hero = { cx: 960, cy: 491, s: 1.57, a: -0.029 };
const close = { cx: 882, cy: 523, s: 1.78, a: -0.029 };
const left = { cx: 487, cy: 490, s: 1.01, a: -0.026 };
const right = { cx: 1432, cy: 492, s: 1.01, a: 0.019 };
function place(ctx, p, fn) {
  placed(ctx, p.cx, p.cy, p.s, p.a, fn);
}
function tweenPlace(from, to, t) {
  return {
    cx: mix(from.cx, to.cx, t),
    cy: mix(from.cy, to.cy, t),
    s: mix(from.s, to.s, t),
    a: mix(from.a, to.a, t),
  };
}
function rollingProof(ctx, start, end, p) {
  if (p >= 1) {
    sleeve(ctx, end);
    return;
  }
  sleeve(ctx, start);
  const edge = mix(-80, W + 80, p);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-50, -30);
  ctx.lineTo(edge + 35, -30);
  ctx.quadraticCurveTo(edge - 15, H / 2, edge - 27, H + 30);
  ctx.lineTo(-50, H + 30);
  ctx.closePath();
  ctx.clip();
  sleeve(ctx, end);
  const curl = ctx.createLinearGradient(edge - 65, 0, edge + 27, 0);
  curl.addColorStop(0, 'rgba(105,76,46,0)');
  curl.addColorStop(0.49, 'rgba(132,90,61,.14)');
  curl.addColorStop(0.84, 'rgba(255,253,240,.84)');
  curl.addColorStop(1, 'rgba(127,87,70,.28)');
  ctx.fillStyle = curl;
  ctx.fillRect(edge - 65, 0, 100, H);
  ctx.restore();
}
// The clear inspection lens magnifies the painted pixels directly under it.
function loupe(ctx, x, y, alpha) {
  if (alpha <= 0) return;
  const r = 115,
    slice = (2 * r) / 1.48;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(ctx.canvas, x - slice / 2, y - slice / 2, slice, slice, x - r, y - r, r * 2, r * 2);
  const gleam = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  gleam.addColorStop(0, 'rgba(255,247,224,.26)');
  gleam.addColorStop(0.46, 'rgba(255,255,255,0)');
  gleam.addColorStop(1, 'rgba(57,42,55,.10)');
  ctx.fillStyle = gleam;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.shadowColor = 'rgba(34,20,29,.4)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 5;
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#5b4651';
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#d4bcc0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 9, 3.48, 4.79);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,251,236,.82)';
  ctx.stroke();
  ctx.restore();
}
function spread(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const separate = index === 1 ? ease(elapsed / 1.65) : 1;
  const copies = [tweenPlace(close, left, separate), tweenPlace(close, right, separate)];
  const signedCode = index === 2 ? ease(reveal('Her signed record', 0.65)) : Number(index > 2);
  const queueCode = index === 2 ? ease(reveal('The printer calculates', 0.65)) : Number(index > 2);
  if (separate > 0.1) {
    ctx.save();
    ctx.globalAlpha = ease((separate - 0.1) / 0.9);
    label(ctx, 'Curator’s copy', left.cx, 154, 50, {
      color: '#fff2da',
      face: 'Lesson Serif',
      align: 'center',
    });
    label(ctx, 'Print queue', right.cx, 154, 50, {
      color: '#fff2da',
      face: 'Lesson Serif',
      align: 'center',
    });
    ctx.restore();
  }
  place(ctx, copies[0], () => sleeve(ctx, signed, { archive: true, amount: signedCode }));
  if (index === 4) {
    const requeue = ease(reveal('Follow it back', 1.45));
    const verified = ease(reveal('This time', 0.45));
    place(ctx, copies[1], () =>
      sleeve(ctx, revision, { amount: 1, status: held.outcome, stampAmount: 1 }),
    );
    if (requeue > 0) {
      ctx.save();
      ctx.translate((1 - requeue) * 730, -(1 - requeue) * 500);
      ctx.rotate(0.035 * (1 - requeue));
      place(ctx, copies[1], () =>
        sleeve(ctx, signed, { amount: 1, status: ready.outcome, stampAmount: verified }),
      );
      ctx.restore();
    }
    return;
  }
  const result = index === 3 ? ease(elapsed / 0.32) : 0;
  place(ctx, copies[1], () =>
    sleeve(ctx, revision, { amount: queueCode, status: held.outcome, stampAmount: result }),
  );
  if (index === 1) {
    const enter = ease(reveal('Just one eyespot', 0.55));
    const cross = ease(reveal('Both files', 1.2));
    loupe(ctx, mix(686, 1633, cross), 434 - 21 * Math.sin(Math.PI * cross), enter);
  } else if (index === 2) {
    const leave = ease(elapsed / 0.7);
    loupe(ctx, 1633 + 100 * leave, 434 - 60 * leave, 1 - leave);
  }
}

function printer(ctx, feed) {
  const x = 671,
    y = 193,
    w = 1111,
    h = 662;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 30, y - 1, w + 60, 1080 - y);
  ctx.clip();
  const top = y - h + h * feed;
  ctx.translate(x, top);
  paperBase(ctx, w, h);
  label(ctx, 'Moth study', 48, 83, 59, { face: 'Lesson Serif', italic: true });
  label(ctx, 'Proof ' + signed.number, w - 50, 77, 40, { align: 'right', face: 'Lesson Mono' });
  ctx.drawImage(signed.canvas, 30, 112, w - 60, 464);
  stroke(ctx, `M 50 585 L ${w - 50} 585`, '#a38b78', 1.5);
  label(ctx, 'AI-restored exhibition print', 50, 632, 33, { face: 'Lesson Serif', italic: true });
  ctx.restore();

  // The dark lip casts its shadow over the sheet as the rollers feed it out.
  ctx.save();
  const metal = ctx.createLinearGradient(0, 0, 0, y + 22);
  metal.addColorStop(0, '#c8b3b4');
  metal.addColorStop(0.6, '#ccbdc2');
  metal.addColorStop(0.82, '#a58e95');
  metal.addColorStop(1, '#715f69');
  ctx.fillStyle = metal;
  ctx.fill(
    new Path2D('M 614 -30 L 1830 -30 L 1863 130 Q 1871 191 1836 205 L 620 205 Q 584 192 593 145 Z'),
  );
  stroke(ctx, 'M 619 137 Q 1227 145 1839 137', 'rgba(253,237,227,.55)', 3);
  ctx.fillStyle = '#352e38';
  ctx.fillRect(x - 19, y - 15, w + 38, 24);
  ctx.fillStyle = '#221e27';
  ctx.fillRect(x - 9, y - 8, w + 18, 11);
  for (const dx of [0, 1, 2, 3]) {
    ctx.fillStyle = '#75636b';
    ctx.fillRect(x + 260 + dx * 180, y - 8, 39, 10);
  }
  const shade = ctx.createLinearGradient(0, y + 4, 0, y + 36);
  shade.addColorStop(0, 'rgba(31,19,30,.23)');
  shade.addColorStop(1, 'rgba(31,19,30,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y + 5, w, 32);
  ctx.restore();
}
function jobLog(ctx, finished) {
  ctx.save();
  ctx.translate(73, 318);
  ctx.rotate(-0.047);
  const w = 472,
    h = 355;
  paperBase(ctx, w, h);
  ctx.fillStyle = '#b06866';
  ctx.fillRect(0, 0, 12, h);
  label(ctx, 'Printer log', 40, 73, 55, { face: 'Lesson Serif' });
  stroke(ctx, 'M 37 101 L 436 101', '#9b827a', 2);
  label(ctx, 'Proof ' + held.file.number, 40, 173, 43);
  label(ctx, held.outcome, 430, 174, 45, { align: 'right', weight: 700, color: red });
  label(ctx, 'File differs from approval', 40, 219, 32, { color: '#6c5255' });
  stroke(ctx, 'M 40 250 L 434 250', '#bfaaa0', 1.4);
  if (finished > 0) {
    ctx.save();
    ctx.globalAlpha = finished;
    label(ctx, 'Proof ' + observed.file.number, 40, 308, 43);
    label(ctx, observed.outcome, 430, 309, 45, { align: 'right', weight: 700, color: blue });
    ctx.restore();
  }
  ctx.restore();
}
function draw(ctx, clock) {
  ctx.save();
  ctx.drawImage(desk, 0, 0);
  if (clock.index === 0) {
    const unfold = ease((clock.elapsed + 0.28) / 2.35);
    const focus = ease(clock.reveal('little ring', 1.9));
    place(ctx, tweenPlace(hero, close, focus), () => rollingProof(ctx, signed, revision, unfold));
  } else if (clock.index < 5) {
    spread(ctx, clock);
  } else {
    const feed = ease(clock.reveal('Watch what comes out', 2.7));
    printer(ctx, feed);
    const logged = feed === 1 ? ease(clock.reveal('The printer logs', 0.38)) : 0;
    jobLog(ctx, logged);
  }
  ctx.restore();
}
function check() {
  assert.notEqual(signed.digest, revision.digest);
  assert.equal(signed.digest.length, 64);
  const region = (file) => file.canvas.getContext('2d').getImageData(920, 124, 112, 94).data;
  assert.notDeepEqual(region(signed), region(revision));
  const leftHalf = (file) => file.canvas.getContext('2d').getImageData(0, 0, 600, 530).data;
  assert.deepEqual(leftHalf(signed), leftHalf(revision));
  assert.equal(held.decision.eligible, false);
  assert.equal(held.prints, 0);
  assert.equal(ready.decision.eligible, true);
  assert.equal(ready.prints, 0);
  assert.equal(observed.prints, 1);
  assert.equal(observed.decision.fileDigest, approval.fileDigest);
  assert.throws(() => completedJob(signed, { completedDigest: revision.digest }), /different file/);
  assert.equal(gate(signed.bytes, 'Public postcard', approval).eligible, false);
  assert.equal(
    gate(signed.bytes, exhibition, { ...approval, reviewer: 'Visitor' }).eligible,
    false,
  );
}

export default { title: 'Which moth did the curator approve?', beats, draw, check };
