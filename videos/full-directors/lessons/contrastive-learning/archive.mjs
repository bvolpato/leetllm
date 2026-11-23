import {
  C,
  colors,
  fixed,
  pct,
  cue,
  fill,
  stroke,
  circle,
  arrow,
  text,
  mono,
  serif,
  title,
  bg,
  cell,
  rule,
  disk,
  end,
  filmWindow,
  shareStrip,
  dot,
} from './studio.mjs';
import {
  ANGLES,
  START,
  TAU,
  evaluate,
  archive,
  subjects,
  caption,
  scores,
  path,
  firstTurnTerms,
  firstTurnSlope,
  angleStepSize,
  vector,
  up,
  comparisonRow,
} from './examples.mjs';

export function opening(g, k) {
  const b = k.beat.beatIndex,
    three = cue(k, 2, 'third clip'),
    labels = cue(k, 1, 'Uncover the captions'),
    hits = cue(k, 1, 'Only the sleeper'),
    sent = cue(k, 2, 'Send the running puppy');
  title(g, '“Dog running”', 'Footage request');
  (three ? subjects : subjects.slice(0, 2)).forEach((sub, i) => {
    const x = three ? 84 + i * 594 : 84 + i * 892,
      w = three ? 565 : 864,
      y = three ? 320 : 275,
      h = three ? 360 : 485;
    filmWindow(g, sub, x, y, w, h, k.elapsed, true);
    if (i === 0 && !labels) {
      const mark = cue(k, 0, 'gap under', 0.45);
      if (mark) {
        g.save();
        g.globalAlpha = mark;
        const floor = y + h * 0.78;
        const paw = x + w * 0.79;
        stroke(
          g,
          [
            [paw - 8, floor - 46],
            [paw + 8, floor - 46],
            [paw, floor - 46],
            [paw, floor - 3],
            [paw - 8, floor - 3],
            [paw + 8, floor - 3],
          ],
          C.brass,
          3,
        );
        g.restore();
      }
    }
    if (labels) serif(g, caption[i], x + 8, y + h + 71, three ? 54 : 64);
    if (hits)
      mono(
        g,
        i === 1 ? '1 exact word   dog' : '0 exact words',
        x + 8,
        y + h + 128,
        32,
        i === 1 ? C.rust : C.soft,
      );
    if (sent && i === 0) {
      rule(g, x, y - 20, w, C.sea);
      text(g, b === 3 ? 'Positive pair' : 'Editor’s pick', x + w - 8, y - 40, 38, C.sea, {
        align: 'right',
      });
    }
  });
  if (b === 3) text(g, 'Search and caption → sentence vectors → comparison', 86, 956, 40, C.sea);
}

export function auditClips(g, k) {
  const b = k.beat.beatIndex,
    arrived = cue(k, 1, 'two more captions'),
    judge = cue(k, 2, 'Keep the sleeping dog'),
    hound = cue(k, 2, 'another valid answer');
  title(
    g,
    'Find footage of a dog running',
    arrived ? 'Two retrieved captions tie at cosine 0.76' : 'The target and an easy alternative',
  );
  const ids = arrived ? ['puppy', 'hound', 'sleeper'] : ['puppy', 'sky'];
  ids.forEach((sub, i) => {
    const x = 84 + i * (arrived ? 590 : 890),
      w = arrived ? 560 : 855;
    filmWindow(g, sub, x, 302, w, arrived ? 355 : 437, k.seconds, true);
    const name = {
      puppy: caption[0],
      hound: 'A hound sprints',
      sleeper: caption[1],
      sky: caption[2],
    }[sub];
    serif(g, name, x, arrived ? 738 : 817, 51);
    const label =
      sub === 'puppy'
        ? 'Designated match'
        : sub === 'sky'
          ? 'Easy negative'
          : sub === 'hound' && hound
            ? '0.76   Verified match'
            : sub === 'sleeper' && judge
              ? '0.76   Hard negative'
              : '0.76   Awaiting review';
    text(
      g,
      label,
      x,
      arrived ? 818 : 897,
      36,
      sub === 'sleeper' && judge
        ? C.rust
        : (sub === 'hound' && hound) || sub === 'puppy'
          ? C.sea
          : C.soft,
    );
  });
}

