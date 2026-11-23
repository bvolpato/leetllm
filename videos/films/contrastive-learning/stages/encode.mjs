import { evaluate } from '../arithmetic.mjs';
import { originalCircle, originalMath, originalText } from '../defaults.mjs';
export function drawEncode(ctx, scene, state, api) {
  const { C: themeColors } = api;
  evaluate();
  const colors = [themeColors.green, themeColors.pink, themeColors.blue],
    names = ['a puppy runs', 'a dog sleeps', 'the sky is blue'];
  {
    originalCircle(ctx, api, colors);
    originalText(ctx, api, 'anchor', 1410, 350, 36, themeColors.yellow, 'center');
    names.forEach((s, i) =>
      originalText(ctx, api, s, 1410, 490 + i * 150, 34, colors[i], 'center'),
    );
    api.focus.target('unit-vector-contract', () =>
      originalMath(ctx, api, String.raw`\|q\|=\|d_i\|=1`, 1410, 950, 44, themeColors.ink, 'center'),
    );
  }
}
export default {
  id: 'encode',
  draw: drawEncode,
  cues: [
    'encode-candidate-vector-3-b1-1',
    'encode-candidate-vector-0-b2-1',
    'encode-unit-vector-contract-b2-2',
    'encode-candidate-vector-3-b3-1',
  ],
};
