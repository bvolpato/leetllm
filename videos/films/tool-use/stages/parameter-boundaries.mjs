import { cueProgress } from '../arithmetic.mjs';
import {
  box,
  chapterCode,
  chapterLine,
  chapterText,
  footer,
  heading,
  rectangle,
} from '../defaults.mjs';
export function drawParameterBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-parameter-boundaries-mechanism', () => {
    heading(ctx, api, 'Values cross execution boundaries in data positions');
    if (currentBeat === 0) {
      chapterCode(
        ctx,
        api,
        'SELECT status FROM releases WHERE id = %s',
        150,
        420,
        31,
        themeColors.blue,
      );
      box(
        ctx,
        api,
        'Separate parameter tuple',
        ["('reranker-v17',)", 'value is not SQL source'],
        150,
        600,
        720,
        themeColors.cyan,
        150,
      );
      const q = cueProgress2('sql-bound-value', 0);
      rectangle(ctx, api, 1050, 395, 650, 130, themeColors.panel, themeColors.yellow, 2);
      if (q > 0) chapterCode(ctx, api, 'id = bound parameter', 1070, 465, 29, themeColors.green);
      chapterText(ctx, api, 'One fixed query; one bound value', 1050, 740, 33, themeColors.green);
    } else if (currentBeat === 1) {
      box(
        ctx,
        api,
        'Fixed executable',
        ['argv: [approved-program, allowed-flag, value]', 'shell: false'],
        150,
        390,
        1580,
        themeColors.blue,
        145,
      );
      const q = resultComplete('url-redirect', 1);
      box(
        ctx,
        api,
        'Allowed first URL',
        'https://approved.example/path',
        150,
        685,
        720,
        themeColors.green,
        115,
      );
      box(
        ctx,
        api,
        'Redirect destination',
        q ? 'internal metadata endpoint → blocked' : 'validate this resolved hop too',
        1050,
        685,
        680,
        q ? themeColors.pink : themeColors.yellow,
        115,
      );
      chapterLine(ctx, api, 900, 742, 1010, 742, themeColors.yellow, 3);
      if (q) chapterLine(ctx, api, 1015, 690, 1015, 800, themeColors.pink, 4);
    } else {
      box(ctx, api, 'Reviewed root', '/work/export', 150, 410, 720, themeColors.blue, 115);
      box(
        ctx,
        api,
        'User path',
        '/work/export/link/report',
        1050,
        410,
        680,
        themeColors.yellow,
        115,
      );
      chapterLine(ctx, api, 900, 465, 1025, 465, themeColors.yellow, 3);
      if (resultComplete('path-resolved', 2)) {
        box(
          ctx,
          api,
          'Resolved symlink target',
          '/outside/report → reject',
          1050,
          680,
          680,
          themeColors.pink,
          120,
        );
        chapterLine(ctx, api, 1390, 545, 1390, 650, themeColors.pink, 3);
      }
      chapterText(
        ctx,
        api,
        'Payload, concurrency and scoped credentials remain bounded',
        150,
        965,
        29,
        themeColors.cyan,
      );
    }
    footer(
      ctx,
      api,
      'Execution-boundary illustrations. No shell, SQL service, network or file operation runs here.',
    );
  });
}
export default {
  id: 'parameter-boundaries',
  draw: drawParameterBoundaries,
  cues: [
    'tu-parameter-boundaries-1',
    'tu-sql-bound-value',
    'tu-parameter-boundaries-2',
    'tu-argv-shell-false',
    'tu-url-redirect',
    'tu-parameter-boundaries-3',
    'tu-path-resolved',
  ],
};
