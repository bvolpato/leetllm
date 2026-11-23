import { libraryShelf, sundayQuestion } from '../library-shelf.mjs';

export function drawCandidateCeiling(ctx, scene, state, api) {
  const { C, focus } = api;
  const widening = focus.progress('expand-budget', 0);
  api.text(ctx, sundayQuestion, 122, 244, 54, C.ink);
  libraryShelf(ctx, api, {
    count: 3,
    depth: 2 + widening,
    destination: 'To scorer',
    highlight: true,
  });
  focus.target('receipt', () => {
    api.text(ctx, 'Scoring input', 130, 915, 30, C.muted);
    api.text(
      ctx,
      widening === 1 ? 'events-v2   /   holiday-v3   /   hours-v7' : 'events-v2   /   holiday-v3',
      130,
      977,
      38,
      C.ink,
      'left',
      'mono',
    );
  });
}
export default {
  id: 'candidate-ceiling',
  draw: drawCandidateCeiling,
  cues: ['shortlist', 'scoring-input', 'expand-budget', 'same-snapshot'],
};
