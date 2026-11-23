import {
  ink,
  muted,
  white,
  teal,
  blue,
  red,
  gold,
  hues,
  fixed,
  signed,
  cue,
  box,
  path,
  line,
  txt,
  head,
  cap,
  rule,
  marker,
  tag,
} from './art.mjs';
import {
  alignmentMissingPair,
  alignmentFreshStep,
} from '../../../films/preference-alignment/construction.mjs';
import { alignmentRelease } from '../../../films/preference-alignment/model.mjs';
const names = ['A   Open ticket', 'B   Grant directly', 'C   Invent exception'];
// Each cubic ribbon has parallel upper and lower edges. Its width measures generation probability.
function ribbon(c, y, h, end, col) {
  const x0 = 155,
    x1 = 602;
  c.beginPath();
  c.moveTo(51, y);
  c.lineTo(x0, y);
  c.bezierCurveTo(340, y, 411, end, x1, end);
  c.lineTo(655, end);
  c.lineTo(655, end + h);
  c.lineTo(x1, end + h);
  c.bezierCurveTo(411, end + h, 340, y + h, x0, y + h);
  c.lineTo(51, y + h);
  c.closePath();
  c.fillStyle = col;
  c.fill();
}
function flow(c, probs, { initial = false, visible = [true, true, true] } = {}) {
  const total = 181,
    top = 142,
    gap = 29;
  let used = 0;
  probs.forEach((v, i) => {
    const y = top + used * total,
      h = v * total,
      end = y + gap * i;
    if (!visible[i]) {
      used += v;
      return;
    }
    ribbon(c, y, h, end, hues[i]);
    const labelY = 167 + i * 93;
    path(
      c,
      [
        [660, end + h / 2],
        [675, end + h / 2],
        [693, labelY + 6],
      ],
      hues[i],
      1.5,
    );
    txt(c, names[i], 708, labelY, 20, hues[i], 'left', 'Sans', 600);
    txt(
      c,
      initial ? '1 / 3' : fixed(100 * v, 2) + '%',
      708,
      labelY + 36,
      29,
      ink,
      'left',
      'Mono',
      600,
    );
    used += v;
  });
}

const firstPolicy = alignmentMissingPair();
const laneCounts = ({ probabilities }) => probabilities.map((p) => Math.round(100 * p));

export function missingState(k) {
  const transfer = 'For each four lanes';
  const duration =
    k.beat.beatIndex === 3 ? k.wordCue('go to the exception').end - k.wordCue(transfer).start : 0;
  const q = cue(k, 3, transfer, duration);
  // Moving five lanes per step keeps every intermediate count integral and the odds at four.
  return alignmentMissingPair(Math.round(q * 8) / 8);
}

