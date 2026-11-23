import assert from 'node:assert/strict';
import { handoffTiming, highestPassingLoad } from '../../../films/continuous-batching/model.mjs';
import {
  color as c,
  text,
  center,
  box,
  line,
  dot,
  label,
  base,
  plate,
  flap,
  cell,
  cue,
  heading,
  note,
} from './art.mjs';

const arrivals = [1000, 1200, 1700, 1900],
  words = ['A', 'seat', 'just', 'opened.'];
const gaps = arrivals.slice(1).map((t, i) => t - arrivals[i]);
const meanGap = gaps.reduce((a, b) => a + b) / gaps.length;
const sec = (ms) => (ms / 1000).toFixed(2) + ' s';
const received = (t) => words.filter((_, i) => arrivals[i] <= t);
export function latency(g, k) {
  const elapsedMs = k.beat.beatIndex
    ? 2000
    : Math.min(2000, Math.max(0, Math.round((k.elapsed - k.speechDuration) * 1000)));
  const receipt = received(elapsedMs);
  const mean = cue(k, 2, 'The mean gap was');
  const second = cue(k, 3, 'Someone else arrived');
  const x = (t) => 155 + t * 0.8;
  base(g, 'Client playback  /  recorded arrival times', 'Which word broke the rhythm?', true);
  heading(g, 'RECEIVED TEXT', 'CLIENT CLOCK   ' + sec(elapsedMs), 284, true);
  const shown = receipt.join(' ');
  text(g, shown, 100, 395, 99, c.white, { font: 'Lesson Serif' });
  const width = g.measureText(shown).width;
  box(g, 112 + width, 352, 8, 85, c.amber, 4);
  line(g, x(0), 591, x(2000), 591, c.metal, 7);
  line(g, x(0), 591, x(elapsedMs), 591, c.mint, 7);
  dot(g, x(0), 591, 10, c.mint);
  center(g, 'send', x(0), 541, 32, c.mint);
  [0, ...arrivals.slice(0, receipt.length)].forEach((t) =>
    center(g, sec(t), x(t), 655, 32, c.white, { font: 'Lesson Mono' }),
  );
  receipt.forEach((word, i) => {
    dot(g, x(arrivals[i]), 591, 12, c.amber);
    center(g, word, x(arrivals[i]), 540, 32, c.white);
  });
  if (!second && cue(k, 1, 'Read the next three gaps')) {
    gaps.forEach((d, i) => {
      const l = x(arrivals[i]),
        r = x(arrivals[i + 1]);
      const ink = i === 1 && cue(k, 2, 'Just came') ? c.amber : c.mint;
      line(g, l + 3, 735, r - 3, 735, ink, 3);
      line(g, l, 723, l, 746, ink);
      line(g, r, 723, r, 746, ink);
      center(g, sec(d), (l + r) / 2, 790, 30, ink, { font: 'Lesson Mono' });
    });
  }
  if (second) {
    const y = 776;
    line(g, x(0), y, x(2000), y, c.amber, 3);
    dot(g, x(0), y, 10, c.amber);
    dot(g, x(2000), y, 10, c.amber);
    text(g, 'Second client  /  waiting for token one', x(0), y - 48, 35, c.amber);
    text(g, '2.00 s waiting', x(2000), y + 45, 34, c.amber, { align: 'right' });
  } else if (mean)
    text(g, 'Mean gap   ' + sec(meanGap), 104, 776, 44, c.mint, { font: 'Lesson Serif' });
  note(
    g,
    second
      ? 'A second client still waiting at 2.00 s has contributed zero token gaps.'
      : cue(k, 2, 'this reply misses')
        ? 'Longest gap  0.50 s     ·     Per-gap limit  0.40 s     ·     Missed'
        : mean
          ? 'Three gaps cover 0.90 s from first token to last.'
          : k.beat.beatIndex === 0
            ? 'Replay at recorded speed.'
            : 'First token at 1.00 s. Read the distance between consecutive arrivals.',
    c.amber,
    true,
  );
}

