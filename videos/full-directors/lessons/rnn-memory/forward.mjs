import {
  paper,
  pale,
  ink,
  mute,
  rule,
  teal,
  red,
  blue,
  gold,
  green,
  blush,
  sea,
  rect,
  line,
  dot,
  poly,
  arrow,
  text,
  num,
  title,
  note,
  footFormula,
  fmt,
  pair,
  cue,
  alpha,
  animal,
  clamp,
  lerp,
} from './drawing.mjs';
import {
  m,
  dog,
  cat,
  verb,
  counts,
  inputs,
  scalar,
  states,
  wx,
  wh,
  eventNames,
  actionNames,
  orderRetention,
  stackedTerms,
  mv,
  sum,
  allowed,
  addresses,
  segments,
  combined,
} from './examples.mjs';

function afterPhrase(k, beat, phrase, seconds = 0) {
  if (k.beat.beatIndex !== beat - 1) return Number(k.beat.beatIndex > beat - 1);
  k.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = k.elapsed - k.wordCue(phrase).end;
  return seconds ? clamp(elapsed / seconds) : Number(elapsed >= 0);
}

function chase(c, x, y, w, h, hunter, run) {
  const isDog = hunter === 'dog',
    dir = isDog ? 1 : -1;
  rect(c, x, y, w, h, isDog ? '#dceae7' : '#fae2cf');
  const floor = y + h * 0.73,
    s = w / 680;
  line(c, x + 20, floor, x + w - 20, floor, isDog ? '#98b7b4' : '#caab96', 3);
  for (let i = 0; i < 17; i++) {
    const px = x + 20 + (((i * w) / 17 - run * 60 * dir + w) % w) * 0.94;
    line(c, px, floor + 10, px + 9 * s, floor + 10, '#a7aa9c', 2);
  }
  const phase = run * Math.PI * 4,
    dx = dir * (run - 0.5) * w * 0.07;
  animal(
    c,
    hunter,
    x + w * (isDog ? 0.3 : 0.7) + dx,
    floor - 49 * s,
    s * 0.96,
    isDog ? blue : red,
    phase,
    dir,
  );
  animal(
    c,
    isDog ? 'cat' : 'dog',
    x + w * (isDog ? 0.73 : 0.27) + dx,
    floor - 49 * s,
    s * 0.96,
    isDog ? red : blue,
    phase + 0.8,
    dir,
  );
  arrow(
    c,
    x + w * 0.5 - dir * 32 * s,
    y + h * 0.22,
    x + w * 0.5 + dir * 32 * s,
    y + h * 0.22,
    ink,
    4 * s,
  );
}
export function opening(c, k) {
  const second = cue(k, 1, 'Watch the second chase', 1.2),
    freeze = cue(k, 1, 'Freeze the pictures', 0.8);
  title(c, 'Who chased whom?');
  if (freeze === 0) {
    const catRuns = second > 0;
    chase(
      c,
      216,
      188,
      1488,
      522,
      catRuns ? 'cat' : 'dog',
      catRuns ? second : Math.min(k.elapsed / 1.8, 1),
    );
    text(
      c,
      catRuns ? 'The cat chased the dog.' : 'The dog chased the cat.',
      960,
      800,
      70,
      ink,
      'center',
      'Serif',
    );
  } else {
    chase(c, 102, 230, 824, 398, 'dog', 1);
    chase(c, 994, 230, 824, 398, 'cat', 1);
    const bothFit = cue(k, 2, 'both sentences', 0, { captionStart: 'Unfreeze the words' });
    alpha(c, cue(k, 2, 'Dog comes before', 0.6), () =>
      text(c, 'The dog chased the cat.', 514, 685, 48, blue, 'center', 'Serif'),
    );
    alpha(c, cue(k, 2, 'Cat comes before', 0.6), () =>
      text(c, 'The cat chased the dog.', 1406, 685, 48, red, 'center', 'Serif'),
    );
    const bag = counts(dog.words),
      labels = ['the', 'dog', 'chased', 'cat'];
    line(c, 198, 769, 1722, 769, rule, 3);
    labels.forEach((w, i) => {
      const x = 390 + i * 380;
      text(c, w, x - 14, 842, 44, ink, 'right');
      num(c, '× ' + bag[w], x + 8, 842, 42, teal);
    });
    text(
      c,
      bothFit ? 'Both chases have these counts.' : 'Which chase has these counts?',
      960,
      935,
      52,
      ink,
      'center',
    );
  }
}

