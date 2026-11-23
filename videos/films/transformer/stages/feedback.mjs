import { EMBED, VOCAB } from '../fixtures.mjs';
import { event, lerpRow, position, sum } from '../arithmetic.mjs';
import {
  FEEDBACK,
  FEEDBACK_IDS,
  FEEDBACK_INPUT,
  MODEL,
  decisionSpatialFrame,
  feedbackFrame,
} from '../model.mjs';
import {
  caption,
  equation,
  plotPoint,
  row,
  target,
  text,
  tokenCards,
  withTransformerLegacyFrame,
} from '../defaults.mjs';
export function paintFeedback(ctx, scene, state, api, C, b, P, f) {
  const current = feedbackFrame(state),
    ids = current.appended ? FEEDBACK_IDS : [0, 1, 2];
  target(ctx, api, 'feedback-prefix', () =>
    tokenCards(ctx, api, C, ids, b >= 2 ? 200 : 260, current.choice, current.appended ? 3 : 2),
  );
  if (b === 0) {
    text(ctx, api, C, 'result · ID 3 · new position 3', 960, 460, 31, C.green, 'center');
    row(ctx, api, C, f, EMBED[3], 260, 520, 650, C.blue);
    text(ctx, api, C, '+', 960, 579, 42, C.ink, 'center');
    row(ctx, api, C, f, position(3), 1040, 520, 650, C.pink);
    target(ctx, api, 'feedback-input', () =>
      row(
        ctx,
        api,
        C,
        f,
        FEEDBACK_INPUT[3].map((v, j) => (j < Math.floor(current.embedded * 4 + 1e-9) ? v : null)),
        420,
        765,
        1100,
        C.cyan,
      ),
    );
  } else if (b === 1) {
    const count = Math.min(4, Math.floor(current.mixture * 4 + 1e-9));
    target(ctx, api, 'feedback-mixture', () => {
      text(ctx, api, C, 'new result query · four legal sources', 960, 430, 30, C.cyan, 'center');
      row(
        ctx,
        api,
        C,
        f,
        FEEDBACK.weights[3].map((v, i) => (i < count ? v : null)),
        420,
        475,
        1100,
        C.cyan,
        78,
        3,
      );
      row(
        ctx,
        api,
        C,
        f,
        Array.from(
          {
            length: 4,
          },
          (_, j) => sum(FEEDBACK.V.slice(0, count).map((v, i) => v[j] * FEEDBACK.weights[3][i])),
        ),
        420,
        625,
        1100,
        C.yellow,
        78,
        3,
      );
    });
    const stages = [FEEDBACK_INPUT[3], FEEDBACK.Y[3], FEEDBACK.Z[3], FEEDBACK.final[3]],
      stageLabels = [
        'new input · before updates',
        'input + attention update',
        'contextual row + feed-forward update',
        'final normalized state',
      ];
    target(ctx, api, 'feedback-output', () => {
      text(ctx, api, C, stageLabels[current.stage], 960, 785, 28, C.green, 'center');
      row(ctx, api, C, f, stages[current.stage], 420, 825, 1100, C.green, 78, 3);
    });
  } else {
    const comparison = decisionSpatialFrame(state),
      plot = api.teaching.axes({
        x: 210,
        y: 360,
        width: 720,
        height: 500,
        xDomain: [0, 1.5],
        yDomain: [0, 1.5],
        xTicks: [0, 0.5, 1, 1.5],
        yTicks: [0, 0.5, 1, 1.5],
        xLabel: 'coordinate 3',
        yLabel: 'coordinate 4',
        equalUnits: true,
        fontSize: 26,
      });
    const resultSide = plot.point(0.25, 1.3),
      valueSide = plot.point(1.23, 0.25);
    text(ctx, api, C, 'result', resultSide.x, resultSide.y, 29, C.cyan, 'center');
    text(ctx, api, C, 'value', valueSide.x, valueSide.y, 29, C.cyan, 'center');
    target(ctx, api, 'decision-comparison', () => {
      api.teaching.curve({
        plot,
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1.5,
            y: 1.5,
          },
        ],
        color: C.muted,
        width: 3,
      });
      const old = plotPoint(ctx, api, plot, [MODEL.final[2][2], MODEL.final[2][3]]),
        first = api.circle(ctx, old.x, old.y, 12, C.yellow);
      text(ctx, api, C, '1', old.x - 25, old.y - 18, 27, C.yellow, 'right');
      const moving = event(state, 3, 'feedback-point', 0.2, 0.5);
      if (moving > 0) {
        const next = plotPoint(
          ctx,
          api,
          plot,
          lerpRow(
            [MODEL.final[2][2], MODEL.final[2][3]],
            [FEEDBACK.final[3][2], FEEDBACK.final[3][3]],
            moving,
          ),
        );
        api.circle(ctx, next.x, next.y, 16, C.green);
        if (comparison.known) text(ctx, api, C, '2', next.x + 25, next.y + 30, 27, C.green);
      }
    });
    text(ctx, api, C, '1: the row · 2: result row', 1420, 312, 26, C.muted, 'center');
    text(ctx, api, C, 'pairwise view · result versus value', 1420, 365, 29, C.yellow, 'center');
    equation(ctx, api, C, 'z_{result}=0.5s_3+s_4', 1420, 430, 35, C.cyan);
    equation(ctx, api, C, 'z_{value}=1.5s_3', 1420, 485, 35, C.cyan);
    text(ctx, api, C, 'diagonal: equal scores', 1420, 540, 28, C.muted, 'center');
    target(ctx, api, 'full-vocabulary-scores', () => {
      text(
        ctx,
        api,
        C,
        comparison.known ? 'step 2 · six four-coordinate scores' : 'step 1 shown · predict step 2',
        1420,
        600,
        28,
        C.muted,
        'center',
      );
      const zero = 1370;
      api.line(ctx, zero, 620, zero, 880, C.muted, 1);
      VOCAB.forEach((word, i) => {
        const score = comparison.scores[i],
          y = 638 + i * 42,
          width = score * 110;
        text(ctx, api, C, word, 1180, y + 13, 25, C.ink, 'right');
        if (score !== 0)
          api.rect(
            ctx,
            Math.min(zero, zero + width),
            y - 11,
            Math.abs(width),
            24,
            i === 3 || i === 5 ? C.cyan : C.muted,
          );
        text(ctx, api, C, f(score, 3), 1740, y + 13, 25, C.ink, 'right');
      });
    });
    target(ctx, api, 'feedback-choice', () =>
      text(
        ctx,
        api,
        C,
        comparison.choice === null
          ? comparison.known
            ? 'new row plotted · which token wins?'
            : 'predict the new point and winner'
          : 'value · ID 5 · second computed choice',
        1420,
        952,
        30,
        comparison.choice === null ? C.muted : C.green,
        'center',
      ),
    );
  }
  caption(
    ctx,
    api,
    C,
    'The chosen vocabulary ID selects the next input embedding · weights stay fixed across steps',
  );
}
export function drawFeedbackStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintFeedback);
}
export default {
  id: 'feedback',
  draw: drawFeedbackStage,
  cues: [
    'append-token',
    'feedback-embedding',
    'feedback-read',
    'feedback-state',
    'feedback-point',
    'feedback-choice',
  ],
};
