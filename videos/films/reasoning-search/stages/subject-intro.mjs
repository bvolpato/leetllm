import { introductoryMove } from '../arithmetic.mjs';
import { cueAt } from '../cue-clock.mjs';
import { drawLegacyCard, drawLegacyFooter, drawLegacyText, withLegacyFocus } from '../defaults.mjs';
export function drawSubjectIntro(ctx, scene, state, api) {
  api.focus.target('subject-intro-mechanism', () => {
    const { C: themeColors } = api;
    const beat = state.beat ?? 0;
    {
      const motion = cueAt(state, 'subject-pair-motion', 1, 0.15, 0.34);
      const complete = cueAt(state, 'subject-product', 1, 0.34, 0.5).done;
      const current = introductoryMove(complete ? 2 : 0, 0);
      withLegacyFocus(
        ctx,
        api,
        'subject-intro-object-use-each-input-exactly-once-target-24-1',
        () =>
          drawLegacyText(
            ctx,
            api,
            'Use each input exactly once · target 24',
            960,
            290,
            37,
            themeColors.yellow,
            'center',
          ),
      );
      const starts = [260, 650, 1040, 1430];
      withLegacyFocus(ctx, api, 'subject-intro-simulation-2', () =>
        [4, 5, 6, 7].forEach((value, i) => {
          if (current.consumed && (value === 4 || value === 6)) return;
          const selected = beat > 0 && (value === 4 || value === 6);
          const destination = value === 4 ? 320 : 580;
          const horizontal = Math.max(0, (motion.progress - 0.33) / 0.67);
          const x = selected ? starts[i] + (destination - starts[i]) * horizontal : starts[i];
          const y = selected ? 420 + 180 * Math.min(1, motion.progress * 3) : 420;
          drawLegacyCard(
            ctx,
            api,
            String(value),
            x,
            y,
            180,
            selected ? themeColors.yellow : themeColors.blue,
            115,
            44,
          );
        }),
      );
      if (beat > 0) {
        drawLegacyText(ctx, api, '6 × 4', 540, 760, 39, themeColors.yellow, 'center');
        if (current.consumed) {
          withLegacyFocus(ctx, api, 'subject-intro-object-current-check-result-5', () =>
            drawLegacyCard(
              ctx,
              api,
              current.check.result,
              410,
              565,
              260,
              themeColors.yellow,
              120,
              44,
            ),
          );
          drawLegacyText(
            ctx,
            api,
            '5 and 7 remain unused',
            1200,
            760,
            35,
            themeColors.pink,
            'center',
          );
          drawLegacyText(
            ctx,
            api,
            `Remaining state: ${current.remaining.join(' · ')}`,
            960,
            865,
            35,
            themeColors.ink,
            'center',
          );
        }
      }
      drawLegacyFooter(
        ctx,
        api,
        'Search quality depends on the states we preserve and the checks we run',
      );
    }
  });
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'subject-intro-beat-1-focus-1',
    'subject-intro-beat-1-focus-2',
    'subject-intro-beat-2-focus-1',
    'subject-pair-motion',
    'subject-product',
    'subject-intro-beat-3-focus-1',
    'subject-intro-beat-3-focus-2',
  ],
};
