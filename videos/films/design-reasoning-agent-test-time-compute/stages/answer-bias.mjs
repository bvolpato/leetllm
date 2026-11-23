import { beatCue } from '../construction.mjs';

export function drawAnswerBias(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    const invalid = beatCue(state, 'bias-invalid', 1, 0.01).done;
    const correct = beatCue(state, 'bias-correct', 1, 0.27).done;
    const wrong = beatCue(state, 'bias-wrong', 1, 0.46).done;
    api.focus.target('bias-step', () => {
      api.text(ctx, 'Find all roots', 155, 287, 36, C.muted);
      api.text(ctx, 'x (x - 1) = 0', 155, 451, 93, C.ink);
      api.text(ctx, 'Divide both sides by x', 155, 560, 43, C.yellow);
      api.text(ctx, 'x - 1 = 0', 155, 685, 78, C.ink);
      api.text(
        ctx,
        invalid ? 'Invalid step   /   x can equal 0' : 'Can we divide here?',
        155,
        912,
        48,
        invalid ? C.pink : C.ink,
      );
    });
    api.focus.target('bias-endpoint', () => {
      api.text(ctx, 'Submitted final answer', 1100, 287, 36, C.muted);
      api.text(
        ctx,
        wrong ? 'x = 1' : correct ? 'x = 0 or 1' : 'Covered',
        1100,
        451,
        78,
        correct ? C.ink : C.muted,
      );
      if (correct)
        api.text(
          ctx,
          wrong ? 'Incomplete set' : 'Correct set',
          1100,
          560,
          43,
          wrong ? C.pink : C.green,
        );
    });
    return;
  }
  const toy = beatCue(state, 'bias-eval-count', 2, 0.52).started;
  const solver = beatCue(state, 'bias-solver-count', 2, 0.71).started;
  const evalRate = beatCue(state, 'bias-eval-rate', 3, 0.02).done;
  const solverRate = beatCue(state, 'bias-solver-rate', 3, 0.29).done;
  function row(y, label, count, total, filled, color, showRate) {
    api.text(ctx, label, 155, y, 43, C.ink);
    for (let i = 0; i < total; i++)
      api.circle(ctx, 186 + i * 84, y + 85, 24, i < count ? color : C.panel, color, 3);
    api.text(ctx, count + ' of ' + total + ' ' + filled, 1070, y + 100, 42, C.ink);
    if (showRate) api.text(ctx, (100 * count) / total + '%', 1730, y + 103, 57, color, 'right');
  }
  api.focus.target('bias-step', () => {
    if (toy)
      row(350, 'Grader   /   flawed work with correct answers', 6, 8, 'accepted', C.pink, evalRate);
    else {
      api.text(ctx, 'Correct answers with flawed work', 155, 405, 60, C.ink);
      if (beatCue(state, 'bias-study', 2, 0.22).done)
        api.text(ctx, 'VAIR math study   /   47.9% grading accuracy', 155, 562, 49, C.yellow);
    }
  });
  api.focus.target('bias-endpoint', () => {
    if (solver)
      row(695, 'Solver   /   separate ordinary problems', 9, 10, 'solved', C.cyan, solverRate);
    else if (toy) api.text(ctx, 'Separate solver sample', 155, 695, 38, C.muted);
  });
  if (toy) api.text(ctx, 'Illustrative counts', 155, 972, 32, C.muted);
}

export default {
  id: 'answer-bias',
  draw: drawAnswerBias,
  cues: [
    'bias-lock',
    'bias-invalid',
    'bias-correct',
    'bias-wrong',
    'bias-study',
    'bias-eval-count',
    'bias-solver-count',
    'bias-eval-rate',
    'bias-solver-rate',
  ],
};
