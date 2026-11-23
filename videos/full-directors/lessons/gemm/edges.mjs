import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  ink,
  dim,
  rule,
  white,
  blue,
  rose,
  teal,
  softRose,
  softTeal,
  text,
  line,
  rect,
  plate,
  mark,
  matrix,
  note,
  fade,
  cue,
  ix,
  smooth,
} from './plates.mjs';
import { B, sums, selectedB, signedA, signedB, signed, five, edgeReplay } from './examples.mjs';

function termRow(c, values, x, y, step, size, color) {
  values.forEach((v, j) => text(c, v, x + j * step, y, size, color, 'center', 'Serif'));
}
export function signedEdge(c, t) {
  const grouped = cue(t, 0, 'The three products'),
    total = cue(t, 0, 'sum is seven');
  const cut = smooth(cue(t, 0, 'keep only column zero', 0.8));
  const bad = cue(t, 2, 'Omit the copy'),
    fixed = cue(t, 2, 'Restore the three');
  const state = bad && !fixed ? signed.bad : signed.good;
  const x = 232,
    y = 363;
  text(c, 'Source matrices', 98, 301, 38, dim);
  text(c, 'A', 103, y + 80, 40, blue);
  matrix(c, signedA, x, y, 400, 167, { select: (i) => i === 1, size: 50 });
  text(c, 'B', 103, 697, 40, rose);
  matrix(
    c,
    signedB.map((row) => [row[0]]),
    x,
    592,
    130,
    214,
    { select: () => true, tint: rose, size: 46 },
  );
  fade(c, 1 - cut, () =>
    matrix(
      c,
      signedB.map((row) => [row[1]]),
      x + 135 + cut * 54,
      592,
      130,
      214,
      { tint: rose, size: 46 },
    ),
  );
  if (cut === 1) text(c, 'column 1 removed', 398, 689, 30, dim);
  text(c, 'Bottom-left output', 780, 301, 40, ink);
  for (let k = 0; k < 3; k++) {
    const x = 925 + k * 294;
    text(c, 'k = ' + k, x, 378, 29, dim, 'center', 'Mono');
    const s = state.steps[k];
    text(c, s.a + ' × ' + s.b, x, 477, 53, k === 1 ? rose : ink, 'center', 'Serif');
    line(c, x - 103, 543, x + 103, 543, rule, 2);
    if (grouped) text(c, s.product, x, 601, 64, k === 1 ? rose : ink, 'center', 'Serif');
    if (k < 2 && grouped) text(c, '+', x + 147, 601, 42, dim, 'center');
  }
  if (total) {
    plate(c, 823, 684, 880, 123, bad && !fixed ? rose : teal, true);
    text(
      c,
      bad && !fixed ? 'Missed A copy' : fixed ? 'A copy restored' : 'Reference',
      858,
      747,
      35,
      white,
    );
    text(c, state.sum, 1623, 745, 74, white, 'right', 'Serif');
  }
  note(
    c,
    cut === 1
      ? 'The thread in the missing output column owns the load of A[1,1] = 3.'
      : 'Each pair uses the same inner coordinate in both matrices.',
  );
}

export function practice(c, t) {
  const ruleShown = cue(t, 0, 'To copy B'),
    group = cue(t, 1, 'Group the five positions', 0.65),
    loads = cue(t, 1, 'It supplies four'),
    second = cue(t, 1, 'then minus two'),
    zero = cue(t, 1, 'writes a zero'),
    upper = cue(t, 2, 'upper-right thread supplies');
  const stage = cue(t, 2, 'brings the result to nine')
    ? 3
    : cue(t, 2, 'leaving five')
      ? 2
      : cue(t, 2, 'gives seven')
        ? 1
        : 0;
  const xs = ix(5).map((k) => 493 + k * 241);
  text(c, 'A  /  top row', 98, 441, 37, blue);
  text(c, 'B  /  right column', 98, 552, 37, rose);
  text(c, 'Product', 98, 684, 37, dim);
  five.steps.forEach((v, k) => {
    const x = xs[k];
    text(c, 'k = ' + k, x, 335, 29, dim, 'center', 'Mono');
    text(c, v.a, x, 441, 65, blue, 'center', 'Serif');
    if (upper && k === five.panels.at(-1).start) mark(c, v.b, x, 552, 44, teal);
    else if ((loads && k === 1) || (second && k === 3)) mark(c, v.b, x, 552, 44, rose);
    else text(c, v.b, x, 552, 65, rose, 'center', 'Serif');
    line(c, x - 70, 623, x + 70, 623, rule, 2);
    if (Math.floor(k / 2) < stage) text(c, v.product, x, 685, 62, ink, 'center', 'Serif');
  });
  if (ruleShown && !group) {
    text(
      c,
      '2 × 2 block   ·   thread (y, x) copies B[panel start + y, x]',
      99,
      781,
      40,
      ink,
      'left',
      'Mono',
    );
  }
  if (group) {
    for (let i = 0; i < 3; i++) {
      const from = xs[2 * i] - 99,
        to = xs[Math.min(2 * i + 1, 4)] + 99;
      line(c, from, 730, to, 730, teal, 3);
      line(c, from, 716, from, 730, teal, 3);
      line(c, to, 716, to, 730, teal, 3);
      text(c, 'Panel ' + (i + 1), 0.5 * (from + to), 782, 32, teal, 'center');
    }
  }
  if (zero) {
    rect(c, 1595, 494, 226, 129, softRose);
    text(c, 'shared [1,1]', 1709, 526, 30, rose, 'center');
    text(c, five.panels.at(-1).right[1][1], 1709, 581, 54, rose, 'center', 'Serif');
  }
  if (upper) text(c, 'upper-right copy', xs.at(-1), 492, 27, teal, 'center');
  note(
    c,
    stage
      ? 'Running sum after panel ' + stage + '   =   ' + five.panels[stage - 1].sum
      : second
        ? 'Lower-right copies B[1,1] and B[3,1]. Its output is masked.'
        : loads
          ? 'Lower-right copies B[1,1] in the first panel.'
          : group
            ? 'For the lower-right thread, y = 1 and x = 1.'
            : ruleShown
              ? 'Use zero-based thread coordinates. Which B addresses are in bounds?'
              : 'Top-right output   ·   five inner positions',
  );
}

