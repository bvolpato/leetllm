import { gammaDensity, reconstructionTrace } from '../arithmetic.mjs';
import { constructedFrame } from '../construction.mjs';

import {
  drawConstructedArrow,
  drawConstructedBox,
  drawConstructedCurve,
  drawConstructedEquation,
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
export function drawReparameterizedEncoder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    clamp = (v) => Math.max(0, Math.min(1, v));
  api.focus.target('reparameterized-encoder-operation', () => {
    if (currentBeat === 0) {
      drawConstructedHead(ctx, api, 'One shared encoder family amortizes inference');
      [28, 50, 90].forEach((x, i) => {
        const y = 400 + 150 * i;
        drawConstructedBox(ctx, api, 'x ' + x + ' ms', 350, y, 350, 85, themeColors.blue, 33);
        drawConstructedArrow(ctx, api, 560, y, 800, y, themeColors.blue);
        drawConstructedBox(ctx, api, 'same encoder φ', 1040, y, 400, 85, themeColors.cyan, 31);
        drawConstructedArrow(ctx, api, 1290, y, 1430, y, themeColors.cyan);
        drawConstructedText(ctx, api, 'qφ(z | x)', 1600, y + 12, 34, themeColors.pink, 'center');
      });
      drawConstructedText(
        ctx,
        api,
        'The shared encoder estimates a posterior for each input.',
        960,
        945,
        29,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const reconstruction = -5.2;
      const priorKL = 0.8;
      const lower = reconstruction - priorKL;
      const gap = 1.5;
      const evidence = lower + gap;
      const x = (score) => 290 + 440 * (score + 7);
      const label = (s, px, py, color) => drawConstructedText(ctx, api, s, px, py, 34, color, 'center');
      drawConstructedHead(ctx, api, 'One observation, two distances');
      label('Expected reconstruction log likelihood', x(reconstruction), 377, themeColors.blue);
      label(reconstruction.toFixed(1), x(reconstruction), 447, themeColors.blue);
      const debit = f.progress('encoder-prior-cost', 1);
      const bridge = f.progress('encoder-evidence-gap', 1);
      if (debit > 0) {
        const endpoint = x(reconstruction - priorKL * debit);
        drawConstructedArrow(ctx, api, x(reconstruction), 535, endpoint, 535, themeColors.yellow);
        label('Subtract prior KL', 480, 398, themeColors.yellow);
        label(priorKL.toFixed(1) + ' nats', 480, 447, themeColors.yellow);
      }
      if (debit === 1) {
        api.circle(ctx, x(lower), 535, 9, themeColors.yellow);
        label('Bound  ' + lower.toFixed(1), x(lower), 615, themeColors.yellow);
      }
      if (bridge > 0) {
        drawConstructedLine(ctx, api, x(lower), 651, x(lower), 738, themeColors.muted, 2);
        drawConstructedArrow(ctx, api, x(lower), 738, x(lower + gap * bridge), 738, themeColors.green);
        label('Add posterior KL gap', (x(lower) + x(evidence)) / 2, 827, themeColors.green);
        if (bridge === 1) {
          if (f.completed('encoder-evidence-value', 1)) {
            label('Log evidence  ' + evidence.toFixed(1), x(evidence), 660, themeColors.green);
          }
          label(gap.toFixed(1) + ' nats', (x(lower) + x(evidence)) / 2, 887, themeColors.green);
        }
      }
      drawConstructedNote(ctx, api, 'Illustrative values for the VAE objective');
    } else if (currentBeat === 2) {
      drawConstructedHead(ctx, api, 'One fixed-noise sample · then an explicit Gaussian decoder');
      const sdP = f.progress('encoder-sd-nudge'),
        mu = 1 + 0.2 * f.progress('encoder-mean-nudge') * (1 - clamp(2 * sdP)),
        sd = 2 + 0.2 * clamp(2 * sdP - 1),
        v = reconstructionTrace(mu, sd, 0.5),
        p = drawConstructedPlot(
          ctx,
          api,
          250,
          390,
          1000,
          260,
          [-3, 5],
          [0, 0.25],
          'latent z',
          'encoder density',
          [-3, -1, 1, 3, 5],
          [0, 0.1, 0.2],
        );
      drawConstructedCurve(
        ctx,
        api,
        p,
        (x) => gammaDensity(x, mu, sd * sd),
        -3,
        5,
        themeColors.pink,
        4,
      );
      const a = p.point(mu, 0),
        z = p.point(v.z, 0);
      drawConstructedLine(ctx, api, a.x, 430, a.x, 650, themeColors.cyan, 3);
      if (f.completed('em-encoder-sample-result', 2))
        api.circle(ctx, z.x, z.y, 13, themeColors.yellow);
      drawConstructedText(
        ctx,
        api,
        'μ ' + mu.toFixed(3) + ' · σ ' + sd.toFixed(3) + ' · ε = 0.5',
        750,
        830,
        31,
        themeColors.pink,
        'center',
      );
      drawConstructedEquation(
        ctx,
        api,
        f.completed('em-encoder-sample-result', 2)
          ? String.raw`z=\mu+\sigma\epsilon=${v.z.toFixed(3)}`
          : String.raw`z=\mu+\sigma\epsilon`,
        750,
        915,
        37,
        themeColors.yellow,
      );
      if (f.started('encoder-decoder-contract')) {
        drawConstructedLine(ctx, api, z.x, 650, z.x, 730, themeColors.yellow, 3);
        drawConstructedLine(ctx, api, z.x, 730, 1280, 730, themeColors.yellow, 3);
        drawConstructedLine(ctx, api, 1280, 730, 1280, 440, themeColors.yellow, 3);
        drawConstructedArrow(ctx, api, 1280, 440, 1330, 440, themeColors.yellow);
        drawConstructedBox(
          ctx,
          api,
          'Gaussian decoder, variance 1',
          1550,
          440,
          440,
          100,
          themeColors.green,
          27,
        );
        drawConstructedText(
          ctx,
          api,
          'mean w × z · w = 1',
          1550,
          590,
          30,
          themeColors.green,
          'center',
        );
        drawConstructedText(ctx, api, 'observed x = 3', 1550, 690, 31, themeColors.cyan, 'center');
      }
      drawConstructedText(
        ctx,
        api,
        f.completed('encoder-reconstruction-loss', 2)
          ? 'reconstruction L ' + v.loss.toFixed(6)
          : 'Reconstruction loss pending',
        1550,
        800,
        31,
        f.completed('encoder-reconstruction-loss', 2) ? themeColors.yellow : themeColors.muted,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        f.completed('encoder-reconstruction-gradients', 2)
          ? '∂L/∂μ ' + v.meanGradient.toFixed(3)
          : '∂L/∂μ pending',
        470,
        990,
        29,
        f.completed('encoder-reconstruction-gradients', 2) ? themeColors.cyan : themeColors.muted,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        f.completed('em-encoder-deviation-gradient', 2)
          ? '∂L/∂σ ' + v.deviationGradient.toFixed(3)
          : '∂L/∂σ pending',
        1030,
        990,
        29,
        f.completed('em-encoder-deviation-gradient', 2) ? themeColors.cyan : themeColors.muted,
        'center',
      );
      drawConstructedText(
        ctx,
        api,
        f.completed('em-encoder-weight-gradient', 2)
          ? '∂L/∂w ' + v.weightGradient.toFixed(3)
          : '∂L/∂w pending',
        1550,
        915,
        34,
        f.completed('em-encoder-weight-gradient', 2) ? themeColors.green : themeColors.muted,
        'center',
      );
      drawConstructedNote(
        ctx,
        api,
        'One-sample reconstruction loss and gradients, before the prior penalty',
      );
    } else {
      const progress = f.progress('encoder-change-gap', 3);
      const after = f.completed('encoder-evidence-result', 4);
      const x = (score) => 470 + (score + 10) * 270;
      drawConstructedHead(ctx, api, 'Where will the green arrow end?');
      const scoreRow = (y, name, bound, gap, attach, showTotal) => {
        drawConstructedText(ctx, api, name, 185, y + 12, 34, themeColors.ink);
        drawConstructedLine(ctx, api, x(-10), y, x(-6), y, themeColors.muted, 2);
        api.circle(ctx, x(bound), y, 11, themeColors.yellow);
        drawConstructedText(ctx, api, 'Bound  ' + bound.toFixed(1), x(bound), y - 42, 31,
          themeColors.yellow, 'center');
        const startX = api.lerp(x(-10), x(bound), attach);
        const arrowY = y + 102 * (1 - attach);
        const endX = startX + x(bound + gap) - x(bound);
        drawConstructedArrow(ctx, api, startX, arrowY, endX, arrowY, themeColors.green);
        drawConstructedText(ctx, api, 'Gap  ' + gap.toFixed(1), (startX + endX) / 2,
          arrowY + 63, 30, themeColors.cyan, 'center');
        if (showTotal) drawConstructedText(ctx, api, 'Log evidence  ' + (bound + gap).toFixed(1),
          x(bound + gap), y - 42, 31, themeColors.green, 'center');
      };
      scoreRow(448, 'Before', -10, 3, 1, true);
      scoreRow(755, 'After', -10 + progress, 3 - 2 * progress,
        f.progress('encoder-evidence-result', 4), after);
      drawConstructedNote(ctx, api, 'Illustrative scores for one observation');

    }
  });
}
export default {
  id: 'reparameterized-encoder',
  draw: drawReparameterizedEncoder,
  cues: [
    'reparameterized-encoder-0',
    'reparameterized-encoder-1',
    'encoder-prior-cost',
    'encoder-evidence-gap',
    'encoder-evidence-value',
    'reparameterized-encoder-2',
    'encoder-mean-nudge',
    'encoder-sd-nudge',
    'encoder-decoder-contract',
    'encoder-reconstruction-loss',
    'encoder-reconstruction-gradients',
    'em-encoder-sample-result',
    'em-encoder-deviation-gradient',
    'em-encoder-weight-gradient',
    'reparameterized-encoder-3',
    'encoder-change-gap',
    'encoder-evidence-result',
  ],
};
