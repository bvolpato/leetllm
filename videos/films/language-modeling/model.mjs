import { bound, phase } from './arithmetic.mjs';
import {
  CONDITIONAL_ROWS,
  CORPUS,
  FITTED_NGRAM,
  SENTENCE,
  SPLIT_CAT,
  TARGET_PROBS,
  VERBS,
} from './fixtures.mjs';
import { cue, cueAmount, finished, languageStep, occurrence, started } from './construction.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax, tokenHistoryState } from 'vizmatic';
export const LOSS = -TARGET_PROBS.reduce((sum, p) => sum + Math.log(p), 0) / 4;
export function conditionalDistribution(prefix) {
  const key = Array.isArray(prefix) ? prefix.join(' ') : prefix;
  assert(CONDITIONAL_ROWS[key], 'No supplied conditional row for ' + key);
  return CONDITIONAL_ROWS[key].map(([token, probability]) => ({
    token,
    probability,
  }));
}
export function selectSample(prefix, sample) {
  assert(sample >= 0 && sample < 1);
  let total = 0;
  for (const item of conditionalDistribution(prefix)) {
    total += item.probability;
    if (sample < total) return item.token;
  }
  throw new Error('The supplied row must sum to one');
}
export function counts(corpus = CORPUS) {
  const row = Object.fromEntries(VERBS.map((w) => [w, 0]));
  for (const sentence of corpus) {
    const words = sentence.split(' ');
    for (let i = 0; i < words.length - 1; i++) if (words[i] === 'cat') row[words[i + 1]]++;
  }
  return row;
}
export function countState(beat, progress, cues) {
  const ids = ['count-first', 'count-second', 'count-third'];
  const observed =
    beat > 0 ? 3 : ids.filter((id, i) => finished(cues, id, progress >= 0.13 + i * 0.15)).length;
  const row = counts(CORPUS.slice(0, observed));
  const normalize = beat > 1 || (beat === 1 && finished(cues, 'count-normalize', progress > 0.3));
  const alpha = beat === 2 ? cue(cues, 'count-smooth', phase(progress, 0.4, 0.65)) : 0;
  const total = Object.values(row).reduce((a, b) => a + b, 0) + 3 * alpha;
  return {
    observed,
    row,
    normalize,
    alpha,
    total,
    values: VERBS.map((word) => (normalize ? (row[word] + alpha) / total : row[word])),
  };
}
export function contextState(beat, progress, cues) {
  const hungry = beat === 1 && started(cues, 'context-hungry', progress > 0.1);
  const adjective = hungry ? 'hungry' : 'tired',
    h = hungry ? 2 : -2,
    weights = [0, -1, 1];
  const logits = weights.map((w) => w * h);
  const known = beat > 0 || started(cues, 'context-head', progress > 0.65);
  return {
    adjective,
    h,
    weights,
    logits,
    probabilities: stableSoftmax(logits),
    known,
  };
}
export function sequenceState(beat, progress, cues) {
  const ids = ['sequence-the', 'sequence-cat', 'sequence-sat', 'sequence-end'];
  const amounts = ids.map((id, i) =>
    beat === 0
      ? i === 3
        ? 0
        : cue(cues, id, phase(progress, 0.08 + i * 0.13, 0.19 + i * 0.13))
      : i < 3
        ? 1
        : cue(cues, id, phase(progress, 0.06, 0.3)),
  );
  const count = amounts.filter((p) => p >= 1).length;
  return {
    amounts,
    count,
    product: TARGET_PROBS.slice(0, count).reduce((a, b) => a * b, 1),
    animatedProduct: TARGET_PROBS.reduce(
      (a, probability, i) => a * (1 + (probability - 1) * amounts[i]),
      1,
    ),
    constructing: amounts.some((p) => p > 0 && p < 1),
  };
}
export function teacherForcingState(beat, progress, cues) {
  let index = 0;
  if (beat === 0)
    ['teacher-first', 'teacher-second', 'teacher-third', 'teacher-fourth'].forEach((id, i) => {
      if (started(cues, id, progress > 0.26 + i * 0.1)) index = i;
    });
  else index = 2;
  const reveal = beat > 0 || finished(cues, 'teacher-shift', progress > 0.25);
  const ignore = beat === 2 && started(cues, 'teacher-loss-mask', progress > 0.2);
  const blocked = beat > 1 || (beat === 1 && started(cues, 'teacher-block', progress > 0.55));
  return {
    index,
    reveal,
    ignore,
    blocked,
    inputs: ['start', 'The', 'cat', 'sat'],
    targets: SENTENCE,
    prefix: ['start', 'The', 'cat', 'sat'].slice(0, index + 1),
    scored: [!ignore, !ignore, true, true],
  };
}
export function lossConstructionState(beat, progress, cues) {
  const construction = beat > 0 ? 1 : cue(cues, 'loss-terms', phase(progress, 0.25, 0.55));
  const terms = TARGET_PROBS.map((p) => -Math.log(p));
  const progressByTerm = terms.map((_, i) => bound(4 * construction - i));
  const sum = terms.reduce((a, b) => a + b, 0),
    mean = sum / 4;
  const meanReady = beat > 0 || finished(cues, 'loss-mean', progress > 0.82);
  const perplexityReady =
    beat > 1 || (beat === 1 && finished(cues, 'loss-perplexity', progress > 0.3));
  const split = beat > 2 || (beat === 2 && finished(cues, 'loss-resegment', progress > 0.51));
  const probabilities = split ? [TARGET_PROBS[0], ...SPLIT_CAT, ...TARGET_PROBS.slice(2)] : TARGET_PROBS;
  return {
    terms,
    progressByTerm,
    sum,
    mean,
    meanReady,
    perplexityReady,
    split,
    probabilities,
    perplexity: Math.exp(mean),
    splitMean: sum / 5,
    splitPerplexity: Math.exp(sum / 5),
  };
}
export function generationState(beat, progress, cues) {
  const append = beat > 0 ? 1 : cue(cues, 'generation-append', phase(progress, 0.25, 0.5));
  const selected = beat > 0 || started(cues, 'generation-sample', progress > 0.12);
  const next = beat > 0 || (append >= 1 && started(cues, 'generation-next', progress > 0.55));
  const stopped = beat === 1 && finished(cues, 'generation-stop', progress > 0.3);
  return {
    append,
    selected,
    next,
    stopped,
    prefix: append >= 1 ? ['The', 'cat', 'slept'] : ['The', 'cat'],
    distribution: conditionalDistribution(next ? 'The cat slept' : 'The cat'),
    sample: next ? 0.95 : 0.75,
    choice: next ? 'end' : 'slept',
  };
}
export function transferState(beat, progress, cues) {
  const revealed = beat > 1 || (beat === 1 && finished(cues, 'transfer-targets', progress > 0.2));
  const prefixKnown = beat > 1 || (beat === 1 && started(cues, 'transfer-context', progress > 0.4));
  const lossKnown = beat > 1 || (beat === 1 && finished(cues, 'transfer-loss', progress > 0.72));
  const generated = beat === 2 ? cue(cues, 'transfer-generate', phase(progress, 0.12, 0.4)) : 0;
  const stopped = beat === 2 && finished(cues, 'transfer-end', progress > 0.6);
  return {
    revealed,
    prefixKnown,
    lossKnown,
    generated,
    stopped,
    target: 'slept',
    probability: 0.3,
    loss: -Math.log(0.3),
  };
}
export function fittedPrediction(prefix = ['function', 'returns']) {
  const ids = prefix.map((token) => FITTED_NGRAM.vocab.indexOf(token));
  assert(ids.length === 2 && ids.every((i) => i >= 0));
  const features = ids.flatMap((i) => FITTED_NGRAM.embeddings[i]);
  const logits = FITTED_NGRAM.bias.map((bias, j) =>
    features.reduce((n, x, i) => n + x * FITTED_NGRAM.weights[i][j], bias),
  );
  return {
    features,
    logits,
    probabilities: stableSoftmax(logits),
    valueTerms: features.map((x, i) => x * FITTED_NGRAM.weights[i][7]),
    valueBias: FITTED_NGRAM.bias[7],
  };
}
export const rawKvBytes = ({ layers, heads, width, positions, bytes = 2 }) =>
  2 * layers * heads * width * positions * bytes;
