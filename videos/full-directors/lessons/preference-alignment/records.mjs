import {
  ink,
  muted,
  white,
  teal,
  blue,
  red,
  hues,
  mix,
  fixed,
  cue,
  box,
  line,
  arrow,
  txt,
  head,
  cap,
  rule,
  tag,
  slip,
  stackText,
} from './art.mjs';
import {
  alignmentSoftmax,
  alignmentTokenScores,
} from '../../../films/preference-alignment/model.mjs';
import { CONTROLLED_CASES, SHORTCUT_PAIRS } from '../../../films/preference-alignment/fixtures.mjs';
import { wordCount } from '../../../films/preference-alignment/arithmetic.mjs';
import { tokenStrip } from './pair-scores.mjs';
export function cache(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const drop = cue(k, 1, 'alter which EOS target is scored'),
      t = alignmentTokenScores(0, 0, !drop);
    head(
      c,
      'Can this reference score be reused?',
      'R0 frozen   /   Same tokenizer, template, token IDs and truncation',
    );
    tokenStrip(c, t.fixture.chosenIds, t.selected, 60, 180, { step: 103, cell: 93 });
    txt(c, 'Summed log p', 706, 193, 19);
    txt(c, fixed(t.chosenRef, 4), 706, 236, 26, teal, 'left', 'Mono');
    cap(c, 'CACHED UNDER THE ORIGINAL MASK', 63, 330);
    txt(c, fixed(alignmentTokenScores().chosenRef, 4), 63, 383, 35, blue, 'left', 'Mono');
    txt(
      c,
      drop
        ? 'EOS excluded   →   recompute the affected sum'
        : 'EOS included   →   same targets, same sum',
      330,
      381,
      22,
    );
  } else if (b < 4) {
    head(c, 'A new evaluation set arrives after updates', 'Full-model recipe   /   TRL 1.17.1');
    slip(c, 51, 179, 264, 148, 'New pairs', ['Weekend requests'], blue);
    arrow(c, 326, 246, 416, 246, muted);
    box(c, 442, 164, 470, 170, white, 4);
    cap(c, b === 2 ? 'ONLY UPDATED ACTOR AVAILABLE' : 'EXPLICIT FROZEN R0 AVAILABLE', 464, 209);
    txt(
      c,
      b === 2 ? 'No cached scores for these pairs.' : 'R0 can score the new pairs.',
      464,
      266,
      27,
      b === 2 ? red : teal,
    );
    txt(
      c,
      b === 2
        ? 'Retain the reference or cache evaluation pairs at initialization.'
        : 'The updated actor and the original reference keep distinct roles.',
      52,
      422,
      22,
    );
  } else {
    head(
      c,
      'Same targets, different reduction',
      'R0 is offline   /   Saved sums and counts   /   Same tokens and masks',
    );
    const rows = [
      [-9, 4],
      [-4.2, 3],
    ];
    rows.forEach(([sum, n], i) => {
      const y = 214 + i * 126;
      txt(c, i ? 'Rejected' : 'Chosen', 56, y, 24, hues[i]);
      txt(c, 'sum ' + sum + '     ÷     ' + n + ' targets', 249, y, 29);
      arrow(c, 626, y - 8, 695, y - 8, muted);
      const show = cue(k, 5, i ? 'minus one point four' : 'minus two point two five');
      txt(c, show ? fixed(sum / n, 2) : '?', 735, y, 35, teal, 'left', 'Mono');
    });
    txt(
      c,
      b === 4
        ? 'What reference mean can you recover for each reply?'
        : 'Each sum uses the same targets as its count.',
      57,
      455,
      23,
    );
  }
}
const choicesA = ['P', 'P', 'P', 'P', 'P', 'P', 'cite', 'P7', 'and', 'then', 'escalate', 'EOS'];
const choicesB = choicesA.map((w) => (w === 'escalate' ? 'grant' : w));
export function keptTokens(xs, limit, prompt) {
  return xs.slice(prompt, limit);
}
export function truncation(c, k) {
  const b = k.beat.beatIndex,
    full = b === 1,
    cut = cue(k, 0, 'cuts each sequence') === 1;
  head(
    c,
    full
      ? 'What if the prompt fills all eight positions?'
      : 'Where did the label-defining word go?',
    'Keep start   /   Maximum length 8   /   TRL 1.17 preparation',
  );
  const rows = full ? [Array(8).fill('P'), Array(8).fill('P')] : [choicesA, choicesB];
  rows.forEach((row, i) => {
    const y = 191 + i * 102;
    txt(c, i ? 'B' : 'A', 49, y + 34, 23, hues[i]);
    row.forEach((w, j) => {
      const x = 84 + j * 69,
        discard = cut && j >= 8,
        content = !full && j >= 6;
      box(c, x, y, 66, 53, discard ? '#e1ddcd' : content ? hues[i] : white, 2);
      txt(
        c,
        w,
        x + 33,
        y + 33,
        w.length > 5 ? 14 : 19,
        discard ? muted : content ? white : ink,
        'center',
      );
      if (discard) line(c, x + 5, y + 44, x + 59, y + 44, '#b5b5a8', 1);
    });
  });
  if (cut && !full) {
    const x = 84 + 8 * 69 - 2;
    line(c, x, 149, x, 359, red, 3);
    txt(c, 'Cut', x, 138, 17, red, 'center');
  }
  const keep = keptTokens(rows[0], 8, full ? 8 : 6);
  txt(
    c,
    full
      ? 'Retained response targets   ' + keep.length + ' per branch   →   drop row'
      : cut
        ? 'Retained response in both branches     “' + keep.join(' ') + '”'
        : 'Both clauses are visible before truncation.',
    52,
    431,
    24,
  );
}
export function training(c, k) {
  const b = k.beat.beatIndex;
  head(
    c,
    b < 2 ? 'What does a ten-step run establish?' : 'Two different evaluation questions',
    'P-7 training example   /   Same prompt, chosen reply and rejected reply',
  );
  if (b === 0) {
    slip(
      c,
      57,
      172,
      330,
      182,
      'Input row',
      ['Prompt: migration request', 'Chosen: escalate', 'Rejected: grant directly'],
      blue,
    );
    arrow(c, 400, 259, 469, 259, muted);
    stackText(
      c,
      [
        'SFT checkpoint + tokenizer',
        'β = 0.1, learning rate = 0.000005',
        'Max length = 2048, 10 steps',
      ],
      493,
      211,
      55,
      21,
    );
  }
  if (b === 1) {
    const xs = [56, 358, 659],
      cols = [
        ['Collated rows', 'Counts, masks, reference'],
        ['Optimizer', 'State, precision, memory'],
        ['Save together', 'Weights and tokenizer'],
      ];
    cols.forEach(([n, s], i) => {
      box(c, xs[i], 192, 254, 135, white, 4);
      cap(c, n, xs[i] + 13, 229);
      txt(c, s, xs[i] + 13, 283, 17);
      if (i < 2) arrow(c, xs[i] + 261, 257, xs[i] + 294, 257);
    });
    txt(c, 'Local arithmetic checks cover the scoring code.', 57, 423, 24);
  }
  if (b === 2) {
    slip(
      c,
      58,
      171,
      387,
      182,
      'Stored comparison',
      ['Score the same two replies.', 'Measure loss and pair accuracy.'],
      blue,
    );
    slip(
      c,
      510,
      171,
      387,
      182,
      'Fresh generation',
      ['Write two answers. Blind the order.', 'Measure independent human wins.'],
      teal,
    );
    txt(c, 'Use the same prompt IDs, decoding controls and rubric.', 58, 430, 23);
  }
}
export function pairData(c, k) {
  const b = k.beat.beatIndex,
    q = cue(k, 1, 'split by prompt groups', 1.7);
  head(
    c,
    'Which records travel together?',
    'Split for generalization to unseen prompts   /   Preserve the generator and both complete replies',
  );
  cap(c, 'TRAIN', 55, 155);
  cap(c, 'HELD OUT', 553, 155);
  line(c, 486, 145, 486, 411, '#b6baab', 2);
  for (const [i, [p, g, v]] of [
    ['P1', 'g2', 'A > B'],
    ['P7', 'g0', 'A > B'],
    ['P7', 'g1', 'B > A'],
  ].entries()) {
    const x = 56 + (i === 0 ? 0 : q * 500),
      y = 183 + i * 73;
    box(c, x, y, 352, 53, white, 4);
    box(c, x, y, 7, 53, i ? blue : teal);
    txt(c, p + '    ' + g + '    Reply A, reply B', x + 15, y + 22, 16);
    txt(c, 'Reviewer vote    ' + v, x + 16, y + 43, 16, ink, 'left', 'Mono');
  }
  txt(
    c,
    b === 0
      ? 'Opposite votes can record genuine disagreement.'
      : b === 1
        ? 'Both P7 votes move with the same prompt.'
        : 'Check today’s replies for actions these rows never compare.',
    56,
    463,
    23,
  );
}
export function shortcut(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    head(
      c,
      'Always choose the shorter reply',
      'Three stored votes   /   Count words before reading for meaning',
    );
    const labels = ['Station directions', 'Cats', 'Greeting'];
    SHORTCUT_PAIRS.forEach((r, i) => {
      const y = 158 + 97 * i;
      txt(c, labels[i], 51, y + 34, 22);
      for (const [j, n] of [wordCount(r.chosen), wordCount(r.other)].entries()) {
        const Y = y + j * 28;
        box(c, 278, Y, n * 31, 19, hues[j], 2);
        txt(c, String(n), 291 + n * 31, Y + 16, 18, hues[j]);
      }
    });
    txt(c, 'Stored matches    3 / 3', 53, 469, 26, teal);
    return;
  }
  const which = cue(k, 2, 'On a different prompt') || b > 2 ? 1 : 0,
    row = CONTROLLED_CASES[which];
  const answers = row.preferred === 0 ? [row.good, row.bad] : [row.bad, row.good];
  const judged = which ? cue(k, 3, 'The tie rule gets') : cue(k, 2, 'X sends you right');
  head(
    c,
    which ? 'What is two plus three?' : 'Which first turn reaches the café?',
    'Fresh comparison   /   Both replies have eight words   /   On a tie, pick X',
  );
  answers.forEach((s, i) => {
    const y = 195 + i * 106;
    tag(c, i ? 'Y' : 'X', 50, y - 20, 47, blue);
    const words = s.split(' '),
      at = which ? 7 : 1;
    let x = 119;
    words.forEach((w, j) => {
      c.font = '500 25px "Lesson Sans"';
      const width = c.measureText(w).width;
      if (j === at) box(c, x - 4, y - 20, width + 8, 36, '#eedba6', 2);
      txt(c, w, x, y + 8, 25);
      x += width + 8;
    });
    if (judged && i === row.preferred) txt(c, 'Reviewer’s choice', 121, y + 45, 18, teal);
  });
  txt(
    c,
    judged
      ? which
        ? 'Tie rule: 1 of 2 fresh votes.'
        : 'Tie rule: 0 of 1 fresh vote.'
      : 'Tie rule selects X.',
    53,
    443,
    25,
  );
}
export function proxy(c, k) {
  const b = k.beat.beatIndex;
  head(
    c,
    b === 0
      ? 'Did the scorer pay for a preamble?'
      : b === 1
        ? 'Hold length fixed and change the answer'
        : 'What evidence would explain the symptom?',
    b === 0
      ? 'Controlled edit   /   Same action, prompt and scorer'
      : b === 1
        ? 'Fresh arithmetic pair   /   Eight words each'
        : 'Inspect the object that produced the measurement',
  );
  if (b === 0) {
    const prefix = cue(k, 0, 'Add those words');
    cap(c, 'ORIGINAL', 53, 171);
    txt(c, 'Open a reviewer ticket and cite P-7.', 54, 218, 27);
    cap(c, 'CONTROLLED REWRITE', 53, 303);
    if (prefix) tag(c, 'Policy-safe answer:', 53, 327, 190, blue);
    txt(c, 'Open a reviewer ticket and cite P-7.', prefix ? 263 : 53, 353, 27);
    txt(c, 'Δ reward = score(rewrite) − score(original)', 53, 451, 24, teal);
  }
  if (b === 1) {
    for (const [i, s] of [CONTROLLED_CASES[1].good, CONTROLLED_CASES[1].bad].entries()) {
      const y = 218 + i * 114;
      txt(c, s.slice(0, s.lastIndexOf(' ')), 55, y, 27);
      tag(c, s.split(' ').at(-1), 617, y - 25, 80, hues[i]);
    }
    txt(c, 'Check factual correctness and refusal quality.', 55, 452, 23);
  }
  if (b === 2) {
    [
      ['Loss near ln 2', 'Gradients, weights, conflicting votes'],
      ['Polite policy violation', 'Label coverage and deployed template'],
      ['Reward up, replies repeat', 'Reward scale, drift and fresh comparisons'],
    ].forEach(([l, r], i) => {
      const y = 189 + 100 * i;
      txt(c, l, 52, y, 24);
      arrow(c, 364, y - 9, 415, y - 9, muted);
      txt(c, r, 445, y, 22, hues[i]);
    });
  }
}
const currentLogits = [Math.log(9), 0];
const referenceLogits = [0, 0];
export function refreshSampler(referenceWeight = 0.5) {
  const currentWeight = 1 - referenceWeight;
  const logits = currentLogits.map(
    (v, i) => currentWeight * v + referenceWeight * referenceLogits[i],
  );
  const [open, claim] = alignmentSoftmax(logits);
  return { currentWeight, referenceWeight, open, odds: open / claim };
}
export function refresh(c, k) {
  const b = k.beat.beatIndex,
    q = cue(k, 0, 'obtain human or model preferences', 1.2);
  const blend = refreshSampler();
  const freshDraw = cue(k, 2, 'Draw both fresh replies');
  const judge = cue(k, 3, 'A biased judge could prefer');
  head(
    c,
    b === 1 || b === 2
      ? 'Which sampler writes the two replies?'
      : 'Collect the comparison the archive missed',
    'Same migration prompt   /   Preserve old votes and source revisions',
  );
  slip(
    c,
    50,
    154,
    370,
    165,
    'Archived vote',
    ['A1   Open a reviewer ticket.', 'B1   Grant access directly.'],
    blue,
    'A1 over B1',
  );
  if (q) {
    slip(
      c,
      502,
      154,
      400,
      165,
      freshDraw ? 'IPO-MD samples' : 'Current-policy samples',
      freshDraw
        ? ['A3   Open a reviewer ticket.', 'C3   Claim an exception.']
        : ['A2   Open a reviewer ticket.', 'C2   Claim an exception.'],
      red,
      judge
        ? 'Biased judge may pick C3'
        : freshDraw
          ? 'Both draws use the blended sampler'
          : 'Both draws use current policy P2',
    );
  }
  if (b === 0 && cue(k, 0, 'run a pairwise update'))
    txt(c, 'Add the labeled pair to the next training pass.', 52, 436, 24);
  if (b === 1 || b === 2) {
    cap(c, 'FIRST TOKEN   /   ODDS OF OPEN TO CLAIM', 52, 362);
    txt(c, 'Online IPO', 52, 397, 21, blue);
    txt(c, 'P2 draws both replies', 212, 397, 21);
    if (cue(k, 1, 'nine to one odds'))
      txt(c, 'P2   ' + fixed(refreshSampler(0).odds, 0) + ' : 1', 559, 397, 22, teal);
    if (cue(k, 1, 'even odds'))
      txt(c, 'R0   ' + fixed(refreshSampler(1).odds, 0) + ' : 1', 731, 397, 22, blue);
    if (cue(k, 1, 'In the IPO-MD experiment')) {
      txt(c, 'IPO-MD', 52, 443, 21, blue);
      txt(c, 'Logit weights before softmax', 212, 443, 21);
      if (cue(k, 1, 'equal logit weights')) {
        txt(
          c,
          fixed(blend.currentWeight, 1) + ' × P2  +  ' + fixed(blend.referenceWeight, 1) + ' × R0',
          559,
          443,
          22,
        );
        const odds = b === 2 ? fixed(blend.odds, 0) + ' : 1' : '?';
        txt(c, 'Open to Claim   ' + odds, 212, 488, 23, teal);
        if (cue(k, 2, 'seventy-five percent chance'))
          txt(c, 'P(Open)   ' + fixed(100 * blend.open, 0) + '%', 559, 488, 23, teal);
      }
    }
  }
  if (b === 3) {
    txt(c, 'A3 and C3   /   Logit weights before softmax', 52, 386, 21);
    txt(
      c,
      fixed(blend.currentWeight, 1) + ' × P2  +  ' + fixed(blend.referenceWeight, 1) + ' × R0',
      554,
      386,
      22,
      teal,
    );
    if (cue(k, 3, 'independent reviewer'))
      txt(c, 'P-7 requires a reviewer to authorize the change.', 52, 450, 23);
  }
}
