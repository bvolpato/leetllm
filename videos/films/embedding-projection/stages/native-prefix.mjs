import {
  chapterBox,
  chapterCueVisible,
  chapterFooter,
  chapterLine,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawNativePrefix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'One embedding · several weighted prefix losses',
        960,
        285,
        35,
        themeColors.ink,
      );
      const counts = [64, 128, 256, 1024];
      counts.forEach((n, i) => {
        const y = 390 + i * 135;
        chapterRectangle(
          ctx,
          api,
          250,
          y,
          (1250 * n) / 1024,
          65,
          [themeColors.yellow, themeColors.cyan, themeColors.blue, themeColors.green][i],
        );
        chapterText(
          ctx,
          api,
          n + ' prefix → loss ' + (i + 1),
          1550,
          y + 45,
          28,
          [themeColors.yellow, themeColors.cyan, themeColors.blue, themeColors.green][i],
        );
        if (chapterCueVisible(ctx, api, 'prefix-gradient'))
          chapterLine(
            ctx,
            api,
            250,
            y + 80,
            250 + (1250 * 64) / 1024,
            y + 80,
            themeColors.yellow,
            5,
          );
      });
      chapterText(
        ctx,
        api,
        'First 64 coordinates participate in all four losses',
        960,
        980,
        33,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      chapterBox(ctx, api, 'MRL: separate prefix heads', 220, 350, 650, 140, themeColors.cyan);
      chapterBox(
        ctx,
        api,
        'MRL-E: shared classifier weights',
        1050,
        350,
        650,
        140,
        themeColors.yellow,
      );
      if (chapterCueVisible(ctx, api, 'prefix-negative')) {
        chapterText(ctx, api, 'Untrained prefix negative control', 960, 625, 35, themeColors.ink);
        [0.185, 0.407, 1].forEach((v, i) => {
          const x = 480 + i * 500;
          chapterRectangle(
            ctx,
            api,
            x - 100,
            880 - v * 180,
            200,
            v * 180,
            themeColors.blue,
            themeColors.blue,
          );
          chapterText(
            ctx,
            api,
            [2, 4, 8][i] + ' dims: ' + v.toFixed(3),
            x,
            950,
            30,
            themeColors.cyan,
          );
        });
      }
    } else {
      chapterText(
        ctx,
        api,
        '27 query-neighbor pairs · shortlist creates a ceiling',
        960,
        285,
        35,
        themeColors.ink,
      );
      const retained = chapterCueVisible(ctx, api, 'prefix-miss') ? 5 : 27;
      for (let i = 0; i < 27; i++) {
        const x = 310 + (i % 9) * 170,
          y = 390 + Math.floor(i / 9) * 130;
        api.circle(
          ctx,
          x,
          y,
          22,
          i < retained ? themeColors.green : themeColors.panel,
          i < retained ? themeColors.green : themeColors.pink,
          3,
        );
        chapterText(
          ctx,
          api,
          String(i + 1),
          x,
          y + 10,
          24,
          i < retained ? themeColors.bg : themeColors.muted,
        );
      }
      chapterBox(
        ctx,
        api,
        'Prefix shortlist → fetch full vectors → rescore',
        230,
        820,
        1460,
        110,
        themeColors.cyan,
      );
      if (chapterCueVisible(ctx, api, 'prefix-miss'))
        chapterText(
          ctx,
          api,
          'Only 5 / 27 retained pairs can be recovered',
          960,
          965,
          34,
          themeColors.pink,
        );
    }
    chapterFooter(
      ctx,
      api,
      'Supported trained prefixes still need the same normalization and a current task evaluation',
    );
  }
  return;
}
export default {
  id: 'native-prefix',
  draw: drawNativePrefix,
  cues: [
    'prefix-losses',
    'prefix-gradient',
    'prefix-no-guarantee',
    'prefix-heads',
    'prefix-negative',
    'prefix-shortlist',
    'prefix-miss',
    'prefix-supported',
  ],
};
