import { C, count, cue, letter } from './press.mjs';
import {
  DOCS,
  TERMS,
  CATALOG,
  BINARY_TRACE,
  binarySearchTrace,
  COLLISION_QUERY,
  PREFIX_WORDS,
  PREFIX_QUERY,
  APPEND_EVENTS,
} from '../../../films/algorithm-complexity/fixtures.mjs';
import { hashKey } from '../../../films/algorithm-complexity/arithmetic.mjs';
import { radixPrefixTrace } from '../../../films/algorithm-complexity/model.mjs';

export const hits = DOCS.map((d) => TERMS.filter((term) => d.words.includes(term)).length);
const repeat = [...DOCS, ...DOCS];
export const mergeRuns = repeat
  .map((doc, i) => ({ i, score: hits[i % 4] }))
  .filter((x) => x.score)
  .sort((a, b) => b.score - a.score || a.i - b.i);
export const insertedKey = 'identity-provider';
export const insertAt = CATALOG.findIndex((key) => key > insertedKey);
export const buckets = Array.from({ length: 8 }, (_, i) => DOCS.filter((d) => hashKey(d.id) === i));
export const prefix = radixPrefixTrace();
export const tokenTapes = [
  [11, 42, 17, 99],
  [11, 42, 17, 8],
];
export const splitAt = tokenTapes[0].findIndex((id, i) => id !== tokenTapes[1][i]);
export const embeddingPath = [
  [9, 8],
  [6, 5],
  [3, 2],
  [1, 1],
];

export function reader(p, t) {
  const b = t.beat.beatIndex + 1;
  const feed = cue(t, 3, 'Feed the remaining three through', 3.2);
  const visited = count(1, cue(t, 2, "That's two hits", 0.45)) + count(3, feed);
  const focus = Math.max(0, visited - 1);
  const wordChecks =
    count(2, cue(t, 2, 'Login and test each get a mark', 1)) +
    count(1, cue(t, 2, "That's two hits", 0.35));
  p.title('What can four authorized notes tell us?');
  p.label('FAILED LOGIN TEST   /   PROVIDER UPDATE', 65, 185);
  for (let i = 0; i < 4; i++) {
    const y = 225 + i * 88;
    p.card(i, 66, y, 440, 70);
    if (i < visited) {
      p.disc(475, y + 41, 18, C.green);
      p.mono(hits[i], 475, y + 42, 23, C.light, { align: 'center' });
    }
  }
  p.label('Word reader', 606, 186);
  p.shape(
    [
      [602, 252],
      [640, 207],
      [1303, 207],
      [1361, 249],
      [1361, 586],
      [1337, 610],
      [601, 610],
    ],
    C.iron,
    C.ink,
    3,
  );
  p.rect(626, 239, 705, 270, C.dark);
  p.strip(616, 232, 696, 264, C.light);
  p.roller(611, 354, 22, feed * 6);
  p.roller(1321, 354, 22, feed * 6);
  p.text('Card ' + letter(focus), 644, 278, 37, C.ink, { face: 'Serif' });
  p.mono(DOCS[focus].words.join('   '), 644, 349, 30, C.ink, { max: 650 });
  p.line(641, 390, 1301, 390, C.rule);
  TERMS.forEach((term, j) => {
    const checked = j < wordChecks,
      found = DOCS[focus].words.includes(term);
    p.text(term, 650 + j * 213, 448, 30, C.ink);
    p.disc(
      791 + j * 213,
      448,
      14,
      checked ? (found ? C.green : C.paper) : null,
      checked ? C.green : C.rule,
    );
    if (checked && !found) p.line(782 + j * 213, 448, 800 + j * 213, 448, C.muted);
  });
  p.mono('Visit marks', 650, 552, 22, C.light);
  DOCS.forEach((_, i) => {
    const x = 904 + i * 92;
    p.disc(x, 551, 22, C.dark, C.brass, 2);
    p.disc(x, 551, 14, i < visited ? C.mint : C.iron);
  });
  p.foot(
    b === 1
      ? 'Which search words occur on A?'
      : b === 2 && visited === 1
        ? 'How many more cards need a visit?'
        : visited === 4
          ? 'Four visits, including two cards with zero hits.'
          : 'Each inspected card leaves a mark.',
    visited + ' / 4 visited',
  );
}