const wordX = (i) => 305 + i * 324;
function words(c, trace, active, y = 267) {
  trace.words.forEach((w, i) => {
    const x = wordX(i);
    text(c, w, x, y, 52, i === active ? ink : mute, 'center', 'Serif');
    if (i === active) line(c, x - 58, y + 42, x + 58, y + 42, teal, 6);
  });
}
function actorLine(c, trace, progress, color, { hideLastInput = false, faint = false } = {}) {
  const zero = 565,
    scale = 218,
    pts = trace.states.slice(1).map((v, i) => [wordX(i), zero - v * scale]);
  for (let i = 0; i < pts.length; i++) {
    const visible = progress >= i,
      q = Math.max(0, Math.min(1, progress - i + 1));
    if (i > 0 && q > 0)
      line(
        c,
        ...pts[i - 1],
        lerp(pts[i - 1][0], pts[i][0], q),
        lerp(pts[i - 1][1], pts[i][1], q),
        color,
        8,
      );
    if (visible) {
      dot(c, ...pts[i], faint ? 7 : 12, color);
      if (!faint)
        num(
          c,
          fmt(trace.states[i + 1]),
          pts[i][0],
          pts[i][1] + (trace.actor === 'dog' ? -36 : 36),
          30,
          color,
          'center',
        );
    }
    if (!faint)
      num(
        c,
        'x = ' + (hideLastInput && i === pts.length - 1 ? '?' : fmt(trace.inputs[i], 1)),
        pts[i][0],
        339,
        32,
        i === 1 ? color : mute,
        'center',
      );
  }
}
export function actor(c, k) {
  title(c, 'Follow the clue past the last noun');
  const b = k.beat.beatIndex;
  const reverse = cue(k, 5, 'Swap the animals', 0.8);
  const finalInput = afterPhrase(k, 4, 'so its actor input is zero too');
  const dogStep =
    cue(k, 2, 'Dog writes', 1.0) +
    cue(k, 2, 'At the verb', 1.0) +
    cue(k, 2, 'The next word', 1.0) +
    afterPhrase(k, 4, 'The line ends above zero', 0.7);
  const catStep =
    cue(k, 5, 'writes a negative value', 1.0) + 3 * cue(k, 5, 'through the rest', 2.3);
  const trace = reverse ? cat : dog;
  const activeWord = [2, 3].includes(b) ? dog.words.length - 1 : Math.floor(reverse ? catStep : dogStep);
  words(c, trace, activeWord);
  line(c, 180, 565, 1750, 565, rule, 3);
  num(c, '0', 134, 565, 31, mute);
  actorLine(c, dog, dogStep, reverse ? '#98adbe' : blue, {
    hideLastInput: !finalInput,
    faint: Boolean(reverse),
  });
  if (reverse) text(c, 'dog first', 1754, 565 - 218 * dog.final, 28, blue, 'center');
  if (reverse) actorLine(c, cat, catStep, red);
  if (b === 2) note(c, 'Can the last noun reverse the sign?', 788);
  else if (dogStep === 4 && !reverse && afterPhrase(k, 4, 'can still identify the dog'))
    text(c, 'Positive state   →   dog acted', 960, 785, 49, blue, 'center');
  else if (catStep === 4 && afterPhrase(k, 5, 'It ends below zero, so the readout picks the cat'))
    text(c, 'Negative state   →   cat acted', 960, 785, 49, red, 'center');
  line(c, 108, 816, 1812, 816, rule, 2);
  num(c, 'h = tanh(x + 0.9 × previous h)', 960, 848, 44, ink, 'center');
}

