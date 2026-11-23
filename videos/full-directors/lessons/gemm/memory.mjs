import {
  ink,
  dim,
  rule,
  white,
  blue,
  rose,
  teal,
  gold,
  softBlue,
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
  smooth,
} from './plates.mjs';
import {
  warpRequests,
  layout,
  banks,
  xorColumns,
  registerDemand,
  slot,
  overlap,
} from './examples.mjs';

export function addresses(c, t) {
  if (t.beat.beatIndex === 3) {
    const col = cue(t, 3, 'Now read by columns', 0.45);
    text(c, 'Physical word order', 103, 303, 40, dim);
    [1, 2, 3, 4, 5, 6].forEach((v, i) => {
      const x = 112 + i * 178;
      rect(c, x, 375, 168, 116, white);
      text(c, v, x + 84, 430, 60, ink, 'center', 'Serif');
      text(c, 'byte ' + 4 * i, x + 84, 534, 28, dim, 'center', 'Mono');
    });
    text(
      c,
      col ? 'Column-major  /  leading dimension 2' : 'Row-major  /  leading dimension 3',
      99,
      667,
      42,
      blue,
    );
    text(
      c,
      col ? 'index = column × 2 + row' : 'index = row × 3 + column',
      99,
      754,
      37,
      dim,
      'left',
      'Mono',
    );
    matrix(c, layout(!!col), 1260, 365, 480, 348, {
      size: 68,
      select: (i, j) => i === 0 && j === 1,
    });
    note(c, 'The same buffer interpreted as a 2 × 3 matrix.');
    return;
  }
  const across = cue(t, 1, 'Now try a block'),
    sectors = warpRequests(!!across);
  const counts = across
    ? ['All lanes share one A word', 'span four sectors', 'final store spans four'].map((phrase) =>
        cue(t, 2, phrase),
      )
    : ['sixteen sectors', 'B touches one', 'final C store touches sixteen'].map((phrase) =>
        cue(t, 1, phrase),
      );
  text(
    c,
    across ? '32 × 8 block   /   x selects column' : '16 × 16 block   /   x selects row',
    100,
    302,
    42,
    ink,
  );
  text(c, 'Aligned FP32   ·   N = K = 64   ·   k = 0', 100, 364, 31, dim);
  text(c, 'Byte offset', 102, 454, 30, dim);
  const lanes = [0, 1, 2, 15, 16, 31];
  lanes.forEach((v, i) => text(c, 'lane ' + v, 500 + i * 156, 454, 29, dim, 'center'));
  text(c, '32-byte sectors', 1665, 454, 31, dim, 'center');
  ['a', 'b', 'c'].forEach((key, i) => {
    const y = 496 + i * 106,
      color = [blue, rose, teal][i];
    rect(c, 100, y, 1722, 89, [softBlue, softRose, softTeal][i]);
    text(c, ['A load', 'B load', 'C store'][i], 131, y + 44, 40, color);
    lanes.forEach((v, j) =>
      text(c, sectors.lanes[v][key], 500 + j * 156, y + 44, 40, color, 'center', 'Mono'),
    );
    text(c, counts[i] ? sectors.sectors[i] : '?', 1663, y + 44, 55, color, 'center', 'Serif');
  });
  if (across && counts[1]) {
    for (let s = 0; s < sectors.sectors[1]; s++)
      for (let w = 0; w < 8; w++) rect(c, 102 + s * 182 + w * 19, 855, 16, 39, rose);
    text(c, 'B   /   4 groups of 8 floats', 877, 876, 33, rose);
    if (cue(t, 2, 'nine sectors')) text(c, '1 + 4 + 4 = 9', 1817, 875, 42, ink, 'right', 'Serif');
  } else
    note(
      c,
      across
        ? 'How many aligned 32-byte sectors cover the B offsets?'
        : counts[2]
          ? '16 + 1 + 16 = 33 requested sectors across these instructions.'
          : 'Follow the stride between lanes 0 and 1.',
    );
}

