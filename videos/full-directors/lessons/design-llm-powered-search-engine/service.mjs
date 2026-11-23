import {
  C,
  afterCue,
  alpha,
  clamp,
  cue,
  dot,
  footer,
  frame,
  lerp,
  line,
  mono,
  paper,
  para,
  rect,
  serif,
  tag,
  text,
} from './studio.mjs';
import {
  callbacks,
  capacity,
  charges,
  events,
  migrationAnswer,
  reduce,
  schedule,
} from './evidence.mjs';

export function publication(g, c) {
  const b = c.beat.beatIndex;
  frame(
    g,
    'Claim delivery',
    b >= 3 ? 'What did the browser remember?' : 'Which decision can release the draft?',
    true,
  );
  if (b >= 3) {
    const second = cue(c, 3, 'The next event', 0),
      inherit = cue(c, 4, 'Twelve again', 0),
      empty = cue(c, 4, 'explicitly empty ID', 0);
    const ids = callbacks(['12', undefined, '']);
    const wire = [
      ['id: 12', 'data: progress'],
      ['(id omitted)', 'data: checked_claim'],
      ['id:', 'data: complete'],
    ];
    mono(g, 'SERVER-SENT EVENTS   /   THREE DISTINCT PAYLOADS', 48, 150, 14, C.mint);
    wire.slice(0, empty ? 3 : second ? 2 : 1).forEach(([id, data], i) => {
      const x = 48 + i * 293;
      paper(g, x, 182, 272, 150);
      mono(g, 'EVENT 0' + (i + 1), x + 17, 211, 14);
      mono(g, id, x + 17, 259, 19, C.ink);
      mono(g, data, x + 17, 297, 16, C.ink);
      line(g, x + 136, 333, x + 136, 355, C.honey, 2);
      text(g, 'Callback ID', x + 17, 388, 18, C.mint);
      serif(g, i === 1 && !inherit ? '?' : ids[i] || 'empty', x + 17, 429, 31, C.white);
    });
    footer(
      g,
      empty
        ? 'An empty ID clears the reconnect cursor. Assign explicit IDs to replayable events.'
        : inherit
          ? 'Distinct payloads can share a callback ID.'
          : 'Does an omitted ID assign the next integer?',
      true,
    );
    return;
  }
  const stale = cue(c, 1, 'An acceptance arrives', 0),
    malformed = cue(c, 1, 'Next comes', 0);
  const arrived = cue(c, 2, 'A matching true decision arrives', 0);
  const accepted = cue(c, 2, 'This request publishes', 0),
    replay = cue(c, 2, 'Replaying that same event', 0);
  const count = stale + malformed + arrived + replay;
  const state = reduce(events.slice(0, stale + malformed + accepted + replay));
  rect(g, 46, 109, 866, 80, C.pine, 5);
  mono(g, 'ACTIVE   /   request A    draft hash d2    evidence set r2', 67, 137, 17, C.white);
  line(g, 67, 148, 891, 148, C.grid);
  mono(g, 'DECISIONS RECEIVED', 48, 218, 13, C.mint);
  mono(g, 'ALICE’S READER COPY   /   PARSER-V2 SDK', 495, 218, 13, C.mint);
  line(g, 468, 202, 468, 442, C.grid, 1);
  const desc = ['Stale binding', 'Wrong type', 'Accepted', 'Replay'];
  for (let j = 0; j < count; j++) {
    const e = events[j],
      y = 235 + j * 49,
      yes = j === 2 && accepted;
    rect(g, 48, y, 400, 42, yes ? '#365f4e' : '#2d4745', 3);
    mono(
      g,
      '#' + e.id + '  ' + e.draft + ' / r' + e.rev + '   ' + String(e.accepted),
      61,
      y + 27,
      15,
      C.white,
    );
    const detail = j === 2 && !accepted ? 'Await access' : j === 1 && b === 1 ? 'Integer' : desc[j];
    mono(g, detail, 433, y + 27, 14, yes ? C.mint : C.white, 'right');
  }
  if (!count) mono(g, 'Waiting for a check event…', 51, 267, 14, '#b4c8c2');
  paper(g, 486, 235, 424, 210);
  tag(g, state.status, 504, 265, state.emitted ? C.green : C.dim, state.emitted ? C.mint : C.ice);
  mono(
    g,
    state.emitted + ' claim' + (state.emitted === 1 ? '' : 's') + ' emitted',
    891,
    266,
    13,
    C.dim,
    'right',
  );
  if (state.emitted) {
    para(g, migrationAnswer.sentence, 504, 305, 386, 20, 24);
    line(g, 504, 401, 891, 401);
    mono(g, migrationAnswer.citations, 504, 425, 14);
  }
  text(
    g,
    replay
      ? 'A replay leaves the same one sentence in the reader copy.'
      : accepted
        ? 'The matching Boolean check and current access release one claim.'
        : arrived
          ? 'The verdict matches. Recheck access before sending the claim.'
          : b === 2
            ? 'The integer verdict leaves the current draft pending.'
            : malformed
              ? 'Does an integer 1 count as a Boolean verdict?'
              : stale
                ? 'The d1 verdict cannot release the d2 draft.'
                : 'The reader can see progress while the draft is private.',
    67,
    175,
    18,
    C.white,
    'Sans',
    500,
  );
}

