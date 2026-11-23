import { source, candidate } from './examples.mjs';
import { travel } from './art.mjs';

function evidence(a) {
  a.key(99, 218, 0.32, a.c.gold);
  a.mono('K10234    stale    42 days    P-7 ≥ 30 d', 139, 226, 23, a.c.ink);
  a.text('Execution log   ·   no job', 922, 227, 21, a.c.muted);
  a.line(72, 257, 1200, 257, a.c.line);
}
export function demonstration(a) {
  const { c, beat: b, cue } = a;
  a.title(
    'Post-training  /  one observed request',
    b === 1
      ? 'Teach the shape of an answer.'
      : b === 2
        ? 'Which reply matches the job record?'
        : 'What does the verifier read?',
  );
  evidence(a);
  if (b === 1) {
    const rows = [
      ['System', 'Return a decision and cite its evidence.'],
      ['User', 'Check stale key K10234 under P-7.'],
      [
        'Assistant',
        'eligible = true   ·   policy_id = P-7   ·   evidence = 42 ≥ 30',
      ],
    ];
    rows.forEach(([role, v], i) => {
      const y = 328 + i * 119;
      a.text(role, 79, y, 24, i === 2 ? c.green : c.muted);
      a.text(v, 286, y, 28, i === 2 ? c.green : c.ink);
      a.line(80, y + 32, 1200, y + 32, c.line);
    });
    return;
  }
  if (b === 2) {
    ['Eligible. No job ran.', 'Eligible. Rotation finished.'].forEach(
      (s, i) => {
        const y = 353 + i * 151;
        a.mono(i ? 'B' : 'A', 81, y, 38, c.muted);
        a.text(s, 178, y, 42, c.ink, { face: 'Serif' });
        a.fade(cue(2, "We'd choose"), () =>
          a.text(i ? 'Reject' : 'Choose', 981, y, 37, i ? c.red : c.green, {
            face: 'Serif',
          }),
        );
        a.line(80, y + 39, 1200, y + 39, c.line);
      },
    );
    return;
  }
  const flipped = b === 3 && cue(3, 'Flip the action flag') > 0;
  const proposed = { ...candidate, rotation_started: flipped };
  const fieldScore = source.verifierScore(proposed);
  const y0 = 338;
  Object.entries(proposed).forEach(([field, val], i) => {
    const y = y0 + i * 66;
    a.mono(field, 79, y, 26, c.muted);
    a.mono(String(val), 441, y, 28, i === 2 && flipped ? c.red : c.ink);
  });
  a.path(
    [
      [603, 311],
      [637, 311],
      [637, 479],
      [603, 479],
    ],
    c.cyan,
    4,
  );
  a.arrow(641, 396, 806, 396, c.cyan, 4);
  a.text('Field score', 865, 342, 25, c.muted);
  const waiting = b === 4 || (b === 3 && !cue(3, 'score is one'));
  a.text(
    waiting ? '?' : fieldScore + ' / 1',
    863,
    437,
    82,
    waiting ? c.muted : fieldScore ? c.green : c.red,
    { face: 'Serif' },
  );
  if (b >= 4) {
    a.line(77, 521, 1200, 521, c.line);
    a.text('Displayed prose', 80, 573, 22, c.muted);
    a.text('“Rotation finished.”', 340, 580, 39, c.red, { face: 'Serif' });
    a.fade(cue(5, 'checker never reads'), () =>
      a.mono('Outside the three fields', 806, 579, 20, c.red),
    );
  }
}

export function mask(a) {
  const { c, beat: b, cue } = a;
  if (b === 4) {
    a.title('SFT target audit', 'Will this example teach a missing field?');
    const missing = cue(4, 'Remove the policy ID', 0.8);
    a.mono('{', 80, 216, 31, c.muted);
    a.mono('}', 80, 529, 31, c.muted);
    const lines = [
      '"eligible": true,',
      '"policy_id": "P-7",',
      '"evidence": "42 ≥ 30 days"',
    ];
    lines.forEach((s, i) => {
      const y = 271 + i * 102;
      a.fade(i === 1 ? 1 - missing : 1, () => a.mono(s, 123, y, 32, c.ink));
    });
    a.line(760, 206, 760, 554, c.line);
    a.text('Parses as JSON', 819, 276, 25, c.muted);
    a.text('Yes', 819, 333, 44, c.green, { face: 'Serif' });
    a.text('Required fields', 819, 429, 25, c.muted);
    a.text(
      missing ? 'Missing policy_id' : 'Present',
      819,
      489,
      38,
      missing ? c.red : c.green,
      { face: 'Serif' },
    );
    a.text(
      'Audit types, extra fields, evidence and verdict.',
      123,
      609,
      25,
      c.muted,
    );
    return;
  }
  const fullSequence = b === 3 && cue(3, 'train on the full sequence') > 0;
  a.title(
    fullSequence
      ? 'Chat template  /  full-sequence loss'
      : 'Chat template  /  assistant-only loss',
    'Which positions supply direct targets?',
  );
  const spans = [
    ['System', 'Return JSON', 72, 246],
    ['User', 'Age 42 · P-7 ≥ 30', 325, 409],
    ['Assistant', 'eligible = true', 742, 465],
  ];
  for (const [i, [role, v, x, w]] of spans.entries()) {
    a.text(role, x, 248, 23, i === 2 ? c.green : c.muted);
    a.tile(x, 278, w, 91, v, c.bed, c.ink, 26);
    if (cue(1, 'mask the prompt targets') > 0) {
      a.box(x, 403, w, 40, i === 2 || fullSequence ? c.green : c.line, null, 3);
      if (i < 2 && !fullSequence) {
        for (let k = x + 15; k < x + w - 8; k += 23)
          a.line(k, 411, k - 9, 434, c.bg, 2);
      }
      a.text(
        i === 2 || fullSequence ? 'Direct target loss' : 'Masked targets',
        x + w / 2,
        481,
        22,
        i === 2 || fullSequence ? c.green : c.muted,
        { align: 'center' },
      );
    }
  }
  if (fullSequence) {
    a.text('Comparison recipe   ·   full-sequence loss', 77, 600, 32, c.green, {
      face: 'Serif',
    });
  } else if (b >= 2) {
    const pts = [
      [991, 499],
      [991, 543],
      [521, 543],
      [521, 504],
    ];
    a.path(pts, c.line, 2);
    travel(a, pts, cue(2, 'gradient back', 1.2), c.violet);
    a.text('Gradient through the prompt computation', 754, 578, 25, c.violet, {
      align: 'center',
    });
  }
}