export function scan(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b >= 6) {
    p.title('Put the matching cards in score order');
    const processed =
      count(1, cue(t, 6, 'A goes first', 0.55)) +
      count(1, cue(t, 7, 'Its two hits', 0.45)) +
      count(2, cue(t, 7, 'Finish the merge', 1.7));
    p.label('Ordered runs', 64, 185);
    p.label('Merged output', 730, 185);
    const runs = [
      [0, 1],
      [4, 5],
    ];
    runs.forEach((run, r) =>
      run.forEach((id, j) => {
        const used = mergeRuns.slice(0, processed).some((x) => x.i === id);
        const x = 66 + j * 250,
          y = 252 + r * 175;
        const score = hits[id % 4];
        p.tag(
          letter(id) + '   ' + score + (score === 1 ? ' hit' : ' hits'),
          x,
          y,
          222,
          81,
          used ? C.iron : C.light,
          used ? C.pale : C.ink,
          28,
        );
      }),
    );
    p.arrow(572, 400, 676, 400);
    for (let i = 0; i < 4; i++) {
      const x = 730 + (i % 2) * 316,
        y = 248 + Math.floor(i / 2) * 177,
        row = mergeRuns[i];
      if (i < processed)
        p.card(row.i, x, y, 293, 98, row.score + (row.score === 1 ? ' hit' : ' hits'));
      else p.rect(x, y, 293, 98, null, p.grid);
    }
    p.foot(
      b === 6
        ? processed
          ? 'After A, compare the two front cards.'
          : 'Compare the front card of each run.'
        : b === 7
          ? 'One pass through the matches at each merge level.'
          : 'Scan Θ(n)   +   order O(r log r)',
      b === 8 ? 'r ≤ n' : 'r = 4 matches',
      { raised: true },
    );
    return;
  }
  if (b === 4 || b === 5) {
    p.title(
      b === 4 ? 'A fixed inner loop adds one strip per note' : 'What if note length grows too?',
    );
    const repeats =
      b === 4
        ? 1 +
          count(1, cue(t, 4, 'Sixteen notes', 0.8)) +
          2 * count(1, cue(t, 4, 'Thirty-two', 0.85))
        : 4;
    const n = 8 * repeats;
    p.label('Three word tests per bounded note', 65, 187);
    for (let row = 0; row < n; row++) {
      const x = 66 + Math.floor(row / 8) * 157,
        y = 231 + (row % 8) * 43;
      for (let j = 0; j < TERMS.length; j++) p.rect(x + j * 38, y, 32, 32, C.mint);
    }
    if (b === 4) {
      p.label('Candidate visits', 824, 227);
      p.value(n, 'notes inspected', 823, 318);
      p.mono(n + ' × 3 = ' + n * 3 + ' word tests', 823, 496, 29, p.fg);
    } else {
      p.label('A longer passage', 799, 230);
      p.strip(798, 288, 535, 196, C.light);
      p.mono('login  test  expired  fixture', 822, 347, 24, C.ink);
      if (cue(t, 5, 'count the words', 0.7) > 0)
        p.mono('after  the  provider  update', 822, 419, 24, C.copper);
      p.mono('Count input words as well.', 799, 555, 26, p.fg);
    }
    p.foot(
      b === 4
        ? 'The fixed width keeps the work proportional to row count.'
        : 'Building a word set must read the passage.',
    );
    return;
  }
  const cells = 4 + count(4, cue(t, 1, 'add four more', 1.3));
  const visits = count(8, cue(t, 2, 'visit the notes one at a time', 3.2));
  p.title('A second scan of the same words');
  p.label('One column per authorized note', 68, 190);
  for (let i = 0; i < cells; i++) {
    const x = 68 + i * 162;
    p.strip(x, 242, 139, 260, i < visits ? C.mint : C.light);
    p.text(letter(i), x + 68, 308, 53, C.ink, { align: 'center', face: 'Serif' });
    TERMS.forEach((term, j) => {
      const y = 371 + 43 * j;
      p.mono(term, x + 12, y, 20, C.muted);
      p.disc(
        x + 110,
        y,
        8,
        i < visits ? (DOCS[i % 4].words.includes(term) ? C.green : C.muted) : null,
        C.rule,
      );
    });
    if (i < visits) p.disc(x + 70, 549, 12, p.good);
  }
  p.label('Notes in this pass', 70, 628);
  p.mono(cells, 307, 628, 35, p.fg);
  p.label('Visits made', 650, 628);
  p.mono(visits, 827, 628, 35, p.good);
  p.foot(
    [
      cells === repeat.length
        ? 'How many visits will the second scan take?'
        : 'Add a copy of each note to the scan.',
      'Every note costs a visit.',
      'Θ(n) is tight. O(n) is an upper bound.',
      '16 notes → 16 visits      32 notes → 32 visits',
      'If a passage grows, count its words too.',
    ][b - 1],
  );
}

