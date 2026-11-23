import { drawClampRuler } from '../clamp-picture.mjs';
import { sentence } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawSnapshots(ctx, scene, state, api) {
  return api.focus.target('tk-snapshots-trace', () => paintSnapshots(ctx, scene, state, api));
}
function paintSnapshots(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('snapshots', state);
  if (state.beat === 0) {
    const update = drawOriginalCard(
      ctx,
      api,
      'Trainer adapter v2',
      135,
      460,
      410,
      150,
      themeColors.yellow,
      36,
    );
    const train = api.focus.target('snapshots-training-checkpoint', () =>
      drawOriginalCard(ctx, api, 'Training checkpoint', 700, 270, 570, 125, themeColors.blue, 34),
    );
    const sample = drawOriginalCard(
      ctx,
      api,
      'Sampler snapshot',
      700,
      470,
      570,
      125,
      themeColors.green,
      34,
    );
    const merge = api.focus.target('snapshots-merged-hugging-face-model', () =>
      drawOriginalCard(
        ctx,
        api,
        'Merged Hugging Face model',
        700,
        670,
        570,
        125,
        themeColors.cyan,
        32,
      ),
    );
    api.connect(ctx, update, train, {
      color: themeColors.blue,
      gap: 12,
    });
    api.connect(ctx, update, sample, {
      color: themeColors.green,
      gap: 12,
    });
    api.connect(ctx, update, merge, {
      color: themeColors.cyan,
      gap: 12,
    });
    drawOriginalText(ctx, api, 'weights + optimizer state', 1350, 335, 29, themeColors.blue);
    drawOriginalText(ctx, api, 'adapter weights for evaluation', 1350, 535, 29, themeColors.green);
    drawOriginalText(
      ctx,
      api,
      'base + adapter for another runtime',
      1350,
      735,
      27,
      themeColors.cyan,
    );
    drawOriginalText(
      ctx,
      api,
      'Choose by the next consumer',
      960,
      930,
      36,
      themeColors.yellow,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      'Training resume · sampling · portable export',
      960,
      1000,
      28,
      themeColors.muted,
      'center',
    );
  } else if (state.beat === 1) {
    const saved = sentence(state, 'snapshots', 1, 1);
    const selected = sentence(state, 'snapshots', 1, 2);
    const { C, focus } = api;
    const oldX = 815;
    const newX = 1450;
    drawOriginalText(ctx, api, 'Saved sampler paths', 150, 315, 38, C.ink);
    drawOriginalCard(ctx, api, 'v1', oldX - 115, 245, 230, 108, C.cyan, 49);
    focus.target('snapshots-sampler-weights-v2', () => {
      drawOriginalCard(
        ctx,
        api,
        saved === 1 ? 'v2' : '·',
        newX - 115,
        245,
        230,
        108,
        saved === 1 ? C.green : C.muted,
        49,
      );
      if (saved > 0 && saved < 1)
        api.line(ctx, newX - 110, 375, newX - 110 + 220 * saved, 375, C.green, 6);
    });
    focus.target('snapshots-trainingclient', () => {
      drawOriginalText(ctx, api, 'Hosted trainer', 150, 510, 37, C.blue);
      drawOriginalText(ctx, api, 'adapter v2', newX, 510, 45, C.blue, 'center');
    });
    drawOriginalText(ctx, api, 'Opening sample', 150, 680, 37, C.cyan);
    api.line(ctx, oldX, 377, oldX, 611, C.cyan, 3);
    drawOriginalText(ctx, api, 'read v1', oldX, 680, 45, C.cyan, 'center');
    drawOriginalText(ctx, api, 'Fresh client', 150, 855, 37, C.green);
    if (selected > 0) {
      api.line(ctx, newX, 565, newX, 565 + 215 * selected, C.green, 4);
      drawOriginalText(
        ctx,
        api,
        selected === 1 ? 'reads v2' : 'selecting v2',
        newX,
        855,
        45,
        C.green,
        'center',
      );
    }
  } else {
    const { C, focus } = api;
    const { fixture, inner, result } = modelState;
    focus.target('snapshots-samplingclient-adapter-v2', () => {
      api.text(ctx, 'Local fixture   ·   sampler v2', 120, 239, 36, C.green);
    });
    if (modelState.responseVisible) {
      api.text(ctx, 'return min(max(x, lo), hi)', 1740, 245, 47, C.ink, 'right', 'mono');
    }
    const progress =
      state.cues?.['snapshots-outer-min']?.progress ?? (modelState.resultVisible ? 1 : 0);
    const working =
      modelState.innerVisible && !modelState.resultVisible
        ? {
            label: progress > 0 ? 'Apply min' : 'After max',
            value: inner + (result - inner) * progress,
          }
        : null;
    focus.target('snapshots-ruler', () =>
      drawClampRuler(ctx, api, {
        ...fixture,
        returned: modelState.resultVisible ? result : null,
        working,
      }),
    );
    if (modelState.innerVisible) {
      drawOriginalEquation(ctx, api, '\\max(3,0)=' + inner, 610, 784, 44, C.cyan);
    }
    focus.target('snapshots-clamp-result', () => {
      if (modelState.innerVisible) {
        drawOriginalEquation(
          ctx,
          api,
          '\\min(' + inner + ',2)=' + (modelState.resultVisible ? result : '?'),
          1310,
          784,
          44,
          C.green,
        );
      }
    });
    if (modelState.resultVisible) {
      focus.target('snapshots-local-verifier', () =>
        drawOriginalCard(
          ctx,
          api,
          modelState.graderVisible
            ? 'Local verifier · ' + result + ' = ' + fixture.expected + ' · PASS'
            : 'Local verifier · comparison pending',
          475,
          855,
          970,
          115,
          modelState.graderVisible ? C.green : C.muted,
          36,
        ),
      );
    }
  }
}
export default {
  id: 'snapshots',
  draw: drawSnapshots,
  cues: [
    'snapshots-beat-1-focus-1',
    'snapshots-beat-1-focus-2',
    'tk-snapshots-0-0',
    'tk-snapshots-0-1',
    'tk-snapshots-0-2',
    'tk-snapshots-0-3',
    'snapshots-beat-2-focus-1',
    'snapshots-beat-2-focus-2',
    'tk-snapshots-1-0',
    'tk-snapshots-1-1',
    'tk-snapshots-1-2',
    'snapshots-beat-3-focus-1',
    'snapshots-beat-3-focus-2',
    'tk-snapshots-2-0',
    'tk-snapshots-2-1',
    'tk-snapshots-2-2',
    'tk-snapshots-2-3',
    'tk-snapshots-2-4',
    'snapshots-inner-max',
    'snapshots-outer-min',
    'snapshots-compare',
  ],
};
