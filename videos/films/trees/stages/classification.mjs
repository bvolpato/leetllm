import { firstNewtonLeaves, sigmoid, validationAfterBoosting } from '../model.mjs';
import { rows, stump } from '../fixtures.mjs';
import { drawConstructionText as label } from '../defaults.mjs';

const firstRound = validationAfterBoosting(1);
const fourthRound = validationAfterBoosting(4);

export function drawClassification(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const applied = beat < 3 ? 0 : api.focus.progress('scale-logits', api.phase(p, 0.1, 0.4));
  const stepKnown = (id) =>
    beat > 2 ||
    (beat === 2 &&
      api.focus.progress(
        id,
        api.phase(p, id === 'left-step' ? 0 : 0.6, id === 'left-step' ? 0.15 : 0.95),
      ) === 1);
  label(ctx, api, 'Start each row at p = 0.50', 125, 253, 37, C.ink, 'left');
  label(ctx, api, 'Ambiguity cut ' + stump.cut.toFixed(2), 1795, 253, 34, C.muted, 'right');
  label(ctx, api, 'Request', 130, 405, 30, C.muted, 'left');
  label(ctx, api, 'Label − p', 130, 493, 30, C.muted, 'left');
  if (beat > 0) label(ctx, api, 'p × (1 − p)', 130, 562, 30, C.muted, 'left');

  firstNewtonLeaves.forEach(({ group, residual, curvature, step }, side) => {
    const start = side === 0 ? 440 : 1320;
    const cx = start + (group.length - 1) * 64;
    const id = side === 0 ? 'left-step' : 'right-step';
    label(ctx, api, (side ? 'Right' : 'Left') + ' leaf · ' + group.length + ' rows', cx, 335, 32);
    group.forEach((r, j) => {
      const x = start + 128 * j;
      api.circle(ctx, x, 395, 32, r[2] ? C.pink : C.blue);
      label(ctx, api, 'R' + (rows.indexOf(r) + 1), x, 405, 27, C.bg);
      label(ctx, api, r[2] ? '+0.5' : '−0.5', x, 493, 37, C.yellow);
      if (beat > 0) label(ctx, api, '0.25', x, 562, 33, C.cyan);
    });
    if (beat > 0) {
      api.path(
        ctx,
        [
          { x: start - 55, y: 584 },
          { x: start - 55, y: 605 },
          { x: 2 * cx - start + 55, y: 605 },
          { x: 2 * cx - start + 55, y: 584 },
        ],
        { color: C.muted, width: 3 },
      );
      api.focus.target(side ? 'right-quotient' : 'left-quotient', () => {
        const quotient =
          (residual > 0 ? '+' : '−') + Math.abs(residual).toFixed(1) + ' / ' + curvature.toFixed(2);
        label(
          ctx,
          api,
          quotient +
            '  =  ' +
            (stepKnown(id) ? (step > 0 ? '+' : '−') + Math.abs(step).toFixed(1) : '?'),
          cx,
          695,
          49,
        );
      });
    }
  });
  if (beat < 3) {
    label(
      ctx,
      api,
      beat === 0
        ? 'Each row asks for a change in the logit.'
        : beat === 1
          ? 'What full logit step does the left leaf propose?'
          : 'Next, keep one tenth of each step.',
      960,
      884,
      45,
      C.yellow,
    );
    return;
  }
  const at = (v) => 340 + (v - 0.4) * 6200;
  const y = 862;
  api.focus.target('score-ruler', () => {
    api.line(ctx, at(0.4), y, at(0.6), y, C.muted, 4);
    [0.4, 0.5, 0.6].forEach((v) => {
      api.line(ctx, at(v), y - 15, at(v), y + 20, v === 0.5 ? C.yellow : C.muted, 3);
      label(ctx, api, v === 0.5 ? '0.50 review cutoff' : v.toFixed(2), at(v), y + 85, 29, C.muted);
    });
    firstNewtonLeaves.forEach(({ step }, i) => {
      const logit = step * 0.1 * applied;
      const probability = sigmoid(logit);
      const x = at(probability);
      const color = i === 0 ? C.blue : C.pink;
      api.circle(ctx, x, y, 14, color);
      const anchor = i === 0 ? 'right' : 'left';
      label(
        ctx,
        api,
        (i === 0 ? 'Left ' : 'Right ') +
          'logit ' +
          logit.toFixed(2) +
          ' → ' +
          probability.toFixed(3),
        x + (i === 0 ? -23 : 23),
        y - 45,
        32,
        color,
        anchor,
      );
    });
  });
  api.focus.target('validation-loss', () => {
    const showLoss = api.focus.progress('compare-rounds', api.phase(p, 0.49, 0.66)) > 0;
    if (showLoss)
      label(
        ctx,
        api,
        'Rounds 1 → 4    ·    Validation log loss ' +
          firstRound.loss.toFixed(3) +
          ' → ' +
          fourthRound.loss.toFixed(3) +
          '    ·    Still miss ' +
          fourthRound.misses.join(' and '),
        960,
        1021,
        32,
      );
  });
}
export default {
  id: 'classification',
  draw: drawClassification,
  cues: ['left-step', 'right-step', 'scale-logits', 'compare-rounds'],
};
