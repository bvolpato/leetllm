import { at, clamp, lerp, smooth } from './ink.mjs';
import {
  budget,
  cacheGiB,
  features,
  matchedWidth,
  normalizationBars,
  ordinaryWeights,
  queries,
  rawCache,
  rms,
  rotaryPair,
  silu,
  steps,
  tokens,
} from './examples.mjs';

export function assistant(p, k) {
  const b = k.beat.beatIndex;
  p.header('From GPT to instruction tuning', 'What changes when the task changes?');
  const names = ['GPT-1', 'GPT-2', 'GPT-3', 'InstructGPT'],
    dates = [2018, 2019, 2020, 2022];
  const index = Math.min(3, Math.max(0, b - 1));
  const xs = [109, 378, 643, 1000];
  p.line(xs[0], 223, xs[3], 223, p.rule, 2);
  names.forEach((n, i) => {
    p.dot(xs[i], 223, i === index && b ? 10 : 5, i === index && b ? p.sea : p.sub);
    p.mono(dates[i], xs[i], 198, 17, p.sub, 'center');
    p.type(n, xs[i], 264, 22, i === index && b ? p.sea : p.sub, 'sans', 'center', 600);
  });
  if (b === 0) {
    p.label('TRANSLATION TRANSFORMER', 82, 352);
    p.mono('source → encoder', 82, 428, 27);
    p.arrow(334, 438, 334, 473, p.blue, 3);
    p.mono('target → decoder', 82, 523, 27);
    p.line(577, 325, 577, 557, p.rule);
    p.label('GPT', 657, 352);
    p.serif('Generative Pre-trained Transformer', 657, 412, 30);
    p.mono('prefix → causal stack', 657, 496, 28, p.sea);
  } else if (b <= 3) {
    p.label(b === 1 ? 'LABELED TRAINING PAIR' : 'REQUEST PREFIX', 73, 345);
    const showDemo = b === 1 || (b === 3 && at(k, 3, 'Add one solved example', 0.8) > 0);
    const y = showDemo ? 441 : 369;
    if (showDemo) {
      p.box(72, 370, 602, 55, p.faint);
      p.mono('Stale guide   →   Docs', 92, 406, 24, p.sea);
    }
    if (b > 1) {
      p.box(72, y + 14, 602, 106, p.sheet, p.rule);
      p.type('Classify the review note.', 92, y + 49, 22);
      p.mono('Old CLI flag in README. Label:', 92, y + 92, 22);
    } else {
      p.type('Adapt pretrained weights on labeled notes.', 76, 506, 23);
    }
    p.line(723, 317, 723, 570, p.rule);
    p.label('MODEL WEIGHTS', 766, 352);
    for (let i = 0; i < 6; i++) {
      const f = b === 1 ? at(k, 1, 'fine-tuned', 1.2) : 0;
      const w = 61 + ((i * 29) % 101);
      p.box(768, 380 + 24 * i, w * (1 + f * 0.45), 12, i % 2 ? p.blue : p.sea);
    }
    p.type(b === 1 ? 'Updated in training' : 'Fixed for this request', 766, 537, 22);
  } else {
    p.label('RUN-842  /  LOG EXCERPT', 65, 332);
    p.box(64, 350, 1078, 62, p.ink);
    p.mono('auth_fixture_test.py:41    expired auth fixture', 85, 390, 25, p.bg);
    if (b === 4) {
      p.label('POSSIBLE REPLIES', 66, 467);
      p.serif('“The test reported an expired fixture.”', 65, 528, 29);
      p.serif('“The machine clock ran fast.”', 620, 528, 32);
    } else if (b === 5) {
      const stages = ['Demonstrations', 'Preferences', 'Reward-guided policy'];
      const done = [1, at(k, 5, 'Human comparisons', 0.8), at(k, 5, 'PPO updated', 0.8)];
      stages.forEach((v, i) => {
        const x = 67 + 366 * i;
        p.dot(x + 8, 476, 7, done[i] ? p.sea : p.rule);
        p.type(v, x + 27, 485, 23, done[i] ? p.ink : p.sub);
        if (i < 2) p.arrow(x + 14, 515, x + 328, 515, done[i + 1] ? p.sea : p.rule, 2);
      });
      if (at(k, 5, 'InstructGPT first', 0) === 1)
        p.type('The reviewer chose the report of an expired fixture.', 66, 581, 23, p.sea);
    } else {
      p.label('HYPOTHESIS  /  A FAST HOST CLOCK', 65, 451);
      if (at(k, 6, 'compare the host clock', 0) === 1)
        p.type('Measure the offset between host and trusted time at the instant of failure.', 65, 488, 24);
      if (at(k, 6, 'Then check where', 0) === 1)
        p.type('Early rejection is possible if the host reached expiry while trusted time was still before it.', 65, 527, 23);
      if (at(k, 6, 'Serialize the history', 0.6) > 0)
        p.mono('system   →   user + evidence   →   assistant prefix', 65, 579, 24, p.sea);
    }
  }
}

