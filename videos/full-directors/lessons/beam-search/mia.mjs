import { loadImage } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { ink, muted, paper, brass, colors, pct, fmt, lerp } from './studio.mjs';
import {
  OPENING,
  WIDTH_TWO as two,
  WIDTH_THREE as three,
  NEXT,
  paths,
  counts,
  wider,
  twoTokens,
  conditionalEdgeExperiment,
  expansionLabel,
} from './examples.mjs';

// The three bays come from the painted house in the course's approved short.
const house = await loadImage(fileURLToPath(new URL('./mia-house.jpg', import.meta.url)));
function rooms(s, shutter = 0) {
  const x = 106,
    y = 291,
    w = 1708,
    h = 440;
  s.g.drawImage(house, x, y, w, h);
  const rightRoom = x + (1168 * w) / 1776,
    top = y + (138 * h) / 524,
    width = (510 * w) / 1776,
    height = ((379 * h) / 524) * shutter;
  if (height > 0) {
    s.rect(rightRoom, top, width, height, '#48545b');
    for (let i = 6; i < height; i += 23)
      s.line(rightRoom, top + i, rightRoom + width, top + i, '#728086', 4);
    s.rect(rightRoom + width * 0.44, top + height - 4, width * 0.12, 4, brass);
  }
  OPENING.forEach(([name, p], i) => {
    const center = x + ((354 + 535 * i) * w) / 1776;
    const c = i === 2 && shutter === 1 ? muted : ink;
    s.word(name, center, 784, 60, c, 'center');
    s.mono(pct(p), center, 857, 50, c, 'center');
  });
}
export function openings(s) {
  if (s.b === 5) {
    s.head('Next tree', 'Mia …');
    rooms(s);
    s.label('EOS completes a sentence. Expand up to four generated tokens, including EOS.', 109, 933, 37);
    return;
  }
  const oneKept = s.b === 2 && s.clock.elapsed >= s.clock.wordCue('Create').end;
  const width = s.on(3, 'This time keep two') ? 2 : 1;
  const kept = [
    oneKept || s.on(3, 'Create keeps its slot'),
    s.on(3, 'first gets the second'),
    false,
  ];
  const cut = [false, oneKept, oneKept || s.on(3, 'revoke drops out')];
  const showChild = [
    s.b === 2 ? s.on(2, 'is a period') : kept[0],
    s.on(3, 'create has a seventy percent chance'),
  ];
  const showEdge = [s.b > 2 || s.on(2, 'one-in-five chance'), showChild[1]];
  if (s.b === 4) s.clock.reveal('first create', 0, { captionStart: 'first create' });
  const progress = [
    pathResult(s, 2, 'eight percent'),
    pathResult(s, 4, 'twenty-four and a half percent'),
  ];

  s.head('Exactly two generated tokens', 'You should …');
  s.label('Opening token', 115, 308, 38);
  s.label('Best next token', 594, 308, 38);
  s.label('Probability from the prompt', 1015, 308, 38);

  const scaleX = 1015;
  const scaleWidth = 765;
  const probabilityWidth = (p) => scaleWidth * (p / 0.5);
  for (let i = 0; i <= 5; i++) {
    const x = scaleX + (scaleWidth * i) / 5;
    s.mono(pct(i / 10), x, 367, 33, muted, 'center');
    s.line(x, 395, x, 857, i === 0 ? muted : '#c5c3ae', i === 0 ? 3 : 2);
  }

  twoTokens.forEach(([token, p, child, q], i) => {
    const y = 450 + i * 166;
    const color = cut[i] ? '#cfceba' : colors[i];
    s.tile(115, y - 43, 294, 86, token, color, 52);
    s.mono(pct(p), 435, y, 44);
    if (kept[i] || cut[i]) s.label(kept[i] ? 'Kept' : 'Pruned', 115, y + 68, 34);

    const openingWidth = probabilityWidth(p);
    s.rect(scaleX, y - 32, openingWidth, 24, color);
    s.line(scaleX + openingWidth, y - 36, scaleX + openingWidth, y - 4, muted, 3);
    if (!showChild[i]) return;

    s.line(553, y, 586, y, muted, 4);
    s.tile(594, y - 43, 318, 86, child === '.' ? 'period (.)' : child, color, 48);
    if (showEdge[i]) s.mono('× ' + pct(q), 753, y + 68, 40, ink, 'center');
    const t = progress[i];
    if (t === 0) return;

    const joint = p * q;
    const pathWidth = probabilityWidth(lerp(p, joint, t));
    s.rect(scaleX, y + 12, pathWidth, 28, color);
    s.line(scaleX, y + 40, scaleX + pathWidth, y + 40, ink, 4);
    if (t === 1) s.mono(pct(p) + ' × ' + pct(q) + ' = ' + pct(joint), scaleX, y + 76, 39);
  });

  s.label('Opening slots    ' + width, 115, 900, 40);
  if (showChild[0]) {
    s.rect(scaleX, 891, 42, 16, colors[0]);
    s.label('Opening mass', scaleX + 57, 900, 34);
    s.rect(1376, 891, 42, 16, colors[0]);
    s.line(1376, 907, 1418, 907, ink, 4);
    s.label('Two-token path mass', 1433, 900, 34);
  }
}

