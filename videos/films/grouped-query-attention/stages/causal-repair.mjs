import { chapterModel } from '../construction.mjs';
import { chapterText, grid, note, operation } from '../defaults.mjs';
export function drawCausalRepair(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('causal-repair', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat < 2) {
      const reveal = state.cues
          ? api.focus.progress('latest-query-mean', 0) > 0.7
          : progress > 0.85,
        visibility = state.cues ? api.focus.progress('latest-query-visible', 0) : progress,
        n = currentBeat === 0 ? 1 : 1 + Math.floor(2 * visibility),
        all = currentBeat === 1 && reveal;
      chapterText(
        ctx,
        api,
        'One latest query at absolute position 2',
        960,
        275,
        38,
        themeColors.cyan,
      );
      [1, 2, 9].forEach((v, i) => {
        const x = 480 + i * 350,
          selected = i < n;
        api.rect(
          ctx,
          x,
          410,
          270,
          160,
          themeColors.panel,
          selected ? themeColors.green : themeColors.muted,
          4,
        );
        chapterText(ctx, api, 'key ' + i, x + 135, 375, 29, themeColors.muted);
        chapterText(
          ctx,
          api,
          v,
          x + 135,
          510,
          59,
          selected ? themeColors.green : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          selected ? (n === 3 ? '⅓' : n === 2 ? '½' : '1') : '0',
          x + 135,
          660,
          42,
          selected ? themeColors.yellow : themeColors.muted,
        );
      });
      operation(ctx, api, 'causal-repair', () =>
        chapterText(
          ctx,
          api,
          currentBeat === 0
            ? 'Upper-left one-row causal mask → output 1'
            : all
              ? 'Actual position exposes all three → output 4'
              : 'Predict the repaired weighted mean',
          960,
          835,
          42,
          currentBeat === 0 ? themeColors.red : themeColors.green,
        ),
      );
      note(ctx, api, 'No-mask shortcut requires one latest query, with no padding or future keys');
    } else {
      chapterText(
        ctx,
        api,
        'A two-query chunk needs two different boundaries',
        960,
        275,
        37,
        themeColors.cyan,
      );
      grid(
        ctx,
        api,
        490,
        410,
        2,
        5,
        135,
        (r, c) => (c <= r + 3 ? themeColors.green : themeColors.panel),
        (r, c) => String([1, 2, 9, 4, 20][c]),
      );
      chapterText(ctx, api, 'query 3', 330, 495, 32, themeColors.blue);
      chapterText(ctx, api, 'query 4', 330, 630, 32, themeColors.blue);
      api.rect(ctx, 490 + 4 * 135, 410, 130, 130, 'transparent', themeColors.red, 4);
      operation(ctx, api, 'causal-repair', () =>
        chapterText(ctx, api, 'Q3 sees 0…3; Q4 sees 0…4', 960, 810, 43, themeColors.yellow),
      );
      note(ctx, api, 'Toy zero-score values · unmasking Q3 would leak its future key 4');
    }
  }
}
export default {
  id: 'causal-repair',
  draw: drawCausalRepair,
  cues: [
    'causal-repair-0',
    'causal-repair-1',
    'latest-query-mean',
    'latest-query-visible',
    'causal-repair-2',
  ],
};
