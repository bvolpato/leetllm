import {
  ink,
  night,
  white,
  paper,
  muted,
  soft,
  pigments,
  lights,
  text,
  mono,
  serif,
  rect,
  line,
  dot,
  path,
  stock,
  heading,
  key,
  names,
  letters,
  opacity,
  cue,
  mix,
  fmt,
  pct,
} from './atlas.mjs';
import { z, weights, baseShares, answerSet, optionOrder, isolation } from './decisions.mjs';

function heard(k, beat, phrase) {
  const index = k.beat.beatIndex;
  return index > beat || (index === beat && k.elapsed >= k.wordCue(phrase).end);
}

function shuffle(g, k) {
  stock(g);
  heading(g, 'RUN-842   /   IMAGE PULL RETURNED 401', 'Where did registry authentication go?');
  const shuffled = cue(k, 0, 'Shuffle the options', 1),
    reviewed = cue(k, 1, 'C now means') && heard(k, 1, 'C now means registry authentication'),
    repeated = heard(k, 1, 'B selects test regression');
  mono(g, 'ORIGINAL REQUEST', 42, 158, 15, muted);
  mono(g, 'REPLAYED REQUEST', 556, 158, 15, muted);
  for (let i = 0; i < 3; i++) {
    const y = 217 + 78 * i;
    mono(g, letters[i], 43, y, 25, ink);
    text(g, names[i], 85, y, 20, pigments[i], 'Sans', 600);
    mono(g, letters[i], 552, y, 25, ink);
    const j = optionOrder.indexOf(i),
      end = 217 + 78 * j;
    // The semantic label travels. The caller's three letter slots stay fixed.
    const moving = mix(y, end, shuffled);
    const x = mix(386, 507, shuffled);
    line(g, 335, y - 6, x, moving - 6, pigments[i], 2);
    dot(g, x, moving - 6, 4, pigments[i]);
    if (shuffled > 0)
      opacity(g, shuffled, () => text(g, names[i], 590, end, 20, pigments[i], 'Sans', 600));
  }
  if (reviewed) mono(g, 'Reviewed: C · Registry authentication', 41, 418, 18, pigments[1]);
  if (repeated) mono(g, 'Repeating B selects test regression', 507, 418, 18, pigments[0]);
}
function remove(g, k) {
  stock(g);
  heading(
    g,
    'FIXED LOGITS   /   ORIGINAL ORDER RESTORED',
    'What changes when one weight leaves the total?',
  );
  const drop = cue(k, 2, 'Remove insufficient evidence', 0.8);
  const completed = drop === 1;
  const settled = answerSet(completed);
  const original = answerSet(false);
  const result = heard(k, 2, 'almost twenty-seven percent');
  const unchanged = heard(k, 2, 'supplied no new evidence');
  const unit = 60;
  let x = 42;
  mono(g, 'ORIGINAL WEIGHTS', 42, 134, 15, muted);
  mono(g, 'Total ' + fmt(original.total, 2), 755, 185, 18, muted);
  mono(g, 'AFTER CHANGING THE CHOICE SET', 42, 238, 15, muted);
  weights.forEach((weight, i) => {
    const width = weight * unit;
    const label = letters[i] + '  ' + fmt(weight, 2);
    rect(g, x, 151, width - 2, 51, pigments[i], 3);
    mono(g, label, x + width / 2, 183, i === 2 ? 14 : 19, white, 'center');
    const sliding = i === 2;
    const left = sliding ? mix(x, 805, drop) : x;
    const top = sliding ? mix(255, 271, drop) : 255;
    rect(g, left, top, width - 2, 62, pigments[i], 3);
    mono(g, label, left + width / 2, top + 38, i === 2 ? 14 : 22, white, 'center');
    x += width;
  });
  if (completed) mono(g, 'removed', 802, 353, 15, pigments[2]);
  const end = 42 + unit * settled.total;
  line(g, 42, 327, end, 327, ink, 2);
  line(g, end, 322, end, 334, ink, 2);
  mono(g, 'Total ' + fmt(settled.total, 2), 42, 355, 18, ink);
  const numerator = fmt(weights[1], 2);
  const share = completed && !result ? '?' : pct(settled.shares[1]);
  mono(g, 'Original B share ' + pct(baseShares[1]), 42, 414, 17, muted);
  mono(
    g,
    'B    ' + numerator + ' / ' + fmt(settled.total, 2) + ' = ' + share,
    362, 414, 23, pigments[1],
  );
  if (unchanged) text(g, 'Same evidence', 782, 414, 18, muted);
}
function cache(g, k) {
  stock(g, true);
  heading(
    g,
    'RUN-842   /   QUESTION ISOLATION',
    'Can a neighboring question change these logits?',
    true,
  );
  const fork = cue(k, 3, 'Continue each question in a separate row', 0.8);
  const added = cue(k, 4, 'Add an Unknown choice');
  const state = isolation(added);
  rect(g, 40, 183, 213, 144, '#294748', 12);
  for (let i = 0; i < 3; i++) {
    rect(g, 59, 205 + 21 * i, 48, 12, '#112d30', 2);
    line(g, 68, 211 + 21 * i, 95, 211 + 21 * i, lights[1], 2);
  }
  mono(g, 'RUN-842', 124, 239, 18, white);
  text(g, 'Shared log cache', 58, 303, 20, white);
  const ys = [199, 359];
  ys.forEach((y, i) => {
    line(g, 253, 254, 288, 254, soft, 2);
    line(g, 288, 254, 288, y, soft, 2);
    line(g, 288, y, 329, y, soft, 2);
    opacity(g, fork, () => {
      dot(g, mix(288, 329, fork), y, 5, i ? lights[2] : lights[1]);
      rect(g, 330, y - 39, 584, 116, '#213d3e', 7);
      text(
        g,
        i ? 'Did the tests start?' : 'Which cause deserves investigation?',
        348,
        y,
        23,
        white,
      );
      mono(
        g,
        i ? 'Options  ' + state.secondChoices.join(' / ') : 'Logits   ' + state.first.join('   '),
        349,
        y + 39,
        19,
        i ? lights[2] : lights[1],
      );
      mono(g, 'STATE ' + (i + 1), 815, y + 63, 13, soft);
    });
  });
  if (added)
    mono(
      g,
      'Q1 replay  [' +
        state.replay.join(', ') +
        ']     max |Δ| = ' +
        state.maxError +
        '     (toy check)',
      330,
      480,
      16,
      white,
    );
}
export function options(g, k) {
  if (k.beat.beatIndex <= 1) return shuffle(g, k);
  if (k.beat.beatIndex === 2) return remove(g, k);
  return cache(g, k);
}

