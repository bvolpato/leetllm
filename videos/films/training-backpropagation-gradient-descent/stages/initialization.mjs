import { sampleModel } from '../model.mjs';
import {
  drawTrainingDot,
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  formatTrainingNumber,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintInitialization(ctx, scene, state, api, C, c, b, s) {
  drawTrainingText(
    ctx,
    api,
    C,
    '256 independent, centered inputs · input variance 1',
    960,
    285,
    33,
    C.ink,
    'center',
  );
  withTrainingFocus(ctx, api, 'variance-sum', () => {
    for (let i = 0; i < 16; i++) {
      const count = Math.max(0, Math.min(16, s.count - i * 16)),
        x = 160 + (i % 4) * 150,
        y = 390 + Math.floor(i / 4) * 100;
      drawTrainingPanel(ctx, api, C, c, x, y, 120, 70, count ? C.cyan : C.muted, () =>
        drawTrainingText(
          ctx,
          api,
          C,
          formatTrainingNumber(ctx, api, count * s.weightVariance),
          x + 60,
          y + 46,
          27,
          count ? C.cyan : C.muted,
          'center',
        ),
      );
    }
    drawTrainingText(ctx, api, C, '16 inputs per tile', 440, 850, 29, C.muted, 'center');
  });
  withTrainingFocus(ctx, api, 'initial-weight-rule', () => {
    const rule =
      b === 0
        ? String.raw`\operatorname{Var}(w)=` + formatTrainingNumber(ctx, api, s.weightVariance, 6)
        : b === 1
          ? String.raw`\operatorname{Var}(w)_{\rm Xavier}=\frac{2}{256+256}`
          : s.he >= 1
            ? String.raw`\operatorname{Var}(w)_{\rm He}=\frac2{256}`
            : s.he > 0
              ? String.raw`\operatorname{Var}(w)=\frac{${formatTrainingNumber(ctx, api, s.weightVariance * 256, 2)}}{256}`
              : String.raw`\operatorname{Var}(w)_{\rm Xavier}=\frac1{256}`;
    drawTrainingMath(ctx, api, C, rule, 440, 970, 36, C.yellow);
  });
  const full = (value, limit, left = 910, width = 840) =>
    left + (width * (value + limit)) / (2 * limit);
  const axis = (y, limit, title) => {
    drawTrainingLine(ctx, api, C, 910, y, 1750, y);
    [-limit, 0, limit].forEach((v) => {
      const x = full(v, limit);
      drawTrainingLine(ctx, api, C, x, y - 8, x, y + 8);
      drawTrainingText(ctx, api, C, v, x, y + 45, 24, C.muted, 'center');
    });
    drawTrainingText(ctx, api, C, title, 1330, y - 125, 28, C.muted, 'center');
  };
  withTrainingFocus(ctx, api, 'initialization-signal', () => {
    axis(475, 32, 'Preactivation · fixed wide scale');
    s.inputs.forEach((value, i) =>
      drawTrainingDot(ctx, api, C, full(value, 32), 410 + (i % 4) * 14, C.cyan, 5),
    );
    axis(810, 3, 'Center detail · fixed scale −3 to 3');
    s.inputs.forEach((value, i) => {
      if (Math.abs(value) <= 3)
        drawTrainingDot(ctx, api, C, full(value, 3), 740 + (i % 4) * 14, C.cyan, 5);
      if (b === 2 && Math.abs(s.outputs[i]) <= 3)
        drawTrainingDot(ctx, api, C, full(s.outputs[i], 3), 920 + (i % 4) * 14, C.green, 6);
    });
  });
  withTrainingFocus(ctx, api, 'initialization-moment', () => {
    drawTrainingText(
      ctx,
      api,
      C,
      `Preactivation variance · ${formatTrainingNumber(ctx, api, s.preactivationVariance)}`,
      1330,
      590,
      32,
      C.cyan,
      'center',
    );
    if (b === 2)
      drawTrainingText(
        ctx,
        api,
        C,
        `After ReLU · second moment ${formatTrainingNumber(ctx, api, s.outputSecondMoment)}`,
        1330,
        1030,
        31,
        C.green,
        'center',
      );
  });
  return;
}
export function drawInitializationStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintInitialization(ctx, scene, state, api, C, c, b, s);
}
export default {
  id: 'initialization',
  draw: drawInitializationStage,
  cues: [
    'init-sum',
    'init-scale',
    'init-xavier',
    'init-relu',
    'init-he',
    'init-he-points',
    'init-moment',
  ],
};
