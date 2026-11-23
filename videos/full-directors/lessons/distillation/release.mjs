import {
  C,
  paper,
  heading,
  text,
  serif,
  num,
  rect,
  line,
  dot,
  beat,
  at,
  percent,
  signed,
  pathLine,
} from './studio.mjs';
import { vignette } from './engravings.mjs';
import {
  policySelection,
  slices,
  freshWords,
  freshBefore,
  freshAfter,
  freshLogits,
  freshTeacher,
  RELEASE_CANDIDATES,
  RELEASE_LIMITS,
  qualifies,
} from './examples.mjs';
import { keyCase, fit } from './impressions.mjs';

export function dataset(g, k) {
  paper(g);
  const b = beat(k);
  if (b <= 4) {
    const rows = policySelection();
    heading(g, 'Seed family   /   invented access policy', 'Which replies enter the training set?');
    const columns = [129, 717, 1128, 1516];
    ['Incoming prompt', 'Trusted rule', 'Teacher reply', 'Selection'].forEach((s, i) =>
      text(g, s, columns[i], 320, 33, C.muted),
    );
    const count = at(k, 1, 'The third is') ? 3 : at(k, 1, 'A second prompt') ? 2 : 1;
    rows.slice(0, count).forEach((row, i) => {
      const y = 453 + 153 * i;
      const show = at(k, 3, ['Keep the first', 'Skip the duplicate', 'Reject the admin'][i]);
      line(g, 127, y + 48, 1788, y + 48, C.edge, 2);
      text(g, row.raw.trim(), columns[0], y, 37);
      text(g, row.rule ?? rows[0].rule, columns[1], y, 37, C.blue);
      text(
        g,
        row.reply ?? (show ? 'No call' : '—'),
        columns[2],
        y,
        37,
        show && !row.reply ? C.muted : C.root,
      );
      if (show)
        text(
          g,
          { keep: 'Keep', skip: 'Skip', reject: 'Reject' }[row.outcome],
          columns[3],
          y,
          43,
          row.outcome === 'reject' ? C.pink : C.green,
        );
    });
    if (b === 4)
      text(
        g,
        rows.filter((row) => row.outcome === 'keep').length +
          ' verified target    /    ' +
          rows.filter((row) => row.reply).length +
          ' generated replies    /    ' +
          rows.length +
          ' inputs',
        128,
        924,
        42,
        C.green,
      );
    return;
  }
  const split = at(k, 5, 'Split whole seed families'),
    expanded = at(k, 5, 'two paraphrases');
  heading(g, 'Dataset construction', 'Split the seed before expanding it.');
  line(g, 1116, 290, 1116, 835, C.edge, 4);
  text(g, 'Training', 137, 358, 43, C.green);
  text(g, 'Final evaluation', 1224, 358, 43, C.blue);
  serif(g, 'Disabled key', 138, 540, 59);
  if (expanded) {
    for (let i = 0; i < 2; i++) {
      const y = 468 + i * 194;
      pathLine(
        g,
        [
          [470, 521],
          [532, 521],
          [595, y],
          [625, y],
        ],
        C.green,
        4,
      );
      text(g, ['Restore window?', 'How long to restore?'][i], 639, y + 12, 36);
    }
  }
  if (split) {
    serif(g, 'Unseen seed family', 1219, 537, 52);
    text(g, 'Labels held out', 1224, 640, 38, C.muted);
  }
  const notes = [
    'Generate within the training split. Verify each reply.',
    'Keep paraphrases with their seed, including long or unusual cases.',
    'Check licenses, access terms, permitted use and verifier errors.',
    'Evaluate each model on its own generated answers.',
  ];
  text(g, notes[Math.min(3, b - 5)], 132, 920, 40, C.green);
}
export function research(g, k) {
  paper(g);
  const b = beat(k);
  if (b <= 2) {
    heading(
      g,
      'Gemma 2   /   reported controlled comparison',
      'Same 2B student. Same 500B training tokens.',
    );
    text(g, 'Three-benchmark mean', 129, 345, 39, C.muted);
    const values = [60.3, 67.7],
      ys = [484, 696],
      x = 650,
      w = 1040;
    ['From scratch', '7B teacher probabilities'].forEach((s, i) => {
      text(g, s, 130, ys[i] + 17, 42);
      rect(g, x, ys[i] - 30, w, 50, C.edge);
      const show = i === 0 || at(k, 1, 'seven-billion-parameter teacher');
      if (show) {
        rect(g, x, ys[i] - 30, (w * values[i]) / 100, 50, i ? C.blue : C.green);
        num(
          g,
          values[i].toFixed(1),
          x + (w * values[i]) / 100 + 18,
          ys[i] + 13,
          44,
          i ? C.blue : C.green,
        );
      }
    });
    if (b === 2)
      text(
        g,
        'Ablation setup    ·    the released models used a different teacher configuration.',
        131,
        909,
        37,
        C.muted,
      );
    return;
  }
  if (b <= 4) {
    heading(g, 'DeepSeek-R1   /   January 2025 report', 'The teacher supplied selected responses.');
    text(g, 'Training examples', 126, 317, 36, C.muted);
    const x = 127,
      y = 371,
      w = 1637;
    rect(g, x, y, w * 0.75, 102, C.green);
    rect(g, x + w * 0.75, y, w * 0.25, 102, C.blue);
    text(g, '≈600,000 reasoning', x + 34, y + 65, 45, C.white);
    text(g, '≈200,000 general', x + w * 0.75 + 18, y + 65, 38, C.white);
    if (at(k, 3, 'Read the two results')) {
      text(g, 'Qwen 32B student', 125, 577, 35, C.muted);
      serif(g, '72.6%   AIME 2024 pass@1', 124, 697, 63);
      serif(g, '94.3%   MATH-500', 124, 804, 63);
      text(g, 'T = 0.6      top-p = 0.95      maximum 32,768 tokens', 125, 927, 36, C.green);
    }
    return;
  }
  heading(g, 'Compare the supervision', 'What crossed from teacher to student?');
  [
    ['Orca', 'Written explanation traces'],
    ['Phi-1.5', 'Synthetic textbook-like pretraining data'],
    ['Gemma 2', 'Token probabilities'],
  ].forEach(([name, s], i) => {
    const y = 377 + i * 146;
    text(g, name, 129, y, 45, C.blue);
    serif(g, s, 599, y, 51);
    line(g, 127, y + 38, 1770, y + 38, C.edge, 2);
  });
  text(
    g,
    b === 5
      ? 'GKD translation experiments favored generalized JS for some smaller students.'
      : 'GKD arithmetic comparison used forward KL. Match collection and decoding budgets.',
    130,
    887,
    36,
    C.green,
  );
}

