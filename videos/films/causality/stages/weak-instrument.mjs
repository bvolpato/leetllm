import { instrumentFixture } from '../model.mjs';
import { box, code, datum, focusProgress, footer, label } from '../defaults.mjs';
export function drawWeakInstrument(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const points = (v, d = 1) => Number((100 * v).toFixed(d)) + ' points',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-weak-instrument-mechanism', () => {
    const weak = done('iv-weak-input'),
      ready = done('iv-strong-input'),
      first = weak ? 0.04 : 0.4,
      f = instrumentFixture(first, 0.01),
      earned = weak ? done('iv-biased-second') : done('iv-biased-first');
    box(
      ctx,
      api,
      'Separate supplied worksheet',
      ['true effect τ=0.10', 'direct bypass δ=0.01'],
      180,
      310,
      1560,
      170,
      themeColors.yellow,
    );
    const x = 400,
      scale = 2500;
    label(ctx, api, 'Uptake change', 260, 590, themeColors.cyan, 29);
    if (ready) api.rect(ctx, x, 540, f.firstStage * scale, 75, themeColors.cyan, undefined, 7);
    code(ctx, api, ready ? num(f.firstStage) : '?', 1570, 590, 35, themeColors.cyan, 'center');
    label(ctx, api, 'Outcome change', 250, 760, themeColors.pink, 29);
    if (ready) {
      api.rect(ctx, x, 710, f.mediated * scale, 75, themeColors.panel, themeColors.cyan, 6);
      api.rect(
        ctx,
        x + f.mediated * scale,
        710,
        f.direct * scale,
        75,
        themeColors.red,
        undefined,
        4,
      );
    }
    code(
      ctx,
      api,
      earned ? num(f.outcomeDifference) : '?',
      1570,
      760,
      35,
      themeColors.pink,
      'center',
    );
    datum(ctx, api, 'Reported ratio ' + num(f.ratio), 960, 900, earned, themeColors.pink, 41);
    if (done('iv-bypass-bias'))
      code(
        ctx,
        api,
        'True ' + points(f.tau) + ' + bypass ' + points(f.bypassBias),
        960,
        955,
        29,
        themeColors.yellow,
        'center',
      );
    footer(
      ctx,
      api,
      'The same 1-point bypass is divided by a smaller uptake change. Exclusion remains invalid.',
    );
  });
}
export default {
  id: 'weak-instrument',
  draw: drawWeakInstrument,
  cues: [
    'cau-weak-instrument-0',
    'cau-weak-instrument-1',
    'cau-iv-strong-input',
    'cau-iv-biased-first',
    'cau-iv-weak-input',
    'cau-iv-biased-second',
    'cau-weak-instrument-2',
    'cau-iv-bypass-bias',
  ],
};
