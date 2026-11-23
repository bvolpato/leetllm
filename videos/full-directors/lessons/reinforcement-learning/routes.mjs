import { C, cue, fmt, full, sign, lerp } from './workshop.mjs';
import {
  routes,
  net,
  back,
  gamma,
  returns,
  receipt,
  mdpBefore,
  mdpEvent,
  sweeps,
  openingActions,
  risk,
  abandoned,
  indifferenceProbability,
} from './exchange.mjs';

function outlet(d, x, y, reviewer) {
  if (reviewer) {
    d.rect(x - 36, y - 39, 66, 82, C.paper, 5, C.metal, 3);
    for (const yy of [-21, -7, 7]) d.line(x - 23, y + yy, x + 12, y + yy, '#9f9378', 3);
    d.line(x + 22, y + 16, x + 48, y + 42, C.dark, 14);
    d.line(x + 22, y + 16, x + 48, y + 42, C.copper, 7);
    d.dot(x + 8, y + 2, 23, C.blue, C.ink, 5);
    d.line(x - 2, y + 2, x + 14, y - 9, C.cream, 3);
  } else {
    d.rect(x - 57, y - 35, 114, 70, C.paper, 8, C.metal, 3);
    d.path(
      [
        [x - 53, y - 30],
        [x, y + 6],
        [x + 53, y - 30],
      ],
      '#8e8167',
      4,
    );
    d.dot(x, y + 6, 13, '#2b7360', C.green, 2);
    d.tick(x, y + 6, C.paper, 6);
  }
}

function dispatchChoice(d, k) {
  const simulator = k.reveal('In the simulator', 0);
  d.title(
    'REQ-10234   /   ACCESS DISPATCH',
    simulator ? 'Approve this ticket without proof?' : 'Compare the returns at nine o’clock',
  );
  const rows = [414, 698];
  const branches = rows.map((y) => [
    [432, 556],
    [552, 556],
    [644, y],
    [784, y],
  ]);
  const realDesk = simulator && k.reveal('P seven blocks', 0);
  const choice = k.reveal('Ask for evidence', 1);
  for (const [i, points] of branches.entries()) {
    if (simulator && i === 1 && !realDesk) continue;
    const y = rows[i];
    d.tube(points);
    if (!simulator && i === 0 && choice > 0) {
      d.c.save();
      d.c.beginPath();
      d.c.rect(432, y - 12, (784 - 432) * choice, 556 - y + 24);
      d.c.clip();
      d.path(points, C.green, 13);
      d.c.restore();
    }
    d.plate(784, y - 102, 976, 204);
    if (!simulator) {
      d.txt(routes[i].name, 844, y - 24, 62, C.cream, 'left', 'Serif');
      d.txt('Return at the desk', 844, y + 44, 36, C.faint);
      d.mono(fmt(net(routes[i])), 1676, y, 124, i === 0 ? C.green : C.blue, 'right');
    } else if (i === 0) {
      d.txt('Simulator return', 844, y - 23, 60, C.cream, 'left', 'Serif');
      if (k.reveal('and earns', 0)) d.txt('Closed without proof', 844, y + 45, 41, C.faint);
      if (k.reveal('minus one hundred twenty', 0) && k.elapsed >= k.pictureData.approvalPenaltyEnd)
        d.mono(fmt(returns.approve), 1676, y, 115, C.red, 'right');
    } else {
      d.txt('Real desk', 844, y - 23, 60, C.cream, 'left', 'Serif');
      d.txt('P-7 authorization check', 844, y + 45, 41, C.faint);
      if (k.reveal('that action', 0)) d.txt('Blocked', 1676, y, 78, C.brass, 'right', 'Serif');
    }
  }
  d.ticket(73, 442, 350, 228);
  d.socket(432, 556, C.copper, 25);
  d.dot(552, 556, 15, C.brass, C.ink, 4);
}

