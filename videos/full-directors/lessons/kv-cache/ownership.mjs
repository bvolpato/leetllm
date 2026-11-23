import {
  P,
  heading,
  box,
  line,
  txt,
  mono,
  cap,
  chip,
  slot,
  footer,
  metric,
  arrow,
  hatch,
  block,
  bno,
  clamp,
  cue,
  on,
} from './drawing.mjs';
import {
  fork,
  fullFork,
  occupancy,
  prefixLedger,
  fmt,
  recovery,
  retry,
  bill,
  GIB,
  MIB,
} from './mechanics.mjs';

export function occupancyRows(
  g,
  state,
  size,
  { results = true, totals = true, stableLanes = false, showTotal = true } = {},
) {
  state.rows.forEach(({ owner, tokens, blocks, empty }, i) => {
    const y = 385 + (stableLanes ? Number(owner === 'B') : i) * 163;
    txt(g, owner, 92, y + 27, 55, { f: 'Serif' });
    mono(g, tokens + ' tokens', 180, y + 28, 37);
    for (let j = 0; j < blocks; j++) {
      const xx = 530 + j * 239,
        w = 212;
      const slots = Math.min(size, tokens - j * size);
      box(g, xx, y, w, 69, P.surface, P.rail, 2);
      box(
        g,
        xx + 2,
        y + 2,
        ((w - 4) * slots) / size,
        65,
        owner === 'A' ? P.k : owner === 'B' ? P.v : P.gold,
      );
      for (let k = 1; k < size; k++)
        line(g, xx + (k * w) / size, y + 4, xx + (k * w) / size, y + 66, '#9bac9f', 1);
    }
    if (results)
      mono(
        g,
        blocks + ' ' + (blocks === 1 ? 'block' : 'blocks') + '   ·   ' + empty + ' empty',
        530,
        y + 102,
        28,
      );
  });
  if (!showTotal) return;
  if (totals)
    metric(g, 'IN USE', state.total + (state.total === 1 ? ' block' : ' blocks'), 1487, 396, 330);
  else metric(g, 'IN USE', '?', 1511, 396, 270);
}
export function batching(g, c) {
  const n = bno(c);
  if (n <= 2) {
    const cont = n === 2,
      admit = on(c, 2, 'waiting request can join');
    heading(
      g,
      cont ? 'Continuous batching' : 'Static batching',
      'Who gets the short request’s place?',
    );
    const x = 293,
      w = 1470,
      at = x + w * 0.1;
    ['A', 'B'].forEach((v, i) => {
      const y = 431 + i * 164;
      txt(g, v, 100, y + 39, 61, { f: 'Serif' });
      box(g, x, y, w, 81, P.empty, P.line);
      box(g, x, y, w * (i ? 1 : 0.1), 81, i ? P.v : P.k);
      if (i === 0) {
        hatch(g, at, y, w * 0.9, 81);
        if (admit) {
          box(g, at + 18, y, w * 0.64, 81, P.goldPale, P.rail);
          txt(g, 'C joins on a later iteration', at + 54, y + 40, 36);
        }
      }
    });
    [0, 20, 200].forEach((k) => mono(g, k, x + (k / 200) * w, 733, 30, { align: 'center' }));
    cap(g, 'Decode iterations', 1240, 757);
    footer(
      g,
      cont
        ? 'The scheduler revisits membership at iteration boundaries.'
        : 'A finishes on step 20. B runs through step 200.',
      cont
        ? 'The diagram illustrates one possible admission.'
        : 'A’s place sits idle for 180 iterations.',
    );
  } else if (n <= 5) {
    const left = on(c, 4, 'its four come back'),
      joined = on(c, 4, 'Admit C');
    const list = joined
      ? [
          ['B', 10],
          ['C', 20],
        ]
      : left
        ? [['B', 10]]
        : [
            ['A', 64],
            ['B', 10],
          ];
    const state = occupancy(list, 16);
    heading(g, 'Iteration boundary  /  16-slot blocks', 'How many blocks are still in use?');
    occupancyRows(g, state, 16, { totals: on(c, 4, 'Five blocks'), stableLanes: true });
    footer(
      g,
      joined
        ? 'C takes two blocks while B keeps one.'
        : left
          ? 'A released four blocks. B continues in place.'
          : 'Count the blocks for each request, then add them.',
      'Simple on-demand allocation with private blocks and completed GPU reads.',
    );
  } else {
    const chunks = on(c, 7, 'chunked prefill');
    heading(g, 'Time to first token', 'Why did a long prompt delay the first token?');
    const x = 99,
      y = 416,
      w = 1690;
    cap(g, 'Illustrative service trace   ·   compare the same incoming traffic', 91, 322);
    if (!chunks) {
      [
        [0, 0.24, 'Queue', P.empty],
        [0.24, 0.63, 'Large prompt prefill', P.kPale],
        [0.87, 0.13, 'Delivery', P.vPale],
      ].forEach(([left, f, label, col]) => {
        chip(g, x + w * left, y, w * f - 5, 108, label, col);
      });
      cap(g, 'Request received', x, y + 183);
      cap(g, 'First token arrives', x + w, y + 183, { align: 'right' });
      line(g, x, y + 145, x + w, y + 145, P.ink);
      arrow(g, x + 20, y + 145, x + w, y + 145, P.ink, 3);
    } else {
      for (let i = 0; i < 4; i++) {
        const xx = x + i * 427;
        cap(g, 'Iteration ' + (i + 1), xx, y - 41);
        chip(g, xx, y, 238, 105, 'Prompt chunk', P.kPale, { size: 29 });
        chip(g, xx + 244, y, 153, 105, 'Decode', P.vPale, { size: 29 });
      }
      cap(g, 'A per-iteration token budget limits prompt work.', x, y + 200);
    }
    footer(
      g,
      chunks
        ? 'Compare time to first token and inter-token gaps.'
        : 'Measure queue wait and prefill time separately.',
      'Chunking can still delay decodes. Separate prefill workers add KV transfer costs.',
    );
  }
}
function fullTail(g, c) {
  const done = on(c, 6, 'allocate a fresh block'),
    f = fullFork(done);
  heading(g, 'Alternative starting state  /  full tail', 'Where do the next two writes go?');
  for (const [name, table] of Object.entries(f.tables)) {
    const x = name === 'A' ? 94 : 1084;
    cap(g, 'Request ' + name, x, 297);
    mono(g, '[' + table.join(', ') + ']', x + 188, 297, 38, { col: name === 'A' ? P.k : P.v });
  }
  block(g, 94, 484, 662, 7, f.blocks[7], 'A + B');
  if (done) {
    arrow(g, 788, 526, 1030, 412);
    arrow(g, 788, 526, 1030, 689);
    block(g, 1084, 382, 698, 5, f.blocks[5], 'A', 0);
    block(g, 1084, 649, 698, 9, f.blocks[9], 'B', 0);
  }
  footer(
    g,
    done
      ? '1 shared full block + 2 new tails = 3 blocks'
      : 'A has sampled March. B has sampled June.',
    done ? 'Count this full block and its two successors. Any earlier shared prefix stays in place.' : '',
  );
}
export function branches(g, c, closing = false) {
  const n = bno(c);
  if (!closing && on(c, 5, 'What if the shared tail')) {
    fullTail(g, c);
    return;
  }
  if (!closing && n === 2) {
    heading(
      g,
      'Beam search  /  four candidate answers',
      'How much prompt state can four branches share?',
    );
    const one = bill(32) * 4096,
      shared = on(c, 2, 'Shared');
    for (let i = 0; i < 4; i++) {
      cap(g, 'Branch ' + String.fromCharCode(65 + i), 91, 367 + i * 99);
      if (!shared || i === 0)
        chip(g, 391, 329 + i * 99, 825, 65, '4,096-position prompt', P.kPale, { size: 31 });
      else arrow(g, 390, 364 + i * 99, 658, 403, P.muted, 3);
    }
    metric(
      g,
      'OCCUPIED PROMPT PAYLOAD',
      shared ? fmt(one / MIB) + ' MiB' : fmt((4 * one) / GIB) + ' GiB',
      1315,
      438,
      515,
    );
    footer(
      g,
      shared
        ? 'Four tables reference one prompt.'
        : 'Private copies repeat all the prompt K/V tensors.',
      '32 layers, 8 KV heads, FP16. Branch continuations add their own state.',
    );
    return;
  }
  const rewound = on(c, 4, 'Before A writes');
  const sharedWrite = !closing && on(c, 3, 'after March') && !rewound;
  const firstWrite = sharedWrite ? cue(c, 3, 'after March', 0.65) : 0;
  let secondWrite = 0;
  if (sharedWrite && n === 4) {
    const answer = "It would read June's value";
    c.reveal(answer, 0, { captionStart: answer });
    secondWrite = clamp((c.elapsed - c.wordCue(answer).end) / 0.65);
  }
  let readDone = false;
  let stage;
  if (closing) {
    const phrase = n === 1 ? 'its last GPU read completes' : 'C writes its first pair in five';
    if (n === 2) c.reveal(phrase, 0, { captionStart: phrase });
    const clauseEnded = c.elapsed >= c.wordCue(phrase).end - 1e-9;
    const released = n === 2 || c.elapsed >= c.wordCue('March finishes').end - 1e-9;
    readDone = n > 1 || clauseEnded;
    stage = n === 2 && clauseEnded ? 5 : released ? 4 : 3;
  } else
    stage = on(c, 5, 'Write June')
      ? 3
      : on(c, 4, 'Now write March')
        ? 2
        : on(c, 4, 'Redirect A')
          ? 1
          : 0;
  const f = fork(stage);
  heading(
    g,
    closing
      ? 'Final release  /  same two branches'
      : sharedWrite
        ? 'If both branches write to block 2'
        : 'Copy-on-write  /  4-slot blocks',
    closing ? 'Which block can the waiting request take?' : 'Where will March and June write?',
  );
  const pending = !closing && on(c, 3, 'the other June');
  const copy = rewound && stage === 0 ? cue(c, 4, 'copy its two valid pairs', 1.6) : 0;
  for (const [name, table] of Object.entries(f.tables)) {
    const y = name === 'B' ? 436 : 353;
    txt(g, 'Request ' + name, 91, y, 38, { f: 'Serif' });
    mono(g, '[' + table.join(', ') + ']', 331, y, 41, { col: name === 'B' ? P.v : P.k });
  }
  block(
    g,
    1018,
    371,
    780,
    7,
    f.blocks[7],
    (f.owners(7).length === 1 ? 'Owner ' : 'Owners ') + f.owners(7).join(' + '),
  );
  const sourceX = 120,
    sourceWidth = 755,
    copyX = 1018,
    copyWidth = 780,
    tailY = 665;
  const dest = sourceX + sourceWidth * 0.625 - 2.5;
  const tileWidth = sourceWidth / 4 - 5;
  const resident = secondWrite === 1 ? 'June' : firstWrite === 1 ? 'March' : null;
  const sourcePairs = f.blocks[2];
  const displayedPairs = resident ? [...sourcePairs, resident] : sourcePairs;
  block(
    g,
    sourceX,
    tailY,
    sourceWidth,
    2,
    displayedPairs,
    f.owners(2).length + ' ' + (f.owners(2).length === 1 ? 'owner' : 'owners'),
    pending && stage <= 3 ? 2 : -1,
  );
  if (f.blocks[5] || copy > 0) {
    const owners = f.owners(5),
      owner = owners.length
        ? 'Owner ' + owners[0]
        : !closing
          ? 'Private copy'
          : readDone
            ? '0 owners'
            : '0 owners · GPU read pending';
    const copied = Math.floor(copy * sourcePairs.length);
    block(
      g,
      copyX,
      tailY,
      copyWidth,
      5,
      f.blocks[5] || sourcePairs.slice(0, copied),
      owner,
      stage === 2 || stage === 3 ? 2 : stage === 5 ? 0 : -1,
    );
    if (copy > 0 && copied < sourcePairs.length) {
      const t = copy * sourcePairs.length - copied;
      const from = sourceX + ((copied + 0.5) * sourceWidth) / 4 - 2.5;
      const to = copyX + ((copied + 0.5) * copyWidth) / 4 - 2.5;
      const x = from + (to - from) * t;
      const y = 560 - 23 * Math.sin(Math.PI * t);
      slot(g, x - 83, y, 166, 56, sourcePairs[copied], true, true);
    }
  }
  if (pending && !rewound) {
    const moving = (firstWrite > 0 && firstWrite < 1) || (secondWrite > 0 && secondWrite < 1);
    for (const [name, token, start, progress, fill, color] of [
      ['A', 'March', dest - 154, firstWrite, P.goldPale, P.gold],
      ['B', 'June', dest + 143, secondWrite, P.vPale, P.v],
    ]) {
      if (progress === 1) continue;
      if (progress === 0) {
        if (!moving) arrow(g, start, 553, dest, tailY - 13, color);
        chip(g, start - 82, 488, 164, 56, name + ' · ' + token, fill, {
          size: 29,
        });
      } else {
        const across = clamp(2 * progress);
        const down = clamp(2 * progress - 1);
        const x = start + (dest - start) * across;
        const y = 488 + 107 * down;
        slot(g, x - tileWidth / 2, y, tileWidth, 56, token, true, true);
      }
    }
    if (secondWrite === 1) {
      line(g, 491, 353, 710, 353, P.k, 4);
      arrow(g, 710, 353, dest, tailY - 13, P.k, 4);
    }
  } else if (pending && stage > 0 && stage < 3) {
    chip(g, dest + 64, 488, 159, 57, 'June', P.vPale, { size: 29 });
    arrow(g, dest + 137, 553, dest + 12, 653, P.v);
    if (stage === 1) {
      chip(g, 1430, 540, 164, 53, 'March', P.goldPale, { size: 28 });
      arrow(g, 1512, 601, 1508, 653);
    }
  }
  let line1 = closing
    ? stage === 5
      ? 'C takes block 5. June keeps [7, 2].'
      : stage === 4
        ? readDone
          ? 'A has left. Its final read has completed.'
          : 'A has left. Its final GPU read is still in flight.'
        : 'Three physical blocks carry the two branches.'
    : stage === 3
      ? 'A reads March from 5:2. B reads June from 2:2.'
      : stage === 2
        ? 'March occupies block 5, slot 2. Block 2 still has an empty slot.'
        : stage === 1
          ? 'Only A’s tail entry changed. Each tail now has one owner.'
          : copy > 0
            ? 'Copy the two valid pairs. Keep their source intact.'
            : rewound
              ? 'Rewind to the original shared tail.'
              : secondWrite === 1
                ? 'A follows [' + f.tables.A.join(', ') + '] and reads ' + resident + ' from slot 2.'
                : sharedWrite
                  ? 'What will A read after B writes? Both tables still point to block 2.'
                  : pending
                    ? 'Both pending words target the same slot in block 2.'
                    : 'Both tables point at the same physical history.';
  footer(
    g,
    line1,
    closing
      ? stage === 5
        ? 'Block 7 still holds the common prefix. Block 2 still holds June.'
        : 'No prefix retention in this exercise. Check every table and outstanding read.'
      : 'The slot labels name the tokens whose K/V pairs are stored here.',
  );
}