const tileX = 100,
  tileY = 359,
  tileW = 650,
  tileH = 207;
function sheet(c, r, offset, values) {
  const y = tileY + r * tileH;
  c.save();
  c.beginPath();
  c.rect(40, tileY - 8, tileW + 88, 2 * tileH + 58);
  c.clip();
  c.translate(-42 * offset, 271 * offset);
  c.rotate(0.025 * offset);
  c.beginPath();
  const seam = tileY + tileH;
  const teeth = ix(101).map((i) => [
    tileX + (tileW * i) / 100,
    seam + Math.sin(i * 1.9) * 2.6 + (i % 3 === 0 ? 4 : 0),
  ]);
  if (r === 0) {
    c.moveTo(tileX, y);
    c.lineTo(tileX + tileW, y);
    for (const [xx, yy] of teeth.toReversed()) c.lineTo(xx, yy);
  } else {
    c.moveTo(...teeth[0]);
    for (const [xx, yy] of teeth) c.lineTo(xx, yy);
    c.lineTo(tileX + tileW, y + tileH);
    c.lineTo(tileX, y + tileH);
  }
  c.closePath();
  c.clip();
  plate(c, tileX, y - 6, tileW, tileH + 12, blue, true);
  line(c, tileX + tileW / 2, y, tileX + tileW / 2, y + tileH, white, 2);
  for (let j = 0; j < 2; j++) {
    const x = tileX + (j * tileW) / 2;
    text(c, 'C[' + r + ',' + j + ']', x + 24, y + 34, 26, '#e2e6ff', 'left', 'Mono');
    text(c, values[j], x + tileW / 4, y + 111, 86, white, 'center', 'Serif');
  }
  c.restore();
}
function after(t, beat, phrase, splitCaption = false) {
  if (t.beat.beatIndex !== beat) return t.beat.beatIndex > beat;
  if (splitCaption) t.reveal(phrase, 0, { captionStart: phrase });
  return Math.round(t.elapsed * fps) >= firstFrameAt(t.wordCue(phrase).end);
}

