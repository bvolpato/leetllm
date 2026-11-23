import { mix, ramp, unit } from '../arithmetic.mjs';
import { functionFrame } from '../model.mjs';
import { cueProgress } from '../construction.mjs';
import { code, footer, mark, rail, text } from '../defaults.mjs';
export function drawFunctions(ctx, scene, state, api) {
  const modelState = functionFrame(state),
    currentBeat = modelState.beat,
    bind = ramp(state.beatP ?? 0, 0.05, 0.4);
  const expected = currentBeat === 0 ? 'blocked' : 'approved',
    prediction = currentBeat === 0 ? 'escalated' : currentBeat === 1 ? ' APPROVED ' : 7;
  mark(api, 'function-body', () =>
    code(
      ctx,
      api,
      [
        'def exact_match(expected: str, prediction: str) -> bool:',
        '    expected = expected.strip().lower()',
        '    prediction = prediction.strip().lower()',
        '    return prediction == expected',
      ],
      170,
      330,
      35,
      80,
      modelState.returned > 0 ? (currentBeat === 2 ? 2 : 3) : 0,
    ),
  );
  mark(api, 'function-call', () => {
    text(ctx, api, 'Caller arguments → local parameter names', 960, 630, 29, api.C.muted, 'center');
    const args = [JSON.stringify(expected), JSON.stringify(prediction)];
    args.forEach((v, i) => {
      const x = mix(210 + i * 840, 240 + i * 800, bind),
        y = mix(810, 670, bind);
      rail(ctx, api, x, y, 500, v, i === 0 ? api.C.blue : api.C.cyan, 80, 32);
    });
    const call =
      'exact_match(' + JSON.stringify(expected) + ', ' + JSON.stringify(prediction) + ')';
    text(ctx, api, call, 170, 930, 35, api.C.ink, 'left', true);
  });
  mark(api, 'function-return', () => {
    if (modelState.value === 'AttributeError') {
      text(ctx, api, "AttributeError: 'int' object", 170, 830, 33, api.C.pink, 'left', true);
      text(ctx, api, "has no attribute 'strip'", 170, 880, 33, api.C.pink, 'left', true);
    } else if (currentBeat === 2) {
      if (cueProgress(state, 'method-lookup', 2, 0.24, 0.42) > 0) {
        text(ctx, api, 'Looking up prediction.strip', 1750, 930, 37, api.C.yellow, 'right', true);
      }
    } else {
      const cue = state.cues?.[currentBeat === 0 ? 'return-false' : 'return-true'];
      const travel = modelState.value === null ? 0 : cue ? unit((state.t - cue.end) / 0.8) : 1;
      const x = modelState.value === null ? 1650 : mix(1760, 1650, ramp(travel, 0.6, 1));
      const y = modelState.value === null ? 955 : mix(600, 955, travel);
      text(
        ctx,
        api,
        modelState.value === null ? 'return = ?' : modelState.value ? 'True' : 'False',
        x,
        y,
        54,
        modelState.value === null ? api.C.muted : modelState.value ? api.C.green : api.C.pink,
        'center',
        true,
      );
    }
  });
  if (currentBeat === 2)
    footer(
      ctx,
      api,
      'Method lookup on the integer comes before the call.',
    );
}
export default {
  id: 'functions',
  draw: drawFunctions,
  cues: ['return-false', 'return-true', 'method-lookup', 'method-error'],
};
