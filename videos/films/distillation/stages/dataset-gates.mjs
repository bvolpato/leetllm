import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { policySelection } from '../model.mjs';

export function drawDatasetGates(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat < 2) {
    const rows = policySelection();
    api.focus.target('policy-ledger', () => {
      const xs = [120, 720, 1090, 1500];
      ['Request', 'Teacher reply', 'Trusted rule', 'Keep?'].forEach((s, i) =>
        text(ctx, api, s, xs[i], 320, 35, C.muted),
      );
      rows.forEach((row, i) => {
        const y = 465 + i * 161;
        const ready = ['dataset-keep', 'dataset-skip', 'dataset-reject'][i];
        const revealed =
          spokenProgress(state, api, ready, 0, [0.74, 0.8, 0.92][i], [0.8, 0.86, 0.99][i]) === 1;
        text(ctx, api, row.raw.trim(), xs[0], y, 36);
        if (i === 1 && revealed)
          text(ctx, api, '= first normalized request', xs[0], y + 52, 28, C.muted);
        text(
          ctx,
          api,
          row.reply ?? (revealed ? 'Skipped call' : '· · ·'),
          xs[1],
          y,
          38,
          row.reply ? C.blue : C.muted,
        );
        text(ctx, api, row.rule ?? '· · ·', xs[2], y, 38, row.rule ? C.ink : C.muted);
        const color =
          row.outcome === 'reject' ? C.pink : row.outcome === 'keep' ? C.green : C.muted;
        const decision = row.outcome === 'reject' ? 'reject teacher error' : row.outcome;
        text(ctx, api, revealed ? decision : '?', xs[3], y, 35, revealed ? color : C.yellow);
      });
      if (spokenProgress(state, api, 'dataset-reject', 0, 0.92, 0.99) === 1) {
        const generated = rows.filter((row) => row.reply).length;
        const kept = rows.filter((row) => row.outcome === 'keep').length;
        text(
          ctx,
          api,
          generated + ' teacher replies     →     ' + kept + ' checked training target',
          960,
          970,
          43,
          C.yellow,
          'center',
        );
      }
    });
    return;
  }
  if (beat === 2) {
    api.focus.target('family-split', () => {
      text(ctx, api, 'Training family', 170, 316, 43, C.blue);
      text(ctx, api, 'Independent test family', 1250, 316, 39, C.muted);
      api.line(ctx, 1165, 280, 1165, 940, C.muted, 2);
      text(ctx, api, 'Disabled key', 170, 605, 42);
      text(ctx, api, 'Unseen source and seeds', 1250, 605, 35, C.muted);
      const expand = spokenProgress(state, api, 'dataset-family', 2, 0.13, 0.35);
      api.components.fade(expand, () => {
        for (const [i, word] of ['Restore window?', 'How long to restore?'].entries()) {
          const y = 480 + i * 215;
          api.path(
            ctx,
            [
              { x: 457, y: 594 },
              { x: 512, y: 594 },
              { x: 570, y },
              { x: 616, y },
            ],
            { color: C.blue, width: 3 },
          );
          text(ctx, api, word, 643, y + 15, 37, C.blue);
        }
      });
      text(
        ctx,
        api,
        'Assign the seed before writing its variants.',
        960,
        988,
        36,
        C.yellow,
        'center',
      );
    });
    return;
  }
  text(ctx, api, 'Before collection', 165, 382, 40, C.blue);
  text(ctx, api, 'Teacher access  /  base license  /  generated-data terms', 655, 382, 37);
  text(ctx, api, 'During filtering', 165, 570, 40, C.cyan);
  text(ctx, api, 'Sample accepted replies and check them against the rules.', 655, 570, 37);
  text(ctx, api, 'After training', 165, 758, 40, C.yellow);
  text(ctx, api, 'Score teacher and student separately on fresh cases.', 655, 758, 37);
}
export default {
  id: 'dataset-gates',
  draw: drawDatasetGates,
  cues: ['dataset-keep', 'dataset-skip', 'dataset-reject', 'dataset-family'],
};
