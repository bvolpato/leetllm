import {
  ink,
  muted,
  milk,
  paper,
  teal,
  mint,
  rust,
  orange,
  ruled,
  dark,
  white,
  serif,
  mono,
  sans,
  cue,
  afterCue,
  ease,
  rect,
  round,
  path,
  line,
  disc,
  type,
  lab,
  headline,
  backing,
  stock,
  pill,
  arrow,
} from './press.mjs';
import {
  rare,
  draws,
  omission,
  fittedRare,
  fittedDraws,
  isRetry,
  retryCount,
  retainedPools,
  realCount,
  retryRow,
  shards,
  articleShard,
  articleRowIds,
  cutoffRuns,
  suites,
  release,
  gap,
} from './specimens.mjs';

function spindle(g, x, y, r, p, reading, caption, label = (100 * p).toFixed(0) + '%') {
  const angle = (u) => -Math.PI / 2 + u * 2 * Math.PI;
  disc(g, x + 6, y + 10, r + 12, '#c4c6af');
  disc(g, x, y, r + 10, ink);
  disc(g, x, y, r, teal);
  if (p > 0) {
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, r, angle(1 - p), angle(1));
    g.closePath();
    g.fillStyle = orange;
    g.fill();
  }
  for (let i = 0; i < 100; i++) {
    const a = angle(i / 100),
      major = i % 10 === 0;
    const inner = r - (major ? 26 : 9);
    line(
      g,
      x + (r - 4) * Math.cos(a),
      y + (r - 4) * Math.sin(a),
      x + inner * Math.cos(a),
      y + inner * Math.sin(a),
      i / 100 >= 1 - p ? ink : mint,
      major ? 4 : 2,
    );
  }
  disc(g, x, y, r * 0.68, paper);
  type(g, label, x, y + 13, r * 0.53, ink, serif, 'center');
  type(g, 'rare', x, y + r * 0.36, r * 0.18, muted, mono, 'center');
  if (reading != null) {
    const a = angle(reading),
      X = x + Math.cos(a) * (r - 36),
      Y = y + Math.sin(a) * (r - 36);
    disc(g, X, Y, 14, white);
    disc(g, X, Y, 7, rust);
  }
  type(g, '0', x, y - r - 16, 28, muted, mono, 'center');
  type(g, '.25', x + r + 13, y + 10, 27, muted, mono);
  type(g, '.75', x - r - 13, y + 10, 27, muted, mono, 'right');
  type(g, caption, x, y + r + 76, 47, ink, serif, 'center');
}

function samplingRounds(g, k) {
  headline(g, 'How many retries survived each round?');
  const replay = cue(k, 5, 'Replay those same eight positions', 5.6);
  const answer = cue(k, 5, 'Zero again');
  const shown = answer ? fittedDraws.length : Math.floor(replay * fittedDraws.length);
  const firstTotal = cue(k, 5, 'All eight were ordinary');
  lab(g, 'POSITION ON THE DIAL', 490, 277);
  draws.forEach((draw, i) => {
    const x = 490 + i * 166;
    type(g, draw.id, x + 76, 354, 32, muted, mono, 'center');
    type(g, draw.uniform.toFixed(2), x + 76, 410, 48, ink, mono, 'center');
  });
  for (const [i, sample] of [draws, fittedDraws].entries()) {
    const y = 456 + i * 174;
    const visibleCount = i === 0 ? sample.length : shown;
    type(g, i === 0 ? 'Original dial' : 'Fitted dial', 106, y + 40, 52, ink, serif);
    if (i === 0 ? firstTotal : answer) {
      type(g, retryCount(sample) + ' retries in ' + sample.length, 110, y + 93, 35, muted, mono);
    }
    sample.forEach((draw, column) => {
      const x = 490 + column * 166;
      const filled = column < visibleCount;
      round(g, x, y, 152, 103, 9, filled ? (draw.isRare ? rust : teal) : '#dadbc6');
      if (filled) type(g, draw.isRare ? 'Retry' : 'Ordinary', x + 76, y + 64, 32, white, sans, 'center');
    });
  }
  if (cue(k, 5, 'independently collected searches')) {
    line(g, 106, 775, 1804, 775, ruled, 2);
    lab(g, 'INDEPENDENT TEST SET', 108, 830);
    type(g, 'Retries recovered / retry cases', 108, 881, 51, rust, serif);
    type(g, 'Ordinary searches completed / ordinary cases', 895, 881, 51, teal, serif, 'left', 916);
  }
}

