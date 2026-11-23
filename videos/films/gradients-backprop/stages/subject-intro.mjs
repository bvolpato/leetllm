import { cueProgress, drawRequest, number } from '../latency-ruler.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  // The shared mark cuts directly to the running prediction.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const turn = cueProgress(state, api, 'intro-turn', 1, 0.03, 0.15);
  const reset = cueProgress(state, api, 'intro-reset', 1, 0.62, 0.76);
  const fine = cueProgress(state, api, 'intro-small-turn', 2, 0.01, 0.15);
  const result = cueProgress(state, api, 'intro-small-result', 2, 0.26, 0.48);
  const weight = Number((3 - 0.1 * turn * (1 - reset) - 0.01 * fine).toFixed(3));
  const answered = state.beat < 2 || result === 1;
  const showPrediction = state.beat < 2 || cueProgress(state, api, 'intro-fine-prediction', 2, 0.49, 0.72) === 1;
  // At the cut, the second block has 0.75 seconds to run before it meets the observed finish.
  const { prediction } = drawRequest(ctx, api, weight, {
    showPrediction,
    traceSeconds: state.beat === 0 ? 5 - 0.75 + state.t : undefined,
  });
  const { C, text, line, circle, focus } = api;
  focus.target('intro-direction', () => {
    let question = 'Which way would you turn the weight?';
    if (turn > 0) question = 'Watch the join and the end of the second block.';
    const direction = cueProgress(state, api, 'intro-direction', 1, 0.2, 0.24);
    if (direction === 1 && reset === 0) question = 'Both blocks get shorter.';
    if (reset === 1) question = 'Take off 0.01 s per block. How far will the prediction move?';
    if (state.beat === 2 && answered) question = 'How should we score a miss?';
    focus.target('loss-question', () => text(ctx, question, 960, 792, 40, C.ink, 'center'));
  });
  if (turn === 0) return;
  function change(label, delta, origin, color, known) {
    const y = 898, end = origin + 1900 * delta;
    line(ctx, origin - 395, y, origin, y, C.muted, 2);
    line(ctx, origin, y - 12, origin, y + 12, C.muted, 3);
    if (known) {
      line(ctx, end, y, origin, y, color, 5);
      circle(ctx, end, y, 7, color);
    }
    text(ctx, label + '   ' + (known ? number(delta, 3) : '?') + ' s', origin - 198, 961, 34, color, 'center');
  }
  focus.target('intro-linkage', () => {
    const proposed = reset === 1 && fine === 0;
    change(proposed ? 'Proposed change per block' : 'Change for one block',
      proposed ? -0.01 : weight - 3, 770, C.yellow, true);
    change('Change for both blocks', prediction - 6, 1545, C.cyan, !proposed && answered);
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['intro-first-block', 'intro-second-block', 'intro-question', 'intro-turn', 'intro-direction',
    'intro-linkage', 'intro-reset', 'intro-small-turn', 'intro-small-result', 'intro-fine-prediction', 'intro-score'],
};
