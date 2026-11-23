import { phraseProgress, wordShares } from '../construction.mjs';
import { adaptationSnapshot } from '../model.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const opened = phraseProgress(state, 'intro-open', 1) >= 1;
  const park = phraseProgress(state, 'intro-park', 1, 0.25, 0.5) > 0;
  const model = adaptationSnapshot(phraseProgress(state, 'intro-update', 2));

  api.focus.target('field-note', () => {
    api.rect(ctx, 173, 218, 1560, 261, C.cyan, undefined, 20);
    api.rect(ctx, 160, 206, 1560, 261, C.ink, undefined, 20);
    for (const y of [252, 304, 356, 408]) {
      api.circle(ctx, 208, y, 13, C.bg);
      api.line(ctx, 141, y - 7, 208, y, C.muted, 11);
    }
    api.text(ctx, 'Diver’s field note', 272, 282, 34, C.panel);
    api.text(ctx, 'The tide rises near the', 272, 397, 72, C.bg, 'left', 'serif');
    const progress = Math.min(1, (state.t ?? 1) / 1.15);
    const tip = 1115 + 272 * progress;
    api.line(ctx, 1080, 419, tip, 419, C.bg, 5);
    if (opened) {
      api.text(ctx, 'reef.', 1235, 397, 72, C.bg, 'center', 'serif');
    } else {
      api.path(
        ctx,
        [
          { x: tip, y: 418 },
          { x: tip + 11, y: 382 },
          { x: tip + 32, y: 400 },
        ],
        { fill: C.panel, closed: true, width: 0 },
      );
      api.path(
        ctx,
        [
          { x: tip + 11, y: 382 },
          { x: tip + 107, y: 265 },
          { x: tip + 128, y: 283 },
          { x: tip + 32, y: 400 },
        ],
        { fill: C.yellow, color: C.panel, closed: true, width: 3 },
      );
    }
  });
  if (park)
    api.focus.target('park-note', () => {
      api.text(ctx, 'Park note', 200, 545, 32, C.blue);
      api.text(ctx, 'The robin nests in the tree.', 200, 620, 55, C.ink, 'left', 'serif');
    });
  api.focus.target('word-odds', () => {
    wordShares(ctx, api, model.probabilities, 739);
    if (state.beat >= 2) {
      api.text(ctx, 'Scores before normalization', 200, 974, 30, C.muted);
      api.text(ctx, 'reef   ' + model.logit.toFixed(2), 800, 974, 42, C.cyan);
      api.text(ctx, 'tree   0.00', 1290, 974, 42, C.blue);
    } else if (park) {
      api.text(
        ctx,
        'Turn the reef score up. What happens to tree’s share?',
        960,
        970,
        38,
        C.ink,
        'center',
      );
    } else if (!opened) {
      api.text(ctx, 'Which word did the diver write?', 960, 970, 44, C.ink, 'center');
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-odds', 'intro-open', 'intro-park', 'intro-update'],
};
