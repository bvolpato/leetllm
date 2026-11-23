import { sampleModel } from '../construction.mjs';
import { bar, labelText, rectangle } from '../defaults.mjs';
import { projection } from '../model.mjs';
import { roundedOverflow } from '../encoding.mjs';

const selector = projection(true);
const examples = [449, 465].map((input) => roundedOverflow(input));
export function drawReferenceLadder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('reference-ladder', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  api.focus.target('lp-reference-ladder-trace', () => {
    const names = ['Original operands', 'Reconstructed operands', 'Selected GPU kernel'],
      values = [selector.original.at(-1), selector.reconstructed.at(-1), null];
    names.forEach((name, i) => {
      const y = 365 + i * 210;
      if (currentBeat === 1 && i === 2) return;
      labelText(ctx, api, name, 160, y + 35, 30, i === 2 ? themeColors.muted : themeColors.blue);
      if (i < 2) {
        bar(
          ctx,
          api,
          650,
          y - 15,
          870,
          65,
          values[i] / 550,
          i ? themeColors.cyan : themeColors.blue,
        );
        labelText(
          ctx,
          api,
          String(values[i]),
          1680,
          y + 35,
          40,
          i ? themeColors.cyan : themeColors.blue,
          'right',
        );
      } else {
        rectangle(ctx, api, 650, y - 15, 870, 85, themeColors.muted);
        labelText(
          ctx,
          api,
          'Compare the measured output here',
          1085,
          y + 38,
          31,
          themeColors.muted,
          'center',
        );
      }
    });
    labelText(
      ctx,
      api,
      currentBeat === 0
        ? 'Same spike selector · input reconstruction already changes the reference'
        : 'Inspect before/after values, selected scales and the launched operation',
      960,
      1005,
      29,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 1) {
      examples.forEach(({ input, rounded, result, overflow }, i) => {
        const v = overflow ? [input, rounded, result].join(' → ') : [input, result].join(' → ');
        const n = overflow ? 'rounded overflow confirmed' : 'rounded into range';
        rectangle(ctx, api, 640 + i * 520, 670, 490, 150, i ? themeColors.pink : themeColors.green);
        labelText(
          ctx,
          api,
          v,
          885 + i * 520,
          725,
          25,
          i ? themeColors.pink : themeColors.green,
          'center',
        );
        labelText(ctx, api, n, 885 + i * 520, 785, 22, themeColors.muted, 'center');
      });
      labelText(
        ctx,
        api,
        'Record the scaled input and where it rounded',
        960,
        925,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'reference-ladder',
  draw: drawReferenceLadder,
  cues: ['lp-reference-ladder-build-0', 'lp-reference-ladder-build-1'],
};