const durations = { prefillQueue: 20, prefill: 60, handoff: 40, decodeQueue: 15, nextDecode: 10 };
const h = handoffTiming(durations);
export function handoff(g, k) {
  if (k.beat.beatIndex === 0) {
    const transferred = cue(k, 0, 'hand over compatible prompt state', 0.9);
    const token = cue(k, 0, 'first sampled token');
    const used = cue(k, 0, 'decoder consumes that token');
    base(g, 'Disaggregated serving  /  state transfer', 'What must travel to the decoder?');
    for (const [i, title] of ['Prefill worker', 'Decode worker'].entries()) {
      const x = 90 + i * 950;
      plate(g, x, 351, 780, 399);
      text(g, title, x + 49, 414, 54, c.white, { font: 'Lesson Serif' });
      label(g, 'PROMPT KV  /  POSITIONS 0–2', x + 50, 518, c.mint);
      [101, 102, 103].forEach((id, j) =>
        cell(
          g,
          !i || transferred >= (j + 1) / 3 ? id : null,
          x + 55 + j * 214,
          560,
          190,
          91,
          c.metal,
        ),
      );
      if (!i || token)
        text(
          g,
          i && used ? '201 consumed → token two' : 'Sampled token   201',
          x + 56,
          704,
          35,
          c.amber,
        );
    }
    center(g, '→', 956, 534, 86, c.teal);
    note(g, 'Check model, adapter, positions and cache layout on both workers.');
    return;
  }
  base(
    g,
    'Serial handoff  /  milliseconds from client send',
    'Can either delivery policy meet both limits?',
  );
  heading(g, 'FIRST TOKEN ≤ 90 ms', 'FIRST GAP ≤ 30 ms');
  const x = (t) => 330 + t * 9.55;
  const stages = [
    ['Prefill queue', durations.prefillQueue, '#536960'],
    ['Prefill', durations.prefill, c.teal],
    ['Handoff', durations.handoff, c.gold],
    ['Queue', durations.decodeQueue, '#697575'],
    ['Decode', durations.nextDecode, c.board],
  ];
  let t = 0;
  for (const [name, d, fill] of stages) {
    box(g, x(t), 365, d * 9.55 - 2, 117, fill, 5);
    center(g, name, x(t + d / 2), 398, name === 'Decode' ? 23 : 29, c.white);
    center(g, d, x(t + d / 2), 451, 34, c.white, { font: 'Lesson Mono' });
    t += d;
  }
  const early = cue(k, 2, 'Early delivery gives'),
    buffered = cue(k, 2, 'Buffering gives');
  for (const [row, show, delivery] of [
    [0, early, h.early],
    [1, buffered, h.buffered],
  ]) {
    const y = 599 + row * 173;
    text(g, row ? 'Buffered' : 'Early', 90, y, 48, c.ink, { font: 'Lesson Serif' });
    line(g, x(0), y, x(h.second), y, c.rule, 3);
    if (show) {
      const l = x(delivery.ttft),
        r = x(h.second);
      line(g, l, y, r, y, c.teal, 9);
      dot(g, l, y, 11, c.gold);
      dot(g, r, y, 11, c.teal);
      text(g, '1st   ' + delivery.ttft, l - 9, y - 46, 33, c.gold, {
        align: 'right',
        font: 'Lesson Mono',
      });
      text(g, '2nd   ' + h.second, r + 10, y - 46, 33, c.teal, {
        align: 'center',
        font: 'Lesson Mono',
      });
      text(g, 'gap   ' + delivery.gap + ' ms', r, y + 54, 36, c.ink, { align: 'right' });
    }
  }
  note(
    g,
    cue(k, 2, 'Early misses')
      ? 'Early misses the gap limit. Buffered misses the first-token limit.'
      : 'Prefill supplies token one. Decode is ready after handoff and its queue.',
  );
}

const replies = [[120, 25], [450, 22], [180, 42], [190, 27], null];
const firstLimit = 300,
  meanLimit = 30,
  windowSeconds = 10;