function folder(g, x, y, w, h, label, col) {
  path(
    g,
    [
      [x, y],
      [x, y - 13],
      [x + w * 0.47, y - 13],
      [x + w * 0.53, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    col,
  );
  mono(g, label, x + 15, y + 28, 16, white);
}
function group(g, k) {
  stock(g);
  heading(g, 'REVIEWED INCIDENTS   /   GROUP SPLIT', 'Where should the retry go?');
  const retry = cue(k, 0, 'a retry from the same incident', 0.45);
  const move = cue(k, 1, 'Keep them together in training', 1);
  folder(g, 529, 147, 381, 193, 'TRAINING', pigments[1]);
  folder(g, 529, 368, 381, 90, 'FINAL TEST', pigments[0]);
  mono(g, 'Incident 91 · other source', 548, 429, 17, white);
  const x = mix(44, 583, move),
    y = mix(191, 201, move);
  const scale = mix(1, 0.57, move);
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  if (retry > 0) {
    rect(g, 13 + 7 * retry, -25, 444, 238, '#d5d3bc', 4);
    mono(g, 'INCIDENT 42   /   RETRY', 34, -6, 14, muted);
  }
  rect(g, 0, 0, 444, 238, '#fff9e6', 4);
  rect(g, 0, 0, 6, 238, pigments[1]);
  mono(g, 'INCIDENT 42    RUN-842    POLICY v3', 21, 30, 16, muted);
  text(g, 'Image pull: 401. Tests never started.', 21, 66, 21, ink);
  text(g, 'What should triage investigate first?', 21, 99, 20, ink);
  names
    .slice(0, 3)
    .forEach((name, i) => mono(g, letters[i] + '   ' + name, 21, 133 + 24 * i, 16, muted));
  mono(g, 'Reviewed B', 21, 217, 19, pigments[1]);
  g.restore();
  if (move >= 1) {
    mono(g, 'LABELING RULE', 46, 164, 16, muted);
    serif(g, '“Build failed”', 43, 232, 36, ink);
    text(g, 'C   Insufficient evidence', 45, 284, 23, pigments[2]);
    text(g, 'Include ambiguous cases and', 45, 352, 19, muted);
    text(g, 'instruction-like text in the log.', 45, 381, 19, muted);
  }
}
function losses(g, k) {
  stock(g, true);
  heading(g, 'ONE REVIEWED B   /   TWO TRAINERS', 'Which part of the record receives loss?', true);
  const head = cue(k, 2, "loss on B's probability"),
    comp = cue(k, 2, 'masks those input tokens');
  const adapter = cue(k, 3, 'smaller Kev checkpoints');
  const full = cue(k, 3, 'twenty-seven billion');
  mono(g, 'OPTION HEAD', 41, 175, 16, soft);
  [0, 1, 2].forEach((i) => {
    const x = 279 + i * 111;
    key(g, i, x, 176, true);
    if (head && i === 1) {
      line(g, x - 7, 197, x + 38, 197, lights[1], 3);
      mono(g, '−ln p(B)', x - 13, 230, 17, white);
    }
  });
  mono(g, 'LETTER COMPLETION', 41, 305, 16, soft);
  const cells = [
    ['log', 97],
    ['question', 141],
    ['choices', 128],
    ['B', 61],
  ];
  let x = 280;
  cells.forEach(([label, w], i) => {
    rect(g, x, 271, w - 5, 51, i === 3 && comp ? lights[1] : '#304a4a', 4);
    mono(g, label, x + (w - 5) / 2, 304, 19, i === 3 && comp ? ink : white, 'center');
    x += w;
  });
  if (comp) {
    line(g, 280, 335, 638, 335, soft, 1.5);
    mono(g, 'Input tokens masked', 280, 363, 16, soft);
    mono(g, 'Loss here', 640, 363, 16, lights[1]);
  }
  if (adapter) {
    text(g, 'Smaller Kev models: train adapters + head', 42, 426, 20, white);
    if (full) text(g, 'Kev-27B v2: fine-tune the backbone', 42, 461, 20, white);
  }
  if (k.beat.beatIndex === 4) {
    rect(g, 26, 393, 911, 87, night);
    text(g, 'Tev1 publishes a starting recipe.', 42, 426, 22, white);
    text(g, 'Exact hosted training settings remain unverified.', 42, 460, 20, soft);
  }
}
function evaluation(g, k) {
  stock(g);
  heading(g, 'GROUP-HELD-OUT EVALUATION', 'What can each split be used to choose?');
  const steps = [
    cue(k, 5, 'Fit the temperature'),
    cue(k, 5, 'choose the routing cutoff'),
    cue(k, 5, 'opening the final incident groups'),
  ];
  const entries = [
    ['Calibration', 'Fit a positive T', 'Held-out logits and labels'],
    ['Development', 'Choose the cutoff', 'T is fixed'],
    ['Final test', 'Measure errors', 'Both settings are fixed'],
  ];
  entries.forEach(([label, act, condition], i) => {
    const x = 46 + i * 303;
    folder(g, x, 198, 264, 148, label.toUpperCase(), steps[i] ? pigments[i] : '#657774');
    if (steps[i]) {
      text(g, act, x + 16, 274, 23, white);
      text(g, condition, x + 16, 313, 17, white);
    }
  });
  const timed = k.beat.beatIndex === 6;
  mono(g, timed ? 'WORKFLOW TIMING' : 'FINAL TEST', 47, 411, 15, muted);
  text(
    g,
    timed
      ? 'Read log   →   score questions   →   deliver ticket'
      : 'Compare stated probabilities with observed frequencies.',
    46,
    449,
    23,
    ink,
  );
  if (timed) mono(g, 'Measure corrections and rollback after delivery.', 47, 483, 16, muted);
  else if (cue(k, 5, 'Suppose ten predictions')) {
    const total = 10,
      correct = 6;
    rect(g, 34, 424, 890, 76, paper);
    mono(g, 'Bin: mean p = 0.80', 46, 451, 19, ink);
    if (cue(k, 5, 'Six correct'))
      mono(
        g,
        'Observed: ' + correct + ' / ' + total + ' = ' + fmt(correct / total, 2),
        475,
        451,
        19,
        pigments[1],
      );
    if (cue(k, 5, 'A multiclass Brier score'))
      mono(g, 'Brier = mean over cases of Σ (probability − target)²', 47, 487, 17, muted);
  } else if (cue(k, 5, 'reliability bins'))
    mono(g, 'Reliability bins    /    Brier score', 47, 483, 17, muted);
}
export function training(g, k) {
  if (k.beat.beatIndex <= 1) return group(g, k);
  if (k.beat.beatIndex <= 4) return losses(g, k);
  return evaluation(g, k);
}