export function shared(c, k) {
  title(c, 'One reader, two memory coordinates');
  const step =
    cue(k, 3, 'Cat writes', 0.8) +
    cue(k, 3, 'Chased writes', 1.0) +
    cue(k, 3, 'At the article', 0.9) +
    cue(k, 3, 'At the final noun', 0.9);
  const landed = Number.isInteger(step);
  words(c, cat, landed ? step : -1, 225);
  if (!landed)
    text(c, 'Reading “' + cat.words[Math.ceil(step)] + '”', 960, 320, 32, mute, 'center');
  [cat.states, verb].forEach((values, row) => {
    const y = 420 + row * 225,
      color = row ? teal : red,
      i = Math.floor(step),
      v = values[i + 1];
    text(c, row ? 'Verb' : 'Actor', 112, y, 47, ink);
    line(c, 420, y, 1450, y, rule, 4);
    line(c, 935, y - 27, 935, y + 27, mute, 3);
    const pos = 935 + 515 * (v + (values[Math.min(i + 2, 5)] - v) * (step - i));
    line(c, 935, y, pos, y, color, 16);
    dot(c, pos, y, 20, color);
    if (landed) num(c, fmt(v), 1745, y, 53, color, 'right');
  });
  if (k.beat.beatIndex >= 3) {
    for (let i = 0; i < 5; i++) {
      const x = wordX(i);
      rect(c, x - 62, 751, 124, 48, sea);
      text(c, 'cell', x, 776, 32, ink, 'center');
      if (i < 4) arrow(c, x + 77, 775, x + 245, 775, teal, 3);
    }
    note(c, 'Five applications of the same cell', 919);
  } else {
    num(c, 'W input = [[1, 0], [0, 1]]', 490, 800, 36, teal, 'center');
    num(c, 'W recurrent = [[0.9, 0], [0, 0.9]]', 1380, 800, 36, blue, 'center');
    footFormula(c, 'h = tanh(input contribution + recurrent contribution)     bias = 0');
  }
}

