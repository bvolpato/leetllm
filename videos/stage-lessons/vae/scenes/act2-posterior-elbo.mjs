// Act 2 (Scenes 7-13): 3D Posterior Cloud, Per-Crop vs Mixture Contract, KL Ledger,
// Reparameterized Sampling, Attached vs Detached Gradient Path, ELBO Objective, Evidence Gap.
import { circle, dynamic, group, line, point3d, rect, surface } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  beatTo,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decode,
  decorAura,
  eps,
  fadeIn,
  fadeOut,
  gaussianEvidenceState,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  kl,
  livingDrift,
  lv,
  mix,
  mu,
  numCell,
  orbitScene,
  pixelPatch5x5,
  pixels,
  priorDraw,
  probePixels,
  rule,
  sample,
  sig,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. posterior: The crop selects a cloud (SIGNATURE 3D GAUSSIAN BELL)
// Cues: posterior-select, posterior-other, posterior-return, posterior-scale
// ---------------------------------------------------------------------------
export function posterior(s, c) {
  const selP = s.value(0);
  const othP = s.value(0);
  const retP = s.value(0);
  const sclP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.post, seed: 7 }));
  s.add(decorAura(340, 10, 480, '#a78bfa22', '#5ce1e614'));

  const headline = heroTitle(['Amortized Posterior:', 'Each Crop Emits a Cloud'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.post,
    eyebrow: 'q_φ(z | x) = N(μ(x), diag(σ²(x)))  ·  σ = exp(0.5 · log σ²)',
  });

  // Right: Orbiting 3D Gaussian posterior density surface over (z1, z2)
  const view3d = cinematic3d({
    theta: -0.68,
    phi: 1.04,
    distance: 11.8,
    unit: 124,
    focus: [0, 0, 0.5],
  }).at(430, 5);
  const bell = surface(
    (u, v) => {
      const m = othP.value * (1 - retP.value);
      const mx = mix(mu[0], -mu[0], m);
      const my = mix(mu[1], -mu[1], m);
      const s0 = mix(1.0, sig[0], Math.max(selP.value, sclP.value));
      const s1 = sig[1];
      const dx = (u - mx) / s0;
      const dy = (v - my) / s1;
      return 1.65 * Math.exp(-0.5 * (dx * dx + dy * dy));
    },
    {
      x: [-2.0, 2.0],
      y: [-2.0, 2.0],
      resolution: [26, 26],
      colors: ['#0c1733', '#234a85', '#5ce1e6', '#a78bfa', '#ffd166'],
      mesh: '#a78bfa',
      meshOpacity: 0.2,
      meshWidth: 0.65,
      opacity: 0.92,
    },
  );
  const priorPeak = point3d([0, 0, 1.05], { radius: 11, color: ROLE.code, glow: 14 });
  view3d.add(bell, priorPeak);
  orbitScene(s, c, view3d, { theta: -0.68, phi: 1.04, deltaTheta: 0.48, deltaPhi: 0.08 });

  const live = dynamic(() => {
    const sl = selP.value;
    const ot = othP.value;
    const rt = retP.value;
    const sc = sclP.value;
    const isOther = ot > 0.4 && rt < 0.4;
    const curPix = isOther ? probePixels : pixels;
    const curMu = isOther ? [-mu[0], -mu[1]] : mu;
    const lx = -820;

    return group(
      txt(isOther ? 'PROBE CROP  x′' : 'INPUT CROP  x', lx, -210, 26, ROLE.pixel, 'mono', 'left'),
      pixelPatch5x5(curPix, lx + 150, -30, { cell: 42, gap: 5 }),

      txt('ENCODER OUTPUTS', lx + 330, -210, 26, ROLE.post, 'mono', 'left'),
      numCell(
        sl > 0.2 ? `μ = [${curMu[0].toFixed(2)}, ${curMu[1].toFixed(2)}]` : 'μ = [?, ?]',
        lx + 545,
        -105,
        {
          w: 440,
          h: 66,
          size: 27,
          stroke: ROLE.post,
          textColor: ROLE.post,
          glow: 9,
        },
      ),
      numCell(
        sl > 0.2 ? `log σ² = [${lv[0].toFixed(2)}, ${lv[1].toFixed(2)}]` : 'log σ² = [?, ?]',
        lx + 545,
        -10,
        {
          w: 440,
          h: 66,
          size: 27,
          stroke: ROLE.pixel,
          textColor: ROLE.pixel,
        },
      ),
      numCell(
        sc > 0.2 ? `σ = [${sig[0].toFixed(3)}, ${sig[1].toFixed(3)}]` : 'σ = exp(0.5 · log σ²)',
        lx + 545,
        85,
        {
          w: 440,
          h: 66,
          size: 27,
          stroke: sc > 0.2 ? ROLE.good : '#2b3b60',
          textColor: sc > 0.2 ? ROLE.good : COSMOS.muted,
          glow: sc > 0.2 ? 10 : 0,
        },
      ),

      txt('3D POSTERIOR BELL  q_φ(z | x)', 370, -225, 26, ROLE.post, 'mono'),
      txt(
        sc > 0.2
          ? 'exp(0.5 · log σ²) guarantees strictly positive spread σ > 0 for every latent axis'
          : isOther
            ? 'A different crop shifts the Gaussian cloud to a distinct region of latent space'
            : 'Instead of one deterministic point, the encoder outputs a mean μ and spread σ',
        0,
        395,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, view3d, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'posterior-select', selP, 1, { dur: 0.75 });
  cueTo(s, c, 'posterior-other', othP, 1, { dur: 0.85 });
  cueTo(s, c, 'posterior-return', retP, 1, { dur: 0.85 });
  cueTo(s, c, 'posterior-scale', sclP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 8. posterior-contract: Separate the posterior for one crop from the mixture
// Cues: vae-posterior-contract-0-build, vae-posterior-contract-1-build,
//       vae-posterior-contract-mixture, vae-posterior-contract-2-build
// ---------------------------------------------------------------------------
export function posteriorContract(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const mxP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.post, seed: 8 }));
  s.add(decorAura(0, 15, 560, '#a78bfa1a', '#ffd16614'));

  const headline = heroTitle(['Per-Crop Posterior vs', 'Aggregate Mixture q(z)'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.post,
    eyebrow: 'q_φ(z | x)  VS  q(z) = E_x[q_φ(z | x)]  VS  p(z) = N(0, I)',
  });

  const live = dynamic(() => {
    const b1 = b1P.value;
    const mx = mxP.value;
    const b2 = b2P.value;

    const nodes = [];
    // Left: 2D latent plane showing 2 per-crop posteriors inside prior N(0,I) contour
    const cx = -390;
    const cy = 42;
    nodes.push(
      txt('LATENT PLANE  (z₁, z₂)  ·  p(z) = N(0, I)', cx, -205, 26, ROLE.code, 'mono'),
      // Prior N(0,I) outer ring
      circle(188, { fill: '#ffd1660c', stroke: ROLE.code, width: 2.6, dash: [8, 6] }).at(cx, cy),
      // Crop A posterior (upper right)
      circle(78, { fill: '#5ce1e626', stroke: ROLE.pixel, width: 3 })
        .at(cx + 76, cy - 42)
        .glow(8, ROLE.pixel),
      txt('q(z|x_A)', cx + 76, cy - 42, 26, ROLE.pixel, 'mono'),
      // Crop B posterior (lower left)
      circle(78, { fill: '#a78bfa26', stroke: ROLE.post, width: 3 })
        .at(cx - 76, cy + 56)
        .glow(8, ROLE.post)
        .opacity(mix(0.45, 1, Math.max(b1, mx))),
      txt('q(z|x_B)', cx - 76, cy + 56, 26, ROLE.post, 'mono').opacity(
        mix(0.45, 1, Math.max(b1, mx)),
      ),
    );

    // Right: Three distinct distribution contracts
    const rx = 420;
    nodes.push(
      txt('THREE DISTINCT DISTRIBUTIONS', rx, -215, 26, ROLE.post, 'mono'),
      numCell('q_φ(z | x)  one crop cloud', rx, -110, {
        w: 640,
        h: 66,
        size: 27,
        stroke: ROLE.pixel,
        textColor: ROLE.pixel,
        glow: 8,
      }),
      numCell('q(z) = E_x[q_φ(z|x)]  mixture', rx, 0, {
        w: 640,
        h: 66,
        size: 26,
        stroke: mx > 0.2 ? ROLE.post : '#2b3b60',
        textColor: mx > 0.2 ? ROLE.post : COSMOS.muted,
        glow: mx > 0.2 ? 10 : 0,
      }),
      numCell('p(z) = N(0, I)  generation prior', rx, 110, {
        w: 640,
        h: 66,
        size: 27,
        stroke: b2 > 0.2 ? ROLE.code : '#2b3b60',
        textColor: b2 > 0.2 ? ROLE.code : COSMOS.muted,
        glow: b2 > 0.2 ? 10 : 0,
      }),
      txt(
        b2 > 0.2
          ? 'Keep each q(z|x) distinct so z identifies x, while their mixture q(z) covers N(0, I)!'
          : 'Do not confuse one input’s posterior with the average mixture across the whole dataset',
        0,
        320,
        29,
        b2 > 0.2 ? ROLE.good : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-posterior-contract-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-posterior-contract-1-build', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'vae-posterior-contract-mixture', mxP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-posterior-contract-2-build', b2P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 9. kl-ledger: Compute what prior mismatch charges
// Cues: vae-kl-ledger-0-build, vae-kl-ledger-1-build, vae-kl-ledger-sum, vae-kl-ledger-2-build
// ---------------------------------------------------------------------------
export function klLedger(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const smP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  const kl0 = kl([mu[0]], [lv[0]]); // 0.178293
  const kl1 = kl([mu[1]], [lv[1]]); // 0.022585
  const klTot = kl(mu, lv); // 0.200878
  const klFar = kl([2.0, -1.5], [-1.5, 1.2]); // 4.0466

  s.add(cinemaGrid({ accent: ROLE.code, seed: 9 }));
  s.add(decorAura(0, 15, 560, '#ffd1661a', '#a78bfa14'));

  const headline = heroTitle(['Diagonal Gaussian KL:', 'Closed-Form Prior Charge'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.code,
    eyebrow: 'D_KL(q || N(0,I)) = 0 ONLY WHEN μ = 0 AND σ = 1',
  });

  const live = dynamic(() => {
    const b1 = b1P.value;
    const sm = smP.value;
    const b2 = b2P.value;

    return group(
      glowTex(
        'D_{\\mathrm{KL}}\\big(q \\| \\mathcal{N}(0,I)\\big) = \\frac{1}{2}\\sum_j \\big(\\mu_j^2 + e^{\\log\\sigma_j^2} - 1 - \\log\\sigma_j^2\\big)',
        { x: 0, y: -205, size: 38, color: ROLE.code },
      ),
      // Left: Axis 1 and Axis 2 breakdown
      txt('AXIS 1:  μ₁ = 0.40,  log σ₁² = −0.70', -430, -80, 26, ROLE.pixel, 'mono'),
      numCell(b1 > 0.2 ? `${kl0.toFixed(4)} nats` : '0.5(0.16 + 0.497 − 1 + 0.70)', -430, 0, {
        w: 540,
        h: 66,
        size: 27,
        stroke: ROLE.pixel,
        textColor: ROLE.pixel,
        glow: b1 > 0.2 ? 9 : 0,
      }),
      txt('AXIS 2:  μ₂ = −0.20,  log σ₂² = +0.10', -430, 105, 26, ROLE.post, 'mono'),
      numCell(b1 > 0.2 ? `${kl1.toFixed(4)} nats` : '0.5(0.04 + 1.105 − 1 − 0.10)', -430, 185, {
        w: 540,
        h: 66,
        size: 27,
        stroke: ROLE.post,
        textColor: ROLE.post,
        glow: b1 > 0.2 ? 9 : 0,
      }),

      // Right: Total sum & comparison (Prior 0 vs Small 0.2009 vs Far 4.0466)
      txt('SUMMED KL CHARGE', 420, -80, 26, ROLE.code, 'mono'),
      numCell(sm > 0.2 ? `${klTot.toFixed(4)} nats` : 'Axis 1 + Axis 2 = ?', 420, 0, {
        w: 420,
        h: 74,
        size: 34,
        stroke: sm > 0.2 ? ROLE.code : '#2b3b60',
        textColor: sm > 0.2 ? ROLE.code : COSMOS.dim,
        glow: sm > 0.2 ? 12 : 0,
      }),
      txt('Prior N(0,I): 0.0000 nats', 420, 105, 26, ROLE.good, 'mono').opacity(mix(0.45, 1, b2)),
      txt(`Far cloud:   ${klFar.toFixed(4)} nats`, 420, 165, 26, ROLE.warn, 'mono').opacity(
        mix(0.45, 1, b2),
      ),

      txt(
        b2 > 0.2
          ? 'Drifting far from N(0,I) or crushing variance spikes KL sharply (4.05 nats vs 0.20 nats)'
          : 'Diagonal Gaussians evaluate KL in exact closed form, no Monte Carlo sampling needed',
        0,
        320,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-kl-ledger-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-kl-ledger-1-build', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'vae-kl-ledger-sum', smP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-kl-ledger-2-build', b2P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 10. sampling: Freeze the noise and move the sample
// Cues: noise-scale, noise-shift, encoder-mean-b2-1, encoder-scale-b2-2,
//       prior-sample-point-b3-1, prior-decoded-output-b3-2
// ---------------------------------------------------------------------------
export function sampling(s, c) {
  const nsP = s.value(0);
  const shP = s.value(0);
  const emP = s.value(0);
  const esP = s.value(0);
  const prP = s.value(0);
  const pdP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 10 }));
  s.add(decorAura(-280, 10, 480, '#6ee7b71c', '#ffd16614'));

  const headline = heroTitle(['Reparameterization Trick:', 'Freeze ε, Differentiate z'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'ε ~ N(0, I)  ·  z = μ + σ ⊙ ε',
  });

  const live = dynamic(() => {
    const ns = nsP.value;
    const sh = shP.value;
    const em = emP.value;
    const es = esP.value;
    const pr = prP.value;
    const pd = pdP.value;

    const isGen = pr > 0.3;
    const curMu = isGen ? [0, 0] : [mu[0] * sh + 0.7 * em, mu[1] * sh];
    const curSig = isGen
      ? [1, 1]
      : [mix(1, sig[0], ns) + 0.55 * es, mix(1, sig[1], ns) + 0.35 * es];
    const curZ = isGen ? priorDraw : [curMu[0] + curSig[0] * eps[0], curMu[1] + curSig[1] * eps[1]];

    // Left: 2D plane [-2.2, 2.2]^2 showing frozen eps dot and moving z dot
    const cx = -420;
    const cy = 20;
    const sc = 96;
    const px = (v) => cx + v * sc;
    const py = (v) => cy - v * sc;

    const nodes = [
      txt(
        isGen ? 'GENERATION: z ~ N(0, I)' : 'TRAINING: z = μ + σ ⊙ ε',
        cx,
        -220,
        26,
        ROLE.good,
        'mono',
      ),
      rule(cx - 230, cy, cx + 230, cy, '#2a3759', 2),
      rule(cx, cy - 200, cx, cy + 200, '#2a3759', 2),
      circle(sc, { fill: '#ffd1660c', stroke: ROLE.code, width: 2.2, dash: [6, 5] }).at(cx, cy),
      // Frozen eps dot
      glowDot(px(eps[0]), py(eps[1]), {
        radius: 11,
        color: ROLE.pixel,
        glow: 8,
        opacity: isGen ? 0.3 : 1,
      }),
      txt(
        isGen ? 'z_prior = [0.5, 0.5]' : 'ε = [0.5, −1.0]  →  z = μ + σ ⊙ ε',
        cx,
        cy + 235,
        26,
        isGen ? ROLE.code : ROLE.pixel,
        'mono',
      ),
      // Live sample z dot
      glowDot(px(curZ[0]), py(curZ[1]), {
        radius: 14,
        color: isGen ? ROLE.code : ROLE.good,
        glow: 14,
      }),
    ];

    // Right: Parameter readout OR generation decoded 5x5 patch
    const rx = 400;
    if (!isGen) {
      nodes.push(
        txt('FIXED NOISE  ε = [0.50, −1.00]', rx, -210, 26, ROLE.pixel, 'mono'),
        numCell(`μ = [${curMu[0].toFixed(2)}, ${curMu[1].toFixed(2)}]`, rx, -110, {
          w: 440,
          h: 66,
          size: 28,
          stroke: em > 0.2 ? ROLE.good : ROLE.post,
          textColor: em > 0.2 ? ROLE.good : ROLE.post,
        }),
        numCell(`σ = [${curSig[0].toFixed(3)}, ${curSig[1].toFixed(3)}]`, rx, -10, {
          w: 440,
          h: 66,
          size: 28,
          stroke: es > 0.2 ? ROLE.good : ROLE.pixel,
          textColor: es > 0.2 ? ROLE.good : ROLE.pixel,
        }),
        numCell(`z = [${curZ[0].toFixed(3)}, ${curZ[1].toFixed(3)}]`, rx, 95, {
          w: 440,
          h: 72,
          size: 32,
          stroke: ROLE.good,
          textColor: ROLE.good,
          glow: 11,
        }),
      );
    } else {
      nodes.push(
        txt('DECODED FROM PRIOR DRAW', rx, -210, 26, ROLE.code, 'mono'),
        pixelPatch5x5(decode(priorDraw), rx, 10, {
          cell: 54,
          gap: 6,
          opacity: mix(0.45, 1, pd),
        }),
        txt(
          pd > 0.2 ? 'No encoder needed at generation time!' : 'Feeding z_prior to decoder g(z)...',
          rx,
          220,
          26,
          ROLE.code,
          'mono',
        ),
      );
    }

    nodes.push(
      txt(
        isGen
          ? 'At generation time, drop the encoder: draw z ~ N(0, I) and decode a fresh crop directly!'
          : 'Moving μ or σ moves z smoothly while ε stays frozen, so ∂z/∂μ = 1 and ∂z/∂logσ² = ½σ·ε',
        0,
        335,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'noise-scale', nsP, 1, { dur: 0.75 });
  cueTo(s, c, 'noise-shift', shP, 1, { dur: 0.75 });
  cueTo(s, c, 'encoder-mean-b2-1', emP, 1, { dur: 0.8 });
  cueTo(s, c, 'encoder-scale-b2-2', esP, 1, { dur: 0.8 });
  cueTo(s, c, 'prior-sample-point-b3-1', prP, 1, { dur: 0.75 });
  cueTo(s, c, 'prior-decoded-output-b3-2', pdP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 11. gradient-path: Keep the reconstruction gradient attached to the encoder
// Cues: vae-gradient-path-0-build, vae-gradient-path-1-build,
//       vae-gradient-path-2-build, vae-gradient-path-decoder
// ---------------------------------------------------------------------------
export function gradientPath(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);
  const dcP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 11 }));
  s.add(decorAura(0, 10, 560, '#ff6b8b1a', '#6ee7b714'));

  const headline = heroTitle(['Normal.sample() vs', 'Normal.rsample() Routing'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'RECONSTRUCTION GRADIENT TO ENCODER  ·  ANALYTIC KL ALWAYS ATTACHED',
  });

  const live = dynamic(() => {
    const b1 = b1P.value;
    const b2 = b2P.value;
    const dc = dcP.value;

    const row = (y, label, broken, color, op) =>
      group(
        txt(label, -790, y - 56, 26, color, 'mono', 'left'),
        numCell('Encoder (μ, σ)', -610, y + 10, {
          w: 290,
          h: 64,
          size: 26,
          stroke: ROLE.post,
          textColor: ROLE.post,
        }),
        line([-460, y + 10], [-255, y + 10], {
          stroke: broken ? ROLE.warn : ROLE.good,
          width: 4,
          dash: broken ? [10, 8] : undefined,
        }),
        glowBadge(
          broken ? 'DETACHED ✕' : 'rsample ✓',
          -120,
          y + 10,
          broken ? ROLE.warn : ROLE.good,
          {
            w: 250,
            h: 60,
            size: 26,
          },
        ),
        line([10, y + 10], [210, y + 10], { stroke: ROLE.pixel, width: 4 }),
        numCell('Decoder g(z)', 355, y + 10, {
          w: 275,
          h: 64,
          size: 26,
          stroke: ROLE.pixel,
          textColor: ROLE.pixel,
        }),
        line([498, y + 10], [600, y + 10], { stroke: ROLE.code, width: 3.5 }),
        numCell('L_recon', 710, y + 10, {
          w: 205,
          h: 64,
          size: 26,
          stroke: ROLE.code,
          textColor: ROLE.code,
        }),
      ).opacity(op);

    return group(
      row(-115, 'ORDINARY Normal.sample()  (requires_grad = False)', true, ROLE.warn, 1),
      row(
        95,
        'PATHWISE Normal.rsample()  (requires_grad = True)',
        false,
        ROLE.good,
        mix(0.45, 1, b1),
      ),
      txt(
        dc > 0.2
          ? 'Note: Decoder AND analytic KL still get gradients under sample(); ONLY encoder recon breaks!'
          : b2 > 0.2
            ? 'rsample() routes ∂L_recon/∂z straight back to μ (slope 1) and log σ² (slope ½σ·ε)'
            : 'Ordinary sampling snaps the autograd tape right at z',
        0,
        300,
        29,
        dc > 0.2 ? ROLE.code : COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-gradient-path-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-gradient-path-1-build', b1P, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-gradient-path-2-build', b2P, 1, { dur: 0.7 });
  cueTo(s, c, 'vae-gradient-path-decoder', dcP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 12. objective: Give both jobs a place in the loss
// Cues: kl-mismatch, beta-weight, reduction-sum, likelihood-rule, elbo-identity
// ---------------------------------------------------------------------------
export function objective(s, c) {
  const klP = s.value(0);
  const btP = s.value(0);
  const rdP = s.value(0);
  const lkP = s.value(0);
  const elP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.code, seed: 12 }));
  s.add(decorAura(0, 10, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['The VAE Objective:', 'Reconstruction + β · KL'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.code,
    eyebrow: 'MINIMIZE NEGATIVE ELBO  ·  RECALIBRATE β ON SUM VS MEAN',
  });

  const live = dynamic(() => {
    const k = klP.value;
    const bt = btP.value;
    const rd = rdP.value;
    const lk = lkP.value;
    const el = elP.value;

    return group(
      glowTex(
        'L_{\\mathrm{VAE}} = L_{\\mathrm{recon}} + \\beta \\, D_{\\mathrm{KL}}(q_\\phi(z|x) \\| p(z))',
        {
          x: 0,
          y: -185,
          size: 44,
          color: ROLE.code,
        },
      ),
      // Two opposing forces
      numCell('L_recon: sharp crops', -440, -25, {
        w: 440,
        h: 72,
        size: 28,
        stroke: ROLE.pixel,
        textColor: ROLE.pixel,
        glow: 9,
      }),
      numCell(bt > 0.2 ? 'β · D_KL: prior pull' : 'D_KL: prior pull', 440, -25, {
        w: 440,
        h: 72,
        size: 28,
        stroke: ROLE.post,
        textColor: ROLE.post,
        glow: k > 0.2 ? 10 : 4,
      }),
      glowBadge(rd > 0.2 ? 'SUM vs MEAN shifts β by N!' : 'Match N-pixel scale', 0, 90, ROLE.warn, {
        w: 560,
        h: 60,
        size: 26,
        opacity: mix(0.45, 1, Math.max(rd, lk)),
      }),
      glowTex(
        el > 0.2
          ? '\\log p_\\theta(x) = \\mathcal{L}_{\\mathrm{ELBO}} + D_{\\mathrm{KL}}(q_\\phi(z|x) \\| p_\\theta(z|x))'
          : '\\mathcal{L}_{\\mathrm{ELBO}} = \\mathbb{E}_q[\\log p_\\theta(x|z)] - D_{\\mathrm{KL}}(q \\| p)',
        { x: 0, y: 215, size: 38, color: el > 0.2 ? ROLE.good : COSMOS.muted },
      ).opacity(mix(0.45, 1, Math.max(lk, el))),
      txt(
        el > 0.2
          ? 'Maximizing ELBO jointly raises data likelihood log p(x) and tightens the posterior gap!'
          : 'Switching MSE from sum to mean divides recon by N pixels, multiplying effective β by N',
        0,
        330,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'kl-mismatch', klP, 1, { dur: 0.7 });
  cueTo(s, c, 'beta-weight', btP, 1, { dur: 0.7 });
  cueTo(s, c, 'reduction-sum', rdP, 1, { dur: 0.7 });
  cueTo(s, c, 'likelihood-rule', lkP, 1, { dur: 0.7 });
  cueTo(s, c, 'elbo-identity', elP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 13. evidence-gap: Which gap can the encoder close?
// Cues: observe-pixel, pixel-variance, pin-evidence, prior-match,
//       place-bound, posterior-target, tighten-bound, gap-result*
// ---------------------------------------------------------------------------
export function evidenceGap(s, c) {
  const obP = s.value(0);
  const pvP = s.value(0);
  const pinP = s.value(0);
  const prmP = s.value(0);
  const plP = s.value(0);
  const ptP = s.value(0);
  const tgP = s.value(0);
  const gpP = s.value(0);
  const drift = s.value(0);

  const st0 = gaussianEvidenceState(0); // logEvidence=-1.288, elbo=-1.464, gap=0.176
  const st1 = gaussianEvidenceState(1); // logEvidence=-1.288, elbo=-1.288, gap=0.000

  s.add(cinemaGrid({ accent: ROLE.good, seed: 13 }));
  s.add(decorAura(0, 10, 560, '#6ee7b71c', '#a78bfa14'));

  const headline = heroTitle(['Closing the Evidence Gap', 'KL(q_φ(z|x) || p_θ(z|x))'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FIXED DECODER log p_θ(x) = −1.288  ·  ENCODER CLIMBS ELBO TO CEILING',
  });

  const live = dynamic(() => {
    const tg = tgP.value;
    const gp = gpP.value;
    const cur = gaussianEvidenceState(tg);

    // Left: Vertical log-scale ruler from -1.60 to -1.15
    const gx0 = -640;
    const gx1 = -120;
    const yBot = 200;
    const yTop = -170;
    const yOf = (v) => mix(yBot, yTop, (v - -1.6) / 0.45);
    const yEv = yOf(cur.logEvidence);
    const yEl = yOf(cur.elbo);

    const nodes = [
      txt('EVIDENCE CEILING vs ELBO', (gx0 + gx1) / 2, -215, 26, ROLE.good, 'mono'),
      rule(gx0, yEv, gx1, yEv, ROLE.code, 3.6),
      txt(
        `log p_θ(x) = ${st0.logEvidence.toFixed(3)}`,
        gx1 + 18,
        yEv,
        26,
        ROLE.code,
        'mono',
        'left',
      ),
      // Shaded vertical gap bar between ELBO and Evidence
      rect(160, Math.max(4, yEl - yEv), {
        fill: '#ff6b8b38',
        stroke: ROLE.warn,
        width: 2.4,
        radius: 6,
      }).at((gx0 + gx1) / 2, (yEv + yEl) / 2),
      rule(gx0, yEl, gx1, yEl, ROLE.good, 4.2),
      txt('ELBO', gx0 - 18, yEl, 26, ROLE.good, 'mono', 'right'),
    ];

    // Right: Exact state numbers + withheld gap-result*
    const rx = 430;
    nodes.push(
      txt('ENCODER UPDATE (FIXED θ)', rx, -215, 26, ROLE.post, 'mono'),
      numCell(tg > 0.5 ? 'q → exact p_θ(z|x)' : 'q = prior N(0, 1)', rx, -110, {
        w: 440,
        h: 66,
        size: 27,
        stroke: tg > 0.5 ? ROLE.good : ROLE.post,
        textColor: tg > 0.5 ? ROLE.good : ROLE.post,
        glow: 9,
      }),
      numCell(`Start gap: ${st0.gap.toFixed(3)} nats`, rx, -10, {
        w: 440,
        h: 64,
        size: 27,
        stroke: ROLE.warn,
        textColor: ROLE.warn,
      }),
      numCell(gp > 0.2 ? `Final gap: ${st1.gap.toFixed(3)} (exact!)` : 'Final gap = ?', rx, 90, {
        w: 440,
        h: 68,
        size: 28,
        stroke: gp > 0.2 ? ROLE.good : '#2b3b60',
        textColor: gp > 0.2 ? ROLE.good : COSMOS.dim,
        glow: gp > 0.2 ? 12 : 0,
      }),
      txt(
        gp > 0.2
          ? 'Exact posterior closes KL(q || p_θ(z|x)) to 0, exactly like the E-step in EM!'
          : 'With decoder parameters θ frozen, how tight can the encoder pull the ELBO?',
        0,
        320,
        29,
        gp > 0.2 ? ROLE.good : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'observe-pixel', obP, 1, { dur: 0.65 });
  cueTo(s, c, 'pixel-variance', pvP, 1, { dur: 0.65 });
  cueTo(s, c, 'pin-evidence', pinP, 1, { dur: 0.65 });
  cueTo(s, c, 'prior-match', prmP, 1, { dur: 0.65 });
  cueTo(s, c, 'place-bound', plP, 1, { dur: 0.65 });
  cueTo(s, c, 'posterior-target', ptP, 1, { dur: 0.7 });
  cueTo(s, c, 'tighten-bound', tgP, 1, { dur: 1.1 });
  cueTo(s, c, 'gap-result', gpP, 1, { dur: 0.7, after: true });
}
