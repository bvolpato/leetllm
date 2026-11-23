import { drawPageSearch, FOLLOW_UP } from '../page-search.mjs';
import { spoken } from '../construction.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const delivery = api.ease(Math.min(1, (state.t + 0.12) / 1.55));
  const result = spoken(state, 1, 'intro-result') === 1;
  drawPageSearch(ctx, api, {
    delivery,
    query: FOLLOW_UP,
    result,
    emphasizeHistory: result,
    prompt: result ? 'Which words stayed in the chat?' : 'Count each shared word once.',
  });
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['intro-follow-up', 'intro-search', 'intro-result'],
};