const passes = (pair) => pair !== null && pair[0] <= firstLimit && pair[1] <= meanLimit;
const completed = replies.filter(Boolean).length,
  compliant = replies.filter(passes).length;
const streamTimes = [0, 50, 100, 300, 350];
const streamGaps = streamTimes.slice(1).map((t, i) => t - streamTimes[i]);
const underLimit = streamGaps.filter((d) => d <= 100).length;
const rank99 = Math.ceil(0.99 * streamGaps.length);
const percentile99 = [...streamGaps].sort((a, b) => a - b)[rank99 - 1];
export function windowScene(g, k) {
  if (cue(k, 2, 'Here a five-token stream')) {
    const fraction = cue(k, 2, 'Three of the four');
    const average = cue(k, 2, 'Its mean is below');
    const tail = cue(k, 2, 'ninety-ninth percentile is two hundred');
    base(
      g,
      'A separate stream  /  milliseconds since token one',
      'How many gaps stayed within 100 ms?',
    );
    heading(g, 'RECEIVED TOKEN TIMES', 'GAP LIMIT  100 ms');
    const x = (t) => 217 + 4.15 * t;
    line(g, x(0), 451, x(350), 451, c.muted, 4);
    streamTimes.forEach((t, i) => {
      dot(g, x(t), 451, 14, c.board);
      center(g, t + ' ms', x(t), 393, 38, c.ink);
      if (i > 0) {
        const d = streamGaps[i - 1],
          ink = fraction && d > 100 ? c.rust : c.teal;
        const left = x(streamTimes[i - 1]);
        line(g, left + 7, 565, x(t) - 7, 565, ink, 5);
        center(g, d + ' ms', 0.5 * (x(t) + left), 620, 39, ink);
      }
    });
    if (fraction)
      text(g, underLimit + ' of 4 within the limit', 98, 760, 48, c.teal, { font: 'Lesson Serif' });
    if (average)
      text(g, 'Mean   ' + streamTimes.at(-1) / streamGaps.length + ' ms', 890, 760, 44, c.ink);
    if (tail) text(g, 'p99   ' + percentile99 + ' ms', 1390, 760, 44, c.rust);
    note(
      g,
      tail
        ? 'Nearest-rank p99 selects the fourth of four sorted gaps.'
        : 'Five received tokens give four intervals.',
    );
    return;
  }
  const answer = cue(k, 1, 'Replies one and four pass');
  const counts = cue(k, 1, 'Four completions in ten seconds');
  base(g, 'One arrival window  /  ten seconds', 'Who kept both latency promises?');
  const x = [106, 485, 916, 1422];
  ['REPLY', 'FIRST TOKEN ≤ 300 ms', 'MEAN GAP ≤ 30 ms', 'JOINT RESULT'].forEach((v, i) =>
    label(g, v, x[i], 302),
  );
  replies.forEach((pair, i) => {
    const y = 387 + i * 98;
    line(g, 96, y + 47, 1819, y + 47, c.rule, 2);
    text(g, 'R' + (i + 1), x[0], y, 44);
    if (pair) {
      text(g, pair[0] + ' ms', x[1], y, 44, answer && pair[0] > firstLimit ? c.rust : c.ink);
      text(g, pair[1] + ' ms', x[2], y, 44, answer && pair[1] > meanLimit ? c.rust : c.ink);
    } else text(g, 'Expired in queue', x[1], y, 40, c.rust);
    if (answer)
      text(g, passes(pair) ? 'Met both' : 'Missed', x[3], y, 42, passes(pair) ? c.teal : c.rust, {
        weight: 700,
      });
  });
  note(
    g,
    counts
      ? `${(completed / windowSeconds).toFixed(2)} completed/s    ·    ${(compliant / windowSeconds).toFixed(2)} compliant/s    ·    ${compliant}/${replies.length} offered = ${(100 * compliant) / replies.length}%`
      : 'Every offered arrival stays in the denominator.',
  );
}