export function transfer(g, k) {
  const b = k.beat.beatIndex,
    animal = cue(k, 1, 'index by animal'),
    picked = cue(k, 2, 'sleeping dog belongs'),
    split = cue(k, 3, 'each one equal weight'),
    dist = evaluate().probs,
    t = split ? [0.5, 0.5, 0] : [1, 0, 0];
  title(
    g,
    animal ? 'Index every dog' : 'Find a running dog',
    animal ? 'Relevance rule • animal identity' : 'Relevance rule • animal and action',
  );
  subjects.forEach((s, i) => {
    let x = 84 + i * 592;
    filmWindow(g, s, x, 267, 562, 312, k.seconds, true);
    serif(g, caption[i], x, 647, 50);
    mono(g, pct(dist[i]) + ' share', x, 726, 40);
    if (b !== 1 || i === 0) {
      text(g, 'Training target   ' + pct(t[i], 0), x, 795, 35, split && i < 2 ? C.sea : C.soft);
    }
    if (picked && i === 1) {
      const slope = -up(t[i], dist[i]);
      const col = slope > 0 ? C.rust : C.sea;
      text(g, 'Verified for animal index', x, 869, 35, C.sea);
      mono(g, '∂L/∂s  ' + (slope > 0 ? '+' : '') + fixed(slope), x, 943, 38, col);
      arrow(g, x + 449, 928, x + 449, 928 + (slope > 0 ? 36 : -36), col);
      text(g, 'descent', x + 371, 1001, 27, col);
    }
  });
}

export function compass(g, k, training = false) {
  const b = k.beat.beatIndex;
  bg(g, true);
  title(
    g,
    training
      ? (b === 3 ? 'Repeat the angle update' : 'One turn of the query')
      : 'The caption coordinate system',
    training
      ? 'Fixed unit captions  /  temperature ' + fixed(TAU)
      : 'Separate encodings share one scoring space',
    true,
  );
  const turn = training ? cue(k, 1, 'Take one step', 0.85) : 0,
    travel = training ? cue(k, 3, 'next twenty-nine steps', 3.1) : 0;
  const u = travel * 29,
    lo = Math.floor(u),
    i = Math.min(30, 1 + lo),
    f = u - lo;
  const angle =
    travel > 0
      ? path[i] + (path[Math.min(30, i + 1)] - path[i]) * f
      : START + (path[1] - START) * turn;
  const x = 552,
    y = 577,
    r = 309,
    hues = [C.mint, C.coral, '#a4bdf0'];
  disk(g, x, y, r);
  ANGLES.forEach((a, i) => {
    const [ex, ey] = end(x, y, r, a);
    stroke(
      g,
      [
        [x, y],
        [ex, ey],
      ],
      hues[i],
      4,
    );
    circle(g, ex, ey, 9, hues[i], C.night, 2);
    text(
      g,
      archive[i],
      ex + (i === 0 ? 12 : i === 2 ? -13 : 0),
      ey + (i === 0 ? 34 : -20),
      32,
      hues[i],
      { align: i === 2 ? 'right' : i === 1 ? 'center' : 'left' },
    );
  });
  if (turn > 0) stroke(g, [[x, y], end(x, y, r, START)], '#abb7ae', 4, [8, 10]);
  if (turn > 0 && b < 3) {
    g.beginPath();
    g.arc(x, y, r - 41, -START, -angle);
    g.strokeStyle = C.brass;
    g.lineWidth = 5;
    g.stroke();
  }
  arrow(g, x, y, ...end(x, y, r, angle), C.cyan, 9, 24);
  circle(g, x, y, 11, C.brass);
  text(g, 'Query', x + 35, y + 60, 36, C.cyan);
  const rx = 1040;
  if (training) {
    if (b === 1 && k.reveal('slope of the loss', 0, { captionStart: false })) {
      drawFirstTurn(g, k, rx, hues, turn);
      return;
    }
    const m = evaluate(angle);
    text(g, 'A puppy runs', rx, 347, 50, C.light);
    mono(g, pct(m.probs[0]), rx, 494, 112, C.mint);
    shareStrip(g, rx, 535, 726, 45, m.probs, hues);
    text(g, 'Puppy’s share of this pool', rx, 645, 40, C.light);
    mono(
      g,
      'Start   ' + pct(evaluate(START).probs[0]) + '   ' + fixed(START, 4) + ' rad',
      rx,
      746,
      38,
      '#b1c9c6',
    );
    mono(
      g,
      'Now     ' + pct(m.probs[0]) + '   ' + fixed(angle, 4) + ' rad',
      rx,
      807,
      38,
      C.cyan,
    );
    mono(g, 'Loss    ' + fixed(m.loss, 3) + ' nats', rx, 868, 38, C.light);
  } else if (b < 2) {
    text(g, b === 0 ? 'Caption archive' : 'Unit vector tips', rx, 331, 46, C.light);
    caption.forEach((s, i) => {
      serif(g, s, rx, 453 + i * 147, 50, hues[i]);
      mono(
        g,
        vector(ANGLES[i])
          .map((v) => fixed(v))
          .join('    '),
        rx,
        502 + i * 147,
        31,
        '#b8d0cd',
      );
    });
  } else {
    text(g, 'Passage format changes', rx, 365, 43, C.light);
    ['Format each passage', 'Encode and pool again', 'Rebuild and test the index'].forEach(
      (s, i) => {
        circle(g, rx + 12, 466 + i * 142, 8, i === 2 ? C.brass : C.mint);
        text(g, s, rx + 48, 479 + i * 142, 43, C.light);
        if (i < 2)
          stroke(
            g,
            [
              [rx + 12, 483 + i * 142],
              [rx + 12, 587 + i * 142],
            ],
            '#779695',
            3,
          );
      },
    );
  }
}

