import { C, cue, fmt, full, sign, lerp } from './workshop.mjs';
import {
  gamma,
  avg,
  coin,
  openingPolicyValues,
  openingBaseline,
  openingGradient,
  updatedPolicy,
  actionNames,
  clipScore,
  group,
  tokens,
  propensities,
  ratios,
  pathWeight,
  riskAware,
} from './exchange.mjs';

function medallion(d, x, y, r, face) {
  d.dot(x + 2, y + 8, r + 1, '#091b20');
  d.dot(x, y, r, C.metal, C.copper, 4);
  d.dot(x, y, r - 8, '#d6ad6e', C.ink, 2);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
    const dx = Math.cos(a),
      dy = Math.sin(a);
    d.line(
      x + (r - 17) * dx,
      y + (r - 17) * dy,
      x + (r - 11) * dx,
      y + (r - 11) * dy,
      '#927046',
      2,
    );
  }
  d.txt(face, x, y, r * 0.94, C.ink, 'center', 'Serif', 600);
}
export function gradient(d, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 3) {
    d.title(
      'POLICY GRADIENT   /   CREDIT ALONG AN EPISODE',
      'Which later rewards count for a sampled move?',
    );
    d.tube([
      [279, 500],
      [1620, 500],
    ]);
    ['Ask', 'Approve', 'Closed'].forEach((name, i) => {
      const x = 320 + i * 640;
      d.socket(x, 500, [C.brass, C.green, C.blue][i], 30);
      d.txt(name, x, 396, 60, C.cream, 'center', 'Serif');
    });
    d.mono('−4', 603, 553, 43, C.red, 'center');
    d.mono('+70', 1300, 553, 43, C.green, 'center');
    d.txt('Reward-to-go from ask', 139, 722, 36, C.faint);
    d.mono('G₀ = −4 + 0.90 × 70', 896, 722, 40, C.cream);
    if (b === 2) {
      d.txt('Credit from the second action', 139, 830, 36, C.faint);
      d.mono('0.90 × grad log π(approve) × 70', 896, 830, 37, C.brass);
    }
    return;
  }
  if (b <= 4) {
    d.title(
      'POLICY GRADIENT   /   ADJUSTABLE COIN',
      'Put the time weight on the step that earns the reward',
    );
    d.txt('First move fixed', 317, 342, 42, C.faint, 'center', 'Serif');
    d.ticket(132, 422, 373, 212, { id: 'Start', label: 'STEP 0', foot: 'Reward  0' });
    d.tube([
      [508, 526],
      [806, 526],
    ]);
    medallion(d, 933, 526, 122, '½');
    d.txt('Step 1  ·  fair coin', 933, 342, 41, C.cream, 'center', 'Serif');
    d.txt('Heads pays 1', 1509, 444, 50, C.green, 'center', 'Serif');
    d.txt('Tails pays 0', 1509, 599, 50, C.blue, 'center', 'Serif');
    const weighted = cue(k, 4, 'point two two five') > 0;
    d.mono(
      weighted
        ? 'dJ/dθ = 0.90 × 0.25 = ' + fmt(gamma * coin(0).mean, 3)
        : 'dp/dθ = p(1 − p) = 0.25',
      960,
      806,
      47,
      C.brass,
      'center',
    );
    if (b === 4) d.note('From the episode start, J = 0.90 × P(heads).', 960, 920);
    return;
  }
  if (b <= 8) {
    d.title(
      'POLICY GRADIENT   /   IMMEDIATE COIN REWARD',
      'How far apart are the two gradient samples?',
    );
    const base =
      b === 5
        ? cue(k, 5, 'one half') > 0
          ? 0.5
          : 0
        : b === 6
          ? cue(k, 6, 'ten') > 0
            ? 10
            : 0.5
          : 0.5;
    const row = coin(base);
    d.plate(115, 280, 431, 553);
    medallion(d, 330, 448, 94, '½');
    d.txt('Baseline', 330, 625, 39, C.cream, 'center', 'Serif');
    d.window(208, 680, 245, 88, fmt(base), C.brass);
    d.txt('Sampled gradient', 658, 341, 45, C.cream, 'left', 'Serif');
    const pos = d.ruler(698, 568, 1035, -5.5, 5.5, [-5, -2.5, 0, 2.5, 5]);
    const mean = pos(row.mean);
    d.line(mean, 422, mean, 691, C.brass, 3);
    row.samples.forEach((v, i) => {
      const y = i ? 487 : 643,
        px = pos(v),
        col = i ? C.green : C.blue;
      d.line(px, 568, px, y, col, 5);
      d.dot(px, y, 14, col, C.dark, 3);
      d.mono((i ? 'Heads   ' : 'Tails   ') + fmt(v), px, y + (i ? -39 : 42), 29, col, 'center');
    });
    d.mono(
      'Mean  ' + fmt(row.mean) + '       Variance  ' + fmt(row.variance, 4),
      1190,
      791,
      36,
      C.cream,
      'center',
    );
    d.note(
      b <= 6
        ? 'Sample = (action − 0.5) × (reward − baseline)'
        : b === 7
          ? 'Use a state baseline independent of the sampled action. Hold it fixed for the actor gradient.'
          : 'Advantage = Qπ(s,a) − Vπ(s).   The sampled return minus Vπ(s) estimates it.',
      960,
      929,
      C.brass,
      34,
    );
    return;
  }
  d.title(
    'POLICY GRADIENT   /   THE OPENING ROUTER',
    'Use the return above the policy average to change the odds',
  );
  const updated = b === 11;
  const xpos = [159, 693, 1047, 1510];
  const headers = ['Opening move', 'Return', 'Initial logit slope', updated ? 'New probability' : 'Probability'];
  headers.forEach((s, i) => d.txt(s, xpos[i], 322, 33, C.faint));
  openingPolicyValues.forEach((q, i) => {
    const y = 437 + i * 150,
      col = [C.red, C.green, C.blue][i],
      p = updated ? updatedPolicy[i] : 1 / 3;
    d.line(139, y + 75, 1786, y + 75, C.hair, 2);
    d.txt(actionNames[i], 159, y, 48, col, 'left', 'Serif');
    d.mono(fmt(q), 693, y, 45, C.cream);
    d.mono(b >= 10 ? fmt(openingGradient[i], 2) : '·', 1047, y, 43, C.cream);
    d.mono(full(p, 3), 1510, y, 45, col);
    d.rect(1509, y + 44, 225, 9, C.dark, 4);
    d.rect(1509, y + 44, 225 * p, 9, col, 4);
  });
  d.note(
    updated
      ? 'New probabilities = softmax(old logits + 0.03 × slopes)'
      : b === 10
        ? 'Review slope = ⅓ × (54 − (−11.75)) ≈ ' + fmt(openingGradient[2])
        : 'Equal odds   ·   mean return = ' + fmt(openingBaseline),
    960,
    922,
    C.brass,
    37,
  );
}