const traceColors = ['#a7bde8', '#9dd4c3', '#dbb5df', '#f2bd78', '#abbded', '#e1c67b', '#96d3a2'];
const spanNames = ['Plan', 'Search', 'Rerank', 'Pack', 'Model', 'Finish claim', 'Check'];
const timeX = (ms) => 165 + ms * 0.69;

function readerCopy(g, label, checked) {
  rect(g, 46, 369, 867, 82, C.page, 5);
  text(g, label, 61, 398, 17, C.ink, 'Sans', 600);
  if (checked) {
    para(g, migrationAnswer.sentence, 212, 394, 680, 19, 22);
    mono(g, migrationAnswer.citations, 212, 441, 14);
  }
}

function traceAxis(g, top, bottom) {
  for (const ms of [0, 200, 400, 600, 800, 1000]) {
    const x = timeX(ms);
    line(g, x, top, x, bottom, C.grid);
    mono(g, ms, x, top - 5, 14, '#bdcec5', 'center');
  }
  mono(g, 'ms', timeX(1000) + 31, top - 5, 14, '#bdcec5');
}

function replayTrace(g, c, raw, dependent) {
  const moved = cue(c, 3, 'Move the search start', 1.1);
  const token = afterCue(c, 3, 'The draft token moves to eight forty');
  const checked = afterCue(c, 3, 'and the checked claim to ten twenty');
  const delay = dependent.searchFrom - raw.searchFrom;
  frame(g, 'Request trace', 'What changes when search waits for a rewrite?', true);
  traceAxis(g, 161, 338);
  const planEnd = timeX(raw.plan);
  line(g, planEnd, 180, planEnd, 334, traceColors[0], 1);
  mono(g, raw.plan + ' ms plan', planEnd + 8, 180, 14, traceColors[0]);
  for (const ms of [raw.token, raw.checked]) {
    const x = timeX(ms);
    line(g, x, 206, x, 334, '#6a8480', 1);
  }

  function track(label, y, offset, until, showToken, showChecked) {
    text(g, label, 47, y + 20, 20, C.white, 'Sans', 600);
    const [start, end] = raw.spans[0];
    rect(g, timeX(start), y - 12, timeX(end) - timeX(start), 8, traceColors[0], 1);
    line(g, timeX(0), y + 12, timeX(dependent.checked), y + 12, C.grid, 2);
    raw.spans.slice(1).forEach(([from, to], i) => {
      if (to > until) return;
      rect(g, timeX(from + offset), y, timeX(to) - timeX(from), 24, traceColors[i + 1], 1);
    });
    text(
      g,
      'Search',
      timeX((raw.searchFrom + raw.found) / 2 + offset),
      y + 18,
      16,
      C.ink,
      'Sans',
      600,
      'center',
    );
    if (showToken) {
      const x = timeX(raw.token + offset);
      line(g, x, y - 4, x, y + 28, C.honey, 2);
      mono(g, 'draft ' + (raw.token + offset), x - 6, y + 46, 15, C.honey, 'right');
    }
    if (showChecked) {
      const x = timeX(raw.checked + offset);
      line(g, x, y - 4, x, y + 28, C.mint, 2);
      mono(g, 'checked ' + (raw.checked + offset), x - 6, y + 46, 15, C.mint, 'right');
    }
  }

  track('Raw query', 211, 0, raw.checked, true, true);
  const offset = token || checked ? delay : delay * moved;
  const until = checked ? raw.checked : token ? raw.token : raw.packed;
  track('Replay', 298, offset, until, token, checked);
  readerCopy(g, 'Replay answer', checked);
  footer(
    g,
    checked
      ? 'Waiting for the rewrite adds ' + delay + ' ms to both milestones.'
      : 'Keep the plan fixed. Shift the search and the work that follows.',
    true,
  );
}