const xorLetters = ['A', 'B', 'C', 'D'];
const bankX = (bank) => 202 + bank * 49.8;
function bankAxis(c, traceXor = false) {
  text(c, 'Bank', 99, 799, 28, dim);
  for (let j = 0; j < 32; j++) {
    const x = bankX(j);
    line(c, x - 21, 761, x + 21, 761, rule, 3);
    if (j % 4 === 0 || j === 7 || j === 31 || (traceXor && (j === 5 || j === 6)))
      text(c, j, x, 801, 28, dim, 'center', 'Mono');
  }
}
function xorBankComparison(c, t) {
  const apply = cue(t, 3, 'Apply row XOR');
  const trace = cue(t, 3, 'Rows zero, one and two');
  const spread = cue(t, 3, 'each bank gets one request');
  const plain = banks('stride');
  const swizzled = banks('xor');
  const colors = [rose, blue, teal];
  text(c, 'Logical column 7   /   one lane per row', 100, 303, 44, ink);
  text(c, '32 words per row', 1818, 307, 35, dim, 'right', 'Mono');
  text(c, 'Row', 847, 410, 31, dim);
  text(c, 'Plain layout', 1005, 410, 33, dim);
  text(c, 'Row XOR', 1440, 410, 33, dim);
  for (let row = 0; row < 3; row++) {
    const y = 481 + row * 76;
    const word = plain.words[row];
    text(c, row, 870, y, 43, colors[row], 'center', 'Mono');
    text(c, 'word ' + word + ' → bank ' + (word % 32), 1005, y, 32, dim);
    const mapped = swizzled.words[row];
    text(c, trace ? 'word ' + mapped + ' → bank ' + (mapped % 32) : '?', 1440, y, 32, colors[row]);
  }
  bankAxis(c, true);
  plain.words.forEach((plainWord, row) => {
    const moved = spread || (trace && row < 3);
    const word = moved ? swizzled.words[row] : plainWord;
    const x = bankX(word % 32);
    const y = moved ? 734 : 737 - row * 10.8;
    rect(c, x - 20, y, 40, moved ? 23 : 8, colors[row] || rule);
  });
  note(
    c,
    spread
      ? 'Bank = 7 XOR row. Each of the 32 rows reaches a different bank.'
      : trace
        ? 'First three rows under XOR. The other requests still show the plain layout.'
        : apply
          ? 'New bank = 7 XOR row. Trace the first three requests.'
          : 'At stride 32, every unswizzled column-7 word lands in bank 7.',
  );
}
export function bankPage(c, t) {
  if (t.beat.beatIndex === 3 && !cue(t, 3, 'Now follow a vector')) {
    xorBankComparison(c, t);
    return;
  }
  if (t.beat.beatIndex >= 3) {
    const flip = smooth(cue(t, 3, 'exchange places', 1.1));
    cue(t, 3, 'To read the original vector');
    const colors = [blue, rose, teal, ink];
    const x0 = 200;
    const width = 332;
    const pitch = 388;
    const physicalX = (column) => x0 + width / 2 + column * pitch;
    text(c, 'Shared row 3', 101, 318, 44, ink);
    text(
      c,
      'physical column = logical column XOR 3',
      1818,
      318,
      42,
      dim,
      'right',
      'Mono',
    );
    for (let j = 0; j < 4; j++) {
      const x = x0 + j * pitch;
      text(c, 'physical ' + j, physicalX(j), 409, 42, dim, 'center');
      rect(c, x, 495, width, 191, softBlue);
    }
    xorLetters.forEach((v, j) => {
      const swapped = j === 0 || j === 3 ? Math.min(1, 2 * flip) : Math.max(0, 2 * flip - 1);
      const pos = j + (xorColumns[j] - j) * swapped;
      const y = 587 + Math.sin(swapped * Math.PI) * (j < 2 ? -106 : 106);
      mark(c, v, physicalX(pos), y, 43, colors[j]);
    });
    if (flip < 1) return;

    cue(t, 4, 'Read columns three, two, one and zero');
    cue(t, 4, 'and could violate alignment');
    cue(t, 4, 'on the permutation used by their instruction');
    const readWords = ['Read columns three', 'two', 'one', 'and zero'];
    readWords.forEach((phrase, j) => {
      const slotX = x0 + j * pitch;
      const dest = slotX + 193;
      const source = physicalX(xorColumns[j]);
      const track = 722;
      let progress = 0;
      if (t.beat.beatIndex === 4) {
        const { start, end } = t.wordCue(phrase);
        progress = t.reveal(phrase, end - start, { captionStart: false });
      }
      const delivered = progress === 1;
      rect(c, slotX, 753, width, 70, delivered ? softTeal : '#e6e2d3');
      text(c, 'logical ' + j, slotX + 17, 789, 35, dim);
      if (delivered) {
        mark(c, xorLetters[j], dest, 787, 22, colors[j]);
        text(c, 'from ' + xorColumns[j], slotX + width - 12, 789, 31, colors[j], 'right', 'Sans', 600);
        return;
      }
      if (progress <= 0) {
        text(c, '?', dest, 788, 35, dim, 'center', 'Mono');
        return;
      }

      const across = smooth(Math.max(0, Math.min(1, (progress - 0.21) / 0.57)));
      const x = source + (dest - source) * across;
      const y = progress < 0.21
        ? 701 + (track - 701) * (progress / 0.21)
        : track + (787 - track) * Math.max(0, (progress - 0.78) / 0.22);
      if (y < 744) text(c, '?', dest, 788, 35, dim, 'center', 'Mono');
      line(c, source, 685, source, Math.min(track, y), colors[j], 4);
      if (x !== source) line(c, source, track, x, track, colors[j], 4);
      if (y > track) line(c, x, track, x, y, colors[j], 4);
      mark(c, xorLetters[j], x, y, 18, colors[j]);
    });
    return;
  }
  const newRows = cue(t, 0, 'Now give each lane'),
    distinct = cue(t, 1, 'Use the distinct words', 0.7),
    pad = smooth(cue(t, 1, 'Add one word of padding', 1.5));
  const mode = pad === 1 ? 'padded' : newRows ? 'stride' : 'broadcast';
  const model = banks(mode);
  const address =
    pad > 0 && pad < 1
      ? 'Row stride   32 → 33 words'
      : mode === 'broadcast'
        ? '32 lanes request word 7'
        : pad === 1
          ? 'word = 33 × lane + 7'
          : 'word = 32 × lane + 7';
  text(c, address, 100, 305, 46, ink, 'left', 'Serif');
  text(c, 'bank = word mod 32', 1818, 307, 35, dim, 'right', 'Mono');
  bankAxis(c);
  if (!newRows) {
    const served = cue(t, 0, 'bank seven broadcasts it');
    rect(c, bankX(7) - 19, 734, 38, 23, rose);
    text(c, 'word 7', bankX(7), 665, 42, rose, 'center', 'Serif');
    if (served) text(c, 'broadcast', bankX(7), 501, 56, ink, 'center', 'Serif');
    note(
      c,
      served
        ? 'One distinct word can be broadcast to every lane.'
        : 'All lanes read the same address.',
    );
    return;
  } else if (!distinct) {
    for (let row = 0; row < 3; row++) {
      const x = 215 + row * 542;
      text(c, 'row ' + row, x, 475, 38, dim);
      text(c, 'word ' + model.words[row], x, 568, 58, rose, 'left', 'Serif');
    }
    note(c, 'How many service groups do the 32 distinct words require?');
    return;
  } else {
    for (let l = 0; l < 32; l++) {
      const dest = banksPadded[l] % 32;
      const x = bankX(7 + (dest - 7) * pad),
        y = 744 - l * 10.8 * (1 - pad);
      fade(c, Math.max(0, Math.min(1, distinct * 32 - l)), () =>
        rect(c, x - 20, y - 7, 40, 8 + 14 * pad, l === 1 ? blue : rose),
      );
    }
    if (pad === 1)
      text(
        c,
        'lane 1  →  word ' + model.words[1] + '  →  bank 8',
        101,
        492,
        49,
        blue,
        'left',
        'Serif',
      );
    else if (pad === 0) text(c, '7, 39, 71, …', 755, 554, 52, rose, 'left', 'Serif');
  }
  note(
    c,
    pad > 0 && pad < 1
      ? 'Adding a word of row padding…'
      : !cue(t, 1, 'All thirty-two lanes')
        ? 'Distinct words arrive in bank 7.'
        : model.depth +
          ' service ' +
          (model.depth === 1 ? 'group' : 'groups') +
          ' for 32 distinct words   ·   scalar FP32 request',
  );
}
const banksPadded = banks('padded').words;

