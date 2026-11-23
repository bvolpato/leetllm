import { absoluteRow, absoluteExpansion } from '../../../films/rope/arithmetic.mjs';
import { contentOutputs, contentWeights } from '../../../films/rope/model.mjs';
import { CLOCK_FREQUENCIES } from '../../../films/rope/fixtures.mjs';
import {
  C,
  inks,
  mix,
  fmt,
  vec,
  beat,
  cue,
  box,
  line,
  path,
  disk,
  label,
  num,
  title,
  arrow,
  dial,
  axis,
  plate,
} from './drawing.mjs';

const words = ['dogs', 'chase', 'cats'];
const fills = [C.qLight, C.pale, C.gold];
function animal(c, id, x, y) {
  c.save();
  c.translate(x, y);
  c.fillStyle = id === 0 ? C.q : C.k;
  c.beginPath();
  if (id === 0) {
    c.moveTo(-90, -16);
    c.quadraticCurveTo(-110, -32, -113, -50);
    c.quadraticCurveTo(-115, -64, -104, -57);
    c.quadraticCurveTo(-91, -37, -63, -39);
    c.bezierCurveTo(-37, -51, -16, -42, 5, -45);
    c.lineTo(27, -76);
    c.quadraticCurveTo(39, -90, 53, -82);
    c.lineTo(63, -68);
    c.lineTo(96, -62);
    c.quadraticCurveTo(92, -41, 65, -43);
    c.lineTo(43, -43);
    c.lineTo(31, -10);
    c.lineTo(32, 0);
    c.lineTo(13, 0);
    c.lineTo(11, -26);
    c.lineTo(-39, -23);
    c.lineTo(-52, 0);
    c.lineTo(-75, 0);
    c.lineTo(-70, -27);
    c.closePath();
    c.fill();
    path(
      c,
      [
        [23, -74],
        [39, -82],
        [35, -48],
        [24, -36],
        [15, -52],
      ],
      C.ink,
      1,
      true,
    );
    disk(c, 52, -68, 3, C.white);
    disk(c, 91, -62, 4, C.ink);
  } else {
    c.moveTo(-56, -9);
    c.bezierCurveTo(-83, -19, -84, -43, -72, -66);
    c.bezierCurveTo(-56, -95, -66, -99, -76, -108);
    c.bezierCurveTo(-82, -115, -76, -121, -67, -117);
    c.bezierCurveTo(-42, -105, -39, -86, -53, -61);
    c.bezierCurveTo(-65, -36, -63, -24, -45, -22);
    c.bezierCurveTo(-45, -57, -24, -59, -3, -59);
    c.lineTo(20, -77);
    c.lineTo(18, -111);
    c.lineTo(36, -97);
    c.lineTo(55, -102);
    c.lineTo(72, -117);
    c.lineTo(70, -84);
    c.lineTo(80, -68);
    c.quadraticCurveTo(78, -56, 58, -54);
    c.lineTo(44, -9);
    c.lineTo(55, 0);
    c.lineTo(30, 0);
    c.lineTo(24, -27);
    c.lineTo(13, 0);
    c.lineTo(-58, 0);
    c.closePath();
    c.fill();
    path(
      c,
      [
        [23, -104],
        [34, -96],
        [25, -89],
      ],
      C.gold,
      1,
      true,
    );
    disk(c, 63, -81, 3, C.white);
    line(c, 72, -65, 93, -72, C.k, 2);
    line(c, 72, -62, 96, -58, C.k, 2);
  }
  c.restore();
}
function word(c, id, x, y, output, small = false, illustrated = false) {
  const w = small ? 120 : 330,
    h = small ? 70 : 158;
  plate(c, x - w / 2, y - h / 2, w, h, fills[id]);
  if (illustrated && id !== 1) animal(c, id, x, y - h / 2);
  label(c, words[id], x, y + (small ? 0 : 2), small ? 45 : 91, C.ink, 'center', 'Serif', 500);
  if (output)
    num(
      c,
      output,
      x,
      y + h / 2 + (small ? 33 : 54),
      small ? 27 : 44,
      id === 0 ? C.q : C.ink,
      'center',
    );
}
export function swapPoints(s) {
  // The slugs pass on different tracks. The output uses its slug's origin.
  return words.map((_, i) => [
    mix(365 + i * 595, 365 + (2 - i) * 595, s),
    520 + (i - 1) * (i === 2 ? 340 : 250) * Math.sin(Math.PI * s),
  ]);
}
function swap(c, t, all) {
  const b = beat(t),
    s = cue(t, 2, all ? 'Shuffle the token rows' : 'Switch the nouns', 2.2);
  if (!all && b === 3) {
    title(c, 'Slide the sentence eight places');
    axis(c, 150, 1770, 670, 3, 13, 1);
    const move = cue(t, 3, 'Slide the whole sentence', 2.2);
    [2, 1, 0].forEach((id, i) =>
      word(
        c,
        id,
        150 + (i + 8 * move) * 162,
        505,
        id === 0 ? fmt(contentOutputs[0][0]) : null,
        true,
      ),
    );
    const x = 150 + 8 * move * 162;
    line(c, x, 790, x + 324, 790, C.green, 6);
    line(c, x, 774, x, 806, C.green, 5);
    line(c, x + 324, 774, x + 324, 806, C.green, 5);
    label(c, '2 positions', x + 162, 851, 35, C.green, 'center');
    return;
  }
  if (all) {
    title(c, 'One output row per word');
  } else {
    label(c, 'All three words are visible', 96, 127, 40, C.mute);
    label(c, 'No position signal', 1820, 127, 40, C.mute, 'right');
  }
  const positions = swapPoints(s);
  words.forEach((_, id) => {
    const out = all ? vec(contentOutputs[id]) : id === 0 ? fmt(contentOutputs[0][0]) : null;
    word(c, id, ...positions[id], out, false, !all);
  });
  if (all && b === 1)
    label(c, 'Unmasked attention   ·   fixed content vectors', 960, 867, 38, C.mute, 'center');
  if (all && b === 3)
    label(
      c,
      'A causal mask changes which words a query can see.',
      960,
      867,
      47,
      C.ink,
      'center',
      'Serif',
    );
  else if (!all && b === 1 && cue(t, 1, 'When the nouns trade places', 0))
    label(c, 'Where will the number land?', 960, 864, 57, C.ink, 'center', 'Serif');
}

