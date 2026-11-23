import {
  drawExtensionArrow,
  drawExtensionBox,
  drawExtensionLine,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawFilterScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id),
    resultComplete = (id) => progress(id) === 1;
  api.focus.target('filter-scope-construction', () => {
    const rows = [
      {
        id: 'v1_A',
        version: 1,
        score: 0.99,
      },
      {
        id: 'v1_B',
        version: 1,
        score: 0.98,
      },
      {
        id: 'v2_A',
        version: 2,
        score: 0.97,
      },
      {
        id: 'v2_B',
        version: 2,
        score: 0.96,
      },
    ];
    drawExtensionText(
      ctx,
      api,
      'Same similarity order · eligible version = 2 · K=2',
      150,
      280,
      33,
      themeColors.cyan,
    );
    rows.forEach((r, i) => {
      const y = 380 + i * 135,
        color = r.version === 2 ? themeColors.green : themeColors.blue;
      drawExtensionBox(ctx, api, r.id, 170, y, 330, 80, color, 30);
      drawExtensionText(ctx, api, r.score.toFixed(2), 590, y + 48, 30, color);
      drawExtensionText(ctx, api, 'version ' + r.version, 800, y + 48, 29, color);
    });
    if (currentBeat === 0) {
      if (cueVisible('filter-shortlist')) {
        const t = progress('filter-shortlist');
        rows.slice(0, 2).forEach((r, i) => {
          drawExtensionArrow(
            ctx,
            api,
            970,
            420 + i * 135,
            1150,
            420 + i * 135,
            themeColors.blue,
            t,
          );
          if (t === 1)
            drawExtensionBox(
              ctx,
              api,
              r.id + ' → excluded',
              1180,
              380 + i * 135,
              560,
              80,
              themeColors.pink,
              29,
            );
        });
        if (resultComplete('filter-shortlist'))
          drawExtensionText(
            ctx,
            api,
            cueVisible('filter-first')
              ? 'Before: post-filter result empty'
              : 'Post-filter result: empty',
            1460,
            cueVisible('filter-first') ? 635 : 765,
            27,
            themeColors.pink,
            'center',
          );
      }
      if (cueVisible('filter-first')) {
        rows.slice(2).forEach((r, i) => {
          drawExtensionArrow(
            ctx,
            api,
            970,
            690 + i * 135,
            1150,
            690 + i * 135,
            themeColors.green,
            progress('filter-first'),
          );
          if (resultComplete('filter-first'))
            drawExtensionBox(ctx, api, r.id, 1180, 650 + i * 135, 560, 80, themeColors.green, 31);
        });
        if (resultComplete('filter-first'))
          drawExtensionNote(
            ctx,
            api,
            'The version-two pages fill both slots with their original scores.',
          );
      }
    } else if (currentBeat === 1) {
      const depth = resultComplete('filter-four') ? 4 : resultComplete('filter-overfetch') ? 3 : 2;
      const kept = rows.slice(0, depth).filter((r) => r.version === 2);
      const cutY = 352 + 135 * depth;
      drawExtensionLine(ctx, api, 160, cutY, 965, cutY, themeColors.yellow, 5);
      drawExtensionText(ctx, api, 'Read ' + depth + ' rows', 1150, 425, 45, themeColors.ink);
      drawExtensionText(
        ctx,
        api,
        kept.length + ' of 2 slots filled',
        1150,
        507,
        47,
        themeColors.yellow,
      );
      kept.forEach((r, i) =>
        drawExtensionBox(ctx, api, r.id, 1150, 578 + i * 114, 460, 80, themeColors.green, 36),
      );
      if (cueVisible('filter-authority'))
        drawExtensionNote(ctx, api, 'Check the reader’s permission before releasing a passage.');
    } else {
      drawExtensionBox(
        ctx,
        api,
        'exact eligible universe',
        1150,
        390,
        610,
        95,
        themeColors.green,
        30,
      );
      drawExtensionBox(ctx, api, 'ANN eligible universe', 1150, 580, 610, 95, themeColors.cyan, 30);
      if (cueVisible('matched-universe')) {
        drawExtensionLine(ctx, api, 1455, 495, 1455, 565, themeColors.yellow, 3);
        drawExtensionText(
          ctx,
          api,
          'same vectors / metric / ties',
          1455,
          760,
          27,
          themeColors.yellow,
          'center',
        );
      }
      if (cueVisible('few-eligible'))
        drawExtensionNote(
          ctx,
          api,
          'Choose how to score a query with fewer than K eligible passages.',
        );
    }
  });
  return true;
}
export default {
  id: 'filter-scope',
  draw: drawFilterScope,
  cues: [
    'filter-shortlist',
    'filter-first',
    'filter-overfetch',
    'filter-four',
    'filter-authority',
    'matched-universe',
    'few-eligible',
  ],
};