export function latency(g, c) {
  const s = schedule(false);
  if (c.beat.beatIndex === 3) {
    replayTrace(g, c, s, schedule(true));
    return;
  }
  const keepEmpty = cue(c, 2, 'Keep it empty', 0);
  const milestones = [
    [0, 'Start both clocks', s.found, 1.2],
    [0, 'Rerank for ninety', s.ranked, 0.55],
    [0, 'pack for twenty', s.packed, 0.45],
  ];
  let now = 0;
  for (const [beat, phrase, target, span] of milestones)
    now = lerp(now, target, cue(c, beat, phrase, span));
  if (afterCue(c, 1, 'The first draft token arrives at eight hundred milliseconds')) now = s.token;
  if (afterCue(c, 2, 'The sentence is complete at nine hundred milliseconds')) now = s.complete;
  if (afterCue(c, 2, 'At nine hundred eighty')) now = s.checked;
  now = Math.round(now);
  frame(g, 'Request trace', 'When can Alice read the first claim?', true);
  mono(g, 'RAW QUERY   /   INDEPENDENT SEARCH', 45, 135, 13, C.mint);
  mono(g, now + ' ms', 905, 138, 21, C.honey, 'right');
  traceAxis(g, 165, 325);
  const durations = s.spans.map(([a, z]) => z - a);
  s.spans.forEach(([a, z], i) => {
    const y = 173 + i * 22;
    mono(g, spanNames[i], 47, y + 13, 14, C.white);
    line(g, timeX(0), y + 8, timeX(s.checked), y + 8, C.grid);
    const until = Math.min(z, now);
    if (until > a) rect(g, timeX(a), y, timeX(until) - timeX(a), 16, traceColors[i], 1);
    if (until >= z) mono(g, durations[i], timeX(z) + 6, y + 13, 12, C.white);
  });
  if (now >= s.token) {
    const x = timeX(s.token);
    line(g, x, 170, x, 326, C.honey, 2);
    mono(g, 'draft ' + s.token, x - 4, 345, 13, C.honey, 'right');
  }
  if (now >= s.checked) {
    const x = timeX(s.checked);
    line(g, x, 305, x, 326, C.mint, 2);
    mono(g, 'checked ' + s.checked, x + 8, 345, 13, C.mint, 'right');
  }
  readerCopy(g, 'Alice’s answer', now >= s.checked);
  footer(
    g,
    now === s.checked
      ? 'First complete checked claim   /   ' + s.checked + ' ms'
      : keepEmpty
        ? 'The draft stays private until the complete claim passes its check.'
        : now >= s.token
          ? 'At ' + s.token + ' ms, what can Alice read?'
          : 'One request   /   illustrative durations in milliseconds',
    true,
  );
}

export function memory(g, c) {
  const b = c.beat.beatIndex,
    m = capacity(),
    counted = cue(c, 1, 'Only the middle interval', 0);
  frame(
    g,
    'Model capacity',
    b < 2 ? 'Which part of a request holds cache?' : 'What limits the shared worker fleet?',
  );
  const ox = 56,
    w = 846,
    y = b < 2 ? 212 : 131,
    h = b < 2 ? 83 : 31;
  const cols = [C.ice, C.mint, C.blush];
  let offset = 0;
  m.waits.forEach((t, i) => {
    const x = ox + (w * offset) / m.lifetime,
      width = (w * t) / m.lifetime;
    rect(g, x, y, width - 1, h, cols[i], 2);
    if (b < 2) {
      mono(g, t.toFixed(2) + ' s', x + width / 2, y + h / 2 + 6, 16, C.ink, 'center');
      line(g, x + width / 2, y - 14, x + width / 2, y - 2, C.dim);
      mono(g, ['Before', 'KV resident', 'After'][i], x + width / 2, y - 22, 14, C.dim, 'center');
    } else if (i === 1)
      mono(
        g,
        '1.93 s resident    /    1,158 histories',
        x + width / 2,
        y + 21,
        14,
        C.ink,
        'center',
      );
    offset += t;
  });
  if (b < 2) {
    mono(g, 'SYNTHESIS ROUTE    /    600 ARRIVALS PER SECOND', 57, 144, 14);
    line(g, ox, 311, ox + w, 311, C.ink, 1.5);
    line(g, ox, 303, ox, 314, C.ink);
    line(g, ox + w, 303, ox + w, 314, C.ink);
    serif(g, '2.50 s from arrival to final check', 480, 348, 26, C.ink, 'center');
    if (counted) {
      tag(g, 'All in flight   ' + m.rate + ' × 2.50 = ' + m.all, 68, 407, C.blue, C.ice);
      tag(g, 'Holding KV   ' + m.rate + ' × 1.93 = ' + m.resident, 485, 407);
    }
    footer(
      g,
      counted
        ? 'Little’s Law counts mean population inside the selected boundary.'
        : 'At 600 arrivals per second, how many histories are still resident?',
    );
    return;
  }
  if (b === 2) {
    mono(g, 'ONE CACHED POSITION', 57, 206, 14);
    const parts = ['K, V', 'layers', 'KV heads', 'head width', 'bytes'];
    m.shape.forEach((v, i) => {
      const x = 56 + i * 166;
      rect(g, x, 228, 131, 80, i === 0 ? C.pine : C.page, 4);
      serif(g, v, x + 65, 270, 32, i === 0 ? C.white : C.ink, 'center');
      mono(g, parts[i], x + 65, 294, 13, i === 0 ? C.mint : C.dim, 'center');
      if (i < 4) serif(g, '×', x + 149, 278, 24, C.dim, 'center');
    });
    if (cue(c, 2, 'That is a hundred', 0))
      mono(g, m.perPosition.toLocaleString('en-US') + ' bytes per position', 56, 342, 16);
    const done = cue(c, 2, 'Divide by two', 0);
    if (done) {
      serif(g, '1,158 × 1,560 × 131,072  /  2³⁰  =  ' + m.gib.toFixed(2) + ' GiB', 56, 408, 27);
    }
    footer(g, 'Time-weighted cached positions per resident   /   1,560');
    return;
  }
  const decode = cue(c, 3, 'decode needs twelve', 0);
  mono(g, 'MEMORY FLOOR', 58, 211);
  mono(g, 'DECODE FLOOR', 512, 211);
  function rack(x, n, col) {
    for (let i = 0; i < 20; i++) {
      const xx = x + (i % 10) * 36,
        yy = 238 + Math.floor(i / 10) * 38;
      rect(g, xx, yy, 32, 29, i < n ? col : '#d9ddd3', 3);
      if (i < n) {
        line(g, xx + 5, yy + 9, xx + 22, yy + 9, C.white, 1.3);
        dot(g, xx + 24, yy + 21, 1.6, C.white);
      }
    }
  }
  rack(59, m.memory, C.green);
  rack(513, decode ? m.decode : 0, C.blue);
  serif(g, m.memory + ' workers', 58, 363, 33);
  if (decode) serif(g, m.decode + ' workers', 512, 363, 33);
  text(g, m.gib.toFixed(2) + ' GiB  ÷  12 GiB per worker', 58, 400, 18);
  text(g, '72,000  ÷  6,000 output tokens/s', 512, 400, 18);
  footer(g, 'The same workers may serve both needs. Benchmark them together.');
}