export function registers(c, t) {
  const b = t.beat.beatIndex;
  if (b === 0) {
    const warp = cue(t, 0, 'a warp of thirty-two', 0.65),
      stats = cue(t, 0, 'eight thousand');
    text(c, 'Block output tile', 99, 313, 42, ink);
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 16; j++) {
        rect(
          c,
          118 + j * 30,
          355 + i * 30,
          27,
          27,
          i === 0 ? blue : i === 1 && warp ? teal : '#d4d5cb',
        );
      }
    text(c, '16 columns share one A word', 700, 416, 57, blue, 'left', 'Serif');
    if (warp) text(c, 'A warp covers two rows of 16 threads.', 701, 538, 42, teal);
    if (stats) {
      text(c, '2 × 16³ FLOPs', 701, 653, 46, ink, 'left', 'Mono');
      text(c, '2 × 16² × 4 input bytes', 701, 731, 46, ink, 'left', 'Mono');
    }
    note(
      c,
      stats
        ? 'One full FP32 panel gives 4 FLOPs per input byte staged.'
        : 'Each small square owns a different output.',
    );
    return;
  }
  const square = cue(t, 3, 'Expand to eight by eight'),
    [r, n] = square ? [8, 8] : b >= 2 ? [2, 3] : [1, 4];
  const stats = b === 1 ? cue(t, 1, 'Eight FLOPs') : b === 2 ? 0 : cue(t, 3, 'cost twenty bytes');
  const ratio =
    b === 1
      ? cue(t, 1, 'zero point four')
      : square
        ? cue(t, 3, 'ratio rises to two')
        : cue(t, 3, 'zero point six');
  const d = registerDemand(r, n);
  text(c, 'One thread’s register tile', 100, 305, 42, ink);
  const w = Math.min(105, 460 / Math.max(r, n)),
    x = 205,
    y = 391;
  for (let i = 0; i < r; i++) {
    mark(c, 'a', x - 52, y + w * (i + 0.5), Math.min(26, w * 0.35), blue);
    for (let j = 0; j < n; j++) rect(c, x + j * w, y + i * w, w - 5, w - 5, teal);
  }
  for (let j = 0; j < n; j++) mark(c, 'b', x + (j + 0.5) * w, y - 42, Math.min(26, w * 0.35), rose);
  text(c, 'FP32 operands per reduction step', 842, 353, 41, dim);
  text(c, r + ' from A   +   ' + n + ' from B', 842, 454, 54, ink, 'left', 'Serif');
  text(c, r + ' × ' + n + ' running sums', 842, 548, 54, teal, 'left', 'Serif');
  if (stats) {
    text(c, d.flops + ' FLOPs   /   ' + d.bytes + ' bytes', 842, 673, 47, blue, 'left', 'Mono');
    if (ratio) text(c, d.ratio + ' FLOP/B', 843, 770, 59, blue, 'left', 'Serif');
  } else text(c, 'How much work per operand byte?', 842, 693, 42, dim);
  note(
    c,
    square
      ? 'The compiler must also allocate operand and index registers.'
      : 'Each crossing keeps a separate sum alive in registers.',
  );
}

