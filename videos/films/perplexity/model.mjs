import { BITS_CUES, nll, probabilities, stable } from './fixtures.mjs';
import { cueProgress } from './construction.mjs';
export function logSpaceSnapshot(progress) {
  const count = 1 + Math.floor(4999 * Math.max(0, Math.min(1, (progress - 0.08) / 0.7)));
  const loss = -Math.log(stable[0]),
    sum = count * loss;
  return {
    count,
    probability: stable[0],
    product: Math.exp(-sum),
    sum,
    mean: sum / count,
    perplexity: Math.exp(sum / count),
  };
}
export function introSnapshot(beat, progress, cues = {}) {
  const observed = ['on', 'the', 'mat'],
    initialPrefix = ['The', 'cat', 'sat'];
  const started = (id, fallback) => (cues[id] ? cues[id].phase !== 'before' : fallback);
  const complete = (id, fallback) => (cues[id] ? cues[id].phase === 'after' : fallback);
  const count =
    beat < 1
      ? Number(complete('intro-observed-on', progress >= 0.12))
      : beat > 1
        ? 3
        : 1 +
          Number(complete('intro-observed-the', progress >= 0.1)) +
          Number(complete('intro-observed-mat', progress >= 0.2));
  const active =
    beat < 1
      ? 0
      : beat > 1
        ? 2
        : started('intro-observed-mat', progress >= 0.16)
          ? 2
          : started('intro-observed-the', progress >= 0.04)
            ? 1
            : 0;
  const targets = observed.slice(0, count).map((token, index) => ({
    token,
    prefix: [...initialPrefix, ...observed.slice(0, index)],
    probability: probabilities[index],
    loss: nll[index],
  }));
  const sum = targets.reduce((value, target) => value + target.loss, 0),
    mean = count ? sum / count : null;
  return {
    count,
    active,
    prefix: [...initialPrefix, ...observed.slice(0, active)],
    targets,
    observed: active < count ? observed[active] : null,
    probability: active < count ? probabilities[active] : null,
    sum,
    mean,
    perplexity: mean === null ? null : Math.exp(mean),
  };
}
export function surpriseSnapshot(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * 17.738;
  // The unchanged narration moves to an unlikely target, then examines the rise near zero.
  const probability =
    beat < 1
      ? 0.8
      : beat > 1
        ? 0.02
        : elapsed <= 3.275
          ? 0.8 + (0.1 - 0.8) * cueProgress(elapsed, 0.1, 3.275)
          : 0.1 + (0.02 - 0.1) * cueProgress(elapsed, 3.6875, 6.35);
  const surprise = -Math.log(probability);
  const bitsOpacity =
    beat < 1 ? 0 : beat > 1 ? 1 : cueProgress(elapsed, BITS_CUES.start, BITS_CUES.end);
  return {
    probability,
    surprise,
    bits: surprise / Math.LN2,
    bitsOpacity,
    elapsed,
  };
}
export function aggregationSnapshot(beat, progress) {
  const all = [0.5, 0.5, ...Array(8).fill(2)],
    elapsed = Math.max(0, Math.min(1, progress)) * 17.904,
    count = beat > 0 ? 10 : Math.floor(10 * cueProgress(elapsed, 11.25, 16.4375));
  const sum = all.slice(0, count).reduce((total, value) => total + value, 0);
  return {
    all,
    count,
    sum,
    mean: count ? sum / count : null,
    perplexity: count ? Math.exp(sum / count) : null,
  };
}
export function meanSnapshot(beat, progress) {
  const count = beat > 0 ? 3 : Math.min(3, Math.floor(3 * cueProgress(progress, 0.22, 0.64)));
  const sum = nll.slice(0, count).reduce((value, loss) => value + loss, 0);
  const mean = count === 3 ? sum / count : null;
  return {
    count,
    sum,
    mean,
    perplexity: mean === null ? null : Math.exp(mean),
    exponentiated: beat > 1 || (beat === 1 && progress >= 0.28),
  };
}