function grid(c, t) {
  const b = beat(t),
    masked = cue(t, 2, 'A causal decoder', 0),
    names = words;
  title(c, b === 1 ? 'Reorder both axes' : 'Who can each query read?');
  const order = cue(t, 1, 'score matrix permutes', 0) && b === 1 ? [2, 1, 0] : [0, 1, 2];
  label(c, 'KEY', 665, 214, 30, C.mute, 'center');
  label(c, 'QUERY', 110, 275, 30, C.mute);
  order.forEach((id, j) => label(c, names[id], 400 + 238 * j, 275, 46, C.ink, 'center', 'Serif'));
  order.forEach((id, i) => {
    label(c, names[id], 248, 391 + i * 146, 45, C.ink, 'right', 'Serif');
    order.forEach((kid, j) => {
      const hide = masked && j > i,
        x = 289 + 238 * j,
        y = 326 + 146 * i;
      box(c, x, y, 221, 129, hide ? C.rose : masked ? C.mint : C.qLight);
      num(
        c,
        masked ? (hide ? 'hide' : 'allow') : fmt(contentWeights[id][kid]),
        x + 110,
        y + 65,
        37,
        hide ? C.red : C.ink,
        'center',
      );
    });
  });
  const x = 1150;
  if (b === 1) {
    label(c, 'Rows are queries', x, 380, 45);
    label(c, 'Columns are keys', x, 465, 45);
    label(c, 'Permute both and carry V along.', x, 640, 35, C.mute);
  } else if (b === 2) {
    label(c, 'Parallel prefill', x, 328, 60, C.ink, 'left', 'Serif');
    num(c, '2 → 3', x, 465, 85, C.red);
    label(c, 'Key 3 is in the future.', x, 585, 39);
  } else {
    label(c, 'Identical values', x, 328, 57, C.ink, 'left', 'Serif');
    num(c, 'V₁ = V₂ = V₃', x, 442, 48);
    num(c, '= [1, 0]', x, 522, 48);
    label(c, 'Every row averages to [1, 0].', x, 661, 34, C.green);
  }
}
function routes(c, t) {
  const b = beat(t),
    names = ['absolute', 'RoPE', 'ALiBi'];
  title(c, 'Where does position first enter?');
  const xs = [530, 950, 1350, 1700],
    ops = ['embedding', 'Q and K', 'logit', 'weight'];
  for (let i = 0; i < b; i++) {
    const y = 340 + i * 229;
    const showOperation = names[i] !== 'RoPE' || cue(t, 2, 'Then position rotates', 0) === 1;
    label(c, names[i], 94, y, 57, inks[i], 'left', 'Serif');
    xs.forEach((x, j) => {
      if (j < 3) arrow(c, x + 91, y, 0, xs[j + 1] - x - 195, C.rule, 4);
      if (j === i && showOperation) {
        plate(c, x - 140, y - 56, 280, 112, [C.qLight, C.gold, C.mint][i]);
      }
      label(c, ops[j], x, y, 39, C.ink, 'center');
    });
    if (!showOperation) continue;
    label(
      c,
      ['add slot vector', 'rotate both', 'subtract slope × distance'][i],
      xs[i],
      y + 92,
      34,
      inks[i],
      'center',
    );
  }
}
function waves(c, t) {
  const b = beat(t),
    p = 2 * cue(t, 2, 'At position two', 1.1),
    row = absoluteRow(p);
  if (b < 4) {
    title(c, 'One slot index drives four pairs');
    num(c, 'p = ' + fmt(p, p % 1 ? 2 : 0), 95, 230, 45, C.q);
    CLOCK_FREQUENCIES.forEach((f, i) => {
      const x = 300 + 435 * i;
      dial(c, x, 480, 151);
      arrow(c, x, 480, Math.PI / 2 - p * f, 129, inks[i], 10);
      label(c, f + ' rad / position', x, 694, 33, C.mute, 'center');
      num(c, vec(row.slice(i * 2, i * 2 + 2)), x, 785, 37, inks[i], 'center');
    });
    if (b === 3) {
      const token = [1, 0, 0.5, 0.2, 1, -1, 0, 0.5];
      CLOCK_FREQUENCIES.forEach((_, i) => {
        const at = 2 * i,
          x = 300 + 435 * i;
        num(c, '+ ' + vec(token.slice(at, at + 2), 1), x, 855, 32, C.mute, 'center');
        num(
          c,
          '= ' + vec([token[at] + row[at], token[at + 1] + row[at + 1]]),
          x,
          933,
          36,
          C.green,
          'center',
        );
      });
      return;
    }
    label(c, 'Horizontal = sine     ·     vertical = cosine', 960, 910, 42, C.ink, 'center');
  } else {
    title(c, b === 4 ? 'How long is one full turn?' : 'Advance a sine-first pair');
    if (b === 4) {
      label(c, 'Width 512     ·     λ = 2π / frequency', 96, 235, 39, C.mute);
      [0, 64, 510].forEach((dim, i) => {
        const wavelength = 2 * Math.PI * 10000 ** (dim / 512),
          x = 350 + i * 600;
        line(c, x - 224, 502, x + 224, 502, C.rule, 2);
        const cycle = Array.from({ length: 101 }, (_, j) => [
          x - 215 + j * 4.3,
          502 - 100 * Math.sin((j * 2 * Math.PI) / 100),
        ]);
        path(c, cycle, inks[i], 7);
        num(c, '0', x - 215, 556, 28, C.mute, 'center');
        num(c, 'λ', x + 215, 556, 28, C.mute, 'center');
        label(c, 'coordinate ' + dim + '   ·   pair ' + dim / 2, x, 723, 38, C.mute, 'center');
        num(
          c,
          '≈ ' + Math.round(wavelength).toLocaleString('en-US') + ' positions',
          x,
          822,
          51,
          inks[i],
          'center',
        );
      });
    } else {
      const a = 2,
        offset = cue(t, 5, 'shared offset', 1.1) * 0.5;
      dial(c, 520, 527, 280);
      arrow(c, 520, 527, Math.PI / 2 - a, 225, C.rule, 10);
      arrow(c, 520, 527, Math.PI / 2 - a - offset, 225, C.q, 13);
      label(c, 'Horizontal = sine     Vertical = cosine', 980, 326, 40);
      num(c, 'pθ = ' + fmt(a, 1) + ' rad', 980, 452, 48);
      num(c, 'offset = ' + fmt(offset, 2) + ' rad', 980, 558, 48);
      num(c, vec([Math.sin(a + offset), Math.cos(a + offset)]), 980, 710, 55, C.q);
    }
  }
}
function mixture(c, t) {
  const b = beat(t);
  if (b <= 3) {
    const learned = cue(t, 2, 'general learned projection', 0),
      advance = cue(t, 3, 'Shift both slots', 1.2);
    const m = learned
        ? [
            [2, 0],
            [0, 1],
          ]
        : [
            [1, 0],
            [0, 1],
          ],
      model = absoluteExpansion(4 * advance, m);
    title(c, 'Expand one attention score');
    label(c, 'q = [.8, .6]     k = [.2, 1]     θ = .5', 98, 230, 38, C.mute);
    ['content', 'position'].forEach((s, j) =>
      label(c, 'key ' + s, 615 + 460 * j, 320, 42, C.ink, 'center'),
    );
    ['content', 'position'].forEach((s, i) => {
      label(c, 'query ' + s, 355, 459 + 177 * i, 39, C.ink, 'right');
      for (let j = 0; j < 2; j++) {
        const x = 405 + j * 460,
          y = 378 + i * 177;
        box(c, x, y, 425, 153, i === j ? C.pale : C.qLight);
        num(c, fmt(model.terms[2 * i + j], 4), x + 212, y + 77, 60, C.ink, 'center');
      }
    });
    pairCaption(c, 'Bilinear matrix', learned ? 'diag(2, 1)' : 'identity', 1410, 370);
    label(c, 'Positions', 1410, 596, 32, C.mute);
    num(c, fmt(5 + 4 * advance, 1) + ' / ' + fmt(2 + 4 * advance, 1), 1410, 674, 41);
    label(
      c,
      b === 3
        ? 'Position-only invariance requires transpose(S) A S = A.'
        : 'The two blue cells mix content and position.',
      96,
      881,
      42,
    );
  } else {
    const doubled = cue(t, 4, 'Concatenating', 0);
    title(c, 'Count entries in one square projection');
    const n = doubled ? 2 : 1;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        box(
          c,
          223 + i * 242,
          313 + j * 242,
          233,
          233,
          [C.qLight, C.gold, C.mint, C.pale][i + 2 * j],
        );
        num(c, '256²', 339 + i * 242, 430 + j * 242, 45, C.ink, 'center');
      }
    pairCaption(c, 'Hidden width', doubled ? '256 + 256 = 512' : '256', 947, 315);
    pairCaption(
      c,
      'Entries per Q, K or V matrix',
      String((256 * n) ** 2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      947,
      566,
    );
    label(c, 'Assume the projection keeps that width.', 947, 823, 34, C.mute);
  }
}
function pairCaption(c, s, v, x, y) {
  label(c, s, x, y, 34, C.mute);
  num(c, v, x, y + 85, 52);
}
function table(c, t) {
  const crossed = cue(t, 1, 'Index four thousand ninety-six', 0);
  title(c, 'Read beyond the last learned row');
  const x = 120;
  label(c, 'Learned position table', x, 259, 48, C.ink, 'left', 'Serif');
  [4093, 4094, 4095, 4096].forEach((id, i) => {
    const y = 357 + 110 * i;
    label(c, id, x, y, 43, id === 4096 ? C.red : C.ink);
    if (i < 3) {
      for (let j = 0; j < 7; j++)
        box(c, 302 + j * 64, y - 32, 58, 64, i === 2 && !crossed ? C.gold : C.qLight);
    } else {
      line(c, 303, y, 751, y, C.red, 2, [8, 8]);
      label(c, 'missing row', 801, y, 35, C.red);
    }
  });
  const pos = crossed ? 4096 : 4095;
  label(c, 'Sine-first formula    ·    θ = 1', 1080, 259, 42);
  dial(c, 1395, 501, 154);
  arrow(c, 1395, 501, Math.PI / 2 - pos, 131, C.k, 11);
  num(c, vec(absoluteRow(pos, [1])), 1395, 730, 48, C.k, 'center');
  label(c, 'Index ' + pos, 1395, 811, 37, C.mute, 'center');
  if (beat(t) > 1)
    label(c, 'Evaluate quality at the lengths you serve.', 960, 926, 45, C.ink, 'center', 'Serif');
}
export const wordsScenes = [
  (c, t) => swap(c, t, false),
  (c, t) => swap(c, t, true),
  grid,
  routes,
  waves,
  mixture,
  table,
];
