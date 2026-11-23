import { answerChecks } from '../arithmetic.mjs';
import { ANSWERS, ANSWER_CONTRACT } from '../fixtures.mjs';
import { box, drawText, focus, sub } from '../defaults.mjs';
import { spokenCue } from '../construction.mjs';
export function drawBehavior(ctx, scene, state, api) {
  const { C: themeColors } = api,
    cue = (id) => spokenCue(scene, state, id);
  {
    const checks = cue('behavior-beat-2-focus-2').phase === 'after';
    sub(ctx, api, 'Incident policy');
    focus(ctx, api, 'incident-policy', () =>
      drawText(
        ctx,
        api,
        'Required: blocked · incident policy 483 · automatic rollback false',
        960,
        350,
        32,
        themeColors.yellow,
        'center',
      ),
    );
    ANSWERS.forEach((r, i) => {
      const x = 230 + i * 870,
        col = i ? themeColors.cyan : themeColors.blue;
      focus(ctx, api, i === 0 ? 'behavior-object-checkpoint-a-48' : 'behavior-b', () => {
        box(ctx, api, 'Checkpoint ' + r.id + '     PPL ' + r.ppl, x, 430, 650, 85, col, 36);
        if (cue(i === 0 ? 'behavior-answer-fields' : 'behavior-b-fields').phase === 'before')
          return;
        [r.status, r.source.replaceAll('_', ' '), 'automatic rollback ' + r.automatic].forEach(
          (v, j) => {
            box(ctx, api, v, x, 565 + j * 125, 650, 80, col, 29);
            if (checks)
              drawText(
                ctx,
                api,
                answerChecks(r, ANSWER_CONTRACT)[j] ? 'PASS' : 'FAIL',
                x + 720,
                615 + j * 125,
                28,
                answerChecks(r, ANSWER_CONTRACT)[j] ? themeColors.green : themeColors.pink,
                'center',
              );
          },
        );
      });
    });
    focus(ctx, api, 'behavior-object-required-checks-1-3-52', () =>
      drawText(
        ctx,
        api,
        checks ? 'A passes 1 of 3 checks. B passes all 3.' : 'Which answer would you send?',
        960,
        1045,
        34,
        checks ? themeColors.yellow : themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'behavior',
  draw: drawBehavior,
  cues: [
    'behavior-beat-1-focus-1',
    'behavior-beat-1-focus-2',
    'behavior-answer-fields',
    'behavior-b-fields',
    'behavior-beat-2-focus-1',
    'behavior-beat-2-focus-2',
  ],
};