export function torn(c, t) {
  const cut = smooth(cue(t, 0, 'Tear the bottom row', 1.85)),
    owner = cue(t, 1, 'lower-right thread owns', 0.7);
  const initialized = after(t, 1, 'shared slots start at zero');
  const omit = after(t, 1, 'Skip both bottom copies');
  const missing = after(t, 1, 'replaces two times one');
  const badStore = after(t, 2, 'It stores two', true);
  const copying = cue(t, 3, 'Copy the one');
  const copied = after(t, 3, 'Copy the one');
  const read = after(t, 3, 'After the load barrier');
  const product = after(t, 3, 'The middle product returns');
  const store = after(t, 3, 'Store four', true);
  const replay = edgeReplay({ omit, missing, badStore, copying, copied, read, product, store });
  const storedLabel = store
    ? 'Output C   /   repaired store'
    : badStore
      ? 'Output C   /   missed-copy store'
      : 'Output C   /   reference';
  text(c, storedLabel, 100, 297, 38, blue);
  rect(c, tileX, tileY + tileH, tileW, tileH, softRose);
  c.save();
  c.beginPath();
  c.rect(tileX, tileY + tileH, tileW, tileH);
  c.clip();
  for (let dx = -tileH; dx < tileW; dx += 15)
    line(c, tileX + dx, tileY + tileH * 2, tileX + dx + tileH, tileY + tileH, '#ae697521', 2);
  c.restore();
  for (let j = 0; j < 2; j++) {
    const xx = tileX + (tileW * (j + 0.5)) / 2;
    text(
      c,
      j ? 'Lower-right thread' : 'Lower-left thread',
      xx,
      tileY + tileH + 43,
      30,
      rose,
      'center',
    );
    const selected = j === selectedB.col && owner;
    mark(c, B[selectedB.k][j], xx, tileY + tileH + 112, selected ? 40 : 33, selected ? rose : dim);
    text(c, 'B[1,' + j + ']', xx, tileY + tileH + 179, 25, dim, 'center', 'Mono');
  }
  sheet(c, 0, 0, [sums(3)[0][0], replay.upperRight]);
  fade(c, 1 - cut, () => sheet(c, 1, cut, sums(3)[1]));
  if (cut === 1) text(c, 'Output store masked below the cut', tileX, 821, 30, rose);
  const xs = [1210, 1455, 1700],
    ys = [385, 535, 710];
  if (owner) {
    const sourceX = tileX + tileW * 0.75,
      sourceY = tileY + tileH + 112,
      slotX = 950,
      slotY = 582,
      barrierX = 1100;
    const skipped = omit && !copying;
    const pathColor = copying ? rose : rule;
    const slotColor = copied ? rose : dim;
    const canRead = copying ? read : missing;
    const path = [
      [sourceX + 77, sourceY],
      [760, sourceY],
      [855, slotY],
      [slotX, slotY],
    ];
    line(c, sourceX + 45, sourceY, 760, sourceY, pathColor, 4);
    if (skipped) {
      line(c, 746, sourceY - 14, 774, sourceY + 14, rose, 5);
      line(c, 774, sourceY - 14, 746, sourceY + 14, rose, 5);
    } else {
      line(c, 760, sourceY, 855, slotY, pathColor, 4);
    }
    text(c, 'Shared B[1,1]', slotX, 482, 33, rose, 'center');
    rect(c, 855, 527, 190, 110, copied ? softRose : white);
    if (initialized && replay.sharedWord !== null)
      mark(c, replay.sharedWord, slotX, slotY, 40, slotColor);
    if (canRead) {
      line(c, 1045, slotY, xs[1], slotY, copied ? rose : dim, 4);
      line(c, xs[1], slotY, xs[1], ys[1] + 41, copied ? rose : dim, 4);
    } else if (copying) {
      line(c, 1045, slotY, barrierX, slotY, rose, 4);
    }
    if (copying) {
      if (read) {
        line(c, barrierX, 537, barrierX, slotY - 14, teal, 5);
        line(c, barrierX, slotY + 14, barrierX, 623, teal, 5);
      } else {
        line(c, barrierX, 537, barrierX, 623, ink, 5);
      }
      text(c, 'Load barrier', barrierX, 662, 32, read ? teal : ink, 'center');
    }
    if (copying && !copied) {
      const phrase = t.wordCue('Copy the one');
      const progress = smooth(
        t.reveal('Copy the one', phrase.end - phrase.start, { captionStart: false }),
      );
      const lengths = path.slice(1).map(([x, y], i) => Math.hypot(x - path[i][0], y - path[i][1]));
      let remaining = progress * lengths.reduce((sum, length) => sum + length, 0);
      for (let i = 0; i < lengths.length; i++) {
        if (remaining <= lengths[i]) {
          const [x, y] = path[i];
          const [tx, ty] = path[i + 1];
          const f = remaining / lengths[i];
          mark(c, selectedB.value, x + (tx - x) * f, y + (ty - y) * f, 32, rose);
          break;
        }
        remaining -= lengths[i];
      }
    }
  }
  text(c, omit ? 'Top-right dot product' : 'Top-right reference dot product', 970, 297, 39, ink);
  termRow(c, replay.reference.map(({ a }) => a), xs[0], ys[0], 245, 65, blue);
  replay.reference.forEach((step, i) => {
    const x = xs[i];
    const middle = i === selectedB.k;
    const word = middle ? replay.middleOperand : step.b;
    const term = middle ? replay.middleProduct : step.product;
    text(c, '×', x, ys[0] + 72, 32, dim, 'center');
    if (middle && omit && word !== null) mark(c, word, x, ys[1], 42, read ? rose : dim);
    else text(c, word ?? '·', x, ys[1], 63, word === null ? dim : rose, 'center', 'Serif');
    line(c, x - 76, 632, x + 76, 632, rule, 3);
    if (middle && product) rect(c, x - 67, ys[2] - 47, 134, 94, softTeal);
    text(c, term ?? '·', x, ys[2], 64, term === null ? dim : ink, 'center', 'Serif');
    if (i < 2) text(c, '+', x + 122.5, ys[2], 36, dim, 'center');
  });
  if (store) note(c, 'The lower thread loads B[1,1]. The upper thread stores C[0,1].');
  else if (product) note(c, 'The middle product is back. The output still holds the earlier store.');
  else if (read) note(c, 'After the load barrier, the upper thread can read the shared word.');
  else if (copying) note(c, 'The upper thread waits at the load barrier.');
  else if (badStore) note(c, 'Only the middle product changed.');
  else if (omit) note(c, 'Both lower-thread copies are skipped in this replay.');
  else if (cut === 1) note(c, 'The bottom output row is gone. Its two threads still own input slots.');
  else note(c, 'The original upper-right sum is 2 + 2 + 0.');
}
