import assert from 'node:assert/strict';
import { lifetimePlans } from '../../../films/bitter-lesson-compute-over-heuristics/arithmetic.mjs';
import {
  C,
  arrow,
  background,
  cap,
  chip,
  circle,
  clamp,
  cue,
  heading,
  lerp,
  line,
  mono,
  rect,
  smooth,
  tape,
  text,
} from './studio.mjs';
import { gate } from './evaluation.mjs';

const { large, small, breakEven, savedPerServingToken } = lifetimePlans();
const plans = [large, small],
  colors = [C.blue, C.mint];
const cost = (plan, qBillions) => (plan.train + 2 * plan.parameters * qBillions * 1e9) / 1e21;
const tie = breakEven / 1e9,
  premium = cost(small, 0) - cost(large, 0);
function plotAxis(g, x, y, w, h, xTicks, yTicks, X, Y, xUnit, yUnit) {
  cap(g, yUnit, x - 30, y - 12, C.mist, 15);
  yTicks.forEach((v) => {
    const yy = Y(v);
    line(
      g,
      [
        [x, yy],
        [x + w, yy],
      ],
      C.grid,
      1.4,
    );
    mono(g, String(v), x - 13, yy + 7, 17, C.mist, 'right');
  });
  line(
    g,
    [
      [x, y],
      [x, y + h],
      [x + w, y + h],
    ],
    C.mist,
    2,
  );
  xTicks.forEach((v) => {
    const xx = X(v);
    line(
      g,
      [
        [xx, y + h],
        [xx, y + h + 6],
      ],
      C.mist,
      2,
    );
    mono(g, String(v), xx, y + h + 29, 18, C.mist, 'center');
  });
  cap(g, xUnit, x, y + h + 51, C.mist, 14);
}
function duringPhrases(k, beat, firstPhrase, lastPhrase = firstPhrase) {
  const current = k.beat.beatIndex;
  if (current !== beat) return Number(current > beat);
  const { start } = k.wordCue(firstPhrase);
  const { end } = k.wordCue(lastPhrase);
  return k.reveal(firstPhrase, end - start, { captionStart: false });
}
export function serving(g, k) {
  const i = k.beat.beatIndex;
  const firstVolume = duringPhrases(k, 3, 'Now send each model', 'a hundred billion serving tokens');
  const closeGap = duringPhrases(k, 5, 'Another sixty-five billion', 'one hundred sixty-five billion tokens each');
  let q = 100 * smooth(firstVolume);
  q += (tie - 100) * smooth(closeGap);
  q += (200 - tie) * smooth(cue(k, 6, 'At two hundred billion', 1.6));
  const X = (v) => 100 + v * 3.35,
    Y = (v) => 499 - (v - 5) * 70;
  background(g, true);
  heading(
    g,
    'Estimated lifetime work  /  quality matched',
    'When does the training premium pay back?',
    true,
  );
  plotAxis(
    g,
    100,
    191,
    691,
    308,
    [0, 50, 100, 150, 200],
    [5, 6, 7, 8, 9],
    X,
    Y,
    'Serving tokens per model  /  billions',
    'Lifetime zettaFLOPs',
  );
  for (let j = 0; j < 2; j++) {
    const p = plans[j],
      col = colors[j],
      amount = cost(p, q),
      y = Y(amount);
    line(
      g,
      [
        [X(0), Y(cost(p, 0))],
        [X(q), y],
      ],
      col,
      5,
    );
    circle(g, X(0), Y(cost(p, 0)), 4, col);
    circle(g, X(q), y, j === 0 ? 8 : 5, col);
    const yy = 200 + j * 141;
    cap(g, p.parameters / 1e9 + 'B parameters', 839, yy, col);
    mono(g, amount.toFixed(2), 836, yy + 58, 47, C.white);
    text(
      g,
      i >= 2
        ? '+' + (2 * p.parameters) / 1e9 + 'B FLOPs / token'
        : p.tokens / 1e9 + 'B training tokens',
      839,
      yy + 90,
      18,
      C.mist,
      'Mono',
    );
  }
  if (q > 0) {
    line(
      g,
      [
        [X(q), Y(Math.max(...plans.map((p) => cost(p, q)))) + 12],
        [X(q), 499],
      ],
      C.mist,
      1,
      [3, 6],
    );
  }
  if (q >= tie) {
    circle(g, X(tie), Y(cost(small, tie)), 7, C.brass);
    mono(g, tie + 'B  ·  equal work', X(tie) - 15, Y(cost(small, tie)) - 27, 17, C.brass, 'right');
  }
  let note = 'Both plans meet the quality target.';
  if (i === 1) note = 'Extra training work  ≈  ' + premium.toFixed(2) + ' zettaFLOPs';
  if (i === 2)
    note =
      'Saving on each processed token  ≈  ' + savedPerServingToken / 1e9 + ' billion operations';
  if (i === 3) note = 'At ' + Math.round(q) + 'B processed tokens per model';
  if (i === 4)
    note =
      'Gap  ' +
      (cost(small, q) - cost(large, q)).toFixed(2) +
      ' zettaFLOPs     /     saving  8B FLOPs per token';
  if (i === 5)
    note =
      q === tie
        ? 'Tie at ' +
          tie +
          'B tokens each     /     ' +
          cost(small, tie).toFixed(2) +
          ' zettaFLOPs each'
        : 'Closing the remaining gap';
  if (i === 6) note = 'At ' + Math.round(q) + 'B tokens per model, compare the vertical positions.';
  text(g, note, 56, 153, 27, C.brass, 'Serif');
}
const colorsByUse = [C.blue, C.brass, C.mint];
function usage(input, hidden, answer) {
  return { input, hidden, answer, total: input + hidden + answer };
}
const promptWords = 'Name the color of a clear daytime sky'.split(' ');
const answerWords = ['Sky', 'blue'];
const generationLimit = 8;
const normal = usage(promptWords.length, 6, answerWords.length),
  exhausted = usage(promptWords.length, generationLimit, 0);
