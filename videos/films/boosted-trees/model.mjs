import { MSE, betterPolicy, expectedCost, policyCost, sigmoid } from './arithmetic.mjs';
import {
  APRIL_SCORED_ROWS,
  CLASS_FIXTURE,
  COSTS,
  DELAY_FIXTURE,
  MAY_POLICY,
  MONTHS,
  ROUND_POINTS,
} from './fixtures.mjs';
export const RESIDUALS = Object.freeze(
  DELAY_FIXTURE.actual.map((value, index) => value - DELAY_FIXTURE.initial[index]),
);
export const LEAF_CORRECTIONS = Object.freeze(
  [0, 1].map((leaf) => {
    const rows = RESIDUALS.filter((_, index) => DELAY_FIXTURE.leaves[index] === leaf);
    return rows.reduce((sum, value) => sum + value, 0) / rows.length;
  }),
);
export const UPDATED_DELAY = Object.freeze(
  DELAY_FIXTURE.initial.map(
    (value, index) =>
      value + DELAY_FIXTURE.learningRate * LEAF_CORRECTIONS[DELAY_FIXTURE.leaves[index]],
  ),
);
export const CLASS_ROWS = Object.freeze(
  CLASS_FIXTURE.labels.map((label, id) => {
    const probability = sigmoid(CLASS_FIXTURE.initialLogit);
    const gradient = probability - label;
    const logitAfterIllustration =
      CLASS_FIXTURE.initialLogit - Math.sign(gradient) * CLASS_FIXTURE.illustrationStep;
    return {
      id,
      label,
      probability,
      gradient,
      logitAfterIllustration,
      probabilityAfterIllustration: sigmoid(logitAfterIllustration),
    };
  }),
);
export function classificationTreeStep() {
  const rows = CLASS_ROWS.map((row) => ({
    ...row,
    feature: row.id + 1,
    hessian: row.probability * (1 - row.probability),
    leaf: row.id === 0 ? 0 : 1,
  }));
  const leaves = [0, 1].map((leaf) => {
    const members = rows.filter((row) => row.leaf === leaf),
      gradient = members.reduce((sum, row) => sum + row.gradient, 0),
      hessian = members.reduce((sum, row) => sum + row.hessian, 0);
    return {
      leaf,
      gradient,
      hessian,
      value: -gradient / hessian,
    };
  });
  return {
    rows,
    leaves,
    learningRate: 0.5,
    logits: rows.map((row) => 0.5 * leaves[row.leaf].value),
  };
}
export const BASELINE_DECISIONS = Object.freeze(
  ['standard', 'priority'].map((tier) => {
    const missCost = tier === 'standard' ? COSTS.standardMiss : COSTS.priorityMiss;
    const alertCost = expectedCost({
      risk: COSTS.risk,
      missCost,
      alert: true,
    });
    const noAlertCost = expectedCost({
      risk: COSTS.risk,
      missCost,
      alert: false,
    });
    return {
      tier,
      missCost,
      alertCost,
      noAlertCost,
      action: alertCost <= noAlertCost ? 'alert' : 'leave alone',
    };
  }),
);
export function evaluateAprilThreshold(threshold, rows = APRIL_SCORED_ROWS) {
  if (!Number.isFinite(threshold)) throw new TypeError('threshold must be finite');
  const ids = new Set();
  const outcomes = rows.map((row) => {
    if (
      !Number.isInteger(row.id) ||
      ids.has(row.id) ||
      !Number.isFinite(row.score) ||
      row.score < 0 ||
      row.score > 1 ||
      ![0, 1].includes(row.label) ||
      typeof row.priority !== 'boolean'
    )
      throw new TypeError('invalid scored April row');
    ids.add(row.id);
    return {
      ...row,
      alert: row.score >= threshold,
    };
  });
  const count = (predicate) => outcomes.filter(predicate).length;
  const tp = count((row) => row.label === 1 && row.alert),
    fp = count((row) => row.label === 0 && row.alert);
  const fn = count((row) => row.label === 1 && !row.alert),
    tn = count((row) => row.label === 0 && !row.alert);
  const priorityMisses = count((row) => row.label === 1 && !row.alert && row.priority);
  const standardMisses = fn - priorityMisses;
  const falseAlarmCost = fp * COSTS.falseAlarm,
    standardMissCost = standardMisses * COSTS.standardMiss,
    priorityMissCost = priorityMisses * COSTS.priorityMiss;
  return {
    threshold,
    outcomes,
    tp,
    fp,
    fn,
    tn,
    priorityMisses,
    standardMisses,
    alerts: tp + fp,
    falseAlarmCost,
    standardMissCost,
    priorityMissCost,
    cost: falseAlarmCost + standardMissCost + priorityMissCost,
  };
}
export const APRIL_BOUNDARIES = Object.freeze(
  [0, ...new Set(APRIL_SCORED_ROWS.map((row) => row.score)), 1 + Number.EPSILON].sort(
    (a, b) => a - b,
  ),
);
export const searchAprilThresholds = (boundaries = APRIL_BOUNDARIES) =>
  boundaries.map((value) => evaluateAprilThreshold(value)).reduce(betterPolicy);