const sweep = [
  { rate: 2, attainment: 0.95 },
  { rate: 3, attainment: 0.92 },
  { rate: 4, attainment: 0.84 },
];
const threshold = 0.9,
  devices = 2,
  best = highestPassingLoad(sweep, threshold, devices);
export function loadScene(g, k) {
  if (k.beat.beatIndex === 0) {
    base(
      g,
      'Replay conditions  /  one illustrative client',
      'What happens when a reply takes longer?',
    );
    heading(g, 'SENDS ON THE CLIENT CLOCK', '400 ms PER RESPONSE');
    const x = (t) => 428 + t * 1.53;
    for (const [row, times, title] of [
      [0, [0, 100, 200, 300, 400, 500, 600, 700, 800], 'Open loop'],
      [1, [0, 400, 800], 'Closed loop'],
    ]) {
      const y = 456 + row * 247;
      text(g, title, 87, y, 51, c.ink, { font: 'Lesson Serif' });
      line(g, x(0), y, x(800), y, c.rule, 5);
      if (!row || cue(k, 0, 'A client that waits'))
        times.forEach((t) => {
          box(g, x(t) - 8, y - 43, 16, 84, row ? c.gold : c.teal, 6);
          center(g, t, x(t), y + 83, 30, c.muted, { font: 'Lesson Mono' });
        });
    }
    note(g, 'Keep the arrival timestamps and realized lengths for each scheduler comparison.');
    return;
  }
  const result = cue(k, 2, 'Three requests per second is');
  base(g, 'Offered load sweep  /  two GPUs', 'What is the highest tested rate that meets the target?');
  heading(g, 'OFFERED RATE', 'FRACTION OF ALL ARRIVALS MEETING BOTH LIMITS');
  const x = (a) => 530 + (a - 0.8) * 7600;
  line(g, x(threshold), 349, x(threshold), 822, c.gold, 5);
  center(g, '90% required', x(threshold), 335, 29, c.gold, { font: 'Lesson Mono' });
  sweep.forEach((r, i) => {
    const y = 450 + i * 151;
    text(g, r.rate + ' req/s', 98, y, 54, c.ink, { font: 'Lesson Serif' });
    line(g, x(0.8), y, x(0.97), y, c.rule, 3);
    const fill = r.attainment >= threshold ? c.teal : c.rust;
    dot(g, x(r.attainment), y, 17, fill);
    center(g, Math.round(r.attainment * 100) + '%', x(r.attainment), y - 50, 38, fill, {
      weight: 600,
    });
    if (result && r.rate === best.rate) {
      box(g, 94, y + 43, 186, 5, fill, 2);
      text(g, 'selected', 302, y, 33, fill);
    }
  });
  note(
    g,
    result
      ? `${best.rate} req/s across ${devices} GPUs   ·   ${best.perGpu} req/s per GPU. Retest the boundary.`
      : 'Use measured rates. An untested value between two points has no observed attainment.',
  );
}
export function checkDelivery() {
  for (const [at, n] of [
    [999, 0],
    [1000, 1],
    [1199, 1],
    [1200, 2],
    [1450, 2],
    [1699, 2],
    [1700, 3],
    [1900, 4],
  ])
    assert.equal(received(at).length, n);
  assert.deepEqual(gaps, [200, 500, 200]);
  assert.equal(meanGap, 300);
  assert.deepEqual(
    [h.first, h.ready, h.second, h.early.gap, h.buffered.gap],
    [80, 135, 145, 65, 10],
  );
  assert([h.early, h.buffered].every((s) => s.ttft > 90 || s.gap > 30));
  assert.deepEqual(replies.map(passes), [true, false, false, true, false]);
  assert.deepEqual([streamGaps, underLimit, rank99, percentile99], [[50, 50, 200, 50], 3, 4, 200]);
  assert.deepEqual(
    [completed / windowSeconds, compliant / windowSeconds, compliant / replies.length],
    [0.4, 0.2, 0.4],
  );
  assert.deepEqual([best.rate, best.perGpu], [3, 1.5]);
  assert.deepEqual(sweep.filter((row) => row.attainment >= threshold).map((row) => row.rate), [2, 3]);
}
