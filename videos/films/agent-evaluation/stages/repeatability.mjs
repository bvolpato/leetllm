import { TRIALS } from '../fixtures.mjs';
import { report } from '../model.mjs';
import { originalCard, originalFootnote, originalText } from '../defaults.mjs';
export function drawRepeatability(ctx, scene, state, api) {
  const { C: themeColors, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88),
    r = report(),
    resultComplete = (id) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : api.focus.progress(id, 0) === 1;
  {
    const seen =
        beat > 0
          ? 9
          : api.focus.visible('other-trials')
            ? 9
            : api.focus.visible('catalog-trials')
              ? 3
              : Math.floor(api.focus.progress('catalog-trials', 0) * 3),
      group = beat > 1 || (beat === 1 && api.focus.visible('group-checks'));
    api.focus.target('trial-results', () =>
      api.rect(ctx, 655, 330, 600, 505, themeColors.bg, themeColors.line, 12),
    );
    ['Trial 1', 'Trial 2', 'Trial 3'].forEach((label, i) =>
      originalText(ctx, api, label, 750 + i * 190, 300, 30, themeColors.muted, 'center'),
    );
    TRIALS.forEach((task, row) => {
      const y = 380 + row * 150;
      originalText(ctx, api, task.task, 220, y + 60, 32, themeColors.ink);
      task.pass.forEach((pass, j) => {
        if (row * 3 + j >= seen) return;
        api.focus.target('trial-results', () =>
          api.focus.target('trial-row-' + task.task.toLowerCase().replace(/\s+/g, '-'), () =>
            originalCard(
              ctx,
              api,
              pass ? '✓' : '×',
              690 + j * 190,
              y,
              120,
              pass ? themeColors.green : themeColors.pink,
              95,
            ),
          ),
        );
      });
      if (group) {
        const all = task.pass.every(Boolean);
        api.line(ctx, 675, y + 110, 1210, y + 110, all ? themeColors.green : themeColors.pink, 4);
        originalCard(
          ctx,
          api,
          all ? 'ALL 3' : 'Not all 3',
          1350,
          y,
          340,
          all ? themeColors.green : themeColors.muted,
          95,
        );
      }
    });
    if (beat === 0 && resultComplete('run-rate'))
      api.focus.target('trial-summary', () =>
        originalText(
          ctx,
          api,
          '7 / 9 individual runs pass',
          960,
          905,
          40,
          themeColors.green,
          'center',
        ),
      );
    if (beat > 1 || (beat === 1 && resultComplete('group-fraction')))
      api.focus.target('trial-summary', () =>
        originalText(
          ctx,
          api,
          '1 / 3 task tokens marked ALL 3',
          960,
          905,
          37,
          themeColors.yellow,
          'center',
        ),
      );
    originalFootnote(
      ctx,
      api,
      'Same nine fixed outcomes · group by task before computing repeated reliability',
    );
  }
}
export default {
  id: 'repeatability',
  draw: drawRepeatability,
  cues: [
    'repeated-runs',
    'catalog-trials',
    'other-trials',
    'run-rate',
    'all-repetitions',
    'group-checks',
    'group-fraction',
    'task-grouping',
  ],
};