export function slots(c, t) {
  if (t.beat.beatIndex === 3) {
    const hopper = cue(t, 3, 'Hopper'),
      group = cue(t, 3, 'four warps', 0.65);
    text(
      c,
      hopper ? 'Hopper   /   descriptor-driven copy' : 'Ampere   /   asynchronous copy',
      99,
      303,
      43,
      ink,
    );
    for (const [x, w, name, fill] of [
      [103, 387, 'Global memory', blue],
      [802, 404, 'Shared slot', rose],
    ]) {
      plate(c, x, 422, w, 184, fill, true);
      text(c, name, x + w / 2, 510, 47, white, 'center', 'Serif');
    }
    line(c, 492, 505, 799, 505, rose, 6);
    text(c, hopper ? 'TMA' : 'cp.async', 644, 456, 34, rose, 'center', 'Mono');
    if (hopper) text(c, 'transaction barrier', 1000, 663, 35, rose, 'center');
    if (group) {
      line(c, 1208, 505, 1413, 505, teal, 6);
      for (let i = 0; i < 4; i++) rect(c, 1414, 391 + i * 56, 324, 48, teal);
      text(c, '4 warps  ·  128 lanes', 1574, 673, 34, teal, 'center');
    }
    note(
      c,
      group
        ? 'The warp group reads B from shared memory and keeps sums in registers.'
        : hopper
          ? 'A transaction barrier tracks the transfer into shared memory.'
          : 'A direct global-to-shared copy bypasses operand registers.',
    );
    return;
  }
  const bad = cue(t, 2, 'Place the write at two'),
    fixed = cue(t, 2, 'Move it to three', 0.9),
    ready = cue(t, 0, 'With two slots', 0.75);
  const x = 383,
    dx = 285,
    yy = [451, 572, 693];
  text(c, 'Physical slot ownership', 100, 299, 41, ink);
  for (let i = 0; i <= 5; i++) {
    line(c, x + i * dx, 372, x + i * dx, 785, rule, 2);
    text(c, i, x + i * dx, 345, 28, dim, 'center', 'Mono');
  }
  ['Slot 0 · copy', 'Slot 0 · read', 'Slot 1 · copy'].forEach((s, i) =>
    text(c, s, 102, yy[i] + 34, 33, dim),
  );
  function bar(row, start, end, color, s) {
    const l = x + start * dx;
    rect(c, l, yy[row], (end - start) * dx - 2, 68, color);
    text(c, s, l + 15, yy[row] + 32, 32, white);
  }
  bar(0, 0, slot.ready, blue, 'panel 0');
  if (ready) {
    bar(1, slot.ready, slot.done, teal, 'reader holds panel 0');
    bar(2, 1, 2, blue, 'panel 1');
  }
  if (bad) {
    const start = slot.early + (slot.done - slot.early) * fixed;
    bar(0, start, start + 1, overlap(start) > 0 ? rose : blue, 'panel 2');
    if (overlap(start) > 0) rect(c, x + start * dx, yy[1] + 56, overlap(start) * dx - 1, 12, gold);
  } else if (t.beat.beatIndex === 1 && cue(t, 1, 'Suppose the next writer')) {
    line(c, x + 2 * dx, 401, x + 2 * dx, yy[0] + 68, rose, 3);
    text(c, '?', x + 2 * dx + 32, yy[0] + 36, 54, rose, 'center', 'Serif');
  }
  note(
    c,
    fixed === 1
      ? 'Step 3 releases slot 0 for the next copy.'
      : bad
        ? 'The next copy starts while the reader still owns slot 0.'
        : 'Copy completion permits reads. Follow the reader to its final step.',
  );
}
