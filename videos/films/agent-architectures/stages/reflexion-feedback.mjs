import { drawArrow, drawBox, drawCenteredText, drawFocusTarget, drawFooter } from '../defaults.mjs';
export function drawReflexionFeedback(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-reflexion-feedback-' + currentBeat),
    mix = (a, z, u) => a + (z - a) * u;
  const paintMechanism = () => {
    const strict = currentBeat === 2 || (currentBeat > 0 && resultComplete('reflect-reject')),
      stored = currentBeat === 2 || (currentBeat > 0 && resultComplete('reflect-store')),
      current = currentBeat === 2 || (currentBeat > 0 && resultComplete('reflect-current'));
    drawCenteredText(
      ctx,
      api,
      'Task requests c1842 · same selected run',
      960,
      280,
      34,
      themeColors.yellow,
    );
    drawBox(
      ctx,
      api,
      current ? 'current-run · c1842' : 'old-run · c1841',
      200,
      430,
      660,
      105,
      current ? themeColors.green : themeColors.pink,
    );
    drawBox(
      ctx,
      api,
      currentBeat === 0
        ? 'Evaluator'
        : current
          ? 'revision-aware: PASS'
          : strict
            ? 'revision-aware: FAIL'
            : resultComplete('reflect-false-pass')
              ? 'exists-only: PASS'
              : 'Existence check pending',
      1090,
      430,
      640,
      105,
      current
        ? themeColors.green
        : strict
          ? themeColors.pink
          : resultComplete('reflect-false-pass')
            ? themeColors.green
            : themeColors.muted,
    );
    drawArrow(ctx, api, 880, 483, 1070, 483);
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'Actor → evaluated failure → reflection → next context',
        960,
        720,
        32,
        themeColors.cyan,
      );
      drawCenteredText(
        ctx,
        api,
        'Learned parameter tiles stay fixed',
        960,
        865,
        31,
        themeColors.muted,
      );
    } else {
      api.rect(
        ctx,
        280,
        700,
        1360,
        190,
        themeColors.panel,
        stored ? themeColors.yellow : themeColors.muted,
        2,
        10,
      );
      drawCenteredText(
        ctx,
        api,
        stored ? 'Memory 1: select a run bound to requested revision' : 'No stored failure note',
        960,
        775,
        31,
        stored ? themeColors.yellow : themeColors.muted,
      );
      drawCenteredText(
        ctx,
        api,
        current
          ? 'Current run passes · memory count stays 1'
          : currentBeat === 2
            ? 'A stored note influences only context that includes it'
            : 'Feedback must fail before it can trigger reflection',
        960,
        860,
        29,
        themeColors.muted,
      );
      if (currentBeat === 2) {
        const x = mix(350, 1250, operationProgress);
        drawBox(ctx, api, 'Relevant memory', x, 565, 310, 72, themeColors.yellow);
      }
    }
    drawFooter(ctx, api, 'The next attempt reads the note with the same model weights.');
  };
  drawFocusTarget(ctx, api, 'aa-reflexion-feedback-mechanism', paintMechanism);
}
export default {
  id: 'reflexion-feedback',
  draw: drawReflexionFeedback,
  cues: [
    'aa-reflexion-feedback-0',
    'aa-reflexion-feedback-1',
    'reflect-false-pass',
    'reflect-reject',
    'reflect-store',
    'reflect-current',
    'aa-reflexion-feedback-2',
  ],
};
