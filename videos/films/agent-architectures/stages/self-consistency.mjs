import {
  drawArrow,
  drawBox,
  drawCenteredText,
  drawEquation,
  drawFocusTarget,
} from '../defaults.mjs';
export function drawSelfConsistency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paintMechanism = () => {
    const tie = currentBeat === 0 && resultComplete('vote-tie'),
      values = tie ? ['patch', 'rollback'] : ['patch', 'rollback', 'patch'];
    drawCenteredText(
      ctx,
      api,
      tie
        ? 'Separate two-sample tie'
        : currentBeat > 0
          ? 'Return to the three-sample patch proposal'
          : 'Scripted read-only proposal candidates',
      960,
      280,
      34,
      themeColors.yellow,
    );
    values.forEach((s, i) => {
      const x = tie ? 430 + i * 700 : 180 + i * 570;
      drawBox(
        ctx,
        api,
        s,
        x,
        420,
        tie ? 550 : 440,
        110,
        s === 'patch' ? themeColors.blue : themeColors.pink,
      );
    });
    if (currentBeat === 0) {
      if (tie && resultComplete('vote-review'))
        drawBox(ctx, api, 'needs review', 610, 740, 700, 110, themeColors.yellow);
      else if (!tie && resultComplete('vote-majority'))
        drawEquation(
          ctx,
          api,
          '2/3>1/2\\quad\\Rightarrow\\quad\\text{patch}',
          960,
          800,
          48,
          themeColors.green,
        );
    } else {
      drawBox(ctx, api, 'Selected proposal', 340, 720, 520, 100, themeColors.blue);
      drawBox(ctx, api, 'Current host approval', 1090, 720, 520, 100, themeColors.yellow);
      drawArrow(ctx, api, 880, 770, 1070, 770, themeColors.muted);
      drawCenteredText(
        ctx,
        api,
        currentBeat === 1
          ? 'The host checks the selected change before a write.'
          : 'Three candidates can all read the same stale log.',
        960,
        930,
        32,
        themeColors.yellow,
      );
    }
  };
  drawFocusTarget(ctx, api, 'aa-self-consistency-mechanism', paintMechanism);
}
export default {
  id: 'self-consistency',
  draw: drawSelfConsistency,
  cues: [
    'aa-self-consistency-0',
    'vote-majority',
    'vote-tie',
    'vote-review',
    'aa-self-consistency-1',
    'aa-self-consistency-2',
  ],
};
