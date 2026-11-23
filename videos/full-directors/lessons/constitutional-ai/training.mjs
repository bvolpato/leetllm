import { C, cue, cueAfter, smooth, lerp, book, recordCase, archiveHeader, strip, stamp } from './art.mjs';
import { revisionDistribution } from '../../../films/constitutional-ai/construction.mjs';
import {
  accessResult,
  orderedVerdict,
  policyObjective,
  softPreferenceStep,
} from '../../../films/constitutional-ai/arithmetic.mjs';
import { orderAudit } from '../../../films/constitutional-ai/fixtures.mjs';

export const request = 'Can I see the incident timeline?';
export const target = 'Please request access through the support portal.';
export function accessState(grant, destination = true) {
  return accessResult({ record: grant, destination });
}

export function opening(a, k) {
  const b = k.beat.beatIndex + 1;
  const open = smooth(cue(k, 1, 'Can we edit', 1.3));
  const second = cue(k, 2, 'And can I see');
  const denied = cue(k, 3, 'application stops');
  const grantVisible = cue(k, 2, 'grant for this incident');
  a.base(true);
  archiveHeader(a, 'Signed in', 'Private workspace');
  a.serif('Can we edit the docs during the freeze?', 99, 244, 66, C.white);
  a.fade(second, () => a.serif('And can I see the incident timeline?', 99, 331, 62, C.sky));
  const slide = smooth(cue(k, 2, 'And can I see', 0.8));
  if (b < 4) book(a, lerp(495, 111, slide), lerp(373, 433, slide), lerp(1.26, 1.12, slide), open);
  a.fade(b < 4 ? Math.max(0, (slide - 0.9) / 0.1) : 0, () => {
    recordCase(a, 1028, 450, 1.25, accessState(false).fetched);
    a.mono(
      grantVisible ? 'Trusted grant   /   absent' : 'Incident record   /   restricted',
      1040,
      892,
      31,
      grantVisible ? C.gold : C.fog,
    );
  });
  if (b === 3) {
    a.mono('Reply   /   Yes, you can edit the docs.', 115, 916, 30, C.mint);
    if (denied) stamp(a, 'Read stopped before retrieval', 1030, 929, 738, C.teal);
  }
  if (b === 4) {
    a.rect(90, 398, 1738, 606, C.cream, 8);
    a.mono('HOW THE MODEL LEARNS THIS REPLY', 140, 467, 29, C.teal);
    a.serif('A written access principle', 139, 566, 72);
    a.line(147, 621, 1735, 621, C.seam, 3);
    a.mono('SUPERVISED TARGET', 143, 699, 31, C.teal);
    a.label('Request + revised answer', 141, 774, 48);
    if (cue(k, 4, 'Later')) {
      a.mono('PREFERENCE LABEL', 962, 699, 31, C.blue);
      a.label('Two fresh answers + judgment', 960, 774, 45, C.ink, { width: 790 });
    }
    if (cue(k, 4, 'serving prompt'))
      a.serif(
        'At serving time the rule goes into the context for this call.',
        142,
        914,
        49,
        C.muted,
        { width: 1570 },
      );
  }
}

