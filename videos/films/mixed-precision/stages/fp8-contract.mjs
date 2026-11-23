import {
  completed,
  operation,
  partProgress,
  spikeScaleFixture,
  saturationFixture,
} from '../construction.mjs';
import { text, valueBox, movingValue } from '../defaults.mjs';

function drawEncodingFields(ctx, state, api) {
  const { C } = api;
  text(ctx, api, 'OCP encodings · format-specific special values', 960, 270, 38, C.cyan, 'center');
  [
    ['E4M3', 4, 'max 448 · no infinity', 'fp8-e4-limit', C.blue],
    ['E5M2', 5, 'max 57344 · infinity', 'fp8-e5-limit', C.pink],
  ].forEach(([name, exponents, limit, cue, color], row) => {
    const y = 400 + row * 260;
    text(ctx, api, name, 250, y + 55, 37, color);
    for (let i = 0; i < 8; i++) {
      api.rect(
        ctx,
        590 + i * 100,
        y,
        80,
        90,
        i === 0 ? C.yellow : i <= exponents ? color : C.green,
      );
      text(
        ctx,
        api,
        i === 0 ? 's' : i <= exponents ? 'e' : 'm',
        630 + i * 100,
        y + 60,
        35,
        C.bg,
        'center',
      );
    }
    text(
      ctx,
      api,
      completed(state, cue) ? limit : 'Range and special-value result pending',
      1050,
      y + 165,
      32,
      completed(state, cue) ? color : C.muted,
      'center',
    );
  });
}

function drawSpikePaths(ctx, state, api) {
  const { C } = api;
  text(ctx, api, 'One spike, two choices of scale', 960, 270, 37, C.yellow, 'center');
  const spike = operation(state, 'fp8-spike');
  const fixture = spikeScaleFixture();
  const rows = [
    ['Current max 512', '512 / 448', 'fp8-current-result', fixture[0], C.green],
    ['Delayed max 8', '8 / 448', 'fp8-delayed-result', fixture[1], C.pink],
  ];
  rows.forEach(([name, step, cue, result, color], i) => {
    const y = 420 + i * 280;
    const progress = operation(state, cue);
    const ready = completed(state, cue);
    text(ctx, api, name, 400, y - 40, 32, color, 'center');
    valueBox(
      ctx,
      api,
      spike > 0 ? 'Same input: 512' : 'Spike input pending',
      140,
      y,
      320,
      spike > 0 ? C.blue : C.muted,
      28,
    );
    valueBox(
      ctx,
      api,
      i === 0 && !completed(state, 'fp8-current-scale')
        ? 'Current step pending'
        : 'Real step ' + step,
      570,
      y,
      400,
      color,
      27,
    );
    valueBox(ctx, api, 'Clamp at 448', 1080, y, 300, C.muted, 27);
    valueBox(
      ctx,
      api,
      ready ? 'Restored ' + result.restored : 'Restore q × step',
      1490,
      y,
      300,
      ready ? color : C.muted,
      27,
    );
    for (const [segment, from, to] of [
      [0, 472, 558],
      [1, 982, 1068],
      [2, 1392, 1478],
    ]) {
      api.arrow(ctx, from, y + 45, to, y + 45, C.muted, 3);
      movingValue(
        ctx,
        api,
        [from, y + 45],
        [to, y + 45],
        partProgress(progress, segment, 3),
        color,
      );
    }
    text(
      ctx,
      api,
      ready
        ? 'Stored ' + result.encoded + ' × (' + step + ') → restored ' + result.restored
        : 'Stored value × step = restored value',
      960,
      y + 160,
      32,
      ready ? color : C.muted,
      'center',
    );
  });
}