export function catalog(p, t) {
  const b = t.beat.beatIndex + 1,
    replay = b === 4 || b === 5,
    insertion = b === 6;
  const trace = replay ? binarySearchTrace(CATALOG, CATALOG[0]) : BINARY_TRACE;
  const steps = replay
    ? count(3, cue(t, 4, 'the first three midpoints', 1.45)) +
      count(1, cue(t, 5, "That's the fourth midpoint check", 0.45))
    : count(1, cue(t, 2, 'At four', 0.5)) +
      count(1, cue(t, 3, 'Docs-index', 0.5)) +
      count(1, cue(t, 3, "There's issuer-check", 0.45));
  const row = steps ? trace[steps - 1] : null;
  const slide = cue(t, 6, 'later references must move', 1.6);
  const inserted = insertion && cue(t, 6, 'Slip the new key', 0.45) === 1;
  p.title(insertion ? 'Make room in the sorted catalog' : 'Narrow the sorted catalog');
  p.label('Slot     Stored key', 66, 177);
  const slotY = (i) => 218 + i * 48;
  CATALOG.forEach((key, i) => {
    const y = slotY(i + (i >= insertAt ? slide : 0)),
      outside = !insertion && row && (i < row.nextLo || i >= row.nextHi);
    p.rect(
      63,
      y - 19,
      618,
      41,
      outside ? C.paper : !insertion && row?.mid === i ? C.mint : C.light,
      C.rule,
      1,
    );
    p.mono(insertion && slide === 1 && i >= insertAt ? i + 1 : i, 82, y + 2, 22, p.mid);
    p.mono(key, 169, y + 2, 24, outside ? p.mid : C.ink);
  });
  if (inserted) {
    const y = slotY(insertAt);
    p.rect(63, y - 19, 618, 41, C.orange, C.rule);
    p.mono(insertAt, 82, y + 2, 22, C.ink);
    p.mono(insertedKey, 169, y + 2, 24, C.ink);
  }
  const keyLabel = inserted ? 'Inserted at slot ' + insertAt : 'Incoming key';
  p.label(insertion ? keyLabel : 'Find exact key', 780, 196);
  p.text(insertion ? insertedKey : replay ? CATALOG[0] : 'issuer-check', 777, 266, 49, p.fg, {
    face: 'Serif',
  });
  if (insertion) {
    p.value(
      slide === 1 ? String(CATALOG.length - insertAt) : '…',
      inserted ? 'references shifted right' : 'later references shift right',
      778,
      419,
    );
    p.foot('Maintaining sorted order can cost O(n) on insertion.');
  } else {
    p.mono('mid = floor((lo + hi) / 2)', 780, 358, 26, p.mid);
    p.label('Midpoints visited', 780, 432);
    p.mono(
      trace
        .slice(0, steps)
        .map((x) => x.mid)
        .join(' → ') || '·',
      780,
      491,
      42,
      p.good,
    );
    const low = row?.nextLo ?? 0,
      high = row?.nextHi ?? CATALOG.length;
    p.text(
      row?.found ? 'Equal key at slot ' + row.mid : 'Surviving slots   [' + low + ', ' + high + ')',
      780,
      585,
      33,
      p.fg,
    );
    let note = 'Random access  ·  bounded key comparisons';
    const scaleExample = replay && cue(t, 5, 'Seventeen checks', 0.45) === 1;
    if (replay) {
      note = 'Find the first key in the catalog.';
      if (high - low === 1) note = 'Does a one-slot range still need a read?';
      if (row?.found) note = 'Reading the final slot confirms the match.';
      if (scaleExample) note = '65,536 slots → 16 halvings + 1 final read';
    }
    const checks = steps + (steps === 1 ? ' midpoint check' : ' midpoint checks');
    p.foot(note, scaleExample ? '8 slots · ' + checks : checks, { raised: true });
  }
}

