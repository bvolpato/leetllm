import { complete, started } from '../policy-sheet.mjs';
import { text } from '../defaults.mjs';

export function drawArtifact(ctx, scene, state, api) {
  const { C } = api;
  const contextB = started(state, 'inspect-attached');
  const bound = complete(state, 'bind-runtime');
  const report = bound ? complete(state, 'bound-answer') : complete(state, 'attached-answer');
  api.focus.target('attachment', () => {
    text(ctx, api, 'Loaded predictor', 135, 292, 48, C.ink);
    text(ctx, api, 'Instruction + 2 labeled demonstrations', 135, 373, 36, C.muted);
    api.line(ctx, 135, 419, 1045, 419, C.muted, 2);
    text(ctx, api, 'Attached model', 135, 535, 37, C.muted);
    text(ctx, api, bound ? 'model B' : 'model A', 685, 550, 66, bound ? C.cyan : C.blue);
    if (started(state, 'bind-runtime')) {
      api.text(ctx, 'restored.set_lm(runtime_lm)', 135, 678, 41, C.cyan, 'left', 'mono');
      if (bound) text(ctx, api, 'explicit runtime binding', 1060, 677, 40, C.cyan);
    }
  });
  api.focus.target('context', () => {
    text(ctx, api, 'Global default', 1240, 292, 46, C.muted);
    text(ctx, api, contextB ? 'model B' : '…', 1240, 401, 68, C.yellow);
  });
  api.focus.target('effective', () => {
    text(ctx, api, 'Effective model', 135, 865, 40, C.ink);
    text(ctx, api, report ? (bound ? 'B' : 'A') : '?', 685, 895, 103, report ? C.cyan : C.yellow);
    if (report && bound) text(ctx, api, 'Evaluate this prompt with B.', 1045, 867, 44, C.cyan);
  });
}
export default {
  id: 'artifact',
  draw: drawArtifact,
  cues: ['save-program', 'inspect-attached', 'attached-answer', 'bind-runtime', 'bound-answer'],
};