function tokenStrip(d, x, y, words, weight, color) {
  let left = x;
  words.forEach((word) => {
    const w = word.length * 20 + 55;
    d.pill(left, y, w, 76, word, color);
    if (weight !== null) d.mono(fmt(weight, 3), left + w / 2, y + 114, 27, color, 'center');
    left += w + 13;
  });
}
export function tokenPolicy(d, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    d.title('LANGUAGE POLICY   /   TEXT-ONLY TRANSITION', 'Append the chosen token to the state');
    d.ticket(97, 329, 427, 246, { id: 'REQ-10234', label: 'PROMPT', foot: 'Route this request' });
    d.tube([
      [531, 451],
      [802, 451],
    ]);
    const withToken = cue(k, 1, 'start its reply') > 0;
    d.txt('First-token probabilities', 876, 298, 44, C.cream, 'left', 'Serif');
    const colors = [C.red, C.green, C.blue],
      labels = ['Approve', 'Request', 'Review'];
    updatedPolicy.forEach((p, i) => {
      const y = 392 + i * 102;
      d.txt(labels[i], 876, y, 38, colors[i], 'left', 'Serif');
      d.rect(1100, y - 17, 481, 34, C.dark, 6);
      d.rect(1100, y - 17, p * 481, 34, colors[i], 6);
      d.mono(full(p, 3), 1783, y, 35, colors[i], 'right');
    });
    d.mono('Prefix', 140, 792, 30, C.faint);
    d.pill(355, 747, 462, 86, 'Route REQ-10234', C.paper);
    if (withToken) d.pill(837, 747, 232, 86, 'Request', C.green);
    if (b === 2)
      d.note(
        'EOS can end generation. A verifier can score the completed reply.',
        960,
        935,
        C.faint,
      );
    return;
  }
  if (b === 3) {
    d.title('PPO   /   ONE SAMPLED REPLY', 'Four roles use different parts of the reply');
    const roles = [
      ['Actor', 'Samples the tokens', 'Request  |  evidence'],
      ['Critic', 'Values a prefix', 'V(prompt + Request)'],
      ['Reward model', 'Scores a completion', 'r(prompt, full reply)'],
      ['Frozen reference', 'Sets the KL comparison', 'πref(token | prefix)'],
    ];
    roles.forEach(([r, job, input], i) => {
      const y = 301 + 146 * i;
      d.txt(r, 134, y + 47, 45, [C.green, C.blue, C.brass, C.red][i], 'left', 'Serif');
      d.txt(job, 648, y + 48, 34, C.faint);
      d.mono(input, 1250, y + 47, 30, C.cream, 'left', 511);
      d.line(132, y + 109, 1789, y + 109, C.hair, 2);
    });
    return;
  }
  if (b <= 5) {
    d.title('PPO   /   POSITIVE ADVANTAGE +1', 'Clip the score as the probability ratio rises');
    const p = cue(k, 4, 'probability rise', 1.3);
    const ratio = Math.round(100 * lerp(1, 1.4, p)) / 100;
    const show = cue(k, 5, 'clipped score stays') > 0;
    d.txt('New / rollout probability', 142, 336, 43, C.cream, 'left', 'Serif');
    d.mono(full(0.2 * ratio, 3) + ' / 0.20 = ' + fmt(ratio), 1746, 336, 47, C.cream, 'right');
    const pos = d.ruler(197, 596, 1518, 0.8, 1.5, [0.8, 1, 1.2, 1.4, 1.5]);
    d.line(pos(1.2), 536, pos(1.2), 596, C.brass, 4);
    d.line(pos(1.2), 655, pos(1.2), 695, C.brass, 4);
    d.mono('upper clip', pos(1.2), 413, 30, C.brass, 'center');
    d.dot(pos(ratio), 551, 17, C.blue);
    d.mono('Ratio ' + fmt(ratio), pos(ratio), 506, 32, C.blue, 'center');
    if (show) {
      const score = clipScore(ratio);
      d.dot(pos(score), 701, 17, C.green);
      d.mono('Score ' + fmt(score), pos(score), 758, 36, C.green, 'center');
    }
    d.note(
      show
        ? 'Measure the resulting KL divergence and held-out return.'
        : 'Where will the clipped score stop?',
      960,
      907,
      C.faint,
    );
    return;
  }
  if (b >= 11) {
    d.title(
      'GRPO   /   INTERPRETING THE UPDATE',
      b === 11
        ? 'How much does one reply weigh?'
        : 'Would the new policy route a fresh request correctly?',
    );
    if (b === 11) {
      d.txt('Same reward weight per token', 141, 318, 43, C.faint, 'left', 'Serif');
      const w = group([0, 1, 2]).weights[2];
      tokenStrip(d, 150, 422, ['Review'], w, C.green);
      tokenStrip(d, 150, 653, ['Review', 'this', 'request'], w, C.green);
      d.mono('1 token', 1023, 464, 36, C.cream);
      d.mono('3 tokens', 1023, 695, 36, C.cream);
      d.note(
        'Summing token terms gives longer replies more terms. Averaging within a reply changes its weight.',
        960,
        922,
        C.brass,
        33,
      );
    } else {
      d.ticket(138, 373, 482, 250, {
        id: 'Held-out request',
        label: 'FRESH PROMPT',
        foot: 'Proof missing',
      });
      d.tube([
        [622, 494],
        [1302, 494],
      ]);
      d.carrier(lerp(673, 1250, cue(k, 12, 'held-out tasks', 1.2)), 494, C.blue);
      d.txt('Updated policy', 958, 410, 50, C.blue, 'center', 'Serif');
      d.plate(1288, 372, 483, 252);
      d.txt('Evaluate the reply', 1529, 454, 43, C.cream, 'center', 'Serif');
      d.txt('P-7 satisfied?', 1529, 548, 36, C.brass, 'center');
      d.note('Check decisions on fresh requests after training.', 960, 884, C.faint);
    }
    return;
  }
  const equal = b >= 9,
    answer = !equal || cue(k, 10, 'Each reward equals', 0) === 1;
  const g = group(equal ? [1, 1, 1] : [0, 1, 2]);
  const showWeight = b >= 7 && answer;
  d.title(
    'GRPO   /   ONE PROMPT, THREE COMPLETIONS',
    equal ? 'Give every reply the same reward' : 'Follow a completion score back to its tokens',
  );
  d.txt('Sampled tokens', 148, 299, 35, C.faint);
  d.txt('Reward', 1331, 299, 35, C.faint, 'center');
  d.txt('Group score', 1646, 299, 35, C.faint, 'center');
  tokens.forEach((words, i) => {
    const y = 375 + 166 * i,
      weight = g.weights[i],
      color = equal ? C.paper : [C.red, C.paper, C.green][i];
    tokenStrip(d, 151, y, words, showWeight && b >= 8 ? weight : null, color);
    d.window(1222, y, 221, 76, fmt(g.scores[i]), C.cream);
    d.window(1504, y, 288, 76, showWeight ? fmt(weight, 3) : '?', C.brass);
  });
  const msg =
    b === 6
      ? 'A verifier scores each complete reply.'
      : b === 7
        ? '(reward − mean) / (population SD + ε)    ·    mean 1    ·    SD ≈ ' + fmt(g.std)
        : b === 8
          ? 'Outcome supervision gives each token its reply’s group score.'
          : answer
            ? 'Zero reward component for every token. The separate reference KL term can still contribute.'
            : 'Each reward equals the group mean. What reaches each token?';
  d.note(msg, 960, 945, C.brass, 34);
}

