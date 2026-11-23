import { scoredMature } from '../fixtures.mjs';
import { confusion } from '../model.mjs';
import { dot, line, text } from '../defaults.mjs';
import { monitoringScene } from '../storyboard.mjs';

const historical = scoredMature[0].threshold;
const trial = 0.8;
const original = confusion(scoredMature, historical);
const replayed = confusion(scoredMature, trial);
const x = (score) => 435 + 750 * score;

export default monitoringScene(
  'decision-quality',
  ['review', 'labels', 'precision', 'recall', 'cost', 'ask', 'move', 'past-four', 'result'],
  (ctx, api, cue) => {
    const { C } = api;
    const moving = cue.started('move');
    const betweenJobs = 0.7;
    const sweep =
      historical +
      (betweenJobs - historical) * cue.progress('move') +
      (trial - betweenJobs) * cue.progress('past-four');
    const threshold = Math.round(100 * sweep) / 100;
    text(ctx, api, 'Job', 145, 296, 30, C.muted, 'left');
    text(ctx, api, 'Score', 343, 296, 30, C.muted);
    text(ctx, api, 'Review?', 1305, 296, 30, C.muted);
    text(ctx, api, 'Deadline', 1505, 296, 30, C.muted);
    text(ctx, api, 'Error cost', 1730, 296, 30, C.muted);
    text(
      ctx,
      api,
      `${moving ? 'Replay' : 'Stored'} threshold  ${threshold.toFixed(2)}`,
      x(threshold),
      239,
      33,
      C.yellow,
    );
    line(ctx, api, x(threshold), 265, x(threshold), 710, C.yellow, 5);
    if (cue.started('ask') && !moving) {
      text(ctx, api, '0.80?', x(trial), 308, 29, C.blue);
      line(ctx, api, x(trial), 320, x(trial), 710, C.blue, 2);
    }
    scoredMature.forEach((row, i) => {
      const y = 368 + 75 * i;
      const review = row.score >= threshold;
      text(ctx, api, row.id, 145, y + 11, 32, C.ink, 'left');
      text(ctx, api, row.score.toFixed(2), 343, y + 11, 33, C.ink);
      line(ctx, api, x(0), y, x(1), y, C.muted, 2);
      dot(ctx, api, x(row.score), y, cue.started('review') && review ? C.pink : C.blue, 13);
      if (cue.started('review'))
        text(ctx, api, review ? 'Yes' : 'No', 1305, y + 11, 32, review ? C.pink : C.muted);
      if (cue.started('labels'))
        text(ctx, api, row.label ? 'Missed' : 'Met', 1505, y + 11, 32, row.label ? C.ink : C.muted);
      if (cue.done('cost') && review !== row.label) {
        text(ctx, api, review ? 'false alert: +2' : 'miss: +10', 1730, y + 11, 29, C.yellow);
      } else if (row.decision && !row.label && !review) {
        text(ctx, api, '0 (was 2)', 1730, y + 11, 29, C.green);
      }
    });
    const result = moving ? replayed : original;
    const earned = cue.done('result');
    if (cue.done('precision') && (!moving || earned))
      text(ctx, api, `precision ${result.tp} / ${result.tp + result.fp}`, 410, 809, 37, C.cyan);
    if (cue.done('recall') && (!moving || earned))
      text(ctx, api, `recall ${result.tp} / ${result.tp + result.fn}`, 915, 809, 37, C.cyan);
    if (cue.done('cost') && (!moving || earned))
      text(ctx, api, `2×${result.fp} + 10×${result.fn} = ${result.cost}`, 1460, 809, 37, C.yellow);
    if (cue.started('ask') && !moving) {
      text(ctx, api, 'False alert = 2 units   /   unflagged miss = 10 units', 960, 870, 30, C.ink);
      text(
        ctx,
        api,
        'At 0.80, which miss would escape review? Would total error cost fall?',
        960,
        929,
        36,
        C.yellow,
      );
    } else if (moving) {
      text(
        ctx,
        api,
        earned
          ? '5 fixed outcomes   /   3 reviews → 1   /   2 cost units → 10'
          : 'Replay on the same five recorded outcomes',
        960,
        929,
        35,
        C.ink,
      );
    } else {
      text(
        ctx,
        api,
        'Historical replay   /   5 mature jobs with all 5 labels',
        960,
        929,
        30,
        C.muted,
      );
    }
  },
);