export function allocation(p, k) {
  p.header('Dense training  /  allocation units', 'How much text fits in the budget?');
  const b = k.beat.beatIndex;
  const first = at(k, 1, 'Double the parameter count', 1.25);
  const again = at(k, 1, 'Double the parameters again', 1.25);
  const larger = at(k, 2, 'Doubling both', 1.4);
  let n = 4 * 2 ** (first + again);
  let t = 64 / n;
  if (b >= 2) {
    n = 8 * (1 + larger);
    t = 8 * (1 + larger);
  }
  const cell = 20,
    ox = 152,
    oy = 502,
    w = n * cell,
    h = t * cell;
  p.box(ox, oy - h, w, h, p.faint, p.sea, 2);
  for (let i = 1; i < n; i++) p.line(ox + i * cell, oy - h, ox + i * cell, oy, p.sea, 1);
  for (let j = 1; j < t; j++) p.line(ox, oy - j * cell, ox + w, oy - j * cell, p.sea, 1);
  p.line(ox - 7, oy - h, ox - 18, oy - h, p.gold, 2);
  p.line(ox - 13, oy - h, ox - 13, oy, p.gold, 2);
  if (b >= 2 && larger > 0) {
    p.c.save();
    p.c.setLineDash([5, 5]);
    p.box(ox, oy - 8 * cell, 8 * cell, 8 * cell, null, p.ink, 2.5);
    p.c.restore();
  }
  const settled = Number.isInteger(n) && Number.isInteger(t);
  if (settled) p.mono(t, ox - 30, oy - h / 2 + 7, 26, p.gold, 'right');
  p.label('Token units', 64, 165, p.gold);
  const widthLabel = settled ? n + ' parameter units' : 'Parameter units';
  p.type(widthLabel, ox + w / 2, 527, 22, p.sea, 'sans', 'center', 500);
  p.label(b >= 2 ? 'FITTED EQUAL SCALING' : 'FIXED COMPUTE', 622, 216);
  p.serif('Training work', 620, 277, 43);
  p.mono('≈ 6 × parameters × tokens', 620, 351, 27);
  if (settled)
    p.mono(
      '6 × ' + n + ' × ' + t + ' = ' + budget(n, t).toLocaleString('en-US'),
      620,
      416,
      31,
      p.sea,
    );
  else if (b === 1) p.mono('6 × (N × D) = 384', 620, 416, 29, p.sea);
  if (b >= 2 && larger > 0) p.label('Dashed square: starting budget', 619, 455, p.sub);
  if (b >= 2 && larger === 1) {
    p.type('2× width and 2× height give 4× work.', 622, 492, 23);
    if (b === 3) {
      p.line(622, 518, 1130, 518, p.rule);
      p.type('Serving adds a cost for every request.', 622, 560, 22, p.sub);
    }
  }
}

