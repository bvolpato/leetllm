import { at, clamp, lerp } from './ink.mjs';
import {
  attention,
  canContinue,
  checkReply,
  hidden,
  initialWeights,
  labels,
  learning,
  predictions,
  projections,
  secondContext,
  tokens,
  values,
  vocabulary,
} from './examples.mjs';

function folder(p, x, y, name, active) {
  const w = 320,
    color = active ? '#eac077' : '#dedccb';
  p.path(
    [
      [x + 6, y + 27],
      [x + 6, y + 3],
      [x + 106, y + 3],
      [x + 128, y + 24],
      [x + w - 1, y + 24],
      [x + w - 1, y + 137],
      [x + 6, y + 137],
    ],
    p.ink,
    2,
    color,
    true,
  );
  p.path(
    [
      [x, y + 42],
      [x + w, y + 42],
      [x + w - 12, y + 150],
      [x + 12, y + 150],
    ],
    p.ink,
    2,
    color,
    true,
  );
  p.line(x + 13, y + 49, x + w - 14, y + 49, p.white, 2);
  p.c.font = '400 42px "Lesson Mono"';
  p.c.textAlign = 'center';
  p.c.textBaseline = 'alphabetic';
  p.c.lineWidth = 1.45;
  p.c.strokeStyle = active ? p.ink : p.sub;
  p.c.strokeText(name, x + w / 2, y + 116);
}

export function tracker(p, k) {
  const b = k.beat.beatIndex;
  const close = b < 2 && at(k, 0, 'Give the model one more prediction', 0);
  const dot = at(k, 0, 'A period lands', 0.45);
  const reject = b === 1 ? k.reveal('rejects the reply', 0.35, { captionStart: 'The four letters' }) : 0;
  const rewind = at(k, 1, 'Rewind one token', 0.65);
  const finish = b > 1 || (b === 1 && k.reveal('end here', 0, { captionStart: 'Docs can end here' }));
  const word = predictions[0];
  let title = 'Does the whole reply fit?';
  if (reject > 0 && rewind === 0 && !checkReply(predictions.join('')).allowed)
    title = 'The tracker returns the reply';
  if (finish && !canContinue(word, predictions[1])) title = 'The tracker files Docs';
  p.header('Issue tracker', title);
  const xs = [58, 440, 822],
    y = 408;
  const x = 600;
  p.c.save();
  if (close) {
    p.c.translate(x, 160);
    p.c.scale(2.8, 2.8);
    p.c.translate(-x, -y);
  }
  labels.forEach((name, i) => folder(p, xs[i], y, name, i === 1));
  // The reply and the folder outline use identical type and origin.
  const drop = at(k, 0, 'Match those four letters', 1);
  const rise = reject * (1 - rewind);
  const baseline = lerp(278, y + 116, drop) - 77 * rise;
  p.c.font = '400 42px "Lesson Mono"';
  const width = p.c.measureText(word).width;
  const punctWidth = p.c.measureText(predictions[1]).width;
  const left = x - width / 2,
    right = x + width / 2;
  const noteTop = 160;
  p.path(
    [
      [67, noteTop],
      [315, noteTop],
      [345, noteTop + 30],
      [345, noteTop + 159],
      [67, noteTop + 159],
    ],
    p.ink,
    1.5,
    p.sheet,
    true,
  );
  p.path(
    [
      [315, noteTop],
      [315, noteTop + 30],
      [345, noteTop + 30],
    ],
    p.ink,
    1,
  );
  p.label('REVIEW NOTE', 87, 196);
  p.serif('Stale guide', 87, 242, 36);
  p.type('The guide names', 87, 275, 18);
  p.type('an old button.', 87, 299, 18);
  const punct = dot * (1 - rewind);
  p.line(right + 1, y + 65, right + 1, y + 123, p.gold, close ? 2.25 : 1.5);
  if (drop < 1 || rise > 0)
    p.box(left - 14, baseline - 47, width + punctWidth * punct + 29, 61, p.sheet, p.ink, 1.5);
  p.mono(word, left, baseline, 42, p.ink);
  if (punct > 0) {
    p.c.save();
    p.c.globalAlpha = punct;
    p.mono(predictions[1], right, baseline - 22 * (1 - punct), 42, p.red);
    p.c.restore();
  }
  p.c.restore();
  if (b === 2) {
    p.label('ORIGINAL UNCONSTRAINED PREDICTIONS', 802, 204);
    p.mono('1. Docs     2. period', 802, 234, 21, p.sub);
  }
}

