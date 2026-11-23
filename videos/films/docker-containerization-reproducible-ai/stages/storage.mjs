import { cueProgress } from '../construction.mjs';
import { codeBlock, codeCard, focusTarget, codeText, panel } from '../defaults.mjs';
export function drawStorage(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat,
    q = (id, beat = 0, start, end) => cueProgress(state, id, beat, start, end);
  {
    if (currentBeat === 0) {
      const removed = state.cues?.['storage-remove']?.phase === 'after';
      const reopened = state.cues?.['storage-reopen']?.phase === 'after';
      if (!removed || reopened)
        codeCard(
          ctx,
          api,
          reopened ? 'Container C2' : 'Container C1',
          160,
          380,
          570,
          themeColors.green,
          120,
        );
      else codeText(ctx, api, 'C1 removed', 445, 451, 39, themeColors.muted, 'center');
      focusTarget(ctx, api, 'persistent-volume', () =>
        panel(ctx, api, 1130, 350, 640, 340, themeColors.blue, () => {
          codeText(ctx, api, 'Named volume: scorer-cache', 1160, 421, 36, themeColors.blue);
          if (q('storage-volume') >= 1)
            codeText(ctx, api, 'cache-entry.json', 1160, 562, 41, themeColors.ink, 'left', 'mono');
        }),
      );
      if (reopened) {
        api.arrow(ctx, 1100, 440, 760, 440, themeColors.cyan, 5);
        codeText(ctx, api, 'read', 929, 408, 34, themeColors.cyan, 'center');
      } else if (!removed && q('storage-volume') > 0) {
        api.arrow(ctx, 760, 440, 1100, 440, themeColors.blue, 5);
        codeText(ctx, api, 'write', 929, 408, 34, themeColors.blue, 'center');
      }
    } else {
      const after = (id) => state.cues?.[id]?.phase === 'after';
      const source = after('storage-reset')
        ? './eval'
        : after('storage-archive')
          ? './archive'
          : after('storage-typo')
            ? './evla'
            : './eval';
      focusTarget(ctx, api, 'compose-mount-policy', () =>
        codeBlock(
          ctx,
          api,
          'compose.yaml · selected run policy',
          [
            'services:',
            '  scorer:',
            '    read_only: true',
            '    volumes:',
            '      - type: bind',
            '        source: ' + source,
            '        target: /app/eval',
            '        read_only: true',
            '        bind:',
            '          create_host_path: false',
          ],
          140,
          280,
          1000,
          630,
          {
            active: after('storage-typo') ? 5 : q('storage-policy', 1) > 0 ? 7 : 2,
            color: themeColors.cyan,
          },
        ),
      );
      const absent = state.cues?.['storage-absent']?.phase === 'after';
      const archive = state.cues?.['storage-archive']?.phase === 'after';
      focusTarget(ctx, api, 'compose-source', () => {
        codeText(ctx, api, 'Try a different source', 1203, 376, 33);
        if (absent) {
          codeText(ctx, api, './evla  (absent)', 1203, 467, 32, themeColors.ink, 'left', 'mono');
          codeText(ctx, api, 'Launch stops', 1203, 519, 32, themeColors.pink);
        }
        if (archive) {
          codeText(
            ctx,
            api,
            './archive  (has fixture)',
            1203,
            613,
            31,
            themeColors.ink,
            'left',
            'mono',
          );
          codeText(ctx, api, 'Reads the archive fixture', 1203, 665, 32, themeColors.cyan);
        }
      });
      focusTarget(ctx, api, 'compose-command', () =>
        codeBlock(
          ctx,
          api,
          'After a scorer edit',
          ['$ docker compose run \\', '    --build --rm scorer'],
          1203,
          746,
          575,
          177,
          {
            color: themeColors.green,
            active: q('storage-command', 1) > 0 ? 1 : -1,
          },
        ),
      );
      codeText(
        ctx,
        api,
        'Root policy and input-mount policy are separate',
        960,
        1000,
        30,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'storage',
  draw: drawStorage,
  cues: [
    'storage-volume',
    'storage-remove',
    'storage-reopen',
    'storage-policy',
    'storage-typo',
    'storage-absent',
    'storage-archive',
    'storage-reset',
    'storage-command',
  ],
};
