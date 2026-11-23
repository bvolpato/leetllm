import { CLAIMS } from '../fixtures.mjs';
import { metrics } from '../model.mjs';
import { completed, spoken } from '../construction.mjs';

export function drawSupportGraph(ctx, scene, state, api) {
  const { C, text, line } = api;
  const compared = completed(state, 'contradicted', 1);
  const extra = spoken(state, 'new-claim', 2) > 0;
  const neutral = completed(state, 'unestablished', 3);
  const ids = extra ? ['box', 'instant', 'delivery'] : ['box', 'instant'];
  const claims = ids.map((id) => CLAIMS.find((c) => c.id === id));
  const sourceSpans = [
    'A   “The return box is available.”',
    'B   “Receipts are emailed the next day.”',
    'A and B describe returns and receipts.',
  ];
  const relations = ['Supported', 'Contradicted', 'Unestablished'];

  text(ctx, 'Answer', 150, 302, 34, C.blue);
  text(ctx, 'Recorded in the prompt', 780, 302, 34, C.cyan);
  text(ctx, 'Finding', 1510, 302, 34, C.muted);
  line(ctx, 150, 331, 1770, 331, C.muted, 2);
  claims.forEach((claim, i) => {
    const y = 440 + i * 148;
    const settled = i === 0 ? completed(state, 'support-link', 0) : i === 1 ? compared : neutral;
    const ink = !settled ? C.muted : i === 0 ? C.green : i === 1 ? C.pink : C.yellow;
    api.focus.target(i === 0 ? 'box-match' : i === 1 ? 'timing-match' : 'delivery-match', () => {
      text(ctx, claim.text, 150, y, 37, C.ink);
      text(ctx, sourceSpans[i], 780, y, 35, C.ink);
      text(ctx, settled ? relations[i] : '?', 1510, y, settled ? 32 : 43, ink);
    });
    line(ctx, 150, y + 55, 1770, y + 55, C.muted, 1);
  });

  const result = extra
    ? completed(state, 'three-claim-score', 3)
    : completed(state, 'support-result', 1);
  const supported = Math.round(metrics(ids).faithfulness * ids.length);
  api.focus.target('faithfulness', () => {
    text(ctx, 'Supported claims / claims made', 150, 916, 34, C.muted);
    const fraction = result ? String.raw`\frac${supported}${ids.length}` : '?';
    api.math(ctx, fraction, 805, 916, 54, C.cyan, 'center');
    const prompt = extra
      ? neutral
        ? 'The notices leave delivery open.'
        : 'Do the instructions rule out delivery?'
      : result
        ? 'Only the return-box claim has support.'
        : 'Compare the timing words.';
    text(ctx, prompt, 1740, 916, 34, C.ink, 'right');
  });
}

export default {
  id: 'support-graph',
  draw: drawSupportGraph,
  cues: [
    'support-link',
    'contradicted',
    'support-result',
    'new-claim',
    'unestablished',
    'three-claim-score',
  ],
};
