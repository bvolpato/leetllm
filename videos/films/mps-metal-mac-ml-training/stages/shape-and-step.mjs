import { fixed } from '../arithmetic.mjs';
import { trained } from '../model.mjs';
import {
  extensionCode,
  foot,
  math,
  panel,
  target,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintShapeAndStep(ctx, scene, state, api, C, c, t, s, id) {
  if (s.step === 0) {
    const labels = [0, 2, 1, 0];
    text(
      ctx,
      api,
      C,
      'Synthetic float32 features · four tickets with class labels',
      960,
      275,
      35,
      C.cyan,
      'center',
    );
    for (let i = 3; i >= 0; i--) {
      const x = 180 + i * 17,
        y = 370 - i * 16;
      t.grid({
        x,
        y,
        width: 510,
        height: 270,
        rows: 8,
        columns: 16,
        labels: Array.from(
          {
            length: 8,
          },
          () => Array(16).fill(''),
        ),
        fill: C.panel,
        stroke: i === 0 ? C.blue : C.muted,
        lineWidth: 1,
      });
    }
    extensionCode(ctx, api, C, '4 × 8 × 16', 445, 730, 36, C.blue);
    target(ctx, api, 'mps-contract-shapes', () => {
      api.arrow(ctx, 760, 495, 850, 495, C.yellow, 6);
      text(ctx, api, C, 'mean positions', 815, 665, 26, C.yellow, 'center');
      t.grid({
        x: 900,
        y: 370,
        width: 360,
        height: 270,
        rows: 4,
        columns: 16,
        labels: Array.from(
          {
            length: 4,
          },
          () => Array(16).fill(''),
        ),
        fill: C.panel,
        stroke: s.pooled ? C.cyan : C.muted,
      });
      extensionCode(
        ctx,
        api,
        C,
        s.pooled ? '4 × 16' : 'pooled shape?',
        1080,
        730,
        36,
        s.pooled ? C.cyan : C.yellow,
      );
      api.arrow(ctx, 1290, 495, 1385, 495, C.yellow, 6);
      t.grid({
        x: 1420,
        y: 370,
        width: 270,
        height: 270,
        rows: 4,
        columns: 3,
        labels: Array.from(
          {
            length: 4,
          },
          () => Array(3).fill(''),
        ),
        fill: C.panel,
        stroke: s.logits ? C.green : C.muted,
      });
      extensionCode(
        ctx,
        api,
        C,
        s.logits ? '4 × 3' : 'logits?',
        1555,
        730,
        36,
        s.logits ? C.green : C.yellow,
      );
      labels.forEach((v, i) =>
        extensionCode(ctx, api, C, 'y=' + v, 1760, 415 + i * 67, 27, C.yellow),
      );
    });
    target(ctx, api, 'mps-contract-bytes', () =>
      math(
        ctx,
        api,
        C,
        s.bytes
          ? '4\\times8\\times16\\times4=2048\\ \\mathrm{bytes}=2\\ \\mathrm{KiB}'
          : '\\text{Raw input bytes}=?',
        960,
        900,
        47,
        s.bytes ? C.green : C.yellow,
      ),
    );
  } else if (s.step === 1) {
    text(
      ctx,
      api,
      C,
      'Keep backward and parameter mutation separate',
      960,
      275,
      38,
      C.ink,
      'center',
    );
    t.grid({
      x: 230,
      y: 365,
      width: 570,
      height: 220,
      rows: 4,
      columns: 3,
      labels: trained.probabilities.map((r) => r.map((v) => v.toFixed(3))),
      fill: C.panel,
      stroke: C.cyan,
      fontSize: 34,
    });
    [0, 2, 1, 0].forEach((v, i) =>
      extensionCode(ctx, api, C, 'y=' + v, 875, 410 + i * 54, 29, C.yellow),
    );
    text(
      ctx,
      api,
      C,
      'Original probabilities · supplied film batch',
      515,
      660,
      26,
      C.muted,
      'center',
    );
    target(ctx, api, 'mps-contract-buffers', () => {
      panel(ctx, api, C, c, 1040, 350, 650, 405, C.blue);
      extensionCode(
        ctx,
        api,
        C,
        'W[0,0] = ' +
          fixed(s.updated ? trained.firstWeightUpdate.after : trained.firstWeightUpdate.before),
        1365,
        425,
        35,
        s.updated ? C.green : C.blue,
      );
      extensionCode(
        ctx,
        api,
        C,
        s.grad ? 'grad = ' + fixed(trained.firstWeightUpdate.gradient) : 'grad = None',
        1365,
        535,
        35,
        s.grad ? C.yellow : C.muted,
      );
      text(
        ctx,
        api,
        C,
        s.updated
          ? 'SGD applied · η=0.1'
          : s.grad
            ? 'Backward filled grad · W unchanged'
            : 'Loss exists · no update yet',
        1365,
        650,
        29,
        s.updated ? C.green : C.yellow,
        'center',
      );
    });
    math(ctx, api, C, 'L_{before}=' + fixed(trained.loss), 510, 815, 48, C.cyan);
    extensionCode(
      ctx,
      api,
      C,
      'cross_entropy → backward → optimizer.step()',
      960,
      930,
      32,
      C.yellow,
    );
  } else {
    panel(ctx, api, C, c, 270, 350, 1380, 430, C.green);
    text(
      ctx,
      api,
      C,
      'Repeat the four-ticket check on the target Mac',
      960,
      425,
      42,
      C.green,
      'center',
    );
    [
      ['Article output', 'four rows, changed weights, finite pre-update loss'],
      ['Mac inputs and labels', 'match the parameter device'],
      ['Record with the result', 'shape, dtype, device, PyTorch version'],
    ].forEach(([a, b], i) => {
      text(ctx, api, C, a, 340, 530 + i * 95, 31, C.cyan);
      text(ctx, api, C, b, 1580, 530 + i * 95, 31, i === 2 ? C.yellow : C.green, 'right');
    });
    text(
      ctx,
      api,
      C,
      'Run through the optimizer step before comparing performance',
      960,
      920,
      36,
      C.yellow,
      'center',
    );
  }
  foot(
    ctx,
    api,
    C,
    'Test routing quality with held-out tickets',
  );
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintShapeAndStep);
}
export function drawShapeAndStepStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'shape-and-step',
  draw: drawShapeAndStepStage,
  cues: [
    'shape-and-step-b1',
    'mps-contract-pool',
    'mps-contract-logits',
    'mps-contract-bytes',
    'shape-and-step-b2',
    'mps-contract-grad',
    'mps-contract-step',
    'shape-and-step-b3',
  ],
};
