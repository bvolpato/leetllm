import { expectedCost, policyCost } from '../arithmetic.mjs';
import { boostCue } from '../construction.mjs';
import { COSTS } from '../fixtures.mjs';
import { BASELINE_DECISIONS, allAlertApril, evaluateAprilThreshold } from '../model.mjs';
import { cellText, chapterText, dot, line } from '../defaults.mjs';

const aprilHurdles = [
  ['Heartbeat ≥ 18 h', policyCost({ falseAlarms: 30, missedStandard: 2, missedPriority: 8 })],
  ['Always alert', allAlertApril.cost],
  ['Never alert', evaluateAprilThreshold(1 + Number.EPSILON).cost],
];
const example = { score: 0.2, outcomes: [0, 1, 0, 0, 0, 1, 0, 0, 1, 0] };

function calibration(ctx, api, state) {
  const { C } = api;
  const cue = (id, beat) => boostCue(state, id, beat);
  const opened = Math.floor(example.outcomes.length * cue('cost-calibration-open', 3));
  const missed = example.outcomes.reduce((n, y) => n + y, 0);
  const observed = missed / example.outcomes.length;
  const errors = example.outcomes.map((y) => (example.score - y) ** 2);
  const showErrors = cue('cost-calibration-rest', 4) > 0;
  cellText(ctx, api, 'Illustrative jobs with a score of 0.20', 545, 345, C.ink, 38);
  api.focus.target('calibration-jobs', () => {
    example.outcomes.forEach((label, i) => {
      const x = 290 + 125 * (i % 5);
      const y = 474 + 170 * Math.floor(i / 5);
      const visible = i < opened;
      dot(ctx, api, x, y, visible ? (label ? C.pink : C.blue) : C.muted, 29);
      const caption = visible ? (label ? 'miss' : 'on time') : '?';
      cellText(
        ctx,
        api,
        showErrors ? errors[i].toFixed(2) : caption,
        x,
        y + 70,
        visible ? C.ink : C.muted,
        26,
      );
    });
    if (showErrors) {
      cellText(ctx, api, 'Squared error per job   (score − outcome)²', 545, 820, C.ink, 31);
      if (cue('cost-brier-total', 4) === 1) {
        const brier = errors.reduce((sum, e) => sum + e, 0) / errors.length;
        cellText(
          ctx,
          api,
          'Mean across these 10 jobs = ' + brier.toFixed(2),
          545,
          900,
          C.yellow,
          33,
        );
      }
    } else if (cue('cost-calibration-expected', 3) === 1)
      cellText(
        ctx,
        api,
        'Expected   ' + example.outcomes.length + ' × 0.20 = 2 misses',
        545,
        820,
        C.cyan,
        33,
      );
    if (!showErrors && cue('cost-calibration-observed', 3) === 1)
      cellText(
        ctx,
        api,
        'Observed   ' + missed + ' misses / ' + example.outcomes.length + ' jobs',
        545,
        900,
        C.pink,
        33,
      );
  });
  api.focus.target('calibration-plot', () => {
    const plot = api.teaching.axes({
      x: 1090,
      y: 380,
      width: 570,
      height: 440,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 0.2, 0.5, 1],
      yTicks: [0, 0.3, 0.5, 1],
      xLabel: 'Mean predicted probability',
      yLabel: 'Observed fraction missed',
      fontSize: 26,
    });
    const a = plot.point(0, 0);
    const b = plot.point(1, 1);
    line(ctx, api, a.x, a.y, b.x, b.y, C.muted, 2);
    if (cue('cost-calibration-point', 3) === 1) {
      const p = plot.point(example.score, observed);
      line(ctx, api, p.x, a.y, p.x, p.y, C.cyan, 2);
      line(ctx, api, a.x, p.y, p.x, p.y, C.cyan, 2);
      dot(ctx, api, p.x, p.y, C.pink, 13);
    }
    if ((state.beat ?? 0) > 3 || cue('cost-calibration-rest-groups', 3) === 1) {
      const groups = [
        [example.score, observed],
        [0.5, 9 / 20],
        [0.8, 7 / 10],
      ];
      api.teaching.curve({
        plot,
        points: groups.map(([x, y]) => ({ x, y })),
        color: C.pink,
        width: 3,
        progress: 1,
      });
      groups.slice(1).forEach(([x, y]) => {
        const p = plot.point(x, y);
        dot(ctx, api, p.x, p.y, C.pink, 9);
      });
    }
  });
  if ((state.beat ?? 0) > 3)
    cellText(
      ctx,
      api,
      'Scheduler study   ·   select one global cutoff using April costs',
      960,
      1005,
      C.ink,
      33,
    );
}
export function drawCostPolicy(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { C } = api;
  const cue = (id, index) => boostCue(state, id, index);
  api.focus.target('cost-policy-model', () => {
    if (beat >= 3) {
      calibration(ctx, api, state);
      return;
    }
    if (beat === 2) {
      cellText(
        ctx,
        api,
        'April    ·    140 jobs    ·    58 missed their deadline',
        960,
        300,
        C.ink,
        38,
      );
      for (const [i, [name, cost]] of aprilHurdles.entries()) {
        const y = 480 + i * 195;
        chapterText(ctx, api, name, 160, y, 38);
        const visible =
          i === 0 || (i === 1 ? cue('baseline-hurdle', 2) : cue('cost-never', 2)) === 1;
        if (visible) {
          const width = (cost / aprilHurdles[2][1]) * 915;
          api.rect(ctx, 600, y - 34, width, 40, i === 1 ? C.cyan : C.blue, undefined, 0);
          chapterText(ctx, api, cost + ' units', 640 + width, y, 36);
        }
      }
      return;
    }
    const plot = api.teaching.axes({
      x: 285,
      y: 382,
      width: 910,
      height: 465,
      xDomain: [0, 0.2],
      yDomain: [0, 32],
      xTicks: [0, 0.05, 0.1, 0.15, 0.2],
      yTicks: [0, 8, 16, 24, 32],
      xLabel: 'True breach probability',
      yLabel: 'Expected cost per job (units)',
      fontSize: 27,
    });
    const lines = [
      ['Alert', true, 0, C.yellow],
      ['Quiet · standard', false, COSTS.standardMiss, C.blue],
      ['Quiet · priority', false, COSTS.priorityMiss, C.pink],
    ];
    const locator = beat === 1 && cue('cost-pair', 1) > 0;
    for (const [i, [name, alert, missCost, color]] of lines.entries()) {
      const cost = (risk) => expectedCost({ risk, alert, missCost });
      const sweep = cue(alert ? 'cost-policy-step-1' : 'cost-quiet-rise', 0);
      const risk = beat ? 0.2 : 0.04 + 0.16 * sweep;
      api.teaching.curve({
        plot,
        points: [0, risk].map((x) => ({ x, y: cost(x) })),
        color,
        width: 5,
        progress: 1,
      });
      if (beat === 0 && sweep > 0 && sweep < 1) {
        const tip = plot.point(risk, cost(risk));
        dot(ctx, api, tip.x, tip.y, color, 9);
      }
      const y = 410 + 150 * i;
      chapterText(ctx, api, name, 1340, y, 34, color);
      const expression = alert ? '(1 − p) × ' + COSTS.falseAlarm : 'p × ' + missCost;
      const numeric = alert
        ? (1 - COSTS.risk).toFixed(2) + ' × ' + COSTS.falseAlarm
        : COSTS.risk + ' × ' + missCost;
      chapterText(
        ctx,
        api,
        locator ? numeric + ' = ' + cost(COSTS.risk).toFixed(2) : expression,
        1340,
        y + 54,
        29,
        C.ink,
      );
    }
    if (beat === 1 && cue('cost-boundary', 1) === 1) {
      BASELINE_DECISIONS.forEach(({ missCost }) => {
        const p = COSTS.falseAlarm / (COSTS.falseAlarm + missCost);
        const at = plot.point(p, expectedCost({ risk: p, alert: true, missCost }));
        dot(ctx, api, at.x, at.y, C.ink, 9);
      });
      cellText(
        ctx,
        api,
        'Alert boundary = false-alarm cost / (false-alarm cost + miss cost)',
        960,
        1000,
        C.ink,
        31,
      );
    }
    if (locator) {
      const at = plot.point(COSTS.risk, 0);
      cellText(ctx, api, 'p = ' + COSTS.risk, at.x, 305, C.cyan, 31);
      line(ctx, api, at.x, 400, at.x, at.y, C.cyan, 2);
      lines.forEach(([, alert, missCost, color]) => {
        const p = plot.point(COSTS.risk, expectedCost({ risk: COSTS.risk, alert, missCost }));
        dot(ctx, api, p.x, p.y, color, 9);
      });
    }
  });
}
export default {
  id: 'cost-policy',
  draw: drawCostPolicy,
  cues: [
    'cost-policy-step-1',
    'cost-quiet-rise',
    'cost-boundary',
    'cost-pair',
    'cost-policy-step-3',
    'baseline-hurdle',
    'cost-never',
    'cost-calibration-expected',
    'cost-calibration-open',
    'cost-calibration-observed',
    'cost-calibration-point',
    'cost-calibration-rest-groups',
    'cost-calibration-rest',
    'cost-brier-total',
  ],
};
