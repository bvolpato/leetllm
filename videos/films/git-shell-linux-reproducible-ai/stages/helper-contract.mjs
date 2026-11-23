import { cueProgress } from '../construction.mjs';
import { caption, mark, route, tag, text } from '../defaults.mjs';
export function drawHelperContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    names = ['eval/access_requests.jsonl', 'eval/space name.jsonl', 'eval/line\\nbreak.jsonl'];
  const progress = cueProgress(state, 'helper-paths', 0),
    total = cueProgress(state, 'helper-total', 1),
    fail = cueProgress(state, 'helper-failure', 1),
    local = cueProgress(state, 'helper-declaration', 1);
  mark(api, 'helper-path-arguments', () => {
    text(
      ctx,
      api,
      'find … -exec sh -c \'wc -l < "$1"\' sh {} \\;',
      960,
      315,
      32,
      api.C.cyan,
      'center',
      true,
    );
    names.forEach((name, i) => {
      const y = 365 + i * 110;
      tag(ctx, api, name, 180, y, 690, api.C.blue, 28);
      route(
        ctx,
        api,
        [
          [895, y + 34],
          [1195, y + 34],
        ],
        api.C.muted,
      );
      text(ctx, api, 'one argument', 1045, y + 15, 23, api.C.muted, 'center');
      const q = i === 0 ? 1 : progress;
      if (q === 1)
        tag(ctx, api, `${[3, 2, 1][i]} newline${i === 2 ? '' : 's'}`, 1220, y, 510, api.C.cyan, 30);
    });
  });
  if (currentBeat === 0)
    caption(
      ctx,
      api,
      'The printed \\n denotes one byte inside the filename, not a filename separator',
    );
  else {
    mark(api, 'helper-count-result', () =>
      text(
        ctx,
        api,
        total === 1 ? '3 + 2 + 1 = 6 newline characters' : 'Sum only successful per-file counts',
        960,
        755,
        38,
        total === 1 ? api.C.green : api.C.muted,
        'center',
      ),
    );
    mark(api, 'helper-failure-result', () => {
      if (fail > 0) {
        text(ctx, api, 'Different input: absent directory', 180, 835, 29, api.C.pink);
        text(
          ctx,
          api,
          fail === 1 ? 'du fails → return nonzero → no count output' : 'checking directory',
          180,
          890,
          29,
          api.C.pink,
        );
      }
    });
    mark(api, 'helper-status', () => {
      if (local > 0) {
        text(
          ctx,
          api,
          local === 1
            ? 'local counts; counts=$(…) || return'
            : 'Keep declaration and checked assignment separate',
          1280,
          835,
          26,
          api.C.yellow,
          'center',
          true,
        );
        text(
          ctx,
          api,
          local === 1 ? 'Failure reaches the caller' : 'The local builtin has its own status',
          1280,
          890,
          28,
          api.C.yellow,
          'center',
        );
      }
    });
  }
}
export default {
  id: 'helper-contract',
  draw: drawHelperContract,
  cues: [
    'helper-paths',
    'helper-read-counts',
    'helper-total',
    'helper-failure',
    'helper-declaration',
  ],
};
