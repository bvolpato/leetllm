import { arrow, centerText, cueProgress, note, rectangle, tag } from '../defaults.mjs';
export function drawBreakerContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('breaker-contract-mechanism', () => {
    if (currentBeat === 0) {
      centerText(
        ctx,
        api,
        'Scope the health counter to the failing dependency and caller class',
        960,
        280,
        34,
        themeColors.muted,
      );
      ['toolA · tenantX', 'toolA · tenantY', 'toolB · tenantX'].forEach((s, i) => {
        const x = 360 + i * 600;
        tag(ctx, api, s, x, 435, themeColors.blue, 490);
        for (let j = 0; j < 3; j++)
          api.circle(
            ctx,
            x - 85 + j * 85,
            605,
            20,
            i === 0 && j < Math.ceil(3 * cueProgress(ctx, api, 'health-scope'))
              ? themeColors.pink
              : themeColors.panel,
          );
        tag(
          ctx,
          api,
          i === 0 && done('health-scope') ? 'open' : 'independent scope',
          x,
          780,
          i === 0 && done('health-scope') ? themeColors.pink : themeColors.green,
          490,
        );
      });
      note(
        ctx,
        api,
        'Schema or permission rejection is a different boundary; this fixture is local to one event loop',
      );
    } else {
      const cancel = cueProgress(ctx, api, 'probe-cancel'),
        nonhealth = cueProgress(ctx, api, 'probe-nonhealth');
      centerText(
        ctx,
        api,
        cueProgress(ctx, api, 'old-result')
          ? 'Separate stale-success race'
          : 'One physical half-open probe slot',
        960,
        275,
        36,
        themeColors.muted,
      );
      rectangle(ctx, api, 755, 405, 410, 180, themeColors.panel);
      api.circle(ctx, 960, 495, 35, cancel || nonhealth ? themeColors.panel : themeColors.yellow);
      tag(ctx, api, 'generation 5', 960, 680, themeColors.yellow);
      if (cancel)
        tag(
          ctx,
          api,
          cueProgress(ctx, api, 'old-result')
            ? 'separate race: generation 5 open'
            : nonhealth
              ? 'non-health exception → half-open'
              : 'cancellation → reopen +cooldown',
          960,
          820,
          nonhealth ? themeColors.yellow : themeColors.pink,
          950,
        );
      tag(ctx, api, 'old generation 4 success', 400, 430, themeColors.blue, 600);
      if (done('old-result')) {
        arrow(ctx, api, 400, 510, 400, 720, themeColors.blue);
        tag(ctx, api, 'return to old caller', 400, 805, themeColors.blue, 600);
        tag(ctx, api, 'generation 5 remains open', 1500, 430, themeColors.pink, 650);
      }
      note(
        ctx,
        api,
        'Release local slot and propagate exceptions · no claim that a remote write was canceled',
      );
    }
  });
}
export default {
  id: 'breaker-contract',
  draw: drawBreakerContract,
  cues: ['health-scope', 'probe-cancel', 'probe-nonhealth', 'old-result'],
};
