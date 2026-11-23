import { clause } from '../construction.mjs';
import { drawCoreCell, drawCoreLine, drawCoreNote, drawCoreText } from '../defaults.mjs';
export function drawRunStorage(ctx, scene, state, api) {
  api.focus.target('tr-run-storage-trace', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat,
      op = (beat, n) => clause(state, 'run-storage', beat, n, api),
      done = (beat, n) => op(beat, n) >= 1;
    {
      if (currentBeat === 0) {
        drawCoreText(
          ctx,
          api,
          'Tracker-owned run inside a temporary artifact root',
          150,
          285,
          32,
          themeColors.cyan,
        );
        drawCoreCell(ctx, api, '/tmp/tracker/run-3', 150, 390, 900, 90, themeColors.blue);
        const names = ['report.json', 'simulation-manifest.json'];
        names.forEach((v, i) => {
          drawCoreCell(ctx, api, v, 250, 570 + i * 145, 800, 85, themeColors.cyan);
          drawCoreLine(ctx, api, 170, 485, 170, 610 + i * 145, themeColors.blue);
          drawCoreLine(ctx, api, 170, 610 + i * 145, 230, 610 + i * 145, themeColors.blue);
        });
        if (done(0, 2)) {
          drawCoreCell(ctx, api, 'same artifact path again', 1200, 570, 540, 85, themeColors.pink);
          drawCoreText(
            ctx,
            api,
            'exclusive create → reject overwrite',
            1200,
            760,
            28,
            themeColors.pink,
          );
        }
        drawCoreNote(
          ctx,
          api,
          'Actual local files are retained only for this temporary-directory lifetime',
        );
      } else {
        drawCoreText(
          ctx,
          api,
          'Temporary artifacts versus approved persistent storage',
          150,
          285,
          32,
          themeColors.cyan,
        );
        drawCoreCell(
          ctx,
          api,
          'Temporary root released',
          150,
          410,
          690,
          110,
          done(1, 0) ? themeColors.muted : themeColors.blue,
        );
        drawCoreCell(ctx, api, 'Database + artifact store', 1000, 410, 740, 110, themeColors.blue);
        if (done(1, 1)) {
          drawCoreText(
            ctx,
            api,
            'Persistent retention + access policy',
            1000,
            650,
            32,
            themeColors.green,
          );
          drawCoreText(
            ctx,
            api,
            'Finite real metrics · Boolean values rejected',
            150,
            800,
            32,
            themeColors.yellow,
          );
        }
        drawCoreNote(
          ctx,
          api,
          'A descriptive tag cannot restore missing bytes or redact their actual payload',
        );
      }
    }
  });
}
export default {
  id: 'run-storage',
  draw: drawRunStorage,
  cues: [
    'tr-run-storage-0-0',
    'tr-run-storage-0-1',
    'tr-run-storage-0-2',
    'tr-run-storage-0-3',
    'tr-run-storage-1-0',
    'tr-run-storage-1-1',
    'tr-run-storage-1-2',
    'tr-run-storage-1-3',
    'tr-run-storage-1-4',
  ],
};