export function principle(a, k) {
  const claim = cue(k, 1, 'they manage'),
    granted = cue(k, 2, 'application records the grant');
  const allowed = accessState(Boolean(granted)).fetched;
  a.base(true);
  archiveHeader(a, 'Signed in', 'Private workspace');
  if (k.beat.beatIndex >= 2) {
    a.sheet(132, 198, 1652, 737);
    a.mono('CONSTITUTION  /  VERSION 3', 193, 286, 32, C.teal);
    a.serif('When one request contains two questions', 191, 397, 66);
    a.label('1', 193, 526, 47, C.brass, { face: 'mono' });
    a.label('Answer the public part from the runbook.', 285, 525, 49);
    a.label('2', 193, 623, 47, C.brass, { face: 'mono' });
    a.label(
      'Read a private record only with an authorized destination and grant.',
      285,
      623,
      46,
      C.ink,
      { width: 1385 },
    );
    a.line(193, 691, 1718, 691, C.seam);
    a.mono('Example 17   ·   rule v3   ·   reviewer decision retained', 195, 769, 32, C.teal);
    a.serif(
      k.beat.beatIndex === 3
        ? 'Held-out cases test whether the model follows the rule.'
        : 'Who shaped this rule? Whose judgment settled a disagreement?',
      194,
      863,
      45,
      C.blue,
      { width: 1518 },
    );
    return;
  }
  a.serif('What changed the permission?', 100, 247, 70, C.paper);
  a.sheet(101, 325, 803, 534);
  a.mono('INCIDENT ACCESS RECEIPT', 151, 402, 29, C.teal);
  a.label('Record', 151, 514, 33, C.muted);
  a.serif('INC-8821', 440, 519, 54);
  a.label('Read grant', 151, 621, 33, C.muted);
  a.serif(granted ? 'Present' : 'Absent', 440, 630, 70, granted ? C.teal : C.brick);
  a.line(151, 691, 853, 691, C.seam, 3);
  a.label(
    granted
      ? 'Signed by incident owner'
      : claim
        ? 'Caller says “I manage the incident.”'
        : 'Signed-in engineer',
    151,
    772,
    40,
    C.ink,
    { width: 685 },
  );
  recordCase(a, 1020, 398, 1.26, allowed);
  a.mono('Public answer   /   Documentation edits may continue.', 106, 957, 34, C.mint);
}

export function proof(a, k) {
  const draft = cue(k, 1, 'drafting model writes'),
    crit = cue(k, 2, 'promise to get');
  const revised = cue(k, 3, 'Please request'),
    lift = smooth(cue(k, 3, 'Lift the proof', 1.0));
  a.base(true);
  a.sheet(175, 207, 1550, 715, C.gold);
  a.mono('SUPERVISED TRAINING COPY     /     CASE 17', 240, 295, 32, C.blue);
  a.label('Original request', 240, 411, 34, C.muted);
  a.serif(request, 239, 503, 66);
  a.line(239, 561, 1650, 561, C.brass);
  a.label('Revised answer', 239, 664, 35, C.teal);
  a.serif(target, 239, 768, 62, C.ink, { width: 1420 });
  // Clip the proofs at the bench edges as the annotated original lifts away.
  a.ctx.save();
  a.ctx.beginPath();
  a.ctx.rect(90, 100, 1750, 861);
  a.ctx.clip();
  a.at(157, 171 - 850 * lift, 1, () => {
    a.sheet(0, 0, 1560, 747, C.paper);
    a.mono('REVISION PROOF     /     CASE 17     /     RULE v3', 70, 83, 30, C.blue);
    a.serif(request, 69, 200, 66);
    a.mono('SIGNED IN     ·     INCIDENT GRANT ABSENT', 72, 265, 27, C.teal);
    a.line(70, 311, 1483, 311, C.seam);
    a.label('Draft', 70, 378, 34, C.muted);
    if (draft) a.serif('“I’ll get the timeline for you.”', 70, 462, 61);
    if (crit) {
      a.line(103, 477, 663, 477, C.brick, 6);
      a.line(663, 477, 815, 477, C.brick, 3);
      a.line(815, 477, 844, 413, C.brick, 3);
      a.label('Promised a read', 857, 375, 38, C.brick);
      a.label('without a grant.', 857, 421, 38, C.brick);
    }
    a.line(70, 530, 1483, 530, C.seam);
    a.label('Revision', 70, 590, 34, C.muted);
    if (revised) a.serif(target, 70, 675, 52, C.teal, { width: 1410 });
  });
  a.ctx.restore();
}

