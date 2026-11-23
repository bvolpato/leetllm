import {
  C,
  mix,
  reveal,
  rect,
  label,
  mono,
  serif,
  line,
  dot,
  plate,
  substrate,
  head,
  foot,
  wire,
  socket,
  strip,
} from './drawing.mjs';
import {
  standard,
  balance,
  replay,
  pageState,
  locatePosition,
  bytes,
  pageMiB,
  tokenGiB,
  pagesFor,
  prefixRefs,
  remote,
} from './examples.mjs';

export function ledger(c, s, state, x, y, w, h = 58) {
  const colors = [C.steel, C.gold, C.bLight],
    keys = ['available', 'held', 'settled'];
  strip(
    c,
    x,
    y,
    w,
    h,
    keys.map((key, i) => [state[key], colors[i]]),
    s.limit,
  );
  keys.forEach((key, i) => {
    const dx = x + (i * w) / 3;
    dot(c, dx + 9, y + h + 44, 9, colors[i]);
    label(c, key, dx + 29, y + h + 54, 31, C.cream);
    mono(c, state[key], dx + 29, y + h + 111, 48, C.cream);
  });
}

export function admission(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3 || b === 4) {
    const wait = reveal(k, 4, 'Wait for capacity');
    head(c, k, 'Physical placement', 'Can this worker accept a five-page request?');
    documentRequest(c, 120, 413, 'Page request', '5 pages');
    wire(c, 566, 521, 800, 521, C.A, 1);
    substrate(c, 789, 326, 1014, 397);
    mono(c, 'PLACEMENT INVENTORY', 858, 406, 31, C.cream);
    for (let i = 0; i < 5; i++) socket(c, 862 + i * 170, 473, 130, 115, C.bLight, i < 4);
    label(c, '4 pages available', 859, 657, 37, C.cream);
    foot(
      c,
      wait
        ? 'Hold dispatch while placement finds capacity.'
        : 'The period ledger has room. The worker has four pages.',
      wait
        ? 'A committed hold survives an ambiguous dispatch. A definite failure before execution can release it.'
        : 'Check allowance, concurrency, sequence caps and physical capacity independently.',
    );
    return;
  }
  const booked = Boolean(reveal(k, 1, 'The first commit')),
    settled = Boolean(reveal(k, 6, 'Settle four hundred'));
  const repeat = reveal(k, 6, 'A second message');
  const conflict = b === 2 && reveal(k, 2, 'The fingerprint conflicts');
  const revised = b === 2 && reveal(k, 2, 'Change the adapter');
  const phase = balance(standard, booked, settled, settled, Boolean(repeat));
  head(
    c,
    k,
    'Fixed-period allowance',
    b <= 1
      ? 'Can two gateways each reserve 700?'
      : b === 2
        ? 'Does the same key still mean the same request?'
        : 'What returns to available allowance?',
  );
  const ts =
    b < 2
      ? ['Gateway 1', 'Gateway 2']
      : b === 2
        ? ['Stored reservation', 'Replay request']
        : ['Trusted usage', repeat ? 'Delivery 2' : 'Original cap'];
  const ds =
    b < 2
      ? [booked ? '700 committed' : '300 + 400', booked ? '700 exceeds 300' : '300 + 400']
      : b === 2
        ? ['A/r1   ·   docs-v2', 'A/r1   ·   ' + (revised ? 'docs-v3' : 'docs-v2')]
        : ['300 input + 120 output', repeat ? 'Same attempt and usage' : '300 input + 400 cap'];
  ts.forEach((t, i) => documentRequest(c, 125 + 875 * i, 277, t, ds[i], 720, 131));
  substrate(c, 93, 462, 1732, 338);
  mono(c, 'A   /   PERIOD LIMIT  1,000', 147, 529, 32, C.cream);
  ledger(c, standard, phase, 148, 573, 1621, 56);
  let main = booked ? 'Only the first gateway can commit.' : 'One period, one balance, two contenders.';
  if (b === 2)
    main = conflict
      ? 'Fingerprint conflict. Preserve the original hold.'
      : revised
        ? 'Compare the immutable revisions.'
        : 'Same key and fingerprint retrieve the existing hold.';
  if (b >= 5)
    main = settled
      ? repeat
        ? 'The second delivery leaves 580 available.'
        : 'Charge 420. Return 280 unused units.'
      : 'The attempt has retired. Its usage receipt is ready.';
  foot(
    c,
    main,
    b === 2
      ? conflict
        ? replay(standard, { ...standard, revision: 'docs-v3' }) + '   /   A/r1 stays bound to docs-v2'
        : 'The tenant and key identify a reservation. The fingerprint binds its execution inputs.'
      : 'Available + held + settled = 1,000 units.',
  );
}
function documentRequest(c, x, y, title, body, w = 446, h = 203) {
  plate(c, x, y, w, h, '#d7deca', 4);
  label(c, title, x + 33, y + 49, 32, C.muted);
  mono(c, body, x + 33, y + 101, 39, C.ink);
}