function compareLanes(c, first, current) {
  const left = 238;
  const right = 682;
  const barWidth = 40;
  const Y = (lane) => 157 + lane * 2;
  const [startA, startB, startC] = first;
  const [endA, endB] = current;
  const movedA = startA - endA;
  const movedB = startB - endB;
  const currentCStart = endA + endB;
  if (movedA + movedB) {
    txt(c, movedA + ' from A', 353, 130, 21, teal, 'center');
    txt(c, '+  ' + movedB + ' from B', 479, 130, 21, blue, 'center');
    txt(c, '→  ' + (movedA + movedB) + ' to C', 609, 130, 21, red, 'center');
  }

  // Retained lanes sit behind the two transfers, which keep their source colors into C.
  const ribbons = [
    [0, 0, endA, '#c4d5c6'],
    [startA, endA, endB, '#ccd3d9'],
    [startA + startB, startA + startB, startC, '#e3c8b3'],
    [endA, currentCStart, movedA, teal],
    [startA + endB, currentCStart + movedA, movedB, blue],
  ];
  for (const [from, to, count, color] of ribbons) {
    if (!count) continue;
    const x = left + barWidth;
    const mid = (x + right) / 2;
    c.beginPath();
    c.moveTo(x, Y(from));
    c.bezierCurveTo(mid, Y(from), mid, Y(to), right, Y(to));
    c.lineTo(right, Y(to + count));
    c.bezierCurveTo(mid, Y(to + count), mid, Y(from + count), x, Y(from + count));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }

  for (const [j, [x, counts]] of [[left, first], [right, current]].entries()) {
    const labelX = j ? 752 : 48;
    cap(c, j ? 'CURRENT POLICY' : 'FIRST POLICY', labelX, 130);
    let start = 0;
    counts.forEach((count, i) => {
      const y = Y(start);
      const labelY = 165 + i * 74;
      const barEdge = j ? x + barWidth : x;
      const color = hues[i];
      box(c, x, y, barWidth, Y(count) - Y(0), color);
      line(c, barEdge, Y(start + count / 2), j ? 747 : 227, labelY + 14, color, 1.5);
      txt(c, names[i], labelX, labelY, 19, color, 'left', 'Sans', 600);
      txt(c, count + '%', labelX, labelY + 34, 30, ink, 'left', 'Mono', 600);
      start += count;
    });
    for (let lane = 5; lane < 100; lane += 5)
      line(c, j ? x + barWidth - 9 : x, Y(lane), j ? x + barWidth : x + 9, Y(lane), white, 1);
  }
}

