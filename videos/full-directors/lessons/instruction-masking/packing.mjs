import assert from 'node:assert/strict';
import {
  firstFit,
  attendedMean,
  makeAttentionMasks,
} from '../../../films/instruction-masking/arithmetic.mjs';
import {
  packedLengths,
  TOKENS,
  TOKEN_IDS,
  ASSISTANT_TARGETS,
} from '../../../films/instruction-masking/fixtures.mjs';
import {
  C,
  rect,
  txt,
  line,
  circle,
  arrow,
  top,
  micro,
  note,
  tape,
  table,
  bracket,
  tag,
  cue,
  gauge,
  dataRow,
  fmtLabel,
  activeColor,
} from './studio.mjs';
const pack = firstFit(packedLengths, 16),
  names = ['A', 'B', 'C', 'D'],
  colors = [C.teal, C.violet, C.red, '#876022'];
const returnLengths = [10, 8, 6];
const returnPack = firstFit(returnLengths, 16);
function packing(g, k) {
  const revisit = k.beat.beatIndex >= 3;
  const lengths = revisit ? returnLengths : packedLengths;
  const placement = revisit ? returnPack : pack;
  top(g, k, 'PACKING  /  INPUT-ORDER FIRST FIT', 'Where does the next conversation fit?');
  const step = 27,
    starts = [60, 693],
    ys = [236, 417],
    states = revisit
      ? [1, 1, cue(k, 4, 'Place the six', 1)]
      : ['Nine goes', 'Six fits', 'Seven needs', 'Five joins'].map((p) => cue(k, 1, p, 1));
  micro(g, revisit ? 'INPUT ROWS  /  A = 10, B = 8, C = 6' : 'SEPARATE WINDOWS', 60, 191);
  micro(g, 'PACKED WINDOWS', 693, 191);
  const atRow = (i) => 240 + i * 78;
  function slot(x, y) {
    rect(g, x, y, step - 2, 37, C.fade, C.rule);
  }
  for (let i = 0; i < 16; i++) {
    for (let r = 0; r < lengths.length; r++) slot(starts[0] + i * step, atRow(r));
    for (const y of ys) slot(starts[1] + i * step, y);
  }
  const bins = [0, 0];
  for (const [dest, sources] of placement.contents.entries()) {
    let col = 0;
    for (const i of sources) {
      const t = states[i],
        n = lengths[i];
      for (let j = 0; j < n; j++) {
        const x = (1 - t) * (starts[0] + j * step) + t * (starts[1] + (col + j) * step);
        const y = (1 - t) * atRow(i) + t * ys[dest] - 32 * Math.sin(Math.PI * t);
        rect(g, x, y, step - 2, 37, colors[i]);
        txt(
          g,
          j === 0 ? names[i] : j === n - 1 ? String(n) : '·',
          x + 12,
          y + 19,
          18,
          C.white,
          'center',
          'Mono',
        );
      }
      if (t === 1) bins[dest] += n;
      col += n;
    }
    txt(g, bins[dest] + ' / 16 placed', starts[1], ys[dest] + 64, 21, C.dim, 'left', 'Mono');
  }
  const placed = bins.reduce((a, v) => a + v, 0);
  if (revisit) {
    if (placed === placement.tokens)
      note(g, 'C fills window 1. Window 2 still contains only B.', 598);
    else if (states[2] === 0)
      note(g, 'Six slots are free in window 1 and eight in window 2. Where does C go?', 598);
    return;
  }
  const separate = packedLengths.length * 16;
  const occupancy = (capacity) => ((100 * pack.tokens) / capacity).toFixed(1) + '%';
  note(
    g,
    placed === pack.tokens
      ? pack.tokens +
          ' / ' +
          separate +
          ' = ' +
          occupancy(separate) +
          ' separate     →     ' +
          pack.tokens +
          ' / ' +
          pack.capacity +
          ' = ' +
          occupancy(pack.capacity) +
          ' packed'
      : placed
        ? placed + ' of 27 tokens placed'
        : 'Four conversations, 27 tokens, 64 allocated slots.',
    598,
  );
}
const { causal, isolated } = makeAttentionMasks();
const values = [1, 2, 3, 10, 20, 30],
  words = ['A0', 'A1', 'A2', 'B0', 'B1', 'B2'];