export function objectives(a) {
  const { c, beat: b, cue } = a;
  if (b <= 2) {
    a.title(
      'Preference optimization',
      'Follow the same pair into two training recipes.',
    );
    const x0 = 72,
      top = 253;
    a.text('Chosen', x0, top, 20, c.green);
    a.text('No job ran.', x0, top + 46, 32, c.ink, { face: 'Serif' });
    a.text('Rejected', x0, top + 141, 20, c.red);
    a.text('Rotation finished.', x0, top + 188, 32, c.ink, { face: 'Serif' });
    const fork = [
        [334, 344],
        [440, 344],
        [503, 277],
      ],
      bottom = [
        [440, 344],
        [503, 459],
      ];
    a.path(fork, c.line, 3);
    a.path(bottom, c.line, 3);
    a.fade(cue(1, 'reward model'), () => {
      travel(a, fork, 1, c.gold);
      a.text('Rankings → reward model', 530, 280, 32, c.ink);
      a.text('Score new rollouts → PPO update', 531, 330, 25, c.gold);
    });
    a.fade(cue(1, 'D P O takes'), () => {
      travel(a, bottom, 1, c.cyan);
      a.text('DPO preference loss', 531, 461, 34, c.ink);
      a.text('Chosen and rejected log-probabilities', 531, 507, 24, c.cyan);
      a.text('Policy relative to reference', 531, 550, 24, c.cyan);
    });
    a.fade(cue(2, 'gradient'), () =>
      a.mono('Gradient updates policy weights', 531, 623, 25, c.green),
    );
    return;
  }
  if (b <= 4) {
    a.title(
      'Reinforcement learning  /  checkable outcomes',
      'Which answer earns the training reward?',
    );
    const cand = { ...candidate, text: 'Rotation finished.' };
    a.mono('eligible            true', 92, 266, 28, c.ink);
    a.mono('policy_id           P-7', 92, 329, 28, c.ink);
    a.mono('rotation_started    false', 92, 392, 28, c.ink);
    a.path(
      [
        [611, 237],
        [644, 237],
        [644, 408],
        [611, 408],
      ],
      c.cyan,
      4,
    );
    a.arrow(645, 325, 826, 325, c.cyan, 4);
    a.text('Reward', 870, 271, 23, c.muted);
    a.text(
      b === 4 ? String(source.verifierScore(cand)) : '?',
      884,
      366,
      82,
      b === 4 ? c.green : c.muted,
      { face: 'Serif' },
    );
    a.line(78, 448, 1202, 448, c.line);
    a.text(cand.text, 90, 523, 45, c.red, { face: 'Serif' });
    a.text('Execution log   ·   no job', 696, 519, 29, c.ink);
    a.fade(cue(4, 'execution receipt'), () =>
      a.mono('Build displayed status from the receipt.', 90, 617, 25, c.green),
    );
    return;
  }
  a.title(
    'Inference  /  frozen checkpoint v4',
    'Spend more computation on this request.',
  );
  a.text('Same input', 83, 342, 32, c.ink, { face: 'Serif' });
  a.arrow(263, 329, 369, 329, c.cyan, 3);
  a.box(382, 264, 188, 125, c.bed, c.cyan, 10);
  a.mono('weights v4', 476, 335, 22, c.cyan, 'center');
  for (let i = 0; i < 3; i++) {
    const y = 204 + i * 127;
    a.path(
      [
        [570, 329],
        [613, 329],
        [668, y + 32],
        [712, y + 32],
      ],
      c.line,
      3,
    );
    a.tile(712, y, 180, 67, 'candidate ' + (i + 1), c.bed, c.ink, 19);
    a.path(
      [
        [895, y + 32],
        [933, y + 32],
        [994, 329],
        [1030, 329],
      ],
      c.line,
      3,
    );
  }
  a.text('Score', 1054, 341, 36, c.green, { face: 'Serif' });
  a.text(
    'Measure quality, elapsed time and cost on the same cases.',
    83,
    591,
    31,
    c.muted,
    { face: 'Serif' },
  );
}
