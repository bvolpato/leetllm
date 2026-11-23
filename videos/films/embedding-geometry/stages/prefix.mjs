import { PREFIX_DOCS } from '../fixtures.mjs';
import { prefixResults } from '../model.mjs';
import { geometryText, heading, line } from '../defaults.mjs';
export function drawPrefix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'MRL trains several nested widths; PCA projects a frozen representation');
      const q = cueProgress();
      for (let row = 0; row < 3; row++) {
        const n = 2 ** (row + 1),
          y = 420 + row * 180;
        geometryText(ctx, api, 'prefix ' + n, 220, y + 40, 31, themeColors.blue);
        for (let j = 0; j < 8; j++)
          api.rect(
            ctx,
            480 + j * 100,
            y,
            80,
            65,
            j < n ? themeColors.blue : themeColors.panel,
            themeColors.muted,
            2,
          );
        if (q > (row + 1) / 4)
          geometryText(
            ctx,
            api,
            'λ' + row + ' × loss' + row,
            1560,
            y + 40,
            32,
            themeColors.yellow,
            'center',
          );
      }
      geometryText(
        ctx,
        api,
        'Shared encoder receives the sum of selected prefix losses',
        960,
        1020,
        32,
        themeColors.green,
        'center',
      );
      return;
    }
    heading(ctx, api, 'Same authorized audit / rotation / lifecycle rows · first-row tie rule');
    const shrink = currentBeat === 2 ? cue('prefix-cut') : 0,
      w = shrink > 0.5 ? 2 : 4,
      r = prefixResults(w),
      ys = [390, 500, 610, 760, 870];
    ['Audit', 'Rotation', 'Lifecycle', 'Query rotation', 'Query lifecycle'].forEach((name, i) => {
      geometryText(
        ctx,
        api,
        name,
        220,
        ys[i] + 38,
        28,
        i < 3 ? themeColors.blue : themeColors.cyan,
      );
      const v = i < 3 ? PREFIX_DOCS[i] : PREFIX_DOCS[i - 2];
      v.forEach((v, j) => {
        const x = 620 + j * 190;
        api.rect(
          ctx,
          x,
          ys[i],
          150,
          65,
          j >= 2 && shrink > 0.5 ? themeColors.panel : themeColors.bg,
          j >= 2 && shrink > 0.5 ? themeColors.muted : themeColors.blue,
          3,
        );
        geometryText(
          ctx,
          api,
          j >= 2 && shrink > 0.5 ? 'cut' : v,
          x + 75,
          ys[i] + 42,
          30,
          j >= 2 && shrink > 0.5 ? themeColors.muted : themeColors.blue,
          'center',
        );
      });
    });
    geometryText(ctx, api, 'd0', 695, 335, 24, themeColors.muted, 'center');
    geometryText(ctx, api, 'd1', 885, 335, 24, themeColors.muted, 'center');
    geometryText(ctx, api, 'd2', 1075, 335, 24, themeColors.muted, 'center');
    geometryText(ctx, api, 'd3', 1265, 335, 24, themeColors.muted, 'center');
    api.focus.target('prefix-matrix', () => {
      line(ctx, api, 1390, 360, 1390, 955, themeColors.yellow, 3);
      r.winners.forEach((v, i) =>
        geometryText(
          ctx,
          api,
          currentBeat === 2 && cue('prefix-result') < 0.65
            ? 'winner ?'
            : ['Audit', 'Rotation', 'Lifecycle'][v],
          1590,
          ys[i + 3] + 40,
          31,
          v === i + 1 ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
    });
    api.focus.target('prefix-score', () =>
      geometryText(
        ctx,
        api,
        currentBeat === 2 && cue('prefix-result') < 0.65
          ? 'Two queries · required guides held fixed'
          : 'Recall@1 = ' + r.recall * 2 + ' / 2 = ' + 100 * r.recall + '%',
        960,
        1035,
        36,
        themeColors.yellow,
        'center',
      ),
    );
    return;
  }
  return;
}
export default {
  id: 'prefix',
  draw: drawPrefix,
  cues: ['prefix-cut', 'prefix-result'],
};
