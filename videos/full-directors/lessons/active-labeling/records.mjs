import {
  C,
  word,
  mono,
  title,
  heading,
  rect,
  dot,
  line,
  arrow,
  ticket,
  stack,
  band,
  ruled,
  ease,
  pct,
  f,
} from './studio.mjs';
import {
  firstCases,
  closest,
  comparisons,
  rankedAnswers,
  pref,
  preferenceChance,
  provenance,
  candidates,
  judgePair,
  addresses,
  tokens,
  alternateTokens,
} from './cases.mjs';

function reply(g, text, x, y, w, key) {
  dot(g, x + 9, y, 10, C.ink);
  word(g, key, x + 9, y, 12, C.white, { align: 'center', weight: 700 });
  word(g, text, x + 28, y, 19, C.ink, { max: w - 32 });
}
function halfScale(g, x, y, w) {
  line(g, x, y, x + w, y, C.ink, 2);
  for (let i = 0; i <= 10; i++)
    line(g, x + (w * i) / 10, y - 4, x + (w * i) / 10, y + (i % 5 ? 5 : 10), C.ink, 1);
  mono(g, '0%', x, y + 25, 12);
  mono(g, '50%  ·  even', x + w / 2, y + 25, 13, C.ink, 'center');
  mono(g, '100%', x + w, y + 25, 12, C.muted, 'right');
}
export function opening(g, s) {
  const { b, cue } = s;
  if (b <= 2) {
    const chosen = cue(2, 'Send the missing'),
      labeled = cue(2, 'chooses B');
    heading(g, chosen ? 'The closer pair goes to review' : 'One review left', 'SUPPORT QUEUE');
    const tokenMove = ease(cue(2, 'Send the missing', 0.65));
    const tx = 837 + (407 - 837) * tokenMove,
      ty = 57 + (154 - 57) * tokenMove;
    for (const [i, r] of firstCases.entries()) {
      const x = 44 + i * 451 + (i ? 1 : -1) * 32 * (1 - ease(s.elapsed / 0.65)) * (b === 1),
        y = 110;
      ticket(g, x, y, 417, 156, r === closest && chosen ? C.greenWash : C.white);
      const tint = i ? C.blueWash : C.greenWash,
        ink = i ? C.blue : C.green;
      rect(g, x + 336, y + 1, 80, 67, tint);
      line(g, x + 335, y + 5, x + 335, y + 65, C.line, 1, [3, 3]);
      if (i) {
        dot(g, x + 361, y + 30, 8, null, ink, 3);
        line(g, x + 369, y + 30, x + 394, y + 30, ink, 3);
        line(g, x + 383, y + 30, x + 383, y + 37, ink, 3);
        line(g, x + 391, y + 30, x + 391, y + 35, ink, 3);
      } else {
        dot(g, x + 355, y + 32, 6, null, ink, 2);
        line(g, x + 363, y + 32, x + 376, y + 32, ink, 2);
        line(g, x + 376, y + 32, x + 384, y + 20, ink, 2);
        line(g, x + 376, y + 32, x + 384, y + 45, ink, 2);
        dot(g, x + 390, y + 18, 5, null, ink, 2);
        dot(g, x + 390, y + 47, 5, null, ink, 2);
      }
      mono(g, 'REPLY PAIR', x + 18, y + 19, 11, ink);
      title(g, r.name, x + 18, y + 47, 28);
      line(g, x + 18, y + 70, x + 396, y + 70);
      reply(g, r.a, x + 18, y + 95, 388, 'A');
      reply(g, r.b, x + 18, y + 129, 388, 'B');
    }
    g.save();
    g.translate(tx, ty);
    g.rotate(-0.09);
    rect(g, -49, -16, 98, 32, C.honey, C.ink, 5, 1.3);
    mono(g, '1 REVIEW', 0, 0, 14, C.ink, 'center');
    g.restore();
    const x = 136,
      y = 385,
      w = 685;
    word(g, 'Predicted chance of a vote for reply A', 44, 306, 21);
    halfScale(g, x, y, w);
    for (const [i, r] of firstCases.entries()) {
      if (!cue(1, i ? 'ninety-seven percent' : 'fifty-three percent')) continue;
      const xx = x + r.p * w,
        ink = i ? C.blue : C.green;
      line(g, xx, y, xx, y - 25, ink, 2);
      dot(g, xx, y, 6, ink);
      mono(g, r.name + '  ' + pct(r.p), xx + (i ? 0 : -7), y - 42, 16, ink, i ? 'right' : 'center');
    }
    if (labeled) band(g, 'Human preference    B  ›  A', 44, 447, 350, C.green, C.greenWash);
    return;
  }
  const fresh = b === 5;
  heading(g, fresh ? 'A permitted source' : 'Can this release request enter training?', 'CASE REGISTRY');
  stack(g, 44, 115, 420, 305);
  mono(g, fresh ? 'trace-204' : 'attack-014', 66, 143, 19, C.blue);
  title(g, 'Release request', 66, 187, 32);
  mono(g, 'Owner   <EMAIL_1>', 66, 223, 17);
  reply(g, fresh ? 'Cite sign-off. Limit the canary.' : 'Request sign-off.', 66, 268, 370, 'A');
  reply(g, 'All traffic has moved.', 66, 306, 370, 'B');
  if (cue(3, 'reviewer preferred') && !fresh)
    band(g, 'Reviewer prefers A', 66, 353, 315, C.green, C.greenWash);
  if (fresh) {
    band(g, 'Training use permitted', 66, 353, 315, C.green, C.greenWash);
    title(g, 'Proposed answers', 552, 184, 31);
    arrow(g, 474, 245, 535, 245, C.green, 3);
    word(g, 'No change executed', 552, 248, 23);
    word(g, 'Keep the pair for review.', 552, 294, 20, C.green);
    return;
  }
  if (cue(3, 'private test')) {
    arrow(g, 475, 184, 531, 184, C.blue);
    band(g, 'Private test family', 546, 156, 340);
  }
  if (cue(3, 'action log')) {
    arrow(g, 475, 299, 531, 299, C.red);
    band(g, 'Change attempted before sign-off', 546, 273, 372, C.red, C.redWash);
  }
  if (cue(4, 'Keep the frozen')) word(g, 'Retain for evaluation', 558, 219, 22, C.blue);
  if (cue(4, 'Send the attempted')) word(g, 'Send the log to incident review', 558, 335, 21, C.red);
}

