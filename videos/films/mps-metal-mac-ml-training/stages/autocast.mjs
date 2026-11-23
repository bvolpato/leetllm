import {
  advancedCode,
  card,
  foot,
  panel,
  target,
  text,
  withMpsAdvancedFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintAutocast(ctx, scene, state, api, C, c, t, s) {
  if (s.step === 0) {
    text(
      ctx,
      api,
      C,
      'Keep a float32 reference for this ticket task',
      960,
      300,
      41,
      C.cyan,
      'center',
    );
    target(ctx, api, 'autocast-check', () => {
      card(ctx, api, C, c, 'Probe the installed MPS build', 390, 420, 1140, 150, C.yellow, 43);
      advancedCode(ctx, api, C, 'is_autocast_available("mps")', 960, 650, 43, C.yellow);
    });
    target(ctx, api, 'autocast-route', () =>
      card(ctx, api, C, c, 'Unavailable → keep the float32 path', 360, 815, 1200, 115, C.blue, 41),
    );
    foot(ctx, api, C, 'The runtime probe determines whether this experiment can start');
  } else if (s.step === 1) {
    text(
      ctx,
      api,
      C,
      'Assume the probe succeeds for this illustration',
      960,
      270,
      36,
      C.green,
      'center',
    );
    target(ctx, api, 'master-dtype', () =>
      card(ctx, api, C, c, 'Model parameters + input · float32', 300, 345, 1320, 95, C.cyan, 39),
    );
    target(ctx, api, 'autocast-region', () => {
      panel(ctx, api, C, c, 230, 510, 1460, 270, C.yellow);
      text(ctx, api, C, 'autocast scope · forward + loss', 960, 565, 36, C.yellow, 'center');
      card(
        ctx,
        api,
        C,
        c,
        'matrix product · float16',
        350,
        625,
        500,
        100,
        s.operationProgress < 0.5 ? C.yellow : C.cyan,
        30,
      );
      card(
        ctx,
        api,
        C,
        c,
        'loss · float32',
        1070,
        625,
        500,
        100,
        s.operationProgress >= 0.5 ? C.yellow : C.green,
        34,
      );
      api.arrow(ctx, 875, 675, 1045, 675, C.yellow, 6);
    });
    target(ctx, api, 'outside-autocast', () =>
      text(
        ctx,
        api,
        C,
        'backward + optimizer · outside this scope',
        960,
        900,
        38,
        C.cyan,
        'center',
      ),
    );
    foot(ctx, api, C, 'Illustrative operation policy · inspect actual output dtypes on this build');
  } else {
    const x = (bp) => 310 + (bp - 9000) * 1.6;
    const percent = (bp) => bp / 100 + '%';
    text(ctx, api, C, 'Suppose these are the held-out accuracies', 960, 280, 42, C.ink, 'center');
    text(ctx, api, C, 'Same tickets  /  assume finite loss for each run', 960, 350, 31, C.muted, 'center');
    target(ctx, api, 'quality-validation', () => {
      const low = s.referenceBp - s.toleranceBp;
      const high = s.referenceBp + s.toleranceBp;
      if (s.bandReady) {
        api.rect(ctx, x(low), 508, x(high) - x(low), 67, C.panel, C.green, 4);
        text(ctx, api, C, 'within 1 point', x(s.referenceBp), 553, 29, C.green, 'center');
      }
      api.line(ctx, x(9000), 622, x(9800), 622, C.muted, 3);
      for (let i = 90; i <= 98; i++) {
        const xx = x(i * 100);
        api.line(ctx, xx, 613, xx, 636, C.muted, 3);
        text(ctx, api, C, String(i), xx, 689, 27, C.muted, 'center');
      }
      if (s.referenceReady) {
        text(ctx, api, C, 'float32   ' + percent(s.referenceBp), x(s.referenceBp), 446, 35, C.cyan, 'center');
        api.line(ctx, x(s.referenceBp), 582, x(s.referenceBp), 626, C.cyan, 6);
      }
      if (s.validationReady) {
        const color = !s.qualityReady ? C.yellow : s.validation.accepted ? C.green : C.pink;
        api.line(ctx, x(s.candidateBp), 599, x(s.candidateBp), 650, color, 7);
        text(
          ctx,
          api,
          C,
          (s.edge ? 'second configuration   ' : 'autocast   ') + percent(s.candidateBp),
          x(s.candidateBp),
          762,
          35,
          color,
          'center',
        );
      }
      text(
        ctx,
        api,
        C,
        s.qualityReady
          ? s.validation.accepted ? 'Measure completed step time and peak memory' : 'Keep float32 for this classifier'
          : s.edge ? 'Does this reach the band?' : 'Would you keep the precision change?',
        960,
        912,
        48,
        s.qualityReady ? C.cyan : C.yellow,
        'center',
      );
    });
  }
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsAdvancedFrame(ctx, scene, state, api, C, c, s, paintAutocast);
}
export function drawAutocastStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'autocast',
  draw: drawAutocastStage,
  cues: ['probe-autocast', 'mixed-operations', 'backward-scope', 'reference-accuracy', 'accuracy-band', 'quality-comparison', 'autocast-verdict', 'edge-candidate', 'edge-verdict'],
};
