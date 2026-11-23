import { kl } from '../arithmetic.mjs';
import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawSignalAndTrainer(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    text(ctx, api, 'Saved reply to the disabled-key request', 180, 340, 34, C.muted);
    text(ctx, api, '7 days', 180, 490, 100, C.blue);
    api.arrow(ctx, 530, 455, 775, 455, C.muted, 4);
    text(ctx, api, 'Student tokens in this example', 850, 340, 35, C.muted);
    ['7', ' days'].forEach((token, i) => {
      const x = 850 + 250 * i;
      api.rect(ctx, x, 397, 216, 120, C.panel, undefined, 4);
      text(ctx, api, token, x + 108, 477, 48, C.cyan, 'center');
    });
    text(ctx, api, 'Probability of a different reply?', 180, 735, 49);
    text(ctx, api, 'The text record contains only the selected reply.', 180, 827, 37, C.muted);
    return;
  }
  if (beat <= 2) {
    const distributions = [
      [0.45, 0.45, 0.1],
      [0.05, 0.05, 0.9],
    ];
    const retain = spokenProgress(state, api, 'tail-select', 1, 0.13, 0.29);
    const stretch = spokenProgress(state, api, 'tail-stretch', 2, 0.01, 0.13);
    const restore = spokenProgress(state, api, 'tail-restore', 2, 0.36, 0.5);
    const zoom = stretch * (1 - restore);
    const zero = spokenProgress(state, api, 'tail-zero', 2, 0.21, 0.35) === 1;
    const full = spokenProgress(state, api, 'tail-full', 2, 0.67, 0.82) === 1;
    const x = 360,
      width = 1370;
    api.focus.target('cache-strips', () => {
      const title =
        zoom === 1
          ? 'Within the saved pair'
          : zoom > 0
            ? 'Changing the width represented by the frame'
            : 'Across the full vocabulary';
      text(ctx, api, title, x, 290, 39);
      distributions.forEach((values, i) => {
        const y = 391 + i * 220,
          color = i ? C.cyan : C.blue;
        const selected = values[0] + values[1];
        const windowMass = 1 - zoom * (1 - selected);
        text(ctx, api, i ? 'Student' : 'Teacher', 140, y + 52, 44, color);
        let total = 0;
        values.forEach((v, j) => {
          const start = Math.min(width, (width * total) / windowMass);
          total += v;
          const end = Math.min(width, (width * total) / windowMass);
          const w = end - start;
          if (w < 5) return;
          api.rect(ctx, x + start + 2, y, w - 4, 77, j < 2 ? color : C.muted, undefined, 1);
          if (w >= 52) text(ctx, api, 'ABC'[j], x + (start + end) / 2, y + 54, 42, C.bg, 'center');
          if ((zoom === 0 || zoom === 1) && w > 51)
            text(
              ctx,
              api,
              Math.round((v / windowMass) * 100) + '%',
              x + (start + end) / 2,
              y + 125,
              30,
              C.ink,
              'center',
            );
        });
        if (retain > 0 && zoom === 0) {
          const tip = x + width * selected;
          api.path(
            ctx,
            [
              { x, y: y - 9 },
              { x, y: y - 28 },
              { x: tip, y: y - 28 },
              { x: tip, y: y - 9 },
            ],
            { color: C.yellow, width: 3 },
          );
          text(ctx, api, Math.round(selected * 100) + '% kept', x, y - 42, 28, C.yellow);
        }
      });
      const conditional = distributions.map((v) => v.slice(0, 2).map((p) => p / (v[0] + v[1])));
      let caption = 'What does KL see after each bracket fills its strip?';
      if (full) caption = 'Full forward KL     ' + kl(...distributions).toFixed(3) + ' nats';
      else if (restore > 0) caption = 'Token C returns to the comparison';
      else if (zero) caption = 'KL within the retained pair     ' + kl(...conditional) + ' nats';
      text(ctx, api, caption, 960, 925, 43, C.yellow, 'center');
    });
    return;
  }
  if (beat === 3) {
    const positions = 10000,
      vocabulary = 50000,
      bytes = 2;
    const factors = [
      [positions.toLocaleString('en-US'), 'token positions'],
      [vocabulary.toLocaleString('en-US'), 'values per position'],
      [String(bytes), 'bytes per value'],
    ];
    factors.forEach(([value, unit], i) => {
      const x = 365 + i * 590;
      text(ctx, api, value, x, 515, 78, C.blue, 'center');
      text(ctx, api, unit, x, 595, 36, C.muted, 'center');
      if (i < 2) text(ctx, api, '×', x + 297, 515, 54, C.muted, 'center');
    });
    text(
      ctx,
      api,
      (positions * vocabulary * bytes) / 1e9 + ' GB of dense values',
      960,
      818,
      64,
      C.yellow,
      'center',
    );
    return;
  }
  if (beat === 4) {
    text(ctx, api, 'TRL guide, October 2026     •     Agent example', 145, 310, 34, C.muted);
    ['Prompt', 'Assistant reply', 'Tool result', 'Assistant reply'].forEach((token, i) => {
      const x = 310 + i * 430,
        supervised = i === 1 || i === 3;
      api.rect(ctx, x - 175, 407, 350, 91, C.panel);
      text(ctx, api, token, x, 466, 35, C.ink, 'center');
      if (supervised) api.arrow(ctx, x, 528, x, 627, C.cyan, 4);
      text(
        ctx,
        api,
        supervised ? 'In loss' : 'Context only',
        x,
        705,
        38,
        supervised ? C.cyan : C.muted,
        'center',
      );
    });
    text(
      ctx,
      api,
      'Direct output-head read     •     Check which weights can train',
      960,
      910,
      38,
      C.yellow,
      'center',
    );
    return;
  }
  text(ctx, api, 'GKD collection fraction', 215, 397, 43, C.cyan);
  text(ctx, api, 'Which prefixes reach the teacher?', 825, 397, 41);
  text(ctx, api, 'GKD divergence', 215, 544, 43, C.blue);
  text(ctx, api, 'How does each mismatch count?', 825, 544, 41);
  text(ctx, api, 'CPU training exercise', 215, 770, 43, C.muted);
  text(ctx, api, 'Frozen teacher    →    loss    →    student update', 825, 770, 36);
}
export default {
  id: 'signal-and-trainer',
  draw: drawSignalAndTrainer,
  cues: ['tail-select', 'tail-stretch', 'tail-zero', 'tail-restore', 'tail-full'],
};
