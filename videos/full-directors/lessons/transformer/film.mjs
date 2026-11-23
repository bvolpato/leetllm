import { prepareCaptions } from './captions.mjs';

import { forward } from './forward.mjs';
import { worksheets } from './worksheets.mjs';
import { inspection } from './inspection.mjs';
import {
  ink,
  dim,
  red,
  teal,
  blue,
  paper,
  fmt,
  vector,
  pct,
  mix,
  type,
  line,
  dot,
  box,
  arrow,
  bench,
  foot,
  typeLine,
  row,
  grid,
  shutters,
  cue,
  throughCue,
  afterCue,
  label,
} from './press.mjs';
import { WORDS, VOCAB, CACHE_RUNS, FRESH, axisCompare, checkSpecimens } from './specimens.mjs';

function failure(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 2
      ? 'Can these two pieces fit?'
      : b < 4
        ? 'Trace the symptom to the operation'
        : 'Can a future word change “function”?',
    'FAULT ISOLATION  /  CONTROLLED REPRINT',
  );
  if (b < 2) {
    const p = cue(k, 1, 'Project the six features', 1),
      n = p >= 1 ? 4 : 6;
    label(c, 'Residual row', 54, 175);
    label(c, 'FFN branch', 54, 306);
    for (let j = 0; j < 4; j++) box(c, 260 + j * 92, 164, 82, 53, blue, 2);
    for (let j = 0; j < n; j++) box(c, 260 + j * 92, 290, 82, 53, j < 4 ? teal : red, 2);
    for (let j = 0; j < 4; j++) line(c, 300 + j * 92, 222, 300 + j * 92, 284, dim, 1.8);
    type(
      c,
      n === 4 ? '3 × 4 entries on each side' : '3 × 4 = 12      3 × 6 = 18',
      265,
      395,
      26,
      n === 4 ? teal : red,
      'Mono',
    );
    foot(
      c,
      n === 4
        ? 'The learned return projection restores the residual width.'
        : 'A reshape preserves the number of entries. It cannot turn 18 into 12.',
    );
  } else if (b === 2) {
    typeLine(c, VOCAB.slice(0, 4), { y: 163, h: 51, selected: 3 });
    const p = cue(k, 2, 'Select the mask');
    shutters(c, 4, p ? 4 : 1, {
      x: 51,
      w: 845,
      y: 276,
      words: VOCAB.slice(0, 4),
      weights: p ? CACHE_RUNS[1].aligned.weights : CACHE_RUNS[1].upperLeft.weights,
    });
    foot(
      c,
      p
        ? 'All four legal keys now contribute to the position-3 read.'
        : 'A first-value-only read at absolute position 3 points to mask alignment.',
    );
  } else if (b === 3) {
    row(c, 'all keys blocked', ['−∞', '−∞'], 173, red);
    type(c, 'Manual softmax    exp(−∞ − (−∞))   →   NaN', 55, 276, 22, ink, 'Mono');
    type(c, 'Temperature       softmax(logits / T)', 55, 373, 23, teal, 'Mono');
    foot(
      c,
      'Inspect the legal keys for undefined weights. Inspect the logits when temperature has no effect.',
    );
  } else {
    const change = 4 * cue(k, 6, 'Add four', 0),
      repair = cue(k, 7, 'Restore normalization across features', 1);
    const cases = axisCompare(change),
      repaired = repair >= 1;
    const results = [cases[0], cases[repaired ? 0 : 1]];
    results.forEach((r, i) => {
      const x = 52 + i * 452,
        col = i && !repaired;
      type(
        c,
        col ? 'Down one feature column' : 'Across one token row',
        x,
        162,
        25,
        col ? red : teal,
        'Serif',
      );
      const opts = {
        cw: 77,
        ch: 49,
        format: (v) => fmt(v, 2),
        paint: (v, t, j) => ((col ? j === 0 : t === 0) ? (col ? red : teal) : paper),
        fg: (v, t, j) => ((col ? j === 0 : t === 0) ? paper : ink),
      };
      grid(c, x + 88, 194, r.input, opts);
      WORDS.forEach((word, j) => type(c, word, x, 216 + j * 49, 19, dim, 'Serif'));
      type(c, 'mean     ' + fmt(r.mean, 3), x + 35, 373, 20, ink, 'Mono');
      type(
        c,
        'Δ “function”  ' + (b >= 6 ? fmt(r.delta, 3) : '?'),
        x + 35,
        415,
        22,
        col ? red : teal,
        'Mono',
      );
    });
    foot(
      c,
      b === 8
        ? 'A causal mask can also exclude a legal key. Test that failure next against the full prefix.'
        : b < 6
          ? 'Follow the selected numbers into the mean for “function.” Which set includes the future edit?'
          : 'Both attention masks block the future. Check which normalization group includes the edited feature.',
    );
  }
}