function drawFirstTurn(g, k, x, hues, turn) {
  const known = '#b1c9c6';
  const cosineSlope = k.reveal('Each cosine depends', 0, { captionStart: false });
  const contributionPhrase = 'all three score derivatives contribute';
  const contributions = k.reveal(contributionPhrase, 0.9, { captionStart: false });
  const sumReady = k.elapsed >= k.wordCue(contributionPhrase).end;
  const subtract = k.reveal('Subtract three hundredths', 0, { captionStart: false });
  const columns = [x + 246, x + 455, x + 661];
  const center = { align: 'center' };
  text(g, 'Slope at the starting angle', x, 330, 46, C.light);
  mono(g, '∂L/∂score', columns[0], 433, 34, known, center);
  if (cosineSlope) mono(g, '∂score/∂θ', columns[1], 433, 34, known, center);
  if (contributions) text(g, 'Contribution', columns[2], 433, 34, known, center);
  rule(g, x, 454, 766, '#496a73');
  firstTurnTerms.forEach(({ lossPerScore, scorePerRadian, lossPerRadian }, i) => {
    const y = 516 + i * 65;
    text(g, archive[i], x, y, 39, hues[i]);
    mono(g, fixed(lossPerScore, 4), columns[0], y, 38, C.light, center);
    if (cosineSlope) {
      mono(g, '×', x + 348, y, 34, known, center);
      mono(g, fixed(scorePerRadian, 4), columns[1], y, 38, C.light, center);
    }
    if (contributions > i / firstTurnTerms.length) {
      mono(g, '≈', x + 557, y, 34, known, center);
      mono(g, fixed(lossPerRadian, 4), columns[2], y, 38, hues[i], center);
    }
  });
  if (sumReady) {
    rule(g, x, 674, 766, '#496a73');
    text(g, 'Total slope ∂L/∂θ', x, 733, 39, C.light);
    mono(g, '≈ ' + fixed(firstTurnSlope, 4), columns[2], 733, 40, C.brass, center);
  }
  if (subtract) {
    const operation = fixed(START) + ' − ' + fixed(angleStepSize) + ' × ' + fixed(firstTurnSlope, 4);
    text(g, 'Next angle', x, 816, 38, C.cyan);
    mono(g, operation, x, 880, 37, C.light);
    if (turn === 1) {
      mono(g, '≈ ' + fixed(path[1], 4) + ' rad', x + 766, 880, 39, C.cyan, { align: 'right' });
    }
  }
}

export function spread(g, k) {
  bg(g, true);
  title(g, 'Can a query find its partner?', 'Four query–passage pairs  /  unit circle', true);
  const collapse = cue(k, 0, 'Slide every pair', 1.5),
    expand = cue(k, 1, 'spread the pairs', 1.4),
    spread = 1 - collapse + expand;
  const cx = 550,
    cy = 595,
    r = 314,
    phase = 0.035 * spread;
  disk(g, cx, cy, r);
  const a = Array.from({ length: 4 }, (_, i) => ((2 * Math.PI * i) / 4) * spread),
    ps = a.map((v) => v + phase);
  a.forEach((v, i) => {
    const p = end(cx, cy, r, v),
      d = end(cx, cy, r, ps[i]);
    circle(g, ...p, 14, C.cyan);
    circle(g, ...d, 8, C.mint, C.night, 2);
  });
  text(g, 'Query', 1025, 347, 44, C.cyan);
  text(g, 'Partner', 1295, 347, 44, C.mint);
  const row = comparisonRow(
    ps.map((v) => Math.cos(v - a[0])),
    0.2,
  );
  if (k.beat.beatIndex > 0) {
    text(g, 'Probability for query 1', 1025, 460, 40, C.light);
    row.probs.forEach((p, i) => {
      mono(g, 'P' + (i + 1), 1025, 555 + i * 87, 36, C.light);
      fill(g, 1120, 523 + i * 87, 470 * p, 37, i === 0 ? C.mint : '#557987');
      mono(g, pct(p), 1630, 555 + i * 87, 35, C.light);
    });
    if (spread === 0) mono(g, 'Loss = ln 4', 1025, 932, 44, C.brass);
  } else {
    serif(
      g,
      collapse === 1 ? 'Four pairs at one point' : 'Distance within a pair',
      1025,
      568,
      56,
      C.light,
    );
    text(
      g,
      collapse === 1 ? 'Which passage belongs to query 1?' : 'Cyan query • green partner',
      1025,
      664,
      36,
      C.brass,
    );
  }
}
