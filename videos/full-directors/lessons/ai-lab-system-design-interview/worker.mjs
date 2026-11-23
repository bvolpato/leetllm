import {
  C,
  fmt,
  box,
  line,
  dot,
  tx,
  label,
  opacity,
  frame,
  foot,
  chip,
  cue,
  scope,
  arrow,
  mark,
} from './instrument.mjs';
import {
  service, arrival, claim, latency, arrivals, nextSequence, nextIteration,
  draftTokens, targetTokens, acceptedPrefixLength,
} from './examples.mjs';

const jobColors = { A: C.gold, B: C.mint, 'R-104': '#b9b6ff' };
export function queueState(k) {
  const joined = cue(k, 1, 'Admit R one oh four') > 0;
  const ms =
    80 * cue(k, 2, 'Run the first unit', 1.2) +
    80 * cue(k, 3, 'Run the second unit', 1.2) +
    40 * cue(k, 4, 'Run the last forty milliseconds', 1.05);
  return service(ms, joined);
}
export function worker(g, k) {
  const b = k.beat.beatIndex,
    s = queueState(k);
  frame(
    g,
    k,
    'Worker · R-104',
    b === 5 ? 'Why did each request get this response?' : 'When does the queue clock stop?',
    true,
  );
  if (b === 5) {
    const backlog = cue(k, 5, 'Five units ahead') > 0,
      caller = cue(k, 5, 'Give another team') > 0,
      status = cue(k, 5, 'That team gets') > 0;
    const rows = [
      [
        'R-104',
        'Quota available',
        '2 units ahead',
        arrival(2).wait + ' ms',
        '200 · complete',
        C.mint,
      ],
      ...(backlog
        ? [
            [
              'R-105',
              'Quota available',
              '5 units ahead',
              arrival(5).wait + ' ms',
              arrival(5).status + ' · overload',
              C.peach,
            ],
          ]
        : []),
      ...(caller
        ? [
            [
              'R-106',
              'Quota exhausted',
              'Idle worker',
              'No wait',
              status ? arrival(0, false).status + ' · quota' : 'Decide…',
              C.gold,
            ],
          ]
        : []),
    ];
    label(g, 'REQUEST', 47, 159, C.mint);
    label(g, 'CALLER', 186, 159, C.mint);
    label(g, 'WORKER', 420, 159, C.mint);
    label(g, 'RESULT', 716, 159, C.mint);
    rows.forEach(([id, q, w, t, r, c], i) => {
      const y = 209 + i * 77;
      line(g, 45, y + 26, 915, y + 26, '#4a6465');
      tx(g, id, 47, y, 20, C.white, 'Mono', 600);
      tx(g, q, 186, y, 18, C.white);
      tx(g, w, 420, y, 18, C.white);
      tx(g, t, 590, y, 16, '#b0c6bd');
      tx(g, r, 716, y, 18, c, 'Sans', 600);
    });
    foot(
      g,
      'GATEWAY POLICY   /   QUEUE LIMIT 250 ms',
      'The receipt names the boundary that made the decision.',
      C.teal,
      true,
    );
    return;
  }
  scope(g, 40, 130, 880, 193);
  label(g, 'SERIAL SERVICE   /   125,000 TOKENS PER SECOND', 59, 157, '#b5d0cd');
  const x = (t) => 73 + t * 3.05,
    y = 208;
  const admissions = [
    ['A', 0, 80],
    ['B', 80, 160],
    ...(s.wait !== null ? [['R-104', 160, 200]] : []),
  ];
  for (const [id, lo, hi] of admissions) {
    const w = x(hi) - x(lo),
      color = jobColors[id];
    box(g, x(lo), y, w - 3, 48, '#29494d', color, 3);
    const elapsed = Math.min(hi - lo, Math.max(0, s.ms - lo));
    if (elapsed > 0)
      box(g, x(lo) + 1, y + 1, Math.max(0.2, (w * elapsed) / (hi - lo) - 3), 46, color, null, 2);
    const center = x((lo + hi) / 2);
    const badgeWidth = id === 'R-104' ? 73 : 29;
    box(g, center - badgeWidth / 2, y + 8, badgeWidth, 31, C.screen, null, 3);
    tx(g, id, center, y + 31, 19, C.white, 'Mono', 600, 'center');
  }
  line(g, x(250), 180, x(250), 280, C.peach, 2, true);
  tx(g, '250 ms limit', x(250), 176, 16, C.peach, 'Sans', 600, 'center');
  line(g, x(0), 265, x(267), 265, '#75948f');
  for (const t of [0, 80, 160, 200, 250]) {
    line(g, x(t), 265, x(t), 272, C.white);
    tx(g, t + '', x(t), 293, 14, C.white, 'Mono', 400, 'center');
  }
  line(g, x(s.ms), 190, x(s.ms), y, C.white, 2);
  line(g, x(s.ms), y + 48, x(s.ms), 266, C.white, 2);
  dot(g, x(s.ms), 188, 4, C.white);
  label(g, 'WORKER', 46, 351, C.mint);
  label(g, 'WAITING IN ORDER', 305, 351, C.mint);
  label(g, 'KV OWNER · 2 BLOCKS PER JOB', 592, 351, C.mint);
  tx(g, s.active ?? 'Idle', 46, 390, 27, s.active ? jobColors[s.active] : C.white, 'Mono', 600);
  tx(g, s.waiting.join('   ›   ') || 'Empty', 305, 390, 23, C.white, 'Mono');
  for (let i = 0; i < s.kvCapacity; i++)
    box(g, 592 + i * 26, 367, 21, 20, i < s.usedKv ? jobColors[s.active] : null, '#88a29b', 2);
  tx(g, s.active ?? 'Free', 819, 386, 16, s.active ? jobColors[s.active] : C.white, 'Mono');
  const prediction = cue(k, 1, 'At a hundred sixty') > 0;
  const state = s.requestComplete
    ? '200 · complete'
    : s.requestStarted
      ? 'Serving'
      : s.wait !== null
        ? 'Queued'
        : 'Before enqueue';
  foot(
    g,
    'R-104   /   ' + state.toUpperCase(),
    s.wait === null
      ? prediction
        ? 'Predicted start   160 ms   ·   wait allowance   250 ms'
        : 'A and B each have 10,000 prompt tokens left.'
      : 'Wait   ' +
          s.wait +
          ' ms      Service   ' +
          s.service +
          ' ms      KV blocks owned   ' +
          s.blocks,
    C.teal,
    true,
  );
}