export function supervised(a, k) {
  const b = k.beat.beatIndex + 1;
  if (b >= 5) {
    a.base();
    a.title('SUPERVISED MIXTURE', 'Which answer fits the request?');
    const rows = [
      ['Incident only', request, target],
      ['Public only', 'Can I edit the docs?', 'Documentation edits may continue.'],
      [
        'Mixed',
        'Docs and timeline, without a grant',
        'Answer the freeze rule. Refer to the portal.',
      ],
    ];
    rows.forEach(([label, q, t], i) => {
      const y = 267 + i * 211;
      a.sheet(107, y, 1696, 179, i === 0 ? C.cream : C.paper);
      a.mono(label, 150, y + 63, 30, C.teal);
      a.serif(q, 505, y + 68, 45);
      if (i === 0 || cue(k, 5, i === 1 ? 'freeze rule' : 'mixed questions'))
        a.label(t, 506, y + 139, 38, C.blue);
    });
    if (b === 6)
      a.mono('Held-out public requests   /   Does the answer still help?', 108, 987, 33, C.teal);
    return;
  }
  const s = revisionDistribution(2, smooth(cue(k, 3, 'Take one gradient step', 1.25)));
  a.base(true);
  a.sheet(105, 127, 1710, 775, C.cream);
  a.mono('TRAINING COPY  /  NEXT WORD', 166, 209, 31, C.teal);
  a.label(request, 167, 291, 43, C.muted);
  a.serif(s.prefix.join(' '), 161, 418, 91);
  a.serif(cue(k, 1, 'The target is') ? s.words[2] : '________', 810, 418, 91, C.teal);
  a.line(160, 485, 1750, 485, C.seam, 3);
  if (cue(k, 2, 'three possible next words')) {
    s.choices.forEach((w, i) => {
      const y = 557 + 94 * i;
      a.label(w, 171, y + 38, 40, i === 0 ? C.teal : C.ink);
      a.rect(450, y, 805, 45, C.seam);
      a.rect(450, y, 805 * s.probabilities[i], 45, i === 0 ? C.teal : C.blue);
      if (i === 0)
        a.line(450 + 805 * s.before[i], y - 10, 450 + 805 * s.before[i], y + 54, C.brick, 5);
      a.mono(s.probabilities[i].toFixed(3), 1290, y + 37, 38);
    });
    if (cue(k, 3, 'loss falls'))
      a.mono('Loss = −ln P(access) = ' + s.loss.toFixed(3) + ' nats', 166, 855, 33, C.blue);
  } else {
    a.label('The two supplied words come from the saved revision.', 168, 631, 48);
  }
}

export function ballots(a, k) {
  const turn = cue(k, 2, 'Swap the candidate positions', 1.65);
  const travel = smooth(Math.min(1, Math.max(0, (turn - 0.25) / 0.5)));
  const raise = smooth(Math.min(1, 4 * turn, 4 * (1 - turn)));
  const beforeVotes = cueAfter(k, 1, 'both example judges choose A');
  const afterVotes = [
    cueAfter(k, 3, 'The judge applying the access rule still chooses A, now on the right'),
    cueAfter(k, 3, 'It chooses B'),
  ];
  a.base();
  a.title('CASE 17  /  TWO FRESH RESPONSES', 'Can you follow the answer through the swap?');
  a.mono('LEFT SLOT', 509, 262, 30, C.muted, { align: 'center' });
  a.mono('RIGHT SLOT', 1405, 262, 30, C.muted, { align: 'center' });

  const responses = [
    ['A', 'Use the access portal.', C.teal],
    ['B', '[Restricted timeline excerpt]', C.brick],
  ];
  responses.forEach(([id, words, color], i) => {
    if (i === 1 && !cue(k, 1, 'B includes')) return;
    const x = lerp(i ? 1010 : 114, i ? 114 : 1010, travel);
    const y = 392 + (i ? 1 : -1) * 115 * raise;
    a.sheet(x, y, 790, 119);
    a.rect(x, y, 105, 119, color);
    a.serif(id, x + 27, y + 86, 76, C.white);
    a.label(words, x + 133, y + 76, 42, C.ink, { width: 624 });
  });

  a.mono('JUDGE', 124, 663, 32);
  a.mono('FIRST BALLOT', 670, 663, 32);
  a.mono('AFTER SWAP', 1249, 663, 32);
  for (const [i, rule] of ['content', 'position'].entries()) {
    const previous = orderedVerdict(0, rule);
    const next = orderedVerdict(1, rule);
    const y = 742 + i * 85;
    a.line(122, y - 52, 1787, y - 52, C.fog, 2);
    a.label(i ? 'Always picks left' : 'Checks the rule', 122, y, 43);
    a.mono(beforeVotes ? previous.position + '  /  ' + previous.responseId : '…', 672, y, 46, C.blue);
    if (turn === 1 && afterVotes[i]) {
      const staysWith = next.responseId === previous.responseId ? 'Same answer' : 'Same slot';
      const color = next.responseId === 'A' ? C.teal : C.brick;
      a.mono(next.position + '  /  ' + next.responseId, 1248, y, 46, color);
      a.label(staysWith, 1582, y, 36, color, { width: 206 });
    } else {
      a.mono('…', 1248, y, 46);
    }
  }
  if (k.beat.beatIndex === 3)
    a.mono('Sample agreements and disagreements for human review.', 124, 867, 32, C.teal);
}