export function hash(p, t) {
  const b = t.beat.beatIndex + 1,
    forced = b === 2;
  const key = forced ? COLLISION_QUERY : 'issuer-check',
    bucket = forced ? 0 : hashKey(key);
  const sum = [...key].reduce((n, c) => n + c.codePointAt(0), 0);
  const routed = forced || b === 3 || cue(t, 1, 'Follow issuer-check', 0.6) === 1;
  const probes = forced
    ? count(DOCS.length, cue(t, 2, 'checks each stored key', 2.2))
    : count(1, cue(t, 1, 'for equality', 0.35));
  if (b === 3) {
    const chars = [...key],
      read = count(chars.length, cue(t, 3, 'adds every character code', 2.8));
    const subtotal = chars.slice(0, read).reduce((n, ch) => n + ch.codePointAt(0), 0);
    p.title('Hashing reads the query key');
    p.label('Characters in the query key', 65, 184);
    chars.forEach((ch, i) => {
      const x = 65 + i * 108;
      p.tag(ch, x, 243, 93, 90, i < read ? C.mint : C.light, C.ink, 38);
      if (i < read) p.mono(ch.codePointAt(0), x + 46, 367, 24, p.good, { align: 'center' });
    });
    p.mono('Character sum', 68, 472, 27, p.mid);
    p.value(subtotal, 'after ' + read + ' characters', 65, 548);
    if (read === chars.length)
      p.mono(subtotal + ' mod 8  →  bucket ' + bucket, 664, 540, 32, p.hot);
    p.foot('The hash reads the key, even when one equality check finishes the lookup.');
    return;
  }
  p.title(forced ? 'A bucket full of collisions' : 'Find the bucket, then check the key');
  p.label('Query key', 65, 184);
  p.text(key, 65, 243, 53, p.fg, { face: 'Serif' });
  p.mono(
    forced
      ? 'Forced hash  →  bucket 0'
      : 'Σ character codes   =   ' + sum + '      ' + sum + ' mod 8   =   ' + bucket,
    66,
    331,
    28,
    p.mid,
  );
  if (forced) {
    p.label('Bucket 0   /   chain order', 66, 404);
    DOCS.forEach((doc, i) => {
      const x = 65 + 333 * i;
      p.strip(x, 446, 296, 116, i < probes ? C.orange : C.light);
      p.mono(doc.id, x + 148, 499, 24, C.ink, { align: 'center' });
      if (i < probes) p.mono('unequal', x + 148, 538, 19, C.red, { align: 'center' });
      if (i < 3) p.arrow(x + 299, 507, x + 328, 507, p.grid, 2);
    });
  } else {
    buckets.forEach((docs, i) => {
      const x = 65 + i * 165,
        y = 435;
      p.shape(
        [
          [x, y + 10],
          [x + 13, y - 4],
          [x + 156, y - 4],
          [x + 154, y + 142],
          [x, y + 142],
        ],
        C.iron,
        C.brass,
        2,
      );
      p.rect(x + 5, y + 13, 143, 128, i === bucket && routed ? C.mint : C.light);
      p.mono(i, x + 77, y - 31, 25, p.mid, { align: 'center' });
      docs.forEach((doc, j) =>
        p.mono(doc.id, x + 77, y + 44 + j * 45, 19, C.ink, { align: 'center', max: 147 }),
      );
      p.rect(x + 9, y + 118, 135, 20, C.iron);
      p.line(x + 62, y + 127, x + 92, y + 127, C.brass, 3);
    });
  }
  p.foot(
    forced
      ? probes === 4
        ? 'Missing key  ·  worst case O(n) probes'
        : 'Follow the chain until a match or its end.'
      : b === 3
        ? 'Hashing the key also reads its characters.'
        : 'Good spread and controlled load give expected O(1) probes.',
    probes + ' key ' + (probes === 1 ? 'check' : 'checks'),
  );
}