function routeBoard(d, k, opening) {
  const b = k.beat.beatIndex + 1;
  d.title(
    'REQ-10234   /   ACCESS DISPATCH',
    opening ? 'One request, two departures' : 'Bring each reward back to nine o’clock',
  );
  const rows = [414, 698];
  const branchX = 552,
    sourceY = 556;
  rows.forEach((y) =>
    d.tube([
      [400, sourceY],
      [branchX, sourceY],
      [branchX + 92, y],
      [1750, y],
    ]),
  );
  d.ticket(73, sourceY - 114, 350, 228);
  d.socket(432, sourceY, C.copper, 25);
  d.dot(branchX, sourceY, 15, C.brass, C.ink, 4);
  d.txt('Fee at departure', 768, 265, 32, C.faint, 'center');
  d.txt('One step later', 1570, 265, 32, C.faint, 'center');
  routes.forEach((r, i) => {
    const y = rows[i],
      color = i === 0 ? C.green : C.blue;
    const costShown = !opening || cue(k, 2, i ? 'costs eighteen' : 'costs four') > 0;
    const laterShown = !opening || cue(k, 2, i ? 'earns eighty' : 'earns seventy') > 0;
    const bringing = opening ? 0 : cue(k, i + 1, i ? 'Do the same' : 'Bring the seventy', 1.7);
    const total = !opening && cue(k, i + 1, i ? 'fifty-four' : 'fifty-nine') > 0;
    d.txt(r.name, 829, y - 72, 48, color, 'center', 'Serif');
    d.txt(r.finish, 1570, y - 72, 44, color, 'center', 'Serif');
    d.socket(760, y, color, 24);
    d.socket(1570, y, color, 24);
    outlet(d, 1766, y, i === 1);
    if (costShown) d.mono(sign(r.cost), 760, y + 65, 49, C.cream, 'center');
    if (laterShown) d.mono(sign(r.reward), 1570, y + 65, 49, C.cream, 'center');
    if (bringing > 0) {
      d.carrier(lerp(1517, 811, bringing), y, color);
      if (bringing >= 1) {
        d.mono('× 0.90', 1185, y - 43, 29, C.faint, 'center');
        d.window(
          880,
          y + 26,
          415,
          70,
          fmt(r.cost) + ' + ' + fmt(gamma * r.reward) + (total ? ' = ' + fmt(net(r)) : ' = ?'),
          color,
        );
      }
    } else if (opening && b === 2) {
      const p = cue(k, 2, i ? 'Sending the ticket' : 'asking costs', 1.45);
      if (p > 0) d.carrier(lerp(800, 1520, p), y, color);
    }
  });
  if (opening)
    d.note(
      b === 3
        ? 'One step later × 0.90. Which departure earns the larger return?'
        : 'Simulator assumption  ·  every requester supplies valid proof',
    );
  else d.note('Synthetic reward points   ·   one operational step discounts a reward by 0.90');
}
export function departures(d, k) {
  routeBoard(d, k, true);
}
export function episode(d, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) return routeBoard(d, k, false);
  if (b === 3) return dispatchChoice(d, k);
  d.title(
    'EPISODE   /   REWARD TIMING',
    b === 5 ? 'A question changes the next observation' : 'Count a reward from where you stand',
  );
  if (b === 5) {
    d.ticket(115, 362, 346, 240);
    const asked = cue(k, 5, 'Sending a question', 1.2);
    d.tube([
      [463, 481],
      [1460, 481],
    ]);
    d.carrier(lerp(485, 1420, asked), 481, C.green);
    d.txt('Request evidence', 960, 401, 53, C.green, 'center', 'Serif');
    if (asked === 1)
      d.ticket(1400, 362, 370, 240, { label: 'VERIFIER RECEIPT', id: 'E17', verified: true });
    d.note('The action determines which evidence can arrive.');
    return;
  }
  const x = [360, 960, 1560];
  d.txt('Discount for a reward at each step', 960, 314, 40, C.cream, 'center', 'Serif');
  d.tube([
    [x[0], 508],
    [x[2], 508],
  ]);
  ['After first action', 'One step later', 'Two steps later'].forEach((name, i) => {
    d.socket(x[i], 508, [C.brass, C.green, C.blue][i], 35);
    d.txt(name, x[i], 414, 34, C.faint, 'center');
    d.window(x[i] - 128, 584, 256, 88, '× ' + fmt(gamma ** i), C.cream);
  });
  if (b === 4) d.note('Return = R₁ + 0.90 R₂ + 0.81 R₃ + …', 960, 849, C.brass, 43);
  if (b === 6) {
    d.note(
      'Continuing task with bounded rewards   ·   |G| ≤ Rmax / (1 − γ)',
      960,
      822,
      C.brass,
      39,
    );
    d.note('Finite episodes can also use γ = 1.', 960, 902, C.faint);
  }
  if (b === 7) {
    d.note('The same step discount applies to a one-minute wait and a one-hour wait.', 960, 813);
    d.note('Model the chance and cost of abandonment separately.', 960, 893, C.brass);
  }
}
export function stateMemory(d, k) {
  const b = k.beat.beatIndex + 1;
  d.title(
    'REQ-10234   /   STATE MEMORY',
    b < 4
      ? 'Which fields change the next decision?'
      : b < 6
        ? 'Read a transition from its receipt'
        : 'Two “new” tickets can have different futures',
  );
  const latched = cue(k, 4, 'It records verified proof', 0.7);
  if (b <= 3 || b >= 6) {
    const waitCompare = b >= 6,
      second = waitCompare || cue(k, 1, 'after verification') > 0;
    const wait = b >= 2;
    for (const i of [0, 1]) {
      const x = 224 + i * 804;
      const present = !!i && !waitCompare;
      d.ticket(x, 335, 658, 260, {
        id: waitCompare ? 'New request' : 'REQ-10234',
        verified: present,
      });
      const result = waitCompare
        ? i
          ? '65 s elapsed'
          : '45 s elapsed'
        : present
          ? 'Approval permitted'
          : 'P-7 blocks approval';
      if (!i || second) {
        d.pill(x + 40, 639, 578, 78, result, present ? C.green : waitCompare ? C.blue : C.red);
      }
      if (!waitCompare && wait && !i)
        d.mono(
          'Elapsed wait  ' + mdpBefore.elapsedWait + ' s',
          x + 329,
          768,
          32,
          C.faint,
          'center',
        );
    }
    const words =
      b === 1
        ? 'Apply the same approval proposal to both evidence states.'
        : b === 2
          ? 'Would an earlier fact change the next outcome?'
          : b === 3
            ? 'Markov state  ·  current state and action determine the next-outcome distribution.'
            : b === 6
              ? 'If wait changes the odds, keep elapsed time or a sufficient history.'
              : 'Partial observation  ·  track a belief over the possible states.';
    d.note(words, 960, 907, C.brass, 34);
    return;
  }
  const out = cue(k, 4, 'It asks for proof', 1.15);
  const incoming = cue(k, 4, 'Follow receipt', 1.3);
  const recorded = incoming === 1 && latched > 0;
  d.ticket(
    110,
    363,
    404,
    251,
    recorded
      ? {
          id: 'Evidence ready',
          label: 'UPDATED STATE',
          verified: true,
          foot: receipt.elapsedWait + ' s  ·  verified',
        }
      : { id: 'New request', foot: mdpBefore.elapsedWait + ' s  ·  proof missing' },
  );
  d.tube([
    [517, 490],
    [1401, 490],
  ]);
  d.txt(
    incoming > 0 ? 'Receipt E17 returns' : 'Ask for proof',
    958,
    375,
    50,
    incoming > 0 ? C.brass : C.green,
    'center',
    'Serif',
  );
  d.carrier(
    incoming > 0 ? lerp(1350, 558, incoming) : lerp(558, 1350, out),
    490,
    incoming > 0 ? C.brass : C.green,
  );
  d.ticket(1400, 363, 410, 251, {
    id: 'Verifier',
    label: 'ENVIRONMENT',
    foot: out === 1 ? 'Proof checked' : 'Awaiting request',
    verified: out === 1,
  });
  d.mono('Agent', 312, 688, 32, C.blue, 'center');
  d.mono('Requester + verifier', 1605, 688, 32, C.blue, 'center');
  if (latched > 0)
    d.note(
      'Immediate reward   ' +
        fmt(receipt.reward) +
        '       •       elapsed time   +' +
        mdpEvent.elapsed +
        ' s',
      960,
      794,
      C.green,
      38,
    );
  if (b === 5)
    d.note(
      'MDP    states  ·  actions  ·  transition probabilities  ·  rewards  ·  discount',
      960,
      928,
      C.cream,
      35,
    );
}
function comparison(d, title, choices, selected, footer) {
  d.txt(title, 130, 290, 40, C.faint);
  choices.forEach(([label, formula, result], i) => {
    const y = 392 + i * 144,
      chosen = i === selected;
    d.rect(
      129,
      y - 41,
      1658,
      102,
      chosen ? '#294e4c' : C.dark,
      14,
      chosen ? C.green : C.hair,
      chosen ? 4 : 2,
    );
    d.socket(190, y + 9, chosen ? C.green : C.off, 23);
    d.txt(label, 247, y + 8, 42, chosen ? C.green : C.cream, 'left', 'Serif');
    d.mono(formula, 880, y + 10, 35, C.faint, 'left', 560);
    d.mono(result, 1699, y + 8, 53, chosen ? C.green : C.cream, 'right');
  });
  d.note(footer, 960, 900, C.brass);
}
export function bellman(d, k) {
  const b = k.beat.beatIndex + 1;
  d.title(
    'PLANNING   /   BELLMAN BACKUP',
    b === 7
      ? 'The closing reward is paid on arrival'
      : b >= 4
        ? 'What is verified evidence worth?'
        : 'Choose a continuation, then value the departure',
  );
  if (b === 7) {
    d.tube([
      [325, 533],
      [1570, 533],
    ]);
    d.socket(325, 533, C.green, 32);
    d.socket(1570, 533, C.blue, 32);
    d.txt('Verified', 325, 414, 54, C.green, 'center', 'Serif');
    d.txt('Closed', 1570, 414, 54, C.blue, 'center', 'Serif');
    d.carrier(lerp(382, 1505, cue(k, 7, 'reward for closing', 1.4)), 533, C.green);
    d.mono('Approve  ' + sign(routes[0].reward), 960, 451, 43, C.cream, 'center');
    d.window(1360, 630, 420, 95, 'V(closed) = 0', C.blue);
    return;
  }
  if (b <= 3) {
    const ask = b === 3 || (b === 2 && cue(k, 2, 'instead ask first') > 0);
    const choose = b === 1 ? 2 : b === 2 ? (ask ? 1 : 2) : cue(k, 3, 'largest return') > 0 ? 1 : -1;
    const q = openingActions(sweeps[2]);
    comparison(
      d,
      b === 1
        ? 'Policy π sends new requests to review'
        : b === 2
          ? 'Q fixes the first move'
          : 'New request   ·   best available continuations',
      [
        ['Approve now', '−120 + 0.90 × 0', b === 3 ? fmt(q.approve) : ''],
        ['Ask for proof', '−4 + 0.90 × 70', ask ? fmt(q.evidence) : ''],
        ['Human review', '−18 + 0.90 × 80', fmt(q.review)],
      ],
      choose,
      b === 1
        ? 'Vπ(new) = 54 under this routing rule'
        : b === 2
          ? 'Take the specified action, then follow the policy.'
          : 'Choose the largest discounted return at the new request.',
    );
    return;
  }
  const calculated = cue(k, 4, 'worth sixty-two') > 0;
  d.ticket(104, 411, 397, 228, { id: 'Evidence ready', verified: true });
  for (const y of [417, 692])
    d.tube([
      [502, 525],
      [634, 525],
      [744, y],
      [1666, y],
    ]);
  d.txt('Approve now', 974, 334, 47, C.green, 'center', 'Serif');
  d.window(820, 370, 308, 92, sign(routes[0].reward), C.green);
  d.txt('Closed', 1542, 339, 39, C.faint, 'center', 'Serif');
  d.window(1445, 379, 194, 76, 'V = 0', C.faint);
  d.txt('Ask a reviewer', 987, 609, 45, C.blue, 'center', 'Serif');
  d.txt('Review queue', 1542, 609, 42, C.blue, 'center', 'Serif');
  d.window(1431, 650, 220, 84, 'V = 80', C.blue);
  const returned = cue(k, 4, 'Discount the eighty', 1.5);
  d.window(
    783,
    650,
    409,
    84,
    returned === 1 ? '−10 + 72' + (calculated ? ' = 62' : '') : '−10',
    C.cream,
  );
  if (returned > 0 && returned < 1) d.carrier(lerp(1390, 1234, returned), 692, C.blue);
  if (calculated) d.mono('V*(verified) = max(70, 62) = 70', 960, 819, 45, C.green, 'center');
  d.note(
    b === 6
      ? 'Fixed policy: average using π.   Optimal backup: average outcomes for each action, then choose the best.'
      : 'Both branches begin with verified proof.',
    960,
    937,
    C.faint,
  );
}
export function iterations(d, k) {
  const b = k.beat.beatIndex + 1;
  d.title(
    'MODEL-BASED PLANNING',
    b < 5
      ? 'Let the next column travel one step back'
      : 'Evaluate the rule before moving its switch',
  );
  if (b >= 5) {
    const improve = cue(k, 6, 'switch the opening action') > 0;
    comparison(
      d,
      'Policy iteration   ·   verified and queued tickets retain their rules',
      [
        [
          'New request',
          improve ? 'Ask → verified approval' : 'Review → reviewer approves',
          fmt(improve ? returns.evidence : returns.review),
        ],
        ['Verified', 'Approve → closed', '70'],
        ['Review queue', 'Approve → closed', '80'],
      ],
      0,
      improve
        ? 'Greedy improvement changes the opening action.'
        : 'Evaluate the current rule with its opening switch fixed on review.',
    );
    return;
  }
  const n =
    b === 1
      ? cue(k, 1, 'first sweep') > 0
        ? 1
        : 0
      : b === 2
        ? cue(k, 2, 'On the second sweep') > 0
          ? 2
          : 1
        : 3;
  const xs = [690, 986, 1282, 1578],
    ys = [469, 591, 713];
  d.plate(113, 288, 1688, 521);
  ['New request', 'Evidence ready', 'Review queue'].forEach((s, j) =>
    d.txt(s, 175, ys[j], 42, C.cream, 'left', 'Serif'),
  );
  xs.forEach((x, i) => {
    const v = sweeps[i],
      active = i === n;
    d.mono(i ? 'Sweep ' + i : 'Initial', x, 357, 30, active ? C.brass : C.faint, 'center');
    [v.new_request, v.evidence_ready, v.review_queue].forEach((a, j) =>
      d.window(x - 99, ys[j] - 41, 198, 82, i <= n ? fmt(a) : '·', active ? C.green : C.faint),
    );
  });
  const previous = sweeps[Math.max(0, n - 1)],
    q = openingActions(previous);
  if (n > 0)
    d.mono(
      'Ask: −4 + 0.90 × ' +
        fmt(previous.evidence_ready) +
        ' = ' +
        fmt(q.evidence) +
        '       Review: −18 + 0.90 × ' +
        fmt(previous.review_queue) +
        ' = ' +
        fmt(q.review),
      960,
      855,
      32,
      C.cream,
      'center',
    );
  d.note(
    b === 4
      ? 'Largest error after a sweep ≤ 0.90 × previous largest error.   Optimal actions may tie.'
      : n === 0
        ? 'Each state starts at zero.'
        : n === 1
          ? 'Read the old zeros    →    choose the best immediate reward in each row.'
          : 'At the new request    max(' +
            fmt(q.approve) +
            ', ' +
            fmt(q.evidence) +
            ', ' +
            fmt(q.review) +
            ') = ' +
            fmt(sweeps[n].new_request),
    960,
    925,
    C.brass,
  );
}

