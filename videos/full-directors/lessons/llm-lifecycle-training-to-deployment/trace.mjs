import { lerp, travel } from './art.mjs';
import {
  source,
  eligible,
  verdict,
  memory,
  recordedRun,
  replayedRun,
  savedOld,
  savedBoundaryReply,
  live,
  current,
  edge,
} from './examples.mjs';

export function opening(a) {
  const { c, beat: b, cue } = a;
  const from = source.policyShift(0),
    to = source.policyShift(1);
  const move = cue(1, 'minimum moves to sixty', 1.7);
  const limit = lerp(from.thresholdDays, to.thresholdDays, move);
  const age = to.facts.ageDays,
    at = (n) => 115 + n * 10.4;
  a.title('Rotation policy P-7', 'Does this key still qualify?');
  a.text('K10234   /   stale service key', at(age), 206, 24, c.ink, {
    align: 'center',
  });
  a.key(at(age), 285, 0.95);
  a.line(at(age), 354, at(age), 420, c.gold, 2);
  a.axis(115, 427, 1040, 0, 100, [0, 15, 30, 45, 60, 75, 90, 100]);
  a.box(at(limit), 404, at(100) - at(limit), 17, c.cyan, null, 3);
  a.line(at(limit), 380, at(limit), 429, c.cyan, 4);
  a.mono('Day ' + age, at(age) + 21, 370, 24, c.gold);
  a.text(
    move > 0 && move < 1
      ? 'Cutoff moves'
      : 'Minimum ' + Math.round(limit) + ' days',
    at(limit) + 9,
    398,
    18,
    c.cyan,
  );
  a.text('Application reply', 112, 529, 20, c.muted);
  a.dot(125, 578, 14, c.green);
  a.text(verdict(eligible(age, to.checkerThreshold)), 153, 595, 50, c.green, {
    face: 'Serif',
  });
  if (b >= 3) {
    const show = cue(3, 'eighteen days short');
    a.fade(show, () => {
      a.text('Under the active policy', 610, 529, 20, c.muted);
      a.text(verdict(eligible(age, to.thresholdDays)), 608, 595, 50, c.gold, {
        face: 'Serif',
      });
      a.mono(to.thresholdDays - age + ' days short', 897, 591, 23, c.muted);
    });
  }
  if (b === 4)
    a.fade(cue(4, 'checkpoint four'), () =>
      a.mono('Weights   checkpoint v4', 115, 661, 21, c.muted),
    );
}

export function diagnosis(a) {
  const { c, beat: b, cue } = a;
  if (b === 3) {
    a.title(
      'Replayed trace  /  P-7 v2 · C2 · weights v4',
      'Does equality count?',
    );
    const result = source.policyDiagnosis(2);
    const x = a.axis(180, 390, 920, 57, 62, [57, 58, 59, 60, 61, 62]);
    a.box(x(60), 365, x(62) - x(60), 20, c.cyan, null, 4);
    for (const [i, v] of result.boundary.entries()) {
      const t = cue(
        3,
        i ? 'Sixty days qualifies' : 'Fifty-nine days falls short',
      );
      a.fade(t, () => {
        a.key(x(v.age), 288, 0.82, i ? c.green : c.gold);
        a.line(x(v.age), 350, x(v.age), 390, i ? c.green : c.gold, 3);
        a.text(
          v.decision,
          i ? x(60) + 73 : x(59) - 73,
          520,
          47,
          i ? c.green : c.gold,
          { face: 'Serif', align: i ? 'left' : 'right' },
        );
      });
    }
    a.mono('stale  AND  age ≥ 60', 640, 575, 30, c.ink, 'center');
    return;
  }
  const trace = source.policyDiagnosis(0);
  const installed = cue(2, 'sixty-day rule', 0) === 1;
  const replay = cue(2, 'checker returns ineligible', 0) === 1;
  const running = installed ? replayedRun : recordedRun;
  const reply = replay ? replayedRun : recordedRun;
  a.title(
    'Replay  /  K10234 · stale · checkpoint v4',
    replay
      ? 'Compare the replay with the active rule.'
      : installed
        ? 'Replay the saved request.'
        : 'Find the first cutoff that differs.',
  );
  const x = (n) => 380 + 8.65 * n,
    age = 42;
  a.mono('Day ' + age, x(age), 206, 23, c.gold, 'center');
  a.line(x(age), 220, x(age), 488, c.gold, 2);
  const rows = [
    ['Active policy', trace.source.threshold, 1],
    ['Delivered passage', trace.retrieved.threshold, cue(1, 'exact passage')],
    ['Running checker', running.cutoff, cue(1, 'comparison that produced')],
  ];
  rows.forEach(([name, n, t], i) => {
    const y = 268 + i * 97;
    a.text(name, 68, y + 10, 28, c.ink);
    a.line(x(0), y, x(90), y, c.line, 3);
    a.fade(t, () => {
      if (i === 2) a.mono(running.revision, 302, y + 9, 23, c.violet);
      a.line(x(n), y, x(90), y, i === 2 ? c.violet : c.cyan, 13);
      a.line(x(n), y - 16, x(n), y + 15, i === 2 ? c.violet : c.cyan, 3);
      a.mono(n + ' d', x(n) + 4, y - 20, 20, c.ink);
    });
  });
  a.line(68, 520, 1210, 520, c.line);
  a.text(replay ? 'Replayed reply' : 'Recorded reply', 68, 596, 24, c.muted);
  a.text(reply.verdict, 380, 609, 56, replay ? c.gold : c.green, {
    face: 'Serif',
  });
  a.mono('From checker ' + reply.revision, 866, 597, 23, c.violet);
}

