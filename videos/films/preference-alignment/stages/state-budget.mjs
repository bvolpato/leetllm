import { prefBound } from '../arithmetic.mjs';
import { alignmentBudget } from '../model.mjs';
import { caption, cell, constructionText, focusTarget, heading, rectangle } from '../defaults.mjs';
export function drawStateBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue state-budget/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'One trainable parameter · explicit byte worksheet');
      const widths = [2, 2, 4, 4, 4],
        labels = ['weight', 'gradient', 'moment m', 'moment v', 'master'],
        colors = [
          themeColors.blue,
          themeColors.cyan,
          themeColors.yellow,
          themeColors.yellow,
          themeColors.pink,
        ],
        cues = [
          'pa-state-weight',
          'pa-state-gradient',
          'pa-state-moments',
          'pa-state-moments',
          'pa-state-master',
        ];
      let x = 190;
      for (let i = 0; i < 5; i++) {
        const w = widths[i] * 85,
          q = cueProgress(cues[i], 0);
        rectangle(ctx, api, x, 460, w, 150, themeColors.panel, themeColors.muted);
        if (q > 0) rectangle(ctx, api, x, 460, w * q, 150, colors[i], colors[i]);
        if (q === 1) {
          constructionText(ctx, api, labels[i], x + w / 2, 415, 26, colors[i], 'center');
          constructionText(ctx, api, widths[i] + ' B', x + w / 2, 690, 32, colors[i], 'center');
        }
        x += w + 20;
      }
      constructionText(
        ctx,
        api,
        resultComplete('pa-state-bytes', 0)
          ? '2 + 2 + 4 + 4 + 4 = 16 B'
          : 'Build the actual inventory before multiplying by parameters',
        190,
        820,
        36,
        themeColors.cyan,
      );
      if (resultComplete('pa-state-frozen', 0))
        cell(ctx, api, 'Frozen: 2 B of weights', 190, 880, 650, 76, themeColors.blue, 32);
      caption(
        ctx,
        api,
        'This setup uses 16-bit weights and gradients with 32-bit optimizer state.',
      );
      return;
    }
    if (currentBeat < 3) {
      const removal = currentBeat === 2 ? cueProgress('pa-state-remove', 2) : 0,
        budget = alignmentBudget(),
        total = budget.total - budget.roles[1].gb * removal;
      heading(ctx, api, '70 billion parameters per role · decimal GB of retained state');
      for (let i = 0; i < 4; i++) {
        const r = budget.roles[i],
          y = 420 + i * 135,
          gb = r.gb * (i === 1 ? 1 - removal : 1),
          color = r.trainable ? themeColors.cyan : themeColors.blue;
        constructionText(
          ctx,
          api,
          (i === 1 && removal > 0 ? 'critic state remaining' : r.id) +
            (r.trainable ? ' · trainable' : ' · frozen'),
          170,
          y + 40,
          30,
          i === 1 && removal === 1 ? themeColors.muted : color,
        );
        rectangle(ctx, api, 650, y, gb * 0.72, 64, color, color);
        constructionText(ctx, api, gb.toFixed(0) + ' GB', 1530, y + 45, 32, color);
      }
      focusTarget(ctx, api, 'pa-state-total-value', () =>
        constructionText(
          ctx,
          api,
          currentBeat === 1 && !resultComplete('pa-state-total', 1)
            ? 'Aggregate: ?'
            : (currentBeat === 2 ? 'Remaining inventory: ' : 'Aggregate: ') +
                total.toFixed(0) +
                ' GB',
          960,
          955,
          39,
          themeColors.yellow,
          'center',
        ),
      );
      if (removal === 1)
        constructionText(
          ctx,
          api,
          '44.4% of this inventory removed',
          960,
          335,
          30,
          themeColors.green,
          'center',
        );
      caption(
        ctx,
        api,
        'Before activations, generation caches, temporary storage, replication and communication.',
      );
      return;
    }
    heading(ctx, api, 'Generation and training compete for real execution resources');
    const overlap = cueProgress('pa-state-overlap', 3),
      events = [
        ['prefill', themeColors.blue],
        ['decode', themeColors.cyan],
        ['score', themeColors.yellow],
        ['train', themeColors.green],
      ];
    constructionText(ctx, api, 'colocated', 170, 450, 30, themeColors.blue);
    constructionText(ctx, api, 'asynchronous', 170, 735, 30, themeColors.yellow);
    events.forEach(([label, color], i) => {
      cell(ctx, api, label, 470 + i * 310, 410, 270, 90, color, 30);
      cell(ctx, api, label, 470 + i * 270, 650 + (i === 3 ? -75 : 0) * overlap, 230, 90, color, 29);
    });
    if (overlap === 1) {
      api.arrow(ctx, 1350, 835, 1020, 835, themeColors.pink, 4);
      constructionText(
        ctx,
        api,
        'synchronize weights / record policy lag',
        1200,
        920,
        29,
        themeColors.pink,
        'center',
      );
    }
    caption(ctx, api, 'During overlap, a rollout can finish with older actor weights.');
    return;
  };
  focusTarget(ctx, api, 'state-budget-construction', construction);
}
export default {
  id: 'state-budget',
  draw: drawStateBudget,
  cues: [
    'state-budget-b0',
    'pa-state-bytes',
    'pa-state-weight',
    'pa-state-gradient',
    'pa-state-moments',
    'pa-state-master',
    'pa-state-frozen',
    'state-budget-b1',
    'pa-state-total',
    'state-budget-b2',
    'pa-state-remove',
    'state-budget-b3',
    'pa-state-overlap',
  ],
};
