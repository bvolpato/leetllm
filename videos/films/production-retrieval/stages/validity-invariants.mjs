import { prEvent } from '../construction.mjs';
import { card, centeredText, extensionFooter, extensionText, sourcePage } from '../defaults.mjs';
export function drawValidityInvariants(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('validity-invariants-mechanism', () => {
    if (currentBeat === 0) {
      centeredText(
        ctx,
        api,
        'Inclusive calendar dates · one scoped document',
        960,
        290,
        35,
        themeColors.yellow,
      );
      const dates = ['Mar 30', 'Mar 31', 'Apr 1', 'Apr 2'];
      dates.forEach((v, i) => centeredText(ctx, api, v, 450 + i * 350, 400, 28, themeColors.muted));
      api.rect(ctx, 280, 470, 695, 65, themeColors.blue, undefined, 0);
      api.rect(ctx, 975, 610, 705, 65, themeColors.cyan, undefined, 0);
      extensionText(ctx, api, 'v1 · through Mar 31', 130, 575, 29, themeColors.blue);
      extensionText(ctx, api, 'v2 · from Apr 1', 130, 730, 29, themeColors.cyan);
      if (ev('dates', 0) > 0) {
        const x = 450 + 1050 * ev('dates', 0);
        api.line(ctx, x, 420, x, 785, themeColors.yellow, 4);
      }
      if (done('invalid', 0))
        centeredText(
          ctx,
          api,
          'Duplicate ID / reversed range / overlapping versions → reject',
          960,
          900,
          31,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      centeredText(
        ctx,
        api,
        'Half-open logical time · [start, end)',
        960,
        290,
        36,
        themeColors.yellow,
      );
      const x = (v) => 310 + v * 52;
      api.line(ctx, x(0), 630, x(25), 630, themeColors.muted, 3);
      api.line(ctx, x(0), 510, x(20), 510, themeColors.blue, 20);
      api.circle(ctx, x(20), 510, 17, themeColors.panel, themeColors.blue, 4);
      api.line(ctx, x(20), 760, x(25), 760, themeColors.cyan, 20);
      api.circle(ctx, x(20), 760, 17, themeColors.cyan);
      centeredText(ctx, api, 'old [0, 20)', 700, 440, 34, themeColors.blue);
      centeredText(ctx, api, 'new [20, ∞)', 1490, 865, 34, themeColors.cyan);
      api.line(ctx, x(20), 460, x(20), 815, themeColors.yellow, 3);
      centeredText(
        ctx,
        api,
        done('halfopen', 1)
          ? 'At t = 20: old false · replacement true'
          : 'Which record owns t = 20?',
        960,
        950,
        34,
        themeColors.yellow,
      );
    } else {
      sourcePage(ctx, api, 110, 350);
      card(ctx, api, 'Content revision v2\nbytes unchanged', 1100, 365, 650, 120, themeColors.cyan);
      card(ctx, api, 'Authorization revision 9 → 10', 1100, 610, 650, 120, themeColors.yellow);
      if (ev('authority-revision', 2) > 0) {
        api.line(ctx, 1130, 770, 1720, 770, themeColors.pink, 5);
        centeredText(
          ctx,
          api,
          'Grant removed · content hash still matches',
          1425,
          850,
          30,
          themeColors.pink,
        );
      }
    }
    extensionFooter(
      ctx,
      api,
      'Effective time, arrival time, content revision and grant revision have different jobs',
    );
  });
}
export default {
  id: 'validity-invariants',
  draw: drawValidityInvariants,
  cues: ['pr-dates', 'pr-invalid', 'pr-halfopen', 'pr-authority-revision'],
};