export function symptoms(a) {
  const { c, beat: b, cue } = a;
  if (b <= 2) {
    const full = cue(1, 'completed reply');
    const parsed = cue(1, 'parsed object');
    a.title('Request inspection', 'Where did the field disappear?');
    a.text('Provider output', 79, 233, 24, c.muted);
    a.text('After the adapter', 795, 233, 24, c.muted);
    a.box(76, 261, 545, 140, c.bed, c.line, 9);
    a.box(793, 261, 404, 140, c.bed, c.line, 9);
    a.mono(
      full > 0 ? '{"eligible": true}' : '{"eligible":',
      104,
      347,
      33,
      c.ink,
    );
    a.arrow(642, 330, 767, 330, c.muted, 4);
    a.mono(parsed > 0 ? '{}' : '…', 827, 347, 42, parsed > 0 ? c.red : c.muted);
    a.mono(
      full > 0 ? 'finish = complete' : 'finish = output limit',
      80,
      472,
      25,
      full > 0 ? c.green : c.gold,
    );
    a.fade(cue(2, 'through the adapter'), () => {
      a.line(171, 363, 414, 363, c.green, 3);
      a.text(
        'Present in the raw reply. Missing after parsing.',
        81,
        590,
        37,
        c.ink,
        { face: 'Serif' },
      );
    });
    return;
  }
  if (b === 3) {
    a.title(
      'Controlled replay  /  same prompt, template and decoding',
      'Which artifact starts repeating?',
    );
    for (const [i, name] of ['Original weights', 'Packed weights'].entries()) {
      const y = 311 + i * 164;
      a.text(name, 65, y, 26, c.muted);
      a.line(350, y - 10, 1162, y - 10, c.line, 2);
      const count = i ? 1 + Math.floor(3 * cue(3, 'keeps repeating', 1.7)) : 1;
      for (let j = 0; j < count; j++)
        a.tile(
          354 + j * 202,
          y - 57,
          177,
          85,
          'Eligible.',
          c.bed,
          i && j ? c.red : c.ink,
          22,
        );
      if (!i) a.mono('END', 563, y + 1, 20, c.green);
    }
    a.text(
      'Compare calibration, packing and kernel on the same inputs.',
      65,
      605,
      26,
      c.muted,
    );
    return;
  }
  if (b === 4) {
    a.title('First token  /  server clock', 'What used the first 200 ms?');
    const start = 113,
      width = 1045,
      duration = 200,
      queue = 150;
    a.box(start, 302, width, 108, c.bed, c.line, 8);
    const queueWidth = (width * queue) / duration;
    a.fade(cue(4, 'went to queueing'), () => {
      a.box(start, 302, queueWidth, 108, c.violet, null, 6);
      a.mono(queue + ' ms', start, 565, 48, c.violet);
    });
    a.fade(cue(4, 'leaves fifty'), () => {
      a.box(start + queueWidth, 302, width - queueWidth, 108, c.cyan, null, 6);
      a.mono(duration - queue + ' ms', start + queueWidth, 565, 48, c.cyan);
    });
    a.axis(start, 425, width, 0, 200, [0, 50, 100, 150, 200]);
    a.text('Queue', start, 251, 32, c.violet);
    a.text('Prefill + first step', start + width * 0.69, 251, 28, c.cyan);
    return;
  }
  a.title(
    'Allocation failure  /  48 GiB device',
    'Which bytes cross the limit?',
  );
  const x = (n) => 102 + n * 17.8;
  const { cachePerRequest, twoRequestSubtotal, shortfallAt48 } = memory;
  const weights = memory.bytes[2];
  const subtotal = a.afterCue(5, 'fifty-two point six gibibytes', false);
  if (a.afterCue(5, 'packed weights', false)) {
    a.box(x(0), 304, x(weights) - x(0) - 2, 112, c.green, null, 3);
    a.mono('INT4 weights   ' + weights.toFixed(1) + ' GiB', x(1), 370, 28, c.reverse);
  }
  if (subtotal) {
    [c.cyan, c.violet].forEach((col, i) => {
      const lo = weights + i * cachePerRequest;
      const center = x(lo + cachePerRequest / 2);
      a.box(x(lo), 304, x(cachePerRequest) - x(0) - 2, 112, col, null, 3);
      a.mono('KV ' + (i + 1), center, 469, 25, col, 'center');
      a.mono(cachePerRequest.toFixed(0) + ' GiB', center, 501, 23, c.ink, 'center');
    });
    a.text(twoRequestSubtotal.toFixed(1) + ' GiB requested', 102, 535, 47, c.ink, {
      face: 'Serif',
    });
  }
  a.line(x(48), 230, x(48), 432, c.red, 5);
  a.mono('48 GiB', x(48), 217, 26, c.red, 'center');
  if (a.afterCue(5, 'The card holds forty-eight')) {
    a.text(shortfallAt48.toFixed(1) + ' GiB over capacity', 102, 600, 27, c.red);
  }
}

