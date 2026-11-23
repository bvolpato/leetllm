import { run } from '../arithmetic.mjs';
import { xs } from '../fixtures.mjs';
import { arrow, box, extensionEquation, extensionText, footer } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawHeldInput(ctx, scene, state, api) {
  const { C: themeColors } = api,
    actualBeat = state.beat ?? 0;
  const currentBeat = actualBeat;
  const progress = api.clamp(state.beatP ?? 0);
  const cueProgress = (id) => (state.cues ? (state.cues[id]?.progress ?? 0) : progress);
  const resultComplete = (id) =>
    state.cues ? state.cues[id]?.phase === 'after' : progress >= 0.98;
  const build = (id) => (resultComplete(id) ? 1 : 0.96 * cueProgress(id));
  const active = (id) => cueProgress(id) > 0;
  const target = currentBeat < 3 ? 'held-input' + '-mechanism' : 'readout-trial';
  api.focus.target(target, () => {
    if (currentBeat === 0) {
      extensionText(ctx, api, 'A constant input contributes throughout the interval', 960, 285, 38);
      const plot = api.teaching.axes({
        x: 230,
        y: 420,
        width: 820,
        height: 400,
        xDomain: [0, 1.1],
        yDomain: [0, 1.1],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.5, 1],
        xLabel: 'elapsed integration time u',
        yLabel: 'e⁻ᵘ',
        fontSize: 26,
      });
      const q = build('ssm-held-integral');
      for (let i = 0; i < 40; i++) {
        const u = i / 40,
          amount = api.clamp(q * 40 - i),
          top = plot.point(u, Math.exp(-u));
        const end = plot.point(u + amount / 40, 0);
        if (amount > 0)
          api.rect(ctx, top.x, top.y, end.x - top.x, end.y - top.y, themeColors.pink + '66');
      }
      api.teaching.curve({
        plot,
        points: sampleFunction((u) => Math.exp(-u), 0, 1, 80),
        color: themeColors.blue,
        width: 5,
      });
      extensionEquation(ctx, api, String.raw`\bar A=e^{\Delta A}`, 1460, 430, 45, themeColors.blue);
      extensionEquation(
        ctx,
        api,
        String.raw`\bar B=\int_0^\Delta e^{uA}B\,du`,
        1460,
        590,
        43,
        themeColors.pink,
      );
      extensionText(
        ctx,
        api,
        resultComplete('ssm-held-integral')
          ? 'unit interval area ≈ 0.632'
          : 'accumulating the held-input contribution',
        1460,
        735,
        27,
        themeColors.pink,
      );
      if (resultComplete('ssm-held-inverse'))
        extensionEquation(
          ctx,
          api,
          String.raw`A^{-1}(e^{\Delta A}-I)B`,
          1460,
          865,
          37,
          themeColors.yellow,
        );
      else extensionText(ctx, api, 'Closed form pending', 1460, 865, 28, themeColors.muted);
      footer(
        ctx,
        api,
        'Scalar plot: A = −1, B = 1, Δ = 1 · the matrix integral also covers singular A',
      );
    } else if (currentBeat === 1) {
      extensionText(
        ctx,
        api,
        'Unit old state and unit held input · A = −1, B = 1, Δ = 1',
        960,
        285,
        34,
      );
      const rows = [
        {
          cue: 'ssm-held-retention',
          name: 'Old state retained',
          value: Math.exp(-1),
          color: themeColors.blue,
        },
        {
          cue: 'ssm-held-exact',
          name: 'Exact held-input write',
          value: 1 - Math.exp(-1),
          color: themeColors.pink,
        },
        {
          cue: 'ssm-held-euler',
          name: 'Mamba 1 style write',
          value: 1,
          color: themeColors.yellow,
        },
      ];
      rows.forEach((r, i) => {
        const y = 410 + i * 180;
        extensionText(ctx, api, r.name, 220, y + 42, 29, r.color, 'left');
        api.line(ctx, 790, y + 65, 1490, y + 65, themeColors.muted, 2);
        const width = 700 * r.value * build(r.cue);
        if (width > 0) api.rect(ctx, 790, y, width, 65, r.color);
        extensionText(
          ctx,
          api,
          resultComplete(r.cue) ? r.value.toFixed(3) : 'pending',
          1660,
          y + 45,
          35,
          resultComplete(r.cue) ? r.color : themeColors.muted,
        );
      });
      footer(
        ctx,
        api,
        'Same finite step, different input discretizations · the coefficients approach one another at small steps',
      );
    } else if (currentBeat === 2) {
      extensionText(ctx, api, 'The same half-carry update, one input at a time', 960, 285, 39);
      const values = run(xs, 0.5, 0.5),
        cues = ['ssm-half-first', 'ssm-half-second', 'ssm-half-third', 'ssm-half-fourth'];
      xs.forEach((input, i) => {
        const x = 325 + i * 420,
          cue = cues[i],
          old = i ? values[i - 1] : 0;
        extensionText(ctx, api, 'input ' + input, x, 400, 33, themeColors.pink);
        box(
          ctx,
          api,
          resultComplete(cue) ? values[i].toFixed(4) : 'sum pending',
          x - 155,
          580,
          310,
          110,
          resultComplete(cue) ? themeColors.green : themeColors.muted,
          34,
        );
        if (active(cue)) {
          extensionText(ctx, api, '½ × ' + old.toFixed(3), x, 480, 28, themeColors.blue);
          extensionText(ctx, api, '+ ½ × ' + input, x, 530, 28, themeColors.pink);
          arrow(ctx, api, x, 545, x, 565, themeColors.pink, 3);
        }
        if (i < 3 && resultComplete(cue))
          arrow(ctx, api, x + 170, 635, x + 245, 635, themeColors.green);
      });
      footer(
        ctx,
        api,
        'h ← 0.5h + 0.5x, from zero · C reads state, while D adds a separate current-input skip',
      );
    } else {
      const h = run(xs, 0.5, 0.5).at(-1),
        input = xs.at(-1);
      const doubled = active('change-readout'),
        skip = active('add-skip');
      const c = doubled ? 2 : 1,
        d = skip ? 0.5 : 0;
      extensionText(ctx, api, 'Same four inputs. Same final state.', 960, 288, 43);
      box(ctx, api, 'h = ' + h, 180, 434, 455, 135, themeColors.green, 56);
      box(ctx, api, 'x = ' + input, 180, 675, 455, 115, themeColors.pink, 48);
      extensionText(ctx, api, 'C = ' + c, 855, 481, 49, themeColors.blue);
      extensionText(ctx, api, 'D = ' + d, 855, 715, 49, themeColors.pink);
      arrow(ctx, api, 670, 524, 1120, 524, themeColors.blue, 5);
      arrow(ctx, api, 670, 754, 1120, 754, themeColors.pink, 5);
      extensionText(ctx, api, 'state read   ' + c * h, 1440, 533, 42, themeColors.blue);
      extensionText(ctx, api, 'input skip   ' + d * input, 1440, 763, 42, themeColors.pink);
      extensionText(ctx, api, 'y = ' + (c * h + d * input), 1440, 920, 62, themeColors.ink);
      footer(ctx, api, 'The next token still receives the stored h = ' + h);
    }
  });
}
export default {
  id: 'held-input',
  draw: drawHeldInput,
  cues: [
    'held-input-b1',
    'ssm-held-integral',
    'ssm-held-inverse',
    'held-input-b2',
    'ssm-held-retention',
    'ssm-held-exact',
    'ssm-held-euler',
    'held-input-b3',
    'ssm-half-first',
    'ssm-half-second',
    'ssm-half-third',
    'ssm-half-fourth',
  ],
};