export function mask(p, k) {
  const b = k.beat.beatIndex;
  const slide = at(k, 1, 'slide the reader', 1.6);
  const row = b === 0 ? 0 : Math.min(2, Math.floor(slide * 2.999));
  p.header('Decoder visibility', 'Which words can guide read?');
  for (const [side, x] of [
    [0, 78],
    [1, 659],
  ]) {
    p.serif(side ? 'Causal decoder' : 'Bidirectional encoder', x, 202, 32);
    const sx = x + 104,
      sy = 273,
      w = 91,
      h = 53;
    tokens.forEach((t, j) => p.mono(t, sx + j * w + w / 2, 254, 16, p.sub, 'center'));
    tokens.forEach((t, i) => {
      p.mono(t, sx - 13, sy + i * h + 34, 17, i === (side ? row : 2) ? p.ink : p.sub, 'right');
      tokens.forEach((word, j) => {
        const open = !side || j <= i,
          selected = i === (side ? row : 2);
        const x0 = sx + w * j,
          y0 = sy + h * i;
        p.box(
          x0,
          y0,
          w - 3,
          h - 3,
          open ? (selected ? (side ? '#e6bb6b' : '#accec1') : p.faint) : p.bg,
          p.rule,
        );
        if (open) p.dot(x0 + w / 2 - 1, y0 + h / 2 - 1, selected ? 8 : 4, selected ? p.ink : p.sub);
        else {
          p.line(x0 + 33, y0 + 19, x0 + 52, y0 + 31, p.rule, 2);
          p.line(x0 + 33, y0 + 31, x0 + 52, y0 + 19, p.rule, 2);
        }
      });
    });
  }
  const target = at(k, 2, 'At guide', 0.6);
  if (b === 3) {
    p.label('GENERATION', 78, 550);
    p.mono('Known prefix   →   choose Docs   →   read Docs on the next pass', 78, 593, 24, p.sea);
  } else if (target > 0) {
    p.label('SHIFTED TRAINING TARGETS', 78, 550);
    p.mono('guide   →   Label:', 78, 589, 26, p.ink);
    p.mono('Label:   →   Docs', 659, 589, 26, p.ink);
  } else {
    p.type('Both sides of the current position', 78, 552, 22, p.sub);
    p.type('Visible prefix ends at the reader', 659, 552, 22, p.sub);
  }
}

export function mixture(p, k) {
  p.header('Attention  /  last prompt position', 'Follow the weighted steps');
  const order = [2, 1, 3];
  const fractions = [
    at(k, 1, 'Guide pulls', 1.1),
    at(k, 1, 'Stale nudges', 0.85),
    at(k, 1, 'The label prompt adds', 1.1),
  ];
  const colors = [p.sub, p.gold, p.sea, p.blue];
  p.label('SOURCE', 67, 211);
  p.label('VALUE', 282, 211);
  p.label('SHARE', 437, 211);
  tokens.forEach((t, i) => {
    const y = 265 + i * 72;
    p.line(65, y + 21, 514, y + 21, p.rule, 1);
    p.dot(77, y - 9, 7, colors[i]);
    p.mono(t, 99, y, 24);
    p.mono('[' + values[i].join(', ') + ']', 268, y, 20);
    p.mono(attention[i].toFixed(1), 447, y, 24);
  });
  const ox = 668,
    oy = 542,
    scale = 376;
  function point(v) {
    return [ox + scale * v[0], oy - scale * v[1]];
  }
  for (let i = 0; i <= 10; i++) {
    const s = (scale * i) / 10;
    p.line(ox + s, oy, ox + s, oy - scale, p.rule, i % 5 ? 0.45 : 1.25);
    p.line(ox, oy - s, ox + scale, oy - s, p.rule, i % 5 ? 0.45 : 1.25);
  }
  p.mono('0', ox - 14, oy + 12, 16, p.sub, 'right');
  p.mono('1', ox + scale, oy + 23, 16, p.sub, 'center');
  p.mono('1', ox - 12, oy - scale + 5, 16, p.sub, 'right');
  let tip = [0, 0];
  order.forEach((i, j) => {
    const f = fractions[j];
    const next = tip.map((x, d) => x + values[i][d] * attention[i] * f);
    p.arrow(...point(tip), ...point(next), colors[i], 5, 10);
    tip = next;
  });
  p.dot(...point(tip), 6, p.ink);
  if (at(k, 2, 'Those two coordinates', 0.3) > 0)
    p.mono('h = [' + hidden.map((x) => x.toFixed(1)).join(', ') + ']', 672, 605, 28, p.ink);
}