export function prefixes(g, c) {
  const n = bno(c);
  if (n < 4) {
    const different = n >= 2,
      isolated = n === 3;
    heading(
      g,
      'Prefix caching  /  independent requests',
      'May these requests share the last block?',
    );
    cap(g, 'Illustrative prefix divided into blocks', 90, 333);
    ['A', 'B'].forEach((v, i) => {
      const y = 423 + i * 173;
      txt(g, 'Prompt ' + v, 90, y + 43, 50, { f: 'Serif' });
      chip(
        g,
        386,
        y,
        533,
        88,
        i && different ? 'The policies' : 'The contracts',
        i && different ? P.goldPale : P.kPale,
      );
      arrow(g, 941, y + 44, 1056, y + 44, P.muted);
      chip(g, 1081, y, 504, 88, 'renew in', P.kPale);
    });
    footer(
      g,
      isolated
        ? 'Include a trust-group key as well as model and adapter identity.'
        : different
          ? 'The earlier token changes the context of the matching words.'
          : 'A compatible warm prefix can supply previously computed K/V.',
      different
        ? 'A match must cover the entire preceding token sequence.'
        : 'Replay the same tokens with the same model, adapter and trust group.',
    );
  } else {
    const p = prefixLedger(500, 16, 200);
    heading(g, 'Full-block reuse  /  200 requests', 'Which part of a 500-token prompt is private?');
    cap(g, 'Each block holds 16 positions', 89, 319);
    const xx = 90,
      w = 39,
      dx = 44,
      y = 409;
    for (let j = 0; j < p.shared; j++) {
      box(g, xx + j * dx, y, w, 95, P.kPale, P.k);
      for (let k = 1; k < 4; k++)
        line(g, xx + j * dx + 4, y + k * 22, xx + j * dx + w - 4, y + k * 22, P.k, 2);
    }
    for (let i = 0; i < 16; i++) {
      const tx = 1501 + (i % 8) * 34,
        ty = y + Math.floor(i / 8) * 48;
      box(g, tx, ty, 30, 42, i < p.tail ? P.v : P.empty, P.rail, 1);
      if (i >= p.tail) hatch(g, tx, ty, 30, 42);
    }
    mono(g, '31 full blocks  ×  16  =  ' + p.used + ' positions', 90, 584, 41);
    mono(g, p.tail + ' in private tail', 1494, 584, 28);
    if (n >= 5) {
      if (on(c, 5, 'six thousand four hundred'))
        metric(g, 'OCCUPIED WITHOUT SHARING', fmt(p.cold), 90, 666, 550);
      if (on(c, 5, "That's two hundred thirty one"))
        metric(g, 'WARM  /  31 SHARED + 200 PRIVATE', fmt(p.warm), 921, 666, 750, P.k);
    }
    footer(
      g,
      n === 6
        ? 'Prefill still processes the private suffix to produce next-token scores.'
        : on(c, 5, 'ninety six percent')
          ? 'About 96% fewer occupied blocks in this warm snapshot.'
          : 'Each request needs its own last block for the four remaining tokens.',
      'Sharing assumes compatible, resident blocks. A cold cache or eviction changes the result.',
    );
  }
}

