import { codeText, focusTarget, imageLayer, line, pill, text } from '../defaults.mjs';
export function drawSecrets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    old = (id) => state.cues?.[id],
    OP = (id) => {
      const x = old(id);
      return !x || x.phase === 'before' ? 0 : x.phase === 'after' ? 1 : x.progress;
    },
    OD = (id) => old(id)?.phase === 'after';
  focusTarget(ctx, api, 'secrets-construction', () => {
    if (currentBeat === 2) {
      focusTarget(ctx, api, 'runtime-secret', () => {
        codeText(ctx, api, 'Mounted secret for a future API client', 148, 300, 42);
        const columns = [148, 675, 1230];
        ['Deployment', 'Container starts', 'Process opens file'].forEach((label, i) =>
          codeText(ctx, api, label, columns[i], 426, 35, themeColors.muted),
        );
        codeText(ctx, api, 'Local Compose', 148, 560, 38, themeColors.cyan);
        line(ctx, api, 148, 634, 1770, 634, themeColors.muted);
        codeText(ctx, api, 'Cloud Run', 148, 741, 38, themeColors.blue);
        if (OD('secret-compose')) {
          codeText(ctx, api, 'Attach granted file', 675, 560, 34, themeColors.cyan);
          codeText(ctx, api, 'Read host-backed file', 1230, 560, 34);
        }
        if (OD('secret-permission')) {
          codeText(ctx, api, 'Check service identity', 148, 816, 32, themeColors.blue);
          codeText(ctx, api, 'Volume configured', 675, 741, 34, themeColors.muted);
        }
        if (OD('secret-read'))
          codeText(ctx, api, 'Fetch secret value', 1230, 741, 34, themeColors.cyan);
      });
      return;
    }
    const mounted = OP('secret-mount') > 0 && OP('secret-unmount') < 1,
      output = OD('secret-output');
    text(ctx, api, 'Private package installation', 960, 285, 36, themeColors.yellow);
    focusTarget(ctx, api, 'build-instruction', () => {
      line(ctx, api, 250, 455, 950, 455, themeColors.blue);
      text(ctx, api, 'One authorized RUN instruction', 600, 410, 34, themeColors.blue);
      pill(ctx, api, 'private dependency install', 600, 720, 650, themeColors.blue);
    });
    focusTarget(ctx, api, 'build-secret', () => {
      const q = OP('secret-mount') * (1 - OP('secret-unmount')),
        x = 1500 - 900 * q,
        y = 550;
      if (mounted) pill(ctx, api, 'FAKE build credential', x, y, 500, themeColors.yellow, 90, 29);
      else
        pill(
          ctx,
          api,
          currentBeat === 0
            ? 'Current scorer: zero credentials'
            : OP('secret-mount') === 0
              ? 'Build secret · waiting'
              : 'Build-secret mount ended',
          1480,
          550,
          590,
          themeColors.muted,
        );
    });
    focusTarget(ctx, api, 'layer-output', () => {
      imageLayer(
        ctx,
        api,
        1180,
        690,
        530,
        output ? 'Reviewed package output' : 'Install output pending',
        output ? themeColors.green : themeColors.muted,
      );
    });
  });
}
export default {
  id: 'secrets',
  draw: drawSecrets,
  cues: [
    'secret-consumer',
    'secret-mount',
    'secret-unmount',
    'secret-output',
    'secret-runtime',
    'secret-compose',
    'secret-permission',
    'secret-read',
  ],
};
