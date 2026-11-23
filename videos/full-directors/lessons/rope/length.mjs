import {
  alibiSlopes,
  frequencySchedules,
  softmax,
  toBfloat16,
} from '../../../films/rope/arithmetic.mjs';
import {
  C,
  inks,
  mix,
  fmt,
  beat,
  cue,
  box,
  line,
  path,
  disk,
  label,
  num,
  title,
  pairLabel,
  plate,
  arrow,
  dial,
  strip,
  axis,
} from './drawing.mjs';

export function biased(key, slope) {
  const allowed = key <= 10,
    logit = allowed ? 4 - (10 - key) * slope : -Infinity;
  return { logit, share: softmax([logit, 4])[0], allowed };
}
function penalties(c, t) {
  const future = cue(t, 4, 'key at eleven', 0),
    key = future ? 11 : 9 - 3 * cue(t, 2, 'Move the key back', 1.35);
  title(c, future ? 'Can query ten read key eleven?' : 'How much weight reaches the older key?');
  axis(c, 300, 1600, 340, 6, 11, 1);
  const x = 300 + 260 * (key - 6);
  label(c, 'K', x, 257, 42, C.k, 'center');
  disk(c, x, 328, 12, C.k);
  label(c, 'Q and self', 1340, 219, 38, C.q, 'center');
  disk(c, 1340, 328, 10, C.q);
  ['Slope', 'Key logit', 'Self logit', 'Key share'].forEach((s, i) =>
    label(c, s, [120, 515, 1035, 1455][i], 484, 36, C.mute),
  );
  [0.5, 1 / 16].forEach((s, i) => {
    const { logit, share, allowed } = biased(key, s),
      y = 602 + 144 * i;
    num(c, i ? '1/16' : '1/2', 120, y, 60, inks[i]);
    num(
      c,
      allowed ? '4 − ' + fmt((10 - key) * s, 2) + ' = ' + fmt(logit, 2) : '−∞ (masked)',
      515,
      y,
      42,
      allowed ? C.ink : C.red,
    );
    num(c, '4.00', 1035, y, 51);
    box(c, 1455, y + 43, 330, 16, C.pale);
    box(c, 1455, y + 43, 330 * share, 16, inks[i]);
    num(c, fmt(share * 100, 1) + '%', 1455, y, 50, inks[i]);
  });
  label(
    c,
    future
      ? 'Only the self-key is permitted.'
      : 'Two visible keys with the same scaled content logit.',
    117,
    918,
    40,
    C.mute,
  );
}
function slopes(c, t) {
  const b = beat(t),
    heads = b === 1 ? 8 : 3,
    slopes = alibiSlopes(heads);
  if (b <= 2) {
    title(c, 'Construct the head slopes');
    label(
      c,
      b === 1
        ? 'H = 8     ·     power of two     ·     h counts from 1'
        : 'H = 3     ·     take H = 2, then append the first alternating slope from H = 4',
      97,
      232,
      39,
    );
    slopes.forEach((s, i) => {
      const step = b === 1 ? 210 : 440,
        x = 160 + step * i;
      label(c, 'head ' + (i + 1), x, 370, 32, C.mute);
      num(c, '1/' + Math.round(1 / s), x, 463, b === 1 ? 43 : 61, inks[i % 4]);
      box(c, x, 575, 130, 264, C.pale);
      box(c, x, 839 - (264 * s) / 0.5, 130, (264 * s) / 0.5, inks[i % 4]);
    });
    if (b === 1) num(c, 'slope(h) = 2^(−8h/H)', 100, 934, 42);
  } else {
    title(c, 'Compare odds before normalization');
    pairLabel(c, 'Extra distance', '10 slots', 112, 295);
    pairLabel(c, 'Slope', '1/2', 850, 295);
    line(c, 110, 544, 1790, 544);
    label(c, 'Older-to-newer odds    ·    equal content', 112, 635, 42);
    num(c, 'exp(−10 × ½) = ' + fmt(Math.exp(-5), 4), 108, 748, 78, C.green);
    if (b === 4)
      label(
        c,
        'Other keys change the normalized shares. This odds ratio stays fixed.',
        112,
        901,
        36,
        C.mute,
      );
  }
}
function far(c, t) {
  const advantage = 65 * cue(t, 1, 'Give that far key', 1.8),
    penalty = 16384 * alibiSlopes(8)[7],
    logit = advantage - penalty,
    w = softmax([logit, 0]);
  if (beat(t) === 4) {
    title(c, 'What did the ALiBi comparison measure?');
    label(c, 'Press et al.    ·    1.3B parameters', 99, 234, 40, C.mute);
    pairLabel(c, 'ALiBi training length', '1,024', 102, 383, C.k);
    pairLabel(c, 'Evaluation length', '2,048', 1038, 383, C.q);
    label(c, 'Matched the longer-trained sinusoidal baseline’s perplexity.', 102, 616, 47);
    label(c, 'About 11% less memory', 102, 806, 42, C.green);
    label(c, 'About 11% faster to target perplexity', 930, 806, 42, C.green);
    return;
  }
  title(c, 'Can the distant key win?');
  label(
    c,
    'Distance 16,384     ·     slope 1/256     ·     two permitted keys',
    97,
    222,
    38,
    C.mute,
  );
  pairLabel(c, 'Far content', fmt(advantage, 1), 98, 353, C.k);
  pairLabel(c, 'Distance penalty', '−' + penalty, 708, 353, C.red);
  pairLabel(c, 'Net far logit', fmt(logit, 1), 1358, 353, C.ink);
  line(c, 104, 550, 1790, 550);
  label(c, 'Self logit = 0', 103, 627, 40);
  strip(c, 104, 712, 1675, 80, w, [C.gold, C.q]);
  num(
    c,
    'far   ' + (w[0] < 0.0001 ? w[0].toExponential(2) : fmt(w[0] * 100, 1) + '%'),
    102,
    860,
    49,
    C.k,
  );
  num(c, 'self   ' + fmt(w[1] * 100, 1) + '%', 1782, 860, 49, C.q, 'right');
}
function interpolate(c, t) {
  const shrink = cue(t, 1, 'divides each position by four', 2),
    scale = mix(1, 4, shrink);
  title(c, 'Compress a position ruler');
  const x = 145,
    w = 1590;
  label(c, 'Target positions', x, 259, 46);
  [0, 4096, 8192, 12288, 16383].forEach((pos, i) => {
    const x1 = x + (w * pos) / 16383,
      x2 = x + (w * pos) / 16383 / scale,
      v = pos / scale;
    line(c, x1, 374, x2, 671, inks[i % 4], 3);
    disk(c, x1, 374, 10, inks[i % 4]);
    disk(c, x2, 671, 12, inks[i % 4]);
    num(c, pos, x1, 324, 36, C.ink, 'center');
    if (i === 0 || i === 2 || i === 4)
      num(c, fmt(v, v % 1 ? 2 : 0), x2, i === 4 ? 792 : 734, 39, inks[i % 4], 'center');
  });
  num(c, 'p′ = p / ' + fmt(scale, 2), 1070, 715, 51);
  if (beat(t) >= 2)
    label(
      c,
      'Adjacent steps are now ' + fmt(1 / scale, 2) + ' position units apart.',
      103,
      920,
      40,
      C.green,
    );
}
export function phaseProbe(id, earlyCast = false) {
  const phase = earlyCast ? toBfloat16(id) : Math.fround(id);
  return { id, phase, cosine: Math.fround(Math.cos(phase)) };
}
function precision(c, t) {
  const repaired = cue(t, 2, 'Preserve integer IDs', 0);
  const probe = beat(t) === 3;
  const boundary = cue(t, 3, 'Now try', 0);
  const first = boundary ? 2 ** 24 : probe ? 16382 : 4096;
  const rows = [first, first + 1].map((id) => phaseProbe(id, !repaired));
  const phasesVisible = !probe || (boundary
    ? cue(t, 3, 'Their cosines now match', 0)
    : cue(t, 3, 'Their cosines differ', 0));
  const cosinesVisible = !probe || (boundary
    ? cue(t, 3, 'For latency', 0)
    : cue(t, 3, 'Read down', 0));
  title(c, probe ? 'Can float32 distinguish these neighbors?' : 'Where do two indices become one?');
  if (probe)
    label(c, boundary ? 'CPU  ·  2^24 and the next integer' : 'CPU  ·  last two indices of a 16,384-token window', 100, 219, 38);
  const cols = [238, 728, 1245, 1688];
  [
    'Integer ID',
    repaired ? 'Direct float32' : 'Early bfloat16 cast',
    'Phase (rad)',
    'Cosine',
  ].forEach((v, i) => label(c, v, cols[i], 312, 39, C.mute, 'center'));
  const resultColor = rows[0].phase === rows[1].phase ? C.red : C.green;
  rows.forEach(({ id, phase, cosine }, i) => {
    const y = 485 + i * 195;
    const p = phasesVisible ? phase.toLocaleString('en-US') : '?';
    [id.toLocaleString('en-US'), p, p, cosinesVisible ? fmt(cosine, 6) : '?'].forEach((s, j) => {
      const x = cols[j];
      if (j < 3) arrow(c, x + 171, y, 0, cols[j + 1] - x - 345, C.rule, 5);
      num(c, s, x, y, j === 3 || boundary ? 46 : 58, j === 3 && cosinesVisible ? resultColor : C.ink, 'center');
    });
  });
  label(c, 'Fast pair  ·  1 radian per position', 100, 825, 36, C.mute);
  if (cue(t, 3, 'For latency', 0))
    label(c, 'GPU latency test  ·  warm up the fused RoPE kernel, then time repeated calls at serving length and dtype.', 100, 936, 33);
}
export const baseTrial = {
  width: 128, scale: 4, base: 10000, query: 16000, near: 15000, far: 1000,
};
export function scaledBase({ base, scale, width }) {
  return base * scale ** (width / (width - 2));
}
function baseExperiment(c, t) {
  const { width, scale, base, query, near, far } = baseTrial;
  const extend = cue(t, 5, 'Raise the scale', 1.6);
  const currentScale = Math.round(mix(1, scale, extend) * 100) / 100;
  const currentBase = scaledBase({ base, width, scale: currentScale });
  const ready = cue(t, 5, 'Test that base', 0);
  title(c, 'Test retrieval with the new base');
  label(c, 'Even rotary width d = ' + width + ' > 2     ·     target extension scale = ' + scale, 100, 215, 39, C.mute);
  pairLabel(c, 'Original base', base.toLocaleString('en-US'), 100, 334);
  num(c, '× ' + fmt(currentScale, 2) + '^(128/126)', 545, 417, 44);
  arrow(c, 1085, 415, 0, 185, C.k, 7);
  pairLabel(c, 'Calculated base (rounded)', ready || !extend ? Math.round(currentBase).toLocaleString('en-US') : '?', 1340, 334, C.k);
  line(c, 1340, 489, 1780, 489, C.rule, 4);
  const baseX = mix(1340, 1780, (currentBase - base) / (scaledBase(baseTrial) - base));
  disk(c, baseX, 489, 12, C.k);
  if (!ready) return;
  line(c, 100, 512, 1810, 512);
  const place = cue(t, 5, 'Put a passkey', 0);
  const move = cue(t, 5, 'then move it', 1.5);
  const second = cue(t, 5, 'then move it', 0);
  const x = (pos) => mix(345, 1475, pos / query);
  const rows = second ? [near, Math.round(mix(near, far, move))] : [near];
  rows.forEach((pos, i) => {
    const y = 673 + 142 * i;
    label(c, i ? 'Prompt B' : 'Prompt A', 100, y, 37);
    line(c, x(0), y, x(query), y, C.rule, 5);
    disk(c, x(query), y, 13, C.q);
    num(c, 'Q 16,000', x(query) + 29, y, 35, C.q);
    if (place) {
      disk(c, x(pos), y, 14, C.k);
      label(c, 'key ' + pos.toLocaleString('en-US'), x(pos), y - 49, 33, C.k, 'center');
    }
  });
  if (cue(t, 5, 'Across several passkeys', 0))
    label(c, 'Compare exact-match rates at gaps of 1,000 and 15,000 positions.', 100, 914, 35);
  if (cue(t, 5, 'Code Llama', 0))
    label(c, 'Code Llama used base 1,000,000 during long-context fine-tuning.', 100, 986, 35, C.mute);
}
function schedules(c, t) {
  const b = beat(t),
    s = frequencySchedules(4, 8);
  if (b === 1) {
    title(c, 'Map the last target index');
    pairLabel(c, 'Target position', '16,383', 101, 350);
    pairLabel(c, 'Fourfold interpolation', '4,095.75', 935, 350, C.q);
    line(c, 104, 578, 1800, 578);
    label(c, 'Last training index = 4,095', 100, 712, 50);
    label(c, 'The effective coordinate is fractional.', 100, 827, 40, C.mute);
    return;
  }
  if (b === 5) return baseExperiment(c, t);
  title(c, 'Stretch the slow pairs more');
  label(
    c,
    'Scale 4     ·     even rotary width d = 8 > 2     ·     new / original frequency',
    100,
    227,
    38,
    C.mute,
  );
  s.original.forEach((rate, i) => {
    const x = 250 + 450 * i,
      y = 740,
      h = 330,
      pi = s.pi[i] / rate,
      ntk = s.ntk[i] / rate;
    label(c, 'pair ' + i, x + 40, 341, 39, C.ink, 'center');
    box(c, x - 76, y - h * pi, 89, h * pi, C.qLight);
    box(c, x + 36, y - h * ntk, 89, h * ntk, C.k);
    num(c, fmt(pi, 2), x - 32, y + 53, 35, C.q, 'center');
    num(c, fmt(ntk, 3), x + 82, y + 53, 35, C.k, 'center');
  });
  label(c, 'PI', 94, 923, 37, C.q);
  label(c, 'NTK-aware', 196, 923, 37, C.k);
  num(
    c,
    'b′ = b × s^(d/(d−2))      ratio(i) = s^(−2i/(d−2))',
    590,
    924,
    34,
  );
}
export function bandRate(schedule, i, rounded) {
  const share = rounded ? Math.max(0, Math.min(1, (3 - i) / 2)) : schedule.gamma[i];
  const rate = share * schedule.original[i] + (1 - share) * schedule.pi[i];
  return { share, rate };
}
function bands(c, t) {
  const s = frequencySchedules(4, 8),
    show = cue(t, 3, 'Fill the bars', 0),
    rounded = cue(t, 5, 'rounded correction bounds', 0),
    bandInks = [C.q, C.violet, C.k, C.green];
  title(c, rounded ? 'Read the rounded pair-index ramp' : 'Which band needs a blend?');
  label(
    c,
    rounded
      ? '4,096 original slots     ·     scale 4     ·     correction bounds at pair indices 1 and 3'
      : '4,096 original slots     ·     scale 4     ·     blend between 1 and 32 turns',
    98,
    227,
    38,
    C.mute,
  );
  ['Rate', 'Turns in window', 'Original-rate share', 'New rate'].forEach((v, i) =>
    label(c, v, [100, 497, 988, 1520][i], 329, 36, C.mute),
  );
  s.original.forEach((r, i) => {
    const y = 427 + i * 111,
      { share: g, rate } = bandRate(s, i, rounded);
    num(c, r, 100, y, 45);
    num(c, fmt(s.turns[i], 2), 497, y, 45);
    box(c, 988, y - 16, 241, 32, C.pale);
    if (show) {
      box(c, 988, y - 16, 241 * g, 32, bandInks[i]);
      num(c, fmt(g * 100, 1) + '%', 1265, y, 32, bandInks[i]);
      num(c, rate.toFixed(i < 2 ? 2 : 6), 1520, y, 42, i === 2 ? C.k : C.ink);
    } else {
      num(c, '?', 1520, y, 42, C.mute);
    }
  });
  if (rounded)
    label(
      c,
      'Earlier turn-count ramp    ·    third pair kept ' +
        fmt(100 * s.gamma[2], 1) +
        '%    ·    ' +
        fmt(s.yarn[2], 6) +
        ' rad / step',
      98,
      931,
      37,
      C.k,
    );
  else if (show) num(c, 'γ = clip((turns − 1) / 31, 0, 1)', 98, 921, 40, C.green);
}
export function temperatureModel(a, extra) {
  const logits = [1, 0].map((v) => v * a * a);
  if (extra) logits.push(10);
  return { logits, shares: softmax(logits) };
}
function temperature(c, t) {
  const b = beat(t),
    amp = 1 + 0.1 * Math.log(4) * cue(t, 2, 'Multiplying both', 1.4),
    extra = cue(t, 4, 'one newly added dominant score', 0);
  const { logits, shares } = temperatureModel(amp, extra);
  title(c, extra ? 'Add a third, dominant logit' : 'What happens when both arrows grow?');
  label(
    c,
    'Scale 4      target amplitude = 1 + 0.1 ln(4)      ·      dot-product logits without added bias',
    100,
    230,
    37,
    C.mute,
  );
  readFactor(c, 'Q and K amplitude', amp, 105);
  readFactor(c, 'Logit factor', amp ** 2, 720);
  readFactor(c, 'Temperature', 1 / amp ** 2, 1330);
  [C.q, C.k].forEach((color, i) => {
    const y = 505 + i * 39;
    num(c, i ? 'K' : 'Q', 107, y, 28, color);
    arrow(c, 163, y, 0, 240 * amp, color, 8);
    line(c, 403, y - 11, 403, y + 11, C.mute, 2);
  });
  const x = 104,
    y = 697,
    w = 1690;
  let xNow = x;
  shares.forEach((v, i) => {
    box(c, xNow, y, w * v, 87, inks[i]);
    xNow += w * v;
  });
  label(c, 'Softmax shares', 104, 613, 40);
  logits.forEach((v, i) =>
    num(
      c,
      'z = ' + fmt(v, 2) + '    ' + fmt(100 * shares[i], 2) + '%',
      104 + i * 600,
      867,
      37,
      inks[i],
    ),
  );
  if (extra) label(c, 'New key enters with logit 10.', 107, 958, 34, C.mute);
}
function readFactor(c, s, v, x) {
  label(c, s, x, 358, 37, C.mute);
  num(c, fmt(v), x, 449, 72);
}
export const trials = [
  { location: 28400, answer: 'lime 7' },
  { location: 1200, answer: 'lime 4' },
];
const originalWindow = 8192;
const shortWavelength = originalWindow / 4;
export function llamaFrequencyRatio(wavelength) {
  const originalShare = Math.max(0, Math.min(1, (originalWindow / wavelength - 1) / 3));
  return originalShare + (1 - originalShare) / 8;
}
function wavelengthBands(c, t) {
  pairLabel(c, 'Llama 3.1 base', '500,000', 100, 221, C.q, 59);
  pairLabel(c, 'Original window', '8,192', 1000, 221, C.ink, 59);
  const x = (wavelength) => mix(235, 1790, wavelength / 12288);
  const y = (ratio) => 728 - 224 * ratio;
  const regions = [
    [0, shortWavelength, C.qLight],
    [shortWavelength, originalWindow, C.gold],
    [originalWindow, 12288, C.mint],
  ];
  label(c, 'Frequency ratio (new / original)', 100, 413, 36, C.mute);
  for (const [low, high, color] of regions)
    box(c, x(low), 469, x(high) - x(low), 266, color);
  for (const ratio of [1, 1 / 8]) {
    num(c, ratio === 1 ? '1' : '1/8', 202, y(ratio), 34, C.ink, 'right');
    line(c, x(0), y(ratio), x(12288), y(ratio), C.rule, 2, [8, 8]);
  }
  for (const wavelength of [0, shortWavelength, originalWindow, 12288]) {
    line(c, x(wavelength), 735, x(wavelength), 748, C.mute, 3);
    num(c, wavelength.toLocaleString('en-US'), x(wavelength), 776, 33, C.ink, 'center');
  }
  label(c, 'Original wavelength (positions)', x(0), 838, 36, C.mute);
  num(c, 'λ = 2π / θ', x(12288), 838, 34, C.mute, 'right');
  const showShort = cue(t, 2, 'Above eight thousand', 0);
  const showLong = cue(t, 2, 'Between those cutoffs', 0);
  if (showShort) line(c, x(0), y(1), x(shortWavelength), y(1), C.q, 8);
  if (showLong) line(c, x(originalWindow), y(1 / 8), x(12288), y(1 / 8), C.green, 8);
  const blend = cue(t, 2, 'blend the two rates', 1.25);
  if (blend > 0) {
    const end = mix(shortWavelength, originalWindow, blend);
    const points = Array.from({ length: 65 }, (_, i) => {
      const wavelength = mix(shortWavelength, end, i / 64);
      return [x(wavelength), y(llamaFrequencyRatio(wavelength))];
    });
    path(c, points, C.k, 8);
  }
  if (cue(t, 2, 'At a wavelength', 0)) {
    const px = x(4096), py = y(llamaFrequencyRatio(4096));
    disk(c, px, py, 12, C.k, C.white);
    line(c, px, py + 14, px, 735, C.k, 3, [5, 7]);
    num(c, '4,096', px, 776, 33, C.k, 'center');
    if (cue(t, 2, 'To test', 0)) num(c, '5/12', px + 28, py - 46, 39, C.k);
  }
  if (cue(t, 2, 'Which distant positions', 0))
    label(c, '128K retrieval test  ·  Question near the end. Where would you put the passkey?', 100, 956, 39);
}
function retrieval(c, t) {
  const b = beat(t);
  if (b < 5) {
    const titles = [
      'Read the checkpoint settings',
      'Llama 3.1 divides its frequency bands',
      'Gemma 3 alternates attention ranges',
      'LongRoPE2 trains at both lengths',
    ];
    title(c, titles[b - 1]);
    if (b < 3) {
      wavelengthBands(c, t);
    } else if (b === 3) {
      for (let i = 0; i < 6; i++) {
        const x = 98 + i * 290;
        plate(c, x, 370, 256, 230, i === 5 ? C.gold : C.qLight);
        label(c, i === 5 ? 'global' : 'local', x + 128, 439, 49, C.ink, 'center', 'Serif');
        num(c, i === 5 ? '1,000,000' : '10,000', x + 128, 540, 35, C.ink, 'center');
      }
      label(
        c,
        'Base in each layer     ·     larger models also receive long-context training',
        99,
        784,
        41,
      );
    } else {
      [
        'Search scale per dimension',
        'Mix original and stretched positions',
        'Measure short and distant tasks',
      ].forEach((v, i) => {
        label(c, v, 220 + i * 125, 345 + i * 202, 59, inks[i], 'left', 'Serif');
        if (i < 2) arrow(c, 164 + i * 125, 400 + i * 202, -Math.PI / 2, 94, C.rule, 6);
      });
    }
    return;
  }
  title(c, 'Can the query recover the passkey?');
  const prompt = 32768 - 2048,
    wide = 1664,
    x = 122,
    promptW = (wide * prompt) / 32768;
  label(c, '32,768 tokens total', x, 232, 38, C.mute);
  box(c, x, 297, promptW, 65, C.qLight);
  box(c, x + promptW, 297, wide - promptW, 65, C.gold);
  num(c, '30,720 prompt', x + 28, 330, 36);
  label(c, '2,048 reserved', 1812, 237, 34, C.k, 'right');
  line(c, x + promptW + 52, 266, x + promptW + 52, 292, C.k);
  const second = cue(t, 7, 'In a second prompt', 0),
    near = cue(t, 6, 'lime seven', 0),
    farAnswer = cue(t, 7, 'lime four', 0),
    judge = cue(t, 8, 'Only the nearer trial matches', 0);
  label(c, 'Model answer', 1510, 430, 32, C.mute);
  trials.slice(0, second ? 2 : 1).forEach((trial, i) => {
    const y = 525 + i * 235,
      show = i ? farAnswer : near;
    const keyX = x + (trial.location / prompt) * 1190;
    line(c, x, y, x + 1190, y, C.rule, 8);
    disk(c, keyX, y, 16, C.k);
    disk(c, x + 1190, y, 15, C.q);
    label(c, 'lime 7', keyX, y - 56, 37, C.k, 'center');
    label(c, 'query', x + 1190, y + 56, 33, C.q, 'center');
    label(c, i ? 'Far trial' : 'Near trial', x, y + 57, 35, C.mute);
    num(c, show ? trial.answer : '?', 1510, y, 49, judge ? (i ? C.red : C.green) : C.ink);
    if (judge) label(c, i ? 'miss' : 'match', 1510, y + 65, 35, i ? C.red : C.green);
  });
}
export const lengthScenes = [
  penalties,
  slopes,
  far,
  interpolate,
  precision,
  schedules,
  bands,
  temperature,
  retrieval,
];