export function eventOrder(c, k) {
  const b = k.beat.beatIndex;
  title(c, b < 3 ? 'When did the error arrive?' : 'Replay the incident through a tanh cell');
  const colors = [blue, red, green];
  if (b < 3) {
    const orders = [
      [0, 1, 2],
      [2, 1, 0],
    ];
    const starts = [
      ['An error comes in', 'but first we keep', 'When rollback arrives'],
      ['Rollback goes first', 'Reproduction discounts it', 'error goes in last'],
    ];
    const barScale = 248;
    const columnX = (i) => 413 + i * 476;
    const rowY = (row) => 326 + row * 311;
    const appendPhrase = 'so the whole blue bar survives';
    const appendSpan = b === 2
      ? k.wordCue(appendPhrase).end - k.wordCue(appendPhrase).start
      : 0;
    const freshError = cue(k, 3, appendPhrase, appendSpan, { captionStart: false });
    const comparison = afterPhrase(
      k,
      3,
      'Discounting the older signals puts the second history ahead',
    );
    for (const [row, order] of orders.entries()) {
      if (row && b < 1) continue;
      const y = rowY(row);
      text(c, row ? 'Reversed' : 'Original', 105, y + 27, 44, ink, 'left', 'Serif');
      order.forEach((ev, i) => {
        const x = columnX(i);
        const progress = cue(k, row ? 3 : 1, starts[row][i], i === 0 ? 1 : 1.85, {
          captionStart: false,
        });
        const keep = clamp((progress - 0.1) / 0.44);
        const finalComparison = row === 1 && i === 2;
        const add = finalComparison
          ? freshError
          : i === 0
            ? progress
            : clamp((progress - 0.64) / 0.36);
        const terms = stackedTerms(order, i);
        text(c, eventNames[ev], x, y - 94, 42, colors[ev], 'left', 'Serif');
        num(c, 'input ' + fmt(inputs[ev], 1), x, y - 46, 33, colors[ev]);
        if (progress === 0) {
          line(c, x, y + 27, x + 331, y + 27, rule, 2, [7, 12]);
          return;
        }
        const old = i ? stackedTerms(order, i - 1) : [];
        const oldWidth = sum(old) * barScale;
        if (i) {
          const from = columnX(i - 1) + oldWidth + 18;
          arrow(c, from, y + 27, x - 20, y + 27, mute, 4);
        }
        let edge = x;
        terms.forEach((value, j) => {
          const width = (j === i ? value * add : lerp(old[j], value, keep)) * barScale;
          if (width > 0) rect(c, edge, y, width, 54, colors[order[j]]);
          edge += width;
        });
        if (i && add === 0) {
          line(c, x, y + 66, x + oldWidth, y + 66, mute, 2, [6, 8]);
          line(c, x + oldWidth, y + 57, x + oldWidth, y + 75, mute, 2);
        }
        if (add === 1 && (!finalComparison || comparison === 1))
          num(c, fmt(sum(terms)), x, y + 108, 42);
        else if (i && add === 0)
          num(c, '× ' + fmt(orderRetention, 1), x, y + 108, 38, mute);
        else if (add < 1) num(c, '+ ' + fmt(inputs[ev], 1), x, y + 108, 38, colors[ev]);
        if (i === 2 && comparison === 1)
          num(c, 'from error ' + fmt(terms[order.indexOf(0)], 2), x, y + 162, 39, blue);
      });
    }
    if (comparison === 1) {
      const originalEnd = columnX(2) + sum(stackedTerms(orders[0], 2)) * barScale;
      line(c, originalEnd, rowY(0) + 58, originalEnd, rowY(1) - 4, mute, 2, [5, 8]);
    }
    footFormula(c, 'state = ' + fmt(orderRetention, 1) + ' × previous state + input');
    if (b === 1) note(c, 'Which order leaves a larger state?', 165);
    else if (afterPhrase(k, 3, 'Adding the raw signals gives two point three in either order'))
      note(c, 'Sum without discounting = ' + fmt(sum(inputs), 1), 165);
  } else {
    const pos =
      cue(k, 4, 'At the error') + cue(k, 4, 'At reproduction') + cue(k, 5, 'Rollback finishes');
    const xs = [194, 686, 1178, 1670],
      ys = scalar.map((v) => 646 - 330 * v);
    line(c, 178, 646, 1730, 646, rule, 3);
    xs.forEach((x, i) => {
      text(c, i ? eventNames[i - 1] : 'start', x, 730, 38, ink, 'center');
      if (i) {
        const q = Math.min(1, Math.max(0, pos - i + 1));
        if (q)
          line(c, xs[i - 1], ys[i - 1], lerp(xs[i - 1], x, q), lerp(ys[i - 1], ys[i], q), teal, 8);
      }
      if (pos >= i) {
        dot(c, x, ys[i], 17, teal);
        num(c, fmt(scalar[i]), x, ys[i] - 58, 45, teal, 'center');
      }
    });
    footFormula(c, 'h = tanh(0.8 × event + 0.5 × previous h)');
  }
}

