import { done } from '../construction.mjs';
import {
  chapterCard,
  chapterHeading,
  chapterLine,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawPlatformScope(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      resultComplete = (bi, si) => done(state, 'platform-scope', bi, si);
    const rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      chapterHeading(
        ctx,
        api,
        currentBeat === 0
          ? 'Experimental MIG support keeps separate device identities'
          : 'TLS scope follows the transport it actually covers',
      );
      if (currentBeat === 0) {
        for (let i = 0; i < 2; i++) {
          chapterRectangle(
            ctx,
            api,
            250 + i * 850,
            390,
            650,
            260,
            themeColors.panel,
            rankColors[i],
          );
          chapterText(
            ctx,
            api,
            'MIG instance ' + i,
            575 + i * 850,
            460,
            34,
            rankColors[i],
            'center',
          );
          chapterCard(
            ctx,
            api,
            'CUDA device for rank ' + i,
            310 + i * 850,
            520,
            530,
            90,
            rankColors[i],
          );
        }
        chapterText(
          ctx,
          api,
          resultComplete(0, 2)
            ? 'NVLink P2P / NVLS unavailable · MNNVL disabled'
            : 'CUDA 13+ driver · experimental versioned support',
          960,
          820,
          32,
          themeColors.yellow,
          'center',
        );
      } else {
        chapterRectangle(ctx, api, 190, 375, 760, 390, themeColors.panel, themeColors.green);
        chapterText(ctx, api, 'NCCL-owned sockets', 570, 440, 33, themeColors.green, 'center');
        chapterCard(
          ctx,
          api,
          resultComplete(1, 1) ? 'TLS enabled via the NCCL API' : 'Optional socket TLS',
          275,
          550,
          590,
          100,
          themeColors.green,
        );
        chapterCard(ctx, api, 'External plugin traffic', 1110, 480, 650, 110, themeColors.blue);
        chapterText(
          ctx,
          api,
          resultComplete(1, 2)
            ? 'Separate encryption configuration required'
            : 'Transport selected by the job',
          1435,
          700,
          29,
          themeColors.yellow,
          'center',
        );
        chapterLine(ctx, api, 950, 630, 1060, 630, themeColors.muted, 3);
      }
      chapterNote(
        ctx,
        api,
        currentBeat === 0
          ? 'Experimental MIG support from NCCL 2.31'
          : 'NCCL 2.32.3   ·   OpenSSL 3',
      );
    }
  });
}
export default {
  id: 'platform-scope',
  draw: drawPlatformScope,
  cues: [
    'nc-platform-scope-b0-s0',
    'nc-platform-scope-b0-s1',
    'nc-platform-scope-b0-s2',
    'nc-platform-scope-b0-s3',
    'nc-platform-scope-b1-s0',
    'nc-platform-scope-b1-s1',
    'nc-platform-scope-b1-s2',
  ],
};