function cacheWires(p, k) {
  const b = k.beat.beatIndex;
  const stored = b > 0 ? 4 : 1 + Math.floor(at(k, 0, 'As we store each position', 2.2) * 3);
  const grouped = b >= 2;
  const count = grouped ? 2 : 8;
  p.label('EIGHT QUERY HEADS', 62, 181);
  const top = 236,
    bottom = 368;
  for (let i = 0; i < 8; i++) {
    const x = 131 + i * 134;
    const color = i < 4 ? p.gold : p.blue;
    p.mono('Q' + (i + 1), x, top - 16, 20, color, 'center');
    p.path(
      [
        [x - 10, top],
        [x + 10, top],
        [x, top + 17],
      ],
      null,
      0,
      color,
      true,
    );
    let dest = grouped ? (i < 4 ? 333 : 867) : x;
    if (b === 1) {
      const f = at(k, 1, 'Bundle the query wires', 1.1);
      dest = lerp(x, i < 4 ? 333 : 867, f);
    }
    p.path(
      [
        [x, top + 21],
        [x, top + 43],
        [dest, bottom - 31],
        [dest, bottom - 4],
      ],
      color,
      2.5,
    );
  }
  if (b !== 1) {
    for (let i = 0; i < count; i++) {
      const x = grouped ? 333 + 534 * i : 131 + i * 134;
      const width = grouped ? 190 : 92;
      p.box(x - width / 2, bottom, width, 112, p.sheet, p.rule);
      for (let j = 0; j < 4; j++) {
        const y = bottom + 8 + j * 24;
        if (j < stored) {
          p.box(x - width * 0.4, y, width * 0.36, 17, p.sea);
          p.box(x + width * 0.04, y, width * 0.36, 17, p.blue);
        }
      }
      p.mono('KV ' + (i + 1), x, 514, 18, p.ink, 'center');
    }
    const raw = rawCache(stored, count, 2);
    const ready = b !== 2 || at(k, 2, 'That’s a quarter', 0.2) > 0;
    p.mono(
      stored +
        (stored === 1 ? ' position' : ' positions') +
        ' × ' +
        count +
        ' heads × 2 (K,V) × 2 coordinates' +
        (ready ? ' = ' + raw : ''),
      600,
      592,
      22,
      p.ink,
      'center',
    );
  } else {
    for (const x of [333, 867]) p.mono('?', x, 428, 42, p.ink, 'center');
    p.serif('Four query heads per bundle', 600, 556, 32, p.ink, 'center');
  }
}

function weightedReads(p, k) {
  const total = at(k, 3, 'Watch the first trace', 2.2) * 4;
  const second = at(k, 3, 'Watch the second trace', 2.2) * 4;
  p.label('ONE STORED KV HEAD', 57, 183);
  p.label('KEY', 156, 226);
  p.label('VALUE', 265, 226);
  p.label('Q1 share', 369, 226, p.gold);
  p.label('Q2 share', 456, 226, p.blue);
  const current = Math.min(3, Math.floor(second > 0 ? second : total));
  queries[0].values.forEach((v, i) => {
    const y = 266 + i * 58;
    p.box(56, y - 27, 484, 51, p.sheet, p.rule);
    p.mono(tokens[i], 66, y + 7, 16);
    p.mono(i % 2 ? '[0, √2]' : '[√2, 0]', 152, y + 7, 17, p.sub);
    p.mono('[' + v.join(', ') + ']', 265, y + 7, 17);
    queries.forEach((read, q) =>
      p.mono(read.shares[i].toFixed(3), 369 + q * 87, y + 7, 17, q ? p.blue : p.gold),
    );
    if ((total > 0 || second > 0) && i === current)
      p.arrow(28, y - 2, 53, y - 2, second ? p.blue : p.gold, 3, 10);
  });
  p.label('QUERY POINTERS', 58, 528);
  p.arrow(76, 569, 137, 569, p.gold, 4, 12);
  p.mono('Q1', 150, 577, 23, p.gold);
  p.arrow(285, 583, 285, 542, p.blue, 4, 12);
  p.mono('Q2', 302, 577, 23, p.blue);
  const x = 592,
    y = 536,
    s = 186;
  for (let i = 0; i <= 4; i++) {
    const n = i / 2;
    p.line(x + n * s, y, x + n * s, y - 2 * s, p.rule, i === 0 ? 1.8 : 0.6);
    p.line(x, y - n * s, x + 2 * s, y - n * s, p.rule, i === 0 ? 1.8 : 0.6);
  }
  p.mono('0', x - 10, y + 10, 16, p.sub, 'right');
  p.mono('2', x + 2 * s, y + 24, 16, p.sub, 'center');
  p.mono('2', x - 12, y - 2 * s + 5, 16, p.sub, 'right');
  const screen = ([a, b]) => [x + a * s, y - b * s];
  queries.forEach((read, i) => {
    let pos = [0, 0];
    const color = i ? p.blue : p.gold,
      part = i ? second : total;
    steps(read).forEach((v, j) => {
      const f = clamp(part - j),
        next = pos.map((n, d) => n + v[d] * f);
      if (f) {
        p.arrow(...screen(pos), ...screen(next), color, i ? 3 : 5, 8);
      }
      pos = next;
    });
    if (part > 0) {
      const [X, Y] = screen(pos);
      p.dot(X, Y, 5, color);
      if (part === 4)
        p.mono(
          'Q' + (i + 1) + '  [' + read.output.map((n) => n.toFixed(2)).join(', ') + ']',
          X + 12,
          Y + (i ? -10 : 24),
          17,
          color,
        );
    }
  });
  p.label('WEIGHTED VALUES, TIP TO TAIL', 591, 596);
}

