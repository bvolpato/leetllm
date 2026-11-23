import { plannedLooks } from '../model.mjs';
import { card, text } from '../defaults.mjs';

const alpha = 0.05;
const plan = plannedLooks([0.23, 0.036, 0.008, 0.02], alpha);
const receipt = ['looks-first-receipt', 'looks-second-receipt', 'looks-third-receipt'];

export function drawLooks(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const progress = (id, cueBeat) =>
    state.cues
      ? (state.cues[id]?.progress ?? 0)
      : beat > cueBeat
        ? 1
        : beat < cueBeat
          ? 0
          : state.beatP;
  const budget = progress('looks-planned-budget', 0);
  const secondDone = progress('looks-second-crossing', 2) === 1;
  const thirdDone = progress('looks-third-crossing', 3) === 1;
  const share = (100 * plan.threshold).toFixed(2) + '%';
  text(ctx, api, 'False-alarm budget if the prompts are equally effective', 150, 260, 36);
  text(ctx, api, '5% budget', 150, 340, 46, C.yellow);
  if (budget === 1)
    text(ctx, api, 'Per look: p ≤ ' + plan.threshold.toFixed(4), 575, 340, 42, C.yellow);
  const width = 373;
  for (const [i, value] of plan.values.entries()) {
    const x = 150 + i * 408;
    api.focus.target('look-' + (i + 1), () => {
      card(ctx, api, 'Look ' + (i + 1), x, 400, width, C.muted, 80, 35);
      if (budget > i / plan.values.length) {
        card(ctx, api, share, x, 510, width, C.yellow, 82, 38);
      }
    });
    const observed = i < 3 && progress(receipt[i], i) > 0;
    const color = i === 2 && thirdDone ? C.green : C.blue;
    api.focus.target('look-' + (i + 1) + '-calculation', () => {
      text(
        ctx,
        api,
        observed ? 'p = ' + value.toFixed(3) : thirdDone ? 'Unobserved' : 'Awaiting look',
        x + width / 2,
        702,
        observed ? 44 : 30,
        observed ? color : C.muted,
        'center',
      );
      if (i === 1 && secondDone)
        text(ctx, api, 'ordinary .05: crosses', x + width / 2, 773, 27, C.muted, 'center');
      if (
        observed &&
        ((i === 0 && budget === 1) || (i === 1 && secondDone) || (i === 2 && thirdDone))
      )
        text(
          ctx,
          api,
          value.toFixed(3) + (value <= plan.threshold ? ' ≤ ' : ' > ') + plan.threshold.toFixed(4),
          x + width / 2,
          835,
          31,
          value <= plan.threshold ? C.green : C.ink,
          'center',
        );
    });
  }
  api.focus.target('planned-stop', () => {
    let decision = 'Four scheduled chances to stop';
    if (progress(receipt[0], 0) === 1) decision = 'Look 1  ·  keep collecting';
    if (progress(receipt[1], 1) === 1)
      decision = secondDone ? 'Look 2  ·  keep collecting' : 'Look 2  ·  stop or keep collecting?';
    if (progress(receipt[2], 2) === 1) decision = 'Look 3  ·  stop or keep collecting?';
    if (thirdDone)
      decision = 'STOP at look ' + plan.first + '  ·  the fourth look never takes place';
    text(ctx, api, decision, 960, 963, 39, thirdDone ? C.green : C.ink, 'center');
  });
}
export default {
  id: 'looks',
  draw: drawLooks,
  cues: ['looks-planned-budget', ...receipt, 'looks-second-crossing', 'looks-third-crossing'],
};