export function scope(g, k) {
  if (beat(k) <= 2) {
    fit(g, k, true);
    return;
  }
  paper(g);
  heading(
    g,
    'Fresh deployment requests   /   matched evaluation',
    'Which comparison measures the transfer?',
  );
  const names = ['Starting checkpoint', 'Trusted-answer student', 'Distilled student', 'Teacher'];
  names.forEach((s, i) => {
    const x = 132 + (i % 2) * 862,
      y = 413 + Math.floor(i / 2) * 171;
    dot(g, x + 28, y - 18, 22, i === 2 ? C.green : C.gold);
    serif(g, s, x + 86, y, 55);
  });
  line(g, 132, 706, 1762, 706, C.edge, 3);
  text(g, 'Same requests and decoding budget', 135, 810, 43, C.blue);
  text(
    g,
    'Check behavior, latency and serving cost on the intended device.',
    135,
    913,
    38,
    C.muted,
  );
}
export function generalization(g, k) {
  paper(g);
  const b = beat(k),
    largest = at(k, 2, 'new subject has the widest gap');
  heading(
    g,
    'Assigned held-out accuracy   /   same requests',
    'Where does the student lose ground?',
  );
  const x = (rate) => 620 + (rate - 50) * 21.8;
  for (const tick of [50, 60, 70, 80, 90, 100]) {
    num(g, tick + '%', x(tick), 338, 32, C.muted, 'center');
    line(g, x(tick), 358, x(tick), 776, C.edge, 2);
  }
  slices.forEach(([name, p, q], i) => {
    const show = i === 0 || at(k, 1, i === 1 ? 'change the wording' : 'Try a new subject'),
      y = 420 + 151 * i;
    text(g, name, 125, y + 12, 40);
    if (!show) return;
    line(g, x(p), y, x(q), y, i === 2 && largest ? C.pink : C.gold, 8);
    dot(g, x(p), y, 13, C.green);
    line(g, x(q), y - 18, x(q), y + 18, C.blue, 7);
    num(g, p + '%', x(p) - 10, y + 55, 32, C.green, 'right');
    num(g, q + '%', x(q) + 9, y - 23, 32, C.blue);
    if (i === 2 && largest)
      text(g, q - p + ' percentage points', (x(p) + x(q)) / 2, y - 23, 33, C.pink, 'center');
  });
  text(g, '●  Student', 127, 862, 35, C.green);
  text(g, '│  Teacher', 384, 862, 35, C.blue);
  const notes = [
    'Which gap is largest?',
    'Inspect development cases from the weakest slice.',
    'Tune on development cases. Report uncertainty on fresh cases.',
    'Budget teacher data and training. Measure latency on the target device.',
  ];
  text(g, notes[b - 1], 1775, 922, 37, C.root, 'right');
}

