import {
  ink,
  paper,
  sheet,
  blue,
  teal,
  gold,
  rust,
  faded,
  rule,
  dark,
  pale,
  peach,
  fmt,
  vec,
  lerp,
} from './art.mjs';
import {
  categoricalFixture,
  adamFork,
  normComparison,
  dot,
  softmax,
  localProbe,
} from '../../../films/build-gpt-from-scratch-lab/arithmetic.mjs';
import { ATTENTION_CPU_FIXTURE as cpu } from '../../../films/build-gpt-from-scratch-lab/fixtures.mjs';
import { labelStrip } from './typecase.mjs';

export function sampling(d) {
  const { b, field, label, mono, rect, cue, slug, serif, line } = d;
  if (b <= 2) {
    field('Choose one more piece', 'Shakespeare checkpoint   /   fixed generation settings');
    label('Most recent local IDs', 49, 162);
    d.tray(48, 181, 862, 80);
    for (let i = 0; i < 48; i++) rect(59 + i * 17.6, 194, 13, 44, i === 47 ? gold : '#b3c9b9');
    label('48 positions', 49, 292);
    d.arrow(894, 264, 894, 302, rust);
    label('Final position', 884, 335, rust, 'right');
    mono('top 8  →  scores / 0.9  →  softmax', 48, 378, 27, blue);
    if (b === 2) {
      label(
        'Positive temperature preserves order. Tied maxima share mass as T approaches zero.',
        49,
        430,
      );
      label('At T = 0, use an explicit argmax.', 49, 465, teal);
    }
  } else {
    const f = categoricalFixture(),
      scaled = cue(3, 'At half temperature', 0);
    const placed = cue(3, 'Place the draw', 0.6),
      winner = cue(4, 'Choose local ID one', 0),
      append = cue(5, 'Append one', 0);
    field(
      'Where does the draw land?',
      'Separate four-score example   /   top 2   /   temperature 0.5',
    );
    ['Local ID', 'Logit', scaled ? 'Scaled' : ''].forEach((v, i) => label(v, 48, 159 + 42 * i));
    f.logits.forEach((v, i) => {
      const x = 254 + 159 * i;
      mono(i, x, 160, 22);
      mono(v, x, 202, 24, i < 2 ? blue : faded);
      if (scaled) mono(i < 2 ? f.scaled[i] : 'out', x, 244, 23, i < 2 ? blue : faded);
    });
    if (scaled) {
      const x = 54,
        y = 292,
        w = 834,
        k = f.cdf[0],
        draw = x + f.uniform * w;
      rect(x, y, w * k, 53, blue);
      rect(x + w * k, y, w * (1 - k), 53, gold);
      mono('local 0', x + 18, y + 35, 21, sheet);
      mono('1', x + (w * (1 + k)) / 2, y + 35, 21, ink, 'center');
      mono('0', x, 374, 17);
      mono('≈ ' + k.toFixed(4), x + k * w - 10, 374, 17, blue, 'right');
      mono('1', x + w, 374, 17, ink, 'right');
      d.alpha(placed, () => {
        d.path(
          [
            [draw - 7, y - 11],
            [draw + 7, y - 11],
            [draw, y - 1],
          ],
          rust,
          1,
          true,
        );
        label('u = 0.90', draw + 9, y - 17, rust, 'right');
      });
      if (winner && !append) serif('The draw selects local ' + f.localId, 55, 448, 39, rust);
      if (append) {
        label('Input', 52, 444);
        rect(118, 405, 126, 50, pale);
        mono('…', 175, 438, 26, ink, 'center');
        slug(f.localId, 246, 405, 66, 48, blue, 'Mono', 24);
        mono(
          '→  GPT-2 ' + f.originalId + '  →  “' + String.fromCharCode(...f.bytes) + '”',
          339,
          443,
          26,
          teal,
        );
        label(
          b === 6
            ? 'Fixed prompt, weights and seed 17 repeat the trace in this CPU setup.'
            : 'Use the saved inverse map before decoding the full sequence.',
          54,
          483,
        );
      }
    }
  }
}
export const starts = [4, 1, 9, 6];
export function replay(d) {
  const { field, label, mono, serif, rect, slug, cue, line } = d;
  field('The next draw after a restart', 'Supplied starting positions in draw order');
  const x = 228,
    s = 157;
  const consumed = cue(1, 'Use four', 0) + cue(1, 'then one', 0),
    reset = cue(2, 'Four again', 0),
    resume = cue(2, 'The next draw is nine', 0);
  starts.forEach((v, i) => {
    slug(v, x + i * s, 159, 111, 70, i < consumed ? faded : ink, 'Mono', 37);
    if (i < consumed) label('used', x + i * s + 56, 258, faded, 'center');
  });
  if (consumed === 2) {
    line(x + s * 2 - 28, 145, x + s * 2 - 28, 260, rust, 3);
    label('saved', x + s * 2 - 26, 285, rust, 'center');
  }
  [
    [337, 'Initial seed', 0, reset],
    [428, 'Progressed state', consumed, resume],
  ].forEach(([y, name, index, ready]) => {
    label(name, 48, y + 6);
    line(x + 55, y, x + 3 * s + 55, y, rule, 3);
    starts.forEach((_, i) => d.oval(x + i * s + 55, y, 5, 5, rule));
    if (ready) {
      d.oval(x + index * s + 55, y, 24, 24, index ? teal : rust);
      mono(starts[index], x + index * s + 55, y + 9, 25, sheet, 'center');
    } else mono('?', 875, y + 8, 24, rust);
  });
  if (d.b === 3) label('Validation draws advance a separate generator.', 49, 487, blue);
}
export function optimizer(d) {
  const { b, field, label, stock, mono, serif, line, cue, rect, table } = d;
  if (b === 1) {
    const changed = cue(1, 'moves that weight to point nine', 0);
    field('Which snapshot keeps the old weight?', 'One live tensor storage location');
    stock(333, 180, 247, 114, pale);
    label('Live weight', 355, 216, teal);
    mono(changed ? '0.9' : '1.0', 355, 270, 43);
    label('state_dict()', 50, 225);
    d.arrow(154, 240, 317, 240, blue);
    label('Serialized copy', 626, 221);
    mono('1.0', 628, 280, 43, rust);
    if (changed) label('A shallow reference now reads 0.9.', 49, 399, rust);
  } else if (b === 2) {
    field('What goes into a restart file?', 'Save at a completed update');
    const parts = [
      ['Model', 'Weights and completed update'],
      ['Optimizer', 'Moments and step counters'],
      ['Inputs', 'Token order, tokenizer version, corpus hash and split'],
      ['Sampling', 'Training and validation generator states'],
      ['Configuration', 'Model shape and training settings'],
    ];
    table(
      52,
      157,
      [
        ['State', 193],
        ['Saved with the checkpoint', 653],
      ],
      parts,
      { step: 55 },
    );
  } else if (b <= 5) {
    const f = adamFork();
    const restoredMoment = d.cueThrough(4, 'still remembers the positive gradients', undefined, false) === 1;
    const resetMoment = cue(5, 'the weight jumps', 0);
    const progress = [
      d.cueThrough(4, 'The new weight is about', 'eight one four'),
      d.cueThrough(5, 'the weight jumps', 'point nine'),
    ];
    const left = 560;
    const right = 879;
    const x = (w) => lerp(left, right, (w - f.prefix.weight) / 0.12);
    field(
      'One step from the same weight',
      'Scalar Adam   /   β₁ = β₂ = 0.5   /   ε = decay = 0   /   learning rate = 0.1',
    );
    label('Same batch · gradient −1 · both start at w = ' + f.prefix.weight.toFixed(2), 48, 153, blue);
    label('Starting optimizer state', 48, 206);
    label('Weight after one step', left, 206);
    const ticks = [0.80, 0.84, 0.88, 0.92];
    ticks.forEach((w) => {
      line(x(w), 244, x(w), 367, rule, 1);
      mono(w.toFixed(2), x(w), 231, 17, ink, 'center');
    });
    [f.restored, f.reset].forEach((state, j) => {
      const y = 268 + 91 * j;
      const color = j ? rust : blue;
      const start = j ? { m: 0, v: 0, step: 0 } : f.prefix;
      const showMoment = j ? resetMoment : restoredMoment;
      serif(j ? 'Fresh Adam' : 'Restore Adam', 48, y - 5, 30, color);
      mono('m ' + start.m.toFixed(2) + '   v ' + start.v.toFixed(2) + '   t ' + start.step,
        49, y + 21, 18);
      if (showMoment)
        mono('After: m ' + state.m.toFixed(3) + '   v ' + state.v.toFixed(3) + '   t ' + state.step,
          49, y + 43, 17, color);
      line(left, y, right, y, rule, 2);
      const current = x(lerp(f.prefix.weight, state.weight, progress[j]));
      line(left, y, current, y, color, 4);
      d.oval(left, y, 4, 4, ink);
      d.oval(current, y, 8, 8, color);
      if (progress[j] === 1)
        mono(state.weight.toFixed(4), current, y + 29, 22, color, 'center');
    });
    if (b === 3)
      label('Same gradient. Which update moves farther?', 48, 403, blue);
  } else {
    const same = cue(6, 'Their updated weights match', 0);
    field('Resume the measured CPU checkpoint', 'Pinned CPU run, deterministic next update');
    const rows = [
      ['321', 'Probe logits', 'equal'],
      ['321', 'Next training batch', 'equal'],
      ['321', 'Loss before step', 'equal'],
      ['322', 'Weights after step', same ? 'equal' : 'compare'],
    ];
    table(
      53,
      171,
      [
        ['Update', 149],
        ['Compared across paths', 414],
        ['Result', 200],
      ],
      rows,
      { step: 54, focus: same ? 3 : -1 },
    );
    if (b === 7)
      label('Restore scheduler, scaler and stochastic state when the loop uses them.', 54, 463);
  }
}
export function architecture(d) {
  const { b, field, label, mono, serif, rect, line, table, cue } = d;
  if (b < 3) {
    field(
      'Different decoders, same causal task',
      'GPT-style CPU lab and the historical Llama 2 models',
    );
    table(
      46,
      160,
      [
        ['Component', 192],
        ['Lab', 263],
        ['Llama 2', 386],
      ],
      [
        ['Position', 'Learned table', 'Rotary Q and K'],
        ['Normalization', 'LayerNorm', 'RMSNorm'],
        ['Feed-forward', 'GELU', 'SwiGLU'],
        ['Attention', '4 heads', b === 1 ? 'Causal' : '7B/13B MHA · 70B GQA'],
      ],
      { step: 62 },
    );
  } else if (b <= 5 && !cue(4, 'Rotary positions', 0)) {
    const f = normComparison(),
      layer = cue(3, 'subtracts the mean', 0),
      rms = cue(4, 'RMS normalization divides', 0);
    field('Does normalization center the pair?', 'x = [1, 3]   /   gain 1, offset 0, ε = 0');
    const map = (v) => 448 + 119 * v;
    [
      [186, 'Input', f.x, true],
      [291, 'LayerNorm', f.layer, layer],
      [396, 'RMSNorm', f.rms, rms],
    ].forEach(([y, name, v, show]) => {
      label(name, 47, y + 4);
      line(276, y, 865, y, rule, 2);
      line(map(0), y - 12, map(0), y + 12, ink);
      mono('0', map(0), y + 32, 15);
      if (show)
        v.forEach((n, i) => {
          d.oval(map(n), y, 8, 8, i ? rust : blue);
          mono(Number(n.toFixed(3)), map(n), y - 16, 18, i ? rust : blue, 'center');
        });
    });
    label(
      b === 3
        ? 'LayerNorm uses (x − 2) / 1.'
        : 'RMSNorm uses x / √5. Both coordinates keep their sign.',
      49,
      482,
      teal,
    );
  } else if (b <= 5) {
    const rot = cue(4, 'They rotate query and key pairs', 1.2),
      angle = (rot * Math.PI) / 3;
    field(
      'Rotate a key relative to its query',
      'One illustrative coordinate pair   /   unit vectors',
    );
    const x = 238,
      y = 370,
      r = 160;
    line(x - r, y, x + r + 30, y, rule);
    line(x, y + 35, x, y - r - 20, rule);
    d.arrow(x, y, x + r, y, blue, 4);
    d.arrow(x, y, x + r * Math.cos(angle), y - r * Math.sin(angle), rust, 4);
    label('query', x + r - 11, y + 32, blue);
    label('key', x + r * Math.cos(angle) + 12, y - r * Math.sin(angle) - 10, rust);
    mono(
      'relative angle ' +
        (rot > 0 && rot < 1 ? '≈ ' : '= ') +
        Math.round((angle * 180) / Math.PI) +
        '°',
      495,
      240,
      24,
    );
    mono(
      'dot product ' + (rot > 0 && rot < 1 ? '≈ ' : '= ') + Math.cos(angle).toFixed(2),
      495,
      291,
      24,
      teal,
    );
    label('Test quality at the intended context length.', 495, 378);
  } else if (b === 6 && !cue(6, 'Now follow the four query heads', 0)) {
    field('Two branches in a gated feed-forward layer', 'SwiGLU   /   one position');
    mono('x', 81, 293, 45, blue);
    d.path(
      [
        [124, 274],
        [166, 274],
        [166, 195],
        [227, 195],
      ],
      blue,
      3,
    );
    d.path(
      [
        [166, 274],
        [166, 351],
        [227, 351],
      ],
      blue,
      3,
    );
    mono('linear(x)', 242, 205, 28);
    mono('SiLU(gate(x))', 242, 360, 28);
    d.path(
      [
        [459, 195],
        [508, 195],
        [508, 265],
      ],
      blue,
      3,
    );
    d.path(
      [
        [478, 351],
        [508, 351],
        [508, 288],
      ],
      blue,
      3,
    );
    d.oval(508, 277, 22, 22, teal);
    mono('×', 508, 286, 27, sheet, 'center');
    d.arrow(537, 277, 603, 277, teal);
    mono('project back', 620, 286, 25);
    label('Elementwise product', 489, 420, teal);
  } else {
    const pair = cue(6, 'Group them in pairs', 0);
    field(
      'How many key–value heads get stored?',
      'Four query heads   /   fixed sequence length, head width and dtype',
    );
    const xs = [157, 370, 583, 796],
      owners = pair ? [256, 687] : xs;
    xs.forEach((x, i) => {
      d.oval(x, 197, 30, 30, blue);
      mono('Q' + i, x, 205, 22, sheet, 'center');
      const dest = owners[pair ? Math.floor(i / 2) : i];
      d.arrow(x, 233, dest, 318, blue, 2);
    });
    owners.forEach((x, i) => {
      rect(x - 58, 324, 116, 52, pale);
      mono('KV ' + i, x, 358, 24, ink, 'center');
    });
    mono(owners.length + ' KV heads', 48, 449, 29, teal);
    if (pair) label('½ the ideal KV cache bytes   ·   measure serving speed separately', 310, 449);
  }
}
export const cpuWeights = cpu.q[0].map((q, i) =>
  softmax(cpu.k[0].map((k, j) => (j <= i ? dot(q, k) / Math.sqrt(q.length) : -Infinity))),
);
export const cpuDelta = Math.max(
  ...cpu.manual.flat(3).map((v, i) => Math.abs(v - cpu.api.flat(3)[i])),
);
export function diagnosticRow(blockAll) {
  const allowed = [0, 1, 2, 3].map((key) => !blockAll && key <= 2);
  const scores = allowed.map((ok) => (ok ? 0 : -Infinity));
  const weights = scores.map(Math.exp);
  const sum = weights.reduce((a, b) => a + b, 0);
  return { allowed, scores, weights, sum, normalized: weights.map((w) => w / sum) };
}
export function diagnostics(d) {
  const { b, field, rect, mono, label, serif, cue, table } = d;
  if (b <= 2) {
    field(
      'Manual attention and SDPA',
      'Recorded CPU fixture   /   seed 3   /   [1, 2, 4, 8]   /   dropout off',
    );
    label('Attention weights, head 0 (rounded)', 49, 151);
    cpuWeights.forEach((row, i) =>
      row.forEach((v, j) => {
        const x = 53 + j * 91,
          y = 183 + i * 58;
        rect(x, y, 86, 52, v > 0 ? blue : '#dfd8bf');
        mono(v.toFixed(3), x + 43, y + 34, 19, v > 0 ? sheet : faded, 'center');
      }),
    );
    label('Rows = queries   ·   columns = keys', 50, 451);
    if (b >= 2) {
      label('MAXIMUM ABSOLUTE OUTPUT DIFFERENCE', 463, 196);
      mono(cpuDelta.toExponential(3), 463, 254, 36, teal);
      serif('Forward agreement', 462, 325, 35);
      label('Gradient comparison and a timed CUDA profile', 463, 379);
      label('answer separate questions.', 463, 407);
    }
  } else if (b <= 4) {
    const allOff = cue(3, 'block every key', 0) && !cue(4, 'Restore the three allowed keys', 0);
    const row = diagnosticRow(allOff);
    field(
      'Can this row produce valid weights?',
      'Manual softmax for query 2   /   blocked keys receive −∞ before exponentiation',
    );
    row.allowed.forEach((ok, i) => {
      const x = 53 + 215 * i;
      label('Key ' + i + (ok ? ' · allowed' : ' · blocked'), x, 173);
      d.slug(ok ? row.scores[i] : '−∞', x, 196, 160, 80, ok ? blue : faded, 'Mono', 36);
      mono('exp → ' + row.weights[i], x, 333, 23);
    });
    mono('sum = ' + row.sum, 55, 416, 35, ink);
    const invalid = Number.isNaN(row.normalized[0]);
    mono(
      'p(key 0) = ' + row.weights[0] + '/' + row.sum + (invalid ? ' → NaN' : ''),
      363,
      416,
      32,
      invalid ? rust : teal,
    );
    label(
      invalid
        ? 'No key is allowed. Normalizing zero total weight produces NaN.'
        : 'Three finite allowed scores give a positive sum. The blocked key has zero weight.',
      54,
      470,
    );
  } else if (b === 5) {
    const incorrect = cue(5, 'wrong inverse map', 0);
    field(
      'A valid decode can print the wrong piece',
      'Four-score sampler   /   same local ID, two inverse maps',
    );
    label('LOCAL', 67, 177);
    d.slug(1, 64, 198, 131, 89, blue, 'Mono', 47);
    label('SAVED MAP', 312, 174, teal);
    mono('461', 319, 235, 37, teal);
    d.arrow(430, 224, 542, 224, teal);
    serif('ak', 591, 248, 59, teal);
    if (incorrect) {
      label('WRONG ROW ORDER', 312, 331, rust);
      mono('11', 319, 390, 37, rust);
      d.arrow(430, 382, 542, 382, rust);
      serif(',', 593, 391, 69, rust);
    }
  } else {
    const restart = cue(6, 'For a restart', 0);
    field(
      restart ? 'Find the first mismatch on resume' : 'Why did the sampler repeat?',
      'Choose a test for the observed symptom',
    );
    if (!restart) {
      serif('the man to the man to the man', 49, 238, 52);
      d.bracket(53, 269, 267, rust);
      d.bracket(307, 269, 530, rust);
      label('Compare training overlap', 51, 356);
      label('Vary the context', 356, 356);
      label('Vary the decoding settings', 622, 356);
      label('A new prompt can still lead to a copied continuation.', 51, 440, rust);
    } else {
      table(
        52,
        178,
        [
          ['When did the paths differ?', 444],
          ['What to inspect', 381],
        ],
        [
          ['Before the update', 'Weights and exact batch'],
          ['After the optimizer step', 'Moments and step counter'],
        ],
        { step: 74, focus: 0 },
      );
      label('Compare each stage in order on the deterministic CPU run.', 52, 424);
    }
  }
}
export function auditFixture() {
  const before = localProbe(),
    after = localProbe(14),
    source = [...before.inputs, before.labels.at(-1)];
  const prefixDeltas = before.rows.slice(0, -1).map((row, i) =>
    Math.max(...row.logits.map((v, j) => Math.abs(v - after.rows[i].logits[j]))),
  );
  return { before, after, source, prefixDeltas, delta: Math.max(...prefixDeltas) };
}
export function finalBatch(d) {
  const { rect, mono, serif, label, cue, cueThrough, slug, stock, bracket, arrow } = d;
  const { before, after, source, prefixDeltas, delta } = auditFixture();
  const probe = cueThrough(2, 'change nine to fourteen') === 1;
  const compared = cueThrough(2, 'Their largest change is zero') === 1;
  const checkLabels = cue(3, 'Look straight down from eight', 0);
  const diagnosed = cueThrough(3, 'reward another eight') === 1;
  const selectSuccessors = cueThrough(4, 'one place to the right') === 1;
  const move = cueThrough(4, 'slide the label rail left', 'Now eight predicts nine');
  const focusPair = cueThrough(4, 'Now eight predicts nine') === 1;
  const readPairs = cue(4, 'Read all four pairs', 0);
  const lastPair = cueThrough(4, 'The last input gets twelve') === 1;
  const showProbe = probe && !checkLabels;
  const focus = 2;
  const probeIndex = after.inputs.length - 1;
  rect(0, 0, 960, 540, dark);
  stock(29, 27, 904, 465, sheet);
  serif('Would you train on this batch?', 50, 84, 43);
  label('FROZEN SOURCE   /   16-PIECE VOCABULARY', 52, 123, teal);
  if (compared) {
    const change = before.inputs[probeIndex] + ' → ' + after.inputs[probeIndex];
    mono('Probe ' + change + '  ·  max |Δ prefix logits| = ' + delta, 901, 123, 19, blue, 'right');
  }
  const x = 214,
    s = 126;
  const tileWidth = s - 9;
  const tileX = (i) => x + i * s;
  const tileCenter = (i) => tileX(i) + tileWidth / 2;

  label('Source IDs', 53, 193);
  source.forEach((v, i) =>
    slug(v, tileX(i), 153, tileWidth, 53, i === focus ? rust : ink, 'Mono', 32),
  );
  if (selectSuccessors) {
    label('Label source', 53, 229, teal);
    bracket(tileX(1), 228, tileX(source.length - 1) + tileWidth, teal);
  }

  label(showProbe ? 'Probe input' : 'Batch input', 53, 282);
  (showProbe ? after : before).inputs.forEach((v, i) =>
    slug(v, tileX(i), 242, tileWidth, 53, i === probeIndex && showProbe ? rust : blue, 'Mono', 32),
  );
  const readable = before.rows[focus].allowed.length;
  bracket(x, 314, tileX(readable - 1) + tileWidth, blue);

  label('Batch labels', 53, 392);
  labelStrip(d, source, x, 350, s, move, focus);
  function markPair(i, target, color) {
    const center = tileCenter(i);
    arrow(center, 323, center, 340, color);
    mono(before.inputs[i] + ' → ' + target, center, 444, 24, color, 'center');
  }
  if (diagnosed && move === 0) markPair(focus, before.inputs[focus], rust);
  if (move === 1) {
    before.labels.forEach((target, i) => {
      const revealed = i === focus ? focusPair : i === probeIndex ? lastPair : readPairs;
      if (revealed) markPair(i, target, teal);
    });
  }

  if (compared && showProbe) {
    label('Max logit change', 53, 444, blue);
    prefixDeltas.forEach((value, i) => mono(value, tileCenter(i), 444, 24, blue, 'center'));
  }
}