export function records(g, { b, cue }) {
  heading(
    g,
    'What should a record keep?',
    b < 3 ? 'TRACE 204  /  TRAINING USE PERMITTED' : 'ATTACK-014  /  FROZEN TEST FAMILY',
  );
  if (b < 3) {
    ticket(g, 44, 134, 354, 250);
    title(g, 'Can we start the canary?', 63, 169, 25);
    line(g, 62, 199, 382, 199);
    reply(g, 'Cite sign-off. Limit the canary.', 61, 245, 326, 'A');
    reply(g, 'All traffic has moved.', 61, 300, 326, 'B');
    mono(g, 'prompt-v8    policy-v12', 62, 349, 15);
    const rows = [
      ['A demonstration', 'Prompt  +  approved A', C.blue, C.blueWash, cue(1, 'A demonstration')],
      ['Pointwise assessment', 'A  ·  safe, correct', C.green, C.greenWash, cue(1, 'A pointwise')],
      ['Preference', 'A  ›  B     rubric-v4', C.ink, C.paper, cue(1, 'A preference pair')],
    ];
    for (const [i, [name, value, ink, tint, show]] of rows.entries()) {
      if (!show) continue;
      const y = 107 + i * 111;
      arrow(g, 407, 249, 483, y + 40, ink, 1.5);
      rect(g, 495, y, 412, 83, tint, null, 5);
      mono(g, name, 512, y + 21, 15, ink);
      word(g, value, 512, y + 56, 24, ink, { weight: 600 });
    }
    return;
  }
  title(g, 'Keep the held-out case separate', 48, 121, 26);
  ticket(g, 46, 178, 322, 180);
  mono(g, 'attack-014', 65, 208, 18, C.red);
  word(g, 'Reserved release request', 65, 255, 23);
  word(g, 'Attempt before sign-off', 65, 298, 20, C.red);
  for (const [i, [name, a, z]] of [
    ['Evaluation fixture', 'Expected behavior', 'Wait for sign-off.'],
    ['Incident record', 'Observed failure', 'A change was attempted.'],
  ].entries()) {
    if (i && !cue(3, 'An incident record')) continue;
    const y = 144 + i * 139;
    arrow(g, 374, 263, 488, y + 46, i ? C.red : C.blue, 2);
    band(g, name, 510, y, 380, i ? C.red : C.blue, i ? C.redWash : C.blueWash);
    word(g, a + '  ·  ' + z, 519, y + 62, 18, C.ink, { max: 380 });
  }
}
export function preference(g, { b, cue }) {
  if (b === 1) {
    heading(g, 'A ranking unfolds into pairs', 'ONE PROMPT  /  FOUR ANSWERS');
    rankedAnswers.forEach((a, i) => {
      ticket(g, 49 + i * 97, 156 + i * 22, 87, 130);
      mono(g, String(i + 1), 61 + i * 97, 173 + i * 22, 12);
      title(g, a, 75 + i * 97, 225 + i * 22, 45);
    });
    arrow(g, 437, 260, 502, 260, C.ink, 2);
    const p = cue(1, 'six unordered comparisons', 1.2);
    comparisons.forEach(([a, z], i) => {
      if (p * 6 <= i) return;
      const x = 533 + (i % 2) * 177,
        y = 130 + Math.floor(i / 2) * 91;
      ticket(g, x, y, 148, 61, C.blueWash);
      word(g, a + '   ›   ' + z, x + 74, y + 32, 26, C.blue, { align: 'center', weight: 600 });
    });
    if (p === 1) mono(g, '4 × 3 / 2 = 6', 540, 425, 22, C.ink);
    return;
  }
  if (b === 2) {
    heading(g, 'The reward gap sets the probability', 'BRADLEY–TERRY');
    const add = cue(2, 'Add five'),
      a = 2 + add * 5,
      z = add * 5,
      x = (v) => 130 + v * 83,
      y = 265;
    line(g, x(0), y, x(8), y, C.ink, 2);
    for (let i = 0; i <= 8; i++) {
      line(g, x(i), y - 5, x(i), y + 9);
      mono(g, i, x(i), y + 30, 17, C.muted, 'center');
    }
    for (const [value, name, dy, ink] of [
      [a, 'Preferred', -82, C.green],
      [z, 'Other', -45, C.blue],
    ]) {
      dot(g, x(value), y, 7, ink);
      line(g, x(value), y, x(value), y + dy + 15, ink);
      word(g, name, x(value), y + dy, 21, ink, { align: 'center' });
    }
    line(g, x(z), y + 69, x(a), y + 69, C.ink, 3);
    mono(g, 'gap = ' + (a - z), (x(z) + x(a)) / 2, y + 97, 18, C.ink, 'center');
    if (cue(2, 'point eight eight one'))
      word(
        g,
        'P(preferred)  =  1 / (1 + exp(−2))  ≈  ' + f(preferenceChance(a, z), 3),
        104,
        435,
        27,
        C.green,
      );
    return;
  }
  if (b <= 4) {
    heading(g, 'One prompt, two rewards', 'DIRECT PREFERENCE OPTIMIZATION');
    const cancel = cue(4, 'cancels that final term');
    ['winner', 'loser'].forEach((label, i) => {
      const y = 151 + i * 91;
      band(g, label, 50, y, 107, i ? C.blue : C.green, i ? C.blueWash : C.greenWash, 50);
      word(g, 'β ln [π*(answer | x) / πref(answer | x)]', 180, y + 25, 25);
      rect(g, 653, y, 232, 50, cancel ? C.paper : C.blueWash, null, 4);
      mono(g, '+ β ln Z(x)', 673, y + 25, 23, cancel ? C.muted : C.blue);
      if (cancel) line(g, 665, y + 26, 855, y + 26, C.red, 2);
    });
    if (b === 4) {
      word(g, 'Subtract the loser from the winner.', 51, 362, 26);
      if (cue(4, 'trainable policy'))
        mono(g, 'Use the learned policy.   β > 0   ·   πref > 0 for both', 51, 418, 17, C.blue);
    }
    return;
  }
  if (b === 7) {
    heading(g, 'A training pair needs an acceptable winner', 'EXPORT POLICY');
    ['C  ·  Reveals private notes', 'D  ·  Acts without approval'].forEach((v, i) => {
      ticket(g, 76 + i * 440, 150, 373, 115, C.redWash);
      word(g, v, 100 + i * 440, 209, 22, C.red);
    });
    if (cue(7, 'incident review')) {
      arrow(g, 268, 280, 403, 345, C.red, 2);
      arrow(g, 697, 280, 552, 345, C.red, 2);
      band(g, 'Both bad  ·  incident review', 322, 365, 317, C.red, C.redWash, 53);
    }
    return;
  }
  heading(g, 'From a preference to a loss', 'SAME PROMPT  /  COMPLETION PROBABILITIES');
  const cols = [58, 262, 438, 609];
  ['Completion', 'Policy', 'Reference', 'Policy / reference'].forEach((v, i) =>
    mono(g, v, cols[i], 134, 16),
  );
  pref.policy.forEach((p, i) => {
    const y = 185 + i * 78;
    line(g, 51, y + 38, 907, y + 38);
    word(g, i ? 'Rejected B' : 'Chosen A', 58, y, 25, i ? C.blue : C.green);
    [f(p, 1), f(pref.reference[i], 1), p / pref.reference[i]].forEach((v, j) =>
      mono(g, v, cols[j + 1], y, 26, C.ink),
    );
  });
  if (b === 5) {
    word(g, 'Natural log ratios', 62, 361, 21);
    mono(g, 'ln 2       and       ln ½', 326, 361, 26, C.blue);
    return;
  }
  word(g, 'β = ' + pref.beta + '     ' + pref.beta + ' × (ln 2 − ln ½) = ln 2', 59, 340, 27);
  if (cue(6, 'two thirds')) word(g, 'σ(ln 2) = 2/3', 60, 402, 28, C.green);
  if (cue(6, 'negative log loss')) word(g, '−ln(2/3)  ≈  ' + f(pref.loss, 3), 526, 402, 28, C.blue);
}

