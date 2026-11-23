import { cueProgress } from '../construction.mjs';
import { codeCard, focusTarget, codeText, imageFiles, panel } from '../defaults.mjs';
export function drawRuntime(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat,
    q = (id, beat = 0, start, end) => cueProgress(state, id, beat, start, end);
  {
    focusTarget(ctx, api, 'runtime-image', () => imageFiles(ctx, api, 140, 320));
    focusTarget(ctx, api, 'runtime-process', () =>
      panel(ctx, api, 1070, 320, 700, 390, themeColors.green, () => {
        codeText(
          ctx,
          api,
          q('runtime-start') > 0 ? 'Container C1 · running' : 'Container C1 · ready',
          1100,
          375,
          33,
          themeColors.green,
        );
        codeText(ctx, api, 'python', 1100, 460, 32, themeColors.ink, 'left', 'mono');
        codeText(
          ctx,
          api,
          'scripts/score_access_requests.py',
          1100,
          510,
          28,
          themeColors.ink,
          'left',
          'mono',
        );
        focusTarget(ctx, api, 'process-user', () =>
          codeText(
            ctx,
            api,
            currentBeat > 0 ? 'appuser · UID 10001' : 'Application process',
            1100,
            600,
            29,
            currentBeat > 0 ? themeColors.yellow : themeColors.muted,
          ),
        );
        focusTarget(ctx, api, 'readonly-root', () =>
          codeText(
            ctx,
            api,
            q('runtime-readonly', 1) > 0
              ? 'Root filesystem: read only'
              : '/app/eval · copied fixture',
            1100,
            655,
            29,
            themeColors.cyan,
          ),
        );
      }),
    );
    api.arrow(ctx, 860, 495, 1040, 495, themeColors.cyan, 5);
    codeText(ctx, api, 'docker run', 950, 440, 28, themeColors.cyan, 'center', 'mono');
    if (state.cues?.['runtime-output']?.phase === 'after') {
      api.arrow(ctx, 1415, 731, 1415, 797, themeColors.green, 4);
      codeText(ctx, api, 'Standard output', 1415, 870, 43, themeColors.green, 'center');
      return;
    }
    focusTarget(ctx, api, 'host-kernel', () =>
      codeCard(
        ctx,
        api,
        'Linux kernel · Engine host or Desktop VM',
        460,
        825,
        1000,
        q('runtime-kernel') > 0 ? themeColors.blue : themeColors.muted,
        100,
      ),
    );
    api.arrow(ctx, 1415, 815, 1415, 740, themeColors.blue, 4);
  }
}
export default {
  id: 'runtime',
  draw: drawRuntime,
  cues: ['runtime-start', 'runtime-kernel', 'runtime-user', 'runtime-readonly', 'runtime-output'],
};
