import { codeText, focusTarget, line, note } from '../defaults.mjs';
import { permissionBits } from '../model.mjs';
export function drawPermissionBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['dk-permission-boundary-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  focusTarget(ctx, api, 'permission-boundary-construction', () => {
    if (currentBeat < 2) {
      codeText(ctx, api, 'Configured user', 145, 309, 34, themeColors.muted);
      codeText(ctx, api, 'appuser', 619, 309, 38, themeColors.blue, 'left', 'mono');
      const command = (value, y) =>
        codeText(ctx, api, value, 145, y, 36, themeColors.ink, 'left', 'mono');
      command('$ docker run --rm --read-only --entrypoint id access-rag:local', 439);
      if (resultComplete('uid')) {
        codeText(ctx, api, 'uid=10001(appuser)', 177, 544, 40, themeColors.cyan, 'left', 'mono');
        if (resultComplete('group'))
          codeText(ctx, api, 'gid=10001(appuser)', 729, 544, 40, themeColors.cyan, 'left', 'mono');
      }
      line(ctx, api, 145, 602, 1772, 602, themeColors.muted);
      if (currentBeat === 1 && cue('scorer') && cue('scorer').phase !== 'before') {
        command('$ docker run --rm --read-only access-rag:local', 700);
        if (resultComplete('output'))
          codeText(
            ctx,
            api,
            '0.667 (2/3)     exit 0',
            177,
            795,
            40,
            themeColors.green,
            'left',
            'mono',
          );
      }
      if (resultComplete('beat1')) {
        line(ctx, api, 145, 854, 1772, 854, themeColors.muted);
        codeText(ctx, api, 'Inside this container', 145, 927, 30, themeColors.muted);
        codeText(ctx, api, 'Python runs as appuser', 145, 994, 38, themeColors.blue);
        if (resultComplete('daemon')) {
          codeText(ctx, api, 'On the Engine host', 980, 927, 30, themeColors.muted);
          codeText(
            ctx,
            api,
            'Rootful daemon control can grant host access',
            980,
            994,
            33,
            themeColors.ink,
          );
        }
      }
    } else {
      const repaired = resultComplete('mode');
      const owner = repaired ? 10001 : 0;
      const traverse = permissionBits(0o700, owner, 10001).traverse;
      const readable = permissionBits(0o644, 0, 10001).read;
      codeText(ctx, api, 'appuser · UID 10001', 147, 435, 43, themeColors.blue);
      codeText(ctx, api, 'Host directory', 147, 577, 35);
      codeText(
        ctx,
        api,
        (repaired ? '10001' : 'root ') + '   0700   eval/',
        783,
        577,
        35,
        themeColors.cyan,
        'left',
        'mono',
      );
      codeText(ctx, api, 'File inside', 147, 686, 35);
      codeText(
        ctx,
        api,
        'root   0644   access_requests.jsonl',
        783,
        686,
        35,
        themeColors.cyan,
        'left',
        'mono',
      );
      line(ctx, api, 147, 749, 1770, 749, themeColors.muted);
      codeText(
        ctx,
        api,
        traverse && readable
          ? 'Directory traversable · file readable'
          : 'Cannot traverse eval/ to reach the file',
        147,
        850,
        40,
        traverse && readable ? themeColors.green : themeColors.pink,
      );
      note(ctx, api, 'Example on a Linux Engine with unmapped UIDs');
    }
  });
}
export default {
  id: 'permission-boundary',
  draw: drawPermissionBoundary,
  cues: [
    'dk-permission-boundary-beat0',
    'dk-permission-boundary-uid',
    'dk-permission-boundary-group',
    'dk-permission-boundary-scorer',
    'dk-permission-boundary-output',
    'dk-permission-boundary-beat1',
    'dk-permission-boundary-daemon',
    'dk-permission-boundary-beat2',
    'dk-permission-boundary-mode',
  ],
};