export function cache(p, k) {
  const b = k.beat.beatIndex;
  p.header(
    'Grouped-query attention',
    b <= 2
      ? 'How many heads need storage?'
      : b <= 4
        ? 'Can two reads of one cache land apart?'
        : 'What sets the raw cache size?',
  );
  if (b <= 2) return cacheWires(p, k);
  if (b <= 4) return weightedReads(p, k);
  p.mono('8 requests × 8,192 positions × 32 layers', 64, 200, 26);
  p.type(
    'Each KV head stores two 128-coordinate vectors at two bytes per coordinate.',
    64,
    248,
    22,
  );
  ['MHA', 'GQA', 'MQA'].forEach((name, i) => {
    const heads = [32, 8, 1][i],
      gib = cacheGiB(heads),
      y = 304 + 75 * i;
    const fill = at(k, 5, ['thirty-two gibibytes', 'heads take eight', 'head takes one'][i], 0.7);
    p.mono(name, 64, y + 24, 27);
    p.mono(heads + ' KV', 174, y + 24, 21, p.sub);
    for (let j = 0; j < 32; j++) p.box(319 + j * 21, y, 18, 28, j < gib * fill ? p.sea : p.faint);
    if (fill === 1) p.mono(gib + ' GiB', 1118, y + 24, 25, p.ink, 'right');
  });
  if (b === 6)
    p.type(
      'Serving memory also includes weights, reserved pages and runtime buffers.',
      64,
      511,
      22,
    );
}