export const selectedApril = searchAprilThresholds();
export const allAlertApril = evaluateAprilThreshold(0);
export const APRIL_POLICY = Object.freeze({
  threshold: selectedApril.threshold,
  missed: selectedApril.tp + selectedApril.fn,
  falseAlarms: selectedApril.fp,
  allAlertFalseAlarms: allAlertApril.fp,
});
export const SNAPSHOTS = {
  opening: [
    {
      stage: 0,
      threshold: selectedApril.threshold,
      action: 'Apply the stored inclusive cutoff',
    },
    {
      stage: 1,
      threshold: Number(selectedApril.threshold.toFixed(6)),
      action: 'Replay the same scores at the displayed cutoff',
    },
    {
      stage: 2,
      threshold: Number(selectedApril.threshold.toFixed(6)),
      action: 'Inspect the four silenced jobs',
    },
  ],
  clock: MONTHS.map((month, index) => ({
    ...month,
    active: index,
  })),
  residual: [
    {
      stage: 0,
      actual: DELAY_FIXTURE.actual,
      prediction: DELAY_FIXTURE.initial,
      residuals: RESIDUALS,
      corrections: null,
      updated: DELAY_FIXTURE.initial,
      mse: MSE(DELAY_FIXTURE.initial),
    },
    {
      stage: 1,
      actual: DELAY_FIXTURE.actual,
      prediction: DELAY_FIXTURE.initial,
      residuals: RESIDUALS,
      corrections: LEAF_CORRECTIONS,
      updated: DELAY_FIXTURE.initial,
      mse: MSE(DELAY_FIXTURE.initial),
    },
    {
      stage: 2,
      actual: DELAY_FIXTURE.actual,
      prediction: DELAY_FIXTURE.initial,
      residuals: RESIDUALS,
      corrections: LEAF_CORRECTIONS,
      updated: UPDATED_DELAY,
      mse: MSE(UPDATED_DELAY),
    },
  ],
  classification: [
    {
      stage: 0,
      rows: CLASS_ROWS,
      after: false,
    },
    {
      stage: 1,
      rows: CLASS_ROWS,
      after: true,
    },
    {
      stage: 2,
      rows: CLASS_ROWS,
      after: true,
    },
  ],
  baseline: [
    {
      tier: 'standard',
      rows: BASELINE_DECISIONS,
      focus: 'standard',
    },
    {
      tier: 'standard',
      rows: BASELINE_DECISIONS,
      focus: 'standard',
    },
    {
      tier: 'priority',
      rows: BASELINE_DECISIONS,
      focus: 'priority',
    },
    {
      tier: 'priority',
      rows: BASELINE_DECISIONS,
      focus: 'priority',
    },
  ],
  rounds: [
    {
      points: ROUND_POINTS.slice(0, 1),
      chosen: null,
      stage: 0,
    },
    {
      points: ROUND_POINTS.slice(0, 2),
      chosen: 50,
      stage: 1,
    },
    {
      points: ROUND_POINTS,
      chosen: 50,
      stage: 2,
    },
  ],
  threshold: [
    {
      stage: 0,
    },
    {
      stage: 1,
    },
    {
      stage: 2,
    },
  ],
  holdout: [
    {
      active: 'freeze',
      costs: null,
    },
    {
      active: 'selected',
      costs: {
        selected: policyCost({
          falseAlarms: MAY_POLICY.selected.falseAlarms,
        }),
        allAlert: policyCost({
          falseAlarms: MAY_POLICY.allAlert.falseAlarms,
        }),
        heartbeat: MAY_POLICY.heartbeatCost,
      },
    },
    {
      active: 'compare',
      costs: {
        selected: policyCost({
          falseAlarms: MAY_POLICY.selected.falseAlarms,
        }),
        allAlert: policyCost({
          falseAlarms: MAY_POLICY.allAlert.falseAlarms,
        }),
        heartbeat: MAY_POLICY.heartbeatCost,
      },
    },
  ],
  release: [
    {
      active: 'priority',
      cost: policyCost({
        falseAlarms: MAY_POLICY.selected.falseAlarms,
      }),
      slices: [
        {
          name: 'Priority',
          ...MAY_POLICY.priority,
        },
        {
          name: 'Large-input proxy',
          ...MAY_POLICY.largeModel,
        },
      ],
    },
    {
      active: 'all-slices',
      cost: policyCost({
        falseAlarms: MAY_POLICY.selected.falseAlarms,
      }),
      slices: [
        {
          name: 'Priority',
          ...MAY_POLICY.priority,
        },
        {
          name: 'Large model',
          ...MAY_POLICY.largeModel,
        },
      ],
    },
    {
      active: 'ready',
      cost: policyCost({
        falseAlarms: MAY_POLICY.selected.falseAlarms,
      }),
      slices: [
        {
          name: 'Priority',
          ...MAY_POLICY.priority,
        },
        {
          name: 'Large model',
          ...MAY_POLICY.largeModel,
        },
      ],
    },
  ],
};
