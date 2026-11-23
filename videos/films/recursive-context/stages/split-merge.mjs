import { pages } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { equation, drawText } from '../defaults.mjs';
export function drawSplitMerge(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const { beat } = state;
  const modelState = sampleModel('split-merge', state);
  if (state.cues) {
    const done = (id, n) => Math.floor(api.focus.progress(id, 0) * n);
    modelState.count =
      done('leaf-work', 8) +
      done('merge-pairs', 4) +
      done('merge-upward', 2) +
      done('root-ready', 1);
  }
  {
    if (beat >= 2) {
      const transfer = api.focus.progress(
        'merge-return-source',
        beat > 2 ? api.phase(state.beatP, 0.05, 0.55) : 0,
      );
      const source = pages[5];
      api.focus.target('source-fields', () => {
        drawText(ctx, api, 'Manual v12', 140, 318, 41, themeColors.blue);
        drawText(ctx, api, 'p5   Audit logging required', 140, 485, 40, themeColors.ink);
        drawText(ctx, api, 'p6   ' + source.value, 140, 643, 46, themeColors.blue);
      });
      api.focus.target('missing-field', () => {
        drawText(ctx, api, 'Merged answer', 1080, 318, 41, themeColors.cyan);
        drawText(
          ctx,
          api,
          modelState.candidate.condition + '  [p5]',
          1080,
          485,
          40,
          themeColors.ink,
        );
        api.line(
          ctx,
          1080,
          666,
          1730,
          666,
          transfer >= 1 ? themeColors.green : themeColors.yellow,
          3,
        );
        drawText(
          ctx,
          api,
          transfer >= 1 ? source.value + '  [p6]' : 'Expiry  ?',
          1080,
          643,
          46,
          transfer >= 1 ? themeColors.green : themeColors.yellow,
        );
      });
      if (transfer > 0 && transfer < 1) {
        const x = api.lerp(520, 1065, transfer);
        api.rect(ctx, x - 116, 729, 232, 62, themeColors.panel, themeColors.blue, 7);
        drawText(ctx, api, source.value, x, 771, 32, themeColors.blue, 'center');
      }
      drawText(
        ctx,
        api,
        '8 pages visited   /   15 requests complete',
        960,
        874,
        34,
        themeColors.muted,
        'center',
      );
      drawText(
        ctx,
        api,
        transfer >= 1
          ? 'Both required fields have a source.'
          : 'Which page supplies the missing field?',
        960,
        965,
        39,
        transfer >= 1 ? themeColors.green : themeColors.ink,
        'center',
      );
      return;
    }
    const levels = [
      { size: 8, start: 0, y: 740, w: 164, target: 'leaf-requests', color: themeColors.blue },
      { size: 4, start: 8, y: 574, w: 186, target: 'pair-merges', color: themeColors.cyan },
      { size: 2, start: 12, y: 419, w: 200, target: 'upper-merges', color: themeColors.yellow },
      { size: 1, start: 14, y: 266, w: 230, target: 'root-merge', color: themeColors.green },
    ];
    const center = (level, index) => 120 + ((index + 0.5) * 1680) / level.size;
    for (let layer = 1; layer < levels.length; layer++) {
      const parent = levels[layer],
        child = levels[layer - 1];
      for (let i = 0; i < parent.size; i++) {
        const x = center(parent, i);
        const color = parent.start + i < modelState.count ? parent.color : themeColors.panel;
        for (const j of [2 * i, 2 * i + 1])
          api.line(ctx, center(child, j), child.y, x, parent.y + 65, color, 4);
      }
    }
    for (const level of levels) {
      for (let i = 0; i < level.size; i++) {
        const completed = level.start + i < modelState.count;
        const label =
          level.size === 8
            ? 'Page ' + (i + 1)
            : level.size === 1
              ? 'Root merge'
              : 'Merge ' + (level.start + i - 7);
        api.focus.target(level.target, () => {
          const x = center(level, i);
          api.rect(
            ctx,
            x - level.w / 2,
            level.y,
            level.w,
            65,
            themeColors.panel,
            completed ? level.color : undefined,
            9,
          );
          drawText(
            ctx,
            api,
            label,
            x,
            level.y + 42,
            27,
            completed ? level.color : themeColors.muted,
            'center',
          );
        });
      }
    }
    api.focus.target('request-count', () =>
      drawText(
        ctx,
        api,
        `${modelState.count} completed requests`,
        960,
        modelState.inspectMerged ? 855 : 875,
        32,
        themeColors.green,
        'center',
      ),
    );
    if (modelState.count === 15) equation(ctx, api, String.raw`8+4+2+1=15`, 960, 965, 38);
    else
      drawText(
        ctx,
        api,
        'A merge becomes available after both children complete.',
        960,
        965,
        28,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'split-merge',
  draw: drawSplitMerge,
  cues: [
    'leaf-work',
    'completed-count',
    'merge-pairs',
    'merge-upward',
    'root-ready',
    'lossy-answer',
    'merge-return-source',
  ],
};
