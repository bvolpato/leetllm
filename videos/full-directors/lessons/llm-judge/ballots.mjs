import {
  C,
  box,
  line,
  dot,
  txt,
  cap,
  wrap,
  sheet,
  rule,
  heading,
  cue,
  beat,
  clip,
  smooth,
  arrow,
  label,
  checkMark,
} from './studio.mjs';
import {
  candidates,
  stableSwap,
  conflictingSwap,
  aggregateSwaps,
  receipt,
  identity,
  judgeRun,
  votes,
  countMatches,
  restoreVotes,
  restoreTie,
  restoreReplies,
} from './specimens.mjs';

const glyphs = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
};
function punch(g, x, y, letter, color) {
  glyphs[letter].forEach((bits, i) =>
    [...bits].forEach((v, j) => {
      if (v === '1') dot(g, x + j * 11, y + i * 11, 4.2, color);
    }),
  );
}
const replyStyle = {
  compact: { name: 'Compact', paper: C.milk },
  stepwise: { name: 'Stepwise', paper: C.gold },
};
export function swapFrame(k) {
  const b = beat(k);
  const swap = smooth(cue(k, 1, 'slide the two replies', 1.6));
  const alternate = cue(k, 4, 'Replay just the second receipt');
  const pair = alternate ? conflictingSwap : stableSwap;
  const first = cue(k, 1, 'first receipt says B');
  const second = alternate ? cue(k, 4, 'this time it says B') : cue(k, 2, 'receipt says A');
  return {
    swap,
    first,
    second,
    pair,
    alternate,
    traceFirst: cue(k, 1, 'under stepwise'),
    traceSecond: alternate ? cue(k, 5, 'names compact') : cue(k, 3, 'Both pick stepwise'),
    result: alternate ? cue(k, 5, 'unresolved') : cue(k, 3, 'one preference'),
  };
}
export function swap(g, k) {
  const s = swapFrame(k);
  cap(g, 'DEP-27    /    SAME CLARITY RUBRIC', 111, 99, C.mint);
  txt(g, 'Which reply did that hole select?', 106, 194, 69, C.white, 'Serif');
  const slots = [
    { x: 206, die: 107 },
    { x: 1039, die: 1784 },
  ];
  const phase = s.swap;
  slots.forEach(({ x, die }, i) => {
    box(g, x - 8, 386, 704, 244, C.deep, 12);
    box(g, die - 16, 443, 92, 111, C.metal, 8);
    const letter = i ? 'B' : 'A';
    const active =
      (phase === 0 && s.first && s.pair[0].verdict === letter) ||
      (phase === 1 && s.second && s.pair[1].verdict === letter);
    punch(g, die + 6, 466, letter, active ? C.gold : C.gray);
  });
  for (const [i, id] of s.pair[0].order.entries()) {
    const from = slots[i].x,
      to = slots[1 - i].x;
    const traverse = smooth((phase - 0.2) / 0.6);
    const lift = smooth(Math.min(phase, 1 - phase) / 0.2);
    const x = from + (to - from) * traverse,
      y = 391 + (i ? 1 : -1) * 128 * lift;
    sheet(g, x, y, 688, 231, replyStyle[id].paper);
    cap(g, replyStyle[id].name.toUpperCase(), x + 55, y + 47, C.ink, 24);
    if (id === 'compact') wrap(g, candidates[id], x + 55, y + 103, 607, 34, C.ink, 44);
    else {
      txt(g, 'Payment-service has crossed its rollback', x + 55, y + 97, 31, C.ink, 'Serif');
      txt(g, 'threshold. Next:', x + 55, y + 131, 31, C.ink, 'Serif');
      txt(g, '1. Stop the rollout.', x + 55, y + 172, 31, C.ink, 'Serif');
      txt(g, '2. Run the DEP-27 rollback procedure.', x + 55, y + 209, 31, C.ink, 'Serif');
    }
  }
  function trail(n, x, known, trace) {
    const r = s.pair[n];
    cap(
      g,
      n === 0 ? 'FIRST RECEIPT' : s.alternate ? 'REPLAYED SECOND RECEIPT' : 'SECOND RECEIPT',
      x,
      781,
    );
    if (!known) {
      line(g, x, 837, x + 315, 837, C.line);
      return;
    }
    punch(g, x + 4, 806, r.verdict, C.gold);
    if (trace || (n === 1 && !s.alternate)) {
      arrow(g, x + 89, 841, x + 181, 841, C.gray);
      const reply = trace ? replyStyle[identity(r)].name : '?';
      txt(g, reply, x + 216, 862, 55, C.white, 'Serif');
    }
  }
  trail(0, 136, s.first, s.traceFirst);
  trail(1, 752, s.second, s.traceSecond);
  if (s.result)
    label(
      g,
      aggregateSwaps(...s.pair) === 'stepwise' ? '1 preference' : 'Unresolved',
      1416,
      807,
      s.alternate ? C.coral : C.mint,
    );
}
const rules = [
  [receipt('A'), receipt('tie', true)],
  [receipt('tie'), receipt('tie', true)],
  [receipt('B'), receipt('review', true)],
];
export function reconciliation(g, k) {
  const b = beat(k);
  heading(
    g,
    'Reconciliation  /  one case, one configuration',
    b < 3 ? 'Can these receipts be combined?' : 'Does the preferred reply follow the policy?',
  );
  if (b === 1) {
    stableSwap.forEach((r, i) => {
      sheet(g, 120 + 865 * i, 351, 795, 432, i ? C.gold : C.milk);
      cap(g, 'CALL ' + (i + 1), 184 + 865 * i, 429, C.ink);
      [r.caseId, r.config].forEach((s, j) =>
        txt(g, s, 184 + 865 * i, 502 + 63 * j, 37, C.ink, 'Mono'),
      );
      txt(g, 'A   ' + r.order[0], 184 + 865 * i, 658, 42, C.ink);
      txt(g, 'B   ' + r.order[1], 184 + 865 * i, 724, 42, C.ink);
    });
    cap(g, 'Reject a repeated order, different case or different configuration.', 125, 897);
  } else if (b === 2) {
    rules.forEach((pair, i) => {
      const y = 320 + i * 182;
      sheet(g, 135, y, 1590, 140, C.milk);
      txt(g, pair[0].verdict + '   +   ' + pair[1].verdict, 208, y + 93, 57, C.ink, 'Mono');
      const known = cue(k, 2, ['keep the case unresolved', 'stable tie', 'route it to review'][i]);
      if (known) {
        arrow(g, 848, y + 74, 985, y + 74, C.ink);
        txt(g, aggregateSwaps(...pair), 1070, y + 91, 55, C.ink, 'Serif');
      }
    });
  } else {
    sheet(g, 117, 341, 804, 414, C.gold);
    cap(g, 'PREFERRED IN BOTH ORDERS', 179, 427, C.ink);
    wrap(g, '“Commander approval is optional.”', 178, 543, 657, 57);
    sheet(g, 982, 398, 810, 410, C.milk);
    cap(g, 'TRUSTED POLICY', 1047, 480, C.ink);
    if (cue(k, 3, 'it’s required'))
      wrap(g, 'Commander approval is required before deployment.', 1047, 594, 660, 56);
    cap(g, 'Keep both receipts with the task and reconciliation rule.', 125, 923);
  }
}
function comparison(g, variant) {
  const paper = [C.milk, C.gold];
  ['Original', variant === 'steps' ? 'Numbered steps' : 'Padded copy'].forEach((name, i) => {
    const y = 313 + i * 245;
    sheet(g, 116, y, 1670, 201, paper[i]);
    cap(g, name.toUpperCase(), 175, y + 60, C.ink);
    if (i && variant === 'steps') {
      txt(g, '1. Stop the rollout.', 603, y + 79, 47, C.ink, 'Serif');
      txt(g, '2. Run the rollback.', 603, y + 149, 47, C.ink, 'Serif');
    } else {
      txt(g, 'Stop the rollout, then run the rollback.', 603, y + 87, 46, C.ink, 'Serif');
      if (i && variant === 'padding')
        txt(g, 'To repeat, stop, then roll back.', 603, y + 151, 42, '#795022', 'Serif');
    }
  });
}
export function blind(g, k) {
  const b = beat(k);
  if (b === 1) {
    const blind = cue(k, 1, 'Hide model brand names', 0.8);
    heading(g, 'Blinded comparison', 'Who can see the author?');
    ['A', 'B'].forEach((name, i) => {
      const x = 119 + i * 864;
      sheet(g, x, 332, 795, 365, i ? C.gold : C.milk);
      cap(g, 'SLOT ' + name, x + 66, 415, C.ink);
      txt(g, 'Writer ' + (i + 1), x + 66, 504, 54, C.ink, 'Serif');
      box(g, x + 53, 451, 330 * blind, 70, C.ink, 5);
      txt(
        g,
        i ? '1. Stop the rollout.' : 'Stop the rollout, then…',
        x + 66,
        627,
        41,
        C.ink,
        'Serif',
      );
    });
    cap(g, 'HOST RECORD   A → compact     B → stepwise', 126, 852, C.blue, 33);
  } else if (b === 2) {
    heading(g, 'Matched probe', 'Which words changed the advice?');
    comparison(g, 'padding');
  } else {
    heading(g, 'Evaluation permissions', 'What can this judge do with a reply?');
    sheet(g, 115, 345, 792, 417, C.milk);
    cap(g, 'UNTRUSTED CANDIDATE', 181, 430, C.ink);
    wrap(g, 'Text in the answer asks for a favorable verdict.', 181, 541, 645, 52);
    box(g, 1010, 300, 744, 536, C.deep, 24);
    cap(g, 'HOST-ENFORCED SCOPE', 1066, 391, C.mint);
    txt(g, judgeRun.tools.length + ' action tools', 1066, 514, 61, C.white, 'Serif');
    txt(g, judgeRun.secrets.length + ' secrets', 1066, 618, 61, C.white, 'Serif');
    line(g, 1067, 675, 1684, 675);
    txt(g, 'Output    verdict + evidence', 1066, 759, 37, C.blue);
  }
}
export function probes(g, k) {
  const b = beat(k);
  if (b === 1) {
    heading(g, 'Matched editing trial', 'Which edit helps an operator?');
    comparison(g, cue(k, 1, 'numbered checklist') ? 'steps' : 'padding');
    return;
  }
  if (b === 2) {
    heading(g, 'Length-Controlled AlpacaEval', 'Hold the length difference at zero');
    rule(g, 'PREFERENCE MODEL', 146, 369, 1580);
    const y = 596,
      xx = 953;
    line(g, 255, y, 1650, y, C.pulp, 5);
    for (let i = -3; i <= 3; i++) {
      line(g, xx + i * 206, y - 16, xx + i * 206, y + 16, C.gray, 4);
    }
    txt(g, 'shorter', 235, 702, 41, C.dim);
    txt(g, 'longer', 1516, 702, 41, C.dim);
    txt(g, '0', xx, 704, 57, C.white, 'Mono', 'center');
    if (cue(k, 2, 'Set the length difference to zero')) {
      dot(g, xx, y, 27, C.gold);
      txt(g, 'Equal-length estimate', xx, 490, 53, C.gold, 'Serif', 'center');
    }
    return;
  }
  if (b <= 4) {
    const hidden = cue(k, 3, 'hide the names');
    heading(
      g,
      'Identity probe',
      hidden ? 'Can writing style identify the author?' : 'Change the label on identical text',
    );
    sheet(g, 118, 348, 1678, 260, C.milk);
    cap(
      g,
      hidden ? 'ANONYMOUS' : cue(k, 3, 'from A to B') ? 'AUTHOR B' : 'AUTHOR A',
      185,
      429,
      C.ink,
      31,
    );
    txt(g, 'Stop the rollout, then run the rollback.', 183, 535, 62, C.ink, 'Serif');
    if (hidden) {
      for (let i = 0; i < 3; i++) {
        const x = 365 + i * 574;
        arrow(g, x, 645, x, 733, C.gray);
        txt(g, 'Judge family ' + (i + 1), x, 821, 43, C.gold, 'Serif', 'center');
      }
      cap(g, 'Same anonymous replies  /  both orders  /  human-matched quality', 149, 928);
    }
    return;
  }
  heading(g, 'Panel audit', 'Three votes on one policy claim');
  cap(g, 'CLAIM     Commander approval is optional.', 120, 310, C.white, 37);
  const voted = cue(k, 5, 'Three judges mark it supported');
  for (let i = 0; i < 3; i++) {
    const x = 119 + 566 * i;
    sheet(g, x, 384, 520, 203, C.gold);
    cap(g, 'JUDGE 0' + (i + 1), x + 60, 447, C.ink);
    txt(g, voted ? 'supported' : '…', x + 60, 534, 52, C.ink, 'Serif');
  }
  if (cue(k, 5, 'It says approval is required')) {
    sheet(g, 119, 660, 1652, 196, C.milk);
    cap(g, 'POLICY    /    BEFORE DEPLOYMENT', 180, 724, C.ink);
    txt(g, 'Commander approval is required.', 179, 811, 55, C.ink, 'Serif');
    if (b >= 6) cap(g, 'Panel 3 / 3 supported      Human key: contradicted', 131, 937, C.coral, 31);
  }
}
export function humanReview(g, k) {
  const b = beat(k),
    opened = cue(k, 1, 'Open them side by side', 0.9);
  heading(g, 'Blind human review', 'Find the pair worth reopening');
  [0, 1].forEach((i) => {
    const x = 130 + i * 861;
    sheet(g, x, 310, 796, 517, i ? C.pulp : C.milk);
    cap(g, 'ENGINEER 0' + (i + 1), x + 65, 390, C.ink);
    votes.forEach((pair, j) => {
      const y = 487 + 117 * j;
      line(g, x + 62, y - 47, x + 731, y - 47, '#00000040');
      cap(g, '0' + (j + 1), x + 66, y + 15, C.ink);
      txt(g, pair[i], x + 203, y + 21, 55, C.ink, 'Serif');
      if (opened < 1) box(g, x + 183 + 460 * opened, y - 30, 460 * (1 - opened), 64, C.metal, 3);
      if (b >= 2 && j === 1) line(g, x + 190, y + 37, x + 485, y + 37, '#a54231', 6);
    });
  });
  if (b === 2 && cue(k, 2, 'two agreements out of three'))
    label(
      g,
      countMatches(
        votes.map((p) => p[0]),
        votes.map((p) => p[1]),
      ) + ' / 3 before discussion',
      130,
      882,
      C.mint,
    );
  if (b >= 3)
    txt(g, '02    Scan the steps or find the first action?', 134, 933, 47, C.gold, 'Serif');
}
export function restoreBallots(g, k, practice) {
  const alt = !practice && cue(k, 1, 'instead says tie');
  const pair = [restoreVotes[0], alt ? restoreTie : restoreVotes[1]];
  const votesIn = !practice || cue(k, 8, 'receipts say A');
  const tracing = !practice && cue(k, 1, 'Follow each letter');
  heading(g, 'Restore 41  /  clarity only', 'Follow each vote to its reply');
  pair.forEach((r, i) => {
    const x = 113 + i * 870;
    const chosen = tracing ? identity(r) : null;
    cap(g, i ? (alt ? 'REVERSED CALL · REPLAY' : 'REVERSED CALL') : 'FIRST CALL', x, 311);
    r.order.forEach((id, j) => {
      const y = 355 + j * 163;
      sheet(g, x, y, 809, 138, id === chosen ? C.gold : C.milk);
      punch(g, x + 55, y + 35, j ? 'B' : 'A', C.ink);
      cap(g, id, x + 151, y + 55, C.ink);
      txt(g, restoreReplies[id], x + 151, y + 107, 38, C.ink, 'Serif');
    });
    txt(g, 'Receipt', x, 769, 39, C.dim);
    txt(g, votesIn ? r.verdict : '?', x + 200, 779, 64, C.white, 'Mono');
    if (chosen && chosen !== 'tie')
      txt(g, '→ ' + chosen, x + 303, 779, 52, C.gold, 'Mono');
  });
  if (
    !practice &&
    (alt ? cue(k, 1, 'leaves the case unresolved') : cue(k, 1, 'Both identify alpha'))
  )
    label(
      g,
      alt ? 'Replay    ' + aggregateSwaps(...pair) : 'Clarity pick    ' + aggregateSwaps(...pair),
      115,
      819,
      alt ? C.coral : C.gold,
    );
}
