import assert from 'node:assert/strict';
import {
  baselineCases,
  newPhrases,
  trainingCases,
} from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';
import {
  exactRoute,
  ruleGrowthState,
  fitWordCounts,
  scoreWords,
} from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';
import {
  C,
  background,
  cap,
  chip,
  circle,
  cue,
  heading,
  housing,
  line,
  mono,
  rect,
  result,
  tape,
  text,
} from './studio.mjs';

const key = 'timeout',
  queues = ['latency', 'quality', 'access'];
const freshRows = newPhrases.map((r, i) =>
  i === 1 ? { ...r, text: 'response used unsupported claim' } : r,
);
const readable = (s) => s.replaceAll('_', ' ');
export function scan(report, progress) {
  const match = report.indexOf(key);
  const last = match >= 0 ? match : report.length - key.length;
  const position = Math.floor(progress * last);
  return {
    position,
    window: report.slice(position, position + key.length),
    route: progress >= 1 ? exactRoute(report, [key]) : null,
  };
}

export function opening(g, k) {
  const i = k.beat.beatIndex;
  const two = cue(k, 2, 'Install a second head', 0.7);
  const parallel = i >= 2;
  let a = cue(k, 1, 'Start the scan', 2.6),
    b = cue(k, 1, 'On the next report', 3.4);
  if (parallel) {
    const both = cue(k, 2, 'Both workers', 3.6);
    a = both;
    b = i === 2 ? both * 0.92 : 0.92 + 0.08 * cue(k, 3, 'Manual review again', 0.65);
  }
  background(g);
  heading(g, 'Incident dispatch', 'Which report reaches latency?');
  housing(g, 50, 158, 1100, 372);
  cap(g, 'Report feed', 85, 202, C.mist);
  cap(g, 'Queue outlet', 863, 202, C.mist);
  const reports = baselineCases.slice(0, 2);
  const step = 24.2;
  reports.forEach(({ text: report }, j) => {
    const y = 229 + j * 148,
      value = scan(report, j ? b : a),
      showHead = parallel ? !j || two > 0 : j ? b > 0 : b === 0;
    tape(g, 85, y, 720, 109);
    const x = 111;
    for (let h = 0; h < report.length; h++)
      mono(g, report[h], x + h * step, y + 53, 29, C.ink, 'center');
    if (showHead) {
      const hx = x + value.position * step - step * 0.54;
      rect(g, hx, y + 21, 7 * step, 38, '#467d8027', 3, C.teal);
      rect(g, hx, y + 60, 7 * step, 31, C.teal, 3);
      for (let h = 0; h < key.length; h++)
        mono(g, key[h], x + (value.position + h) * step, y + 83, 24, C.white, 'center');
      line(
        g,
        [
          [hx - 2, y + 25],
          [hx - 2, y + 88],
        ],
        C.brass,
        4,
      );
    }
    rect(g, 837, y + 15, 276, 81, C.deep, 6, '#4c6868');
    const finished = value.route;
    circle(g, 859, y + 56, 6, finished ? (finished === 'latency' ? C.mint : C.brass) : C.grid);
    text(
      g,
      finished ? readable(finished) : 'awaiting scan',
      879,
      y + 65,
      28,
      finished ? C.white : C.mist,
      'Serif',
    );
  });
  cap(g, 'Work assigned', 740, 43);
  text(
    g,
    parallel && two > 0 ? '2 workers  /  1 round' : '1 worker  /  2 reports',
    740,
    84,
    31,
    C.ink,
    'Mono',
  );
  text(
    g,
    parallel ? 'Same key in each head' : 'Scan until a match or the last window',
    740,
    121,
    25,
    C.teal,
    'Serif',
  );
}
function rack(g, rules, x = 65, y = 191) {
  cap(g, 'Installed keys', x, y);
  rules.forEach((r, j) => {
    const yy = y + 19 + j * 43;
    rect(g, x, yy, 219, 35, j < 3 ? C.navy : C.teal, 4);
    circle(g, x + 11, yy + 17, 3.5, C.brass);
    mono(g, r, x + 23, yy + 24, 18, C.white, 'left', 108);
    text(g, exactRoute(r, [r]), x + 209, yy + 24, 16, C.paper, 'Sans', 500, 'right');
  });
}
function batch(g, rows, rules, processed, focus = -1) {
  const x = 307,
    w = 833;
  cap(g, 'Incoming report', x + 22, 190);
  cap(g, 'Reviewed', x + 430, 190);
  cap(g, 'Router output', x + 607, 190);
  rows.forEach(({ text: msg, expected }, j) => {
    const y = 210 + j * 52;
    const key = rules.find((key) => msg.toLowerCase().includes(key));
    rect(g, x + 2, y + 2, w, 44, '#182e3219', 4);
    rect(g, x, y, w, 44, j === focus ? '#ffe2a1' : C.paper, 4);
    const rx = x + 22;
    mono(g, msg, rx, y + 29, 20, C.ink, 'left', 382);
    if (j < processed && key) {
      g.font = '500 20px "Lesson Mono"';
      const scale = Math.min(1, 382 / g.measureText(msg).width);
      const start = msg.toLowerCase().indexOf(key);
      const left = rx + g.measureText(msg.slice(0, start)).width * scale;
      line(
        g,
        [
          [left, y + 35],
          [left + g.measureText(key).width * scale, y + 35],
        ],
        C.teal,
        3,
      );
    }
    text(g, expected, x + 430, y + 30, 22, C.indigo);
    const dest = exactRoute(msg, rules);
    if (j < processed) {
      circle(g, x + 600, y + 23, 4, dest === expected ? C.teal : C.rust);
      text(g, readable(dest), x + 615, y + 30, 22, dest === expected ? C.teal : C.rust);
    } else
      line(
        g,
        [
          [x + 615, y + 24],
          [x + 693, y + 24],
        ],
        '#bec5b4',
        2,
        [3, 6],
      );
  });
}
export function rulebook(g, k) {
  const i = k.beat.beatIndex,
    rules = ruleGrowthState(0).rules;
  const count = Math.floor(6 * cue(k, 1, 'Run the batch', 4));
  const installed =
    1 +
    Number(cue(k, 0, 'Citation sends', 0.15) > 0) +
    Number(cue(k, 0, 'Password sends', 0.15) > 0);
  background(g);
  heading(g, 'Incident dispatch', 'Three literal checks, six reports');
  rack(g, rules.slice(0, installed));
  batch(g, baselineCases, rules, count);
  if (count > 0) {
    const correct = baselineCases
      .slice(0, count)
      .filter((r) => exactRoute(r.text, rules) === r.expected).length;
    result(g, 'Correct queue assignments', correct + ' of ' + count + ' processed', 310, 582);
  } else text(g, 'No match goes to manual review.', 310, 596, 28, C.teal, 'Serif');
}
export function patches(g, k) {
  const i = k.beat.beatIndex;
  const steps = [
    [0, 'Add the key tokens'],
    [0, 'Add cites'],
    [1, 'Now add stale source'],
    [1, 'Add authenticate'],
  ];
  const edits = steps.filter(([b, s]) => cue(k, b, s, 0.4) === 1).length;
  const { rules, score } = ruleGrowthState(edits / 4),
    fresh = i >= 2;
  const tested = fresh
    ? Math.floor(newPhrases.length * cue(k, 3, 'All three', 1))
    : baselineCases.length;
  background(g);
  heading(
    g,
    'Dispatch maintenance',
    fresh ? 'Try the keys on tomorrow’s wording' : 'Change one key at a time',
  );
  rack(g, rules);
  batch(g, fresh ? freshRows : baselineCases, rules, tested, fresh ? -1 : [-1, 1, 2, 3, 5][edits]);
  const resultText = fresh
    ? tested === 3
      ? '0 of 3 fresh reports'
      : 'Which new reports contain a key?'
    : score + ' of 6 reviewed reports';
  result(g, fresh ? 'Fresh batch' : 'Correct assignments', resultText, 310, fresh ? 480 : 584);
  if (fresh) text(g, 'TTFT = time to first token', 310, 587, 23, C.indigo, 'Mono');
}
const correction = { text: 'the site loads slowly', label: 'latency' };
const counts0 = fitWordCounts(trainingCases);
const counts1 = fitWordCounts([...trainingCases, correction]);
const cases = [
  'unsupported citation answer',
  'unsupported citation answer',
  'tokens arrive slowly',
  correction.text,
  correction.text,
  'pages arrive slowly',
  'pages arrive slowly',
  'timeout password',
];
export function learner(g, k) {
  const i = k.beat.beatIndex;
  const alternate = i === 6 && cue(k, 6, 'A phrase like', 0.4) === 1;
  const report = alternate ? 'responses take ages' : cases[i],
    words = report.split(' ');
  const updated = cue(k, 4, 'fit the counts again', 0.5) === 1,
    counts = updated ? counts1 : counts0;
  let n = 0;
  if (i === 1)
    n = ['Unsupported contributes', 'Citation adds', 'Answer adds'].filter(
      (p) => k.reveal(p, 0.45) === 1,
    ).length;
  else if (i === 2) n = Math.floor(words.length * cue(k, 2, 'They share one word', 1));
  else if (i === 3) n = Math.floor(words.length * cue(k, 3, 'None of its words', 1.1));
  else if (i === 4)
    n = updated ? Math.floor(words.length * cue(k, 4, 'same four words', 1.1)) : words.length;
  else if (i === 6)
    n = alternate ? words.length : Math.floor(words.length * cue(k, 6, 'Slowly supplies', 1));
  else if (i === 7) n = Math.floor(words.length * cue(k, 7, 'Each word', 1.1));
  const scoring = scoreWords(words.slice(0, n).join(' '), counts);
  background(g);
  heading(
    g,
    'Training from reviewed tickets',
    i < 2
      ? 'Where does a word get its vote?'
      : i === 4
        ? 'Fit the reviewed correction'
        : i === 5 || i === 6
          ? 'Try the updated counts on fresh wording'
          : 'Count the evidence for each queue',
  );
  const ref =
    i < 2
      ? 'wrong citation unsupported answer'
      : i === 2
        ? 'ttft spike tokens'
        : i === 7
          ? 'decode latency timeout   /   password login access'
          : updated
            ? correction.text
            : '6 labeled reports';
  cap(g, updated ? 'Training file  /  7 reports' : 'Training file  /  6 reports', 61, 175);
  tape(g, 58, 190, 1080, 65);
  mono(g, ref, 83, 232, 24, C.ink, 'left', 770);
  if (i < 3 || (updated && i < 7))
    text(g, i < 2 ? 'quality' : 'latency', 1090, 232, 25, C.teal, 'Sans', 700, 'right');
  cap(g, 'Incoming words', 61, 315);
  let wx = 59;
  for (let j = 0; j < words.length; j++) {
    const word = words[j],
      w = Math.max(76, word.length * 17 + 24);
    const voting = queues.some((q) => counts[q][word]);
    chip(
      g,
      word,
      wx,
      334,
      w,
      j < n && voting ? C.teal : C.paper,
      j < n && voting ? C.white : C.ink,
      48,
    );
    wx += w + 9;
  }
  for (let j = 0; j < queues.length; j++) {
    const q = queues[j],
      v = scoring.scores[q],
      x = 60 + j * 365;
    cap(g, q, x, 443);
    line(
      g,
      [
        [x, 482],
        [x + 237, 482],
      ],
      '#95aa9e',
      2,
    );
    for (let a = 0; a < 4; a++) {
      circle(g, x + 22 + a * 57, 482, 18, a < v ? C.teal : '#bdcbbd');
      if (a < v) mono(g, '1', x + 22 + a * 57, 488, 16, C.white, 'center');
    }
    mono(g, v, x + 255, 495, 37, C.ink);
  }
  if (n === words.length)
    result(
      g,
      'Router output',
      readable(scoring.route),
      60,
      557,
      scoring.route === 'manual_review' ? C.rust : C.teal,
    );
  else
    text(
      g,
      i === 0
        ? 'Which words appear in the labeled report?'
        : i === 5
          ? 'Which word can carry the correction over?'
          : 'Reading the word counts',
      60,
      609,
      31,
      C.ink,
      'Serif',
    );
}
export function checkDispatch() {
  assert.equal(key.length, 7);
  assert.deepEqual(
    baselineCases.slice(0, 2).map(({ text }) => scan(text, 1).route),
    ['latency', 'manual_review'],
  );
  assert.equal(scan(baselineCases[0].text, 1).window, key);
  assert.equal(scan(baselineCases[1].text, 0.92).route, null);
  assert.deepEqual(
    [0, 0.25, 0.5, 0.75, 1].map((p) => ruleGrowthState(p).score),
    [3, 4, 5, 5, 6],
  );
  assert(freshRows.every((r) => exactRoute(r.text, ruleGrowthState(1).rules) === 'manual_review'));
  assert.equal(scoreWords(cases[0], counts0).scores.quality, 3);
  assert.equal(scoreWords(correction.text, counts0).route, 'manual_review');
  assert.equal(scoreWords(correction.text, counts1).scores.latency, 4);
  assert.equal(scoreWords('pages arrive slowly', counts1).scores.latency, 1);
  assert.equal(scoreWords('responses take ages', counts1).route, 'manual_review');
  assert.deepEqual(scoreWords('timeout password', counts1), {
    scores: { latency: 1, quality: 0, access: 1 },
    route: 'manual_review',
  });
}
