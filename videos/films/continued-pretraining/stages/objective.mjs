import { phraseProgress, wordShares } from '../construction.mjs';
import { CHECKPOINT_PIECES } from '../fixtures.mjs';
import { adaptationSnapshot } from '../model.mjs';

export function drawObjective(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    const re = phraseProgress(state, 'objective-re', 1);
    const ef = phraseProgress(state, 'objective-ef', 1, 0.5, 0.85);
    const count = ef >= 1 ? 7 : re >= 1 ? 6 : 5;
    const period = phraseProgress(state, 'objective-period', 1, 0.6, 0.85) >= 1;
    api.text(ctx, 'Retained field note D1', 200, 285, 34, C.cyan);
    api.text(ctx, 'The tide rises near the reef.', 200, 382, 66, C.ink);
    api.focus.target('token-stream', () => {
      const x = 200,
        step = 190,
        top = 535;
      for (let i = 0; i < CHECKPOINT_PIECES.length; i++) {
        const token = CHECKPOINT_PIECES[i].trim();
        const color = i < 5 ? C.muted : i < count ? C.cyan : C.muted;
        api.text(
          ctx,
          i < count || (i === 7 && period) ? token : '·',
          x + i * step + 83,
          top + 63,
          50,
          color,
          'center',
        );
        api.line(ctx, x + i * step, top + 88, x + i * step + 166, top + 88, color, 3);
      }
      const end = x + count * step - 24;
      api.line(ctx, x, top + 122, end, top + 122, C.blue, 4);
      api.text(ctx, 'Context available for the next prediction', x, top + 190, 34, C.blue);
      api.text(ctx, 'Next target', x + count * step + 83, top - 32, 28, C.yellow, 'center');
      api.arrow(ctx, x + count * step + 83, top - 16, x + count * step + 83, top + 20, C.yellow, 3);
    });
    if (count === 5)
      api.text(ctx, 'Pieces available for “reef”     ef   /   re', 960, 838, 34, C.muted, 'center');
    api.text(
      ctx,
      ef >= 1
        ? 'Each observed piece contributes −ln p(piece | context).'
        : re >= 1
          ? 'The model now has “re” in its context.'
          : 'Which piece starts “reef” in this tokenizer?',
      960,
      925,
      43,
      C.ink,
      'center',
    );
    return;
  }
  const q = phraseProgress(state, 'objective-step', 3);
  const model = adaptationSnapshot(q);
  api.text(ctx, 'Two-outcome model', 200, 287, 34, C.muted);
  api.text(ctx, 'One score changes both predictions', 200, 374, 56, C.ink);
  api.focus.target('shared-odds', () => {
    wordShares(ctx, api, model.probabilities, 520);
    api.text(ctx, 'reef logit   ' + model.logit.toFixed(2), 200, 665, 36, C.cyan);
    api.text(ctx, 'tree logit   0.00', 1720, 665, 36, C.blue, 'right');
  });
  api.focus.target('observed-loss', () => {
    api.text(ctx, 'Loss on the observed word (nats)', 200, 790, 32, C.muted);
    api.text(ctx, 'Field note · reef', 200, 885, 36, C.cyan);
    api.text(ctx, 'Park note · tree', 1000, 885, 36, C.blue);
    api.text(
      ctx,
      '−ln(' + model.probabilities[0].toFixed(3) + ') ≈ ' + model.domainLoss.toFixed(3),
      200,
      970,
      47,
      C.ink,
    );
    api.text(
      ctx,
      '−ln(' + model.probabilities[1].toFixed(3) + ') ≈ ' + model.broadLoss.toFixed(3),
      1000,
      970,
      47,
      C.ink,
    );
  });
}

export default {
  id: 'objective',
  draw: drawObjective,
  cues: [
    'objective-prefix',
    'objective-re',
    'objective-ef',
    'objective-period',
    'objective-compare',
    'objective-step',
    'objective-loss',
  ],
};