export function exhaustion(g, c) {
  const n = bno(c);
  if (n <= 2) {
    const stage = on(c, 2, 'Retry A')
        ? 3
        : on(c, 2, 'return block zero')
          ? 2
          : on(c, 1, 'free list is empty')
            ? 1
            : 0,
      r = retry(stage);
    heading(g, 'Allocation  /  two-block exercise', 'What should a failed fifth append change?');
    block(g, 96, 439, 790, 1, ['0', '1', '2', '3'], 'Owner A');
    block(
      g,
      1006,
      439,
      790,
      0,
      stage === 3 ? ['4'] : [],
      stage === 3 ? 'Owner A' : stage === 2 ? 'Free' : 'Owner B',
      stage === 3 ? 0 : -1,
    );
    mono(g, 'A  [' + r.tables.A.join(', ') + ']   length ' + r.lens.A, 96, 682, 38);
    mono(
      g,
      r.tables.B ? 'B  [0]   length 0' : 'Free list  [' + r.free.join(', ') + ']',
      1006,
      682,
      38,
    );
    footer(
      g,
      stage === 3
        ? 'Retry succeeds at physical block 0, slot 0.'
        : stage === 2
          ? 'B released its block once. A still has four positions.'
          : stage === 1
            ? n === 1
              ? 'A needs a fifth slot. The free list is empty.'
              : 'Append blocked. Both tables and lengths are intact.'
            : 'The next append crosses a block boundary.',
      'Block size 4. Release waits for the final GPU access.',
    );
    return;
  }
  const r = recovery(),
    answered = on(c, 6, 'Four tenths total'),
    rebuilt = on(c, 6, 'Replay spends');
  heading(
    g,
    'Preemption  /  recovery work alone',
    n < 5 ? 'How will the request recover its state?' : 'Which recovery costs less at these rates?',
  );
  if (n < 5) {
    chip(g, 120, 426, 430, 112, 'GPU KV', P.kPale);
    chip(g, 1364, 426, 430, 112, n === 3 ? 'Token IDs' : 'CPU RAM', P.vPale);
    if (n === 3) {
      arrow(g, 1325, 480, 588, 480, P.gold);
      cap(g, 'Rebuild missing positions', 955, 436, { align: 'center' });
    } else {
      arrow(g, 588, 437, 1324, 437);
      arrow(g, 1324, 536, 588, 536, P.v);
      cap(g, 'Swap out', 945, 379, { align: 'center' });
      cap(g, 'Restore', 945, 610, { align: 'center' });
    }
    footer(
      g,
      n === 3
        ? 'Recompute from accepted tokens when the request resumes.'
        : 'Moving KV state to CPU memory requires a return trip.',
      'Compatible shared or retained prefix blocks may survive preemption.',
    );
  } else {
    cap(g, '3,200 processed positions   ×   320 KiB   =   1,000 MiB of KV', 91, 321);
    const leg = on(c, 6, 'a fifth of a second'),
      back = on(c, 6, 'another fifth');
    txt(g, 'Swap', 90, 429, 50, { f: 'Serif' });
    chip(g, 360, 380, 476, 90, leg ? 'Out    ' + r.leg + ' s' : 'Out    ?', P.kPale, { size: 37 });
    chip(g, 868, 380, 475, 90, back ? 'Back    ' + r.leg + ' s' : 'Back    ?', P.vPale, {
      size: 37,
    });
    mono(g, answered ? '= ' + r.both + ' s' : '= ?', 1413, 426, 55);
    cap(g, '1,000 MiB per leg  /  5,000 MiB per second', 359, 520);
    txt(g, 'Replay', 90, 657, 50, { f: 'Serif' });
    chip(g, 360, 610, 983, 90, 'Rebuild   ' + fmt(r.positions) + ' positions', P.goldPale);
    mono(g, rebuilt ? '= ' + r.replay + ' s' : '= ?', 1413, 657, 55);
    cap(g, '4,000 positions per second', 360, 749);
    if (answered) box(g, 1416, 487, (330 * r.both) / r.replay, 16, P.k);
    if (rebuilt) box(g, 1416, 719, 330, 16, P.gold);
    footer(
      g,
      rebuilt
        ? 'Swap costs 0.4 s here. Rebuilding costs 0.8 s.'
        : 'Compare two link transfers with one replay of the missing prefix.',
      'Assume constant effective rates. Queuing and other serving work add latency.',
    );
  }
}