export function shares(a, k) {
  const second = cue(k, 1, 'swapped order'),
    mapped = cue(k, 2, 'point three');
  const mean = cue(k, 3, 'mean is point five five');
  const clamped = cue(k, 5, 'move down', 1);
  a.base(true);
  a.title(
    'ORDER AUDIT   /   A = PORTAL     B = DISCLOSURE',
    'Which pieces belong to answer A?',
    true,
  );
  const bars = [
    [
      ['A', orderAudit.forwardA],
      ['B', 1 - orderAudit.forwardA],
    ],
    [
      ['B', orderAudit.swappedB],
      ['A', orderAudit.swappedA],
    ],
  ];
  bars.forEach((segments, i) => {
    const y = 300 + 165 * i;
    a.mono('BALLOT ' + (i + 1), 109, y + 63, 35, C.fog);
    if (i ? !second : !cue(k, 1, 'point eight')) return;
    let x = 410;
    for (const [id, v] of segments) {
      const w = 1340 * v;
      a.rect(x, y, w, 98, id === 'A' ? C.mint : C.coral);
      a.mono(
        id + (i && id === 'A' && !mapped ? '' : '   ' + v.toFixed(2)),
        x + w / 2,
        y + 65,
        39,
        C.ink,
        { align: 'center', width: w - 18 },
      );
      x += w;
    }
  });
  if (mapped) {
    a.serif(
      '(0.80 + 0.30) / 2  =  ' + (mean ? orderAudit.meanA.toFixed(2) : '?'),
      410,
      738,
      68,
      C.paper,
    );
  }
  if (k.beat.beatIndex === 4) {
    const v = lerp(0.95, 0.6, smooth(clamped));
    a.mono('Study target limits   [0.40, 0.60]', 111, 839, 32, C.fog);
    a.line(781, 878, 1720, 878, C.fog, 4);
    a.rect(781 + 939 * 0.4, 863, 939 * 0.2, 30, C.teal);
    a.dot(781 + 939 * v, 878, 16, C.gold);
    a.mono(v.toFixed(2), 781 + 939 * v, 944, 36, C.gold, { align: 'center' });
  }
}

export const marginStep = softPreferenceStep();
export function margin(a, k) {
  const update = smooth(cue(k, 3, 'Subtract half', 1.1)),
    m = marginStep.margin * update,
    p = 1 / (1 + Math.exp(-m));
  const targetSeen = cue(k, 2, 'soft target of point eight');
  a.base();
  a.title('REWARD MODEL   /   SEPARATE, UNCLAMPED PAIR', 'How much should the score margin move?');
  a.sheet(104, 269, 1714, 622);
  a.mono('m = score(A) − score(B)     ·     P(A wins) = 1 / (1 + exp(−m))', 164, 354, 34, C.blue, {
    width: 1578,
  });
  const x = (t) => 238 + 1430 * t;
  a.line(x(0), 528, x(1), 528, C.steel, 7);
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    a.line(x(v), 517, x(v), 542, C.steel, 3);
    a.mono(v.toFixed(2), x(v), 585, 29, C.muted, { align: 'center' });
  }
  if (targetSeen) {
    a.line(x(0.8), 446, x(0.8), 547, C.brick, 6);
    a.mono('Target 0.80', x(0.8), 433, 33, C.brick, { align: 'center' });
  }
  a.dot(x(p), 528, 21, C.teal);
  a.mono('P = ' + p.toFixed(3), x(p), 470, 35, C.teal, { align: 'center' });
  a.serif('Margin   ' + m.toFixed(3), 163, 721, 65);
  if (cue(k, 3, 'derivative'))
    a.mono('Initial gradient   0.50 − 0.80 = −0.30', 822, 713, 34, C.blue, { width: 890 });
  if (update === 1) a.mono('Step = −0.50 × (−0.30) = +0.15', 167, 819, 36, C.teal);
  if (k.beat.beatIndex >= 4)
    a.mono(
      k.beat.beatIndex === 5
        ? 'Check the frozen scores against independent held-out preferences.'
        : 'Policy RL uses the frozen reward model and a reference-policy penalty.',
      107,
      967,
      31,
      C.teal,
    );
}

