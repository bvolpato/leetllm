import { done, sentence } from '../construction.mjs';
import { chapterHeading, chapterRectangle, chapterText } from '../defaults.mjs';
export function drawSystemShapes(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'system-shapes', bi, si),
      resultComplete = (bi, si) => done(state, 'system-shapes', bi, si);
    {
      chapterHeading(ctx, api, 'The same library carries different operation distributions');
      const modes = [
        ['DP', 'gradient bucket', themeColors.blue],
        ['Sharded', 'RS then gather', themeColors.cyan],
        ['TP', 'small each layer', themeColors.pink],
        ['Pipeline', 'stage peer send', themeColors.yellow],
        ['Expert', 'routed tokens', themeColors.green],
      ];
      modes.forEach(([label, desc, color], i) => {
        const y = 350 + i * 125;
        chapterText(ctx, api, label, 175, y + 40, 30, color);
        const count = i === 2 ? 8 : i === 4 ? 5 : 3,
          size = i === 2 ? 70 : i === 4 ? 95 : 220;
        for (let j = 0; j < count; j++) {
          const ready = currentBeat > 0 || progress(0, Math.min(i, 4)) > j / count;
          chapterRectangle(
            ctx,
            api,
            470 + j * (size + 24),
            y,
            size,
            60,
            themeColors.panel,
            ready ? color : themeColors.muted,
          );
        }
        chapterText(ctx, api, desc, 1500, y + 40, 27, color);
      });
      if (currentBeat === 1)
        chapterText(
          ctx,
          api,
          resultComplete(1, 2)
            ? 'Repeated startup cost and large-payload bandwidth need different experiments'
            : 'Groups, layouts, sharding, and overlap stay with the framework',
          960,
          1015,
          28,
          themeColors.yellow,
          'center',
        );
    }
  });
}
export default {
  id: 'system-shapes',
  draw: drawSystemShapes,
  cues: [
    'nc-system-shapes-b0-s0',
    'nc-system-shapes-b0-s1',
    'nc-system-shapes-b0-s2',
    'nc-system-shapes-b0-s3',
    'nc-system-shapes-b0-s4',
    'nc-system-shapes-b1-s0',
    'nc-system-shapes-b1-s1',
    'nc-system-shapes-b1-s2',
    'nc-system-shapes-b1-s3',
  ],
};
