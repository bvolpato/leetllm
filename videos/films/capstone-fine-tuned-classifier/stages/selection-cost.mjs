import { drawScoreDesk, sceneClock, sweep } from '../desk.mjs';
import { articleSelectionRows } from '../fixtures.mjs';
import {
  thresholdCounts,
  extraReviewCost,
  missedEscalationCost,
  costCutoff,
  reviewLoss,
  guardedLoss,
} from '../model.mjs';

const cutoffs = [0.35, 0.5, 0.75];

function drawLosses(ctx, api, clock) {
  const { C } = api;
  const pMax = 0.5;
  const lossMax = guardedLoss(pMax);
  const x = (p) => 210 + (930 * p) / pMax;
  const y = (loss) => 835 - (420 * loss) / lossMax;
  api.focus.target('loss-plot', () => {
    api.text(ctx, 'Expected cost per ticket', 130, 281, 37, C.ink);
    api.text(ctx, 'Cost units', 130, 355, 28, C.muted);
    for (let unit = 0; unit <= lossMax; unit++) {
      api.line(ctx, x(0), y(unit), x(pMax), y(unit), C.muted, unit ? 1 : 3);
      api.text(ctx, unit, x(0) - 25, y(unit) + 10, 30, C.muted, 'right');
    }
    for (const p of [0, 0.1, 0.2, 0.3, 0.4, 0.5]) {
      api.text(ctx, p.toFixed(1), x(p), y(0) + 49, 29, C.muted, 'center');
    }
    api.text(
      ctx,
      'Calibrated chance of escalation, p',
      (x(0) + x(pMax)) / 2,
      963,
      33,
      C.ink,
      'center',
    );
    const curves = [
      [reviewLoss, 'cost-review', C.cyan],
      [guardedLoss, 'cost-agent', C.blue],
    ];
    for (const [loss, cue, color] of curves) {
      const p = pMax * clock.progress(cue);
      if (p > 0) api.line(ctx, x(0), y(loss(0)), x(p), y(loss(p)), color, 7);
    }
    if (clock.after('cost-tie')) {
      api.circle(ctx, x(costCutoff), y(reviewLoss(costCutoff)), 12, C.yellow);
      api.line(
        ctx,
        x(costCutoff),
        y(reviewLoss(costCutoff)) + 15,
        x(costCutoff),
        y(0) + 12,
        C.yellow,
        2,
      );
      api.text(ctx, costCutoff.toFixed(2), x(costCutoff), y(0) + 82, 31, C.yellow, 'center');
    }
  });
  const column = 1245;
  api.text(ctx, 'Extra review   ' + extraReviewCost + ' units', column, 334, 34, C.cyan);
  api.text(ctx, 'Missed case   ' + missedEscalationCost + ' units', column, 391, 34, C.blue);
  api.text(ctx, 'Correct route   0 units', column, 448, 30, C.muted);
  api.focus.target('cost-ticket', () => {
    const p = 0.3;
    const applied = clock.progress('cost-ticket') > 0;
    api.text(ctx, applied ? 'Ticket with p = 0.30' : 'Expected loss', column, 565, 40, C.ink);
    api.text(
      ctx,
      applied ? 'Review    2 × 0.70' : 'Review    2 × (1 − p)',
      column,
      642,
      36,
      C.cyan,
    );
    api.text(ctx, applied ? 'Guarded   6 × 0.30' : 'Guarded   6 × p', column, 714, 36, C.blue);
    if (applied) {
      const answered = clock.after('cost-answer');
      if (answered) {
        api.circle(ctx, x(p), y(reviewLoss(p)), 11, C.cyan, C.bg);
        api.circle(ctx, x(p), y(guardedLoss(p)), 11, C.blue, C.bg);
      }
      const comparison =
        reviewLoss(p).toFixed(2) + ' < ' + guardedLoss(p).toFixed(2) + '   ·   Review';
      api.text(ctx, answered ? comparison : 'Which costs less?', column, 857, 39, C.ink);
    } else if (clock.after('cost-agent')) {
      api.text(ctx, '2 × (1 − p) = 6 × p', column, 801, 35, C.ink);
      if (clock.after('cost-tie')) {
        api.text(ctx, '2 / (2 + 6) = ' + costCutoff.toFixed(2), column, 865, 39, C.yellow);
        api.text(ctx, 'cutoff = FP cost / (FP cost + FN cost)', column, 934, 30, C.muted);
      }
    }
  });
}

function drawSelection(ctx, api, state, clock) {
  const { C } = api;
  const high = clock.progress('selection-high');
  const cutoff =
    high > 0 ? sweep(0.5, 0.75, high) : sweep(0.35, 0.5, clock.progress('selection-middle'));
  const chosen = clock.after('selection-choose');
  api.text(ctx, 'Selection set    /    six hand-authored review scores', 122, 238, 30, C.muted);
  api.focus.target('score-rows', () => {
    drawScoreDesk(ctx, api, articleSelectionRows, chosen ? 0.35 : cutoff, {
      firstY: 405,
      spacing: 66,
      showRoutes: clock.progress('selection-low') > 0,
      pendingTicket: clock.after('selection-score') ? null : 'Angry routine',
    });
  });
  api.focus.target('sweep-history', () => {
    const results = ['selection-low', 'selection-middle', 'selection-high'];
    cutoffs.forEach((cut, i) => {
      const x = 122 + 577 * i;
      const color = chosen && cut === 0.35 ? C.yellow : C.muted;
      api.line(ctx, x, 827, x + 510, 827, color, chosen && cut === 0.35 ? 5 : 2);
      api.text(ctx, 'Cutoff  ' + cut.toFixed(2), x, 875, 33, color);
      if (clock.after(results[i])) {
        const { TP, FP, FN } = thresholdCounts(articleSelectionRows, cut);
        api.text(
          ctx,
          TP + ' caught   ·   ' + FP + ' extra   ·   ' + FN + ' missed',
          x,
          928,
          32,
          C.ink,
        );
      }
    });
    if (state.beat >= 2) {
      const message = chosen
        ? 'Freeze 0.35 and score new gate tickets'
        : 'Zero required misses, at most one extra review. Which cutoff?';
      api.text(ctx, message, 960, 1014, 35, chosen ? C.yellow : C.ink, 'center');
    }
  });
}

export function drawSelectionCost(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  if (state.beat >= 4) drawLosses(ctx, api, clock);
  else drawSelection(ctx, api, state, clock);
}

export default {
  id: 'selection-cost',
  draw: drawSelectionCost,
  cues: [
    'selection-score',
    'selection-low',
    'selection-middle',
    'selection-high',
    'selection-choose',
    'cost-review',
    'cost-agent',
    'cost-tie',
    'cost-ticket',
    'cost-answer',
  ],
};