export function drift(a, k) {
  const low = policyObjective(0.2);
  const high = policyObjective(1);
  const highWeight = cueAfter(k, 3, 'set the weight to one');
  a.base(true);
  a.title(
    'TWO-ANSWER POLICY   /   FIXED REWARD SCORES',
    'What is the candidate’s gain worth after drift?',
    true,
  );
  [low.reference, low.policy].forEach((probs, i) => {
    const x = 108 + i * 887;
    a.sheet(x, 253, 815, 305);
    a.serif(i ? 'Candidate' : 'Reference', x + 46, 324, 56);
    a.mono('Score A  ' + low.scores[0] + '     Score B  ' + low.scores[1], x + 46, 373, 32, C.blue);
    const visible = i === 0 || cue(k, 1, 'A candidate assigns');
    if (visible) {
      strip(a, x + 46, 394, 720, 42, [
        { v: probs[0], color: C.teal },
        { v: probs[1], color: C.brass },
      ]);
      probs.forEach((p, j) => {
        const center = x + 46 + 720 * (j ? probs[0] + p / 2 : p / 2);
        a.mono((j ? 'B ' : 'A ') + p.toFixed(2), center, 425, 29, j ? C.ink : C.white, {
          align: 'center',
        });
      });
    }
    if (cue(k, 2, 'expected reward'))
      a.label('Mean reward  ' + (i ? low.reward : low.referenceObjective).toFixed(3), x + 46, 504, 36);
    if (cue(k, 2, 'KL divergence'))
      a.label('KL  ' + (i ? low.kl : 0).toFixed(4), x + 535, 504, 36, C.blue);
  });
  if (!cue(k, 3, 'drift weight')) return;

  const x = (v) => 490 + (v + 0.1) * 4920;
  const signed = (v) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(4);
  const reference = x(low.referenceObjective);
  const reward = x(low.reward);
  a.mono('OBJECTIVE AFTER KL PENALTY', 110, 619, 31, C.paper);
  a.mono('Reference ' + signed(low.referenceObjective), reference, 619, 29, C.sky, { align: 'right' });
  a.mono('Candidate reward ' + low.reward.toFixed(3), 1807, 619, 29, C.gold, { align: 'right' });
  const bottom = highWeight ? 914 : 806;
  for (const value of [-0.1, -0.05, 0, 0.05, 0.1, 0.15]) {
    const px = x(value);
    a.line(px, 674, px, bottom, C.steel, value === 0 ? 4 : 2);
    const tick = value === 0 ? '0' : (value < 0 ? '−' : '') + Math.abs(value).toFixed(2);
    a.mono(tick, px, 664, 26, C.fog, { align: 'center' });
  }
  a.line(reference, 682, reference, bottom, C.sky, 4);
  a.line(reward, 682, reward, bottom, C.brass, 3);

  const lowPenalty = cueAfter(k, 3, 'subtract about point zero three eight five');
  const lowMove = smooth(
    cueAfter(k, 3, 'The candidate objective is about point zero eight one five', 0.5),
  );
  const highMove = smooth(
    cueAfter(k, 4, 'The candidate objective falls to about minus point zero seven two seven', 0.65),
  );
  const rows = [[low, lowPenalty, lowMove]];
  if (highWeight) rows.push([high, true, highMove]);
  rows.forEach(([calc, showPenalty, movement], i) => {
    const y = 754 + i * 108;
    a.mono('β = ' + calc.beta.toFixed(1), 110, y - 12, 38, C.paper);
    if (showPenalty)
      a.mono('β × KL  ' + calc.penalty.toFixed(4), 112, y + 36, 32, C.gold);
    a.line(x(-0.1), y, x(0.15), y, C.steel, 3);
    a.dot(reference, y, 10, C.sky);
    a.dot(reward, y, 8, C.gold);
    if (movement === 0) return;
    const objective = x(lerp(calc.reward, calc.objective, movement));
    a.line(objective, y, reward, y, C.gold, 5);
    a.dot(objective, y, 13, C.mint);
    if (movement === 1) {
      a.rect(objective - 77, y + 21, 154, 42, C.night, 5);
      a.mono(signed(calc.objective), objective, y + 51, 32, C.mint, { align: 'center' });
    }
  });
}