function matrix(c, x, y, rows, active, dx = 145, dy = 83) {
  rows.forEach((row, r) =>
    row.forEach((v, j) => {
      const xx = x + j * dx,
        yy = y + r * dy;
      rect(c, xx - 59, yy - 34, 118, 68, j === active ? sea : '#e7e6db');
      num(c, fmt(v, 1), xx, yy, 38, ink, 'center');
    }),
  );
}
export function vector(c, k) {
  const b = k.beat.beatIndex,
    t = b >= 4 ? 2 : b >= 2 ? 1 : 0;
  title(c, 'Which numbers enter the next state?');
  text(c, 'Event weights', 269, 210, 45, ink, 'left', 'Serif');
  text(c, 'Recurrent weights', 1008, 210, 45, ink, 'left', 'Serif');
  matrix(c, 325, 326, wx, t);
  matrix(c, 1070, 326, wh, -1);
  num(
    c,
    eventNames[t] +
      '   ' +
      pair(
        [0, 1, 2].map((i) => Number(i === t)),
        0,
      ),
    258,
    508,
    38,
    teal,
  );
  num(c, 'old h   ' + pair(states[t]), 1008, 508, 38, blue);
  line(c, 106, 583, 1812, 583, rule);
  const rq =
    b >= 4
      ? cue(k, 5, 'Carry both coordinates')
      : b >= 2
        ? cue(k, 4, 'Half of the first')
        : cue(k, 2, 'old state is zero');
  const sq =
    b >= 4
      ? cue(k, 5, 'Apply tanh')
      : b >= 2
        ? cue(k, 4, 'then apply tanh')
        : cue(k, 2, 'Apply tanh');
  const recur = mv(wh, states[t]);
  for (let j = 0; j < 2; j++) {
    const y = 681 + j * 118;
    text(c, 'Coordinate ' + (j + 1), 142, y, 41, ink);
    num(c, fmt(wx[j][t]), 546, y, 46, teal);
    alpha(c, rq, () => num(c, '+   ' + fmt(recur[j]), 823, y, 46, blue));
    alpha(c, sq, () => num(c, '→   tanh   →   ' + fmt(states[t + 1][j]), 1205, y, 39, ink));
  }
  if (t === 1) {
    num(
      c,
      'First recurrent row    0.5 × ' +
        fmt(states[1][0]) +
        ' + 0.1 × ' +
        fmt(states[1][1]) +
        (rq ? ' ≈ ' + fmt(recur[0]) : ''),
      960,
      866,
      37,
      blue,
      'center',
    );
  } else note(c, 'One selected column supplies the input for both rows.', 866);
}
export function head(c, k) {
  title(
    c,
    k.beat.beatIndex < 2
      ? 'Which action does this state support?'
      : 'How many parameters does a longer log need?',
  );
  if (k.beat.beatIndex < 2) {
    num(c, 'h = ' + pair(m.roundedState), 110, 225, 47, ink);
    const show = cue(k, 2, 'Rollback leads', 1),
      prob = cue(k, 2, 'divide each exponential', 1.2);
    for (let j = 0; j < 3; j++) {
      const y = 375 + j * 160;
      text(c, actionNames[j], 128, y, 50, j === 1 && show ? teal : ink);
      num(c, pair(m.readout[j], 1) + ' · h', 482, y, 44, mute);
      if (show) {
        rect(c, 1082, y - 22, m.logits[j] * 770, 44, j === 1 ? teal : rule);
        num(c, fmt(m.logits[j], 4), 1082, y + 56, 31, ink);
      }
      alpha(c, prob, () =>
        num(c, fmt(100 * m.probabilities[j], 1) + '%', 1740, y, 48, j === 1 ? teal : ink, 'right'),
      );
    }
    footFormula(
      c,
      prob ? 'pᵢ = exp(sᵢ − max s) / Σ exp(sⱼ − max s)' : 'score = action weights · final state',
    );
  } else {
    const groups = [
      ['Input weights', wx.flat().length, 'Six input weights'],
      ['Recurrent weights', wh.flat().length, 'four recurrent weights'],
      ['Cell biases', wh.length, 'two biases'],
      ['Head weights + biases', m.readout.flat().length + m.readout.length, 'adds nine'],
    ];
    groups.forEach(([name, n, phrase], j) => {
      const x = 173 + j * 445;
      text(c, name, x, 320, 34, ink);
      const cols = [wx[0].length, wh[0].length, 1, m.readout[0].length + 1][j];
      for (let i = 0; i < n; i++)
        rect(
          c,
          x + (i % cols) * 55,
          395 + Math.floor(i / cols) * 55,
          44,
          44,
          j === 3 ? blue : teal,
        );
      if (cue(k, 4, phrase, 0)) num(c, n, x, 654, 66, j === 3 ? blue : teal);
    });
    const cellSize = sum(groups.slice(0, 3).map(([, n]) => n));
    const headSize = groups[3][1];
    if (cue(k, 4, 'twenty-one parameters', 0))
      footFormula(
        c,
        '300 events      ' +
          cellSize +
          ' cell + ' +
          headSize +
          ' head = ' +
          (cellSize + headSize) +
          ' parameters',
      );
    else if (cue(k, 4, 'make twelve', 0))
      footFormula(
        c,
        'Cell parameters   ' +
          groups
            .slice(0, 3)
            .map(([, n]) => n)
            .join(' + ') +
          ' = ' +
          cellSize,
      );
  }
}

