import { beatCue } from '../arithmetic.mjs';
import { collapseCodes, pixels } from '../fixtures.mjs';
import { collapseDifference, collapseOutputs, probePixels } from '../model.mjs';
import { chapterGrid, line, text } from '../defaults.mjs';

function historyTrials(ctx, state, api) {
  const { C } = api;
  const code = beatCue(state, 0, 'history-code', 0.42, 0.59);
  const history = beatCue(state, 0, 'history-bit', 0.68, 0.82);
  [
    ['First history bit', 485],
    ['Global code', 925],
    ['Decoded pattern', 1435],
  ].forEach(([label, x]) => text(ctx, api, label, x, 247, 37, C.ink, 'center'));
  [
    [0, 0, 1],
    [0, 1, code],
    [1, 1, history],
  ].forEach(([bit, probe, progress], row) => {
    if (!progress) return;
    const y = 285 + row * 210;
    const pair = collapseCodes[probe].map((v) => v.toFixed(2)).join(', ');
    text(ctx, api, String(bit), 485, y + 103, 49, row === 2 ? C.pink : C.ink, 'center');
    text(ctx, api, '[ ' + pair + ' ]', 925, y + 103, 40, row === 1 ? C.yellow : C.ink, 'center');
    if (progress === 1) chapterGrid(ctx, api, bit === 0 ? pixels : probePixels, 1353, y, 34);
    else text(ctx, api, '?', 1435, y + 103, 40, C.muted, 'center');
  });
  if (beatCue(state, 1, 'history-verdict', 0, 0.15) === 1) {
    text(
      ctx,
      api,
      'Same history, same output. New history, new output.',
      960,
      969,
      37,
      C.ink,
      'center',
    );
  }
}

export function drawCollapseRepairs(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) return historyTrials(ctx, state, api);
  if (state.beat === 2) {
    const loss = 0.5 * beatCue(state, 2, 'half-influence', 0.14, 0.34);
    collapseOutputs(loss).forEach((row, i) => {
      const x = 330 + i * 850;
      text(ctx, api, 'Probe ' + (i ? 'B' : 'A'), x + 193, 303, 42, i ? C.pink : C.cyan, 'center');
      chapterGrid(ctx, api, row, x, 360, 78);
    });
    text(ctx, api, 'Code sensitivity   ' + (1 - loss).toFixed(2), 960, 849, 40, C.yellow, 'center');
    text(
      ctx,
      api,
      'Largest pixel difference   ' + collapseDifference(loss).toFixed(3),
      960,
      934,
      34,
      C.ink,
      'center',
    );
    return;
  }

  const schedule = beatCue(state, 3, 'anneal-beta', 0.16, 0.34);
  const dropout = beatCue(state, 3, 'drop-history', 0.56, 0.74);
  text(ctx, api, 'KL weight in the sentence model', 550, 306, 37, C.ink, 'center');
  line(ctx, api, 275, 752, 830, 752, C.muted, 3);
  line(ctx, api, 275, 752, 275, 390, C.muted, 3);
  text(ctx, api, '0', 242, 760, 28, C.muted, 'right');
  text(ctx, api, '1', 242, 426, 28, C.muted, 'right');
  if (schedule > 0)
    line(ctx, api, 275, 751, 275 + 540 * schedule, 751 - 334 * schedule, C.yellow, 5);
  text(ctx, api, 'Training steps', 550, 829, 30, C.muted, 'center');
  text(ctx, api, 'Previous words during training', 1380, 306, 37, C.ink, 'center');
  ['the', 'sky', 'grew', 'dark'].forEach((word, i) => {
    const hidden = (i === 1 && dropout > 0.25) || (i === 3 && dropout > 0.75);
    const x = 1103 + 157 * i;
    api.rect(ctx, x, 500, 132, 87, C.panel, hidden ? C.muted : C.cyan, 4);
    text(ctx, api, hidden ? '?' : word, x + 66, 556, 34, hidden ? C.muted : C.cyan, 'center');
  });
  if (dropout === 1)
    text(ctx, api, 'Test the code again with the history fixed.', 1380, 765, 32, C.ink, 'center');
}

export default {
  id: 'collapse-repairs',
  draw: drawCollapseRepairs,
  cues: [
    'history-code',
    'history-bit',
    'history-verdict',
    'half-influence',
    'anneal-beta',
    'drop-history',
  ],
};