export function logBench(d, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    d.title('POLICY EVALUATION   /   ORACLE SCORECARD', 'Which starting cases went into the mean?');
    riskAware.forEach((v, i) => {
      const x = 112 + i * 430;
      d.ticket(x, 371, 400, 237, {
        id: i < 2 ? 'New request' : 'Proof verified',
        label: 'SIMULATED CASE  0' + (i + 1),
        foot: i < 2 ? 'Route to review' : 'Approve',
        verified: i >= 2,
      });
      d.mono(sign(v), x + 200, 692, 54, i < 2 ? C.blue : C.green, 'center');
    });
    const solved = cue(k, 1, 'Its mean return') > 0;
    d.note(
      solved
        ? '(54 + 54 + 70 + 70) / 4 = ' + fmt(avg(riskAware))
        : 'What is the mean of these four cases?',
      960,
      838,
      C.brass,
      43,
    );
    if (b === 2) d.note('A traffic estimate needs the actual mix of starting states.', 960, 929);
    return;
  }
  if (b <= 7) {
    d.title(
      'OFF-POLICY EVALUATION   /   LOGGED PATH',
      'How many times as likely is this path under the new policy as under the logger?',
      50,
    );
    const ys = [436, 649];
    const headers = ['Observed action', 'Logger μ', 'Target π', 'Ratio π/μ'];
    [174, 904, 1251, 1610].forEach((x, i) =>
      d.txt(headers[i], x, 300, 33, C.faint, i ? 'center' : 'left'),
    );
    propensities.forEach(([old, next], i) => {
      const y = ys[i],
        ready = b >= 4 + i,
        color = i ? C.blue : C.green;
      d.rect(120, y - 80, 1675, 154, C.plate, 14, C.hair);
      d.txt(i ? 'Approve after proof' : 'Ask for proof', 174, y, 49, color, 'left', 'Serif');
      [old, next, ratios[i]].forEach((v, j) =>
        d.mono(
          ready ? fmt(v) : '·',
          [904, 1251, 1610][j],
          y,
          50,
          j === 2 ? color : C.cream,
          'center',
        ),
      );
    });
    const solved = cue(k, 6, 'one point nine two') > 0;
    d.mono(
      b >= 5 ? 'W = 1.60 × 1.20 = ' + (solved ? fmt(pathWeight) : '?') : '',
      960,
      835,
      48,
      C.brass,
      'center',
    );
    d.note('Same initial-state distribution and environment for both policies.', 960, 940, C.faint);
    if (b === 7)
      d.note('Weight the first reward by 1.60. Only the second reward needs both ratios.', 960, 1008);
    return;
  }
  const rare = cue(k, 8, 'tiny positive probability') > 0,
    confounded = b === 10;
  if (confounded) {
    d.title(
      'OFF-POLICY EVALUATION   /   WHAT THE LOGGER MISSED',
      'What did the reviewer know when choosing the route?',
    );
    d.ticket(122, 378, 462, 233, {
      id: 'Private warning?',
      label: 'VISIBLE TO REVIEWER',
      foot: 'Missing from the log',
    });
    d.tube([
      [587, 495],
      [821, 495],
      [952, 399],
      [1390, 399],
    ]);
    d.tube([
      [821, 495],
      [952, 648],
      [1390, 648],
    ]);
    d.pill(1277, 356, 471, 86, 'Route selected', C.blue);
    d.pill(1277, 605, 471, 86, 'Request outcome', C.green);
    d.note(
      'If the warning affects both, splitting the log by date cannot recover the missing information.',
      960,
      892,
      C.brass,
      34,
    );
    return;
  }
  d.title(
    'OFF-POLICY EVALUATION   /   COVERAGE',
    confounded
      ? 'What did the reviewer know at decision time?'
      : 'Which actions left an outcome in this file?',
  );
  d.plate(115, 315, 785, 454);
  d.plate(1009, 315, 785, 454);
  d.txt('Human review', 177, 394, 51, C.blue, 'left', 'Serif');
  d.txt('Ask for proof', 1072, 394, 51, C.green, 'left', 'Serif');
  d.window(179, 471, 655, 104, '50,000 outcomes', C.blue);
  d.window(1070, 471, 655, 104, '0 outcomes', C.green);
  d.txt(
    confounded ? 'Private warning influenced routing' : 'Logged review decisions',
    178,
    659,
    36,
    C.faint,
  );
  d.txt(rare ? 'Logger probability > 0' : 'Logger probability = 0', 1070, 659, 36, C.faint);
  d.note(
    confounded
      ? 'Unrecorded information may affect both action and outcome. A date split cannot recover it.'
      : rare
        ? 'Possible under the logger, yet there are no outcomes for this action in the file.'
        : 'Structural zero   ·   importance sampling has no support for an asking policy.',
    960,
    917,
    C.brass,
    34,
  );
}
