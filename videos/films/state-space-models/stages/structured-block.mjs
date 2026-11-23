import { arrow, box, cueDone, cueMotion, extensionText, footer } from '../defaults.mjs';
export function drawStructuredBlock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = Math.max(0, (state.beat ?? 0) - 1);
  const progress = api.clamp(state.beatP ?? 0);
  const cueProgress = (id) => (state.cues ? (state.cues[id]?.progress ?? 0) : progress);
  const resultComplete = (id) =>
    state.cues ? state.cues[id]?.phase === 'after' : progress >= 0.98;
  const build = (id) => (resultComplete(id) ? 1 : 0.96 * cueProgress(id));
  const active = (id) => cueProgress(id) > 0;
  const target =
    currentBeat === 1
      ? 'structured-block-extension-4'
      : currentBeat === 2
        ? 'structured-block-extension-5'
        : 'structured-block-mechanism';
  api.focus.target(target, () => {
    if (currentBeat === 0) {
      const trace = cueMotion(state, 'draw-ramps', 0, 0.05, 0.3);
      const average = cueMotion(state, 'average-height', 0, 0.35, 0.46);
      const slopes = cueDone(state, 'trend-signs', 1, 0.45);
      for (const [i, direction] of [1, -1].entries()) {
        const x = 270 + i * 880,
          y = 525,
          w = 565,
          dy = 120;
        const color = i ? themeColors.pink : themeColors.blue;
        extensionText(ctx, api, 'History ' + (i ? 'B' : 'A'), x + w / 2, 275, 42, color);
        api.line(ctx, x, y + 175, x + w, y + 175, themeColors.muted, 3);
        for (const v of [1, 2, 3]) {
          extensionText(ctx, api, String(v), x - 55, y - (v - 2) * dy + 10, 32, themeColors.muted);
        }
        extensionText(ctx, api, 'older', x, y + 232, 29, themeColors.muted);
        extensionText(ctx, api, 'now', x + w, y + 232, 29, themeColors.muted);
        if (average > 0) api.line(ctx, x, y, x + w * average, y, themeColors.yellow, 3);
        const tipX = x + w * trace;
        const tipY = y + dy * direction * (1 - 2 * trace);
        if (trace > 0) api.line(ctx, x, y + dy * direction, tipX, tipY, color, 7);
        api.circle(ctx, tipX, tipY, 12, color);
        if (average === 1) box(ctx, api, 'mean   2', x - 25, 812, 274, 105, themeColors.yellow, 42);
        if (average === 1)
          box(
            ctx,
            api,
            slopes ? (i ? 'trend   −1' : 'trend   +1') : 'trend   ?',
            x + 285,
            812,
            300,
            105,
            slopes ? color : themeColors.muted,
            42,
          );
      }
      footer(
        ctx,
        api,
        slopes
          ? 'Normalized time u runs from −1 to +1.   The two histories are 2 + u and 2 − u.'
          : 'Normalized time runs from −1 to +1. What sign goes on each trend?',
      );
    } else if (currentBeat === 1) {
      extensionText(ctx, api, 'Count the work needed to carry one state', 960, 280, 40);
      const q = build('ssm-structured-work');
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          if (i * 8 + j < Math.ceil(64 * q))
            api.rect(ctx, 260 + j * 65, 410 + i * 55, 48, 38, themeColors.pink);
          if (i === j && i < Math.ceil(8 * q))
            api.rect(ctx, 1160 + j * 65, 410 + i * 55, 48, 38, themeColors.green);
        }
      extensionText(
        ctx,
        api,
        resultComplete('ssm-structured-work')
          ? 'Dense: s² products per step'
          : 'Constructing dense products',
        525,
        345,
        31,
        themeColors.pink,
      );
      extensionText(
        ctx,
        api,
        resultComplete('ssm-structured-work')
          ? 'Structured: O(s) per channel'
          : 'Structured diagonal component',
        1410,
        345,
        30,
        themeColors.green,
      );
      extensionText(
        ctx,
        api,
        'Low-rank correction is additional to this schematic diagonal',
        960,
        925,
        29,
        themeColors.muted,
      );
      footer(
        ctx,
        api,
        'Original S4 uses bilinear discretization · the earlier held-input example used ZOH',
      );
    } else if (currentBeat === 2) {
      extensionText(
        ctx,
        api,
        'A fixed kernel processes a known sequence',
        960,
        300,
        41,
        themeColors.blue,
      );
      const q = build('ssm-fft-application');
      for (let i = 0; i < 16; i++) {
        const x = 200 + i * 95;
        api.rect(ctx, x, 450, 70, 85, i % 2 ? themeColors.blue : themeColors.pink);
        if (i < Math.floor(q * 16)) api.rect(ctx, x, 740, 70, 85, themeColors.green);
        if (i === Math.floor(q * 16) && q < 1)
          arrow(ctx, api, x + 35, 560, x + 35, 695, themeColors.cyan);
      }
      extensionText(
        ctx,
        api,
        resultComplete('ssm-fft-application')
          ? 'FFT application: O(L log L)'
          : 'Applying the prepared kernel',
        960,
        915,
        40,
        themeColors.yellow,
      );
      footer(
        ctx,
        api,
        'Kernel construction costs extra · a nonzero initial state adds its propagated readout response',
      );
    } else {
      extensionText(ctx, api, 'The main lane and gate lane keep their identities', 960, 270, 38);
      box(ctx, api, 'input x', 130, 530, 230, 100, themeColors.yellow, 34);
      box(
        ctx,
        api,
        currentBeat === 3 ? 'main lane' : 'activated u',
        530,
        330,
        300,
        90,
        themeColors.blue,
      );
      box(ctx, api, 'gate z', 530, 720, 300, 90, themeColors.pink);
      if (active('ssm-block-project') || currentBeat === 4) {
        arrow(ctx, api, 375, 555, 510, 375, themeColors.blue);
        arrow(ctx, api, 375, 605, 510, 765, themeColors.pink);
      }
      const main =
        currentBeat === 3
          ? [
              ['ssm-block-convolution', 'causal conv'],
              ['ssm-block-activation', 'SiLU → u'],
              ['ssm-block-select', 'B, C, positive Δ'],
              ['ssm-block-recurrence', 'Ch + Du'],
            ]
          : [['ssm-block-readout', 'Ch + Du']];
      main.forEach(([cue, label], i) => {
        const x = currentBeat === 3 ? 590 + i * 310 : 1220,
          y = currentBeat === 3 ? 500 : 350;
        box(
          ctx,
          api,
          active(cue) || currentBeat === 4 ? label : 'operation pending',
          x,
          y,
          currentBeat === 3 ? 260 : 380,
          100,
          active(cue) || currentBeat === 4 ? themeColors.blue : themeColors.muted,
          27,
        );
        if (i && active(cue)) arrow(ctx, api, x - 40, y + 50, x - 15, y + 50, themeColors.blue, 3);
      });
      if (currentBeat === 3) {
        arrow(ctx, api, 680, 435, 680, 480, themeColors.blue);
        extensionText(
          ctx,
          api,
          'Independent gate waits for the readout',
          1220,
          775,
          31,
          themeColors.pink,
        );
        extensionText(
          ctx,
          api,
          'A and D are learned, input-independent parameters here',
          960,
          925,
          30,
          themeColors.yellow,
        );
      } else {
        arrow(ctx, api, 850, 375, 1200, 400, themeColors.blue);
        box(
          ctx,
          api,
          active('ssm-block-gate') ? 'SiLU(z)' : 'gate pending',
          1040,
          720,
          350,
          90,
          themeColors.pink,
        );
        if (active('ssm-block-gate')) arrow(ctx, api, 850, 765, 1020, 765, themeColors.pink);
        box(
          ctx,
          api,
          resultComplete('ssm-block-multiply') ? 'gated readout' : 'multiply pending',
          1470,
          590,
          330,
          100,
          resultComplete('ssm-block-multiply') ? themeColors.green : themeColors.muted,
          28,
        );
        if (active('ssm-block-multiply')) {
          arrow(ctx, api, 1595, 470, 1635, 570, themeColors.blue);
          arrow(ctx, api, 1410, 765, 1635, 710, themeColors.pink);
        }
        extensionText(
          ctx,
          api,
          resultComplete('ssm-block-output') ? '→ output projection' : 'output projection pending',
          1600,
          870,
          28,
          resultComplete('ssm-block-output') ? themeColors.green : themeColors.muted,
        );
        extensionText(
          ctx,
          api,
          'SiLU(z) = z · sigmoid(z), with no [0, 1] restriction',
          960,
          950,
          32,
          themeColors.yellow,
        );
      }
      footer(
        ctx,
        api,
        'The selective recurrence is inside a complete block · the gate never replaces the main lane',
      );
    }
  });
}
export default {
  id: 'structured-block',
  draw: drawStructuredBlock,
  cues: [
    'draw-ramps',
    'average-height',
    'trend-signs',
    'structured-block-b2',
    'ssm-block-project',
    'ssm-block-convolution',
    'ssm-block-activation',
    'ssm-block-select',
    'ssm-block-recurrence',
    'structured-block-b3',
    'ssm-block-gate',
    'ssm-block-readout',
    'ssm-block-multiply',
    'ssm-block-output',
    'structured-block-extension-4',
    'ssm-structured-work',
    'structured-block-extension-5',
    'ssm-fft-application',
  ],
};
