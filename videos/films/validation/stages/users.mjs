import { lookupAccuracy } from '../arithmetic.mjs';
import { users } from '../fixtures.mjs';
import { equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawUsers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    const grouped = phaseForBeat(1, 0.12, 0.72),
      moving = grouped > 0 && grouped < 1,
      lookupCue = state.cues?.[currentBeat === 0 ? 'lookup-recognition' : 'lookup-fallback'],
      resultKnown =
        currentBeat > 1 ||
        !lookupCue ||
        lookupCue.phase === 'after' ||
        (lookupCue.phase === 'during' && lookupCue.progress > 0.7);
    text(
      ctx,
      api,
      grouped === 0
        ? 'One training row and one held-out copy per user'
        : grouped === 1
          ? 'Users 1–4 train · users 5–8 held out entirely'
          : 'Both rows travel to the same user partition',
      960,
      235,
      28,
      themeColors.muted,
      'center',
    );
    optionalFocusTarget(ctx, api, 'users-simulation-22', () =>
      users.forEach((user, i) => {
        const x = i < 4 ? 160 : 1040,
          y = 300 + (i % 4) * 150,
          q = api.phase(grouped, i * 0.075, 0.18 + i * 0.075),
          known = q < 1 || i < 4,
          pred = known ? user.label : 0;
        api.components.panel(
          {
            x,
            y,
            width: 720,
            height: 138,
            fill: themeColors.panel,
            stroke: q === 1 ? (i < 4 ? themeColors.blue : themeColors.yellow) : themeColors.muted,
            padding: 12,
          },
          () => {
            text(
              ctx,
              api,
              'u' + (i + 1) + ' · y' + user.label,
              x + 105,
              y + 45,
              28,
              user.label ? themeColors.pink : themeColors.ink,
              'center',
            );
            text(
              ctx,
              api,
              q === 1 && i < 4 ? 'memory retained' : known ? 'ID found' : 'ID absent',
              x + 105,
              y + 100,
              22,
              known ? themeColors.blue : themeColors.yellow,
              'center',
            );
            for (let copy = 0; copy < 2; copy++) {
              const isTrain = q === 1 ? i < 4 : copy === 0,
                initial = x + 240 + copy * 230,
                target = x + (i < 4 ? 240 : 450),
                cx = initial + (target - initial) * api.phase(q, 0.25, 1),
                cy = y + 15 + copy * 42 * api.phase(q, 0, 0.25);
              api.components.card({
                label:
                  'row ' +
                  (copy + 1) +
                  ' · ' +
                  (q > 0 && q < 1 ? 'moving' : isTrain ? 'train' : 'held'),
                x: cx,
                y: cy,
                width: 215,
                height: 40,
                fill: themeColors.panel,
                stroke:
                  q > 0 && q < 1
                    ? themeColors.green
                    : isTrain
                      ? themeColors.blue
                      : themeColors.yellow,
                textColor: isTrain ? themeColors.blue : themeColors.yellow,
                fontSize: 21,
                padding: 5,
              });
            }
            if (!moving && !(q === 1 && i < 4))
              text(
                ctx,
                api,
                resultKnown
                  ? 'lookup → ' + pred + ' · ' + (pred === user.label ? 'correct' : 'wrong')
                  : 'lookup → ?',
                x + 470,
                y + 121,
                20,
                resultKnown
                  ? pred === user.label
                    ? themeColors.green
                    : themeColors.pink
                  : themeColors.muted,
                'center',
              );
          },
        );
      }),
    );
    optionalFocusTarget(ctx, api, 'users-lookup-result', () => {
      if (!moving && resultKnown) {
        const known = grouped === 0 ? users : users.slice(0, 4);
        const held = grouped === 0 ? users : users.slice(4);
        const accuracy = lookupAccuracy(known, held);
        equation(
          ctx,
          api,
          '\\operatorname{accuracy}=\\frac{' +
            accuracy * held.length +
            '}{' +
            held.length +
            '}=' +
            accuracy.toFixed(2),
          960,
          995,
          46,
          themeColors.ink,
          'center',
        );
      } else
        text(
          ctx,
          api,
          moving ? 'Regrouping both rows before evaluating' : 'Held-out lookup results covered',
          960,
          995,
          34,
          themeColors.muted,
          'center',
        );
    });
  }
}
export default {
  id: 'users',
  draw: drawUsers,
  cues: [
    'users-beat-1-focus-1',
    'lookup-recognition',
    'users-beat-2-focus-1',
    'lookup-fallback',
    'users-beat-3-focus-1',
  ],
};