export function norm(p, k) {
  const b = k.beat.beatIndex;
  p.header('Inside one decoder position', 'How do two features change scale?');
  const R = rms(features);
  p.label('INPUT FEATURES', 64, 192);
  features.forEach((val, i) => {
    const x = 77 + i * 188,
      s = val * 39;
    p.box(x, 434 - s, s, s, i ? p.faint : p.sheet, i ? p.blue : p.sea, 2);
    const q = at(k, 0, 'Square the features', 1);
    if (q > 0) {
      for (let j = 1; j < val; j++) {
        p.line(x + j * 39, 434 - s, x + j * 39, 434 - s + s * q, p.rule);
        p.line(x, 434 - s + j * 39, x + s * q, 434 - s + j * 39, p.rule);
      }
    }
    p.mono(val, x + s / 2, 471, 27, p.ink, 'center');
    if (q === 1) p.mono(val * val, x + s / 2, 434 - s / 2 + 9, 26, i ? p.blue : p.sea, 'center');
  });
  p.line(482, 165, 482, 576, p.rule);
  if (b < 2) p.label('ROOT-MEAN-SQUARE SCALING', 550, 195);
  if (b === 0) p.serif('Square each coordinate', 551, 312, 37);
  if (b === 1) {
    p.mono('(9 + 16) / 2 = 12.5', 550, 310, 30);
    if (at(k, 1, 'about three point five four', 0.9) === 1)
      p.mono('√12.5 ≈ ' + R.toFixed(2), 550, 401, 37, p.sea);
  }
  if (b >= 2) {
    const base = 480,
      amp = 52;
    const method = b >= 3 ? 'LayerNorm' : 'RMSNorm';
    const centerProgress = at(k, 3, 'subtracts the mean', 1);
    const scaleProgress = b >= 3
      ? at(k, 3, 'Divide by their standard deviation', 1.1)
      : at(k, 2, 'Divide both features', 1);
    const state = normalizationBars(method, centerProgress, scaleProgress);
    p.label(state.label, 550, 195);
    p.mono(state.formula, 550, 232, 23);
    state.bars.forEach((output, i) => {
      const x = 711 + i * 210;
      const dy = amp * output;
      p.box(x - 40, Math.min(base, base - dy), 80, Math.abs(dy), i ? p.blue : p.sea);
      const pos = dy < 0 ? base - dy + 27 : base - dy - 13;
      if (state.settled) p.mono(output.toFixed(3), x, pos, 24, i ? p.blue : p.sea, 'center');
    });
    p.line(570, base, 1084, base, p.sub, 1.5);
    p.mono('0', 553, base + 7, 18, p.sub, 'right');
    p.type(b >= 3 ? 'LayerNorm · unit gain, zero bias' : 'RMSNorm · unit gains', 550, 595, 23);
  }
}

export function gate(p, k) {
  const b = k.beat.beatIndex;
  p.header(
    'Feed-forward branch',
    b < 3 ? 'How much of the feature gets through?' : 'What width fits the same weight budget?',
  );
  if (b < 3) {
    const z =
      at(k, 1, 'Change only the gate input', 1.2) - 2 * at(k, 2, 'Move the gate input', 1.4);
    const gate = silu(z),
      product = 4 * gate;
    p.label('TWO LEARNED PROJECTIONS', 64, 199);
    p.mono('Gate input  ' + z.toFixed(2), 70, 275, 26, p.gold);
    p.mono('Up branch   4.00', 70, 415, 26, p.blue);
    p.arrow(375, 265, 506, 265, p.gold, 3);
    p.box(527, 223, 228, 79, p.sheet, p.gold, 2);
    p.mono('SiLU   ' + gate.toFixed(2), 641, 273, 23, p.gold, 'center');
    p.path(
      [
        [758, 265],
        [815, 265],
        [815, 345],
      ],
      p.gold,
      3,
    );
    p.path(
      [
        [375, 408],
        [815, 408],
        [815, 382],
      ],
      p.blue,
      3,
    );
    p.dot(815, 363, 20, p.ink);
    p.mono('×', 815, 372, 26, p.bg, 'center');
    p.arrow(848, 363, 940, 363, p.ink, 3);
    p.mono(product.toFixed(2), 971, 380, 42, product < 0 ? p.red : p.sea);
    p.line(70, 487, 1132, 487, p.rule);
    p.mono('SiLU(z) = z × sigmoid(z)', 70, 551, 26);
    p.type('Project the product back to model width.', 624, 550, 22, p.sub);
  } else {
    const d = 12,
      h = 48,
      target = matchedWidth(d, h),
      answer = at(k, 4, 'Three lots', 0.85);
    p.label('ORDINARY BRANCH', 67, 220);
    p.label('SWIGLU BRANCH', 670, 220);
    const block = (x, y, w, h, c) => {
      p.box(x, y, w, h, p.sheet, c, 2);
      for (let n = 6; n < w; n += 6) p.line(x + n, y, x + n, y + h, c, 0.65);
      for (let n = 6; n < h; n += 6) p.line(x, y + n, x + w, y + n, c, 0.65);
    };
    for (let i = 0; i < 2; i++) block(70, 273 + i * 83, 288, 72, p.blue);
    p.mono('2 × 12 × 48', 69, 500, 28, p.blue);
    p.mono(ordinaryWeights(d, h).toLocaleString('en-US') + ' weights', 69, 559, 29);
    if (answer > 0) {
      for (let i = 0; i < 3; i++) block(672 + i * 88, 272, d * 6, target * 6, p.sea);
      p.mono('3 × 12 × ' + target, 671, 500, 28, p.sea);
      p.mono(ordinaryWeights(d, h).toLocaleString('en-US') + ' weights', 671, 559, 29);
    } else {
      p.mono('3 × 12 × ?', 671, 365, 37, p.gold);
      p.type('Two inputs and a down projection', 671, 505, 23, p.sub);
    }
  }
}

