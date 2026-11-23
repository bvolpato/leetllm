import { runs, verifyRun } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawPlatforms(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const run = runs[1];
  const report = verifyRun(run);
  const showMethod = ['record-input', 'record-metric', 'follow-file', 'bind-dataset'];
  const fields = [
    ['Run 2   /   first repair', 'log_params', 'run.config'],
    ['Unnecessary abstentions   ' + report.unnecessary, 'log_metrics', 'run.log'],
    ['Saved case report', 'log_artifact', 'run.log_artifact'],
    ['Frozen evaluation cases', 'log_input', 'run.use_artifact'],
  ];
  api.text(ctx, 'Evidence from run 2', 120, 299, 40, C.ink);
  api.text(ctx, 'MLflow', 890, 299, 40, C.ink);
  api.text(ctx, 'Weights & Biases', 1350, 299, 40, C.ink);
  api.line(ctx, 120, 339, 1810, 339, C.muted, 2);
  fields.forEach(([label, mlflow, wandb], i) => {
    const visible = at(showMethod[i]) > 0;
    if (i >= 2 && !visible) return;
    api.focus.target('field-' + i, () => {
      const y = 449 + i * 110;
      api.text(ctx, label, 120, y, 37, C.ink);
      if (!visible) return;
      api.text(ctx, mlflow, 890, y, 35, C.cyan, 'left', 'mono');
      api.text(ctx, wandb, 1350, y, 35, C.cyan, 'left', 'mono');
    });
  });
  api.focus.target('read-row', () => {
    const missed = report.rows.find((r) => r.expected !== r.predicted);
    api.text(
      ctx,
      at('follow-file') > 0
        ? 'Rollback row   /   expected ' + missed.expected + '     returned ' + missed.predicted
        : 'Which request accounts for the refusal?',
      120,
      959,
      41,
      at('follow-file') > 0 ? C.pink : C.ink,
    );
  });
}
export default {
  id: 'platforms',
  draw: drawPlatforms,
  cues: ['record-input', 'record-metric', 'follow-file', 'bind-dataset'],
};