function fresh(c, k) {
  const b = k.beat.beatIndex;
  if (b < 7) {
    bench(c, 'Which end of the segment gets the read?', 'FINAL PRACTICE  /  CHECK THE READ, THEN THE SCORES');
    const x = 112,
      y = 385,
      scale = 83,
      at = ([a, z]) => [x + scale * a, y - scale * z];
    const values = FRESH.values,
      atA = at(values[0]),
      atB = at(values[1]);
    line(c, x - 20, y, x + 4.4 * scale, y, dim);
    line(c, x, y + 12, x, y - 2.55 * scale, dim);
    line(c, ...atA, ...atB, '#9ea491', 2.3);
    dot(c, ...atA, 7, blue);
    dot(c, ...atB, 7, teal);
    type(c, 'blue (4, 0)', atA[0], y + 28, 19, blue, 'Mono', 'center');
    type(c, 'green (0, 2)', atB[0] + 5, atB[1] - 26, 19, teal, 'Mono');
    const wrong = cue(k, 5, 'green key drops out', 1.0),
      align = cue(k, 6, 'Align the mask', 1);
    const leak = wrong * (1 - align);
    const moving = (wrong > 0 && wrong < 1) || (align > 0 && align < 1);
    const w = FRESH.weights.map((v, i) => mix(v, i === 0 ? 1 : 0, leak));
    const draw = cue(k, 3, 'Take that share', 1.2),
      up = cue(k, 3, 'add the green contribution', 1.3);
    if (draw > 0) {
      const step = [4 * w[0] * draw, 0],
        end = [step[0], 2 * w[1] * up];
      arrow(c, x, y, ...at(step), blue, 4);
      if (up > 0) arrow(c, ...at(step), ...at(end), teal, 4);
      dot(c, ...at(end), 5, ink);
    }
    label(c, 'Query', 562, 163);
    type(c, vector(FRESH.q, 0), 565, 197, 24, ink, 'Mono');
    type(c, 'Blue key     ' + vector(FRESH.keys[0], 0), 563, 250, 20, blue, 'Mono');
    type(c, 'Green key    ' + vector(FRESH.keys[1], 0), 563, 288, 20, teal, 'Mono');
    const known = cue(k, 2, 'Blue gets');
    if (known && !moving)
      type(c, 'shares   ' + w.map(pct).join(' / '), 558, 349, 20, ink, 'Mono', 'left', 357);
    if (draw >= 1 && up >= 1 && !moving)
      type(c, 'read    ' + vector([4 * w[0], 2 * w[1]], 3), 558, 400, 21, ink, 'Mono', 'left', 357);
    foot(
      c,
      b < 2
        ? 'Each key is paired with the value of the same color. Predict before the read is drawn.'
        : b === 2
          ? 'Scaled scores   ' + vector(FRESH.scores, 3) + '     ·     softmax across the two keys'
          : b < 5
            ? 'The small vertical leg records the second value’s contribution to the two-feature read.'
            : b === 5
              ? wrong === 1
                ? 'Blue gets 100% of the weight. The green key is blocked.'
                : 'Apply the upper-left mask. Watch what happens to the green step.'
              : align >= 1
                ? 'At position 1 both keys contribute again. The read agrees with the full prefix.'
                : 'The upper-left row dropped the green key. Follow the tip as the mask moves to position 1.',
    );
  } else cachePayoff(c, k);
}

