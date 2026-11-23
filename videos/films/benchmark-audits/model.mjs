import {
  exactPairedP,
  mix,
  motion,
  smooth,
  subsetCoverage,
  wilsonInterval,
} from './arithmetic.mjs';
import { CASES, PAIRS, PROGRAMS, RELEASES, exposureCases, probes } from './fixtures.mjs';
import { auditCue, tracks } from './construction.mjs';
export function scoreCases(model, category) {
  const rows = CASES.filter((row) => !category || row.category === category);
  const correct = rows.filter((row) => row[model]).length;
  return {
    correct,
    total: rows.length,
    rate: correct / rows.length,
  };
}
export function checkProbe(index) {
  const probe = probes[index];
  const words = ['books', 'friday'].map((word) => ({
    word,
    present: probe.answer.toLowerCase().includes(word),
  }));
  return {
    ...probe,
    words,
    literal: words.every((word) => word.present),
  };
}
export function casePosition(index, step, p) {
  const x = 150 + index * 420,
    y = 325,
    used = exposureCases[index].used;
  if (used) {
    if (step === 0)
      return {
        x,
        y,
        settled: false,
      };
    const q = step > 1 ? 1 : p;
    const destinationX = index === 0 ? 165 : 570;
    const movingX = mix(x, destinationX, smooth((q - 0.5) * 2)),
      movingY = mix(y, 660, smooth(q * 2));
    const settled = Math.hypot(destinationX - movingX, 660 - movingY) <= 8;
    return settled
      ? {
          x: destinationX,
          y: 660,
          settled,
        }
      : {
          x: movingX,
          y: movingY,
          settled,
        };
  }
  if (step < 2)
    return {
      x,
      y,
      settled: false,
    };
  const destinationX = index === 1 ? 1065 : 1455;
  const movingX = mix(x, destinationX, smooth(p * 2)),
    movingY = mix(y, 660, smooth((p - 0.5) * 2));
  const settled = Math.hypot(destinationX - movingX, 660 - movingY) <= 8;
  return settled
    ? {
        x: destinationX,
        y: 660,
        settled,
      }
    : {
        x: movingX,
        y: movingY,
        settled,
      };
}
export function releaseResult(candidate, step) {
  const quality = candidate.quality >= 0.98;
  const latency = candidate.ms <= 900;
  const cost = candidate.cost <= 0.015;
  const schema = candidate.schema === 1;
  return {
    qualityPass: quality,
    latencyPass: latency,
    costPass: cost,
    schemaPass: schema,
    eligible: quality && (step < 1 || latency) && (step < 2 || (cost && schema)),
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample({
    beat: state.beat ?? 0,
    beatP: state.beatP ?? 0,
  }).snapshot;
  const p = motion(state.beatP ?? 0);
  const common = {
    step,
    p,
    scores: ['A', 'B'].map((model) => ({
      model,
      ...scoreCases(model),
      renewal: scoreCases(model, 'renewal'),
    })),
  };
  if (id === 'checker')
    return {
      ...common,
      probe: checkProbe(step),
    };
  if (id === 'candidates') {
    const visible = step === 0 ? Math.floor(PAIRS.length * p) : PAIRS.length;
    const revealed = PAIRS.slice(0, visible);
    return {
      ...common,
      visible,
      revealed,
      successes: revealed.filter((pair) => pair.pass).length,
      coverage: subsetCoverage(8, 2, 2),
      selected: step === 2 ? PROGRAMS[0] : null,
    };
  }
  if (id === 'exposure') {
    const rows = exposureCases.map((row, i) => ({
      ...row,
      ...casePosition(i, step, p),
    }));
    return {
      ...common,
      rows,
      regression: rows.filter((row) => row.used && row.settled).length,
      holdout: rows.filter((row) => !row.used && row.settled).length,
    };
  }
  if (id === 'uncertainty') {
    const n = step === 0 ? 3 : 30,
      trueRate = 0.8;
    return {
      ...common,
      n,
      trueRate,
      allPass: trueRate ** n,
    };
  }
  if (id === 'gates')
    return {
      ...common,
      rows: RELEASES.map((row) => ({
        ...row,
        ...releaseResult(row, step),
      })),
      visibleRows: step === 0 ? Math.min(3, Math.floor(p * 3) + 1) : 3,
    };
  return common;
}
export function freshAuditDecision() {
  const paired = exactPairedP(10, 2),
    interval = wilsonInterval(9, 10);
  return {
    total: 200,
    bothPass: 178,
    fixed: 10,
    broken: 2,
    bothFail: 10,
    baselinePass: 180,
    candidatePass: 188,
    pairedP: paired,
    criticalLower: interval.low,
    criticalFloor: 0.85,
    ship: interval.low >= 0.85,
  };
}
export function freshAuditReveal(state) {
  const b = state.beat ?? 0,
    p = state.beatP ?? 0;
  return {
    paired: b > 1 || (b === 1 && auditCue(state, 'ba-fresh-report-pvalue', p > 0.4 ? 1 : 0) === 1),
    bound: b > 1 || (b === 1 && auditCue(state, 'ba-fresh-report-bound', p > 0.75 ? 1 : 0) === 1),
    hold: b === 2 && auditCue(state, 'ba-fresh-report-hold', p > 0.1 ? 1 : 0) === 1,
  };
}