function gardenPrint(g, x, y, i) {
  if (i === 2) {
    vignette(g, 3, x, y, 280, 137);
    return;
  }
  rect(g, x, y, 280, 137, i ? '#a6bea0' : '#d7b995');
  const dark = i ? '#385949' : '#765338',
    pale = i ? '#e9d18e' : '#f0d8b2';
  if (!i) {
    for (let j = 0; j < 7; j++) {
      const xx = x + 29 + j * 34;
      g.beginPath();
      g.moveTo(xx, y + 117);
      g.lineTo(xx, y + 44);
      g.lineTo(xx + 10, y + 30);
      g.lineTo(xx + 20, y + 44);
      g.lineTo(xx + 20, y + 117);
      g.fillStyle = dark;
      g.fill();
    }
    line(g, x + 29, y + 97, x + 250, y + 56, pale, 9);
    line(g, x + 21, y + 92, x + 255, y + 92, dark, 8);
  } else {
    for (let j = 0; j < 5; j++) {
      const xx = x + 37 + j * 51,
        yy = y + 45 + (j % 2) * 27;
      line(g, xx, yy, xx, y + 124, dark, 5);
      for (let m = 0; m < 5; m++) {
        const a = (m * 2 * Math.PI) / 5;
        dot(g, xx + 11 * Math.cos(a), yy + 11 * Math.sin(a), 10, pale);
      }
      dot(g, xx, yy, 7, '#885940');
      line(g, xx, y + 104, xx + 17, y + 88, dark, 5);
    }
  }
}
function nextWord(g, k) {
  paper(g);
  const t = at(k, 1, '“beside”'),
    slots = at(k, 2, 'three possible next tokens'),
    target = at(k, 2, 'Ask the teacher now');
  const moved = at(k, 3, 'the new logits'),
    normalized = at(k, 3, 'Now normalize all three');
  heading(
    g,
    'Student-generated prefix   /   temperature 1',
    slots ? 'The child saw a bird beside …' : 'Which prefix should the teacher score?',
  );
  const p = normalized ? freshAfter : freshBefore;
  if (!slots) {
    rect(g, 220, 362, 1484, 403, '#ddd2b5');
    rect(g, 206, 348, 1484, 403, C.light);
    text(g, 'Student’s unfinished field note', 1592, 443, 38, C.green, 'right');
    serif(g, 'The child saw a bird', 286, 495, 69);
    line(g, 279, 657, 1584, 657, C.edge, 3);
    if (t) serif(g, 'beside', 288, 628, 102, C.green);
    const nib = t ? 630 : 307;
    g.save();
    g.translate(nib, 647);
    g.scale(0.65, 0.65);
    g.rotate(-0.68);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(9, -47);
    g.lineTo(39, -47);
    g.closePath();
    g.fillStyle = C.gold;
    g.fill();
    rect(g, 9, -225, 30, 178, C.green);
    line(g, 23, -217, 23, -50, '#88b398', 5);
    g.restore();
    return;
  }
  freshWords.forEach((word, i) => {
    const x = 365 + i * 585;
    gardenPrint(g, x - 140, 280, i);
    serif(g, word, x, 481, 49, C.root, 'center');
    const base = 793,
      sc = 500,
      h = sc * p[i];
    rect(g, x - 77, base - h, 154, h, C.green);
    num(g, normalized ? p[i].toFixed(3) : '1/3', x, base - 24, 39, C.white, 'center');
    if (target) {
      const yy = base - sc * freshTeacher[i];
      line(g, x - 112, yy, x + 113, yy, C.gold, 6);
      num(g, freshTeacher[i].toFixed(2), x + 123, yy + 13, 32, C.gold);
    }
    line(g, x - 160, base, x + 160, base, C.root, 2);
    num(g, 'z  ' + (moved ? signed(freshLogits[i], 2) : '0'), x, 870, 38, C.root, 'center');
  });
  text(
    g,
    beat(k) === 4
      ? 'Garden     0.6 × (0.50 − ⅓) = +0.10 on its logit'
      : moved && !normalized
        ? 'Bars show the previous probabilities. Apply softmax to the new scores.'
        : target
          ? 'Gold tick    teacher at this prefix       •       Green bar    student'
          : 'Student probabilities before querying the teacher',
    960,
    955,
    34,
    C.muted,
    'center',
  );
}
export function release(g, k) {
  const b = beat(k);
  if (b <= 4) {
    nextWord(g, k);
    return;
  }
  if (b === 5 || b === 6) {
    keyCase(g, k);
    return;
  }
  paper(g, true);
  heading(
    g,
    'Assigned release measurements   /   Alder and Birch',
    'Which student can serve the policy assistant?',
    true,
  );
  const ref = RELEASE_CANDIDATES[0],
    l = RELEASE_LIMITS;
  const measures = [
    ['Checked accuracy', percent(ref.accuracy), 'at least ' + percent(l.accuracy)],
    ['Latency', ref.latency + ' ms', 'at most ' + l.latency + ' ms'],
    [
      'Monthly cost',
      ref.monthlyCost.toLocaleString('en-US') + ' units',
      'at most ' + l.monthlyCost.toLocaleString('en-US'),
    ],
  ];
  measures.forEach(([name, v, threshold], i) => {
    const x = 125 + i * 570;
    text(g, name, x, 300, 34, C.faint);
    num(g, v, x, 380, 53, C.white);
    text(g, threshold, x, 435, 32, C.teal);
  });
  line(g, 125, 480, 1780, 480, '#5f7d74', 3);
  const show = at(k, 8, 'Here are the errors'),
    verdict = at(k, 9, 'Only Birch');
  text(g, 'Policy holdout   ·   at most ' + percent(l.policy) + ' errors', 124, 548, 41, C.brass);
  RELEASE_CANDIDATES.forEach((candidate, i) => {
    const x = 130 + i * 855;
    serif(g, candidate.name, x, 650, 62, C.white);
    for (let n = 0; n < candidate.policyCases; n++) {
      const xx = x + 15 + (n % 25) * 27,
        yy = 714 + Math.floor(n / 25) * 28;
      dot(
        g,
        xx,
        yy,
        show && n < candidate.errors ? 11 : 7,
        show ? (n < candidate.errors ? '#f3a59b' : C.teal) : '#7c938c',
      );
    }
    text(
      g,
      show ? candidate.errors + ' / ' + candidate.policyCases + ' errors' : 'Outcomes covered',
      x,
      878,
      39,
      C.white,
    );
    if (verdict)
      text(
        g,
        qualifies(candidate) ? 'Clears all four' : 'Hold for policy errors',
        x,
        958,
        43,
        qualifies(candidate) ? C.teal : '#f3a59b',
      );
  });
}