export function capacity(g, k) {
  const first = cue(k, 1, 'Claim the slot') > 0,
    released = cue(k, 2, 'Release the first claim') > 0,
    replay = cue(k, 1, 'Replay that second decision') > 0 &&
      !cue(k, 2, 'Now return to the original pair'),
    replayDecision = cue(k, 2, 'five oh three') > 0;
  const waiting = cue(k, 2, 'A new request', 0) > 0,
    joined = cue(k, 2, 'On the next iteration', 0) > 0,
    taken = first && !released,
    v = waiting ? nextIteration(joined) : replay ? claim(true, 16) : claim(taken),
    rejected = cue(k, 1, 'It gets five oh three') > 0;
  const pages = cue(k, 2, 'Open its page table', 0);
  if (pages) {
    frame(g, k, 'Allocation · ' + v.owner, 'Where does R-203 store its token history?');
    label(g, v.owner + '   /   LOGICAL HISTORY IN TOKEN ORDER', 66, 158);
    const physical = v.pages,
      x = (i) => 67 + i * 103;
    for (let i = 0; i < physical.length; i++) {
      const left = 148 + i * 370,
        to = x(physical[i]) + 37,
        col = i ? C.teal : C.blue;
      box(g, left, 182, 204, 51, col, null, 4);
      tx(g, 'Logical block ' + i, left + 102, 215, 19, C.white, 'Sans', 600, 'center');
      line(g, left + 102, 233, to, 314, col, 2);
    }
    label(g, 'PAGES 0–7', 65, 303);
    for (let i = 0; i < 8; i++) {
      const idx = physical.indexOf(i);
      box(g, x(i), 318, 74, 44, idx < 0 ? C.white : idx ? C.teal : C.blue, C.rule, 4);
      tx(g, i, x(i) + 37, 346, 20, idx < 0 ? C.muted : C.white, 'Mono', 600, 'center');
    }
    mark(g, 67, 392, v.owner + ' owns pages ' + physical.join(' and '), C.teal);
    mark(g, 537, 392, 'R-202 receipt · 503', C.rust);
    foot(
      g,
      'PAGE TABLE   /   ' + physical.map((p, i) => 'LOGICAL ' + i + ' → PHYSICAL ' + p).join('   ·   '),
      'Physical pages can be apart while the sequence stays in order.',
    );
    return;
  }
  frame(
    g,
    k,
    released ? 'Scheduler · continuous batching' : replay ? 'Scheduler · R-202 replay' : 'Scheduler · compare and claim',
    released ? 'Who can use the slot R-201 released?' : replay ? 'Can R-202 start with enough cache?' : 'Can two arrivals use the last slot?',
  );
  label(g, 'DECODE SLOTS   /   64 TOTAL', 58, 158);
  for (let i = 0; i < v.maxDecode; i++) {
    const color = i >= v.activeDecode ? C.white : i < v.maxDecode - 1 ? '#869697' : joined ? C.teal : C.blue;
    box(g, 59 + (i % 16) * 23, 181 + Math.floor(i / 16) * 25, 17, 19, color, C.muted, 3);
  }
  tx(
    g,
    v.maxDecode -
      v.activeDecode +
      (v.maxDecode - v.activeDecode === 1 ? ' free slot' : ' free slots'),
    58,
    315,
    24,
    C.ink,
    'Sans',
    600,
  );
  label(g, 'KV POOL   /   LAST 16 BLOCKS', 535, 158);
  for (let i = 0; i < 16; i++)
    box(
      g,
      537 + (i % 8) * 39,
      184 + Math.floor(i / 8) * 48,
      32,
      35,
      waiting ? (v.pages.includes(i) ? C.teal : C.white) : i < v.freeKvBlocks ? C.white : C.blue,
      C.muted,
      4,
    );
  tx(g, v.freeKvBlocks + ' free blocks', 535, 315, 24, C.ink, 'Sans', 600);
  const limits = released
    ? 'CONTINUOUS BATCHING   /   63 OTHER SEQUENCES KEEP THEIR SLOTS'
    : `NEEDS 1 SLOT + ${v.neededKvBlocks} BLOCKS   /   ${1000 * v.prefill.estimatedWait} ms WAIT   /   ${1000 * v.prefill.waitBudgetSeconds} ms LIMIT`;
  if (replay) {
    mark(g, 62, 379, 'Original R-202 receipt · 503', C.rust);
    const verdict = v.admitted ? 'Replay · admit' : 'Replay · 503';
    mark(
      g, 539, 379, replayDecision ? verdict : 'Replay · awaiting decision',
      replayDecision && !v.admitted ? C.rust : C.blue,
    );
    foot(
      g, limits,
      replayDecision
        ? 'The wait and cache fit. R-202 still needs a free decode slot.'
        : 'Only the free block count changed. Can R-202 start?',
    );
    return;
  }
  mark(
    g,
    62,
    379,
    joined ? v.owner + ' owns the slot and two blocks' : first
      ? released
        ? 'R-201 finished · resources released'
        : 'R-201 owns the claim'
      : 'R-201 reads the pool',
    joined ? C.teal : C.blue,
  );
  mark(
    g,
    539,
    379,
    rejected ? 'R-202 receipt · 503' : 'R-202 reads the pool',
    rejected ? C.rust : C.blue,
  );
  foot(
    g,
    limits,
    joined ? v.owner + ' joins the next iteration with the other 63 sequences.'
      : waiting ? nextSequence.id + ' needs two blocks to decode. When can it join?'
      : released
      ? 'Completion returns both resources to the scheduler.'
      : taken
        ? 'One atomic claim consumes the whole remainder.'
        : 'Both initial readings fit the 250 ms wait budget.',
  );
}