export function sampling(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b === 5) return samplingRounds(g, k);
  const fit = b === 4 ? ease(k.reveal('rare sector disappears', 0.8, { captionStart: 'its rare sector disappears' })) : 0;
  const counted = afterCue(k, 4, 'Zero of eight');
  headline(g, b < 3 ? 'What can eight draws miss?' : 'Fit the next dial to the retained sample');
  const sweep = cue(k, 3, 'Read each position', 6.4);
  const count = Math.min(draws.length, Math.floor(sweep * draws.length));
  let probe = false;
  if (b === 4) {
    const phrase = 'draw of point nine nine';
    const { start, end } = k.wordCue(phrase);
    probe = k.reveal(phrase, end - start, { captionStart: 'Even a draw' }) === 1;
  }
  const last = probe ? 0.99 : count ? draws[count - 1].uniform : null;
  spindle(g, 437, b <= 2 ? 557 : 478, 234, rare, last, 'Original distribution');
  if (b <= 2) {
    lab(g, 'INDEPENDENT DRAWS', 874, 306);
    type(g, '8 chances to draw a retry', 870, 425, 61, ink, serif);
    if (cue(k, 2, 'Each draw misses'))
      type(g, 'One miss      1 − 0.05 = 0.95', 875, 555, 43, teal, mono);
    if (cue(k, 2, 'to the eighth power')) {
      type(g, 'Eight misses   0.95⁸', 875, 667, 46, teal, mono);
      if (cue(k, 2, 'about zero')) type(g, '≈ ' + omission.toFixed(4), 869, 810, 96, ink, serif);
    }
    return;
  }
  const targetX = 1443;
  if (fit) {
    const share = rare + (fittedRare - rare) * fit;
    const label = fit === 1 ? undefined : '…';
    spindle(g, targetX, 478, 234, share, probe ? 0.99 : null, 'Exact fit to eight draws', label);
    arrow(g, 774, 478, 1116, 478, teal, 8);
  } else {
    disc(g, targetX, 478, 234, paper);
    type(g, '?', targetX, 504, 111, ink, serif, 'center');
    type(g, 'Retry share after refitting', targetX, 768, 47, ink, serif, 'center');
  }

  const slotY = 799;
  lab(g, 'RETAINED SAMPLE', 108, slotY + 50);
  draws.forEach((draw, i) => {
    const x = 475 + i * 126;
    const visible = i < count;
    round(g, x, slotY, 109, 82, 8, visible ? (draw.isRare ? rust : teal) : '#dadbc6');
    type(g, draw.id, x + 54.5, slotY + 32, 26, visible ? white : muted, mono, 'center');
    if (visible)
      type(g, draw.uniform.toFixed(2), x + 54.5, slotY + 68, 31, white, mono, 'center');
  });
  type(
    g,
    counted ? retryCount(draws) + ' retries / ' + draws.length : count + ' / ' + draws.length + ' retained',
    1805,
    slotY + 51,
    36,
    teal,
    mono,
    'right',
  );
  if (probe) {
    const readouts = [
      [437, rare, 'inside the original rare sector'],
      [targetX, fittedRare, 'now lands on common'],
    ];
    for (const [x, share, phrase] of readouts) {
      const { start, end } = k.wordCue(phrase);
      const revealed = k.reveal(phrase, end - start, { captionStart: phrase === 'now lands on common' ? phrase : false }) === 1;
      const retry = isRetry(last, share);
      const label = last.toFixed(2) + (revealed ? ' → ' + (retry ? 'rare' : 'common') : '');
      type(g, label, x, 198, 35, revealed ? (retry ? rust : teal) : muted, mono, 'center');
    }
  }
}
function idStrip(g, pool, columns, y, markRetry) {
  pool.forEach((id) => {
    const x = 351 + columns.indexOf(id) * 200;
    const marked = markRetry && id === retryRow.id;
    const real = id[0] === 'H';
    stock(g, x, y, 177, 121, marked ? teal : real ? '#bad6bb' : paper);
    type(g, id, x + 88, y + (marked ? 74 : 80), marked ? 46 : 51, marked ? white : real ? teal : ink, mono, 'center');
    if (marked) type(g, 'Rare retry', x + 88, y + 110, 31, white, sans, 'center');
  });
}
export function retention(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b <= 3) {
    const round = cue(k, 1, 'round one') + cue(k, 1, 'round two');
    const { accumulated, latest } = retainedPools(round);
    const markRetry = cue(k, 2, 'Look for H three');
    const askFrequency = cue(k, 3, 'How often will training');
    headline(g, askFrequency ? 'How often will training see H3?' : 'Which original rows survive round two?');
    lab(g, 'ACCUMULATE', 119, 361);
    idStrip(g, accumulated, accumulated, 292, markRetry);
    type(
      g,
      accumulated.length + ' IDs, including ' + realCount(accumulated) + ' real',
      352,
      510,
      49,
      teal,
      serif,
    );
    line(g, 118, 573, 1795, 573);
    if (cue(k, 2, 'latest generated batch')) {
      lab(g, 'REPLACE', 119, 700);
      idStrip(g, latest, accumulated, 630, false);
      type(g, latest.length + ' IDs, including ' + realCount(latest) + ' real', 352, 846, 49, rust, serif);
    }
    if (cue(k, 2, 'The replacement pool has lost') && !latest.includes(retryRow.id)) {
      const x = 351 + accumulated.indexOf(retryRow.id) * 200;
      line(g, x + 88, 419, x + 88, 677, teal, 3);
      line(g, x + 64, 677, x + 112, 677, teal, 3);
      type(g, retryRow.id + ' absent', x + 88, 730, 37, rust, mono, 'center');
    }
    if (cue(k, 3, 'bounded the error') && !cue(k, 3, 'Here three'))
      type(
        g,
        'In the linear regression study, error stayed bounded as the pool grew.',
        128,
        945,
        36,
        muted,
        sans,
      );
  } else {
    headline(g, 'How often does the sampler return H3?');
    stock(g, 122, 311, 552, 405, teal);
    lab(g, 'RETAINED REAL EXAMPLE', 163, 381, mint);
    type(g, retryRow.id, 156, 572, 151, white, mono);
    type(g, 'Rare retry', 161, 660, 53, white, sans);
    arrow(g, 705, 516, 829, 516);
    lab(g, 'EXPOSURE IN TRAINING', 874, 375);
    if (cue(k, 4, 'once per million')) {
      type(g, '1 in ' + retryRow.updatesPerDraw.toLocaleString('en-US'), 864, 538, 101, ink, serif, 'left', 915);
      type(g, 'updates in this example', 878, 625, 44, muted, sans);
    }
    if (b === 5)
      type(
        g,
        'Positive sampling weight gives the rare case a chance to appear.',
        129,
        883,
        51,
        teal,
        serif,
      );
  }
}
function fingerprint(g, hash, x, y, w) {
  const stripeW = w / 64;
  for (let i = 0; i < 64; i++) {
    const d = parseInt(hash[i], 16);
    rect(g, x + i * stripeW, y, stripeW * 0.86, 17 + d * 3.8, teal);
  }
  type(g, hash.slice(0, 16) + '…', x, y + 120, 39, ink, mono);
}
export function identity(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b === 2) {
    headline(g, 'Can the final decisions identify the cutoff?');
    stock(g, 115, 211, 1691, 632);
    lab(g, 'ARTICLE FIXTURE', 159, 279);
    lab(g, 'ORIGINAL FINAL OUTCOME', 673, 279);
    lab(g, 'RERUN FINAL OUTCOME', 1250, 279);
    const [original, rerun] = cutoffRuns;
    type(g, 'Row ID', 159, 367, 46, ink, serif);
    type(g, 'Cutoff  ' + original.cutoff.toFixed(2), 673, 367, 46, ink, serif);
    if (cue(k, 2, 'point nine')) {
      type(g, 'Cutoff  ' + rerun.cutoff.toFixed(2), 1250, 367, 46, ink, serif);
    }
    const compare = cue(k, 2, 'Compare the two logs');
    line(g, 159, 398, 1751, 398);
    articleRowIds.forEach((id, i) => {
      const y = 466 + i * 64;
      type(g, id, 159, y, 40, ink, mono);
      type(g, original.outcomes[i], 673, y, 40, teal, mono);
      if (compare) type(g, rerun.outcomes[i], 1250, y, 40, teal, mono);
    });
    if (cue(k, 2, 'record its value separately')) {
      type(g, 'Record the novelty cutoff with the approved run settings.', 126, 931, 49, ink, serif);
    }
    return;
  }
  const changed = cue(k, 3, 'to ten thousand'),
    rewritten = cue(k, 3, 'Recompute the writable manifest');
  headline(
    g,
    b === 1 ? 'What does a shard digest bind?' : 'Which digest still identifies the approved bytes?',
  );
  if (b === 1) {
    stock(g, 115, 254, 1691, 577);
    lab(g, 'ARTICLE FIXTURE   /   ONE ACCEPTED JSONL ROW', 160, 321);
    type(
      g,
      articleShard.row.row_id + '   /   ' + articleShard.row.seed_id,
      157,
      438,
      75,
      teal,
      serif,
    );
    lab(g, 'RESPONSE FIELD', 159, 489);
    type(g, articleShard.row.response, 158, 542, 47, ink, mono);
    if (cue(k, 1, 'digest of its exact bytes')) {
      line(g, 159, 600, 1746, 600, ruled);
      lab(g, 'SHA-256 OF THE COMPLETE ROW INCLUDING LINE FEED', 159, 667);
      type(g, articleShard.hash, 158, 754, 40, ink, mono, 'left', 1580);
    }
    if (cue(k, 1, 'decision log'))
      type(g, 'The manifest also binds the final decision log.', 126, 926, 48, muted, serif);
    return;
  }
  const current = shards[changed ? 1 : 0],
    writable = shards[rewritten ? 1 : 0],
    approved = shards[0];
  lab(
    g,
    (changed ? 'CHANGED PAYLOAD' : 'APPROVED PAYLOAD') + '   /   SMALL BYTE COMPARISON',
    125,
    261,
  );
  type(g, current.bytes.trim() + '  + LF', 121, 385, 78, ink, mono);
  const leftX = 119,
    rightX = 1015;
  for (const [x, label, item] of [
    [leftX, 'WRITABLE MANIFEST', writable],
    [rightX, 'PROTECTED APPROVAL', approved],
  ]) {
    stock(g, x, 470, 785, 347, x === rightX ? '#d4dfc9' : paper);
    lab(g, label, x + 43, 539);
    fingerprint(g, item.hash, x + 43, 593, 684);
    const matches = current.hash === item.hash;
    if (cue(k, 3, x === leftX ? 'changed payload matches' : 'bytes differ')) {
      type(
        g,
        matches ? 'Matches payload' : 'Different bytes',
        x + 41,
        779,
        45,
        matches ? teal : rust,
        serif,
      );
    }
  }
  if (b >= 4)
    type(
      g,
      'Keep the exact outputs, approval reference and rights evidence.',
      124,
      925,
      47,
      muted,
      serif,
    );
}
function budget(g, x, y, label, real, synth, unit = 91) {
  type(g, label, x, y, 49, ink, serif);
  for (let i = 0; i < real + synth; i++)
    round(g, x + i * unit, y + 36, unit - 7, 67, 5, i < real ? teal : orange);
  type(
    g,
    real + 'M real' + (synth ? ' + ' + synth + 'M synthetic' : ''),
    x,
    y + 162,
    38,
    ink,
    mono,
  );
}
export function experiment(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b === 1 || b === 5) {
    headline(g, 'Does the trained checkpoint do better?');
    stock(g, 107, 410, 400, 236, '#d7dfc8');
    lab(g, 'SHARED START', 144, 479);
    type(g, 'Weights W₀', 141, 580, 61, ink, serif);
    path(
      g,
      [
        [507, 527],
        [587, 527],
        [587, 353],
        [678, 353],
      ],
      teal,
      5,
    );
    path(
      g,
      [
        [587, 527],
        [587, 703],
        [678, 703],
      ],
      teal,
      5,
    );
    for (const [i, label] of ['Real only', 'Real + synthetic'].entries()) {
      const y = 243 + i * 346;
      stock(g, 693, y, 633, 215);
      lab(g, 'TRAINING RECIPE', 733, y + 58);
      type(g, label, 733, y + 157, 61, ink, serif);
      arrow(g, 1335, y + 110, 1465, y + 110);
      type(g, 'Untouched', 1496, y + 97, 43, teal, serif);
      type(g, 'searches', 1496, y + 153, 43, teal, serif);
    }
    type(
      g,
      b === 1
        ? 'Match the declared budget and count real-token exposure.'
        : 'Proposed trial   /   trained-model scores have yet to be measured.',
      126,
      930,
      48,
      muted,
      serif,
    );
  } else if (b <= 3) {
    headline(g, 'Keep evaluation text inside the screen');
    round(g, 935, 254, 856, 542, 22, dark);
    lab(g, 'RESTRICTED EVALUATION SERVICE', 990, 327, mint);
    type(g, 'Held-out tasks and answers', 991, 437, 56, white, serif);
    type(g, 'Index of five-word windows', 991, 549, 42, mint, mono);
    stock(g, 114, 312, 637, 224);
    lab(g, 'GENERATOR', 154, 388);
    type(g, 'Training candidate', 151, 484, 59, ink, serif);
    arrow(g, 755, 477, 927, 477, teal);
    stock(g, 114, 610, 637, 187);
    lab(g, 'ADMISSION PROCESS', 154, 675);
    type(g, 'Screening decision only', 152, 753, 46, rust, serif);
    arrow(g, 927, 705, 756, 705, rust);
    if (b === 3)
      type(
        g,
        'Review paraphrases, short spans and shared terminology.',
        126,
        932,
        46,
        muted,
        serif,
      );
  } else {
    headline(g, 'Specify the gate before selection');
    const labels = ['Common', 'Rare', 'Unsafe', 'Tool errors', 'Unwanted refusal'];
    labels.forEach((s, i) => {
      const x = 119 + i * 345;
      stock(g, x, 318, 325, 272);
      type(g, s, x + 20, 428, 43, teal, serif, 'left', 284);
      type(g, 'count / n', x + 20, 530, 39, ink, mono);
    });
    type(g, 'Report sample size and uncertainty for each slice.', 123, 732, 56, ink, serif);
    if (cue(k, 4, 'separate final test'))
      type(
        g,
        'Select on development cases. Reserve a fresh final test.',
        125,
        863,
        47,
        muted,
        sans,
      );
  }
}
function rareBank(g, s, observed, floor, showGap) {
  lab(g, 'RARE   /   RETRY, THEN PAGINATE', 154, 439);
  const columns = 10;
  const firstX = 159;
  const firstY = 516;
  const stepX = 94;
  const stepY = 69;
  for (let i = 0; i < s.total; i++) {
    const x = firstX + (i % columns) * stepX;
    const y = firstY + Math.floor(i / columns) * stepY;
    round(g, x, y - 31, 73, 46, 12, observed && i < s.count ? teal : '#c2c8b4');
    disc(g, x + 19, y - 8, 5, observed && i < s.count ? mint : milk);
    if (showGap && i >= s.count && i < s.limit) {
      g.strokeStyle = rust;
      g.lineWidth = 5;
      g.beginPath();
      g.roundRect(x - 3, y - 34, 79, 52, 13);
      g.stroke();
    }
  }
  if (floor) {
    const lastRequired = s.limit - 1;
    const y = firstY + Math.floor(lastRequired / columns) * stepY + 31;
    const end = firstX + (lastRequired % columns + 1) * stepX - 8;
    line(g, firstX - 9, y, end, y, rust, 3);
    type(g, 'floor ' + s.limit, end + 16, y + 10, 32, rust, mono);
  }
  type(
    g,
    observed ? s.count + ' / ' + s.total + ' correct' : s.total + ' held-out searches',
    154,
    902,
    58,
    observed ? teal : ink,
    serif,
  );
  if (showGap) type(g, '+' + gap + ' needed', 817, 898, 45, rust, serif);
}
export function releasePractice(g, k) {
  backing(g);
  const start = cue(k, 2, 'release rule');
  if (!start) {
    headline(g, 'Same starting weights, same training tokens');
    budget(g, 137, 317, 'Baseline', 12, 0);
    budget(g, 137, 617, 'Candidate', 8, 4);
    if (cue(k, 1, 'eighteen extra compute units')) {
      stock(g, 1355, 576, 430, 243, '#ead9b6');
      lab(g, 'GENERATION + SCREEN', 1386, 639);
      type(g, '+18', 1385, 736, 85, rust, serif);
      type(g, 'compute units', 1388, 789, 35, muted, sans);
    }
    return;
  }
  const common = afterCue(k, 2, 'It gets ninety-two'),
    floor = afterCue(k, 3, 'it needs forty correct'),
    rareSeen = afterCue(k, 3, 'It gets thirty-eight');
  const safeRule = afterCue(
    k,
    3,
    'At most two of two hundred safety probes may get an unsafe answer',
  );
  const safe = afterCue(k, 3, 'One does'),
    hold = afterCue(k, 4, 'Hold this release'),
    rareShort = afterCue(k, 4, 'The model falls short on rare searches'),
    otherSlices = afterCue(k, 4, 'The other two slices meet their limits'),
    extra = afterCue(k, 5, 'Two more');
  headline(g, 'Fictional release on held-out searches');
  stock(g, 104, 224, 1712, 739);
  lab(g, 'ORDINARY SEARCHES', 151, 292);
  type(g, 'Need ≥ ' + suites[0].limit + ' / ' + suites[0].total, 586, 296, 38, muted, mono);
  if (common) {
    type(g, suites[0].count + ' correct', 1169, 300, 48, otherSlices ? teal : ink, serif);
    if (otherSlices) pill(g, release.passes[0] ? 'PASS' : 'HOLD', 1556, 247, 191);
  }
  line(g, 149, 352, 1767, 352);
  rareBank(g, suites[1], rareSeen, floor, extra);
  if (safeRule) {
    lab(g, 'SAFETY PROBES', 1334, 441);
    type(g, 'At most ' + suites[2].limit + ' unsafe', 1334, 524, 46, ink, serif);
    if (safe) {
      type(
        g,
        suites[2].count + ' / ' + suites[2].total,
        1330,
        631,
        75,
        otherSlices ? teal : ink,
        serif,
      );
      type(g, 'unsafe', 1336, 687, 40, muted, sans);
    }
  }
  if (hold) {
    pill(g, release.release ? 'RELEASE' : 'HOLD RELEASE', 1324, 787, 397, rust, white, 38);
    if (rareShort) type(g, 'Rare slice below floor', 1328, 899, 37, rust, serif);
  }
}
