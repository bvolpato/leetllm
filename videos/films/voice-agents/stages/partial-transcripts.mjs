import { voiceWorksheet } from '../arithmetic.mjs';
import { drawFooter, drawLine, drawTag, drawText } from '../defaults.mjs';
export function drawPartialTranscripts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-partial-transcripts-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const cueComplete = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after' || c.progress >= 1
      : currentBeat > i || (currentBeat === i && beatProgress > 0.98);
  };
  const withStageFocus = (name, paint) => api.focus.target(`va-partial-transcripts-${name}`, paint);
  {
    const hypotheses = ['What is', 'What is incident', 'What is incident 4219'];
    withStageFocus('hypotheses', () => {
      hypotheses.forEach((h, i) => {
        const visible = cueVisible(0, Math.min(i + 1, 3));
        drawText(ctx, api, 'h' + i, 170, 370 + i * 105, 28, themeColors.muted);
        if (visible)
          drawText(
            ctx,
            api,
            h,
            300,
            370 + i * 105,
            35,
            i === 2 ? themeColors.cyan : themeColors.ink,
          );
      });
      if (cueComplete(0, 2)) {
        drawLine(ctx, api, 300, 490, 440, 490, themeColors.yellow, 5);
        drawText(ctx, api, 'shared prefix remains tentative', 950, 470, 30, themeColors.yellow);
      }
    });
    withStageFocus('actions', () => {
      drawText(ctx, api, 'Request state', 170, 720, 30);
      drawTag(ctx, api, 'committed = false', 170, 755, 650, themeColors.blue);
      if (cueVisible(1, 0))
        drawTag(
          ctx,
          api,
          'classify + authorized read-only prefetch',
          930,
          755,
          780,
          themeColors.cyan,
        );
      if (cueVisible(1, 2))
        drawText(ctx, api, 'history / speech / side effect: wait', 930, 880, 29, themeColors.muted);
    });
    withStageFocus('typed-flag', () => {
      if (cueVisible(2, 0))
        drawText(ctx, api, 'Validate the actual flag type', 930, 590, 27, themeColors.yellow);
      if (cueVisible(2, 1)) {
        drawTag(ctx, api, 'false : bool → uncommitted', 170, 615, 650, themeColors.green);
      }
      if (cueComplete(2, 2)) {
        drawTag(ctx, api, '"false" : str → reject', 930, 615, 780, themeColors.pink);
      }
    });
    drawFooter(
      ctx,
      api,
      'A later hypothesis may revise repeated words; a turn flag does not authenticate Alex.',
    );
  }
}
export default {
  id: 'partial-transcripts',
  draw: drawPartialTranscripts,
  cues: [
    'va-partial-transcripts-0-0',
    'va-partial-transcripts-0-1',
    'va-partial-transcripts-0-2',
    'va-partial-transcripts-0-3',
    'va-partial-transcripts-0-4',
    'va-partial-transcripts-1-0',
    'va-partial-transcripts-1-1',
    'va-partial-transcripts-1-2',
    'va-partial-transcripts-1-3',
    'va-partial-transcripts-2-0',
    'va-partial-transcripts-2-1',
    'va-partial-transcripts-2-2',
    'va-partial-transcripts-2-3',
  ],
};
