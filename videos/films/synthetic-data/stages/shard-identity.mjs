import { centeredText, clauseComplete, clauseProgress, tag } from '../defaults.mjs';
import { createHash } from 'node:crypto';
export function drawShardIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('shard-identity-mechanism', () => {
    const original =
        JSON.stringify({
          seed_id: 'S12',
          page_size: 100,
        }) + '\n',
      changed =
        JSON.stringify({
          seed_id: 'S12',
          page_size: 10000,
        }) + '\n',
      hash = (text) => createHash('sha256').update(text).digest('hex'),
      old = hash(original),
      next = hash(changed),
      edited = currentBeat === 1 && clauseProgress(ctx, api, 'change-payload');
    const digest = (name, value, y, col) => {
      centeredText(ctx, api, name, 960, y, 31, col);
      centeredText(ctx, api, value.slice(0, 32), 960, y + 60, 29, col);
      centeredText(ctx, api, value.slice(32), 960, y + 105, 29, col);
    };
    if (currentBeat === 0) {
      api.math(
        ctx,
        String.raw`\texttt{\{"seed\_id":"S12","page\_size":100\}}\quad\text{+ LF}`,
        960,
        330,
        32,
        themeColors.blue,
        'center',
      );
      if (clauseProgress(ctx, api, 'hash-bytes'))
        digest('Payload SHA-256', old, 515, themeColors.blue);
      if (clauseProgress(ctx, api, 'hash-log'))
        tag(
          ctx,
          api,
          'Manifest also binds the complete decision-log digest',
          960,
          835,
          themeColors.cyan,
          1500,
        );
    } else if (currentBeat === 1) {
      tag(
        ctx,
        api,
        'Page size in this version    ' + (edited ? 10000 : 100),
        960,
        285,
        edited ? themeColors.pink : themeColors.blue,
        1450,
      );
      digest('Separately approved digest', old, 415, themeColors.blue);
      if (clauseProgress(ctx, api, 'mutable-matches'))
        digest('Current manifest digest', next, 655, themeColors.pink);
      if (clauseComplete(ctx, api, 'approval-fails'))
        centeredText(
          ctx,
          api,
          'Different bytes → approval check fails',
          960,
          935,
          39,
          themeColors.pink,
        );
    } else {
      tag(
        ctx,
        api,
        'Approved row    →    S12    →    Reviewed pagination task',
        960,
        370,
        themeColors.blue,
        1500,
      );
      if (clauseComplete(ctx, api, 'provenance-limit'))
        digest('Approved output   ·   SHA-256', old, 530, themeColors.cyan);
      if (clauseProgress(ctx, api, 'rights-evidence'))
        tag(ctx, api, 'Source permission record', 960, 870, themeColors.yellow, 1100);
    }
  });
}
export default {
  id: 'shard-identity',
  draw: drawShardIdentity,
  cues: [
    'payload-digest',
    'hash-bytes',
    'hash-log',
    'trusted-reference',
    'change-payload',
    'mutable-matches',
    'approval-fails',
    'provenance-limit',
    'rights-evidence',
  ],
};
