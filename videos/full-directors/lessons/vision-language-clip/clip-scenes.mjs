import {
  C,
  mix,
  clip,
  text,
  mono,
  serif,
  rect,
  line,
  dot,
  arrow,
  head,
  note,
  photo,
  spokeDetail,
} from './artwork.mjs';
import {
  batch,
  IMAGE_FEATURES,
  TEXT_FEATURES,
  TEMPERATURE,
  names,
  prompts,
  letters,
  arrows,
  scaledArrows,
  bowlTemplates,
  oppositeTemplates,
  contrastiveStep,
  candidateSet,
  ranking,
  rawGB,
  frac,
  pct,
} from './comparisons.mjs';

export function cue(k, beat, phrase, span = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(phrase, span);
}
export function ink(g, opacity, draw) {
  if (opacity <= 0) return;
  g.save();
  g.globalAlpha *= opacity;
  draw();
  g.restore();
}
const vec = (v, n = 2) => '[' + v.map((x) => x.toFixed(n)).join('   ') + ']';
const section = 'Image and text retrieval';

const rearWheelCaption = 'Rear wheel against brick';
const shutterCaption = 'Rear wheel against a shutter';
const optionX = 832, optionY = 627, pinnedX = 80, pinnedY = 693;

export function openingState(k) {
  const move = cue(k, 1, 'Brick shows', 1.1);
  const slide = move * move * (3 - 2 * move);
  const training = cue(k, 2, 'the shorter caption', 0);
  return {
    move,
    x: mix(optionX, pinnedX, slide),
    y: mix(optionY, pinnedY, slide),
    caption: training ? prompts[0] : rearWheelCaption,
  };
}

function captionStrip(g, label, x, y, pinned = false) {
  rect(g, x, y, 660, 80, C.white, C.line, 2);
  serif(g, label, x + 330, y + 54, 42, C.ink, 'center');
  if (pinned) dot(g, x + 330, y + 7, 6, C.red);
}

export function opening(g, k) {
  const { move, x, y, caption } = openingState(k);
  const b = k.beat.beatIndex;
  head(g, b === 2 ? 'How does CLIP learn a match?' : 'Which caption would you pin here?', section, false);
  photo(g, 0, 80, 228, 660, 440, {
    pinDrop: b === 0 ? clip(k.elapsed / 0.55) : 1,
  });
  if (b < 2) {
    text(g, 'Rear wheel', optionX, 257, 33, C.ink);
    const detailWidth = 620, detailHeight = detailWidth * 104 / 290;
    spokeDetail(g, 'rear', optionX, 277, detailWidth, detailHeight);
    ink(g, 1 - move, () => captionStrip(g, shutterCaption, optionX, 532));
    const front = cue(k, 1, 'The green shutter', 0.45);
    ink(g, front, () => {
      text(g, 'Front wheel', optionX, 543, 33, C.ink);
      spokeDetail(g, 'front', optionX, 562, detailWidth, detailHeight);
    });
  } else {
    photo(g, 1, 857, 311, 278, 185, { caption: prompts[1], angle: 0.014 });
    photo(g, 2, 1225, 311, 278, 185, { caption: prompts[2], angle: -0.014 });
    serif(g, 'One print and one caption', 854, 633, 43);
    text(g, 'Each pair supplies a training match.', 856, 690, 32, C.muted);
  }
  captionStrip(g, caption, x, y, move === 1);
}
export function towers(g, k) {
  const b = k.beat.beatIndex;
  head(g, 'Where do pixels meet words?', section);
  photo(g, 0, 94, 272, 266, 178, { pin: false });
  serif(g, '“' + prompts[0] + '”', 80, 650, 38);
  const paths = [
    [352, 'Image encoder', C.teal],
    [625, 'Text encoder', C.red],
  ];
  paths.forEach(([y, label, col], i) => {
    const flow = cue(k, 0, i ? 'a text encoder reads' : 'The image encoder reads', 1.1);
    line(g, 399, y, 728, y, C.line, 4);
    rect(g, 481, y - 48, 231, 96, C.white, col, 2);
    text(g, label, 597, y + 10, 28, col, { align: 'center' });
    line(g, 713, y, 843, y, C.line, 4);
    ink(g, flow, () => dot(g, mix(723, 838, flow), y, 7, col));
    if (flow > 0) {
      const raw = i ? TEXT_FEATURES[0] : IMAGE_FEATURES[0],
        stored = !i && cue(k, 2, 'after scaling it', 0.3) === 1;
      const v = stored ? batch.images[0] : raw;
      text(
        g,
        stored ? 'Stored unit image vector' : i ? 'Raw text vector' : 'Raw image vector',
        865,
        y - 56,
        26,
        C.muted,
      );
      v.forEach((n, j) => {
        const x = 865 + j * 194;
        rect(g, x, y - 27, 170, 55, '#dadfce');
        rect(g, x, y - 27, 170 * n, 55, i ? '#e7bca4' : '#a1cdc0');
        mono(g, n.toFixed(stored ? 3 : 2), x + 85, y + 11, 33, C.ink, 'center');
      });
    }
  });
  note(
    g,
    b === 2
      ? 'A new sentence goes through the paired text encoder.'
      : b === 1
        ? 'Both sets of three coordinates refer to the same learned space.'
        : 'The image and caption travel through separate encoders.',
  );
}
const captionBLength = Math.hypot(...arrows[1]);

