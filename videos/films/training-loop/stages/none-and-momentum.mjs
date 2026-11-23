import { loopMomentum } from '../arithmetic.mjs';
import { box, footer, text } from '../defaults.mjs';
import { finished } from '../scene-clock.mjs';

const rate = 0.1;
const coefficient = 0.9;
const first = loopMomentum(0, 1, coefficient, rate, 1);

export function drawNoneAndMomentum(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('none-and-momentum-mechanism', () => {
    if (state.beat === 0) {
      text(ctx, api, 'One training iteration', 960, 295, 47, C.ink, 'center');
      box(ctx, api, 'forward', 240, 433, 555, 120, C.blue, 44);
      api.arrow(ctx, 825, 493, 1070, 493, C.muted, 5);
      box(ctx, api, 'backward', 1110, 433, 555, 120, C.yellow, 44);
      text(ctx, api, 'BatchNorm can update its running statistics', 520, 677, 35, C.blue, 'center');
      text(ctx, api, 'Add derivatives to .grad', 1390, 677, 35, C.yellow, 'center');
      footer(ctx, api, 'Clear .grad before the backward pass for a fresh update.');
      return;
    }
    text(
      ctx,
      api,
      'SGD    ·    learning rate 0.1    ·    momentum coefficient 0.9',
      960,
      291,
      40,
      C.ink,
      'center',
    );
    const skipped = finished(state, 'loop-missing-gradient', 2, 0.2);
    const moved = finished(state, 'loop-zero-gradient', 2, 0.8);
    const decayed = finished(state, 'momentum-decayed', 2, 0.52);
    const saved = finished(state, 'momentum-saved', 1, 0.64);
    const stepCue = state.cues?.['momentum-first-step'];
    const firstStep = stepCue ? stepCue.phase !== 'before' : state.beat > 1 || state.beatP >= 0.36;
    if (!saved) {
      text(
        ctx,
        api,
        firstStep ? 'First step' : 'Clear the gradient field',
        960,
        464,
        48,
        C.ink,
        'center',
      );
      text(
        ctx,
        api,
        firstStep ? 'weight  1       gradient  1' : 'parameter.grad = None',
        960,
        620,
        64,
        C.cyan,
        'center',
      );
      return;
    }
    text(
      ctx,
      api,
      'After one step:  weight ' + first.weight.toFixed(1) + '    ·    momentum ' + first.buffer,
      960,
      400,
      48,
      C.ink,
      'center',
    );
    for (const [i, gradient] of [null, 0].entries()) {
      const center = i ? 1390 : 530;
      const color = i ? C.pink : C.cyan;
      const known = i ? moved : skipped;
      const next = loopMomentum(first.buffer, gradient, coefficient, rate, first.weight);
      text(ctx, api, i ? '.grad = 0' : '.grad = None', center, 555, 53, color, 'center');
      api.line(ctx, center - 305, 595, center + 305, 595, color, 4);
      text(
        ctx,
        api,
        known ? 'weight  ' + next.weight.toFixed(2) : 'next weight  ?',
        center,
        713,
        62,
        C.ink,
        'center',
      );
      if (i ? decayed : skipped)
        text(ctx, api, 'momentum  ' + next.buffer, center, 806, 39, color, 'center');
    }
    footer(
      ctx,
      api,
      moved
        ? 'SGD reads the saved momentum whenever this parameter has a gradient.'
        : 'Which copy moves on the next optimizer step?',
    );
  });
}

export default {
  id: 'none-and-momentum',
  draw: drawNoneAndMomentum,
  cues: [
    'none-and-momentum-beat-0',
    'none-and-momentum-beat-1',
    'momentum-first-step',
    'momentum-saved',
    'none-and-momentum-beat-2',
    'loop-missing-gradient',
    'momentum-decayed',
    'loop-zero-gradient',
  ],
};
