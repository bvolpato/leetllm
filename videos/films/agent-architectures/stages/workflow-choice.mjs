import { cueAmount, cueDone } from '../defaults.mjs';

export function drawWorkflowChoice(ctx, scene, state, api) {
  const { C } = api;
  const detailed = cueAmount(state, 'choice-detail') > 0;
  api.focus.target('notice', () => {
    api.text(ctx, 'Art Museum   /   today’s notice', 160, 285, 31, C.muted);
    api.text(ctx, '“The main gallery is closed today.”', 160, 380, 53, C.ink, 'left', 'serif');
    if (detailed)
      api.text(
        ctx,
        '“Other galleries are open through the east entrance.”',
        160,
        460,
        46,
        C.yellow,
        'left',
        'serif',
      );
  });
  api.focus.target('coded', () => {
    api.line(ctx, 170, 554, 865, 554, C.blue, 5);
    api.text(ctx, 'Coded fallback', 170, 629, 37, C.blue);
    api.text(ctx, 'Main gallery closed', 170, 727, 44, C.ink);
    if (cueDone(state, 'choice-rule')) {
      api.arrow(ctx, 188, 760, 188, 837, C.blue, 4);
      api.text(ctx, 'Check History’s hours', 170, 926, 41, C.ink);
    }
  });
  api.focus.target('model-choice', () => {
    api.line(ctx, 1010, 554, 1750, 554, C.cyan, 5);
    api.text(ctx, 'Model-directed follow-up', 1010, 629, 37, C.cyan);
    api.text(ctx, detailed ? 'Other galleries open' : 'Read the notice', 1010, 727, 44, C.ink);
    const follow = cueAmount(state, 'choice-follow');
    if (follow > 0) api.arrow(ctx, 1028, 760, 1028, 760 + 77 * follow, C.cyan, 4);
    if (cueDone(state, 'choice-follow'))
      api.text(ctx, 'Check east entrance hours', 1010, 926, 42, C.ink);
    else if (cueAmount(state, 'choice-question') > 0)
      api.text(ctx, 'What would you check at Art?', 1010, 926, 38, C.yellow);
  });
}
export default {
  id: 'workflow-choice',
  draw: drawWorkflowChoice,
  cues: [
    'choice-notice',
    'choice-rule',
    'choice-detail',
    'choice-question',
    'choice-follow',
    'choice-compare',
  ],
};