export function radix(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b === 5) {
    p.title('A distance query follows embedding neighbors');
    const screen = ([x, y]) => [180 + x * 70, 597 - y * 43];
    const route = embeddingPath.map(screen),
      hops = count(3, cue(t, 5, 'Each hop', 2));
    const other = [
      [7, 8],
      [7, 4],
      [2, 5],
    ].map(screen);
    [
      [route[0], other[0]],
      [other[0], route[1]],
      [route[1], other[1]],
      [other[1], route[2]],
      [route[2], other[2]],
    ].forEach(([a, z]) => p.line(...a, ...z, p.grid, 2));
    route
      .slice(1)
      .forEach((z, i) => p.line(...route[i], ...z, i < hops ? p.good : p.grid, i < hops ? 7 : 3));
    other.forEach((a) => p.disc(...a, 11, p.grid));
    route.forEach((a, i) => {
      p.disc(...a, 17, i <= hops ? p.good : p.grid);
      p.mono(letter(i), a[0] + 24, a[1], 22, p.fg);
    });
    p.disc(...screen([0, 0]), 15, p.hot);
    p.mono('query', 215, 596, 24, p.hot);
    p.label('Toy graph walk', 994, 256);
    p.value(Math.hypot(...embeddingPath[hops]).toFixed(1), 'distance to query', 994, 366);
    p.foot('HNSW seeks approximate neighbors in embedding space.');
    return;
  }
  if (b >= 6) {
    const matched = count(splitAt, cue(t, 6, 'The first three match', 1.1));
    p.title('Where do the token histories split?');
    tokenTapes.forEach((tape, r) => {
      const y = 252 + 164 * r;
      p.label(r ? 'Incoming request' : 'Stored request', 64, y + 56);
      tape.forEach((id, i) =>
        p.tag(
          id,
          343 + i * 232,
          y,
          192,
          110,
          i < matched
            ? C.mint
            : i === splitAt && cue(t, 6, 'at the fourth token', 0.45)
              ? C.orange
              : C.light,
          C.ink,
          46,
        ),
      );
    });
    p.foot(
      b === 6
        ? 'Same model, adapter, positions, other inputs and cache scope.'
        : 'Reuse positions 1–3. Compute fresh K and V for token 8.',
    );
    return;
  }
  p.title('Four words share one beginning');
  const checks = count(12, cue(t, 2, 'Follow those repeated comparisons', 2.5));
  PREFIX_WORDS.forEach((word, r) => {
    const y = 234 + r * 97;
    [...word].forEach((ch, j) =>
      p.tag(ch, 65 + j * 66, y, 60, 68, j < 3 && r * 3 + j < checks ? C.mint : C.light, C.ink, 33),
    );
  });
  p.label('Per-word prefix checks', 66, 181);
  p.mono(checks + (checks === 1 ? ' check' : ' checks'), 66, 617, 31, p.good);
  if (b < 3) {
    p.label('Prefix query', 795, 242);
    p.text(PREFIX_QUERY, 794, 354, 109, p.fg, { face: 'Serif' });
    p.text('One check per letter, per word', 795, 493, 32, p.mid);
  } else {
    const checked = count(prefix.comparisons, cue(t, 3, 'The label comparison', 1.65));
    p.label('Compressed edge', 649, 185);
    p.disc(675, 416, 14, p.hot);
    p.line(690, 416, 987, 416, p.grid, 4);
    [...prefix.matched].forEach((ch, i) =>
      p.tag(ch, 729 + i * 66, 379, 62, 72, i < checked ? C.mint : C.light, C.ink, 33),
    );
    p.disc(997, 416, 11, p.good);
    prefix.branches.forEach((suffix, i) => {
      const y = 248 + i * 108;
      p.line(1008, 416, 1164, y, p.grid, 3);
      p.mono(suffix, 1187, y, 33, b === 4 ? p.good : p.mid);
    });
    p.mono(
      '1 child lookup + ' + checked + (checked === 1 ? ' label check' : ' label checks'),
      645,
      616,
      24,
      p.mid,
    );
  }
  p.foot(
    b < 3
      ? checks === PREFIX_QUERY.length * PREFIX_WORDS.length
        ? 'Each word took three letter checks.'
        : 'How many letter checks will these four words take?'
      : b === 3
        ? 'Select the edge, then compare the symbols on its label.'
        : 'Expected O(p + 1) descent. Returning completions costs extra.',
    '',
    { raised: true },
  );
}