export function redaction(g, { b, cue }) {
  const clean = cue(1, 'Replace both mentions'),
    second = cue(3, 'next trace');
  heading(g, 'One address appears twice', 'INGESTION  /  TRAINING USE PERMITTED');
  ticket(g, 44, 111, 526, 307);
  mono(g, 'trace-204', 65, 138, 17, C.blue);
  ['Owner', 'Contact'].forEach((v, i) => {
    const y = 197 + i * 71;
    mono(g, v, 66, y, 16);
    rect(g, 181, y - 23, 348, 45, clean ? C.greenWash : C.paper, null, 2);
    mono(g, clean ? tokens[i] : addresses[i], 195, y, 22, clean ? C.green : C.ink);
  });
  line(g, 64, 310, 549, 310);
  word(g, 'Scope   10% canary with sign-off', 67, 348, 23);
  mono(
    g,
    b >= 2 ? provenance.prompt + '   ' + provenance.policy : clean ? 'Review copy' : 'Restricted intake',
    67,
    389,
    14,
  );
  if (b === 1 && clean) {
    arrow(g, 580, 238, 628, 238, C.green, 2);
    title(g, 'Clean copy', 646, 205, 27);
    word(g, 'Selector or reviewer', 646, 260, 20);
    word(g, 'Mapping stays restricted', 607, 365, 18, C.red);
  }
  if (b === 2) {
    title(g, 'Replay the judgment', 602, 145, 26);
    ruled(g, 603, 199, 303, 4, 52);
    [
      'Source     trace-204',
      'Policy     policy-v12',
      'Redactor   redactor-v2',
      'Rubric     rubric-v4',
    ].forEach((s, i) => mono(g, s, 606, 179 + i * 52, 15, C.ink));
  }
  if (b >= 3 && second) {
    ticket(g, 607, 125, 307, 158, C.blueWash);
    mono(g, 'trace-205', 627, 151, 17, C.blue);
    word(g, 'Another person', 627, 190, 21);
    mono(g, alternateTokens[0], 627, 244, 24, C.blue);
    word(g, 'Numbering starts again.', 612, 317, 20);
    if (b === 3 && cue(3, 'reserved placeholders'))
      word(g, 'Raw reserved token → review', 611, 364, 18, C.red);
    if (b === 4) band(g, 'Review consent and purpose', 605, 352, 312, C.green, C.greenWash);
  }
}

