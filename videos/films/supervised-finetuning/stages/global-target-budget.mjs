import { sftExposure } from '../arithmetic.mjs';
import { spoken } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('global-target-budget-mechanism', () => {
    const { C } = api;
    if (state.beat === 2) {
      const grads = [2, 4],
        count = 4,
        workers = grads.length;
      const intended = grads.reduce((sum, g) => sum + g, 0) / count;
      const averaged = intended / workers;
      text(ctx, api, 'Four active targets across two workers', 960, 303, 42, C.ink, 'center');
      grads.forEach((g, i) => {
        const x = 570 + i * 780;
        text(
          ctx,
          api,
          'Worker ' + (i + 1) + '   /   loss-sum gradient ' + g,
          x,
          447,
          36,
          C.blue,
          'center',
        );
        upgradeBox(
          ctx,
          api,
          g + ' / ' + count + ' = ' + (g / count).toFixed(1),
          x - 225,
          500,
          450,
          100,
          C.blue,
          41,
        );
      });
      text(
        ctx,
        api,
        'DDP averages again    (0.5 + 1.0) / 2 = ' + averaged,
        960,
        755,
        44,
        C.ink,
        'center',
      );
      if (spoken(state, 'ddp-fix', 2, 0.8))
        text(
          ctx,
          api,
          'Compensate once    ' + averaged + ' × ' + workers + ' = ' + intended,
          960,
          902,
          42,
          C.green,
          'center',
        );
      return;
    }
    const other = state.beat === 1;
    const workerCount = other ? 8 : 4,
      batch = other ? 2 : 4,
      accum = other ? 16 : 8;
    const exp = sftExposure(batch, accum, workerCount, 1560);
    text(
      ctx,
      api,
      'Each worker accumulates ' + accum + ' microbatches of ' + batch + ' items',
      960,
      294,
      41,
      C.ink,
      'center',
    );
    for (let i = 0; i < workerCount; i++) {
      const x = 171 + (i % 4) * 416,
        y = 385 + Math.floor(i / 4) * 141;
      upgradeBox(
        ctx,
        api,
        'Worker ' + (i + 1) + '    ' + batch * accum + ' items',
        x,
        y,
        343,
        98,
        C.blue,
        31,
      );
    }
    text(
      ctx,
      api,
      batch + ' × ' + accum + ' × ' + workerCount + ' = ' + exp.items + ' loader items per update',
      960,
      788,
      47,
      C.green,
      'center',
    );
    text(
      ctx,
      api,
      other
        ? '128 → 256 items per update'
        : '4 × 1,560 = ' + exp.targets.toLocaleString('en-US') + ' scored targets per update',
      960,
      918,
      40,
      C.cyan,
      'center',
    );
  });
}

export default {
  id: 'global-target-budget',
  draw: draw,
  cues: [
    'global-target-budget-b1',
    'global-target-budget-b2',
    'global-target-budget-b3',
    'ddp-fix',
  ],
};
