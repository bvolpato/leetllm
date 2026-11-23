import { afterCue, cue } from '../construction.mjs';
import { clusterBootstrapModel } from '../model.mjs';
import { axes, caption, focusTarget, interval, text } from '../defaults.mjs';

const model = clusterBootstrapModel();
const selected = [1, 1, 3, 5, 9, 0, 2, 8, 4, 7];
const original = [2, 3, 4, 0, 1, 5, 6, 7, 8, 9];

function campaign(ctx, api, owner, slot, picked = 0) {
  const { C } = api;
  const x = 130 + (slot % 5) * 224;
  const y = 370 + Math.floor(slot / 5) * 235;
  const color = owner < 2 ? C.pink : C.blue;
  api.rect(ctx, x, y, 194, 177, C.panel, color, 2, 8);
  text(ctx, api, 'G' + (owner + 1), x + 97, y + 45, 32, color, 'center');
  for (let j = 0; j < 10; j++) {
    const dx = x + 28 + (j % 5) * 34;
    const dy = y + 87 + Math.floor(j / 5) * 46;
    const inspected = (j === 4 && picked >= 1) || (j === 9 && picked >= 2);
    api.circle(ctx, dx, dy, 11, inspected ? C.yellow : color);
  }
}

export function drawClusterEvidence(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    const first = cue(state, 'pull-signup', 0.19, 0.29);
    const next = cue(state, 'pull-neighbor', 0.31, 0.43);
    text(ctx, api, 'Each box came from one draw', 675, 285, 37, C.ink, 'center');
    original.forEach((owner, i) =>
      campaign(ctx, api, owner, i, owner === 1 ? Number(first > 0) + Number(next > 0) : 0),
    );
    focusTarget(ctx, api, 'linked-signups', () => {
      text(ctx, api, 'Inspect two signups', 1550, 285, 36, C.ink, 'center');
      [first, next].forEach((p, i) => {
        const x = 1495 + 120 * i;
        const y = 470 + 46 * i;
        api.circle(ctx, x, y, 22, C.panel, C.muted, 2);
        if (p > 0) api.circle(ctx, api.lerp(1190, x, p), api.lerp(457 + 46 * i, y, p), 13, C.pink);
        if (p >= 1) text(ctx, api, 'G2', x, y + 77, 32, C.pink, 'center');
      });
      if (next >= 1) text(ctx, api, 'Same campaign', 1550, 695, 33, C.yellow, 'center');
    });
    caption(ctx, api, '20 positive signups among 100 reviewed');
    return;
  }

  if (state.beat === 1) {
    const first = cue(state, 'redraw-campaigns', 0.15, 0.31);
    const twice = cue(state, 'repeat-campaign', 0.32, 0.48);
    const rest = cue(state, 'finish-redraw', 0.48, 0.75);
    const shown = Number(first > 0) + Number(twice > 0) + Math.floor(8 * rest);
    text(ctx, api, 'Draw whole campaigns with replacement', 675, 285, 35, C.ink, 'center');
    focusTarget(ctx, api, 'campaign-copies', () => {
      selected.slice(0, shown).forEach((owner, i) => campaign(ctx, api, owner, i));
      text(ctx, api, '10 independent campaigns', 1540, 395, 30, C.ink, 'center');
      if (shown >= 2) {
        text(ctx, api, 'G2 appears twice', 1540, 515, 36, C.yellow, 'center');
        text(ctx, api, 'All ten labels travel together', 1540, 590, 27, C.muted, 'center');
      }
    });
    caption(
      ctx,
      api,
      'Shown redraw: ' +
        selected.slice(0, shown).filter((g) => g < 2).length +
        ' positive campaign copies out of ' +
        shown,
    );
    return;
  }

  if (state.beat === 3) {
    const step = cue(state, 'campaign-step', 0.01, 0.16);
    const unequal = cue(state, 'unequal-campaigns', 0.62, 0.69);
    if (unequal > 0) {
      focusTarget(ctx, api, 'campaign-size', () => {
        text(ctx, api, 'Two draws with unequal campaign sizes', 960, 300, 39, C.ink, 'center');
        for (const [i, n] of [10, 20].entries()) {
          const x = 333 + i * 730;
          const color = i === 0 ? C.blue : C.pink;
          const h = 118 + (n / 10 - 1) * 65;
          api.rect(ctx, x, 426, 520, h, C.panel, color, 3, 8);
          for (let j = 0; j < n; j++)
            api.circle(ctx, x + 40 + (j % 10) * 49, 485 + Math.floor(j / 10) * 65, 13, color);
          text(ctx, api, n + ' signups', x + 260, 700, 40, color, 'center');
        }
        text(
          ctx,
          api,
          'Signup-rate denominator for these two draws: 10 + 20 = 30',
          960,
          870,
          34,
          C.ink,
          'center',
        );
      });
    } else {
      focusTarget(ctx, api, 'redraw-step', () => {
        text(ctx, api, 'Ten campaign draws in each tray', 960, 268, 39, C.ink, 'center');
        for (let row = 0; row < 2; row++) {
          const y = 344 + row * 270;
          const swapped = row === 1 && step >= 0.5;
          const positive = swapped ? 3 : 2;
          for (let i = 0; i < 10; i++) {
            const x = 234 + i * 148;
            const lift = row === 1 && i === 2 ? Math.sin(Math.PI * step) * 40 : 0;
            const color = i < positive ? C.pink : C.blue;
            api.rect(ctx, x, y - lift, 125, 98, C.panel, color, 3, 7);
            for (let j = 0; j < 10; j++)
              api.circle(
                ctx,
                x + 20 + (j % 5) * 21,
                y - lift + 33 + Math.floor(j / 5) * 32,
                7,
                color,
              );
          }
          text(
            ctx,
            api,
            positive * 10 + ' positive / 100 signups',
            960,
            y + 168,
            36,
            C.ink,
            'center',
          );
        }
        if (step === 1)
          text(
            ctx,
            api,
            'One swap moves the fraction from 20% to 30%',
            960,
            934,
            34,
            C.pink,
            'center',
          );
      });
    }
    return;
  }
  const progress = (id, a, b) => cue(state, id, a, b);
  const done = (id, a, b) => afterCue(state, id, a, b);
  const plot = axes(
    ctx,
    api,
    590,
    390,
    1070,
    365,
    [0, 0.6],
    [0, 2],
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
    [],
    'bootstrap fraction',
  );
  text(
    ctx,
    api,
    '2.5th to 97.5th percentiles of resampled fractions',
    1115,
    289,
    33,
    C.ink,
    'center',
  );

  function spread(id, name, row, bounds, amount, known, color) {
    focusTarget(ctx, api, id, () => {
      const p = plot.point(0.2, row);
      text(ctx, api, name, 520, p.y + 10, 32, color, 'right');
      if (amount > 0)
        interval(
          ctx,
          api,
          plot,
          {
            low: api.lerp(0.2, bounds.low, amount),
            high: api.lerp(0.2, bounds.high, amount),
          },
          row,
          color,
          1,
          0.2,
        );
      if (known)
        text(
          ctx,
          api,
          Math.round(100 * bounds.low) + '% to ' + Math.round(100 * bounds.high) + '%',
          520,
          p.y + 58,
          28,
          color,
          'right',
        );
    });
  }
  spread(
    'row-range',
    'Individual rows',
    1.5,
    model.rowRange,
    progress('row-spread', 0.01, 0.12),
    done('row-ends', 0.16, 0.29),
    C.cyan,
  );
  spread(
    'campaign-range',
    'Whole campaigns',
    0.5,
    model.campaignRange,
    progress('campaign-spread', 0.32, 0.43),
    done('campaign-ends', 0.46, 0.59),
    C.pink,
  );
  focusTarget(ctx, api, 'cluster-variance', () => {
    const show = done('compare-variance', 0.84, 0.95);
    text(
      ctx,
      api,
      show ? 'Variance across redraws' : 'Same observed fraction · 20%',
      960,
      925,
      31,
      C.ink,
      'center',
    );
    if (show) {
      text(
        ctx,
        api,
        'Rows   .2 × .8 / 100 = ' + model.rowVariance.toFixed(4),
        580,
        994,
        30,
        C.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Campaigns   .2 × .8 / 10 = ' + model.campaignVariance.toFixed(3),
        1360,
        994,
        30,
        C.pink,
        'center',
      );
    }
  });
}

export default {
  id: 'cluster-evidence',
  draw: drawClusterEvidence,
  cues: [
    'pull-signup',
    'pull-neighbor',
    'redraw-campaigns',
    'repeat-campaign',
    'finish-redraw',
    'row-spread',
    'row-ends',
    'campaign-spread',
    'campaign-ends',
    'compare-variance',
    'campaign-step',
    'unequal-campaigns',
  ],
};
