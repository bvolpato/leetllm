import { cueEnded, cueProgress, focusOn, text } from '../defaults.mjs';
import { drawRiskRuler, percent, riskCheck } from '../risk-ruler.mjs';

const groups = 18,
  groupSize = 41,
  tickets = groups * groupSize,
  errors = 89;
const check = riskCheck(errors, tickets);

export function drawHoldout(ctx, scene, state, api) {
  const { C } = api;
  const read = Math.floor(tickets * cueProgress(state, 'open-batch'));
  // A fixed illustrative ordering spreads the 89 wrong routes across the batch.
  const missesThrough = (n) => Math.floor((n * errors) / tickets);
  const opened = read > 0;
  focusOn(api, 'holdout-batch', () => {
    const name = cueEnded(state, 'freeze-winner') ? 'P7 frozen' : 'P7 from development';
    text(ctx, api, name, 145, 278, 43, C.yellow);
    text(
      ctx,
      api,
      opened ? 'Fresh tickets from the support queue' : 'Untouched batch from the support queue',
      1730,
      278,
      38,
      C.ink,
      'right',
    );
    for (let i = 0; i < groups; i++) {
      const x = 150 + i * 90;
      const seen = Math.max(0, Math.min(groupSize, read - i * groupSize));
      const wrong = missesThrough(i * groupSize + seen) - missesThrough(i * groupSize);
      api.rect(ctx, x, 335, 65, 123, C.panel, C.muted, 6);
      if (seen > wrong)
        api.rect(ctx, x, 458 - 3 * seen, 65, 3 * (seen - wrong), C.blue, undefined, 2);
      if (wrong) api.rect(ctx, x, 458 - 3 * wrong, 65, 3 * wrong, C.pink, undefined, 2);
    }
    const total = opened
      ? missesThrough(read) + ' wrong routes   /   ' + read + ' tickets scored'
      : 'Sealed   ·   18 stacks of 41 independent tickets';
    text(ctx, api, total, 960, 529, 40, opened ? C.ink : C.muted, 'center');
  });
  const width = cueProgress(state, 'apply-fresh-radius');
  focusOn(api, 'holdout-ruler', () => {
    drawRiskRuler(ctx, api, {
      min: 0.1,
      max: 0.24,
      ticks: [0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24],
      rows: [
        {
          name: 'Fresh evaluation',
          detail: 'One fixed router',
          check,
          y: 743,
          showObserved: read === tickets,
          extension: width,
          showUpper: cueEnded(state, 'apply-fresh-radius'),
        },
      ],
      axisY: 842,
    });
    const result = cueEnded(state, 'p-seven-verdict');
    const note = result
      ? check.passes
        ? 'P7 clears the gate for the sampled traffic.'
        : 'Insufficient evidence to clear the gate.'
      : read === tickets
        ? 'Upper error bound ≈ ' +
          percent(check.observed) +
          ' + ' +
          (check.radius * 100).toFixed(2) +
          ' percentage points'
        : 'Decide the gate and freeze the prompt before opening the batch.';
    text(ctx, api, note, 960, 997, 39, result ? C.green : C.ink, 'center');
  });
}
export default {
  id: 'holdout',
  draw: drawHoldout,
  cues: ['freeze-winner', 'open-batch', 'apply-fresh-radius', 'p-seven-verdict'],
};
