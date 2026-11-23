import { mix, smooth } from '../construction.mjs';
import { requestRuler } from '../policy-desk.mjs';

export function drawIntro(ctx, scene, state, api) {
  // The badge is already falling when the course mark cuts to this shot.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const progress = (cue) => api.focus.progress(cue, 0);
  const move = progress('opening-choice');
  requestRuler(ctx, api, {
    cut: mix(0.8, 0.5, smooth(move)),
    drop: 1 - Math.pow(1 - Math.min(1, state.t / 1.15), 2),
    proposal: progress('opening-proposal'),
    move,
    automatic: progress('opening-auto') === 1,
    review: progress('opening-review') === 1,
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['opening-score', 'opening-auto', 'opening-proposal', 'opening-choice', 'opening-review'],
};