const tableEntryX = (block) => 382 + block * 194;
const physicalPageX = (page) => 133 + page * 338;
const writeBadgeX = 1484;

function physicalLookup(c, block, page, progress) {
  const entryX = tableEntryX(block);
  const pageX = physicalPageX(page) + 127;
  const toEntry = Math.min(1, progress * 2);
  const requestX = mix(writeBadgeX, entryX + 68, toEntry);
  line(
    c,
    [[writeBadgeX, 350], [requestX, 350]],
    C.B,
    6,
  );
  if (toEntry < 1) {
    dot(c, requestX, 350, 8, C.B);
    return;
  }

  const toPage = Math.max(0, progress * 2 - 1);
  const traceX = mix(entryX, pageX, Math.min(1, toPage / 0.85));
  const traceY = toPage > 0.85 ? mix(393, 442, (toPage - 0.85) / 0.15) : 393;
  const path = [
    [entryX, 379],
    [entryX, 393],
    [traceX, 393],
    [traceX, Math.min(408, traceY)],
  ];
  line(c, path, C.B, 6);
  if (traceY > 408) line(c, [[traceX, 408], [traceX, traceY]], C.gold, 6);
  dot(c, traceX, traceY, 8, traceY > 408 ? C.gold : C.B);
}

function physicalPages(c, k) {
  const b = k.beat.beatIndex;
  const after = (beat, phrase, { captionStart = false } = {}) => {
    if (b !== beat) return b > beat;
    k.reveal(phrase, 0, { captionStart });
    return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
  };
  const write32 = 'The last slot of page three holds thirty-two';
  const write33 = 'The first slot holds thirty-three';
  const filled = after(1, write32, { captionStart: write32 });
  const queued = reveal(k, 2, 'Wait', 0);
  const readDone = after(3, 'The last read finishes');
  const retired = after(3, 'A retires its table and returns three pages');
  const granted = after(3, 'grants page four to B and appends it to B’s table');
  const written = after(4, write33, { captionStart: write33 });
  const position = 33;
  const pending = reveal(k, 1, 'Put thirty-three', 0);
  const traced = reveal(k, 3, 'Follow the table to the new block', 1.4);
  const state = pageState(written ? position : filled ? 32 : 31, retired, granted);
  const at32 = locatePosition(state.tables.B, 32);
  const at33 = locatePosition(state.tables.B, position);
  const block = at33 ? state.tables.B.indexOf(at33.page) : state.tables.B.length;
  const oldPage = state.tables.A.at(-1);
  head(
    c,
    k,
    'Private KV pages',
    pending ? 'Where can B put position 33?' : 'Where does B store position 32?',
  );
  for (const [i, owner] of ['A', 'B'].entries()) {
    const y = 260 + 64 * i;
    const color = C[owner];
    const entries = state.tables[owner];
    mono(c, owner + ' table', 100, y + 36, 34, color);
    if (!entries.length) mono(c, 'retired', tableEntryX(0), y + 36, 31, C.muted, 'center');
    for (const [j, page] of entries.entries()) {
      const x = tableEntryX(j);
      const selected = owner === 'B' && j === block && traced >= 0.5;
      if (j > 0) mono(c, '→', x - 97, y + 36, 32, color, 'center');
      plate(c, x - 68, y, 136, 52, selected ? C.gold : i ? C.bLight : C.aLight, 3);
      mono(c, 'P' + page, x, y + 36, 34, C.deep, 'center');
    }
  }
  if (queued && !granted) {
    const x = tableEntryX(block);
    mono(c, '→', x - 97, 360, 32, C.muted, 'center');
    plate(c, x - 68, 324, 136, 52, '#d7deca', 3);
    label(c, 'No page', x, 360, 27, C.muted, { align: 'center' });
  }
  const reading = reveal(k, 2, 'device read still holds', 0) && !readDone;
  if (reading) {
    line(
      c,
      [[841, 286], [932, 286]],
      C.A,
      4,
    );
    dot(c, 885 + 30 * Math.sin(k.seconds * 2.8), 286, 8, C.A);
    label(c, 'A’s device read in flight', 954, 298, 32, C.A);
  }
  if (pending) {
    plate(c, writeBadgeX, 324, 316, 52, C.B, 4);
    const action = written ? 'wrote' : queued && !granted ? 'queued' : 'write';
    mono(c, 'B ' + action + '   ' + position, 1642, 361, 34, C.cream, 'center');
  }
  substrate(c, 85, 408, 1749, 389);
  if (at33 && traced > 0) physicalLookup(c, block, at33.page, traced);
  state.pages.forEach((p, i) => {
    const x = physicalPageX(i),
      y = 448,
      ink = p.owner === 'B' ? C.bLight : p.owner === 'A' ? C.aLight : C.steel;
    const isLookupPage = at33?.page === i && traced === 1;
    mono(c, 'P' + p.id, x, y + 38, 42, isLookupPage ? C.gold : C.cream);
    mono(c, p.owner || 'free', x + 256, y + 38, 37, ink, 'right');
    if (isLookupPage) {
      c.strokeStyle = C.gold;
      c.lineWidth = 4;
      c.strokeRect(x - 8, y + 58, 270, 211);
    }
    for (let j = 0; j < 16; j++) {
      const xx = x + (j % 4) * 65,
        yy = y + 66 + Math.floor(j / 4) * 50;
      socket(c, xx, yy, 59, 45, ink, j < p.used);
      const n =
        written && at33?.page === i && at33.slot === j
          ? position
          : filled && at32.page === i && at32.slot === j
            ? 32
            : 0;
      if (n) {
        rect(c, xx + 3, yy + 3, 53, 38, C.gold);
        mono(c, n, xx + 30, yy + 33, 30, C.deep, 'center');
      }
      if (pending && !queued && i === oldPage && j === p.used) {
        c.strokeStyle = C.gold;
        c.lineWidth = 4;
        c.strokeRect(xx - 2, yy - 2, 63, 49);
      }
    }
    mono(c, p.used + ' / 16', x + 125, y + 305, 29, ink, 'center');
  });
  const main = written
    ? `B block ${block + 1} points to P${at33.page}. Position ${position} goes in slot ${at33.slot + 1}.`
    : granted
      ? `B now maps block ${block + 1} to P${at33.page}. Which slot comes next?`
      : retired
        ? `A’s table is retired. ${state.freePages} whole pages are free.`
        : queued
          ? 'Queued for a whole page. A still owns the empty corner.'
          : pending
            ? 'One hole remains. Check who owns its page.'
            : filled
              ? 'Position 32 fills B’s second page.'
              : 'A has 47 positions. B has 31.';
  foot(
    c,
    main,
    'Free pages   ' +
      state.freePages +
      ' / 5     ·     A positions   ' +
      state.tokens.A +
      '     ·     B positions   ' +
      state.tokens.B,
  );
}
function shape(c, k) {
  const full = k.beat.beatIndex === 6;
  head(
    c,
    k,
    'Memory budget',
    full
      ? reveal(k, 6, 'Sixteen input')
        ? 'Does 17 fit in a sixteen-slot page?'
        : 'What must fit on each device?'
      : 'What does one cached token occupy?',
  );
  if (!full) {
    const factors = [
      ['2', 'K and V'],
      ['80', 'layers'],
      ['8', 'KV heads'],
      ['128', 'head width'],
      ['2', 'bytes'],
    ];
    factors.forEach(([n, t], i) => {
      const x = 112 + i * 354;
      substrate(c, x, 352, 266, 295);
      serif(c, n, x + 133, 499, 92, C.gold, 'center');
      label(c, t, x + 132, 574, 34, C.cream, { align: 'center' });
      if (i < 4) mono(c, '×', x + 307, 510, 49, C.muted, 'center');
    });
    const result = reveal(k, 5, 'That gives');
    foot(
      c,
      result
        ? bytes.toLocaleString('en-US') + ' bytes per token'
        : 'Multiply the stored dimensions of this full-attention cache.',
      result && reveal(k, 5, 'Sixteen positions')
        ? '16 positions × 327,680 bytes = ' +
            pageMiB +
            ' MiB per page. Aggregate before placement and metadata.'
        : 'The head count is the number of stored key-value heads.',
    );
  } else {
    const second = reveal(k, 6, 'Sixteen input');
    substrate(c, 100, 335, 1730, 377);
    mono(
      c,
      second ? '16 input + 1 output cap' : 'LOGICAL KV  /  4,000 POSITIONS',
      160,
      426,
      36,
      C.cream,
    );
    if (second) {
      for (let p = 0; p < 2; p++)
        for (let i = 0; i < 16; i++)
          socket(
            c,
            167 + p * 823 + (i % 8) * 89,
            478 + Math.floor(i / 8) * 77,
            74,
            64,
            p ? C.bLight : C.aLight,
            p === 0 || i === 0,
          );
    } else {
      serif(c, tokenGiB(4000).toFixed(4) + ' GiB', 161, 585, 95, C.gold);
      label(c, 'Check storage on each device.', 914, 572, 46, C.cream);
    }
    foot(
      c,
      second
        ? pagesFor(16, 1) + ' pages reserve 32 positions.'
        : 'Logical storage includes keys and values across all layers.',
      second
        ? 'Full-cap reservation rounds the entire sequence up to whole pages.'
        : 'Device placement, replication and other allocations determine fit.',
    );
  }
}
function shared(c, k) {
  const retA = Boolean(reveal(k, 7, 'A retires')),
    retB = Boolean(reveal(k, 8, 'Retire B’s last read'));
  const refs = prefixRefs(retA, retB);
  head(c, k, 'Shared read-only prefix', 'Which pages still have a reader?');
  const positions = [961, 437, 1487];
  for (let i = 0; i < 2; i++) {
    const x = i ? 1430 : 425,
      active = refs[i].length,
      color = i ? C.B : C.A;
    mono(c, (i ? 'B' : 'A') + (active ? '   /   live' : '   /   retired'), x, 341, 41, color, 'center');
    for (const page of refs[i]) wire(c, x, 368, positions[page], 535, color);
  }
  positions.forEach((x, page) => {
    const n = refs.filter((row) => row.includes(page)).length;
    substrate(c, x - 206, 528, 412, 228);
    mono(
      c,
      'P' + page + '   ' + (page === 0 ? 'Handbook' : page === 1 ? 'A suffix' : 'B suffix'),
      x,
      594,
      34,
      C.cream,
      'center',
    );
    for (let j = 0; j < 8; j++) socket(c, x - 168 + j * 42, 626, 36, 43, C.gold, !!n);
    mono(
      c,
      n + ' live ' + (n === 1 ? 'reader' : 'readers'),
      x,
      721,
      31,
      n ? C.gold : C.steel,
      'center',
    );
  });
  foot(
    c,
    retB
      ? 'All device readers have retired.'
      : k.beat.beatIndex === 8
        ? 'A’s suffix can return to the pool.'
        : 'Count table entries, then count distinct physical pages.',
    'Live table entries   ' +
      refs.flat().length +
      '     ·     Referenced physical pages   ' +
      new Set(refs.flat()).size,
  );
}
function transfer(c, k) {
  const total = remote.lookup + remote.transfer,
    answer = reveal(k, 10, 'Rebuild here');
  head(c, k, 'Remote KV', 'Fetch the prefix or rebuild it here?');
  const x = 474,
    w = 16.5;
  substrate(c, 88, 325, 1740, 434);
  mono(c, 'Fetch', 148, 472, 39, C.cream);
  mono(c, 'Rebuild', 148, 623, 39, C.cream);
  strip(
    c,
    x,
    402,
    total * w,
    76,
    [
      [remote.lookup, C.aLight],
      [remote.transfer, C.bLight],
    ],
    total,
  );
  mono(c, '18 lookup', x + 20, 450, 29, C.deep);
  mono(c, '42 transfer', x + remote.lookup * w + 25, 450, 29, C.deep);
  strip(c, x, 551, remote.rebuild * w, 76, [[remote.rebuild, C.gold]], remote.rebuild);
  mono(c, '45 ms recompute', x + 25, 604, 32, C.deep);
  line(
    c,
    [
      [x + 70 * w, 382],
      [x + 70 * w, 657],
    ],
    C.cream,
    4,
  );
  mono(c, '70 ms deadline', x + 70 * w, 706, 30, C.cream, 'center');
  foot(
    c,
    answer
      ? 'Rebuilding leaves 25 ms. Fetching leaves 10 ms.'
      : 'Both routes use the same compatible and authorized prefix.',
    'Time runs from left to right. Transfer begins after lookup completes.',
  );
}
export function memory(c, k) {
  const b = k.beat.beatIndex;
  if (b < 5) return physicalPages(c, k);
  if (b < 7) return shape(c, k);
  if (b < 9) return shared(c, k);
  transfer(c, k);
}
