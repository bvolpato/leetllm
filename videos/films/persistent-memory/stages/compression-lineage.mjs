import { cue } from '../case-file.mjs';

export function drawCompressionLineage(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('compression-lineage-construction', () => {
    if (state.beat === 0) {
      const group = cue(api, 'compress-groups');
      const again = cue(api, 'compress-again');
      const groups = [
        Array.from({ length: 4 }, (_, i) => i + 1),
        Array.from({ length: 4 }, (_, i) => i + 5),
      ];
      for (const [g, ids] of groups.entries()) {
        const start = 150 + 875 * g;
        for (const [i, id] of ids.entries()) {
          const x = start + i * 188;
          api.rect(ctx, x, 349, 148, 86, C.panel, null, 4);
          api.text(ctx, 'm' + id, x + 74, 408, 40, C.blue, 'center', 'mono');
        }
        if (group > 0) {
          const end = start + 712;
          api.line(ctx, start, 476, start + (end - start) * group, 476, C.cyan, 4);
          if (group >= 1)
            api.text(
              ctx,
              '“summary of ' + ids.length + ' items”',
              start + 356,
              590,
              42,
              C.cyan,
              'center',
            );
        }
      }
      if (again > 0) {
        api.line(ctx, 508, 664, 508 + 875 * again, 664, C.yellow, 4);
        if (again >= 1)
          api.text(
            ctx,
            '“summary of ' + groups.length + ' items”',
            955,
            802,
            53,
            C.yellow,
            'center',
          );
      }
      return;
    }
    if (state.beat < 3) {
      const shown = cue(api, 'summary-lost-condition') >= 1;
      const opened = cue(api, 'reopen-condition') >= 1;
      api.text(ctx, 'Derived summary', 119, 321, 33, C.muted);
      if (shown) api.text(ctx, '“rollout approved”', 115, 444, 81, C.ink, 'left', 'serif');
      api.line(ctx, 117, 512, 1788, 512, C.muted, 2);
      api.text(ctx, 'Retained turn m4', 117, 630, 35, C.blue);
      if (!opened)
        api.text(
          ctx,
          shown ? 'Which rollout did the reviewer approve?' : 'Source linked',
          118,
          765,
          47,
          C.yellow,
        );
      else {
        api.text(ctx, 'Rollout must stay', 117, 765, 65, C.ink, 'left', 'serif');
        api.text(ctx, 'canary-only.', 664, 765, 65, C.yellow, 'left', 'serif');
        api.text(
          ctx,
          'Check the current release record for the authorized scope.',
          117,
          932,
          36,
          C.muted,
        );
      }
      return;
    }
    const extracted = cue(api, 'unsupported-extraction') >= 1;
    const rejected = cue(api, 'reject-extraction') >= 1;
    api.text(ctx, 'Source turn t4', 117, 309, 35, C.blue);
    api.text(ctx, '“Merge after CI.”', 115, 423, 69, C.ink, 'left', 'serif');
    api.line(ctx, 115, 490, 1790, 490, C.muted, 2);
    api.text(ctx, 'Extracted request  /  cites t4', 117, 602, 35, C.muted);
    if (extracted) api.text(ctx, '“Merge now.”', 115, 723, 69, C.ink, 'left', 'serif');
    if (rejected) {
      api.text(ctx, 'Missing condition', 117, 866, 35, C.pink);
      api.text(ctx, 'after CI', 530, 866, 48, C.pink, 'left', 'mono');
      api.text(ctx, 'Leave the request out.', 117, 958, 40, C.ink);
    }
  });
}
export default {
  id: 'compression-lineage',
  draw: drawCompressionLineage,
  cues: [
    'compress-groups',
    'compress-again',
    'summary-lost-condition',
    'reopen-condition',
    'unsupported-extraction',
    'reject-extraction',
  ],
};
