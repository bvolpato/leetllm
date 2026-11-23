import { chunkStateFixture, multiDirectionFixture, trapezoidWriteFixture } from '../model.mjs';
import { arrow, box, extensionText, footer, rectangle } from '../defaults.mjs';
export function drawSsdAndRefinement(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const cueProgress = (id) => (state.cues ? (state.cues[id]?.progress ?? 0) : progress);
  const resultComplete = (id) =>
    state.cues ? state.cues[id]?.phase === 'after' : progress >= 0.98;
  const build = (id) => (resultComplete(id) ? 1 : 0.96 * cueProgress(id));
  const active = (id) => cueProgress(id) > 0;
  api.focus.target('ssd-and-refinement-mechanism', () => {
    if (currentBeat === 0) {
      extensionText(ctx, api, 'A causal interaction separates write, decay and read', 960, 285, 38);
      const q = build('ssm-ssd-factor');
      for (let i = 0; i < 4; i++)
        for (let j = 0; j <= i; j++) {
          const x = 230 + j * 145,
            y = 400 + i * 115;
          rectangle(
            ctx,
            api,
            x,
            y,
            125,
            90,
            i >= 2 && j < 2 ? themeColors.green : themeColors.blue,
          );
          if (i * 4 + j < Math.ceil(q * 16))
            extensionText(
              ctx,
              api,
              (0.2 * 0.9 ** (i - j)).toFixed(3),
              x + 62,
              y + 57,
              28,
              themeColors.ink,
            );
        }
      extensionText(ctx, api, 'earlier input →', 500, 355, 29, themeColors.blue);
      extensionText(ctx, api, 'output', 145, 660, 27, themeColors.muted);
      box(ctx, api, 'write Bⱼ', 1050, 430, 260, 90, themeColors.pink);
      box(ctx, api, 'intervening decay', 1350, 600, 410, 90, themeColors.blue, 28);
      box(ctx, api, 'read Cᵢ', 1050, 780, 260, 90, themeColors.green);
      if (q > 0.1) arrow(ctx, api, 1325, 475, 1540, 575, themeColors.pink);
      if (q > 0.5) arrow(ctx, api, 1540, 710, 1325, 825, themeColors.green);
      footer(
        ctx,
        api,
        'Toy head: scalar carry 0.9, write 0.2, read 1 · the highlighted off-diagonal block factors',
      );
    } else if (currentBeat <= 2) {
      const answering = currentBeat === 2;
      if (!answering || !active('ssm-chunks64')) {
        const localProgress = answering ? 1 : build('ssm-ssd-local');
        const first = answering ? build('ssd-first-carry') : 0,
          last = answering ? build('ssm-ssd-boundary') : 0;
        const incoming = answering && active('ssd-incoming');
        const chunks = chunkStateFixture();
        const boundaryState = chunks[1].incoming;
        extensionText(ctx, api, 'Two known inputs per chunk', 960, 270, 43);
        for (const [chunk, row] of chunks.entries()) {
          const x = chunk ? 1040 : 160;
          extensionText(
            ctx,
            api,
            chunk ? 'Right chunk' : 'Left chunk',
            x,
            382,
            37,
            themeColors.ink,
            'left',
          );
          for (const [j, local] of row.local.entries()) {
            const y = 472 + j * 196;
            extensionText(
              ctx,
              api,
              'input ' + row.inputs[j],
              x,
              y + 44,
              32,
              themeColors.muted,
              'left',
            );
            const start = x + 157,
              scale = 232;
            const q = chunk ? (j ? last : first) : 0;
            const localW = scale * local * localProgress;
            const extraW = scale * row.boundary[j] * q;
            if (localW > 0) api.rect(ctx, start, y, localW, 57, themeColors.blue);
            if (extraW > 0) api.rect(ctx, start + localW, y, extraW, 57, themeColors.yellow);
            if (answering || resultComplete('ssm-ssd-local')) {
              const result = chunk && q === 1 ? row.outputs[j] : local;
              const color = chunk && q === 1 ? themeColors.green : themeColors.blue;
              extensionText(
                ctx,
                api,
                String(Number(result.toFixed(4))),
                x + 665,
                y + 46,
                43,
                color,
              );
            }
            if (chunk && q > 0) {
              const expression =
                Number(local.toFixed(4)) +
                ' + ' +
                boundaryState.toFixed(2) +
                ' × ' +
                (j ? '0.9²' : '0.9');
              extensionText(ctx, api, expression, start, y + 125, 35, themeColors.ink, 'left');
            }
          }
        }
        if (incoming) {
          const q = cueProgress('ssd-incoming');
          arrow(ctx, api, 805, 410, 805 + 195 * q, 410, themeColors.yellow, 5);
          extensionText(
            ctx,
            api,
            'h = ' + boundaryState.toFixed(2),
            915,
            366,
            33,
            themeColors.yellow,
          );
        }
        footer(
          ctx,
          api,
          'Blue: local output from zero' +
            (incoming ? '     Yellow: the left boundary carried forward' : ''),
        );
      } else {
        const extra = active('ssm-chunk65'),
          complete = resultComplete(extra ? 'ssm-chunk65' : 'ssm-chunks64');
        extensionText(
          ctx,
          api,
          'Current input: ' + (extra ? '16,385' : '16,384') + ' positions · chunk width 256',
          960,
          285,
          38,
        );
        const count =
          extra && complete
            ? 65
            : resultComplete('ssm-chunks64')
              ? 64
              : Math.floor(build('ssm-chunks64') * 64);
        for (let i = 0; i < count; i++)
          api.rect(
            ctx,
            255 + (i % 13) * 110,
            400 + Math.floor(i / 13) * 100,
            72,
            65,
            i === 64 ? themeColors.yellow : themeColors.blue,
          );
        if (extra && !complete) box(ctx, api, '?', 1575, 800, 72, 65, themeColors.yellow, 31);
        extensionText(
          ctx,
          api,
          complete
            ? extra
              ? '64 full chunks + 1 position in chunk 65'
              : '64 complete chunks'
            : 'Construct the chunk count',
          960,
          955,
          35,
          complete ? themeColors.yellow : themeColors.muted,
        );
        footer(
          ctx,
          api,
          'One extra input opens a new chunk; the recurrent state width stays fixed',
        );
      }
    } else {
      extensionText(
        ctx,
        api,
        'Mamba-3 can read the same state in several directions',
        960,
        275,
        35,
      );
      const weight = 1 - 0.5 * build('ssm-trapezoid-half'),
        f = trapezoidWriteFixture(weight);
      extensionText(ctx, api, 'Previous + current writes', 380, 370, 31, themeColors.pink);
      extensionText(ctx, api, 'Old state 1 · writes 2 → 1', 380, 420, 26, themeColors.muted);
      ['carry', 'previous', 'current'].forEach((name, i) => {
        const y = 450 + i * 110,
          value = f[name];
        extensionText(
          ctx,
          api,
          name,
          140,
          y + 35,
          27,
          [themeColors.blue, themeColors.yellow, themeColors.pink][i],
          'left',
        );
        api.rect(
          ctx,
          285,
          y,
          260 * value,
          50,
          [themeColors.blue, themeColors.yellow, themeColors.pink][i],
        );
      });
      extensionText(
        ctx,
        api,
        active('ssm-trapezoid-half') ? 'λ ' + weight.toFixed(2) : 'λ = 1',
        380,
        830,
        28,
        themeColors.yellow,
      );
      extensionText(
        ctx,
        api,
        resultComplete('ssm-trapezoid-half')
          ? 'Both interval endpoints contribute'
          : active('ssm-trapezoid-half')
            ? 'Interpolating endpoint weights'
            : 'Current-endpoint Euler reference',
        380,
        910,
        26,
        themeColors.muted,
      );
      const q = build('ssm-rotation'),
        steps = [1, 1, 0, 1],
        position = Math.min(3, Math.floor(q * 4));
      const parity = steps.slice(0, position).reduce((a, x) => a ^ x, 0),
        fraction = q === 1 ? 1 : q * 4 - position;
      const angle = Math.PI * (parity + steps[position] * fraction),
        cx = 960,
        cy = 620,
        radius = 150;
      extensionText(ctx, api, 'Toy parity state tracking', 960, 370, 30, themeColors.green);
      api.circle(ctx, 960, 620, 150, 'transparent', themeColors.muted, 2);
      api.line(ctx, 960 - 150 - 20, 620, 960 + 150 + 20, 620, themeColors.muted, 2);
      arrow(
        ctx,
        api,
        960,
        620,
        960 + 150 * Math.cos(angle),
        620 - 150 * Math.sin(angle),
        themeColors.green,
        6,
      );
      extensionText(ctx, api, 'bits 1, 1, 0, 1', 960, 830, 29, themeColors.green);
      extensionText(
        ctx,
        api,
        'R(πx) · current bit ' + steps[position],
        960,
        875,
        26,
        themeColors.green,
      );
      extensionText(
        ctx,
        api,
        'A 1 flips the arrow. A 0 leaves it in place.',
        960,
        910,
        25,
        themeColors.muted,
      );
      const directions = multiDirectionFixture();
      extensionText(ctx, api, 'Two directions, one toy state', 1520, 370, 29, themeColors.cyan);
      box(ctx, api, '2 × [1, 0]', 1280, 415, 220, 60, themeColors.cyan, 26);
      box(ctx, api, '3 × [0, 1]', 1550, 415, 220, 60, themeColors.pink, 26);
      arrow(ctx, api, 1390, 490, 1460, 520, themeColors.cyan, 3);
      arrow(ctx, api, 1660, 490, 1580, 520, themeColors.pink, 3);
      box(
        ctx,
        api,
        'state [' + directions.state.join(', ') + ']',
        1290,
        540,
        460,
        80,
        themeColors.blue,
        33,
      );
      if (active('ssm-mimo')) {
        arrow(ctx, api, 1380, 640, 1380, 765, themeColors.cyan);
      }
      if (active('difference-read')) {
        arrow(ctx, api, 1660, 640, 1660, 765, themeColors.pink);
      }
      box(
        ctx,
        api,
        resultComplete('ssm-mimo') ? String(directions.outputs[0]) : 'pending',
        1250,
        790,
        260,
        80,
        themeColors.cyan,
        33,
      );
      box(
        ctx,
        api,
        resultComplete('difference-read') ? String(directions.outputs[1]) : 'pending',
        1540,
        790,
        260,
        80,
        themeColors.pink,
        33,
      );
      extensionText(ctx, api, 'C₁ = [1, 1]', 1380, 930, 26, themeColors.cyan);
      extensionText(ctx, api, 'C₂ = [1, −1]', 1670, 930, 26, themeColors.pink);
      footer(
        ctx,
        api,
        active('ssm-mimo')
          ? 'One state read supplies both the sum and the difference'
          : 'The next update can use the write saved from the previous step',
      );
    }
  });
}
export default {
  id: 'ssd-and-refinement',
  draw: drawSsdAndRefinement,
  cues: [
    'ssd-and-refinement-b1',
    'ssm-ssd-factor',
    'ssd-and-refinement-b2',
    'ssm-ssd-local',
    'ssm-ssd-boundary',
    'ssm-chunks64',
    'ssm-chunk65',
    'ssd-and-refinement-b3',
    'ssm-rotation',
    'ssm-mimo',
    'difference-read',
    'ssm-trapezoid-half',
  ],
};