export function cost(g, c) {
  const b = c.beat.beatIndex,
    set = cue(c, 1, 'The mean is', 0);
  const move = cue(c, 3, 'Move the ten', 0.95),
    invalid = cue(c, 2, 'invalidates ten', 0);
  const moved = Math.round(10 * move),
    bill = charges(moved, invalid ? 10 - moved : 0);
  frame(g, 'Route costs', 'What does a stale cache hit cost?');
  mono(g, '100 REQUESTS   /   SAME COHORT', 49, 143, 14);
  const colors = [C.blue, C.green, C.orange];
  for (let i = 0; i < 100; i++) {
    const which = i < bill.counts[0] ? 0 : i < 90 ? 1 : 2,
      x = 50 + (i % 10) * 26,
      y = 162 + Math.floor(i / 10) * 24;
    rect(g, x, y, 22, 20, colors[which], 4);
    if (invalid && i >= 60 + moved && i < 70) {
      line(g, x + 4, y + 16, x + 18, y + 4, C.honey, 3);
    }
  }
  mono(g, 'ROUTE', 358, 152);
  mono(g, 'COUNT', 631, 152, 13, C.dim, 'right');
  mono(g, 'EACH', 755, 152, 13, C.dim, 'right');
  mono(g, 'SUBTOTAL', 902, 152, 13, C.dim, 'right');
  ['Full synthesis', 'Valid cache', 'Live lookup'].forEach((name, i) => {
    const y = 187 + 56 * i;
    rect(g, 358, y - 17, 6, 23, colors[i]);
    text(g, name, 376, y + 2, 19);
    mono(g, bill.counts[i], 631, y + 2, 18, C.ink, 'right');
    mono(g, bill.prices[i].toFixed(2) + '¢', 755, y + 2, 17, C.ink, 'right');
    mono(g, set ? bill.parts[i].toFixed(2) + '¢' : '…', 902, y + 2, 17, C.ink, 'right');
    line(g, 358, y + 18, 902, y + 18);
  });
  if (bill.pending) {
    tag(g, bill.pending + ' awaiting a fresh route', 359, 353, C.orange, C.blush);
    mono(g, 'Previous mean   0.601¢ per search', 360, 402, 14);
  } else if (set) {
    serif(g, bill.mean.toFixed(3) + '¢ per search', 360, 366, 36, C.pine);
    mono(g, '$' + bill.perMinute.toFixed(2) + ' per minute  ·  1,000 searches/s', 361, 405);
  }
  footer(
    g,
    b === 3
      ? 'The cohort still has 100 searches. Each rerouted search adds 0.94¢.'
      : invalid
        ? 'Striped cache entries need fresh answers. Which price will they pay?'
        : 'Route prices include access checks, network and service costs.',
  );
}
