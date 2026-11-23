import { BILLING, cue, promptSheet, replaySlip } from '../case-file.mjs';

export function drawContextAndMemory(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('context-and-memory-construction', () => {
    if (state.beat === 0) {
      replaySlip(ctx, api, 105, 352);
      api.text(ctx, 'Retained by the application', 462, 855, 36, C.muted, 'center');
      promptSheet(ctx, api, {
        heading: 'One model call',
        verifier: BILLING,
        replayCopy: 1,
        showInvoiceCount: true,
        branch: true,
      });
      return;
    }
    if (state.beat === 1) {
      const n = cue(api, 'dense-pairs') >= 1 ? 8 : 4;
      const tokens = cue(api, 'linear-kv') >= 1 ? 8 : 4;
      api.text(ctx, 'Dense score grid', 116, 301, 43, C.ink, 'left', 'serif');
      api.text(ctx, 'Stored prefix', 985, 301, 43, C.ink, 'left', 'serif');
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          api.rect(
            ctx,
            170 + j * 56,
            369 + i * 56,
            46,
            46,
            i < 4 && j < 4 ? C.blue : C.cyan,
            null,
            3,
          );
      for (const [j, label] of ['K', 'V'].entries()) {
        api.text(ctx, label, 985, 480 + j * 148, 45, C.cyan, 'left', 'mono');
        for (let k = 0; k < tokens; k++)
          api.rect(ctx, 1068 + k * 82, 417 + j * 148, 66, 96, k < 4 ? C.blue : C.cyan, null, 3);
      }
      api.text(ctx, n + ' × ' + n + ' = ' + n * n + ' pairs', 116, 922, 48, C.ink);
      api.text(ctx, tokens + ' retained positions', 985, 922, 47, C.ink);
      return;
    }
    const rows = [
      ['Fresh replay', 'Working state', C.cyan],
      ['Repository owner', 'Pinned from metadata', C.blue],
      ['Past pull request', 'Episodic', C.yellow, 'coala-episodic'],
      ['Retry returns the original invoice', 'Semantic', C.blue, 'coala-semantic'],
      ['Reviewed verification playbook', 'Procedural', C.green, 'coala-procedural'],
    ];
    const copied = cue(api, 'episode-placement') >= 1;
    api.text(ctx, 'Billing record', 115, 283, 36, C.muted);
    api.text(ctx, 'Role in this task', 1068, 283, 36, C.muted);
    for (const [i, [record, role, color, id]] of rows.entries()) {
      const y = 382 + i * 108;
      api.line(ctx, 113, y - 62, 1794, y - 62, C.muted, 1);
      api.text(ctx, record, 115, y, 40, C.ink);
      if (!id || cue(api, id) > 0) api.text(ctx, role, 1068, y, 41, color);
      if (i === 2 && copied) api.text(ctx, 'In prompt', 1510, y, 36, C.yellow);
    }
    if (copied)
      api.text(ctx, 'The copy still describes the same pull request.', 115, 957, 39, C.yellow);
  });
}
export default {
  id: 'context-and-memory',
  draw: drawContextAndMemory,
  cues: [
    'context-and-memory-b1-1',
    'context-and-memory-b2-1',
    'dense-pairs',
    'linear-kv',
    'coala-episodic',
    'coala-semantic',
    'coala-procedural',
    'episode-placement',
  ],
};
