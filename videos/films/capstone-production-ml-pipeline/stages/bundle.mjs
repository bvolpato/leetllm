import { sampleModel } from '../construction.mjs';
import { probeRelease } from '../model.mjs';
import { legacyCard, line, panel } from '../defaults.mjs';
export function drawBundle(ctx, scene, state, api) {
  if (drawBundlePackage(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('bundle', state);
  {
    const fields = [
      'Input schema',
      'Center 5 · range 10',
      'Slope 1.2 · intercept 0.5',
      'Threshold 0.5',
    ];
    fields.forEach((v, i) =>
      api.focus.target(
        ['schema-field', 'transform-field', 'coefficient-field', 'threshold-field'][i],
        () =>
          legacyCard(
            ctx,
            api,
            v,
            170,
            340 + i * 150,
            660,
            i === 1 ? themeColors.yellow : themeColors.blue,
          ),
      ),
    );
    const saved = api.focus.target('saved-package', () =>
      legacyCard(ctx, api, 'Retained model package', 1120, 450, 600, themeColors.cyan, 130),
    );
    const restoredDecisions = [9, 8, 1, 0].map((delay) =>
      Number(probeRelease('v1', delay).warning),
    );
    const output = api.focus.target('reloaded-decisions', () =>
      legacyCard(
        ctx,
        api,
        'Reload: [' + restoredDecisions.join(', ') + ']',
        1120,
        730,
        600,
        themeColors.green,
        130,
      ),
    );
    teaching.transfer({
      source: {
        shape: saved,
        opacity: 1,
      },
      target: {
        shape: output,
        opacity: 1,
      },
      color: themeColors.green,
      progress: modelState.p,
      particle: {
        radius: 8,
        fill: themeColors.yellow,
      },
    });
  }
}
function drawBundlePackage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  if (currentBeat < 2) return false;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    const names = [
      'Data snapshot',
      'Fitted preprocessing',
      'Model weights',
      'Action threshold',
      'Promotion policy',
      'Monitor',
      'Previous release',
    ];
    names.forEach((v, i) => {
      const x = 145 + (i % 4) * 440,
        yy = 350 + Math.floor(i / 4) * 240;
      paper(
        v,
        [
          i === 3
            ? '0.5 inclusive warning'
            : i === 6
              ? 'Retained v0'
              : i === 4
                ? 'P1 · recall / cost'
                : i === 5
                  ? 'Fast + delayed checks'
                  : 'Retained compatible bytes',
        ],
        x,
        yy,
        400,
        i === 3 ? themeColors.yellow : themeColors.blue,
      );
    });
    drawText(
      resultComplete('trained-cost-receipt')
        ? 'Trained offline cost: 2 + 2 + 0 + 0 = 4     Silent baseline: 25 + 25 = 50'
        : 'Offline cost comparison pending',
      960,
      945,
      30,
      resultComplete('trained-cost-receipt') ? themeColors.green : themeColors.muted,
      'center',
    );
    footer(
      'Assumed units on four separable synthetic rows; no measured savings or generalization claim',
    );
  }
  return true;
}
export default {
  id: 'bundle',
  draw: drawBundle,
  cues: [
    'bundle-b1-1',
    'bundle-b1-2',
    'bundle-b1-3',
    'bundle-b2-1',
    'bundle-b2-2',
    'bundle-b2-3',
    'bundle-extension-3',
    'pipe-result-trained-cost-receipt',
  ],
};
