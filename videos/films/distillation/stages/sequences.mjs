import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawSequences(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const saved = spokenProgress(state, api, 'sequence-saved', 0, 0.22, 0.5);
  const first = spokenProgress(state, api, 'sequence-first', 1, 0.08, 0.2);
  const next = spokenProgress(state, api, 'sequence-next', 1, 0.23, 0.34);
  const rest = spokenProgress(state, api, 'sequence-rest', 1, 0.45, 0.71);
  const index = first === 0 ? -1 : next < 1 ? 0 : rest < 0.4 ? 1 : rest < 1 ? 2 : 3;
  const words = ['bird', 'in', 'the', 'garden'];
  api.focus.target('response-path', () => {
    text(ctx, api, 'The child saw a', 145, 417, 56);
    text(ctx, api, 'Prompt', 145, 315, 33, C.muted);
    text(ctx, api, 'Reviewed continuation', 690, 315, 34, C.blue);
    words.forEach((word, i) => {
      const x = 700 + i * 260;
      if (saved * words.length <= i) return;
      api.rect(ctx, x, 354, 220, 98, C.panel, undefined, 4);
      text(ctx, api, word, x + 110, 420, 48, i === index ? C.yellow : C.blue, 'center');
      if (i === index) api.line(ctx, x, 468, x + 220, 468, C.yellow, 5);
    });
    if (index >= 0) {
      text(ctx, api, 'Context at this step', 145, 621, 37, C.muted);
      text(ctx, api, ['The child saw a', ...words.slice(0, index)].join(' '), 145, 736, 52, C.ink);
      text(ctx, api, 'Next target', 1415, 621, 37, C.muted);
      text(ctx, api, words[index], 1415, 736, 60, C.yellow);
      if (beat === 2)
        text(
          ctx,
          api,
          'Another reviewed continuation gives the student another path.',
          960,
          938,
          37,
          C.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'sequences',
  draw: drawSequences,
  cues: ['sequence-saved', 'sequence-first', 'sequence-next', 'sequence-rest'],
};
