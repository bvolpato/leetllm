import assert from 'node:assert/strict';
import {
  input,
  expected,
  result,
  reward,
  response,
  correctBits,
  faultyBits,
  selected,
  negMean,
  checkSample,
  attempts,
  segmentTerms,
  segmentSplit,
  memory,
  groups,
  queueState,
  drained,
  futures,
  carriers,
  chooseSlimeCarrier,
  diskEvents,
  diskState,
  patch,
  old,
  goal,
  xor,
  applyPatch,
  versionedPatch,
  hostA,
  hostB,
  batches,
  checkpoint,
  reference,
  replay,
  skipped,
  checkExamples,
  archives,
  replayReady,
  graderRuns,
} from './examples.mjs';

const P = {
  sheet: '#f4f0e6',
  white: '#fffdf5',
  ink: '#192d35',
  muted: '#4b656a',
  rule: '#a6b2aa',
  blue: '#255495',
  ice: '#d8e8f7',
  rust: '#a34727',
  apricot: '#f3d9c1',
  green: '#136756',
  mint: '#c6e6d5',
  gold: '#efe4a2',
  night: '#132c34',
  nightLine: '#577079',
  glow: '#a8ead3',
  sky: '#91c0f4',
  peach: '#ffc295',
};
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const near = (clock, beat, words, duration = 0) =>
  clock.beat.beatIndex < beat ? 0 : clock.beat.beatIndex > beat ? 1 : clock.reveal(words, duration);