const cacheFields = [
  'Key ID',
  'Age (days)',
  'Stale flag',
  'Weights',
  'Policy',
  'Checker',
];

function boundaryReplays(a) {
  const { c, afterCue } = a;
  const cutoff = source.activeRule.threshold;
  const saved = afterCue(4, 'Save the ninety-day result', false);
  const incoming = afterCue(4, 'as current', false);
  const compared = afterCue(5, 'The stale flag differs', false);
  const missed =
    afterCue(5, 'lookup misses', 'so the lookup misses') &&
    current.kind === 'recompute';
  const checked = afterCue(5, 'The checker returns ineligible');
  const noAction = afterCue(5, 'no rotation ran') && !current.executed;
  const sameWeights = afterCue(6, 'with checkpoint four', false);
  a.title(
    'Boundary replays',
    sameWeights
      ? 'Both repairs used the same checkpoint.'
      : compared
        ? 'The stale flag changed the cache key.'
        : incoming
          ? 'Can this request reuse the saved answer?'
          : 'Which stale keys qualify?',
  );
  const cases = [
    [
      cutoff - 1,
      'At eighty-nine days',
      'the checker returns ineligible',
      edge(cutoff - 1).eligible,
    ],
    [
      cutoff,
      'At ninety',
      'it returns eligible',
      savedBoundaryReply.answer.eligible,
    ],
  ];
  a.text('Stale-key age', 78, 198, 23, c.muted);
  a.text('Checker verdict', 355, 198, 23, c.muted);
  a.text('Active rule', 817, 198, 23, c.muted);
  a.mono('stale AND age ≥ ' + cutoff + ' d', 817, 257, 28, c.cyan);
  cases.forEach(([age, ageCue, resultCue, qualifies], i) => {
    const visible = afterCue(4, ageCue, false);
    const answered = afterCue(4, resultCue);
    const y = 257 + i * 63;
    if (visible) a.mono(age + ' days', 79, y, 33, c.ink);
    if (answered) {
      a.text(verdict(qualifies), 355, y, 36, qualifies ? c.green : c.gold, {
        face: 'Serif',
      });
    }
  });
  if (!saved) return;

  a.line(76, 349, 1198, 349, c.line);
  const savedParts = savedBoundaryReply.identity.split('|');
  const incomingParts = current.identity.split('|');
  const savedY = 407,
    incomingY = 470,
    tileWidth = 146,
    tileHeight = 49;
  a.text('Saved reply', 78, savedY + 34, 26, c.ink);
  if (incoming) a.text('New request', 78, incomingY + 34, 26, c.ink);
  cacheFields.forEach((name, i) => {
    const x = 240 + i * 161;
    const differs = compared && incomingParts[i] !== savedParts[i];
    const emphasis = differs ? c.gold : sameWeights && i === 3 ? c.cyan : null;
    a.text(name, x + tileWidth / 2, 382, 23, emphasis ?? c.muted, {
      align: 'center',
    });
    if (emphasis) {
      const height = incomingY - savedY + tileHeight;
      a.box(x - 6, savedY - 6, tileWidth + 12, height + 12, null, emphasis, 7);
    }
    a.tile(x, savedY, tileWidth, tileHeight, savedParts[i], c.bed, c.ink, 30);
    if (incoming) {
      a.tile(
        x,
        incomingY,
        tileWidth,
        tileHeight,
        incomingParts[i],
        differs ? c.gold : c.bed,
        differs ? c.reverse : c.ink,
        30,
      );
    }
  });
  if (missed) a.text('Cache miss', 78, 569, 35, c.gold, { face: 'Serif' });
  if (checked) {
    a.arrow(295, 558, 383, 558, c.muted);
    a.text('Checker: ' + verdict(current.eligible), 411, 569, 35, c.ink, {
      face: 'Serif',
    });
  }
  if (noAction) a.mono('0 rotations ran', 934, 565, 28, c.muted);
}