function cachePayoff(c, k) {
  const b = k.beat.beatIndex;
  const run = CACHE_RUNS[0];
  const wrongMaskKnown = afterCue(k, 7, 'read only function', { captionStart: 'only function' });
  const wrongWinner = afterCue(k, 9, 'prints None', { captionStart: 'None' });
  const fix = throughCue(k, 9, 'Restore those two openings');
  const checking = fix === 1 && cue(k, 9, 'Compare all six pairs of scores', 0) === 1;
  const matchSpoken = afterCue(k, 9, 'Each pair now agrees', { captionStart: 'Each pair now agrees' });
  const resultSpoken = afterCue(k, 9, 'puts result back in the line', {
    captionStart: 'result back in the line',
  });
  const matches = checking && matchSpoken;
  const restoredWinner = matches && resultSpoken;
  const cached = checking ? run.aligned : !fix && b >= 8 ? run.upperLeft : null;
  const showWinner = restoredWinner || (wrongWinner && !fix);
  const printed = showWinner ? cached.choice : null;
  bench(
    c,
    restoredWinner
      ? 'The cached query agrees with the full prefix'
      : fix
        ? 'Restore the missing reads'
        : wrongWinner
          ? 'The faulty cache predicts “None”'
          : 'What will the cached run print?',
    'FINAL PRACTICE  /  CHECK THE READ, THEN THE SCORES',
  );

  const words = printed === null ? WORDS : [...WORDS, VOCAB[printed]];
  const centers = typeLine(c, words, {
    x: 221,
    y: 144,
    w: 683,
    h: 49,
    selected: printed === null ? 2 : 3,
    slot: printed === null,
  });
  type(c, 'Prompt tokens', 54, 169, 22, dim);
  type(c, 'Predicted token', centers(3), 125, 18, dim, 'Sans', 'center');
  type(c, 'Cached read', 54, 243, 22, dim);
  const cellWidth = centers(1) - centers(0) - 10;
  const shutterHeight = 36;
  WORDS.forEach((_, i) => {
    const x = centers(i) - cellWidth / 2;
    const y = 225;
    const opening = i === 0 ? 1 : fix;
    box(c, x, y, cellWidth, shutterHeight, wrongMaskKnown ? teal : paper, 3);
    if (!wrongMaskKnown) return;
    box(c, x, y, cellWidth, shutterHeight * (1 - opening), red, 3);
    if (opening === 0 || opening === 1) {
      type(c, opening ? 'read' : 'closed', centers(i), y + shutterHeight / 2, 21, paper, 'Sans', 'center');
    }
  });

  const cw = 110;
  const left = 246;
  const logitCenter = (i) => left + (i + 0.5) * cw - 1;
  VOCAB.forEach((w, i) => type(c, w, logitCenter(i), 291, 21, ink, 'Serif', 'center'));
  const logitRows = [
    { name: 'Full prefix', data: run.full, color: blue, mark: true },
    { name: 'Cached query', data: cached, color: checking ? teal : red, mark: showWinner },
  ];
  logitRows.forEach(({ name, data, color, mark }, i) => {
    const y = 310 + 64 * i;
    type(c, name, 54, y + 21, 22, color, 'Serif');
    const scores = data ? data.logits : VOCAB.map(() => '');
    grid(c, left, y, [scores], {
      cw,
      ch: 42,
      format: (v) => fmt(v, 3),
      paint: (_, __, j) => (mark && j === data.choice ? color : paper),
      fg: (_, __, j) => (mark && j === data.choice ? paper : ink),
      size: 21,
    });
  });
  if (matches) {
    VOCAB.forEach((_, i) => type(c, '=', logitCenter(i), 362, 20, teal, 'Mono', 'center'));
  }

  foot(
    c,
    matches
      ? 'All six cached scores match the full prefix.'
      : fix
        ? checking
          ? 'Compare each cached score with the score above it.'
          : 'Recompute with the same query, saved values, and model weights.'
        : wrongMaskKnown
          ? 'The full prefix reads all three values. The cached query reads only “function.”'
          : 'Use the full-prefix scores as the reference.',
  );
}
const chapters = [...forward, ...worksheets, ...inspection, failure, fresh];
export default {
  title: 'How Does a Token Become the Next Word?',
  check: checkSpecimens,
  preparePicture: prepareCaptions,
  draw(ctx, clock) {
    ctx.save();
    try {
      ctx.scale(2, 2);
      chapters[clock.beat.chapterIndex](ctx, clock);
    } finally {
      ctx.restore();
    }
  },
};
