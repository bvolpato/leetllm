import {
  soupSelectionFixture,
  passthroughFixture,
  precisionMergeExample,
} from '../../../films/model-merging/fixtures.mjs';
import { scoreReport } from '../../../films/model-merging/decisions.mjs';
import {
  ink,
  paper,
  muted,
  rule,
  code,
  math,
  chat,
  gold,
  colors,
  white,
  pink,
  dark,
  pale,
  mix,
  cue,
  text,
  mono,
  title,
  rect,
  box,
  line,
  dash,
  dot,
  arrow,
  heading,
  number,
  signed,
} from './drawing.mjs';
import { scalar } from './updates.mjs';
import { interpolation, endAngle } from './geometry.mjs';

export const vocabulary = [
  { model: 'Base', id: 417, token: 'return' },
  { model: 'Code', id: 92, token: 'return' },
  { model: 'Code', id: 417, token: '<fim_prefix>' },
];
export const targetTokens = [...new Set(vocabulary.map((r) => r.token))];
export const sourcesFor = (token) => vocabulary.filter((r) => r.token === token);
function tokens(c, k) {
  const union = cue(k, 1, 'compatible union keeps both strings'),
    prompt = k.beat.beatIndex === 2;
  title(
    c,
    'What does row 417 mean?',
    'The same lookup applies to input embeddings and output-head rows.',
  );
  heading(c, 'Source lookup', 101, 284);
  heading(c, 'Output vocabulary', 1136, 284);
  vocabulary.forEach(({ model, id, token }, i) => {
    const y = 367 + i * 141,
      col = model === 'Base' ? muted : code;
    box(c, 105, y, 687, 105, white, col, 8);
    text(c, model, 128, y + 50, 39, col, 'left', 'Serif');
    mono(c, id, 323, y + 53, 38, ink);
    mono(c, token, 458, y + 53, 38, col);
  });
  if (union)
    targetTokens.forEach((token, j) => {
      const yy = 407 + j * 248;
      for (const r of sourcesFor(token)) {
        const v = vocabulary.indexOf(r);
        arrow(
          c,
          808,
          416 + 141 * v,
          1113,
          yy + 14 * (v === 1),
          r.model === 'Base' ? muted : code,
          4,
        );
      }
      mono(c, token, 1144, yy, 53, ink);
      text(
        c,
        sourcesFor(token)
          .map((r) => r.model + ' ' + r.id)
          .join(' + '),
        1144,
        yy + 68,
        34,
        muted,
      );
    });
  else {
    const x = 1136;
    text(c, '417', x, 453, 111, gold, 'left', 'Serif');
    mono(c, 'return  or  <fim_prefix>?', x, 583, 36, ink);
  }
  if (prompt) {
    box(c, 104, 814, 1706, 153, dark, null, 8);
    mono(c, '<fim_prefix>def twice(x): <fim_suffix>  <fim_middle>', 141, 861, 37, white);
    text(
      c,
      'Reload the saved tokenizer and template. Check the special-token IDs and decoded output.',
      142,
      918,
      29,
      pale,
    );
  }
}
export const soupTrial = soupSelectionFixture(),
  splice = passthroughFixture();
