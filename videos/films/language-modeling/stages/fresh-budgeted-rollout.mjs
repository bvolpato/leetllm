import { cueAmount } from '../construction.mjs';
import { extendedLanguageState } from '../model.mjs';
import { card, target, text } from '../defaults.mjs';

export function drawFreshBudgetedRollout(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  const m = extendedLanguageState('fresh-budgeted-rollout', state);
  const col = (i) => 480 + 260 * i;
  const width = 230,
    height = 76;
  const reserve = cueAmount(state, 0, 'fresh-reserve', 0.1, 0.25);
  const record = cueAmount(state, 0, 'fresh-record', 0.31, 0.51);
  const revealStop = m.rerun
    ? cueAmount(state, 3, 'fresh-limit', 0.05, 0.32) === 1
    : m.outputResult;
  function slot(i, y, word, color) {
    if (word) card(ctx, api, word, col(i), y, width, height, color, 40);
    else api.rect(ctx, col(i), y, width, height, C.panel, C.muted, 2, 8);
  }

  text(ctx, api, 'Recorded text', 145, 320, 41, C.ink);
  m.history.prompt.forEach((v, i) => slot(i, 265, v.token, C.cyan));
  target(ctx, api, 'fox-record', () => {
    for (const [i, word] of m.record.entries()) {
      slot(3 + i, 265, record > i / 2 ? word : '', C.yellow);
      if (record > i / 2)
        text(
          ctx,
          api,
          m.factors[i].toFixed(2),
          col(i + 3) + width / 2,
          395,
          39,
          C.yellow,
          'center',
        );
    }
    if (reserve > 0) {
      api.line(ctx, col(3), 226, col(3) + (col(4) + width - col(3)) * reserve, 226, C.muted, 3);
      if (reserve === 1)
        text(ctx, api, '2 reserved output positions', col(3) + 245, 211, 29, C.muted, 'center');
    }
  });
  target(ctx, api, 'fox-score', () => {
    const score = m.probabilityResult
      ? 'P(record | prompt) = 0.25 × 0.50 = 1/8'
      : 'P(record | prompt) = ?';
    text(ctx, api, score, 145, 469, 37, m.probabilityResult ? C.yellow : C.muted);
    if (m.lossResult)
      text(
        ctx,
        api,
        m.meanNll.toFixed(3) + ' nats/target     PPL ' + m.perplexity.toFixed(3),
        col(4) + width,
        469,
        36,
        C.yellow,
        'right',
      );
  });
  api.line(ctx, 145, 505, 1750, 505, C.muted, 2);
  if (beat === 0) {
    if (record === 1)
      text(
        ctx,
        api,
        'If a run selects “runs,” then end, which tokens reach the cache?',
        145,
        721,
        48,
        C.ink,
      );
    if (reserve === 1)
      text(
        ctx,
        api,
        'Stop checks in order     1. End token     2. Output limit',
        145,
        939,
        34,
        C.muted,
      );
    return;
  }

  target(ctx, api, 'fox-cache', () => {
    text(ctx, api, 'KV cache', 145, 629, 41, C.cyan);
    text(ctx, api, m.history.kv.length + ' processed positions', 145, 679, 29, C.muted);
    for (let i = 0; i < 5; i++) slot(i, 577, m.history.kv[i]?.token, C.cyan);
    if (m.feed > 0 && m.feed < 1) {
      const center = col(3) + width / 2;
      api.line(ctx, center, 790, center, 674, C.muted, 2);
      api.circle(ctx, center, 790 - 116 * m.feed, 9, C.cyan);
    }
  });
  target(ctx, api, 'fox-distribution', () => {
    text(ctx, api, 'After “' + m.prefix + '”', 145, 778, 33, C.ink);
    let left = 145;
    for (const [i, { token, probability }] of m.row.entries()) {
      const w = 850 * probability;
      api.rect(ctx, left, 810, w, 63, i ? C.blue : C.green);
      text(ctx, api, token + '   ' + probability.toFixed(2), left + w / 2, 853, 32, C.bg, 'center');
      left += w;
    }
  });
  target(ctx, api, 'fox-output', () => {
    text(ctx, api, 'Selected output', col(3), 933, 33, C.ink);
    slot(3, 801, m.history.accepted[0]?.token, C.green);
    slot(4, 801, m.history.accepted[1]?.token, C.green);
    if (m.outputResult) text(ctx, api, '2 of 2', col(4) + width, 933, 33, C.green, 'right');
  });
  target(ctx, api, 'fox-stop', () => {
    const reason = revealStop && m.stopReason ? m.stopReason : '?';
    text(ctx, api, 'Stop reason   ' + reason, 145, 994, 44, revealStop ? C.yellow : C.muted);
  });
}

export default {
  id: 'fresh-budgeted-rollout',
  draw: drawFreshBudgetedRollout,
  cues: [
    'fresh-reserve',
    'fresh-record',
    'fresh-choose-runs',
    'fresh-budgeted-rollout-step-1-1',
    'fresh-budgeted-rollout-step-1-2',
    'fresh-budgeted-rollout-step-1-4',
    'fresh-budgeted-rollout-step-1-5',
    'fresh-rewind',
    'fresh-choose-waits',
    'fresh-feed-waits',
    'fresh-choose-here',
    'fresh-limit',
  ],
};
