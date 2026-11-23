import { phraseProgress } from '../construction.mjs';
import { drawCheckpointRuler } from '../checkpoint-ruler.mjs';
import { CHECKPOINTS } from '../fixtures.mjs';
import { selectedPackage, selectionSnapshot } from '../model.mjs';

export function drawSelect(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 4) {
    const arrived = phraseProgress(state, 'select-measure', 1);
    const gated = phraseProgress(state, 'select-gate', 2) >= 1;
    const ranked = phraseProgress(state, 'select-rank', 3) >= 1;
    drawCheckpointRuler(ctx, api, {
      rows: CHECKPOINTS,
      base: CHECKPOINTS[0].general,
      budget: 1.5,
      domain: [19, 24.2],
      visibleCount: 1 + Math.ceil(arrived * 3),
      gated,
      ranked,
      message: ranked
        ? '4k leads the eligible checkpoints on task accuracy.'
        : gated
          ? '12k is outside the budget. Which eligible checkpoint leads on the task?'
          : state.beat === 1
            ? 'Which checkpoint exceeds the general perplexity ceiling?'
            : 'Set the budget before comparing candidates.',
    });
    return;
  }
  const pack = selectedPackage();
  const { reserved } = selectionSnapshot(1, 1);
  api.text(ctx, pack.checkpoint, 170, 334, 68, C.green);
  api.text(ctx, 'Selection cases', 170, 451, 39, C.muted);
  api.text(ctx, pack.winner.task + '% correct', 170, 538, 51, C.ink);
  api.text(ctx, 'Separate reserved cases', 955, 451, 39, C.muted);
  api.focus.target('reserved-check', () => {
    const opened = phraseProgress(state, 'select-reserved', 4) > 0;
    api.text(
      ctx,
      opened ? reserved.correct + ' of ' + reserved.total + ' correct' : '?',
      955,
      538,
      51,
      C.ink,
    );
    api.text(
      ctx,
      opened
        ? 'General PPL   ' + reserved.baseGeneral.toFixed(1) + ' → ' + reserved.general.toFixed(1)
        : 'Score the selected recipe',
      955,
      620,
      35,
      C.muted,
    );
  });
  if (phraseProgress(state, 'select-save', 4, 0.5, 0.85) > 0) {
    api.focus.target('checkpoint-record', () => {
      api.line(ctx, 170, 711, 1740, 711, C.muted, 2);
      api.text(ctx, 'Stored with the weights', 170, 792, 37, C.green);
      api.text(
        ctx,
        pack.tokenizer + '   ·   corpus D1   ·   hash ' + pack.corpusHash.slice(0, 10),
        170,
        875,
        35,
        C.ink,
      );
      api.text(
        ctx,
        '8 distinct corpus positions   ·   4,000 token presentations   ·   optimizer state   ·   evaluation protocol',
        170,
        962,
        31,
        C.ink,
      );
    });
  }
}

export default {
  id: 'select',
  draw: drawSelect,
  cues: [
    'select-budget',
    'select-measure',
    'select-gate',
    'select-rank',
    'select-reserved',
    'select-save',
  ],
};