export function projection(p, k) {
  p.header('Vocabulary projection', 'Which token goes to print?');
  const first = projections[0],
    b = k.beat.beatIndex;
  const docs = at(k, 0, 'That is the score', 0.5),
    others = at(k, 1, 'Apply the same calculation', 1.5);
  const normalize = at(k, 2, 'It exponentiates', 1.5);
  const printed = at(k, 3, 'Its bar is the longest', 0.6);
  p.mono('h = [' + hidden.map((n) => n.toFixed(1)).join(', ') + ']', 55, 200, 27);
  const cols = [57, 264, 502, 716];
  ['TYPE', 'WEIGHT ROW', 'LOGIT', 'SOFTMAX PROBABILITY'].forEach((v, i) =>
    p.label(v, cols[i], 239),
  );
  vocabulary.forEach((token, i) => {
    const y = 292 + i * 62;
    p.line(55, y + 20, 1146, y + 20, p.rule, 1);
    p.mono(token === '.' ? 'period' : token, cols[0], y, 26, printed && i === 0 ? p.sea : p.ink);
    p.mono('[' + initialWeights[i].map((x) => x.toFixed(1)).join(', ') + ']', cols[1], y, 23);
    if (i === 0 ? docs > 0 : others > (i - 1) / 3)
      p.mono(first.logits[i].toFixed(2), cols[2], y, 25, p.gold);
    if (normalize > 0) {
      p.c.save();
      p.c.globalAlpha = normalize;
      p.box(
        cols[3],
        y - 18,
        575 * first.probabilities[i],
        21,
        i === 0 ? p.sea : p.blue,
      );
      p.mono(first.probabilities[i].toFixed(3), 1118, y, 22, p.ink, 'right');
      p.c.restore();
    }
  });
  const readoutY = 537;
  if (b < 2) p.mono('Docs   (0.5 × 0.2) + (1.0 × 0.8)', 57, readoutY, 24, p.sub);
  if (b === 2) p.mono('P(token) = exp(logit) / sum of all four exponentials', 57, readoutY, 23, p.sub);
  if (printed > 0) p.serif('Printed token    ' + first.selected, 57, readoutY, 36, p.sea);
}

export function training(p, k) {
  p.header('In-context examples  /  gradient updates', 'What can change between predictions?');
  const b = k.beat.beatIndex;
  if (b === 0) {
    const t = at(k, 0, 'Slide a solved note', 1.2);
    p.label('REQUEST', 69, 204);
    p.label('OUTPUT WEIGHTS', 776, 204);
    const x = lerp(200, 69, t);
    p.box(x, 238, 565, 94, p.sheet, p.rule, 2);
    p.mono('Stale guide     →     Docs', x + 23, 299, 24, p.sea);
    p.box(69, 352, 565, 116, p.sheet, p.ink, 2);
    p.type('The guide names an old button.', 94, 398, 24);
    p.mono('Label:', 94, 441, 22, p.gold);
    initialWeights.forEach((row, i) =>
      p.mono(
        vocabulary[i].padEnd(9) + '[' + row.map((n) => n.toFixed(1)).join(', ') + ']',
        777,
        261 + i * 62,
        20,
      ),
    );
    p.type('One more example to read', 69, 548, 24, p.sea);
    p.type('Fixed for this pass', 776, 548, 24, p.sub);
    return;
  }
  const step = Math.round(12 * at(k, 1, 'Follow the updates', 7));
  const state = learning[step],
    prob = state.probabilities[0];
  p.label('TRAINING TARGET', 62, 200);
  p.serif('Docs', 61, 269, 60);
  p.mono('Step  ' + step + ' / 12', 62, 336, 26);
  p.mono('Docs row  [' + state.weights[0].map((n) => n.toFixed(2)).join(', ') + ']', 62, 394, 22);
  p.mono('Loss  ' + (-Math.log(prob)).toFixed(3), 62, 449, 22, p.gold);
  const x = 571,
    y = 505,
    w = 500,
    h = 260;
  p.label('PROBABILITY OF DOCS', x, 194);
  for (const val of [0, 0.5, 1]) {
    p.line(x, y - val * h, x + w, y - val * h, p.rule, 1);
    p.mono(val.toFixed(1), x - 10, y - val * h + 4, 15, p.sub, 'right');
  }
  const pts = learning
    .slice(0, step + 1)
    .map((r, i) => [x + (w * i) / 12, y - h * r.probabilities[0]]);
  p.path(pts, p.sea, 5);
  p.dot(...pts.at(-1), 8, p.sea);
  p.mono(prob.toFixed(3), pts.at(-1)[0] + 8, pts.at(-1)[1] - 16, 22, p.sea);
  p.mono('0', x, y + 24, 15, p.sub);
  p.mono('12 steps', x + w, y + 24, 15, p.sub, 'right');
  if (b === 2) p.type('Held-out note:  “README names an old flag.”', 62, 491, 23, p.ink);
  else
    p.mono(
      vocabulary
        .map(
          (token, i) =>
            (token === '.' ? 'period' : token) + ' ' + state.probabilities[i].toFixed(3),
        )
        .join('    '),
      62,
      592,
      19,
      p.ink,
    );
}

