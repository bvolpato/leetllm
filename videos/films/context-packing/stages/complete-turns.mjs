import { exchanges } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { allocationStrip, card, text } from '../defaults.mjs';
export function drawCompleteTurns(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('complete-turns', state),
    currentBeat = modelState.step;
  {
    api.focus.target('complete-turns-complete-question-answer-exchanges-newest-first', () =>
      text(
        ctx,
        api,
        'Complete question + answer exchanges · newest first',
        140,
        270,
        31,
        themeColors.muted,
      ),
    );
    const target = exchanges[currentBeat];
    exchanges.forEach((item, i) => {
      const selected = modelState.kept.some((row) => row.id === item.id);
      const x = 140 + i * 565;
      api.line(ctx, x + 4, 327, x + 454, 327, themeColors.muted, 2);
      text(
        ctx,
        api,
        'question + answer · same ' + item.id.split(' ')[0],
        x + 230,
        310,
        24,
        themeColors.muted,
        'center',
      );
      if (selected)
        api.focus.target('recent-exchange-' + i, () =>
          card(ctx, api, `${item.id} · admitted`, x, 345, 460, themeColors.green),
        );
      else if (i === currentBeat && currentBeat < 2) {
        const move = modelState.move,
          targetX = currentBeat === 0 ? 546 : 846;
        const across = api.phase(move, 0.25, 0.75),
          down =
            move < 0.25
              ? api.lerp(345, 520, move / 0.25)
              : move > 0.75
                ? api.lerp(520, 690, (move - 0.75) / 0.25)
                : 520;
        api.focus.target('recent-exchange-' + i, () =>
          card(
            ctx,
            api,
            `${item.id}\n${item.units} units`,
            api.lerp(x, targetX, across),
            down,
            api.lerp(460, item.units * 50 - 12, Math.min(1, move / 0.25)),
            themeColors.yellow,
            110,
          ),
        );
      } else
        api.focus.target('recent-exchange-' + i, () =>
          card(
            ctx,
            api,
            `${item.id}\n${item.units} units`,
            x,
            345,
            460,
            i === currentBeat && modelState.dropped.length ? themeColors.pink : themeColors.muted,
            110,
          ),
        );
    });
    allocationStrip(ctx, api, 'complete-turns', modelState.kept, 690);
    const decision = modelState.dropped.some((row) => row.id === target.id)
      ? `${target.id}: ${modelState.previousTotal} + ${target.units} = ${modelState.attemptedTotal} > 32 · excluded whole; used ${modelState.total} / 32`
      : modelState.kept.some((row) => row.id === target.id)
        ? `${target.id} admitted · ${modelState.previousTotal} + ${target.units} = ${modelState.total} / 32 · ${modelState.remaining} units remain`
        : `Current candidate: ${target.id} · ${target.units} units`;
    api.focus.target('complete-turns-readout-4', () =>
      text(
        ctx,
        api,
        decision,
        140,
        965,
        29,
        currentBeat === 2 ? themeColors.pink : themeColors.yellow,
      ),
    );
  }
}
export default {
  id: 'complete-turns',
  draw: drawCompleteTurns,
  cues: [
    'newest-exchange',
    'admit-newest',
    'middle-exchange',
    'contiguous-history',
    'oldest-excluded',
    'whole-packet',
  ],
};