const tokenNames = ['uncached input', 'hidden reasoning', 'answer'];
function strip(g, x, y, candidate, used, show = true) {
  cap(g, candidate, x, y - 16, C.mist);
  rect(g, x, y, 16 * 43 - 4, 50, null, 5, C.grid);
  let start = 0;
  for (const [j, n] of [used.input, used.hidden, used.answer].entries()) {
    for (let a = 0; a < n; a++) {
      rect(g, x + (start + a) * 43, y, 39, 50, show ? colorsByUse[j] : C.grid, 4);
      if (show) {
        const label = j === 0 ? promptWords[a] : j === 2 ? answerWords[a] : '•';
        mono(
          g,
          label,
          x + (start + a) * 43 + 19.5,
          y + 31,
          j === 1 ? 22 : 14,
          C.deep,
          'center',
          35,
        );
      }
    }
    start += n;
  }
}
function returnSlip(g, x, y, n, label = 'Returned answer') {
  tape(g, x, y, 282, 111);
  cap(g, label, x + 19, y + 37);
  if (n) {
    chip(g, answerWords[0], x + 17, y + 51, 89, C.teal, C.white);
    chip(g, answerWords[1], x + 112, y + 51, 111, C.teal, C.white);
  } else mono(g, '(empty)', x + 20, y + 83, 28, C.rust);
}
export function requests(g, k) {
  const i = k.beat.beatIndex;
  background(g, true);
  if (i === 5) {
    heading(g, 'Post-training and serving', 'Which weights can this work change?', true);
    cap(g, 'Post-training', 67, 218, C.mist);
    chip(g, 'Examples + rewards', 66, 253, 280, C.paper, C.ink, 60);
    arrow(g, 360, 283, 508, 283, C.brass);
    chip(g, 'Update', 525, 253, 158, C.brass, C.deep, 60);
    arrow(g, 695, 283, 805, 283, C.brass);
    chip(g, 'Next weights', 822, 253, 290, C.mint, C.deep, 60);
    cap(g, 'This request', 67, 421, C.mist);
    chip(g, 'Fixed weights', 66, 454, 280, C.blue, C.deep, 60);
    arrow(g, 360, 485, 508, 485, C.blue);
    chip(g, 'Search', 525, 454, 158, C.blue, C.deep, 60);
    arrow(g, 695, 485, 805, 485, C.blue);
    chip(g, 'One answer', 822, 454, 290, C.paper, C.ink, 60);
    return;
  }
  const separate = i >= 3;
  heading(
    g,
    'One request  /  fixed weights',
    separate ? 'What fits in eight generated tokens?' : 'How much work reaches the user?',
    true,
  );
  let raw = normal;
  if (i === 0) {
    raw = usage(
      Math.floor(8 * cue(k, 0, 'eight uncached input tokens', 1)),
      Math.floor(6 * cue(k, 0, 'six hidden tokens', 0.85)),
      Math.floor(2 * cue(k, 0, 'two-token answer', 0.6)),
    );
  } else if (separate) {
    const hidden = Math.floor(generationLimit * cue(k, 3, 'all eight generated tokens', 1.45));
    raw = usage(exhausted.input, hidden, 0);
  }
  const second = i === 1 || i === 2;
  const work2 = second
    ? usage(
        Math.floor(8 * cue(k, 1, 'all eight input tokens', 1)),
        Math.floor(6 * cue(k, 1, 'six tokens reasoning', 0.8)),
        Math.floor(2 * cue(k, 1, 'writes two more', 0.6)),
      )
    : usage(0, 0, 0);
  for (let j = 0; j < 3; j++) {
    const x = [65, 381, 727][j];
    circle(g, x + 6, 175, 6, colorsByUse[j]);
    text(g, tokenNames[j], x + 26, 182, 22, C.white);
  }
  text(g, '“' + promptWords.join(' ') + '.”', 64, 219, 23, C.white, 'Serif');
  strip(g, 65, 261, 'Candidate 1', raw);
  if (second) strip(g, 65, 383, 'Candidate 2', work2);
  if (separate) {
    const xx = 65 + exhausted.input * 43;
    const right = xx + generationLimit * 43 - 4;
    line(
      g,
      [
        [xx, 328],
        [xx, 344],
        [right, 344],
        [right, 328],
      ],
      C.brass,
      3,
    );
    text(g, `Generation limit: ${generationLimit} tokens`, xx, 379, 24, C.brass, 'Serif');
  }
  const delivered = separate
    ? i === 4 && cue(k, 4, 'Zero', 0.4) === 1
    : i === 0
      ? cue(k, 0, 'returned two', 0.55) === 1
      : i === 2 || cue(k, 1, 'picks one answer', 0.8) === 1;
  if (delivered) {
    if (second)
      line(
        g,
        [
          [754, 410],
          [782, 410],
          [816, 334],
        ],
        C.mint,
        3,
      );
    else arrow(g, 754, 286, 812, 286, separate ? C.brass : C.mint);
    returnSlip(g, 827, 242, separate ? 0 : 2);
  } else {
    rect(g, 827, 242, 282, 111, null, 4, C.grid);
    cap(g, 'Return slot', 847, 285, C.mist);
  }
  const processed = raw.total + work2.total;
  mono(g, processed + ' tokens processed', 64, 537, 33, C.white);
  if (delivered) mono(g, (separate ? 0 : 2) + ' returned', 827, 537, 29, C.mint);
  if (i === 2)
    text(
      g,
      'Measure verifier, difficulty-estimation and routing work separately.',
      64,
      476,
      27,
      C.mist,
      'Serif',
    );
  if (i === 4)
    text(
      g,
      'Measure completions, useful answers, latency and cost on untouched tasks.',
      64,
      476,
      25,
      C.mist,
      'Serif',
    );
}
function finalTrace(g, k) {
  const i = k.beat.beatIndex;
  const fixed = cost(large, 200);
  const baseline = cost(small, 200);
  const totalAddedWork = cost(small, 300) - baseline;
  const tokensAtCrossing = 100 * (fixed - baseline) / totalAddedWork;
  let extra = 0;
  if (i === 1) {
    const start = k.wordCue('Follow the added work').start;
    const crossing = k.wordCue("crosses the larger model's cost").end;
    const stop = k.wordCue('stops at nine').end;
    extra = k.elapsed < crossing
      ? lerp(0, tokensAtCrossing, clamp((k.elapsed - start) / (crossing - start)))
      : lerp(tokensAtCrossing, 100, clamp((k.elapsed - crossing) / (stop - crossing)));
  }
  const value = cost(small, 200 + extra);
  const displayedTokens = Math.round(200 + extra);
  const X = (v) => 116 + v * 6.55,
    Y = (v) => 494 - (v - 8.3) * 385;
  background(g, true);
  heading(
    g,
    'Modeled lifetime work  /  same requests and quality',
    duringPhrases(k, 1, 'now uses less estimated work') === 1
      ? 'The 7B plan now uses less work'
      : 'Only the smaller model keeps reasoning',
    true,
  );
  let addition = '100B hidden tokens × 6B FLOPs per token';
  if (duringPhrases(k, 1, 'six tenths of a zettaFLOP') === 1)
    addition += ' = ' + totalAddedWork.toFixed(2) + ' zettaFLOPs';
  text(g, addition, 56, 155, 30, C.brass, 'Serif');
  plotAxis(
    g,
    116,
    189,
    655,
    305,
    [0, 25, 50, 75, 100],
    [8.4, 8.6, 8.8, 9],
    X,
    Y,
    'Extra 3B reasoning tokens  /  billions',
    'Lifetime zettaFLOPs',
  );
  line(
    g,
    [
      [X(0), Y(fixed)],
      [X(100), Y(fixed)],
    ],
    C.blue,
    4,
  );
  mono(g, '7B model   ' + fixed.toFixed(2), 126, Y(fixed) - 13, 26, C.blue);
  line(
    g,
    [
      [X(0), Y(baseline)],
      [X(extra), Y(value)],
    ],
    C.mint,
    6,
  );
  circle(g, X(0), Y(baseline), 5, C.mint);
  circle(g, X(extra), Y(value), 8, C.mint);
  if (extra >= tokensAtCrossing) {
    circle(g, X(tokensAtCrossing), Y(fixed), 7, C.brass);
    mono(g, 'Equal work', X(tokensAtCrossing) + 15, Y(fixed) + 31, 17, C.brass);
  }
  returnSlip(g, 847, 216, 2, 'Both models return');
  cap(g, '3B serving volume', 847, 395, C.mist);
  mono(g, (extra > 0 && extra < 100 ? '≈ ' : '') + displayedTokens + 'B tokens', 847, 438, 29, C.white);
  cap(g, '3B lifetime work', 847, 492, C.mint);
  mono(g, value.toFixed(2) + ' zettaFLOPs', 847, 534, 26, C.mint);
}
function tokenizer(g, k) {
  background(g);
  heading(g, 'From the routing lab to tokenization', 'What counted as a word?');
  const msg = "can't authenticate",
    tokens = msg.match(/[a-z]+/g);
  tape(g, 68, 218, 1063, 124);
  const x = 111,
    step = 39;
  for (let j = 0; j < msg.length; j++) mono(g, msg[j], x + j * step, 295, 44, C.ink, 'center');
  const divide = cue(k, 5, 'apostrophe splits', 1);
  let offset = 0;
  for (const word of tokens) {
    const start = msg.indexOf(word, offset),
      left = x + start * step - step * 0.42,
      right = left + word.length * step - 4;
    offset = start + word.length;
    if (divide > 0) {
      line(
        g,
        [
          [left, 312],
          [lerp(left, right, divide), 312],
        ],
        C.teal,
        4,
      );
      if (divide === 1) {
        line(
          g,
          [
            [left + 13, 344],
            [left + 13, 388],
          ],
          C.teal,
          2,
        );
        chip(g, word, left, 390, Math.max(45, right - left), C.teal, C.white, 53);
      }
    }
  }
  if (divide === 1)
    text(g, tokens.length + ' letter runs from 2 written words', 69, 535, 38, C.ink, 'Serif');
  if (cue(k, 5, 'Next we’ll see', 0.5) > 0)
    text(g, 'Next lesson   /   Match token IDs to the model checkpoint.', 69, 161, 26, C.teal);
}
export function practice(g, k) {
  const i = k.beat.beatIndex;
  if (i < 2) {
    finalTrace(g, k);
    return;
  }
  if (i === 5) {
    tokenizer(g, k);
    return;
  }
  const reported = i === 2 || (i === 3 && cue(k, 3, 'Remove just the report marker', 0.65) < 1);
  const output =
    i === 2
      ? cue(k, 2, 'the local gate returns promote', 0.9) === 1
      : i === 4 && cue(k, 4, 'It requests evidence', 0.75) === 1;
  gate(g, {
    score: 0.97,
    report: reported,
    showOutput: output,
    title: 'Which action does the local gate return?',
    transfer: true,
  });
}
export function checkServing() {
  for (const [q, totals] of [
    [0, ['5.88', '7.20']],
    [100, ['7.28', '7.80']],
    [165, ['8.19', '8.19']],
    [200, ['8.68', '8.40']],
  ])
    assert.deepEqual(
      plans.map((p) => cost(p, q).toFixed(2)),
      totals,
    );
  assert.equal(tie, 165);
  assert.equal(tie - 100, 65);
  assert.equal(savedPerServingToken, 8e9);
  assert.equal((cost(small, 300) - cost(small, 200)).toFixed(2), '0.60');
  assert.equal(cost(small, 300).toFixed(2), '9.00');
  assert(cost(small, 200) < cost(large, 200) && cost(small, 300) > cost(large, 200));
  assert.equal(normal.total, 16);
  assert.deepEqual([2 * normal.total, normal.answer], [32, 2]);
  assert.equal(exhausted.hidden + exhausted.answer, 8);
  assert.equal(exhausted.answer, 0);
}
