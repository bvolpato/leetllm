import { policyShift } from '../arithmetic.mjs';
import { sceneCues } from '../picture.mjs';

function drawKeyAndMinimum(ctx, api, facts, oldMinimum, newMinimum, move) {
  const { C } = api;
  const dayX = (day) => 160 + 20 * day;
  const key = dayX(facts.ageDays);
  const oldX = dayX(oldMinimum);
  const newX = dayX(newMinimum);
  const cutoff = oldX + move * (newX - oldX);

  api.circle(ctx, key - 365, 350, 125, C.cyan);
  api.circle(ctx, key - 365, 350, 67, C.bg);
  api.line(ctx, key - 260, 350, key, 350, C.cyan, 54);
  api.line(ctx, key - 90, 350, key - 90, 402, C.cyan, 43);
  api.line(ctx, key, 350, key, 415, C.cyan, 50);
  api.text(
    ctx,
    facts.stale ? 'Stale service key' : 'Current service key',
    key + 100,
    310,
    41,
    C.ink,
  );
  api.text(ctx, facts.ageDays + ' days', key + 95, 421, 108, C.cyan);

  api.line(ctx, dayX(0), 522, cutoff, 522, C.muted, 5);
  api.rect(ctx, cutoff, 492, dayX(80) - cutoff, 60, C.yellow, undefined, 5);
  api.text(ctx, 'Old enough', (cutoff + dayX(80)) / 2, 535, 36, C.bg, 'center');
  for (const [x, label] of [
    [oldX, 'Old minimum'],
    [newX, 'New minimum'],
  ]) {
    api.line(ctx, x, 554, x, 569, C.muted, 3);
    api.text(ctx, label, x, 610, 33, C.muted, 'center');
  }
  api.text(ctx, oldMinimum + ' days', oldX, 671, 50, C.ink, 'center');
  api.text(ctx, newMinimum + ' days', newX, 671, 50, C.yellow, 'center');
  api.line(ctx, cutoff, 558, cutoff, 481, C.yellow, 7);
  api.line(ctx, key, 440, key, 518, C.cyan, 4);
  api.circle(ctx, key, 522, 13, C.cyan, C.bg, 3);
}

export function drawOpening(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const before = policyShift(0),
    after = policyShift(1);
  // Start at the cut and land on the new minimum as the narrator finishes saying it.
  const elapsed = Math.min(1, state.t / cue.end('open-move'));
  const move = 1 - (1 - elapsed) ** 2;
  api.focus.target('opening-mechanism', () => {
    ctx.save();
    if (state.beat === 0) ctx.globalAlpha = 1;
    drawKeyAndMinimum(ctx, api, before.facts, before.thresholdDays, after.thresholdDays, move);
    ctx.restore();
    if (state.beat < 3) {
      const expected = cue.after('open-expected')
        ? after.decision
        : cue.started('open-predict')
          ? '?'
          : '';
      const returned = cue.after('open-observed') ? after.checkerDecision : '';
      for (const [x, label, answer] of [
        [445, 'Policy verdict', expected],
        [1150, 'App reply', returned],
      ]) {
        if (answer) {
          api.text(ctx, label, x, 737, 36, C.muted);
          api.text(
            ctx,
            answer,
            x,
            830,
            70,
            label === 'App reply' && answer !== expected ? C.pink : C.ink,
          );
        }
      }
    } else {
      if (!cue.started('open-build')) return;
      api.text(ctx, 'Saved weights', 160, 767, 40, C.blue);
      api.text(ctx, before.weightsRevision, 610, 767, 47, C.ink, 'left', 'mono');
      if (cue.started('open-serve')) {
        api.text(ctx, 'With this request', 160, 883, 40, C.cyan);
        api.text(
          ctx,
          `Key age: ${after.facts.ageDays} days     Policy minimum: ${after.thresholdDays} days`,
          610,
          883,
          44,
          C.ink,
        );
      }
    }
  });
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['open-move', 'open-predict', 'open-expected', 'open-observed', 'open-build', 'open-serve'],
};