function drawMicroscaleBlock(ctx, state, api) {
  const { C } = api;
  text(
    ctx,
    api,
    'Construct one 32-element block and its shared E8M0 scale',
    960,
    270,
    37,
    C.cyan,
    'center',
  );
  const count = Math.floor(operation(state, 'mx-elements') * 32);
  for (let i = 0; i < 32; i++) {
    const x = 300 + (i % 8) * 135,
      y = 390 + Math.floor(i / 8) * 110;
    api.rect(ctx, x, y, 95, 75, C.panel, C.muted, 2);
    if (i < count) {
      api.rect(ctx, x, y, 95, 75, C.blue);
      text(ctx, api, '1 B', x + 47, y + 48, 26, C.bg, 'center');
    }
  }
  const scale = completed(state, 'mx-scale');
  api.rect(ctx, 1490, 520, 150, 150, scale ? C.yellow : C.panel, C.muted, 2);
  text(ctx, api, scale ? 'E8M0' : 'Scale', 1565, 580, 29, scale ? C.bg : C.muted, 'center');
  text(ctx, api, scale ? '1 B' : 'pending', 1565, 635, 28, scale ? C.bg : C.muted, 'center');
  text(
    ctx,
    api,
    completed(state, 'mx-total')
      ? '32 + 1 = 33 bytes before layout overhead'
      : `${count} / 32 element bytes assembled · shared scale ${scale ? 'present' : 'pending'}`,
    960,
    920,
    35,
    completed(state, 'mx-total') ? C.green : C.muted,
    'center',
  );
  text(ctx, api, 'The next 32 values get their own scale', 960, 1040, 27, C.muted, 'center');
}

function drawSaturation(ctx, state, api) {
  const { C } = api;
  text(ctx, api, 'Saturating conversion to E4M3', 960, 280, 35, C.yellow, 'center');
  const progress = operation(state, 'fp8-saturation');
  const fixture = saturationFixture();
  valueBox(ctx, api, 'Input 500', 180, 375, 600, C.blue, 36);
  valueBox(
    ctx,
    api,
    completed(state, 'fp8-saturation')
      ? `Saturating output ${fixture.stored}`
      : 'Conversion result pending',
    1140,
    375,
    600,
    completed(state, 'fp8-saturation') ? C.pink : C.muted,
    33,
  );
  const x = (value) => 300 + (value / 520) * 1320;
  api.line(ctx, x(0), 650, x(520), 650, C.muted, 3);
  for (const value of [0, 448, 500]) {
    api.line(ctx, x(value), 630, x(value), 670, value === 448 ? C.pink : C.muted, 3);
    text(ctx, api, String(value), x(value), 725, 28, value === 448 ? C.pink : C.muted, 'center');
  }
  api.line(ctx, x(448), 560, x(448), 675, C.pink, 3);
  api.circle(
    ctx,
    x(fixture.input + (fixture.stored - fixture.input) * progress),
    600,
    15,
    C.yellow,
  );
  if (progress > 0 && progress < 1)
    api.arrow(ctx, x(500), 555, x(500 + (448 - 500) * progress), 555, C.yellow, 3);
  valueBox(
    ctx,
    api,
    completed(state, 'fp8-error')
      ? `Absolute error: ${fixture.input} − ${fixture.stored} = ${fixture.error} · still finite`
      : 'Error check pending',
    400,
    820,
    1120,
    completed(state, 'fp8-error') ? C.pink : C.muted,
    35,
  );
  text(
    ctx,
    api,
    'Track saturation, nonfinite values, scale history, full-step cost and held-out quality',
    960,
    1040,
    27,
    C.muted,
    'center',
  );
}

export function drawFp8Contract(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  api.focus.target('fp8-contract-mechanism', () => {
    if (beat === 0) drawEncodingFields(ctx, state, api);
    else if (beat === 1) drawSpikePaths(ctx, state, api);
    else if (beat === 2) drawMicroscaleBlock(ctx, state, api);
    else drawSaturation(ctx, state, api);
  });
}
export default {
  id: 'fp8-contract',
  draw: drawFp8Contract,
  cues: [
    'fp8-contract-b1',
    'fp8-e4-limit',
    'fp8-e5-limit',
    'fp8-contract-b2',
    'fp8-spike',
    'fp8-current-scale',
    'fp8-current-result',
    'fp8-delayed-result',
    'fp8-contract-b3',
    'mx-elements',
    'mx-scale',
    'mx-total',
    'fp8-contract-b4',
    'fp8-saturation',
    'fp8-error',
  ],
};