export function architectureMemoryState(progress) {
  const heads = 8 - Math.round(4 * bound(progress));
  const bytes = rawKvBytes({
    layers: 32,
    heads,
    width: 128,
    positions: 4 * 32768,
    bytes: 2,
  });
  return {
    heads,
    bytes,
    gib: bytes / 1024 ** 3,
  };
}
export function localGradientCredit() {
  const input = [2, -1],
    weights = [
      [0.3, -0.2, 0.5],
      [0.1, 0.4, -0.2],
    ],
    probabilities = [0.2, 0.5, 0.3],
    target = 2;
  const residual = probabilities.map((p, j) => p - (j === target ? 1 : 0));
  return {
    input,
    weights,
    probabilities,
    target,
    residual,
    weightGradients: input.map((x) => residual.map((g) => x * g)),
    inputGradient: weights.map((row) => row.reduce((n, w, j) => n + w * residual[j], 0)),
  };
}
export function generationWork(prompt, generated) {
  const lengths = Array.from(
    {
      length: generated,
    },
    (_, i) => prompt + i,
  );
  return {
    lengths,
    uncachedPositions: lengths.reduce((a, b) => a + b, 0),
    uncachedCells: lengths.reduce((a, b) => a + b * b, 0),
    cachedPositions: prompt + Math.max(0, generated - 1),
    cachedCells: prompt * prompt + lengths.slice(1).reduce((a, b) => a + b, 0),
  };
}
export function lifecycleSnapshot({
  processed = 2,
  accepted = 0,
  phase = 'resident',
  replayProgress = 0,
} = {}) {
  const prompt = [occurrence('cat-p0', 'The'), occurrence('cat-p1', 'cat')],
    outputs = [occurrence('cat-o0', 'slept'), occurrence('cat-o1', 'end')];
  const picked = outputs.slice(0, accepted),
    history = [...prompt, ...picked];
  return tokenHistoryState({
    prompt,
    accepted: picked,
    processed: history.slice(0, processed),
    emitted: outputs.slice(0, Math.min(1, accepted)),
    phase,
    replayProgress,
  });
}
function freshRolloutState(state) {
  const tick = (beat, id, from, until) => cueAmount(state, beat, id, from, until);
  const rerun = tick(2, 'fresh-rewind', 0.02, 0.12) > 0;
  const first = rerun ? 'waits' : 'runs';
  const second = rerun ? 'here' : 'end';
  const choose = rerun
    ? tick(2, 'fresh-choose-waits', 0.17, 0.3)
    : tick(1, 'fresh-choose-runs', 0.09, 0.17);
  const feed = rerun
    ? tick(2, 'fresh-feed-waits', 0.32, 0.47)
    : tick(1, 'fresh-budgeted-rollout-step-1-1', 0.19, 0.31);
  const finish = rerun
    ? tick(2, 'fresh-choose-here', 0.59, 0.71)
    : tick(1, 'fresh-budgeted-rollout-step-1-2', 0.38, 0.46);
  const prompt = ['A', 'red', 'fox'].map((token, i) => occurrence('fox-p' + i, token));
  const output = [first, second].map((token, i) => occurrence('fox-' + token + i, token));
  const ready = (state.beat ?? 0) >= 1;
  const accepted = finish === 1 ? 2 : choose === 1 || feed === 1 ? 1 : 0;
  const history = tokenHistoryState({
    prompt,
    accepted: output.slice(0, accepted),
    processed: ready ? [...prompt, ...output.slice(0, feed === 1 ? 1 : 0)] : [],
    emitted: output.slice(0, rerun ? accepted : Math.min(accepted, 1)),
  });
  const promptText = prompt.map((v) => v.token).join(' ');
  const prefix = feed === 1 ? promptText + ' ' + first : promptText;
  const record = ['runs', 'end'];
  const factors = record.map((token, i) => {
    const context = [promptText, ...record.slice(0, i)].join(' ');
    return conditionalDistribution(context).find((entry) => entry.token === token).probability;
  });
  const probability = factors.reduce((a, b) => a * b, 1);
  const meanNll = -Math.log(probability) / record.length;
  return {
    history,
    record,
    factors,
    probability,
    meanNll,
    perplexity: Math.exp(meanNll),
    rerun,
    feed,
    prefix,
    row: conditionalDistribution(prefix),
    cacheResult: feed === 1,
    outputResult: finish === 1,
    probabilityResult: tick(1, 'fresh-budgeted-rollout-step-1-4', 0.52, 0.66) === 1,
    lossResult: tick(1, 'fresh-budgeted-rollout-step-1-5', 0.72, 0.84) === 1,
    stopReason: accepted < 2 ? null : second === 'end' ? 'end token' : 'output limit',
  };
}
export function extendedLanguageState(id, state) {
  const S = (beat, index = 0) => languageStep(id, state, beat, index),
    b = state.beat ?? 0;
  if (id === 'cache-lifecycle') {
    const accepted = b === 0 ? (S(0, 3) === 1 ? 1 : 0) : b === 1 ? (S(1, 4) === 1 ? 2 : 1) : 2;
    const processed = b === 0 ? (S(0, 1) === 1 ? 2 : 0) : b === 1 ? (S(1, 2) === 1 ? 3 : 2) : 3;
    const mode =
      b === 2 ? (S(2, 1) === 1 ? 'resident' : S(2, 1) > 0 ? 'replay' : 'dropped') : 'resident';
    return lifecycleSnapshot({
      processed,
      accepted,
      phase: mode,
      replayProgress: b === 2 ? S(2, 1) : 0,
    });
  }
  if (id === 'fresh-budgeted-rollout') return freshRolloutState(state);
  if (id === 'neural-forward') {
    const prefix = b === 2 ? ['test', 'returns'] : ['function', 'returns'],
      fit = fittedPrediction(prefix);
    const accumulation = b === 0 ? 0 : b === 1 ? (12 * S(1, 1) + S(1, 2)) / 13 : 1;
    const terms = [...fit.valueTerms, fit.valueBias],
      position = accumulation * terms.length,
      completed = Math.floor(position),
      partial =
        terms.slice(0, completed).reduce((a, v) => a + v, 0) +
        (terms[completed] ?? 0) * (position - completed);
    return {
      prefix,
      ...fit,
      terms,
      accumulation,
      completed,
      partial,
    };
  }
  if (id === 'cache-budget') {
    const positions =
      b === 0 ? (S(0, 3) > 0 ? 2048 + Math.round((32768 - 2048) * S(0, 3)) : 2048) : 32768;
    const requests = b === 1 ? 4 + Math.round(28 * S(1, 0)) : 4;
    return {
      positions,
      requests,
      bytes: rawKvBytes({
        layers: 32,
        heads: 8,
        width: 128,
        positions: positions * requests,
      }),
    };
  }
  if (id === 'temperature-filter') {
    const temperature = b === 0 ? (S(0, 2) > 0 ? 0.5 + 1.5 * S(0, 2) : 1 - 0.5 * S(0, 1)) : 1;
    return {
      temperature,
      probabilities: stableSoftmax([3, 1.5, -1, -2, -3].map((v) => v / temperature)),
    };
  }
  return {
    beat: b,
  };
}
