import { built, clamped, spokenProgress, unit } from './arithmetic.mjs';
import {
  book,
  center,
  collapseCodes,
  enc,
  eps,
  lower,
  lv,
  mu,
  pixels,
  priorDraw,
} from './fixtures.mjs';
export function encode(values) {
  return [center, lower].map((indices) => {
    // The fixture's hundredths are whole percentage points. Sum in those units
    // so rearrangements with equal totals reach the decoder as identical pairs.
    const percentagePoints = indices.reduce((sum, i) => sum + 100 * values[i], 0);
    return percentagePoints / (100 * indices.length);
  });
}
export const z = encode(pixels);
export const decode = (v) =>
  pixels.map((_, i) =>
    Math.min(
      1,
      Math.max(
        0,
        0.08 +
          (center.includes(i) ? v[0] : [5, 8, 10, 13].includes(i) ? 0.12 * v[0] : 0) +
          (lower.includes(i) ? v[1] : [15, 18, 21, 22].includes(i) ? 0.35 * v[1] : 0),
      ),
    ),
  );
export const recon = decode(z);
export const mse = recon.reduce((a, v, i) => a + (v - pixels[i]) ** 2, 0) / 25;
export const collapseOutputs = (u) => {
  const pair = collapseCodes.map(decode);
  const mean = pair[0].map((value, i) => (value + pair[1][i]) / 2);
  return collapseCodes.map((code) =>
    decode(code).map((value, i) => mean[i] + (1 - u) * (value - mean[i])),
  );
};
export const collapseDifference = (u) => {
  const [a, b] = collapseOutputs(u);
  return Math.max(...a.map((v, i) => Math.abs(v - b[i])));
};
export const sig = lv.map((v) => Math.exp(v / 2));
export const sample = mu.map((v, i) => v + sig[i] * eps[i]);
export const dist = book.map((v) => v.reduce((a, x, i) => a + (x - enc[i]) ** 2, 0));
export function reparameterizationFrame(beat, progress, cues) {
  const phase = (a, z) => {
    const t = Math.max(0, Math.min(1, (progress - a) / (z - a)));
    return t * t * (3 - 2 * t);
  };
  let mean = [...mu],
    scale = [...sig],
    stage = 'posterior sample',
    changingScale = false;
  if (beat === 0) {
    const spoken = (id, fallback) => {
      const cue = cues?.[id];
      return cue
        ? cue.phase === 'before'
          ? 0
          : cue.phase === 'after'
            ? 1
            : cue.progress
        : fallback;
    };
    const scaling = spoken('noise-scale', phase(0.06, 0.38)),
      shifting = spoken('noise-shift', phase(0.43, 0.76));
    mean = mu.map((v) => v * shifting);
    scale = sig.map((v) => 1 + (v - 1) * scaling);
    stage = shifting > 0 ? 'add the posterior mean' : 'scale the fixed noise';
  } else if (beat === 1) {
    const spoken = (id, fallback) => {
      const cue = cues?.[id];
      return cue
        ? cue.phase === 'before'
          ? 0
          : cue.phase === 'after'
            ? 1
            : cue.progress
        : fallback;
    };
    const shifting = spoken('encoder-mean-b2-1', phase(0.06, 0.36)),
      scaling = spoken('encoder-scale-b2-2', phase(0.48, 0.8));
    mean = [mu[0] + 0.7 * shifting, mu[1]];
    scale = sig.map((v, i) => v + [0.55, 0.35][i] * scaling);
    changingScale = cues?.['encoder-scale-b2-2']
      ? cues['encoder-scale-b2-2'].phase !== 'before'
      : progress >= 0.48;
    stage = changingScale ? 'change scale · noise stays fixed' : 'change mean · noise stays fixed';
  } else {
    mean = [0, 0];
    scale = [1, 1];
    stage = 'generation draw · standard-normal prior';
  }
  return {
    mean,
    scale,
    changingScale,
    noise: [...eps],
    sample: beat === 2 ? [...priorDraw] : mean.map((v, i) => v + scale[i] * eps[i]),
    stage,
  };
}
export function priorDecodeFrame(progress = 1, latent = priorDraw) {
  const reveal = Math.max(0, Math.min(1, progress));
  return {
    latent: [...latent],
    pixels: decode(latent),
    reveal,
  };
}
export function codebookFrame(beat, progress, cues) {
  const seconds = progress * [18.888, 21.098, 23.456][Math.min(beat, 2)];
  const spoken = (id, fallback) => {
    const cue = cues?.[id];
    return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : fallback;
  };
  const compared = 3 * spoken('code-compare', Math.max(0, Math.min(1, (seconds - 5.3) / 2.4))),
    snap = spoken('code-snap', Math.max(0, Math.min(1, (seconds - 10) / 1.3)));
  return {
    seconds,
    distances: [...dist],
    codes: book.map((row) => [...row]),
    encoder: [...enc],
    compared: beat > 0 ? 3 : compared,
    selected: beat > 0 || snap > 0,
    snap: beat > 0 ? 1 : snap,
  };
}
export function spatialCompressionFrame(progress = 0) {
  const reveal = Math.max(0, Math.min(1, progress)),
    inputSide = 512,
    latentSide = 64,
    stride = inputSide / latentSide;
  const inputPatchPositions = stride * stride,
    patchProgress = Math.min(1, 2 * reveal),
    moving = Math.max(0, 2 * reveal - 1),
    transportProgress = moving * moving * (3 - 2 * moving);
  return {
    mode: 'spatial',
    progress: reveal,
    stride,
    inputSide,
    latentSide,
    inputPositionCount: inputSide * inputSide,
    latentPositionCount: latentSide * latentSide,
    positionReduction: (inputSide * inputSide) / (latentSide * latentSide),
    revealedPatchPositions: Math.ceil(inputPatchPositions * patchProgress),
    transportProgress,
    targetPositionVisible: transportProgress === 1,
  };
}
export function codesFrame(beat, progress, cues = {}) {
  if (beat < 2)
    return {
      mode: 'codebook',
      ...codebookFrame(beat, progress, cues),
    };
  const cue = cues['latent-patch-b3-1'],
    reveal = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : cue.progress
      : progress;
  const countCue = cues['latent-position-count-b3-2'],
    costCue = cues['spatial-cost-caveat-b3-3'];
  return {
    ...spatialCompressionFrame(reveal),
    countVisible: countCue ? countCue.phase !== 'before' : progress >= 0.4,
    costVisible: costCue ? costCue.phase !== 'before' : progress >= 0.65,
  };
}
export const PIXELS = pixels;
export const CENTER = center;
export const LOWER = lower;
export const ENCODED = z;
export const RECONSTRUCTION = recon;
export const MSE = mse;
export const decodeCode = (values) => decode(values);
export const probePixels = pixels.map((value, i) =>
  center.includes(i) ? z[1] : lower.includes(i) ? z[0] : value,
);
export const probeCode = encode(probePixels);
export function bottleneckFrame(beat, progress = 0, cues) {
  const first = beat > 0 ? 1 : spokenProgress(cues, 'center-add', unit(progress * 2));
  const average = beat > 0 ? 1 : spokenProgress(cues, 'center-mean', unit(progress * 2 - 1));
  const second =
    beat > 1 ? 1 : beat === 1 ? spokenProgress(cues, 'lower-add', unit(progress * 2)) : 0;
  const exchange =
    beat > 2 ? 1 : beat === 2 ? spokenProgress(cues, 'pixel-exchange', unit(progress * 2)) : 0;
  const values = [...pixels];
  values[6] = pixels[6] + (pixels[12] - pixels[6]) * exchange;
  values[12] = pixels[12] + (pixels[6] - pixels[12]) * exchange;
  const centerCount = Math.min(4, Math.floor(first * 4 + 1e-9));
  const lowerCount = Math.min(2, Math.floor(second * 2 + 1e-9));
  return {
    values,
    centerCount,
    centerSum: center.slice(0, centerCount).reduce((sum, i) => sum + pixels[i], 0),
    lowerCount,
    lowerSum: lower.slice(0, lowerCount).reduce((sum, i) => sum + pixels[i], 0),
    centerReady: average === 1,
    lowerReady: second === 1,
    originalCode: [...z],
    candidateCode: encode(values),
    candidateReady: beat > 2 && spokenProgress(cues, 'equal-code', unit(progress * 3)) === 1,
    exchange,
  };
}
export function reconstructionFrame(beat, progress = 0, cues) {
  const differences = pixels.map((value, i) => value - recon[i]);
  const errors = differences.map((value) => value * value);
  const subtract = beat > 0 ? 1 : spokenProgress(cues, 'pixel-subtract', unit(progress * 2));
  const square = beat > 0 ? 1 : spokenProgress(cues, 'pixel-square', unit(progress * 2 - 1));
  const count =
    beat > 0
      ? Math.min(
          25,
          Math.floor(25 * spokenProgress(cues, 'error-sum', unit(progress * 1.7)) + 1e-9),
        )
      : 0;
  const sum = errors.slice(0, count).reduce((a, value) => a + value, 0);
  return {
    differences,
    errors,
    selected: 6,
    differenceReady: subtract === 1,
    squareReady: square === 1,
    count,
    sum,
    mean: errors.reduce((a, value) => a + value, 0) / 25,
    meanReady: beat > 0 && spokenProgress(cues, 'error-mean', unit(progress * 2 - 1)) === 1,
  };
}
export function codeSwapFrame() {
  const changed = decode(probeCode);
  return {
    originalCode: [...z],
    replacementCode: [...probeCode],
    originalOutput: [...recon],
    changedOutput: changed,
    originalMSE: mse,
    changedMSE:
      changed.reduce((sum, value, i) => sum + (value - pixels[i]) ** 2, 0) / pixels.length,
  };
}
export function posteriorFrame(beat, progress = 0, cues) {
  const select = spokenProgress(cues, 'posterior-select', unit(progress * 2));
  const other = spokenProgress(cues, 'posterior-other', unit(progress * 2));
  const back = spokenProgress(cues, 'posterior-return', unit(progress * 3));
  const scale = spokenProgress(cues, 'posterior-scale', unit(progress * 2 - 0.5));
  const inputMix = beat === 0 ? 0 : beat === 1 ? other : 1 - back;
  const mean = mu.map((value) => value * (1 - 2 * inputMix) * (beat === 0 ? select : 1));
  const logVariance =
    beat < 2
      ? lv.map((value) => value * (beat === 0 ? select : 1))
      : [lv[0] * (1 - back + back * scale), lv[1]];
  return {
    inputMix,
    input: pixels.map((value, i) => value + (probePixels[i] - value) * inputMix),
    mean,
    logVariance,
    scale: logVariance.map((value) => Math.exp(value / 2)),
    transformReady: beat === 2 && scale === 1,
  };
}
export function vqGradientSnapshot(rate = 0.1) {
  const selected = dist.indexOf(Math.min(...dist)),
    entry = book[selected],
    target = [0.5, 0.1],
    theta = [1, 1],
    commitmentWeight = 0.25;
  const prediction = entry.map((value, i) => value * theta[i]);
  const reconstructionGradient = prediction.map((value, i) => (value - target[i]) * theta[i]);
  const decoderGradient = prediction.map((value, i) => (value - target[i]) * entry[i]);
  const codebookGradient = entry.map((value, i) => 2 * (value - enc[i]));
  const commitmentGradient = enc.map((value, i) => 2 * commitmentWeight * (value - entry[i]));
  const encoderGradient = reconstructionGradient.map((value, i) => value + commitmentGradient[i]);
  return {
    selected,
    encoder: [...enc],
    entry: [...entry],
    target,
    theta,
    rate,
    commitmentWeight,
    reconstructionGradient,
    decoderGradient,
    codebookGradient,
    commitmentGradient,
    encoderGradient,
    nextEncoder: enc.map((value, i) => value - rate * encoderGradient[i]),
    commitmentOnlyEncoder: enc.map((value, i) => value - rate * commitmentGradient[i]),
    nextEntry: entry.map((value, i) => value - rate * codebookGradient[i]),
    nextTheta: theta.map((value, i) => value - rate * decoderGradient[i]),
    nextCodebook: book.map((value, i) =>
      i === selected
        ? value.map((component, j) => component - rate * codebookGradient[j])
        : [...value],
    ),
  };
}
export function gaussianEvidenceState(progress) {
  const a = clamped(progress),
    mean = 0.15 * a,
    variance = 1 - 0.5 * a,
    x = 0.3;
  const expectedLogLikelihood = -0.5 * Math.log(2 * Math.PI) - 0.5 * (variance + (x - mean) ** 2);
  const priorKL = 0.5 * (mean * mean + variance - 1 - Math.log(variance));
  const logEvidence = -0.5 * Math.log(4 * Math.PI) - (x * x) / 4;
  const elbo = expectedLogLikelihood - priorKL;
  return {
    mean,
    variance,
    expectedLogLikelihood,
    priorKL,
    logEvidence,
    elbo,
    gap: Math.max(0, logEvidence - elbo),
  };
}
export function binaryInformationState(progress) {
  const a = clamped(progress),
    joint = [
      [0.5 - 0.25 * a, 0.25 * a],
      [0.25 * a, 0.5 - 0.25 * a],
    ];
  const mutualInformation = joint
    .flat()
    .reduce((sum, p) => sum + (p === 0 ? 0 : p * Math.log(p / 0.25)), 0);
  return {
    joint,
    marginal: [0.5, 0.5],
    aggregateKL: 0,
    mutualInformation,
    averageKL: mutualInformation,
  };
}
export function freeBitsState(values = [0.2, 2.2], floor = 1) {
  const average = values.reduce((a, v) => a + v, 0) / values.length;
  return {
    values: [...values],
    floor,
    average,
    groupCharge: Math.max(floor, average),
    groupGradients: values.map(() => (average > floor ? 1 / values.length : 0)),
    exampleCharge: values.reduce((a, v) => a + Math.max(floor, v), 0) / values.length,
    exampleGradients: values.map((v) => (v > floor ? 1 / values.length : 0)),
  };
}
export function freshCollisionState(beat = 0, progress = 0, cues) {
  const a = Array(25).fill(0.08),
    b = [...a];
  [0.4, 0.8, 0.6, 1].forEach((v, i) => (a[center[i]] = v));
  [0.6, 0.6, 0.8, 0.8].forEach((v, i) => (b[center[i]] = v));
  for (const i of lower) a[i] = b[i] = [0.2, 0.4][lower.indexOf(i)];
  const codes = [encode(a), encode(b)],
    outputs = codes.map(decode),
    state = {
      beat,
      beatP: progress,
      cues,
    };
  return {
    inputs: [a, b],
    codes,
    outputs,
    mse: outputs.map((row, j) => row.reduce((sum, v, i) => sum + (v - [a, b][j][i]) ** 2, 0) / 25),
    codeReady: beat > 1 || (beat === 1 && built(state, 'vae-fresh-collision-code')),
    decodeReady: beat > 1 || (beat === 1 && built(state, 'vae-fresh-collision-decoded')),
    errorReady: beat === 2 && built(state, 'vae-fresh-collision-errors'),
  };
}