const beat = (k) => k.beat.beatIndex;
function afterClause(k, index, clause) {
  if (beat(k) !== index) return beat(k) > index;
  const { start, end } = k.wordCue(clause);
  return k.reveal(clause, end - start, { captionStart: clause }) === 1;
}
const ascii = (n) => (+n.toFixed(4)).toString().replace('-', '−');
function rect(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function line(c, x, y, u, v, color, width = 2, dash = []) {
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  c.setLineDash([]);
}
function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
function triangle(c, xy, color) {
  c.beginPath();
  xy.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function text(c, t, x, y, size = 36, color = P.ink, opt = {}) {
  c.font = (opt.weight || 400) + ' ' + size + 'px "Lesson ' + (opt.font || 'Sans') + '"';
  c.textAlign = opt.align || 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  if (opt.width) c.fillText(String(t), x, y, opt.width);
  else c.fillText(String(t), x, y);
}
function mono(c, t, x, y, size = 38, color = P.ink, align = 'left', width) {
  text(c, t, x, y, size, color, { font: 'Mono', align, width });
}
function serif(c, t, x, y, size = 62, color = P.ink, opt = {}) {
  text(c, t, x, y, size, color, { font: 'Serif', ...opt });
}
function label(c, t, x, y, color = P.muted, opt = {}) {
  text(c, t, x, y, 29, color, { weight: 600, ...opt });
}
function base(c, section, title, night = false) {
  const ink = night ? P.white : P.ink,
    rules = night ? P.nightLine : P.rule;
  rect(c, 0, 0, 1920, 1080, night ? P.night : P.sheet);
  line(c, 82, 78, 1838, 78, rules);
  rect(c, 82, 55, 15, 15, night ? P.glow : P.green);
  label(c, 'slime   /   ' + section, 111, 68, night ? P.glow : P.green);
  mono(c, 'RL   /   DATA & WEIGHTS', 1838, 66, 24, night ? '#bed5d5' : P.muted, 'right');
  serif(c, title, 82, 183, 79, ink, { width: 1760 });
}
function foot(c, main, sub = '', night = false) {
  const color = night ? P.white : P.ink;
  line(c, 84, 818, 1836, 818, night ? P.nightLine : P.rule);
  serif(c, main, 86, 885, 49, color, { width: 1750 });
  if (sub) text(c, sub, 88, 934, 31, night ? '#c3d8d9' : P.muted, { width: 1745 });
}
function strip(c, x, y, w, h, fill, holes = P.sheet) {
  rect(c, x, y, w, h, fill, 6);
  for (let i = x + 19; i < x + w - 10; i += 38) {
    rect(c, i, y + 9, 12, 6, holes, 2);
    rect(c, i, y + h - 15, 12, 6, holes, 2);
  }
}
function bracket(c, x1, x2, y, title, color = P.muted) {
  line(c, x1, y - 14, x1, y, color, 3);
  line(c, x1, y, x2, y, color, 3);
  line(c, x2, y, x2, y - 14, color, 3);
  text(c, title, (x1 + x2) / 2, y + 43, 31, color, { align: 'center', width: x2 - x1 + 30 });
}
function printTest(c, k) {
  rect(c, 81, 255, 577, 502, '#c7d2c9', 12);
  rect(c, 81, 245, 577, 502, P.white, 12);
  rect(c, 81, 245, 577, 64, P.ink, 10);
  mono(c, 'last.py', 111, 289, 34, P.white);
  mono(c, 'return xs[-1]', 109, 398, 52, P.blue);
  line(c, 109, 431, 626, 431, P.rule);
  label(c, 'Clean test', 110, 490);
  mono(c, 'xs = [3, 7]', 110, 553, 45);
  const printed = near(k, 0, 'passes its test', 0.4);
  if (printed) {
    c.save();
    c.beginPath();
    c.rect(108, 575, 520 * printed, 60);
    c.clip();
    mono(c, 'got ' + result + '   want ' + expected, 110, 621, 41);
    c.restore();
  }
  rect(c, 110, 653, 516, 65, printed === 1 ? P.mint : '#e6e7dd', 3);
  label(c, printed === 1 ? 'PASS' : 'Testing…', 132, 697, P.green);
  if (near(k, 0, 'earns one point')) label(c, 'reward ' + reward.toFixed(1), 265, 697, P.green);
}
function verifier(c, k) {
  base(c, 'Clean grader', 'Can a new test reward the same broken code?');
  mono(c, 'def last(xs):    return xs[0]', 88, 299, 52, P.blue);
  const changed = near(k, 5, 'Now use seven'),
    revealed = near(k, 6, 'It passes');
  graderRuns.forEach((r, i) => {
    const x = 86 + i * 890,
      show = i === 0 || changed,
      graded = i === 0 || revealed;
    rect(c, x, 357, 840, 391, show ? P.white : '#e6e6dc', 8);
    label(c, i ? 'Revised test' : 'Original test', x + 35, 427);
    if (!show) return;
    mono(c, 'xs = [ ' + r.xs.join(', ') + ' ]', x + 35, 526, 63);
    mono(c, 'want ' + r.wanted, x + 35, 601, 41);
    if (graded) {
      const fg = r.reward ? P.green : P.rust;
      rect(c, x + 32, 645, 771, 68, r.reward ? P.mint : P.apricot, 3);
      mono(c, 'got ' + r.actual + '     reward ' + r.reward.toFixed(1), x + 54, 692, 40, fg);
    }
  });
  foot(
    c,
    revealed
      ? 'Both positions now contain seven. The wrong index passes.'
      : 'Hold the code fixed. Change only the verifier input.',
    'Archive the verifier revision and data alongside the policy and sampled IDs.',
  );
}
function openingState(k) {
  return {
    bits: near(k, 3, 'Set the bit beside got three') ? correctBits : faultyBits,
    inspect: near(k, 2, 'Each one in this mask'),
    prefix: near(k, 3, 'Follow the input'),
    route: near(k, 4, 'SGLang sampled'),
    repairFocus: near(k, 1, 'model then wrote'),
  };
}
function opening(c, k) {
  if (beat(k) >= 5) return verifier(c, k);
  const s = openingState(k);
  base(c, 'Rollout 7', 'The test passes. Which tokens train?');
  printTest(c, k);
  const first = 730,
    w = 549;
  for (let i = 0; i < 3; i++) {
    const y = 250 + i * 175,
      owner = i === 1 ? 'Tool' : 'Model',
      fg = i === 1 ? P.rust : P.blue;
    const flash =
      (i === 0 && beat(k) === 1 && k.reveal('model asked') > 0 && k.reveal('tool replied') === 0) ||
      (i === 1 && beat(k) === 1 && k.reveal('tool replied') > 0 && !s.repairFocus) ||
      (i === 2 && beat(k) === 1 && s.repairFocus);
    label(c, owner + '   /   ' + ['call', 'observation', 'repair'][i], first, y + 17, fg);
    strip(
      c,
      first,
      y + 34,
      w * 2,
      113,
      flash ? (i === 1 ? '#f0c4a2' : '#c0daf4') : i === 1 ? P.apricot : P.ice,
      P.white,
    );
    for (let j = 0; j < 2; j++) {
      const n = 2 * i + j,
        t = response[n],
        x = first + j * w;
      if (j === 1) line(c, x, y + 51, x, y + 129, fg, 1, [6, 6]);
      mono(c, t.ink, x + 30, y + 97, 50, fg);
      mono(c, 'ID ' + t.id, x + 31, y + 125, 25, fg);
      if (s.inspect) {
        const bx = x + w - 105;
        rect(c, bx, y + 54, 70, 69, s.bits[n] ? fg : P.white, 4);
        mono(c, s.bits[n], bx + 35, y + 105, 47, s.bits[n] ? P.white : fg, 'center');
      }
    }
  }
  if (s.route) {
    foot(
      c,
      'SGLang v11     →     Data Buffer     →     Megatron v12',
      'The tool event, sampled IDs and serving version travel with the group.',
    );
  } else if (s.prefix) {
    foot(
      c,
      'Input to “return”     101   102   11   12   50   51',
      'Both tool tokens stay in context. The mask selects four model targets.',
    );
  } else if (s.inspect) {
    foot(
      c,
      selected(s.bits).length + ' open targets on the six-token response',
      'A 1 selects the token in the same cell. Which producer wrote each target?',
    );
  } else {
    foot(
      c,
      'Rollout 7     /     Fix the last-item test',
      'The same input gives three before the repair and seven in the clean copy.',
    );
  }
}
function ledgerState(k) {
  const short = near(k, 3, 'Shorten the mask');
  const bits = short ? correctBits.slice(0, -2) : correctBits;
  return {
    bits,
    short,
    present: near(k, 1, 'Align the sampled'),
    solved: near(k, 2, 'The mean is'),
    valid: checkSample(bits),
  };
}
function routing(c, k) {
  base(c, 'SGLang router', 'What does a session key tell you?');
  label(c, 'Request', 90, 290);
  label(c, 'Consistent hashing', 743, 290);
  label(c, 'Serving workers', 1460, 290);
  const again = near(k, 4, 'next tool turn');
  const toWorker = near(k, 4, 'same worker', 0.55);
  const tag = (y, n) => {
    strip(c, 92, y, 466, 122, P.ice);
    mono(c, 'Turn ' + n + '   /   s7', 124, y + 76, 42, P.blue);
  };
  tag(361, 1);
  if (again) tag(557, 2);
  line(c, 558, 421, 785, 421, P.blue, 4);
  if (again) {
    line(c, 560, 621, 657, 621, P.blue, 4);
    line(c, 657, 621, 657, 421, P.blue, 4);
  }
  dot(c, 900, 421, 115, P.ink);
  mono(c, 's7', 900, 444, 66, P.white, 'center');
  line(c, 1015, 421, 1451, 421, P.blue, 6);
  if (toWorker > 0) dot(c, mix(1031, 1436, toWorker), 421, 12, P.blue);
  rect(c, 1451, 365, 373, 112, P.mint, 5);
  mono(c, 'Worker A', 1638, 436, 42, P.green, 'center');
  rect(c, 1451, 557, 373, 112, '#e3e5d9', 5);
  mono(c, 'Worker B', 1638, 629, 42, P.muted, 'center');
  foot(
    c,
    'Same session key     /     same worker in this example',
    'Reuse a cached prefix. Use sampled IDs, tool events and stop reasons to establish provenance.',
  );
}
function ledger(c, k) {
  if (beat(k) === 4) return routing(c, k);
  const s = ledgerState(k);
  base(c, 'Data Buffer', 'What reached the loss?');
  label(c, 'Prompt', 82, 287);
  label(c, 'Response suffix   /   rollout 7', 490, 287);
  rect(c, 82, 320, 345, 340, '#e3e4d9', 8);
  mono(c, '101  102', 255, 467, 48, P.muted, 'center');
  label(c, 'Context', 255, 543, P.muted, { align: 'center' });
  const x0 = 478,
    cw = 224;
  response.forEach((t, i) => {
    const x = x0 + i * cw,
      fg = t.bit ? P.blue : P.rust;
    rect(c, x, 320, cw - 5, 340, t.bit ? P.ice : P.apricot, 4);
    label(c, t.owner, x + cw / 2, 369, fg, { align: 'center' });
    mono(c, 'ID ' + t.id, x + cw / 2, 436, 44, fg, 'center');
    line(c, x + 18, 461, x + cw - 22, 461, fg, 1);
    mono(
      c,
      i < s.bits.length ? 'mask ' + s.bits[i] : 'missing',
      x + cw / 2,
      525,
      35,
      i < s.bits.length ? P.ink : P.rust,
      'center',
    );
    if (s.present) mono(c, ascii(t.lp), x + cw / 2, 620, 45, fg, 'center');
  });
  bracket(c, 483, 1810, 681, '6 response positions');
  if (s.short)
    foot(
      c,
      'Hold this sample     /     ' + s.bits.length + ' mask entries for 6 positions',
      'IDs 13 and 14 have no mask entries. Preserve the complete IDs, status, reward and serving version.',
    );
  else if (s.solved)
    foot(
      c,
      '−(−0.2 − 0.3 − 0.4 − 0.5) / ' +
        selected(s.bits).length +
        '  =  ' +
        negMean(s.bits).toFixed(2),
      'Negative mean sampled log probability on model targets',
    );
  else if (s.present)
    foot(
      c,
      'Which entries supply the sum and the divisor?',
      'Aligned log probabilities appear on the bottom row. The tool slots carry placeholders.',
    );
  else
    foot(
      c,
      '2 prompt IDs     +     6 response IDs',
      'A tool observation occupies a position even when it carries zero target weight.',
    );
}
function identity(c, k) {
  base(c, 'Data Buffer', 'How many executions came from one prompt?');
  const leafX = 979,
    leafW = 219;
  dot(c, 215, 520, 85, P.ink);
  serif(c, 'P7', 215, 542, 62, P.white, { align: 'center' });
  label(c, 'Prompt group', 215, 675, P.muted, { align: 'center' });
  line(c, 300, 520, 433, 520, P.muted, 4);
  line(c, 433, 336, 433, 704, P.muted, 4);
  attempts.forEach((a, i) => {
    const y = 336 + i * 184;
    line(c, 433, y, 566, y, P.muted, 4);
    text(c, 'Rollout ' + a.id, 587, y + 15, 44, P.blue);
    line(c, 812, y, 955, y, P.rule, 3);
    for (let j = 0; j < a.segments; j++) {
      strip(c, leafX + j * 252, y - 53, leafW, 106, P.ice);
      mono(c, a.id + '.' + (j + 1), leafX + j * 252 + leafW / 2, y + 15, 42, P.blue, 'center');
    }
  });
  foot(
    c,
    near(k, 0, 'That makes three')
      ? '1 prompt group     /     3 rollout IDs     /     6 Samples'
      : 'Count the independent attempts. Then count their segments.',
    'Each segment retains its execution ID and its sampled policy version.',
  );
}
function segmentState(k) {
  const movement = smooth(near(k, 2, 'Slide the divider left', 0.85));
  const originalShares = afterClause(k, 1, 'The two pairs contribute one and three');
  const revisedShares = [
    afterClause(k, 2, 'One divided by four gives a quarter'),
    afterClause(k, 2, 'Fifteen divided by four gives three and three quarters'),
  ];
  return {
    movement,
    cut: movement === 1 ? 1 : 2,
    sharesVisible: movement === 1 ? revisedShares : [originalShares, originalShares],
    totalVisible:
      movement === 1 ? afterClause(k, 2, 'The two shares still add to four') : originalShares,
    local: afterClause(k, 3, 'one over one and fifteen over three add to six'),
    halve: afterClause(k, 3, 'Halving both advantages after the shared division would instead give two'),
  };
}
function contributionBar(c, name, y, shares) {
  const x = 470,
    scale = 205;
  label(c, name, 90, y + 31);
  rect(c, x, y, scale * shares[0], 40, P.blue);
  rect(c, x + scale * shares[0], y, scale * shares[1], 40, P.green);
  mono(c, ascii(shares[0] + shares[1]), x + scale * (shares[0] + shares[1]) + 20, y + 31, 34);
}
function segments(c, k) {
  if (beat(k) === 0) return identity(c, k);
  const s = segmentState(k),
    a = segmentSplit(s.cut),
    x = 259,
    w = 356,
    y = 519;
  const recut = beat(k) === 2;
  const moving = s.movement > 0 && s.movement < 1;
  base(c, 'Rollout 7', 'Move the cut. Keep each token’s term.');
  label(c, 'Fixed token loss', 83, 286);
  const boundary = x + w * (2 - s.movement);
  for (let i = 0; i < 4; i++) {
    const t = selected(correctBits)[i],
      tx = x + i * w;
    const transferring = moving && i === 1;
    const ink = transferring ? P.ink : i < s.cut ? P.blue : P.green;
    const fill = transferring ? '#c4cdc4' : i < s.cut ? '#98bde4' : '#8bc6ac';
    const height = segmentTerms[i] * 29;
    rect(c, tx + 24, y - height, w - 48, height, fill, 2);
    mono(c, segmentTerms[i], tx + w / 2, y - height - 16, 51, ink, 'center');
    mono(c, t.ink + '  ·  ' + t.id, tx + w / 2, y + 53, 35, ink, 'center');
  }
  line(c, x, y, x + 4 * w, y, P.ink, 3);
  line(c, x + w, 255, x + 2 * w, 255, P.rule, 3);
  triangle(
    c,
    [
      [boundary - 16, 245],
      [boundary + 16, 245],
      [boundary, 269],
    ],
    P.ink,
  );
  if (!moving) {
    const at = x + s.cut * w;
    const format = (i) => {
      if (s.sharesVisible[i]) {
        return a.subtotals[i] + ' / ' + a.denominator + ' = ' + ascii(a.shares[i]);
      }
      const count = a.parts[i].length;
      return count + (count === 1 ? ' token' : ' tokens');
    };
    line(c, at, 312, at, 597, P.ink, 4);
    bracket(c, x + 6, at - 9, 612, 'A    ' + format(0), P.blue);
    bracket(c, at + 9, x + 4 * w - 6, 612, 'B    ' + format(1), P.green);
  }
  if (recut) {
    contributionBar(c, 'Before cut', 689, segmentSplit(2).shares);
    if (s.movement === 1 && s.totalVisible) contributionBar(c, 'After cut', 753, a.shares);
  } else if (s.totalVisible) {
    contributionBar(c, 'Whole-rollout mean', 689, a.shares);
    if (s.local)
      contributionBar(
        c,
        s.halve ? 'Extra halving' : 'Local means',
        753,
        s.halve ? a.shares.map((v) => v / 2) : a.local,
      );
  }
  if (s.halve)
    foot(
      c,
      'Extra halving     (' +
        ascii(a.shares[0]) +
        ' + ' +
        ascii(a.shares[1]) +
        ') / 2 = ' +
        ascii(a.total / 2),
      'The shared denominator already accounts for the four selected tokens in this execution.',
    );
  else if (s.local)
    foot(
      c,
      'Local means     ' +
        a.subtotals[0] +
        ' / ' +
        a.parts[0].length +
        '  +  ' +
        a.subtotals[1] +
        ' / ' +
        a.parts[1].length +
        '  =  ' +
        a.localTotal,
      'The upper bar keeps the shared denominator. The lower bar divides by each segment’s own count.',
    );
  else
    foot(
      c,
      s.totalVisible && (!recut || s.movement === 1)
        ? 'Combined contribution     ' +
            ascii(a.shares[0]) +
            ' + ' +
            ascii(a.shares[1]) +
            ' = ' +
            a.total
        : 'One execution uses one ' + a.denominator + '-token denominator.',
      'Per-rollout token mean   /   fixed terms   /   same four sampled targets',
    );
}

function moduleRail(c, y, name, train, serve, { over = 0, ghost = false } = {}) {
  const x = 115,
    cell = 72,
    n = memory.capacity,
    plateW = n * cell + 33;
  text(c, name, x, y - 26, 34, P.white, { weight: 600 });
  for (let i = 0; i < n * 3; i++) rect(c, x + 19 + i * 24, y + 112, 12, 26, '#d7b57b');
  rect(c, x, y, plateW, 118, '#4a7476', 10);
  rect(c, x + 11, y + 11, plateW - 22, 95, '#203f46', 6);
  for (let i = 0; i < n; i++) {
    const xx = x + 18 + i * cell;
    const fill = i < train ? P.sky : i < train + serve ? P.glow : '#415a5c';
    rect(c, xx, y + 20, cell - 7, 77, fill, 4);
    for (let pin = 0; pin < 3; pin++) {
      rect(c, xx + 11 + pin * 18, y + 13, 6, 6, '#a3b4a9');
      rect(c, xx + 11 + pin * 18, y + 98, 6, 6, '#a3b4a9');
    }
    line(c, xx + 12, y + 80, xx + cell - 20, y + 80, '#507278', 2);
    dot(c, xx + 11, y + 31, 2.5, '#507278');
  }
  dot(c, x + 7, y + 8, 3, '#e6d1a4');
  dot(c, x + plateW - 7, y + 110, 3, '#e6d1a4');
  const edge = x + plateW + 2;
  if (ghost) {
    line(c, edge, y - 9, edge, y + 141, P.peach, 4, [9, 6]);
    for (let i = 0; i < over; i++) {
      const xx = edge + 11 + i * cell;
      rect(c, xx, y + 20, cell - 7, 77, '#8a5f48', 4);
      line(c, xx + 12, y + 81, xx + cell - 20, y + 34, P.peach, 3);
    }
    label(c, 'Beyond capacity', edge + 16, y + 170, P.peach);
  }
}
function placementState(k) {
  const split = near(k, 2, 'Decouple the workers');
  const propose = near(k, 1, 'Only four');
  const single = near(k, 1, 'keep training resident');
  const release = near(k, 1, 'Release it');
  const load = near(k, 1, 'loading generation');
  return {
    split,
    proposal: propose && !single,
    train: split || !release ? memory.train : 0,
    serve: split || load ? memory.serve : propose && !single ? memory.capacity - memory.train : 0,
  };
}
function synchronousRound(c, k) {
  const stages = ['Collect rollout', 'Slow verifier', 'Train', 'Sync', 'Next rollout'];
  const when = [
    'In a synchronous round',
    'complete rollout',
    'trains',
    'then synchronizes',
    'before the next round',
  ];
  let active = 0;
  when.forEach((p, i) => {
    if (near(k, 3, p)) active = i;
  });
  base(c, 'Round boundary', 'When can the next rollout start?', true);
  label(c, 'Ordered events', 88, 318, P.glow);
  const x = 91,
    w = 345;
  line(c, x + 70, 496, x + 5 * w - 120, 496, P.nightLine, 4);
  stages.forEach((name, i) => {
    const xx = x + i * w + w / 2,
      done = i < active,
      on = i === active,
      fg = on ? P.peach : done ? P.glow : '#9cb1b4';
    dot(c, xx, 496, 37, on ? P.peach : done ? P.glow : P.nightLine);
    dot(c, xx, 496, on ? 20 : done ? 9 : 26, P.night);
    text(c, name, xx, 610, 37, fg, { align: 'center' });
  });
  mono(c, 'train.py', 88, 746, 37, P.sky);
  foot(
    c,
    'Rollout completion releases training. Sync releases the next round.',
    'Mark generation, the wait and update_weights in the pinned entry point.',
    true,
  );
}
function placement(c, k) {
  if (beat(k) === 3) return synchronousRound(c, k);
  const s = placementState(k);
  base(c, 'Ray placement', 'Will both working sets fit?', true);
  rect(c, 91, 232, 34, 34, P.sky, 5);
  text(c, 'Training   12 GiB', 141, 261, 38, P.white);
  rect(c, 607, 232, 34, 34, P.glow, 5);
  text(c, 'Generation   10 GiB', 657, 261, 38, P.white);
  label(c, '1 cell = 1 GiB', 1819, 261, P.glow, { align: 'right' });
  const over = memory.train + memory.serve - memory.capacity;
  if (s.split) {
    moduleRail(c, 367, 'GPU 0   /   Megatron', s.train, 0);
    moduleRail(c, 613, 'GPU 1   /   SGLang', 0, s.serve);
    mono(c, s.train + ' / ' + memory.capacity + ' GiB', 1816, 439, 44, P.sky, 'right');
    mono(c, s.serve + ' / ' + memory.capacity + ' GiB', 1816, 685, 44, P.glow, 'right');
  } else {
    moduleRail(
      c,
      418,
      s.proposal
        ? 'One GPU   /   proposed simultaneous allocation'
        : 'One GPU   /   resident allocation',
      s.train,
      s.serve,
      { over, ghost: s.proposal },
    );
    if (!s.proposal) mono(c, s.train + s.serve + ' / 16 GiB', 1815, 491, 44, P.white, 'right');
  }
  if (s.split)
    foot(
      c,
      'One working set per device. Both fit.',
      'Overlapping generation and training needs a weight transfer between the device ranges.',
      true,
    );
  else if (s.proposal)
    foot(
      c,
      'Requested 22 GiB     /     device limit 16 GiB',
      'The hatched six cells have no physical memory behind them.',
      true,
    );
  else if (near(k, 1, 'keep training resident'))
    foot(
      c,
      s.train
        ? 'Only training is resident.'
        : s.serve
          ? 'Generation now fits on the same GPU.'
          : 'Training has released the device.',
      'Colocated phases share the allocation over time.',
      true,
    );
  else
    foot(
      c,
      'How much of generation fits beside training?',
      'Ray reserves the device. Its live tensors must fit within sixteen gibibytes.',
      true,
    );
}
function futureCheck(c, k) {
  const answer = near(k, 1, 'A and B have both finished');
  base(c, 'Ordinary async', 'Which wait has finished?', true);
  const positions = [398, 963, 1530];
  line(c, 207, 490, 1710, 490, P.nightLine, 3);
  futures.forEach((f, i) => {
    const x = positions[i],
      col = f.done ? P.glow : P.peach;
    dot(c, x, 489, 90, col);
    dot(c, x, 489, 79, P.night);
    serif(c, f.id, x, 517, 92, col, { align: 'center' });
    text(c, f.done ? 'Completed' : 'Still running', x, 342, 46, col, { align: 'center' });
    mono(c, 'sampled v' + f.version, x, 654, 40, P.white, 'center');
  });
  foot(
    c,
    answer
      ? 'Wait {A, B}    ' +
          (drained(['A', 'B']) ? 'met' : 'unmet') +
          '          Wait {B, C}    ' +
          (drained(['B', 'C']) ? 'met' : 'unmet')
      : 'Required sets     {A, B}     and     {B, C}',
    'Actor now at v13. Each sample keeps the policy that produced it.',
    true,
  );
}
function queueFrame(k) {
  const first = smooth(near(k, 2, 'G four finishes', 0.55)),
    second = smooth(near(k, 3, 'G five joins', 0.55));
  const take = smooth(near(k, 4, 'take two groups', 0.55));
  const finished = 3 + Number(first === 1) + Number(second === 1),
    taken = take === 1 ? 2 : 0;
  return { first, second, take, ...queueState(finished, taken) };
}
function queue(c, k) {
  if (beat(k) < 2) return futureCheck(c, k);
  const s = queueFrame(k);
  base(c, 'Persistent worker', 'Where do completed groups go?', true);
  const lx = 97,
    rx = 1810;
  const lanes = [
    ['Running', 335, P.peach, s.running],
    ['Queued', 522, P.glow, s.queued],
    ['Trainer', 712, P.sky, s.taken],
  ];
  lanes.forEach(([title, y, color, items]) => {
    label(c, title.toUpperCase(), lx, y - 12, color);
    mono(c, String(items.length), lx, y + 46, 58, P.white);
    line(c, 349, y + 34, rx, y + 34, P.nightLine, 3);
    line(c, 349, y + 44, rx, y + 44, '#28494e', 3);
  });
  groups.forEach((g, i) => {
    const x = 490 + i * 288;
    const y =
      i < 2 ? mix(522, 712, s.take) : i === 2 ? 522 : mix(335, 522, i === 3 ? s.first : s.second);
    const color = s.running.includes(g) ? P.peach : s.queued.includes(g) ? P.glow : P.sky;
    if (y > 335 && y < 522) line(c, x, 335, x, y, color, 4, [8, 8]);
    if (y > 522 && y < 712) line(c, x, 522, x, y, color, 4, [8, 8]);
    rect(c, x - 89, y - 43, 178, 76, color, 14);
    mono(c, g, x, y + 10, 45, P.night, 'center');
    dot(c, x - 57, y + 37, 8, '#b9cacc');
    dot(c, x + 57, y + 37, 8, '#b9cacc');
  });
  foot(
    c,
    (s.open ? 'Launch gate open' : 'Launch gate closed') +
      '     /     ' +
      s.queued.length +
      ' queued     /     threshold 4',
    s.taken.length
      ? 'G1 and G2 went to training. No new task started during this trace.'
      : 'Five submitted groups keep their identities across the worker and trainer.',
    true,
  );
}
function dispatch(c, k) {
  base(c, 'Weight transport', 'Which carrier does the dispatcher select?', true);
  const starts = [105, 445, 855, 1332];
  ['Request', 'Setting', 'Placement', 'Selected carrier'].forEach((t, i) =>
    label(c, t, starts[i], 315, P.glow),
  );
  const word = ['chooses local tensor handles', 'chooses distributed NCCL', 'Delta disk requires'];
  carriers.forEach((row, i) => {
    const y = 389 + i * 119,
      visible = near(k, 0, word[i]);
    const implementation = chooseSlimeCarrier(row.input);
    const names = {
      'tensor handles': 'CUDA IPC handles',
      'NCCL chunks': 'NCCL chunks',
      'delta disk': 'Disk delta',
    };
    line(c, 92, y - 36, 1827, y - 36, P.nightLine);
    [row.mode, row.setting, row.placement, visible ? names[implementation] : '?'].forEach(
      (t, j) => {
        text(c, t, starts[j], y + 34, 43, j === 3 ? P.glow : P.white, {
          width: j === 3 ? 485 : 460,
        });
      },
    );
  });
  foot(
    c,
    'Actor v12     /     serving v11',
    'A training step and a serving update have separate completion points.',
    true,
  );
}
function drive(c, x, y, version, name, color) {
  const w = 412,
    h = 200;
  for (let i = 2; i >= 0; i--) {
    const yy = y + i * 28;
    rect(c, x, yy + 43, w, 51, color, 5);
    c.beginPath();
    c.ellipse(x + w / 2, yy + 92, w / 2, 46, 0, 0, 2 * Math.PI);
    c.fillStyle = color;
    c.fill();
    c.beginPath();
    c.ellipse(x + w / 2, yy + 43, w / 2, 46, 0, 0, 2 * Math.PI);
    c.fillStyle = i ? '#46646a' : '#b8d5cc';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = P.night;
    c.stroke();
  }
  mono(c, version ? 'v' + version : '—', x + w / 2, y + 66, 54, P.night, 'center');
  label(c, name, x + w / 2, y + h + 67, P.white, { align: 'center' });
}
function blade(c, x, y, state) {
  rect(c, x, y, 431, 176, '#c5d2cd', 12);
  rect(c, x + 13, y + 13, 405, 150, P.night, 8);
  for (let j = 0; j < 4; j++) {
    line(c, x + 45, y + 40 + j * 22, x + 133, y + 40 + j * 22, '#7b9895', 5);
  }
  mono(c, 'v' + state.live, x + 276, y + 108, 74, state.paused ? P.peach : P.glow, 'center');
  label(c, 'Live SGLang engine', x + 216, y + 239, P.white, { align: 'center' });
}
function diskProgress(k, index, startPhrase, settlePhrase = startPhrase) {
  if (beat(k) !== index) return Number(beat(k) > index);
  const { start } = k.wordCue(startPhrase);
  const { end } = k.wordCue(settlePhrase);
  return k.reveal(startPhrase, end - start, { captionStart: false });
}
function syncStage(k) {
  const events = [
    diskProgress(k, 2, 'Publish the complete weight export') === 1,
    diskProgress(k, 2, 'pull it to the destination') === 1,
    diskProgress(k, 3, 'Pause admissions') === 1,
    diskProgress(k, 3, 'Flush the old cache') === 1,
    diskProgress(k, 3, 'reload the prepared bytes', 'The reload succeeds') === 1,
    diskProgress(k, 3, 'Once it matches') === 1,
    diskProgress(k, 3, 'resume admissions') === 1,
  ];
  return events.reduce((stage, occurred, i) => (occurred ? i + 1 : stage), 0);
}
function sync(c, k) {
  if (!beat(k)) return dispatch(c, k);
  if (beat(k) >= 4) return retention(c, k);
  const broadcast = beat(k) === 1 && !near(k, 1, 'Now try full disk');
  base(
    c,
    'Policy publication',
    broadcast ? 'A broadcast pauses the live engines.' : 'Which version is live?',
    true,
  );
  if (broadcast) {
    const sent = near(k, 1, 'sending weight chunks', 0.85),
      finish = near(k, 1, 'before resuming');
    label(c, 'Megatron  /  v12 shards', 117, 342, P.sky);
    label(c, 'SGLang', 1450, 342, P.glow);
    for (let i = 0; i < 4; i++) {
      const x = 148 + i * 90,
        y = 410 + (i % 2) * 60;
      rect(c, x, y, 77, 109, P.sky, 6);
      line(c, x + 14, y + 33, x + 58, y + 33, P.night, 3);
    }
    line(c, 495, 503, 1381, 503, P.nightLine, 6);
    for (let i = 0; i < 3; i++) rect(c, 573 + 840 * sent + i * 55, 472, 42, 63, P.sky, 3);
    blade(c, 1380, 413, { live: finish ? 12 : 11, paused: !finish });
    label(c, sent === 1 ? 'Chunks received' : 'Weight chunks', 985, 630, P.sky, {
      align: 'center',
    });
    foot(
      c,
      finish
        ? 'Engine loaded     /     work may resume'
        : 'Pause and flush before live chunks arrive.',
      'Separate GPUs   /   full NCCL   /   a lost engine needs a fresh transfer or a checkpoint.',
      true,
    );
    return;
  }
  const stage = syncStage(k),
    d = diskState(stage);
  const pull = diskProgress(k, 2, 'pull it to the destination');
  const reload = diskProgress(k, 3, 'reload the prepared bytes', 'The reload succeeds');
  const links = [[516, 748, pull, P.sky], [1160, 1384, reload, P.glow]];
  for (const [from, to, progress, color] of links) {
    line(c, from, 492, to, 492, progress === 1 ? color : P.nightLine, 4);
    if (progress > 0 && progress < 1) {
      const x = mix(from, to, smooth(progress));
      rect(c, x - 34, 466, 68, 52, color, 5);
      mono(c, 'v12', x, 499, 24, P.night, 'center');
    }
  }
  drive(c, 104, 397, d.published, 'Published export', '#728b89');
  drive(c, 748, 397, d.local, 'Destination disk', '#64817d');
  blade(c, 1384, 422, d);
  label(c, 'Actor v12', 111, 300, P.sky);
  mono(
    c,
    d.paused ? 'Admissions paused' : 'Admissions open',
    1818,
    304,
    37,
    d.paused ? P.peach : P.glow,
    'right',
  );
  line(c, 84, 764, 1836, 764, P.nightLine);
  serif(c, diskEvents[stage] + '     /     engine v' + d.live, 86, 821, 49, P.white, { width: 1750 });
  text(c, d.cache + '     ·     ' +
    (d.verified ? 'Observed version matches v12' : 'v12 verification pending'),
  88, 866, 31, '#c3d8d9', { width: 1745 });
}
function retention(c, k) {
  base(c, 'Storage after reload', 'Who can attempt training replay?', true);
  const rVisible = near(k, 4, 'R kept'),
    sVisible = near(k, 4, 'S kept only'),
    answer = near(k, 5, 'R can attempt replay');
  ['Stored item', 'Run R', 'Run S'].forEach((t, i) => label(c, t, [90, 973, 1436][i], 300, P.glow));
  const labels = ['Committed trainer state', 'Compatible later batches', 'HF weight export'];
  const keys = ['checkpoint', 'batches', 'export'];
  labels.forEach((name, i) => {
    const y = 384 + i * 121;
    line(c, 90, y - 42, 1826, y - 42, P.nightLine, 2);
    text(c, name, 91, y + 27, 47, P.white);
    archives.forEach((a, j) => {
      if (!(j ? sVisible : rVisible)) return;
      const kept = a[keys[i]],
        x = 972 + j * 464;
      rect(c, x, y - 14, 49, 49, kept ? P.glow : P.nightLine, 4);
      mono(c, kept ? '+' : '−', x + 24, y + 22, 33, P.night, 'center');
      text(c, kept ? 'Retained' : 'Absent', x + 77, y + 23, 39, kept ? P.white : '#b1c6c5');
    });
  });
  foot(
    c,
    answer
      ? 'Run ' + archives.find(replayReady).name + ' has the inputs for replay.'
      : 'Which inventory includes the optimizer and its next batches?',
    answer
      ? 'The transfer export in S supplies policy parameters. Its optimizer state and data are absent.'
      : 'A versioned export can be removed after the serving engine reloads it.',
    true,
  );
}

function bytesText(bytes) {
  return '[ ' + bytes.join('   ') + ' ]';
}
function bitRow(c, byte, x, y, color, fill) {
  for (let i = 0; i < 8; i++) {
    const active = byte !== null && (byte >> (7 - i)) & 1;
    const xx = x + i * 76;
    rect(c, xx, y, 67, 74, byte === null ? '#e9e5d9' : active ? color : fill, 3);
    mono(
      c,
      byte === null ? '·' : Number(active),
      xx + 34,
      y + 51,
      40,
      active ? P.white : color,
      'center',
    );
  }
}
function delta(c, k) {
  if (beat(k) >= 3) return guards(c, k);
  const known = near(k, 1, 'The patch byte is eleven');
  const applied = near(k, 1, 'produces eight'),
    retried = near(k, 2, 'Flip those same bits again');
  const current = applied ? xor(retried ? goal : old, patch) : old;
  const idx = old.findIndex((n, i) => n !== goal[i]);
  base(c, 'Delta disk', 'Which bits does the patch flip?');
  label(c, 'Full byte arrays', 84, 287);
  label(c, 'Third byte, expanded from high bit to low bit', 863, 287);
  const rows = [
    ['Base', old, P.blue, P.ice],
    ['Target', goal, P.green, P.mint],
    ['XOR patch', known ? patch : null, P.rust, P.apricot],
    [retried ? 'Retry copy' : 'Working copy', current, P.ink, '#d7dfd7'],
  ];
  rows.forEach(([name, bs, color, fill], i) => {
    const y = 325 + i * 115;
    label(c, name, 88, y + 45, color);
    mono(c, bs ? bytesText(bs) : '[  ?  ]', 328, y + 48, 38, color, 'left', 467);
    bitRow(c, bs ? bs[idx] : null, 864, y, color, fill);
    mono(c, bs ? '= ' + bs[idx] : '= ?', 1538, y + 51, 46, color);
  });
  if (retried)
    foot(
      c,
      'Scratch copy     8 XOR 11 = 3',
      'The same three bit flips returned the copy to the base. The target above still contains 8.',
    );
  else if (applied)
    foot(
      c,
      'Working copy     3 XOR 11 = 8',
      'Unchanged byte positions have a zero patch. The size after compression depends on the data.',
    );
  else
    foot(
      c,
      known
        ? 'The patch has a one at each differing bit.'
        : 'Find the bits that differ between 3 and 8.',
      'Four illustrative weight bytes     /     version 11 to version 12',
    );
}
function guards(c, k) {
  const answer = near(k, 4, 'Neither host writes');
  base(c, 'Delta disk', 'Which host should write on retry?');
  mono(
    c,
    'Declared base v' +
      versionedPatch.baseVersion +
      '     →     destination v' +
      versionedPatch.destinationVersion +
      '     /     XOR ' +
      bytesText(patch),
    87,
    292,
    39,
    P.ink,
    'left',
    1743,
  );
  [hostA, hostB].forEach((host, i) => {
    const x = 91 + i * 885,
      decision = applyPatch(host, versionedPatch);
    const ink = answer ? (i ? P.rust : P.green) : P.ink;
    strip(c, x, 352, 835, 350, answer ? (i ? P.apricot : P.mint) : '#e2e5dc');
    label(c, 'HOST ' + (i ? 'B' : 'A') + '   /   stored state', x + 38, 421, ink);
    serif(c, 'v' + host.version, x + 34, 534, 99, ink);
    mono(c, bytesText(host.bytes), x + 267, 519, 48, P.ink);
    line(c, x + 38, 572, x + 797, 572, P.rule);
    text(c, answer ? decision.reason : 'Awaiting version check', x + 38, 648, 45, ink);
  });
  foot(
    c,
    answer
      ? '0 writes     /     keep A at v12 and hold B for repair'
      : 'Compare the declared version and the actual bytes on each host.',
    answer
      ? 'Verify the local tensor checksums and the loaded engine version before admitting requests.'
      : 'The same versioned patch was delivered to both hosts.',
  );
}
function recoveryState(k) {
  const seenBatches =
    Number(!!near(k, 1, 'Batch eleven adds')) + Number(!!near(k, 1, 'Batch twelve adds'));
  const original =
    Number(afterClause(k, 1, 'Weight falls to point nine eight')) +
    Number(afterClause(k, 1, 'weight ends at one point zero one two'));
  const restored = !!near(k, 2, 'Rewind the trainer');
  const started =
    Number(!!near(k, 5, 'Replay eleven first')) + Number(!!near(k, 5, 'Now replay twelve'));
  const applied =
    Number(afterClause(k, 5, 'Its gradient brings velocity to point two and weight to point nine eight')) +
    Number(
      afterClause(k, 5, 'Both end at weight one point zero one two and velocity minus point three two'),
    );
  const replayed = restored ? replay(batches.slice(0, applied)) : null;
  const trainer = replayed ? replayed.at(-1) : reference[original];
  const hypothetical =
    afterClause(
      k,
      4,
      'Its velocity would be minus point five and the weight would rise to one point zero five',
    ) &&
    !started;
  return {
    seenBatches,
    original,
    restored,
    started,
    applied,
    replayed,
    trainer,
    hypothetical,
    ready: afterClause(k, 6, 'Thirteen is the next fresh batch'),
    verified:
      restored &&
      applied === 2 &&
      trainer.weight === reference.at(-1).weight &&
      trainer.velocity === reference.at(-1).velocity,
  };
}
function statePlot(c, s) {
  const x0 = 236,
    y0 = 345,
    x1 = 1114,
    y1 = 732;
  const coord = (t) => [
    x0 + ((t.weight - 0.97) / 0.09) * (x1 - x0),
    y0 + ((0.3 - t.velocity) / 0.85) * (y1 - y0),
  ];
  label(c, 'Velocity', 89, 292);
  for (const v of [0.2, 0, -0.2, -0.4]) {
    const y = coord({ weight: 1, velocity: v })[1];
    line(c, x0, y, x1, y, v === 0 ? P.muted : '#c4cdc4', v === 0 ? 2 : 1);
    mono(c, ascii(v), x0 - 22, y + 11, 29, P.muted, 'right');
  }
  for (const w of [0.98, 1, 1.02, 1.04, 1.06]) {
    const x = coord({ weight: w, velocity: 0 })[0];
    line(c, x, y0, x, y1, '#c4cdc4', 1);
    mono(c, ascii(w), x, y1 + 43, 28, P.muted, 'center');
  }
  label(c, 'Weight', 1118, 805, P.muted, { align: 'right' });
  for (let i = 1; i <= s.applied; i++) {
    const [a, b] = coord(s.replayed[i - 1]),
      [x, y] = coord(s.replayed[i]);
    line(c, a, b, x, y, P.green, 14, [19, 14]);
  }
  for (let i = 0; i <= s.original; i++) {
    const [x, y] = coord(reference[i]);
    if (i) {
      const [px, py] = coord(reference[i - 1]);
      line(c, px, py, x, y, P.blue, 6);
    }
    dot(c, x, y, 16, P.blue);
    dot(c, x, y, 10, P.sheet);
    mono(
      c,
      'step ' + reference[i].step,
      x + (i === 1 ? 18 : 22),
      y + (i === 2 ? 39 : -21),
      28,
      P.blue,
    );
  }
  if (s.restored) {
    const [x, y] = coord(s.trainer);
    dot(c, x, y, 9, P.green);
    c.strokeStyle = P.green;
    c.lineWidth = 4;
    c.strokeRect(x - 23, y - 23, 46, 46);
    if (s.hypothetical) {
      const [p, q] = coord(checkpoint),
        [u, v] = coord(skipped);
      line(c, p, q, u, v, P.rust, 3, [9, 8]);
      triangle(
        c,
        [
          [u, v - 13],
          [u + 13, v + 12],
          [u - 13, v + 12],
        ],
        P.rust,
      );
      label(c, 'Only batch 12', u - 25, v + 18, P.rust, { align: 'right' });
    }
  }
}
function recovery(c, k) {
  const s = recoveryState(k),
    ref = reference[s.original];
  base(c, 'Checkpoint recovery', 'Which batch can the trainer take next?');
  const labels = [
    ['Uninterrupted', P.blue, 'circle'],
    ['Restored trainer', P.green, 'square'],
  ];
  labels.slice(0, s.restored ? 2 : 1).forEach(([name, color, shape], i) => {
    const x = 472 + 318 * i;
    if (shape === 'circle') {
      dot(c, x, 267, 11, color);
      dot(c, x, 267, 6, P.sheet);
    } else {
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.strokeRect(x - 9, 258, 18, 18);
    }
    text(c, name, x + 21, 278, 29, color);
  });
  statePlot(c, s);
  line(c, 1186, 249, 1186, 780, P.rule);
  const x = 1241;
  label(c, s.restored ? 'Retained training batches' : 'Training batches', x, 281);
  batches.forEach((b, i) => {
    const bx = x + i * 287,
      available = i < s.seenBatches,
      replayed = i < s.applied,
      ink = replayed ? P.green : available ? P.ink : P.muted;
    strip(c, bx, 312, 262, 129, replayed ? P.mint : available ? P.gold : '#e7e6dc');
    mono(c, 'Batch ' + b.id, bx + 20, 365, 36, ink);
    mono(c, available ? 'g = ' + ascii(b.gradient) : 'waiting', bx + 20, 410, 30, ink);
    if (i < s.started) label(c, replayed ? 'Replayed' : 'Replaying', bx + 20, 480, P.green);
  });
  label(
    c,
    s.restored ? 'Restored trainer' : 'Uninterrupted trainer',
    x,
    521,
    s.restored ? P.green : P.blue,
  );
  mono(c, 'w  ' + ascii(s.trainer.weight), x, 578, 53);
  mono(c, 'v  ' + ascii(s.trainer.velocity), x, 643, 53);
  if (s.restored) {
    text(c, 'Reference at step ' + ref.step, x, 704, 30, P.blue);
    mono(c, 'w ' + ascii(ref.weight) + '    v ' + ascii(ref.velocity), x, 753, 36, P.blue);
  } else text(c, 'Latest committed checkpoint   10', x, 710, 31, P.muted);
  if (beat(k) === 3) {
    const trust = near(k, 3, 'Hold an unknown upload');
    line(c, 84, 819, 1836, 819, P.rule);
    const trusted = near(k, 3, 'can go through');
    [
      [86, 'Frozen run', trusted ? 'ADMIT' : 'Check provenance', trusted ? P.green : P.muted],
      [969, 'Unknown .pt', trust ? 'HOLD' : 'Check provenance', trust ? P.rust : P.muted],
    ].forEach(([x, name, status, color]) => {
      label(c, name, x, 867);
      mono(c, status, x, 925, 42, color);
    });
  } else if (s.verified) {
    foot(
      c,
      s.ready
        ? 'Next fresh batch     ' + (s.trainer.step + 1)
        : 'Weight and velocity match the reference.',
      'Full restart also restores optimizer, scheduler, RNG and the data cursor. Verify the first resumed update.',
    );
  } else if (s.hypothetical) {
    foot(
      c,
      'Only batch 12?     w = ' + ascii(skipped.weight) + '     v = ' + ascii(skipped.velocity),
      'The dashed path is a hypothetical shortcut. The restored trainer is still at checkpoint 10.',
    );
  } else if (s.restored) {
    foot(
      c,
      s.applied
        ? 'Batch 11’s velocity carries into batch 12.'
        : 'Checkpoint 10 restored     /     batches 11 and 12 retained',
      'Fixed gradients     v′ = 0.9v + g       w′ = w − 0.1v′',
    );
  } else if (near(k, 1, 'The trainer fails')) {
    foot(
      c,
      'Trainer stopped after step 12     /     latest committed checkpoint 10',
      'Both completed batches are retained. The optimizer updates after step 10 were in memory.',
    );
  } else {
    foot(
      c,
      'v′ = 0.9v + g          w′ = w − 0.1v′',
      'Fixed-gradient example. Each step uses the newly computed velocity in the weight update.',
    );
  }
}
const scenes = [opening, ledger, segments, placement, queue, sync, delta, recovery];
function draw(ctx, clock) {
  scenes[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  checkExamples();
  const clock = (b, revealed = 1) => ({
    beat: { beatIndex: b },
    reveal: () => revealed,
    wordCue: () => ({ start: 0, end: 1 }),
  });
  assert.deepEqual(openingState(clock(2)).bits, faultyBits);
  assert.deepEqual(openingState(clock(3)).bits, correctBits);
  assert.equal(ledgerState(clock(2)).valid, true);
  assert.equal(ledgerState(clock(3)).valid, false);
  for (const [progress, cut] of [
    [0, 2],
    [0.49, 2],
    [0.51, 2],
    [1, 1],
  ]) {
    assert.equal(segmentState(clock(2, progress)).cut, cut);
    assert.equal(segmentSplit(cut).total, 4);
  }
  assert.deepEqual(
    [
      queueFrame(clock(2)).queued.length,
      queueFrame(clock(3)).queued.length,
      queueFrame(clock(4)).taken.length,
    ],
    [4, 5, 2],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((b) => syncStage(clock(b))),
    [0, 0, 2, 7, 7],
  );
  assert.equal(recoveryState(clock(2)).trainer.step, 10);
  assert.equal(recoveryState(clock(4)).hypothetical, true);
  assert.equal(recoveryState(clock(5)).verified, true);
}
export default { title: 'slime and the Evidence Behind an RL Update', draw, check };
