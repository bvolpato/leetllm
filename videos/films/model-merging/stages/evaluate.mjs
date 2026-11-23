import { after, scoreReport, started } from '../decisions.mjs';
import { drawScoreboard } from '../scoreboard.mjs';

export function drawEvaluate(ctx, scene, state, api) {
  drawScoreboard(ctx, api, scoreReport(), {
    showScores: after(state, 'report-rows'),
    absolute: started(state, 'absolute-floors'),
    relative: started(state, 'relative-floors'),
    gap: after(state, 'relative-gap')
      ? 'relative'
      : after(state, 'absolute-gap')
        ? 'absolute'
        : null,
    verdict: after(state, 'hold-original'),
  });
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: [
    'report-rows',
    'absolute-floors',
    'absolute-gap',
    'relative-floors',
    'relative-gap',
    'hold-original',
  ],
};
