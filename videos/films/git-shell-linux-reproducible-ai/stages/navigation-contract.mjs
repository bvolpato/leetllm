import { mix, smooth } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, mark, route, tag, text } from '../defaults.mjs';
export function drawNavigationContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    moved = cueProgress(state, 'relative-base', 0),
    missed = cueProgress(state, 'path-miss', 0);
  if (currentBeat === 0)
    mark(api, 'path-resolution', () => {
      text(
        ctx,
        api,
        'Same argument: eval/access_requests.jsonl',
        960,
        310,
        34,
        api.C.cyan,
        'center',
        true,
      );
      tag(ctx, api, '/workspace/access-rag', 180, 420, 570, api.C.blue, 32);
      tag(ctx, api, 'eval/', 1050, 420, 280, api.C.green);
      tag(ctx, api, 'fixture', 1420, 420, 300, api.C.green);
      tag(ctx, api, 'scripts/', 520, 650, 360, moved === 1 ? api.C.yellow : api.C.muted);
      route(
        ctx,
        api,
        [
          [750, 454],
          [1020, 454],
        ],
        api.C.green,
      );
      route(
        ctx,
        api,
        [
          [1330, 454],
          [1390, 454],
        ],
        api.C.green,
      );
      route(
        ctx,
        api,
        [
          [470, 488],
          [470, 684],
          [490, 684],
        ],
        api.C.muted,
      );
      if (moved > 0) {
        route(
          ctx,
          api,
          [
            [880, 684],
            [1170, 684],
          ],
          api.C.yellow,
        );
        tag(
          ctx,
          api,
          'scripts/eval/...',
          1200,
          650,
          520,
          missed === 1 ? api.C.pink : api.C.muted,
          31,
        );
      }
      const descent = smooth(Math.min(1, moved / 0.65)),
        approach = smooth(Math.max(0, (moved - 0.65) / 0.35));
      tag(ctx, api, 'cwd', mix(270, 610, approach), mix(535, 765, descent), 160, api.C.yellow);
      text(
        ctx,
        api,
        missed === 1 ? 'No file at the new lookup path' : 'The fixture remains in eval/',
        1460,
        830,
        29,
        missed === 1 ? api.C.pink : api.C.green,
        'center',
      );
      caption(ctx, api, 'Directory state changes the lookup; the scorer file is unchanged');
    });
  else {
    const quoted = cueProgress(state, 'quoted-argument', 1),
      guard = cueProgress(state, 'guarded-directory', 1),
      chain = cueProgress(state, 'git-operation-chain', 1);
    mark(api, 'path-arguments', () => {
      text(ctx, api, 'path="eval/space name.jsonl"', 180, 325, 35, api.C.ink, 'left', true);
      text(ctx, api, './score "$path"', 180, 395, 36, api.C.cyan, 'left', true);
      tag(
        ctx,
        api,
        quoted === 1 ? 'argv[1]: eval/space name.jsonl' : 'argument assembly',
        790,
        345,
        930,
        quoted === 1 ? api.C.cyan : api.C.muted,
        30,
      );
    });
    mark(api, 'directory-gate', () => {
      text(ctx, api, 'cd "$repo" || exit 1', 180, 545, 36, api.C.yellow, 'left', true);
      tag(ctx, api, 'cd fails', 180, 605, 300, api.C.pink);
      tag(ctx, api, guard === 1 ? 'exit 1' : 'check status', 700, 605, 300, api.C.yellow);
      if (guard === 1) {
        route(
          ctx,
          api,
          [
            [500, 640],
            [670, 640],
          ],
          api.C.pink,
        );
        api.line(ctx, 1110, 600, 1110, 680, api.C.pink, 5);
        text(ctx, api, './score not launched', 1190, 650, 33, api.C.muted, 'left', true);
      }
      const names = ['init', 'add', 'commit', 'clone'];
      names.forEach((n, i) => {
        tag(
          ctx,
          api,
          n,
          180 + i * 420,
          800,
          310,
          chain === 1 ? (i === 2 ? api.C.green : api.C.blue) : api.C.muted,
        );
        if (i < 3) api.line(ctx, 510 + i * 420, 834, 570 + i * 420, 834, api.C.muted, 2);
      });
      caption(
        ctx,
        api,
        chain === 1
          ? 'Local repository → selected contents → local history → reconstructed files'
          : 'Different commands have different effects',
      );
    });
  }
}
export default {
  id: 'navigation-contract',
  draw: drawNavigationContract,
  cues: [
    'relative-base',
    'path-miss',
    'quoted-argument',
    'guarded-directory',
    'git-operation-chain',
  ],
};
