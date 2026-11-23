import { arrow, line, panel } from '../defaults.mjs';
export function drawAliasGeneration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const cueProgress = (n) => api.focus.progress('alias-generation-' + n, 0),
    cueStarted = (n) => cueProgress(n) > 0,
    resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    if (currentBeat === 0) {
      paper(
        'Controller A reads',
        ['production v0', 'generation 41', 'prepare commit + audit'],
        130,
        350,
        740,
        themeColors.blue,
      );
      paper(
        'Controller B interleaves',
        ['changes selected release', 'increments generation', 'A old check is stale'],
        1050,
        350,
        740,
        themeColors.pink,
      );
      arrow(ctx, api, 910, 500, 1020, 500, themeColors.yellow);
      drawText(
        'Atomic expected-generation update + audit event',
        960,
        870,
        39,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const steps = [
          ['v0', 'generation 41'],
          ['v2', 'generation 42'],
          ['v0', 'generation 43'],
        ],
        count = cueStarted('returned') ? 3 : cueStarted('away') ? 2 : 1;
      steps.forEach(([r, g], i) => {
        const x = 170 + i * 590;
        panel(ctx, api, x, 400, 510, 260, i < count ? themeColors.blue : themeColors.muted);
        drawText(
          i < count ? r : '?',
          x + 255,
          485,
          50,
          i < count ? themeColors.blue : themeColors.muted,
          'center',
        );
        drawText(i < count ? g : 'pending', x + 255, 580, 32, themeColors.muted, 'center');
        if (i < 2)
          arrow(ctx, api, x + 525, 525, x + 565, 525, themeColors.yellow, i < count - 1 ? 1 : 0);
      });
      drawText(
        resultComplete('aba-stale-comparison')
          ? 'Label v0 matches again; generation 41 ≠ 43'
          : 'Keep generation identity through pointer history',
        960,
        850,
        38,
        resultComplete('aba-stale-comparison') ? themeColors.pink : themeColors.yellow,
        'center',
      );
    } else {
      paper(
        'Control plane',
        ['Registry production → v1', 'Expected generation / audit', 'No serving observation yet'],
        130,
        350,
        740,
        themeColors.yellow,
      );
      paper(
        'Real data-plane checks',
        [
          'Workers loaded compatible v1?',
          'Ready and routed requests?',
          'External warnings already delivered?',
        ],
        1050,
        350,
        740,
        themeColors.blue,
      );
      drawText(
        'Recovery duration includes reload, readiness and routing',
        960,
        890,
        36,
        themeColors.ink,
        'center',
      );
    }
    footer(
      'The Python lab is sequential; this drawing explains the additional distributed contract',
    );
  }
  return;
}
export default {
  id: 'alias-generation',
  draw: drawAliasGeneration,
  cues: [
    'alias-generation-b1',
    'alias-generation-b2',
    'alias-generation-away',
    'alias-generation-returned',
    'pipe-result-aba-stale-comparison',
    'alias-generation-b3',
  ],
};
