import { guardedDispatch } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('budget', state),
    currentBeat = modelState.beat;
  {
    if (currentBeat === 1) {
      const observations = modelState.observations;
      const deadlineReached = api.focus.progress('deadline-arrives', 0) > 0;
      const elapsed = deadlineReached ? modelState.deadline : observations.length;
      let calls = 0;
      const decision = guardedDispatch(
        observations,
        elapsed,
        modelState.deadline,
        () => ++calls,
        modelState.budget,
      );
      api.focus.target('deadline-check', () => {
        drawText(ctx, api, 'Same operation  ·  latest markers', 140, 300, 36, themeColors.muted);
        observations.forEach((row, i) =>
          drawCard(ctx, api, row[2], 140 + i * 530, 392, 460, themeColors.cyan, 110, 38),
        );
        drawText(
          ctx,
          api,
          'Consecutive repeats   ' + modelState.repeats + ' / 3',
          140,
          660,
          40,
          themeColors.ink,
        );
        drawText(
          ctx,
          api,
          'Elapsed time   ' + elapsed + ' / ' + modelState.deadline + ' s',
          980,
          660,
          40,
          themeColors.ink,
        );
      });
      api.focus.target('call-count', () => {
        drawText(
          ctx,
          api,
          'Next poll  ·  ' + (decision.executed ? 'admitted' : decision.reason),
          140,
          860,
          43,
          decision.executed ? themeColors.cyan : themeColors.yellow,
        );
        drawText(ctx, api, 'Calls sent: ' + calls, 980, 860, 43, themeColors.ink);
      });
      return;
    }
    modelState.observations.forEach((row, i) =>
      api.focus.target('poll-observations', () =>
        drawCard(
          ctx,
          api,
          row.map((v) => v.replaceAll('_', ' ')).join(' · '),
          230,
          310 + i * 130,
          1460,
          modelState.changed && i === 2 ? themeColors.green : themeColors.blue,
          90,
          32,
        ),
      ),
    );
    api.focus.target('dispatch-verdict', () =>
      drawText(
        ctx,
        api,
        `Consecutive same state ${modelState.repeats} / 3 · ${modelState.stopped ? 'STOP before another call' : 'repeat budget available'}`,
        960,
        905,
        37,
        modelState.stopped ? themeColors.pink : themeColors.green,
        'center',
      ),
    );
    api.focus.target('dispatch-budgets', () =>
      drawText(
        ctx,
        api,
        `Elapsed ${modelState.elapsed}/${modelState.deadline}s · spent ${modelState.budget.spent.toFixed(3)} + next ${modelState.budget.next.toFixed(3)} ≤ cap ${modelState.budget.limit.toFixed(3)}`,
        960,
        780,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    drawText(
      ctx,
      api,
      modelState.changed
        ? 'Changed marker resets repeats · time and spending gates still checked'
        : 'Simulated guarded dispatch · callback executions ' + modelState.callbackExecutions,
      960,
      1005,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'repeat-observations',
    'repeat-stop',
    'changed-marker',
    'elapsed-spending-gates',
    'deadline-arrives',
    'count-dispatches',
  ],
};
