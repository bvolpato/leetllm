import { clamp, cue } from './arithmetic.mjs';
import {
  CONTEXT_LIMIT,
  FRESH_CLOCK,
  OUTPUT_RESERVE,
  TEXT_STATE,
  TEXT_TOKENS,
  VIEWS,
  VISUAL_KEYS,
  VISUAL_TOKENS_336,
  VISUAL_VALUES,
} from './fixtures.mjs';
import { crossAttentionFixture, eventOrder, multimodalReservation } from './model.mjs';
import { dotProduct } from 'vizmatic';
export function attentionConstruction(beat, progress, cues) {
  const measured = (id, fallback) => (cues?.[id] ? clamp(cues[id].progress) : fallback);
  const seconds = clamp(progress) * [13.368, 14.57, 14.092][beat];
  const raw = VISUAL_KEYS.map((key) => dotProduct(TEXT_STATE, key));
  const products = VISUAL_KEYS.map((key) => key.map((value, index) => value * TEXT_STATE[index]));
  const productProgress = products.map((row) =>
    row.map((_, index) =>
      beat > 0
        ? 1
        : cues
          ? clamp(measured('attention-query-scores', 0) * 3 - index)
          : clamp((seconds - 6.7 - index * 0.3) / 0.55),
    ),
  );
  const dot = products.map((row, index) =>
    row.reduce((sum, value, column) => sum + value * productProgress[index][column], 0),
  );
  const divide = beat > 0 ? 1 : measured('attention-scale-scores', clamp((seconds - 8.325) / 2.05));
  const scaled = dot.map((value) => value / (1 + divide * (Math.sqrt(3) - 1)));
  const fixture = crossAttentionFixture(0);
  const expProgress = clamp(
    beat > 1
      ? 1
      : beat === 1
        ? measured('attention-softmax-normalize', clamp((seconds - 0.25) / 1.65)) * (cues ? 2 : 1)
        : 0,
  );
  const normalize =
    beat > 1
      ? 1
      : beat === 1
        ? cues
          ? clamp(measured('attention-softmax-normalize', 0) * 2 - 1)
          : clamp((seconds - 2.35) / 1.55)
        : 0;
  const contributions = VISUAL_VALUES.map((row, index) => {
    const fraction =
      beat > 1
        ? 1
        : beat === 1
          ? cues
            ? clamp(measured('attention-weight-values', 0) * 2 - index * 0.5)
            : clamp((seconds - 4.45 - index * 0.8) / 1.75)
          : 0;
    return {
      fraction,
      values: row.map((value) => value * fixture.weights[index] * fraction),
    };
  });
  const attended = TEXT_STATE.map((_, index) =>
    contributions.reduce((sum, row) => sum + row.values[index], 0),
  );
  const gateProgress =
    beat === 2 ? measured('attention-learned-gate', clamp((seconds - 10.4) / 2.05)) : 0;
  const gated = crossAttentionFixture(0.35 * gateProgress);
  return {
    ...gated,
    seconds,
    raw,
    products,
    productProgress,
    dot,
    divide,
    scaled,
    expProgress,
    normalize,
    contributions,
    attended,
    weights: fixture.weights,
    exps: fixture.logits.map(Math.exp),
    gateProgress,
  };
}
export function budgetSnapshot(beat, beatP, cues) {
  const state = { beat, beatP, cues };
  const at = (id, index, from, to) => cue(state, id, index, from, to);
  const text = Math.round(TEXT_TOKENS * at('budget-text', 0, 0.04, 0.42));
  const reserve = Math.round(OUTPUT_RESERVE * at('budget-reserve', 0, 0.46, 0.72));
  const visible =
    Math.floor(2 * at('budget-two-views', 1, 0.25, 0.58)) +
    Math.floor(at('budget-third-view', 2, 0, 0.3)) +
    Math.floor(2 * at('budget-five-views', 2, 0.34, 0.6));
  const reduced = Math.floor(VIEWS * at('budget-reduce', 3, 0.12, 0.62));
  const views = Array.from({ length: visible }, (_, index) =>
    index < reduced ? 32 : VISUAL_TOKENS_336,
  );
  const visualTokens = views.reduce((sum, value) => sum + value, 0);
  const prefix = visualTokens + text;
  return {
    views,
    reduced,
    text,
    visualTokens,
    prefix,
    reserve,
    total: prefix + reserve,
    fits: prefix + reserve <= CONTEXT_LIMIT,
  };
}
export function freshIncidentState(beat, completed = {}) {
  const direct = multimodalReservation({
      views: 4,
      side: 448,
      text: 1800,
      reserve: 256,
    }),
    reduced = multimodalReservation({
      views: 4,
      side: 448,
      queries: 32,
      text: 1800,
      reserve: 256,
    });
  return {
    direct,
    reduced,
    revealDirect: beat > 1 || (beat === 1 && Boolean(completed.direct)),
    revealReduced: beat > 1 || (beat === 1 && Boolean(completed.reduced)),
    revealCache: beat > 1 || (beat === 1 && Boolean(completed.cache)),
    evidenceReady: beat > 2 || (beat === 2 && Boolean(completed.order)),
    order: eventOrder(
      FRESH_CLOCK.deploy,
      beat >= 4 || (beat === 3 && completed.correction)
        ? FRESH_CLOCK.revisedRise
        : FRESH_CLOCK.firstRise,
    ),
  };
}
