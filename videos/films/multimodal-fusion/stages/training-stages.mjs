import { cue } from '../arithmetic.mjs';
import { drawExpandedArrow, drawExpandedCells } from '../defaults.mjs';

function recipeComparison(ctx, api, second) {
  const { C } = api;
  api.text(ctx, 'Training examples', 165, 340, 38, C.ink);
  api.text(ctx, 'Caption pairs', 165, 510, 48, C.ink);
  api.text(ctx, 'Visual instructions', 165, 675, 48, C.ink);
  for (const [x, version, captions, instructions] of [
    [945, 'LLaVA (2023)', '595,000', '158,000'],
    [1510, 'LLaVA-1.5', '558,000', '665,000'],
  ]) {
    if (version === 'LLaVA-1.5' && !second) continue;
    api.text(ctx, version, x, 340, 48, C.ink, 'center');
    api.text(ctx, captions, x, 510, 67, C.cyan, 'center');
    api.text(ctx, instructions, x, 675, 67, C.green, 'center');
  }
  if (second) {
    api.text(
      ctx,
      'LLaVA-1.5   ·   336 px CLIP encoder   ·   MLP projector',
      960,
      860,
      38,
      C.ink,
      'center',
    );
    api.text(
      ctx,
      'Reported training time: about one day on 8 A100 GPUs',
      960,
      940,
      34,
      C.muted,
      'center',
    );
  }
}

export function drawTrainingStages(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  if (beat === 2) {
    focus.target('mm-training-stages-construction', () =>
      recipeComparison(ctx, api, cue(state, 'mm-training-stages-2', 2, 0.25, 0.42) > 0),
    );
    return;
  }
  const first = beat === 0;
  const target = first
    ? cue(state, 'training-caption-target', 0, 0.15, 0.27)
    : cue(state, 'training-answer-target', 1, 0.2, 0.33);
  const gradient = first
    ? cue(state, 'mm-training-stages-0', 0, 0.32, 0.62)
    : cue(state, 'mm-training-stages-1', 1, 0.45, 0.65);

  focus.target('training-example', () => {
    api.rect(ctx, 200, 237, 270, 105, C.red, undefined, 16);
    for (let i = 0; i < 4; i++) api.rect(ctx, 218 + 61 * i, 251, 48, 40, C.panel, undefined, 5);
    for (const x of [252, 412]) api.circle(ctx, x, 342, 21, C.bg, C.ink, 5);
    api.text(ctx, first ? 'Caption' : 'Question', 580, 245, 32, C.muted);
    api.text(ctx, first ? 'a red' : 'What color is the bus?', 580, 326, 56, C.ink);
    if (first) api.line(ctx, 732, 329, 868, 329, C.muted, 4);
    if (target === 1) {
      api.text(ctx, first ? 'Target word' : 'Target answer', 1410, 245, 32, C.muted);
      api.text(ctx, first ? 'bus' : 'red', 1410, 326, 64, first ? C.cyan : C.red);
    }
  });

  focus.target('mm-training-stages-construction', () => {
    const centers = [340, 940, 1540];
    ['Vision encoder', 'Projector', 'Language model'].forEach((name, i) => {
      const x = centers[i];
      const trainable = i === 1 || (!first && i === 2);
      const color = trainable ? C.green : C.blue;
      api.text(ctx, name, x, 452, 38, C.ink, 'center');
      drawExpandedCells(ctx, api, x - 96, 490, 6, 4, 32, color);
      api.text(ctx, trainable ? 'Weights train' : 'Weights frozen', x, 692, 35, color, 'center');
    });
    drawExpandedArrow(ctx, api, 465, 553, 815, 553, C.cyan);
    drawExpandedArrow(ctx, api, 1065, 553, 1415, 553, C.cyan);
    if (gradient > 0) {
      const x = centers[2] - (centers[2] - centers[1]) * gradient;
      drawExpandedArrow(ctx, api, centers[2], 779, centers[1], 779, C.yellow, gradient);
      if (gradient < 1) api.circle(ctx, x, 779, 10, C.yellow);
      api.text(
        ctx,
        first ? 'Gradient from the caption' : 'Gradient from the answer',
        1240,
        858,
        36,
        C.yellow,
        'center',
      );
    }
    api.text(
      ctx,
      first ? 'Stage 1   ·   595,000 caption pairs' : 'Stage 2   ·   158,000 visual instructions',
      960,
      996,
      37,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'training-stages',
  draw: drawTrainingStages,
  cues: [
    'training-caption-target',
    'mm-training-stages-0',
    'training-answer-target',
    'mm-training-stages-1',
    'mm-training-stages-2',
  ],
};