export function decode(p, k) {
  const b = k.beat.beatIndex;
  const compareRows = at(k, 3, 'Compare two thousand', 0) === 1;
  p.header(
    'Autoregressive inference',
    compareRows ? 'What does the next pass reuse?' : 'When does a token reach the cache?',
  );
  const prefill = at(k, 0, 'Save the four keys', 1.3);
  const write = at(k, 1, 'selects Docs', 0.55);
  const store = at(k, 2, 'It supplies a new key', 0.85);
  const query = b === 2 ? k.reveal('its query can read', 1.4, { captionStart: false }) : 0;
  const period = at(k, 2, 'Now read the whole reply', 0.45);
  const words = [...tokens, ...predictions];
  const cached = (prefill === 1 ? tokens.length : 0) + Number(store === 1);
  const used = tokens.length + Number(write > 0) + Number(period > 0);
  const x = 184;
  const dx = 152;
  const slotWidth = dx - 8;
  const cacheBottom = 390;
  const center = (i) => x + dx * i + slotWidth / 2;
  const newPosition = tokens.length;
  const queryX = center(newPosition);

  p.label('TEXT', 57, 258);
  p.label('KV CACHE', 57, 361);
  p.label('One layer', 57, 386);
  words.forEach((t, i) => {
    const px = x + dx * i;
    const ready = i < cached;
    const generated = i >= newPosition && i < used;
    const pending = generated && !ready;
    p.box(px, 218, slotWidth, 63, p.sheet, generated ? p.gold : p.rule, 1.5);
    if (i < used) p.mono(t, center(i), 260, 24, generated ? p.gold : p.ink, 'center');
    p.line(center(i), 284, center(i), 315, p.rule, 1.5);
    p.box(
      px,
      320,
      slotWidth,
      cacheBottom - 320,
      ready ? p.faint : p.bg,
      ready ? p.sea : pending ? p.gold : p.rule,
      ready || pending ? 2 : 1,
    );
    if (ready) p.mono('K   V', center(i), 364, 24, p.sea, 'center');
    if (pending) p.mono('Pending', center(i), 363, 20, p.gold, 'center');
    if (i < newPosition && prefill > 0 && prefill < 1)
      p.arrow(center(i), 284, center(i), lerp(284, 317, prefill), p.sea, 3, 9);
  });
  if (b === 2 && store > 0 && query === 0)
    p.arrow(queryX, 284, queryX, lerp(284, 317, store), p.gold, 3, 9);

  if (store === 1 && query > 0) {
    const rail = 432;
    const leftTip = lerp(queryX, center(0) - dx, query);
    p.mono('Docs query', queryX, 468, 22, p.gold, 'center');
    p.line(queryX, 446, queryX, rail, p.gold, 3);
    p.line(Math.max(center(0), leftTip), rail, queryX, rail, p.gold, 3);
    for (let i = 0; i < cached; i++) {
      const target = center(i);
      const reach = clamp((target - leftTip) / dx);
      const end = lerp(rail, cacheBottom + 4, reach);
      p.arrow(target, rail, target, end, p.gold, 3, 8);
    }
  }

  if (!compareRows) {
    p.mono(used + ' text positions    ' + cached + ' cached', x, 457, 25);
    if (b === 0) {
      p.label('ONE DECODER LAYER', x, 489);
      p.mono('token vectors  →  attention + residual  →  FFN + residual', x, 521, 22, p.sub);
    } else if (b === 3) {
      if (at(k, 3, 'Earlier keys and values', 0) === 1)
        p.type('Another pass would reuse this cache and add K and V for the period.', x, 513, 23);
    } else {
      const showSecondState = at(k, 2, 'For this second toy state', 0) === 1;
      const showScores = at(k, 2, 'Compare the two leading scores', 0) === 1;
      if (b === 1 || showSecondState) {
        const context = showSecondState ? secondContext : hidden;
        p.label('TOY FINAL STATE', x, 489);
        p.mono('[' + context.map((v) => v.toFixed(1)).join(', ') + ']', x, 521, 26);
      }
      if (b === 1 || showScores) {
        const { logits } = projections[Number(showSecondState)];
        p.label('TWO LOGITS · SAME OUTPUT WEIGHTS', 530, 489);
        p.mono('Docs  ' + logits[0].toFixed(2), 530, 521, 27, p.sea);
        p.mono('period  ' + logits[1].toFixed(2), 804, 521, 27, p.gold);
      }
    }
  } else {
    p.label('PROJECTION ROWS', 57, 475);
    p.box(255, 436, 195, 67, p.faint, p.rule);
    for (let j = 0; j < 12; j++) p.line(257, 439 + 5.5 * j, 448, 439 + 5.5 * j, p.sea, 3);
    p.mono('2,048 prompt rows', 256, 521, 20);
    p.type('versus', 553, 481, 20, p.sub);
    p.box(716, 470, 189, 6, p.sea);
    p.mono('1 decode row', 716, 521, 20);
  }
}