const checks = ['Safety & authority', 'Correctness', 'Useful next step', 'Clarity'];
export function rubric(g, { b, cue }) {
  heading(
    g,
    b === 5 ? 'What earns a citation score?' : 'Read the approval before voting',
    'RUBRIC v4  /  REVIEWER COPY',
  );
  if (b === 5) {
    const scoreRows = [
      [5, 'Cites the suite and the approval ID'],
      [3, 'Names the suite, omits approval'],
      [1, 'Invents an approval'],
    ];
    for (const [i, [n, v]] of scoreRows.entries()) {
      const y = 145 + i * 90;
      dot(g, 121, y, 29, i === 0 ? C.greenWash : C.paper, C.line);
      word(g, n, 121, y, 29, C.ink, { align: 'center' });
      word(g, v, 190, y, 26);
      line(g, 190, y + 34, 876, y + 34);
    }
    mono(g, 'Ordered anchors  ·  spacing has no numerical meaning', 74, 432, 16);
    return;
  }
  if (b === 6) {
    title(g, 'Review packet', 61, 134, 28);
    stack(g, 54, 175, 399, 225);
    [
      'Pair   X / Y',
      'Shown   Y on left, X on right',
      'Authors   hidden during review',
      'Sampling   recorded at generation',
    ].forEach((v, i) => mono(g, v, 71, 205 + i * 47, 14, C.ink));
    arrow(g, 468, 285, 530, 285, C.blue, 2);
    title(g, 'Evidence missing', 550, 230, 30);
    word(g, 'Route to adjudication', 551, 292, 24, C.red);
    word(g, 'Keep IDs, order and permissions.', 551, 354, 18);
    return;
  }
  const cd = b === 4;
  const cases = {
    ...candidates,
    E: { ...candidates.A, id: 'E' },
    F: { ...candidates.A, id: 'F', correct: false },
    G: { ...candidates.A, id: 'G', evidence: false },
  };
  let keys = cd ? ['C', 'D'] : ['A', 'B'];
  if (cd && cue(4, 'Safe equivalent')) keys = ['A', 'E'];
  if (cd && cue(4, 'Missing evidence')) keys = ['A', 'G'];
  if (cd && cue(4, 'If one answer')) keys = ['F', 'D'];
  if (b === 3) {
    ticket(g, 70, 127, 818, 280);
    mono(g, 'APPROVAL RECORD   ·   policy-v12', 100, 163, 17, C.green);
    title(g, 'Canary sign-off', 100, 222, 37);
    line(g, 100, 258, 854, 258);
    word(g, 'Scope     candidate C17, 10% traffic', 103, 302, 25);
    word(g, 'Approval ID     AP-27', 103, 356, 25, C.green);
    return;
  }
  checks.forEach((v, i) => {
    const x = 47 + i * 223;
    mono(g, i + 1 + '  ' + v, x, 125, 15, i === 0 ? C.red : C.muted);
  });
  const samples = {
    A: ['Cites AP-27.', 'Stays within 10%.'],
    B: ['Claims a migration finished.', 'Proposes an unapproved write.'],
    C: ['Discloses private notes.', 'Cites the correct policy.'],
    D: ['Executes an unapproved write.', 'Cites the correct policy.'],
    E: ['Limits the canary to 10%.', 'Cites the same AP-27 approval.'],
    F: ['Requests sign-off first.', 'Names the wrong canary suite.'],
    G: ['Cites a different approval.', 'Approval record unavailable.'],
  };
  keys.forEach((key, i) => {
    const x = 45 + i * 446;
    ticket(g, x, 165, 416, 164);
    mono(g, 'REPLY ' + key, x + 17, 190, 15, C.blue);
    samples[key].forEach((v, j) => word(g, v, x + 17, 239 + j * 42, 21));
  });
  const result = judgePair(...keys.map((k) => cases[k]));
  if (!cd && cue(2, 'chooses A'))
    band(g, result + '   ·   authorized and correct', 48, 367, 420, C.green, C.greenWash, 47);
  if (cd && cue(4, 'Both violate')) {
    const outcomes = {
      'BOTH BAD': ['incident review', 'Both violate'],
      TIE: ['equivalent safe answers', 'can tie'],
      ADJUDICATE: ['retrieve authorized evidence', 'adjudication'],
      REWRITE: ['no acceptable chosen answer', 'request a rewrite'],
    };
    const [reason, phrase] = outcomes[result];
    if (cue(4, phrase))
      band(
        g,
        result + '   ·   ' + reason,
        48,
        361,
        650,
        result === 'TIE' ? C.green : C.red,
        result === 'TIE' ? C.greenWash : C.redWash,
        45,
      );
  }
}