export function missing(c, k) {
  const b = k.beat.beatIndex,
    s = missingState(k),
    reference = b < 2;
  head(
    c,
    reference
      ? 'Three replies to the same P-7 request'
      : 'Where do a hundred lanes of probability go?',
    reference
      ? 'Frozen reference   /   Equal shares'
      : '1 lane = 1%, 1 tick = 5 lanes   /   Reference odds A:B = 1:1, β = 0.1',
  );
  const first = laneCounts(firstPolicy);
  const current = laneCounts(s);
  if (reference) flow(c, [1 / 3, 1 / 3, 1 / 3], { initial: true });
  else compareLanes(c, first, current);
  if (b >= 1) {
    const dividerY = reference ? 403 : 379;
    const nextReview = b === 5 && cue(k, 5, 'ask a reviewer');
    line(c, 46, dividerY, 912, dividerY, '#bcbba9', 2);
    if (!nextReview) {
      cap(c, 'STORED VOTE', 52, reference ? 438 : 405);
      txt(c, 'A over B', reference ? 189 : 52, 438, 25, teal);
    }
    if (b >= 2 && !nextReview) {
      const result = cue(k, 4, 'It stays the same');
      const showFirstLoss = cue(k, 2, 'Keep that measurement');
      const showFirstOdds = cue(k, 2, 'there are four tickets');
      const showCurrentOdds = cue(k, 4, 'is still four');
      cap(c, 'FIRST POLICY   /   A:B', 259, 405);
      cap(c, 'CURRENT POLICY   /   A:B', 601, 405);
      const firstOdds =
        first[0] + ' / ' + first[1] + (showFirstOdds ? ' = ' + fixed(firstPolicy.odds, 0) : '');
      const currentOdds =
        current[0] + ' / ' + current[1] + (showCurrentOdds ? ' = ' + fixed(s.odds, 0) : '');
      txt(c, firstOdds, 259, 438, 24, ink, 'left', 'Mono');
      txt(c, currentOdds, 601, 438, 24, ink, 'left', 'Mono');
      if (showFirstLoss) txt(c, 'Loss  ' + fixed(firstPolicy.loss, 3), 445, 438, 22, muted);
      if (b >= 3) txt(c, result ? 'Loss  ' + fixed(s.loss, 3) : 'Loss  ?', 769, 438, 22, ink);
    }
    if (nextReview) {
      cap(c, 'NEXT REVIEW', 52, 406);
      txt(c, '“Open a reviewer ticket.”', 188, 441, 25, teal, 'left', 'Serif');
      txt(c, 'or', 483, 441, 19, muted);
      txt(c, '“An exception permits it.”', 536, 441, 25, red, 'left', 'Serif');
    }
  }
}
export function fresh(c, k) {
  const b = k.beat.beatIndex,
    q = cue(k, 3, 'Subtract the gradients'),
    s = alignmentFreshStep(q);
  head(
    c,
    b < 2
      ? 'Which logits move after an A-over-C vote?'
      : b < 4
        ? 'Apply the vote to these three logits'
        : 'Normalize all three replies together',
    'Fresh policy   /   Uniform reference   /   β = 0.5, step = 0.4',
  );
  if (b < 2 || b >= 4) {
    const visible =
      b === 4
        ? [
            cue(k, 4, 'The ticket now gets'),
            cue(k, 4, 'The direct grant edges'),
            cue(k, 4, 'The exception still'),
          ]
        : [true, true, true];
    flow(c, b < 2 ? s.start : s.probabilities, { visible });
    if (b < 2) {
      txt(
        c,
        b === 0
          ? 'Starting logits = ln(starting probabilities)'
          : 'Reviewer chose the ticket over the invented exception.',
        53,
        429,
        24,
      );
      if (cue(k, 0, 'Start each logit'))
        txt(
          c,
          'Initial logits     ' + s.logits.map((v) => fixed(v, 3)).join('      '),
          53,
          473,
          23,
          ink,
          'left',
          'Mono',
        );
    } else {
      const total = s.updated.reduce((a, v) => a + Math.exp(v), 0);
      if (!visible[0]) {
        cap(c, 'EXPONENTIATE THE UPDATED LOGITS', 53, 178);
        s.updated.forEach((v, i) => {
          const x = 53 + 303 * i;
          txt(c, names[i], x, 246, 21, hues[i]);
          txt(c, 'exp(' + fixed(v, 3) + ')', x, 302, 22);
          txt(c, '≈ ' + fixed(Math.exp(v), 4), x, 356, 26, hues[i], 'left', 'Mono');
        });
      }
      cap(c, 'NORMALIZER', 52, 421);
      txt(c, 'Σ exp(logit) = ' + fixed(total, 4), 52, 458, 21);
      if (visible[1]) {
        cap(c, 'DIRECT GRANT', 320, 421);
        txt(
          c,
          '0.100 / ' + fixed(total, 3) + ' = ' + fixed(s.probabilities[1] * 100, 2) + '%',
          320,
          458,
          21,
        );
      }
      if (b >= 5) {
        cap(c, 'PAIR LOSS', 685, 424);
        txt(c, fixed(s.beforeLoss, 3) + ' → ' + fixed(s.loss, 3), 685, 457, 22, teal);
      }
    }
  } else {
    ['Reply', 'Initial logit', 'Gradient', 'Current logit'].forEach((v, i) =>
      cap(c, v, [49, 355, 552, 743][i], 154),
    );
    names.forEach((n, i) => {
      const y = 214 + 83 * i;
      txt(c, n, 50, y, 23, hues[i]);
      txt(c, fixed(s.logits[i], 3), 354, y, 24, ink, 'left', 'Mono');
      const known = cue(
        k,
        2,
        [
          "The ticket's derivative",
          'The direct grant has zero derivative',
          "The exception's is positive",
        ][i],
      );
      txt(c, known ? signed(s.gradient[i], 3) : '?', 555, y, 24, hues[i], 'left', 'Mono');
      txt(c, fixed(s.updated[i], 3), 744, y, 24, ink, 'left', 'Mono');
    });
    txt(
      c,
      b === 2
        ? 'P(A wins over C) = σ(0.5 × ln(0.30 / 0.60)) = ' + fixed(s.comparison, 3)
        : 'New logit = old logit − 0.4 × gradient',
      51,
      460,
      24,
    );
  }
}
export function releaseState(k, freshCase) {
  const whatIf = freshCase && cue(k, 3, 'nineteen extra tokens') === 1;
  const s = alignmentRelease(freshCase ? 222 : 184, 400, freshCase ? (whatIf ? 19 : 20) : 48);
  return {
    ...s,
    whatIf,
    haveWins: freshCase ? cue(k, 0, 'it wins two hundred') : cue(k, 1, 'The candidate wins'),
    haveInterval: freshCase ? cue(k, 0, 'The lower end') : cue(k, 1, 'The Wilson interval'),
    haveLength: freshCase ? cue(k, 1, 'exactly twenty extra') : cue(k, 1, 'Now add forty-eight'),
    verdict: freshCase
      ? whatIf
        ? Boolean(cue(k, 4, 'Yes'))
        : Boolean(cue(k, 2, 'Length blocks it'))
      : Boolean(cue(k, 2, 'Neither clears')),
  };
}
export function release(c, k, freshCase) {
  const b = k.beat.beatIndex,
    s = releaseState(k, freshCase);
  head(
    c,
    freshCase
      ? s.whatIf
        ? 'Replay with the same ' + s.total + ' judgments'
        : 'Would this second candidate qualify?'
      : 'Should the higher-scoring candidate ship?',
    freshCase
      ? 'Predeclared rules   /   Independent prompts, one blinded pair each, no ties'
      : 'Candidate reward +0.31   /   Independent prompts, one blinded pair each, no ties',
  );
  const x = 332,
    end = 877;
  cap(c, 'HUMAN WINS', 49, 177);
  txt(c, 'Lower bound > 50%', 49, 211, 21);
  const X = rule(
    c,
    x,
    end,
    214,
    0.35,
    0.65,
    [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65],
    (v) => Math.round(v * 100) + '%',
  );
  line(c, X(0.5), 162, X(0.5), 224, gold, 5);
  if (s.haveInterval) {
    line(c, X(s.lower), 180, X(s.upper), 180, blue, 8);
    [s.lower, s.upper].forEach((v) => {
      line(c, X(v), 170, X(v), 190, blue, 3);
      txt(c, fixed(100 * v, 1) + '%', X(v), 153, 18, blue, 'center');
    });
    marker(c, X(s.rate), 180, blue);
  }
  if (s.haveWins)
    txt(c, s.wins + ' / ' + s.total + '   (' + fixed(s.rate * 100, 1) + '%)', 48, 252, 18, blue);
  cap(c, 'MEAN LENGTH GROWTH', 49, 310);
  txt(c, 'Fewer than 20 tokens', 49, 345, 21);
  const L = rule(c, x, end, 344, 0, 50, [0, 10, 20, 30, 40, 50], (v) => '+' + v);
  line(c, L(20), 312, L(20), 356, gold, 5);
  if (s.haveLength) {
    marker(c, L(s.growth), 344, ink);
    txt(c, '+' + s.growth + ' tokens', L(s.growth), 300, 19, ink, 'center');
  }
  if (s.verdict && !(freshCase && b === 5)) {
    tag(
      c,
      s.eligible ? 'Both rules pass' : 'Hold candidate',
      50,
      409,
      190,
      s.eligible ? teal : red,
    );
    txt(
      c,
      'Win rule   ' +
        (s.winPass ? 'pass' : 'fail') +
        '       Length rule   ' +
        (s.lengthPass ? 'pass' : 'fail'),
      277,
      434,
      23,
    );
  }
  if (freshCase && s.whatIf && b !== 5)
    txt(c, 'Measured case: +20 → hold.    Replay: +19 tokens.', 51, 479, 19, muted);
  if (freshCase && b === 5) {
    box(c, 0, 400, 960, 140, ink);
    txt(c, 'Which reply follows P-7?', 49, 435, 27, white, 'left', 'Serif');
    txt(c, 'Measured +20: hold     Replay +19: pass', 490, 436, 19, '#e9d59a');
    txt(c, 'Open a ticket and cite P-7.', 49, 484, 23, '#a4dfcc');
    txt(c, 'Invent an exception and grant access.', 493, 484, 23, '#f6ad93');
  }
}
