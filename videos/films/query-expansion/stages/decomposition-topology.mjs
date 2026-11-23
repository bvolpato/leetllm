import { spoken } from '../construction.mjs';

const facts = [
  ['Latency', '90 ms target', 'Within 24 h'],
  ['Limit per job', '32 items', '500 items'],
  ['Retries', 'Use backoff', null],
];
export function drawDecompositionTopology(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat < 2) {
    const count = Math.floor(spoken(state, 0, 'fact-search') * 5);
    const missing = spoken(state, 1, 'fact-gap') === 1;
    label('Compare the sync and batch endpoints.', 135, 270, 48);
    label('Illustrative runbooks', 135, 404, 29, C.muted);
    ['Sync', 'Batch'].forEach((v, i) => label(v, 752 + i * 604, 409, 43, C.blue));
    facts.forEach(([name, ...values], i) => {
      const y = 537 + i * 151;
      label(name, 135, y, 40);
      values.forEach((value, j) => {
        const x = 752 + j * 604;
        const returned = value && i * 2 + j < count;
        focus.target('fact-receipts', () => {
          label(
            returned ? value : missing ? 'No source found' : '…',
            x,
            y,
            39,
            returned ? C.ink : C.yellow,
          );
          if (returned) label('Source ' + (j ? 'B' : 'S') + (i + 1), x, y + 51, 27, C.cyan);
        });
      });
      api.line(ctx, 135, y + 78, 1785, y + 78, C.panel, 3);
    });
    label(
      missing ? 'Leave batch retries open in the answer.' : 'Six lookups can start together.',
      960,
      981,
      36,
      C.yellow,
      'center',
    );
    return;
  }
  const resolved = spoken(state, 2, 'fact-endpoint') === 1;
  const found = spoken(state, 2, 'fact-retry') === 1;
  label('Which endpoint had the most errors? Which retry rule applies?', 135, 275, 47);
  focus.target('endpoint-receipt', () => {
    label('1    Read the error report', 135, 457, 40);
    label(
      resolved ? 'E1 names the batch endpoint' : 'Endpoint unknown',
      855,
      457,
      42,
      resolved ? C.cyan : C.muted,
    );
  });
  api.line(ctx, 135, 553, 1780, 553, C.muted, 2);
  focus.target('retry-receipt', () => {
    label('2    Search the retry policy', 135, 676, 40);
    label(
      resolved ? 'batch endpoint retry policy' : '[ endpoint ? ]  retry policy',
      855,
      676,
      42,
      resolved ? C.blue : C.muted,
    );
    if (found) label('B3   ·   retry failed items only', 855, 782, 38, C.green);
  });
  label(
    found ? 'Keep both source IDs with the answer.' : 'The second query needs the first result.',
    960,
    966,
    37,
    C.yellow,
    'center',
  );
}
export default {
  id: 'decomposition-topology',
  draw: drawDecompositionTopology,
  cues: ['fact-search', 'fact-gap', 'fact-endpoint', 'fact-retry'],
};