export function cosineComparisonState(k) {
  const beat = k.beat.beatIndex;
  let shrink = Number(beat > 2);
  let showUnitA = beat > 2;
  let showUnitB = beat > 2;
  let showWinner = beat > 2;
  if (beat === 2) {
    const timedPhrase = (phrase) => {
      const times = k.wordCue(phrase);
      k.reveal(phrase, times.end - times.start, { captionStart: phrase });
      return times;
    };
    const completed = (phrase) => k.elapsed >= timedPhrase(phrase).end;
    const { start, end } = timedPhrase('Divide B by fifteen');
    shrink = k.elapsed >= end ? 1 : clip((k.elapsed - start) / (end - start));
    showUnitA = completed('A already has length one');
    showUnitB = completed('Its horizontal reach becomes point six');
    showWinner = completed('A wins at point eight');
  }
  const length = mix(captionBLength, 1, shrink * shrink * (3 - 2 * shrink));
  return {
    shrink,
    length,
    currentB: scaledArrows[1].map((value) => value * length),
    showUnitA,
    showUnitB,
    showWinner,
  };
}

export function cosine(g, k) {
  const b = k.beat.beatIndex;
  head(g, 'Which caption points closer to the image?', section);
  if (b === 0) {
    photo(g, 0, 91, 249, 548, 365, { caption: 'Bicycle print   ·   pair A' });
    const norm = cue(k, 0, 'Divide each coordinate', 0.45);
    text(g, 'Image vector', 747, 314, 28, C.teal);
    mono(g, vec(IMAGE_FEATURES[0]), 747, 376, 39);
    text(g, 'Length  ' + Math.hypot(...IMAGE_FEATURES[0]).toFixed(4), 747, 434, 30, C.muted);
    ink(g, norm, () => {
      text(g, 'Unit image vector', 747, 538, 28, C.teal);
      mono(g, vec(batch.images[0], 3), 747, 600, 39);
      text(g, 'Unit image · unit caption = cosine', 747, 681, 30);
    });
    note(g, 'Before dividing, check that the length is finite and greater than zero.');
    return;
  }
  const { shrink, length, currentB, showUnitA, showUnitB, showWinner } = cosineComparisonState(k);
  const axes = (x, y, scale, limit) => {
    line(g, x, y, x + scale * limit + 24, y, C.muted, 2);
    line(g, x, y, x, y - scale * limit - 15, C.line, 2);
    mono(g, '0', x - 24, y + 26, 21, C.muted);
    mono(g, String(limit), x + scale * limit, y + 33, 23, C.muted, 'center');
  };
  text(g, 'Original scale', 110, 260, 34);
  text(g, 'Unit-length close-up', 844, 260, 34);
  const ox = 130,
    oy = 658,
    scale = 24;
  axes(ox, oy, scale, 15);
  const [rawAX, rawAY] = arrows[0].map((v) => v * scale);
  const [rawBX, rawBY] = arrows[1].map((v) => v * scale);
  g.setLineDash([5, 6]);
  line(g, ox + rawBX, oy - rawBY, ox + rawBX, oy, C.line, 3);
  if (shrink > 0) line(g, ox, oy, ox + rawBX, oy - rawBY, C.line, 3);
  g.setLineDash([]);
  if (shrink > 0) {
    dot(g, ox + rawBX, oy - rawBY, 7, null, C.red, 2);
  }
  mono(g, String(arrows[1][0]), ox + rawBX, oy + 33, 23, C.red, 'center');
  arrow(g, ox, oy, ox + rawAX, oy - rawAY, C.teal, 4, 8);
  arrow(g, ox, oy, ox + currentB[0] * scale, oy - currentB[1] * scale, C.red, 5, 11);
  text(g, 'A  ' + vec(arrows[0], 1), ox + 48, oy - 13, 28, C.teal);
  text(
    g,
    (shrink > 0 ? 'B starts at ' : 'B  ') + vec(arrows[1], 0),
    ox + rawBX + 17,
    oy - rawBY + 5,
    28,
    C.red,
  );
  if (shrink > 0) {
    const lengthLabel = shrink < 1 ? 'B length ≈ ' + length.toFixed(1) : 'B length = ' + length;
    mono(g, lengthLabel, 451, 564, 30, C.red);
  }
  const xx = 870,
    yy = 658,
    ss = 375;
  axes(xx, yy, ss, 1);
  g.beginPath();
  g.arc(xx, yy, ss, -Math.PI / 2, 0);
  g.strokeStyle = C.line;
  g.lineWidth = 2;
  g.stroke();
  arrow(g, xx, yy, xx + ss, yy, C.ink, 4);
  text(g, 'Image [1, 0]', xx + ss + 19, yy + 10, 28);
  scaledArrows.forEach(([x, y], i) => {
    if (!(i ? showUnitB : showUnitA)) return;
    const col = i ? C.red : C.teal;
    const ex = xx + x * ss;
    const ey = yy - y * ss;
    if (i || showWinner) {
      g.setLineDash([5, 6]);
      line(g, ex, ey, ex, yy, col, 3);
      g.setLineDash([]);
      dot(g, ex, yy, 6, col);
      mono(g, x.toFixed(1), ex, yy + 35, 29, col, 'center');
    }
    arrow(g, xx, yy, ex, ey, col, 6);
    text(g, letters[i], ex + (i ? -25 : 17), ey + (i ? 3 : -11), 32, col, {
      align: i ? 'right' : 'left',
    });
  });
  if (b === 1) serif(g, '?', xx + 163, yy - 90, 65, C.muted, 'center');
  let takeaway = 'Which caption reaches farther to the right at unit length?';
  if (b > 2) takeaway = 'Horizontal projections on the unit image give cosines from −1 to +1.';
  else if (showWinner) takeaway = 'A reaches farther in the image direction at unit length.';
  else if (shrink === 1) takeaway = 'Both arrows now have unit length.';
  else if (shrink > 0) takeaway = 'B keeps its direction as it shortens. A stays at unit length.';
  note(g, takeaway);
}
const cols = ['A · Bicycle', 'B · Dog', 'C · Bowl'];
export function matrix(g, k) {
  head(g, 'Which nine comparisons does this batch make?', section);
  const rows = cue(k, 1, 'Do the same', 0.75),
    scaled = cue(k, 2, 'These scaled scores', 0),
    diag = cue(k, 1, 'Trace the three', 0.45);
  const values = scaled ? batch.logits : batch.cosine;
  text(g, 'Caption', 423, 242, 26, C.muted);
  cols.forEach((s, i) => text(g, s, 523 + i * 216, 295, 29, C.ink, { align: 'center' }));
  names.forEach((name, i) => {
    const y = 340 + i * 126;
    photo(g, i, 96, y - 7, 122, 81, { pin: false });
    text(g, name, 243, y + 42, 29);
    values[i].forEach((n, j) => {
      const x = 422 + j * 216;
      rect(g, x, y - 10, 198, 95, i === j && diag ? '#c1d9ca' : C.white, C.line);
      ink(g, i ? rows : cue(k, 0, 'That gives one row', 0.4), () =>
        mono(g, n.toFixed(scaled ? 2 : 3), x + 99, y + 50, 38, C.ink, 'center'),
      );
    });
  });
  const x = 1128;
  text(g, scaled ? 'Scaled score' : 'Unit-vector score', x, 389, 27, C.muted);
  serif(g, scaled ? 'logit' : 'cosine', x, 467, 62, C.teal);
  text(g, scaled ? 'cosine ÷ 0.2' : 'image · caption', x, 524, 33);
  if (rows) {
    text(g, '3 paired cells', x, 608, 29, C.teal);
    text(g, '6 alternatives', x, 656, 29);
  }
  note(
    g,
    scaled
      ? 'Fixed temperature 0.2   ·   The order stays the same.'
      : 'One image per row. One caption per column.',
  );
}
export function matrixTurn(k) {
  const turn = cue(k, 2, 'Turn the sheet', 1.6),
    column = turn >= 1;
  return {
    turn,
    column,
    values: column ? batch.columnProbabilities[0] : batch.rowProbabilities[0],
    loss: column ? batch.columnLosses[0] : batch.rowLosses[0],
  };
}
export function objective(g, k) {
  const { turn, column, values, loss } = matrixTurn(k),
    moving = turn > 0 && turn < 1,
    b = k.beat.beatIndex;
  head(g, 'What competes around the bicycle match?', section);
  const px = 404,
    py = 502,
    step = 108,
    a = (-Math.PI * turn) / 2;
  const pinX = px - 36,
    pinY = py + 38;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const dx = px - pinX + step * j,
        dy = py - pinY + step * i,
        x = pinX + dx * Math.cos(a) - dy * Math.sin(a),
        y = pinY + dx * Math.sin(a) + dy * Math.cos(a),
        on = moving ? i === 0 && j === 0 : column ? j === 0 : i === 0;
      g.save();
      g.translate(x, y);
      g.rotate(a);
      rect(g, -49, -49, 98, 98, on ? '#a8cfbe' : '#dedfce', on ? C.teal : C.line, 2);
      g.restore();
      mono(g, letters[i] + letters[j], x, y - 6, 22, C.muted, 'center');
      mono(g, batch.logits[i][j].toFixed(2), x, y + 25, 27, C.ink, 'center');
    }
  dot(g, pinX, pinY, 6, C.red);
  text(g, 'Cell letters = photo, caption', 88, 232, 24, C.muted);
  const x = 885;
  serif(
    g,
    moving
      ? 'Turning around AA'
      : column
        ? 'One caption, three prints'
        : 'One print, three captions',
    x,
    285,
    43,
  );
  if (moving) {
    text(g, 'The same nine logits turn together.', x, 443, 31, C.muted);
  } else {
    names.forEach((s, i) => {
      const y = 337 + i * 101;
      if (column) {
        photo(g, i, x, y, 96, 63, { pin: false });
        text(g, s, x + 120, y + 39, 31);
      } else {
        mono(g, letters[i], x, y + 39, 30, C.teal);
        text(g, prompts[i], x + 65, y + 39, 30);
      }
      mono(g, pct(values[i]), 1505, y + 39, 33, C.teal, 'right');
    });
    const calculated = cue(k, 0, 'Its negative log', 0.35);
    ink(g, calculated, () => mono(g, '−ln(paired share) ≈ ' + loss.toFixed(4), x, 696, 29));
  }
  if (b === 3 && cue(k, 3, 'That is the quantity', 0))
    note(
      g,
      'Mean row loss ' +
        batch.imageToTextLoss.toFixed(5) +
        '     ·     Mean column loss ' +
        batch.textToImageLoss.toFixed(5) +
        '     ·     Symmetric loss ' +
        batch.symmetricLoss.toFixed(5),
      C.teal,
    );
  else
    note(
      g,
      moving
        ? 'The pivot stays on the bicycle pair while all nine logits turn.'
        : b === 1
          ? 'If the caption becomes the query, which three cells belong together?'
          : column
            ? 'Highlighted cells share caption A. Their first letters identify the competing photos.'
            : 'Highlighted cells share photo A. Their second letters identify the competing captions.',
    );
}
const stepCurve = Array.from({ length: 65 }, (_, i) => contrastiveStep(i / 64).symmetricLoss);
export function training(g, k) {
  head(g, 'How does one training step change the bicycle pair?', section);
  const p = cue(k, 1, 'Move downhill', 2.5),
    f = contrastiveStep(p);
  const plot = { x: 166, y: 340, w: 473, h: 320 };
  const X = (v) => plot.x + ((v + 0.06) * plot.w) / 0.17,
    Y = (v) => plot.y + ((0.04 - v) * plot.h) / 0.12;
  text(g, 'Pair A  ·  unit coordinates 2 and 3', 84, 258, 28);
  line(g, plot.x, Y(0), plot.x + plot.w, Y(0), C.line);
  line(g, X(0), plot.y, X(0), plot.y + plot.h, C.line);
  for (const [x, y, s] of [
    [X(0.1), Y(0) + 29, '0.10'],
    [X(-0.05), Y(0) + 29, '−0.05'],
    [plot.x - 11, Y(-0.06), '−.06'],
  ])
    mono(g, s, x, y, 18, C.muted, 'center');
  [
    [batch.images[0], f.images[0], C.teal],
    [batch.texts[0], f.texts[0], C.red],
  ].forEach(([start, current, col]) => {
    const sx = X(start[1]),
      sy = Y(start[2]),
      ex = X(current[1]),
      ey = Y(current[2]);
    line(g, sx, sy, ex, ey, col, 4);
    dot(g, sx, sy, 10, null, col, 3);
    dot(g, ex, ey, 7, col);
  });
  dot(g, 116, 699, 8, C.teal);
  text(g, 'Image', 135, 710, 27);
  dot(g, 288, 699, 8, C.red);
  text(g, 'Caption', 308, 710, 27);
  text(g, 'Bicycle photo query   ·   share of each caption', 777, 258, 29);
  names.forEach((n, i) => {
    const y = 330 + i * 80;
    text(g, n, 778, y + 10, 27);
    rect(g, 945, y - 12, 380, 23, '#d8dacb');
    rect(g, 945, y - 12, 380 * f.rowProbabilities[0][i], 23, i ? C.gold : C.teal);
    mono(g, pct(f.rowProbabilities[0][i]), 1491, y + 10, 31, C.ink, 'right');
  });
  text(g, 'Symmetric loss', 780, 582, 27, C.muted);
  mono(g, f.symmetricLoss.toFixed(5), 1455, 587, 38, C.teal, 'right');
  const gx = 786,
    gy = 629,
    gw = 650,
    gh = 87,
    mark = (s, l) => [gx + gw * s, gy + (gh * (0.023 - l)) / 0.016];
  line(g, gx, gy + gh, gx + gw, gy + gh, C.line);
  g.beginPath();
  g.moveTo(...mark(0, stepCurve[0]));
  for (let i = 1; i / 64 <= p; i++) g.lineTo(...mark(i / 64, stepCurve[i]));
  const end = mark(p, f.symmetricLoss);
  g.lineTo(...end);
  g.strokeStyle = C.teal;
  g.lineWidth = 4;
  g.stroke();
  dot(g, ...end, 7, C.teal);
  if (cue(k, 2, 'Each gained softmax share', 0)) {
    note(g, 'All three row winners and all three column winners kept first place and gained share.');
    return;
  }
  note(
    g,
    'Embedding-level gradient step   ·   ' +
      Math.round(100 * p) +
      '% of step taken   ·   Temperature fixed at 0.2',
  );
}
export function promptState(k) {
  const dropBike = cue(k, 2, 'Remove the bicycle', 0),
    dropDog = cue(k, 2, 'Now remove the dog', 0);
  const answer = cue(k, 3, 'One hundred percent', 0);
  const twoAnswer = cue(k, 2, 'The bowl now gets', 0);
  return {
    rows: candidateSet(dropDog ? [2] : dropBike ? [1, 2] : [0, 1, 2]),
    showShare: dropDog ? Boolean(answer) : dropBike ? Boolean(twoAnswer) : true,
  };
}
function templates(g, k) {
  const { units, mean, length, direction } = bowlTemplates;
  const average = k.reveal('Average the two', 0.4);
  const normalized = k.reveal('Extend that arrow', 0.5);
  head(g, 'How do two descriptions give one class direction?', section);
  text(g, 'One class   ·   bowl of oranges', 87, 258, 34);
  const wordings = ['Oranges in a bowl', 'A bowl filled with oranges'];
  const colors = [C.blue, C.red];
  const x = 1134, y = 477, radius = 223;
  dot(g, x, y, radius, null, C.line, 2);
  text(g, 'Unit circle', x, y - radius - 11, 26, C.muted, { align: 'center' });
  units.forEach(([u, v], i) => {
    const top = 346 + i * 125;
    serif(g, '“' + wordings[i] + '”', 87, top, 38, colors[i]);
    mono(g, 'Unit vector  ' + vec(units[i], 1), 87, top + 44, 26, colors[i]);
    arrow(g, x, y, x + u * radius, y - v * radius, colors[i], 5);
    dot(g, x + u * radius, y - v * radius, 6, colors[i]);
  });
  const mx = x + mean[0] * radius, my = y - mean[1] * radius;
  ink(g, average, () => {
    g.setLineDash([5, 6]);
    line(g, x + units[0][0] * radius, y - units[0][1] * radius,
      x + units[1][0] * radius, y - units[1][1] * radius, C.muted, 2);
    g.setLineDash([]);
    arrow(g, x, y, mx, my, C.ink, 5);
    mono(g, 'Mean   ' + vec(mean, 1), 87, 602, 31);
    text(g, 'Length ' + length.toFixed(1) + '   ·   finite and greater than zero', 87, 647, 28, C.muted);
    text(g, 'Mean', mx - 13, my + 34, 25, C.ink, { align: 'right' });
  });
  ink(g, normalized, () => {
    const ex = x + direction[0] * radius, ey = y - direction[1] * radius;
    arrow(g, x, y, ex, ey, C.teal, 8);
    arrow(g, x, y, mx, my, C.ink, 3);
    mono(g, 'Class  ' + vec(direction, 1), 87, 716, 31, C.teal);
    text(g, 'Class', ex + 13, ey + 8, 27, C.teal);
  });
  if (average) dot(g, mx, my, 6, C.ink);
  dot(g, x, y, 5, C.ink);
  if (k.reveal('Opposite unit arrows', 0)) {
    line(g, 70, 127, 1530, 127, C.line);
    text(g, 'If the two arrows were opposite', 84, 159, 30);
    oppositeTemplates.units.forEach(([u], i) => arrow(g, 662, 148, 662 + 74 * u, 148, colors[i], 5));
    dot(g, 662, 148, 5, C.ink);
    mono(g, 'Mean ' + vec(oppositeTemplates.mean, 0), 815, 159, 30);
    text(g, 'No class direction to score', 1124, 159, 30, C.muted);
  } else {
    note(g, 'Two-dimensional example   ·   Both wordings describe the same class.');
  }
}
export function zeroShot(g, k) {
  const b = k.beat.beatIndex;
  if (b === 4) return templates(g, k);
  const { rows, showShare } = promptState(k);
  head(g, 'How much of the prompt set belongs to the bowl?', section);
  photo(g, 0, 86, 263, 682, 455, {
    caption: 'Original bicycle image   ·   fixed features',
    angle: -0.009,
  });
  text(g, 'Prompt', 854, 281, 25, C.muted);
  text(g, 'Cosine', 1291, 281, 25, C.muted, { align: 'right' });
  text(g, 'Share', 1505, 281, 25, C.muted, { align: 'right' });
  const all = candidateSet([0, 1, 2]);
  const bikeLift = cue(k, 2, 'Remove the bicycle', 0.48);
  const dogLift = cue(k, 2, 'Now remove the dog', 0.48);
  const fill = !showShare ? 0 : b === 3
    ? cue(k, 3, 'One hundred percent', 0.5)
    : b === 2 && bikeLift
      ? cue(k, 2, 'The bowl now gets', 0.55)
      : 1;
  const removed = [bikeLift, dogLift, 0];
  for (const row of all) {
    const lift = removed[row.i];
    const active = rows.find((entry) => entry.i === row.i);
    const y = 348 + row.i * 79 - 27 * lift;
    ink(g, 1 - lift, () => {
      text(g, prompts[row.i], 854, y, 32, row.i === 2 ? C.red : C.ink);
      mono(g, frac(row.cos), 1291, y, 30, C.ink, 'right');
      if (active && !showShare) {
        mono(g, '?', 1505, y, 33, C.muted, 'right');
      } else if (active) {
        ink(g, fill, () => mono(g, pct(active.share), 1505, y, 33, row.i === 2 ? C.red : C.teal, 'right'));
      }
    });
  }
  const bowl = rows.at(-1);
  rect(g, 852, 529, 654, 15, '#d6d6c7');
  if (fill) rect(g, 852, 529, 654 * bowl.share * fill, 15, C.red);
  if (b > 0) {
    text(g, 'Bowl weight ÷ total weight', 850, 595, 26, C.muted);
    const mid = 1180;
    mono(g, bowl.weight.toFixed(2), mid, 636, 38, C.red, 'center');
    line(g, 883, 660, 1477, 660, C.ink, 3);
    all.forEach(({ i, weight }) => {
      const x = 910 + i * 190;
      const lift = removed[i];
      rect(g, x, 691, 160, 60, null, C.line, 2);
      ink(g, 1 - lift, () => {
        const top = 691 - 22 * lift;
        rect(g, x, top, 160, 60, i === 2 ? '#f0d3c5' : '#e2ddcf');
        mono(g, weight.toFixed(2), x + 80, top + 31, 33, i === 2 ? C.red : C.ink, 'center');
      });
      if (i < 2) {
        ink(g, 1 - lift, () => mono(g, '+', x + 175, 721, 26, C.muted, 'center'));
      }
    });
  } else {
    text(g, 'Temperature 0.2', 850, 607, 30, C.muted);
  }
  note(
    g,
    'Softmax weights = exp(cosine / 0.2)     ·     ' +
      rows.length +
      (rows.length === 1 ? ' prompt remains' : ' prompts remain'),
  );
}
export function search(g, k) {
  const b = k.beat.beatIndex,
    answer = cue(k, 1, 'Open the bicycle', 0);
  head(
    g,
    b === 2 ? 'How much storage do the vectors need?' : 'Which stored print answers this sentence?',
    section,
  );
  if (b < 2) {
    const { prompt, items } = ranking(0);
    serif(g, '“' + prompt + '”', 83, 284, 46);
    items.forEach(({ i, score }, j) => {
      const x = 99 + j * 496;
      photo(g, i, x, 346, 401, 268, { caption: names[i] + '     ·     stored image' });
      if (answer && j === 0) rect(g, x - 13, 333, 427, 322, null, C.teal, 5);
      mono(g, 'cosine ' + frac(score), x, 722, 31, j === 0 && answer ? C.teal : C.ink);
    });
    note(
      g,
      answer
        ? 'An approximate index trades search work for possible misses. Measure recall against exact search.'
        : 'One text vector compared with three stored image vectors.',
    );
  } else {
    const total = cue(k, 2, 'Budget separately', 0);
    text(g, 'Stored photographs', 112, 337, 30, C.muted);
    serif(g, '10 million', 106, 437, 75);
    text(g, 'Coordinates per print', 602, 337, 30, C.muted);
    serif(g, '768', 595, 437, 76);
    text(g, 'Bytes per coordinate', 1073, 337, 30, C.muted);
    serif(g, '2', 1066, 437, 76);
    line(g, 110, 505, 1480, 505, C.line, 3);
    ink(g, total, () => {
      serif(g, rawGB.toFixed(2) + ' GB', 111, 669, 99, C.teal);
      text(g, 'Raw image vectors in decimal gigabytes', 675, 639, 38);
    });
    note(g, 'Index links, metadata, replicas and rollout overlap need additional space.');
  }
}
