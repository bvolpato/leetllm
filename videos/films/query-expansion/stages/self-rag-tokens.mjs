import { spoken } from '../construction.mjs';

export function drawSelfRagTokens(ctx, scene, state, api) {
  const { C, focus } = api;
  const fetched = spoken(state, 0, 'reflection-retrieve') === 1;
  const relevant = spoken(state, 1, 'reflection-relevance') > 0;
  const generated = spoken(state, 1, 'reflection-write') > 0;
  const supported = spoken(state, 1, 'reflection-families') === 1;
  const utility = spoken(state, 1, 'reflection-utility') === 1;
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  label('Can we increase throughput for launch week?', 135, 270, 49);
  focus.target('reflection-retrieval', () =>
    label(fetched ? 'Retrieve = Yes' : 'Retrieve = ?', 135, 391, 43, C.yellow),
  );
  label('No = skip retrieval', 665, 390, 32, C.muted);
  label('Continue = reuse evidence', 1185, 390, 32, C.muted);
  api.line(ctx, 135, 448, 1785, 448, C.muted, 2);

  focus.target('reflection-evidence', () => {
    label('Source E1', 135, 547, 33, C.cyan);
    if (fetched) {
      label('“Temporary quota increases require approval.', 520, 540, 42);
      label('Keep exponential backoff enabled.”', 520, 605, 42);
    }
  });
  if (relevant) label('ISREL · relevant', 520, 667, 30, C.cyan);
  api.line(ctx, 135, 715, 1785, 715, C.panel, 3);
  focus.target('reflection-segment', () => {
    label('Next sentence', 135, 808, 33, C.blue);
    if (generated) label('“Request approval for a temporary increase.”', 520, 808, 42);
  });
  focus.target('reflection-judgments', () => {
    if (generated)
      label(supported ? 'ISSUP · fully supported' : 'ISSUP · ?', 520, 900, 35, C.yellow);
    if (utility) label('ISUSE · 4 of 5', 1240, 900, 35, C.yellow);
  });
  if (state.beat === 2)
    label(
      'Offline critic labels examples. The trained generator predicts tokens during decoding.',
      135,
      1012,
      30,
      C.muted,
    );
}
export default {
  id: 'self-rag-tokens',
  draw: drawSelfRagTokens,
  cues: [
    'reflection-retrieve',
    'reflection-relevance',
    'reflection-write',
    'reflection-families',
    'reflection-utility',
    'reflection-trained',
  ],
};