export function cache(a) {
  const { c, beat: b, cue, afterCue } = a;
  if (b >= 4) {
    boundaryReplays(a);
    return;
  }
  if (b === 3) {
    a.title(
      'Cache repair  /  retire the v2 reply',
      'What identifies a reusable decision?',
    );
    const parts = live.identity.split('|');
    const requestFacts = afterCue(3, 'age and stale flag', false);
    const revisions = afterCue(3, 'policy and checker revisions', false);
    parts.forEach((p, i) => {
      const x = 72 + i * 193;
      const original = i === 0 || i === 3;
      const show = original || (i < 3 ? requestFacts : revisions);
      a.text(cacheFields[i], x, 270, 20, c.muted);
      a.tile(
        x,
        292,
        174,
        90,
        show ? p : '',
        c.bed,
        original ? c.ink : c.cyan,
        24,
      );
    });
    if (afterCue(3, 'lookup misses')) {
      a.text('First replay', 72, 480, 23, c.muted);
      a.mono('MISS', 72, 538, 39, c.gold);
    }
    if (afterCue(3, 'The checker returns ineligible')) {
      a.text(verdict(live.eligible), 270, 535, 36, c.ink, {
        face: 'Serif',
      });
    }
    if (afterCue(3, 'no action executed') && !live.executed) {
      a.text('No action', 270, 588, 23, c.muted);
    }
    if (afterCue(3, 'An identical request can now reuse it')) {
      a.text('Identical replay', 780, 480, 23, c.muted);
      a.mono('HIT', 780, 538, 39, c.green);
      a.text('reuse checked reply', 780, 588, 23, c.ink);
    }
    return;
  }
  const bypass = cue(1, 'past the response cache', 2.4);
  const rewind = cue(2, 'rewind to the lookup', 1.5),
    replay = cue(2, 'matched only', 2);
  const output = afterCue(2, 'Ineligible');
  a.title(
    'Trace K10234  /  75 days · stale · checkpoint v4',
    b === 1
      ? 'Follow the request past the cache.'
      : 'Where did the old reply leave the live path?',
  );
  const inlet = [
      [132, 363],
      [380, 363],
    ],
    old = [
      [380, 363],
      [518, 237],
      [846, 237],
      [993, 300],
    ],
    fresh = [
      [380, 363],
      [540, 482],
      [850, 482],
      [992, 482],
    ];
  for (const pts of [inlet, old, fresh]) a.path(pts, c.line, 4);
  a.key(101, 352, 0.64);
  a.mono('lookup', 380, 414, 22, c.muted, 'center');
  a.dot(380, 363, 10, c.ink);
  a.text('Response cache', 577, 200, 25, c.muted);
  a.text('Live checker C3', 566, 455, 25, c.muted);
  a.mono('75 ≥ 90 ?', 648, 531, 26, c.ink, 'center');
  a.mono('Policy 90 d   ·   delivered 90 d', 70, 552, 23, c.cyan);
  a.text('App reply', 1032, 272, 20, c.muted);
  const lit = cue(1, 'app still returns eligible');
  a.fade(lit, () =>
    a.text(verdict(savedOld.eligible), 1023, 323, 43, c.green, {
      face: 'Serif',
    }),
  );
  if (bypass > 0 && rewind < 1) {
    const route = rewind === 0 ? [...inlet, ...fresh.slice(1)] : fresh;
    if (rewind > 0) a.path(inlet, c.cyan, 6);
    const [x, y] = travel(
      a,
      route,
      rewind === 0 ? bypass : 1 - rewind,
      c.cyan,
      6,
    );
    a.key(x, y - 17, 0.3, c.gold);
  }
  if (b === 2) {
    a.fade(output, () =>
      a.text(verdict(live.eligible), 1010, 496, 42, c.gold, { face: 'Serif' }),
    );
    if (rewind > 0) {
      a.path(inlet, c.gold, 5);
      a.dot(380, 363, 14, c.gold);
      a.fade(rewind, () => a.text('ID + weights', 274, 306, 20, c.gold));
    }
    if (replay > 0) travel(a, old, replay, c.green, 9);
    a.fade(cue(2, 'sixty-day rule'), () =>
      a.mono('Saved under v2  ·  75 ≥ 60', 691, 298, 19, c.green, 'center'),
    );
  }
}
