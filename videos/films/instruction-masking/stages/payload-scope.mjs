import { cueProgress, done } from '../construction.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

export function drawPayloadScope(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    focus(ctx, api, 'observations', () => {
      text(ctx, api, 'Archived translation runs', 118, 269, 42);
      text(ctx, api, 'Replies containing only the test word', 738, 338, 34, C.muted);
      const rows = [
        ['Plain text', 0, 'historical-plain'],
        ['With marker text', 24, 'historical-marker'],
        ['Including an end marker', 25, 'historical-ending'],
      ];
      for (const [i, [name, hits, cue]] of rows.entries()) {
        const y = 451 + i * 151;
        const known = done(state, cue, 0);
        const progress = cueProgress(state, cue, 0);
        text(ctx, api, name, 118, y, 40);
        for (let j = 0; j < 25; j++) {
          const x = 752 + j * 36;
          api.circle(
            ctx,
            x,
            y - 14,
            11,
            known || progress > j / 25 ? (j < hits ? C.yellow : C.panel) : C.bg,
            C.muted,
            1.5,
          );
        }
        text(
          ctx,
          api,
          known ? hits + '/25' : '…',
          1790,
          y,
          37,
          known ? C.yellow : C.muted,
          'right',
        );
      }
      text(
        ctx,
        api,
        'One quantized Mistral build   ·   five sentences, five runs each',
        960,
        945,
        35,
        C.muted,
        'center',
      );
    });
    return;
  }
  focus(ctx, api, 'evidence-check', () => {
    const rows =
      beat === 1
        ? [
            ['Rendered text', 'Inspect the quoted text'],
            ['Tokenizer IDs', 'Locate matches by message owner'],
            ['Model behavior', 'Evaluate the answer on held-out requests'],
          ]
        : [
            ['Request body', 'Compare messages, tools and retained history'],
            ['Usage', 'Compare the reported input counts'],
            ['Behavior', 'Check answers when a user quotes a marker'],
          ];
    rows.forEach(([what, check], i) => {
      const y = 360 + i * 178;
      text(ctx, api, what, 122, y, 43, C.cyan);
      text(ctx, api, check, 658, y, 40);
      api.line(ctx, 124, y + 52, 1770, y + 52, C.muted, 2);
    });
    text(
      ctx,
      api,
      beat === 1
        ? 'Tokenizer evidence establishes what went in.'
        : 'Restrict access to traces containing user data.',
      960,
      950,
      38,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'payload-scope',
  draw: drawPayloadScope,
  cues: [
    'historical-plain',
    'historical-marker',
    'historical-ending',
    'scope-check',
    'scope-hosted',
  ],
};
