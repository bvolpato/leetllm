import { lfsPointer } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, mark, route, tag, terminal, text } from '../defaults.mjs';
export function drawLfsContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat === 0) {
    const bind = cueProgress(state, 'lfs-pointer-object', 0),
      missing = cueProgress(state, 'lfs-missing-object', 0),
      noTool = cueProgress(state, 'lfs-no-tool', 0);
    mark(api, 'lfs-object-binding', () => {
      text(
        ctx,
        api,
        'Computed 8-byte teaching payload · not model weights',
        960,
        310,
        32,
        api.C.muted,
        'center',
      );
      terminal(
        ctx,
        api,
        'Git commit · exact pointer lines',
        bind === 1
          ? lfsPointer.trimEnd().split('\n')
          : ['version https://git-lfs.github.com/spec/v1', 'object binding pending'],
        180,
        370,
        1560,
        280,
        {
          color: api.C.blue,
          size: 25,
          lineHeight: 60,
        },
      );
      terminal(
        ctx,
        api,
        'Separate object bytes',
        [
          '00 01 02 FF 0A 4C 46 53',
          ...(bind === 1 ? ['8 bytes · SHA-256 matches pointer'] : ['digest and length pending']),
        ],
        180,
        695,
        1560,
        170,
        {
          color: api.C.cyan,
          size: 28,
          lineHeight: 45,
        },
      );
      if (bind > 0) {
        route(
          ctx,
          api,
          [
            [960, 655],
            [960, 685],
          ],
          api.C.cyan,
        );
      }
    });
    mark(api, 'lfs-object-state', () => {
      if (missing > 0) {
        text(
          ctx,
          api,
          missing === 1
            ? 'Checkout contains pointer text; payload admission blocked'
            : 'Check the required object',
          960,
          925,
          35,
          api.C.yellow,
          'center',
        );
      }
      caption(
        ctx,
        api,
        noTool === 1
          ? 'Actual article fixture: LFS tool absent · no weights committed'
          : 'A recorded pointer identifies bytes; it does not contain those bytes',
      );
    });
  } else
    mark(api, 'lfs-selection', () => {
      const blocked = cueProgress(state, 'lfs-ignore-conflict', 1),
        include = cueProgress(state, 'lfs-artifact-selection', 1);
      terminal(
        ctx,
        api,
        'Ordinary add of model/demo.bin',
        ['.gitattributes: model/*.bin filter=lfs', '.gitignore: model/'],
        180,
        360,
        1560,
        210,
        {
          color: api.C.blue,
          size: 31,
          lineHeight: 62,
        },
      );
      tag(ctx, api, 'path selection', 180, 670, 400, api.C.yellow);
      tag(ctx, api, 'LFS clean filter', 760, 670, 400, blocked === 1 ? api.C.muted : api.C.cyan);
      tag(ctx, api, 'index', 1340, 670, 400, api.C.muted);
      route(
        ctx,
        api,
        [
          [605, 704],
          [735, 704],
        ],
        api.C.muted,
      );
      route(
        ctx,
        api,
        [
          [1185, 704],
          [1315, 704],
        ],
        api.C.muted,
      );
      if (blocked === 1) {
        api.line(ctx, 650, 640, 650, 770, api.C.pink, 6);
        text(ctx, api, 'ignored before ordinary selection', 960, 835, 36, api.C.yellow, 'center');
      }
      caption(
        ctx,
        api,
        include === 1
          ? 'Commit attributes; admit the required nonsecret artifact or versioned external manifest'
          : 'A filter rule does not override an ignore rule',
      );
    });
}
export default {
  id: 'lfs-contract',
  draw: drawLfsContract,
  cues: [
    'lfs-pointer-object',
    'lfs-missing-object',
    'lfs-no-tool',
    'lfs-ignore-conflict',
    'lfs-artifact-selection',
  ],
};
