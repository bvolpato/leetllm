import { z } from '../fixtures.mjs';
import { choices } from '../ticket.mjs';
import { optionRemovalSnapshot } from '../model.mjs';
import { phraseProgress, phraseStarted } from '../clock.mjs';

function drawPermutation(ctx, state, api) {
  const { C } = api;
  const order = [2, 0, 1];
  const progress = phraseProgress(state, api, 'options-b1-1', 0, 0.08, 0.28);
  const inspect = phraseStarted(state, 'align-identity', 0, 0.77);
  const slotY = (position) => 400 + position * 167;
  api.text(ctx, 'First request', 110, 277, 41, C.muted);
  api.text(ctx, 'Shuffled request', 1060, 277, 41, C.muted);
  const colors = [C.blue, C.cyan, C.pink];
  function option(x, y, slot, identity) {
    api.text(ctx, String.fromCharCode(65 + slot), x, y, 51, colors[identity]);
    api.text(ctx, choices[identity], x + 90, y, 41, colors[identity]);
  }
  choices.slice(0, 3).forEach((_, i) => option(113, slotY(i), i, i));
  api.focus.target('permuted-options', () => {
    order.forEach((identity, slot) => {
      if (progress > 0) option(1060, slotY(slot), slot, identity);
      else api.text(ctx, '·', 1060, slotY(slot), 42, C.muted);
    });
    if (progress > 0) {
      const start = { x: 752, y: slotY(1) - 15 };
      api.arrow(
        ctx,
        start.x,
        start.y,
        start.x + 252 * progress,
        start.y + 167 * progress,
        C.cyan,
        5,
      );
    }
  });
  api.line(ctx, 110, 856, 1807, 856, C.muted, 2);
  api.focus.target('semantic-result', () => {
    const message = inspect
      ? 'Returning B again would send this build to test regression.'
      : 'Same 401 log   /   expected description: registry authentication';
    api.text(ctx, message, 112, 947, 41, inspect ? C.yellow : C.ink);
  });
}

function drawRemoval(ctx, state, api) {
  const { C } = api;
  const o = optionRemovalSnapshot(state.beatP ?? 0);
  const travel = state.cues?.['options-b2-1'] ? api.focus.progress('options-b2-1') : o.travel;
  const shareKnown = state.cues?.['options-b2-2']
    ? state.cues['options-b2-2'].phase !== 'before'
    : o.normalized;
  const weights = z.map(Math.exp);
  const colors = [C.blue, C.cyan, C.pink];
  let x = 112;
  api.text(ctx, 'Weights from the original scores  [2, 1, 0]', x, 279, 44, C.ink);
  weights.forEach((weight, i) => {
    const width = (1680 * weight) / o.oldDenominator;
    const y = 349 + (i === 2 ? 151 * travel : 0);
    const label = ['A   e² ≈ ' + weight.toFixed(2), 'B   e¹ ≈ ' + weight.toFixed(2), 'C   1'][i];
    api.focus.target(i === 2 ? 'removed-option' : 'fixed-mass', () => {
      api.rect(ctx, x, y, width - 4, 98, C.panel, colors[i], 3);
      api.text(ctx, label, x + width / 2, y + 64, 40, colors[i], 'center');
    });
    x += width;
  });
  let denominator = 'Three weights in the total   ≈ ' + o.oldDenominator.toFixed(3);
  if (travel === 1)
    denominator =
      'B keeps its weight.   Total: ' +
      o.oldDenominator.toFixed(3) +
      ' − 1 ≈ ' +
      o.denominator.toFixed(3);
  api.text(ctx, denominator, 112, 578, 42, C.ink);
  api.line(ctx, 112, 629, 1800, 629, C.muted, 2);
  api.text(ctx, 'B before removal · three choices', 500, 715, 37, C.blue, 'center');
  api.rect(ctx, 350, 875 - o.three[1] * 500, 300, o.three[1] * 500, C.blue, undefined, 0);
  api.text(ctx, o.three[1].toFixed(3), 500, 938, 46, C.blue, 'center');
  api.math(ctx, 'e^1/' + o.oldDenominator.toFixed(3), 500, 1011, 37, C.blue, 'center');
  api.text(
    ctx,
    shareKnown ? 'After renormalizing · A/B' : 'Remaining shares pending',
    1300,
    715,
    37,
    shareKnown ? C.cyan : C.muted,
    'center',
  );
  if (shareKnown) {
    api.focus.target('renormalized-share', () => {
      api.rect(ctx, 1150, 875 - o.two[1] * 500, 300, o.two[1] * 500, C.cyan, undefined, 0);
      api.text(ctx, o.two[1].toFixed(3), 1300, 938, 46, C.cyan, 'center');
      api.math(ctx, 'p_B=e^1/' + o.denominator.toFixed(3), 1300, 1011, 37, C.cyan, 'center');
    });
  }
}

function drawIsolation(ctx, state, api) {
  const { C } = api;
  const change = phraseStarted(state, 'change-question', 2, 0.58);
  const fork = phraseProgress(state, api, 'options-construct-2', 2, 0.27, 0.44);
  api.focus.target('options-construction', () => {
    api.rect(ctx, 590, 215, 740, 91, C.panel, C.blue, 10);
    api.text(ctx, 'RUN-842   /   cached log', 960, 276, 45, C.ink, 'center');
    for (const [i, x] of [495, 1425].entries()) {
      const color = i === 0 ? C.cyan : C.pink;
      api.line(ctx, 960, 322, x, 407, C.muted, 3);
      if (fork > 0) api.circle(ctx, 960 + (x - 960) * fork, 322 + 85 * fork, 11, color);
      api.text(ctx, 'Question ' + (i + 1), x, 488, 42, color, 'center');
      api.text(
        ctx,
        i === 0 ? 'Which cause deserves investigation?' : 'Did the tests start?',
        x,
        578,
        40,
        C.ink,
        'center',
      );
    }
    api.text(ctx, 'Test   /   Registry   /   Insufficient', 495, 663, 36, C.muted, 'center');
  });
  api.focus.target('independent-row', () => {
    api.text(
      ctx,
      change ? 'Yes   /   No   /   Unknown' : 'Yes   /   No',
      1425,
      663,
      36,
      change ? C.pink : C.muted,
      'center',
    );
    if (fork === 1) {
      api.text(ctx, 'Own recurrent state', 495, 790, 38, C.cyan, 'center');
      api.text(ctx, 'Own recurrent state', 1425, 790, 38, C.pink, 'center');
    }
  });
  api.line(ctx, 110, 859, 1805, 859, C.muted, 2);
  api.text(
    ctx,
    change
      ? 'Change Q2. Do the scores for Q1 still match within tolerance?'
      : 'Both questions use the same build log.',
    112,
    954,
    39,
    C.ink,
  );
}
export function drawOptions(ctx, scene, state, api) {
  if (state.beat === 0) drawPermutation(ctx, state, api);
  else if (state.beat === 1) drawRemoval(ctx, state, api);
  else drawIsolation(ctx, state, api);
}
export default {
  id: 'options',
  draw: drawOptions,
  cues: [
    'options-b1-1',
    'align-identity',
    'options-b2-1',
    'options-b2-2',
    'options-construct-2',
    'change-question',
  ],
};