function search(c, k) {
  const b = k.beat.beatIndex,
    B = cue(k, 3, 'Adding B lowers'),
    C = cue(k, 3, 'Try adding C'),
    reject = cue(k, 3, 'The error rises'),
    fresh = cue(k, 4, 'Run the chosen pair');
  const s = soupTrial,
    caseNames = fresh ? ['(1, 1)', '(−1, 1)'] : ['(1, 0)', '(0, 1)'];
  const idx = C ? 1 : B ? 0 : -1,
    step = s.steps[idx];
  const name = fresh ? 'Selected A + B' : C ? 'Trial A + B + C' : B ? 'Trial A + B' : 'Seed A';
  const pred = fresh ? s.untouchedPredictions : (step?.predictions ?? s.models[0]);
  const loss = fresh ? s.untouchedLoss : (step?.loss ?? s.seedLoss);
  title(
    c,
    fresh ? 'How does the selected soup travel?' : 'Does adding a checkpoint improve the soup?',
    fresh
      ? 'Fresh inputs   ·   same target of one on each case'
      : 'Linear model   ·   predict by taking the dot product of two weights with each input',
  );
  text(c, name, 101, 322, 61, ink, 'left', 'Serif');
  const col = fresh ? math : C ? code : chat;
  const X = (v) => 520 + v * 530;
  for (let i = 0; i < 2; i++) {
    const y = 476 + i * 173;
    mono(c, caseNames[i], 110, y, 45, ink);
    line(c, X(0), y, X(2.15), y, rule, 7);
    line(c, X(1), y - 32, X(1), y + 32, gold, 5);
    if (i === 0) text(c, 'target 1', X(1), y - 74, 33, gold, 'center');
    dot(c, X(pred[i]), y, 18, col, white, 3);
    mono(c, number(pred[i], 3), X(pred[i]), y + 52, 34, col, 'center');
  }
  mono(c, 'MSE   ' + loss.toFixed(4), 104, 843, 53, col);
  if (!fresh) {
    const weights = s.models.map(
      (m, i) => String.fromCharCode(65 + i) + '  [' + m.map((v) => v.toFixed(1)).join(', ') + ']',
    );
    mono(c, weights.join('       '), 105, 947, 32, muted);
  }
  if (fresh && cue(k, 4, 'sixty-four combinations'))
    text(c, '4 × 4 × 4 = 64 recipes', 972, 843, 45, ink);
  else if (fresh) text(c, 'Selection MSE   ' + s.steps[0].loss.toFixed(4), 972, 843, 44, muted);
  else if (B)
    text(
      c,
      C ? (reject ? 'Leave C out. Retain A + B.' : 'Compare with A + B.') : 'Retain A + B',
      992,
      845,
      45,
      ink,
    );
}
function layerSplice(c, k) {
  title(
    c,
    'Can these eight layers work together?',
    'Each layer takes two channels and returns two. Both probes should pass through unchanged.',
  );
  const p = cue(k, 5, 'Each B layer doubles', 1.25),
    second = cue(k, 6, 'other probe uses');
  const depth = Math.floor(p * 4);
  const x = (i) => 311 + i * 187;
  for (let i = 0; i < 8; i++) {
    const l = splice.layers[i],
      col = l.source === 'A' ? code : math,
      u = x(i);
    box(c, u - 62, 321, 125, 140, white, col, 8, 4);
    text(c, l.source + i, u, 371, 50, col, 'center', 'Serif');
    mono(c, '×' + l.gain[0] + '│×' + l.gain[1], u, 427, 28, col, 'center');
    if (i < 7) arrow(c, u + 67, 391, x(i + 1) - 68, 391, rule, 3);
  }
  if (cue(k, 5, 'follow the first probe')) {
    let signal = [...splice.probes[0].input];
    mono(c, '[1,0]', 87, 580, 39, code);
    for (let i = 0; i < 4 + depth; i++) {
      signal = signal.map((v, j) => v * splice.layers[i].gain[j]);
      mono(c, signal[0], x(i), 580, 54, i < 4 ? code : math, 'center');
    }
    if (depth === 4)
      text(c, 'First probe  [16, 0]     Target  [1, 0]', 106, 854, 49, pink, 'left', 'Serif');
  }
  if (second) {
    mono(c, '[0,1]', 87, 699, 39, chat);
    splice.layers.forEach((_, i) => mono(c, '1', x(i), 699, 54, chat, 'center'));
    text(c, 'Second probe  [0, 1]     Target  [0, 1]', 1000, 854, 44, chat, 'left', 'Serif');
  }
}
export function recipe(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) tokens(c, k);
  else if (b < 5) search(c, k);
  else layerSplice(c, k);
}
export const precision = precisionMergeExample();
function route(c, y, kind, history) {
  const f = precision,
    X = (v) => 548 + ((v - 1) / f.step) * 1095;
  heading(c, kind, 94, y - 10);
  line(c, X(1), y, X(1 + f.step), y, rule, 5);
  for (const v of [1, 1 + f.step]) line(c, X(v), y - 27, X(v), y + 27, muted, 4);
  mono(c, '1.000', X(1), y + 65, 32, muted, 'center');
  mono(c, '1.0078125', X(1 + f.step), y + 65, 32, muted, 'center');
  if (!history.length) return;
  const last = history.at(-1);
  history.forEach(({ v }, i) => {
    if (i < history.length - 1) dot(c, X(v), y, 11, paper, rule, 3);
  });
  if (history.length > 1) {
    const prev = history.at(-2);
    arrow(c, X(prev.v), y - 39, X(last.v), y - 39, last.color, 5);
  }
  dot(c, X(last.v), y, 16, last.color, white, 2);
  mono(c, last.label + ' ' + last.v.toFixed(3), X(last.v), y - 90, 35, last.color, 'center');
}
export function rounding(c, k) {
  const f = precision,
    b = k.beat.beatIndex;
  if (b >= 4) {
    title(
      c,
      'Trace the saved artifact',
      'Repeat one prompt under the same conditions to locate a failure.',
    );
    const probes = [
      ['Read', '1.002 → 1.000 on a BF16 read'],
      ['Tokenize', '417 → return or <fim_prefix>?'],
      ['Format', 'same prompt + saved chat template'],
      ['Decode', 'same settings on source and merge'],
    ];
    probes.forEach(([s, v], i) => {
      const y = 324 + i * 134;
      dot(c, 136, y, 13, i === 3 && b < 5 ? rule : chat);
      if (i < 3) line(c, 136, y + 13, 136, y + 119, rule);
      text(c, s, 200, y, 45, ink, 'left', 'Serif');
      mono(c, v, 563, y, 40, muted);
    });
    if (b === 5)
      text(c, 'After quantization, recalibrate and evaluate the serving copy.', 99, 912, 40, ink);
    return;
  }
  title(
    c,
    'When did the change disappear?',
    'Nearest BF16 ticks just above one   ·   spacing 1 / 128',
  );
  const initial = { v: f.specialist, label: 'specialist', color: code },
    half = { v: f.wide, label: 'halfway', color: math },
    saved = { v: f.roundedOutput, label: 'saved', color: chat };
  const input = cue(k, 0, 'one point zero zero two'),
    narrow = cue(k, 1, 'It lands on the base'),
    wide = cue(k, 2, 'Go halfway'),
    save = cue(k, 2, 'It rounds to one again');
  const first = input ? [initial] : [];
  if (narrow) first.push({ v: f.roundedInput, label: 'read', color: chat });
  const next = b >= 2 ? [initial] : [];
  if (wide) next.push(half);
  if (save) next.push(saved);
  route(c, 430, 'BF16 input', first);
  route(c, 743, 'FP32 input', next);
  if (save)
    text(
      c,
      'Both files store 1.000. Only the wider calculation retained the halfway value.',
      92,
      930,
      40,
      ink,
    );
}
function release(c, k) {
  const report = scoreReport();
  const opened = cue(k, 0, 'Open the rows');
  const absolute = cue(k, 1, 'task minimum');
  const relative = cue(k, 2, 'at most one percentage point');
  title(
    c,
    'Can one checkpoint cover all three jobs?',
    'Example held-out evaluation   ·   each task gets one vote in the mean',
  );
  const X = (v) => 444 + (v - 80) * 55;
  heading(c, 'Task mean', 100, 279);
  text(c, report.macro.toFixed(1) + '%', 103, 353, 72, ink, 'left', 'Serif');
  if (!opened) {
    for (let i = 0; i < 3; i++) {
      const y = 479 + i * 146;
      text(c, report.rows[i].task, 107, y, 48, colors[i], 'left', 'Serif');
      dash(c, 442, y, 1300, y);
      mono(c, '?', 1380, y, 45, muted);
    }
    return;
  }
  text(c, 'Task score (%)', 440, 312, 32, muted);
  [80, 85, 90, 95].forEach((v) => mono(c, v, X(v), 367, 26, muted, 'center'));
  heading(c, 'Abs. floor', 1370, 340, gold);
  heading(c, 'Specialist − 1 pp', 1567, 340, math);
  report.rows.forEach((r, i) => {
    const y = 481 + i * 149;
    text(c, r.task, 103, y, 54, colors[i], 'left', 'Serif');
    line(c, X(80), y, X(95), y, rule, 5);
    if (absolute) {
      line(c, X(r.floor), y - 8, X(r.floor), y + 37, gold, 6);
      mono(c, r.floor.toFixed(1), 1424, y, 37, gold, 'center');
    }
    if (relative) {
      line(c, X(r.retained), y - 38, X(r.retained), y + 8, math, 6);
      mono(c, r.source.toFixed(1) + ' → ' + r.retained.toFixed(1), 1689, y, 30, math, 'center');
    }
    dot(c, X(r.score), y, 15, colors[i], white, 3);
    mono(
      c,
      r.score.toFixed(1),
      X(r.score),
      y - 60,
      34,
      colors[i],
      'center',
    );
  });
  if (cue(k, 2, 'Two point nine')) {
    const m = report.rows[1];
    const retentionGap = cue(k, 2, 'four point nine points below');
    const mathGap = (retentionGap ? m.retained : m.floor) - m.score;
    const suffix = retentionGap ? ' pp below retention floor' : ' pp below absolute floor';
    text(
      c,
      'Math   ' + number(mathGap, 1) + suffix,
      103,
      918,
      43,
      ink,
    );
  }
  if (cue(k, 3, 'Keep the specialists'))
    text(c, 'Keep specialists in service', 1800, 916, 42, pink, 'right', 'Serif');
}
export const sphericalCode = { score: 89, floor: scoreReport().rows[0].floor };
export function evaluate(c, k) {
  if (k.beat.beatIndex < 4) return release(c, k);
  title(
    c,
    'Does preserving the radius clear the coding gate?',
    'Separate toy evaluation   ·   same Code minimum',
  );
  const ox = 250,
    oy = 758,
    r = 425,
    midpoint = interpolation(0.5, true);
  c.beginPath();
  c.arc(ox, oy, r, -endAngle, 0);
  c.strokeStyle = math;
  c.lineWidth = 6;
  c.stroke();
  for (const t of [0, 1, 0.5]) {
    const [u, v] = interpolation(t, true);
    arrow(c, ox, oy, ox + u * r, oy - v * r, t === 0.5 ? math : rule, t === 0.5 ? 8 : 4);
  }
  text(
    c,
    'Midpoint radius   ' + Math.hypot(...midpoint).toFixed(2),
    112,
    890,
    47,
    math,
    'left',
    'Serif',
  );
  const X = (v) => 1060 + (v - 84) * 70,
    y = 603,
    { score, floor } = sphericalCode;
  heading(c, 'Held-out coding accuracy', 1000, 361);
  line(c, X(84), y, X(94), y, rule, 6);
  line(c, X(floor), y - 43, X(floor), y + 42, gold, 7);
  text(c, 'Minimum   ' + floor + '%', X(floor), y + 94, 40, gold, 'center');
  if (cue(k, 4, 'eighty-nine percent')) {
    dot(c, X(score), y, 19, code, white, 3);
    mono(c, score + '%', X(score), y - 70, 48, code, 'center');
  }
  if (cue(k, 4, 'Set this candidate aside'))
    text(
      c,
      'Hold   ·   ' + (floor - score) + ' pp below the Code floor',
      1010,
      882,
      46,
      pink,
      'left',
      'Serif',
    );
}

