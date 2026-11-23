import {
  C,
  mix,
  fmt,
  pair,
  words,
  numeral,
  heading,
  box,
  line,
  circle,
  arrow,
  alpha,
  ruler,
  plane,
  cue,
  pin,
  span,
  labelValue,
  subtitle,
} from './drawing.mjs';
import {
  candidates,
  OBSERVATION_CONTEXTS,
  topK,
  support,
  jump,
  ablate,
  steer,
  fourInput,
  fourColumn,
  fourEdit,
  clampState,
  nudge,
  mse,
} from './experiment.mjs';

function slots(c, values, kept, threshold) {
  const xs = [280, 590, 900, 1210, 1520],
    base = 748,
    u = 155;
  xs.forEach((x, i) => {
    const v = values[i],
      h = v * u,
      col = [C.blue, C.pink, C.gold, C.teal, C.green][i];
    if (v > 0) box(c, x - 72, base - h, 144, h, kept === null ? C.light : C.faint, C.line, 5);
    if (v < 0) box(c, x - 72, base, 144, -h, C.faint, C.line, 4);
    if (kept?.[i] > 0) box(c, x - 72, base - kept[i] * u, 144, kept[i] * u, col, null, 4);
    numeral(c, fmt(v), x, base - Math.max(h, 0) - 43, 48, C.ink, 'center');
    words(c, 'Slot ' + (i + 1), x, 862, 37, C.muted, { align: 'center' });
  });
  line(c, 133, base, 1730, base, C.ink, 3);
  if (threshold != null) {
    const y = base - threshold * u;
    line(c, 125, y, 1742, y, C.gold, 4, [14, 9]);
    numeral(c, 'θ ' + fmt(threshold), 1740, y - 32, 30, C.gold, 'center');
  }
}
export function selection(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 3) {
    const fewer = b === 2 && cue(k, 2, 'On a new input', 0);
    const vals = fewer ? [-0.3, 2.4, -0.3, -0.3, -0.3] : candidates;
    const th = b === 3 ? Number((0.2 + 1.6 * cue(k, 3, 'Raising it', 1.6)).toFixed(2)) : null;
    const z =
      b === 1 || (b === 2 && !cue(k, 2, 'Keep slots two and four', 0))
        ? null
        : b === 3
          ? vals.map((v) => jump(v, th))
          : topK(vals, 2);
    heading(c, b === 3 ? 'Keep the full value above the threshold' : 'Which slots will write?');
    words(c, b === 3 ? 'Keep v when v > θ' : 'Nonnegative TopK     k = 2', 131, 218, 40);
    if (z) words(c, support(z) + ' active', 1550, 218, 46, C.green);
    slots(c, vals, z, th);
    return;
  }
  if (b === 4) {
    heading(c, 'How long was slot five silent?');
    subtitle(c, 'Sample window   ·   count readings above 2', 93, 210);
    const four = cue(k, 4, 'windmill sentence', 0),
      n = four ? 4 : 3;
    OBSERVATION_CONTEXTS.slice(0, n).forEach(({ text, pre }, i) => {
      const yy = 370 + i * 117;
      words(c, text, 160, yy, 47, C.ink, { face: 'Serif' });
      const v = pre[4];
      box(c, 760, yy - 16, 250 * v, 32, v > 2 ? C.green : C.muted, null, 3);
      numeral(c, fmt(v), 780 + 250 * v, yy, 40);
    });
    line(c, 1260, 291, 1260, 820, C.gold, 3, [8, 7]);
    words(c, 'θ = 2', 1260, 251, 35, C.gold, { align: 'center' });
    words(
      c,
      'Slot 5 fired on ' + (four ? 1 : 0) + ' of ' + n + ' examples.',
      156,
      895,
      42,
      C.green,
    );
    return;
  }
  if (b === 5) {
    heading(c, 'Give unused slots a learning signal');
    subtitle(c, 'Main path', 116, 260);
    words(c, 'Top 2', 117, 363, 58, C.blue);
    arrow(c, 327, 360, 636, 360, C.blue, 8);
    words(c, 'Reconstruction', 696, 362, 55);
    numeral(c, 'x̂', 1490, 362, 68);
    line(c, 116, 479, 1760, 479);
    subtitle(c, 'Separate auxiliary path', 116, 551);
    words(c, 'Inactive slots', 118, 663, 52, C.gold);
    arrow(c, 488, 661, 833, 661, C.gold, 8);
    words(c, 'Predict remaining error', 889, 661, 51);
    numeral(c, 'x − x̂', 1490, 661, 54);
    alpha(c, cue(k, 5, 'ten million tokens'), () =>
      subtitle(
        c,
        'Example recipe: 10M-token window     ·     auxiliary loss weight 1/32',
        120,
        862,
      ),
    );
    return;
  }
  heading(c, 'Resample a direction from high-loss inputs');
  const heights = [0.23, 0.35, 0.28, 0.94, 0.67, 0.16, 0.34, 0.21],
    sel = cue(k, 6, 'samples high-loss input vectors', 0);
  heights.forEach((h, i) => {
    const x = 163 + i * 129;
    box(c, x, 713 - 350 * h, 76, 350 * h, i === 3 && sel ? C.pink : C.blue, null, 4);
  });
  words(c, 'Loss on observed examples', 155, 784, 38);
  line(c, 149, 713, 1170, 713, C.muted, 3);
  alpha(c, sel, () => {
    arrow(c, 622, 352, 1270, 352, C.pink, 8);
    words(c, 'Reset direction', 1300, 352, 45, C.pink);
    words(c, 'Bias', 1300, 460, 39);
    words(c, 'Optimizer state', 1300, 535, 39);
  });
  subtitle(c, 'A resampling update can briefly raise the training loss.', 146, 904);
}
export function gated(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2 || (b === 3 && !cue(k, 3, 'JumpReLU instead', 0))) {
    heading(c, 'One slot has a switch and a magnitude');
    const gate = 0.6 - 0.45 * cue(k, 1, 'Reduce a positive gate reading', 1.15);
    const g = Number(gate > 0),
      mag = 1;
    words(c, 'Rectified gate', 122, 283, 49, C.gold);
    words(c, 'Magnitude estimate', 122, 586, 48, C.pink);
    box(c, 590, 278, 380 * gate, 25, C.gold);
    numeral(c, fmt(gate), 594, 360, 47, C.gold);
    circle(c, 950, 290, 24, C.light, C.ink, 4);
    circle(c, 1162, 290, 24, C.light, C.ink, 4);
    line(c, 950, 290, 1162, g ? 290 : 205, C.ink, 12);
    words(c, g ? 'Pass' : 'Block', 1055, 373, 37, C.ink, { align: 'center' });
    arrow(c, 630, 588, 1160, 588, C.pink, 22);
    numeral(c, fmt(mag), 626, 674, 49, C.pink);
    labelValue(c, 'Output z', g + ' × ' + fmt(mag) + ' = ' + fmt(g * mag), 1310, 463, C.pink, 49);
    if (b === 1) subtitle(c, 'L1 is charged on the rectified gate reading.', 125, 857);
    else if (b === 2) {
      words(c, 'Auxiliary reconstruction', 123, 831, 37, C.gold);
      arrow(c, 550, 831, 706, 831, C.gold, 5);
      words(c, 'decoder frozen on output path', 745, 831, 35);
      subtitle(c, 'Centering bias can still receive an input-path gradient.', 745, 899);
    } else
      subtitle(c, 'Magnitude shares parameters and receives reconstruction gradients.', 125, 857);
    return;
  }
  heading(c, 'Cross a learned threshold');
  const t = b === 3 ? cue(k, 3, 'strictly above', 1.7) : 1;
  const v = Number((0.25 + 0.6 * t).toFixed(2)),
    th = 0.5,
    z = jump(v, th),
    x = (n) => 210 + n * 792,
    y = (n) => 773 - n * 490;
  if (b === 4) box(c, x(0.45), y(1.05), x(0.55) - x(0.45), y(0) - y(1.05), '#d8bc7f66');
  ruler(c, x(0), y(0), 792, 1.15, { major: 0.25, step: 0.05 });
  line(c, x(0), y(0), x(0), y(1.05), C.muted);
  line(c, x(0), y(0), x(th), y(0), C.pink, 7);
  line(c, x(th), y(th), x(1), y(1), C.pink, 7);
  circle(c, x(th), y(th), 10, C.paper, C.pink, 3);
  circle(c, x(th), y(0), 8, C.pink);
  line(c, x(th), y(1.04), x(th), y(0), C.gold, 3, [8, 8]);
  circle(c, x(v), y(z), 14, C.ink, C.light);
  labelValue(c, 'Pre-activation', fmt(v), 1240, 290);
  labelValue(c, 'Output above θ = 0.5', fmt(z), 1240, 498, C.pink);
  words(c, 'z = v if v > θ, else 0', 1170, 717, 42);
  subtitle(
    c,
    b === 4
      ? 'A window around θ supplies a training gradient.'
      : 'The support penalty counts nonzero outputs.',
    113,
    903,
  );
}
function lens(c, cx, cy, vertical) {
  const r = 95,
    base = cy + 55,
    unit = 1140;
  circle(c, cx, cy, r, C.light, C.ink, 6);
  circle(c, cx, cy, r + 7, null, C.line, 3);
  c.save();
  c.beginPath();
  c.arc(cx, cy, r - 3, 0, Math.PI * 2);
  c.clip();
  line(c, cx - 80, base, cx + 76, base, C.muted, 4);
  for (let i = 0; i <= 5; i++)
    line(
      c,
      cx + 44,
      base - i * unit * 0.02,
      cx + (i === 0 || i === 5 ? 66 : 54),
      base - i * unit * 0.02,
      C.muted,
      2,
    );
  line(c, cx, base, cx, base - unit * vertical, C.green, 9);
  circle(c, cx, base - unit * vertical, 8, C.ink);
  c.restore();
  numeral(c, fmt(vertical), cx, cy + r + 39, 36, C.green, 'center');
}
export function ablation(c, k) {
  const b = k.beat.beatIndex + 1,
    sub = cue(k, 2, 'Substitute the reconstruction', 0);
  const removed = cue(k, 4, 'Slide both points', 1.1);
  heading(c, 'Which edit changes height?');
  numeral(c, 'score = 100 × height', 1120, 115, 47, C.green);
  const rows = [ablate(1 - removed, 0.1), ablate(1 - removed, 0.1 * (1 - sub))];
  const count = b === 1 ? 1 : 2;
  for (let i = 0; i < count; i++) {
    const { x, score } = rows[i],
      yy = count === 1 ? 604 : 414 + i * 337,
      org = 285,
      u = 380,
      end = org + u * x[0],
      top = yy - u * x[1];
    words(
      c,
      i === 0 ? 'Original activation' : sub ? 'Reconstruction' : 'Identical copy',
      132,
      yy - 166,
      49,
      C.ink,
      { face: 'Serif' },
    );
    line(c, org - 24, yy, 988, yy, C.muted, 3);
    if (x[0] > 0) arrow(c, org, yy, end, yy, C.blue, 19);
    if (x[1] > 0) line(c, end, yy, end, top, C.green, 9);
    circle(c, end, top, 10, C.ink, C.light);
    alpha(c, cue(k, 1, 'Magnify that gap', 0.65), () => {
      line(c, end + 9, top, 1118, yy - 31, C.muted, 2, [5, 8]);
      lens(c, 1230, yy - 43, x[1]);
      words(c, '3×', 1112, yy + 49, 30, C.muted);
    });
    alpha(c, cue(k, 1, 'score reads height', 0.35), () => {
      words(c, 'Score', 1480, yy - 100, 34, C.muted);
      numeral(c, fmt(score), 1476, yy - 19, 92, C.ink);
    });
    numeral(c, pair(x), 175, yy + 57, 41);
  }
  if (b === 2 && sub) subtitle(c, 'Replacement MSE = ' + fmt(mse([1, 0.1], [1, 0]), 3), 130, 929);
  if (b === 3) subtitle(c, 'Subtract [1, 0] from both. Predict the two scores.', 130, 929);
  if (b >= 4) subtitle(c, 'Both rows lose the same horizontal write.', 130, 929);
}
export function steering(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b >= 4) {
    heading(c, 'Steer feature 17 at its training hook');
    const amount = 1 + cue(k, 4, 'Double that direction', 0),
      edited = cue(k, 5, 'Add the two scaled entries', 0);
    const ys = [368, 540, 756],
      xs = [690, 1000, 1310, 1620];
    ['Original x', 'Edit ' + fmt(amount) + 'd', 'Passed onward'].forEach((name, i) =>
      words(c, name, 137, ys[i], 46, C.ink, { face: 'Serif' }),
    );
    xs.forEach((x, i) => {
      words(c, 'x' + (i + 1), x, 243, 39, C.muted, { align: 'center' });
      numeral(c, fmt(fourInput[i]), x, ys[0], 66, C.ink, 'center');
      numeral(c, fmt(amount * fourColumn[i]), x, ys[1], 61, C.teal, 'center');
      numeral(
        c,
        edited ? fmt(fourEdit(amount)[i]) : '?',
        x,
        ys[2],
        71,
        edited && fourColumn[i] ? C.teal : C.ink,
        'center',
      );
    });
    line(c, 126, 646, 1783, 646, C.muted, 3);
    return;
  }
  const a = Math.round(20 * (cue(k, 2, 'by one unit', 0.9) + cue(k, 2, 'then another', 0.9))) / 20;
  const { x, read } = steer(a);
  heading(c, 'Steer upward. Follow three readings.');
  const p = plane(c, 310, 812, 245, { xmin: -0.45, xmax: 2.25, ymin: 0, ymax: 2.32 });
  const diag = [0.6, 0.8],
    foot = diag.map((n) => n * read[2]);
  p.vector([0, 0], [1.85, 0], C.blue, 7);
  p.vector([0, 0], [1.45, (1.45 * 4) / 3], C.pink, 7);
  p.vector([0.2, 0.1], x, C.teal, 14);
  line(c, ...p.p(x), ...p.p(foot), C.pink, 4, [7, 7]);
  p.point(foot, C.pink);
  p.point(x);
  numeral(c, 'x′ = ' + pair(x), 179, 892, 42);
  numeral(c, 'α = ' + fmt(a), 920, 220, 47);
  ['Vertical', 'Horizontal', 'Overlapping'].forEach((name, i) => {
    const y = 338 + i * 163,
      col = [C.teal, C.blue, C.pink][i];
    words(c, name, 925, y, 41, col);
    const bx = 1270;
    box(c, bx, y - 9, read[i] * 174, 21, col);
    numeral(c, fmt(read[i]), 1740, y, 48, col, 'center');
  });
  subtitle(
    c,
    b === 3
      ? 'Re-encode the edited point to measure its new latent.'
      : 'x′ = x + αd     at the matching hook',
    865,
    895,
  );
}
export function clampGradient(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 5) {
    heading(c, 'Set the cached coefficient to three');
    const t = Number(cue(k, 4, 'Move the dot', 1.3).toFixed(2)),
      s = clampState(t),
      p = plane(c, 290, 800, 265, { xmin: -0.15, xmax: 2.35, ymin: 0, ymax: 1.95 });
    for (const n of [2, 3, 4]) {
      const ll = Math.max(0, n - 2 * 1.9),
        rr = Math.min(2.35, n);
      line(c, ...p.p([ll, (n - ll) / 2]), ...p.p([rr, (n - rr) / 2]), C.muted, 2, [9, 8]);
      words(c, '' + n, ...p.p([0.0, n / 2]), 33, C.muted);
    }
    p.vector([1, 0.5], s.x, C.teal, 14);
    circle(c, ...p.p([1, 0.5]), 11, null, C.ink);
    p.point(s.x);
    words(c, 'Encoder = max(0, x₁ + 2x₂)', 1040, 239, 47);
    labelValue(c, 'Edited point', pair(s.x), 1060, 377);
    labelValue(c, 'Cached coefficient', fmt(s.cached), 1060, 548, C.teal);
    labelValue(c, 'Encoder reading', fmt(s.reencoded), 1490, 548, C.pink);
    if (b >= 4) numeral(c, 'x₁ + x₂ = ' + fmt(s.sum), 1060, 801, 43);
    subtitle(c, 'Each dashed line has one encoder reading.', 159, 904);
    return;
  }
  heading(c, 'Where does a coefficient nudge go?');
  const first = cue(k, 7, 'by two tenths', 1),
    reset = cue(k, 7, 'Reset', 0),
    fixed = cue(k, 7, 'freeze the original residual', 0);
  const step = Number((0.2 * (reset ? cue(k, 7, 'repeat the nudge', 1) : first)).toFixed(2)),
    s = nudge(step, Boolean(fixed));
  const px = (v) => [210 + v[0] * 665, 674 - v[1] * 665];
  line(c, 155, 674, 1120, 674, C.line);
  arrow(c, ...px([0, 0]), ...px(s.write), C.blue, 23);
  arrow(c, ...px(s.write), ...px(s.end), C.green, 12);
  circle(c, ...px(s.end), 10, C.ink);
  words(c, fixed ? 'Residual held fixed' : 'Residual recomputed', 125, 230, 54, C.green, {
    face: 'Serif',
  });
  labelValue(c, 'Residual', pair(s.error), 1200, 305, C.green);
  labelValue(c, 'Score = 3x₁ + 100x₂', fmt(s.score), 1200, 527);
  numeral(c, 'Blue write  ' + pair(s.write), 182, 805, 39, C.blue);
  if (b === 8) numeral(c, 'Δscore / Δz = 0.6 / 0.2 = 3', 965, 867, 41, C.green);
}
