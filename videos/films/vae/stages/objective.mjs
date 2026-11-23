import { kl } from '../arithmetic.mjs';
import { lv, mu } from '../fixtures.mjs';
import { mse } from '../model.mjs';
import { box, cueProgress, equation, text } from '../defaults.mjs';
import { gaussian, sampleFunction } from 'vizmatic';
export function drawObjective(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.12, 0.86),
    F = components.fade;
  {
    const q =
        currentBeat < 2
          ? teaching.axes({
              x: 220,
              y: 420,
              width: 810,
              height: 330,
              xDomain: [-3, 3],
              yDomain: [0, 0.7],
              xTicks: [-2, 0, 2],
              yTicks: [0, 0.3, 0.6],
              xLabel: 'one latent coordinate',
              yLabel: 'density',
              fontSize: 34,
            })
          : null,
      a = currentBeat === 0 ? cueProgress(ctx, api, 'kl-mismatch', phaseForBeat(0)) : 1,
      m = 0.4 * a,
      sd = Math.exp(-0.35 * a);
    if (q)
      teaching.curve({
        plot: q,
        points: sampleFunction((x) => gaussian(0, 1, x), -3, 3, 120),
        color: themeColors.muted,
        width: 5,
      });
    if (q)
      teaching.curve({
        plot: q,
        points: sampleFunction((x) => gaussian(m, sd, x), -3, 3, 120),
        color: themeColors.cyan,
        width: 5,
      });
    const likelihoodReady =
      currentBeat === 2 && cueProgress(ctx, api, 'likelihood-rule', phaseForBeat(2)) === 1;
    const elboReady =
      currentBeat === 2 && cueProgress(ctx, api, 'elbo-identity', phaseForBeat(2)) === 1;
    api.focus.target('vae-objective-rule', () =>
      equation(
        ctx,
        api,
        elboReady ? String.raw`L=-\mathrm{ELBO}` : String.raw`L=L_{\rm recon}+\beta D_{\rm KL}`,
        1440,
        420,
        52,
        themeColors.ink,
        'center',
      ),
    );
    const beta =
      currentBeat === 1
        ? api.lerp(0.1, 1, cueProgress(ctx, api, 'beta-weight', phaseForBeat(1)))
        : currentBeat > 1
          ? 1
          : 0.1;
    api.focus.target('reconstruction-ledger', () =>
      currentBeat < 2
        ? text(
            ctx,
            api,
            `MSE surrogate ≈ ${mse.toFixed(4)}`,
            1420,
            565,
            36,
            themeColors.green,
            'center',
          )
        : equation(
            ctx,
            api,
            likelihoodReady
              ? String.raw`L_{\rm recon}=\mathbb E_q[-\log p(x\mid z)]`
              : String.raw`L_{\rm recon}=?`,
            1420,
            565,
            34,
            themeColors.green,
            'center',
          ),
    );
    api.focus.target('kl-ledger', () =>
      text(
        ctx,
        api,
        `KL ≈ ${kl(
          mu.map((v) => v * a),
          lv.map((v) => v * a),
        ).toFixed(4)}`,
        1420,
        665,
        36,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('weighted-vae-objective', () =>
      text(
        ctx,
        api,
        currentBeat === 2
          ? elboReady
            ? 'β = 1 · likelihood-scaled reconstruction'
            : 'β = 1 after declaring the likelihood'
          : `β = ${beta.toFixed(2)}   total ≈ ${(
              mse +
              beta *
                kl(
                  mu.map((v) => v * a),
                  lv.map((v) => v * a),
                )
            ).toFixed(4)}`,
        1420,
        765,
        currentBeat === 2 ? 29 : 36,
        themeColors.yellow,
        'center',
      ),
    );
    if (currentBeat < 2) {
      equation(
        ctx,
        api,
        String.raw`D_{\rm KL}=\tfrac12\sum_j(\mu_j^2+\sigma_j^2-1-\log\sigma_j^2)`,
        960,
        925,
        42,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Two-coordinate KL · curve shows the first coordinate',
        960,
        1000,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      api.focus.target('reduction-ledger', () =>
        box(
          ctx,
          api,
          [
            `squared-error sum ≈ ${(25 * mse).toFixed(6)}`,
            cueProgress(ctx, api, 'reduction-sum', phaseForBeat(2)) === 1
              ? `mean = sum / 25 ≈ ${mse.toFixed(4)}`
              : 'mean = sum / 25 = ?',
          ],
          220,
          315,
          810,
          240,
          themeColors.green,
          34,
        ),
      );
      api.focus.target('gaussian-likelihood', () => {
        box(
          ctx,
          api,
          'fixed Gaussian pixel variance τ²',
          200,
          620,
          850,
          100,
          themeColors.muted,
          30,
        );
        equation(
          ctx,
          api,
          cueProgress(ctx, api, 'likelihood-rule', phaseForBeat(2)) === 1
            ? String.raw`-\log p(x\mid z)=\frac{\sum_i(x_i-\hat x_i)^2}{2\tau^2}+C`
            : String.raw`-\log p(x\mid z)=?`,
          625,
          845,
          38,
          themeColors.cyan,
          'center',
        );
      });
      text(
        ctx,
        api,
        'The declared likelihood fixes the reconstruction scale.',
        960,
        1000,
        30,
        themeColors.ink,
        'center',
      );
    }
  }
}
export default {
  id: 'objective',
  draw: drawObjective,
  cues: ['kl-mismatch', 'beta-weight', 'reduction-sum', 'likelihood-rule', 'elbo-identity'],
};