function pathResult(s, beat, phrase) {
  if (s.b !== beat) return s.b > beat ? 1 : 0;
  const { start, end } = s.clock.wordCue(phrase);
  const animation = 0.6;
  const progress = s.clock.reveal(phrase, end - start + animation, { captionStart: phrase });
  if (progress === 1) return 1;
  return Math.max(0, (s.clock.elapsed - end) / animation);
}
export function conditional(s) {
  if (s.b === 1) {
    s.head('Mia', 'The first distribution belongs to the prompt');
    rooms(s);
    return;
  }
  const eos = s.b === 3;
  s.head(
    'Conditional edge',
    eos ? 'What ends a sentence?' : 'Carry the opening probability into its child',
  );
  s.route('door', 323, 562, 1.48);
  s.word(eos ? 'Mia opened the door' : 'Mia opened', 610, 409, 76);
  if (eos) {
    s.tile(624, 549, 375, 122, '.', colors[2], 70);
    s.label('punctuation', 1040, 610, 47);
    s.tile(624, 739, 375, 122, 'EOS', colors[0], 62);
    s.label('completed path', 1040, 800, 47);
  } else {
    s.tile(625, 541, 421, 125, 'opened', colors[0], 62);
    s.tile(1085, 541, 321, 125, 'the', colors[0], 62);
    const result = s.on(2, 'The same calculation');
    s.mono('.45 × .50 = ' + (result ? fmt(two.history[1].active[0].probability) : '?'), 624, 785, 57);
    if (s.on(2, 'adds the two edge scores'))
      s.label('log(.45) + log(.50) = ' + fmt(two.history[1].active[0].logProbability), 624, 890, 39);
  }
}
export function frontier(s) {
  const shutter = s.ramp(1, 'falls below', 0.85),
    cut = shutter === 1;
  s.head('Beam width 2', 'Which rooms can supply the next word?');
  rooms(s, shutter);
  s.label(
    s.b === 1
      ? cut
        ? 'Two active prefixes'
        : 'Three first-token candidates'
      : s.b === 2
        ? 'Compare all extensions of the two surviving prefixes.'
        : 'A pruned opening has no descendants in this run.',
    110,
    936,
    39,
  );
}
function parentRows(s, step, showResult = true) {
  const parents = [...new Set(step.expansions.map((e) => e.parent))];
  parents.forEach((p, j) => {
    const y = 339 + j * 295;
    s.word('Mia ' + p, 110, y + 84, 51, ink, 'left', 'Serif', 498);
    const children = step.expansions.filter((e) => e.parent === p);
    s.line(610, y + 86, 660, y + 86, '#8b9b8c', 3);
    children.forEach((e, i) => {
      const x = 680 + i * 387;
      const status = expansionLabel(e, step.step, two.horizon);
      const shade = !showResult
        ? '#dfd7bd'
        : e.completed
          ? brass
          : status === 'carry'
            ? colors[j]
            : '#cdcebb';
      s.tile(x, y + 22, 350, 110, e.token, shade, 51);
      s.mono(
        fmt(e.conditionalProbability) + ' → ' + fmt(e.probability, 5),
        x + 171,
        y + 174,
        32,
        ink,
        'center',
      );
      if (showResult)
        s.label(
          status,
          x + 171,
          y + 223,
          32,
          muted,
          'center',
        );
    });
  });
}
function compareMiaPaths(s) {
  const step = two.history[1];
  const named = [s.on(2, 'opened the and'), s.on(2, 'looked outside')];
  const carry = s.ramp(2, 'Carry them forward', 0.95);
  const travel = Math.max(0, (carry - 0.25) / 0.75);
  s.head('Width 2   /   generated position 2', carry > 0 ? 'Carry both prefixes forward' : 'Which two unfinished paths score highest?');
  s.label(carry > 0 ? 'Whole-path probability' : 'Next-token probability  →  whole-path probability', 110, 303, 48);

  two.history[0].active.forEach((parent, row) => {
    const y = 423 + row * 295;
    const children = step.expansions.filter(child => child.parent === parent.text);
    s.g.save();
    s.g.globalAlpha *= Math.max(0, 1 - 4 * carry);
    s.word('Mia ' + parent.text, 110, y, 57);
    s.mono(fmt(parent.probability), 110, y + 93, 46);
    s.g.restore();
    children.forEach((child, i) => {
      const chosen = child.status === 'active' && named[row];
      const x = 619 + i * 397;
      const shade = chosen ? colors[row] : child.completed ? brass : '#dfd7bd';
      s.g.save();
      if (!chosen) s.g.globalAlpha *= Math.max(0, 1 - 4 * carry);
      const left = chosen ? lerp(x, 100, travel) : x;
      const width = chosen ? lerp(363, 510, travel) : 363;
      const moving = chosen && carry > 0;
      s.tile(left, y - 56, width, 112, moving ? 'Mia ' + child.text : child.token, shade, 57);
      s.mono(
        moving ? fmt(child.probability, 4) : fmt(child.conditionalProbability) + ' → ' + fmt(child.probability, 4),
        left + width / 2, y + 92, 48, ink, 'center', width - 8,
      );
      s.g.restore();
    });
  });
}
export function lattice(s) {
  const step = s.b === 3 ? 3 : s.on(2, 'One expansion later') ? 2 : 1;
  if (step === 1) return compareMiaPaths(s);
  s.head(
    'Width 2   /   generated position ' + (step + 1),
    step === 3 ? 'Separate EOS from the unfinished words' : 'Expand each prefix on its own row',
  );
  parentRows(s, two.history[step], s.b >= 2);
  s.label('Edge label    conditional probability → joint probability', 110, 948, 34);
}
export function finish(s) {
  s.head('Mia   /   width 3', 'Collect the paths that reach EOS');
  paths.forEach((p, i) => {
    const y = 408 + i * 275;
    s.route(i ? 'door' : 'bed', 245, y + 40, 0.86);
    const reveal = i === 0 ? s.on(1, 'reaches EOS') : s.on(2, 'opened the door');
    if (!reveal) {
      s.word(i ? 'Mia opened' : 'Mia slept', 440, y, 65);
      s.label('active prefix', 440, y + 108, 39, muted);
      return;
    }
    s.word('Mia ' + p.text, 440, y, 65);
    s.tile(1510, y - 45, 230, 91, 'EOS', brass, 46);
    const product = i ? '.45 × .50 × .80 × .85' : '.20 × .95';
    if (s.b >= i + 2) s.mono(product + ' = ' + fmt(p.probability), 440, y + 108, 46);
  });
  if (s.b >= 4)
    s.label(
      'Four-token horizon    ·    EOS required    ·    unfinished prefixes stay ineligible',
      110,
      933,
      36,
    );
}
export function length(s) {
  const mean = s.on(2, 'Divide each completed');
  s.head(
    'Scoring completed sentences',
    mean ? 'Average log probability per generated token' : 'Total log probability',
  );
  paths.forEach((p, i) => {
    const y = 398 + i * 305;
    s.route(i ? 'door' : 'bed', 236, y + 45, 0.85);
    s.word('Mia ' + p.text, 425, y, 62);
    s.mono('L = ' + p.tokens.length + '  (EOS included)', 425, y + 100, 36);
    const value = mean ? p.meanLogProbability : p.logProbability;
    s.mono(
      fmt(p.logProbability) + (mean ? ' ÷ ' + p.tokens.length + ' = ' + fmt(value) : ''),
      1760,
      y,
      48,
      ink,
      'right',
    );
    const x = 1170 + (2 + value) * 267;
    s.line(1170, y + 100, 1704, y + 100, muted, 4);
    s.circle(x, y + 100, 17, colors[i]);
    s.label('−2', 1170, y + 145, 27);
    s.label('0', 1704, y + 145, 27);
  });
  if (s.b >= 4)
    s.label(
      s.b === 4
        ? 'The larger mean belongs to “opened the door.”'
        : 'Record the length formula and tune it with task quality on development examples.',
      109,
      943,
      37,
    );
}
export function work(s) {
  if (s.b < 3) {
    s.head('Search work', 'Two prefixes are waiting for their next word');
    if (s.b === 1) {
      s.word('Mia opened', 137, 465, 70);
      s.word('Mia looked', 137, 715, 70);
      [0, 1].forEach((j) =>
        NEXT[j ? 'looked' : 'opened'].forEach(([v], i) =>
          s.tile(721 + i * 354, 413 + j * 250, 320, 102, v, colors[j], 51),
        ),
      );
    } else {
      parentRows(s, two.history[1]);
      s.label('6 scored   ·   2 carried   ·   2 finished   ·   2 pruned', 110, 945, 40);
    }
  } else if (s.b === 3) {
    s.head('KV cache', 'Two prefixes can share the prompt’s saved state');
    const shared = s.on(3, 'let both prefixes point');
    if (shared) {
      s.tile(150, 500, 404, 129, 'Mia', brass, 69);
    }
    for (let i = 0; i < 2; i++) {
      const y = 387 + i * 340;
      if (!shared) s.tile(150, y, 404, 129, 'Mia', brass, 69);
      s.line(557, shared ? 564 : y + 65, 832, y + 65, muted, 6);
      s.tile(835, y, 692, 130, i ? 'looked' : 'opened', colors[i], 66);
    }
  } else {
    s.head('Four generated positions', 'How many candidate edges were scored?');
    counts.forEach((v, i) => {
      let y = 389 + i * 186;
      s.label('Width ' + (i + 1), 108, y, 45);
      s.rect(460, y - 39, 43 * v, 78, colors[i]);
      s.mono(v, 500 + 43 * v, y, 47);
    });
    s.label('Width three can score slept → EOS.', 110, 938, 42);
  }
}
export function squeeze(s) {
  const b = s.b;
  s.head('Three-token tree', 'Which paths fit above each cutoff?');
  const step = b < 2 ? 0 : b < 6 ? 1 : 2;
  wider.forEach((run, j) => {
    const x = 115 + j * 875;
    s.label('Width ' + run.width, x, 342, 45);
    let list = run.history[step].active;
    if (step === 1 && b === 2 && j === 1) list = run.history[0].active;
    if (step === 1 && b === 3 && j === 1) {
      const options = run.history[1].expanded
        .slice(0, 4)
        .sort((a, b) => a.tokens.join('').localeCompare(b.tokens.join('')));
      s.label('Candidates before ranking', x, 392, 31);
      options.forEach((e, i) => {
        const yy = 449 + i * 97;
        s.word(e.tokens.join(''), x + 14, yy, 43);
        s.mono(fmt(e.probability), x + 258, yy, 40);
      });
      s.label('3 slots', x + 453, 604, 43);
      return;
    }
    list.forEach((e, i) => {
      const yy = 420 + i * 100;
      const name = e.tokens.join('');
      const color = colors[name[0] === 'A' ? 0 : name[0] === 'B' ? 1 : 2];
      s.tile(x, yy, 432, 75, name, color, 42);
      s.mono(fmt(e.probability), x + 488, yy + 36, 42);
    });
    s.line(x, 420 + run.width * 100 - 13, x + 676, 420 + run.width * 100 - 13, ink, 5, [15, 8]);
  });
  const note = [
    'A .50      B .30      C .20',
    'A splits .80 / .18 / .02.       B splits ten ways.',
    'C splits in half. Locate A2 against the third slot.',
    'A2 survives only in width two.',
    'A2 keeps all its mass. Other survivors split ten ways.',
    'Best final probabilities     .09 at width two      .04 at width three',
  ][b - 1];
  s.label(note, 114, 938, 39);
}
export function conventions(s) {
  const b = s.b;
  if (b < 3) {
    s.head('Path extension', 'A child inherits a fraction of its own parent');
    s.tile(125, 485, 326, 119, 'prompt', brass, 57);
    for (let i = 0; i < (b === 1 ? 1 : 2); i++) {
      const y = 385 + i * 328;
      s.line(450, 545, 688, y + 49, muted, 6);
      s.tile(690, y, 316, 103, i ? 'create' : 'EOS', colors[i], 56);
      s.mono(i ? '.99' : '.01', 1070, y + 48, 54);
      if (i) {
        s.tile(1320, y, 277, 103, 'EOS', brass, 50);
        s.mono('× .90', 1639, y + 48, 42);
      }
    }
    if (b === 2) s.label('Longer completion    .99 × .90 = .891', 110, 931, 44);
  } else {
    const gnmt = b === 4;
    s.head('Completed log scores', gnmt ? 'GNMT divisor at α = 1' : 'Divide by generated length');
    [
      [-1, 2],
      [-1.6, 5],
    ].forEach(([z, l], i) => {
      const y = 428 + i * 262;
      s.word(i ? 'Long' : 'Short', 112, y, 62);
      for (let k = 0; k < l; k++)
        s.tile(
          447 + k * 128,
          y - 49,
          110,
          100,
          k === l - 1 ? 'EOS' : '•',
          k === l - 1 ? brass : colors[i],
          39,
        );
      const den = gnmt ? (5 + l) / 6 : l;
      s.mono(
        fmt(z) + ' ÷ ' + (gnmt ? '(' + (5 + l) + '/6)' : l) + ' = ' + fmt(z / den),
        1770,
        y,
        53,
        ink,
        'right',
        641,
      );
    });
    s.label(
      gnmt
        ? 'The larger GNMT score belongs to the short completion.'
        : 'The larger mean belongs to the long completion.',
      110,
      931,
      42,
    );
  }
}
export function replayMia(s) {
  const motion = s.ramp(3, 'Move three tenths', 1.85),
    model = conditionalEdgeExperiment(Math.round(30 * motion) / 30);
  const pending = s.b === 3 && s.on(3, 'Move three tenths');
  const children = model.run.history[1].expansions;
  s.head(
    'Mia   /   width 2   /   four generated tokens',
    s.b < 5 ? 'Which two unfinished prefixes fit?' : 'Which ending is still reachable?',
  );
  if (s.b < 5) {
    s.label('After opened    P(prefix) = .45', 110, 327, 38);
    s.strip(
      model.choices.map((a) => a[1]),
      ['the', 'a', 'EOS'],
      110,
      392,
      961,
      104,
    );
    children
      .filter((e) => e.parent === 'opened')
      .forEach((e, i) => {
        let y = 601 + i * 93;
        s.word(e.token, 113, y, 51);
        s.mono('.45 × ' + fmt(e.conditionalProbability, 3) + ' = ' + fmt(e.probability, 4), 375, y, 43);
      });
    s.label('Two active slots', 1203, 326, 41);
    for (let i = 0; i < 2; i++) {
      const y = 394 + i * 193;
      const e = model.run.history[1].active[i];
      if (pending || s.b === 1) {
        s.slot(1190, y, 608, 112, '?');
      } else {
        s.tile(1190, y, 608, 112, e.text, colors[i], 54);
        s.mono(fmt(e.probability, 4), 1194, y + 147, 36);
      }
    }
    s.mono('looked outside   .35 × .55 = .1925', 111, 850, 41);
  } else {
    const path = model.raw;
    const pathWord = (phrase) =>
      s.b > 5 || s.clock.reveal(phrase, 0, { captionStart: false }) === 1;
    const scoreSpoken = (phrase) => {
      if (s.b > 5) return true;
      const { start, end } = s.clock.wordCue(phrase);
      return s.clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    };
    s.route('door', 1590, 477, 0.95, true);
    s.tile(112, 420, 570, 111, 'opened the', '#c2c2b0', 55);
    s.line(690, 475, 1460, 475, muted, 5, [16, 12]);
    s.line(959, 447, 1006, 504, '#a35136', 8);
    s.line(1006, 447, 959, 504, '#a35136', 8);
    s.label('cut at .09', 755, 409, 35);
    s.tile(112, 692, 570, 111, 'opened a', colors[0], 58);
    if (pathWord('through book')) {
      s.line(690, 748, 976, 748, ink, 7);
      s.route('book', 1102, 747, 0.91);
    }
    if (pathWord('end token')) {
      s.line(1221, 748, 1462, 748, ink, 7);
      s.tile(1464, 693, 259, 111, 'EOS', brass, 54);
    }
    s.label('Other survivor    looked outside    .1925', 113, 605, 34);
    if (scoreSpoken('The four edges multiply to point one seven zero one'))
      s.mono('.45 × .60 × .70 × .90 = ' + fmt(path.probability, 4), 110, 850, 39);
    if (scoreSpoken('about minus point four four three per generated token'))
      s.mono('mean log p = ' + fmt(path.meanLogProbability), 1050, 850, 39);
  }
}
