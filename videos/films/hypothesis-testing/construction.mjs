import { bootstrapBins, clamp, exactSignPower } from './arithmetic.mjs';
import { developmentBootstrap, sortedDevelopmentMeans, studies } from './fixtures.mjs';
import { completedHypothesisResult, cueProgress } from './model.mjs';
export function trimmedBootstrapBins(progress) {
  const removed = Math.floor(200 * clamp(progress));
  return bootstrapBins(sortedDevelopmentMeans.slice(removed, 8000 - removed));
}
export function assignmentFrame(s) {
  const arrive = cueProgress(s, 'forty-arrive', 0),
    sort = cueProgress(s, 'forty-sort', 0, 0.5, 0.9);
  return {
    count: Math.floor(6 + 22 * arrive + 12 * sort),
    sort,
    receipt: completedHypothesisResult(s, 'forty-lift', 1),
  };
}
export function studyFrame(s) {
  const b = s.beat ?? 0,
    kind = b === 0 ? 'null' : b === 1 ? 'small' : 'large',
    n = kind === 'large' ? 64 : 13,
    p = cueProgress(s, b === 0 ? 'size-studies' : b === 1 ? 'power-studies' : 'power-grow', b);
  return {
    kind,
    n,
    list: studies[kind],
    count: Math.floor(200 * p),
    result: exactSignPower(n),
    receipt: completedHypothesisResult(
      s,
      b === 0 ? 'size-receipt' : b === 1 ? 'power-receipt' : 'power-large',
      b,
    ),
  };
}
export function bootstrapFrame(s) {
  const p = cueProgress(s, 'bootstrap-draw', 0),
    position = p < 0.6 ? (p / 0.6) * 3 : 3 + ((p - 0.6) / 0.4) * 37,
    count = Math.min(40, Math.floor(position)),
    b = s.beat ?? 0;
  return {
    count,
    copyProgress: count === 40 ? 1 : position % 1,
    indices: developmentBootstrap.first.slice(0, count),
    draws:
      b > 1 ? 8000 : b < 1 ? 0 : Math.floor(8000 * cueProgress(s, 'bootstrap-many', 1, 0.4, 0.9)),
    intervalProgress: cueProgress(s, 'bootstrap-interval', 2),
    zero: completedHypothesisResult(s, 'bootstrap-zero', 2),
  };
}
export function holdoutFrame(s) {
  return {
    count: Math.floor(400 * cueProgress(s, 'holdout-rows', 0)),
    counts: completedHypothesisResult(s, 'holdout-count', 0),
    lift: completedHypothesisResult(s, 'holdout-lift', 1),
    interval: cueProgress(s, 'holdout-interval', 1, 0.4, 0.75),
    release: completedHypothesisResult(s, 'release-receipt', 2),
  };
}