export function rotary(p, k) {
  const b = k.beat.beatIndex;
  p.header('Rotary position embeddings', 'What changes the angle between them?');
  const paired = at(k, 2, 'Shift both positions', 2),
    single = at(k, 3, 'bring only the key', 1.7);
  const q = 9 + Math.round(10 * paired),
    key = 3 + Math.round(10 * paired) + Math.round(3 * single);
  const alt = at(k, 4, 'Try a different content vector', 1.4);
  const before = rotaryPair(q, key);
  // In the final comparison the unrotated key turns from [0,1] to [1,0].
  const angleQ = 0.1 * q,
    angleK = 0.1 * key + (Math.PI / 2) * (1 - alt);
  const score = alt ? Math.cos(angleK - angleQ) : before.score;
  const cx = 332,
    cy = 365,
    r = 168;
  p.dot(cx, cy, r, null, p.rule, 2);
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30,
      len = i % 5 ? 5 : 12;
    p.line(
      cx + (r - len) * Math.cos(a),
      cy - (r - len) * Math.sin(a),
      cx + r * Math.cos(a),
      cy - r * Math.sin(a),
      p.rule,
      1,
    );
  }
  p.line(cx - r - 12, cy, cx + r + 12, cy, p.rule);
  p.line(cx, cy - r - 14, cx, cy + r + 14, p.rule);
  const point = (a, l) => [cx + l * Math.cos(a), cy - l * Math.sin(a)];
  p.c.beginPath();
  p.c.arc(cx, cy, 55, -angleK, -angleQ, angleK < angleQ);
  p.c.lineWidth = 3;
  p.c.strokeStyle = p.sub;
  p.c.stroke();
  // Move the key label outside the query label as the arrows align.
  const angleBetween = Math.abs(angleK - angleQ);
  const keyLabelOffset = 27 * smooth(clamp((0.25 - angleBetween) / 0.15));
  for (const [a, color, name, labelOffset] of [
    [angleQ, p.gold, 'Q', 0],
    [angleK, p.blue, 'K', keyLabelOffset],
  ]) {
    p.arrow(cx, cy, ...point(a, r - 5), color, 5, 13);
    const [X, Y] = point(a, r + 29 + labelOffset);
    p.mono(name, X, Y + 7, 23, color, 'center');
  }
  p.label('TOKEN POSITIONS', 628, 210);
  p.mono('Query   ' + Math.round(q), 628, 278, 28, p.gold);
  p.mono('Key     ' + Math.round(key), 628, 339, 28, p.blue);
  p.line(628, 367, 1098, 367, p.rule);
  p.mono('Gap      ' + Math.round(q - key), 628, 421, 25);
  p.mono('Q · K    ' + score.toFixed(3), 628, 483, 29, p.sea);
  p.type(
    alt ? 'Changed key content at the same gap' : 'One coordinate pair · 0.1 radians per position',
    628,
    521,
    20,
    p.sub,
  );
}