export function context(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    title(c, 'What can the decoder read?');
    const xs = [172, 470, 768];
    xs.forEach((x, i) => {
      text(c, eventNames[i], x, 321, 37, ink, 'center');
      dot(c, x, 416, 23, teal);
      if (i < 2) arrow(c, x + 32, 416, x + 265, 416, teal);
    });
    arrow(c, 804, 416, 990, 416, teal);
    rect(c, 1003, 351, 462, 130, sea);
    num(c, pair(states[3]), 1234, 418, 47, ink, 'center');
    text(c, 'encoder context', 1234, 539, 41, teal, 'center');
    arrow(c, 1482, 416, 1610, 416, teal);
    text(c, 'decoder', 1625, 416, 45, ink);
    const cho = cue(k, 1, 'at each decoder step'),
      init = cue(k, 1, 'initialize the decoder');
    [
      [cho, 'Cho et al.', true],
      [init, 'Sutskever et al.', false],
    ].forEach(([vis, name, each], r) => {
      if (!vis) return;
      const y = 699 + 140 * r;
      text(c, name, 242, y, 39, ink, 'left', 'Serif');
      text(c, each ? 'context at each step' : 'initialize once', 572, y, 34, teal);
      for (let i = 0; i < 3; i++) {
        const x = 1050 + i * 240;
        dot(c, x, y, 17, blue);
        if (i < 2) arrow(c, x + 25, y, x + 206, y, blue, 4);
        if (!i || each) arrow(c, x, y - 65, x, y - 21, teal, 4);
      }
    });
  } else if (b < 4) {
    title(c, 'Where can history seventeen go?');
    const occupied = addresses.length * cue(k, 3, 'Assign a different four-bit code', 2.3);
    for (let i = 0; i < addresses.length; i++) {
      const x = 140 + (i % 8) * 211,
        y = 321 + Math.floor(i / 8) * 210;
      const collide = i === 0 && cue(k, 4, 'already holding history one');
      rect(c, x, y, 185, 168, collide ? blush : occupied > i ? sea : '#e4e3d8');
      num(c, addresses[i], x + 92, y + 48, 43, ink, 'center');
      if (occupied > i)
        text(
          c,
          collide ? '1 and 17' : 'history ' + (i + 1),
          x + 92,
          y + 121,
          32,
          collide ? red : teal,
          'center',
        );
    }
    footFormula(c, '2 coordinates × 2 bits = 4 bits     2⁴ = 16 codes');
  } else if (b === 9) {
    title(c, 'Which recurrence can combine segments?');
    const first = cue(k, 10, 'One segment doubles'),
      next = cue(k, 10, 'next triples'),
      joined = cue(k, 10, 'add seven');
    text(c, 'Incoming h', 143, 435, 45, ink, 'left', 'Serif');
    [
      [536, first],
      [1140, next],
    ].forEach(([x, vis], i) => {
      const [scale, offset] = segments[i],
        expr = scale + (i ? 'u' : 'h') + ' + ' + offset;
      rect(c, x, 344, 444, 164, i ? '#dce4ef' : sea);
      arrow(c, x - 131, 426, x - 17, 426, teal);
      text(c, 'Segment ' + (i + 1), x + 222, 291, 39, mute, 'center');
      alpha(c, vis, () => num(c, expr, x + 222, 426, 60, ink, 'center'));
    });
    if (joined) {
      line(c, 536, 571, 1584, 571, teal, 5);
      num(
        c,
        '3(2h + 1) + 4 = ' + combined[0] + 'h + ' + combined[1],
        1060,
        686,
        55,
        teal,
        'center',
      );
    }
    note(c, 'Prepared affine transitions compose. A nonlinear GRU still needs the previous state.');
  } else if (b === 4) {
    title(c, 'How many handoffs from first to last?');
    const n = 8,
      p = cue(k, 5, 'Follow the first state', 2.3);
    for (let i = 0; i < n; i++) {
      const x = 189 + i * 219;
      dot(c, x, 450, 41, i <= 7 * p ? teal : mute);
      num(c, i + 1, x, 450, 36, pale, 'center');
      if (i < 7) arrow(c, x + 52, 450, x + 168, 450, i + 1 <= 7 * p ? teal : rule, 5);
    }
    const shortCount = p === 1 && cue(k, 5, 'seven handoffs', 0);
    const longCount = cue(k, 5, 'four thousand ninety-five links', 0);
    footFormula(
      c,
      '8 positions' +
        (shortCount ? ' → 7 links' : '') +
        (cue(k, 5, 'With four thousand ninety-six positions', 0) ? '      4,096 positions' : '') +
        (longCount ? ' → 4,095 links' : ''),
    );
  } else {
    title(
      c,
      b >= 7
        ? 'How many query and key pairs are allowed?'
        : 'Which positions can query eight read?',
    );
    const dx = 63,
      x0 = 354,
      y0 = 298;
    const rows = Math.ceil(8 * cue(k, 6, 'Follow the rows down', 2.2));
    for (let j = 0; j < 8; j++) {
      num(c, j + 1, x0 + j * dx + 24, y0 - 47, 27, mute, 'center');
      num(c, j + 1, x0 - 46, y0 + j * dx + 23, 26, mute, 'center');
      for (let i = 0; i < 8; i++)
        rect(
          c,
          x0 + i * dx,
          y0 + j * dx,
          49,
          49,
          i <= j && j < rows ? (j === 7 ? blue : teal) : '#e0dfd7',
        );
    }
    text(c, 'key', 570, 193, 35, mute, 'center');
    text(c, 'query', 166, 515, 34, mute);
    text(c, 'Query 8', 1035, 319, 62, ink, 'left', 'Serif');
    if (rows === 8 && cue(k, 6, 'Query eight can read', 0))
      num(c, 'keys 1 … 8', 1036, 424, 47, blue);
    if (b >= 6) {
      text(c, 'Scale the scores, mask the future,', 1036, 553, 37, ink);
      text(c, 'then mix values with softmax weights.', 1036, 609, 37, ink);
    }
    if (b >= 7)
      num(
        c,
        '1 + 2 + … + 8' + (cue(k, 9, 'thirty-six interactions', 0) ? ' = ' + allowed(8) : ''),
        1036,
        757,
        41,
        teal,
      );
    const cap =
      b === 8
        ? 'FlashAttention tiles the pairs. Generating the next token still waits.'
        : b === 7
          ? 'Each colored square pairs one query with one allowed key.'
          : 'Rows are supplied positions. Position information distinguishes their order.';
    if (b === 8 && cue(k, 9, 'At width d', 0) && !cue(k, 9, 'FlashAttention', 0))
      note(c, 'Recurrent work O(Ld²)     •     Dense attention adds O(L²d)', 838);
    else if (b !== 8 || cue(k, 9, 'FlashAttention', 0)) note(c, cap, 838);
  }
}