export function stream(g, k) {
  const b = k.beat.beatIndex,
    m = latency(arrivals);
  if (b === 2 && cue(k, 2, 'With speculative decoding', 0)) {
    const proposed = cue(k, 2, 'Read its proposal', 0);
    const checked = cue(k, 2, 'the target checks', 0);
    const keep = cue(k, 2, 'Keep Meet and at', 0);
    const replace = cue(k, 2, 'Replace noon with two', 0);
    const prefix = acceptedPrefixLength(draftTokens, targetTokens);
    frame(g, k, 'Speculative decoding · greedy target', 'How much of the draft survives?');
    const x = i => 277 + 201 * i;
    function tokenRow(y, title, tokens, fill, edge) {
      tx(g, title, 55, y + 32, 21, C.ink, 'Sans', 600);
      for (let i = 0; i < draftTokens.length; i++) {
        const visible = i < tokens.length;
        box(g, x(i), y, 178, 49, visible ? fill(i) : C.paper, visible ? edge : C.rule, 4);
        if (visible) tx(g, tokens[i], x(i) + 89, y + 33, 24, C.ink, 'Serif', 600, 'center');
      }
    }
    tokenRow(155, 'Draft model', proposed ? draftTokens : [], () => C.pale, C.blue);
    tokenRow(237, 'Target check', checked ? targetTokens : [], () => C.white, C.muted);
    const output = replace ? [...draftTokens.slice(0, prefix), targetTokens[prefix]] : keep ? draftTokens.slice(0, prefix) : [];
    tokenRow(332, 'Output', output, i => i < prefix ? '#cae4d1' : C.peach, C.muted);
    if (keep) {
      line(g, x(0), 389, x(prefix - 1) + 178, 389, C.teal, 2);
      tx(g, 'Accepted prefix', (x(0) + x(prefix - 1) + 178) / 2, 406, 15, C.teal, 'Sans', 600, 'center');
    }
    if (replace) tx(g, 'Target correction', x(prefix) + 89, 406, 15, C.rust, 'Sans', 600, 'center');
    foot(g, checked ? 'ONE TARGET PASS   /   THREE DRAFT POSITIONS' : 'SMALL DRAFT MODEL   /   THREE PROPOSED TOKENS',
      replace ? 'Do saved target steps cover the draft and verification time?'
        : keep ? 'The first two positions agree. What goes in the third?'
        : checked ? 'Compare from the left. Where is the first difference?'
        : 'Which words will the target accept?');
    return;
  }
  if (b === 2 && cue(k, 2, 'Separate prefill and decode pools', 0)) {
    const transfer = cue(k, 2, "Send the prompt's keys and values", 2.0);
    frame(g, k, 'Phase placement · one request', 'What does the decode worker need?');
    const from = 236, to = 676, y = 271, x = from + (to - from) * transfer;
    for (const [i, left] of [56, 626].entries()) {
      const tone = i ? C.teal : C.blue;
      box(g, left, 173, 277, 178, C.white, tone, 7);
      label(g, i ? 'DECODE POOL   /   WORKER B' : 'PREFILL POOL   /   WORKER A', left + 17, 204, tone);
      tx(g, i ? 'Extend the answer' : 'Read the prompt', left + 17, 242, 23, C.ink, 'Serif', 600);
      tx(g, i ? (transfer === 1 ? 'Decoding' : 'Waiting for prompt KV')
        : (transfer === 1 ? 'Handoff complete' : transfer ? 'Sending cache' : 'Prompt KV ready'),
        left + 17, 326, 17, tone, 'Sans', 600);
    }
    arrow(g, 334, y, 624, C.muted);
    tx(g, 'Worker link', 480, y - 21, 17, C.muted, 'Sans', 500, 'center');
    box(g, x - 50, y - 17, 100, 34, C.gold, null, 4);
    tx(g, 'Prompt KV', x, y + 6, 16, C.ink, 'Sans', 600, 'center');
    foot(g, 'SEPARATE WORKER POOLS   /   PREFILL → DECODE',
      transfer === 1 ? 'Cache delivered. Time the handoff under load.'
        : 'Decode needs this request’s prompt keys and values.');
    return;
  }
  if (b === 2) {
    frame(g, k, 'Chunked prefill · one worker', 'How can decode get a turn?');
    const split = cue(k, 2, 'split the prefill') > 0;
    label(g, 'ONE UNINTERRUPTED PREFILL', 64, 170);
    function track(y, parts) {
      let x = 64;
      let emission = 0;
      const reply = ['The', 'call', 'is', 'at', 'two'];
      parts.forEach(([kind, w]) => {
        box(g, x, y, w - 2, 56, kind === 'P' ? C.blue : C.teal, null, 3);
        tx(
          g,
          kind === 'P' ? (w > 170 ? 'Read prompt' : 'Prefill') : reply[emission++],
          x + w / 2,
          y + 35,
          w > 100 ? 18 : 14,
          C.white,
          'Sans',
          600,
          'center',
        );
        x += w;
      });
    }
    track(191, [
      ['D', 58],
      ['P', 540],
      ['D', 58], ['D', 58], ['D', 58], ['D', 58],
    ]);
    label(g, 'SAME PROMPT IN FOUR CHUNKS', 64, 308);
    if (split)
      track(329, [
        ['D', 58],
        ['P', 135],
        ['D', 58],
        ['P', 135],
        ['D', 58],
        ['P', 135],
        ['D', 58],
        ['P', 135],
        ['D', 58],
      ]);
    foot(
      g,
      'ILLUSTRATIVE SCHEDULE   /   SAME PROMPT WORK',
      'Time both the running stream’s gaps and the new prompt’s first token.',
    );
    return;
  }
  function said(phrase) {
    if (b !== 1) return false;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  }
  let seen = 1;
  if (b === 0) {
    const watch = 'Watch four tokens';
    const { start } = k.wordCue(watch);
    const question = k.wordCue('Which two arrivals').start;
    seen = k.reveal(watch, question - start, { captionStart: watch });
  }
  const clientMs = Math.round(arrivals.at(-1) * seen);
  const n = arrivals.filter((t) => t <= clientMs).length;
  const answer = said('The last gap takes two hundred eighty milliseconds');
  const first = said('The first token took two hundred milliseconds from arrival');
  const mean = said('After it, the three gaps average one hundred milliseconds');
  const compare = cue(k, 1, 'After it, the three gaps', 0.9);
  const longest = m.gaps.indexOf(m.max);
  const words = ['Ask', 'the', 'owner', 'first'];
  const span = (ms) => 1.58 * ms;
  const x = (ms) => 72 + span(ms);
  const y = 213;
  frame(
    g, k, 'Client timestamps',
    compare ? 'Compare the three token gaps' : 'Which two tokens left the longest silence?',
  );
  label(g, 'CLIENT CLOCK (ms)', 72, 142);
  line(g, x(0), y, x(520), y, C.muted, 2);
  if (seen > 0 && seen < 1) dot(g, x(clientMs), y, 4, C.blue);
  dot(g, x(0), y, 6, C.ink);
  tx(g, 'Request', x(0), y - 21, 19);
  for (let i = 0; i < n; i++) {
    const a = arrivals[i],
      top = [164, 136, 178, 164][i],
      labelX = x(a) + [-45, 15, 74, 0][i],
      color = answer && (i === longest || i === longest + 1) ? C.rust : C.teal;
    line(g, x(a), y, x(a), top + 9, color, 2);
    line(g, x(a), top + 9, labelX, top + 9, color);
    tx(g, words[i], labelX, top, 21, color, 'Sans', 600, 'center');
    dot(g, x(a), y, 6, color);
  }
  for (const t of [0, 100, 200, 300, 400, 500]) {
    line(g, x(t), y + 7, x(t), y + 13, C.muted);
    tx(g, t, x(t), y + 35, 16, C.muted, 'Mono', 400, 'center');
  }
  if (seen > 0 && seen < 1) {
    line(g, x(clientMs), y + 40, x(clientMs), y + 54, C.teal, 2);
    tx(g, clientMs + ' ms', x(clientMs), y + 76, 18, C.teal, 'Mono', 600, 'center');
  }
  function bracket(from, to, name, color) {
    line(g, from, 255, to, 255, color, 2);
    for (const edge of [from, to]) line(g, edge, 251, edge, 259, color, 2);
    tx(g, name, (from + to) / 2, 279, 20, color, 'Sans', 600, 'center');
  }
  if (first) bracket(x(0), x(m.first), 'Time to first token · ' + m.first + ' ms', C.blue);
  if (answer) {
    const name = compare === 1 ? 'Longest gap' : 'Longest gap · ' + m.max + ' ms';
    bracket(x(arrivals[longest]), x(arrivals[longest + 1]), name, C.rust);
  }

  if (compare) {
    const zero = 298;
    // Drop the measured spans into separate rows before aligning their left edges.
    const drop = Math.min(1, 2 * compare);
    const align = Math.max(0, 2 * compare - 1);
    label(g, 'INTER-TOKEN GAPS (ms)', 72, 305);
    line(g, zero, 314, zero, 400, C.rule, 1.5);
    for (const [i, gap] of m.gaps.entries()) {
      const barY = 313 + (9 + i * 32) * drop;
      const barX = x(arrivals[i]) + (zero - x(arrivals[i])) * align;
      const color = i === longest ? C.rust : C.teal;
      box(g, barX, barY, span(gap), 14, color);
      if (compare === 1) {
        tx(g, words[i] + ' → ' + words[i + 1], 72, barY + 12, 18, color, 'Sans', 600);
        tx(g, gap, barX + span(gap) + 11, barY + 13, 19, color, 'Mono', 600);
      }
    }
    if (mean) {
      const average = zero + span(m.mean);
      line(g, average, 314, average, 400, C.white, 4);
      line(g, average, 314, average, 400, C.blue, 2, true);
      tx(g, 'TPOT · ' + m.mean + ' ms', average, 305, 20, C.blue, 'Sans', 600, 'center');
    }
  }
  const stamps = arrivals.slice(0, n).map((t) => t + ' ms').join('  ·  ');
  const streamText = n ? '“' + words.slice(0, n).join(' ') + '”' : 'Waiting for the first token';
  foot(
    g,
    n ? 'TOKEN ARRIVALS   /   ' + stamps : 'REQUEST ARRIVAL   /   0 ms',
    mean ? `Time per output token · (${m.gaps.join(' + ')}) ÷ ${m.gaps.length} = ${m.mean} ms` : streamText,
  );
}