export function append(p, t) {
  const b = t.beat.beatIndex + 1;
  const work =
    3 * cue(t, 1, 'copy the two old references', 2.2) +
    cue(t, 3, 'It fits', 0.55) +
    8 * cue(t, 4, 'Continue the same doubling rule', 3.2);
  const done = Math.floor(work + 1e-7),
    event = APPEND_EVENTS[done];
  const allocated = cue(t, 1, 'Allocate four slots', 0.65);
  const phase = work - done;
  const blocks =
    done === 0 && allocated < 1
      ? APPEND_EVENTS[0].before.slice(0, 1)
      : done > 0 && phase < 1e-7
        ? APPEND_EVENTS[done - 1].after
        : (event?.before ?? APPEND_EVENTS.at(-1).after);
  const total = 2 + done;
  p.title('Keep the copy bill with the array');
  p.label('Allocated blocks   /   reference slots', 65, 176);
  for (const block of blocks) {
    const y = block.y === 400 ? 234 : 397;
    p.label(block.capacity + ' slots', 65, y + 36);
    for (let i = 0; i < block.capacity; i++) {
      const value = block.values[i],
        x = 240 + i * 135;
      p.rect(x, y, 119, 85, C.iron, C.brass);
      if (value) {
        p.disc(x + 59, y + 43, 29, C.mint);
        p.mono(value, x + 59, y + 43, 28, C.ink, { align: 'center' });
      }
    }
  }
  if (event && phase > 0.001) {
    const y = event.destinationY === 400 ? 234 : 397,
      start = event.type === 'copy' ? (event.sourceY === 400 ? 234 : 397) : y - 86;
    const pos = start + (y - start) * phase,
      x = 299 + event.slot * 135;
    p.disc(x, pos + 43, 30, C.orange);
    p.mono(event.value, x, pos + 43, 29, C.ink, { align: 'center' });
  }
  p.label('Writes since the first arrival', 65, 552);
  for (let i = 0; i < total; i++) {
    const isCopy = i >= 2 && APPEND_EVENTS[i - 2].type === 'copy';
    p.rect(65 + i * 63, 592, 55, 45, isCopy ? C.orange : C.mint);
    p.mono(isCopy ? 'C' : 'A', 92 + i * 63, 616, 23, C.ink, { align: 'center' });
  }
  p.mono(total + ' writes', 1050, 613, 39, p.fg);
  p.foot(
    b === 2
      ? 'Reference four is next. Is a copy necessary?'
      : b === 6
        ? 'Amortized cost sums a sequence. Expected probes depend on spread.'
        : b >= 5
          ? '8 arrivals + 6 copies = 14 writes. Amortized O(1) per append.'
          : 'A = arrival write       C = copy of an old reference',
    '',
    { raised: true },
  );
}