export function switchLever(d, x, y, selected) {
  const ask = selected === 'Ask',
    review = selected === 'Review',
    color = ask ? C.green : review ? C.blue : C.brass;
  d.txt('Ask', x - 100, y - 76, 30, ask ? C.green : C.faint, 'center');
  d.txt('Review', x + 100, y - 76, 30, review ? C.blue : C.faint, 'center');
  d.path(
    [
      [x - 97, y - 23],
      [x, y + 42],
      [x + 97, y - 23],
    ],
    C.rim,
    11,
  );
  const end = x + (ask ? -94 : review ? 94 : 0);
  d.line(x, y + 42, end, y - 20, C.dark, 24);
  d.line(x, y + 40, end, y - 21, C.copper, 15);
  d.dot(x, y + 40, 17, C.brass, C.ink, 4);
  d.dot(end, y - 21, 22, color, C.ink, 4);
}
export function rack(d, k, final = false) {
  const b = k.beat.beatIndex + 1;
  let lost,
    showMean,
    selected,
    flip = 0;
  if (final) {
    flip = cue(k, 2, 'now leaves', 0.85);
    const flipped = flip >= 0.5;
    lost = flipped ? 5 : 4;
    showMean = !flipped || cue(k, 3, 'fifty-three point three five') > 0;
  } else {
    const add = cue(k, 2, 'one in four', 1.6),
      rewind = cue(k, 5, 'lower the abandonment chance', 2.4);
    lost = Math.round(25 * add * (1 - rewind));
    if (b === 7) lost = 10;
    showMean = lost === 0 || cue(k, 4, 'averages thirty point seven five') > 0;
  }
  const r = risk(lost);
  selected = showMean ? r.switchTo : null;
  d.title(
    'OUTCOME RACK   /   100 EQUAL SHARES',
    final ? 'One more requester leaves' : 'What changes when a requester walks away?',
  );
  d.plate(100, 272, 811, 598);
  d.txt('If we ask for proof', 153, 328, 44, C.cream, 'left', 'Serif');
  d.mono('1 socket = 1%', 861, 327, 25, C.faint, 'right');
  for (let j = 0; j < 100; j++) {
    const x = 165 + (j % 10) * 76,
      y = 399 + Math.floor(j / 10) * 47;
    const left = j >= r.replies;
    const hot = final && j === 95 && flip > 0;
    d.c.save();
    if (hot) {
      d.c.translate(x, y);
      d.c.scale(1, Math.max(0.09, Math.abs(Math.cos(Math.PI * flip))));
      d.c.translate(-x, -y);
    }
    d.rect(
      x - 27,
      y - 16,
      54,
      32,
      left ? '#b36c58' : '#60998c',
      6,
      hot ? C.brass : left ? C.red : C.green,
      hot ? 5 : 1,
    );
    if (left) {
      d.line(x - 7, y - 7, x + 7, y + 7, C.dark, 3);
      d.line(x - 7, y + 7, x + 7, y - 7, C.dark, 3);
    } else d.tick(x, y, C.dark, 8);
    d.c.restore();
  }
  d.txt(r.replies + ' replies  ×  ' + sign(net(routes[0])), 997, 328, 42, C.green);
  const hasAbandon = final || cue(k, 2, 'costs fifty') > 0;
  d.txt(lost + ' abandonments' + (hasAbandon ? '  ×  ' + fmt(abandoned) : ''), 997, 402, 42, C.red);
  d.line(998, 464, 1786, 464, C.hair, 2);
  d.txt('Mean if we ask', 1001, 536, 39, C.cream, 'left', 'Serif');
  d.window(1440, 491, 340, 89, showMean ? fmt(r.mean) : '?', C.green);
  d.txt('Direct review', 1001, 647, 39, C.cream, 'left', 'Serif');
  d.window(1440, 602, 340, 89, fmt(r.review), C.blue);
  if (final) switchLever(d, 1412, 803, selected);
  else {
    const position = d.ruler(1034, 818, 705, 25, 60, [25, 35, 45, 55, 60]);
    d.line(position(r.review), 807, position(r.review), 862, C.blue, 4);
    d.mono('Review ' + fmt(r.review), position(r.review), 890, 25, C.blue, 'center');
    if (showMean) {
      d.dot(position(r.mean), 818, 12, C.green, C.dark, 3);
      d.line(position(r.mean), 802, position(r.mean), 773, C.green, 3);
      d.mono('Ask ' + fmt(r.mean), position(r.mean), 745, 26, C.green, 'center');
    }
  }
  const note = final
    ? showMean && lost === 5
      ? 'One changed outcome costs (59 + 54) / 100 = 1.13 in the mean.'
      : lost === 4
        ? '(96 × 59 + 4 × (−54)) / 100 = 54.48'
        : 'Which tube earns more with five abandonments?'
    : b === 2 && hasAbandon
      ? 'Abandoned route    −4 dispatch fee  −  50 unresolved  =  −54'
      : b === 3
        ? 'Choose a route before the requester replies.'
        : b === 4 && showMean
          ? '0.75 × 59 + 0.25 × (−54) = 30.75   ·   one request earns one branch return.'
          : b === 5
            ? 'Each restored reply adds 1.13 to the mean.'
            : b >= 6
              ? 'Equal returns at p = 5/113 ≈ ' +
                full(indifferenceProbability * 100) +
                '%   •   ask earns 59 − 113p.'
              : 'Each socket represents probability mass in the model.';
  d.note(note, 960, 953, C.brass, 34);
}