export const study = [
  ['RLAIF vs SFT', 71, 59],
  ['RLHF vs SFT', 73, 61],
  ['RLAIF vs RLHF', 50, 47],
];
export function context(a, k) {
  a.base();
  if (k.beat.beatIndex < 2) {
    a.title(
      'LEE ET AL.   /   HUMAN CHOICES BETWEEN PaLM 2 SUMMARIES',
      'What did the length adjustment change?',
    );
    a.mono('Share of human comparisons won', 109, 291, 32, C.muted);
    const x = (p) => 655 + (p - 40) * 31;
    for (let p = 40; p <= 75; p += 5) {
      a.line(x(p), 330, x(p), 791, C.fog, 2);
      a.mono(p + '%', x(p), 839, 28, C.muted, { align: 'center' });
    }
    study.forEach(([name, raw, adjusted], i) => {
      const y = 407 + i * 157;
      a.label(name, 113, y + 14, 47);
      if (![cue(k, 1, 'seventy-one'), cue(k, 1, 'seventy-three'), cue(k, 2, 'fifty to forty')][i])
        return;
      const known = [cue(k, 1, 'fifty-nine'), cue(k, 1, 'sixty-one'), cue(k, 2, 'forty-seven')][i];
      if (known) {
        a.line(x(adjusted), y, x(raw), y, C.steel, 5);
        a.dot(x(adjusted), y, 17, C.teal);
      }
      a.dot(x(raw), y, 15, C.blue);
      a.mono(raw + '%', x(raw) + 5, y - 36, 31, C.blue, { align: 'center' });
      if (known) a.mono(adjusted + '%', x(adjusted), y + 62, 31, C.teal, { align: 'center' });
    });
    a.mono('Blue  /  raw      Green  /  length-adjusted', 110, 944, 32);
  } else {
    a.title('TRAINING METHODS', 'Which artifact changes the policy?');
    const rows =
      k.beat.beatIndex === 2
        ? [
            ['2022', 'Principles guide revisions and pairwise labels.'],
            ['Jan 2026', 'A constitution explains the reasons behind its values.'],
            ['May 2026', 'Synthetic documents, advice and tool-equipped RL environments.'],
          ]
        : [
            ['RLAIF', 'Preferences → reward model → policy RL'],
            ['DPO', 'Chosen and rejected responses → direct policy loss'],
            ['Soft labels', 'Retaining a graded judgment requires a compatible loss.'],
          ];
    rows.forEach(([label, desc], i) => {
      const y = 316 + 186 * i;
      a.line(106, y + 112, 1792, y + 112, C.fog, 3);
      a.mono(label, 114, y + 49, 40, C.teal);
      a.serif(desc, 485, y + 49, 47, C.ink, { width: 1260 });
    });
    a.mono(
      'Evaluate the incident assistant on its own tasks and permissions.',
      110,
      955,
      33,
      C.blue,
    );
  }
}