const probe = (changed) => values.map((v, i) => (i < 3 ? v + changed * 1000 : v));
function cuts(g, k) {
  top(g, k, 'PACKING  /  LONG ROW', 'Which context survives a 16-token cut?');
  const split = cue(k, 0, 'split variant') > 0,
    wrap = cue(k, 0, 'Wrapped packing') > 0;
  const prior = wrap ? 4 : 0,
    sequence = [
      ...Array(prior).fill('X'),
      ...Array.from({ length: 20 }, (_, i) => (i < 10 ? 'E' + i : 'A' + (i - 10))),
    ];
  micro(
    g,
    wrap
      ? 'WRAPPED STREAM  /  FOUR EARLIER TOKENS'
      : split
        ? 'SPLIT LONG ROW BEFORE PACKING'
        : 'BEST-FIT DECREASING  /  TRUNCATE OVERFLOW',
    60,
    205,
  );
  for (const [idx, word] of sequence.entries()) {
    const y = 260 + Math.floor(idx / 16) * 125,
      x = 60 + (idx % 16) * 67;
    const dropped = idx >= 16 && !split;
    rect(g, x, y, 62, 61, dropped ? C.rose : word[0] === 'A' ? C.sea : C.white, C.rule);
    txt(g, word, x + 31, y + 31, 23, dropped ? C.red : C.ink, 'center', 'Mono');
    if (dropped) line(g, x + 4, y + 57, x + 58, y + 4, C.red, 2);
  }
  note(
    g,
    wrap
      ? 'The earlier tokens move the cut. The next block starts with answer pieces.'
      : split
        ? 'The second chunk starts mid-answer, past the evidence.'
        : 'The four overflow answer pieces are discarded.',
    552,
  );
}
function segments(g, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    cuts(g, k);
    return;
  }
  top(
    g,
    k,
    'PACKING  /  ISOLATION PROBE',
    b < 3 ? 'Which boundaries reach the kernel?' : 'Can a change in A reach B’s middle token?',
  );
  if (b < 3) {
    const r = tape(g, words, 260, {
      x: 120,
      w: 960,
      fill: (i) => (i < 3 ? C.white : C.sea),
      number: false,
    });
    [0, 3, 6].forEach((i) => {
      const x = r.x + i * r.step;
      line(g, x, 241, x, 403, C.red, 3);
      txt(g, i, x, 441, 34, C.ink, 'center', 'Mono');
    });
    micro(g, 'CUMULATIVE LENGTHS', 120, 496);
    note(
      g,
      b === 1
        ? 'Two conversations of three tokens each.'
        : 'Verify the boundaries consumed by the attention kernel.',
      568,
    );
    return;
  }
  const changed = cue(k, 3, 'Add a thousand') > 0,
    after = probe(Number(changed)),
    done = b === 4;
  const r = tape(g, words, 236, {
    x: 238,
    w: 900,
    fill: (i) => (i < 3 ? C.white : C.sea),
    number: false,
  });
  dataRow(g, 'Before', values, r, 390);
  dataRow(g, 'After', after, r, 454, { color: (i) => (changed && i < 3 ? C.red : C.ink) });
  [3, 4].forEach((i) => line(g, r.at(i) - 25, 481, r.at(i) + 25, 481, C.teal, 4));
  note(
    g,
    done
      ? 'B1 still reads 10 and 20. Its mean is ' + attendedMean(isolated, 4, after) + '.'
      : changed
        ? 'B1 was 15. What does it read now?'
        : 'B1 reads 10 and 20 with equal weights.',
    570,
  );
}
function matrix(g, x, y, mask, title, show) {
  const s = 35,
    off = 59;
  micro(g, title, x, y - 39);
  words.forEach((w, i) => {
    txt(g, w, x + off + (i + 0.5) * s, y - 10, 15, C.dim, 'center', 'Mono');
    txt(g, w, x + 25, y + (i + 0.5) * s, 16, i === 4 ? C.teal : C.dim, 'center', 'Mono');
  });
  mask.forEach((row, q) =>
    row.forEach((allow, j) => {
      rect(
        g,
        x + off + j * s,
        y + q * s,
        s - 3,
        s - 3,
        allow ? (q === 4 ? C.teal : C.sea) : C.fade,
      );
      if (allow && q === 4)
        circle(g, x + off + (j + 0.5) * s - 1, y + (q + 0.5) * s - 1, 4, C.white);
    }),
  );
  const selected = values.filter((_, i) => mask[4][i]);
  txt(g, 'B1 reads   ' + selected.join(', '), x, y + 6 * s + 38, 23, C.ink, 'left', 'Sans');
  if (show)
    txt(
      g,
      selected.reduce((sum, value) => sum + value, 0) +
        ' ÷ ' +
        selected.length +
        ' = ' +
        attendedMean(mask, 4, values),
      x,
      y + 6 * s + 83,
      33,
      C.teal,
      'left',
      'Serif',
    );
}
function attention(g, k) {
  top(g, k, 'ATTENTION  /  EQUAL LOGITS', 'Which keys can B1 read?');
  const closed = cue(k, 0, 'one more restriction') > 0;
  const firstResult = k.beat.beatIndex === 1 && k.elapsed + 1e-9 >= k.wordCue('7.2').end;
  const secondResult = k.beat.beatIndex === 1 && k.elapsed + 1e-9 >= k.wordCue('producing 15').end;
  note(g, 'Rows are queries. Columns are keys. The dark squares belong to query B1.', 148);
  matrix(g, 91, 215, causal, 'ORDINARY CAUSAL', firstResult);
  matrix(
    g,
    657,
    215,
    closed ? isolated : causal,
    closed ? 'SEGMENT-ISOLATED' : 'BEFORE SEGMENT RESTRICTION',
    secondResult,
  );
}
function boundary(g, k) {
  const b = k.beat.beatIndex;
  top(g, k, 'PACKING  /  TARGET OWNERSHIP', 'What does the last logit in A predict?');
  const disabled = cue(k, 0, 'boundary target must be ignored') > 0;
  const r = tape(g, words, 234, { fill: (i) => (i < 3 ? C.white : C.sea), number: false });
  line(g, r.x + 3 * r.step, 207, r.x + 3 * r.step, 445, C.red, 3);
  if (b === 0) {
    arrow(g, r.at(2), 353, r.at(3), 425, disabled ? C.rule : C.red, 4);
    if (disabled) {
      line(g, 585, 377, 615, 405, C.red, 5);
      line(g, 615, 377, 585, 405, C.red, 5);
    }
    txt(g, disabled ? '−100' : 'B0', r.at(3), 472, 31, disabled ? C.teal : C.red, 'center', 'Mono');
    note(
      g,
      disabled
        ? 'Skip this pair in the loss. Keep the conversations independent.'
        : 'A global shift crosses the join from A2 to B0.',
      569,
    );
  } else {
    const after = probe(Number(cue(k, 1, 'Change every value') > 0));
    after.forEach((v, i) => txt(g, v, r.at(i), 390, 31, i < 3 ? C.red : C.ink, 'center', 'Mono'));
    txt(g, 'A2 → B0     label −100', 60, 477, 29, C.ink, 'left', 'Mono');
    txt(g, 'B1 mean    ' + attendedMean(isolated, 4, after), 708, 477, 29, C.teal, 'left', 'Mono');
    note(g, 'Test both paths on the packed batch.', 580);
  }
}
function transfer(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'COLLATOR  /  SECOND REPLY',
    b ? 'Inspect the actual batch' : 'Follow a target through the collator',
  );
  const begin = 11,
    selected = (array) => array.slice(begin);
  const r = tape(g, selected(TOKENS), 220, {
    x: 257,
    w: 882,
    ids: selected(TOKEN_IDS),
    start: begin,
    fill: (i) => (ASSISTANT_TARGETS[begin + i] ? C.sea : C.white),
  });
  const labs = selected(
    TOKEN_IDS.map((_, i) => (i + 1 < 17 && ASSISTANT_TARGETS[i + 1] ? TOKEN_IDS[i + 1] : -100)),
  );
  if (b) {
    dataRow(
      g,
      'Input role',
      TOKENS.slice(begin).map((_, i) => (i === 0 ? 'user' : 'assistant')),
      r,
      369,
      { size: 17 },
    );
    if (cue(k, 1, 'Compare a training sequence')) {
      bracket(g, r.x, r.x + r.step * 2, 197, 'Serving prefix tail');
      bracket(g, r.x + r.step * 2, r.end, 197, 'Training continuation');
    }
    dataRow(g, 'Valid input', Array(6).fill(1), r, 411);
    dataRow(g, 'Segment', Array(6).fill(0), r, 452);
  }
  dataRow(
    g,
    'Next label',
    labs.map((v, i) => (i === 5 ? '—' : fmtLabel(v))),
    r,
    b ? 509 : 415,
    { color: (i) => activeColor(labs[i]) },
  );
  if (!b) arrow(g, r.at(1), 452, r.at(2), 493, C.teal);
  note(
    g,
    b
      ? 'Serving ends at <A>. Training continues with She, is, playing., EOS.'
      : 'At 12, header ID 105 predicts She, ID 106 at 13.',
    590,
  );
}
export const packingScenes = [packing, segments, attention, boundary, transfer];
export function checkPacking() {
  assert.deepEqual(returnPack.contents, [[0, 2], [1]]);
  assert.deepEqual(returnPack.bins, [16, 8]);
  assert.deepEqual(pack.contents, [
    [0, 1],
    [2, 3],
  ]);
  assert.deepEqual(pack.bins, [15, 12]);
  assert.equal(pack.capacity, 32);
  assert.equal(pack.tokens, 27);
  assert.equal(attendedMean(causal, 4, values), 7.2);
  assert.equal(attendedMean(isolated, 4, values), 15);
  assert.equal(attendedMean(isolated, 4, probe(1)), 15);
  assert.deepEqual(isolated[4], [0, 0, 0, 1, 1, 0]);
  assert.equal(TOKEN_IDS[12], 105);
  assert.equal(TOKEN_IDS[13], 106);
}
