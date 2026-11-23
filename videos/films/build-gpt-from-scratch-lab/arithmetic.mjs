export const clamp = (x) => Math.max(0, Math.min(1, x));
export const motion = (p) => {
  const q = clamp((p - 0.12) / 0.7);
  return q * q * (3 - 2 * q);
};
export const softmax = (z) => {
  const w = z.map((v) => Math.exp(v - Math.max(...z)));
  return w.map((v) => v / w.reduce((a, b) => a + b, 0));
};
export function maskedPredictionFixture(futureFirst = 4) {
  const inputs = [
      [1, 0],
      [3, 1],
      [2, 2],
      [futureFirst, -1],
    ],
    outputRows = [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
  const rows = inputs.map((_, query) => {
    const scores = inputs.map((_v, key) => (key <= query ? 0 : -Infinity)),
      weights = softmax(scores),
      hidden = [0, 1].map((column) =>
        weights.reduce((sum, weight, key) => sum + weight * inputs[key][column], 0),
      ),
      logits = outputRows.map((row) =>
        row.reduce((sum, value, column) => sum + value * hidden[column], 0),
      );
    return {
      query,
      weights,
      hidden,
      logits,
      probabilities: softmax(logits),
    };
  });
  return {
    inputs,
    rows,
  };
}
// Four tied rows, two coordinates and equal allowed attention scores.
// The miniature uses identity value projection and omits the full lab's blocks.
const miniTable = new Map([
  ['Good', [0, 0]],
  ['↵', [1, 0]],
  [',', [0, 1]],
  ['·sir', [-1, 0]],
]);
const miniPositions = [
  [0, 1],
  [2, 2],
  [2, 2],
  [4, 2],
];

export function decoderMiniature({ fourth = '↵', causal = true } = {}) {
  const tokens = ['Good', '·sir', ',', fourth];
  const inputs = tokens.map((token, i) =>
    miniTable.get(token).map((v, j) => v + miniPositions[i][j]),
  );
  const outputPieces = [...miniTable.keys()];
  const outputRows = [...miniTable.values()];
  const rows = inputs.map((_, query) => {
    const weights = softmax(inputs.map((_, key) => (causal && key > query ? -Infinity : 0)));
    const hidden = [0, 1].map((j) => weights.reduce((sum, w, key) => sum + w * inputs[key][j], 0));
    const logits = outputRows.map((row) => dot(row, hidden));
    return { query, weights, hidden, logits, probabilities: softmax(logits) };
  });
  const row = rows[2];
  return {
    tokens,
    inputs,
    rows,
    target: '↵',
    token: ',',
    positionIndex: 2,
    embedding: miniTable.get(','),
    position: miniPositions[2],
    input: inputs[2],
    attention: row.weights,
    hidden: row.hidden,
    logits: row.logits,
    outputPieces,
    outputRows,
  };
}

export function lossStep(progress = 0) {
  const { logits, outputPieces, target } = decoderMiniature();
  const targetIndex = outputPieces.indexOf(target);
  const before = softmax(logits);
  const updated = logits.map(
    (z, i) => z - progress * 0.5 * (before[i] - Number(i === targetIndex)),
  );
  const weights = updated.map(Math.exp);
  const sum = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map((w) => w / sum);
  return {
    logits: updated,
    outputPieces,
    targetIndex,
    weights,
    sum,
    probabilities,
    loss: -Math.log(probabilities[targetIndex]),
  };
}
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export function corpusCounts() {
  const bytes = 4538523,
    tokens = 1255253,
    train = Math.floor(0.9 * tokens),
    targetsPerUpdate = 12 * 48,
    scored = 321 * targetsPerUpdate;
  return {
    bytes,
    tokens,
    train,
    validation: tokens - train,
    targetsPerUpdate,
    scored,
    fraction: scored / train,
    validationScored: 8 * targetsPerUpdate,
    uniformLoss: Math.log(17485),
    constantLoss: -Math.log(0.9),
  };
}
export function bytePieceFixture() {
  const pieces = [
      [0xf0, 0x9f],
      [0x99, 0x82],
    ],
    joined = pieces.flat(),
    decode = (bytes) => new TextDecoder().decode(Uint8Array.from(bytes)),
    separate = pieces.map(decode).join(''),
    whole = decode(joined);
  let strictRejects = false;
  try {
    new TextDecoder('utf-8', {
      fatal: true,
    }).decode(Uint8Array.from(pieces[0]));
  } catch {
    strictRejects = true;
  }
  return {
    pieces,
    joined,
    separate,
    whole,
    replacementCount: [...separate].filter((c) => c === '\ufffd').length,
    unicode: 'U+' + whole.codePointAt(0).toString(16).toUpperCase(),
    strictRejects,
  };
}
export function tiedOutput(competitor = 1) {
  const rows = [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    hidden = [...rows[0]],
    logits = rows.map((row) => dot(row, hidden)),
    weights = logits.map((x, i) => Math.exp(x) * (i === 2 ? competitor : 1)),
    sum = weights.reduce((a, b) => a + b, 0),
    probabilities = weights.map((v) => v / sum);
  return {
    rows,
    hidden,
    logits,
    probabilities,
    gradientUnused: hidden.map((x) => x * probabilities[2]),
    loss: -Math.log(probabilities[1]),
    fullWeights: 50257 * 96,
    compactWeights: 17485 * 96,
    removed: (50257 - 17485) * 96,
    compactTotal: 1907040,
    fullTotal: 1907040 + (50257 - 17485) * 96,
  };
}
export function samplerWindow(sourceLength, context, start = 0) {
  if (
    !Number.isInteger(sourceLength) ||
    !Number.isInteger(context) ||
    context < 1 ||
    sourceLength <= context
  )
    throw Error('Source must supply at least context + 1 tokens');
  const upper = sourceLength - context;
  if (!Number.isInteger(start) || start < 0 || start >= upper) throw Error('Invalid sampler start');
  return {
    input: Array.from(
      {
        length: context,
      },
      (_, i) => start + i,
    ),
    target: Array.from(
      {
        length: context,
      },
      (_, i) => start + i + 1,
    ),
    start,
    exclusiveUpper: upper,
    lastStart: upper - 1,
  };
}
export function categoricalFixture(temperature = 0.5, uniform = 0.9) {
  if (!(temperature > 0) || uniform < 0 || uniform >= 1)
    throw Error('Positive temperature and draw in [0,1) required');
  const logits = [2, 1, 0, -1],
    retained = [0, 1],
    scaled = retained.map((i) => logits[i] / temperature),
    probabilities = softmax(scaled),
    cdf = probabilities.map((_, i) => probabilities.slice(0, i + 1).reduce((a, b) => a + b, 0)),
    selected = cdf.findIndex((p) => uniform < p);
  return {
    logits,
    retained,
    scaled,
    probabilities,
    cdf,
    uniform,
    selected,
    localId: retained[selected],
    originalId: [11, 461][retained[selected]],
    bytes: retained[selected] === 0 ? [44] : [97, 107],
  };
}
export function scalarAdam(gradients, { weight = 1, m = 0, v = 0, step = 0 } = {}) {
  const states = [];
  for (const gradient of gradients) {
    step++;
    m = 0.5 * m + 0.5 * gradient;
    v = 0.5 * v + 0.5 * gradient * gradient;
    const mh = m / (1 - 0.5 ** step),
      vh = v / (1 - 0.5 ** step);
    weight -= (0.1 * mh) / Math.sqrt(vh);
    states.push({
      step,
      gradient,
      m,
      v,
      mh,
      vh,
      weight,
    });
  }
  return {
    weight,
    m,
    v,
    step,
    states,
  };
}
export function adamFork() {
  const prefix = scalarAdam([1, 1]),
    restored = scalarAdam([-1], prefix),
    reset = scalarAdam([-1], {
      weight: prefix.weight,
    });
  return {
    prefix,
    restored,
    reset,
  };
}
export function normComparison() {
  const x = [1, 3],
    mean = 2,
    variance = 1,
    secondMoment = 5;
  return {
    x,
    mean,
    variance,
    secondMoment,
    layer: x.map((v) => (v - mean) / Math.sqrt(variance)),
    rms: x.map((v) => v / Math.sqrt(secondMoment)),
  };
}
export function localProbe(future = 9) {
  const embedding = Array.from(
      {
        length: 16,
      },
      (_, id) => [Math.sin(id / 5), Math.cos(id / 5)],
    ),
    inputs = [2, 5, 8, future],
    labels = [5, 8, 9, 12],
    rows = inputs.map((id, query) => {
      const values = inputs.slice(0, query + 1).map((key) => embedding[key]),
        hidden = [0, 1].map((j) => values.reduce((sum, x) => sum + x[j], 0) / values.length),
        logits = embedding.map((row) => dot(row, hidden));
      return {
        query,
        allowed: inputs.slice(0, query + 1),
        target: labels[query],
        hidden,
        logits,
        probabilities: softmax(logits),
      };
    });
  return {
    inputs,
    labels,
    embedding,
    rows,
  };
}