const retryReport = scoreReport(86.4);
const retryMath = retryReport.rows[1];
const finalReport = scoreReport(retryMath.retained);

function spokenProgress(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase });
}

export function practiceReleaseState(k) {
  const measured = spokenProgress(k, 2, 'Math now scores eighty-six point four') === 1;
  const slide = spokenProgress(k, 3, 'Slide its dot to eighty-seven exactly');
  const report = slide === 1 ? finalReport : retryReport;
  const scorePosition = mix(retryMath.score, retryMath.retained, slide);
  let decision = '';
  if (slide === 0 && spokenProgress(k, 3, 'Hold this candidate') === 1) decision = 'hold';
  if (report.clear && spokenProgress(k, 4, 'Yes') === 1) decision = 'pass';
  return { measured, slide, report, scorePosition, decision };
}

function practiceRelease(c, k) {
  const { measured, slide, report, scorePosition, decision } = practiceReleaseState(k);
  title(
    c,
    'Would this candidate clear all three score gates?',
    'Compare reports on the same cases. Only the Math score changes.',
  );
  for (const i of [0, 2]) {
    const row = report.rows[i];
    const x = i === 0 ? 96 : 988;
    box(c, x, 260, 836, 119, white, rule, 10);
    text(c, row.task, x + 39, 320, 46, colors[i], 'left', 'Serif');
    mono(c, row.score.toFixed(1) + '%', x + 290, 320, 50, colors[i]);
    text(c, 'Needs ≥ ' + Math.max(row.floor, row.retained).toFixed(1) + '%', x + 548, 320, 36);
  }

  const m = report.rows[1];
  const X = (v) => 228 + (v - 84) * 290;
  const y = 623;
  text(c, 'Math score (%)', 96, 465, 43, math, 'left', 'Serif');
  line(c, X(84), y, X(89), y, rule, 6);
  for (let score = 84; score <= 89; score++) {
    line(c, X(score), y - 12, X(score), y + 12, muted, 3);
    mono(c, score, X(score), y + 56, 34, muted, 'center');
  }
  const absoluteX = X(m.floor);
  const retentionX = X(m.retained);
  line(c, absoluteX, y - 37, absoluteX, y + 25, gold, 7);
  line(c, retentionX, y - 37, retentionX, y + 25, math, 7);
  text(c, 'Absolute minimum', absoluteX, y + 121, 39, gold, 'center');
  text(c, 'Retention floor', retentionX, y + 121, 39, math, 'center');
  const margin = m.source - m.retained;
  mono(
    c,
    m.source.toFixed(1) + '% − ' + number(margin) + ' pp',
    retentionX,
    y + 169,
    34,
    math,
    'center',
  );

  if (measured) {
    const x = X(scorePosition);
    if (slide > 0) {
      const startX = X(retryMath.score);
      line(c, startX, y, x, math, 5);
      dot(c, startX, y, 13, paper, math, 3);
      mono(c, retryMath.score.toFixed(1) + '%', startX, y - 42, 34, muted, 'center');
    }
    dot(c, x, y, 21, math, white, 4);
    if (slide === 0 || slide === 1)
      mono(c, m.score.toFixed(1) + '%', x, y - 89, 56, math, 'center');
  }
  if (decision === 'hold') {
    const gap = spokenProgress(k, 3, 'one point six percentage points') === 1;
    const verdict = gap
      ? 'Hold. Math is ' + number(m.source - m.score, 1) + ' pp behind its specialist.'
      : 'Hold this candidate.';
    text(c, verdict, 960, 853, 47, pink, 'center', 'Serif');
  }
  if (decision === 'pass') {
    const verdict = cue(k, 4, 'Check the remaining safety')
      ? 'Score gates pass. Run safety and serving tests.'
      : 'All three score gates pass.';
    text(c, verdict, 960, 853, 47, chat, 'center', 'Serif');
  }
}

export function transfer(c, k) {
  if (k.beat.beatIndex < 2) scalar(c, k, true);
  else practiceRelease(c, k);
}
