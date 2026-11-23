import { P, Q, TWO_GAP_Q, WORDS } from '../../../films/speculative-decoding/fixtures.mjs';
import {
  decomposition,
  sampleProposal,
  transformedLaw,
} from '../../../films/speculative-decoding/arithmetic.mjs';
import {
  C,
  arrow,
  bracket,
  cue,
  fade,
  fmt,
  hatches,
  line,
  note,
  page,
  pct,
  rect,
  shape,
  text,
} from './press.mjs';

const law = decomposition();
export const drawDog = { proposal: 0.35, draws: [0.58, 0.8], index: sampleProposal(Q, 0.35) };
const dog = drawDog.index;
const tones = [C.green, C.violet, '#eeddb7'];
const left = 375,
  width = 1320;
function strip(g, y, label, shares, words = WORDS, decimals = 0) {
  text(g, label, 105, y + 66, 43, C.ink, 'Serif');
  let x = left;
  shares.forEach((v, i) => {
    const w = width * v;
    if (w > 0) {
      rect(g, x, y, w, 100, tones[i], C.paper);
      text(g, words[i] + '  ' + pct(v, decimals), x + w / 2, y + 62, 39, C.ink, 'Sans', 'center', 500);
    }
    x += w;
  });
}
function pin(g, x, y, value, color) {
  shape(
    g,
    [
      [x, y],
      [x - 13, y + 22],
      [x + 13, y + 22],
    ],
    color,
  );
  text(g, value, x, y + 69, 34, color, 'Mono', 'center');
}
export function wordSample(g, c) {
  page(g, 'ONE TOKEN  /  “The child saw a …”', 'Which word did the draft sample?');
  strip(g, 330, 'Target   p', P);
  strip(g, 545, 'Draft   q', Q);
  const show = cue(c, 1, 'point three five', 0.25);
  fade(g, show, () =>
    pin(g, left + width * drawDog.proposal, 654, 'u = ' + fmt(drawDog.proposal), C.draft),
  );
  if (cue(c, 2, 'Dog')) {
    bracket(g, left + width * Q[0], left + width * (Q[0] + Q[1]), 783, '', C.draft);
    note(g, 'Proposal  ' + WORDS[dog] + '      q = ' + fmt(Q[dog]) + '      p = ' + fmt(P[dog]));
  } else
    note(
      g,
      show
        ? 'Read the lower strip at the proposal draw.'
        : 'Each strip covers the interval from 0 up to 1.',
    );
}
export function served(g, c) {
  const b = c.beat.beatIndex,
    { raw, target, proposal, retained, acceptance } = transformedLaw();
  if (b === 2 && cue(c, 2, 'The events must match')) {
    page(g, 'TOKEN IDENTITY  /  same prefix', 'What event does 4012 mean?');
    const mapped = cue(c, 2, 'ID seventeen');
    text(g, 'Draft vocabulary', 202, 369, 43, C.draft);
    text(g, 'Target vocabulary', 1050, 369, 43, C.keep);
    text(g, '4012   cat', 200, 532, 76, C.ink, 'Serif');
    text(g, '4012   house', 1050, 532, 76, C.ink, 'Serif');
    if (mapped) {
      arrow(g, 625, 526, 1000, 666, C.keep);
      text(g, '17   cat', 1050, 698, 76, C.keep, 'Serif');
    } else text(g, '≠', 795, 530, 70, C.red);
    note(
      g,
      mapped
        ? 'Compare probabilities for the same event on both sides.'
        : 'Equal IDs can name different events.',
    );
    return;
  }
  const changed = cue(c, 1, 'Remove cat');
  const showFactors = cue(c, 1, 'A proposed dog can always stay');
  const filtering = cue(c, 0, 'Now filter the target alone');
  page(
    g,
    'FILTERING EXAMPLE  /  new target and proposer',
    filtering ? 'How do the surviving target shares change?' : 'Before the target is filtered',
  );
  strip(g, 300, 'Raw   p', raw);
  strip(g, 475, 'Draft   q', proposal);
  if (changed) {
    strip(g, 651, 'Served   p', target, WORDS, 1);
    note(
      g,
      showFactors
        ? 'Dog  ' +
            fmt(target[1], 3) +
            ' / ' +
            fmt(proposal[1]) +
            ' → keep ' +
            pct(acceptance[1]) +
            (cue(c, 1, 'Cat has zero target mass') ? '       Cat  →  keep ' + pct(acceptance[2]) : '')
        : 'Surviving target mass  ' +
            fmt(retained) +
            '     •     divide each surviving width by ' +
            fmt(retained),
    );
  } else {
    if (filtering) line(g, left + width * retained, 290, left + width * retained, 411, C.red, 5);
    note(
      g,
      filtering
        ? 'Keep the two largest target shares. The proposer still samples all three words.'
        : 'In this example, the proposer gives dog ' + pct(proposal[1]) + '.',
    );
  }
}
export function acceptance(g, c) {
  const alpha = law.acceptance[dog];
  const replay = cue(c, 2, 'point eight');
  const supplied = cue(c, 1, 'point five eight');
  const draw = drawDog.draws[Number(replay)];
  const keep = supplied && cue(c, 2, 'Keep dog') && !replay;
  const reject = replay && cue(c, 2, 'Reject dog');
  const gate = cue(c, 1, 'Keep three fifths');
  page(g, 'ACCEPTANCE  /  original table', 'How often can dog stay?');
  text(g, 'dog', 108, 483, 146, C.ink, 'Serif');
  text(g, 'p = ' + fmt(P[dog]) + '       q = ' + fmt(Q[dog]), 596, 395, 54);
  text(g, 'α = min(1, p / q)     for sampled q > 0', 596, 490, 44, C.quiet);
  const x = 267,
    y = 625,
    w = 1390;
  rect(g, x, y, w, 38, C.bed);
  if (gate) {
    rect(g, x, y, w * alpha, 38, C.keep);
    text(g, 'Cutoff  ' + fmt(alpha), x + w * alpha, y - 30, 42, C.keep, 'Sans', 'center');
  }
  text(g, '0', x - 55, y + 33, 34, C.quiet, 'Mono');
  text(g, '1', x + w + 25, y + 33, 34, C.quiet, 'Mono');
  if (supplied) pin(g, x + w * draw, y + 43, 'u = ' + fmt(draw), C.draft);
  note(
    g,
    reject
      ? 'Reject dog     ' + fmt(draw) + ' ≥ ' + fmt(alpha)
      : keep
        ? 'Keep dog     ' + fmt(draw) + ' < ' + fmt(alpha)
        : 'A fresh uniform draw tests the sampled proposal.',
    reject ? C.red : keep ? C.keep : C.ink,
  );
}
const unit = 1675;
function overlayRow(g, i, y, p, q, overlay, highlight) {
  const x = 382,
    h = 56;
  text(g, WORDS[i], 115, y + 53, 61, C.ink, 'Serif');
  rect(g, x, y, unit * p, h, C.white, C.ink);
  const overlap = Math.min(p, q),
    deficit = Math.max(0, p - q),
    excess = Math.max(0, q - p);
  if (overlay < 1) {
    const travel = 1 - overlay;
    rect(g, x, y - 29 * travel, unit * q, 14, C.violet, C.pencil);
  }
  fade(g, overlay, () => {
    rect(g, x, y + 5, unit * overlap, h - 10, C.keep);
    if (excess) hatches(g, x + unit * p, y + 9, unit * excess, h - 18, C.pencil);
  });
  if (highlight && deficit) rect(g, x + unit * overlap, y + 5, unit * deficit, h - 10, C.gold);
  text(g, 'p ' + fmt(p) + '     q ' + fmt(q), 1370, y + 43, 36, C.quiet, 'Mono');
}
export function residual(g, c) {
  const match = cue(c, 2, 'If the laws match exactly');
  const q = match ? P : Q,
    d = decomposition(P, q);
  const stacked = cue(c, 0, 'draft width over the target width', 1.0);
  const found = cue(c, 1, 'Only bird');
  const normalized = cue(c, 2, 'Here the entire replacement');
  page(
    g,
    'RESIDUAL  /  “The child saw a …”',
    match ? 'What if both laws agree?' : 'Where is the target short?',
  );
  text(g, 'Outline = target', 383, 295, 34);
  text(g, 'Solid = overlap', 798, 295, 34, C.keep);
  text(g, 'Hatched = draft excess', 1196, 295, 34, C.draft);
  for (let i = 0; i < 3; i++) overlayRow(g, i, 341 + 137 * i, P[i], q[i], stacked, found && !match);
  if (normalized && !match) {
    rect(g, 382, 746, 835, 49, C.gold);
    text(g, 'bird   ' + pct(d.residual[0]), 800, 783, 37, C.ink, 'Sans', 'center');
    text(g, 'given rejection', 1290, 783, 35, C.repair);
  } else if (found) text(g, 'Missing mass   Z = ' + fmt(d.z), 384, 785, 43, C.repair);
  note(
    g,
    match
      ? 'All shares coincide. Z = 0, so no rejection draw occurs.'
      : found
        ? 'Positive gaps     ' +
          d.deficit.map((v) => fmt(v)).join('     +     ') +
          '     =     ' +
          fmt(d.z)
        : 'Look for an uncovered interval inside a target outline.',
  );
}
export function proofState(twoGaps, wrong) {
  const q = twoGaps ? TWO_GAP_Q : Q,
    d = decomposition(P, q);
  const extra = wrong ? P.map((v) => v * d.z) : d.deficit;
  return { q, d, extra, total: d.overlap.map((v, i) => v + extra[i]) };
}
function proofProgress(c, beat, phrase, span = 0, captionStart = phrase) {
  if (c.beat.beatIndex !== beat) return Number(c.beat.beatIndex > beat);
  const { start, end } = c.wordCue(phrase);
  // Start the picture change after the spoken clause has finished.
  const progress = c.reveal(phrase, end - start + span, { captionStart });
  if (progress === 1) return 1;
  return span ? Math.max(0, (c.elapsed - end) / span) : 0;
}
export function proof(g, c) {
  const prediction = proofProgress(c, 0, 'gives dog three tenths of those rounds too', 0, false);
  const redraw = proofProgress(c, 1, 'Point three nine', 0.55);
  const undo = proofProgress(c, 1, 'Undo the redraw', 0.55);
  const repair = proofProgress(c, 1, 'Direct the missing mass to bird instead', 0.65);
  const identity = cue(c, 1, 'Now accepted overlap');
  const changed = proofProgress(c, 2, 'Change only the draft strip');
  const gaps = proofProgress(c, 2, 'This time bird is short two tenths and dog one tenth');
  const divide = proofProgress(c, 2, 'Divide each gap by their total');
  const split = proofProgress(c, 2, 'two thirds must be bird and one third dog', 0.65);
  const wrong = redraw > 0 && undo < 1;
  const added = changed ? split : repair;
  const fill = wrong ? redraw * (1 - undo) : added;
  const settled = fill === 1;
  const { q, d, extra, total } = proofState(changed, wrong);
  page(
    g,
    'PROBABILITY LEDGER  /  same target',
    changed ? 'How do two gaps share the correction?' : 'Can both paths rebuild the target?',
  );
  const x = 400,
    scale = 1690,
    emittedX = 1475,
    draftX = 1690;
  text(g, 'Accepted overlap', x, 293, 34, C.keep);
  if (fill > 0) {
    const label = wrong ? 'Added by a target redraw' : 'Added by correction';
    text(g, label, 794, 293, 34, wrong ? C.red : C.repair);
  }
  if (settled) text(g, 'Output share', emittedX, 293, 34, C.quiet, 'Sans', 'center');
  text(g, 'Draft q', draftX, 293, 34, C.draft, 'Sans', 'center');
  for (let i = 0; i < 3; i++) {
    const y = 375 + i * 141,
      acceptedWidth = scale * d.overlap[i],
      extraWidth = scale * extra[i],
      targetX = x + scale * P[i];
    text(g, WORDS[i], 110, y + 55, 62, C.ink, 'Serif');
    rect(g, x, y, targetX - x, 65, C.white, C.ink);
    rect(g, x, y + 6, acceptedWidth, 53, C.keep);
    if (fill > 0 && extraWidth > 0) {
      rect(g, x + acceptedWidth, y + 6, extraWidth * fill, 53, wrong ? C.red : C.gold);
    }
    line(g, targetX, y - 8, targetX, y + 76, C.ink, 3);
    text(g, 'p ' + fmt(P[i]), targetX, y - 16, 33, C.ink, 'Mono', 'center');
    text(g, fmt(d.overlap[i]), x + acceptedWidth / 2, y + 45, 36, C.white, 'Mono', 'center');
    if (settled) {
      const color = wrong && total[i] > P[i] ? C.red : C.ink;
      if (extraWidth > 0) {
        const extraX = x + acceptedWidth + extraWidth / 2;
        const extraColor = wrong ? C.white : C.ink;
        text(g, '+' + fmt(extra[i]), extraX, y + 43, 29, extraColor, 'Mono', 'center');
      }
      text(g, fmt(total[i]), emittedX, y + 49, 42, color, 'Mono', 'center');
    }
    text(g, fmt(q[i]), draftX, y + 49, 42, C.draft, 'Mono', 'center');
  }
  if (gaps) {
    const shares = d.deficit.flatMap((gap, i) => {
      if (!gap) return [];
      const fraction = divide ? ' / ' + fmt(d.z) : '';
      const result = split > 0 ? ' ≈ ' + pct(d.residual[i], 1) : '';
      return [WORDS[i] + '   ' + fmt(gap) + fraction + result];
    });
    const label = divide ? 'On rejection' : 'Target gaps';
    text(g, label + '     ' + shares.join('         '), x, 793, 40, C.repair);
  } else if (prediction && !changed) {
    text(g, 'Rejection mass   ' + fmt(d.z), x, 793, 40, C.quiet);
  }
  let explanation = 'The outline marks the target share. The green bar shows the accepted overlap.';
  if (wrong && settled) {
    const [accepted, fromRedraw, emitted, target] = [
      d.overlap[dog], extra[dog], total[dog], P[dog],
    ].map((value) => fmt(value));
    explanation = `Dog   ${accepted} + ${fromRedraw} = ${emitted}     •     target ${target}`;
  } else if (wrong) {
    explanation = undo > 0 ? 'Remove the mass added by the redraw.' : 'Add the redraw mass to the accepted overlap.';
  } else if (identity && settled) {
    explanation = 'For each word    min(p, q) + max(p − q, 0) = p';
  } else if (undo === 1) {
    explanation = 'Fill only the uncovered target shares.';
  } else if (prediction) {
    explanation = 'Dog total = ' + fmt(d.overlap[dog]) + ' + (' + fmt(d.z) + ' × ' + fmt(P[dog]) + ')';
  }
  note(g, explanation);
}
