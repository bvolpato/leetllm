import { bounded, interpolate, words } from './arithmetic.mjs';
import { phraseProgress } from './construction.mjs';
import {
  CENTROID_INPUTS,
  CHECKPOINTS,
  CHECKPOINT_PIECES,
  DOMAIN_DOCUMENTS,
  PACKED_DOCUMENTS,
  WINDOW_ORDER,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function wordOverlap(a, b) {
  const left = words(a),
    right = words(b),
    intersection = [...left].filter((x) => right.has(x)).length;
  return intersection / new Set([...left, ...right]).size;
}
export function checkpointTokenize(text) {
  let remaining = text;
  const result = [];
  while (remaining.length) {
    const piece = CHECKPOINT_PIECES.filter((x) => remaining.startsWith(x)).sort(
      (a, b) => b.length - a.length,
    )[0];
    if (!piece) throw Error('Uncovered fixture token');
    result.push(piece);
    remaining = remaining.slice(piece.length);
  }
  return result;
}
export function corpusSnapshot(beat, progress) {
  const seconds = bounded(progress) * [17.734, 12.67, 14.07][beat];
  const decisions = DOMAIN_DOCUMENTS.map((row) => ({
    id: row.id,
    reason: 'pending',
  }));
  const at = (time) => beat > 0 || seconds >= time;
  decisions[0].reason = at(2.95) ? 'retain' : 'pending';
  decisions[1].reason = at(5.6875) ? 'near-duplicate of D1' : 'pending';
  decisions[2].reason = at(3.3125) ? 'boilerplate' : 'pending';
  decisions[3].reason = at(4.2375) ? 'corrupt extraction' : 'pending';
  decisions[4].reason = at(8.3) ? 'permission absent' : 'pending';
  decisions[5].reason = at(8.675) ? 'retain' : 'pending';
  const heldout = (beat >= 1 && seconds >= 1.1375) || beat > 1,
    overlap = (beat >= 1 && seconds >= 3.375) || beat > 1;
  if (overlap) decisions[5].reason = 'overlaps E1 · exclude';
  const retained = DOMAIN_DOCUMENTS.filter(
    (row) => decisions.find((x) => x.id === row.id).reason === 'retain',
  );
  const pieces = checkpointTokenize(DOMAIN_DOCUMENTS[0].text),
    shown = beat < 2 ? 0 : Math.min(pieces.length, Math.floor(9 * bounded((seconds - 0.9) / 3.8)));
  return {
    seconds,
    decisions,
    retained,
    heldout,
    overlap,
    pieces,
    shown,
    nearDuplicateSimilarity: wordOverlap(DOMAIN_DOCUMENTS[0].text, DOMAIN_DOCUMENTS[1].text),
  };
}
export function selectionSnapshot(beat, progress) {
  const seconds = bounded(progress) * [14.734, 16.798, 19.998][beat],
    budget = 1.5,
    base = CHECKPOINTS[0].general,
    shown = beat > 0 ? 4 : Math.min(4, Math.floor(5 * bounded((seconds - 12.425) / 1.6))),
    rows = CHECKPOINTS.slice(0, shown).map((row) => ({
      ...row,
      delta: row.general - base,
      eligible: row.general - base <= budget,
    })),
    winner = [...rows]
      .filter((row) => row.eligible)
      .sort((a, b) => b.task - a.task || a.domain - b.domain)[0];
  return {
    seconds,
    budget,
    base,
    limit: base + budget,
    rows,
    winner,
    ranked: beat > 1 || (beat === 1 && seconds >= 3.3625),
    confirmed: beat > 1 || (beat === 1 && seconds >= 10.2875),
    reserved: {
      correct: 14,
      total: 20,
      general: 20,
      baseGeneral: 19.1,
    },
  };
}
export function evaluationSnapshot(beat, progress) {
  const seconds = bounded(progress) * [16.078, 11.758, 13.086][beat],
    count = beat > 0 ? 5 : Math.min(5, Math.floor(6 * bounded((seconds - 0.4) / 8.9))),
    domain = [42, 36, 31, 28, 26],
    general = [19.2, 19.4, 20.1, 21.5, 23.9];
  return {
    seconds,
    domain: domain.slice(0, count),
    tasks: Array(count).fill(62),
    general:
      beat > 1
        ? general
        : beat === 1
          ? general.slice(0, Math.min(5, Math.floor(6 * bounded((seconds - 0.2625) / 5.7))))
          : [],
  };
}
export function selectedPackage() {
  const winner = selectionSnapshot(1, 1).winner,
    documents = DOMAIN_DOCUMENTS.filter((row) => row.id === 'D1'),
    corpusHash = createHash('sha256').update(JSON.stringify(documents)).digest('hex');
  return {
    checkpoint: winner.label,
    tokenizer: 'tok-v1',
    manifest: documents.map((row) => row.id),
    corpusHash,
    optimizer: {
      type: 'Adam',
      m: [0.02, -0.01],
      v: [0.004, 0.002],
    },
    evaluation: 'task-first-v1 · general ΔPPL ≤1.5',
    tokenCounts: {
      unique: checkpointTokenize(documents[0].text).length,
      presentations: 4000,
    },
    winner,
  };
}
export function replayGradient(alpha) {
  if (!(alpha >= 0 && alpha <= 1)) throw new RangeError('replay fraction must be in [0, 1]');
  const domain = -0.5,
    replay = 0.5;
  return (1 - alpha) * domain + alpha * replay;
}
export const replayCueFraction = (beat, progress) =>
  beat < 1 ? 0 : beat > 1 ? 0.25 : 0.25 * Math.max(0, Math.min(1, progress));
export function learningRate(step, total = 12, warmup = 2, peak = 3, floor = 0.3) {
  if (!Number.isInteger(step) || step < 0 || step >= total)
    throw new RangeError('step must be in range');
  if (step < warmup) return floor + ((peak - floor) * (step + 1)) / warmup;
  const progress = (step - warmup) / (total - warmup - 1);
  return floor + (peak - floor) * 0.5 * (1 + Math.cos(Math.PI * progress));
}
export function adaptationSnapshot(progress) {
  const q = Math.max(0, Math.min(1, progress)),
    logit = 0.25 * q,
    reef = 1 / (1 + Math.exp(-logit)),
    tree = 1 - reef;
  return {
    logit,
    probabilities: [reef, tree],
    domainLoss: -Math.log(reef),
    broadLoss: -Math.log(tree),
  };
}
export function packedCorpus() {
  const stream = PACKED_DOCUMENTS.flatMap((a, source) =>
    [...a, 0].map((token, index) => ({
      id: `D${source + 1}:${index}`,
      source,
      token,
      index,
    })),
  );
  return {
    stream,
    blocks: [stream.slice(0, 6), stream.slice(6, 12)],
    remainder: stream.slice(12),
  };
}
export function packingOwners(progress) {
  return packedCorpus().stream.map((o, i) => {
    const q = bounded(progress * 14 - i),
      row = i < 12 ? Math.floor(i / 6) : 2,
      col = i < 12 ? i % 6 : i - 12,
      sx = 230 + o.index * 110,
      sy = 410 + o.source * 125,
      dx = 980 + col * 120,
      dy = 435 + row * 180,
      points = [
        [sx, sy],
        [sx, 325],
        [1745, 325],
        [1745, dy],
        [dx, dy],
      ],
      u = q * 4,
      j = Math.min(3, Math.floor(u)),
      v = q === 1 ? 1 : u - j;
    return {
      ...o,
      progress: q,
      x: interpolate(points[j][0], points[j + 1][0], v),
      y: interpolate(points[j][1], points[j + 1][1], v),
      placed: q === 1,
    };
  });
}
export function shuffleOwners(progress) {
  return Array.from(
    {
      length: 20,
    },
    (_, i) => {
      const q = bounded(progress * 20 - i),
        dest = WINDOW_ORDER.indexOf(i),
        sx = 180 + (i % 5) * 140,
        sy = 425 + Math.floor(i / 5) * 145,
        dx = 1040 + (dest % 5) * 140,
        dy = 425 + Math.floor(dest / 5) * 145,
        points = [
          [sx, sy],
          [sx, sy + 65],
          [920, sy + 65],
          [920, dy + 65],
          [dx, dy + 65],
          [dx, dy],
        ],
        u = q * 5,
        j = Math.min(4, Math.floor(u)),
        v = q === 1 ? 1 : u - j;
      return {
        id: i,
        source: i < 15 ? 'domain' : 'replay',
        destination: dest,
        progress: q,
        x: interpolate(points[j][0], points[j + 1][0], v),
        y: interpolate(points[j][1], points[j + 1][1], v),
      };
    },
  );
}
export function dependencyModel() {
  const z = [1, 1, 0],
    sum = z.reduce((s, v) => s + Math.exp(v), 0),
    probabilities = z.map((v) => Math.exp(v) / sum),
    dlogits = probabilities.map((p, i) => p - Number(i === 2));
  return {
    embeddings: [
      [1, 0],
      [0, 1],
      [0, 0],
    ],
    hidden: [1, 1],
    head: [
      [1, 0],
      [0, 1],
      [-1, 1],
    ],
    z,
    probabilities,
    loss: -Math.log(probabilities[2]),
    dlogits,
    inputGradients: [
      [dlogits[0] - dlogits[2], dlogits[1] + dlogits[2]],
      [dlogits[0] - dlogits[2], dlogits[1] + dlogits[2]],
      [0, 0],
    ],
  };
}
export function vocabularyMass(added = false) {
  const masses = Array(added ? 3 : 2).fill(1),
    sum = masses.length;
  return {
    masses,
    sum,
    probabilities: masses.map((v) => v / sum),
    loss: Math.log(sum),
    increase: Math.log(3 / 2),
  };
}
export function mixtureReduction(
  domainBlocks = 15,
  replayBlocks = 5,
  domainTargets = 6,
  replayTargets = 2,
) {
  const nd = domainBlocks * domainTargets,
    nr = replayBlocks * replayTargets;
  assert(nd + nr > 0);
  return {
    domainBlocks,
    replayBlocks,
    domainTargets,
    replayTargets,
    nd,
    nr,
    total: nd + nr,
    blockShare: replayBlocks / (domainBlocks + replayBlocks),
    targetShare: nr / (nd + nr),
    blockGradient: replayGradient(replayBlocks / (domainBlocks + replayBlocks)),
    pooledGradient: replayGradient(nr / (nd + nr)),
    sourceGradient: replayGradient(0.25),
  };
}
export function controlledSgd(rate, gradient, theta = 0) {
  assert(Number.isFinite(rate) && rate >= 0 && Number.isFinite(gradient) && Number.isFinite(theta));
  const next = theta - rate * gradient,
    reef = 1 / (1 + Math.exp(-next));
  return {
    rate,
    gradient,
    before: theta,
    delta: -rate * gradient,
    theta: next,
    probabilities: [reef, 1 - reef],
    domainLoss: -Math.log(reef),
    broadLoss: -Math.log(1 - reef),
  };
}
export function exactLearningRate(step) {
  return learningRate(step, 1000, 50, 3e-5, 3e-6);
}
export function groupedSplit(group) {
  const bucket = Number(BigInt('0x' + createHash('sha256').update(group).digest('hex')) % 4n);
  return {
    bucket,
    split: bucket === 0 ? 'validation' : 'train',
  };
}
export function manifestAdmission(r) {
  if (
    ['rights', 'scrubbed', 'evalOnly'].some((k) => typeof r[k] !== 'boolean') ||
    !Number.isInteger(r.tokens) ||
    r.tokens < 0
  )
    return {
      pass: false,
      reason: 'invalid type',
    };
  return {
    pass: r.rights && r.scrubbed && !r.evalOnly,
    reason: !r.rights
      ? 'rights absent'
      : !r.scrubbed
        ? 'privacy unresolved'
        : r.evalOnly
          ? 'held out'
          : 'admit',
  };
}
export function normalizedFingerprint(text) {
  return createHash('sha256').update(text.toLowerCase().trim().replace(/\s+/g, ' ')).digest('hex');
}
export function byteReport(nll, tokens, bytes) {
  assert(nll >= 0 && tokens > 0 && bytes > 0);
  return {
    nll,
    tokens,
    bytes,
    ppl: Math.exp(nll / tokens),
    natsPerByte: nll / bytes,
    bitsPerByte: nll / bytes / Math.LN2,
  };
}
export function chooseCheckpoint(rows, base, budget) {
  return rows
    .map((r) => ({
      ...r,
      delta: r.general - base,
      eligible: r.general - base <= budget + 1e-12,
    }))
    .filter((r) => r.eligible)
    .sort((a, b) => b.task - a.task || a.domain - b.domain)[0];
}
export function centroidCoordinates() {
  return CENTROID_INPUTS[0].map(
    (_v, i) => CENTROID_INPUTS.reduce((sum, row) => sum + row[i], 0) / 3,
  );
}
export function freshReductionFrame(state) {
  const pooled = phraseProgress(state, 'cpt-fresh-pooled', 1, 0.2, 0.4),
    wrong = phraseProgress(state, 'cpt-fresh-block', 1, 0.5, 0.65),
    repair = phraseProgress(state, 'cpt-fresh-repair', 1, 0.75, 0.9),
    actualWrong = wrong * (1 - repair),
    share = interpolate(1 / 7, 1 / 3, actualWrong);
  return {
    pooled,
    wrong,
    repair,
    share,
    gradient: replayGradient(share),
    weights: Array.from(
      {
        length: 14,
      },
      (_, i) => interpolate(1 / 14, i < 12 ? 1 / 18 : 1 / 6, actualWrong),
    ),
    settled: [pooled, wrong, repair].every((v) => v === 0 || v === 1),
  };
}
