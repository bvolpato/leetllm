import { sampleModel } from '../construction.mjs';
import { card, text, transfer } from '../defaults.mjs';
export function drawLoader(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('loader', state),
    currentBeat = modelState.step;
  {
    const a = api.focus.target('loader-compatible-native-image', () =>
        card(
          ctx,
          api,
          'Compatible native image: ' + (modelState.native ? 'YES' : 'NO'),
          170,
          365,
          650,
          modelState.native ? themeColors.green : themeColors.muted,
        ),
      ),
      z = api.focus.target('loader-usable-ptx', () =>
        card(
          ctx,
          api,
          'Usable PTX: ' + (modelState.ptx ? 'YES' : 'NO'),
          1100,
          365,
          650,
          modelState.ptx ? themeColors.yellow : themeColors.muted,
        ),
      ),
      result = api.focus.target('loader-s-result', () =>
        card(
          ctx,
          api,
          modelState.result,
          550,
          560,
          820,
          modelState.result === 'MISSING IMAGE' ? themeColors.pink : themeColors.green,
          110,
          40,
        ),
      );
    transfer(ctx, api, a, result, modelState.native ? themeColors.green : themeColors.muted);
    transfer(ctx, api, z, result, modelState.ptx ? themeColors.yellow : themeColors.muted);
    if (modelState.result === 'JIT THEN LOAD')
      api.focus.target('loader-first-compile-work', () =>
        api.teaching.timeline({
          x: 180,
          y: 730,
          width: 1560,
          height: 170,
          domain: [0, 6],
          time: modelState.coldProgress * 6,
          lanes: [
            {
              id: 'cold',
              label: 'First request',
            },
          ],
          intervals: [
            {
              id: 'compile',
              label: 'compile PTX',
              lane: 'cold',
              start: 0,
              end: 4,
              color: themeColors.yellow,
            },
            {
              id: 'load',
              label: 'load image',
              lane: 'cold',
              start: 4,
              end: 5,
              color: themeColors.cyan,
            },
            {
              id: 'launch',
              label: 'first launch',
              lane: 'cold',
              start: 5,
              end: 6,
              color: themeColors.green,
            },
          ],
          labelWidth: 250,
          fontSize: 25,
          ticks: [0, 4, 5, 6],
          formatTime: (v) => String(v) + ' units',
        }),
      );
    text(
      ctx,
      api,
      modelState.result === 'JIT THEN LOAD'
        ? 'Cold path includes compilation and load'
        : modelState.result === 'LOAD NATIVE'
          ? 'Compatible image can be loaded directly'
          : 'Stop at the first failed compatibility boundary',
      960,
      965,
      31,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'loader',
  draw: drawLoader,
  cues: [
    'loader-native-path',
    'loader-ptx-path',
    'loader-first-request-work',
    'loader-missing-images',
  ],
};
