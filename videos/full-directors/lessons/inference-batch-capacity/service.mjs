import {
  C,
  base,
  big,
  bidx,
  bracket,
  cue,
  ease,
  fmt,
  foot,
  hatch,
  kv,
  label,
  line,
  mark,
  mid,
  mono,
  rect,
  txt,
  weight,
} from './art.mjs';
import {
  candidates,
  chosen,
  chunk,
  decodeDeadline,
  dollars,
  GiB,
  hardware,
  ids,
  lengths,
  link,
  point,
  poolGiB,
  practice,
  readSweep,
  schedules,
  trial,
  weights,
  weightMs,
  winner,
} from './model.mjs';

function scheduleGrid(c, model, count, y, title) {
  const x = 445,
    step = 138,
    h = 44,
    colors = ['#227367', '#47816b', '#326c82', '#bd7b3c', '#986440'];
  txt(c, title, 84, y + 51, 34, C.blue, 'Serif');
  for (let s = 0; s < 3; s++) {
    mono(c, 'Slot ' + (s + 1), 305, y + 40 + s * (h + 5), 27, C.dim);
    for (let i = 0; i < 8; i++) {
      const dx = x + i * step,
        dy = y + s * (h + 5),
        actual = i < count && i < model.reads;
      if (!actual) {
        rect(c, dx, dy, step - 6, h, C.paper, C.rule, 1);
        continue;
      }
      const owner = model.frames[i].slots[s];
      if (owner === null) hatch(c, dx, dy, step - 6, h, C.bare, C.rule, 16);
      else {
        rect(c, dx, dy, step - 6, h, colors[owner]);
        const pos = model.frames[i].emitted.find((t) => t.id === owner).position;
        mono(c, ids[owner] + '·' + pos, dx + (step - 6) / 2, dy + 32, 29, C.white, 'center');
      }
    }
  }
  if (count >= model.reads) {
    big(c, model.reads, 1710, y + 88, 78, C.sea, 'center');
    mid(c, 'reads', 1710, y + 136, 30, C.dim);
  }
}
export function membership(c, k) {
  const b = bidx(k),
    first = cue(k, 0, 'In a static batch', 1.8),
    second = cue(k, 1, 'The next group starts', 1.05);
  const replay = cue(k, 1, 'Replay the same requests', 0.6),
    resume = cue(k, 2, 'At step three', 0.9),
    finish = cue(k, 2, 'Five reads now');
  const staticCount = Math.min(5, Math.ceil(first * 5)) + Math.ceil(second * 3);
  const contCount = finish ? 5 : resume > 0 ? 2 + Math.ceil(resume) : Math.ceil(replay * 2);
  base(c, k, 'Decode scheduler', 'How many times do we read the weights?');
  label(c, 'Starting output lengths', 99, 290);
  mono(c, lengths.map((n, i) => ids[i] + '·' + n).join('     '), 639, 290, 33);
  for (let i = 0; i < 8; i++)
    mono(c, String(i + 1), 445 + (i + 0.5) * 138, 360, 27, C.dim, 'center');
  scheduleGrid(c, schedules[0], staticCount, 386, 'Static');
  if (b > 0 && replay) scheduleGrid(c, schedules[1], contCount, 593, 'Continuous');
  else if (b === 0)
    txt(c, 'Each column advances the live requests by one token.', 448, 650, 37, C.dim);
  const running = contCount ? schedules[1].frames[contCount - 1] : null;
  const nextRead = contCount === 2 ? ' Who can share its next read?' : '';
  foot(
    c,
    finish
      ? '13 tokens in both runs. Continuous refill preserves C and removes three weight reads.'
      : running
        ? 'After step ' +
          running.iteration +
          ', C has ' +
          running.remaining[2] +
          ' tokens left.' +
          nextRead
        : 'Hatching marks an idle slot during an executed step.',
  );
}
function trafficTrack(c, row, y, scan, deadline = 40) {
  const x = 300,
    scale = 25;
  label(c, 'Batch ' + row.b, 100, y + 61);
  rect(c, x, y, 56 * scale, 85, C.white, C.rule);
  const sweep = readSweep(row, scan);
  weight(c, x, y, sweep.weight * scale, 85);
  sweep.fractions.forEach((fraction, i) => {
    if (fraction)
      kv(
        c,
        x + (weightMs + i * sweep.perHistory) * scale,
        y,
        fraction * (sweep.perHistory * scale - 0.8),
        85,
        i,
      );
  });
  mark(c, x + scale * deadline, y - 13, 111, C.orange);
}
export function bandwidth(c, k) {
  const b = bidx(k);
  if (b === 0) {
    const eight = cue(k, 0, 'Eight active streams'),
      n = eight ? 8 : 1;
    base(c, k, 'Arithmetic intensity', 'How much work uses one weight read?');
    label(c, 'Dense linear layers  ·  16-bit weights  ·  weight traffic only', 102, 309);
    weight(c, 108, 387, 568, 188);
    mid(c, 'Shared weights', 392, 482, 48, C.white);
    line(c, 677, 481, 786, 481, C.blue, 4);
    if (eight) {
      line(c, 786, 343, 786, 655, C.blue, 3);
      for (const rail of [343, 655]) {
        line(c, 786, rail, 1510, rail, C.blue, 3);
        for (let j = 0; j < 4; j++) {
          const at = 925 + j * 195;
          line(c, at, rail, at, rail === 343 ? 376 : 618, C.blue, 3);
        }
      }
    } else {
      line(c, 786, 481, 786, 425, C.blue, 4);
      line(c, 786, 425, 843, 425, C.blue, 4);
    }
    for (let j = 0; j < n; j++) {
      const xx = 843 + (j % 4) * 195,
        yy = 376 + Math.floor(j / 4) * 142;
      kv(c, xx, yy, 164, 100, j);
      mid(c, 'R' + (j + 1), xx + 82, yy + 51, 35, C.white);
    }
    mono(c, '2PB FLOPs ÷ (2P bytes)  ≈  B FLOPs per byte', 106, 737, 43);
    foot(
      c,
      'P parameters, B active streams, one full weight read. Attention adds work and traffic.',
    );
    return;
  }
  const n = b === 1 ? 1 : b === 2 ? 8 : 24,
    p = point(n);
  const done = cue(
    k,
    b,
    ['', 'twenty-five milliseconds', 'thirty-two milliseconds', 'forty-eight milliseconds'][b],
  );
  const sweep = cue(
    k,
    b,
    ['', 'At batch one', 'Increase the batch', 'Try twenty-four streams'][b],
    1.15,
  );
  base(c, k, 'Decode bandwidth', 'What does one sweep cost?');
  label(c, 'One weight read + current histories  ·  500 GiB/s assumed', 100, 307);
  const y = 445;
  trafficTrack(c, p, y, done ? p.ms : p.ms * ease(sweep));
  mono(c, '0', 300, y - 36, 26, C.dim, 'center');
  mono(c, '24 ms', 900, y - 36, 28, C.blue, 'center');
  mono(c, '40 ms target', 1300, y - 36, 28, C.orange, 'center');
  bracket(c, 300, 900, 568, '12 GiB weights');
  mono(c, fmt(p.kv) + ' GiB histories', 920, 626, 30, C.sea);
  if (done) {
    big(c, fmt(p.ms) + ' ms / step', 106, 750, 66, C.blue);
    mono(
      c,
      n +
        (n === 1 ? ' token ÷ ' : ' tokens ÷ ') +
        (p.ms / 1000).toFixed(3) +
        ' s = ' +
        fmt(p.tps) +
        ' tokens/s',
      749,
      742,
      38,
    );
  } else {
    mono(c, '(' + weights + ' + ' + fmt(p.kv) + ') GiB ÷ 500 GiB/s', 106, 746, 43);
  }
  foot(
    c,
    p.ms > 40 && done
      ? 'This batch delivers more tokens together. Its iteration misses the deadline.'
      : 'One token per active request per decode step.',
  );
}
export function phaseCost(c, k) {
  const b = bidx(k);
  if (b < 2) {
    const decode = cue(k, 0, 'Give each active'),
      take = cue(k, 1, 'Six prompt positions fit');
    base(c, k, 'Mixed prefill and decode', 'How much prompt work fits in this step?');
    label(c, 'New positions scheduled in one iteration', 100, 315);
    const xx = 110,
      cy = 374,
      cw = 157;
    for (let j = 0; j < chunk.budget; j++) {
      const current = j < chunk.live && decode,
        prompt = j >= chunk.live && take;
      if (current) kv(c, xx + j * cw, cy, cw - 5, 112, j);
      else rect(c, xx + j * cw, cy, cw - 5, 112, prompt ? '#e8b37d' : C.white, C.rule);
      if (current || prompt)
        mid(
          c,
          current ? 'R' + (j + 1) : 'P' + (j - chunk.live + 1),
          xx + (j + 0.5) * cw,
          cy + 59,
          36,
          current ? C.white : C.ink,
        );
    }
    label(c, 'Long prompt', 100, 601);
    for (let j = 0; j < chunk.waiting; j++) {
      const used = take && j < chunk.take,
        x = 425 + j * 64;
      rect(c, x, 568, 59, 65, used ? C.paper : '#e8b37d', used ? C.rule : C.amber);
      if (!used) mono(c, j + 1, x + 29, 610, 24, C.ink, 'center');
    }
    mono(
      c,
      (take ? chunk.waiting - chunk.take : chunk.waiting) + ' positions waiting',
      425,
      723,
      40,
    );
    foot(
      c,
      take
        ? 'Protect the token gap and measure the prompt’s first-token delay.'
        : 'Reserve the live decodes first. How much of the prompt fits beside them?',
    );
    return;
  }
  base(c, k, 'Phase handoff', 'Would separate workers finish sooner?');
  label(c, 'No overlap  ·  ' + link.gib + ' GiB of KV  ·  ' + link.rate + ' GiB/s link', 100, 309);
  const x = 473,
    y = 444,
    unit = 60;
  txt(c, 'Time saved', 102, y + 46, 40);
  rect(c, x, y, link.saved * unit, 68, '#abd3bb');
  mono(c, link.saved + ' ms', x + link.saved * unit - 18, y + 45, 32, C.ink, 'right');
  txt(c, 'Time added', 102, y + 200, 40);
  const traveling = cue(k, 2, 'Follow a two', 0.95),
    wire = cue(k, 2, 'the transfer takes'),
    more = cue(k, 2, 'Add four');
  if (traveling > 0) {
    kv(c, x, y + 149, unit * link.wire, 72);
    mark(c, x + link.wire * unit * traveling, y + 135, 112, C.sea);
  }
  if (wire) mono(c, fmt(link.wire) + ' ms transfer', x + 20, y + 194, 32, C.white);
  if (more) {
    hatch(c, x + link.wire * unit, y + 149, unit * link.coord, 72, '#edc699', C.amber, 17);
    txt(c, '4 ms coordination', x + (link.wire + link.coord) * unit + 20, y + 196, 31);
  }
  mark(c, x + link.saved * unit, y - 24, 270, C.orange);
  if (b === 3)
    bracket(
      c,
      x + link.saved * unit,
      x + (link.wire + link.coord) * unit,
      y + 265,
      '+' + fmt(link.delta) + ' ms',
      C.orange,
    );
  foot(
    c,
    b === 3
      ? 'Keep the workers together here. Transfer plus coordination exceeds the saving.'
      : 'Compare time avoided with transfer and coordination on the critical path.',
  );
}
function sweepProgress(k, first, last = first) {
  const { start } = k.wordCue(first);
  const { end } = k.wordCue(last);
  return k.reveal(first, end - start);
}
function candidatesGrid(c, k) {
  const memory = cue(k, 0, 'Check the sixteen');
  const test = bidx(k) === 1;
  const win = cue(k, 1, 'Sixteen is our largest');
  const latest = candidates.findLast((row) => row.fit);
  let time = 0;
  if (test) {
    time =
      weightMs * sweepProgress(k, 'Start the sweep', 'on the same weights') +
      (decodeDeadline - weightMs) *
        sweepProgress(k, 'Then each current history', 'At the deadline') +
      (latest.ms - decodeDeadline) * sweepProgress(k, 'At forty-eight milliseconds');
  }
  const atDeadline = time === decodeDeadline;
  const showRemaining = cue(k, 1, 'eight histories to go');
  const sx = 712,
    scale = 20,
    y0 = 366,
    readEndX = sx + latest.ms * scale,
    deadlineX = sx + decodeDeadline * scale,
    railBottom = y0 + candidates.indexOf(latest) * 80 + 54;
  label(c, 'Batch', 101, 301);
  label(c, 'Promised KV / ' + poolGiB + ' GiB', 297, 301);
  label(c, 'Modeled read time', sx, 301);
  if (time >= weightMs)
    mono(c, fmt(weightMs) + ' ms', sx + weightMs * scale, 301, 30, C.blue, 'center');
  mono(c, fmt(decodeDeadline) + ' ms deadline', deadlineX, 301, 30, C.orange, 'center');
  for (let i = 0; i < candidates.length; i++) {
    const r = candidates[i],
      y = y0 + i * 80;
    if (win && r === chosen) rect(c, 88, y - 10, 1745, 73, '#d2e5d7');
    mono(c, fmt(r.b), 113, y + 38, 39, r === chosen && win ? C.sea : C.ink);
    const mx = 306,
      mw = 247;
    rect(c, mx, y + 1, mw, 42, C.white, C.rule);
    if (memory) {
      rect(c, mx, y + 1, (mw * r.res) / poolGiB, 42, r.fit ? C.mint : '#edc699');
      mono(c, fmt(r.res), mx + 9, y + 32, 26);
    }
    line(c, mx + mw, y - 5, mx + mw, y + 50, C.ink, 3);
    if (memory && !r.fit) {
      mono(c, 'Exceeds pool', sx, y + 38, 32, C.orange);
      continue;
    }
    rect(c, sx, y + 1, readEndX - sx, 43, C.white, C.rule);
    if (test) {
      const sweep = readSweep(r, time);
      weight(c, sx, y + 1, sweep.weight * scale, 43);
      sweep.fractions.forEach((fraction, j) => {
        const historyStart = weightMs + j * sweep.perHistory;
        const cellX = sx + historyStart * scale;
        const cellWidth = scale * sweep.perHistory - 2;
        if (time >= decodeDeadline && historyStart >= decodeDeadline)
          rect(c, cellX, y + 1, cellWidth, 43, '#f4e6d3', C.amber, 1.5);
        if (fraction) kv(c, cellX, y + 1, fraction * cellWidth, 43, j);
      });
      if (sweep.done) {
        mono(c, fmt(r.ms) + ' ms', readEndX + 20, y + 34, 30, r.onTime ? C.sea : C.orange);
      } else if (atDeadline && showRemaining) {
        const remaining = sweep.fractions.filter((fraction) => fraction === 0).length;
        mono(c, remaining + ' left', readEndX + 20, y + 34, 30, C.orange);
      }
    }
  }
  mark(c, deadlineX, y0 - 18, railBottom - y0 + 18);
  if (test && !atDeadline) mark(c, sx + time * scale, y0 - 18, railBottom - y0 + 18, C.ink);
  if (test) {
    mono(c, 'Read clock  ' + Math.floor(time) + ' ms', 103, 777, 32);
    mono(c, 'Weights', sx, 777, 32, C.blue);
    mono(c, 'Current histories', 955, 777, 32, C.sea);
  } else {
    const perRequest = point(1);
    mono(c, `Per request   ${perRequest.res} GiB reserved, ${perRequest.kv} GiB live`, 103, 777, 30, C.dim);
    mono(
      c,
      `${weights} GiB shared weight read at ${hardware.bandwidth / GiB} GiB/s`,
      993, 777, 30, C.blue,
    );
  }
  return { time, win, memory };
}
export function decision(c, k) {
  const b = bidx(k);
  if (b === 2) {
    base(c, k, 'GPU-only cost', 'What does one billed hour buy?');
    label(
      c,
      'Batch ' +
        chosen.b +
        '   ·   ' +
        chosen.ms +
        ' ms/step   ·   sustained, quality-qualified output',
      101,
      302,
    );
    const rate = chosen.tps;
    const hour = cue(k, 2, 'for a full billed hour', 1.3);
    const minutes = Math.floor(60 * hour);
    for (let i = 0; i < 60; i++) {
      const x = 105 + i * 27;
      if (i < minutes) kv(c, x, 407, 24, 107, i);
      else rect(c, x, 407, 24, 107, C.bare, C.rule, 1);
    }
    bracket(c, 105, 105 + 60 * 27 - 3, 549, '60 minutes at ' + fmt(rate) + ' useful tokens/s');
    if (cue(k, 2, 'Two dollars')) {
      big(c, '$2.00', 107, 724, 99, C.blue);
      mono(c, '÷', 458, 706, 62);
      big(c, fmt(rate * 3600), 571, 720, 86, C.sea);
      txt(c, 'useful tokens', 1060, 712, 39, C.dim);
    } else
      mono(
        c,
        minutes +
          ' min  ×  60 s/min  ×  ' +
          fmt(rate) +
          ' tokens/s  =  ' +
          fmt(minutes * 60 * rate) +
          ' tokens',
        107,
        721,
        39,
      );
    foot(
      c,
      cue(k, 2, 'about a dollar')
        ? '$' +
            dollars(rate, 2).toFixed(2) +
            ' per million useful output tokens at this sustained rate.'
        : 'Count output over the entire billed interval, including idle periods.',
    );
    return;
  }
  base(c, k, 'Admission and latency', 'Which listed batch is largest within both limits?');
  const { time, win, memory } = candidatesGrid(c, k);
  let note = memory
    ? 'Batch 24 fits in memory. How many streams can finish their reads by the deadline?'
    : 'Test the future reservation and time the current read.';
  if (b === 1) {
    if (time < decodeDeadline)
      note = 'Each row reads the shared weights once, then one history at a time.';
    else if (time === decodeDeadline)
      note = 'At the deadline, outlined histories are still waiting to be read.';
    else
      note = 'The read continues past the deadline even though the batch fits in memory.';
  }
  if (win) note = 'Select batch ' + chosen.b + '. Its last history finishes at the deadline.';
  foot(c, note);
}
const exampleTimes = [120, 150, 180, 240];
export function finalTrial(c, k) {
  const b = bidx(k);
  if (b === 3) {
    const select = cue(k, 3, 'Take thirty-two'),
      r = select ? winner : practice[2];
    base(c, k, 'Admission decision', 'Which batch belongs in the load test?');
    mono(c, 'Batch ' + r.b + '    ·    8 GiB weights    ·    400 GiB/s', 104, 308, 38);
    const x = 518,
      y = 419,
      w = 979;
    txt(c, 'Reservation', 107, y + 49, 43);
    rect(c, x, y, w, 78, C.white, C.rule);
    hatch(c, x, y, (w * r.reserved) / 20, 78, C.mint, '#88a990', 18);
    mono(c, r.reserved + ' GiB', x + 22, y + 51, 37);
    mark(c, x + w, y - 17, 108);
    mono(c, '20 GiB pool', x + w + 24, y + 49, 29, C.orange);
    txt(c, 'Read time', 107, y + 227, 43);
    const unit = w / 40,
      wy = y + 177;
    rect(c, x, wy, w, 78, C.white, C.rule);
    weight(c, x, wy, 20 * unit, 78);
    kv(c, x + 20 * unit, wy, (r.ms - 20) * unit, 78);
    mid(c, 'Weights', x + 10 * unit, wy + 52, 37, C.white);
    mid(c, r.reads + ' GiB live KV', x + (20 + (r.ms - 20) / 2) * unit, wy + 39, 32, C.white);
    mark(c, x + w, wy - 17, 110);
    mono(c, '40 ms deadline', x + w, wy + 145, 28, C.orange, 'center');
    mono(c, r.ms + ' ms total', x, wy + 145, 38, r.pass ? C.sea : C.orange);
    foot(
      c,
      select
        ? 'Take batch 32 to the load test. Measure token gaps and useful output over the billed interval.'
        : 'Five GiB remain free at batch 48. Its modeled read still runs ten milliseconds late.',
    );
    return;
  }
  if (b === 2) {
    const start = 130,
      scale = 6.25,
      y = 471;
    base(c, k, 'Load-test evidence', 'What would a user actually wait for?');
    label(c, 'Illustrative delivery trace  ·  one request, four tokens', 100, 304);
    line(c, start, y, start + 245 * scale, y, C.rule, 4);
    mark(c, start, y - 55, 100, C.blue);
    mono(c, 'Arrival', start, y + 98, 30, C.blue);
    const seen = cue(k, 2, 'and sixty milliseconds')
      ? 4
      : cue(k, 2, 'thirty and sixty')
        ? 3
        : cue(k, 2, 'gaps last thirty')
          ? 2
          : cue(k, 2, 'first token arrives')
            ? 1
            : 0;
    for (let i = 0; i < seen; i++) {
      const x = start + exampleTimes[i] * scale;
      mark(c, x, y - 46, 92, i === 3 ? C.orange : C.sea);
      mono(c, 'T' + (i + 1), x, y - 75, 31, C.ink, 'center');
      mono(c, exampleTimes[i] + ' ms', x, y + 97, 28, C.ink, 'center');
      if (i > 0)
        bracket(
          c,
          start + exampleTimes[i - 1] * scale + 5,
          x - 5,
          650,
          exampleTimes[i] - exampleTimes[i - 1] + ' ms',
        );
    }
    if (seen)
      bracket(
        c,
        start,
        start + exampleTimes[0] * scale - 4,
        650,
        'First token  ·  ' + exampleTimes[0] + ' ms',
      );
    const average = (exampleTimes.at(-1) - exampleTimes[0]) / (exampleTimes.length - 1);
    if (cue(k, 2, 'The mean is forty'))
      mono(
        c,
        'Mean gap  ' +
          average +
          ' ms     /     Longest gap  ' +
          (exampleTimes[3] - exampleTimes[2]) +
          ' ms',
        109,
        776,
        37,
        C.blue,
      );
    foot(c, 'Keep rejected and cancelled requests in the offered-workload report.');
    return;
  }
  base(c, k, 'Independent trial', 'What’s the largest listed batch that fits and finishes by 40 ms?');
  label(c, '20 GiB pool   ·   8 GiB weight read   ·   400 GiB/s   ·   40 ms target', 100, 300);
  const mem = cue(k, 1, 'Use the longer'),
    t16 = cue(k, 1, 'Sixteen streams'),
    t32 = cue(k, 1, 'Thirty-two take'),
    miss = cue(k, 1, 'Forty-eight and sixty-four'),
    choose = cue(k, 1, 'Choose thirty-two');
  label(c, 'Batch', 106, 380);
  label(c, 'Reserve 0.3125 GiB per stream', 315, 380);
  label(c, 'Read 0.25 GiB per stream', 1050, 380);
  for (let i = 0; i < practice.length; i++) {
    const r = practice[i],
      y = 430 + i * 80,
      known = [t16, t32, miss, miss][i];
    if (choose && r === winner) rect(c, 91, y - 13, 1725, 75, '#cee4d5');
    mono(c, r.b, 118, y + 37, 39);
    rect(c, 315, y, 507, 46, C.white, C.rule);
    if (mem) {
      hatch(c, 315, y, (507 * r.reserved) / 20, 46, C.mint, '#7faa98', 15);
      mono(c, r.reserved + ' GiB', 327, y + 33, 29);
    }
    line(c, 822, y - 7, 822, y + 53, C.ink, 3);
    rect(c, 1050, y, 570, 46, C.white, C.rule);
    if (known) {
      weight(c, 1050, y, 20 * 9.5, 46);
      kv(c, 1050 + 190, y, (r.ms - 20) * 9.5, 46, i);
      mono(c, r.ms + ' ms', 1654, y + 33, 32, r.pass ? C.sea : C.orange);
    }
    line(c, 1050 + trial.deadline * 9.5, y - 8, 1050 + trial.deadline * 9.5, y + 52, C.orange, 4);
  }
  foot(
    c,
    choose
      ? 'Batch ' +
          winner.b +
          '   ·   ' +
          winner.b +
          ' tokens ÷ 0.040 s = ' +
          winner.tps +
          ' tokens/s'
      : 'First test the reservation. Then test the weight and current-history read.',
  );
}
